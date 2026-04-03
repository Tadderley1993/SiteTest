import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { prisma } from '../lib/prisma.js'
import { clientAuthMiddleware, ClientRequest } from '../middleware/clientAuth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { createNotification } from '../lib/notify.js'
import { getStripeSettings, getStripeClient } from '../lib/stripe.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, '../../uploads')

const router = Router()
router.use(clientAuthMiddleware)

// ── Payment schedule helpers ──────────────────────────────────────
interface CustomSchedule {
  upfrontType: 'percent' | 'amount'
  upfront: number
  installments: number
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly'
}

const FREQ_DAYS: Record<CustomSchedule['frequency'], number> = {
  weekly: 7, biweekly: 14, monthly: 30, yearly: 365,
}
const FREQ_LABEL: Record<CustomSchedule['frequency'], string> = {
  weekly: 'weekly', biweekly: 'bi-weekly', monthly: 'monthly', yearly: 'annual',
}

async function getCustomSchedule(clientId: number): Promise<CustomSchedule | null> {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "paymentTerms" FROM "AdminCustomPackage" WHERE "clientId" = $1 AND enabled = true`,
    clientId,
  ) as Array<{ paymentTerms: string | null }>
  if (!rows.length || !rows[0].paymentTerms) return null
  try {
    const p = JSON.parse(rows[0].paymentTerms) as Record<string, unknown>
    if (p && typeof p.upfront === 'number' && typeof p.installments === 'number') {
      return p as unknown as CustomSchedule
    }
    return null
  } catch { return null }
}

function buildSplitInvoices(
  pkgTotal: number,
  schedule: CustomSchedule | null,
  stripePaymentIntentId: string | null,
  addDays: (d: Date, n: number) => Date,
  today: Date,
) {
  const upfront = schedule
    ? schedule.upfrontType === 'percent'
      ? Math.round(pkgTotal * (schedule.upfront / 100) * 100) / 100
      : schedule.upfront
    : Math.round(pkgTotal * 0.30 * 100) / 100
  const instCount = schedule ? schedule.installments : 3
  const freqDays = schedule ? FREQ_DAYS[schedule.frequency] : 30
  const freqLabel = schedule ? FREQ_LABEL[schedule.frequency] : 'monthly'
  const remaining = pkgTotal - upfront
  const instAmt = Math.round((remaining / instCount) * 100) / 100
  const lastAmt = Math.round((remaining - instAmt * (instCount - 1)) * 100) / 100
  const total = instCount + 1

  const upfrontLabel = schedule
    ? schedule.upfrontType === 'percent' ? `${schedule.upfront}% Deposit` : `Deposit`
    : '30% Deposit'

  return [
    {
      title: `Project Payment — Installment 1 of ${total} (${upfrontLabel})`,
      amount: upfront,
      due: today,
      paidNow: !!stripePaymentIntentId,
      stripeId: stripePaymentIntentId,
    },
    ...Array.from({ length: instCount }, (_, i) => ({
      title: `Project Payment — Installment ${i + 2} of ${total} (${freqLabel})`,
      amount: i === instCount - 1 ? lastAmt : instAmt,
      due: addDays(today, (i + 1) * freqDays),
      paidNow: false,
      stripeId: null as string | null,
    })),
  ]
}

// GET /api/portal/me — client profile + project info
router.get('/me', asyncHandler(async (req: ClientRequest, res) => {
  const client = await prisma.client.findUnique({
    where: { id: req.clientId! },
    include: {
      projectScope: true,
      standing: true,
      tasks: { orderBy: { order: 'asc' } },
      submission: true,
    },
  })
  if (!client) return res.status(404).json({ error: 'Client not found' })

  // Fetch journeyPhase via raw SQL (bypasses stale Prisma client)
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "journeyPhase" FROM "Client" WHERE id = $1`, req.clientId!
  ) as Array<{ journeyPhase: string | null }>
  const journeyPhase = rows[0]?.journeyPhase ?? 'discovery'

  // Parse submission services (stored as JSON string)
  let submissionServices: string[] = []
  if (client.submission?.services) {
    try { submissionServices = JSON.parse(client.submission.services) } catch { /* ignore */ }
  }

  // Fetch upfrontDiscountPct via raw SQL
  const discountRows = await prisma.$queryRawUnsafe(
    `SELECT "upfrontDiscountPct" FROM "Client" WHERE id = $1`, req.clientId!
  ) as Array<{ upfrontDiscountPct: number | null }>
  const upfrontDiscountPct = discountRows[0]?.upfrontDiscountPct ?? 0

  const { passwordHash: _, submission: __, ...safe } = client
  res.json({ ...safe, journeyPhase, submissionServices, upfrontDiscountPct })
}))

// GET /api/portal/invoices — only show sent/paid/cancelled (never drafts)
router.get('/invoices', asyncHandler(async (req: ClientRequest, res) => {
  const invoices = await prisma.invoice.findMany({
    where: {
      clientId: req.clientId!,
      status: { in: ['sent', 'paid', 'cancelled'] },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(invoices)
}))

// GET /api/portal/proposals — only show sent/accepted/rejected (not drafts)
router.get('/proposals', asyncHandler(async (req: ClientRequest, res) => {
  const proposals = await prisma.proposal.findMany({
    where: {
      clientId: req.clientId!,
      status: { in: ['sent', 'accepted', 'rejected', 'signed'] },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(proposals)
}))

// GET /api/portal/files
router.get('/files', asyncHandler(async (req: ClientRequest, res) => {
  const files = await prisma.clientDocument.findMany({
    where: { clientId: req.clientId! },
    orderBy: { createdAt: 'desc' },
  })
  res.json(files)
}))

// GET /api/portal/files/:docId/download — client-authenticated file download
router.get('/files/:docId/download', asyncHandler(async (req: ClientRequest, res) => {
  const doc = await prisma.clientDocument.findUnique({
    where: { id: parseInt(req.params.docId) },
  })
  if (!doc) return res.status(404).json({ error: 'File not found' })
  // Ensure the file belongs to the authenticated client
  if (doc.clientId !== req.clientId!) return res.status(403).json({ error: 'Access denied' })
  const filePath = path.join(uploadsDir, doc.storedName)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not on disk' })
  res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`)
  res.setHeader('Content-Type', doc.mimeType)
  fs.createReadStream(filePath).pipe(res)
}))

// GET /api/portal/messages — client's full thread
router.get('/messages', asyncHandler(async (req: ClientRequest, res) => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, "clientId", "fromAdmin", body, read, "createdAt"
     FROM "Message" WHERE "clientId" = $1 ORDER BY "createdAt" ASC`,
    req.clientId!,
  )
  // Mark admin messages as read by client
  await prisma.$executeRawUnsafe(
    `UPDATE "Message" SET read = true WHERE "clientId" = $1 AND "fromAdmin" = true AND read = false`,
    req.clientId!,
  )
  res.json(rows)
}))

// POST /api/portal/messages — client sends a message to admin
router.post('/messages', asyncHandler(async (req: ClientRequest, res) => {
  const { body } = req.body as { body: string }
  if (!body?.trim()) return res.status(400).json({ error: 'Message body required' })

  const rows = await prisma.$queryRawUnsafe(
    `INSERT INTO "Message" ("clientId", "fromAdmin", body, read, "createdAt")
     VALUES ($1, false, $2, false, NOW()) RETURNING id, "clientId", "fromAdmin", body, read, "createdAt"`,
    req.clientId!, body.trim(),
  ) as Array<{ clientId: number }>

  // Look up client name for notification
  const clients = await prisma.$queryRawUnsafe(
    `SELECT "firstName", "lastName" FROM "Client" WHERE id = $1`, req.clientId!,
  ) as Array<{ firstName: string; lastName: string }>
  const clientName = clients[0] ? `${clients[0].firstName} ${clients[0].lastName}` : `Client #${req.clientId}`

  await createNotification(
    'message',
    'New message from client',
    `${clientName} sent you a message`,
  )

  res.json((rows as unknown[])[0])
}))

// GET /api/portal/questionnaire
router.get('/questionnaire', asyncHandler(async (req: ClientRequest, res) => {
  const q = await prisma.discoveryQuestionnaire.findUnique({
    where: { clientId: req.clientId! },
  })
  res.json(q ?? null)
}))

// PUT /api/portal/questionnaire
router.put('/questionnaire', asyncHandler(async (req: ClientRequest, res) => {
  const {
    section1, section2, section3, section4, section5, section6, section7,
    section8, section9, section10, section11, section12, section13, submit,
  } = req.body as Record<string, string | boolean | undefined>

  const data: Record<string, unknown> = {
    section1, section2, section3, section4, section5, section6, section7,
    section8, section9, section10, section11, section12, section13,
  }

  if (submit) {
    data.status = 'submitted'
    data.submittedAt = new Date()
  } else {
    data.status = 'in_progress'
  }

  const q = await prisma.discoveryQuestionnaire.upsert({
    where: { clientId: req.clientId! },
    update: data,
    create: { clientId: req.clientId!, ...data, status: (data.status as string) ?? 'in_progress' },
  })
  res.json(q)
}))

// POST /api/portal/checkout — create invoices for chosen payment plan
router.post('/checkout', asyncHandler(async (req: ClientRequest, res) => {
  const clientId = req.clientId!
  const { planType } = req.body as { planType: 'full' | 'split' }
  if (planType !== 'full' && planType !== 'split') {
    return res.status(400).json({ error: 'planType must be "full" or "split"' })
  }

  // Get package selection
  const pkgRows = await prisma.$queryRawUnsafe(
    `SELECT total, "lineItems" FROM "PackageSelection" WHERE "clientId" = $1`, clientId,
  ) as Array<{ total: number; lineItems: string }>
  if (!pkgRows[0]) return res.status(400).json({ error: 'No package selected. Complete Step 3 first.' })

  const pkgTotal = Number(pkgRows[0].total)

  // Get client info + discount
  const clientRows = await prisma.$queryRawUnsafe(
    `SELECT "firstName","lastName",email,"upfrontDiscountPct" FROM "Client" WHERE id = $1`, clientId,
  ) as Array<{ firstName: string; lastName: string; email: string; upfrontDiscountPct: number | null }>
  const client = clientRows[0]
  if (!client) return res.status(404).json({ error: 'Client not found' })

  const discountPct = Number(client.upfrontDiscountPct ?? 0)
  const clientName = `${client.firstName} ${client.lastName}`

  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000)
  const today = new Date()

  // Invoice number helper
  const nextInvNum = async () => {
    const count = await prisma.invoice.count()
    return `INV-${today.getFullYear()}-${String(count + 1).padStart(4, '0')}`
  }

  const LATE_FEE_TERMS = `Payment is due on the date shown. A $150 late fee applies if payment is more than 3 days past due. Work will not begin until the first payment is received. No deliverables will be released until the project is paid in full.`

  const createdIds: number[] = []

  if (planType === 'full') {
    const discountAmt = Math.round(pkgTotal * (discountPct / 100) * 100) / 100
    const finalAmount = Math.round((pkgTotal - discountAmt) * 100) / 100
    const invoiceNumber = await nextInvNum()
    const rows = await prisma.$queryRawUnsafe(`
      INSERT INTO "Invoice" (
        "clientId","invoiceNumber","title","lineItems","currency",
        "subtotal","discountType","discountValue","taxRate","amount",
        "issuedDate","dueDate","notes","termsConditions","status",
        "createdAt","updatedAt"
      ) VALUES ($1,$2,$3,$4,'USD',$5,'percent',$6,0,$7,$8,$9,null,$10,'sent',NOW(),NOW())
      RETURNING id
    `,
      clientId, invoiceNumber,
      `Project Payment — Paid in Full`,
      pkgRows[0].lineItems,
      pkgTotal, discountPct, finalAmount,
      fmt(today), fmt(addDays(today, 7)),
      LATE_FEE_TERMS,
    ) as Array<{ id: number }>
    createdIds.push(rows[0].id)
  } else {
    const schedule = await getCustomSchedule(clientId)
    const splitInvoices = buildSplitInvoices(pkgTotal, schedule, null, addDays, today)
    for (const inv of splitInvoices) {
      const invoiceNumber = await nextInvNum()
      const rows = await prisma.$queryRawUnsafe(`
        INSERT INTO "Invoice" (
          "clientId","invoiceNumber","title","lineItems","currency",
          "subtotal","discountType","discountValue","taxRate","amount",
          "issuedDate","dueDate","notes","termsConditions","status",
          "createdAt","updatedAt"
        ) VALUES ($1,$2,$3,null,'USD',$4,'fixed',0,0,$4,$5,$6,null,$7,'sent',NOW(),NOW())
        RETURNING id
      `,
        clientId, invoiceNumber, inv.title,
        inv.amount, fmt(today), fmt(inv.due), LATE_FEE_TERMS,
      ) as Array<{ id: number }>
      createdIds.push(rows[0].id)
    }
  }

  // Attempt auto Stripe payment links (silent fail if Stripe not configured)
  try {
    const creds = await getStripeSettings()
    if (creds) {
      const stripe = getStripeClient(creds.secretKey)
      const customers = await stripe.customers.list({ email: client.email, limit: 1 })
      const customer = customers.data[0] ?? await stripe.customers.create({
        email: client.email,
        name: clientName,
      })

      for (const invId of createdIds) {
        const invRows = await prisma.$queryRawUnsafe(
          `SELECT "invoiceNumber", title, amount FROM "Invoice" WHERE id = $1`, invId,
        ) as Array<{ invoiceNumber: string; title: string | null; amount: number }>
        const inv = invRows[0]
        if (!inv) continue

        await stripe.invoiceItems.create({
          customer: customer.id,
          unit_amount: Math.round(inv.amount * 100),
          quantity: 1,
          currency: 'usd',
          description: inv.title ?? `Invoice ${inv.invoiceNumber}`,
        })
        const stripeInv = await stripe.invoices.create({
          customer: customer.id,
          collection_method: 'send_invoice',
          days_until_due: 7,
        })
        const finalized = await stripe.invoices.finalizeInvoice(stripeInv.id)
        await stripe.invoices.sendInvoice(finalized.id)
        const url = finalized.hosted_invoice_url ?? null
        await prisma.$executeRawUnsafe(
          `UPDATE "Invoice" SET "stripeInvoiceId"=$1,"stripeInvoiceUrl"=$2,"stripeStatus"='open',"sentAt"=NOW(),"updatedAt"=NOW() WHERE id=$3`,
          finalized.id, url, invId,
        )
      }
    }
  } catch { /* Stripe not configured or failed — invoices still created */ }

  // Mark step4Checkout complete + advance journey phase + set completedAt
  await prisma.$executeRawUnsafe(
    `UPDATE "ClientOnboarding" SET "step4Checkout"=true,"completedAt"=NOW(),"updatedAt"=NOW() WHERE "clientId"=$1`,
    clientId,
  )
  await prisma.$executeRawUnsafe(
    `UPDATE "Client" SET "journeyPhase"='planning',"updatedAt"=NOW() WHERE id=$1`,
    clientId,
  )

  await createNotification(
    'success',
    'Checkout complete',
    `${clientName} completed checkout with the ${planType === 'full' ? 'pay-in-full' : 'split payment'} plan`,
  )

  // Return updated onboarding row
  const onboarding = await prisma.$queryRawUnsafe(
    `SELECT * FROM "ClientOnboarding" WHERE "clientId" = $1`, clientId,
  ) as Array<Record<string, unknown>>
  res.json({ success: true, planType, invoiceIds: createdIds, onboarding: onboarding[0] })
}))

// POST /api/portal/checkout/session — create Stripe Checkout Session for in-portal payment
router.post('/checkout/session', asyncHandler(async (req: ClientRequest, res) => {
  const clientId = req.clientId!
  const { planType } = req.body as { planType: 'full' | 'split' }
  if (planType !== 'full' && planType !== 'split') {
    return res.status(400).json({ error: 'Invalid planType' })
  }

  const pkgRows = await prisma.$queryRawUnsafe(
    `SELECT total FROM "PackageSelection" WHERE "clientId" = $1`, clientId,
  ) as Array<{ total: number }>
  if (!pkgRows[0]) return res.status(400).json({ error: 'No package selected' })

  const clientRows = await prisma.$queryRawUnsafe(
    `SELECT "firstName","lastName",email,"upfrontDiscountPct" FROM "Client" WHERE id = $1`, clientId,
  ) as Array<{ firstName: string; lastName: string; email: string; upfrontDiscountPct: number | null }>
  const client = clientRows[0]
  if (!client) return res.status(404).json({ error: 'Client not found' })

  const creds = await getStripeSettings()
  if (!creds) return res.status(503).json({ error: 'stripe_not_configured' })

  const stripe = getStripeClient(creds.secretKey)
  const pkgTotal = Number(pkgRows[0].total)
  const discountPct = Number(client.upfrontDiscountPct ?? 0)

  let chargeAmount: number
  let description: string
  if (planType === 'full') {
    const discountAmt = Math.round(pkgTotal * (discountPct / 100) * 100) / 100
    chargeAmount = Math.round((pkgTotal - discountAmt) * 100) / 100
    description = 'Project Payment — Paid in Full'
  } else {
    const schedule = await getCustomSchedule(clientId)
    if (schedule) {
      chargeAmount = schedule.upfrontType === 'percent'
        ? Math.round(pkgTotal * (schedule.upfront / 100) * 100) / 100
        : schedule.upfront
      const pct = schedule.upfrontType === 'percent' ? `${schedule.upfront}%` : `$${chargeAmount.toLocaleString()}`
      description = `Project Payment — ${pct} Deposit`
    } else {
      chargeAmount = Math.round(pkgTotal * 0.30 * 100) / 100
      description = 'Project Payment — 30% Deposit'
    }
  }

  const origin = (req.headers.origin as string | undefined) ?? 'https://designsbyta.com'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: client.email,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: description, description: `${client.firstName} ${client.lastName}` },
        unit_amount: Math.round(chargeAmount * 100),
      },
      quantity: 1,
    }],
    success_url: `${origin}/portal?payment_success=1&plan=${planType}&sid={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/portal`,
    metadata: { clientId: String(clientId), planType },
  })

  res.json({ url: session.url })
}))

// POST /api/portal/checkout/confirm — verify Stripe payment + create paid invoices + complete step4
router.post('/checkout/confirm', asyncHandler(async (req: ClientRequest, res) => {
  const clientId = req.clientId!
  const { sessionId, planType } = req.body as { sessionId: string; planType: 'full' | 'split' }

  const creds = await getStripeSettings()
  if (!creds) return res.status(503).json({ error: 'stripe_not_configured' })

  const stripe = getStripeClient(creds.secretKey)
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.payment_status !== 'paid') {
    return res.status(400).json({ error: 'Payment not completed' })
  }
  if (session.metadata?.clientId !== String(clientId)) {
    return res.status(403).json({ error: 'Session mismatch' })
  }

  const pkgRows = await prisma.$queryRawUnsafe(
    `SELECT total, "lineItems" FROM "PackageSelection" WHERE "clientId" = $1`, clientId,
  ) as Array<{ total: number; lineItems: string }>
  if (!pkgRows[0]) return res.status(400).json({ error: 'No package found' })

  const clientRows = await prisma.$queryRawUnsafe(
    `SELECT "firstName","lastName",email,"upfrontDiscountPct" FROM "Client" WHERE id = $1`, clientId,
  ) as Array<{ firstName: string; lastName: string; email: string; upfrontDiscountPct: number | null }>
  const client = clientRows[0]
  if (!client) return res.status(404).json({ error: 'Client not found' })

  const pkgTotal = Number(pkgRows[0].total)
  const discountPct = Number(client.upfrontDiscountPct ?? 0)
  const clientName = `${client.firstName} ${client.lastName}`
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000)

  const nextInvNum = async () => {
    const count = await prisma.invoice.count()
    return `INV-${today.getFullYear()}-${String(count + 1).padStart(4, '0')}`
  }

  const stripePaymentIntentId = session.payment_intent as string | null

  if (planType === 'full') {
    const discountAmt = Math.round(pkgTotal * (discountPct / 100) * 100) / 100
    const finalAmount = Math.round((pkgTotal - discountAmt) * 100) / 100
    const invoiceNumber = await nextInvNum()
    await prisma.$queryRawUnsafe(`
      INSERT INTO "Invoice" (
        "clientId","invoiceNumber","title","lineItems","currency",
        "subtotal","discountType","discountValue","taxRate","amount",
        "issuedDate","dueDate","status","stripeInvoiceId","sentAt","paidAt","createdAt","updatedAt"
      ) VALUES ($1,$2,$3,$4,'USD',$5,'percent',$6,0,$7,$8,$8,'paid',$9,NOW(),NOW(),NOW(),NOW())
    `,
      clientId, invoiceNumber, `Project Payment — Paid in Full`,
      pkgRows[0].lineItems, pkgTotal, discountPct, finalAmount,
      fmt(today), stripePaymentIntentId,
    )
  } else {
    const schedule = await getCustomSchedule(clientId)
    const splitInvoices = buildSplitInvoices(pkgTotal, schedule, stripePaymentIntentId, addDays, today)
    for (const inv of splitInvoices) {
      const invoiceNumber = await nextInvNum()
      await prisma.$queryRawUnsafe(`
        INSERT INTO "Invoice" (
          "clientId","invoiceNumber","title","lineItems","currency",
          "subtotal","discountType","discountValue","taxRate","amount",
          "issuedDate","dueDate","status","stripeInvoiceId","sentAt","paidAt","createdAt","updatedAt"
        ) VALUES ($1,$2,$3,null,'USD',$4,'fixed',0,0,$4,$5,$6,$7,$8,NOW(),$9,NOW(),NOW())
      `,
        clientId, invoiceNumber, inv.title,
        inv.amount, fmt(today), fmt(inv.due),
        inv.paidNow ? 'paid' : 'sent',
        inv.stripeId ?? null,
        inv.paidNow ? fmt(today) : null,
      )
    }
  }

  await prisma.$executeRawUnsafe(
    `UPDATE "ClientOnboarding" SET "step4Checkout"=true,"completedAt"=NOW(),"updatedAt"=NOW() WHERE "clientId"=$1`, clientId,
  )
  await prisma.$executeRawUnsafe(
    `UPDATE "Client" SET "journeyPhase"='planning',"updatedAt"=NOW() WHERE id=$1`, clientId,
  )

  await createNotification('success', 'Payment received', `${clientName} paid online (${planType === 'full' ? 'pay-in-full' : '30% deposit'})`)

  const onboarding = await prisma.$queryRawUnsafe(
    `SELECT * FROM "ClientOnboarding" WHERE "clientId" = $1`, clientId,
  ) as Array<Record<string, unknown>>
  res.json({ success: true, planType, onboarding: onboarding[0] })
}))

// GET /api/portal/custom-package — returns admin's custom package if enabled and not expired
router.get('/custom-package', asyncHandler(async (req: ClientRequest, res) => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM "AdminCustomPackage"
     WHERE "clientId" = $1
       AND enabled = true
       AND ("bundleExpiresAt" IS NULL OR "bundleExpiresAt" > NOW())`,
    req.clientId!,
  ) as Array<Record<string, unknown>>
  res.json(rows[0] ?? null)
}))

export { router as clientPortalRouter }

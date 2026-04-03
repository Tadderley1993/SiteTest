import { Router } from 'express'
import { randomBytes } from 'crypto'
import { prisma } from '../lib/prisma.js'
import { clientAuthMiddleware, ClientRequest } from '../middleware/clientAuth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { createNotification } from '../lib/notify.js'

const router = Router()
router.use(clientAuthMiddleware)

const PAYMENT_TERMS = `Payment is due per the selected payment plan. A $150 late fee applies if any invoice is more than 3 days past its due date. Work will not begin until the first payment is received. No deliverables will be released until the project is paid in full.`

const TERMS_AND_CONDITIONS = `1. This proposal is valid for 30 days from the date of issue.\n2. All work is owned by the client upon full payment.\n3. Revisions beyond the agreed scope will be quoted separately.\n4. Designs By Terrence Adderley retains the right to display completed work in its portfolio unless otherwise agreed in writing.\n5. Client is responsible for providing all required content (copy, images, etc.) in a timely manner. Delays caused by missing content may affect the project timeline.`

// GET /api/portal/package — return current selection or null
router.get('/', asyncHandler(async (req: ClientRequest, res) => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM "PackageSelection" WHERE "clientId" = $1`,
    req.clientId!,
  ) as Array<Record<string, unknown>>
  res.json(rows[0] ?? null)
}))

// GET /api/portal/package/proposal — return the auto-generated proposal for signing
router.get('/proposal', asyncHandler(async (req: ClientRequest, res) => {
  const pkgRows = await prisma.$queryRawUnsafe(
    `SELECT "proposalId" FROM "PackageSelection" WHERE "clientId" = $1`,
    req.clientId!,
  ) as Array<{ proposalId: number | null }>
  const proposalId = pkgRows[0]?.proposalId
  if (!proposalId) return res.status(404).json({ error: 'No proposal generated yet' })

  const propRows = await prisma.$queryRawUnsafe(
    `SELECT id, "proposalNumber", title, status, "lineItems", subtotal, total, "discountType",
            "discountValue", "taxRate", "signingToken", "clientSignature", "clientSignedAt", "paymentTerms"
     FROM "Proposal" WHERE id = $1`,
    proposalId,
  ) as Array<Record<string, unknown>>
  res.json(propRows[0] ?? null)
}))

// PUT /api/portal/package/draft — save selection draft without generating proposal
router.put('/draft', asyncHandler(async (req: ClientRequest, res) => {
  const clientId = req.clientId!
  const { tier, lineItems, subtotal, total } = req.body as {
    tier: string
    lineItems: Array<Record<string, unknown>>
    subtotal: number
    total: number
  }
  if (!tier) return res.status(400).json({ error: 'tier is required' })
  const existing = await prisma.$queryRawUnsafe(
    `SELECT id FROM "PackageSelection" WHERE "clientId" = $1`, clientId,
  ) as Array<{ id: number }>
  if (existing[0]) {
    await prisma.$executeRawUnsafe(
      `UPDATE "PackageSelection" SET tier=$1,"lineItems"=$2,subtotal=$3,total=$4,"updatedAt"=NOW() WHERE "clientId"=$5`,
      tier, JSON.stringify(lineItems ?? []), Number(subtotal ?? 0), Number(total ?? 0), clientId,
    )
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PackageSelection" ("clientId",tier,"lineItems",subtotal,total,"createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
      clientId, tier, JSON.stringify(lineItems ?? []), Number(subtotal ?? 0), Number(total ?? 0),
    )
  }
  res.json({ saved: true })
}))

// POST /api/portal/package — save selection + auto-generate proposal + signing token
router.post('/', asyncHandler(async (req: ClientRequest, res) => {
  const clientId = req.clientId!
  const { tier, lineItems, subtotal, total, notes } = req.body as {
    tier: string
    lineItems: Array<{ serviceId: string; label: string; description: string; qty: number; unitPrice: number; amount: number; bonus?: boolean }>
    subtotal: number
    total: number
    notes?: string
  }

  if (!tier || !lineItems?.length) {
    return res.status(400).json({ error: 'tier and lineItems are required' })
  }

  // Upsert PackageSelection
  const existingPkg = await prisma.$queryRawUnsafe(
    `SELECT id, "proposalId" FROM "PackageSelection" WHERE "clientId" = $1`,
    clientId,
  ) as Array<{ id: number; proposalId: number | null }>

  if (existingPkg[0]) {
    await prisma.$executeRawUnsafe(
      `UPDATE "PackageSelection" SET tier=$1,"lineItems"=$2,subtotal=$3,total=$4,notes=$5,"updatedAt"=NOW() WHERE "clientId"=$6`,
      tier, JSON.stringify(lineItems), Number(subtotal), Number(total), notes ?? null, clientId,
    )
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PackageSelection" ("clientId",tier,"lineItems",subtotal,total,notes,"createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())`,
      clientId, tier, JSON.stringify(lineItems), Number(subtotal), Number(total), notes ?? null,
    )
  }

  // Get fresh pkg row
  const pkgRows = await prisma.$queryRawUnsafe(
    `SELECT * FROM "PackageSelection" WHERE "clientId" = $1`, clientId,
  ) as Array<Record<string, unknown>>

  // Look up client info
  const clientRows = await prisma.$queryRawUnsafe(
    `SELECT "firstName","lastName",email,phone,organization FROM "Client" WHERE id = $1`, clientId,
  ) as Array<{ firstName: string; lastName: string; email: string; phone: string | null; organization: string | null }>
  const client = clientRows[0]
  if (!client) return res.status(404).json({ error: 'Client not found' })

  // Build proposal number
  const count = await prisma.proposal.count()
  const year = new Date().getFullYear()
  const proposalNumber = `PROP-${year}-${String(count + 1).padStart(3, '0')}`
  const clientName = `${client.firstName} ${client.lastName}`
  const today = new Date().toISOString().split('T')[0]
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Build proposal line items (exclude bonus items from pricing, list them as $0)
  const proposalLineItems = lineItems.map(item => ({
    description: item.label + (item.description ? ` — ${item.description}` : ''),
    quantity: item.qty ?? 1,
    unitPrice: item.bonus ? 0 : item.unitPrice,
    amount: item.bonus ? 0 : item.amount,
  }))

  const signingToken = randomBytes(32).toString('hex')

  // Check if we need to delete old proposal for this client (re-selection)
  const oldProposalId = existingPkg[0]?.proposalId
  if (oldProposalId) {
    await prisma.$executeRawUnsafe(`DELETE FROM "Proposal" WHERE id = $1`, oldProposalId)
  }

  // Create the proposal
  const proposalRows = await prisma.$queryRawUnsafe(`
    INSERT INTO "Proposal" (
      "proposalNumber", title, status, "clientName", "clientEmail", "clientPhone",
      "clientCompany", "clientId", date, "validUntil",
      "executiveSummary", "proposedSolution", "deliverables",
      "lineItems", subtotal, "discountType", "discountValue", "taxRate", total,
      currency, "paymentTerms", "termsConditions", "signingToken",
      "createdAt", "updatedAt"
    ) VALUES (
      $1,$2,'sent',$3,$4,$5,
      $6,$7,$8,$9,
      $10,$11,$12,
      $13,$14,'fixed',0,0,$15,
      'USD',$16,$17,$18,
      NOW(),NOW()
    ) RETURNING id
  `,
    proposalNumber,
    `Project Proposal — ${clientName}`,
    clientName, client.email, client.phone ?? null,
    client.organization ?? null, clientId, today, validUntil,
    `Thank you for choosing Designs By Terrence Adderley. Based on your discovery questionnaire and selected package, this proposal outlines the full scope of your project, pricing, and our working agreement.`,
    `We will design and develop a complete digital presence tailored to your brand and business goals, as detailed in the selected ${tier.charAt(0).toUpperCase() + tier.slice(1)} package below.`,
    `All deliverables are outlined in the line items. Final files, assets, and access credentials will be delivered upon completion of all payments.`,
    JSON.stringify(proposalLineItems), Number(subtotal), Number(total),
    PAYMENT_TERMS, TERMS_AND_CONDITIONS, signingToken,
  ) as Array<{ id: number }>

  const proposalId = proposalRows[0].id

  // Link proposal back to PackageSelection
  await prisma.$executeRawUnsafe(
    `UPDATE "PackageSelection" SET "proposalId"=$1,"updatedAt"=NOW() WHERE "clientId"=$2`,
    proposalId, clientId,
  )

  // Mark step3Package complete
  await prisma.$executeRawUnsafe(
    `UPDATE "ClientOnboarding" SET "step3Package"=true,"updatedAt"=NOW() WHERE "clientId"=$1`,
    clientId,
  )

  // Notify admin
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)
  await createNotification(
    'info',
    'Package selected',
    `${clientName} selected the ${tierLabel} package ($${Number(total).toLocaleString()}) and generated a proposal`,
  )

  // Return fresh pkg + proposal info
  const freshPkg = await prisma.$queryRawUnsafe(
    `SELECT * FROM "PackageSelection" WHERE "clientId" = $1`, clientId,
  ) as Array<Record<string, unknown>>

  res.json({
    package: freshPkg[0],
    proposal: { id: proposalId, proposalNumber, signingToken },
  })
}))

export { router as packageSelectionRouter }

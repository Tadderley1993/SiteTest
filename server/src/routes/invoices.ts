import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'
import { paypalFetch, getPayPalSettings } from '../lib/paypal.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

// ── Raw SQL helpers (bypass stale Prisma client schema) ───────────────────────

function now() {
  return new Date().toISOString()
}

function fmt(n: number) {
  return n.toFixed(2)
}

// Fetch invoices via raw SQL so new columns are always returned
async function queryInvoices(where?: string, params: unknown[] = []) {
  const sql = `
    SELECT
      i.id, i.clientId, i.invoiceNumber, i.title, i.lineItems, i.currency,
      i.subtotal, i.discountType, i.discountValue, i.taxRate, i.amount,
      i.issuedDate, i.dueDate, i.status, i.notes, i.termsConditions,
      i.paypalInvoiceId, i.paypalInvoiceUrl, i.paypalStatus, i.sentAt,
      i.createdAt, i.updatedAt,
      c.id AS c_id, c.firstName, c.lastName, c.email, c.organization
    FROM "Invoice" i
    LEFT JOIN "Client" c ON i.clientId = c.id
    ${where ? 'WHERE ' + where : ''}
    ORDER BY i.createdAt DESC
  `
  const rows = await prisma.$queryRawUnsafe(sql, ...params) as Record<string, unknown>[]
  return rows.map(r => ({
    id: r.id,
    clientId: r.clientId,
    invoiceNumber: r.invoiceNumber,
    title: r.title,
    lineItems: r.lineItems,
    currency: r.currency,
    subtotal: r.subtotal,
    discountType: r.discountType,
    discountValue: r.discountValue,
    taxRate: r.taxRate,
    amount: r.amount,
    issuedDate: r.issuedDate,
    dueDate: r.dueDate,
    status: r.status,
    notes: r.notes,
    termsConditions: r.termsConditions,
    paypalInvoiceId: r.paypalInvoiceId,
    paypalInvoiceUrl: r.paypalInvoiceUrl,
    paypalStatus: r.paypalStatus,
    sentAt: r.sentAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    client: r.c_id ? {
      id: r.c_id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      organization: r.organization,
    } : null,
  }))
}

// ── PayPal payload builder ────────────────────────────────────────────────────

async function buildPayPalPayload(invoice: Record<string, unknown>, client: { firstName: string; lastName: string; email: string }) {
  const settings = await prisma.adminSettings.findFirst()
  const invoicerEmail = settings?.paypalEmail || process.env.SMTP_USER || ''
  const items: { description: string; quantity: number; unitPrice: number }[] =
    invoice.lineItems ? JSON.parse(invoice.lineItems as string) : []
  const currency = (invoice.currency as string) || 'USD'
  const subtotal = Number(invoice.subtotal) || 0
  const discountType = (invoice.discountType as string) || 'fixed'
  const discountValue = Number(invoice.discountValue) || 0
  const taxRate = Number(invoice.taxRate) || 0

  const discountAmt = discountType === 'percent' ? (subtotal * discountValue) / 100 : discountValue

  const ppItems = items.map(item => ({
    name: item.description,
    quantity: String(item.quantity),
    unit_amount: { currency_code: currency, value: fmt(item.unitPrice) },
    unit_of_measure: 'QUANTITY',
  }))

  // Note: omitting `invoicer` so PayPal uses the authenticated account automatically.
  // Providing an email that doesn't exactly match the PayPal account causes USER_NOT_FOUND (422).
  void invoicerEmail // fetched but not sent; kept in case needed for SMTP fallback later

  // Add tax to each item if taxRate > 0
  const ppItemsWithTax = taxRate > 0
    ? ppItems.map(item => ({ ...item, tax: { name: 'Tax', percent: String(taxRate) } }))
    : ppItems

  return {
    detail: {
      invoice_number: invoice.invoiceNumber,
      invoice_date: invoice.issuedDate,
      currency_code: currency,
      payment_term: { term_type: 'DUE_ON_DATE_SPECIFIED', due_date: invoice.dueDate },
      note: (invoice.notes as string) || undefined,
      terms_and_conditions: (invoice.termsConditions as string) || undefined,
      memo: (invoice.title as string) || undefined,
    },
    primary_recipients: [{
      billing_info: {
        email_address: client.email,
        name: { given_name: client.firstName, surname: client.lastName },
      },
    }],
    items: ppItemsWithTax,
    // Discount at invoice level if applicable
    ...(discountAmt > 0 ? {
      configuration: {
        allow_tips: false,
        tax_calculated_after_discount: true,
        tax_inclusive: false,
        discount: {
          percent: discountType === 'percent' ? String(discountValue) : undefined,
          amount: discountType === 'fixed'
            ? { currency_code: currency, value: fmt(discountAmt) }
            : undefined,
        },
      },
    } : {
      configuration: { allow_tips: false, tax_inclusive: false },
    }),
    // NOTE: Do NOT send `amount` — PayPal computes it from items and rejects mismatches
  }
}

// ── PayPal invoice create with duplicate-number retry ─────────────────────────

async function createPayPalInvoice(
  inv: Record<string, unknown>,
  client: { firstName: string; lastName: string; email: string }
): Promise<{ id: string; links?: Array<{ rel: string; href: string }> }> {
  for (let attempt = 0; attempt <= 4; attempt++) {
    // First attempt uses the exact user-entered number; subsequent attempts append -2, -3, …
    const suffix = attempt === 0 ? '' : `-${attempt + 1}`
    const payload = await buildPayPalPayload(
      { ...inv, invoiceNumber: `${inv.invoiceNumber}${suffix}` },
      client
    )
    try {
      return await paypalFetch('/v2/invoicing/invoices', 'POST', payload) as {
        id: string
        links?: Array<{ rel: string; href: string }>
      }
    } catch (e) {
      if (attempt < 4 && e instanceof Error && e.message.includes('DUPLICATE_INVOICE_NUMBER')) continue
      throw e
    }
  }
  throw new Error('Could not create PayPal invoice: invoice number already exists on PayPal for all variants tried')
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/admin/invoices
router.get('/', async (_req, res) => {
  try {
    const invoices = await queryInvoices()
    res.json(invoices)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to fetch invoices' })
  }
})

// POST /api/admin/invoices — create draft
router.post('/', async (req, res) => {
  try {
    const { clientId, invoiceNumber, title, lineItems, currency, subtotal, discountType, discountValue, taxRate, amount, issuedDate, dueDate, notes, termsConditions } = req.body
    const n = now()
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Invoice" (
        "clientId","invoiceNumber","title","lineItems","currency",
        "subtotal","discountType","discountValue","taxRate","amount",
        "issuedDate","dueDate","notes","termsConditions","status",
        "createdAt","updatedAt"
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'draft',?,?)
    `,
      Number(clientId),
      invoiceNumber,
      title || null,
      lineItems ? JSON.stringify(lineItems) : null,
      currency || 'USD',
      Number(subtotal) || 0,
      discountType || 'fixed',
      Number(discountValue) || 0,
      Number(taxRate) || 0,
      Number(amount) || 0,
      issuedDate,
      dueDate,
      notes || null,
      termsConditions || null,
      n, n
    )

    const rows = await queryInvoices('i.id = (SELECT MAX(id) FROM "Invoice")')
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to create invoice' })
  }
})

// GET /api/admin/invoices/:id
router.get('/:id', async (req, res) => {
  try {
    const rows = await queryInvoices('i.id = ?', [Number(req.params.id)])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to fetch invoice' })
  }
})

// PUT /api/admin/invoices/:id
router.put('/:id', async (req, res) => {
  try {
    const { invoiceNumber, title, lineItems, currency, subtotal, discountType, discountValue, taxRate, amount, issuedDate, dueDate, notes, termsConditions } = req.body
    await prisma.$executeRawUnsafe(`
      UPDATE "Invoice" SET
        "invoiceNumber"=?,"title"=?,"lineItems"=?,"currency"=?,
        "subtotal"=?,"discountType"=?,"discountValue"=?,"taxRate"=?,"amount"=?,
        "issuedDate"=?,"dueDate"=?,"notes"=?,"termsConditions"=?,"updatedAt"=?
      WHERE id=?
    `,
      invoiceNumber,
      title || null,
      lineItems ? JSON.stringify(lineItems) : null,
      currency || 'USD',
      Number(subtotal) || 0,
      discountType || 'fixed',
      Number(discountValue) || 0,
      Number(taxRate) || 0,
      Number(amount) || 0,
      issuedDate,
      dueDate,
      notes || null,
      termsConditions || null,
      now(),
      Number(req.params.id)
    )
    const rows = await queryInvoices('i.id = ?', [Number(req.params.id)])
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to update invoice' })
  }
})

// DELETE /api/admin/invoices/:id
router.delete('/:id', async (req, res) => {
  try {
    const rows = await queryInvoices('i.id = ?', [Number(req.params.id)])
    const inv = rows[0]
    if (inv?.paypalInvoiceId && inv.status === 'sent') {
      try {
        await paypalFetch(`/v2/invoicing/invoices/${inv.paypalInvoiceId}/cancel`, 'POST', {
          subject: 'Invoice cancelled', note: '', send_to_invoicer: false, send_to_recipient: false,
        })
      } catch { /* ignore */ }
    }
    await prisma.$executeRawUnsafe('DELETE FROM "Invoice" WHERE id = ?', Number(req.params.id))
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to delete invoice' })
  }
})

// POST /api/admin/invoices/:id/send
router.post('/:id/send', async (req, res) => {
  try {
    const creds = await getPayPalSettings()
    if (!creds) {
      return res.status(400).json({ error: 'PayPal credentials not configured. Go to Settings → PayPal to connect your account.' })
    }

    const isSandbox = creds.environment !== 'live'

    const rows = await queryInvoices('i.id = ?', [Number(req.params.id)])
    const inv = rows[0]
    if (!inv) return res.status(404).json({ error: 'Invoice not found' })
    if (!inv.client) return res.status(400).json({ error: 'Invoice has no associated client' })

    const client = inv.client as { firstName: string; lastName: string; email: string }

    // Re-send existing PayPal invoice
    if (inv.paypalInvoiceId) {
      await paypalFetch(`/v2/invoicing/invoices/${inv.paypalInvoiceId}/send`, 'POST', {
        send_to_invoicer: false, send_to_recipient: true,
        subject: req.body.subject || `Invoice ${inv.invoiceNumber} from Designs by TA`,
      })
      await prisma.$executeRawUnsafe(
        'UPDATE "Invoice" SET "status"=\'sent\',"sentAt"=?,"updatedAt"=? WHERE id=?',
        now(), now(), Number(req.params.id)
      )
      return res.json({ success: true, paypalInvoiceId: inv.paypalInvoiceId, paypalInvoiceUrl: inv.paypalInvoiceUrl, sandbox: isSandbox })
    }

    // Create new PayPal invoice (retries with suffix on duplicate number)
    const created = await createPayPalInvoice(inv as Record<string, unknown>, client)

    const paypalInvoiceId = created.id
    const paypalInvoiceUrl = created.links?.find(l => l.rel === 'payer-view')?.href || null

    // Send it
    await paypalFetch(`/v2/invoicing/invoices/${paypalInvoiceId}/send`, 'POST', {
      send_to_invoicer: false, send_to_recipient: true,
      subject: req.body.subject || `Invoice ${inv.invoiceNumber} from Designs by TA`,
    })

    await prisma.$executeRawUnsafe(`
      UPDATE "Invoice" SET
        "paypalInvoiceId"=?,"paypalInvoiceUrl"=?,"status"='sent',"sentAt"=?,"updatedAt"=?
      WHERE id=?
    `, paypalInvoiceId, paypalInvoiceUrl, now(), now(), Number(req.params.id))

    const updated = await queryInvoices('i.id = ?', [Number(req.params.id)])
    res.json({ success: true, invoice: updated[0], paypalInvoiceId, paypalInvoiceUrl, sandbox: isSandbox })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to send invoice' })
  }
})

// POST /api/admin/invoices/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    const rows = await queryInvoices('i.id = ?', [Number(req.params.id)])
    const inv = rows[0]
    if (!inv) return res.status(404).json({ error: 'Not found' })

    if (inv.paypalInvoiceId) {
      await paypalFetch(`/v2/invoicing/invoices/${inv.paypalInvoiceId}/cancel`, 'POST', {
        subject: req.body.subject || 'Invoice cancelled',
        note: req.body.note || '',
        send_to_invoicer: false, send_to_recipient: true,
      })
    }

    await prisma.$executeRawUnsafe(
      'UPDATE "Invoice" SET "status"=\'cancelled\',"updatedAt"=? WHERE id=?',
      now(), Number(req.params.id)
    )
    const updated = await queryInvoices('i.id = ?', [Number(req.params.id)])
    res.json(updated[0])
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to cancel invoice' })
  }
})

// POST /api/admin/invoices/:id/remind
router.post('/:id/remind', async (req, res) => {
  try {
    const rows = await queryInvoices('i.id = ?', [Number(req.params.id)])
    const inv = rows[0]
    if (!inv?.paypalInvoiceId) return res.status(400).json({ error: 'Invoice not sent via PayPal yet' })

    await paypalFetch(`/v2/invoicing/invoices/${inv.paypalInvoiceId}/remind`, 'POST', {
      subject: req.body.subject || `Reminder: Invoice ${inv.invoiceNumber}`,
      note: req.body.note || 'This is a friendly reminder that your invoice is due.',
      send_to_invoicer: false, send_to_recipient: true,
    })
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to send reminder' })
  }
})

// POST /api/admin/invoices/sync — pull payment status from PayPal into local DB
router.post('/sync', async (_req, res) => {
  try {
    const creds = await getPayPalSettings()
    if (!creds) {
      return res.status(400).json({ error: 'PayPal credentials not configured.' })
    }

    const rows = await queryInvoices('i.paypalInvoiceId IS NOT NULL')
    let updated = 0

    await Promise.all(rows.map(async inv => {
      try {
        const ppInv = await paypalFetch(
          `/v2/invoicing/invoices/${inv.paypalInvoiceId}`, 'GET'
        ) as { status: string }

        const ppStatus = ppInv.status // DRAFT, SENT, VIEWED, PAID, MARKED_AS_PAID, CANCELLED, REFUNDED

        let newLocalStatus = inv.status as string
        if (ppStatus === 'PAID' || ppStatus === 'MARKED_AS_PAID') {
          newLocalStatus = 'paid'
        } else if (ppStatus === 'CANCELLED' || ppStatus === 'REFUNDED') {
          newLocalStatus = 'cancelled'
        }

        if (newLocalStatus !== inv.status) updated++

        await prisma.$executeRawUnsafe(
          'UPDATE "Invoice" SET "status"=?, "paypalStatus"=?, "updatedAt"=? WHERE id=?',
          newLocalStatus, ppStatus, now(), inv.id
        )
      } catch { /* skip individual failures silently */ }
    }))

    res.json({ success: true, updated, total: rows.length })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Sync failed' })
  }
})

// POST /api/admin/invoices/generate-number
router.post('/generate-number', async (_req, res) => {
  try {
    const rows = await prisma.$queryRawUnsafe('SELECT MAX(id) as maxId FROM "Invoice"') as [{ maxId: number | null }]
    const num = (rows[0]?.maxId ?? 0) + 1
    res.json({ invoiceNumber: `INV-${String(num).padStart(4, '0')}` })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to generate number' })
  }
})

export { router as invoicesRouter }

import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { getSmtpTransporter } from '../lib/smtp.js'
import { authMiddleware } from '../middleware/auth.js'
import { paypalFetch, getPayPalSettings } from '../lib/paypal.js'
import { createNotification } from '../lib/notify.js'

const router = Router()

router.use(authMiddleware)

// ── Raw SQL helpers (bypass stale Prisma client schema) ───────────────────────

// Fetch invoices via raw SQL so new columns are always returned
async function queryInvoices(where?: string, params: unknown[] = []) {
  const sql = `
    SELECT
      i.id,
      i."clientId",
      i."invoiceNumber",
      i.title,
      i."lineItems",
      i.currency,
      i.subtotal,
      i."discountType",
      i."discountValue",
      i."taxRate",
      i.amount,
      i."issuedDate",
      i."dueDate",
      i.status,
      i.notes,
      i."termsConditions",
      i."paypalInvoiceId",
      i."paypalInvoiceUrl",
      i."paypalStatus",
      i."sentAt",
      i."createdAt",
      i."updatedAt",
      c.id AS c_id,
      c."firstName",
      c."lastName",
      c.email,
      c.organization
    FROM "Invoice" i
    LEFT JOIN "Client" c ON i."clientId" = c.id
    ${where ? 'WHERE ' + where : ''}
    ORDER BY i."createdAt" DESC
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


// ── Payment link email builder ────────────────────────────────────────────────

function buildPaymentLinkEmail(inv: Record<string, unknown>, client: { firstName: string; lastName: string; email: string }, paymentUrl: string): string {
  const lineItems: { description: string; quantity: number; unitPrice: number }[] =
    inv.lineItems ? JSON.parse(inv.lineItems as string) : []
  const subtotal = Number(inv.subtotal) || 0
  const discountType = (inv.discountType as string) || 'fixed'
  const discountValue = Number(inv.discountValue) || 0
  const taxRate = Number(inv.taxRate) || 0
  const discountAmt = discountType === 'percent' ? (subtotal * discountValue) / 100 : discountValue
  const taxAmt = ((subtotal - discountAmt) * taxRate) / 100
  const total = Number(inv.amount) || 0

  const rowsHtml = lineItems.map(item => `
    <tr>
      <td style="padding:10px 16px;font-size:14px;color:#111;border-bottom:1px solid #f0f0f0">${item.description}</td>
      <td style="padding:10px 16px;font-size:14px;color:#555;text-align:center;border-bottom:1px solid #f0f0f0">${item.quantity}</td>
      <td style="padding:10px 16px;font-size:14px;color:#111;text-align:right;border-bottom:1px solid #f0f0f0">$${Number(item.unitPrice).toFixed(2)}</td>
      <td style="padding:10px 16px;font-size:14px;color:#111;text-align:right;border-bottom:1px solid #f0f0f0">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
        <tr>
          <td style="background:#111;padding:32px 40px">
            <p style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px">Invoice</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.5)">${inv.invoiceNumber}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px;border-bottom:1px solid #f0f0f0">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:50%;vertical-align:top">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999">Bill To</p>
                  <p style="margin:0;font-size:14px;font-weight:600;color:#111">${client.firstName} ${client.lastName}</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#555">${client.email}</p>
                </td>
                <td style="width:50%;text-align:right;vertical-align:top">
                  <p style="margin:0 0 4px;font-size:11px;color:#999">Issue date: <strong style="color:#111">${inv.issuedDate}</strong></p>
                  <p style="margin:4px 0 0;font-size:11px;color:#999">Due date: <strong style="color:#e55">${inv.dueDate}</strong></p>
                  ${inv.title ? `<p style="margin:8px 0 0;font-size:12px;font-style:italic;color:#777">${inv.title}</p>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 8px">
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
              <thead>
                <tr style="background:#f9f9f9">
                  <th style="padding:10px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;text-align:left">Description</th>
                  <th style="padding:10px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;text-align:center">Qty</th>
                  <th style="padding:10px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;text-align:right">Unit Price</th>
                  <th style="padding:10px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;text-align:right">Amount</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 28px">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${discountAmt > 0 ? `<tr><td style="padding:4px 0;font-size:13px;color:#555;text-align:right">Discount</td><td style="padding:4px 0 4px 24px;font-size:13px;color:#22c55e;text-align:right;width:100px">−$${discountAmt.toFixed(2)}</td></tr>` : ''}
              ${taxAmt > 0 ? `<tr><td style="padding:4px 0;font-size:13px;color:#555;text-align:right">Tax (${taxRate}%)</td><td style="padding:4px 0 4px 24px;font-size:13px;color:#111;text-align:right">$${taxAmt.toFixed(2)}</td></tr>` : ''}
              <tr>
                <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#111;text-align:right;border-top:2px solid #111">Total Due</td>
                <td style="padding:12px 0 0 24px;font-size:20px;font-weight:800;color:#111;text-align:right;border-top:2px solid #111;width:100px">$${total.toFixed(2)}</td>
              </tr>
            </table>
          </td>
        </tr>
        ${inv.notes ? `<tr><td style="padding:0 40px 24px"><p style="margin:0;font-size:13px;color:#777;font-style:italic">${inv.notes}</p></td></tr>` : ''}
        <tr>
          <td style="padding:24px 40px 40px;text-align:center;border-top:1px solid #f0f0f0">
            <p style="margin:0 0 16px;font-size:13px;color:#777">Click the button below to pay securely via PayPal</p>
            <a href="${paymentUrl}" target="_blank"
              style="display:inline-block;background:#0070ba;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.3px">
              Pay Now — $${total.toFixed(2)}
            </a>
            <p style="margin:16px 0 0;font-size:11px;color:#bbb">Powered by PayPal · Secure &amp; encrypted</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
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
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Invoice" (
        "clientId","invoiceNumber","title","lineItems","currency",
        "subtotal","discountType","discountValue","taxRate","amount",
        "issuedDate","dueDate","notes","termsConditions","status",
        "createdAt","updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'draft',NOW(),NOW())
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
      termsConditions || null
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
    const rows = await queryInvoices('i.id = $1', [Number(req.params.id)])
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
        "invoiceNumber"=$1,"title"=$2,"lineItems"=$3,"currency"=$4,
        "subtotal"=$5,"discountType"=$6,"discountValue"=$7,"taxRate"=$8,"amount"=$9,
        "issuedDate"=$10,"dueDate"=$11,"notes"=$12,"termsConditions"=$13,"updatedAt"=NOW()
      WHERE id=$14
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
      Number(req.params.id)
    )
    const rows = await queryInvoices('i.id = $1', [Number(req.params.id)])
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to update invoice' })
  }
})

// DELETE /api/admin/invoices/:id
router.delete('/:id', async (req, res) => {
  try {
    const rows = await queryInvoices('i.id = $1', [Number(req.params.id)])
    const inv = rows[0]
    // PayPal Orders expire automatically — no API call needed, just delete locally
    await prisma.$executeRawUnsafe('DELETE FROM "Invoice" WHERE id = $1', Number(req.params.id))
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to delete invoice' })
  }
})

// POST /api/admin/invoices/:id/payment-link — create PayPal Order and return checkout URL
router.post('/:id/payment-link', async (req, res) => {
  try {
    const creds = await getPayPalSettings()
    if (!creds) {
      return res.status(400).json({ error: 'PayPal credentials not configured. Go to Settings → PayPal to connect your account.' })
    }

    const isSandbox = creds.environment !== 'live'
    const rows = await queryInvoices('i.id = $1', [Number(req.params.id)])
    const inv = rows[0]
    if (!inv) return res.status(404).json({ error: 'Invoice not found' })
    if (!inv.client) return res.status(400).json({ error: 'Invoice has no associated client' })

    const client = inv.client as { firstName: string; lastName: string; email: string }

    // Re-use existing order if it's still open
    if (inv.paypalInvoiceId) {
      try {
        const existing = await paypalFetch(`/v2/checkout/orders/${inv.paypalInvoiceId}`, 'GET') as { status: string }
        if (!['VOIDED', 'COMPLETED'].includes(existing.status)) {
          const paymentUrl = inv.paypalInvoiceUrl as string | null
          if (req.body.sendEmail && paymentUrl) {
            const smtp = await getSmtpTransporter()
            if (smtp) {
              const html = buildPaymentLinkEmail(inv as Record<string, unknown>, client, paymentUrl)
              await smtp.transporter.sendMail({
                from: smtp.from ?? undefined,
                to: client.email,
                subject: req.body.subject || `Invoice ${inv.invoiceNumber} — Payment Due`,
                html,
              })
            }
          }
          return res.json({ success: true, paymentUrl, orderId: inv.paypalInvoiceId, sandbox: isSandbox, reused: true })
        }
      } catch { /* order gone or invalid — create a new one */ }
    }

    // Create a new PayPal Order (Checkout API)
    const baseUrl = isSandbox ? 'https://dta-puce.vercel.app' : 'https://www.designsbyta.com'
    const order = await paypalFetch('/v2/checkout/orders', 'POST', {
      intent: 'CAPTURE',
      purchase_units: [{
        invoice_id: inv.invoiceNumber as string,
        description: `Invoice ${inv.invoiceNumber}${inv.title ? ` — ${inv.title}` : ''}`,
        amount: {
          currency_code: (inv.currency as string) || 'USD',
          value: Number(inv.amount).toFixed(2),
        },
      }],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'Designs By TA',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            return_url: baseUrl,
            cancel_url: baseUrl,
          },
        },
      },
    }) as { id: string; links?: Array<{ rel: string; href: string }> }

    const orderId = order.id
    const paymentUrl = order.links?.find(l => l.rel === 'payer-action')?.href || null

    // Persist order ID and mark invoice as sent
    await prisma.$executeRawUnsafe(
      `UPDATE "Invoice" SET "paypalInvoiceId"=$1,"paypalInvoiceUrl"=$2,"paypalStatus"='CREATED',"status"='sent',"sentAt"=NOW(),"updatedAt"=NOW() WHERE id=$3`,
      orderId, paymentUrl, Number(req.params.id)
    )

    // Optionally send branded SMTP email
    if (req.body.sendEmail && paymentUrl) {
      const smtp = await getSmtpTransporter()
      if (smtp) {
        const html = buildPaymentLinkEmail(inv as Record<string, unknown>, client, paymentUrl)
        await smtp.transporter.sendMail({
          from: smtp.from ?? undefined,
          to: client.email,
          subject: req.body.subject || `Invoice ${inv.invoiceNumber} — Payment Due`,
          html,
        })
      }
    }

    await createNotification(
      'invoice_sent',
      'Payment link created',
      `Payment link generated for Invoice #${inv.invoiceNumber} — ${client.firstName} ${client.lastName}`,
    )

    const updated = await queryInvoices('i.id = $1', [Number(req.params.id)])
    res.json({ success: true, paymentUrl, orderId, invoice: updated[0], sandbox: isSandbox })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to create payment link' })
  }
})

// POST /api/admin/invoices/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    // PayPal Orders expire on their own — just update local status
    await prisma.$executeRawUnsafe(
      `UPDATE "Invoice" SET "status"='cancelled',"updatedAt"=NOW() WHERE id=$1`,
      Number(req.params.id)
    )
    const updated = await queryInvoices('i.id = $1', [Number(req.params.id)])
    res.json(updated[0])
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to cancel invoice' })
  }
})

// POST /api/admin/invoices/sync — check PayPal Order statuses, auto-capture approved payments
router.post('/sync', async (_req, res) => {
  try {
    const creds = await getPayPalSettings()
    if (!creds) {
      return res.status(400).json({ error: 'PayPal credentials not configured.' })
    }

    const rows = await queryInvoices('i."paypalInvoiceId" IS NOT NULL')
    let updated = 0
    const errors: string[] = []

    await Promise.all(rows.map(async inv => {
      try {
        const order = await paypalFetch(
          `/v2/checkout/orders/${inv.paypalInvoiceId}`, 'GET'
        ) as { status: string }

        let ppStatus = order.status // CREATED, PAYER_ACTION_REQUIRED, SAVED, APPROVED, COMPLETED, VOIDED

        // Auto-capture payments the client has approved
        if (ppStatus === 'APPROVED') {
          await paypalFetch(`/v2/checkout/orders/${inv.paypalInvoiceId}/capture`, 'POST')
          ppStatus = 'COMPLETED'
        }

        let newLocalStatus = inv.status as string
        if (ppStatus === 'COMPLETED') {
          newLocalStatus = 'paid'
        } else if (ppStatus === 'VOIDED') {
          newLocalStatus = 'cancelled'
        }
        // CREATED / PAYER_ACTION_REQUIRED / SAVED → keep current local status

        if (newLocalStatus !== inv.status) {
          updated++
          if (newLocalStatus === 'paid') {
            const c = inv.client as { firstName?: string; lastName?: string } | null
            const clientName = c ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() : `Client #${inv.clientId}`
            await createNotification(
              'invoice_paid',
              'Payment received',
              `${clientName} paid Invoice #${inv.invoiceNumber} — $${(inv.amount as number).toFixed(2)}`,
            )
          }
        }

        await prisma.$executeRawUnsafe(
          'UPDATE "Invoice" SET "status"=$1,"paypalStatus"=$2,"updatedAt"=NOW() WHERE id=$3',
          newLocalStatus, ppStatus, inv.id
        )
      } catch (e) {
        errors.push(`${inv.invoiceNumber}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }))

    res.json({ success: true, updated, total: rows.length, errors })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Sync failed' })
  }
})

// POST /api/admin/invoices/generate-number
router.post('/generate-number', async (_req, res) => {
  try {
    // Count all invoices (including deleted ones never re-use numbers) using MAX id
    // Then find any existing INV-XXXX numbers to avoid duplicates
    const rows = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(MAX(CAST(SUBSTRING("invoiceNumber" FROM 'INV-([0-9]+)') AS INTEGER)), 0) AS last FROM "Invoice" WHERE "invoiceNumber" ~ '^INV-[0-9]+'`
    ) as [{ last: number }]
    const num = (rows[0]?.last ?? 0) + 1
    res.json({ invoiceNumber: `INV-${String(num).padStart(4, '0')}` })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to generate number' })
  }
})

export { router as invoicesRouter }

import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { getPayPalSettings, getAccessToken, getBaseUrl, paypalFetch as paypalRequest } from '../lib/paypal.js'

const router = Router()

router.use(authMiddleware)

// POST /api/admin/paypal/test - test connection
router.post('/test', async (_req, res) => {
  try {
    const creds = await getPayPalSettings()
    if (!creds) throw new Error('PayPal credentials not configured')
    const token = await getAccessToken(creds.clientId, creds.secret, creds.environment)
    const baseUrl = getBaseUrl(creds.environment)
    const profileRes = await fetch(`${baseUrl}/v1/identity/oauth2/userinfo?schema=paypalv1.1`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!profileRes.ok) {
      // Connection works (we got a token) but userinfo may not be available
      res.json({ success: true, message: 'Connected successfully', accountInfo: null })
      return
    }
    const profile = await profileRes.json() as Record<string, unknown>
    // Save merchant email if available
    const email = (profile.emails as Array<{value:string}>)?.[0]?.value
    if (email) {
      const settings = await prisma.adminSettings.findFirst()
      if (settings) await prisma.adminSettings.update({ where: { id: settings.id }, data: { paypalEmail: email } })
    }
    res.json({ success: true, message: 'Connected successfully', accountInfo: profile })
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Connection failed' })
  }
})

// GET /api/admin/paypal/invoices
router.get('/invoices', async (req, res) => {
  try {
    const page = req.query.page ?? '1'
    const pageSize = req.query.page_size ?? '25'
    const data = await paypalRequest(`/v2/invoicing/invoices?page=${page}&page_size=${pageSize}&total_required=true`)
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch invoices' })
  }
})

// POST /api/admin/paypal/invoices - create invoice
router.post('/invoices', async (req, res) => {
  try {
    const data = await paypalRequest('/v2/invoicing/invoices', 'POST', req.body)
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create invoice' })
  }
})

// GET /api/admin/paypal/invoices/:id
router.get('/invoices/:id', async (req, res) => {
  try {
    const data = await paypalRequest(`/v2/invoicing/invoices/${req.params.id}`)
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch invoice' })
  }
})

// POST /api/admin/paypal/invoices/:id/send
router.post('/invoices/:id/send', async (req, res) => {
  try {
    await paypalRequest(`/v2/invoicing/invoices/${req.params.id}/send`, 'POST', {
      send_to_invoicer: false,
      send_to_recipient: true,
      additional_recipients: req.body.additional_recipients,
      note: req.body.note,
      subject: req.body.subject,
    })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to send invoice' })
  }
})

// POST /api/admin/paypal/invoices/:id/cancel
router.post('/invoices/:id/cancel', async (req, res) => {
  try {
    await paypalRequest(`/v2/invoicing/invoices/${req.params.id}/cancel`, 'POST', {
      subject: req.body.subject || 'Invoice cancelled',
      note: req.body.note || '',
      send_to_invoicer: false,
      send_to_recipient: true,
    })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to cancel invoice' })
  }
})

// DELETE /api/admin/paypal/invoices/:id
router.delete('/invoices/:id', async (req, res) => {
  try {
    await paypalRequest(`/v2/invoicing/invoices/${req.params.id}`, 'DELETE')
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete invoice' })
  }
})

// GET /api/admin/paypal/transactions
router.get('/transactions', async (req, res) => {
  try {
    const startDate = req.query.start_date as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = req.query.end_date as string || new Date().toISOString()
    const data = await paypalRequest(
      `/v1/reporting/transactions?start_date=${startDate}&end_date=${endDate}&fields=all&page_size=100&page=1`
    )
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch transactions' })
  }
})

// POST /api/admin/paypal/invoices/generate-number - get next invoice number
router.post('/generate-number', async (_req, res) => {
  try {
    const data = await paypalRequest('/v2/invoicing/generate-next-invoice-number', 'POST')
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate number' })
  }
})

export { router as paypalRouter }

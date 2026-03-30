import { Router, Request } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { getStripeSettings, getStripeClient } from '../lib/stripe.js'
import { createNotification } from '../lib/notify.js'
import Stripe from 'stripe'

const router = Router()

// POST /api/admin/stripe/test — verify secret key and return account info (admin only)
router.post('/test', authMiddleware, async (_req, res) => {
  try {
    const creds = await getStripeSettings()
    if (!creds) return res.status(400).json({ error: 'Stripe secret key not configured. Go to Settings → Stripe.' })

    const stripe = getStripeClient(creds.secretKey)
    const account = await stripe.accounts.retrieve()

    res.json({
      success: true,
      message: `Connected to Stripe account: ${account.email ?? account.id}`,
      accountInfo: {
        id: account.id,
        email: account.email,
        country: account.country,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        displayName: account.settings?.dashboard?.display_name ?? null,
      },
    })
  } catch (e) {
    res.status(400).json({ success: false, error: e instanceof Error ? e.message : 'Connection failed' })
  }
})

// POST /api/stripe/webhook — Stripe sends events here (no auth middleware — uses signature verification)
router.post('/webhook', async (req: Request, res) => {
  try {
    const creds = await getStripeSettings()
    if (!creds?.webhookSecret) {
      return res.status(400).json({ error: 'Webhook secret not configured' })
    }

    const sig = req.headers['stripe-signature'] as string
    const stripe = getStripeClient(creds.secretKey)

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, creds.webhookSecret)
    } catch {
      return res.status(400).json({ error: 'Webhook signature verification failed' })
    }

    if (event.type === 'invoice.paid') {
      const stripeInvoice = event.data.object as Stripe.Invoice
      const invoiceId = stripeInvoice.metadata?.invoiceId

      if (invoiceId) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Invoice" SET "status"='paid',"stripeStatus"='paid',"updatedAt"=NOW() WHERE id=$1`,
          Number(invoiceId),
        )
        await createNotification(
          'invoice_paid',
          'Invoice Paid via Stripe',
          `Payment received for invoice #${invoiceId}`,
        )
      }
    }

    res.json({ received: true })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Webhook error' })
  }
})

export { router as stripeRouter }

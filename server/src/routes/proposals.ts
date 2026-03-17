import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

// Auto-generate a proposal number
async function generateProposalNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.proposal.count()
  return `PROP-${year}-${String(count + 1).padStart(3, '0')}`
}

// GET /api/admin/proposals
router.get('/', async (_req, res) => {
  try {
    const proposals = await prisma.proposal.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json(proposals)
  } catch {
    res.status(500).json({ error: 'Failed to fetch proposals' })
  }
})

// POST /api/admin/proposals
router.post('/', async (req, res) => {
  try {
    const proposalNumber = await generateProposalNumber()
    const proposal = await prisma.proposal.create({
      data: { proposalNumber, ...req.body },
    })
    res.json(proposal)
  } catch (error) {
    console.error('Error creating proposal:', error)
    res.status(500).json({ error: 'Failed to create proposal' })
  }
})

// GET /api/admin/proposals/:id
router.get('/:id', async (req, res) => {
  try {
    const proposal = await prisma.proposal.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' })
    res.json(proposal)
  } catch {
    res.status(500).json({ error: 'Failed to fetch proposal' })
  }
})

// PUT /api/admin/proposals/:id
router.put('/:id', async (req, res) => {
  try {
    const proposal = await prisma.proposal.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    })
    res.json(proposal)
  } catch {
    res.status(500).json({ error: 'Failed to update proposal' })
  }
})

// DELETE /api/admin/proposals/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.proposal.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete proposal' })
  }
})

// POST /api/admin/proposals/:id/send-email
router.post('/:id/send-email', async (req, res) => {
  try {
    const proposal = await prisma.proposal.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' })

    const { to, subject, message, pdfBase64 } = req.body

    // Build transporter: DB settings override .env
    const dbSettings = await prisma.adminSettings.findFirst()
    const smtpHost = dbSettings?.smtpHost || process.env.SMTP_HOST
    const smtpPort = parseInt(dbSettings?.smtpPort || process.env.SMTP_PORT || '587')
    const smtpUser = dbSettings?.smtpUser || process.env.SMTP_USER
    const smtpPass = dbSettings?.smtpPass || process.env.SMTP_PASS
    const smtpFrom = dbSettings?.smtpFrom || process.env.SMTP_FROM || smtpUser
    const smtpSecure = dbSettings?.smtpSecure ?? (process.env.SMTP_SECURE === 'true')

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(503).json({ error: 'Email not configured. Add SMTP credentials in Settings → Email, or in .env' })
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: smtpPort !== 465,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    })

    const currency = proposal.currency ?? 'USD'
    const sym = ({ USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$' } as Record<string, string>)[currency] ?? '$'

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;color:#111;max-width:680px;margin:0 auto;padding:24px}
  .header{background:#0d1117;color:#fff;padding:32px;border-radius:8px;margin-bottom:24px}
  .header h1{margin:0;font-size:28px;letter-spacing:4px}
  .header p{margin:4px 0 0;color:#9ca3af;font-size:14px}
  .section{margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #e5e7eb}
  .section h2{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-bottom:8px}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
  .meta-item label{display:block;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px}
  .meta-item p{margin:2px 0 0;font-weight:600}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{background:#f3f4f6;text-align:left;padding:8px 12px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase}
  td{padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px}
  .totals{text-align:right;margin-top:8px}
  .total-row{display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#6b7280}
  .grand-total{font-size:18px;font-weight:700;color:#111;border-top:2px solid #111;padding-top:8px;margin-top:4px}
  .footer{background:#f9fafb;padding:16px;border-radius:8px;font-size:12px;color:#9ca3af;margin-top:24px}
  .accent{color:#5a7a0a}
</style></head>
<body>
<div class="header">
  <h1>DTA</h1>
  <p>Digital Transformation Agency</p>
</div>
${message ? `<p style="font-size:15px;margin-bottom:24px">${message}</p>` : ''}
<div class="meta">
  <div class="meta-item"><label>Proposal #</label><p>${proposal.proposalNumber}</p></div>
  <div class="meta-item"><label>Date</label><p>${proposal.date}</p></div>
  <div class="meta-item"><label>Prepared For</label><p>${proposal.clientName}</p></div>
  ${proposal.validUntil ? `<div class="meta-item"><label>Valid Until</label><p>${proposal.validUntil}</p></div>` : ''}
</div>
<div class="section">
  <h2>Project</h2>
  <p style="font-size:16px;font-weight:600">${proposal.title}</p>
  ${proposal.executiveSummary ? `<p style="color:#4b5563;margin-top:8px">${proposal.executiveSummary}</p>` : ''}
</div>
${proposal.projectScope ? `<div class="section"><h2>Scope</h2><p style="color:#4b5563;white-space:pre-wrap">${proposal.projectScope}</p></div>` : ''}
${proposal.deliverables ? `<div class="section"><h2>Deliverables</h2><p style="color:#4b5563;white-space:pre-wrap">${proposal.deliverables}</p></div>` : ''}
${proposal.timeline ? `<div class="section"><h2>Timeline</h2><p style="color:#4b5563;white-space:pre-wrap">${proposal.timeline}</p></div>` : ''}
<div class="section">
  <h2>Investment</h2>
  ${proposal.lineItems ? (() => {
    try {
      const items = JSON.parse(proposal.lineItems)
      return `<table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${
        items.map((i: {description:string;qty:number;unitPrice:number;total:number}) =>
          `<tr><td>${i.description}</td><td>${i.qty}</td><td>${sym}${i.unitPrice.toFixed(2)}</td><td>${sym}${i.total.toFixed(2)}</td></tr>`
        ).join('')
      }</tbody></table>` } catch { return '' } })() : ''}
  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>${sym}${proposal.subtotal.toFixed(2)}</span></div>
    ${proposal.discountValue > 0 ? `<div class="total-row"><span>Discount</span><span>-${sym}${proposal.discountValue.toFixed(2)}</span></div>` : ''}
    ${proposal.taxRate > 0 ? `<div class="total-row"><span>Tax (${proposal.taxRate}%)</span><span>${sym}${(proposal.subtotal * proposal.taxRate / 100).toFixed(2)}</span></div>` : ''}
    <div class="total-row grand-total"><span>Total</span><span>${sym}${proposal.total.toFixed(2)}</span></div>
  </div>
</div>
${proposal.paymentTerms ? `<div class="section"><h2>Payment Terms</h2><p style="color:#4b5563">${proposal.paymentTerms}</p></div>` : ''}
${proposal.termsConditions ? `<div class="section"><h2>Terms & Conditions</h2><p style="color:#4b5563;white-space:pre-wrap;font-size:12px">${proposal.termsConditions}</p></div>` : ''}
<div class="footer">
  <p>This proposal was prepared by DTA. Please review the attached PDF for the full formatted proposal.</p>
  <p>Questions? Reply to this email or contact us directly.</p>
</div>
</body></html>`

    const attachments: Mail.Attachment[] = []
    if (pdfBase64) {
      attachments.push({
        filename: `${proposal.proposalNumber}-proposal.pdf`,
        content: Buffer.from(pdfBase64, 'base64'),
        contentType: 'application/pdf',
      })
    }

    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject: subject || `Proposal: ${proposal.title}`,
      html,
      attachments,
    })

    // Mark as sent
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: 'sent', sentAt: new Date() },
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Error sending email:', error)
    const msg = error instanceof Error ? error.message : 'Failed to send email'
    res.status(500).json({ error: msg })
  }
})

export { router as proposalsRouter }

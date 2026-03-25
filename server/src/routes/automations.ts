import { Router } from 'express'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { validate } from '../middleware/validate.js'
import { logger } from '../lib/logger.js'

const router = Router()

const RuleSchema = z.object({
  name:      z.string().min(1),
  type:      z.enum(['proposal_followup', 'welcome_email', 'invoice_reminder', 'payment_reminder', 'monthly_report']),
  enabled:   z.boolean().default(false),
  delayDays: z.coerce.number().int().min(0).default(3),
  subject:   z.string().optional(),
  body:      z.string().optional(),
})

async function getTransporter() {
  const settings = await prisma.adminSettings.findFirst()
  const host = settings?.smtpHost || process.env.SMTP_HOST
  const port = parseInt(settings?.smtpPort || process.env.SMTP_PORT || '587')
  const user = settings?.smtpUser || process.env.SMTP_USER
  const pass = settings?.smtpPass || process.env.SMTP_PASS
  const from = settings?.smtpFrom || process.env.SMTP_FROM || user

  if (!host || !user || !pass) throw new Error('SMTP not configured')

  return {
    transporter: nodemailer.createTransport({ host, port, secure: false, auth: { user, pass } }),
    from,
  }
}

// GET /api/admin/automations
router.get('/', authMiddleware, asyncHandler(async (_req, res) => {
  const rules = await prisma.automationRule.findMany({
    orderBy: { createdAt: 'asc' },
    include: { logs: { orderBy: { createdAt: 'desc' }, take: 5 } },
  })
  res.json(rules)
}))

// POST /api/admin/automations
router.post('/', authMiddleware, validate(RuleSchema), asyncHandler(async (req, res) => {
  const rule = await prisma.automationRule.create({ data: req.body })
  res.status(201).json(rule)
}))

// PUT /api/admin/automations/:id
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  const data = RuleSchema.partial().parse(req.body)
  const rule = await prisma.automationRule.update({ where: { id }, data })
  res.json(rule)
}))

// DELETE /api/admin/automations/:id
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  await prisma.automationRule.delete({ where: { id } })
  res.json({ message: 'Automation deleted' })
}))

// POST /api/admin/automations/:id/run — manually trigger
router.post('/:id/run', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  const rule = await prisma.automationRule.findUnique({ where: { id } })
  if (!rule) return res.status(404).json({ error: 'Rule not found' })

  const results: { status: string; message: string; sentTo?: string }[] = []

  try {
    const { transporter, from } = await getTransporter()
    const cutoff = new Date(Date.now() - rule.delayDays * 24 * 60 * 60 * 1000)

    if (rule.type === 'proposal_followup') {
      // Proposals sent but not accepted/declined within delayDays
      const proposals = await prisma.proposal.findMany({
        where: { status: 'sent', sentAt: { lte: cutoff } },
      })
      for (const p of proposals) {
        const subject = rule.subject || `Following up on your proposal — ${p.title}`
        const body = rule.body ||
          `Hi ${p.clientName},\n\nI wanted to follow up on the proposal I sent you for "${p.title}".\nPlease let me know if you have any questions!\n\nBest,\nTerrence Adderley`
        await transporter.sendMail({ from: from!, to: p.clientEmail, subject, text: body })
        results.push({ status: 'success', sentTo: p.clientEmail, message: `Sent to ${p.clientEmail}` })
      }
      if (proposals.length === 0) results.push({ status: 'skipped', message: 'No proposals pending follow-up' })
    }

    else if (rule.type === 'welcome_email') {
      // Clients created within the last delayDays days who haven't received welcome yet
      const clients = await prisma.client.findMany({
        where: { createdAt: { gte: cutoff } },
      })
      for (const c of clients) {
        const name = `${c.firstName} ${c.lastName}`
        const subject = rule.subject || `Welcome, ${c.firstName}! Let's get started.`
        const body = rule.body ||
          `Hi ${c.firstName},\n\nWelcome aboard! I'm excited to work with you.\nI'll be in touch shortly to kick things off.\n\nBest,\nTerrence Adderley`
        await transporter.sendMail({ from: from!, to: c.email, subject, text: body })
        results.push({ status: 'success', sentTo: c.email, message: `Sent welcome to ${name}` })
      }
      if (clients.length === 0) results.push({ status: 'skipped', message: 'No new clients in the window' })
    }

    else if (rule.type === 'invoice_reminder') {
      // Invoices due within delayDays days, status sent/overdue
      const soon = new Date(Date.now() + rule.delayDays * 24 * 60 * 60 * 1000)
      const invoices = await prisma.invoice.findMany({
        where: { status: { in: ['sent', 'overdue'] } },
        include: { client: true },
      })
      const due = invoices.filter(inv => new Date(inv.dueDate) <= soon)
      for (const inv of due) {
        const subject = rule.subject || `Invoice #${inv.invoiceNumber} — Payment Reminder`
        const body = rule.body ||
          `Hi ${inv.client.firstName},\n\nThis is a friendly reminder that Invoice #${inv.invoiceNumber} for $${inv.amount} is due on ${inv.dueDate}.\n\nPlease let me know if you have any questions.\n\nBest,\nTerrence Adderley`
        await transporter.sendMail({ from: from!, to: inv.client.email, subject, text: body })
        results.push({ status: 'success', sentTo: inv.client.email, message: `Reminder sent for Invoice #${inv.invoiceNumber}` })
      }
      if (due.length === 0) results.push({ status: 'skipped', message: 'No invoices due soon' })
    }

    else if (rule.type === 'payment_reminder') {
      // Overdue payment entries
      const today = new Date().toISOString().split('T')[0]
      const payments = await prisma.paymentEntry.findMany({
        where: { status: 'pending', dueDate: { lte: today } },
        include: { client: true },
      })
      for (const p of payments) {
        const subject = rule.subject || `Payment Reminder — ${p.label}`
        const body = rule.body ||
          `Hi ${p.client.firstName},\n\nThis is a reminder that "${p.label}" for $${p.amount} was due on ${p.dueDate}.\n\nPlease reach out if you need to make arrangements.\n\nBest,\nTerrence Adderley`
        await transporter.sendMail({ from: from!, to: p.client.email, subject, text: body })
        results.push({ status: 'success', sentTo: p.client.email, message: `Reminder sent to ${p.client.firstName} for ${p.label}` })
      }
      if (payments.length === 0) results.push({ status: 'skipped', message: 'No overdue payments' })
    }

    else if (rule.type === 'monthly_report') {
      const settings = await prisma.adminSettings.findFirst()
      const adminEmail = settings?.smtpUser || process.env.SMTP_USER
      if (!adminEmail) { results.push({ status: 'skipped', message: 'No admin email configured' }) }
      else {
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const [newClients, newInvoices, expenses] = await Promise.all([
          prisma.client.count({ where: { createdAt: { gte: monthStart } } }),
          prisma.invoice.findMany({ where: { createdAt: { gte: monthStart } } }),
          prisma.expense.findMany({ where: { date: { gte: monthStart.toISOString().split('T')[0] } } }),
        ])
        const revenue = newInvoices.reduce((s, i) => s + i.amount, 0)
        const expTotal = expenses.reduce((s, e) => s + e.amount, 0)
        const subject = rule.subject || `Monthly Report — ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`
        const body = rule.body ||
          `Monthly Summary\n\nNew Clients: ${newClients}\nInvoices Issued: ${newInvoices.length}\nRevenue: $${revenue.toFixed(2)}\nExpenses: $${expTotal.toFixed(2)}\nNet: $${(revenue - expTotal).toFixed(2)}\n\nGenerated by Agency OS`
        await transporter.sendMail({ from: from!, to: adminEmail, subject, text: body })
        results.push({ status: 'success', sentTo: adminEmail, message: 'Monthly report sent to admin' })
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err, ruleId: id }, 'Automation run error')
    results.push({ status: 'error', message })
  }

  // Log all results
  await Promise.all(results.map(r =>
    prisma.automationLog.create({
      data: { ruleId: id, status: r.status, message: r.message, sentTo: r.sentTo },
    })
  ))

  await prisma.automationRule.update({
    where: { id },
    data: { lastRunAt: new Date(), runCount: { increment: 1 } },
  })

  res.json({ results })
}))

// GET /api/admin/automations/:id/logs
router.get('/:id/logs', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  const logs = await prisma.automationLog.findMany({
    where: { ruleId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  res.json(logs)
}))

export { router as automationsRouter }

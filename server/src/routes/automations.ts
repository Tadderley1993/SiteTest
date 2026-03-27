import { Router } from 'express'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { validate } from '../middleware/validate.js'
import { logger } from '../lib/logger.js'
import { createNotification } from '../lib/notify.js'

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
  // Overlay stale-client fields via raw SQL
  const raw = await prisma.$queryRawUnsafe(
    `SELECT id, "targetClientIds", "dedupeEnabled", "dedupeDays" FROM "AutomationRule"`
  ) as Array<{ id: number; targetClientIds: string | null; dedupeEnabled: boolean; dedupeDays: number }>
  const extraMap = Object.fromEntries(raw.map(r => [r.id, r]))
  res.json(rules.map(r => ({
    ...r,
    targetClientIds: extraMap[r.id]?.targetClientIds ? JSON.parse(extraMap[r.id].targetClientIds!) : null,
    dedupeEnabled: extraMap[r.id]?.dedupeEnabled ?? false,
    dedupeDays: extraMap[r.id]?.dedupeDays ?? 30,
  })))
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
  // Handle fields not in zod schema via raw SQL
  const { targetClientIds, dedupeEnabled, dedupeDays } = req.body as {
    targetClientIds?: number[] | null
    dedupeEnabled?: boolean
    dedupeDays?: number
  }
  const rawSets: string[] = []
  const rawParams: unknown[] = []
  let idx = 1
  if (targetClientIds !== undefined) {
    rawSets.push(`"targetClientIds" = $${idx++}`)
    rawParams.push(targetClientIds && targetClientIds.length > 0 ? JSON.stringify(targetClientIds) : null)
  }
  if (dedupeEnabled !== undefined) {
    rawSets.push(`"dedupeEnabled" = $${idx++}`)
    rawParams.push(dedupeEnabled)
  }
  if (dedupeDays !== undefined) {
    rawSets.push(`"dedupeDays" = $${idx++}`)
    rawParams.push(dedupeDays)
  }
  if (rawSets.length > 0) {
    rawSets.push(`"updatedAt" = NOW()`)
    rawParams.push(id)
    await prisma.$executeRawUnsafe(
      `UPDATE "AutomationRule" SET ${rawSets.join(', ')} WHERE id = $${idx}`,
      ...rawParams
    )
  }
  const rule = await prisma.automationRule.update({ where: { id }, data })
  // Return with stale-client fields attached
  const raw = await prisma.$queryRawUnsafe(
    `SELECT "targetClientIds", "dedupeEnabled", "dedupeDays" FROM "AutomationRule" WHERE id = $1`, id
  ) as Array<{ targetClientIds: string | null; dedupeEnabled: boolean; dedupeDays: number }>
  res.json({
    ...rule,
    targetClientIds: raw[0]?.targetClientIds ? JSON.parse(raw[0].targetClientIds) : null,
    dedupeEnabled: raw[0]?.dedupeEnabled ?? false,
    dedupeDays: raw[0]?.dedupeDays ?? 30,
  })
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

  // Fetch rule via raw SQL to get all fields (stale Prisma client omits newer ones)
  const ruleRows = await prisma.$queryRawUnsafe(`
    SELECT id, name, type, enabled, "delayDays", subject, body, "templateId",
           "targetClientIds", "dedupeEnabled", "dedupeDays",
           "lastRunAt", "runCount", "createdAt", "updatedAt"
    FROM "AutomationRule" WHERE id = $1
  `, id) as Array<{
    id: number; name: string; type: string; enabled: boolean; delayDays: number
    subject: string | null; body: string | null; templateId: number | null
    targetClientIds: string | null; dedupeEnabled: boolean; dedupeDays: number
    lastRunAt: Date | null; runCount: number; createdAt: Date; updatedAt: Date
  }>
  if (!ruleRows.length) return res.status(404).json({ error: 'Rule not found' })
  const rule = ruleRows[0]

  // Parse target client IDs (null = all matching)
  const targetIds: number[] | null = rule.targetClientIds
    ? JSON.parse(rule.targetClientIds)
    : null

  // Helper: check if an email address was already sent by this rule within dedupeDays
  const wasSentRecently = async (email: string): Promise<boolean> => {
    if (!rule.dedupeEnabled) return false
    const dedupeCutoff = new Date(Date.now() - rule.dedupeDays * 24 * 60 * 60 * 1000)
    const existing = await prisma.automationLog.findFirst({
      where: { ruleId: id, sentTo: email, status: 'success', createdAt: { gte: dedupeCutoff } },
    })
    return !!existing
  }

  const results: { status: string; message: string; sentTo?: string }[] = []

  try {
    const { transporter, from } = await getTransporter()
    const cutoff = new Date(Date.now() - rule.delayDays * 24 * 60 * 60 * 1000)

    if (rule.type === 'proposal_followup') {
      const where: Parameters<typeof prisma.proposal.findMany>[0]['where'] = {
        status: 'sent',
        sentAt: { lte: cutoff },
        ...(targetIds ? { clientId: { in: targetIds } } : {}),
      }
      const proposals = await prisma.proposal.findMany({ where })
      for (const p of proposals) {
        const subject = rule.subject || `Following up on your proposal — ${p.title}`
        const body = rule.body ||
          `Hi ${p.clientName},\n\nI wanted to follow up on the proposal I sent you for "${p.title}".\nPlease let me know if you have any questions!\n\nBest,\nTerrence Adderley\nDesigns By Terrence Adderley\nterrenceadderley@designsbyta.com\nwww.designsbyta.com`
        if (await wasSentRecently(p.clientEmail)) {
          results.push({ status: 'skipped', sentTo: p.clientEmail, message: `Skipped ${p.clientEmail} — already sent within ${rule.dedupeDays} days` })
          continue
        }
        await transporter.sendMail({ from: from!, to: p.clientEmail, subject, text: body })
        await createNotification('email_sent', 'Proposal follow-up sent', `Follow-up email sent to ${p.clientEmail} for "${p.title}"`)
        results.push({ status: 'success', sentTo: p.clientEmail, message: `Sent to ${p.clientEmail}` })
      }
      if (proposals.length === 0) results.push({ status: 'skipped', message: 'No proposals pending follow-up' })
    }

    else if (rule.type === 'welcome_email') {
      const where: Parameters<typeof prisma.client.findMany>[0]['where'] = {
        createdAt: { gte: cutoff },
        ...(targetIds ? { id: { in: targetIds } } : {}),
      }
      const clients = await prisma.client.findMany({ where })
      for (const c of clients) {
        const name = `${c.firstName} ${c.lastName}`
        if (await wasSentRecently(c.email)) {
          results.push({ status: 'skipped', sentTo: c.email, message: `Skipped ${name} — already sent within ${rule.dedupeDays} days` })
          continue
        }
        const subject = rule.subject || `Welcome, ${c.firstName}! Let's get started.`
        const body = rule.body ||
          `Hi ${c.firstName},\n\nWelcome aboard! I'm excited to work with you.\nI'll be in touch shortly to kick things off.\n\nBest,\nTerrence Adderley\nDesigns By Terrence Adderley\nterrenceadderley@designsbyta.com\nwww.designsbyta.com`
        await transporter.sendMail({ from: from!, to: c.email, subject, text: body })
        await createNotification('email_sent', 'Welcome email sent', `Welcome email sent to ${name} (${c.email})`)
        results.push({ status: 'success', sentTo: c.email, message: `Sent welcome to ${name}` })
      }
      if (clients.length === 0) results.push({ status: 'skipped', message: 'No new clients in the window' })
    }

    else if (rule.type === 'invoice_reminder') {
      const soon = new Date(Date.now() + rule.delayDays * 24 * 60 * 60 * 1000)
      const where: Parameters<typeof prisma.invoice.findMany>[0]['where'] = {
        status: { in: ['sent', 'overdue'] },
        ...(targetIds ? { clientId: { in: targetIds } } : {}),
      }
      const invoices = await prisma.invoice.findMany({ where, include: { client: true } })
      const due = invoices.filter(inv => new Date(inv.dueDate) <= soon)
      for (const inv of due) {
        if (await wasSentRecently(inv.client.email)) {
          results.push({ status: 'skipped', sentTo: inv.client.email, message: `Skipped ${inv.client.firstName} — already sent within ${rule.dedupeDays} days` })
          continue
        }
        const subject = rule.subject || `Invoice #${inv.invoiceNumber} — Payment Reminder`
        const body = rule.body ||
          `Hi ${inv.client.firstName},\n\nThis is a friendly reminder that Invoice #${inv.invoiceNumber} for $${inv.amount} is due on ${inv.dueDate}.\n\nPlease let me know if you have any questions.\n\nBest,\nTerrence Adderley\nDesigns By Terrence Adderley\nterrenceadderley@designsbyta.com\nwww.designsbyta.com`
        await transporter.sendMail({ from: from!, to: inv.client.email, subject, text: body })
        await createNotification('email_sent', 'Invoice reminder sent', `Reminder sent to ${inv.client.firstName} ${inv.client.lastName} for Invoice #${inv.invoiceNumber}`)
        results.push({ status: 'success', sentTo: inv.client.email, message: `Reminder sent for Invoice #${inv.invoiceNumber}` })
      }
      if (due.length === 0) results.push({ status: 'skipped', message: 'No invoices due soon' })
    }

    else if (rule.type === 'payment_reminder') {
      const today = new Date().toISOString().split('T')[0]
      const where: Parameters<typeof prisma.paymentEntry.findMany>[0]['where'] = {
        status: 'pending',
        dueDate: { lte: today },
        ...(targetIds ? { clientId: { in: targetIds } } : {}),
      }
      const payments = await prisma.paymentEntry.findMany({ where, include: { client: true } })
      for (const p of payments) {
        if (await wasSentRecently(p.client.email)) {
          results.push({ status: 'skipped', sentTo: p.client.email, message: `Skipped ${p.client.firstName} — already sent within ${rule.dedupeDays} days` })
          continue
        }
        const subject = rule.subject || `Payment Reminder — ${p.label}`
        const body = rule.body ||
          `Hi ${p.client.firstName},\n\nThis is a reminder that "${p.label}" for $${p.amount} was due on ${p.dueDate}.\n\nPlease reach out if you need to make arrangements.\n\nBest,\nTerrence Adderley\nDesigns By Terrence Adderley\nterrenceadderley@designsbyta.com\nwww.designsbyta.com`
        await transporter.sendMail({ from: from!, to: p.client.email, subject, text: body })
        await createNotification('email_sent', 'Payment reminder sent', `Payment reminder sent to ${p.client.firstName} ${p.client.lastName} for "${p.label}"`)
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

import { Router } from 'express'
import { z, ZodError } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireSmtpTransporter } from '../lib/smtp.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { logger } from '../lib/logger.js'

const router = Router()
router.use(authMiddleware)

const TemplateSchema = z.object({
  name:        z.string().min(1),
  category:    z.string().min(1),
  subject:     z.string().default(''),
  htmlContent: z.string().min(1),
  cssContent:  z.string().optional().default(''),
})

function zodError(err: ZodError): string {
  return err.issues.map(e => `${String(e.path.join('.') || 'field')}: ${e.message}`).join(', ')
}

function applyVariables(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

// GET /api/admin/email-templates
router.get('/', asyncHandler(async (_req, res) => {
  const templates = await prisma.emailTemplate.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(templates)
}))

// GET /api/admin/email-templates/sent — must be before /:id to avoid conflict
router.get('/sent', asyncHandler(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, "toEmail", subject, "templateId", "templateName", status, "createdAt" FROM "SentEmailLog" ORDER BY "createdAt" DESC LIMIT 200`
  )
  res.json(rows)
}))

// GET /api/admin/email-templates/sent/:id — single sent email with body
router.get('/sent/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, "toEmail", subject, body, "templateId", "templateName", status, "createdAt" FROM "SentEmailLog" WHERE id = $1 LIMIT 1`,
    id
  ) as { id: number; toEmail: string; subject: string; body: string | null; templateId: number | null; templateName: string | null; status: string; createdAt: string }[]
  if (!rows.length) return res.status(404).json({ error: 'Not found' })
  res.json(rows[0])
}))

// GET /api/admin/email-templates/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  const template = await prisma.emailTemplate.findUnique({ where: { id } })
  if (!template) return res.status(404).json({ error: 'Not found' })
  res.json(template)
}))

// POST /api/admin/email-templates
router.post('/', asyncHandler(async (req, res) => {
  let data: z.infer<typeof TemplateSchema>
  try {
    data = TemplateSchema.parse(req.body)
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: zodError(err) })
    throw err
  }
  const template = await prisma.emailTemplate.create({ data })
  res.status(201).json(template)
}))

// PUT /api/admin/email-templates/:id
router.put('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  let data: Partial<z.infer<typeof TemplateSchema>>
  try {
    data = TemplateSchema.partial().parse(req.body)
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: zodError(err) })
    throw err
  }
  const template = await prisma.emailTemplate.update({ where: { id }, data })
  res.json(template)
}))

// DELETE /api/admin/email-templates/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  await prisma.emailTemplate.delete({ where: { id } })
  res.json({ success: true })
}))

// POST /api/admin/email-templates/:id/send
router.post('/:id/send', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  const { to, variables = {} } = req.body as { to: string; variables: Record<string, string> }

  if (!to) return res.status(400).json({ error: 'Recipient email required' })

  const template = await prisma.emailTemplate.findUnique({ where: { id } })
  if (!template) return res.status(404).json({ error: 'Template not found' })

  const { transporter, from } = await requireSmtpTransporter()

  const html = applyVariables(
    `<style>${template.cssContent ?? ''}</style>${template.htmlContent}`,
    variables,
  )
  const subject = applyVariables(template.subject, variables)

  await transporter.sendMail({ from: from ?? undefined, to, subject, html })
  logger.info(`Email template ${id} sent to ${to}`)

  // Log to sent mail history (including rendered body)
  await prisma.$executeRawUnsafe(
    `INSERT INTO "SentEmailLog" ("toEmail", subject, body, "templateId", "templateName", status, "createdAt") VALUES ($1, $2, $3, $4, $5, 'sent', NOW())`,
    to, subject, html, template.id, template.name
  ).catch(() => { /* non-fatal */ })

  res.json({ success: true })
}))

export { router as emailTemplatesRouter }

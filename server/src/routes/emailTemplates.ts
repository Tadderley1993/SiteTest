import { Router } from 'express'
import { z, ZodError } from 'zod'
import nodemailer from 'nodemailer'
import { prisma } from '../lib/prisma.js'
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

function applyVariables(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

// GET /api/admin/email-templates
router.get('/', asyncHandler(async (_req, res) => {
  const templates = await prisma.emailTemplate.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(templates)
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

  const { transporter, from } = await getTransporter()

  const html = applyVariables(
    `<style>${template.cssContent ?? ''}</style>${template.htmlContent}`,
    variables,
  )
  const subject = applyVariables(template.subject, variables)

  await transporter.sendMail({ from: from ?? undefined, to, subject, html })
  logger.info(`Email template ${id} sent to ${to}`)
  res.json({ success: true })
}))

export { router as emailTemplatesRouter }

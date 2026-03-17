import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

async function getOrCreateSettings() {
  let settings = await prisma.adminSettings.findFirst()
  if (!settings) settings = await prisma.adminSettings.create({ data: {} })
  return settings
}

function maskSettings(s: Record<string, unknown>) {
  return {
    ...s,
    paypalSecret: s.paypalSecret ? '••••••••' : null,
    hasSecret: !!s.paypalSecret,
    smtpPass: s.smtpPass ? '••••••••' : null,
    hasSmtpPass: !!s.smtpPass,
  }
}

// GET /api/admin/settings
router.get('/', async (_req, res) => {
  try {
    const s = await getOrCreateSettings()
    res.json(maskSettings(s as unknown as Record<string, unknown>))
  } catch {
    res.status(500).json({ error: 'Failed to load settings' })
  }
})

// PUT /api/admin/settings
router.put('/', async (req, res) => {
  try {
    const s = await getOrCreateSettings()
    const {
      paypalClientId, paypalSecret, paypalEnvironment, paypalMerchantId, paypalEmail,
      smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, smtpSecure,
    } = req.body
    const updateData: Record<string, unknown> = {}
    if (paypalClientId !== undefined) updateData.paypalClientId = paypalClientId
    if (paypalSecret !== undefined && paypalSecret !== '••••••••') updateData.paypalSecret = paypalSecret
    if (paypalEnvironment !== undefined) updateData.paypalEnvironment = paypalEnvironment
    if (paypalMerchantId !== undefined) updateData.paypalMerchantId = paypalMerchantId
    if (paypalEmail !== undefined) updateData.paypalEmail = paypalEmail
    if (smtpHost !== undefined) updateData.smtpHost = smtpHost || null
    if (smtpPort !== undefined) updateData.smtpPort = smtpPort || null
    if (smtpUser !== undefined) updateData.smtpUser = smtpUser || null
    if (smtpPass !== undefined && smtpPass !== '••••••••') updateData.smtpPass = smtpPass || null
    if (smtpFrom !== undefined) updateData.smtpFrom = smtpFrom || null
    if (smtpSecure !== undefined) updateData.smtpSecure = Boolean(smtpSecure)
    const updated = await prisma.adminSettings.update({ where: { id: s.id }, data: updateData })
    res.json(maskSettings(updated as unknown as Record<string, unknown>))
  } catch {
    res.status(500).json({ error: 'Failed to save settings' })
  }
})

// POST /api/admin/settings/test-smtp
router.post('/test-smtp', async (_req, res) => {
  try {
    const s = await getOrCreateSettings()
    const host = s.smtpHost || process.env.SMTP_HOST
    const port = parseInt(s.smtpPort || process.env.SMTP_PORT || '587')
    const user = s.smtpUser || process.env.SMTP_USER
    const pass = s.smtpPass || process.env.SMTP_PASS
    const secure = s.smtpSecure ?? (process.env.SMTP_SECURE === 'true')

    if (!host || !user || !pass) {
      return res.status(400).json({ success: false, error: 'SMTP not configured' })
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,       // true only for port 465 (SSL), false for 587 (STARTTLS)
      requireTLS: port !== 465,   // force STARTTLS upgrade on port 587
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    })

    await transporter.verify()
    res.json({ success: true, message: `SMTP connection to ${host}:${port} verified successfully!` })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Connection failed'
    const isTenantBlock = msg.includes('SmtpClientAuthentication is disabled')
    res.status(500).json({
      success: false,
      error: isTenantBlock
        ? 'Office 365 tenant-level SMTP AUTH is disabled. Fix: Exchange Admin Center (admin.exchange.microsoft.com) → Settings → Mail flow → Turn on "Authenticated SMTP" for your organization. Then retry.'
        : msg,
    })
  }
})

export { router as settingsRouter }

import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { getSmtpTransporter } from '../lib/smtp.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

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
      recoveryEmail1, recoveryEmail2,
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
    if (recoveryEmail1 !== undefined) updateData.recoveryEmail1 = recoveryEmail1 || null
    if (recoveryEmail2 !== undefined) updateData.recoveryEmail2 = recoveryEmail2 || null
    const updated = await prisma.adminSettings.update({ where: { id: s.id }, data: updateData })
    res.json(maskSettings(updated as unknown as Record<string, unknown>))
  } catch {
    res.status(500).json({ error: 'Failed to save settings' })
  }
})

// POST /api/admin/settings/test-smtp
router.post('/test-smtp', async (_req, res) => {
  try {
    const smtp = await getSmtpTransporter()
    if (!smtp) {
      return res.status(400).json({ success: false, error: 'SMTP not configured' })
    }
    await smtp.transporter.verify()
    res.json({ success: true, message: 'SMTP connection verified successfully!' })
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

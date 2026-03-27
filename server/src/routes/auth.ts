import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { authService } from '../services/auth.service.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authRateLimit } from '../middleware/rateLimit.js'
import { LoginSchema, RefreshSchema } from '../lib/schemas.js'
import { prisma } from '../lib/prisma.js'
import { getSmtpTransporter } from '../lib/smtp.js'

const router = Router()

// ── POST /api/auth/login ─────────────────────────────────────────
router.post(
  '/login',
  authRateLimit,
  validate(LoginSchema),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body as z.infer<typeof LoginSchema>
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown'
    const ua = req.headers['user-agent'] ?? 'unknown'

    const result = await authService.login(username, password, ip, ua)

    res.json({
      accessToken:  result.accessToken,
      refreshToken: result.refreshToken,
      username:     result.username,
      role:         result.role,
      sessionId:    result.sessionId,
    })
  }),
)

// ── POST /api/auth/refresh ───────────────────────────────────────
router.post(
  '/refresh',
  validate(RefreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as z.infer<typeof RefreshSchema>
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown'
    const ua = req.headers['user-agent'] ?? 'unknown'

    const tokens = await authService.refreshTokens(refreshToken, ip, ua)
    res.json(tokens)
  }),
)

// ── POST /api/auth/logout ────────────────────────────────────────
router.post(
  '/logout',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    if (req.sessionId && req.adminId) {
      await authService.revokeSession(req.sessionId, req.adminId)
    }
    res.json({ message: 'Logged out successfully' })
  }),
)

// ── POST /api/auth/logout-all ────────────────────────────────────
router.post(
  '/logout-all',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    await authService.revokeAllSessions(req.adminId!)
    res.json({ message: 'All sessions revoked' })
  }),
)

// ── GET /api/auth/sessions ───────────────────────────────────────
router.get(
  '/sessions',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const sessions = await authService.listSessions(req.adminId!)
    res.json(sessions)
  }),
)

// ── PUT /api/auth/account — change username / password ──────
router.put(
  '/account',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const { currentPassword, newUsername, newPassword } = req.body as {
      currentPassword: string
      newUsername?: string
      newPassword?: string
    }

    if (!currentPassword) return res.status(400).json({ error: 'Current password is required' })
    if (!newUsername && !newPassword) return res.status(400).json({ error: 'Provide a new username or password' })

    const admin = await prisma.admin.findUnique({ where: { id: req.adminId! } })
    if (!admin) return res.status(404).json({ error: 'Admin not found' })

    const valid = await bcrypt.compare(currentPassword, admin.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })

    const updates: { username?: string; passwordHash?: string } = {}
    if (newUsername && newUsername !== admin.username) {
      const taken = await prisma.admin.findUnique({ where: { username: newUsername } })
      if (taken) return res.status(409).json({ error: 'That username is already taken' })
      updates.username = newUsername
    }
    if (newPassword) {
      if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' })
      updates.passwordHash = await bcrypt.hash(newPassword, 12)
      ;(updates as Record<string, unknown>).mustChangePassword = false
    }

    if (Object.keys(updates).length === 0) return res.json({ message: 'No changes made' })

    await prisma.admin.update({ where: { id: req.adminId! }, data: updates })
    res.json({ message: 'Account updated successfully', username: updates.username ?? admin.username })
  }),
)

// ── POST /api/auth/forgot-password — public, sends temp password to recovery emails ──
router.post(
  '/forgot-password',
  authRateLimit,
  asyncHandler(async (req, res) => {
    const { username } = req.body as { username: string }
    if (!username) return res.status(400).json({ error: 'Username is required' })

    const admin = await prisma.admin.findUnique({ where: { username } })

    // Always return same message to prevent username enumeration
    const genericMsg = { message: 'If that username exists, a temporary password has been sent to your recovery emails.' }

    if (!admin || !admin.isActive) return res.json(genericMsg)

    const settings = await prisma.adminSettings.findFirst()
    const recipients = [settings?.recoveryEmail1, settings?.recoveryEmail2].filter(Boolean) as string[]
    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No recovery emails configured. Ask your admin to set them in Settings → Account.' })
    }

    const smtp = await getSmtpTransporter()
    if (!smtp) {
      return res.status(503).json({ error: 'Email not configured. Set up SMTP in Settings → Email first.' })
    }

    // Generate secure temp password like: TmpAbc123!
    const raw = randomBytes(6).toString('base64').replace(/[+/=]/g, '').slice(0, 8)
    const tempPassword = `Tmp${raw}!`
    const tempPasswordHash = await bcrypt.hash(tempPassword, 12)
    const tempPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.admin.update({
      where: { id: admin.id },
      data: { tempPasswordHash, tempPasswordExpiry, mustChangePassword: true },
    })

    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:520px;margin:40px auto;padding:24px;color:#111">
  <h2 style="font-size:20px;margin-bottom:4px">Admin Password Reset</h2>
  <p style="color:#666;font-size:14px;margin-bottom:24px">Designs By Terrence Adderley — Agency OS</p>
  <p style="font-size:15px">A temporary password was requested for <strong>${admin.username}</strong>.</p>
  <div style="background:#f3f3f3;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
    <p style="font-size:12px;color:#999;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Temporary Password</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:0;font-family:monospace">${tempPassword}</p>
  </div>
  <p style="font-size:13px;color:#666">This password expires in <strong>1 hour</strong>. You will be required to set a new password immediately after signing in.</p>
  <p style="font-size:13px;color:#999;margin-top:24px">If you did not request this, you can safely ignore this email. Your account remains secure.</p>
</body></html>`

    await smtp.transporter.sendMail({
      from: smtp.from,
      to: recipients.join(', '),
      subject: 'Agency OS — Temporary Admin Password',
      html,
    })

    res.json(genericMsg)
  }),
)

// ── DELETE /api/auth/sessions/:id ───────────────────────────────
router.delete(
  '/sessions/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const sessionId = parseInt(req.params.id)
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' })
    }
    await authService.revokeSession(sessionId, req.adminId!)
    res.json({ message: 'Session revoked' })
  }),
)

export { router as authRouter }

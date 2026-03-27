import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { authService } from '../services/auth.service.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authRateLimit } from '../middleware/rateLimit.js'
import { LoginSchema, RefreshSchema } from '../lib/schemas.js'
import { prisma } from '../lib/prisma.js'

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
    }

    if (Object.keys(updates).length === 0) return res.json({ message: 'No changes made' })

    await prisma.admin.update({ where: { id: req.adminId! }, data: updates })
    res.json({ message: 'Account updated successfully', username: updates.username ?? admin.username })
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

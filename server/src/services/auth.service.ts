import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { tokenService } from './token.service.js'
import { AppError } from '../lib/AppError.js'
import { logger } from '../lib/logger.js'

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_WINDOW_MINUTES = 15

export interface LoginResult {
  accessToken: string
  refreshToken: string
  username: string
  role: string
  sessionId: number
}

export const authService = {
  /** Check if an IP is currently locked out from too many failed attempts */
  async isLockedOut(ipAddress: string): Promise<boolean> {
    const since = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000)
    const failedCount = await prisma.loginAttempt.count({
      where: { ipAddress, success: false, createdAt: { gte: since } },
    })
    return failedCount >= MAX_LOGIN_ATTEMPTS
  },

  /** Record a login attempt (success or failure) */
  async recordAttempt(ipAddress: string, username: string, success: boolean): Promise<void> {
    await prisma.loginAttempt.create({
      data: { ipAddress, username, success },
    })
  },

  /** Login: validates credentials, creates session, returns tokens */
  async login(
    username: string,
    password: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<LoginResult> {
    // Lockout check
    if (await this.isLockedOut(ipAddress)) {
      throw AppError.unauthorized(
        `Too many failed login attempts. Try again in ${LOCKOUT_WINDOW_MINUTES} minutes.`,
        'LOCKED_OUT',
      )
    }

    const admin = await prisma.admin.findUnique({ where: { username } })

    if (!admin || !admin.isActive) {
      await this.recordAttempt(ipAddress, username, false)
      throw AppError.unauthorized('Invalid credentials')
    }

    const valid = await bcrypt.compare(password, admin.passwordHash)
    if (!valid) {
      await this.recordAttempt(ipAddress, username, false)
      logger.warn({ username, ipAddress }, 'Failed login attempt')
      throw AppError.unauthorized('Invalid credentials')
    }

    await this.recordAttempt(ipAddress, username, true)

    // Generate tokens
    const rawRefresh = tokenService.generateRefreshToken()
    const hashedRefresh = await tokenService.hashRefreshToken(rawRefresh)

    // Create session
    const session = await prisma.session.create({
      data: {
        adminId: admin.id,
        refreshToken: hashedRefresh,
        ipAddress,
        userAgent,
        expiresAt: tokenService.refreshTokenExpiry(),
      },
    })

    const accessToken = tokenService.generateAccessToken({
      adminId: admin.id,
      role: admin.role,
      sessionId: session.id,
    })

    // Update lastLoginAt
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    })

    logger.info({ adminId: admin.id, sessionId: session.id }, 'Admin logged in')

    return {
      accessToken,
      refreshToken: rawRefresh,
      username: admin.username,
      role: admin.role,
      sessionId: session.id,
    }
  },

  /** Rotate refresh token: verify old, revoke it, issue new pair */
  async refreshTokens(
    rawRefreshToken: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Find all non-revoked, non-expired sessions and check each
    const sessions = await prisma.session.findMany({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      include: { admin: true },
    })

    let matchedSession = null
    for (const s of sessions) {
      const matches = await tokenService.verifyRefreshToken(rawRefreshToken, s.refreshToken)
      if (matches) { matchedSession = s; break }
    }

    if (!matchedSession || !matchedSession.admin.isActive) {
      throw AppError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH')
    }

    // Rotate: revoke old session, create new one
    await prisma.session.update({
      where: { id: matchedSession.id },
      data: { revokedAt: new Date() },
    })

    const newRawRefresh = tokenService.generateRefreshToken()
    const newHashedRefresh = await tokenService.hashRefreshToken(newRawRefresh)

    const newSession = await prisma.session.create({
      data: {
        adminId: matchedSession.adminId,
        refreshToken: newHashedRefresh,
        ipAddress,
        userAgent,
        expiresAt: tokenService.refreshTokenExpiry(),
      },
    })

    const accessToken = tokenService.generateAccessToken({
      adminId: matchedSession.adminId,
      role: matchedSession.admin.role,
      sessionId: newSession.id,
    })

    return { accessToken, refreshToken: newRawRefresh }
  },

  /** Revoke a specific session (logout) */
  async revokeSession(sessionId: number, adminId: number): Promise<void> {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, adminId },
    })
    if (!session) throw AppError.notFound('Session not found')

    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    })
    logger.info({ adminId, sessionId }, 'Session revoked')
  },

  /** Revoke all sessions for an admin (logout everywhere) */
  async revokeAllSessions(adminId: number): Promise<void> {
    await prisma.session.updateMany({
      where: { adminId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    logger.info({ adminId }, 'All sessions revoked')
  },

  /** List active sessions for an admin */
  async listSessions(adminId: number) {
    return prisma.session.findMany({
      where: { adminId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    })
  },
}

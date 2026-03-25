import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export interface AccessTokenPayload {
  adminId: number
  role: string
  sessionId?: number
}

const JWT_SECRET = () => {
  const s = process.env.JWT_SECRET
  if (!s || s === 'your-super-secret-jwt-key-change-in-production') {
    throw new Error('JWT_SECRET is not set or is using the default insecure value')
  }
  return s
}

export const tokenService = {
  /** Issue a short-lived access token (15 min) */
  generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, JWT_SECRET(), { expiresIn: '15m' })
  },

  /** Verify and decode an access token */
  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, JWT_SECRET()) as AccessTokenPayload
  },

  /** Generate a cryptographically random refresh token (raw — store the hash) */
  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex')
  },

  /** Hash a refresh token for storage */
  async hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10)
  },

  /** Compare a raw refresh token against its stored hash */
  async verifyRefreshToken(token: string, hash: string): Promise<boolean> {
    return bcrypt.compare(token, hash)
  },

  /** Refresh token expiry — 7 days from now */
  refreshTokenExpiry(): Date {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d
  },
}

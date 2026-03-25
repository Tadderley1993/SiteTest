import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { tokenService } from '../services/token.service.js'

export interface AuthRequest extends Request {
  adminId?: number
  role?: string
  sessionId?: number
}

/**
 * requireAuth — verifies the Bearer access token.
 * Backward compatible: still sets req.adminId for all existing routes.
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = tokenService.verifyAccessToken(token)
    req.adminId = decoded.adminId
    req.role = decoded.role ?? 'ADMIN'
    req.sessionId = decoded.sessionId
    next()
  } catch {
    // Fall back to old token format (24h tokens already issued)
    try {
      const legacy = jwt.verify(
        token,
        process.env.JWT_SECRET ?? 'fallback-secret',
      ) as { adminId: number }
      req.adminId = legacy.adminId
      req.role = 'ADMIN'
      next()
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
  }
}

/**
 * requireRole — must come after authMiddleware.
 * Usage: router.get('/...', authMiddleware, requireRole('ADMIN'), handler)
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}

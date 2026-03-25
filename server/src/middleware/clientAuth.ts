import { Request, Response, NextFunction } from 'express'
import { clientAuthService } from '../services/client-auth.service.js'

export interface ClientRequest extends Request {
  clientId?: number
  clientEmail?: string
}

export function clientAuthMiddleware(req: ClientRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = clientAuthService.verifyToken(token)
    req.clientId = decoded.clientId
    req.clientEmail = decoded.email
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret'
const ACCESS_EXPIRY = '24h'

export interface ClientTokenPayload {
  clientId: number
  email: string
}

export const clientAuthService = {
  async login(email: string, password: string): Promise<{
    accessToken: string
    clientId: number
    name: string
    email: string
  }> {
    const client = await prisma.client.findFirst({
      where: { email: email.toLowerCase().trim() },
    })

    if (!client || !client.portalActive || !client.passwordHash) {
      throw AppError.unauthorized('Invalid credentials or portal not activated')
    }

    const valid = await bcrypt.compare(password, client.passwordHash)
    if (!valid) {
      throw AppError.unauthorized('Invalid credentials')
    }

    await prisma.client.update({
      where: { id: client.id },
      data: { lastLoginAt: new Date() },
    })

    const accessToken = jwt.sign(
      { clientId: client.id, email: client.email } as ClientTokenPayload,
      JWT_SECRET,
      { expiresIn: ACCESS_EXPIRY },
    )

    return {
      accessToken,
      clientId: client.id,
      name: `${client.firstName} ${client.lastName}`,
      email: client.email,
    }
  },

  verifyToken(token: string): ClientTokenPayload {
    return jwt.verify(token, JWT_SECRET) as ClientTokenPayload
  },
}

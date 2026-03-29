import Stripe from 'stripe'
import { prisma } from './prisma.js'

export interface StripeCreds {
  secretKey: string
  publishableKey: string | null
  webhookSecret: string | null
}

export async function getStripeSettings(): Promise<StripeCreds | null> {
  const settings = await prisma.adminSettings.findFirst()
  if (!settings) return null
  const s = settings as unknown as Record<string, string | null>
  if (!s.stripeSecretKey) return null
  return {
    secretKey: s.stripeSecretKey,
    publishableKey: s.stripePublishableKey ?? null,
    webhookSecret: s.stripeWebhookSecret ?? null,
  }
}

export function getStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' })
}

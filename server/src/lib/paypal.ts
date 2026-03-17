import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface PayPalCreds {
  clientId: string
  secret: string
  environment: string
}

export function getBaseUrl(environment: string): string {
  return environment === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

export async function getPayPalSettings(): Promise<PayPalCreds | null> {
  const settings = await prisma.adminSettings.findFirst()
  if (!settings?.paypalClientId || !settings?.paypalSecret) return null
  return {
    clientId: settings.paypalClientId,
    secret: settings.paypalSecret,
    environment: settings.paypalEnvironment ?? 'sandbox',
  }
}

export async function getAccessToken(
  clientId: string,
  secret: string,
  environment: string,
): Promise<string> {
  const baseUrl = getBaseUrl(environment)
  const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64')
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`PayPal auth failed: ${err}`)
  }
  const data = await response.json() as { access_token: string }
  return data.access_token
}

export async function paypalFetch(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<unknown> {
  const creds = await getPayPalSettings()
  if (!creds) throw new Error('PayPal credentials not configured')
  const token = await getAccessToken(creds.clientId, creds.secret, creds.environment)
  const baseUrl = getBaseUrl(creds.environment)
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`PayPal API error (${response.status}): ${err}`)
  }
  if (response.status === 204) return {}
  return response.json()
}

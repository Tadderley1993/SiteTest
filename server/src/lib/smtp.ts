import nodemailer from 'nodemailer'
import { prisma } from './prisma.js'

export interface SmtpTransporter {
  transporter: ReturnType<typeof nodemailer.createTransport>
  from: string
}

/**
 * Builds a nodemailer transporter from DB settings (with .env fallback).
 * Returns null if SMTP is not configured.
 */
export async function getSmtpTransporter(): Promise<SmtpTransporter | null> {
  const settings = await prisma.adminSettings.findFirst()
  const host = settings?.smtpHost || process.env.SMTP_HOST
  const port = parseInt(settings?.smtpPort || process.env.SMTP_PORT || '587')
  const user = settings?.smtpUser || process.env.SMTP_USER
  const pass = settings?.smtpPass || process.env.SMTP_PASS
  const from = settings?.smtpFrom || process.env.SMTP_FROM || user

  if (!host || !user || !pass) return null

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  })

  return { transporter, from: from! }
}

/**
 * Same as getSmtpTransporter() but throws if SMTP is not configured.
 */
export async function requireSmtpTransporter(): Promise<SmtpTransporter> {
  const result = await getSmtpTransporter()
  if (!result) throw new Error('SMTP not configured. Add credentials in Settings → Email.')
  return result
}

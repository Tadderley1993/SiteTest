import express from 'express'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { submissionsRouter } from './routes/submissions.js'
import { authRouter } from './routes/auth.js'
import { adminRouter } from './routes/admin.js'
import { clientsRouter } from './routes/clients.js'
import { documentsRouter } from './routes/documents.js'
import { proposalsRouter } from './routes/proposals.js'
import { settingsRouter } from './routes/settings.js'
import { stripeRouter } from './routes/stripe.js'
import { expensesRouter } from './routes/expenses.js'
import { financialsRouter } from './routes/financials.js'
import { analyticsRouter } from './routes/analytics.js'
import { invoicesRouter } from './routes/invoices.js'
import { signingRouter } from './routes/signing.js'
import { imageGenRouter } from './routes/imageGen.js'
import { clientAuthRouter } from './routes/client-auth.js'
import { clientPortalRouter } from './routes/client-portal.js'
import { onboardingRouter } from './routes/onboarding.js'
import { packageSelectionRouter } from './routes/package-selection.js'
import { dealsRouter } from './routes/deals.js'
import { filesRouter } from './routes/files.js'
import { automationsRouter } from './routes/automations.js'
import { emailTemplatesRouter } from './routes/emailTemplates.js'
import { tasksRouter } from './routes/tasks.js'
import { notificationsRouter } from './routes/notifications.js'
import { messagesRouter } from './routes/messages.js'
import { calendarRouter } from './routes/calendar.js'
import { generalRateLimit, submissionRateLimit } from './middleware/rateLimit.js'
import { errorHandler } from './middleware/errorHandler.js'
import { logger } from './lib/logger.js'
import { prisma } from './lib/prisma.js'

dotenv.config({ path: '../.env' })
dotenv.config() // fallback for Railway (reads .env in cwd)

// Run any missing column migrations on startup (safe — IF NOT EXISTS is a no-op)
async function runMigrations() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Invoice"
        ADD COLUMN IF NOT EXISTS "stripeInvoiceId"  TEXT,
        ADD COLUMN IF NOT EXISTS "stripeInvoiceUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "stripeStatus"     TEXT
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Submission"
        ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ClientOnboarding" (
        id                    SERIAL PRIMARY KEY,
        "clientId"            INTEGER NOT NULL UNIQUE REFERENCES "Client"(id) ON DELETE CASCADE,
        "step1Questionnaire"  BOOLEAN NOT NULL DEFAULT false,
        "step2BrandGuide"     BOOLEAN NOT NULL DEFAULT false,
        "step3Package"        BOOLEAN NOT NULL DEFAULT false,
        "step4Checkout"       BOOLEAN NOT NULL DEFAULT false,
        "completedAt"         TIMESTAMPTZ,
        "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PackageSelection" (
        id            SERIAL PRIMARY KEY,
        "clientId"    INTEGER NOT NULL UNIQUE REFERENCES "Client"(id) ON DELETE CASCADE,
        tier          TEXT NOT NULL,
        "lineItems"   TEXT NOT NULL,
        subtotal      FLOAT NOT NULL DEFAULT 0,
        total         FLOAT NOT NULL DEFAULT 0,
        notes         TEXT,
        "proposalId"  INTEGER,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DiscoveryQuestionnaire" (
        id            SERIAL PRIMARY KEY,
        "clientId"    INTEGER NOT NULL UNIQUE REFERENCES "Client"(id) ON DELETE CASCADE,
        section1      TEXT,
        section2      TEXT,
        section3      TEXT,
        section4      TEXT,
        section5      TEXT,
        section6      TEXT,
        section7      TEXT,
        section8      TEXT,
        section9      TEXT,
        section10     TEXT,
        section11     TEXT,
        section12     TEXT,
        section13     TEXT,
        status        TEXT NOT NULL DEFAULT 'not_started',
        "submittedAt" TIMESTAMPTZ,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Client"
        ADD COLUMN IF NOT EXISTS "upfrontDiscountPct" FLOAT DEFAULT 0
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "AdminCustomPackage"
        ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "AdminCustomPackage"
        ADD COLUMN IF NOT EXISTS "bundleName" TEXT
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "AdminCustomPackage"
        ADD COLUMN IF NOT EXISTS "bundleType" TEXT NOT NULL DEFAULT 'catalog'
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "AdminCustomPackage"
        ADD COLUMN IF NOT EXISTS "bundleExpiresAt" TIMESTAMPTZ
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdminCustomPackage" (
        id            SERIAL PRIMARY KEY,
        "clientId"    INTEGER NOT NULL UNIQUE REFERENCES "Client"(id) ON DELETE CASCADE,
        enabled       BOOLEAN NOT NULL DEFAULT false,
        "lineItems"   TEXT NOT NULL DEFAULT '[]',
        subtotal      FLOAT NOT NULL DEFAULT 0,
        "discountPct" FLOAT NOT NULL DEFAULT 0,
        total         FLOAT NOT NULL DEFAULT 0,
        notes         TEXT,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    logger.info('DB migrations OK')
  } catch (err) {
    logger.error({ err }, 'DB migration error')
  }
}

const app = express()
app.set('trust proxy', 1)
const PORT = process.env.PORT || 3001


// Security headers
app.use(helmet({ crossOriginResourcePolicy: false }))

// CORS
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin) {
    const allowed =
      origin === 'http://localhost:5173' ||
      origin === 'https://dta-puce.vercel.app' ||
      origin === 'https://designsbyta.com' ||
      origin === 'https://www.designsbyta.com' ||
      /\.vercel\.app$/.test(origin)
    if (allowed) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
      res.setHeader('Access-Control-Max-Age', '86400')
    }
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// General rate limit for all /api routes
app.use('/api', generalRateLimit)

// Raw body required for Stripe webhook signature verification (must be before express.json)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))

app.use(express.json({ limit: '2mb' }))

// Routes
app.use('/api/submissions', submissionRateLimit, submissionsRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/admin/clients', clientsRouter)
app.use('/api/admin', documentsRouter)
app.use('/api/admin/proposals', proposalsRouter)
app.use('/api/admin/settings', settingsRouter)
app.use('/api/stripe', stripeRouter)
app.use('/api/admin/expenses', expensesRouter)
app.use('/api/admin/financials', financialsRouter)
app.use('/api/admin/analytics', analyticsRouter)
app.use('/api/admin/invoices', invoicesRouter)

app.use('/api/admin/deals', dealsRouter)
app.use('/api/admin/files', filesRouter)
app.use('/api/admin/automations', automationsRouter)
app.use('/api/admin/email-templates', emailTemplatesRouter)
app.use('/api/admin/tasks', tasksRouter)
app.use('/api/admin/notifications', notificationsRouter)
app.use('/api/admin/messages', messagesRouter)
app.use('/api/admin/calendar', calendarRouter)
app.use('/api/sign', signingRouter)
app.use('/api/admin/image-gen', imageGenRouter)
app.use('/api/client-auth', clientAuthRouter)
app.use('/api/portal/onboarding', onboardingRouter)
app.use('/api/portal/package', packageSelectionRouter)
app.use('/api/portal', clientPortalRouter)

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

// Centralized error handler (must be last)
app.use(errorHandler)

runMigrations().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`)
  })
})

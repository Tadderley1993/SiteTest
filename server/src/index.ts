import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { submissionsRouter } from './routes/submissions.js'
import { authRouter } from './routes/auth.js'
import { adminRouter } from './routes/admin.js'
import { clientsRouter } from './routes/clients.js'
import { documentsRouter } from './routes/documents.js'
import { proposalsRouter } from './routes/proposals.js'
import { settingsRouter } from './routes/settings.js'
import { paypalRouter } from './routes/paypal.js'
import { expensesRouter } from './routes/expenses.js'
import { financialsRouter } from './routes/financials.js'
import { analyticsRouter } from './routes/analytics.js'
import { invoicesRouter } from './routes/invoices.js'
import { signingRouter } from './routes/signing.js'
import { imageGenRouter } from './routes/imageGen.js'
import { clientAuthRouter } from './routes/client-auth.js'
import { clientPortalRouter } from './routes/client-portal.js'
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

dotenv.config({ path: '../.env' })
dotenv.config() // fallback for Railway (reads .env in cwd)

const app = express()
const PORT = process.env.PORT || 3001

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://client-ruddy-one.vercel.app',
  /\.vercel\.app$/,
]

// Security headers
app.use(helmet())

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    const allowed = ALLOWED_ORIGINS.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    )
    callback(null, allowed)
  },
  credentials: true,
}))

// General rate limit for all /api routes
app.use('/api', generalRateLimit)

app.use(express.json({ limit: '2mb' }))

// Routes
app.use('/api/submissions', submissionRateLimit, submissionsRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/admin/clients', clientsRouter)
app.use('/api/admin', documentsRouter)
app.use('/api/admin/proposals', proposalsRouter)
app.use('/api/admin/settings', settingsRouter)
app.use('/api/admin/paypal', paypalRouter)
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
app.use('/api/portal', clientPortalRouter)

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})


// Centralized error handler (must be last)
app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`)
})

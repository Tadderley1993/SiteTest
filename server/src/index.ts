import express from 'express'
import cors from 'cors'
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

dotenv.config({ path: '../.env' })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json({ limit: '2mb' }))

// Routes
app.use('/api/submissions', submissionsRouter)
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

app.use('/api/sign', signingRouter)
app.use('/api/admin/image-gen', imageGenRouter)

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

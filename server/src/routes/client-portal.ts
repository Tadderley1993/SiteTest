import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { prisma } from '../lib/prisma.js'
import { clientAuthMiddleware, ClientRequest } from '../middleware/clientAuth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { createNotification } from '../lib/notify.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, '../../uploads')

const router = Router()
router.use(clientAuthMiddleware)

// GET /api/portal/me — client profile + project info
router.get('/me', asyncHandler(async (req: ClientRequest, res) => {
  const client = await prisma.client.findUnique({
    where: { id: req.clientId! },
    include: {
      projectScope: true,
      standing: true,
      tasks: { orderBy: { order: 'asc' } },
    },
  })
  if (!client) return res.status(404).json({ error: 'Client not found' })

  // Fetch journeyPhase via raw SQL (bypasses stale Prisma client)
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "journeyPhase" FROM "Client" WHERE id = $1`, req.clientId!
  ) as Array<{ journeyPhase: string | null }>
  const journeyPhase = rows[0]?.journeyPhase ?? 'discovery'

  const { passwordHash: _, ...safe } = client
  res.json({ ...safe, journeyPhase })
}))

// GET /api/portal/invoices — only show sent/paid/cancelled (never drafts)
router.get('/invoices', asyncHandler(async (req: ClientRequest, res) => {
  const invoices = await prisma.invoice.findMany({
    where: {
      clientId: req.clientId!,
      status: { in: ['sent', 'paid', 'cancelled'] },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(invoices)
}))

// GET /api/portal/proposals — only show sent/accepted/rejected (not drafts)
router.get('/proposals', asyncHandler(async (req: ClientRequest, res) => {
  const proposals = await prisma.proposal.findMany({
    where: {
      clientId: req.clientId!,
      status: { in: ['sent', 'accepted', 'rejected', 'signed'] },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(proposals)
}))

// GET /api/portal/files
router.get('/files', asyncHandler(async (req: ClientRequest, res) => {
  const files = await prisma.clientDocument.findMany({
    where: { clientId: req.clientId! },
    orderBy: { createdAt: 'desc' },
  })
  res.json(files)
}))

// GET /api/portal/files/:docId/download — client-authenticated file download
router.get('/files/:docId/download', asyncHandler(async (req: ClientRequest, res) => {
  const doc = await prisma.clientDocument.findUnique({
    where: { id: parseInt(req.params.docId) },
  })
  if (!doc) return res.status(404).json({ error: 'File not found' })
  // Ensure the file belongs to the authenticated client
  if (doc.clientId !== req.clientId!) return res.status(403).json({ error: 'Access denied' })
  const filePath = path.join(uploadsDir, doc.storedName)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not on disk' })
  res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`)
  res.setHeader('Content-Type', doc.mimeType)
  fs.createReadStream(filePath).pipe(res)
}))

// GET /api/portal/messages — client's full thread
router.get('/messages', asyncHandler(async (req: ClientRequest, res) => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, "clientId", "fromAdmin", body, read, "createdAt"
     FROM "Message" WHERE "clientId" = $1 ORDER BY "createdAt" ASC`,
    req.clientId!,
  )
  // Mark admin messages as read by client
  await prisma.$executeRawUnsafe(
    `UPDATE "Message" SET read = true WHERE "clientId" = $1 AND "fromAdmin" = true AND read = false`,
    req.clientId!,
  )
  res.json(rows)
}))

// POST /api/portal/messages — client sends a message to admin
router.post('/messages', asyncHandler(async (req: ClientRequest, res) => {
  const { body } = req.body as { body: string }
  if (!body?.trim()) return res.status(400).json({ error: 'Message body required' })

  const rows = await prisma.$queryRawUnsafe(
    `INSERT INTO "Message" ("clientId", "fromAdmin", body, read, "createdAt")
     VALUES ($1, false, $2, false, NOW()) RETURNING id, "clientId", "fromAdmin", body, read, "createdAt"`,
    req.clientId!, body.trim(),
  ) as Array<{ clientId: number }>

  // Look up client name for notification
  const clients = await prisma.$queryRawUnsafe(
    `SELECT "firstName", "lastName" FROM "Client" WHERE id = $1`, req.clientId!,
  ) as Array<{ firstName: string; lastName: string }>
  const clientName = clients[0] ? `${clients[0].firstName} ${clients[0].lastName}` : `Client #${req.clientId}`

  await createNotification(
    'message',
    'New message from client',
    `${clientName} sent you a message`,
  )

  res.json((rows as unknown[])[0])
}))

export { router as clientPortalRouter }

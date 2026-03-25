import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { clientAuthMiddleware, ClientRequest } from '../middleware/clientAuth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

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
  // Don't send passwordHash
  const { passwordHash: _, ...safe } = client
  res.json(safe)
}))

// GET /api/portal/invoices
router.get('/invoices', asyncHandler(async (req: ClientRequest, res) => {
  const invoices = await prisma.invoice.findMany({
    where: { clientId: req.clientId! },
    orderBy: { createdAt: 'desc' },
  })
  res.json(invoices)
}))

// GET /api/portal/proposals
router.get('/proposals', asyncHandler(async (req: ClientRequest, res) => {
  const proposals = await prisma.proposal.findMany({
    where: { clientId: req.clientId! },
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

export { router as clientPortalRouter }

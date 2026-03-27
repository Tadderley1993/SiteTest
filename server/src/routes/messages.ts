import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()
router.use(authMiddleware)

type MessageRow = {
  id: number
  clientId: number
  fromAdmin: boolean
  body: string
  read: boolean
  createdAt: Date
}

// GET /api/admin/messages — all client threads (latest message + unread count per client)
router.get('/', asyncHandler(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      c.id AS "clientId",
      c."firstName",
      c."lastName",
      c.email,
      c.organization,
      m.body AS "lastBody",
      m."fromAdmin" AS "lastFromAdmin",
      m."createdAt" AS "lastAt",
      (SELECT COUNT(*) FROM "Message" u WHERE u."clientId" = c.id AND u."fromAdmin" = false AND u.read = false)::int AS "unreadCount"
    FROM "Client" c
    INNER JOIN "Message" m ON m.id = (
      SELECT id FROM "Message" WHERE "clientId" = c.id ORDER BY "createdAt" DESC LIMIT 1
    )
    ORDER BY m."createdAt" DESC
  `) as Array<{
    clientId: number
    firstName: string
    lastName: string
    email: string
    organization: string | null
    lastBody: string
    lastFromAdmin: boolean
    lastAt: Date
    unreadCount: number
  }>
  res.json(rows)
}))

// GET /api/admin/messages/:clientId — full thread for one client
router.get('/:clientId', asyncHandler(async (req, res) => {
  const clientId = parseInt(req.params.clientId)
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, "clientId", "fromAdmin", body, read, "createdAt"
     FROM "Message" WHERE "clientId" = $1 ORDER BY "createdAt" ASC`,
    clientId,
  ) as MessageRow[]
  // Mark all client→admin messages as read by admin
  await prisma.$executeRawUnsafe(
    `UPDATE "Message" SET read = true WHERE "clientId" = $1 AND "fromAdmin" = false AND read = false`,
    clientId,
  )
  res.json(rows)
}))

// POST /api/admin/messages/:clientId — admin sends a message to client
router.post('/:clientId', asyncHandler(async (req, res) => {
  const clientId = parseInt(req.params.clientId)
  const { body } = req.body as { body: string }
  if (!body?.trim()) return res.status(400).json({ error: 'Message body required' })

  const rows = await prisma.$queryRawUnsafe(
    `INSERT INTO "Message" ("clientId", "fromAdmin", body, read, "createdAt")
     VALUES ($1, true, $2, false, NOW()) RETURNING id, "clientId", "fromAdmin", body, read, "createdAt"`,
    clientId, body.trim(),
  ) as MessageRow[]
  res.json(rows[0])
}))

// GET /api/admin/messages/:clientId/unread-count — unread client messages
router.get('/:clientId/unread-count', asyncHandler(async (req, res) => {
  const clientId = parseInt(req.params.clientId)
  const rows = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS count FROM "Message" WHERE "clientId" = $1 AND "fromAdmin" = false AND read = false`,
    clientId,
  ) as [{ count: string }]
  res.json({ count: parseInt(rows[0]?.count ?? '0', 10) })
}))

export { router as messagesRouter }

import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()
router.use(authMiddleware)

type NotificationRow = {
  id: number
  type: string
  title: string
  body: string
  read: boolean
  createdAt: Date
}

// GET /api/admin/notifications — newest 60
router.get('/', asyncHandler(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, type, title, body, read, "createdAt" FROM "Notification" ORDER BY "createdAt" DESC LIMIT 60`
  ) as NotificationRow[]
  res.json(rows)
}))

// GET /api/admin/notifications/unread-count
router.get('/unread-count', asyncHandler(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS count FROM "Notification" WHERE read = false`
  ) as [{ count: string }]
  res.json({ count: parseInt(rows[0]?.count ?? '0', 10) })
}))

// PATCH /api/admin/notifications/read-all — mark all as read
router.patch('/read-all', asyncHandler(async (_req, res) => {
  await prisma.$executeRawUnsafe(`UPDATE "Notification" SET read = true WHERE read = false`)
  res.json({ success: true })
}))

// PATCH /api/admin/notifications/:id/read — mark one read
router.patch('/:id/read', asyncHandler(async (req, res) => {
  await prisma.$executeRawUnsafe(
    `UPDATE "Notification" SET read = true WHERE id = $1`,
    parseInt(req.params.id),
  )
  res.json({ success: true })
}))

// DELETE /api/admin/notifications/clear — delete all read notifications
router.delete('/clear', asyncHandler(async (_req, res) => {
  await prisma.$executeRawUnsafe(`DELETE FROM "Notification" WHERE read = true`)
  res.json({ success: true })
}))

export { router as notificationsRouter }

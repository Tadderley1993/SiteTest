import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

// GET /api/admin/files — all documents across all clients
router.get('/', authMiddleware, asyncHandler(async (_req, res) => {
  const docs = await prisma.clientDocument.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, organization: true } },
    },
  })

  const totalSize = docs.reduce((sum, d) => sum + d.size, 0)
  const portalVisible = docs.filter(d => d.docType !== 'internal').length

  res.json({
    files: docs,
    stats: {
      total: docs.length,
      portalVisible,
      totalSize,
    },
  })
}))

// DELETE /api/admin/files/:id — delete any document by id
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  const doc = await prisma.clientDocument.findUnique({ where: { id } })
  if (!doc) return res.status(404).json({ error: 'File not found' })

  // Delete physical file
  const { default: fs } = await import('fs')
  const { default: path } = await import('path')
  const filePath = path.join(process.cwd(), 'uploads', doc.storedName)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  await prisma.clientDocument.delete({ where: { id } })
  res.json({ message: 'File deleted' })
}))

export { router as filesRouter }

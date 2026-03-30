import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { logger } from '../lib/logger.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

// All admin routes require authentication
router.use(authMiddleware)

// GET /api/admin/submissions - List active (non-deleted) submissions
router.get('/submissions', async (_req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })
    const parsed = submissions.map(s => ({ ...s, services: JSON.parse(s.services) }))
    res.json(parsed)
  } catch (error) {
    logger.error({ err: error }, 'Error fetching submissions')
    res.status(500).json({ error: 'Failed to fetch submissions' })
  }
})

// GET /api/admin/submissions/trash - List trashed submissions (must be before /:id)
router.get('/submissions/trash', async (_req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    // Auto-purge items older than 7 days
    await prisma.submission.deleteMany({ where: { deletedAt: { lt: sevenDaysAgo } } })
    const trashed = await prisma.submission.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    })
    const parsed = trashed.map(s => ({ ...s, services: JSON.parse(s.services) }))
    res.json(parsed)
  } catch (error) {
    logger.error({ err: error }, 'Error fetching trash')
    res.status(500).json({ error: 'Failed to fetch trash' })
  }
})

// POST /api/admin/submissions/trash/:id/restore - Restore from trash
router.post('/submissions/trash/:id/restore', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    await prisma.submission.update({ where: { id }, data: { deletedAt: null } })
    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error restoring submission')
    res.status(500).json({ error: 'Failed to restore submission' })
  }
})

// DELETE /api/admin/submissions/trash/:id - Permanently delete from trash
router.delete('/submissions/trash/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    await prisma.client.updateMany({ where: { submissionId: id }, data: { submissionId: null } })
    await prisma.submission.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error permanently deleting submission')
    res.status(500).json({ error: 'Failed to permanently delete submission' })
  }
})

// GET /api/admin/submissions/:id - Get single submission
router.get('/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params
    const submission = await prisma.submission.findUnique({ where: { id: parseInt(id) } })
    if (!submission) return res.status(404).json({ error: 'Submission not found' })
    res.json({ ...submission, services: JSON.parse(submission.services) })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching submission')
    res.status(500).json({ error: 'Failed to fetch submission' })
  }
})

// DELETE /api/admin/submissions/:id - Soft delete (move to trash)
router.delete('/submissions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    await prisma.submission.update({ where: { id }, data: { deletedAt: new Date() } })
    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error deleting submission')
    res.status(500).json({ error: 'Failed to delete submission' })
  }
})

export { router as adminRouter }

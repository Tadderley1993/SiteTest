import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

const router = Router()

// All admin routes require authentication
router.use(authMiddleware)

// GET /api/admin/submissions - List all submissions
router.get('/submissions', async (_req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Parse services JSON string back to array
    const parsed = submissions.map(s => ({
      ...s,
      services: JSON.parse(s.services)
    }))

    res.json(parsed)
  } catch (error) {
    console.error('Error fetching submissions:', error)
    res.status(500).json({ error: 'Failed to fetch submissions' })
  }
})

// GET /api/admin/submissions/:id - Get single submission
router.get('/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params

    const submission = await prisma.submission.findUnique({
      where: { id: parseInt(id) },
    })

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    res.json({
      ...submission,
      services: JSON.parse(submission.services)
    })
  } catch (error) {
    console.error('Error fetching submission:', error)
    res.status(500).json({ error: 'Failed to fetch submission' })
  }
})

// DELETE /api/admin/submissions/:id - Delete a submission
router.delete('/submissions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    // If a client is linked to this submission, unlink it first
    await prisma.client.updateMany({ where: { submissionId: id }, data: { submissionId: null } })
    await prisma.submission.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting submission:', error)
    res.status(500).json({ error: 'Failed to delete submission' })
  }
})

export { router as adminRouter }

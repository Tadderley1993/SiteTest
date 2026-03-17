import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

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

export { router as adminRouter }

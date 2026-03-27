import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { logger } from '../lib/logger.js'
import { createNotification } from '../lib/notify.js'

const router = Router()

// POST /api/submissions - Create a new submission
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      clientType,
      services,
      description,
      teamSize,
      budget,
      timelineMonths,
      timelineWeeks,
      timelineDays,
    } = req.body

    // Basic validation
    if (!firstName || !lastName || !email || !phone || !clientType || !services || !description || !teamSize || !budget) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const submission = await prisma.submission.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        clientType,
        services: JSON.stringify(services),
        description,
        teamSize,
        budget,
        timelineMonths: timelineMonths ? parseInt(timelineMonths) : null,
        timelineWeeks: timelineWeeks ? parseInt(timelineWeeks) : null,
        timelineDays: timelineDays ? parseInt(timelineDays) : null,
      },
    })

    await createNotification(
      'submission',
      'New submission received',
      `${firstName} ${lastName} submitted a project request (${clientType})`,
    )
    res.status(201).json(submission)
  } catch (error) {
    console.error('Error creating submission:', error)
    res.status(500).json({ error: 'Failed to create submission' })
  }
})

export { router as submissionsRouter }

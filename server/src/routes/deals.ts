import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const DealSchema = z.object({
  title:        z.string().min(1),
  company:      z.string().optional(),
  contactName:  z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  value:        z.coerce.number().min(0).default(0),
  stage:        z.enum(['lead', 'qualified', 'proposal_sent', 'won', 'lost']).default('lead'),
  notes:        z.string().optional(),
  clientId:     z.coerce.number().int().positive().optional().nullable(),
})

const StageSchema = z.object({
  stage: z.enum(['lead', 'qualified', 'proposal_sent', 'won', 'lost']),
})

// GET /api/admin/deals
router.get('/', authMiddleware, asyncHandler(async (_req, res) => {
  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: 'desc' },
    include: { client: { select: { id: true, firstName: true, lastName: true } } },
  })
  res.json(deals)
}))

// POST /api/admin/deals
router.post('/', authMiddleware, validate(DealSchema), asyncHandler(async (req, res) => {
  const deal = await prisma.deal.create({ data: req.body })
  res.status(201).json(deal)
}))

// PUT /api/admin/deals/:id
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  const data = DealSchema.partial().parse(req.body)
  const deal = await prisma.deal.update({ where: { id }, data })
  res.json(deal)
}))

// PATCH /api/admin/deals/:id/stage — move between columns
router.patch('/:id/stage', authMiddleware, validate(StageSchema), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  const deal = await prisma.deal.update({ where: { id }, data: { stage: req.body.stage } })
  res.json(deal)
}))

// DELETE /api/admin/deals/:id
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  await prisma.deal.delete({ where: { id } })
  res.json({ message: 'Deal deleted' })
}))

export { router as dealsRouter }

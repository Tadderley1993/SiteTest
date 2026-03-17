import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

const router = Router()
const prisma = new PrismaClient()

// GET /api/sign/:token — public, returns proposal data for client viewing
router.get('/:token', async (req, res) => {
  try {
    const proposal = await prisma.proposal.findUnique({ where: { signingToken: req.params.token } })
    if (!proposal) return res.status(404).json({ error: 'Signing link not found or has expired.' })

    res.json({
      proposalNumber: proposal.proposalNumber,
      title: proposal.title,
      clientName: proposal.clientName,
      clientEmail: proposal.clientEmail,
      clientCompany: proposal.clientCompany,
      clientAddress: proposal.clientAddress,
      date: proposal.date,
      validUntil: proposal.validUntil,
      executiveSummary: proposal.executiveSummary,
      clientNeeds: proposal.clientNeeds,
      proposedSolution: proposal.proposedSolution,
      projectScope: proposal.projectScope,
      deliverables: proposal.deliverables,
      timeline: proposal.timeline,
      paymentTerms: proposal.paymentTerms,
      termsConditions: proposal.termsConditions,
      lineItems: proposal.lineItems,
      subtotal: proposal.subtotal,
      discountType: proposal.discountType,
      discountValue: proposal.discountValue,
      taxRate: proposal.taxRate,
      total: proposal.total,
      currency: proposal.currency,
      clientSignedAt: proposal.clientSignedAt,
    })
  } catch {
    res.status(500).json({ error: 'Failed to load proposal.' })
  }
})

// POST /api/sign/:token — public, saves client signature
router.post('/:token', async (req, res) => {
  try {
    const proposal = await prisma.proposal.findUnique({ where: { signingToken: req.params.token } })
    if (!proposal) return res.status(404).json({ error: 'Signing link not found.' })
    if (proposal.clientSignedAt) return res.status(409).json({ error: 'This proposal has already been signed.' })

    const { signature } = req.body
    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ error: 'Signature data is required.' })
    }

    const signedAt = new Date()
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { clientSignature: signature, clientSignedAt: signedAt, status: 'accepted' },
    })

    res.json({ success: true, signedAt })
  } catch {
    res.status(500).json({ error: 'Failed to save signature.' })
  }
})

// POST /api/sign/generate/:id — admin, generate or return existing signing token
router.post('/generate/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const existing = await prisma.proposal.findUnique({ where: { id }, select: { signingToken: true } })
    if (!existing) return res.status(404).json({ error: 'Proposal not found.' })

    const token = existing.signingToken ?? randomBytes(32).toString('hex')
    if (!existing.signingToken) {
      await prisma.proposal.update({ where: { id }, data: { signingToken: token } })
    }

    res.json({ token })
  } catch {
    res.status(500).json({ error: 'Failed to generate signing link.' })
  }
})

export { router as signingRouter }

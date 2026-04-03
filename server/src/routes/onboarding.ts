import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { clientAuthMiddleware, ClientRequest } from '../middleware/clientAuth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { createNotification } from '../lib/notify.js'

const router = Router()
router.use(clientAuthMiddleware)

const ALLOWED_CLIENT_STEPS = ['step2BrandGuide', 'step4Checkout'] as const

// GET /api/portal/onboarding — get or create onboarding row, auto-sync step1 from questionnaire
router.get('/', asyncHandler(async (req: ClientRequest, res) => {
  const clientId = req.clientId!

  // Upsert onboarding row
  await prisma.$executeRawUnsafe(`
    INSERT INTO "ClientOnboarding" ("clientId", "createdAt", "updatedAt")
    VALUES ($1, NOW(), NOW())
    ON CONFLICT ("clientId") DO NOTHING
  `, clientId)

  // Auto-sync step1 if questionnaire is submitted
  const qRows = await prisma.$queryRawUnsafe(
    `SELECT status FROM "DiscoveryQuestionnaire" WHERE "clientId" = $1`,
    clientId,
  ) as Array<{ status: string }>
  if (qRows[0]?.status === 'submitted') {
    await prisma.$executeRawUnsafe(
      `UPDATE "ClientOnboarding" SET "step1Questionnaire" = true, "updatedAt" = NOW() WHERE "clientId" = $1`,
      clientId,
    )
  }

  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM "ClientOnboarding" WHERE "clientId" = $1`,
    clientId,
  ) as Array<Record<string, unknown>>
  res.json(rows[0])
}))

// PUT /api/portal/onboarding/step/:step — client marks step2 or step4 complete
router.put('/step/:step', asyncHandler(async (req: ClientRequest, res) => {
  const clientId = req.clientId!
  const step = req.params.step as string

  if (!(ALLOWED_CLIENT_STEPS as readonly string[]).includes(step)) {
    return res.status(400).json({ error: 'Invalid step' })
  }

  await prisma.$executeRawUnsafe(
    `UPDATE "ClientOnboarding" SET "${step}" = true, "updatedAt" = NOW() WHERE "clientId" = $1`,
    clientId,
  )

  // When step4 completes: advance journeyPhase → 'planning' and set completedAt
  if (step === 'step4Checkout') {
    await prisma.$executeRawUnsafe(
      `UPDATE "Client" SET "journeyPhase" = 'planning', "updatedAt" = NOW() WHERE id = $1`,
      clientId,
    )
    await prisma.$executeRawUnsafe(
      `UPDATE "ClientOnboarding" SET "completedAt" = NOW(), "updatedAt" = NOW() WHERE "clientId" = $1`,
      clientId,
    )

    // Notify admin
    const clients = await prisma.$queryRawUnsafe(
      `SELECT "firstName", "lastName" FROM "Client" WHERE id = $1`, clientId,
    ) as Array<{ firstName: string; lastName: string }>
    const name = clients[0] ? `${clients[0].firstName} ${clients[0].lastName}` : `Client #${clientId}`
    await createNotification('success', 'Onboarding complete', `${name} completed the onboarding funnel`)
  }

  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM "ClientOnboarding" WHERE "clientId" = $1`,
    clientId,
  ) as Array<Record<string, unknown>>
  res.json(rows[0])
}))

export { router as onboardingRouter }

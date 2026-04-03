import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { logger } from '../lib/logger.js'
import bcrypt from 'bcryptjs'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

// GET /api/admin/clients
router.get('/', async (_req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: { projectScope: true, tasks: { orderBy: [{ column: 'asc' }, { order: 'asc' }] } },
    })
    // Overlay taskOwner from raw SQL (stale Prisma client omits it)
    const rawTasks = await prisma.$queryRawUnsafe(
      `SELECT id, "taskOwner" FROM "KanbanTask"`
    ) as Array<{ id: number; taskOwner: string }>
    const ownerMap = Object.fromEntries(rawTasks.map(t => [t.id, t.taskOwner]))
    const patched = clients.map(c => ({
      ...c,
      tasks: c.tasks.map(t => ({ ...t, taskOwner: ownerMap[t.id] ?? 'client' })),
    }))
    res.json(patched)
  } catch (error) {
    logger.error({ error }, 'Error fetching clients')
    res.status(500).json({ error: 'Failed to fetch clients' })
  }
})

// POST /api/admin/clients
router.post('/', async (req, res) => {
  try {
    const { submissionId, ...data } = req.body
    const client = await prisma.client.create({
      data: {
        ...data,
        ...(submissionId ? { submissionId: parseInt(submissionId) } : {}),
      },
      include: {
        projectScope: true,
        tasks: true,
      },
    })
    res.json(client)
  } catch (error) {
    logger.error({ err: error }, 'Error creating client')
    res.status(500).json({ error: 'Failed to create client' })
  }
})

// GET /api/admin/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const client = await prisma.client.findUnique({
      where: { id },
      include: { projectScope: true, tasks: { orderBy: [{ column: 'asc' }, { order: 'asc' }] } },
    })
    if (!client) return res.status(404).json({ error: 'Client not found' })
    // Overlay taskOwner from raw SQL (stale Prisma client omits it)
    const rawTasks = await prisma.$queryRawUnsafe(
      `SELECT id, "taskOwner" FROM "KanbanTask" WHERE "clientId" = $1`, id
    ) as Array<{ id: number; taskOwner: string }>
    const ownerMap = Object.fromEntries(rawTasks.map(t => [t.id, t.taskOwner]))
    // Overlay portalPasswordPlain from raw SQL
    const rawClient = await prisma.$queryRawUnsafe(
      `SELECT "portalPasswordPlain" FROM "Client" WHERE id = $1`, id
    ) as Array<{ portalPasswordPlain: string | null }>
    const portalPasswordPlain = rawClient[0]?.portalPasswordPlain ?? null
    res.json({
      ...client,
      portalPasswordPlain,
      tasks: client.tasks.map(t => ({ ...t, taskOwner: ownerMap[t.id] ?? 'client' })),
    })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching client')
    res.status(500).json({ error: 'Failed to fetch client' })
  }
})

// PUT /api/admin/clients/:id
router.put('/:id', async (req, res) => {
  try {
    const client = await prisma.client.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
      include: {
        projectScope: true,
        tasks: true,
      },
    })
    res.json(client)
  } catch (error) {
    logger.error({ err: error }, 'Error updating client')
    res.status(500).json({ error: 'Failed to update client' })
  }
})

// PUT /api/admin/clients/:id/journey — update journey phase via raw SQL (bypasses stale client)
router.put('/:id/journey', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { journeyPhase } = req.body as { journeyPhase: string }
    if (!journeyPhase) return res.status(400).json({ error: 'journeyPhase required' })
    await prisma.$executeRawUnsafe(
      `UPDATE "Client" SET "journeyPhase" = $1, "updatedAt" = NOW() WHERE id = $2`,
      journeyPhase, id
    )
    const rows = await prisma.$queryRawUnsafe(
      `SELECT "journeyPhase" FROM "Client" WHERE id = $1`, id
    ) as Array<{ journeyPhase: string }>
    res.json({ journeyPhase: rows[0]?.journeyPhase })
  } catch (error) {
    logger.error({ err: error }, 'Error updating journey phase')
    res.status(500).json({ error: 'Failed to update journey phase' })
  }
})

// DELETE /api/admin/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error deleting client')
    res.status(500).json({ error: 'Failed to delete client' })
  }
})

// PUT /api/admin/clients/:id/scope
router.put('/:id/scope', async (req, res) => {
  try {
    const clientId = parseInt(req.params.id)
    const scope = await prisma.projectScope.upsert({
      where: { clientId },
      create: { clientId, ...req.body },
      update: req.body,
    })
    res.json(scope)
  } catch (error) {
    logger.error({ err: error }, 'Error updating scope')
    res.status(500).json({ error: 'Failed to update project scope' })
  }
})

// POST /api/admin/clients/:id/tasks — always client-owned, raw SQL bypasses stale client
router.post('/:id/tasks', async (req, res) => {
  try {
    const clientId = parseInt(req.params.id)
    const { title, description, column = 'backlog', priority = 'medium', dueDate, order = 0 } = req.body
    const rows = await prisma.$queryRawUnsafe(`
      INSERT INTO "KanbanTask" ("clientId", title, description, "column", priority, "dueDate", "order", "taskOwner", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'client', NOW(), NOW())
      RETURNING id, "clientId", title, description, "column", priority, "dueDate", "order", "taskOwner", "createdAt", "updatedAt"
    `, clientId, title, description ?? null, column, priority, dueDate ?? null, order) as unknown[]
    res.json((rows as unknown[])[0])
  } catch (error) {
    logger.error({ err: error }, 'Error creating task')
    res.status(500).json({ error: 'Failed to create task' })
  }
})

// PUT /api/admin/clients/:id/tasks/:taskId — raw SQL to handle taskOwner safely
router.put('/:id/tasks/:taskId', async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId)
    const { title, description, column, priority, dueDate, order } = req.body
    const sets: string[] = []
    const params: unknown[] = []
    let idx = 1
    if (title !== undefined)       { sets.push(`title = $${idx++}`);       params.push(title) }
    if (description !== undefined) { sets.push(`description = $${idx++}`); params.push(description) }
    if (column !== undefined)      { sets.push(`"column" = $${idx++}`);     params.push(column) }
    if (priority !== undefined)    { sets.push(`priority = $${idx++}`);    params.push(priority) }
    if (dueDate !== undefined)     { sets.push(`"dueDate" = $${idx++}`);   params.push(dueDate) }
    if (order !== undefined)       { sets.push(`"order" = $${idx++}`);     params.push(order) }
    sets.push(`"updatedAt" = NOW()`)
    params.push(taskId)
    const rows = await prisma.$queryRawUnsafe(`
      UPDATE "KanbanTask" SET ${sets.join(', ')} WHERE id = $${idx}
      RETURNING id, "clientId", title, description, "column", priority, "dueDate", "order", "taskOwner", "createdAt", "updatedAt"
    `, ...params) as unknown[]
    res.json((rows as unknown[])[0])
  } catch (error) {
    logger.error({ err: error }, 'Error updating task')
    res.status(500).json({ error: 'Failed to update task' })
  }
})

// DELETE /api/admin/clients/:id/tasks/:taskId
router.delete('/:id/tasks/:taskId', async (req, res) => {
  try {
    await prisma.kanbanTask.delete({ where: { id: parseInt(req.params.taskId) } })
    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error deleting task')
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

// ── STANDING ──────────────────────────────────────────────────────────────────

// GET /api/admin/clients/:id/standing
router.get('/:id/standing', async (req, res) => {
  try {
    const clientId = parseInt(req.params.id)
    const [standing, payments, invoices] = await Promise.all([
      prisma.clientStanding.findUnique({ where: { clientId } }),
      prisma.paymentEntry.findMany({ where: { clientId }, orderBy: [{ order: 'asc' }, { dueDate: 'asc' }] }),
      prisma.invoice.findMany({ where: { clientId }, orderBy: { issuedDate: 'desc' } }),
    ])
    res.json({ standing, payments, invoices })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching standing')
    res.status(500).json({ error: 'Failed to fetch standing' })
  }
})

// PUT /api/admin/clients/:id/standing
router.put('/:id/standing', async (req, res) => {
  try {
    const clientId = parseInt(req.params.id)
    const standing = await prisma.clientStanding.upsert({
      where: { clientId },
      create: { clientId, ...req.body },
      update: req.body,
    })
    res.json(standing)
  } catch (error) {
    logger.error({ err: error }, 'Error updating standing')
    res.status(500).json({ error: 'Failed to update standing' })
  }
})

// POST /api/admin/clients/:id/payments
router.post('/:id/payments', async (req, res) => {
  try {
    const clientId = parseInt(req.params.id)
    const payment = await prisma.paymentEntry.create({ data: { clientId, ...req.body } })
    res.json(payment)
  } catch (error) {
    logger.error({ err: error }, 'Error creating payment')
    res.status(500).json({ error: 'Failed to create payment' })
  }
})

// PUT /api/admin/clients/:id/payments/:paymentId
router.put('/:id/payments/:paymentId', async (req, res) => {
  try {
    const payment = await prisma.paymentEntry.update({
      where: { id: parseInt(req.params.paymentId) },
      data: req.body,
    })
    res.json(payment)
  } catch (error) {
    logger.error({ err: error }, 'Error updating payment')
    res.status(500).json({ error: 'Failed to update payment' })
  }
})

// DELETE /api/admin/clients/:id/payments/:paymentId
router.delete('/:id/payments/:paymentId', async (req, res) => {
  try {
    await prisma.paymentEntry.delete({ where: { id: parseInt(req.params.paymentId) } })
    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error deleting payment')
    res.status(500).json({ error: 'Failed to delete payment' })
  }
})

// POST /api/admin/clients/:id/invoices
router.post('/:id/invoices', async (req, res) => {
  try {
    const clientId = parseInt(req.params.id)
    const invoice = await prisma.invoice.create({ data: { clientId, ...req.body } })
    res.json(invoice)
  } catch (error) {
    logger.error({ err: error }, 'Error creating invoice')
    res.status(500).json({ error: 'Failed to create invoice' })
  }
})

// PUT /api/admin/clients/:id/invoices/:invoiceId
router.put('/:id/invoices/:invoiceId', async (req, res) => {
  try {
    const invoice = await prisma.invoice.update({
      where: { id: parseInt(req.params.invoiceId) },
      data: req.body,
    })
    res.json(invoice)
  } catch (error) {
    logger.error({ err: error }, 'Error updating invoice')
    res.status(500).json({ error: 'Failed to update invoice' })
  }
})

// DELETE /api/admin/clients/:id/invoices/:invoiceId
router.delete('/:id/invoices/:invoiceId', async (req, res) => {
  try {
    await prisma.invoice.delete({ where: { id: parseInt(req.params.invoiceId) } })
    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error deleting invoice')
    res.status(500).json({ error: 'Failed to delete invoice' })
  }
})

// POST /api/admin/clients/:id/set-portal-password
router.post('/:id/set-portal-password', authMiddleware, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id)
    const { password } = req.body as { password: string }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    const hash = await bcrypt.hash(password, 10)
    await prisma.$executeRawUnsafe(
      `UPDATE "Client" SET "passwordHash"=$1, "portalPasswordPlain"=$2, "portalActive"=true, "updatedAt"=NOW() WHERE id=$3`,
      hash, password, clientId,
    )
    // Auto-create ClientOnboarding row (safe to call on re-sets too)
    await prisma.$executeRawUnsafe(`
      INSERT INTO "ClientOnboarding" ("clientId","createdAt","updatedAt")
      VALUES ($1, NOW(), NOW())
      ON CONFLICT ("clientId") DO NOTHING
    `, clientId)
    res.json({ message: 'Portal password set', clientId, portalActive: true })
  } catch (error) {
    logger.error({ err: error }, 'Error setting portal password')
    res.status(500).json({ error: 'Failed to set portal password' })
  }
})

// GET /api/admin/clients/:id/questionnaire
router.get('/:id/questionnaire', async (req, res) => {
  const clientId = parseInt(req.params.id)
  try {
    const [q, client] = await Promise.all([
      prisma.discoveryQuestionnaire.findUnique({ where: { clientId } }),
      prisma.client.findUnique({ where: { id: clientId }, include: { submission: true } }),
    ])
    let submissionServices: string[] = []
    if (client?.submission?.services) {
      try { submissionServices = JSON.parse(client.submission.services) } catch { /* ignore */ }
    }
    res.json(q ? { ...q, submissionServices } : null)
  } catch (error) {
    logger.error({ error }, 'Error fetching questionnaire')
    res.status(500).json({ error: 'Failed to fetch questionnaire' })
  }
})

// GET /api/admin/clients/:id/onboarding — admin view of onboarding progress + package
router.get('/:id/onboarding', authMiddleware, async (req, res) => {
  const clientId = parseInt(req.params.id)
  try {
    const [onboarding, pkg] = await Promise.all([
      prisma.$queryRawUnsafe(`SELECT * FROM "ClientOnboarding" WHERE "clientId" = $1`, clientId),
      prisma.$queryRawUnsafe(`
        SELECT ps.*, p."signingToken"
        FROM "PackageSelection" ps
        LEFT JOIN "Proposal" p ON p.id = ps."proposalId"
        WHERE ps."clientId" = $1
      `, clientId),
    ]) as [Array<Record<string, unknown>>, Array<Record<string, unknown>>]
    res.json({ onboarding: onboarding[0] ?? null, packageSelection: pkg[0] ?? null })
  } catch (error) {
    logger.error({ error }, 'Error fetching onboarding')
    res.status(500).json({ error: 'Failed to fetch onboarding data' })
  }
})

// PUT /api/admin/clients/:id/onboarding — admin override any step
router.put('/:id/onboarding', authMiddleware, async (req, res) => {
  const clientId = parseInt(req.params.id)
  const { step, value } = req.body as { step: string; value: boolean }
  const allowed = ['step1Questionnaire', 'step2BrandGuide', 'step3Package', 'step4Checkout']
  if (!allowed.includes(step)) return res.status(400).json({ error: 'Invalid step name' })
  try {
    // Ensure row exists
    await prisma.$executeRawUnsafe(`
      INSERT INTO "ClientOnboarding" ("clientId","createdAt","updatedAt")
      VALUES ($1, NOW(), NOW())
      ON CONFLICT ("clientId") DO NOTHING
    `, clientId)
    await prisma.$executeRawUnsafe(
      `UPDATE "ClientOnboarding" SET "${step}"=$1,"updatedAt"=NOW() WHERE "clientId"=$2`,
      Boolean(value), clientId,
    )
    // If completing step4 via admin override, advance journey phase too
    if (step === 'step4Checkout' && value) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Client" SET "journeyPhase"='planning',"updatedAt"=NOW() WHERE id=$1`, clientId,
      )
      await prisma.$executeRawUnsafe(
        `UPDATE "ClientOnboarding" SET "completedAt"=NOW(),"updatedAt"=NOW() WHERE "clientId"=$1`, clientId,
      )
    }
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "ClientOnboarding" WHERE "clientId" = $1`, clientId,
    ) as Array<Record<string, unknown>>
    res.json(rows[0])
  } catch (error) {
    logger.error({ error }, 'Error updating onboarding step')
    res.status(500).json({ error: 'Failed to update onboarding step' })
  }
})

// PUT /api/admin/clients/:id/discount — set per-client upfront discount %
router.put('/:id/discount', authMiddleware, async (req, res) => {
  const clientId = parseInt(req.params.id)
  const { upfrontDiscountPct } = req.body as { upfrontDiscountPct: number }
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "Client" SET "upfrontDiscountPct"=$1,"updatedAt"=NOW() WHERE id=$2`,
      Number(upfrontDiscountPct) || 0, clientId,
    )
    res.json({ upfrontDiscountPct: Number(upfrontDiscountPct) || 0 })
  } catch (error) {
    logger.error({ error }, 'Error setting discount')
    res.status(500).json({ error: 'Failed to set discount' })
  }
})

// PUT /api/admin/clients/:id/skip-onboarding
router.put('/:id/skip-onboarding', authMiddleware, async (req, res) => {
  const clientId = parseInt(req.params.id)
  const { skipOnboarding } = req.body as { skipOnboarding: boolean }
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "Client" SET "skipOnboarding" = $1 WHERE id = $2`,
      Boolean(skipOnboarding), clientId,
    )
    res.json({ skipOnboarding: Boolean(skipOnboarding) })
  } catch (error) {
    logger.error({ error }, 'Error updating skipOnboarding')
    res.status(500).json({ error: 'Failed to update setting' })
  }
})

// GET /api/admin/clients/:id/custom-package
router.get('/:id/custom-package', authMiddleware, async (req, res) => {
  const clientId = parseInt(req.params.id)
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "AdminCustomPackage" WHERE "clientId" = $1`, clientId,
    ) as Array<Record<string, unknown>>
    res.json(rows[0] ?? null)
  } catch (error) {
    logger.error({ error }, 'Error fetching custom package')
    res.status(500).json({ error: 'Failed to fetch custom package' })
  }
})

// PUT /api/admin/clients/:id/custom-package
router.put('/:id/custom-package', authMiddleware, async (req, res) => {
  const clientId = parseInt(req.params.id)
  const { enabled, lineItems, subtotal, discountPct, total, notes, paymentTerms, bundleName, bundleType, bundleExpiresAt } = req.body as {
    enabled: boolean; lineItems: unknown[]; subtotal: number
    discountPct: number; total: number; notes?: string; paymentTerms?: string
    bundleName?: string; bundleType?: string; bundleExpiresAt?: string | null
  }
  try {
    const expiresAt = bundleExpiresAt ? new Date(bundleExpiresAt).toISOString() : null
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AdminCustomPackage" ("clientId",enabled,"lineItems",subtotal,"discountPct",total,notes,"paymentTerms","bundleName","bundleType","bundleExpiresAt","createdAt","updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::TIMESTAMPTZ,NOW(),NOW())
      ON CONFLICT ("clientId") DO UPDATE SET
        enabled=$2,"lineItems"=$3,subtotal=$4,"discountPct"=$5,total=$6,notes=$7,"paymentTerms"=$8,
        "bundleName"=$9,"bundleType"=$10,"bundleExpiresAt"=$11::TIMESTAMPTZ,"updatedAt"=NOW()
    `, clientId, Boolean(enabled), JSON.stringify(lineItems ?? []),
      Number(subtotal ?? 0), Number(discountPct ?? 0), Number(total ?? 0),
      notes ?? null, paymentTerms ?? null,
      bundleName ?? null, bundleType ?? 'catalog', expiresAt)
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "AdminCustomPackage" WHERE "clientId" = $1`, clientId,
    ) as Array<Record<string, unknown>>
    res.json(rows[0])
  } catch (error) {
    logger.error({ error }, 'Error saving custom package')
    res.status(500).json({ error: 'Failed to save custom package' })
  }
})

export { router as clientsRouter }

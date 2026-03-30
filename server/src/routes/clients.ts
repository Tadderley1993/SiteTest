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
    res.json({ message: 'Portal password set', clientId, portalActive: true })
  } catch (error) {
    logger.error({ err: error }, 'Error setting portal password')
    res.status(500).json({ error: 'Failed to set portal password' })
  }
})

export { router as clientsRouter }

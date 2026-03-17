import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

// GET /api/admin/clients
router.get('/', async (_req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        projectScope: true,
        tasks: { orderBy: [{ column: 'asc' }, { order: 'asc' }] },
      },
    })
    res.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
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
    console.error('Error creating client:', error)
    res.status(500).json({ error: 'Failed to create client' })
  }
})

// GET /api/admin/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        projectScope: true,
        tasks: { orderBy: [{ column: 'asc' }, { order: 'asc' }] },
      },
    })
    if (!client) return res.status(404).json({ error: 'Client not found' })
    res.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
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
    console.error('Error updating client:', error)
    res.status(500).json({ error: 'Failed to update client' })
  }
})

// DELETE /api/admin/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
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
    console.error('Error updating scope:', error)
    res.status(500).json({ error: 'Failed to update project scope' })
  }
})

// POST /api/admin/clients/:id/tasks
router.post('/:id/tasks', async (req, res) => {
  try {
    const clientId = parseInt(req.params.id)
    const task = await prisma.kanbanTask.create({
      data: { clientId, ...req.body },
    })
    res.json(task)
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

// PUT /api/admin/clients/:id/tasks/:taskId
router.put('/:id/tasks/:taskId', async (req, res) => {
  try {
    const task = await prisma.kanbanTask.update({
      where: { id: parseInt(req.params.taskId) },
      data: req.body,
    })
    res.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({ error: 'Failed to update task' })
  }
})

// DELETE /api/admin/clients/:id/tasks/:taskId
router.delete('/:id/tasks/:taskId', async (req, res) => {
  try {
    await prisma.kanbanTask.delete({ where: { id: parseInt(req.params.taskId) } })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
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
    console.error('Error fetching standing:', error)
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
    console.error('Error updating standing:', error)
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
    console.error('Error creating payment:', error)
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
    console.error('Error updating payment:', error)
    res.status(500).json({ error: 'Failed to update payment' })
  }
})

// DELETE /api/admin/clients/:id/payments/:paymentId
router.delete('/:id/payments/:paymentId', async (req, res) => {
  try {
    await prisma.paymentEntry.delete({ where: { id: parseInt(req.params.paymentId) } })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment:', error)
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
    console.error('Error creating invoice:', error)
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
    console.error('Error updating invoice:', error)
    res.status(500).json({ error: 'Failed to update invoice' })
  }
})

// DELETE /api/admin/clients/:id/invoices/:invoiceId
router.delete('/:id/invoices/:invoiceId', async (req, res) => {
  try {
    await prisma.invoice.delete({ where: { id: parseInt(req.params.invoiceId) } })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    res.status(500).json({ error: 'Failed to delete invoice' })
  }
})

export { router as clientsRouter }

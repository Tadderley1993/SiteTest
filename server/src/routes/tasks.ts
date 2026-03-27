import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()
router.use(authMiddleware)

// GET /api/admin/tasks — all tasks with client info
// Optional query: ?owner=admin|client  ?clientId=N  ?column=backlog|inprogress|review|done
router.get('/', asyncHandler(async (req, res) => {
  const { owner, clientId, column } = req.query

  let where = `WHERE 1=1`
  const params: unknown[] = []
  let idx = 1

  if (owner) {
    where += ` AND kt."taskOwner" = $${idx++}`
    params.push(owner)
  }
  if (clientId) {
    where += ` AND kt."clientId" = $${idx++}`
    params.push(parseInt(clientId as string))
  }
  if (column) {
    where += ` AND kt.column = $${idx++}`
    params.push(column)
  }

  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      kt.id, kt."clientId", kt.title, kt.description,
      kt.column, kt.priority, kt."dueDate", kt."order",
      kt."taskOwner", kt."createdAt", kt."updatedAt",
      c."firstName", c."lastName"
    FROM "KanbanTask" kt
    LEFT JOIN "Client" c ON c.id = kt."clientId"
    ${where}
    ORDER BY kt.column, kt."order", kt."createdAt"
  `, ...params) as Array<{
    id: number; clientId: number | null; title: string; description: string | null
    column: string; priority: string; dueDate: string | null; order: number
    taskOwner: string; createdAt: Date; updatedAt: Date
    firstName: string | null; lastName: string | null
  }>

  const tasks = rows.map(r => ({
    id: r.id,
    clientId: r.clientId,
    clientName: r.firstName ? `${r.firstName} ${r.lastName}` : null,
    title: r.title,
    description: r.description,
    column: r.column,
    priority: r.priority,
    dueDate: r.dueDate,
    order: r.order,
    taskOwner: r.taskOwner,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }))

  res.json(tasks)
}))

// POST /api/admin/tasks — create admin task (no client)
router.post('/', asyncHandler(async (req, res) => {
  const { title, description, column = 'backlog', priority = 'medium', dueDate, order = 0 } = req.body

  const rows = await prisma.$queryRawUnsafe(`
    INSERT INTO "KanbanTask" (title, description, "column", priority, "dueDate", "order", "taskOwner", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, 'admin', NOW(), NOW())
    RETURNING id, "clientId", title, description, "column", priority, "dueDate", "order", "taskOwner", "createdAt", "updatedAt"
  `, title, description ?? null, column, priority, dueDate ?? null, order) as unknown[]

  res.json((rows as unknown[])[0])
}))

// PUT /api/admin/tasks/:id — update any task (column move, edit, etc.)
router.put('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  const { title, description, column, priority, dueDate, order } = req.body

  // Build dynamic SET clause for only provided fields
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

  params.push(id)

  const rows = await prisma.$queryRawUnsafe(`
    UPDATE "KanbanTask"
    SET ${sets.join(', ')}
    WHERE id = $${idx}
    RETURNING id, "clientId", title, description, "column", priority, "dueDate", "order", "taskOwner", "createdAt", "updatedAt"
  `, ...params) as unknown[]

  res.json((rows as unknown[])[0])
}))

// DELETE /api/admin/tasks/:id — delete any task
router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.kanbanTask.delete({ where: { id: parseInt(req.params.id) } })
  res.json({ success: true })
}))

export { router as tasksRouter }

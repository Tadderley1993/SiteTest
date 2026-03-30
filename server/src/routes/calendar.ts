import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { logger } from '../lib/logger.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// GET /admin/calendar/events?start=ISO&end=ISO
router.get('/events', authMiddleware, async (req, res) => {
  try {
    const { start, end } = req.query
    let where = ''
    const params: unknown[] = []
    if (start && end) {
      where = `WHERE ce."startAt" >= $1 AND ce."startAt" <= $2`
      params.push(new Date(start as string), new Date(end as string))
    }
    const events = await prisma.$queryRawUnsafe<unknown[]>(`
      SELECT
        ce.id, ce.title, ce.description, ce."startAt", ce."endAt",
        ce."allDay", ce."eventType", ce."clientId", ce.color, ce.reminders,
        ce."createdAt", ce."updatedAt",
        c."firstName", c."lastName", c.email, c.organization,
        ps.status AS "projectStatus"
      FROM "CalendarEvent" ce
      LEFT JOIN "Client" c ON ce."clientId" = c.id
      LEFT JOIN "ProjectScope" ps ON ps."clientId" = c.id
      ${where}
      ORDER BY ce."startAt" ASC
    `, ...params)
    res.json(events)
  } catch (e) {
    logger.error(e)
    res.status(500).json({ error: 'Failed to fetch events' })
  }
})

// GET /admin/calendar/upcoming?range=day|week|month
router.get('/upcoming', authMiddleware, async (req, res) => {
  try {
    const range = (req.query.range as string) || 'week'
    const now = new Date()
    const end = new Date()
    if (range === 'day') end.setHours(23, 59, 59, 999)
    else if (range === 'week') { end.setDate(end.getDate() + 7) }
    else { end.setMonth(end.getMonth() + 1) }

    const events = await prisma.$queryRawUnsafe<unknown[]>(`
      SELECT
        ce.id, ce.title, ce.description, ce."startAt", ce."endAt",
        ce."allDay", ce."eventType", ce."clientId", ce.color, ce.reminders,
        c."firstName", c."lastName", c.organization,
        ps.status AS "projectStatus"
      FROM "CalendarEvent" ce
      LEFT JOIN "Client" c ON ce."clientId" = c.id
      LEFT JOIN "ProjectScope" ps ON ps."clientId" = c.id
      WHERE ce."startAt" >= $1 AND ce."startAt" <= $2
      ORDER BY ce."startAt" ASC
    `, now, end)
    res.json(events)
  } catch (e) {
    logger.error(e)
    res.status(500).json({ error: 'Failed to fetch upcoming events' })
  }
})

// GET /admin/calendar/clients - all clients with active project status for dropdown
router.get('/clients', authMiddleware, async (req, res) => {
  try {
    const clients = await prisma.$queryRawUnsafe<unknown[]>(`
      SELECT c.id, c."firstName", c."lastName", c.email, c.organization,
        ps.status AS "projectStatus"
      FROM "Client" c
      LEFT JOIN "ProjectScope" ps ON ps."clientId" = c.id
      ORDER BY c."firstName" ASC
    `)
    res.json(clients)
  } catch (e) {
    logger.error(e)
    res.status(500).json({ error: 'Failed to fetch clients' })
  }
})

// POST /admin/calendar/events
router.post('/events', authMiddleware, async (req, res) => {
  try {
    const { title, description, startAt, endAt, allDay, eventType, clientId, color, reminders } = req.body
    if (!title || !startAt) return res.status(400).json({ error: 'Title and start date are required' })
    const remindersJson = JSON.stringify(Array.isArray(reminders) ? reminders : [])
    const rows = await prisma.$queryRawUnsafe<unknown[]>(`
      INSERT INTO "CalendarEvent" (title, description, "startAt", "endAt", "allDay", "eventType", "clientId", color, reminders, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `, title, description || null, new Date(startAt), endAt ? new Date(endAt) : null,
       allDay ?? false, eventType || 'reminder', clientId ? Number(clientId) : null, color || '#18181b', remindersJson)
    res.json(rows[0])
  } catch (e) {
    logger.error(e)
    res.status(500).json({ error: 'Failed to create event' })
  }
})

// PUT /admin/calendar/events/:id
router.put('/events/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, startAt, endAt, allDay, eventType, clientId, color, reminders } = req.body
    const remindersJson = JSON.stringify(Array.isArray(reminders) ? reminders : [])
    const rows = await prisma.$queryRawUnsafe<unknown[]>(`
      UPDATE "CalendarEvent"
      SET title=$1, description=$2, "startAt"=$3, "endAt"=$4, "allDay"=$5,
          "eventType"=$6, "clientId"=$7, color=$8, reminders=$9, "updatedAt"=NOW()
      WHERE id=$10
      RETURNING *
    `, title, description || null, new Date(startAt), endAt ? new Date(endAt) : null,
       allDay ?? false, eventType || 'reminder', clientId ? Number(clientId) : null,
       color || '#18181b', remindersJson, Number(req.params.id))
    if (!(rows as unknown[]).length) return res.status(404).json({ error: 'Event not found' })
    res.json(rows[0])
  } catch (e) {
    logger.error(e)
    res.status(500).json({ error: 'Failed to update event' })
  }
})

// DELETE /admin/calendar/events/:id
router.delete('/events/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "CalendarEvent" WHERE id=$1`, Number(req.params.id))
    res.json({ ok: true })
  } catch (e) {
    logger.error(e)
    res.status(500).json({ error: 'Failed to delete event' })
  }
})

export { router as calendarRouter }

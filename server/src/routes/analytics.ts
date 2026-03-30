import { Router } from 'express'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { prisma } from '../lib/prisma.js'
import { logger } from '../lib/logger.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// GET /api/admin/analytics/gtag-id — public, no auth (used by frontend to inject tracking)
router.get('/gtag-id', async (_req, res) => {
  try {
    const s = await prisma.adminSettings.findFirst()
    res.json({ measurementId: s?.gaMeasurementId ?? null })
  } catch {
    res.json({ measurementId: null })
  }
})

router.use(authMiddleware)

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getGASettings() {
  const s = await prisma.adminSettings.findFirst()
  if (!s?.gaPropertyId || !s?.gaCredentials) return null
  try {
    const credentials = JSON.parse(s.gaCredentials)
    return { propertyId: s.gaPropertyId, credentials, measurementId: s.gaMeasurementId ?? null }
  } catch {
    return null
  }
}

function makeClient(credentials: object) {
  return new BetaAnalyticsDataClient({ credentials })
}

function periodToDates(period: string): { startDate: string; endDate: string } {
  const map: Record<string, string> = {
    '7d': '7daysAgo',
    '30d': '30daysAgo',
    '90d': '90daysAgo',
    '1y': '365daysAgo',
  }
  return { startDate: map[period] ?? '30daysAgo', endDate: 'today' }
}

function mv(row: { metricValues?: Array<{ value?: string | null } | null> | null } | null | undefined, i: number): number {
  return parseFloat(row?.metricValues?.[i]?.value ?? '0')
}

// ── Status ────────────────────────────────────────────────────────────────────

// GET /api/admin/analytics/status
router.get('/status', async (_req, res) => {
  try {
    const s = await prisma.adminSettings.findFirst()
    res.json({
      connected: !!(s?.gaPropertyId && s?.gaCredentials),
      propertyId: s?.gaPropertyId ?? null,
      measurementId: s?.gaMeasurementId ?? null,
    })
  } catch {
    res.status(500).json({ error: 'Failed to load analytics status' })
  }
})

// ── Overview ──────────────────────────────────────────────────────────────────

// GET /api/admin/analytics/overview?period=7d|30d|90d|1y
router.get('/overview', async (req, res) => {
  try {
    const ga = await getGASettings()
    if (!ga) return res.status(503).json({ error: 'Google Analytics not configured' })

    const { startDate, endDate } = periodToDates((req.query.period as string) ?? '30d')
    const client = makeClient(ga.credentials)

    const [response] = await client.runReport({
      property: `properties/${ga.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'newUsers' },
        { name: 'engagementRate' },
      ],
    })

    const row = response.rows?.[0]
    res.json({
      users: Math.round(mv(row, 0)),
      sessions: Math.round(mv(row, 1)),
      pageviews: Math.round(mv(row, 2)),
      bounceRate: mv(row, 3),
      avgSessionDuration: mv(row, 4),
      newUsers: Math.round(mv(row, 5)),
      engagementRate: mv(row, 6),
    })
  } catch (error) {
    logger.error({ err: error }, 'Analytics overview error')
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch overview' })
  }
})

// ── Time Series ────────────────────────────────────────────────────────────────

// GET /api/admin/analytics/timeseries?period=7d|30d|90d|1y
router.get('/timeseries', async (req, res) => {
  try {
    const ga = await getGASettings()
    if (!ga) return res.status(503).json({ error: 'Google Analytics not configured' })

    const period = (req.query.period as string) ?? '30d'
    const { startDate, endDate } = periodToDates(period)
    const dim = period === '1y' ? 'yearMonth' : period === '90d' ? 'yearWeek' : 'date'
    const client = makeClient(ga.credentials)

    const [response] = await client.runReport({
      property: `properties/${ga.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: dim }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
      ],
      orderBys: [{ dimension: { dimensionName: dim } }],
    })

    const data = (response.rows ?? []).map(row => ({
      date: row.dimensionValues?.[0]?.value ?? '',
      sessions: Math.round(mv(row, 0)),
      users: Math.round(mv(row, 1)),
      pageviews: Math.round(mv(row, 2)),
    }))

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch time series' })
  }
})

// ── Traffic Sources ────────────────────────────────────────────────────────────

// GET /api/admin/analytics/traffic?period=...
router.get('/traffic', async (req, res) => {
  try {
    const ga = await getGASettings()
    if (!ga) return res.status(503).json({ error: 'Google Analytics not configured' })

    const { startDate, endDate } = periodToDates((req.query.period as string) ?? '30d')
    const client = makeClient(ga.credentials)

    const [response] = await client.runReport({
      property: `properties/${ga.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    })

    const data = (response.rows ?? []).map(row => ({
      channel: row.dimensionValues?.[0]?.value ?? 'Unknown',
      sessions: Math.round(mv(row, 0)),
      users: Math.round(mv(row, 1)),
    }))

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch traffic' })
  }
})

// ── Referrers ────────────────────────────────────────────────────────────────

// GET /api/admin/analytics/referrers?period=...&limit=20
router.get('/referrers', async (req, res) => {
  try {
    const ga = await getGASettings()
    if (!ga) return res.status(503).json({ error: 'Google Analytics not configured' })

    const { startDate, endDate } = periodToDates((req.query.period as string) ?? '30d')
    const limit = parseInt((req.query.limit as string) ?? '20')
    const client = makeClient(ga.credentials)

    const [response] = await client.runReport({
      property: `properties/${ga.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit,
    })

    const data = (response.rows ?? []).map(row => ({
      source: row.dimensionValues?.[0]?.value ?? 'Unknown',
      medium: row.dimensionValues?.[1]?.value ?? '',
      sessions: Math.round(mv(row, 0)),
      users: Math.round(mv(row, 1)),
    }))

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch referrers' })
  }
})

// ── Top Pages ──────────────────────────────────────────────────────────────────

// GET /api/admin/analytics/pages?period=...&limit=25
router.get('/pages', async (req, res) => {
  try {
    const ga = await getGASettings()
    if (!ga) return res.status(503).json({ error: 'Google Analytics not configured' })

    const { startDate, endDate } = periodToDates((req.query.period as string) ?? '30d')
    const limit = parseInt((req.query.limit as string) ?? '25')
    const client = makeClient(ga.credentials)

    const [response] = await client.runReport({
      property: `properties/${ga.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'engagementRate' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit,
    })

    const data = (response.rows ?? []).map(row => ({
      path: row.dimensionValues?.[0]?.value ?? '/',
      title: row.dimensionValues?.[1]?.value ?? '',
      pageviews: Math.round(mv(row, 0)),
      users: Math.round(mv(row, 1)),
      avgDuration: mv(row, 2),
      bounceRate: mv(row, 3),
      engagementRate: mv(row, 4),
    }))

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch pages' })
  }
})

// ── Devices ────────────────────────────────────────────────────────────────────

// GET /api/admin/analytics/devices?period=...
router.get('/devices', async (req, res) => {
  try {
    const ga = await getGASettings()
    if (!ga) return res.status(503).json({ error: 'Google Analytics not configured' })

    const { startDate, endDate } = periodToDates((req.query.period as string) ?? '30d')
    const client = makeClient(ga.credentials)

    const [response] = await client.runReport({
      property: `properties/${ga.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    })

    const data = (response.rows ?? []).map(row => ({
      device: row.dimensionValues?.[0]?.value ?? 'unknown',
      sessions: Math.round(mv(row, 0)),
      users: Math.round(mv(row, 1)),
    }))

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch devices' })
  }
})

// ── Geography ──────────────────────────────────────────────────────────────────

// GET /api/admin/analytics/geo?period=...&limit=20
router.get('/geo', async (req, res) => {
  try {
    const ga = await getGASettings()
    if (!ga) return res.status(503).json({ error: 'Google Analytics not configured' })

    const { startDate, endDate } = periodToDates((req.query.period as string) ?? '30d')
    const limit = parseInt((req.query.limit as string) ?? '20')
    const client = makeClient(ga.credentials)

    const [response] = await client.runReport({
      property: `properties/${ga.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit,
    })

    const data = (response.rows ?? []).map(row => ({
      country: row.dimensionValues?.[0]?.value ?? 'Unknown',
      sessions: Math.round(mv(row, 0)),
      users: Math.round(mv(row, 1)),
    }))

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch geo data' })
  }
})

// ── Events ─────────────────────────────────────────────────────────────────────

// GET /api/admin/analytics/events?period=...
router.get('/events', async (req, res) => {
  try {
    const ga = await getGASettings()
    if (!ga) return res.status(503).json({ error: 'Google Analytics not configured' })

    const { startDate, endDate } = periodToDates((req.query.period as string) ?? '30d')
    const client = makeClient(ga.credentials)

    const [response] = await client.runReport({
      property: `properties/${ga.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [
        { name: 'eventCount' },
        { name: 'activeUsers' },
        { name: 'eventCountPerUser' },
      ],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 25,
    })

    const data = (response.rows ?? []).map(row => ({
      event: row.dimensionValues?.[0]?.value ?? 'unknown',
      count: Math.round(mv(row, 0)),
      users: Math.round(mv(row, 1)),
      perUser: mv(row, 2),
    }))

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch events' })
  }
})

// ── Audience (New vs Returning) ────────────────────────────────────────────────

// GET /api/admin/analytics/audience?period=...
router.get('/audience', async (req, res) => {
  try {
    const ga = await getGASettings()
    if (!ga) return res.status(503).json({ error: 'Google Analytics not configured' })

    const { startDate, endDate } = periodToDates((req.query.period as string) ?? '30d')
    const client = makeClient(ga.credentials)

    const [response] = await client.runReport({
      property: `properties/${ga.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'newVsReturning' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    })

    const data = (response.rows ?? []).map(row => ({
      type: row.dimensionValues?.[0]?.value ?? 'unknown',
      sessions: Math.round(mv(row, 0)),
      users: Math.round(mv(row, 1)),
    }))

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch audience data' })
  }
})

// ── Real-time ──────────────────────────────────────────────────────────────────

// GET /api/admin/analytics/realtime
router.get('/realtime', async (_req, res) => {
  try {
    const ga = await getGASettings()
    if (!ga) return res.status(503).json({ error: 'Google Analytics not configured' })

    const client = makeClient(ga.credentials)

    const [usersRes, pagesRes] = await Promise.allSettled([
      client.runRealtimeReport({
        property: `properties/${ga.propertyId}`,
        metrics: [{ name: 'activeUsers' }],
      }),
      client.runRealtimeReport({
        property: `properties/${ga.propertyId}`,
        dimensions: [{ name: 'unifiedScreenName' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10,
      }),
    ])

    const activeUsers =
      usersRes.status === 'fulfilled'
        ? parseInt(usersRes.value[0].rows?.[0]?.metricValues?.[0]?.value ?? '0')
        : 0

    const activePages =
      pagesRes.status === 'fulfilled'
        ? (pagesRes.value[0].rows ?? []).map(row => ({
            page: row.dimensionValues?.[0]?.value ?? '/',
            users: parseInt(row.metricValues?.[0]?.value ?? '0'),
          }))
        : []

    res.json({ activeUsers, activePages })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch real-time data' })
  }
})

// ── Credentials Management ─────────────────────────────────────────────────────

// PUT /api/admin/analytics/credentials
router.put('/credentials', async (req, res) => {
  try {
    const { gaPropertyId, gaCredentials, gaMeasurementId } = req.body
    let s = await prisma.adminSettings.findFirst()
    if (!s) s = await prisma.adminSettings.create({ data: {} })

    const updateData: Record<string, string | null> = {}
    if (gaPropertyId !== undefined) updateData.gaPropertyId = gaPropertyId || null
    if (gaCredentials !== undefined && gaCredentials !== '') updateData.gaCredentials = gaCredentials
    if (gaMeasurementId !== undefined) updateData.gaMeasurementId = gaMeasurementId || null

    await prisma.adminSettings.update({ where: { id: s.id }, data: updateData })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to save credentials' })
  }
})

// POST /api/admin/analytics/test
router.post('/test', async (_req, res) => {
  try {
    const ga = await getGASettings()
    if (!ga) return res.status(400).json({ success: false, error: 'Analytics not configured' })

    const client = makeClient(ga.credentials)
    const [response] = await client.runReport({
      property: `properties/${ga.propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [{ name: 'activeUsers' }],
    })

    const users = parseInt(response.rows?.[0]?.metricValues?.[0]?.value ?? '0')
    res.json({ success: true, message: `Connected! ${users.toLocaleString()} users in last 7 days.` })
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Connection failed' })
  }
})

// DELETE /api/admin/analytics/credentials
router.delete('/credentials', async (_req, res) => {
  try {
    const s = await prisma.adminSettings.findFirst()
    if (s) {
      await prisma.adminSettings.update({
        where: { id: s.id },
        data: { gaPropertyId: null, gaCredentials: null, gaMeasurementId: null },
      })
    }
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to disconnect' })
  }
})

// ── Public measurement ID (no auth needed) ─────────────────────────────────────
export { router as analyticsRouter }

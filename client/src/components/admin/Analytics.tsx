import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, Users, Eye, MousePointer, Clock, Activity,
  Globe, Smartphone, Monitor, Tablet, FileText, Zap,
  RefreshCw, Trash2, CheckCircle, AlertCircle,
} from 'lucide-react'
import api from '../../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OverviewData {
  users: number
  sessions: number
  pageviews: number
  bounceRate: number
  avgSessionDuration: number
  newUsers: number
  engagementRate: number
}

interface TimePoint { date: string; sessions: number; users: number; pageviews: number }
interface TrafficSource { channel: string; sessions: number; users: number }
interface PageData { path: string; title: string; pageviews: number; users: number; avgDuration: number; bounceRate: number; engagementRate: number }
interface DeviceData { device: string; sessions: number; users: number }
interface GeoData { country: string; sessions: number; users: number }
interface EventData { event: string; count: number; users: number; perUser: number }
interface AudienceData { type: string; sessions: number; users: number }
interface RealtimeData { activeUsers: number; activePages: Array<{ page: string; users: number }> }

// ── Constants ─────────────────────────────────────────────────────────────────

const PERIODS = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: '1y', label: '1 Year' },
]

const CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': '#E8FF47',
  'Direct': '#47C6FF',
  'Referral': '#a78bfa',
  'Organic Social': '#fb923c',
  'Email': '#34d399',
  'Paid Search': '#f472b6',
  'Display': '#60a5fa',
  'Unassigned': '#9ca3af',
  '(Other)': '#6b7280',
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: '#E8FF47',
  mobile: '#47C6FF',
  tablet: '#a78bfa',
}

const PIE_FALLBACK = ['#E8FF47', '#47C6FF', '#a78bfa', '#fb923c', '#34d399', '#f472b6', '#60a5fa']

// ── Module-level helpers ──────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s < 10 ? '0' : ''}${s}s`
}

function formatAxisDate(dateStr: string): string {
  if (!dateStr) return ''
  if (dateStr.length === 8) {
    const d = new Date(
      parseInt(dateStr.slice(0, 4)),
      parseInt(dateStr.slice(4, 6)) - 1,
      parseInt(dateStr.slice(6, 8))
    )
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  if (dateStr.length === 6) {
    const d = new Date(parseInt(dateStr.slice(0, 4)), parseInt(dateStr.slice(4, 6)) - 1, 1)
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  return dateStr
}

function pct(value: number, total: number) {
  return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon, sub, color = '#E8FF47',
}: {
  label: string; value: string | number; icon: React.ReactNode; sub?: string; color?: string
}) {
  return (
    <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 uppercase tracking-widest">{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-black">{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">{children}</h3>
  )
}

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#f3f3f3] border border-zinc-200 rounded-xl p-5 ${className}`}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#f3f3f3] border border-zinc-200 rounded-lg p-3 text-xs">
      <div className="text-zinc-500 mb-1.5">{formatAxisDate(label)}</div>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-zinc-500">{p.name}:</span>
          <span className="text-black font-semibold">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ msg = 'No data available' }: { msg?: string }) {
  return <div className="text-center py-10 text-zinc-500 text-sm">{msg}</div>
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Analytics() {
  type Tab = 'overview' | 'realtime' | 'audience' | 'content' | 'events' | 'setup'

  const [connected, setConnected] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [period, setPeriod] = useState('30d')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Setup form
  const [propertyId, setPropertyId] = useState('')
  const [measurementId, setMeasurementId] = useState('')
  const [credentialsJson, setCredentialsJson] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  // Data
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [timeseries, setTimeseries] = useState<TimePoint[]>([])
  const [traffic, setTraffic] = useState<TrafficSource[]>([])
  const [pages, setPages] = useState<PageData[]>([])
  const [devices, setDevices] = useState<DeviceData[]>([])
  const [geo, setGeo] = useState<GeoData[]>([])
  const [events, setEvents] = useState<EventData[]>([])
  const [audience, setAudience] = useState<AudienceData[]>([])
  const [realtime, setRealtime] = useState<RealtimeData>({ activeUsers: 0, activePages: [] })
  const rtIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load status
  useEffect(() => {
    api.get('/admin/analytics/status').then(r => {
      setConnected(r.data.connected)
      if (!r.data.connected) setTab('setup')
      if (r.data.propertyId) setPropertyId(r.data.propertyId)
      if (r.data.measurementId) setMeasurementId(r.data.measurementId)
    }).catch(() => {})
  }, [])

  const axiosErr = (e: unknown) => {
    const ae = e as { response?: { data?: { error?: string } }; message?: string }
    return ae?.response?.data?.error ?? ae?.message ?? 'Failed to load data'
  }

  const loadTabData = useCallback(async () => {
    if (!connected || tab === 'realtime' || tab === 'setup') return
    setLoading(true)
    setError('')
    try {
      if (tab === 'overview') {
        const [ov, ts, tr] = await Promise.all([
          api.get(`/admin/analytics/overview?period=${period}`),
          api.get(`/admin/analytics/timeseries?period=${period}`),
          api.get(`/admin/analytics/traffic?period=${period}`),
        ])
        setOverview(ov.data)
        setTimeseries(ts.data)
        setTraffic(tr.data)
      } else if (tab === 'audience') {
        const [dev, g, aud] = await Promise.all([
          api.get(`/admin/analytics/devices?period=${period}`),
          api.get(`/admin/analytics/geo?period=${period}&limit=20`),
          api.get(`/admin/analytics/audience?period=${period}`),
        ])
        setDevices(dev.data)
        setGeo(g.data)
        setAudience(aud.data)
      } else if (tab === 'content') {
        const r = await api.get(`/admin/analytics/pages?period=${period}&limit=25`)
        setPages(r.data)
      } else if (tab === 'events') {
        const r = await api.get(`/admin/analytics/events?period=${period}`)
        setEvents(r.data)
      }
    } catch (e) {
      setError(axiosErr(e))
    } finally {
      setLoading(false)
    }
  }, [connected, tab, period])

  useEffect(() => { loadTabData() }, [loadTabData])

  // Realtime polling
  useEffect(() => {
    if (!connected || tab !== 'realtime') {
      if (rtIntervalRef.current) clearInterval(rtIntervalRef.current)
      return
    }
    const fetchRt = () => api.get('/admin/analytics/realtime').then(r => setRealtime(r.data)).catch(() => {})
    fetchRt()
    rtIntervalRef.current = setInterval(fetchRt, 30000)
    return () => { if (rtIntervalRef.current) clearInterval(rtIntervalRef.current) }
  }, [connected, tab])

  const handleSave = async () => {
    if (!propertyId.trim()) { setError('Property ID is required'); return }
    if (!connected && !credentialsJson.trim()) { setError('Service account JSON is required'); return }
    setSaving(true)
    setError('')
    try {
      await api.put('/admin/analytics/credentials', {
        gaPropertyId: propertyId.trim(),
        gaMeasurementId: measurementId.trim() || null,
        ...(credentialsJson.trim() ? { gaCredentials: credentialsJson.trim() } : {}),
      })
      setConnected(true)
      setCredentialsJson('')
      setTestResult(null)
      setTab('overview')
    } catch (e) {
      setError(axiosErr(e))
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const r = await api.post('/admin/analytics/test')
      setTestResult({ success: true, message: r.data.message })
    } catch (e) {
      const ae = e as { response?: { data?: { error?: string } }; message?: string }
      setTestResult({ success: false, error: ae?.response?.data?.error ?? 'Connection failed' })
    } finally {
      setTesting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google Analytics? This will remove your stored credentials.')) return
    try {
      await api.delete('/admin/analytics/credentials')
      setConnected(false)
      setPropertyId('')
      setMeasurementId('')
      setTab('setup')
    } catch (e) {
      setError(axiosErr(e))
    }
  }

  const allTabs: { id: Tab; label: string }[] = connected
    ? [
        { id: 'overview', label: 'Overview' },
        { id: 'realtime', label: 'Real-time' },
        { id: 'audience', label: 'Audience' },
        { id: 'content', label: 'Content' },
        { id: 'events', label: 'Events' },
        { id: 'setup', label: 'Settings' },
      ]
    : [{ id: 'setup', label: 'Setup' }]

  const totalTraffic = traffic.reduce((s, t) => s + t.sessions, 0)
  const totalDevices = devices.reduce((s, d) => s + d.sessions, 0)
  const totalAudience = audience.reduce((s, a) => s + a.sessions, 0)
  const totalGeo = geo.reduce((s, g) => s + g.sessions, 0)

  const chartAxisProps = {
    tick: { fill: '#666', fontSize: 10 },
    tickLine: false,
    axisLine: false,
  }

  const tooltipStyle = {
    contentStyle: { background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 },
    labelStyle: { color: '#9ca3af' },
    itemStyle: { color: '#f0f0f0' },
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-black" />
          <h2 className="text-xl font-semibold text-black">Analytics</h2>
          {connected && (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Connected to GA4
            </span>
          )}
        </div>
        {connected && tab !== 'realtime' && tab !== 'setup' && (
          <div className="flex items-center gap-2">
            <div className="flex bg-[#f3f3f3] border border-zinc-200 rounded-lg overflow-hidden">
              {PERIODS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    period === p.id ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-black'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={loadTabData}
              disabled={loading}
              className="p-2 text-zinc-500 hover:text-black transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-zinc-200 overflow-x-auto">
        {allTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === t.id
                ? 'text-black border-accent'
                : 'text-zinc-500 hover:text-black border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* ── SETUP ── */}
      {tab === 'setup' && (
        <div className="max-w-2xl space-y-5">
          {!connected && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm space-y-2">
              <p className="font-semibold text-blue-200">Setup Guide</p>
              <ol className="list-decimal list-inside space-y-1.5 text-blue-300/80 text-xs leading-relaxed">
                <li>Go to <span className="font-mono bg-blue-500/10 px-1 rounded">console.cloud.google.com</span> → Create or select a project</li>
                <li>Enable the <strong className="text-blue-200">Google Analytics Data API</strong></li>
                <li>Go to <strong className="text-blue-200">IAM & Admin → Service Accounts</strong> → Create a new service account</li>
                <li>Click the service account → Keys tab → Add Key → Create new key (JSON) → download the file</li>
                <li>In <strong className="text-blue-200">Google Analytics 4</strong>, go to Admin → Property Access Management</li>
                <li>Add the service account email with <strong className="text-blue-200">Viewer</strong> role</li>
                <li>Copy your <strong className="text-blue-200">Property ID</strong> from GA4 Admin → Property Settings</li>
                <li>Paste all details below and click Connect</li>
              </ol>
            </div>
          )}

          <div className="space-y-4 bg-[#f3f3f3] border border-zinc-200 rounded-xl p-5">
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2">GA4 Property ID *</label>
              <input
                value={propertyId}
                onChange={e => setPropertyId(e.target.value)}
                placeholder="e.g. 123456789"
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-sm text-black placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              <p className="text-xs text-zinc-500 mt-1">GA4 Admin → Property Settings → Property ID (numbers only)</p>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2">Measurement ID (optional)</label>
              <input
                value={measurementId}
                onChange={e => setMeasurementId(e.target.value)}
                placeholder="e.g. G-XXXXXXXXXX"
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-sm text-black placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              <p className="text-xs text-zinc-500 mt-1">For injecting the tracking script into your site (GA4 Admin → Data Streams)</p>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2">
                Service Account JSON Key {connected && <span className="normal-case">(leave blank to keep current)</span>}
              </label>
              <textarea
                value={credentialsJson}
                onChange={e => setCredentialsJson(e.target.value)}
                placeholder={'{\n  "type": "service_account",\n  "project_id": "your-project",\n  "private_key_id": "...",\n  ...\n}'}
                rows={9}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-xs text-black placeholder:text-zinc-500 font-mono focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
              />
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                testResult.success
                  ? 'bg-green-500/10 border border-green-500/20 text-green-600'
                  : 'bg-red-500/10 border border-red-500/20 text-red-500'
              }`}>
                {testResult.success
                  ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                <span>{testResult.success ? testResult.message : testResult.error}</span>
              </div>
            )}

            <div className="flex gap-2 flex-wrap pt-1">
              {connected && (
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="px-4 py-2 text-sm border border-zinc-200 text-zinc-500 hover:text-black rounded-lg transition-colors disabled:opacity-40"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-black text-background font-semibold rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : connected ? 'Update Settings' : 'Connect Google Analytics'}
              </button>
              {connected && (
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-sm border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {loading && !overview ? (
            <div className="text-center py-16 text-zinc-500">Loading analytics...</div>
          ) : overview ? (
            <>
              {/* KPI row 1 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Users" value={overview.users.toLocaleString()} icon={<Users className="w-4 h-4" />} sub={`${overview.newUsers.toLocaleString()} new`} />
                <KpiCard label="Sessions" value={overview.sessions.toLocaleString()} icon={<Activity className="w-4 h-4" />} color="#47C6FF" />
                <KpiCard label="Page Views" value={overview.pageviews.toLocaleString()} icon={<Eye className="w-4 h-4" />} color="#a78bfa" />
                <KpiCard label="Avg Duration" value={formatDuration(overview.avgSessionDuration)} icon={<Clock className="w-4 h-4" />} color="#34d399" />
              </div>
              {/* KPI row 2 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Bounce Rate" value={`${(overview.bounceRate * 100).toFixed(1)}%`} icon={<MousePointer className="w-4 h-4" />} color="#fb923c" sub="Lower is better" />
                <KpiCard label="Engagement Rate" value={`${(overview.engagementRate * 100).toFixed(1)}%`} icon={<Zap className="w-4 h-4" />} color="#f472b6" />
                <KpiCard
                  label="Pages / Session"
                  value={overview.sessions > 0 ? (overview.pageviews / overview.sessions).toFixed(2) : '0'}
                  icon={<FileText className="w-4 h-4" />}
                  color="#fbbf24"
                />
                <KpiCard
                  label="New Users"
                  value={overview.newUsers.toLocaleString()}
                  icon={<Users className="w-4 h-4" />}
                  color="#60a5fa"
                  sub={`${overview.users > 0 ? pct(overview.newUsers, overview.users) : 0}% of total`}
                />
              </div>

              {/* Time series */}
              <ChartCard title="Sessions & Users Over Time">
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={timeseries} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" {...chartAxisProps} tickFormatter={formatAxisDate} interval="preserveStartEnd" />
                    <YAxis {...chartAxisProps} width={40} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                    <Line type="monotone" dataKey="sessions" stroke="#E8FF47" strokeWidth={2} dot={false} name="Sessions" />
                    <Line type="monotone" dataKey="users" stroke="#47C6FF" strokeWidth={2} dot={false} name="Users" />
                    <Line type="monotone" dataKey="pageviews" stroke="#a78bfa" strokeWidth={1.5} dot={false} name="Pageviews" strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Traffic sources */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Traffic Sources">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={traffic} dataKey="sessions" nameKey="channel" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={2}>
                        {traffic.map((t, i) => (
                          <Cell key={t.channel} fill={CHANNEL_COLORS[t.channel] ?? PIE_FALLBACK[i % PIE_FALLBACK.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Channel Breakdown">
                  <div className="space-y-2.5">
                    {traffic.map((t, i) => {
                      const p = parseFloat(pct(t.sessions, totalTraffic))
                      const color = CHANNEL_COLORS[t.channel] ?? PIE_FALLBACK[i % PIE_FALLBACK.length]
                      return (
                        <div key={t.channel}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-black flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                              {t.channel}
                            </span>
                            <span className="text-zinc-500">{t.sessions.toLocaleString()} · {p.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 bg-[#f3f3f3] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ChartCard>
              </div>
            </>
          ) : (
            <EmptyState msg="No data for selected period" />
          )}
        </div>
      )}

      {/* ── REALTIME ── */}
      {tab === 'realtime' && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Auto-refreshes every 30 seconds
            <button
              onClick={() => api.get('/admin/analytics/realtime').then(r => setRealtime(r.data)).catch(() => {})}
              className="flex items-center gap-1 hover:text-black transition-colors ml-2"
            >
              <RefreshCw className="w-3 h-3" /> Refresh now
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <div className="text-8xl font-bold text-black tabular-nums leading-none mb-3">
                {realtime.activeUsers}
              </div>
              <div className="text-zinc-500 text-sm">Active Users Right Now</div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-green-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </div>
            </div>

            <div className="lg:col-span-2 bg-[#f3f3f3] border border-zinc-200 rounded-xl p-5">
              <SectionTitle>Active Pages</SectionTitle>
              {realtime.activePages.length === 0 ? (
                <EmptyState msg="No active sessions right now" />
              ) : (
                <div className="space-y-1">
                  {realtime.activePages.map((p) => {
                    const max = realtime.activePages[0]?.users ?? 1
                    return (
                      <div key={p.page} className="py-2 border-b border-zinc-100 last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-black truncate font-mono text-xs max-w-xs">{p.page}</span>
                          <span className="text-sm font-bold text-black ml-4">{p.users}</span>
                        </div>
                        <div className="h-1 bg-[#f3f3f3] rounded-full overflow-hidden">
                          <div className="h-full bg-black/50 rounded-full" style={{ width: `${(p.users / max) * 100}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── AUDIENCE ── */}
      {tab === 'audience' && (
        <div className="space-y-5">
          {loading && !devices.length ? (
            <div className="text-center py-16 text-zinc-500">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* New vs Returning */}
                <ChartCard title="New vs Returning Users">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={audience} dataKey="sessions" nameKey="type" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>
                        {audience.map((a, i) => (
                          <Cell key={a.type} fill={i === 0 ? '#E8FF47' : '#47C6FF'} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {audience.map((a, i) => (
                      <div key={a.type} className="flex justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: i === 0 ? '#E8FF47' : '#47C6FF' }} />
                          <span className="capitalize text-black">{a.type}</span>
                        </span>
                        <span className="text-zinc-500">{a.sessions.toLocaleString()} · {pct(a.sessions, totalAudience)}%</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>

                {/* Devices */}
                <ChartCard title="Device Categories">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={devices} dataKey="sessions" nameKey="device" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>
                        {devices.map(d => (
                          <Cell key={d.device} fill={DEVICE_COLORS[d.device] ?? '#9ca3af'} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {devices.map(d => {
                      const color = DEVICE_COLORS[d.device] ?? '#9ca3af'
                      const icon = d.device === 'desktop'
                        ? <Monitor className="w-3 h-3" />
                        : d.device === 'mobile'
                          ? <Smartphone className="w-3 h-3" />
                          : <Tablet className="w-3 h-3" />
                      return (
                        <div key={d.device} className="flex justify-between text-xs">
                          <span className="flex items-center gap-2" style={{ color }}>
                            {icon}
                            <span className="capitalize text-black">{d.device}</span>
                          </span>
                          <span className="text-zinc-500">{d.sessions.toLocaleString()} · {pct(d.sessions, totalDevices)}%</span>
                        </div>
                      )
                    })}
                  </div>
                </ChartCard>
              </div>

              {/* Device bar chart */}
              <ChartCard title="Sessions by Device">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={devices} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="device" {...chartAxisProps} />
                    <YAxis {...chartAxisProps} width={40} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="sessions" radius={[4, 4, 0, 0]} name="Sessions">
                      {devices.map(d => (
                        <Cell key={d.device} fill={DEVICE_COLORS[d.device] ?? '#9ca3af'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Geography */}
              <ChartCard title="Top Countries">
                {geo.length === 0 ? <EmptyState /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200">
                          <th className="text-left py-2 text-xs text-zinc-500 font-medium w-8">#</th>
                          <th className="text-left py-2 text-xs text-zinc-500 font-medium">Country</th>
                          <th className="text-right py-2 text-xs text-zinc-500 font-medium">Sessions</th>
                          <th className="text-right py-2 text-xs text-zinc-500 font-medium">Users</th>
                          <th className="py-2 text-xs text-zinc-500 font-medium text-right w-36">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {geo.map((g, i) => {
                          const p = parseFloat(pct(g.sessions, totalGeo))
                          return (
                            <tr key={g.country} className="border-b border-zinc-100 hover:bg-[#f3f3f3]">
                              <td className="py-2.5 text-zinc-500 text-xs">{i + 1}</td>
                              <td className="py-2.5 text-black flex items-center gap-2">
                                <Globe className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                                {g.country}
                              </td>
                              <td className="py-2.5 text-right text-black">{g.sessions.toLocaleString()}</td>
                              <td className="py-2.5 text-right text-zinc-500">{g.users.toLocaleString()}</td>
                              <td className="py-2.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1 bg-[#f3f3f3] rounded-full overflow-hidden">
                                    <div className="h-full bg-black rounded-full" style={{ width: `${p}%` }} />
                                  </div>
                                  <span className="text-zinc-500 text-xs w-10 text-right">{p.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </ChartCard>
            </>
          )}
        </div>
      )}

      {/* ── CONTENT ── */}
      {tab === 'content' && (
        <div className="space-y-4">
          <ChartCard title="Top Pages">
            {loading && !pages.length ? (
              <div className="text-center py-8 text-zinc-500">Loading...</div>
            ) : pages.length === 0 ? <EmptyState /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200">
                      <th className="text-left py-2 text-xs text-zinc-500 font-medium w-8">#</th>
                      <th className="text-left py-2 text-xs text-zinc-500 font-medium">Page</th>
                      <th className="text-right py-2 text-xs text-zinc-500 font-medium">Views</th>
                      <th className="text-right py-2 text-xs text-zinc-500 font-medium">Users</th>
                      <th className="text-right py-2 text-xs text-zinc-500 font-medium">Avg Time</th>
                      <th className="text-right py-2 text-xs text-zinc-500 font-medium">Bounce</th>
                      <th className="text-right py-2 text-xs text-zinc-500 font-medium">Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((p, i) => (
                      <tr key={p.path + i} className="border-b border-zinc-100 hover:bg-[#f3f3f3]">
                        <td className="py-2.5 text-zinc-500 text-xs">{i + 1}</td>
                        <td className="py-2.5 max-w-xs">
                          <div className="truncate text-black font-mono text-xs">{p.path}</div>
                          {p.title && p.title !== p.path && (
                            <div className="truncate text-zinc-500 text-xs">{p.title}</div>
                          )}
                        </td>
                        <td className="py-2.5 text-right text-black">{p.pageviews.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-zinc-500">{p.users.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-zinc-500">{formatDuration(p.avgDuration)}</td>
                        <td className="py-2.5 text-right text-zinc-500">{(p.bounceRate * 100).toFixed(1)}%</td>
                        <td className="py-2.5 text-right text-zinc-500">{(p.engagementRate * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>
        </div>
      )}

      {/* ── EVENTS ── */}
      {tab === 'events' && (
        <div className="space-y-4">
          <ChartCard title="Top Events">
            {loading && !events.length ? (
              <div className="text-center py-8 text-zinc-500">Loading...</div>
            ) : events.length === 0 ? <EmptyState /> : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={events.slice(0, 10)} layout="vertical" margin={{ left: 120, right: 16, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" {...chartAxisProps} />
                    <YAxis type="category" dataKey="event" tick={{ fill: '#9ca3af', fontSize: 10 }} tickLine={false} axisLine={false} width={120} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" fill="#E8FF47" radius={[0, 4, 4, 0]} name="Event Count" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200">
                        <th className="text-left py-2 text-xs text-zinc-500 font-medium w-8">#</th>
                        <th className="text-left py-2 text-xs text-zinc-500 font-medium">Event</th>
                        <th className="text-right py-2 text-xs text-zinc-500 font-medium">Count</th>
                        <th className="text-right py-2 text-xs text-zinc-500 font-medium">Users</th>
                        <th className="text-right py-2 text-xs text-zinc-500 font-medium">Per User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e, i) => (
                        <tr key={e.event} className="border-b border-zinc-100 hover:bg-[#f3f3f3]">
                          <td className="py-2.5 text-zinc-500 text-xs">{i + 1}</td>
                          <td className="py-2.5 text-black font-mono text-xs">{e.event}</td>
                          <td className="py-2.5 text-right text-black font-semibold">{e.count.toLocaleString()}</td>
                          <td className="py-2.5 text-right text-zinc-500">{e.users.toLocaleString()}</td>
                          <td className="py-2.5 text-right text-zinc-500">{e.perUser.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  )
}

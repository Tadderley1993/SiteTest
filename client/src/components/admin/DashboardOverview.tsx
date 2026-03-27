import { useEffect, useState } from 'react'
import { getClients, getSubmissions, getCalendarEvents, Client, Submission, CalendarEvent } from '../../lib/api'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

interface KpiCardProps {
  icon: string
  label: string
  value: string
  badge: string
  badgeColor: string
}

function KpiCard({ icon, label, value, badge, badgeColor }: KpiCardProps) {
  return (
    <div className="bg-white p-8 rounded-xl ring-1 ring-black/[0.03] hover:shadow-xl transition-all">
      <div className="flex justify-between items-start mb-6">
        <span className="p-2 bg-[#f3f3f3] rounded-lg material-symbols-outlined text-black text-[20px]">{icon}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeColor}`}>{badge}</span>
      </div>
      <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
    </div>
  )
}

const EVENT_TYPE_ICON: Record<string, string> = {
  reminder: 'notifications',
  event:    'event',
  call:     'call',
  followup: 'reply',
  meeting:  'group',
  deadline: 'flag',
}

function formatEventTime(iso: string, allDay: boolean): string {
  if (allDay) return 'All day'
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

interface Props {
  onNavigateToCalendar?: () => void
}

export default function DashboardOverview({ onNavigateToCalendar }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    Promise.all([
      getClients(),
      getSubmissions(),
      getCalendarEvents(todayStart.toISOString(), todayEnd.toISOString()),
    ])
      .then(([cls, subs, evts]) => {
        setClients(cls)
        setSubmissions(subs)
        setTodayEvents(evts)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const activeClients = clients.filter(c => (c.projectScope?.status ?? 'active') === 'active').length
  const recentSubmissions = submissions.slice(0, 5)
  const latestClient = clients[0] ?? null

  return (
    <div>
      {/* Page title */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <span>Agency OS</span>
          <span>/</span>
          <span className="text-black">Dashboard</span>
        </nav>
        <h1 className="text-4xl font-bold tracking-tighter">Overview</h1>
        <p className="text-zinc-400 text-sm mt-1">Your agency at a glance</p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-zinc-400 text-sm">Loading dashboard...</div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <KpiCard icon="payments" label="Revenue" value="$0" badge="+0%" badgeColor="text-green-600 bg-green-50" />
            <KpiCard icon="pending_actions" label="Outstanding" value="$0" badge="0 open" badgeColor="text-amber-600 bg-amber-50" />
            <KpiCard
              icon="group"
              label="Active Clients"
              value={String(activeClients)}
              badge={`${clients.length} total`}
              badgeColor="text-blue-600 bg-blue-50"
            />
            <KpiCard
              icon="send"
              label="Submissions"
              value={String(submissions.length)}
              badge="All time"
              badgeColor="text-zinc-600 bg-zinc-100"
            />
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Recent submissions — spans 2 cols */}
            <div className="col-span-2 bg-white rounded-xl ring-1 ring-black/[0.05] overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-black">Recent Submissions</h2>
                <span className="text-xs text-zinc-400">{submissions.length} total</span>
              </div>
              {recentSubmissions.length === 0 ? (
                <div className="px-6 py-12 text-center text-zinc-400 text-sm">No submissions yet</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-50">
                      <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-3">Inquirer</th>
                      <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Service</th>
                      <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Budget</th>
                      <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSubmissions.map((s, i) => (
                      <tr key={s.id} className={`border-t border-zinc-50 ${i % 2 === 1 ? 'bg-zinc-50/50' : ''}`}>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-full bg-black flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {getInitials(s.firstName, s.lastName)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-black truncate">{s.firstName} {s.lastName}</p>
                              <p className="text-[10px] text-zinc-400 truncate">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {s.services.slice(0, 2).map(svc => (
                              <span key={svc} className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-medium rounded-md capitalize">
                                {svc}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-600 font-medium">
                          {s.budget?.startsWith('$') ? s.budget : `$${s.budget ?? '—'}`}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400">{formatDate(s.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Latest client card */}
            <div className="bg-white rounded-xl ring-1 ring-black/[0.05] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-bold text-black">Latest Client</h2>
              </div>
              {latestClient ? (
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-zinc-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {getInitials(latestClient.firstName, latestClient.lastName)}
                    </div>
                    <div>
                      <p className="font-bold text-black">{latestClient.firstName} {latestClient.lastName}</p>
                      {latestClient.organization && (
                        <p className="text-xs text-zinc-400">{latestClient.organization}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 text-sm flex-1">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <span className="material-symbols-outlined text-[16px] text-zinc-300">mail</span>
                      <span className="truncate text-xs">{latestClient.email}</span>
                    </div>
                    {latestClient.phone && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <span className="material-symbols-outlined text-[16px] text-zinc-300">call</span>
                        <span className="text-xs">{latestClient.phone}</span>
                      </div>
                    )}
                    {latestClient.projectScope?.projectName && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <span className="material-symbols-outlined text-[16px] text-zinc-300">work</span>
                        <span className="text-xs truncate">{latestClient.projectScope.projectName}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-zinc-100">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      (latestClient.projectScope?.status ?? 'active') === 'active'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {latestClient.projectScope?.status ?? 'active'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 flex-1 flex items-center justify-center text-zinc-400 text-sm">
                  No clients yet
                </div>
              )}
            </div>

            {/* Today's Events — full width */}
            <div className="col-span-3 bg-white rounded-xl ring-1 ring-black/[0.05] overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-zinc-400">today</span>
                  <h2 className="text-sm font-bold text-black">Today's Events</h2>
                  {todayEvents.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black text-white leading-none">
                      {todayEvents.length}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onNavigateToCalendar}
                  className="text-xs text-zinc-400 hover:text-black transition-colors flex items-center gap-1"
                >
                  <span>View Calendar</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
              {todayEvents.length === 0 ? (
                <div className="px-6 py-10 text-center text-zinc-400 text-sm">
                  No events scheduled for today
                </div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {todayEvents.map(evt => (
                    <div key={evt.id} className="flex items-center gap-4 px-6 py-3 hover:bg-zinc-50/60 transition-colors">
                      {/* Color dot */}
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: evt.color }} />

                      {/* Time */}
                      <span className="text-xs font-semibold text-zinc-400 w-16 flex-shrink-0">
                        {formatEventTime(evt.startAt, evt.allDay)}
                      </span>

                      {/* Type icon */}
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px] text-zinc-500">
                          {EVENT_TYPE_ICON[evt.eventType] ?? 'event'}
                        </span>
                      </div>

                      {/* Title + description */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-black truncate">{evt.title}</p>
                        {evt.description && (
                          <p className="text-xs text-zinc-400 truncate">{evt.description}</p>
                        )}
                      </div>

                      {/* Client tag */}
                      {evt.firstName && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 flex-shrink-0">
                          {evt.firstName} {evt.lastName}
                        </span>
                      )}

                      {/* Event type badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 capitalize flex-shrink-0">
                        {evt.eventType}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions row */}
            <div className="col-span-3 grid grid-cols-4 gap-4">
              {[
                { icon: 'person_add', label: 'Add Client', desc: 'Create a new client profile' },
                { icon: 'description', label: 'New Proposal', desc: 'Draft a project proposal' },
                { icon: 'receipt_long', label: 'Create Invoice', desc: 'Bill a client for work done' },
                { icon: 'insights', label: 'View Analytics', desc: 'Review site performance' },
              ].map(action => (
                <div key={action.label} className="bg-white rounded-xl p-5 ring-1 ring-black/[0.03] hover:shadow-md transition-all cursor-pointer group">
                  <div className="p-2 bg-[#f3f3f3] group-hover:bg-black rounded-lg w-fit mb-4 transition-colors">
                    <span className="material-symbols-outlined text-black group-hover:text-white text-[20px] transition-colors">{action.icon}</span>
                  </div>
                  <p className="text-sm font-bold text-black mb-1">{action.label}</p>
                  <p className="text-xs text-zinc-400">{action.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

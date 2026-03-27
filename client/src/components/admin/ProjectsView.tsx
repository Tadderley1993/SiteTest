import { useState, useEffect, useCallback } from 'react'
import KanbanBoard from './KanbanBoard'
import { getAllTasks, getClients, Client, KanbanTask } from '../../lib/api'


function MetricCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string
}) {
  return (
    <div className="bg-white rounded-xl p-5 ring-1 ring-black/[0.04]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">{label}</p>
      <p className={`text-3xl font-black tracking-tighter ${accent ?? 'text-black'}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function ProjectsView() {
  const [tasks, setTasks] = useState<KanbanTask[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [ownerView, setOwnerView] = useState<'all' | 'admin' | 'client'>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([getAllTasks(), getClients()])
      .then(([t, c]) => { setTasks(t); setClients(c) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Apply filters for the board display
  const filtered = tasks.filter(t => {
    const matchOwner = ownerView === 'all' || t.taskOwner === ownerView
    const matchClient = clientFilter === 'all'
      || (clientFilter === 'none' && !t.clientId)
      || String(t.clientId) === clientFilter
    return matchOwner && matchClient
  })

  // Metrics (computed from ALL tasks, not filtered)
  const total = tasks.length
  const done = tasks.filter(t => t.column === 'done').length
  const backlog = tasks.filter(t => t.column === 'backlog').length
  const inprogress = tasks.filter(t => t.column === 'inprogress').length
  const review = tasks.filter(t => t.column === 'review').length
  const today = new Date().toISOString().split('T')[0]
  const overdue = tasks.filter(t => t.dueDate && t.dueDate < today && t.column !== 'done').length
  const pctDone = total > 0 ? Math.round((done / total) * 100) : 0
  const pctBacklog = total > 0 ? Math.round((backlog / total) * 100) : 0
  const pctInProgress = total > 0 ? Math.round((inprogress / total) * 100) : 0
  const agencyTasks = tasks.filter(t => t.taskOwner === 'admin').length
  const clientTasks = tasks.filter(t => t.taskOwner === 'client').length

  const handleTasksChange = (updated: KanbanTask[]) => {
    // Keep tasks outside the current filter, replace filtered set with updated
    const filteredIds = new Set(filtered.map(t => t.id))
    const unaffected = tasks.filter(t => !filteredIds.has(t.id))
    setTasks([...unaffected, ...updated])
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <nav className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span>Agency OS</span><span>/</span><span className="text-black">Projects</span>
          </nav>
          <h1 className="text-4xl font-bold tracking-tighter">Production Board</h1>
          <p className="text-zinc-400 text-sm mt-1">All tasks across agency and clients</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="bg-white ring-1 ring-black/[0.08] text-zinc-600 hover:text-black px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>Refresh
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <MetricCard label="Total Tasks" value={total} sub={`${agencyTasks} agency · ${clientTasks} client`} />
        <MetricCard label="Overdue" value={overdue} sub={overdue > 0 ? 'Past due, not done' : 'None — all on track'} accent={overdue > 0 ? 'text-red-500' : 'text-green-600'} />
        <MetricCard label="Completion Rate" value={`${pctDone}%`} sub={`${done} of ${total} tasks done`} accent="text-green-600" />
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard label="Backlog" value={backlog} sub={`${pctBacklog}% of all tasks`} accent="text-zinc-600" />
        <MetricCard label="In Progress" value={inprogress} sub={`${pctInProgress}% of all tasks`} accent="text-blue-600" />
        <MetricCard label="In Review" value={review} sub={`${total > 0 ? Math.round((review / total) * 100) : 0}% of all tasks`} accent="text-amber-600" />
        <MetricCard label="Done" value={done} sub={`${pctDone}% of all tasks`} accent="text-green-600" />
      </div>

      {/* Column breakdown bar */}
      {total > 0 && (
        <div className="mb-6 bg-white rounded-xl p-4 ring-1 ring-black/[0.04]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Column Breakdown</p>
            <p className="text-xs text-zinc-400">{total} total tasks</p>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {backlog > 0 && (
              <div className="bg-zinc-300 transition-all" style={{ width: `${pctBacklog}%` }} title={`Backlog: ${backlog}`} />
            )}
            {inprogress > 0 && (
              <div className="bg-blue-400 transition-all" style={{ width: `${pctInProgress}%` }} title={`In Progress: ${inprogress}`} />
            )}
            {review > 0 && (
              <div className="bg-amber-400 transition-all" style={{ width: `${Math.round((review / total) * 100)}%` }} title={`Review: ${review}`} />
            )}
            {done > 0 && (
              <div className="bg-green-500 transition-all" style={{ width: `${pctDone}%` }} title={`Done: ${done}`} />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2.5 text-[10px] font-medium text-zinc-500">
            {[
              { label: 'Backlog', count: backlog, color: 'bg-zinc-300' },
              { label: 'In Progress', count: inprogress, color: 'bg-blue-400' },
              { label: 'Review', count: review, color: 'bg-amber-400' },
              { label: 'Done', count: done, color: 'bg-green-500' },
            ].map(item => item.count > 0 && (
              <span key={item.label} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                {item.label} ({item.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1 bg-white ring-1 ring-black/[0.08] rounded-lg p-1">
          {([['all', 'All'], ['admin', 'Agency'], ['client', 'Client']] as const).map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setOwnerView(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                ownerView === v ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="bg-white ring-1 ring-black/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none text-zinc-700"
        >
          <option value="all">All Clients</option>
          <option value="none">Agency Only (no client)</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
          ))}
        </select>

        {(ownerView !== 'all' || clientFilter !== 'all') && (
          <button
            type="button"
            onClick={() => { setOwnerView('all'); setClientFilter('all') }}
            className="text-xs text-zinc-500 hover:text-black font-semibold underline transition-colors"
          >
            Clear filters
          </button>
        )}

        <div className="ml-auto text-xs text-zinc-400 font-medium">
          Showing {filtered.length} of {total} tasks
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-zinc-400 text-sm">Loading production board...</div>
      ) : (
        <KanbanBoard
          tasks={filtered}
          onTasksChange={handleTasksChange}
          mode="global"
        />
      )}
    </div>
  )
}

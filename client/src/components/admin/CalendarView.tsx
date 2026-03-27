import { useEffect, useState, useCallback } from 'react'
import {
  CalendarEvent,
  CalendarClient,
  getCalendarEvents,
  getUpcomingEvents,
  getCalendarClients,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../../lib/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: Date[] = []
  // pad from previous month
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(new Date(year, month, -firstDay.getDay() + i + 1))
  }
  // current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  // pad to next month to fill grid
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    days.push(new Date(year, month + 1, d))
  }
  return days
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatTime(isoString: string, allDay?: boolean): string {
  if (allDay) return 'All day'
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDateForInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatTimeForInput(isoString: string): string {
  const d = new Date(isoString)
  return d.toTimeString().slice(0, 5)
}

function clientCategory(c: CalendarClient): 'active' | 'crm' {
  return c.projectStatus === 'active' ? 'active' : 'crm'
}

// ── Type dot color map ─────────────────────────────────────────────────────────

const TYPE_DOT: Record<string, string> = {
  reminder: 'bg-zinc-400',
  event: 'bg-blue-500',
  call: 'bg-green-500',
  followup: 'bg-amber-500',
  meeting: 'bg-purple-500',
  deadline: 'bg-red-500',
}

const TYPE_ICON: Record<string, string> = {
  reminder: 'notifications',
  event: 'event',
  call: 'call',
  followup: 'reply',
  meeting: 'group',
  deadline: 'flag',
}

const EVENT_TYPES = ['reminder', 'event', 'call', 'followup', 'meeting', 'deadline']

const PRESET_COLORS = [
  { label: 'Black',  value: '#18181b' },
  { label: 'Zinc',   value: '#52525b' },
  { label: 'Blue',   value: '#2563eb' },
  { label: 'Green',  value: '#16a34a' },
  { label: 'Amber',  value: '#d97706' },
  { label: 'Red',    value: '#dc2626' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Pink',   value: '#db2777' },
]

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  title: string
  description: string
  startAt: string
  startTime: string
  endAt: string
  endTime: string
  allDay: boolean
  eventType: string
  clientId: number | null
  color: string
}

function defaultForm(day?: Date | null): FormState {
  const today = day ? formatDateForInput(day) : formatDateForInput(new Date())
  return {
    title: '',
    description: '',
    startAt: today,
    startTime: '09:00',
    endAt: '',
    endTime: '',
    allDay: false,
    eventType: 'reminder',
    clientId: null,
    color: '#18181b',
  }
}

function formToPayload(form: FormState) {
  const startIso = form.allDay
    ? new Date(form.startAt + 'T00:00:00').toISOString()
    : new Date(form.startAt + 'T' + (form.startTime || '00:00') + ':00').toISOString()
  const endIso = form.endAt
    ? form.allDay
      ? new Date(form.endAt + 'T23:59:59').toISOString()
      : new Date(form.endAt + 'T' + (form.endTime || '00:00') + ':00').toISOString()
    : null
  return {
    title: form.title,
    description: form.description || null,
    startAt: startIso,
    endAt: endIso,
    allDay: form.allDay,
    eventType: form.eventType,
    clientId: form.clientId,
    color: form.color,
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface UpcomingCardProps {
  event: CalendarEvent
  onEdit: (e: CalendarEvent) => void
}

function UpcomingCard({ event, onEdit }: UpcomingCardProps) {
  const isActive = event.projectStatus === 'active'
  const clientName = event.firstName
    ? `${event.firstName} ${event.lastName ?? ''}`.trim()
    : null

  return (
    <button
      type="button"
      onClick={() => onEdit(event)}
      className="w-full text-left flex items-stretch rounded-lg bg-white ring-1 ring-black/[0.06] shadow-sm overflow-hidden hover:ring-black/20 transition-all"
    >
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: event.color }} />
      <div className="flex-1 px-3 py-2.5 min-w-0">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-[16px] text-zinc-400 mt-0.5 flex-shrink-0">
            {TYPE_ICON[event.eventType] ?? 'event'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-black truncate">{event.title}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {formatTime(event.startAt, event.allDay)}
            </p>
            {clientName && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs text-zinc-600 truncate">{clientName}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {isActive ? 'Active' : 'CRM'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

interface ClientDropdownProps {
  clients: CalendarClient[]
  selectedId: number | null
  onSelect: (id: number | null) => void
}

function ClientDropdown({ clients, selectedId, onSelect }: ClientDropdownProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'crm'>('all')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const selected = clients.find(c => c.id === selectedId) ?? null

  const filtered = clients.filter(c => {
    if (filter === 'active' && clientCategory(c) !== 'active') return false
    if (filter === 'crm' && clientCategory(c) !== 'crm') return false
    if (search) {
      const q = search.toLowerCase()
      const name = `${c.firstName} ${c.lastName}`.toLowerCase()
      const org = (c.organization ?? '').toLowerCase()
      if (!name.includes(q) && !org.includes(q)) return false
    }
    return true
  })

  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
        Link Client
      </label>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-2">
        {(['all', 'active', 'crm'] as const).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-black text-white'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'CRM'}
          </button>
        ))}
      </div>

      {/* Selected badge */}
      {selected && !open ? (
        <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-black truncate">
              {selected.firstName} {selected.lastName}
            </span>
            {selected.organization && (
              <span className="text-xs text-zinc-500 truncate">({selected.organization})</span>
            )}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
              clientCategory(selected) === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {clientCategory(selected) === 'active' ? 'Active' : 'CRM'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-zinc-400 hover:text-black ml-2 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Search clients..."
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
          {open && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-xs text-zinc-400 p-3">No clients found</p>
              ) : (
                filtered.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelect(c.id)
                      setSearch('')
                      setOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
                  >
                    <span className="text-sm text-black font-medium flex-shrink-0">
                      {c.firstName} {c.lastName}
                    </span>
                    {c.organization && (
                      <span className="text-xs text-zinc-400 truncate">({c.organization})</span>
                    )}
                    <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      clientCategory(c) === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {clientCategory(c) === 'active' ? 'Active' : 'CRM'}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface EventModalProps {
  open: boolean
  editing: CalendarEvent | null
  clients: CalendarClient[]
  selectedDay: Date | null
  onClose: () => void
  onSaved: () => void
}

function EventModal({ open, editing, clients, selectedDay, onClose, onSaved }: EventModalProps) {
  const [form, setForm] = useState<FormState>(defaultForm(selectedDay))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description ?? '',
        startAt: editing.startAt.slice(0, 10),
        startTime: editing.allDay ? '09:00' : formatTimeForInput(editing.startAt),
        endAt: editing.endAt ? editing.endAt.slice(0, 10) : '',
        endTime: editing.endAt && !editing.allDay ? formatTimeForInput(editing.endAt) : '',
        allDay: editing.allDay,
        eventType: editing.eventType,
        clientId: editing.clientId,
        color: editing.color,
      })
    } else {
      setForm(defaultForm(selectedDay))
    }
    setError('')
  }, [open, editing, selectedDay])

  const set = (key: keyof FormState, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.startAt) { setError('Start date is required'); return }
    setSaving(true)
    setError('')
    try {
      const payload = formToPayload(form)
      if (editing) {
        await updateCalendarEvent(editing.id, payload)
      } else {
        await createCalendarEvent(payload)
      }
      onSaved()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setError(err?.response?.data?.error ?? 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editing) return
    if (!confirm('Delete this event?')) return
    setDeleting(true)
    try {
      await deleteCalendarEvent(editing.id)
      onSaved()
    } catch {
      setError('Failed to delete event')
      setDeleting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h2 className="text-base font-bold text-black">
            {editing ? 'Edit Event' : 'New Event'}
          </h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-black">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Event title"
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          {/* Event type */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('eventType', t)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                    form.eventType === t
                      ? 'bg-black text-white'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* All day */}
          <div className="flex items-center gap-2">
            <input
              id="allDay"
              type="checkbox"
              checked={form.allDay}
              onChange={e => set('allDay', e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black"
            />
            <label htmlFor="allDay" className="text-sm font-medium text-zinc-700">All day</label>
          </div>

          {/* Start date / time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                value={form.startAt}
                onChange={e => set('startAt', e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            {!form.allDay && (
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={e => set('startTime', e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
            )}
          </div>

          {/* End date / time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={form.endAt}
                onChange={e => set('endAt', e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            {!form.allDay && (
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  End Time
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={e => set('endTime', e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => set('color', c.value)}
                  className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    form.color === c.value ? 'border-black scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          {/* Client */}
          <ClientDropdown
            clients={clients}
            selectedId={form.clientId}
            onSelect={id => set('clientId', id)}
          />

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-100">
          <div>
            {editing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold bg-black text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : editing ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main CalendarView ─────────────────────────────────────────────────────────

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [upcoming, setUpcoming] = useState<CalendarEvent[]>([])
  const [clients, setClients] = useState<CalendarClient[]>([])
  const [upcomingRange, setUpcomingRange] = useState<'day' | 'week' | 'month'>('week')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const loadEvents = useCallback(async () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const start = new Date(year, month, 1).toISOString()
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    try {
      const data = await getCalendarEvents(start, end)
      setEvents(data)
    } catch {
      // silent
    }
  }, [currentMonth])

  const loadUpcoming = useCallback(async () => {
    try {
      const data = await getUpcomingEvents(upcomingRange)
      setUpcoming(data)
    } catch {
      // silent
    }
  }, [upcomingRange])

  const loadClients = useCallback(async () => {
    try {
      const data = await getCalendarClients()
      setClients(data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])
  useEffect(() => { loadUpcoming() }, [loadUpcoming])
  useEffect(() => { loadClients() }, [loadClients])

  const today = new Date()
  const days = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth())

  const eventsOnDay = (day: Date): CalendarEvent[] => {
    return events.filter(e => isSameDay(new Date(e.startAt), day))
  }

  const handleDayClick = (day: Date) => {
    setSelectedDay(day)
    setEditingEvent(null)
    setModalOpen(true)
  }

  const handleEventClick = (e: CalendarEvent, ev: React.MouseEvent) => {
    ev.stopPropagation()
    setEditingEvent(e)
    setSelectedDay(new Date(e.startAt))
    setModalOpen(true)
  }

  const handleSaved = () => {
    setModalOpen(false)
    setEditingEvent(null)
    loadEvents()
    loadUpcoming()
  }

  const prevMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))

  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <nav className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span>Agency OS</span>
            <span>/</span>
            <span className="text-black">Calendar</span>
          </nav>
          <h1 className="text-4xl font-bold tracking-tighter text-black">Calendar</h1>
        </div>
        <button
          type="button"
          onClick={() => { setEditingEvent(null); setSelectedDay(new Date()); setModalOpen(true) }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Event
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Left: Month grid */}
        <div className="flex-1 bg-white rounded-xl ring-1 ring-black/[0.06] shadow-sm overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <h2 className="text-base font-bold text-black">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 border-b border-zinc-100">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="text-center py-2.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
              const isToday = isSameDay(day, today)
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
              const dayEvents = eventsOnDay(day)
              const maxDots = 3
              const extraCount = Math.max(0, dayEvents.length - maxDots)
              const visibleEvents = dayEvents.slice(0, maxDots)

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[80px] p-2 border-b border-r border-zinc-100 cursor-pointer transition-colors ${
                    isSelected ? 'bg-zinc-50' : 'hover:bg-zinc-50/50'
                  } ${!isCurrentMonth ? 'opacity-30' : ''}`}
                >
                  {/* Day number */}
                  <div className="flex justify-end mb-1">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-black text-white' : 'text-zinc-700'
                    }`}>
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Event dots/labels */}
                  <div className="space-y-0.5">
                    {visibleEvents.map(e => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={ev => handleEventClick(e, ev)}
                        className="w-full text-left flex items-center gap-1 group"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${TYPE_DOT[e.eventType] ?? 'bg-zinc-400'}`} />
                        <span className="text-[10px] font-medium text-zinc-700 truncate group-hover:text-black transition-colors leading-tight">
                          {e.title}
                        </span>
                      </button>
                    ))}
                    {extraCount > 0 && (
                      <p className="text-[10px] text-zinc-400 font-medium pl-2.5">+{extraCount} more</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Upcoming panel */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-xl ring-1 ring-black/[0.06] shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-black mb-3">Upcoming</h3>
              {/* Range tabs */}
              <div className="flex gap-1">
                {(['day', 'week', 'month'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setUpcomingRange(r)}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold capitalize transition-colors ${
                      upcomingRange === r
                        ? 'bg-black text-white'
                        : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                    }`}
                  >
                    {r === 'day' ? 'Today' : r === 'week' ? 'Week' : 'Month'}
                  </button>
                ))}
              </div>
            </div>

            {/* Event list */}
            <div className="p-3 space-y-2 max-h-[520px] overflow-y-auto">
              {upcoming.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-[32px] text-zinc-300">event_available</span>
                  <p className="text-xs text-zinc-400 mt-2">No upcoming events</p>
                </div>
              ) : (
                upcoming.map(e => (
                  <UpcomingCard
                    key={e.id}
                    event={e}
                    onEdit={evt => {
                      setEditingEvent(evt)
                      setSelectedDay(new Date(evt.startAt))
                      setModalOpen(true)
                    }}
                  />
                ))
              )}
            </div>

            {/* Bottom CTA */}
            <div className="px-3 pb-3">
              <button
                type="button"
                onClick={() => { setEditingEvent(null); setSelectedDay(new Date()); setModalOpen(true) }}
                className="w-full border border-zinc-200 rounded-lg py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-black transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                New Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <EventModal
        open={modalOpen}
        editing={editingEvent}
        clients={clients}
        selectedDay={selectedDay}
        onClose={() => { setModalOpen(false); setEditingEvent(null) }}
        onSaved={handleSaved}
      />
    </div>
  )
}

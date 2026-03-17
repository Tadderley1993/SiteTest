import { useState, useRef, useEffect } from 'react'
import { Download, ChevronDown, Check, FileSpreadsheet, Info } from 'lucide-react'
import { Submission, Client } from '../../lib/api'

interface Props {
  submissions: Submission[]
  clients: Client[]
}

// ── Column definitions ────────────────────────────────────────────────────────

type ListType = 'submission' | 'client'
type ColKey =
  | 'source' | 'id' | 'dateAdded'
  | 'firstName' | 'lastName' | 'email' | 'phone'
  | 'organization' | 'title' | 'website' | 'notes'
  | 'instagram' | 'twitter' | 'linkedin' | 'facebook'
  | 'clientType' | 'services' | 'budget' | 'teamSize' | 'timeline' | 'description'

interface ColDef {
  key: ColKey
  header: string
  appliesTo: ListType[]
  fromSub: ((s: Submission) => string) | null
  fromClient: ((c: Client) => string) | null
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const COLS: ColDef[] = [
  // General
  { key: 'source',      header: 'Source',             appliesTo: ['submission', 'client'], fromSub: () => 'Submission', fromClient: () => 'Client' },
  { key: 'id',          header: 'ID',                 appliesTo: ['submission', 'client'], fromSub: s => String(s.id), fromClient: c => String(c.id) },
  { key: 'dateAdded',   header: 'Date Added',         appliesTo: ['submission', 'client'], fromSub: s => fmtDate(s.createdAt), fromClient: c => fmtDate(c.createdAt) },
  // Contact
  { key: 'firstName',   header: 'First Name',         appliesTo: ['submission', 'client'], fromSub: s => s.firstName, fromClient: c => c.firstName },
  { key: 'lastName',    header: 'Last Name',          appliesTo: ['submission', 'client'], fromSub: s => s.lastName, fromClient: c => c.lastName },
  { key: 'email',       header: 'Email',              appliesTo: ['submission', 'client'], fromSub: s => s.email, fromClient: c => c.email },
  { key: 'phone',       header: 'Phone',              appliesTo: ['submission', 'client'], fromSub: s => s.phone || '', fromClient: c => c.phone || '' },
  // Professional (client only)
  { key: 'organization',header: 'Organization',       appliesTo: ['client'], fromSub: null, fromClient: c => c.organization || '' },
  { key: 'title',       header: 'Job Title',          appliesTo: ['client'], fromSub: null, fromClient: c => c.title || '' },
  { key: 'website',     header: 'Website',            appliesTo: ['client'], fromSub: null, fromClient: c => c.website || '' },
  { key: 'notes',       header: 'Internal Notes',     appliesTo: ['client'], fromSub: null, fromClient: c => c.notes || '' },
  // Social (client only)
  { key: 'instagram',   header: 'Instagram',          appliesTo: ['client'], fromSub: null, fromClient: c => c.instagram || '' },
  { key: 'twitter',     header: 'Twitter / X',        appliesTo: ['client'], fromSub: null, fromClient: c => c.twitter || '' },
  { key: 'linkedin',    header: 'LinkedIn',           appliesTo: ['client'], fromSub: null, fromClient: c => c.linkedin || '' },
  { key: 'facebook',    header: 'Facebook',           appliesTo: ['client'], fromSub: null, fromClient: c => c.facebook || '' },
  // Submission details (submission only)
  { key: 'clientType',  header: 'Client Type',        appliesTo: ['submission'], fromSub: s => s.clientType, fromClient: null },
  { key: 'services',    header: 'Services Requested', appliesTo: ['submission'], fromSub: s => (Array.isArray(s.services) ? s.services.join('; ') : ''), fromClient: null },
  { key: 'budget',      header: 'Budget',             appliesTo: ['submission'], fromSub: s => s.budget || '', fromClient: null },
  { key: 'teamSize',    header: 'Team Size',          appliesTo: ['submission'], fromSub: s => s.teamSize || '', fromClient: null },
  { key: 'timeline',    header: 'Timeline',           appliesTo: ['submission'], fromSub: s => {
    const parts = [
      s.timelineMonths ? `${s.timelineMonths} months` : '',
      s.timelineWeeks  ? `${s.timelineWeeks} weeks`  : '',
      s.timelineDays   ? `${s.timelineDays} days`    : '',
    ].filter(Boolean)
    return parts.join(', ')
  }, fromClient: null },
  { key: 'description', header: 'Project Description',appliesTo: ['submission'], fromSub: s => s.description || '', fromClient: null },
]

interface ColGroup {
  label: string
  appliesTo: ListType[]
  keys: ColKey[]
}

const COL_GROUPS: ColGroup[] = [
  { label: 'General',             appliesTo: ['submission', 'client'], keys: ['source', 'id', 'dateAdded'] },
  { label: 'Contact Info',        appliesTo: ['submission', 'client'], keys: ['firstName', 'lastName', 'email', 'phone'] },
  { label: 'Professional',        appliesTo: ['client'],               keys: ['organization', 'title', 'website', 'notes'] },
  { label: 'Social Media',        appliesTo: ['client'],               keys: ['instagram', 'twitter', 'linkedin', 'facebook'] },
  { label: 'Submission Details',  appliesTo: ['submission'],           keys: ['clientType', 'services', 'budget', 'teamSize', 'timeline', 'description'] },
]

const COL_MAP = Object.fromEntries(COLS.map(c => [c.key, c])) as Record<ColKey, ColDef>

// ── CSV generation ─────────────────────────────────────────────────────────────

function esc(v: string | null | undefined): string {
  const s = v ?? ''
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

function generateCSV(
  inclSubs: boolean,
  inclClients: boolean,
  selectedCols: Set<ColKey>,
  submissions: Submission[],
  clients: Client[],
): string {
  const activeCols = COLS.filter(c => selectedCols.has(c.key))
  const header = activeCols.map(c => esc(c.header)).join(',')
  const lines = [header]

  if (inclSubs) {
    for (const s of submissions) {
      const row = activeCols.map(c => esc(c.fromSub ? c.fromSub(s) : ''))
      lines.push(row.join(','))
    }
  }

  if (inclClients) {
    for (const c of clients) {
      const row = activeCols.map(col => esc(col.fromClient ? col.fromClient(c) : ''))
      lines.push(row.join(','))
    }
  }

  return lines.join('\r\n')
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, color = '#E8FF47' }: { checked: boolean; onChange: () => void; color?: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all"
      style={{
        backgroundColor: checked ? color : 'transparent',
        borderColor: checked ? color : 'rgba(255,255,255,0.2)',
      }}
    >
      {checked && <Check className="w-3 h-3 text-[#080A0F]" strokeWidth={3} />}
    </button>
  )
}

function AvailBadge({ appliesTo, inclSubs, inclClients }: { appliesTo: ListType[]; inclSubs: boolean; inclClients: boolean }) {
  const needsSub    = appliesTo.includes('submission')
  const needsClient = appliesTo.includes('client')
  const hasBoth     = needsSub && needsClient

  if (hasBoth) return null // applies to everything selected, no badge needed

  // Only one type — show which
  const label = needsClient ? 'Clients only' : 'Submissions only'
  const missingList = needsClient ? !inclClients : !inclSubs

  if (missingList) {
    // The relevant list isn't even selected — show warning badge
    return (
      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-text-muted font-body">
        <Info className="w-2.5 h-2.5" />
        {label} — not selected
      </span>
    )
  }

  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-text-muted font-body">
      {label}
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

const ALL_KEYS = new Set<ColKey>(COLS.map(c => c.key))

export default function ExportContacts({ submissions, clients }: Props) {
  const [open, setOpen]               = useState(false)
  const [inclSubs, setInclSubs]       = useState(true)
  const [inclClients, setInclClients] = useState(true)
  const [selectedCols, setSelectedCols] = useState<Set<ColKey>>(new Set(ALL_KEYS))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggleCol = (key: ColKey) =>
    setSelectedCols(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const toggleGroup = (keys: ColKey[]) => {
    const allOn = keys.every(k => selectedCols.has(k))
    setSelectedCols(prev => {
      const next = new Set(prev)
      keys.forEach(k => allOn ? next.delete(k) : next.add(k))
      return next
    })
  }

  const selectAll  = () => setSelectedCols(new Set(ALL_KEYS))
  const selectNone = () => setSelectedCols(new Set())

  const nothingSelected   = !inclSubs && !inclClients
  const noColsSelected    = selectedCols.size === 0
  const disabled          = nothingSelected || noColsSelected
  const totalRecords      = (inclSubs ? submissions.length : 0) + (inclClients ? clients.length : 0)

  const handleDownload = () => {
    if (disabled) return
    const csv = '\uFEFF' + generateCSV(inclSubs, inclClients, selectedCols, submissions, clients)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const listLabel = inclSubs && inclClients ? 'all-contacts' : inclSubs ? 'submissions' : 'clients'
    a.href = url
    a.download = `dta-${listLabel}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-text-muted hover:text-text-primary hover:bg-white/5 text-sm font-body transition-colors"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Export
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[400px] rounded-2xl border border-white/[0.1] shadow-2xl z-50 flex flex-col"
          style={{ backgroundColor: '#0E1117', maxHeight: '80vh' }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-body">Export Contacts</span>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="overflow-y-auto flex-1">

            {/* ── Section 1: Lists ── */}
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-body mb-3">Include Lists</p>
              <div className="space-y-2.5">
                {([
                  { label: 'Submissions',      count: submissions.length, checked: inclSubs,    set: () => setInclSubs(v => !v),    color: '#E8FF47' },
                  { label: 'Current Clients',  count: clients.length,     checked: inclClients, set: () => setInclClients(v => !v), color: '#47C6FF' },
                ] as const).map(({ label, count, checked, set, color }) => (
                  <label key={label} className="flex items-center gap-3 cursor-pointer" onClick={set}>
                    <Toggle checked={checked} onChange={set} color={color} />
                    <span className="text-sm font-medium text-text-primary font-body flex-1">{label}</span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full font-body"
                      style={{ backgroundColor: `${color}18`, color }}
                    >
                      {count}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* ── Section 2: Fields ── */}
            <div className="px-5 py-4">
              {/* Sub-header with select all/none */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-body">Include Fields</p>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAll}  className="text-[10px] text-accent hover:underline font-body">All</button>
                  <span className="text-[10px] text-text-muted">·</span>
                  <button type="button" onClick={selectNone} className="text-[10px] text-text-muted hover:text-text-primary font-body">None</button>
                </div>
              </div>

              <div className="space-y-5">
                {COL_GROUPS.map(group => {
                  const keys = group.keys as ColKey[]
                  const allGroupOn = keys.every(k => selectedCols.has(k))
                  const someGroupOn = keys.some(k => selectedCols.has(k))

                  // Determine if this group is even applicable given list selection
                  const groupApplicable =
                    (group.appliesTo.includes('submission') && inclSubs) ||
                    (group.appliesTo.includes('client') && inclClients)

                  return (
                    <div key={group.label}>
                      {/* Group header */}
                      <div className="flex items-center gap-2 mb-2">
                        {/* Group toggle (indeterminate-aware) */}
                        <button
                          type="button"
                          onClick={() => toggleGroup(keys)}
                          className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            backgroundColor: allGroupOn ? 'rgba(232,255,71,0.15)' : 'transparent',
                            borderColor: allGroupOn ? '#E8FF47' : someGroupOn ? '#E8FF47' : 'rgba(255,255,255,0.2)',
                          }}
                        >
                          {allGroupOn && <Check className="w-2.5 h-2.5 text-accent" strokeWidth={3} />}
                          {!allGroupOn && someGroupOn && (
                            <div className="w-2 h-0.5 bg-accent rounded-full" />
                          )}
                        </button>
                        <span className={`text-xs font-semibold font-body ${groupApplicable ? 'text-text-primary' : 'text-text-muted'}`}>
                          {group.label}
                        </span>
                        <AvailBadge appliesTo={group.appliesTo} inclSubs={inclSubs} inclClients={inclClients} />
                      </div>

                      {/* Individual columns */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pl-6">
                        {keys.map(key => {
                          const col = COL_MAP[key]
                          const checked = selectedCols.has(key)

                          // Is this specific column applicable to the selected lists?
                          const colApplicable =
                            (col.appliesTo.includes('submission') && inclSubs) ||
                            (col.appliesTo.includes('client') && inclClients)

                          return (
                            <label
                              key={key}
                              className="flex items-center gap-2 cursor-pointer group"
                              onClick={() => toggleCol(key)}
                            >
                              <div
                                className="w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                                style={{
                                  backgroundColor: checked ? '#E8FF47' : 'transparent',
                                  borderColor: checked ? '#E8FF47' : 'rgba(255,255,255,0.2)',
                                  opacity: colApplicable ? 1 : 0.4,
                                }}
                              >
                                {checked && <Check className="w-2 h-2 text-[#080A0F]" strokeWidth={3.5} />}
                              </div>
                              <span
                                className="text-xs font-body leading-tight"
                                style={{
                                  color: colApplicable ? (checked ? '#F0F0F0' : '#888') : '#444',
                                }}
                              >
                                {col.header}
                                {!colApplicable && (
                                  <span className="ml-1 text-[10px] opacity-60">
                                    {col.appliesTo.includes('client') ? '(clients)' : '(subs)'}
                                  </span>
                                )}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-5 pb-5 pt-3 border-t border-white/[0.06] flex-shrink-0 space-y-2">
            {/* Summary line */}
            <div className="flex justify-between text-[11px] font-body text-text-muted">
              <span>{selectedCols.size} column{selectedCols.size !== 1 ? 's' : ''} selected</span>
              {!nothingSelected && <span>{totalRecords} record{totalRecords !== 1 ? 's' : ''}</span>}
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={disabled}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-background font-body font-bold text-sm disabled:opacity-35 hover:bg-accent/90 transition-all"
            >
              <Download className="w-4 h-4" />
              {nothingSelected
                ? 'Select a list first'
                : noColsSelected
                ? 'Select at least one field'
                : 'Download Spreadsheet (.csv)'}
            </button>

            <p className="text-[10px] text-text-muted text-center font-body">
              Opens in Excel, Google Sheets, or Numbers
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

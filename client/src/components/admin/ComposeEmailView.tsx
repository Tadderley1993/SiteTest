import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  getClients,
  getSubmissions,
  getEmailTemplates,
  getDeals,
  sendEmailTemplate,
  getSentEmailLogs,
  getSentEmailLog,
  Client,
  Submission,
  EmailTemplate,
  SentEmailLog,
  Deal,
} from '../../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

type RecipientTab = 'active' | 'crm' | 'submissions' | 'manual'

interface Recipient {
  key: string // unique key for dedup
  name: string
  email: string
  source: 'client' | 'submission' | 'manual'
  phone?: string
  organization?: string
  status?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

function buildPreviewHtml(template: { htmlContent: string; cssContent?: string | null }, vars: Record<string, string>): string {
  const css = template.cssContent ?? ''
  return applyVars(`<style>${css}</style>${template.htmlContent}`, vars)
}

function extractVars(html: string, css: string): string[] {
  const combined = html + (css ?? '')
  const matches = [...combined.matchAll(/\{\{(\w+)\}\}/g)]
  return [...new Set(matches.map(m => m[1]))]
}

function humanLabel(varName: string): string {
  return varName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()
}

const AGENCY_DEFAULTS: Record<string, string> = {
  agencyName: 'Designs By Terrence Adderley',
  agencyEmail: 'terrenceadderley@designsbyta.com',
  agencyWebsite: 'https://www.designsbyta.com',
}

function buildAutoFillFromRecipient(recipient: Recipient): Record<string, string> {
  const fills: Record<string, string> = {}
  const nameParts = recipient.name.split(' ')
  const firstName = nameParts[0] ?? ''
  const lastName = nameParts.slice(1).join(' ')

  const setIfHasSource = (keys: string[], value: string) => {
    if (!value) return
    keys.forEach(k => { fills[k] = value })
  }

  setIfHasSource(
    ['clientName', 'name', 'fullName', 'recipientName', 'toName'],
    recipient.name,
  )
  setIfHasSource(['clientFirstName', 'firstName'], firstName)
  setIfHasSource(['clientLastName', 'lastName'], lastName)
  setIfHasSource(['clientEmail', 'email'], recipient.email)
  if (recipient.phone) setIfHasSource(['clientPhone', 'phone'], recipient.phone)
  if (recipient.organization) {
    setIfHasSource(
      ['clientCompany', 'company', 'organization', 'businessName'],
      recipient.organization,
    )
  }

  return fills
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-[16px]">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search…'}
        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
      />
    </div>
  )
}

function RecipientChip({
  recipient,
  onRemove,
}: {
  recipient: Recipient
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-1.5 bg-black text-white text-xs font-medium px-2.5 py-1 rounded-full">
      <span className="material-symbols-outlined text-[13px]">person</span>
      <span className="max-w-[140px] truncate">{recipient.name}</span>
      <button type="button" onClick={onRemove} className="text-zinc-300 hover:text-white ml-0.5">
        <span className="material-symbols-outlined text-[13px]">close</span>
      </button>
    </div>
  )
}

function CheckRow({
  checked,
  onToggle,
  primary,
  secondary,
  badge,
}: {
  checked: boolean
  onToggle: () => void
  primary: string
  secondary: string
  badge?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 text-left transition-colors ${
        checked ? 'bg-zinc-50' : 'hover:bg-zinc-50/50'
      }`}
    >
      <span
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
          checked ? 'bg-black border-black' : 'border-zinc-300'
        }`}
      >
        {checked && (
          <span className="material-symbols-outlined text-[11px] text-white">check</span>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-black truncate">{primary}</p>
        <p className="text-[11px] text-zinc-400 truncate">{secondary}</p>
      </div>
      {badge}
    </button>
  )
}

// ── Active Clients Tab ────────────────────────────────────────────────────────

function ActiveClientsTab({
  clients,
  selected,
  onToggle,
}: {
  clients: Client[]
  selected: Set<string>
  onToggle: (r: Recipient) => void
}) {
  const [search, setSearch] = useState('')
  const activeClients = useMemo(
    () => clients.filter(c => (c.projectScope?.status ?? 'active') === 'active'),
    [clients],
  )
  const filtered = useMemo(
    () =>
      activeClients.filter(
        c =>
          !search ||
          `${c.firstName} ${c.lastName} ${c.email} ${c.organization ?? ''}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [activeClients, search],
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-zinc-100">
        <SearchInput value={search} onChange={setSearch} placeholder="Search active clients…" />
      </div>
      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
          {activeClients.length === 0 ? 'No active clients' : 'No matches'}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filtered.map(c => {
            const key = `client-${c.id}`
            const r: Recipient = {
              key,
              name: `${c.firstName} ${c.lastName}`,
              email: c.email,
              source: 'client',
              phone: c.phone,
              organization: c.organization,
              status: c.projectScope?.status,
            }
            return (
              <CheckRow
                key={key}
                checked={selected.has(key)}
                onToggle={() => onToggle(r)}
                primary={`${c.firstName} ${c.lastName}`}
                secondary={c.email}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── CRM Tab (Deals pipeline) ──────────────────────────────────────────────────

const DEAL_STAGE_COLORS: Record<string, string> = {
  lead:          'bg-zinc-100 text-zinc-600',
  qualified:     'bg-blue-100 text-blue-700',
  proposal_sent: 'bg-violet-100 text-violet-700',
  won:           'bg-green-100 text-green-700',
  lost:          'bg-red-100 text-red-600',
}

function CrmTab({
  deals,
  selected,
  onToggle,
}: {
  deals: Deal[]
  selected: Set<string>
  onToggle: (r: Recipient) => void
}) {
  const [search, setSearch] = useState('')
  // Only show deals that have a contact email
  const withEmail = useMemo(() => deals.filter(d => !!d.contactEmail), [deals])
  const filtered = useMemo(
    () =>
      withEmail.filter(
        d =>
          !search ||
          `${d.contactName ?? ''} ${d.contactEmail ?? ''} ${d.company ?? ''} ${d.title}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [withEmail, search],
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-zinc-100">
        <SearchInput value={search} onChange={setSearch} placeholder="Search pipeline…" />
      </div>
      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
          {withEmail.length === 0 ? 'No CRM contacts with email' : 'No matches'}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filtered.map(d => {
            const key = `deal-${d.id}`
            const name = d.contactName || d.title
            const r: Recipient = {
              key,
              name,
              email: d.contactEmail!,
              source: 'client',
              phone: d.contactPhone,
              organization: d.company,
              status: d.stage,
            }
            return (
              <CheckRow
                key={key}
                checked={selected.has(key)}
                onToggle={() => onToggle(r)}
                primary={name}
                secondary={`${d.contactEmail}${d.company ? ` · ${d.company}` : ''}`}
                badge={
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${DEAL_STAGE_COLORS[d.stage] ?? 'bg-zinc-100 text-zinc-600'}`}>
                    {d.stage.replace('_', ' ')}
                  </span>
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Submissions Tab ───────────────────────────────────────────────────────────

function SubmissionsTab({
  submissions,
  selected,
  onToggle,
}: {
  submissions: Submission[]
  selected: Set<string>
  onToggle: (r: Recipient) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(
    () =>
      submissions.filter(
        s =>
          !search ||
          `${s.firstName} ${s.lastName} ${s.email}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [submissions, search],
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-zinc-100">
        <SearchInput value={search} onChange={setSearch} placeholder="Search submissions…" />
      </div>
      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
          {submissions.length === 0 ? 'No submissions yet' : 'No matches'}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filtered.map(s => {
            const key = `submission-${s.id}`
            const r: Recipient = {
              key,
              name: `${s.firstName} ${s.lastName}`,
              email: s.email,
              source: 'submission',
              phone: s.phone,
            }
            const services = Array.isArray(s.services)
              ? s.services.join(', ')
              : (s.services as string) || ''
            return (
              <CheckRow
                key={key}
                checked={selected.has(key)}
                onToggle={() => onToggle(r)}
                primary={`${s.firstName} ${s.lastName}`}
                secondary={services ? `${s.email} · ${services}` : s.email}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Manual Tab ────────────────────────────────────────────────────────────────

function ManualTab({
  onAdd,
}: {
  onAdd: (r: Recipient) => void
}) {
  const [manualName, setManualName] = useState('')
  const [manualEmail, setManualEmail] = useState('')

  const handleAdd = () => {
    const trimName = manualName.trim()
    const trimEmail = manualEmail.trim()
    if (!trimEmail) return
    onAdd({
      key: `manual-${trimEmail}`,
      name: trimName || trimEmail,
      email: trimEmail,
      source: 'manual',
    })
    setManualName('')
    setManualEmail('')
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-zinc-500">Enter a single recipient manually.</p>
      <div>
        <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
          Name
        </label>
        <input
          type="text"
          value={manualName}
          onChange={e => setManualName(e.target.value)}
          placeholder="John Smith"
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
          Email *
        </label>
        <input
          type="email"
          value={manualEmail}
          onChange={e => setManualEmail(e.target.value)}
          placeholder="client@example.com"
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!manualEmail.trim()}
        className="w-full bg-black text-white py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40"
      >
        Add Recipient
      </button>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ComposeEmailView() {
  // Top-level tab
  const [mainTab, setMainTab] = useState<'compose' | 'sent'>('compose')

  // Sent log
  const [sentLogs, setSentLogs] = useState<SentEmailLog[]>([])
  const [sentLoading, setSentLoading] = useState(false)
  const [sentSearch, setSentSearch] = useState('')
  const [previewLog, setPreviewLog] = useState<SentEmailLog | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const loadSentLogs = useCallback(async () => {
    setSentLoading(true)
    try { setSentLogs(await getSentEmailLogs()) } catch { /* ignore */ }
    finally { setSentLoading(false) }
  }, [])

  useEffect(() => { if (mainTab === 'sent') loadSentLogs() }, [mainTab, loadSentLogs])

  const openPreview = async (log: SentEmailLog) => {
    // If body already cached on the list item, use it; otherwise fetch
    if (log.body != null) {
      setPreviewLog(log)
      return
    }
    setPreviewLoading(true)
    setPreviewLog({ ...log, body: null }) // open modal immediately (loading state)
    try {
      const full = await getSentEmailLog(log.id)
      setPreviewLog(full)
    } catch {
      setPreviewLog(prev => prev ? { ...prev, body: null } : null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const filteredLogs = useMemo(() => {
    const q = sentSearch.toLowerCase()
    if (!q) return sentLogs
    return sentLogs.filter(l =>
      l.toEmail.toLowerCase().includes(q) ||
      l.subject.toLowerCase().includes(q) ||
      (l.templateName ?? '').toLowerCase().includes(q)
    )
  }, [sentLogs, sentSearch])

  // Data
  const [clients, setClients] = useState<Client[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Recipient panel
  const [recipientTab, setRecipientTab] = useState<RecipientTab>('active')
  const [selectedRecipients, setSelectedRecipients] = useState<Map<string, Recipient>>(new Map())

  // Template + content
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('')
  const [subject, setSubject] = useState('')
  const [varValues, setVarValues] = useState<Record<string, string>>({})

  // Preview
  const [showPreview, setShowPreview] = useState(false)

  // Send state
  const [sending, setSending] = useState(false)
  const [sendProgress, setSendProgress] = useState<{ done: number; total: number } | null>(null)
  const [sendErrors, setSendErrors] = useState<string[]>([])
  const [sendSuccess, setSendSuccess] = useState(false)
  const [validationErr, setValidationErr] = useState('')

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        const [cls, dlss, subs, tmps] = await Promise.all([
          getClients(),
          getDeals(),
          getSubmissions(),
          getEmailTemplates(),
        ])
        setClients(cls)
        setDeals(dlss)
        setSubmissions(subs)
        // Filter out doc templates
        setTemplates(
          tmps.filter(
            t => t.category !== 'proposal_doc' && t.category !== 'invoice_doc',
          ),
        )
      } catch {
        // silently fail — user will see empty lists
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [])

  // Derived: selected template object
  const selectedTemplate = useMemo(
    () => (selectedTemplateId !== '' ? templates.find(t => t.id === selectedTemplateId) ?? null : null),
    [templates, selectedTemplateId],
  )

  // Derived: detected variables in the template
  const detectedVars = useMemo(
    () =>
      selectedTemplate
        ? extractVars(selectedTemplate.htmlContent, selectedTemplate.cssContent ?? '')
        : [],
    [selectedTemplate],
  )

  // When template changes: pre-fill subject and agency defaults
  useEffect(() => {
    if (!selectedTemplate) return
    setSubject(selectedTemplate.subject)
    setVarValues(prev => {
      const updated: Record<string, string> = {}
      detectedVars.forEach(v => {
        updated[v] = prev[v] ?? AGENCY_DEFAULTS[v] ?? ''
      })
      return updated
    })
  }, [selectedTemplate]) // eslint-disable-line react-hooks/exhaustive-deps

  // When recipients change (single): auto-fill client vars
  useEffect(() => {
    if (selectedRecipients.size !== 1) return
    const [r] = selectedRecipients.values()
    const autoFills = buildAutoFillFromRecipient(r)
    setVarValues(prev => {
      const updated = { ...prev }
      Object.entries(autoFills).forEach(([k, v]) => {
        if (detectedVars.includes(k)) updated[k] = v
      })
      return updated
    })
  }, [selectedRecipients]) // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle recipient in/out of selection
  function toggleRecipient(r: Recipient) {
    setSelectedRecipients(prev => {
      const next = new Map(prev)
      if (next.has(r.key)) {
        next.delete(r.key)
      } else {
        next.set(r.key, r)
      }
      return next
    })
  }

  function handleManualAdd(r: Recipient) {
    setSelectedRecipients(prev => {
      const next = new Map(prev)
      next.set(r.key, r)
      return next
    })
  }

  // Count selected per tab (for badges)
  const activeCount = useMemo(
    () =>
      [...selectedRecipients.values()].filter(
        r => r.source === 'client' && clients.find(c => c.projectScope?.status === 'active' && `client-${c.id}` === r.key),
      ).length,
    [selectedRecipients, clients],
  )

  const crmCount = useMemo(
    () => [...selectedRecipients.keys()].filter(k => k.startsWith('deal-')).length,
    [selectedRecipients],
  )

  const submissionCount = useMemo(
    () => [...selectedRecipients.values()].filter(r => r.source === 'submission').length,
    [selectedRecipients],
  )

  const manualCount = useMemo(
    () => [...selectedRecipients.values()].filter(r => r.source === 'manual').length,
    [selectedRecipients],
  )

  const tabBadges: Record<RecipientTab, number> = {
    active: activeCount,
    crm: crmCount,
    submissions: submissionCount,
    manual: manualCount,
  }

  const recipientArray = [...selectedRecipients.values()]

  // Send
  async function handleSend() {
    setValidationErr('')
    if (selectedRecipients.size === 0) {
      setValidationErr('Select at least one recipient.')
      return
    }
    if (!selectedTemplate) {
      setValidationErr('Select an email template.')
      return
    }
    if (!subject.trim()) {
      setValidationErr('Subject line is required.')
      return
    }

    setSending(true)
    setSendErrors([])
    setSendSuccess(false)
    setSendProgress({ done: 0, total: selectedRecipients.size })

    const errors: string[] = []
    let done = 0

    for (const r of recipientArray) {
      // Start from shared vars (agency defaults, custom message, etc.)
      // then always override with this recipient's own details
      const perRecipient: Record<string, string> = { ...varValues }
      const autoFills = buildAutoFillFromRecipient(r)
      Object.entries(autoFills).forEach(([k, v]) => {
        perRecipient[k] = v  // always override — each recipient gets their own name/email
      })

      try {
        await sendEmailTemplate(selectedTemplate.id, r.email, perRecipient)
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Unknown error'
        errors.push(`${r.email}: ${msg}`)
      }

      done++
      setSendProgress({ done, total: selectedRecipients.size })
    }

    setSending(false)
    setSendErrors(errors)

    if (errors.length === 0) {
      setSendSuccess(true)
      setSelectedRecipients(new Map())
    }
  }

  function handleReset() {
    setSendSuccess(false)
    setSendErrors([])
    setSendProgress(null)
    setValidationErr('')
  }

  const RECIPIENT_TABS: { id: RecipientTab; label: string; icon: string }[] = [
    { id: 'active', label: 'Active', icon: 'group' },
    { id: 'crm', label: 'CRM', icon: 'contacts' },
    { id: 'submissions', label: 'Leads', icon: 'inbox' },
    { id: 'manual', label: 'Manual', icon: 'edit' },
  ]

  return (
    <div className="flex flex-col -m-8 min-h-screen bg-[#f9f9f9]">
      {/* ── Page header ── */}
      <div className="px-8 pt-8 pb-0 border-b border-zinc-200/60 bg-[#f9f9f9]">
        <nav className="flex items-center gap-2 mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <span>Agency OS</span>
          <span>/</span>
          <span className="text-black">Compose</span>
        </nav>
        <div className="flex items-end justify-between">
          <h1 className="text-4xl font-bold tracking-tighter pb-5">Compose Email</h1>
          <div className="flex items-center gap-1 pb-0">
            {([
              { id: 'compose', label: 'Compose', icon: 'edit' },
              { id: 'sent',    label: 'Sent',    icon: 'outbox' },
            ] as { id: 'compose' | 'sent'; label: string; icon: string }[]).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMainTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  mainTab === tab.id
                    ? 'border-black text-black'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sent tab ── */}
      {mainTab === 'sent' && (
        <div className="flex-1 p-8">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold text-black flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-zinc-400">outbox</span>
                Sent Mail
                {sentLogs.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                    {sentLogs.length}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-zinc-400">search</span>
                  <input
                    type="text"
                    value={sentSearch}
                    onChange={e => setSentSearch(e.target.value)}
                    placeholder="Search sent…"
                    className="bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-black/20 w-52"
                  />
                </div>
                <button
                  type="button"
                  onClick={loadSentLogs}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Refresh
                </button>
              </div>
            </div>

            {/* Table */}
            {sentLoading ? (
              <div className="py-16 text-center text-zinc-400 text-sm">Loading…</div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-16 text-center">
                <span className="material-symbols-outlined text-4xl text-zinc-200 block mb-3">outbox</span>
                <p className="text-sm text-zinc-400">{sentSearch ? 'No results match your search' : 'No emails sent yet'}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-6 py-3">To</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-4 py-3">Subject</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-4 py-3">Template</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-4 py-3">Sent</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, i) => (
                    <tr
                      key={log.id}
                      onClick={() => openPreview(log)}
                      className={`border-t border-zinc-50 cursor-pointer transition-colors hover:bg-zinc-100/70 ${i % 2 === 1 ? 'bg-zinc-50/40' : ''}`}
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-[14px] text-zinc-500">person</span>
                          </div>
                          <span className="text-xs font-medium text-black">{log.toEmail}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 max-w-[220px] truncate">{log.subject || '—'}</td>
                      <td className="px-4 py-3">
                        {log.templateName ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                            {log.templateName}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-US', {
                          month: 'short', day: 'numeric',
                          hour: 'numeric', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 capitalize">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Success state ── */}
      {mainTab === 'compose' && sendSuccess && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-10 max-w-md w-full text-center">
            <span className="material-symbols-outlined text-5xl text-green-500 mb-4 block">
              check_circle
            </span>
            <h2 className="text-xl font-bold mb-2">Emails Sent!</h2>
            <p className="text-sm text-zinc-500 mb-6">
              Successfully sent to {recipientArray.length > 0 ? recipientArray.length : sendProgress?.total ?? 0} recipient
              {(sendProgress?.total ?? 0) !== 1 ? 's' : ''}.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors"
            >
              Compose Another
            </button>
          </div>
        </div>
      )}

      {/* ── Main two-col layout ── */}
      {mainTab === 'compose' && !sendSuccess && (
        <div className="flex flex-1 min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 176px)' }}>
          {/* ── Left panel: Template + Variables ── */}
          <div className="flex-1 overflow-y-auto p-8 space-y-5 border-r border-zinc-200/60">
            {/* Template picker */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-black mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-zinc-400">mail</span>
                Email Template
              </h2>

              {loadingData ? (
                <p className="text-sm text-zinc-400">Loading templates…</p>
              ) : (
                <select
                  value={selectedTemplateId}
                  onChange={e => {
                    const val = e.target.value
                    setSelectedTemplateId(val === '' ? '' : Number(val))
                    handleReset()
                  }}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 bg-white"
                >
                  <option value="">— Select a template —</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              )}

              {/* Subject */}
              {selectedTemplate && (
                <div className="mt-4">
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Subject line…"
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
              )}
            </div>

            {/* Variable fields */}
            {selectedTemplate && detectedVars.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[18px] text-zinc-400">tune</span>
                  <h2 className="text-sm font-bold text-black">Template Variables</h2>
                  <span className="ml-auto text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-semibold">
                    {detectedVars.length} detected
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-4">
                  Agency variables are pre-filled. Client variables are auto-filled when a single recipient is selected.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {detectedVars.map(v => {
                    const isAgency = v in AGENCY_DEFAULTS
                    const isLong = /^(message|body|content|notes|description)$/i.test(v)
                    return (
                      <div key={v} className={isLong ? 'sm:col-span-2' : ''}>
                        <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                          {humanLabel(v)}
                          {isAgency && (
                            <span className="text-[9px] bg-amber-100 text-amber-600 px-1.5 rounded-full font-bold">
                              Agency
                            </span>
                          )}
                        </label>
                        {/^(message|body|content|notes|description)$/i.test(v) ? (
                          <textarea
                            rows={6}
                            value={varValues[v] ?? ''}
                            onChange={e =>
                              setVarValues(prev => ({ ...prev, [v]: e.target.value }))
                            }
                            placeholder={`{{${v}}}`}
                            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 resize-y"
                          />
                        ) : (
                          <input
                            type="text"
                            value={varValues[v] ?? ''}
                            onChange={e =>
                              setVarValues(prev => ({ ...prev, [v]: e.target.value }))
                            }
                            placeholder={`{{${v}}}`}
                            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Send button */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
              {validationErr && (
                <p className="text-sm text-red-500 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {validationErr}
                </p>
              )}

              {sendErrors.length > 0 && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-semibold text-red-600 mb-1">
                    {sendErrors.length} error{sendErrors.length !== 1 ? 's' : ''}:
                  </p>
                  {sendErrors.map((e, i) => (
                    <p key={i} className="text-xs text-red-500">
                      {e}
                    </p>
                  ))}
                </div>
              )}

              {sending && sendProgress && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>Sending…</span>
                    <span>
                      {sendProgress.done}/{sendProgress.total}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full transition-all duration-300"
                      style={{ width: `${(sendProgress.done / sendProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {selectedTemplate && (
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:text-black transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                    Preview
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">
                        progress_activity
                      </span>
                      Sending…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      Send to {selectedRecipients.size} Recipient
                      {selectedRecipients.size !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── Right panel: Recipient picker ── */}
          <div className="w-[38%] flex-shrink-0 flex flex-col bg-white border-l border-zinc-200/60 overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-zinc-200">
              {RECIPIENT_TABS.map(tab => {
                const badge = tabBadges[tab.id]
                const isActive = recipientTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRecipientTab(tab.id)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[11px] font-semibold transition-colors border-b-2 ${
                      isActive
                        ? 'border-black text-black'
                        : 'border-transparent text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                    <span className="flex items-center gap-1">
                      {tab.label}
                      {badge > 0 && (
                        <span className="min-w-[16px] h-4 px-1 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center leading-none">
                          {badge}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {recipientTab === 'active' && (
                <ActiveClientsTab
                  clients={clients}
                  selected={new Set(selectedRecipients.keys())}
                  onToggle={toggleRecipient}
                />
              )}
              {recipientTab === 'crm' && (
                <CrmTab
                  deals={deals}
                  selected={new Set(selectedRecipients.keys())}
                  onToggle={toggleRecipient}
                />
              )}
              {recipientTab === 'submissions' && (
                <SubmissionsTab
                  submissions={submissions}
                  selected={new Set(selectedRecipients.keys())}
                  onToggle={toggleRecipient}
                />
              )}
              {recipientTab === 'manual' && <ManualTab onAdd={handleManualAdd} />}
            </div>

            {/* Selected chips */}
            {selectedRecipients.size > 0 && (
              <div className="border-t border-zinc-100 p-3 bg-zinc-50">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Selected ({selectedRecipients.size})
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedRecipients(new Map())}
                    className="ml-auto text-[11px] text-zinc-400 hover:text-black"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {recipientArray.map(r => (
                    <RecipientChip
                      key={r.key}
                      recipient={r}
                      onRemove={() => {
                        setSelectedRecipients(prev => {
                          const next = new Map(prev)
                          next.delete(r.key)
                          return next
                        })
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Compose preview modal ── */}
      {showPreview && selectedTemplate && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-start justify-between gap-4 flex-shrink-0">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Preview</p>
                <h2 className="text-base font-bold text-black truncate">
                  {applyVars(subject || selectedTemplate.subject || '(no subject)', varValues)}
                </h2>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                    {selectedTemplate.name}
                  </span>
                  {selectedRecipients.size > 0 && (
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <span className="material-symbols-outlined text-[13px]">group</span>
                      {selectedRecipients.size} recipient{selectedRecipients.size !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">info</span>
                    Variables shown with first recipient's data
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="flex-shrink-0 text-zinc-400 hover:text-black transition-colors mt-0.5"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Rendered email */}
            <div className="flex-1 overflow-hidden">
              <iframe
                srcDoc={buildPreviewHtml(selectedTemplate, (() => {
                  // Use first recipient's auto-fills merged with current var values
                  const first = [...selectedRecipients.values()][0]
                  if (!first) return varValues
                  const merged = { ...varValues }
                  Object.entries(buildAutoFillFromRecipient(first)).forEach(([k, v]) => { merged[k] = v })
                  return merged
                })())}
                title="Email preview"
                sandbox="allow-same-origin"
                className="w-full h-full border-0"
                style={{ minHeight: '480px' }}
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-zinc-100 flex items-center justify-between flex-shrink-0">
              <p className="text-xs text-zinc-400">
                This is a preview — variables filled with {selectedRecipients.size > 0 ? 'first recipient\'s' : 'current'} values
              </p>
              <button
                type="button"
                onClick={() => { setShowPreview(false); handleSend() }}
                disabled={sending}
                className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sent email preview modal ── */}
      {previewLog && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setPreviewLog(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-start justify-between gap-4 flex-shrink-0">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Sent Email</p>
                <h2 className="text-base font-bold text-black truncate">{previewLog.subject || '(no subject)'}</h2>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <span className="material-symbols-outlined text-[13px]">send</span>
                    To: <span className="font-medium text-black">{previewLog.toEmail}</span>
                  </span>
                  {previewLog.templateName && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                      {previewLog.templateName}
                    </span>
                  )}
                  <span className="text-xs text-zinc-400">
                    {new Date(previewLog.createdAt).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLog(null)}
                className="flex-shrink-0 text-zinc-400 hover:text-black transition-colors mt-0.5"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden">
              {previewLoading || previewLog.body == null ? (
                <div className="flex items-center justify-center h-64 text-zinc-400 text-sm gap-2">
                  {previewLoading ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      Loading…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">mail_off</span>
                      No preview available for this email
                    </>
                  )}
                </div>
              ) : (
                <iframe
                  srcDoc={previewLog.body}
                  title="Email preview"
                  sandbox="allow-same-origin"
                  className="w-full h-full border-0"
                  style={{ minHeight: '480px' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

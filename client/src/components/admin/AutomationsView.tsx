import { useState, useEffect } from 'react'
import { getAutomations, createAutomation, updateAutomation, deleteAutomation, runAutomation, getClients, type AutomationRule, type Client } from '../../lib/api'

const AUTOMATION_TYPES = [
  { id: 'proposal_followup', label: 'Proposal Follow-up', icon: 'follow_the_signs', desc: 'Auto-email clients whose proposals have been pending past the delay window.' },
  { id: 'welcome_email',     label: 'Welcome Email',      icon: 'waving_hand',      desc: 'Send a welcome message to newly added clients.' },
  { id: 'invoice_reminder',  label: 'Invoice Reminder',   icon: 'receipt_long',     desc: 'Remind clients of upcoming or overdue invoice payments.' },
  { id: 'payment_reminder',  label: 'Payment Reminder',   icon: 'payments',         desc: 'Email clients with overdue payment entries.' },
  { id: 'monthly_report',    label: 'Monthly Report',     icon: 'summarize',        desc: 'Email yourself a monthly financial summary.' },
]

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function RuleModal({ rule, onSave, onClose }: {
  rule: Partial<AutomationRule> | null
  onSave: (data: Partial<AutomationRule>) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: rule?.name || '',
    type: rule?.type || 'proposal_followup',
    delayDays: rule?.delayDays ?? 3,
    subject: rule?.subject || '',
    body: rule?.body || '',
    enabled: rule?.enabled ?? false,
  })
  const [targetMode, setTargetMode] = useState<'all' | 'specific'>(
    rule?.targetClientIds && rule.targetClientIds.length > 0 ? 'specific' : 'all'
  )
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>(rule?.targetClientIds ?? [])
  const [dedupeEnabled, setDedupeEnabled] = useState(rule?.dedupeEnabled ?? false)
  const [dedupeDays, setDedupeDays] = useState(rule?.dedupeDays ?? 30)
  const [clients, setClients] = useState<Client[]>([])
  const [saving, setSaving] = useState(false)
  const f = (k: keyof typeof form, v: string | number | boolean) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    getClients().then(setClients).catch(console.error)
  }, [])

  const toggleClient = (id: number) => {
    setSelectedClientIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // monthly_report has no client targeting
  const supportsTargeting = form.type !== 'monthly_report'

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">{rule?.id ? 'Edit Automation' : 'New Automation'}</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-black">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Name *</label>
            <input value={form.name} onChange={e => f('name', e.target.value)}
              className="w-full bg-[#f3f3f3] rounded-lg px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="e.g. 3-Day Proposal Follow-up" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Type</label>
            <select value={form.type} onChange={e => f('type', e.target.value)}
              className="w-full bg-[#f3f3f3] rounded-lg px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10">
              {AUTOMATION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <p className="text-xs text-zinc-400 mt-1.5">{AUTOMATION_TYPES.find(t => t.id === form.type)?.desc}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Delay (days)</label>
            <input type="number" min={0} value={form.delayDays} onChange={e => f('delayDays', parseInt(e.target.value) || 0)}
              className="w-full bg-[#f3f3f3] rounded-lg px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10" />
          </div>

          {/* Client targeting */}
          {supportsTargeting && (
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Target Clients</label>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setTargetMode('all')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${targetMode === 'all' ? 'bg-black text-white' : 'bg-[#f3f3f3] text-zinc-500 hover:text-black'}`}>
                  All matching clients
                </button>
                <button type="button" onClick={() => setTargetMode('specific')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${targetMode === 'specific' ? 'bg-black text-white' : 'bg-[#f3f3f3] text-zinc-500 hover:text-black'}`}>
                  Specific clients
                </button>
              </div>
              {targetMode === 'specific' && (
                <div className="border border-zinc-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {clients.length === 0 ? (
                    <p className="text-xs text-zinc-400 p-4 text-center">No clients yet</p>
                  ) : clients.map(c => (
                    <label key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 cursor-pointer border-b border-zinc-50 last:border-0">
                      <input
                        type="checkbox"
                        checked={selectedClientIds.includes(c.id)}
                        onChange={() => toggleClient(c.id)}
                        className="rounded border-zinc-300 text-black focus:ring-black/20"
                      />
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-zinc-900 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <span className="text-sm font-medium truncate">{c.firstName} {c.lastName}</span>
                        {c.organization && <span className="text-xs text-zinc-400 truncate">— {c.organization}</span>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {targetMode === 'specific' && selectedClientIds.length > 0 && (
                <p className="text-xs text-zinc-500 mt-1.5">
                  {selectedClientIds.length} client{selectedClientIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
              {targetMode === 'specific' && selectedClientIds.length === 0 && (
                <p className="text-xs text-red-400 mt-1.5">Select at least one client, or switch to "All matching clients"</p>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Email Subject <span className="normal-case text-zinc-400 font-normal">(optional — uses default if blank)</span></label>
            <input value={form.subject} onChange={e => f('subject', e.target.value)}
              className="w-full bg-[#f3f3f3] rounded-lg px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Leave blank for default subject" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Email Body <span className="normal-case text-zinc-400 font-normal">(optional)</span></label>
            <textarea value={form.body} onChange={e => f('body', e.target.value)} rows={5}
              className="w-full bg-[#f3f3f3] rounded-lg px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
              placeholder="Leave blank for default message..." />
          </div>
          {/* Dedupe toggle */}
          {supportsTargeting && (
            <div className="border border-zinc-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Skip recent recipients</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Don't send if they already received this email recently</p>
                </div>
                <div onClick={() => setDedupeEnabled(v => !v)}
                  className={`w-10 h-6 rounded-full cursor-pointer transition-colors relative flex-shrink-0 ${dedupeEnabled ? 'bg-black' : 'bg-zinc-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${dedupeEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </div>
              {dedupeEnabled && (
                <div className="flex items-center gap-3 pt-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Skip if sent within</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={dedupeDays}
                    onChange={e => setDedupeDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 bg-[#f3f3f3] rounded-lg px-3 py-2 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10 text-center font-semibold"
                  />
                  <span className="text-xs text-zinc-500">days</span>
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => f('enabled', !form.enabled)}
              className={`w-10 h-6 rounded-full transition-colors relative ${form.enabled ? 'bg-black' : 'bg-zinc-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium">{form.enabled ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-black">Cancel</button>
          <button type="button"
            disabled={!form.name.trim() || saving || (supportsTargeting && targetMode === 'specific' && selectedClientIds.length === 0)}
            onClick={async () => {
              setSaving(true)
              try {
                await onSave({
                  ...form,
                  targetClientIds: supportsTargeting && targetMode === 'specific' ? selectedClientIds : null,
                  dedupeEnabled,
                  dedupeDays,
                })
              } finally { setSaving(false) }
            }}
            className="px-5 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RuleCard({ rule, onEdit, onToggle, onRun, onDelete }: {
  rule: AutomationRule
  onEdit: (r: AutomationRule) => void
  onToggle: (r: AutomationRule) => void
  onRun: (r: AutomationRule) => void
  onDelete: (id: number) => void
}) {
  const [running, setRunning] = useState(false)
  const [lastResults, setLastResults] = useState<{ status: string; message: string }[]>([])
  const typeInfo = AUTOMATION_TYPES.find(t => t.id === rule.type)

  const handleRun = async () => {
    setRunning(true)
    setLastResults([])
    try {
      const { results } = await runAutomation(rule.id)
      setLastResults(results)
      onRun(rule)
    } catch (e) {
      setLastResults([{ status: 'error', message: 'Failed to run automation' }])
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="bg-white rounded-xl ring-1 ring-black/[0.05] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 bg-[#f3f3f3] rounded-xl flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-black text-[20px]">{typeInfo?.icon || 'bolt'}</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-black text-sm">{rule.name}</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {typeInfo?.label} · {rule.delayDays}d delay
              {rule.targetClientIds && rule.targetClientIds.length > 0
                ? ` · ${rule.targetClientIds.length} client${rule.targetClientIds.length !== 1 ? 's' : ''} targeted`
                : ' · All matching clients'}
              {rule.dedupeEnabled ? ` · No repeat within ${rule.dedupeDays}d` : ''}
            </p>
            {rule.lastRunAt && <p className="text-xs text-zinc-400 mt-0.5">Last run: {fmtDate(rule.lastRunAt)}</p>}
            {rule.runCount > 0 && <p className="text-xs text-zinc-400">Run {rule.runCount}× total</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div onClick={() => onToggle(rule)} className={`w-9 h-5 rounded-full cursor-pointer transition-colors relative ${rule.enabled ? 'bg-black' : 'bg-zinc-200'}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${rule.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <button type="button" onClick={() => onEdit(rule)} className="p-1.5 text-zinc-400 hover:text-black transition-colors">
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button type="button" onClick={handleRun} disabled={running}
            className="px-3 py-1.5 bg-[#f3f3f3] text-black text-xs font-semibold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">{running ? 'hourglass_empty' : 'play_arrow'}</span>
            {running ? 'Running...' : 'Run Now'}
          </button>
          <button type="button" onClick={() => onDelete(rule.id)} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>

      {lastResults.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {lastResults.map((r, i) => (
            <div key={i} className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${r.status === 'success' ? 'bg-green-50 text-green-700' : r.status === 'skipped' ? 'bg-zinc-50 text-zinc-500' : 'bg-red-50 text-red-600'}`}>
              <span className="material-symbols-outlined text-[14px] flex-shrink-0 mt-0.5">
                {r.status === 'success' ? 'check_circle' : r.status === 'skipped' ? 'info' : 'error'}
              </span>
              <span>{r.message}</span>
            </div>
          ))}
        </div>
      )}

      {rule.logs.length > 0 && lastResults.length === 0 && (
        <div className="mt-4 border-t border-zinc-50 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Recent Activity</p>
          <div className="space-y-1">
            {rule.logs.slice(0, 3).map(log => (
              <div key={log.id} className="flex items-center gap-2 text-xs text-zinc-500">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.status === 'success' ? 'bg-green-400' : log.status === 'skipped' ? 'bg-zinc-300' : 'bg-red-400'}`} />
                <span className="truncate">{log.message}</span>
                <span className="text-zinc-300 flex-shrink-0">{fmtDate(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AutomationsView() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<AutomationRule> | null | 'new'>(null)

  const load = () => getAutomations().then(setRules).catch(console.error).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleSave = async (data: Partial<AutomationRule>) => {
    if (modal !== 'new' && modal?.id) {
      const updated = await updateAutomation(modal.id, data)
      setRules(prev => prev.map(r => r.id === updated.id ? updated : r))
    } else {
      const created = await createAutomation(data)
      setRules(prev => [...prev, created])
    }
    setModal(null)
  }

  const handleToggle = async (rule: AutomationRule) => {
    const updated = await updateAutomation(rule.id, { enabled: !rule.enabled })
    setRules(prev => prev.map(r => r.id === updated.id ? updated : r))
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this automation?')) return
    await deleteAutomation(id)
    setRules(prev => prev.filter(r => r.id !== id))
  }

  const enabledCount = rules.filter(r => r.enabled).length

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <nav className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span>Agency OS</span><span>/</span><span className="text-black">Automations</span>
          </nav>
          <h1 className="text-4xl font-bold tracking-tighter">Automations</h1>
          <p className="text-zinc-400 text-sm mt-1">Automate repetitive tasks and client workflows</p>
        </div>
        <button type="button" onClick={() => setModal('new')}
          className="bg-black text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors">
          <span className="material-symbols-outlined text-[18px]">add</span>New Automation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Rules', value: rules.length, icon: 'bolt' },
          { label: 'Active', value: enabledCount, icon: 'check_circle' },
          { label: 'Total Runs', value: rules.reduce((s, r) => s + r.runCount, 0), icon: 'play_circle' },
        ].map(card => (
          <div key={card.label} className="bg-white p-6 rounded-xl ring-1 ring-black/[0.03]">
            <div className="p-2 bg-[#f3f3f3] rounded-lg w-fit mb-4">
              <span className="material-symbols-outlined text-black text-[20px]">{card.icon}</span>
            </div>
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">{card.label}</p>
            <h3 className="text-3xl font-bold tracking-tight">{card.value}</h3>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-400 text-sm">Loading...</div>
      ) : rules.length === 0 ? (
        <div className="bg-white rounded-xl ring-1 ring-black/[0.05] p-16 flex flex-col items-center text-center">
          <div className="p-5 bg-[#f3f3f3] rounded-2xl mb-6">
            <span className="material-symbols-outlined text-black text-[40px]">auto_awesome</span>
          </div>
          <h2 className="text-xl font-bold tracking-tighter mb-2">No automations yet</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-sm">Set up trigger-based workflows to save time and keep clients engaged automatically.</p>
          <button type="button" onClick={() => setModal('new')}
            className="px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors">
            Create First Automation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map(rule => (
            <RuleCard key={rule.id} rule={rule}
              onEdit={setModal}
              onToggle={handleToggle}
              onRun={load}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modal !== null && (
        <RuleModal
          rule={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

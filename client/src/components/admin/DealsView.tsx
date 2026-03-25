import { useState, useEffect } from 'react'
import { getDeals, createDeal, updateDeal, moveDeal, deleteDeal, type Deal } from '../../lib/api'

const STAGES: { id: Deal['stage']; label: string; color: string }[] = [
  { id: 'lead',          label: 'Lead',          color: 'bg-zinc-100 text-zinc-600' },
  { id: 'qualified',     label: 'Qualified',     color: 'bg-blue-50 text-blue-600' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: 'bg-amber-50 text-amber-600' },
  { id: 'won',           label: 'Won',           color: 'bg-green-50 text-green-700' },
  { id: 'lost',          label: 'Lost',          color: 'bg-red-50 text-red-500' },
]

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const EMPTY_FORM = { title: '', company: '', contactName: '', contactEmail: '', contactPhone: '', value: 0, stage: 'lead' as Deal['stage'], notes: '' }

function DealModal({ deal, onSave, onClose }: {
  deal: Partial<Deal> | null
  onSave: (data: Partial<Deal>) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState(deal ? { ...EMPTY_FORM, ...deal } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const f = (k: keyof typeof form, v: string | number) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">{deal?.id ? 'Edit Deal' : 'New Deal'}</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-black transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Deal Title *</label>
              <input value={form.title} onChange={e => f('title', e.target.value)}
                className="w-full bg-[#f3f3f3] rounded-lg px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="e.g. Website Redesign" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Company</label>
              <input value={form.company} onChange={e => f('company', e.target.value)}
                className="w-full bg-[#f3f3f3] rounded-lg px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Acme Corp" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Value ($)</label>
              <input type="number" value={form.value} onChange={e => f('value', parseFloat(e.target.value) || 0)}
                className="w-full bg-[#f3f3f3] rounded-lg px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Contact Name</label>
              <input value={form.contactName} onChange={e => f('contactName', e.target.value)}
                className="w-full bg-[#f3f3f3] rounded-lg px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Jane Smith" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Contact Email</label>
              <input value={form.contactEmail} onChange={e => f('contactEmail', e.target.value)}
                className="w-full bg-[#f3f3f3] rounded-lg px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="jane@example.com" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Stage</label>
              <select value={form.stage} onChange={e => f('stage', e.target.value as Deal['stage'])}
                className="w-full bg-[#f3f3f3] rounded-lg px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10">
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Phone</label>
              <input value={form.contactPhone} onChange={e => f('contactPhone', e.target.value)}
                className="w-full bg-[#f3f3f3] rounded-lg px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="+1 555 000 0000" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={3}
                className="w-full bg-[#f3f3f3] rounded-lg px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
                placeholder="Any relevant context..." />
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-black transition-colors">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving || !form.title.trim()}
            className="px-5 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Deal'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DealCard({ deal, onEdit, onMove, onDelete }: {
  deal: Deal
  onEdit: (d: Deal) => void
  onMove: (d: Deal, stage: Deal['stage']) => void
  onDelete: (id: number) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const currentIdx = STAGES.findIndex(s => s.id === deal.stage)
  const nextStage = STAGES[currentIdx + 1]

  return (
    <div className="bg-white rounded-xl p-4 ring-1 ring-black/[0.06] hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
            {initials(deal.contactName || deal.company || deal.title)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-black truncate">{deal.title}</p>
            {deal.company && <p className="text-xs text-zinc-400 truncate">{deal.company}</p>}
          </div>
        </div>
        <div className="relative flex-shrink-0">
          <button type="button" onClick={() => setMenuOpen(v => !v)}
            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-black transition-all">
            <span className="material-symbols-outlined text-[18px]">more_vert</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-20 bg-white rounded-xl shadow-lg ring-1 ring-black/[0.08] py-1 w-44" onMouseLeave={() => setMenuOpen(false)}>
              <button type="button" onClick={() => { onEdit(deal); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
                <span className="material-symbols-outlined text-[16px]">edit</span> Edit
              </button>
              {nextStage && (
                <button type="button" onClick={() => { onMove(deal, nextStage.id); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span> Move to {nextStage.label}
                </button>
              )}
              <button type="button" onClick={() => { onDelete(deal.id); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                <span className="material-symbols-outlined text-[16px]">delete</span> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="text-xl font-bold text-black tracking-tight">{fmt(deal.value)}</p>
      {deal.contactEmail && <p className="text-xs text-zinc-400 mt-1 truncate">{deal.contactEmail}</p>}
    </div>
  )
}

export default function DealsView() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<Deal> | null | 'new'>(null)

  useEffect(() => {
    getDeals().then(setDeals).catch(console.error).finally(() => setLoading(false))
  }, [])

  const totalValue = deals.filter(d => d.stage === 'won').reduce((s, d) => s + d.value, 0)
  const pipeline = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').reduce((s, d) => s + d.value, 0)

  const handleSave = async (data: Partial<Deal>) => {
    if ('id' in data && data.id) {
      const updated = await updateDeal(data.id, data)
      setDeals(prev => prev.map(d => d.id === updated.id ? updated : d))
    } else {
      const created = await createDeal(data)
      setDeals(prev => [...prev, created])
    }
    setModal(null)
  }

  const handleMove = async (deal: Deal, stage: Deal['stage']) => {
    const updated = await moveDeal(deal.id, stage)
    setDeals(prev => prev.map(d => d.id === updated.id ? updated : d))
  }

  const handleDelete = async (id: number) => {
    await deleteDeal(id)
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <nav className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span>Agency OS</span><span>/</span><span className="text-black">Deals</span>
          </nav>
          <h1 className="text-4xl font-bold tracking-tighter">CRM Pipeline</h1>
          <p className="text-zinc-400 text-sm mt-1">Track and manage your sales opportunities</p>
        </div>
        <button type="button" onClick={() => setModal('new')}
          className="bg-black text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors">
          <span className="material-symbols-outlined text-[18px]">add</span>New Deal
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Deals', value: deals.length, icon: 'handshake' },
          { label: 'Pipeline Value', value: '$' + pipeline.toLocaleString(), icon: 'trending_up' },
          { label: 'Won Revenue', value: '$' + totalValue.toLocaleString(), icon: 'paid' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl p-5 ring-1 ring-black/[0.05]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#f3f3f3] rounded-lg">
                <span className="material-symbols-outlined text-black text-[18px]">{kpi.icon}</span>
              </div>
              <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">{kpi.label}</p>
            </div>
            <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline columns */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-400 text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {STAGES.map(stage => {
            const stageDeals = deals.filter(d => d.stage === stage.id)
            const stageValue = stageDeals.reduce((s, d) => s + d.value, 0)
            return (
              <div key={stage.id} className="bg-[#f3f3f3] rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${stage.color}`}>{stage.label}</span>
                  <span className="text-xs text-zinc-400 font-medium">{stageDeals.length}</span>
                </div>
                {stageValue > 0 && (
                  <p className="text-xs font-semibold text-zinc-500 mb-3">{fmt(stageValue)}</p>
                )}
                <div className="space-y-2.5">
                  {stageDeals.map(deal => (
                    <DealCard key={deal.id} deal={deal} onEdit={setModal} onMove={handleMove} onDelete={handleDelete} />
                  ))}
                  <button type="button" onClick={() => setModal({ stage: stage.id })}
                    className="w-full py-2 text-xs text-zinc-400 hover:text-black border border-dashed border-zinc-300 rounded-lg transition-colors flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">add</span>Add
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal !== null && (
        <DealModal
          deal={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

interface Deal {
  id: number
  name: string
  company: string
  value: string
  stage: 'lead' | 'qualified' | 'proposal' | 'won'
  initials: string
}

const MOCK_DEALS: Deal[] = [
  { id: 1, name: 'Sarah Johnson', company: 'Bloom Creative Co.', value: '$4,200', stage: 'lead', initials: 'SJ' },
  { id: 2, name: 'Marcus Lee', company: 'Peak Performance Gym', value: '$7,500', stage: 'qualified', initials: 'ML' },
  { id: 3, name: 'Priya Nair', company: 'Nair Consulting', value: '$3,800', stage: 'proposal', initials: 'PN' },
  { id: 4, name: 'James Okafor', company: 'Okafor Law Group', value: '$12,000', stage: 'won', initials: 'JO' },
]

const STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-zinc-100 text-zinc-600' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-50 text-blue-600' },
  { id: 'proposal', label: 'Proposal Sent', color: 'bg-amber-50 text-amber-600' },
  { id: 'won', label: 'Won', color: 'bg-green-50 text-green-700' },
]

function DealCard({ deal }: { deal: Deal }) {
  return (
    <div className="bg-white rounded-xl p-4 ring-1 ring-black/[0.06] hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {deal.initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-black truncate">{deal.name}</p>
          <p className="text-xs text-zinc-400 truncate">{deal.company}</p>
        </div>
      </div>
      <p className="text-lg font-bold text-black tracking-tight">{deal.value}</p>
    </div>
  )
}

export default function DealsView() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <nav className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span>Agency OS</span>
            <span>/</span>
            <span className="text-black">Deals</span>
          </nav>
          <h1 className="text-4xl font-bold tracking-tighter">CRM Pipeline</h1>
          <p className="text-zinc-400 text-sm mt-1">Track and manage your sales opportunities</p>
        </div>
        <button className="bg-black text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add New Deal
        </button>
      </div>

      {/* Coming soon banner */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-zinc-400 text-[20px]">info</span>
        <p className="text-sm text-zinc-500">CRM pipeline coming soon — full backend integration in progress. Showing sample data.</p>
      </div>

      {/* Pipeline columns */}
      <div className="grid grid-cols-4 gap-4">
        {STAGES.map(stage => {
          const deals = MOCK_DEALS.filter(d => d.stage === stage.id)
          return (
            <div key={stage.id} className="bg-[#f3f3f3] rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stage.color}`}>
                  {stage.label}
                </span>
                <span className="text-xs text-zinc-400 font-medium">{deals.length}</span>
              </div>
              <div className="space-y-3">
                {deals.map(deal => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
                <button className="w-full py-2 text-xs text-zinc-400 hover:text-black border border-dashed border-zinc-300 rounded-lg transition-colors flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add deal
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

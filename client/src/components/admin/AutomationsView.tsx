const PLANNED_FEATURES = [
  'Auto-send proposal follow-ups after 3 days',
  'Welcome email sequence for new clients',
  'Invoice payment reminders',
  'Monthly financial summary reports',
  'Lead scoring from contact form submissions',
]

export default function AutomationsView() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <span>Agency OS</span>
          <span>/</span>
          <span className="text-black">Automations</span>
        </nav>
        <h1 className="text-4xl font-bold tracking-tighter">Automations</h1>
        <p className="text-zinc-400 text-sm mt-1">Automate repetitive tasks and client workflows</p>
      </div>

      {/* Coming soon card */}
      <div className="bg-white rounded-xl ring-1 ring-black/[0.05] p-12 flex flex-col items-center text-center max-w-lg mx-auto mt-16">
        <div className="p-5 bg-[#f3f3f3] rounded-2xl mb-6">
          <span className="material-symbols-outlined text-black text-[40px]">auto_awesome</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tighter mb-2">Coming Soon</h2>
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
          Automations will let you set up trigger-based workflows to save time and keep clients engaged automatically.
        </p>

        <div className="w-full text-left space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Planned features</p>
          {PLANNED_FEATURES.map(feature => (
            <div key={feature} className="flex items-start gap-3 text-sm text-zinc-600">
              <span className="material-symbols-outlined text-zinc-300 text-[18px] flex-shrink-0 mt-0.5">check_circle</span>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

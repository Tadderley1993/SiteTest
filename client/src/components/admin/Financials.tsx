import { useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, AlertCircle, Clock,
  Users, Target, Plus, Edit2, Trash2, Check, X, RefreshCw,
  BarChart2, PieChart as PieChartIcon, Link as LinkIcon,
  Paperclip, ExternalLink, XCircle,
} from 'lucide-react'
import {
  getFinancials, getExpenses, createExpense, updateExpense, deleteExpense,
  uploadExpenseReceipt, deleteExpenseReceipt, getExpenseReceiptUrl,
  FinancialsData, Expense, EXPENSE_CATEGORY_LABELS,
} from '../../lib/api'

// ── Constants ──
const CHART_COLORS = {
  collected: '#E8FF47',
  expenses: '#f87171',
  profit: '#4ade80',
  outstanding: '#47C6FF',
}

const PIE_COLORS = ['#E8FF47', '#47C6FF', '#4ade80', '#f87171', '#a78bfa', '#fb923c', '#f472b6', '#34d399', '#60a5fa']

const PERIODS = [
  { id: '1m', label: 'This Month', months: 1 },
  { id: '3m', label: 'This Quarter', months: 3 },
  { id: '6m', label: 'Last 6 Months', months: 6 },
  { id: '12m', label: 'This Year', months: 12 },
  { id: 'all', label: 'All Time', months: 12 },
] as const
type PeriodId = typeof PERIODS[number]['id']

// ── Helper functions ──
function fmt(n: number, compact = false): string {
  if (compact && n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function pct(n: number): string {
  return `${n.toFixed(1)}%`
}

// ── Sub-components (all defined at module level, never inside another component) ──

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  highlight?: boolean
  danger?: boolean
}

function KpiCard({ label, value, sub, icon, trend, highlight, danger }: KpiCardProps) {
  return (
    <div className={`bg-surface border rounded-xl p-5 flex flex-col gap-3 ${
      highlight ? 'border-accent/30 bg-accent/5' :
      danger ? 'border-red-400/30 bg-red-400/5' :
      'border-border'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted uppercase tracking-widest">{label}</span>
        <span className={highlight ? 'text-accent' : danger ? 'text-red-400' : 'text-text-muted'}>{icon}</span>
      </div>
      <div>
        <p className={`text-2xl font-bold ${highlight ? 'text-accent' : danger ? 'text-red-400' : 'text-text-primary'}`}>{value}</p>
        {sub && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${
            trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-text-muted'
          }`}>
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

interface SectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
}

function Section({ title, icon, children, action }: SectionProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-accent">{icon}</span>
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{name: string; value: number; color: string}>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-text-muted mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-bold">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

interface ExpenseFormProps {
  initial?: Partial<Expense>
  onSave: (data: Partial<Expense>, receiptFile?: File) => Promise<void>
  onCancel: () => void
  saving: boolean
}

function ExpenseForm({ initial, onSave, onCancel, saving }: ExpenseFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    amount: initial?.amount?.toString() ?? '',
    category: initial?.category ?? 'other',
    date: initial?.date ?? today,
    notes: initial?.notes ?? '',
    recurring: initial?.recurring ?? false,
    frequency: initial?.frequency ?? 'monthly',
  })
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ic = "w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent/40 placeholder-text-muted"

  return (
    <div className="bg-white/[0.03] border border-border rounded-xl p-5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-text-muted mb-1">Title</label>
          <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
            placeholder="e.g. Figma subscription" className={ic} />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Amount ($)</label>
          <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))}
            placeholder="0.00" min={0} step="0.01" className={ic} />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className={ic} />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Category</label>
          <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className={ic}>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Notes</label>
          <input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
            placeholder="Optional..." className={ic} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-text-muted mb-1">Receipt (PDF or image)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.heic"
            onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 border border-border text-text-muted text-sm rounded-lg hover:text-text-primary hover:border-white/20 transition-colors">
              <Paperclip className="w-3.5 h-3.5" />
              {receiptFile ? receiptFile.name : initial?.receiptName ? initial.receiptName : 'Attach receipt'}
            </button>
            {(receiptFile || initial?.receiptName) && (
              <button type="button" onClick={() => { setReceiptFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                className="p-1 text-text-muted hover:text-red-400 transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setForm(f => ({...f, recurring: !f.recurring}))}
            className={`w-9 h-5 rounded-full transition-colors relative ${form.recurring ? 'bg-accent' : 'bg-white/10'}`}
          >
            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${form.recurring ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-xs text-text-muted">Recurring</span>
        </label>
        {form.recurring && (
          <select value={form.frequency} onChange={e => setForm(f => ({...f, frequency: e.target.value}))}
            className="px-2 py-1 bg-white/5 border border-border rounded text-text-primary text-xs focus:outline-none">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={() => onSave({ ...form, amount: parseFloat(form.amount) || 0 }, receiptFile ?? undefined)}
          disabled={saving || !form.title || !form.amount}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-background text-sm font-semibold rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors">
          <Check className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 border border-border text-text-muted text-sm rounded-lg hover:text-text-primary transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Main component ──

export default function Financials() {
  const [data, setData] = useState<FinancialsData | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState<PeriodId>('12m')
  const [chartView, setChartView] = useState<'monthly' | 'quarterly'>('monthly')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [savingExpense, setSavingExpense] = useState(false)
  const [deletingExpenseId, setDeletingExpenseId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [fin, exp] = await Promise.all([getFinancials(), getExpenses()])
      setData(fin)
      setExpenses(exp)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load financials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filteredMonthly = data ? (
    period === 'all' ? data.revenueByMonth :
    data.revenueByMonth.slice(-(PERIODS.find(p => p.id === period)?.months ?? 12))
  ) : []

  const handleAddExpense = async (form: Partial<Expense>, receiptFile?: File) => {
    setSavingExpense(true)
    try {
      let exp = await createExpense(form)
      if (receiptFile) exp = await uploadExpenseReceipt(exp.id, receiptFile)
      setExpenses(prev => [exp, ...prev])
      setShowExpenseForm(false)
      await load()
    } finally { setSavingExpense(false) }
  }

  const handleEditExpense = async (form: Partial<Expense>, receiptFile?: File) => {
    if (!editingExpense) return
    setSavingExpense(true)
    try {
      let updated = await updateExpense(editingExpense.id, form)
      if (receiptFile) updated = await uploadExpenseReceipt(updated.id, receiptFile)
      setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e))
      setEditingExpense(null)
      await load()
    } finally { setSavingExpense(false) }
  }

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Delete this expense?')) return
    setDeletingExpenseId(id)
    try {
      await deleteExpense(id)
      setExpenses(prev => prev.filter(e => e.id !== id))
      await load()
    } finally { setDeletingExpenseId(null) }
  }

  if (loading) return <div className="text-center py-20 text-text-muted">Loading financial data...</div>
  if (error) return (
    <div className="flex items-center gap-3 p-5 bg-red-400/5 border border-red-400/20 rounded-xl text-red-400">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <span>{error}</span>
      <button onClick={load} className="ml-auto flex items-center gap-1 text-sm hover:underline"><RefreshCw className="w-3.5 h-3.5" />Retry</button>
    </div>
  )
  if (!data) return null

  const { summary } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart2 className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-semibold text-text-primary">Financial Overview</h2>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-3 py-1.5 border border-border text-text-muted text-sm rounded-lg hover:text-text-primary transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── PAYPAL BANNER ── */}
      {summary.paypalConnected && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#003087]/20 border border-[#003087]/40 rounded-xl text-sm">
          <LinkIcon className="w-4 h-4 text-[#009cde] flex-shrink-0" />
          <span className="text-[#009cde] font-medium">PayPal connected</span>
          <span className="text-text-muted">—</span>
          <span className="text-text-muted">{fmt(summary.paypalCollected)} from PayPal transactions</span>
          {summary.paypalOutstanding > 0 && (
            <>
              <span className="text-text-muted">·</span>
              <span className="text-yellow-400">{fmt(summary.paypalOutstanding)} PayPal invoices outstanding</span>
            </>
          )}
          <span className="ml-auto text-xs text-text-muted">{summary.paypalTransactionCount} transactions (last 12 months)</span>
        </div>
      )}

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Collected"
          value={fmt(summary.totalCollected)}
          sub={summary.paypalConnected
            ? `${fmt(summary.localCollected)} local · ${fmt(summary.paypalCollected)} PayPal`
            : `of ${fmt(summary.totalContractValue)} contracted`}
          icon={<DollarSign className="w-4 h-4" />}
          highlight
        />
        <KpiCard
          label="Outstanding"
          value={fmt(summary.totalOutstanding)}
          sub={summary.totalOverdue > 0 ? `${fmt(summary.totalOverdue)} overdue` : 'No overdue'}
          icon={<Clock className="w-4 h-4" />}
          trend={summary.totalOverdue > 0 ? 'down' : 'neutral'}
          danger={summary.totalOverdue > 0}
        />
        <KpiCard
          label="Total Expenses"
          value={fmt(summary.totalExpenses)}
          icon={<TrendingDown className="w-4 h-4" />}
        />
        <KpiCard
          label="Net Profit"
          value={fmt(summary.netProfit)}
          sub={`${pct(summary.profitMargin)} margin`}
          icon={<TrendingUp className="w-4 h-4" />}
          trend={summary.netProfit >= 0 ? 'up' : 'down'}
          danger={summary.netProfit < 0}
          highlight={summary.netProfit > 0}
        />
        <KpiCard
          label="Pipeline Value"
          value={fmt(summary.pipelineValue)}
          sub="Open proposals"
          icon={<Target className="w-4 h-4" />}
        />
        <KpiCard
          label="Win Rate"
          value={pct(summary.conversionRate)}
          sub={`${summary.acceptedProposals} of ${summary.totalProposals} proposals`}
          icon={<Target className="w-4 h-4" />}
          trend={summary.conversionRate >= 50 ? 'up' : 'neutral'}
        />
        <KpiCard
          label="Avg Deal Size"
          value={fmt(summary.avgDealSize)}
          sub="Accepted proposals"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <KpiCard
          label="Active Clients"
          value={summary.activeClients.toString()}
          icon={<Users className="w-4 h-4" />}
        />
      </div>

      {/* ── REVENUE CHART ── */}
      <Section
        title="Revenue vs Expenses"
        icon={<BarChart2 className="w-4 h-4" />}
        action={
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 mr-2">
              {PERIODS.map(p => (
                <button key={p.id} onClick={() => setPeriod(p.id)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${period === p.id ? 'bg-accent/10 text-accent border border-accent/20' : 'text-text-muted hover:text-text-primary'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={() => setChartView(v => v === 'monthly' ? 'quarterly' : 'monthly')}
              className="px-2.5 py-1 text-xs border border-border text-text-muted rounded-lg hover:text-text-primary transition-colors">
              {chartView === 'monthly' ? 'Quarterly' : 'Monthly'}
            </button>
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={280}>
          {chartView === 'monthly' ? (
            <BarChart data={filteredMonthly} barGap={2} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#666' }} />
              {summary.paypalConnected ? (
                <>
                  <Bar dataKey="local" name="Collected (Local)" stackId="c" fill={CHART_COLORS.collected} />
                  <Bar dataKey="paypal" name="Collected (PayPal)" stackId="c" fill="#009cde" radius={[4,4,0,0]} />
                </>
              ) : (
                <Bar dataKey="collected" name="Collected" fill={CHART_COLORS.collected} radius={[4,4,0,0]} />
              )}
              <Bar dataKey="expenses" name="Expenses" fill={CHART_COLORS.expenses} radius={[4,4,0,0]} />
              <Bar dataKey="profit" name="Profit" fill={CHART_COLORS.profit} radius={[4,4,0,0]} />
            </BarChart>
          ) : (
            <BarChart data={data.revenueByQuarter} barGap={2} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#666' }} />
              <Bar dataKey="collected" name="Collected" fill={CHART_COLORS.collected} radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill={CHART_COLORS.expenses} radius={[4,4,0,0]} />
              <Bar dataKey="profit" name="Profit" fill={CHART_COLORS.profit} radius={[4,4,0,0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Section>

      {/* ── BOTTOM ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense breakdown pie */}
        <Section title="Expenses by Category" icon={<PieChartIcon className="w-4 h-4" />}>
          {data.expenseCategories.length === 0 ? (
            <p className="text-center text-text-muted text-sm py-8">No expenses recorded yet.</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={data.expenseCategories} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {data.expenseCategories.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {data.expenseCategories.map((cat, i) => (
                  <div key={cat.category} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-text-muted flex-1 truncate">{EXPENSE_CATEGORY_LABELS[cat.category] ?? cat.category}</span>
                    <span className="text-xs font-medium text-text-primary">{fmt(cat.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Payment status breakdown */}
        <Section title="Payment Status" icon={<Target className="w-4 h-4" />}>
          <div className="space-y-3">
            {[
              { label: 'Collected', value: data.statusBreakdown.collected, color: 'bg-accent', textColor: 'text-accent' },
              { label: 'Pending', value: data.statusBreakdown.pending, color: 'bg-accent-secondary', textColor: 'text-accent-secondary' },
              { label: 'Overdue', value: data.statusBreakdown.overdue, color: 'bg-red-400', textColor: 'text-red-400' },
              { label: 'Cancelled', value: data.statusBreakdown.cancelled, color: 'bg-white/20', textColor: 'text-text-muted' },
            ].map(item => {
              const total = data.statusBreakdown.collected + data.statusBreakdown.pending + data.statusBreakdown.overdue + data.statusBreakdown.cancelled
              const pctVal = total > 0 ? (item.value / total) * 100 : 0
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={item.textColor}>{item.label}</span>
                    <span className="text-text-muted">{item.value} payments ({pct(pctVal)})</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${pctVal}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{fmt(summary.totalCollected)}</p>
              <p className="text-xs text-text-muted mt-0.5">Total Collected</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent-secondary">{fmt(summary.totalOutstanding)}</p>
              <p className="text-xs text-text-muted mt-0.5">Total Outstanding</p>
            </div>
          </div>
        </Section>
      </div>

      {/* ── CLIENT REVENUE TABLE ── */}
      {data.clientRevenue.length > 0 && (
        <Section title="Revenue by Client" icon={<Users className="w-4 h-4" />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-text-muted font-medium pb-3">Client</th>
                  <th className="text-right text-xs text-text-muted font-medium pb-3">Contract</th>
                  <th className="text-right text-xs text-text-muted font-medium pb-3">Collected</th>
                  <th className="text-right text-xs text-text-muted font-medium pb-3">Outstanding</th>
                  <th className="text-right text-xs text-text-muted font-medium pb-3">Collected %</th>
                </tr>
              </thead>
              <tbody>
                {data.clientRevenue.map((c, i) => {
                  const collectedPct = c.contract > 0 ? (c.collected / c.contract) * 100 : 0
                  return (
                    <tr key={i} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 text-text-primary font-medium">{c.name}</td>
                      <td className="py-3 text-right text-text-muted">{c.contract > 0 ? fmt(c.contract) : '—'}</td>
                      <td className="py-3 text-right text-accent font-medium">{fmt(c.collected)}</td>
                      <td className="py-3 text-right text-accent-secondary">{c.outstanding > 0 ? fmt(c.outstanding) : <span className="text-text-muted">—</span>}</td>
                      <td className="py-3 text-right">
                        {c.contract > 0 ? (
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(collectedPct, 100)}%` }} />
                            </div>
                            <span className="text-xs text-text-muted">{pct(collectedPct)}</span>
                          </div>
                        ) : <span className="text-text-muted text-xs">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── RECENT PAYMENTS ── */}
      {data.recentPayments.length > 0 && (
        <Section title="Recent Payments" icon={<DollarSign className="w-4 h-4" />}>
          <div className="space-y-2">
            {data.recentPayments.map(p => (
              <div key={String(p.id)} className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${p.source === 'paypal' ? 'bg-[#003087]/30' : 'bg-accent/10'}`}>
                  <DollarSign className={`w-4 h-4 ${p.source === 'paypal' ? 'text-[#009cde]' : 'text-accent'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-text-primary truncate">{p.label}</p>
                    {p.source === 'paypal' && (
                      <span className="text-xs text-[#009cde] bg-[#003087]/20 border border-[#003087]/40 px-1.5 py-0.5 rounded-full flex-shrink-0">PayPal</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">{p.clientName}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${p.source === 'paypal' ? 'text-[#009cde]' : 'text-accent'}`}>{fmt(p.amount)}</p>
                  <p className="text-xs text-text-muted">{p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── EXPENSE MANAGER ── */}
      <Section
        title="Expense Manager"
        icon={<TrendingDown className="w-4 h-4" />}
        action={
          !showExpenseForm && !editingExpense ? (
            <button onClick={() => setShowExpenseForm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent text-background text-xs font-semibold rounded-lg hover:bg-accent/90 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Add Expense
            </button>
          ) : undefined
        }
      >
        {showExpenseForm && (
          <div className="mb-4">
            <ExpenseForm onSave={handleAddExpense} onCancel={() => setShowExpenseForm(false)} saving={savingExpense} />
          </div>
        )}

        {expenses.length === 0 && !showExpenseForm ? (
          <p className="text-center text-text-muted text-sm py-8">No expenses recorded. Add your first expense above.</p>
        ) : (
          <div className="space-y-2">
            {expenses.map(exp => (
              <div key={exp.id}>
                {editingExpense?.id === exp.id ? (
                  <ExpenseForm initial={exp} onSave={handleEditExpense} onCancel={() => setEditingExpense(null)} saving={savingExpense} />
                ) : (
                  <div className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] border border-border/50 rounded-xl hover:border-border transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-text-primary font-medium">{exp.title}</p>
                        {exp.recurring && (
                          <span className="text-xs text-accent-secondary bg-accent-secondary/10 border border-accent-secondary/20 px-2 py-0.5 rounded-full">
                            {exp.frequency}
                          </span>
                        )}
                        {exp.receiptName && (
                          <a
                            href={getExpenseReceiptUrl(exp.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
                            title={exp.receiptName}
                          >
                            <Paperclip className="w-3 h-3" />
                            <span className="max-w-[80px] truncate">{exp.receiptName}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">
                        {EXPENSE_CATEGORY_LABELS[exp.category] ?? exp.category} · {new Date(exp.date).toLocaleDateString()}
                        {exp.notes && ` · ${exp.notes}`}
                      </p>
                    </div>
                    <p className="font-bold text-red-400 flex-shrink-0">{fmt(exp.amount)}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {exp.receiptName && (
                        <button
                          onClick={async () => {
                            if (!confirm('Remove this receipt?')) return
                            const updated = await deleteExpenseReceipt(exp.id)
                            setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e))
                          }}
                          className="p-1.5 text-text-muted hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors"
                          title="Remove receipt"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => setEditingExpense(exp)}
                        className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteExpense(exp.id)} disabled={deletingExpenseId === exp.id}
                        className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

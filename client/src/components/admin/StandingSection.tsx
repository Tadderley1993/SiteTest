import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign, TrendingUp, TrendingDown, Clock, AlertTriangle,
  CheckCircle, XCircle, RotateCcw, Plus, Trash2, Pencil, Save,
  X, ChevronDown, ChevronUp, FileText, Shield, Zap
} from 'lucide-react'
import {
  ClientStanding, PaymentEntry, Invoice, StandingData,
  getStanding, updateStanding, createPayment, updatePayment,
  deletePayment, createInvoice, updateInvoice, deleteInvoice,
} from '../../lib/api'

interface Props {
  clientId: number
}

// ── helpers ────────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$' }

const fmt = (amount: number, currency = 'USD') =>
  `${CURRENCY_SYMBOLS[currency] ?? '$'}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const isOverdue = (entry: PaymentEntry) =>
  entry.status === 'pending' && new Date(entry.dueDate) < new Date()

const PAYMENT_STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:        { label: 'Pending',       color: 'text-zinc-500 bg-[#f3f3f3] border-zinc-200',           icon: <Clock className="w-3 h-3" /> },
  'paid-on-time': { label: 'Paid On Time',  color: 'text-green-600 bg-green-500/10 border-green-400/20',   icon: <CheckCircle className="w-3 h-3" /> },
  'paid-late':    { label: 'Paid Late',     color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',icon: <Clock className="w-3 h-3" /> },
  rearranged:     { label: 'Rearranged',    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',      icon: <RotateCcw className="w-3 h-3" /> },
  overdue:        { label: 'Overdue',       color: 'text-red-500 bg-red-500/10 border-red-400/20',         icon: <AlertTriangle className="w-3 h-3" /> },
  cancelled:      { label: 'Cancelled',     color: 'text-zinc-500 bg-[#f3f3f3] border-zinc-200 line-through', icon: <XCircle className="w-3 h-3" /> },
}

const INVOICE_STATUS_META: Record<string, { label: string; color: string }> = {
  draft:   { label: 'Draft',   color: 'text-zinc-500 bg-[#f3f3f3] border-zinc-200' },
  sent:    { label: 'Sent',    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  paid:    { label: 'Paid',    color: 'text-green-600 bg-green-500/10 border-green-400/20' },
  overdue: { label: 'Overdue', color: 'text-red-500 bg-red-500/10 border-red-400/20' },
  void:    { label: 'Void',    color: 'text-zinc-500 bg-[#f3f3f3] border-zinc-200 line-through' },
}

function StatusBadge({ status, meta }: { status: string; meta: Record<string, { label: string; color: string; icon?: React.ReactNode }> }) {
  const m = meta[status] ?? { label: status, color: 'text-zinc-500 bg-[#f3f3f3] border-zinc-200', icon: null }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${m.color}`}>
      {m.icon}{m.label}
    </span>
  )
}

// ── sub-component: Payment row editor ─────────────────────────────────────────

interface PaymentRowProps {
  payment: PaymentEntry
  currency: string
  clientId: number
  onUpdate: (p: PaymentEntry) => void
  onDelete: (id: number) => void
}

function PaymentRow({ payment, currency, clientId, onUpdate, onDelete }: PaymentRowProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(payment)
  const overdue = isOverdue(payment)

  const save = async () => {
    const updated = await updatePayment(clientId, payment.id, form)
    onUpdate(updated)
    setEditing(false)
  }

  if (editing) {
    return (
      <tr className="bg-zinc-50 border-b border-zinc-100">
        <td colSpan={7} className="px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Label</label>
              <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Amount</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded px-2 py-1.5 text-sm text-black focus:outline-none">
                {Object.keys(PAYMENT_STATUS_META).map(s => <option key={s} value={s}>{PAYMENT_STATUS_META[s].label}</option>)}
              </select>
            </div>
            {(form.status === 'paid-on-time' || form.status === 'paid-late') && (
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Paid Date</label>
                <input type="date" value={form.paidDate ?? ''} onChange={e => setForm(f => ({ ...f, paidDate: e.target.value }))}
                  className="w-full bg-[#f3f3f3] border border-zinc-200 rounded px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10" />
              </div>
            )}
            {form.status === 'rearranged' && (
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Rearranged To</label>
                <input type="date" value={form.rearrangedTo ?? ''} onChange={e => setForm(f => ({ ...f, rearrangedTo: e.target.value }))}
                  className="w-full bg-[#f3f3f3] border border-zinc-200 rounded px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10" />
              </div>
            )}
            <div className="md:col-span-3">
              <label className="text-xs text-zinc-500 block mb-1">Notes</label>
              <input value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional note..."
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-xs text-zinc-500 hover:text-black px-3 py-1.5 transition-colors">Cancel</button>
            <button onClick={save} className="flex items-center gap-1 text-xs bg-black text-white px-3 py-1.5 rounded font-medium hover:bg-zinc-800 transition-colors">
              <Save className="w-3 h-3" /> Save
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className={`border-b border-zinc-100 group hover:bg-[#f3f3f3] transition-colors ${overdue ? 'bg-red-500/[0.03]' : ''}`}>
      <td className="px-4 py-3 text-sm text-black font-medium">
        {payment.label}
        {overdue && <span className="ml-2 text-xs text-red-500 font-normal">(overdue)</span>}
      </td>
      <td className="px-4 py-3 text-sm text-black font-mono">{fmt(payment.amount, currency)}</td>
      <td className="px-4 py-3 text-sm text-zinc-500">{payment.dueDate}</td>
      <td className="px-4 py-3">
        <StatusBadge status={overdue ? 'overdue' : payment.status} meta={PAYMENT_STATUS_META} />
      </td>
      <td className="px-4 py-3 text-xs text-zinc-500">
        {payment.paidDate && <span>Paid: {payment.paidDate}</span>}
        {payment.rearrangedTo && <span>→ {payment.rearrangedTo}</span>}
      </td>
      <td className="px-4 py-3 text-xs text-zinc-500 max-w-[140px] truncate">{payment.notes}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => { setForm(payment); setEditing(true) }} className="text-zinc-500 hover:text-black transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => onDelete(payment.id)} className="text-zinc-500 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </td>
    </tr>
  )
}

// ── sub-component: Invoice row ─────────────────────────────────────────────────

interface InvoiceRowProps {
  invoice: Invoice
  currency: string
  clientId: number
  onUpdate: (inv: Invoice) => void
  onDelete: (id: number) => void
}

function InvoiceRow({ invoice, currency, clientId, onUpdate, onDelete }: InvoiceRowProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(invoice)

  const save = async () => {
    const updated = await updateInvoice(clientId, invoice.id, form)
    onUpdate(updated)
    setEditing(false)
  }

  if (editing) {
    return (
      <tr className="bg-zinc-50 border-b border-zinc-100">
        <td colSpan={7} className="px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Invoice #</label>
              <input value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Amount</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded px-2 py-1.5 text-sm text-black focus:outline-none">
                {Object.keys(INVOICE_STATUS_META).map(s => <option key={s} value={s}>{INVOICE_STATUS_META[s].label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Issued Date</label>
              <input type="date" value={form.issuedDate} onChange={e => setForm(f => ({ ...f, issuedDate: e.target.value }))}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10" />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs text-zinc-500 block mb-1">Description</label>
              <input value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10" />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs text-zinc-500 block mb-1">Notes</label>
              <input value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-xs text-zinc-500 hover:text-black px-3 py-1.5 transition-colors">Cancel</button>
            <button onClick={save} className="flex items-center gap-1 text-xs bg-black text-white px-3 py-1.5 rounded font-medium hover:bg-zinc-800 transition-colors">
              <Save className="w-3 h-3" /> Save
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-zinc-100 group hover:bg-[#f3f3f3] transition-colors">
      <td className="px-4 py-3 text-sm font-mono text-black/80">{invoice.invoiceNumber}</td>
      <td className="px-4 py-3 text-sm text-zinc-500 max-w-[160px] truncate">{invoice.description || '—'}</td>
      <td className="px-4 py-3 text-sm text-black font-mono">{fmt(invoice.amount, currency)}</td>
      <td className="px-4 py-3 text-xs text-zinc-500">{invoice.issuedDate}</td>
      <td className="px-4 py-3 text-xs text-zinc-500">{invoice.dueDate}</td>
      <td className="px-4 py-3"><StatusBadge status={invoice.status} meta={INVOICE_STATUS_META} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => { setForm(invoice); setEditing(true) }} className="text-zinc-500 hover:text-black transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => onDelete(invoice.id)} className="text-zinc-500 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </td>
    </tr>
  )
}

// ── main component ─────────────────────────────────────────────────────────────

export default function StandingSection({ clientId }: Props) {
  const [data, setData] = useState<StandingData>({ standing: null, payments: [], invoices: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Standing edit
  const [editingStanding, setEditingStanding] = useState(false)
  const [standingForm, setStandingForm] = useState<Partial<ClientStanding>>({})
  const [savingStanding, setSavingStanding] = useState(false)

  // Add payment form
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ label: '', amount: '', dueDate: '', status: 'pending', notes: '' })

  // Add invoice form
  const [showAddInvoice, setShowAddInvoice] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({ invoiceNumber: '', description: '', amount: '', issuedDate: '', dueDate: '', status: 'draft', notes: '' })

  // Section collapse
  const [collapseSchedule, setCollapseSchedule] = useState(false)
  const [collapseInvoices, setCollapseInvoices] = useState(false)

  useEffect(() => {
    getStanding(clientId)
      .then(d => {
        setData(d)
        setStandingForm(d.standing ?? { currency: 'USD', totalContract: 0 })
      })
      .catch(() => setError('Failed to load financial data'))
      .finally(() => setIsLoading(false))
  }, [clientId])

  const currency = data.standing?.currency ?? 'USD'

  // Derived metrics
  const paidStatuses = new Set(['paid-on-time', 'paid-late'])
  const amountPaid = data.payments
    .filter(p => paidStatuses.has(p.status))
    .reduce((s, p) => s + p.amount, 0)

  const amountDue = data.payments
    .filter(p => p.status === 'pending' || p.status === 'overdue' || isOverdue(p))
    .reduce((s, p) => s + p.amount, 0)

  const totalContract = data.standing?.totalContract ?? 0
  const completedPayments = data.payments.filter(p => paidStatuses.has(p.status))
  const onTimeCount = data.payments.filter(p => p.status === 'paid-on-time').length
  const paymentHealthPct = completedPayments.length > 0 ? Math.round((onTimeCount / completedPayments.length) * 100) : null

  const nextPayment = data.payments
    .filter(p => p.status === 'pending' && !isOverdue(p))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

  const overduePayments = data.payments.filter(p => isOverdue(p) || p.status === 'overdue')

  const daysUntil = (date: string) => {
    const diff = new Date(date).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const healthLabel = paymentHealthPct === null ? null
    : paymentHealthPct === 100 ? { label: 'Excellent', color: 'text-green-600', icon: <Shield className="w-4 h-4" /> }
    : paymentHealthPct >= 75  ? { label: 'Good',      color: 'text-black',    icon: <TrendingUp className="w-4 h-4" /> }
    : paymentHealthPct >= 50  ? { label: 'Fair',       color: 'text-yellow-400',icon: <Zap className="w-4 h-4" /> }
    :                           { label: 'Poor',        color: 'text-red-500',   icon: <TrendingDown className="w-4 h-4" /> }

  const progressPct = totalContract > 0 ? Math.min((amountPaid / totalContract) * 100, 100) : 0

  // Handlers
  const saveStanding = async () => {
    setSavingStanding(true)
    try {
      const updated = await updateStanding(clientId, standingForm)
      setData(d => ({ ...d, standing: updated }))
      setEditingStanding(false)
    } catch { setError('Failed to save') }
    finally { setSavingStanding(false) }
  }

  const addPayment = async () => {
    if (!paymentForm.label || !paymentForm.amount || !paymentForm.dueDate) return
    const p = await createPayment(clientId, {
      label: paymentForm.label,
      amount: parseFloat(paymentForm.amount),
      dueDate: paymentForm.dueDate,
      status: paymentForm.status,
      notes: paymentForm.notes || undefined,
      order: data.payments.length,
    })
    setData(d => ({ ...d, payments: [...d.payments, p] }))
    setPaymentForm({ label: '', amount: '', dueDate: '', status: 'pending', notes: '' })
    setShowAddPayment(false)
  }

  const addInvoice = async () => {
    if (!invoiceForm.invoiceNumber || !invoiceForm.amount || !invoiceForm.issuedDate || !invoiceForm.dueDate) return
    const inv = await createInvoice(clientId, {
      invoiceNumber: invoiceForm.invoiceNumber,
      description: invoiceForm.description || undefined,
      amount: parseFloat(invoiceForm.amount),
      issuedDate: invoiceForm.issuedDate,
      dueDate: invoiceForm.dueDate,
      status: invoiceForm.status,
      notes: invoiceForm.notes || undefined,
    })
    setData(d => ({ ...d, invoices: [inv, ...d.invoices] }))
    setInvoiceForm({ invoiceNumber: '', description: '', amount: '', issuedDate: '', dueDate: '', status: 'draft', notes: '' })
    setShowAddInvoice(false)
  }

  const removePayment = async (id: number) => {
    await deletePayment(clientId, id)
    setData(d => ({ ...d, payments: d.payments.filter(p => p.id !== id) }))
  }

  const removeInvoice = async (id: number) => {
    await deleteInvoice(clientId, id)
    setData(d => ({ ...d, invoices: d.invoices.filter(i => i.id !== id) }))
  }

  if (isLoading) return <div className="py-16 text-center text-zinc-500">Loading financial data...</div>
  if (error) return <div className="py-16 text-center text-red-500">{error}</div>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* ── Overdue Alert ── */}
      {overduePayments.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-400/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-500">
              {overduePayments.length} overdue payment{overduePayments.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {overduePayments.map(p => `${p.label} (${fmt(p.amount, currency)})`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* ── Financial Overview ── */}
      <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-black flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-black" /> Financial Overview
          </h3>
          {editingStanding ? (
            <div className="flex gap-2">
              <button onClick={() => setEditingStanding(false)} className="text-sm text-zinc-500 hover:text-black px-3 py-1.5 transition-colors">Cancel</button>
              <button onClick={saveStanding} disabled={savingStanding} className="flex items-center gap-1.5 text-sm bg-black text-white px-4 py-1.5 rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors">
                <Save className="w-3.5 h-3.5" />{savingStanding ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <button onClick={() => { setEditingStanding(true); setStandingForm(data.standing ?? { currency: 'USD', totalContract: 0 }) }}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-black transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        {/* Edit form */}
        {editingStanding && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-[#f3f3f3] rounded-lg border border-zinc-100">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Total Contract Value</label>
              <input type="number" value={standingForm.totalContract ?? 0}
                onChange={e => setStandingForm(f => ({ ...f, totalContract: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/10 text-sm" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Currency</label>
              <select value={standingForm.currency ?? 'USD'} onChange={e => setStandingForm(f => ({ ...f, currency: e.target.value }))}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-black focus:outline-none text-sm">
                {Object.keys(CURRENCY_SYMBOLS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="text-xs text-zinc-500 block mb-1">Financial Notes</label>
              <textarea value={standingForm.notes ?? ''} onChange={e => setStandingForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Payment terms, special conditions, etc."
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/10 text-sm resize-none" />
            </div>
          </div>
        )}

        {/* Big metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Contract Value', value: fmt(totalContract, currency), sub: currency, color: 'border-zinc-200' },
            { label: 'Amount Paid', value: fmt(amountPaid, currency), sub: `${totalContract > 0 ? Math.round((amountPaid / totalContract) * 100) : 0}% of total`, color: 'border-green-400/20' },
            { label: 'Amount Due', value: fmt(amountDue, currency), sub: `${data.payments.filter(p => p.status === 'pending' || isOverdue(p)).length} payment(s)`, color: amountDue > 0 ? 'border-yellow-400/20' : 'border-zinc-200' },
            { label: 'Outstanding', value: fmt(Math.max(totalContract - amountPaid, 0), currency), sub: 'Remaining balance', color: 'border-zinc-200' },
          ].map(card => (
            <div key={card.label} className={`bg-[#f3f3f3] border ${card.color} rounded-xl p-4`}>
              <p className="text-xs text-zinc-500 mb-1">{card.label}</p>
              <p className="text-lg font-semibold text-black font-mono">{card.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {totalContract > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
              <span>Payment Progress</span>
              <span>{Math.round(progressPct)}% collected</span>
            </div>
            <div className="h-2 bg-[#f3f3f3] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-black rounded-full"
              />
            </div>
          </div>
        )}

        {/* Callouts row */}
        <div className="flex flex-wrap gap-3">
          {/* Payment health */}
          {healthLabel && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f3f3f3] border border-zinc-200 ${healthLabel.color}`}>
              {healthLabel.icon}
              <div>
                <p className="text-xs font-semibold">{healthLabel.label} Standing</p>
                <p className="text-xs opacity-70">{paymentHealthPct}% on-time rate</p>
              </div>
            </div>
          )}
          {/* Next payment */}
          {nextPayment && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f3f3f3] border border-zinc-200 text-black-secondary">
              <Clock className="w-4 h-4" />
              <div>
                <p className="text-xs font-semibold">Next: {nextPayment.label}</p>
                <p className="text-xs opacity-70">
                  {fmt(nextPayment.amount, currency)} · {daysUntil(nextPayment.dueDate)} days ({nextPayment.dueDate})
                </p>
              </div>
            </div>
          )}
          {/* Notes */}
          {data.standing?.notes && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#f3f3f3] border border-zinc-200 text-zinc-500 flex-1 min-w-0">
              <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-xs">{data.standing.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Payment Schedule ── */}
      <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <button onClick={() => setCollapseSchedule(c => !c)} className="flex items-center gap-2 text-black font-semibold hover:text-black transition-colors">
            <Clock className="w-4 h-4 text-black" /> Payment Schedule
            <span className="text-xs text-zinc-500 font-normal ml-1">({data.payments.length})</span>
            {collapseSchedule ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronUp className="w-4 h-4 text-zinc-500" />}
          </button>
          <button onClick={() => setShowAddPayment(s => !s)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-accent/30 text-black hover:bg-zinc-100 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Payment
          </button>
        </div>

        <AnimatePresence>
          {!collapseSchedule && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              {/* Add payment form */}
              {showAddPayment && (
                <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    {[
                      { label: 'Label *', key: 'label', type: 'text', placeholder: 'e.g. Deposit, Milestone 1…' },
                      { label: 'Amount *', key: 'amount', type: 'number', placeholder: '0.00' },
                      { label: 'Due Date *', key: 'dueDate', type: 'date', placeholder: '' },
                      { label: 'Notes', key: 'notes', type: 'text', placeholder: 'Optional…' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs text-zinc-500 block mb-1">{f.label}</label>
                        <input type={f.type} placeholder={f.placeholder}
                          value={(paymentForm as Record<string, string>)[f.key]}
                          onChange={e => setPaymentForm(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10" />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">Status</label>
                      <select value={paymentForm.status} onChange={e => setPaymentForm(p => ({ ...p, status: e.target.value }))}
                        className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none">
                        {Object.keys(PAYMENT_STATUS_META).map(s => <option key={s} value={s}>{PAYMENT_STATUS_META[s].label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddPayment(false)} className="text-xs text-zinc-500 hover:text-black px-3 py-1.5 transition-colors flex items-center gap-1"><X className="w-3 h-3" />Cancel</button>
                    <button onClick={addPayment} className="flex items-center gap-1 text-xs bg-black text-white px-3 py-1.5 rounded font-medium hover:bg-zinc-800 transition-colors"><Plus className="w-3 h-3" />Add</button>
                  </div>
                </div>
              )}

              {data.payments.length === 0 ? (
                <div className="px-6 py-10 text-center text-zinc-500 text-sm">No payment entries yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        {['Label', 'Amount', 'Due Date', 'Status', 'Payment Date', 'Notes', ''].map(h => (
                          <th key={h} className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.payments.map(p => (
                        <PaymentRow key={p.id} payment={p} currency={currency} clientId={clientId}
                          onUpdate={updated => setData(d => ({ ...d, payments: d.payments.map(x => x.id === updated.id ? updated : x) }))}
                          onDelete={removePayment} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Schedule summary */}
              {data.payments.length > 0 && (
                <div className="flex gap-4 px-6 py-3 border-t border-zinc-100 bg-zinc-50">
                  {[
                    { label: 'On Time', count: data.payments.filter(p => p.status === 'paid-on-time').length, color: 'text-green-600' },
                    { label: 'Late', count: data.payments.filter(p => p.status === 'paid-late').length, color: 'text-orange-400' },
                    { label: 'Rearranged', count: data.payments.filter(p => p.status === 'rearranged').length, color: 'text-blue-400' },
                    { label: 'Overdue', count: overduePayments.length, color: 'text-red-500' },
                    { label: 'Pending', count: data.payments.filter(p => p.status === 'pending' && !isOverdue(p)).length, color: 'text-zinc-500' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold ${s.color}`}>{s.count}</span>
                      <span className="text-xs text-zinc-500">{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Invoice Records ── */}
      <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <button onClick={() => setCollapseInvoices(c => !c)} className="flex items-center gap-2 text-black font-semibold hover:text-black transition-colors">
            <FileText className="w-4 h-4 text-black" /> Invoice Records
            <span className="text-xs text-zinc-500 font-normal ml-1">({data.invoices.length})</span>
            {collapseInvoices ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronUp className="w-4 h-4 text-zinc-500" />}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 bg-[#f3f3f3] border border-zinc-200 px-3 py-1.5 rounded-lg">
              PayPal / Stripe integration coming soon
            </span>
            <button onClick={() => setShowAddInvoice(s => !s)}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-accent/30 text-black hover:bg-zinc-100 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Invoice
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!collapseInvoices && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              {/* Add invoice form */}
              {showAddInvoice && (
                <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    {[
                      { label: 'Invoice # *', key: 'invoiceNumber', type: 'text', placeholder: 'INV-001' },
                      { label: 'Amount *', key: 'amount', type: 'number', placeholder: '0.00' },
                      { label: 'Issued Date *', key: 'issuedDate', type: 'date', placeholder: '' },
                      { label: 'Due Date *', key: 'dueDate', type: 'date', placeholder: '' },
                      { label: 'Description', key: 'description', type: 'text', placeholder: 'What this covers…' },
                      { label: 'Notes', key: 'notes', type: 'text', placeholder: 'Optional…' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs text-zinc-500 block mb-1">{f.label}</label>
                        <input type={f.type} placeholder={f.placeholder}
                          value={(invoiceForm as Record<string, string>)[f.key]}
                          onChange={e => setInvoiceForm(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10" />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">Status</label>
                      <select value={invoiceForm.status} onChange={e => setInvoiceForm(p => ({ ...p, status: e.target.value }))}
                        className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none">
                        {Object.keys(INVOICE_STATUS_META).map(s => <option key={s} value={s}>{INVOICE_STATUS_META[s].label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddInvoice(false)} className="text-xs text-zinc-500 hover:text-black px-3 py-1.5 transition-colors flex items-center gap-1"><X className="w-3 h-3" />Cancel</button>
                    <button onClick={addInvoice} className="flex items-center gap-1 text-xs bg-black text-white px-3 py-1.5 rounded font-medium hover:bg-zinc-800 transition-colors"><Plus className="w-3 h-3" />Add</button>
                  </div>
                </div>
              )}

              {data.invoices.length === 0 ? (
                <div className="px-6 py-10 text-center text-zinc-500 text-sm">No invoices recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        {['Invoice #', 'Description', 'Amount', 'Issued', 'Due', 'Status', ''].map(h => (
                          <th key={h} className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.invoices.map(inv => (
                        <InvoiceRow key={inv.id} invoice={inv} currency={currency} clientId={clientId}
                          onUpdate={updated => setData(d => ({ ...d, invoices: d.invoices.map(x => x.id === updated.id ? updated : x) }))}
                          onDelete={removeInvoice} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

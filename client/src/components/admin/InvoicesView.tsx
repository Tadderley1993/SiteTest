import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, ArrowLeft, Trash2, Send, ExternalLink, Bell, XCircle,
  Copy, ChevronDown, ChevronUp, FileText, CheckCircle, Clock, AlertCircle,
  Search, User, RefreshCw, Download, Eye, EyeOff, FileCode,
} from 'lucide-react'
import api, { getEmailTemplates } from '../../lib/api'
import type { EmailTemplate } from '../../lib/api'
import {
  buildInvoiceTokenMap,
  renderTemplateDocument,
  downloadTemplateAsPdf,
} from '../../lib/templateRenderer'

// ── Types ──────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

interface InvoiceClient {
  id: number
  firstName: string
  lastName: string
  email: string
  organization?: string | null
}

interface Invoice {
  id: number
  invoiceNumber: string
  title: string | null
  clientId: number
  client: InvoiceClient
  lineItems: string | null
  currency: string
  subtotal: number
  discountType: string
  discountValue: number
  taxRate: number
  amount: number
  issuedDate: string
  dueDate: string
  status: string
  notes: string | null
  termsConditions: string | null
  paypalInvoiceId: string | null
  paypalInvoiceUrl: string | null
  sentAt: string | null
  createdAt: string
}

// ── Status helpers ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: typeof FileText }> = {
  draft:     { label: 'Draft',     color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', Icon: FileText },
  sent:      { label: 'Sent',      color: '#47C6FF', bg: 'rgba(71,198,255,0.1)',  Icon: Send },
  paid:      { label: 'Paid',      color: '#10B981', bg: 'rgba(16,185,129,0.1)',  Icon: CheckCircle },
  overdue:   { label: 'Overdue',   color: '#F97316', bg: 'rgba(249,115,22,0.1)', Icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: '#6B7280', bg: 'rgba(107,114,128,0.1)', Icon: XCircle },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <cfg.Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// ── Subcomponents ──────────────────────────────────────────────────────────────

function LineItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: LineItem
  onChange: (id: string, field: keyof LineItem, value: string | number) => void
  onRemove: (id: string) => void
}) {
  const amount = item.quantity * item.unitPrice
  return (
    <div className="grid grid-cols-[1fr_80px_110px_100px_36px] gap-2 items-center">
      <input
        value={item.description}
        onChange={e => onChange(item.id, 'description', e.target.value)}
        placeholder="Description of service or item"
        className="bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-sm text-black placeholder:text-zinc-500 focus:outline-none focus:border-black/20 font-body"
      />
      <input
        type="number"
        min="0.01"
        step="0.01"
        value={item.quantity}
        onChange={e => onChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
        className="bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-sm text-black text-right focus:outline-none focus:border-black/20 font-body"
      />
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.unitPrice}
          onChange={e => onChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
          className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg pl-6 pr-3 py-2 text-sm text-black text-right focus:outline-none focus:border-black/20 font-body"
        />
      </div>
      <div className="text-sm text-black text-right font-medium py-2">
        ${amount.toFixed(2)}
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Client Select (custom dark-themed dropdown) ────────────────────────────────

function ClientSelect({
  clients,
  value,
  onChange,
}: {
  clients: InvoiceClient[]
  value: number | ''
  onChange: (id: number | '') => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = clients.find(c => c.id === value)

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.organization?.toLowerCase() ?? '').includes(q)
    )
  })

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-black/20 hover:border-zinc-400 transition-colors text-left"
      >
        {selected ? (
          <span className="text-black font-body">
            {selected.firstName} {selected.lastName}
            {selected.organization && <span className="text-zinc-500 ml-1.5">· {selected.organization}</span>}
          </span>
        ) : (
          <span className="text-zinc-500 font-body">Select client…</span>
        )}
        <ChevronDown className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl border border-zinc-200 shadow-xl bg-white overflow-hidden"
          >
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-100">
              <Search className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search clients…"
                className="flex-1 bg-transparent text-sm text-black placeholder:text-zinc-400 focus:outline-none font-body"
              />
            </div>

            {/* Options */}
            <div className="max-h-52 overflow-y-auto">
              {clients.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-zinc-500 font-body">
                  No clients found. Add a client first.
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-4 text-center text-sm text-zinc-500 font-body">No match</div>
              ) : (
                filtered.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { onChange(c.id); setOpen(false); setSearch('') }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-black" />
                    </div>
                    <div>
                      <div className="text-sm text-black font-body">
                        {c.firstName} {c.lastName}
                      </div>
                      <div className="text-xs text-zinc-500 font-body">
                        {c.email}{c.organization ? ` · ${c.organization}` : ''}
                      </div>
                    </div>
                    {value === c.id && <CheckCircle className="w-3.5 h-3.5 text-black ml-auto flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>

            {/* Clear option */}
            {value !== '' && (
              <div className="border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => { onChange(''); setOpen(false); setSearch('') }}
                  className="w-full px-3 py-2 text-xs text-zinc-500 hover:text-red-500 text-left font-body hover:bg-[#f3f3f3] transition-colors"
                >
                  Clear selection
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Invoice Builder ────────────────────────────────────────────────────────────

function InvoiceBuilder({
  initial,
  clients,
  onBack,
  onSaved,
}: {
  initial?: Invoice
  clients: InvoiceClient[]
  onBack: () => void
  onSaved: () => void
}) {
  const [localClients, setLocalClients] = useState<InvoiceClient[]>([])
  const allClients = localClients.length > 0 ? localClients : clients

  const [clientId, setClientId] = useState<number | ''>(initial?.clientId || '')
  const [invoiceNumber, setInvoiceNumber] = useState(initial?.invoiceNumber || '')
  const [title, setTitle] = useState(initial?.title || '')
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initial?.lineItems ? JSON.parse(initial.lineItems) : [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]
  )
  const [currency] = useState('USD')
  const [discountType, setDiscountType] = useState(initial?.discountType || 'fixed')
  const [discountValue, setDiscountValue] = useState(initial?.discountValue || 0)
  const [taxRate, setTaxRate] = useState(initial?.taxRate || 0)
  const [issuedDate, setIssuedDate] = useState(initial?.issuedDate || new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState(initial?.dueDate || '')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [termsConditions, setTermsConditions] = useState(initial?.termsConditions || '')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sendSuccess, setSendSuccess] = useState('')
  const [includePaypalButton, setIncludePaypalButton] = useState(false)

  // Template
  const [invoiceTemplates, setInvoiceTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Auto-generate invoice number + ensure clients loaded
  useEffect(() => {
    if (!initial) {
      api.post('/admin/invoices/generate-number')
        .then(r => setInvoiceNumber(r.data.invoiceNumber))
        .catch(() => setInvoiceNumber(`INV-${String(Date.now()).slice(-4)}`))
    }
    // If parent didn't pass clients (e.g. invoices fetch failed), load them directly
    if (clients.length === 0) {
      api.get('/admin/clients').then(r => {
        if (Array.isArray(r.data) && r.data.length > 0) {
          setLocalClients(r.data)
        }
      }).catch(() => {})
    }
    getEmailTemplates()
      .then(all => setInvoiceTemplates(all.filter(t => t.category === 'invoice_doc')))
      .catch(() => {})
  }, [initial, clients.length])

  // Totals
  const subtotal = lineItems.reduce((s, item) => s + item.quantity * item.unitPrice, 0)
  const discountAmt = discountType === 'percent' ? (subtotal * discountValue) / 100 : discountValue
  const taxableAmount = subtotal - discountAmt
  const taxAmt = (taxableAmount * taxRate) / 100
  const total = taxableAmount + taxAmt

  const selectedTemplate = invoiceTemplates.find(t => t.id === selectedTemplateId) ?? null

  const selectedClient = allClients.find(c => c.id === clientId)

  const renderedHtml = useMemo(() => {
    if (!selectedTemplate) return null
    const invoiceData = {
      invoiceNumber,
      title,
      issuedDate,
      dueDate,
      status: initial?.status ?? 'draft',
      currency,
      subtotal,
      discountType,
      discountValue,
      taxRate,
      amount: total,
      notes: notes || null,
      termsConditions: termsConditions || null,
      paypalInvoiceUrl: initial?.paypalInvoiceUrl ?? null,
      client: selectedClient
        ? { firstName: selectedClient.firstName, lastName: selectedClient.lastName, email: selectedClient.email }
        : undefined,
    }
    const tokens = buildInvoiceTokenMap(invoiceData, lineItems)
    return renderTemplateDocument(selectedTemplate.htmlContent, selectedTemplate.cssContent ?? '', tokens)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate, clientId, invoiceNumber, title, issuedDate, dueDate, currency, subtotal, discountType, discountValue, taxRate, total, notes, termsConditions, lineItems, selectedClient])

  const addItem = () =>
    setLineItems(prev => [...prev, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }])

  const removeItem = (id: string) => setLineItems(prev => prev.filter(i => i.id !== id))

  const updateItem = (id: string, field: keyof LineItem, value: string | number) =>
    setLineItems(prev => prev.map(i => (i.id === id ? { ...i, [field]: value } : i)))

  const payload = () => ({
    clientId,
    invoiceNumber,
    title: title || null,
    lineItems,
    currency,
    subtotal,
    discountType,
    discountValue,
    taxRate,
    amount: total,
    issuedDate,
    dueDate,
    notes: notes || null,
    termsConditions: termsConditions || null,
  })

  const validate = () => {
    if (!clientId) return 'Please select a client'
    if (!invoiceNumber.trim()) return 'Invoice number is required'
    if (!dueDate) return 'Due date is required'
    if (lineItems.length === 0) return 'Add at least one line item'
    if (lineItems.some(i => !i.description.trim())) return 'All line items need a description'
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true); setError('')
    try {
      if (initial) {
        await api.put(`/admin/invoices/${initial.id}`, payload())
      } else {
        await api.post('/admin/invoices', payload())
      }
      onSaved()
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setSending(true); setError(''); setSendSuccess('')
    try {
      let invId = initial?.id
      // Save first
      if (initial) {
        await api.put(`/admin/invoices/${initial.id}`, payload())
      } else {
        const r = await api.post('/admin/invoices', payload())
        invId = r.data.id
      }
      // Send via PayPal
      const sendRes = await api.post(`/admin/invoices/${invId}/send`, { includePaypalButton })
      setSendSuccess(
        sendRes.data.sandbox
          ? 'Invoice sent in Sandbox mode — no real email is delivered. Switch to Live credentials in Settings → PayPal when ready to bill real clients.'
          : 'Invoice sent! The client will receive a PayPal payment link via email.'
      )
      setTimeout(() => onSaved(), 2500)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to send invoice')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-black transition-colors text-sm font-body"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1" />
        <span className="font-body text-zinc-500 text-sm">{initial ? `Editing ${initial.invoiceNumber}` : 'New Invoice'}</span>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-body">
          {error}
        </div>
      )}
      {sendSuccess && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm font-body flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {sendSuccess}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left: Invoice details ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Client + meta */}
          <div className="bg-[#f3f3f3] border border-zinc-200 rounded-2xl p-6">
            <h3 className="font-body text-sm font-semibold text-black mb-4 uppercase tracking-widest">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider font-body">Client *</label>
                <ClientSelect clients={allClients} value={clientId} onChange={setClientId} />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider font-body">Invoice Number</label>
                <div className="relative">
                  <input
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    placeholder="Auto-generating…"
                    className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2.5 pr-14 text-sm text-black focus:outline-none focus:border-black/20 font-body"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 uppercase tracking-wider pointer-events-none">Auto</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider font-body">Issue Date</label>
                <input
                  type="date"
                  value={issuedDate}
                  onChange={e => setIssuedDate(e.target.value)}
                  className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black/20 font-body"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider font-body">Due Date *</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black/20 font-body"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider font-body">Title / Subject (optional)</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Website Redesign — Phase 1"
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-zinc-500 focus:outline-none focus:border-black/20 font-body"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-[#f3f3f3] border border-zinc-200 rounded-2xl p-6">
            <h3 className="font-body text-sm font-semibold text-black mb-4 uppercase tracking-widest">Line Items</h3>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_110px_100px_36px] gap-2 mb-2 px-0.5">
              {['Description', 'Qty', 'Unit Price', 'Amount', ''].map((h, i) => (
                <div key={i} className={`text-xs text-zinc-500 uppercase tracking-wider font-body ${i >= 2 ? 'text-right' : ''}`}>{h}</div>
              ))}
            </div>

            <div className="space-y-2">
              {lineItems.map(item => (
                <LineItemRow key={item.id} item={item} onChange={updateItem} onRemove={removeItem} />
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="mt-4 flex items-center gap-2 text-sm text-black hover:text-black/80 transition-colors font-body"
            >
              <Plus className="w-4 h-4" /> Add Line Item
            </button>
          </div>

          {/* Notes */}
          <div className="bg-[#f3f3f3] border border-zinc-200 rounded-2xl p-6">
            <h3 className="font-body text-sm font-semibold text-black mb-4 uppercase tracking-widest">Notes & Terms</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider font-body">Note to Client</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Thank you for your business!"
                  className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-zinc-500 focus:outline-none focus:border-black/20 resize-none font-body"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider font-body">Terms & Conditions</label>
                <textarea
                  rows={3}
                  value={termsConditions}
                  onChange={e => setTermsConditions(e.target.value)}
                  placeholder="Payment is due within 30 days…"
                  className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-zinc-500 focus:outline-none focus:border-black/20 resize-none font-body"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Summary ── */}
        <div className="space-y-4">
          <div className="bg-[#f3f3f3] border border-zinc-200 rounded-2xl p-6 sticky top-4">
            <h3 className="font-body text-sm font-semibold text-black mb-4 uppercase tracking-widest">Summary</h3>

            {/* Discount */}
            <div className="mb-4">
              <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider font-body">Discount</label>
              <div className="flex gap-2">
                <select
                  value={discountType}
                  onChange={e => setDiscountType(e.target.value)}
                  className="bg-[#f3f3f3] border border-zinc-200 rounded-lg px-2 py-2 text-sm text-black focus:outline-none font-body"
                  style={{ backgroundColor: '#0E1117', color: '#F0F0F0' }}
                >
                  <option value="fixed" style={{ backgroundColor: '#0E1117', color: '#F0F0F0' }}>$</option>
                  <option value="percent" style={{ backgroundColor: '#0E1117', color: '#F0F0F0' }}>%</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountValue}
                  onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="flex-1 bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-sm text-black text-right focus:outline-none focus:border-black/20 font-body"
                />
              </div>
            </div>

            {/* Tax */}
            <div className="mb-6">
              <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider font-body">Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={taxRate}
                onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-sm text-black text-right focus:outline-none focus:border-black/20 font-body"
              />
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t border-zinc-200 pt-4 mb-6">
              <div className="flex justify-between text-sm font-body">
                <span className="text-zinc-500">Subtotal</span>
                <span className="text-black">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm font-body">
                  <span className="text-zinc-500">Discount</span>
                  <span className="text-green-600">−${discountAmt.toFixed(2)}</span>
                </div>
              )}
              {taxAmt > 0 && (
                <div className="flex justify-between text-sm font-body">
                  <span className="text-zinc-500">Tax ({taxRate}%)</span>
                  <span className="text-black">${taxAmt.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-body border-t border-zinc-200 pt-2 mt-2">
                <span className="text-black font-semibold">Total</span>
                <span className="text-black font-bold text-lg">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Template picker */}
            <div className="mb-4 p-3.5 rounded-xl border border-zinc-200 bg-white">
              <p className="text-sm font-semibold text-black font-body leading-tight mb-2">Document Template</p>
              <select
                value={selectedTemplateId ?? ''}
                onChange={e => setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none font-body mb-2"
              >
                <option value="">No template</option>
                {invoiceTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {invoiceTemplates.length === 0 && (
                <p className="text-[11px] text-zinc-400 font-body">Create invoice templates in Templates → Invoices.</p>
              )}
              {selectedTemplate && (
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setShowPreview(v => !v)}
                    className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-black transition-colors font-body"
                  >
                    {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showPreview ? 'Hide preview' : 'Preview'}
                  </button>
                  <button
                    type="button"
                    disabled={downloadingPdf}
                    onClick={async () => {
                      setDownloadingPdf(true)
                      try {
                        const invoiceData = {
                          invoiceNumber, title, issuedDate, dueDate,
                          status: initial?.status ?? 'draft', currency, subtotal,
                          discountType, discountValue, taxRate, amount: total,
                          notes: notes || null, termsConditions: termsConditions || null,
                          paypalInvoiceUrl: initial?.paypalInvoiceUrl ?? null,
                          client: selectedClient
                            ? { firstName: selectedClient.firstName, lastName: selectedClient.lastName, email: selectedClient.email }
                            : undefined,
                        }
                        await downloadTemplateAsPdf(
                          selectedTemplate.htmlContent,
                          selectedTemplate.cssContent ?? '',
                          buildInvoiceTokenMap(invoiceData, lineItems),
                          `${invoiceNumber || 'invoice'}.pdf`,
                        )
                      } finally {
                        setDownloadingPdf(false)
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-black transition-colors font-body disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {downloadingPdf ? 'Generating...' : 'Download PDF'}
                  </button>
                </div>
              )}
            </div>

            {/* Template preview panel */}
            {showPreview && selectedTemplate && renderedHtml && (
              <div className="mb-4 rounded-xl border border-violet-200 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border-b border-violet-200">
                  <FileCode className="w-3.5 h-3.5 text-violet-600" />
                  <span className="text-xs font-semibold text-violet-700 font-body">{selectedTemplate.name}</span>
                </div>
                <iframe
                  srcDoc={renderedHtml}
                  sandbox="allow-same-origin"
                  className="w-full"
                  style={{ height: '480px', border: 'none' }}
                  title="Invoice Template Preview"
                />
              </div>
            )}

            {/* PayPal button toggle */}
            <div className="mb-4 p-3.5 rounded-xl border border-zinc-200 bg-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-black font-body leading-tight">PayPal Payment Button</p>
                  <p className="text-[11px] text-zinc-400 font-body mt-0.5 leading-snug">
                    Send a branded email with a "Pay with PayPal" button. Requires SMTP to be configured.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludePaypalButton(v => !v)}
                  className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    includePaypalButton ? 'bg-[#0070ba]' : 'bg-zinc-200'
                  }`}
                  aria-pressed={includePaypalButton}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      includePaypalButton ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {includePaypalButton && (
                <p className="mt-2.5 text-[11px] text-[#0070ba] font-medium font-body flex items-center gap-1">
                  <span>✓</span> Branded invoice email will be sent via your SMTP
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black text-background font-body font-semibold text-sm hover:bg-zinc-800 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending via PayPal…' : 'Send via PayPal'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-zinc-200 text-black font-body font-medium text-sm hover:bg-[#f3f3f3] disabled:opacity-50 transition-all"
              >
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
            </div>

            <p className="mt-4 text-xs text-zinc-500 font-body text-center leading-relaxed">
              Sending creates a PayPal invoice and emails the client a direct payment link.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Invoice Row (list) ─────────────────────────────────────────────────────────

function InvoiceRow({
  invoice,
  onEdit,
  onRefresh,
}: {
  invoice: Invoice
  onEdit: () => void
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const act = async (fn: () => Promise<void>, label: string) => {
    setLoading(true); setMsg('')
    try { await fn(); setMsg(`${label} successful`); onRefresh() }
    catch (e: unknown) { setMsg((e as { response?: { data?: { error?: string } } })?.response?.data?.error || `${label} failed`) }
    finally { setLoading(false) }
  }

  const lineItems: LineItem[] = invoice.lineItems ? JSON.parse(invoice.lineItems) : []
  const isSent = invoice.status === 'sent' || invoice.status === 'paid'

  return (
    <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl overflow-hidden">
      {/* Row */}
      <div
        className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 cursor-pointer hover:bg-[#f3f3f3] transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div>
          <div className="font-body text-sm font-medium text-black">{invoice.invoiceNumber}</div>
          {invoice.title && <div className="font-body text-xs text-zinc-500 mt-0.5 truncate">{invoice.title}</div>}
        </div>
        <div className="font-body text-sm text-zinc-500">
          {invoice.client.firstName} {invoice.client.lastName}
          {invoice.client.organization && <span className="ml-1 text-xs opacity-60">· {invoice.client.organization}</span>}
        </div>
        <div className="font-body text-sm text-black font-medium">${invoice.amount.toFixed(2)}</div>
        <div>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="font-body text-xs text-zinc-500">{invoice.dueDate}</div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={e => { e.stopPropagation(); onEdit() }}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-black hover:bg-zinc-100 transition-all">
            <FileText className="w-4 h-4" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-100 px-5 py-4 space-y-4">
              {/* Line items */}
              {lineItems.length > 0 && (
                <div>
                  <div className="grid grid-cols-[1fr_60px_100px_90px] gap-3 mb-2">
                    {['Description', 'Qty', 'Unit Price', 'Amount'].map((h, i) => (
                      <div key={i} className={`text-xs text-zinc-500 uppercase tracking-wider font-body ${i >= 2 ? 'text-right' : ''}`}>{h}</div>
                    ))}
                  </div>
                  {lineItems.map(item => (
                    <div key={item.id} className="grid grid-cols-[1fr_60px_100px_90px] gap-3 py-1.5 border-b border-zinc-100 last:border-0">
                      <div className="font-body text-sm text-black">{item.description}</div>
                      <div className="font-body text-sm text-zinc-500 text-right">{item.quantity}</div>
                      <div className="font-body text-sm text-zinc-500 text-right">${item.unitPrice.toFixed(2)}</div>
                      <div className="font-body text-sm text-black text-right">${(item.quantity * item.unitPrice).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals row */}
              <div className="flex justify-end gap-8 text-sm font-body">
                {invoice.discountValue > 0 && (
                  <span className="text-zinc-500">Discount: <span className="text-green-600">−${invoice.discountType === 'fixed' ? invoice.discountValue.toFixed(2) : (invoice.subtotal * invoice.discountValue / 100).toFixed(2)}</span></span>
                )}
                {invoice.taxRate > 0 && (
                  <span className="text-zinc-500">Tax ({invoice.taxRate}%)</span>
                )}
                <span className="text-black font-semibold">Total: <span className="text-black">${invoice.amount.toFixed(2)}</span></span>
              </div>

              {/* PayPal link */}
              {invoice.paypalInvoiceUrl && (
                <div className="flex items-center gap-2 p-3 bg-zinc-100 border border-accent/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-black flex-shrink-0" />
                  <span className="text-xs text-zinc-500 font-body flex-1">PayPal invoice sent — client can pay directly</span>
                  <a
                    href={invoice.paypalInvoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-black hover:underline font-body"
                    onClick={e => e.stopPropagation()}
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(invoice.paypalInvoiceUrl!) }}
                    className="p-1 rounded text-zinc-500 hover:text-black"
                    title="Copy link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {msg && (
                <div className={`text-xs font-body px-3 py-2 rounded-lg ${msg.includes('failed') || msg.includes('error') ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-600'}`}>
                  {msg}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {!isSent && (
                  <button type="button" disabled={loading}
                    onClick={e => { e.stopPropagation(); act(() => api.post(`/admin/invoices/${invoice.id}/send`), 'Send') }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-background text-xs font-body font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" /> Send via PayPal
                  </button>
                )}
                {isSent && (
                  <button type="button" disabled={loading}
                    onClick={e => { e.stopPropagation(); act(() => api.post(`/admin/invoices/${invoice.id}/remind`), 'Reminder') }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-black text-xs font-body hover:bg-white/[0.05] disabled:opacity-50 transition-all"
                  >
                    <Bell className="w-3.5 h-3.5" /> Send Reminder
                  </button>
                )}
                {isSent && (
                  <button type="button" disabled={loading}
                    onClick={e => { e.stopPropagation(); if (confirm('Cancel this invoice?')) act(() => api.post(`/admin/invoices/${invoice.id}/cancel`), 'Cancel') }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-500 text-xs font-body hover:bg-red-500/10 disabled:opacity-50 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel Invoice
                  </button>
                )}
                {!isSent && (
                  <button type="button" disabled={loading}
                    onClick={e => { e.stopPropagation(); if (confirm('Delete this invoice?')) act(() => api.delete(`/admin/invoices/${invoice.id}`), 'Delete') }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-500 text-xs font-body hover:bg-red-500/10 disabled:opacity-50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main InvoicesView ──────────────────────────────────────────────────────────

export default function InvoicesView() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<InvoiceClient[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Invoice | 'new' | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [invResult, clientResult] = await Promise.allSettled([
      api.get('/admin/invoices'),
      api.get('/admin/clients'),
    ])
    if (invResult.status === 'fulfilled') setInvoices(invResult.value.data)
    if (clientResult.status === 'fulfilled') setClients(clientResult.value.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg('')
    try {
      const r = await api.post('/admin/invoices/sync')
      const { updated, total } = r.data
      setSyncMsg(updated > 0
        ? `${updated} invoice${updated !== 1 ? 's' : ''} updated from PayPal`
        : `${total} invoice${total !== 1 ? 's' : ''} already up to date`
      )
      if (updated > 0) load()
    } catch (e: unknown) {
      setSyncMsg((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Sync failed')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(''), 5000)
    }
  }

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)

  const totals = {
    draft: invoices.filter(i => i.status === 'draft').reduce((s, i) => s + i.amount, 0),
    sent: invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
  }

  if (editing !== null) {
    return (
      <InvoiceBuilder
        initial={editing === 'new' ? undefined : editing}
        clients={clients}
        onBack={() => setEditing(null)}
        onSaved={() => { setEditing(null); load() }}
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-black" />
          <h2 className="text-xl font-semibold text-black">Invoices</h2>
        </div>
        <div className="flex items-center gap-3">
          {syncMsg && (
            <span className={`text-xs font-body px-3 py-1.5 rounded-lg ${
              syncMsg.includes('failed') || syncMsg.includes('error')
                ? 'bg-red-500/10 text-red-500'
                : 'bg-green-500/10 text-green-600'
            }`}>
              {syncMsg}
            </span>
          )}
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            title="Pull latest payment status from PayPal"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 text-black font-body font-medium text-sm hover:bg-[#f3f3f3] disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync PayPal'}
          </button>
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-background font-body font-semibold text-sm hover:bg-zinc-800 transition-all"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Outstanding', value: totals.sent, color: '#47C6FF', Icon: Clock },
          { label: 'Collected', value: totals.paid, color: '#10B981', Icon: CheckCircle },
          { label: 'Drafts', value: totals.draft, color: '#9CA3AF', Icon: FileText },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="font-display text-2xl leading-none" style={{ color }}>${value.toFixed(2)}</div>
              <div className="font-body text-xs text-zinc-500 mt-1">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium capitalize transition-all ${
              filter === s ? 'bg-zinc-100 text-black border border-accent/15' : 'text-zinc-500 hover:text-black hover:bg-[#f3f3f3]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 mb-2">
        {['Invoice', 'Client', 'Amount', 'Status', 'Due', ''].map((h, i) => (
          <div key={i} className="text-xs text-zinc-500 uppercase tracking-wider font-body">{h}</div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-zinc-500 font-body">Loading invoices…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-zinc-500/30 mx-auto mb-3" />
          <p className="font-body text-zinc-500 text-sm">No invoices yet.</p>
          <button type="button" onClick={() => setEditing('new')}
            className="mt-4 text-black text-sm font-body hover:underline">Create your first invoice →</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(inv => (
            <InvoiceRow
              key={inv.id}
              invoice={inv}
              onEdit={() => setEditing(inv)}
              onRefresh={load}
            />
          ))}
        </div>
      )}
    </div>
  )
}

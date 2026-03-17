import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { PDFDownloadLink, BlobProvider } from '@react-pdf/renderer'
import {
  ArrowLeft, Plus, Trash2, Save, Send, Download, Eye, EyeOff,
  ChevronDown, ChevronUp, X, Users, Search, PenLine,
} from 'lucide-react'
import { createProposal, updateProposal, sendProposalEmail, getClients, Proposal, LineItem, Client } from '../../lib/api'
import ProposalPDF from './ProposalPDF'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$' }

const inputCls = 'w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent/40 placeholder-text-muted'
const textareaCls = `${inputCls} resize-none`

// ── Helpers (module level) ────────────────────────────────────────────────────

function newLineItem(): LineItem {
  return { id: crypto.randomUUID(), description: '', qty: 1, unitPrice: 0, total: 0 }
}

function buildProposalData(form: Partial<Proposal>, lineItems: LineItem[]): Partial<Proposal> {
  const subtotal = lineItems.reduce((s, i) => s + i.total, 0)
  const discount = form.discountType === 'percent'
    ? subtotal * ((form.discountValue ?? 0) / 100)
    : (form.discountValue ?? 0)
  const taxAmount = (subtotal - discount) * ((form.taxRate ?? 0) / 100)
  return { ...form, lineItems: JSON.stringify(lineItems), subtotal, total: subtotal - discount + taxAmount }
}

// ── Sub-components (module level — never define inside parent) ────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-text-muted mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Section({
  title, isOpen, onToggle, children, badge,
}: {
  title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode; badge?: string
}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-surface hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">{title}</span>
          {badge && <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
      </button>
      {isOpen && <div className="p-5 space-y-4 border-t border-border">{children}</div>}
    </div>
  )
}

// ── Client Picker Dropdown ────────────────────────────────────────────────────

interface ClientPickerProps {
  clients: Client[]
  onSelect: (client: Client) => void
}

function ClientPicker({ clients, onSelect }: ClientPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = clients.filter(c =>
    `${c.firstName} ${c.lastName} ${c.email} ${c.organization ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 border border-accent/40 text-accent text-sm rounded-lg hover:bg-accent/10 transition-colors"
      >
        <Users className="w-3.5 h-3.5" />
        Choose existing client
        <ChevronDown className="w-3.5 h-3.5 ml-1" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-[#0d1117] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg">
              <Search className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search clients..."
                className="bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-text-muted text-sm">No clients found</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onSelect(c); setOpen(false); setSearch('') }}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/[0.04] last:border-0"
                >
                  <div className="text-sm text-text-primary font-medium">{c.firstName} {c.lastName}</div>
                  <div className="text-xs text-text-muted">{c.email}{c.organization ? ` · ${c.organization}` : ''}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Send Modal ────────────────────────────────────────────────────────────────

interface SendModalProps {
  proposal: Proposal
  onClose: () => void
  onSent: () => void
}

function SendModal({ proposal, onClose, onSent }: SendModalProps) {
  const [to, setTo] = useState(proposal.clientEmail)
  const [subject, setSubject] = useState(`Proposal: ${proposal.title}`)
  const [message, setMessage] = useState(
    `Dear ${proposal.clientName},\n\nPlease find attached our proposal for ${proposal.title}.\n\nWe look forward to hearing from you.`
  )
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-[#0d1117] border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-text-primary">Send Proposal</h3>
          <button type="button" onClick={onClose} className="p-1 text-text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-text-primary font-medium">Proposal sent!</p>
            <p className="text-text-muted text-sm mt-1">Delivered to {to}</p>
            <button type="button" onClick={onSent} className="mt-5 px-4 py-2 bg-accent text-background text-sm font-semibold rounded-lg">
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                <p className="font-medium mb-0.5">Failed to send</p>
                <p className="text-xs opacity-80">{error}</p>
              </div>
            )}
            <div>
              <label className="block text-xs text-text-muted mb-1">To</label>
              <input value={to} onChange={e => setTo(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent/40" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent/40" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent/40 resize-none" />
            </div>
            <p className="text-xs text-text-muted">The PDF will be generated and attached automatically.</p>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2 border border-border text-text-muted text-sm rounded-lg hover:text-text-primary hover:border-white/20 transition-colors">
                Cancel
              </button>
              <BlobProvider document={<ProposalPDF proposal={proposal} />}>
                {({ blob, loading }) => (
                  <button
                    type="button"
                    disabled={sending || loading || !blob}
                    onClick={async () => {
                      if (!blob) return
                      setSending(true)
                      setError('')
                      try {
                        const reader = new FileReader()
                        const b64 = await new Promise<string>((resolve, reject) => {
                          reader.onload = () => resolve((reader.result as string).split(',')[1])
                          reader.onerror = reject
                          reader.readAsDataURL(blob)
                        })
                        await sendProposalEmail(proposal.id, { to, subject, message, pdfBase64: b64 })
                        setSent(true)
                      } catch (e: unknown) {
                        const ae = e as { response?: { data?: { error?: string } }; message?: string }
                        setError(ae?.response?.data?.error ?? ae?.message ?? 'Failed to send')
                      } finally {
                        setSending(false)
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent text-background text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {loading ? 'Preparing PDF...' : sending ? 'Sending...' : 'Send'}
                  </button>
                )}
              </BlobProvider>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  initial?: Proposal
  onBack: () => void
  onSaved: (proposal: Proposal) => void
}

export default function ProposalBuilder({ initial, onBack, onSaved }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState<Partial<Proposal>>(initial ?? {
    title: '', status: 'draft', clientName: '', clientEmail: '', clientPhone: '',
    clientCompany: '', date: today, validUntil: '', currency: 'USD',
    subtotal: 0, discountType: 'fixed', discountValue: 0, taxRate: 0, total: 0,
    executiveSummary: '', clientNeeds: '', proposedSolution: '', projectScope: '',
    deliverables: '', timeline: '', paymentTerms: '', termsConditions: '', notes: '',
  })

  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (initial?.lineItems) { try { return JSON.parse(initial.lineItems) } catch {} }
    return [newLineItem()]
  })

  const [clients, setClients] = useState<Client[]>([])
  const [saving, setSaving] = useState(false)
  const [savedProposal, setSavedProposal] = useState<Proposal | null>(initial ?? null)
  const [showPreview, setShowPreview] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    meta: true, client: true, content: false, pricing: true, terms: true,
  })
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    getClients().then(setClients).catch(() => {})
  }, [])

  const set = (key: keyof Proposal, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const toggleSection = useCallback((id: string) => {
    setOpenSections(s => ({ ...s, [id]: !s[id] }))
  }, [])

  const handleClientSelect = (client: Client) => {
    setForm(f => ({
      ...f,
      clientName: `${client.firstName} ${client.lastName}`,
      clientEmail: client.email,
      clientPhone: client.phone ?? f.clientPhone,
      clientCompany: client.organization ?? f.clientCompany,
      clientId: client.id,
    }))
    // Open client section to show filled values
    setOpenSections(s => ({ ...s, client: true }))
  }

  const updateLineItem = (id: string, key: keyof LineItem, value: string | number) => {
    setLineItems(items => items.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [key]: value }
      if (key === 'qty' || key === 'unitPrice') updated.total = Number(updated.qty) * Number(updated.unitPrice)
      return updated
    }))
  }

  const removeLineItem = (id: string) => setLineItems(items => items.filter(i => i.id !== id))
  const addLineItem = () => setLineItems(items => [...items, newLineItem()])

  const subtotal = lineItems.reduce((s, i) => s + i.total, 0)
  const discountAmt = form.discountType === 'percent'
    ? subtotal * ((form.discountValue ?? 0) / 100)
    : (form.discountValue ?? 0)
  const taxAmt = (subtotal - discountAmt) * ((form.taxRate ?? 0) / 100)
  const total = subtotal - discountAmt + taxAmt
  const sym = CURRENCY_SYMBOLS[form.currency ?? 'USD'] ?? '$'

  const previewProposal: Proposal = {
    ...(savedProposal ?? { id: 0, proposalNumber: 'DRAFT', createdAt: today, sentAt: null }),
    ...form,
    lineItems: JSON.stringify(lineItems),
    subtotal,
    total,
  } as Proposal

  const handleSave = useCallback(async () => {
    if (!form.title || !form.clientName || !form.clientEmail) {
      setSaveError('Title, client name, and client email are required.')
      return
    }
    setSaveError('')
    setSaving(true)
    try {
      const data = buildProposalData(form, lineItems)
      const saved = initial ? await updateProposal(initial.id, data) : await createProposal(data)
      setSavedProposal(saved)
      onSaved(saved)
    } catch {
      setSaveError('Failed to save proposal.')
    } finally {
      setSaving(false)
    }
  }, [form, lineItems, initial, onSaved])

  return (
    <div className="min-h-full">
      {/* ── Topbar ── */}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Status + actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent/40"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>

          <button type="button" onClick={() => setShowPreview(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 border border-border text-text-muted text-sm rounded-lg hover:text-text-primary hover:border-white/20 transition-colors">
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide' : 'Preview'}
          </button>

          {savedProposal && (
            <PDFDownloadLink
              document={<ProposalPDF proposal={previewProposal} />}
              fileName={`${savedProposal.proposalNumber}-proposal.pdf`}
              className="flex items-center gap-1.5 px-3 py-2 border border-border text-text-muted text-sm rounded-lg hover:text-text-primary hover:border-white/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </PDFDownloadLink>
          )}

          {savedProposal && (
            <button type="button" onClick={() => setShowSendModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-accent-secondary/40 text-accent-secondary text-sm rounded-lg hover:bg-accent-secondary/10 transition-colors">
              <Send className="w-4 h-4" />
              Send
            </button>
          )}

          {form.clientSignature && (
            <span className="flex items-center gap-1.5 px-3 py-2 border border-green-500/30 text-green-400 text-sm rounded-lg">
              <PenLine className="w-4 h-4" />
              Signed
            </span>
          )}

          <button type="button" onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-background text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{saveError}</div>
      )}

      <div className={`grid gap-6 ${showPreview ? 'grid-cols-2' : 'grid-cols-1 max-w-3xl mx-auto'}`}>
        {/* ── FORM ── */}
        <div className="space-y-4">

          {/* Proposal Details */}
          <Section title="Proposal Details" isOpen={openSections.meta} onToggle={() => toggleSection('meta')}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Title *">
                <input value={form.title ?? ''} onChange={e => set('title', e.target.value)}
                  placeholder="Website Redesign Project" className={inputCls} />
              </Field>
              <Field label="Currency">
                <select value={form.currency ?? 'USD'} onChange={e => set('currency', e.target.value)} className={inputCls}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Date">
                <input type="date" value={form.date ?? today} onChange={e => set('date', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Valid Until">
                <input type="date" value={form.validUntil ?? ''} onChange={e => set('validUntil', e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* Client Information */}
          <Section
            title="Client Information"
            isOpen={openSections.client}
            onToggle={() => toggleSection('client')}
            badge={form.clientName ? form.clientName : undefined}
          >
            {/* Choose existing client */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs text-text-muted">Auto-fill from existing client:</span>
              <ClientPicker clients={clients} onSelect={handleClientSelect} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Client Name *">
                <input value={form.clientName ?? ''} onChange={e => set('clientName', e.target.value)}
                  placeholder="Jane Smith" className={inputCls} />
              </Field>
              <Field label="Company">
                <input value={form.clientCompany ?? ''} onChange={e => set('clientCompany', e.target.value)}
                  placeholder="Acme Inc." className={inputCls} />
              </Field>
              <Field label="Email *">
                <input type="email" value={form.clientEmail ?? ''} onChange={e => set('clientEmail', e.target.value)}
                  placeholder="jane@acme.com" className={inputCls} />
              </Field>
              <Field label="Phone">
                <input value={form.clientPhone ?? ''} onChange={e => set('clientPhone', e.target.value)}
                  placeholder="+1 555 000 0000" className={inputCls} />
              </Field>
              <div className="col-span-2">
                <Field label="Address">
                  <input value={form.clientAddress ?? ''} onChange={e => set('clientAddress', e.target.value)}
                    placeholder="123 Main St, City, State" className={inputCls} />
                </Field>
              </div>
            </div>
          </Section>

          {/* Proposal Content */}
          <Section title="Proposal Content" isOpen={openSections.content} onToggle={() => toggleSection('content')}>
            <Field label="Executive Summary">
              <textarea value={form.executiveSummary ?? ''} onChange={e => set('executiveSummary', e.target.value)}
                placeholder="Brief overview of the proposal..." rows={3} className={textareaCls} />
            </Field>
            <Field label="Client Challenges & Needs">
              <textarea value={form.clientNeeds ?? ''} onChange={e => set('clientNeeds', e.target.value)}
                placeholder="Describe the client's challenges..." rows={3} className={textareaCls} />
            </Field>
            <Field label="Our Proposed Solution">
              <textarea value={form.proposedSolution ?? ''} onChange={e => set('proposedSolution', e.target.value)}
                placeholder="How you will solve those challenges..." rows={3} className={textareaCls} />
            </Field>
            <Field label="Project Scope">
              <textarea value={form.projectScope ?? ''} onChange={e => set('projectScope', e.target.value)}
                placeholder="What is in scope (and out of scope)..." rows={3} className={textareaCls} />
            </Field>
            <Field label="Deliverables">
              <textarea value={form.deliverables ?? ''} onChange={e => set('deliverables', e.target.value)}
                placeholder="List what will be delivered..." rows={3} className={textareaCls} />
            </Field>
            <Field label="Timeline & Milestones">
              <textarea value={form.timeline ?? ''} onChange={e => set('timeline', e.target.value)}
                placeholder="Phase 1: Week 1-2 — Discovery..." rows={3} className={textareaCls} />
            </Field>
          </Section>

          {/* Pricing */}
          <Section title="Pricing" isOpen={openSections.pricing} onToggle={() => toggleSection('pricing')}>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-text-muted font-medium pb-2">Description</th>
                    <th className="text-center text-xs text-text-muted font-medium pb-2 w-16 pl-2">Qty</th>
                    <th className="text-right text-xs text-text-muted font-medium pb-2 w-28 pl-2">Rate</th>
                    <th className="text-right text-xs text-text-muted font-medium pb-2 w-28 pl-2">Amount</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map(item => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-2 pr-2">
                        <input
                          value={item.description}
                          onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                          placeholder="Design & Development"
                          className="w-full px-2 py-1.5 bg-white/5 border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent/40"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={e => updateLineItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                          min={0}
                          className="w-14 px-2 py-1.5 bg-white/5 border border-border rounded text-text-primary text-sm text-center focus:outline-none focus:border-accent/40"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-text-muted text-xs">{sym}</span>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={e => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min={0}
                            className="w-24 px-2 py-1.5 bg-white/5 border border-border rounded text-text-primary text-sm text-right focus:outline-none focus:border-accent/40"
                          />
                        </div>
                      </td>
                      <td className="py-2 pl-1 text-right text-text-primary font-medium whitespace-nowrap">
                        {sym}{item.total.toFixed(2)}
                      </td>
                      <td className="py-2 pl-2">
                        <button type="button" onClick={() => removeLineItem(item.id)} disabled={lineItems.length === 1}
                          className="p-1 text-text-muted hover:text-red-400 transition-colors disabled:opacity-30">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" onClick={addLineItem}
              className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
              <Plus className="w-4 h-4" />
              Add line item
            </button>

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Subtotal</span>
                <span className="text-text-primary font-medium">{sym}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-text-muted text-sm w-20 flex-shrink-0">Discount</span>
                <select value={form.discountType ?? 'fixed'} onChange={e => set('discountType', e.target.value)}
                  className="px-2 py-1 bg-white/5 border border-border rounded text-text-primary text-xs focus:outline-none">
                  <option value="fixed">Fixed ({sym})</option>
                  <option value="percent">Percent (%)</option>
                </select>
                <input type="number" value={form.discountValue ?? 0}
                  onChange={e => set('discountValue', parseFloat(e.target.value) || 0)} min={0}
                  className="w-24 px-2 py-1 bg-white/5 border border-border rounded text-text-primary text-sm text-right focus:outline-none focus:border-accent/40" />
                {discountAmt > 0 && <span className="text-text-muted text-sm ml-auto">-{sym}{discountAmt.toFixed(2)}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-text-muted text-sm w-20 flex-shrink-0">Tax (%)</span>
                <input type="number" value={form.taxRate ?? 0}
                  onChange={e => set('taxRate', parseFloat(e.target.value) || 0)} min={0} max={100}
                  className="w-24 px-2 py-1 bg-white/5 border border-border rounded text-text-primary text-sm text-right focus:outline-none focus:border-accent/40" />
                {taxAmt > 0 && <span className="text-text-muted text-sm ml-auto">{sym}{taxAmt.toFixed(2)}</span>}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-text-primary font-bold">Total</span>
                <span className="text-accent font-bold text-xl">{sym}{total.toFixed(2)}</span>
              </div>
            </div>
          </Section>

          {/* Terms & Notes */}
          <Section title="Terms & Notes" isOpen={openSections.terms} onToggle={() => toggleSection('terms')}>
            <Field label="Payment Terms">
              <textarea value={form.paymentTerms ?? ''} onChange={e => set('paymentTerms', e.target.value)}
                placeholder="50% upfront, 50% on delivery..." rows={3} className={textareaCls} />
            </Field>
            <Field label="Terms & Conditions">
              <textarea value={form.termsConditions ?? ''} onChange={e => set('termsConditions', e.target.value)}
                placeholder="This proposal is valid for 30 days..." rows={3} className={textareaCls} />
            </Field>
            <Field label="Additional Notes">
              <textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value)}
                placeholder="Any other notes..." rows={3} className={textareaCls} />
            </Field>

            {/* Signatures */}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-text-muted mb-4">Signatures — type to sign. Both will appear on the PDF.</p>
              <div className="grid grid-cols-2 gap-6">
                {/* Client signature */}
                <div>
                  <label className="block text-xs text-text-muted mb-2">Client Signature</label>
                  <div className="relative">
                    <input
                      value={form.clientSignature ?? ''}
                      onChange={e => set('clientSignature', e.target.value)}
                      placeholder={form.clientName ? `${form.clientName}` : 'Client name'}
                      className="w-full px-3 pb-1 pt-2 bg-transparent border-0 border-b-2 border-border focus:border-accent/60 focus:outline-none text-text-primary placeholder-text-muted/40 italic"
                      style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem' }}
                    />
                    <PenLine className="absolute right-0 top-2 w-3.5 h-3.5 text-text-muted/40 pointer-events-none" />
                  </div>
                  <p className="text-xs text-text-muted/50 mt-1.5">{form.clientName || 'Client'} · {form.date || 'Date'}</p>
                </div>

                {/* Agency signature — pre-filled */}
                <div>
                  <label className="block text-xs text-text-muted mb-2">Agency Signature</label>
                  <div className="relative">
                    <input
                      readOnly
                      value="Terrence Adderley"
                      className="w-full px-3 pb-1 pt-2 bg-transparent border-0 border-b-2 border-border focus:outline-none text-text-primary italic cursor-default select-none"
                      style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem' }}
                    />
                  </div>
                  <p className="text-xs text-text-muted/50 mt-1.5">Terrence Adderley · Designs By TA</p>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* ── PDF PREVIEW ── */}
        {showPreview && (
          <div className="sticky top-0 h-screen">
            <BlobProvider document={<ProposalPDF proposal={previewProposal} />}>
              {({ url, loading }) => (
                <div className="h-full rounded-xl overflow-hidden border border-border">
                  {loading
                    ? <div className="h-full flex items-center justify-center text-text-muted text-sm">Generating preview...</div>
                    : url
                      ? <iframe src={url} className="w-full h-full" title="PDF Preview" />
                      : <div className="h-full flex items-center justify-center text-text-muted text-sm">Preview unavailable</div>}
                </div>
              )}
            </BlobProvider>
          </div>
        )}
      </div>

      {showSendModal && savedProposal && (
        <SendModal
          proposal={{ ...previewProposal, id: savedProposal.id, proposalNumber: savedProposal.proposalNumber }}
          onClose={() => setShowSendModal(false)}
          onSent={() => { setShowSendModal(false); set('status', 'sent') }}
        />
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon, CreditCard, CheckCircle2, XCircle,
  RefreshCw, Send, Trash2, Eye, EyeOff, ExternalLink, ArrowRight,
  DollarSign, Clock, AlertCircle, Ban
} from 'lucide-react'
import {
  AdminSettings, getAdminSettings, saveAdminSettings, testPayPalConnection,
  getPayPalInvoices, sendPayPalInvoice, cancelPayPalInvoice, deletePayPalInvoice,
  getPayPalTransactions, testSmtp,
} from '../../lib/api'

const inputCls = "w-full px-3 py-2 bg-[#f3f3f3] border border-zinc-200 rounded-lg text-black text-sm focus:outline-none focus:border-black/20 placeholder-text-muted"

const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT:     'text-zinc-500 bg-[#f3f3f3] border-zinc-200',
  SENT:      'text-black-secondary bg-black-secondary/10 border-accent-secondary/20',
  PAID:      'text-green-600 bg-green-500/10 border-green-400/20',
  UNPAID:    'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  PARTIALLY_PAID: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  CANCELLED: 'text-red-500 bg-red-500/10 border-red-400/20',
  REFUNDED:  'text-purple-400 bg-purple-400/10 border-purple-400/20',
}

function fmtCurrency(amount: { currency_code: string; value: string } | undefined) {
  if (!amount) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: amount.currency_code }).format(parseFloat(amount.value))
}

type Tab = 'paypal' | 'invoices' | 'transactions' | 'email'

export default function Settings() {
  const [tab, setTab] = useState<Tab>('paypal')
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [form, setForm] = useState({ paypalClientId: '', paypalSecret: '', paypalEnvironment: 'sandbox' })
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; accountInfo: unknown } | null>(null)
  const [saveMsg, setSaveMsg] = useState('')

  // Invoices state
  const [invoices, setInvoices] = useState<unknown[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [invoicesError, setInvoicesError] = useState('')
  const [actioningId, setActioningId] = useState<string | null>(null)

  // Transactions state
  const [transactions, setTransactions] = useState<unknown[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [txError, setTxError] = useState('')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })

  // Email/SMTP state
  const [smtpForm, setSmtpForm] = useState({
    smtpHost: '', smtpPort: '587', smtpUser: '', smtpPass: '', smtpFrom: '', smtpSecure: false,
  })
  const [smtpSaving, setSmtpSaving] = useState(false)
  const [smtpTesting, setSmtpTesting] = useState(false)
  const [smtpMsg, setSmtpMsg] = useState('')
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [showSmtpPass, setShowSmtpPass] = useState(false)

  useEffect(() => {
    getAdminSettings().then(s => {
      setSettings(s)
      setForm({
        paypalClientId: s.paypalClientId ?? '',
        paypalSecret: s.hasSecret ? '••••••••' : '',
        paypalEnvironment: s.paypalEnvironment,
      })
      setSmtpForm({
        smtpHost: s.smtpHost ?? '',
        smtpPort: s.smtpPort ?? '587',
        smtpUser: s.smtpUser ?? '',
        smtpPass: s.hasSmtpPass ? '••••••••' : '',
        smtpFrom: s.smtpFrom ?? '',
        smtpSecure: s.smtpSecure ?? false,
      })
    })
  }, [])

  useEffect(() => {
    if (tab === 'invoices') loadInvoices()
    if (tab === 'transactions') loadTransactions()
  }, [tab])

  const loadInvoices = async () => {
    setInvoicesLoading(true)
    setInvoicesError('')
    try {
      const data = await getPayPalInvoices()
      setInvoices(data.items ?? [])
    } catch (e) {
      setInvoicesError(e instanceof Error ? e.message : 'Failed to load invoices')
    } finally {
      setInvoicesLoading(false)
    }
  }

  const loadTransactions = async () => {
    setTxLoading(true)
    setTxError('')
    try {
      const data = await getPayPalTransactions(
        new Date(dateRange.start).toISOString(),
        new Date(dateRange.end + 'T23:59:59').toISOString()
      )
      setTransactions(data.transaction_details ?? [])
    } catch (e) {
      setTxError(e instanceof Error ? e.message : 'Failed to load transactions')
    } finally {
      setTxLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      const updated = await saveAdminSettings(form)
      setSettings(updated)
      setSaveMsg('Settings saved.')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch {
      setSaveMsg('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await testPayPalConnection()
      setTestResult(result)
      if (result.success) {
        const updated = await getAdminSettings()
        setSettings(updated)
      }
    } catch (e) {
      setTestResult({ success: false, message: e instanceof Error ? e.message : 'Failed', accountInfo: null })
    } finally {
      setTesting(false)
    }
  }

  const handleSendInvoice = async (invoiceId: string) => {
    setActioningId(invoiceId)
    try {
      await sendPayPalInvoice(invoiceId)
      await loadInvoices()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to send invoice')
    } finally {
      setActioningId(null)
    }
  }

  const handleCancelInvoice = async (invoiceId: string) => {
    if (!confirm('Cancel this invoice on PayPal?')) return
    setActioningId(invoiceId)
    try {
      await cancelPayPalInvoice(invoiceId)
      await loadInvoices()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to cancel')
    } finally {
      setActioningId(null)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Delete this draft invoice from PayPal?')) return
    setActioningId(invoiceId)
    try {
      await deletePayPalInvoice(invoiceId)
      await loadInvoices()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setActioningId(null)
    }
  }

  const handleSmtpSave = async () => {
    setSmtpSaving(true)
    setSmtpMsg('')
    try {
      const updated = await saveAdminSettings(smtpForm as Record<string, unknown> as Parameters<typeof saveAdminSettings>[0])
      setSettings(updated)
      setSmtpMsg('Email settings saved.')
      setTimeout(() => setSmtpMsg(''), 3000)
    } catch {
      setSmtpMsg('Failed to save.')
    } finally {
      setSmtpSaving(false)
    }
  }

  const handleSmtpTest = async () => {
    setSmtpTesting(true)
    setSmtpTestResult(null)
    try {
      const result = await testSmtp()
      setSmtpTestResult(result)
    } catch (e) {
      const ae = e as { response?: { data?: { error?: string } }; message?: string }
      setSmtpTestResult({ success: false, error: ae?.response?.data?.error ?? ae?.message ?? 'Connection failed' })
    } finally {
      setSmtpTesting(false)
    }
  }

  const tabBtn = (id: Tab, label: string) => (
    <button
      onClick={() => setTab(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        tab === id
          ? 'bg-zinc-100 text-black border border-accent/20'
          : 'text-zinc-500 hover:text-black'
      }`}
    >
      {label}
    </button>
  )

  const isConnected = settings?.paypalEmail || testResult?.success

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-5 h-5 text-black" />
        <h2 className="text-xl font-semibold text-black">Settings</h2>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-zinc-200 pb-4">
        {tabBtn('paypal', 'PayPal Account')}
        {tabBtn('invoices', 'PayPal Invoices')}
        {tabBtn('transactions', 'Transactions')}
        {tabBtn('email', 'Email / SMTP')}
      </div>

      {/* ── PAYPAL TAB ── */}
      {tab === 'paypal' && (
        <motion.div key="paypal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
          {/* Connection status */}
          {isConnected && (
            <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-400/20 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-600">PayPal Connected</p>
                {settings?.paypalEmail && (
                  <p className="text-xs text-zinc-500 mt-0.5">{settings.paypalEmail}</p>
                )}
              </div>
              <span className={`ml-auto text-xs px-2 py-1 rounded-full border ${
                settings?.paypalEnvironment === 'live'
                  ? 'text-green-600 border-green-400/30 bg-green-500/10'
                  : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
              }`}>
                {settings?.paypalEnvironment === 'live' ? 'Live' : 'Sandbox'}
              </span>
            </div>
          )}

          {/* Credentials form */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-black" />
              <h3 className="text-sm font-semibold text-black">PayPal API Credentials</h3>
            </div>
            <p className="text-xs text-zinc-500">
              Get your Client ID and Secret from the{' '}
              <a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noreferrer"
                className="text-black-secondary hover:underline inline-flex items-center gap-1">
                PayPal Developer Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </p>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Environment</label>
              <select
                value={form.paypalEnvironment}
                onChange={e => setForm(f => ({ ...f, paypalEnvironment: e.target.value }))}
                className={inputCls}
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="live">Live (Production)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Client ID</label>
              <input
                value={form.paypalClientId}
                onChange={e => setForm(f => ({ ...f, paypalClientId: e.target.value }))}
                placeholder="AaBbCcDd..."
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Client Secret</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={form.paypalSecret}
                  onChange={e => setForm(f => ({ ...f, paypalSecret: e.target.value }))}
                  placeholder="Enter secret..."
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {saveMsg && (
              <p className={`text-xs ${saveMsg.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>{saveMsg}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-black text-background text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Credentials'}
              </button>
              <button
                onClick={handleTest}
                disabled={testing || !form.paypalClientId}
                className="flex items-center gap-2 px-4 py-2 border border-zinc-200 text-zinc-500 text-sm rounded-lg hover:text-black hover:border-zinc-400 transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {testResult && (
              <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
                testResult.success
                  ? 'bg-green-500/5 border-green-400/20 text-green-600'
                  : 'bg-red-500/5 border-red-400/20 text-red-500'
              }`}>
                {testResult.success
                  ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Help */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-black">How to get your credentials</h3>
            {[
              ['1', 'Go to developer.paypal.com and log in with your PayPal business account'],
              ['2', 'Click "Apps & Credentials" in the dashboard'],
              ['3', 'Create a new app or select an existing one'],
              ['4', 'Copy the Client ID and Secret from the app details'],
              ['5', 'Use "Sandbox" for testing, "Live" for real transactions'],
            ].map(([num, text]) => (
              <div key={num} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-zinc-100 text-black text-xs font-bold flex items-center justify-center flex-shrink-0">{num}</span>
                <p className="text-xs text-zinc-500">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── INVOICES TAB ── */}
      {tab === 'invoices' && (
        <motion.div key="invoices" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-zinc-500">PayPal invoices synced from your account</p>
            <button
              onClick={loadInvoices}
              disabled={invoicesLoading}
              className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 text-zinc-500 text-sm rounded-lg hover:text-black transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${invoicesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {!settings?.paypalClientId ? (
            <div className="text-center py-16">
              <CreditCard className="w-10 h-10 text-zinc-500 mx-auto mb-3 opacity-40" />
              <p className="text-zinc-500 text-sm mb-3">PayPal not connected</p>
              <button onClick={() => setTab('paypal')}
                className="flex items-center gap-2 px-4 py-2 bg-black text-background text-sm font-semibold rounded-lg mx-auto hover:bg-zinc-800 transition-colors">
                Connect PayPal <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : invoicesLoading ? (
            <div className="text-center py-12 text-zinc-500 text-sm">Loading invoices from PayPal...</div>
          ) : invoicesError ? (
            <div className="flex items-center gap-2 p-4 bg-red-500/5 border border-red-400/20 rounded-xl text-sm text-red-500">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {invoicesError}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-sm">No PayPal invoices found.</div>
          ) : (
            <div className="space-y-3">
              {(invoices as Array<Record<string, unknown>>).map((inv) => {
                const id = inv.id as string
                const detail = inv.detail as Record<string, unknown>
                const payments = inv.payments as Record<string, unknown> | undefined
                const amountDue = (payments?.paid_amount as Record<string, string> | undefined)
                const status = inv.status as string
                const colorCls = INVOICE_STATUS_COLORS[status] ?? INVOICE_STATUS_COLORS.DRAFT
                const amount = inv.amount as Record<string, unknown> | undefined
                const amountValue = (amount?.value as { currency_code: string; value: string }) || undefined

                return (
                  <div key={id} className="bg-white border border-zinc-200 rounded-xl p-5 flex items-center gap-4">
                    <div className="flex-shrink-0 w-32">
                      <p className="text-xs font-mono text-zinc-500">{detail?.invoice_number as string || id.slice(0, 12)}</p>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-1 ${colorCls}`}>
                        {status}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-black truncate">
                        {((inv.primary_recipients as Array<Record<string, unknown>>)?.[0]?.billing_info as Record<string, unknown>)?.name?.toString() || 'No recipient'}
                      </p>
                      <p className="text-xs text-zinc-500">{detail?.invoice_date as string}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-black">{fmtCurrency(amountValue)}</p>
                      {amountDue && <p className="text-xs text-zinc-500">Paid: {fmtCurrency(amountDue as { currency_code: string; value: string })}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(id.startsWith('INV2') || status === 'DRAFT') && status !== 'CANCELLED' && status !== 'PAID' && (
                        <>
                          {status === 'DRAFT' && (
                            <button
                              onClick={() => handleSendInvoice(id)}
                              disabled={actioningId === id}
                              title="Send to recipient"
                              className="p-2 text-zinc-500 hover:text-black-secondary hover:bg-black-secondary/10 rounded-lg transition-colors"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {(status === 'DRAFT' || status === 'SENT' || status === 'UNPAID') && (
                            <button
                              onClick={() => handleCancelInvoice(id)}
                              disabled={actioningId === id}
                              title="Cancel invoice"
                              className="p-2 text-zinc-500 hover:text-orange-400 hover:bg-orange-400/10 rounded-lg transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          {status === 'DRAFT' && (
                            <button
                              onClick={() => handleDeleteInvoice(id)}
                              disabled={actioningId === id}
                              title="Delete draft"
                              className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ── TRANSACTIONS TAB ── */}
      {tab === 'transactions' && (
        <motion.div key="transactions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {/* Date filter */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500">From</label>
              <input type="date" value={dateRange.start}
                onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))}
                className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-black text-sm focus:outline-none focus:border-black/20" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500">To</label>
              <input type="date" value={dateRange.end}
                onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))}
                className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-black text-sm focus:outline-none focus:border-black/20" />
            </div>
            <button
              onClick={loadTransactions}
              disabled={txLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-black text-background text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${txLoading ? 'animate-spin' : ''}`} />
              {txLoading ? 'Loading...' : 'Load'}
            </button>
          </div>

          {!settings?.paypalClientId ? (
            <div className="text-center py-16">
              <CreditCard className="w-10 h-10 text-zinc-500 mx-auto mb-3 opacity-40" />
              <p className="text-zinc-500 text-sm mb-3">PayPal not connected</p>
              <button onClick={() => setTab('paypal')}
                className="flex items-center gap-2 px-4 py-2 bg-black text-background text-sm font-semibold rounded-lg mx-auto hover:bg-zinc-800 transition-colors">
                Connect PayPal <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : txLoading ? (
            <div className="text-center py-12 text-zinc-500 text-sm">Loading transactions...</div>
          ) : txError ? (
            <div className="flex items-center gap-2 p-4 bg-red-500/5 border border-red-400/20 rounded-xl text-sm text-red-500">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {txError}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-sm">No transactions in this date range.</div>
          ) : (
            <>
              {/* Summary */}
              {(() => {
                const completed = (transactions as Array<Record<string, unknown>>)
                  .filter(t => {
                    const info = t.transaction_info as Record<string, unknown>
                    return info?.transaction_status === 'S'
                  })
                const total = completed.reduce((sum, t) => {
                  const info = t.transaction_info as Record<string, unknown>
                  const amt = parseFloat((info?.transaction_amount as Record<string, string>)?.value ?? '0')
                  return sum + amt
                }, 0)
                return (
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    <div className="bg-white border border-zinc-200 rounded-xl p-4">
                      <p className="text-xs text-zinc-500 mb-1">Total Transactions</p>
                      <p className="text-xl font-bold text-black">{transactions.length}</p>
                    </div>
                    <div className="bg-white border border-zinc-200 rounded-xl p-4">
                      <p className="text-xs text-zinc-500 mb-1">Completed</p>
                      <p className="text-xl font-bold text-green-600">{completed.length}</p>
                    </div>
                    <div className="bg-white border border-zinc-200 rounded-xl p-4">
                      <p className="text-xs text-zinc-500 mb-1">Total Received</p>
                      <p className="text-xl font-bold text-black">${total.toFixed(2)}</p>
                    </div>
                  </div>
                )
              })()}

              <div className="space-y-2">
                {(transactions as Array<Record<string, unknown>>).map((tx, i) => {
                  const info = tx.transaction_info as Record<string, unknown>
                  const payerInfo = tx.payer_info as Record<string, unknown> | undefined
                  const status = info?.transaction_status as string
                  const amount = info?.transaction_amount as Record<string, string> | undefined
                  const isCredit = parseFloat(amount?.value ?? '0') > 0
                  const statusColors: Record<string, string> = {
                    S: 'text-green-600', D: 'text-red-500', P: 'text-yellow-400', V: 'text-zinc-500'
                  }
                  const statusLabels: Record<string, string> = {
                    S: 'Completed', D: 'Denied', P: 'Pending', V: 'Reversed'
                  }
                  return (
                    <div key={i} className="bg-white border border-zinc-200 rounded-xl px-5 py-3.5 flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {isCredit ? <DollarSign className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-black">
                          {(payerInfo?.email_address as string) || 'PayPal transaction'}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {info?.transaction_id as string} · {new Date(info?.transaction_initiation_date as string).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs ${statusColors[status] ?? 'text-zinc-500'}`}>
                        {statusLabels[status] ?? status}
                      </span>
                      <p className={`font-bold text-lg flex-shrink-0 ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                        {isCredit ? '+' : ''}{amount?.currency_code} {parseFloat(amount?.value ?? '0').toFixed(2)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ── EMAIL / SMTP TAB ── */}
      {tab === 'email' && (
        <motion.div key="email" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
          {/* Status banner */}
          {settings?.smtpUser && (
            <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-400/20 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-600">Email Configured</p>
                <p className="text-xs text-zinc-500 mt-0.5">Sending from {settings.smtpUser} via {settings.smtpHost}</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Send className="w-4 h-4 text-black" />
              <h3 className="text-sm font-semibold text-black">SMTP Configuration</h3>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 space-y-1">
              <p className="font-semibold">Quick setup guides:</p>
              <p>• <strong>Office 365:</strong> Host: smtp.office365.com · Port: 587 · Secure: Off — requires SMTP AUTH enabled in Microsoft 365 Admin Center</p>
              <p>• <strong>Gmail:</strong> Host: smtp.gmail.com · Port: 587 · Secure: Off — use an App Password (myaccount.google.com/apppasswords)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">SMTP Host</label>
                <input value={smtpForm.smtpHost} onChange={e => setSmtpForm(f => ({ ...f, smtpHost: e.target.value }))}
                  placeholder="smtp.office365.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Port</label>
                <input value={smtpForm.smtpPort} onChange={e => setSmtpForm(f => ({ ...f, smtpPort: e.target.value }))}
                  placeholder="587" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Username / Email</label>
                <input value={smtpForm.smtpUser} onChange={e => setSmtpForm(f => ({ ...f, smtpUser: e.target.value }))}
                  placeholder="you@yourdomain.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Password / App Password</label>
                <div className="relative">
                  <input
                    type={showSmtpPass ? 'text' : 'password'}
                    value={smtpForm.smtpPass}
                    onChange={e => setSmtpForm(f => ({ ...f, smtpPass: e.target.value }))}
                    placeholder="••••••••"
                    className={inputCls + ' pr-10'}
                  />
                  <button type="button" onClick={() => setShowSmtpPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black">
                    {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-zinc-500 mb-1">From Address (optional)</label>
                <input value={smtpForm.smtpFrom} onChange={e => setSmtpForm(f => ({ ...f, smtpFrom: e.target.value }))}
                  placeholder='DTA <you@yourdomain.com>' className={inputCls} />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div onClick={() => setSmtpForm(f => ({ ...f, smtpSecure: !f.smtpSecure }))}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${smtpForm.smtpSecure ? 'bg-black' : 'bg-[#f3f3f3]'}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${smtpForm.smtpSecure ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs text-zinc-500">Use SSL/TLS on connect (port 465)</span>
                </label>
                <span className="text-xs text-zinc-500">— leave off for STARTTLS (port 587)</span>
              </div>
            </div>

            {smtpTestResult && (
              <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                smtpTestResult.success
                  ? 'bg-green-500/10 border border-green-500/20 text-green-600'
                  : 'bg-red-500/10 border border-red-500/20 text-red-500'
              }`}>
                {smtpTestResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                <span>{smtpTestResult.success ? smtpTestResult.message : smtpTestResult.error}</span>
              </div>
            )}

            {smtpMsg && (
              <p className={`text-sm ${smtpMsg.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>{smtpMsg}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={handleSmtpTest} disabled={smtpTesting || !smtpForm.smtpHost}
                className="px-4 py-2 border border-zinc-200 text-zinc-500 text-sm rounded-lg hover:text-black transition-colors disabled:opacity-40">
                {smtpTesting ? 'Testing...' : 'Test Connection'}
              </button>
              <button onClick={handleSmtpSave} disabled={smtpSaving}
                className="px-4 py-2 bg-black text-background text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50">
                {smtpSaving ? 'Saving...' : 'Save Email Settings'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

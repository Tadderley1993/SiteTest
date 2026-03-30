import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon, CreditCard, CheckCircle2, XCircle,
  RefreshCw, Send, Eye, EyeOff, ExternalLink,
} from 'lucide-react'
import {
  AdminSettings, getAdminSettings, saveAdminSettings, testStripeConnection,
  testSmtp, updateAdminAccount,
} from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const inputCls = "w-full px-3 py-2 bg-[#f3f3f3] border border-zinc-200 rounded-lg text-black text-sm focus:outline-none focus:border-black/20 placeholder-text-muted"

type Tab = 'stripe' | 'email' | 'account'

export default function Settings() {
  const { username: currentUsername } = useAuth()
  const [tab, setTab] = useState<Tab>('stripe')
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [form, setForm] = useState({ stripeSecretKey: '', stripePublishableKey: '', stripeWebhookSecret: '' })
  const [showSecret, setShowSecret] = useState(false)
  const [showWebhook, setShowWebhook] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; accountInfo: unknown } | null>(null)
  const [saveMsg, setSaveMsg] = useState('')

  // Email/SMTP state
  const [smtpForm, setSmtpForm] = useState({
    smtpHost: '', smtpPort: '587', smtpUser: '', smtpPass: '', smtpFrom: '', smtpSecure: false,
  })
  const [smtpSaving, setSmtpSaving] = useState(false)
  const [smtpTesting, setSmtpTesting] = useState(false)
  const [smtpMsg, setSmtpMsg] = useState('')
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [showSmtpPass, setShowSmtpPass] = useState(false)

  // Account state
  const [accountForm, setAccountForm] = useState({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' })
  const [showAccountPass, setShowAccountPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [accountSaving, setAccountSaving] = useState(false)
  const [accountMsg, setAccountMsg] = useState('')
  const [accountError, setAccountError] = useState('')

  // Recovery emails state
  const [recoveryForm, setRecoveryForm] = useState({ recoveryEmail1: '', recoveryEmail2: '' })
  const [recoverySaving, setRecoverySaving] = useState(false)
  const [recoveryMsg, setRecoveryMsg] = useState('')

  useEffect(() => {
    getAdminSettings().then(s => {
      setSettings(s)
      setForm({
        stripeSecretKey: s.hasStripeKey ? '••••••••' : '',
        stripePublishableKey: s.stripePublishableKey ?? '',
        stripeWebhookSecret: s.hasStripeWebhook ? '••••••••' : '',
      })
      setSmtpForm({
        smtpHost: s.smtpHost ?? '',
        smtpPort: s.smtpPort ?? '587',
        smtpUser: s.smtpUser ?? '',
        smtpPass: s.hasSmtpPass ? '••••••••' : '',
        smtpFrom: s.smtpFrom ?? '',
        smtpSecure: s.smtpSecure ?? false,
      })
      setRecoveryForm({
        recoveryEmail1: s.recoveryEmail1 ?? '',
        recoveryEmail2: s.recoveryEmail2 ?? '',
      })
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      const updated = await saveAdminSettings(form)
      setSettings(updated)
      setSaveMsg('Settings saved.')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to save.'
      setSaveMsg(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await testStripeConnection()
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

  const handleAccountSave = async () => {
    setAccountError('')
    setAccountMsg('')
    if (!accountForm.currentPassword) { setAccountError('Current password is required'); return }
    if (!accountForm.newUsername && !accountForm.newPassword) { setAccountError('Enter a new username or new password'); return }
    if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) { setAccountError('New passwords do not match'); return }
    if (accountForm.newPassword && accountForm.newPassword.length < 8) { setAccountError('New password must be at least 8 characters'); return }
    setAccountSaving(true)
    try {
      const data: { currentPassword: string; newUsername?: string; newPassword?: string } = { currentPassword: accountForm.currentPassword }
      if (accountForm.newUsername) data.newUsername = accountForm.newUsername
      if (accountForm.newPassword) data.newPassword = accountForm.newPassword
      const result = await updateAdminAccount(data)
      setAccountMsg(result.message)
      setAccountForm({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setAccountMsg(''), 4000)
    } catch (e) {
      const ae = e as { response?: { data?: { error?: string } }; message?: string }
      setAccountError(ae?.response?.data?.error ?? ae?.message ?? 'Failed to update account')
    } finally {
      setAccountSaving(false)
    }
  }

  const handleRecoverySave = async () => {
    setRecoveryMsg('')
    setRecoverySaving(true)
    try {
      await saveAdminSettings({ recoveryEmail1: recoveryForm.recoveryEmail1, recoveryEmail2: recoveryForm.recoveryEmail2 } as Parameters<typeof saveAdminSettings>[0])
      setRecoveryMsg('Recovery emails saved.')
      setTimeout(() => setRecoveryMsg(''), 4000)
    } catch (e) {
      const ae = e as { response?: { data?: { error?: string } }; message?: string }
      setRecoveryMsg(ae?.response?.data?.error ?? ae?.message ?? 'Failed to save')
    } finally {
      setRecoverySaving(false)
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-5 h-5 text-black" />
        <h2 className="text-xl font-semibold text-black">Settings</h2>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-zinc-200 pb-4">
        {tabBtn('stripe', 'Stripe')}
        {tabBtn('email', 'Email / SMTP')}
        {tabBtn('account', 'My Account')}
      </div>

      {/* ── STRIPE TAB ── */}
      {tab === 'stripe' && (
        <motion.div key="stripe" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
          {/* Connection status */}
          {(settings?.hasStripeKey || testResult?.success) && (
            <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-400/20 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-600">Stripe Connected</p>
                <p className="text-xs text-zinc-500 mt-0.5">Secret key configured — payment links are active</p>
              </div>
            </div>
          )}

          {/* Credentials form */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-black" />
              <h3 className="text-sm font-semibold text-black">Stripe API Keys</h3>
            </div>
            <p className="text-xs text-zinc-500">
              Get your keys from the{' '}
              <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer"
                className="text-black hover:underline inline-flex items-center gap-1">
                Stripe Dashboard → Developers → API Keys <ExternalLink className="w-3 h-3" />
              </a>
            </p>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Secret Key <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={form.stripeSecretKey}
                  onChange={e => setForm(f => ({ ...f, stripeSecretKey: e.target.value }))}
                  placeholder="sk_live_..."
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
              <p className="mt-1 text-[11px] text-zinc-400">Used server-side only. Never exposed to the browser.</p>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Publishable Key</label>
              <input
                value={form.stripePublishableKey}
                onChange={e => setForm(f => ({ ...f, stripePublishableKey: e.target.value }))}
                placeholder="pk_live_..."
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Webhook Signing Secret</label>
              <div className="relative">
                <input
                  type={showWebhook ? 'text' : 'password'}
                  value={form.stripeWebhookSecret}
                  onChange={e => setForm(f => ({ ...f, stripeWebhookSecret: e.target.value }))}
                  placeholder="whsec_..."
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowWebhook(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black"
                >
                  {showWebhook ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-zinc-400">
                From Stripe Dashboard → Developers → Webhooks. Required for real-time payment notifications.
              </p>
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
                {saving ? 'Saving...' : 'Save Keys'}
              </button>
              <button
                onClick={handleTest}
                disabled={testing || !form.stripeSecretKey || form.stripeSecretKey === '••••••••'}
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

          {/* Webhook setup guide */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-black">Webhook Setup</h3>
            <p className="text-xs text-zinc-500">
              Add this URL in your Stripe Dashboard → Developers → Webhooks → Add endpoint:
            </p>
            <code className="block text-xs bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-black font-mono break-all">
              https://gallant-harmony-production-646a.up.railway.app/api/stripe/webhook
            </code>
            <p className="text-xs text-zinc-500">Events to listen for: <strong>invoice.paid</strong></p>
            {[
              ['1', 'Go to dashboard.stripe.com → Developers → Webhooks'],
              ['2', 'Click "Add endpoint" and paste the URL above'],
              ['3', 'Select event: invoice.paid'],
              ['4', 'Copy the "Signing secret" (whsec_...) and paste above'],
              ['5', 'For local testing: stripe listen --forward-to localhost:3001/api/stripe/webhook'],
            ].map(([num, text]) => (
              <div key={num} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-zinc-100 text-black text-xs font-bold flex items-center justify-center flex-shrink-0">{num}</span>
                <p className="text-xs text-zinc-500">{text}</p>
              </div>
            ))}
          </div>
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

      {/* ── MY ACCOUNT TAB ── */}
      {tab === 'account' && (
        <motion.div key="account" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-base text-black">manage_accounts</span>
              <h3 className="text-sm font-semibold text-black">Change Username or Password</h3>
            </div>

            <div>
              <p className="text-xs text-zinc-500 mb-1">Current username</p>
              <p className="text-sm font-medium text-black">{currentUsername ?? '—'}</p>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">New Username <span className="text-zinc-400">(leave blank to keep current)</span></label>
              <input
                value={accountForm.newUsername}
                onChange={e => setAccountForm(f => ({ ...f, newUsername: e.target.value }))}
                placeholder={currentUsername ?? 'admin'}
                className={inputCls}
              />
            </div>

            <div className="border-t border-zinc-100 pt-4">
              <label className="block text-xs text-zinc-500 mb-1">New Password <span className="text-zinc-400">(leave blank to keep current)</span></label>
              <div className="relative mb-3">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={accountForm.newPassword}
                  onChange={e => setAccountForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Min. 8 characters"
                  className={inputCls + ' pr-10'}
                />
                <button type="button" onClick={() => setShowNewPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black">
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <label className="block text-xs text-zinc-500 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={accountForm.confirmPassword}
                onChange={e => setAccountForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Re-enter new password"
                className={inputCls}
              />
            </div>

            <div className="border-t border-zinc-100 pt-4">
              <label className="block text-xs text-zinc-500 mb-1">Current Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  type={showAccountPass ? 'text' : 'password'}
                  value={accountForm.currentPassword}
                  onChange={e => setAccountForm(f => ({ ...f, currentPassword: e.target.value }))}
                  placeholder="Required to confirm changes"
                  className={inputCls + ' pr-10'}
                />
                <button type="button" onClick={() => setShowAccountPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black">
                  {showAccountPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {accountError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-400/20 rounded-lg text-sm text-red-500">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span>{accountError}</span>
              </div>
            )}
            {accountMsg && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-400/20 rounded-lg text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{accountMsg}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleAccountSave}
              disabled={accountSaving}
              className="w-full px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {accountSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Recovery emails */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-base text-black">mail_lock</span>
              <h3 className="text-sm font-semibold text-black">Password Recovery Emails</h3>
            </div>
            <p className="text-xs text-zinc-500">When you use "Forgot password?" on the login page, a temporary password is sent to these addresses.</p>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Recovery Email 1</label>
              <input
                type="email"
                value={recoveryForm.recoveryEmail1}
                onChange={e => setRecoveryForm(f => ({ ...f, recoveryEmail1: e.target.value }))}
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Recovery Email 2 <span className="text-zinc-400">(optional)</span></label>
              <input
                type="email"
                value={recoveryForm.recoveryEmail2}
                onChange={e => setRecoveryForm(f => ({ ...f, recoveryEmail2: e.target.value }))}
                placeholder="backup@example.com"
                className={inputCls}
              />
            </div>

            {recoveryMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${recoveryMsg.includes('saved') ? 'bg-green-500/10 border border-green-400/20 text-green-600' : 'bg-red-500/10 border border-red-400/20 text-red-500'}`}>
                {recoveryMsg.includes('saved') ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{recoveryMsg}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleRecoverySave}
              disabled={recoverySaving}
              className="w-full px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {recoverySaving ? 'Saving...' : 'Save Recovery Emails'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

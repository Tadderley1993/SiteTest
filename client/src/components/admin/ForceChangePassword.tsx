import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { updateAdminAccount } from '../../lib/api'

export default function ForceChangePassword() {
  const { clearMustChangePassword, logout } = useAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      await updateAdminAccount({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      clearMustChangePassword()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4 font-['Inter',sans-serif]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tighter text-black">Designs by Terrence Adderley</h1>
          <p className="text-xs text-zinc-400 font-medium tracking-wide uppercase mt-1">Agency OS</p>
        </div>

        <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-amber-500 text-lg">⚠</span>
            <p className="text-sm text-amber-700 font-medium">You must set a new password before continuing.</p>
          </div>

          <h2 className="text-xl font-bold text-black mb-1">Set New Password</h2>
          <p className="text-sm text-zinc-400 mb-8">
            Enter your temporary password and choose a permanent one.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Temporary Password
              </label>
              <div className="relative">
                <input
                  type={show.current ? 'text' : 'password'}
                  value={form.currentPassword}
                  onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                  className="w-full bg-[#f3f3f3] border-none rounded-lg px-4 py-3 pr-12 text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                  placeholder="Your temp password from email"
                  required
                />
                <button type="button" onClick={() => setShow(s => ({ ...s, current: !s.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-medium">
                  {show.current ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={show.new ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                  className="w-full bg-[#f3f3f3] border-none rounded-lg px-4 py-3 pr-12 text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                  placeholder="At least 8 characters"
                  required
                />
                <button type="button" onClick={() => setShow(s => ({ ...s, new: !s.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-medium">
                  {show.new ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={show.confirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className="w-full bg-[#f3f3f3] border-none rounded-lg px-4 py-3 pr-12 text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                  placeholder="Repeat new password"
                  required
                />
                <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-medium">
                  {show.confirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? 'Saving...' : 'Set New Password & Continue'}
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2 text-zinc-400 hover:text-black transition-colors text-sm"
            >
              Cancel & log out
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

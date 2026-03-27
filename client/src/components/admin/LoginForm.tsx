import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { forgotPassword } from '../../lib/api'

interface Props {
  onSuccess: () => void
}

export default function LoginForm({ onSuccess }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false)
  const [forgotUsername, setForgotUsername] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotError, setForgotError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(username, password)
      onSuccess()
    } catch {
      setError('Invalid username or password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotMsg('')
    setForgotLoading(true)
    try {
      const res = await forgotPassword(forgotUsername)
      setForgotMsg(res.message)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setForgotError(msg ?? 'Something went wrong. Make sure SMTP is configured in Settings.')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4 font-['Inter',sans-serif]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tighter text-black">Designs by Terrence Adderley</h1>
          <p className="text-xs text-zinc-400 font-medium tracking-wide uppercase mt-1">Agency OS</p>
        </div>

        <AnimatePresence mode="wait">
          {!showForgot ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-sm p-8"
            >
              <h2 className="text-xl font-bold text-black mb-1">Admin Login</h2>
              <p className="text-sm text-zinc-400 mb-8">Sign in to access the dashboard</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#f3f3f3] border-none rounded-lg px-4 py-3 text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                    placeholder="admin"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(true); setForgotUsername(username) }}
                      className="text-xs text-zinc-400 hover:text-black transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#f3f3f3] border-none rounded-lg px-4 py-3 pr-12 text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors text-xs font-medium"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 text-sm"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-sm p-8"
            >
              <button
                type="button"
                onClick={() => { setShowForgot(false); setForgotMsg(''); setForgotError('') }}
                className="text-xs text-zinc-400 hover:text-black transition-colors mb-6 flex items-center gap-1"
              >
                ← Back to login
              </button>

              <h2 className="text-xl font-bold text-black mb-1">Reset Password</h2>
              <p className="text-sm text-zinc-400 mb-8">
                Enter your username and we'll send a temporary password to your recovery emails.
              </p>

              {forgotMsg ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 text-sm font-medium">✓ Email sent</p>
                  <p className="text-green-600 text-sm mt-1">{forgotMsg}</p>
                  <button
                    type="button"
                    onClick={() => { setShowForgot(false); setForgotMsg('') }}
                    className="mt-4 text-sm font-semibold text-black hover:text-zinc-600 transition-colors"
                  >
                    Back to login →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value)}
                      className="w-full bg-[#f3f3f3] border-none rounded-lg px-4 py-3 text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                      placeholder="admin"
                      required
                    />
                  </div>

                  {forgotError && <p className="text-red-500 text-sm">{forgotError}</p>}

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 text-sm"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Temporary Password'}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useClientAuth } from '../context/ClientAuthContext'
import { createPortalApi } from '../lib/portalApi'

// ── Login Form ──────────────────────────────────────────────────
function ClientLoginForm() {
  const { clientLogin } = useClientAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await clientLogin(email, password)
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tighter text-black">Client Portal</h1>
          <p className="text-zinc-500 mt-2 text-sm">Designs by Terrence Adderley</p>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)]">
          <h2 className="text-xl font-bold tracking-tight mb-6">Sign In</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-zinc-400 mt-6">
          Access provided by your project manager. <br />Contact{' '}
          <a href="mailto:terrenceadderley@designsbyta.com" className="underline">
            terrenceadderley@designsbyta.com
          </a>{' '}
          for help.
        </p>
      </div>
    </div>
  )
}

// ── Types ────────────────────────────────────────────────────────
const JOURNEY_PHASES = [
  { id: 'discovery',       label: 'Discovery' },
  { id: 'planning',        label: 'Planning' },
  { id: 'design_1',        label: 'Phase 1 Design' },
  { id: 'design_2',        label: 'Phase 2 Design' },
  { id: 'development',     label: 'Development' },
  { id: 'review',          label: 'Client Review' },
  { id: 'final_approval',  label: 'Final Approval' },
  { id: 'handoff',         label: 'Handoff' },
]

interface ClientData {
  id: number
  firstName: string
  lastName: string
  email: string
  organization?: string
  journeyPhase?: string
  projectScope?: {
    projectName?: string
    status?: string
    startDate?: string
    endDate?: string
  }
  tasks?: Array<{ column: string }>
}

interface Invoice {
  id: number
  invoiceNumber: string
  amount: number
  status: string
  dueDate: string
  issuedDate: string
  currency: string
}

interface Proposal {
  id: number
  proposalNumber: string
  title: string
  status: string
  date: string
  total: number
  currency: string
}

interface PortalFile {
  id: number
  fileName: string
  docType: string
  size: number
  createdAt: string
}

interface PortalMessage {
  id: number
  clientId: number
  fromAdmin: boolean
  body: string
  read: boolean
  createdAt: string
}

// ── Dashboard ────────────────────────────────────────────────────
type PortalView = 'dashboard' | 'files' | 'invoices' | 'proposals' | 'messages'

function ClientDashboard() {
  const { clientUser, clientLogout } = useClientAuth()
  const [view, setView] = useState<PortalView>('dashboard')
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [files, setFiles] = useState<PortalFile[]>([])
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [messages, setMessages] = useState<PortalMessage[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [msgSending, setMsgSending] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  const handleFileDownload = async (file: PortalFile) => {
    if (!clientUser) return
    setDownloadingId(file.id)
    try {
      const portalApi = createPortalApi(clientUser.accessToken)
      const res = await portalApi.get(`/portal/files/${file.id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Download failed', e)
    } finally {
      setDownloadingId(null)
    }
  }

  useEffect(() => {
    if (!clientUser) return
    const portalApi = createPortalApi(clientUser.accessToken)
    Promise.all([
      portalApi.get('/portal/me'),
      portalApi.get('/portal/invoices'),
      portalApi.get('/portal/proposals'),
      portalApi.get('/portal/files'),
      portalApi.get('/portal/messages'),
    ]).then(([me, inv, prop, fil, msgs]) => {
      setClientData(me.data)
      setInvoices(inv.data)
      setProposals(prop.data)
      setFiles(fil.data)
      setMessages(msgs.data)
      setUnreadMessages((msgs.data as PortalMessage[]).filter(m => m.fromAdmin && !m.read).length)
    }).catch(() => {})
  }, [clientUser])

  const handleSendMessage = async () => {
    if (!msgInput.trim() || msgSending || !clientUser) return
    setMsgSending(true)
    try {
      const portalApi = createPortalApi(clientUser.accessToken)
      const res = await portalApi.post('/portal/messages', { body: msgInput.trim() })
      setMessages(prev => [...prev, res.data])
      setMsgInput('')
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch { /* silent */ } finally {
      setMsgSending(false)
    }
  }

  const handleOpenMessages = async () => {
    setView('messages')
    setUnreadMessages(0)
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'auto' }), 100)
  }

  const journeyPhase = clientData?.journeyPhase ?? 'discovery'
  const currentPhaseIdx = JOURNEY_PHASES.findIndex(p => p.id === journeyPhase)
  const progressPct = JOURNEY_PHASES.length > 1
    ? Math.round((currentPhaseIdx / (JOURNEY_PHASES.length - 1)) * 100)
    : 0
  const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'unpaid')
  const outstandingTotal = outstanding.reduce((sum, i) => sum + i.amount, 0)

  const navItem = (id: PortalView, icon: string, label: string, badge?: number) => (
    <button
      key={id}
      onClick={() => id === 'messages' ? handleOpenMessages() : setView(id)}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors ${
        view === id
          ? 'bg-white text-black font-semibold shadow-sm'
          : 'text-zinc-500 hover:bg-zinc-200/50'
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge != null && badge > 0 && (
        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {badge}
        </span>
      )}
    </button>
  )

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex">
      {/* Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f3f3f3] flex flex-col p-6 z-50">
        <div className="mb-8">
          <h1 className="text-lg font-bold tracking-tighter text-black">Client Portal</h1>
          <p className="text-xs text-zinc-500 uppercase tracking-wide mt-1">Designs by Terrence Adderley</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItem('dashboard', 'dashboard', 'Dashboard')}
          {navItem('files', 'folder_open', 'Files')}
          {navItem('invoices', 'receipt_long', 'Invoices')}
          {navItem('proposals', 'description', 'Proposals')}
          {navItem('messages', 'chat_bubble', 'Messages', unreadMessages)}
        </nav>
        <div className="mt-auto pt-6 border-t border-zinc-200 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold">
              {clientUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{clientUser?.name}</p>
              <p className="text-[10px] text-zinc-400 truncate">{clientUser?.email}</p>
            </div>
            <button
              onClick={clientLogout}
              className="text-zinc-400 hover:text-black transition-colors"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 min-h-screen">
        {/* Header */}
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 z-40 bg-[#f9f9f9]/80 backdrop-blur-xl border-b border-zinc-200/20 flex justify-between items-center px-8">
          <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest">
            <button
              onClick={() => setView('dashboard')}
              className={
                view === 'dashboard'
                  ? 'text-black border-b-2 border-black pb-1'
                  : 'text-zinc-400 hover:text-black transition-colors'
              }
            >
              Overview
            </button>
            <button className="text-zinc-400 hover:text-black transition-colors">Timeline</button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              {clientData?.organization ?? clientUser?.name}
            </span>
          </div>
        </header>

        <div className="pt-16 p-8 max-w-6xl mx-auto">

          {/* ── DASHBOARD VIEW ── */}
          {view === 'dashboard' && (
            <div className="space-y-10">
              {/* Welcome */}
              <div className="pt-4">
                <h2 className="text-4xl font-extrabold tracking-tighter">
                  Welcome back, {clientUser?.name?.split(' ')[0]}.
                </h2>
                {clientData?.projectScope?.projectName && (
                  <p className="text-zinc-500 mt-2">
                    Your project{' '}
                    <span className="font-bold text-black italic">
                      &ldquo;{clientData.projectScope.projectName}&rdquo;
                    </span>{' '}
                    is {clientData.projectScope.status ?? 'in progress'}.
                  </p>
                )}
              </div>

              {/* Project Journey */}
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Project Journey
                  </span>
                  <span className="text-5xl font-black tracking-tighter">{progressPct}%</span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Phase stepper */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {JOURNEY_PHASES.map((phase, i) => {
                    const isDone = i < currentPhaseIdx
                    const isCurrent = i === currentPhaseIdx
                    return (
                      <div key={phase.id} className="flex flex-col items-center gap-1.5 text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                          isCurrent ? 'bg-black text-white ring-4 ring-black/10'
                          : isDone ? 'bg-zinc-800 text-white'
                          : 'bg-zinc-100 text-zinc-300'
                        }`}>
                          {isDone ? '✓' : i + 1}
                        </div>
                        <span className={`text-[10px] font-semibold leading-tight ${
                          isCurrent ? 'text-black' : isDone ? 'text-zinc-500' : 'text-zinc-300'
                        }`}>
                          {phase.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {clientData?.projectScope?.endDate && (
                  <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Est. Delivery</span>
                    <span className="font-bold text-sm">{clientData.projectScope.endDate}</span>
                  </div>
                )}
              </div>

              {/* Recent Files + Outstanding Invoices */}
              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold tracking-tight">Recent Files</h3>
                    <button
                      onClick={() => setView('files')}
                      className="text-xs font-bold uppercase tracking-widest hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  {files.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-zinc-400 text-sm">
                      No files uploaded yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {files.slice(0, 5).map(f => (
                        <div key={f.id} className="bg-white rounded-xl px-5 py-4 flex items-center gap-4">
                          <span className="material-symbols-outlined text-zinc-400">description</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{f.fileName}</p>
                            <p className="text-xs text-zinc-400">
                              {f.docType} &middot; {Math.round(f.size / 1024)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFileDownload(f)}
                            disabled={downloadingId === f.id}
                            className="text-zinc-400 hover:text-black transition-colors disabled:opacity-50"
                            title="Download"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {downloadingId === f.id ? 'hourglass_empty' : 'download'}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold tracking-tight">Invoices</h3>
                    <button
                      onClick={() => setView('invoices')}
                      className="text-xs font-bold uppercase tracking-widest hover:underline"
                    >
                      All
                    </button>
                  </div>
                  <div className="bg-white rounded-xl p-2 space-y-1">
                    {invoices.length === 0 ? (
                      <p className="text-sm text-zinc-400 p-4 text-center">No invoices yet</p>
                    ) : (
                      invoices.slice(0, 3).map(inv => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-lg transition-colors"
                        >
                          <div>
                            <p className="font-bold text-sm">{inv.invoiceNumber}</p>
                            <p className="text-[10px] text-zinc-400 uppercase font-medium">
                              Due {inv.dueDate}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">${inv.amount.toLocaleString()}</p>
                            <p
                              className={`text-[10px] font-bold uppercase ${
                                inv.status === 'paid' ? 'text-green-600' : 'text-red-500'
                              }`}
                            >
                              {inv.status}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {outstandingTotal > 0 && (
                    <div className="bg-black text-white p-5 rounded-xl">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">
                        Outstanding
                      </p>
                      <p className="text-2xl font-black tracking-tighter">
                        ${outstandingTotal.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── FILES VIEW ── */}
          {view === 'files' && (
            <div className="space-y-8 pt-4">
              <h1 className="text-4xl font-bold tracking-tighter">Files</h1>
              {files.length === 0 ? (
                <div className="bg-white rounded-xl p-16 text-center">
                  <span className="material-symbols-outlined text-5xl text-zinc-300">folder_open</span>
                  <p className="text-zinc-400 mt-4">No files uploaded yet</p>
                  <p className="text-xs text-zinc-300 mt-1">
                    Your project manager will upload files here
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          Name
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          Type
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          Size
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          Date
                        </th>
                        <th className="px-6 py-4" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {files.map(f => (
                        <tr key={f.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-zinc-400">description</span>
                              <span className="font-semibold text-sm">{f.fileName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-zinc-100 text-[10px] font-bold rounded uppercase text-zinc-600">
                              {f.docType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500">
                            {Math.round(f.size / 1024)} KB
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500">
                            {new Date(f.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleFileDownload(f)}
                              disabled={downloadingId === f.id}
                              className="text-zinc-400 hover:text-black transition-colors disabled:opacity-50"
                              title="Download"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {downloadingId === f.id ? 'hourglass_empty' : 'download'}
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── INVOICES VIEW ── */}
          {view === 'invoices' && (
            <div className="space-y-8 pt-4">
              <h1 className="text-4xl font-bold tracking-tighter">Invoices</h1>
              {invoices.length === 0 ? (
                <div className="bg-white rounded-xl p-16 text-center">
                  <span className="material-symbols-outlined text-5xl text-zinc-300">receipt_long</span>
                  <p className="text-zinc-400 mt-4">No invoices yet</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          Invoice
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          Due Date
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-sm">{inv.invoiceNumber}</td>
                          <td className="px-6 py-4 font-bold text-sm">
                            {inv.currency} {inv.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500">{inv.dueDate}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                inv.status === 'paid'
                                  ? 'bg-green-50 text-green-700'
                                  : inv.status === 'draft'
                                  ? 'bg-zinc-100 text-zinc-500'
                                  : 'bg-red-50 text-red-600'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── PROPOSALS VIEW ── */}
          {view === 'proposals' && (
            <div className="space-y-8 pt-4">
              <h1 className="text-4xl font-bold tracking-tighter">Proposals</h1>
              {proposals.length === 0 ? (
                <div className="bg-white rounded-xl p-16 text-center">
                  <span className="material-symbols-outlined text-5xl text-zinc-300">description</span>
                  <p className="text-zinc-400 mt-4">No proposals yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {proposals.map(p => (
                    <div key={p.id} className="bg-white rounded-xl p-6 flex items-center justify-between">
                      <div>
                        <p className="font-bold">{p.title}</p>
                        <p className="text-sm text-zinc-400">
                          {p.proposalNumber} &middot; {p.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold">
                          {p.currency} {p.total.toLocaleString()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'accepted'
                              ? 'bg-green-50 text-green-700'
                              : p.status === 'sent'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MESSAGES VIEW ── */}
          {view === 'messages' && (
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden flex flex-col" style={{ height: '560px' }}>
              {/* Header */}
              <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-black">chat_bubble</span>
                <h2 className="text-sm font-bold text-black">Messages</h2>
                <span className="text-xs text-zinc-400 ml-1">Private conversation with your project manager</span>
              </div>

              {/* Thread */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#f9f9f9]">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-zinc-400">
                    No messages yet. Send one below.
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col gap-0.5 ${!msg.fromAdmin ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] font-medium text-zinc-400 px-1">
                        {msg.fromAdmin ? 'Terrence Adderley' : 'You'}
                      </span>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        !msg.fromAdmin
                          ? 'bg-black text-white rounded-br-sm'
                          : 'bg-white border border-zinc-200 text-black rounded-bl-sm'
                      }`}>
                        <p>{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${!msg.fromAdmin ? 'text-white/50' : 'text-zinc-400'}`}>
                          {new Date(msg.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-zinc-100 bg-white flex gap-2">
                <input
                  type="text"
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                  placeholder="Type a message…"
                  className="flex-1 bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={msgSending || !msgInput.trim()}
                  className="px-3 py-2 bg-black text-white rounded-lg hover:bg-zinc-800 disabled:opacity-40 transition-colors flex items-center"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

// ── Main Export ──────────────────────────────────────────────────
export default function ClientPortal() {
  const { isClientAuthenticated } = useClientAuth()
  return isClientAuthenticated ? <ClientDashboard /> : <ClientLoginForm />
}

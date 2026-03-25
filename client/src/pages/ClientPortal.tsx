import { useState, useEffect } from 'react'
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
interface ClientData {
  id: number
  firstName: string
  lastName: string
  email: string
  organization?: string
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

// ── Dashboard ────────────────────────────────────────────────────
type PortalView = 'dashboard' | 'files' | 'invoices' | 'proposals'

function ClientDashboard() {
  const { clientUser, clientLogout } = useClientAuth()
  const [view, setView] = useState<PortalView>('dashboard')
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [files, setFiles] = useState<PortalFile[]>([])

  useEffect(() => {
    if (!clientUser) return
    const portalApi = createPortalApi(clientUser.accessToken)
    Promise.all([
      portalApi.get('/portal/me'),
      portalApi.get('/portal/invoices'),
      portalApi.get('/portal/proposals'),
      portalApi.get('/portal/files'),
    ]).then(([me, inv, prop, fil]) => {
      setClientData(me.data)
      setInvoices(inv.data)
      setProposals(prop.data)
      setFiles(fil.data)
    }).catch(() => {})
  }, [clientUser])

  const totalTasks = clientData?.tasks?.length ?? 0
  const doneTasks = clientData?.tasks?.filter(t => t.column === 'done').length ?? 0
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'unpaid')
  const outstandingTotal = outstanding.reduce((sum, i) => sum + i.amount, 0)

  const navItem = (id: PortalView, icon: string, label: string) => (
    <button
      key={id}
      onClick={() => setView(id)}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors ${
        view === id
          ? 'bg-white text-black font-semibold shadow-sm'
          : 'text-zinc-500 hover:bg-zinc-200/50'
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span>{label}</span>
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

              {/* Progress */}
              <div className="grid grid-cols-12 gap-6 items-end">
                <div className="col-span-8 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                      Project Completion
                    </span>
                    <span className="text-5xl font-black tracking-tighter">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400">
                    {doneTasks} of {totalTasks} tasks completed
                  </p>
                </div>
                {clientData?.projectScope?.endDate && (
                  <div className="col-span-4 bg-white p-5 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      Est. Delivery
                    </p>
                    <p className="font-bold">{clientData.projectScope.endDate}</p>
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
                          <span className="text-xs text-zinc-400">
                            {new Date(f.createdAt).toLocaleDateString()}
                          </span>
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

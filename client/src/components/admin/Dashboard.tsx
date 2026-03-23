import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Users, Inbox, FileText, Settings as SettingsIcon, BarChart2, TrendingUp, Receipt } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getSubmissions, getClients, createClient, Submission, Client, Proposal } from '../../lib/api'
import SubmissionsTable from './SubmissionsTable'
import ClientsList from './ClientsList'
import ClientProfile from './ClientProfile'
import ProposalsList from './ProposalsList'
import ProposalBuilder from './ProposalBuilder'
import Settings from './Settings'
import Financials from './Financials'
import Analytics from './Analytics'
import InvoicesView from './InvoicesView'
import ExportContacts from './ExportContacts'

interface Props {
  onLogout: () => void
}

type View = 'submissions' | 'clients' | 'proposals' | 'invoices' | 'settings' | 'financials' | 'analytics'

export default function Dashboard({ onLogout }: Props) {
  const { username, logout } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<View>('submissions')
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [editingProposal, setEditingProposal] = useState<Proposal | 'new' | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subs, cls] = await Promise.all([getSubmissions(), getClients()])
        setSubmissions(subs)
        setClients(cls)
      } catch {
        setError('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const clientSubmissionIds = new Set(clients.map(c => c.submissionId).filter(Boolean) as number[])

  const handleQuickAdd = async (submission: Submission) => {
    const client = await createClient({
      firstName: submission.firstName,
      lastName: submission.lastName,
      email: submission.email,
      phone: submission.phone,
      submissionId: submission.id,
    })
    setClients(prev => [client, ...prev])
  }

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const navItem = (id: View, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => { setView(id); setSelectedClientId(null); setEditingProposal(null) }}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors ${
        view === id
          ? 'bg-accent/10 text-accent border border-accent/15'
          : 'text-text-muted hover:text-text-primary hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-[#08090D] flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-white/[0.08] flex flex-col py-6 px-3 flex-shrink-0">
        {/* Logo */}
        <div className="px-3 mb-8">
          <img src="/logo.png" alt="Designs By TA" className="h-7 w-auto mb-1" />
          <p className="text-xs text-text-muted mt-0.5">Admin Dashboard</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {navItem('submissions', 'Submissions', <Inbox className="w-4 h-4" />)}
          {navItem('clients', 'Current Clients', <Users className="w-4 h-4" />)}
          {navItem('proposals', 'Proposals', <FileText className="w-4 h-4" />)}
          {navItem('invoices', 'Invoices', <Receipt className="w-4 h-4" />)}
          {navItem('financials', 'Financials', <BarChart2 className="w-4 h-4" />)}
          {navItem('analytics', 'Analytics', <TrendingUp className="w-4 h-4" />)}
          {navItem('settings', 'Settings', <SettingsIcon className="w-4 h-4" />)}
        </nav>

        {/* User + logout */}
        <div className="border-t border-white/[0.08] pt-4 px-3 space-y-2">
          <p className="text-xs text-text-muted">
            Signed in as <span className="text-text-primary">{username}</span>
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* ── SUBMISSIONS VIEW ── */}
          {view === 'submissions' && (
            <motion.div
              key="submissions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Inbox className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-semibold text-text-primary">Submissions</h2>
                </div>
                <ExportContacts submissions={submissions} clients={clients} />
              </div>
              {isLoading ? (
                <div className="text-center py-12 text-text-muted">Loading submissions...</div>
              ) : error ? (
                <div className="text-center py-12 text-red-400">{error}</div>
              ) : (
                <SubmissionsTable
              submissions={submissions}
              onQuickAdd={handleQuickAdd}
              clientSubmissionIds={clientSubmissionIds}
            />
              )}
            </motion.div>
          )}

          {/* ── CLIENTS LIST VIEW ── */}
          {view === 'clients' && selectedClientId === null && (
            <motion.div
              key="clients-list"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-4 flex justify-end">
                <ExportContacts submissions={submissions} clients={clients} />
              </div>
              <ClientsList
                submissions={submissions}
                onSelectClient={(id) => setSelectedClientId(id)}
              />
            </motion.div>
          )}

          {/* ── CLIENT PROFILE VIEW ── */}
          {view === 'clients' && selectedClientId !== null && (
            <ClientProfile
              key={selectedClientId}
              clientId={selectedClientId}
              onBack={() => setSelectedClientId(null)}
              onDelete={() => setSelectedClientId(null)}
            />
          )}

          {/* ── PROPOSALS LIST VIEW ── */}
          {view === 'proposals' && editingProposal === null && (
            <motion.div
              key="proposals-list"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ProposalsList
                onNew={() => setEditingProposal('new')}
                onEdit={(p) => setEditingProposal(p)}
              />
            </motion.div>
          )}

          {/* ── PROPOSAL BUILDER VIEW ── */}
          {view === 'proposals' && editingProposal !== null && (
            <ProposalBuilder
              key={editingProposal === 'new' ? 'new' : editingProposal.id}
              initial={editingProposal === 'new' ? undefined : editingProposal}
              onBack={() => setEditingProposal(null)}
              onSaved={(_p) => setEditingProposal(null)}
            />
          )}

          {/* ── INVOICES VIEW ── */}
          {view === 'invoices' && (
            <motion.div key="invoices" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <InvoicesView />
            </motion.div>
          )}

          {/* ── FINANCIALS VIEW ── */}
          {view === 'financials' && (
            <motion.div key="financials" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Financials />
            </motion.div>
          )}

          {/* ── ANALYTICS VIEW ── */}
          {view === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Analytics />
            </motion.div>
          )}

          {/* ── SETTINGS VIEW ── */}
          {view === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Settings />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { getSubmissions, getClients, createClient, createDeal, deleteSubmission, getSubmissionsTrash, restoreSubmission, permanentDeleteSubmission, Submission, Client, Proposal } from '../../lib/api'
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
import DashboardOverview from './DashboardOverview'
import DealsView from './DealsView'
import FilesView from './FilesView'
import AutomationsView from './AutomationsView'
import ProjectsView from './ProjectsView'
import EmailTemplatesView from './EmailTemplatesView'
import ComposeEmailView from './ComposeEmailView'
import NotificationsPanel from './NotificationsPanel'
import MessagesView from './MessagesView'
import CalendarView from './CalendarView'
import ReminderToast from './ReminderToast'
import { useCalendarReminders } from '../../hooks/useCalendarReminders'

interface Props {
  onLogout: () => void
}

type View =
  | 'dashboard'
  | 'submissions'
  | 'clients'
  | 'proposals'
  | 'invoices'
  | 'financials'
  | 'analytics'
  | 'settings'
  | 'deals'
  | 'projects'
  | 'files'
  | 'automations'
  | 'email-templates'
  | 'compose'
  | 'messages'
  | 'calendar'

interface NavItem {
  id: View
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',    label: 'Dashboard',    icon: 'dashboard' },
  { id: 'submissions',  label: 'Submissions',  icon: 'send' },
  { id: 'clients',      label: 'Clients',      icon: 'group' },
  { id: 'deals',        label: 'Deals',        icon: 'handshake' },
  { id: 'projects',     label: 'Projects',     icon: 'account_tree' },
  { id: 'proposals',    label: 'Proposals',    icon: 'description' },
  { id: 'invoices',     label: 'Invoices',     icon: 'receipt_long' },
  { id: 'financials',   label: 'Financials',   icon: 'payments' },
  { id: 'files',        label: 'Files',        icon: 'folder' },
  { id: 'analytics',    label: 'Analytics',    icon: 'insights' },
  { id: 'automations',      label: 'Automations',      icon: 'auto_awesome' },
  { id: 'email-templates',  label: 'Templates',        icon: 'description' },
  { id: 'messages',         label: 'Messages',         icon: 'chat_bubble' },
  { id: 'compose',          label: 'Compose',          icon: 'send' },
  { id: 'calendar',         label: 'Calendar',         icon: 'calendar_month' },
  { id: 'settings',         label: 'Settings',         icon: 'settings' },
]

// ── Badge helpers ─────────────────────────────────────────────────────────────

const BADGE_KEY = (view: View) => `ota_seen_${view}`

function getSeenCount(view: View): number {
  return parseInt(localStorage.getItem(BADGE_KEY(view)) ?? '0', 10)
}

function markSeen(view: View, count: number) {
  localStorage.setItem(BADGE_KEY(view), String(count))
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard({ onLogout }: Props) {
  const { username, logout } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [trashedSubmissions, setTrashedSubmissions] = useState<Submission[]>([])
  const [trashLoading, setTrashLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<View>('dashboard')
  const [submissionsTab, setSubmissionsTab] = useState<'inbox' | 'trash'>('inbox')
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [editingProposal, setEditingProposal] = useState<Proposal | 'new' | null>(null)
  const [badges, setBadges] = useState<Partial<Record<View, number>>>({})
  const { toasts: reminderToasts, dismiss: dismissReminder } = useCalendarReminders()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subs, cls] = await Promise.all([getSubmissions(), getClients()])
        setSubmissions(subs)
        setClients(cls)
        // Compute badges after data loads
        const subBadge = Math.max(0, subs.length - getSeenCount('submissions'))
        setBadges({ submissions: subBadge })
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
    // Remove submission from list after converting
    await deleteSubmission(submission.id).catch(() => {})
    setSubmissions(prev => prev.filter(s => s.id !== submission.id))
  }

  const handleSendToCrm = async (submission: Submission) => {
    const services = Array.isArray(submission.services)
      ? submission.services.join(', ')
      : String(submission.services || '')
    await createDeal({
      title: `${submission.firstName} ${submission.lastName}${services ? ` — ${services}` : ''}`,
      contactName: `${submission.firstName} ${submission.lastName}`,
      contactEmail: submission.email,
      contactPhone: submission.phone,
      company: submission.clientType,
      value: 0,
      stage: 'lead',
      notes: submission.description,
    })
    // Remove submission from list after sending to CRM
    await deleteSubmission(submission.id).catch(() => {})
    setSubmissions(prev => prev.filter(s => s.id !== submission.id))
  }

  const loadTrash = async () => {
    setTrashLoading(true)
    try {
      const trashed = await getSubmissionsTrash()
      setTrashedSubmissions(trashed)
    } finally {
      setTrashLoading(false)
    }
  }

  const handleDeleteSubmission = async (submission: Submission) => {
    await deleteSubmission(submission.id)
    setSubmissions(prev => prev.filter(s => s.id !== submission.id))
  }

  const handleRestoreSubmission = async (id: number) => {
    await restoreSubmission(id)
    const restored = trashedSubmissions.find(s => s.id === id)
    if (restored) {
      setTrashedSubmissions(prev => prev.filter(s => s.id !== id))
      setSubmissions(prev => [{ ...restored, deletedAt: null }, ...prev])
    }
  }

  const handlePermanentDelete = async (id: number) => {
    await permanentDeleteSubmission(id)
    setTrashedSubmissions(prev => prev.filter(s => s.id !== id))
  }

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const handleNavClick = (id: View) => {
    setView(id)
    setSelectedClientId(null)
    setEditingProposal(null)
    setSubmissionsTab('inbox')
    // Clear badge for this view when navigating to it
    if (id === 'submissions') {
      markSeen('submissions', submissions.length)
      setBadges(prev => ({ ...prev, submissions: 0 }))
    }
  }

  const handleSubmissionsTabChange = (tab: 'inbox' | 'trash') => {
    setSubmissionsTab(tab)
    if (tab === 'trash') loadTrash()
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] font-['Inter',sans-serif]">
      {/* Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f3f3f3] flex flex-col p-6 z-50">
        <div className="mb-8">
          <h1 className="text-lg font-bold tracking-tighter text-black leading-tight">
            Designs by Terrence Adderley
          </h1>
          <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase mt-1">Agency OS</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = view === item.id
            const badge = badges[item.id] ?? 0
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm transition-colors text-left ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-zinc-500 hover:bg-zinc-200/50 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom: new button + user */}
        <div className="mt-auto pt-6 border-t border-zinc-200">
          <button className="w-full bg-black text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 mb-4 hover:bg-zinc-800 transition-colors text-sm">
            <span>+</span>
            <span>New</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
              TA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-black truncate">Terrence Adderley</p>
              <p className="text-[10px] text-zinc-500">{username ?? 'Admin'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-zinc-400 hover:text-black transition-colors"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Top header */}
      <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 z-40 bg-[#f9f9f9]/80 border-b border-zinc-200/60 flex justify-between items-center px-8">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px]">search</span>
          <input
            className="bg-[#e8e8e8] border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 w-72"
            placeholder="Search..."
          />
        </div>
        <div className="flex items-center gap-4">
          <NotificationsPanel onUnreadCountChange={() => {}} />
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-zinc-500 hover:text-black flex items-center gap-2 transition-colors"
          >
            <span>View Site</span>
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </a>
        </div>
      </header>

      {/* Reminder toasts — fixed overlay, bottom-right */}
      <ReminderToast toasts={reminderToasts} onDismiss={dismissReminder} />

      {/* Main content */}
      <main className="ml-64 pt-16 min-h-screen bg-[#f9f9f9]">
        <div className="p-8 max-w-7xl mx-auto">

          {/* ── DASHBOARD OVERVIEW ── */}
          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <DashboardOverview onNavigateToCalendar={() => handleNavClick('calendar')} />
            </motion.div>
          )}

          {/* ── SUBMISSIONS VIEW ── */}
          {view === 'submissions' && (
            <motion.div key="submissions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <nav className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    <span>Agency OS</span>
                    <span>/</span>
                    <span className="text-black">Submissions</span>
                  </nav>
                  <h1 className="text-4xl font-bold tracking-tighter">Submissions</h1>
                </div>
                {submissionsTab === 'inbox' && <ExportContacts submissions={submissions} clients={clients} />}
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 mb-6 bg-[#e8e8e8] rounded-lg p-1 w-fit">
                <button
                  type="button"
                  onClick={() => handleSubmissionsTabChange('inbox')}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                    submissionsTab === 'inbox' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-black'
                  }`}
                >
                  Inbox
                  {submissions.length > 0 && (
                    <span className="ml-2 text-[10px] bg-black text-white rounded-full px-1.5 py-0.5">{submissions.length}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmissionsTabChange('trash')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                    submissionsTab === 'trash' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-black'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  Trash
                </button>
              </div>

              {/* Inbox */}
              {submissionsTab === 'inbox' && (
                isLoading ? (
                  <div className="text-center py-12 text-zinc-400">Loading submissions...</div>
                ) : error ? (
                  <div className="text-center py-12 text-red-500">{error}</div>
                ) : (
                  <SubmissionsTable
                    submissions={submissions}
                    onQuickAdd={handleQuickAdd}
                    onSendToCrm={handleSendToCrm}
                    onDelete={handleDeleteSubmission}
                    clientSubmissionIds={clientSubmissionIds}
                  />
                )
              )}

              {/* Trash */}
              {submissionsTab === 'trash' && (
                trashLoading ? (
                  <div className="text-center py-12 text-zinc-400">Loading trash...</div>
                ) : trashedSubmissions.length === 0 ? (
                  <div className="text-center py-16 text-zinc-400">
                    <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">delete</span>
                    <p className="text-sm font-medium">Trash is empty</p>
                    <p className="text-xs mt-1 opacity-70">Deleted submissions are kept for 7 days</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl ring-1 ring-black/[0.05] overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-zinc-400">info</span>
                      <p className="text-xs text-zinc-500">Items are permanently deleted after 7 days</p>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-100">
                          <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Name</th>
                          <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Email</th>
                          <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Date</th>
                          <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Expires</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {trashedSubmissions.map(s => {
                          const deletedAt = s.deletedAt ? new Date(s.deletedAt) : new Date()
                          const expiresAt = new Date(deletedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
                          const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
                          return (
                            <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-semibold text-black">{s.firstName} {s.lastName}</td>
                              <td className="px-4 py-3 text-sm text-zinc-500">{s.email}</td>
                              <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                                {new Date(s.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  daysLeft <= 1 ? 'bg-red-50 text-red-600' : daysLeft <= 3 ? 'bg-amber-50 text-amber-600' : 'bg-zinc-100 text-zinc-500'
                                }`}>
                                  {daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleRestoreSubmission(s.id)}
                                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-black text-white hover:bg-zinc-800 transition-colors font-semibold"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">restore</span>
                                    Restore
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePermanentDelete(s.id)}
                                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-semibold"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">delete_forever</span>
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </motion.div>
          )}

          {/* ── CLIENTS LIST VIEW ── */}
          {view === 'clients' && selectedClientId === null && (
            <motion.div key="clients-list" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
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

          {/* ── DEALS VIEW ── */}
          {view === 'deals' && (
            <motion.div key="deals" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <DealsView />
            </motion.div>
          )}

          {/* ── PROJECTS VIEW ── */}
          {view === 'projects' && (
            <motion.div key="projects" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <ProjectsView />
            </motion.div>
          )}

          {/* ── PROPOSALS LIST VIEW ── */}
          {view === 'proposals' && editingProposal === null && (
            <motion.div key="proposals-list" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
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

          {/* ── FILES VIEW ── */}
          {view === 'files' && (
            <motion.div key="files" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <FilesView />
            </motion.div>
          )}

          {/* ── ANALYTICS VIEW ── */}
          {view === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Analytics />
            </motion.div>
          )}

          {/* ── AUTOMATIONS VIEW ── */}
          {view === 'automations' && (
            <motion.div key="automations" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <AutomationsView />
            </motion.div>
          )}

          {/* ── EMAIL TEMPLATES VIEW ── */}
          {view === 'email-templates' && (
            <motion.div key="email-templates" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <EmailTemplatesView />
            </motion.div>
          )}

          {/* ── COMPOSE VIEW ── */}
          {view === 'compose' && (
            <motion.div key="compose" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <ComposeEmailView />
            </motion.div>
          )}

          {/* ── MESSAGES VIEW ── */}
          {view === 'messages' && (
            <motion.div key="messages" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <MessagesView />
            </motion.div>
          )}

          {/* ── CALENDAR VIEW ── */}
          {view === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <CalendarView />
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

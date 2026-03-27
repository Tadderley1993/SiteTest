import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<View>('dashboard')
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
  }

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const handleNavClick = (id: View) => {
    setView(id)
    setSelectedClientId(null)
    setEditingProposal(null)
    // Clear badge for this view when navigating to it
    if (id === 'submissions') {
      markSeen('submissions', submissions.length)
      setBadges(prev => ({ ...prev, submissions: 0 }))
    }
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
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <nav className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    <span>Agency OS</span>
                    <span>/</span>
                    <span className="text-black">Submissions</span>
                  </nav>
                  <h1 className="text-4xl font-bold tracking-tighter">Submissions</h1>
                </div>
                <ExportContacts submissions={submissions} clients={clients} />
              </div>
              {isLoading ? (
                <div className="text-center py-12 text-zinc-400">Loading submissions...</div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">{error}</div>
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

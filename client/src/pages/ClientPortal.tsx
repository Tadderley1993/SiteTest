import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useClientAuth } from '../context/ClientAuthContext'
import { createPortalApi } from '../lib/portalApi'
import { SLIDES, slideVariants } from '../data/brandGuideSlides'
import { PRICING_TIERS, ALA_CARTE, type PricingTier, type PackageLineItem } from '../data/pricingTiers'

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
  submissionServices?: string[]
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

// ── Discovery Questionnaire Config ───────────────────────────────
const ALL_SERVICES = [
  { id: 'website',   label: 'Website Development' },
  { id: 'mobile',    label: 'Mobile Development' },
  { id: 'brand',     label: 'Brand Identity' },
  { id: 'revamp',    label: 'Identity Revamp' },
  { id: 'marketing', label: 'Marketing Material' },
  { id: 'seo',       label: 'SEO Optimization' },
]

interface QSection {
  key: string
  title: string
  questions: { id: string; label: string; placeholder: string; type?: 'text' | 'textarea' | 'services' }[]
}

const Q_SECTIONS: QSection[] = [
  {
    key: 'section1', title: 'About Your Business',
    questions: [
      { id: 'businessName', label: 'What is the name of your business?', placeholder: 'e.g. Acme Co.', type: 'text' },
      { id: 'industry', label: 'What industry or niche are you in?', placeholder: 'e.g. Real estate, fitness, e-commerce…', type: 'text' },
      { id: 'description', label: 'How would you describe your business in 2–3 sentences?', placeholder: 'We help…', type: 'textarea' },
      { id: 'uniqueValue', label: 'What sets you apart from competitors?', placeholder: 'Our unique value is…', type: 'textarea' },
    ],
  },
  {
    key: 'section2', title: 'Goals & Objectives',
    questions: [
      { id: 'primaryGoal', label: 'What is the primary goal of this website?', placeholder: 'e.g. Generate leads, sell products, book appointments…', type: 'textarea' },
      { id: 'successLook', label: 'What does success look like 6 months after launch?', placeholder: 'More clients, higher conversion rate…', type: 'textarea' },
      { id: 'currentPain', label: 'What problems does your current site (or lack of one) cause?', placeholder: 'Visitors leave without contacting us…', type: 'textarea' },
    ],
  },
  {
    key: 'section3', title: 'Your Audience',
    questions: [
      { id: 'targetAudience', label: 'Who is your ideal customer or client?', placeholder: 'Age, location, profession, income level…', type: 'textarea' },
      { id: 'audienceNeeds', label: 'What are their main pain points or desires?', placeholder: 'They struggle with…', type: 'textarea' },
      { id: 'howTheyFind', label: 'How do they currently find you?', placeholder: 'Word of mouth, Instagram, Google…', type: 'text' },
    ],
  },
  {
    key: 'section4', title: 'Brand Identity & Visual Style',
    questions: [
      { id: 'brandPersonality', label: 'How would you describe your brand personality?', placeholder: 'e.g. Bold and modern, warm and approachable, luxurious…', type: 'text' },
      { id: 'colors', label: 'Do you have brand colors? If so, list them.', placeholder: 'Primary: #C6A84B, Secondary: …', type: 'text' },
      { id: 'fonts', label: 'Do you have preferred fonts or typography styles?', placeholder: 'e.g. Clean sans-serif, elegant serif…', type: 'text' },
      { id: 'existingAssets', label: 'Do you have an existing logo, brand guide, or assets?', placeholder: 'Yes, I have a logo / No, starting fresh…', type: 'textarea' },
    ],
  },
  {
    key: 'section5', title: 'Website Vision',
    questions: [
      { id: 'mustHavePages', label: 'What pages must the site have?', placeholder: 'Home, About, Services, Contact…', type: 'textarea' },
      { id: 'keyFeatures', label: 'Are there specific features you need?', placeholder: 'Booking system, e-commerce, gallery, blog, contact form…', type: 'textarea' },
      { id: 'callToAction', label: 'What action do you want visitors to take most?', placeholder: 'Book a call, buy now, fill out a form…', type: 'text' },
    ],
  },
  {
    key: 'section6', title: 'Design Inspiration',
    questions: [
      { id: 'likedSites', label: 'List 2–3 websites you love and what you like about them.', placeholder: 'apple.com — clean layout; …', type: 'textarea' },
      { id: 'dislikedSites', label: 'List any websites you dislike and why.', placeholder: 'Too cluttered, outdated feel…', type: 'textarea' },
      { id: 'styleKeywords', label: 'Pick words that describe your ideal design style.', placeholder: 'Minimal, bold, dark, elegant, playful, corporate…', type: 'text' },
    ],
  },
  {
    key: 'section7', title: 'Mobile & User Experience',
    questions: [
      { id: 'mobileImportance', label: 'How important is mobile experience for your audience?', placeholder: 'Very important — most of my clients use phones…', type: 'textarea' },
      { id: 'userJourney', label: 'Describe the ideal journey a visitor takes on your site.', placeholder: 'They land on the home page → read about services → book a call…', type: 'textarea' },
    ],
  },
  {
    key: 'section8', title: 'Content & Messaging',
    questions: [
      { id: 'copyReady', label: 'Do you have copy (text) ready, or do you need help writing it?', placeholder: 'I have drafts / I need copywriting help…', type: 'text' },
      { id: 'imagesReady', label: 'Do you have professional photos or images?', placeholder: "Yes / No, we'll need stock photos\u2026", type: 'text' },
      { id: 'headline', label: "What's the main message you want visitors to immediately understand?", placeholder: 'We build websites that convert\u2026', type: 'textarea' },
    ],
  },
  {
    key: 'section9', title: 'SEO & Growth',
    questions: [
      { id: 'seoImportance', label: 'How important is SEO (search engine visibility) to you?', placeholder: 'Very important, we want to rank on Google…', type: 'text' },
      { id: 'targetKeywords', label: 'What keywords or phrases should your site rank for?', placeholder: 'web design Boston, freelance developer…', type: 'textarea' },
      { id: 'socialMedia', label: 'Which social media platforms do you actively use?', placeholder: 'Instagram, LinkedIn, TikTok…', type: 'text' },
    ],
  },
  {
    key: 'section10', title: 'Technical Details',
    questions: [
      { id: 'existingDomain', label: 'Do you have an existing domain? If so, what is it?', placeholder: 'Yes, mybusiness.com / No, I need one…', type: 'text' },
      { id: 'hosting', label: 'Do you have a hosting preference?', placeholder: 'Vercel, Netlify, Bluehost, no preference…', type: 'text' },
      { id: 'integrations', label: 'Do you need any third-party integrations?', placeholder: 'Stripe, Calendly, Mailchimp, CRM…', type: 'textarea' },
    ],
  },
  {
    key: 'section11', title: 'Timeline & Budget',
    questions: [
      { id: 'launchDate', label: 'Do you have a target launch date?', placeholder: 'e.g. Within 6 weeks, by June 2025…', type: 'text' },
      { id: 'hardDeadline', label: 'Is this deadline flexible or fixed?', placeholder: 'Flexible / Fixed — launching for an event…', type: 'text' },
      { id: 'budget', label: 'What is your approximate budget range?', placeholder: 'e.g. $2,000–$5,000…', type: 'text' },
    ],
  },
  {
    key: 'section12', title: 'Collaboration & Expectations',
    questions: [
      { id: 'involvement', label: 'How involved do you want to be in the design process?', placeholder: 'Very hands-on / I trust your judgment…', type: 'text' },
      { id: 'revisions', label: 'How many rounds of revisions do you expect?', placeholder: '2–3 rounds is fine…', type: 'text' },
      { id: 'communicationPref', label: 'What is your preferred communication method?', placeholder: 'Email, Slack, video calls…', type: 'text' },
    ],
  },
  {
    key: 'section13', title: 'Final Vision',
    questions: [
      { id: 'dreamOutcome', label: 'If this project is a 10/10 success, what does that look like?', placeholder: 'Our site becomes our #1 source of new clients…', type: 'textarea' },
      { id: 'anythingElse', label: "Is there anything else you'd like us to know?", placeholder: "Any context, concerns, or must-haves we haven't covered\u2026", type: 'textarea' },
      { id: 'additionalServices', label: 'Are there any other services that interest you?', placeholder: '', type: 'services' },
    ],
  },
]

interface QuestionnaireData {
  id?: number
  status?: string
  submittedAt?: string | null
  section1?: string | null
  section2?: string | null
  section3?: string | null
  section4?: string | null
  section5?: string | null
  section6?: string | null
  section7?: string | null
  section8?: string | null
  section9?: string | null
  section10?: string | null
  section11?: string | null
  section12?: string | null
  section13?: string | null
}

// ── Dashboard ────────────────────────────────────────────────────
type PortalView = 'dashboard' | 'files' | 'invoices' | 'proposals' | 'messages' | 'questionnaire'

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

  // Questionnaire state
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null)
  const [qStep, setQStep] = useState(0)
  const [qAnswers, setQAnswers] = useState<Record<string, Record<string, string>>>({})
  const [qSaving, setQSaving] = useState(false)
  const [qSaved, setQSaved] = useState(false)
  const [qSubmitting, setQSubmitting] = useState(false)
  const [, setQLoaded] = useState(false)

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
      portalApi.get('/portal/questionnaire'),
    ]).then(([me, inv, prop, fil, msgs, q]) => {
      setClientData(me.data)
      setInvoices(inv.data)
      setProposals(prop.data)
      setFiles(fil.data)
      setMessages(msgs.data)
      setUnreadMessages((msgs.data as PortalMessage[]).filter(m => m.fromAdmin && !m.read).length)
      if (q.data) {
        setQuestionnaire(q.data)
        // Hydrate answers from saved sections
        const hydrated: Record<string, Record<string, string>> = {}
        Q_SECTIONS.forEach(sec => {
          const raw = (q.data as QuestionnaireData)[sec.key as keyof QuestionnaireData] as string | null
          if (raw) {
            try { hydrated[sec.key] = JSON.parse(raw) } catch { /* ignore */ }
          }
        })
        setQAnswers(hydrated)
      }
      setQLoaded(true)
    }).catch(() => { setQLoaded(true) })
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

  const handleSaveDraft = async () => {
    if (!clientUser || qSaving) return
    setQSaving(true)
    setQSaved(false)
    try {
      const portalApi = createPortalApi(clientUser.accessToken)
      const payload: Record<string, string> = {}
      Q_SECTIONS.forEach(sec => {
        payload[sec.key] = JSON.stringify(qAnswers[sec.key] ?? {})
      })
      const res = await portalApi.put('/portal/questionnaire', payload)
      setQuestionnaire(res.data)
      setQSaved(true)
      setTimeout(() => setQSaved(false), 2500)
    } catch { /* silent */ } finally {
      setQSaving(false)
    }
  }

  const handleSubmitQuestionnaire = async () => {
    if (!clientUser || qSubmitting) return
    setQSubmitting(true)
    try {
      const portalApi = createPortalApi(clientUser.accessToken)
      const payload: Record<string, string | boolean> = { submit: true }
      Q_SECTIONS.forEach(sec => {
        payload[sec.key] = JSON.stringify(qAnswers[sec.key] ?? {})
      })
      const res = await portalApi.put('/portal/questionnaire', payload)
      setQuestionnaire(res.data)
    } catch { /* silent */ } finally {
      setQSubmitting(false)
    }
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
          {navItem('questionnaire', 'assignment', 'Questionnaire')}
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

              {/* Brand Guide CTA */}
              <a
                href="/guide"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-black text-white px-6 py-4 rounded-xl hover:bg-zinc-900 transition-colors group"
              >
                <span className="text-2xl">📘</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">New to branding & web design?</p>
                  <p className="text-white/60 text-xs mt-0.5">Read my personal guide — understand what we're building together.</p>
                </div>
                <span className="text-white/40 group-hover:text-white/70 transition-colors text-lg">→</span>
              </a>

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

          {/* ── QUESTIONNAIRE VIEW ── */}
          {view === 'questionnaire' && (
            <div className="space-y-8 pt-4 max-w-3xl">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-4xl font-bold tracking-tighter">Discovery Questionnaire</h1>
                  <p className="text-zinc-500 mt-2 text-sm">
                    Help us understand your business so we can build the perfect site.
                  </p>
                </div>
                {questionnaire?.status === 'submitted' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-bold uppercase tracking-widest border border-green-100">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Submitted
                  </span>
                )}
              </div>

              {questionnaire?.status === 'submitted' ? (
                /* Read-only submitted view */
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-100 rounded-xl px-5 py-4 text-sm text-green-800">
                    Your questionnaire was submitted{questionnaire.submittedAt
                      ? ` on ${new Date(questionnaire.submittedAt).toLocaleDateString()}`
                      : ''}. We'll be in touch soon.
                  </div>
                  {Q_SECTIONS.map(sec => {
                    const saved = (questionnaire as QuestionnaireData)[sec.key as keyof QuestionnaireData] as string | null
                    const answers: Record<string, string> = saved ? (() => { try { return JSON.parse(saved) } catch { return {} } })() : {}
                    const hasAnswers = sec.questions.some(q => answers[q.id]?.trim())
                    if (!hasAnswers) return null
                    return (
                      <div key={sec.key} className="bg-white rounded-xl p-6 space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">{sec.title}</h3>
                        {sec.questions.map(q => {
                          if (q.type === 'services') {
                            const submissionSvcs = clientData?.submissionServices ?? []
                            const extraIds = answers[q.id] ? answers[q.id].split(',').filter(Boolean) : []
                            const unique = [...new Set([...submissionSvcs, ...extraIds])]
                            if (!unique.length) return null
                            return (
                              <div key={q.id}>
                                <p className="text-xs text-zinc-500 mb-2">{q.label}</p>
                                <div className="flex flex-wrap gap-2">
                                  {unique.map(id => {
                                    const svc = ALL_SERVICES.find(s => s.id === id)
                                    const isOwned = submissionSvcs.includes(id)
                                    return (
                                      <span key={id} className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                        isOwned ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-700'
                                      }`}>
                                        {svc?.label ?? id}{isOwned && <span className="ml-1 opacity-60">· In package</span>}
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          }
                          if (!answers[q.id]) return null
                          return (
                            <div key={q.id}>
                              <p className="text-xs text-zinc-500 mb-1">{q.label}</p>
                              <p className="text-sm text-black whitespace-pre-wrap">{answers[q.id]}</p>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Multi-step form */
                <div>
                  {/* Step progress */}
                  <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
                    {Q_SECTIONS.map((sec, i) => {
                      const hasData = Object.values(qAnswers[sec.key] ?? {}).some(v => v?.trim())
                      return (
                        <button
                          key={sec.key}
                          type="button"
                          onClick={() => setQStep(i)}
                          className={`flex-shrink-0 h-2 rounded-full transition-all ${
                            i === qStep ? 'w-8 bg-black' : hasData ? 'w-4 bg-zinc-400' : 'w-4 bg-zinc-200'
                          }`}
                          title={sec.title}
                        />
                      )
                    })}
                    <span className="ml-3 text-xs text-zinc-400 flex-shrink-0">
                      {qStep + 1} / {Q_SECTIONS.length}
                    </span>
                  </div>

                  {/* Current section */}
                  {(() => {
                    const sec = Q_SECTIONS[qStep]
                    return (
                      <div className="bg-white rounded-xl p-8 space-y-6">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
                            Section {qStep + 1} of {Q_SECTIONS.length}
                          </p>
                          <h2 className="text-2xl font-bold tracking-tight">{sec.title}</h2>
                        </div>
                        {sec.questions.map(q => (
                          <div key={q.id}>
                            <label className="block text-sm font-medium text-black mb-2">{q.label}</label>
                            {q.type === 'services' ? (() => {
                              const submissionSvcs = clientData?.submissionServices ?? []
                              const selectedRaw = qAnswers[sec.key]?.[q.id] ?? ''
                              const selected = selectedRaw ? selectedRaw.split(',').filter(Boolean) : []
                              const toggleService = (id: string) => {
                                if (submissionSvcs.includes(id)) return // can't toggle locked ones
                                const next = selected.includes(id)
                                  ? selected.filter(s => s !== id)
                                  : [...selected, id]
                                setQAnswers(prev => ({
                                  ...prev,
                                  [sec.key]: { ...(prev[sec.key] ?? {}), [q.id]: next.join(',') },
                                }))
                              }
                              return (
                                <div className="grid grid-cols-2 gap-3">
                                  {ALL_SERVICES.map(svc => {
                                    const isOwned = submissionSvcs.includes(svc.id)
                                    const isSelected = selected.includes(svc.id) || isOwned
                                    return (
                                      <button
                                        key={svc.id}
                                        type="button"
                                        onClick={() => toggleService(svc.id)}
                                        className={`relative flex flex-col gap-1 p-4 rounded-xl border text-left transition-all ${
                                          isOwned
                                            ? 'border-black bg-black text-white cursor-default'
                                            : isSelected
                                            ? 'border-black bg-black/5 text-black'
                                            : 'border-zinc-200 bg-[#f9f9f9] text-zinc-700 hover:border-zinc-400'
                                        }`}
                                      >
                                        <span className="font-semibold text-sm">{svc.label}</span>
                                        {isOwned && (
                                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                                            Already in your package
                                          </span>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                              )
                            })() : q.type === 'textarea' ? (
                              <textarea
                                value={qAnswers[sec.key]?.[q.id] ?? ''}
                                onChange={e => setQAnswers(prev => ({
                                  ...prev,
                                  [sec.key]: { ...(prev[sec.key] ?? {}), [q.id]: e.target.value },
                                }))}
                                placeholder={q.placeholder}
                                rows={3}
                                className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none bg-[#f9f9f9]"
                              />
                            ) : (
                              <input
                                type="text"
                                value={qAnswers[sec.key]?.[q.id] ?? ''}
                                onChange={e => setQAnswers(prev => ({
                                  ...prev,
                                  [sec.key]: { ...(prev[sec.key] ?? {}), [q.id]: e.target.value },
                                }))}
                                placeholder={q.placeholder}
                                className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-[#f9f9f9]"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })()}

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-6">
                    <button
                      type="button"
                      onClick={() => setQStep(s => Math.max(0, s - 1))}
                      disabled={qStep === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                      Previous
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={qSaving}
                        className="px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
                      >
                        {qSaving ? 'Saving…' : qSaved ? '✓ Saved' : 'Save Draft'}
                      </button>

                      {qStep < Q_SECTIONS.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setQStep(s => Math.min(Q_SECTIONS.length - 1, s + 1))}
                          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
                        >
                          Next
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmitQuestionnaire}
                          disabled={qSubmitting}
                          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                        >
                          {qSubmitting ? 'Submitting…' : 'Submit'}
                          <span className="material-symbols-outlined text-[16px]">send</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

// ── Onboarding Types ─────────────────────────────────────────────
interface AdminCustomPkgData {
  enabled: boolean
  lineItems: string  // JSON string
  subtotal: number
  discountPct: number
  total: number
  notes: string | null
  paymentTerms: string | null
}

interface OnboardingStatus {
  id: number
  clientId: number
  step1Questionnaire: boolean
  step2BrandGuide: boolean
  step3Package: boolean
  step4Checkout: boolean
  completedAt: string | null
}

interface PackageProposal {
  id: number
  proposalNumber: string
  status: string
  lineItems: string | null
  subtotal: number
  total: number
  signingToken: string | null
  clientSignature: string | null
  clientSignedAt: string | null
}

// ── Onboarding Step Header ────────────────────────────────────────
const STEP_META = [
  { key: 'step1Questionnaire', label: 'Discovery', num: 1 },
  { key: 'step2BrandGuide',    label: 'Brand Guide', num: 2 },
  { key: 'step3Package',       label: 'Your Package', num: 3 },
  { key: 'step4Checkout',      label: 'Checkout', num: 4 },
] as const

function OnboardingHeader({ onboarding, activeStep }: { onboarding: OnboardingStatus; activeStep: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-100">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase mr-2 hidden sm:block">Onboarding</span>
          {STEP_META.map((step, i) => {
            const done = onboarding[step.key]
            const active = step.num === activeStep
            return (
              <div key={step.key} className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  done ? 'bg-black text-white' : active ? 'bg-zinc-900 text-white ring-2 ring-zinc-900 ring-offset-1' : 'bg-zinc-100 text-zinc-400'
                }`}>
                  {done ? <span>✓</span> : <span>{step.num}</span>}
                  <span className="hidden sm:block">{step.label}</span>
                </div>
                {i < STEP_META.length - 1 && (
                  <div className={`w-4 h-px ${done ? 'bg-black' : 'bg-zinc-200'}`} />
                )}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-zinc-400">Step {activeStep} of 4</p>
      </div>
    </div>
  )
}

// ── Step 1: Discovery Questionnaire ──────────────────────────────
function OnboardingStep1({ onAdvance }: { onAdvance: (o: OnboardingStatus) => void }) {
  const { clientUser } = useClientAuth()
  // Directly reuse the questionnaire view logic from ClientDashboard
  // We simply call GET /portal/onboarding after submit to advance
  const [done, setDone] = useState(false)

  const handleStepComplete = useCallback(async () => {
    if (!clientUser) return
    const api = createPortalApi(clientUser.accessToken)
    const res = await api.get('/portal/onboarding')
    onAdvance(res.data as OnboardingStatus)
  }, [clientUser, onAdvance])

  if (done) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-black tracking-tight">Questionnaire Submitted!</h2>
        <p className="text-zinc-500 text-sm">Loading next step…</p>
      </div>
    )
  }

  return (
    <QuestionnaireStepWrapper
      onSubmitComplete={async () => {
        setDone(true)
        await handleStepComplete()
      }}
    />
  )
}

// Wrapper that embeds the full questionnaire form (reuses existing logic)
function QuestionnaireStepWrapper({ onSubmitComplete }: { onSubmitComplete: () => Promise<void> }) {
  const { clientUser } = useClientAuth()
  const [qStep, setQStep] = useState(() => {
    try { const s = sessionStorage.getItem('portal_q_step'); return s ? Math.min(parseInt(s, 10), Q_SECTIONS.length - 1) : 0 } catch { return 0 }
  })
  const [qAnswers, setQAnswers] = useState<Record<string, Record<string, string>>>({})
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null)
  const [qSaving, setQSaving] = useState(false)
  const [qSaved, setQSaved] = useState(false)
  const [qSubmitting, setQSubmitting] = useState(false)
  const [clientData, setClientData] = useState<{ submissionServices?: string[] } | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!clientUser) return
    const api = createPortalApi(clientUser.accessToken)
    Promise.all([api.get('/portal/questionnaire'), api.get('/portal/me')]).then(([q, me]) => {
      setClientData({ submissionServices: me.data.submissionServices ?? [] })
      if (q.data) {
        setQuestionnaire(q.data)
        const hydrated: Record<string, Record<string, string>> = {}
        Q_SECTIONS.forEach(sec => {
          const raw = (q.data as QuestionnaireData)[sec.key as keyof QuestionnaireData] as string | null
          if (raw) { try { hydrated[sec.key] = JSON.parse(raw) } catch { /* ignore */ } }
        })
        setQAnswers(hydrated)
      }
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [clientUser])

  const handleSaveDraft = async () => {
    if (!clientUser || qSaving) return
    setQSaving(true)
    setQSaved(false)
    try {
      const api = createPortalApi(clientUser.accessToken)
      const payload: Record<string, string> = {}
      Q_SECTIONS.forEach(sec => { payload[sec.key] = JSON.stringify(qAnswers[sec.key] ?? {}) })
      const res = await api.put('/portal/questionnaire', payload)
      setQuestionnaire(res.data)
      setQSaved(true)
      setTimeout(() => setQSaved(false), 2500)
    } catch { /* silent */ } finally { setQSaving(false) }
  }

  const handleSubmit = async () => {
    if (!clientUser || qSubmitting) return
    setQSubmitting(true)
    try {
      const api = createPortalApi(clientUser.accessToken)
      const payload: Record<string, string | boolean> = { submit: true }
      Q_SECTIONS.forEach(sec => { payload[sec.key] = JSON.stringify(qAnswers[sec.key] ?? {}) })
      await api.put('/portal/questionnaire', payload)
      await onSubmitComplete()
    } catch { /* silent */ } finally { setQSubmitting(false) }
  }

  if (!loaded) return <div className="text-center py-16 text-zinc-400 text-sm">Loading questionnaire…</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Discovery Questionnaire</h2>
        <p className="text-zinc-500 text-sm mt-1">Help us understand your business so we can build the perfect solution.</p>
      </div>

      {questionnaire?.status === 'submitted' ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-2">
          <p className="text-green-700 font-bold">Questionnaire already submitted ✓</p>
          <button type="button" onClick={onSubmitComplete} className="text-sm text-green-600 underline">
            Continue to next step →
          </button>
        </div>
      ) : (
        <>
          {/* Step dots */}
          <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
            {Q_SECTIONS.map((sec, i) => {
              const hasData = Object.values(qAnswers[sec.key] ?? {}).some(v => v?.trim())
              return (
                <button key={sec.key} type="button" onClick={() => setQStep(i)}
                  className={`flex-shrink-0 h-2 rounded-full transition-all ${
                    i === qStep ? 'w-8 bg-black' : hasData ? 'w-4 bg-zinc-400' : 'w-4 bg-zinc-200'
                  }`} title={sec.title} />
              )
            })}
            <span className="ml-3 text-xs text-zinc-400 flex-shrink-0">{qStep + 1} / {Q_SECTIONS.length}</span>
          </div>

          {/* Current section */}
          {(() => {
            const sec = Q_SECTIONS[qStep]
            return (
              <div className="bg-white rounded-xl p-8 space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Section {qStep + 1} of {Q_SECTIONS.length}</p>
                  <h3 className="text-2xl font-bold tracking-tight">{sec.title}</h3>
                </div>
                {sec.questions.map(q => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium text-black mb-2">{q.label}</label>
                    {q.type === 'services' ? (() => {
                      const submissionSvcs = clientData?.submissionServices ?? []
                      const selectedRaw = qAnswers[sec.key]?.[q.id] ?? ''
                      const selected = selectedRaw ? selectedRaw.split(',').filter(Boolean) : []
                      const toggleService = (id: string) => {
                        if (submissionSvcs.includes(id)) return
                        const next = selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]
                        setQAnswers(prev => ({ ...prev, [sec.key]: { ...(prev[sec.key] ?? {}), [q.id]: next.join(',') } }))
                      }
                      return (
                        <div className="grid grid-cols-2 gap-3">
                          {ALL_SERVICES.map(svc => {
                            const isOwned = submissionSvcs.includes(svc.id)
                            const isSelected = selected.includes(svc.id) || isOwned
                            return (
                              <button key={svc.id} type="button" onClick={() => toggleService(svc.id)}
                                className={`flex flex-col gap-1 p-4 rounded-xl border text-left transition-all ${
                                  isOwned ? 'border-black bg-black text-white cursor-default'
                                    : isSelected ? 'border-black bg-black/5 text-black'
                                    : 'border-zinc-200 bg-[#f9f9f9] text-zinc-700 hover:border-zinc-400'
                                }`}>
                                <span className="font-semibold text-sm">{svc.label}</span>
                                {isOwned && <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Already in your package</span>}
                              </button>
                            )
                          })}
                        </div>
                      )
                    })() : q.type === 'textarea' ? (
                      <textarea value={qAnswers[sec.key]?.[q.id] ?? ''}
                        onChange={e => setQAnswers(prev => ({ ...prev, [sec.key]: { ...(prev[sec.key] ?? {}), [q.id]: e.target.value } }))}
                        placeholder={q.placeholder} rows={3}
                        className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none bg-[#f9f9f9]" />
                    ) : (
                      <input type="text" value={qAnswers[sec.key]?.[q.id] ?? ''}
                        onChange={e => setQAnswers(prev => ({ ...prev, [sec.key]: { ...(prev[sec.key] ?? {}), [q.id]: e.target.value } }))}
                        placeholder={q.placeholder}
                        className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-[#f9f9f9]" />
                    )}
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => {
              const prev = Math.max(0, qStep - 1)
              setQStep(prev)
              try { sessionStorage.setItem('portal_q_step', String(prev)) } catch { /* ignore */ }
            }} disabled={qStep === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 transition-colors">
              ← Previous
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={async () => {
                await handleSaveDraft()
              }} disabled={qSaving}
                className="px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 transition-colors">
                {qSaving ? 'Saving…' : qSaved ? '✓ Saved' : 'Save & Continue Later'}
              </button>
              {qStep < Q_SECTIONS.length - 1 ? (
                <button type="button" onClick={() => {
                  // Auto-save on navigation (fire-and-forget)
                  handleSaveDraft()
                  const next = Math.min(Q_SECTIONS.length - 1, qStep + 1)
                  setQStep(next)
                  try { sessionStorage.setItem('portal_q_step', String(next)) } catch { /* ignore */ }
                }}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors">
                  Next →
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={qSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-colors">
                  {qSubmitting ? 'Submitting…' : 'Submit'} ✓
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Step 2: Brand Guide ───────────────────────────────────────────
function OnboardingStep2({ onAdvance }: { onAdvance: (o: OnboardingStatus) => void }) {
  const { clientUser } = useClientAuth()
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [maxReached, setMaxReached] = useState(0)
  const [marking, setMarking] = useState(false)

  const slide = SLIDES[index]

  const goTo = useCallback((next: number) => {
    if (next < 0 || next >= SLIDES.length) return
    setDirection(next > index ? 1 : -1)
    setIndex(next)
    setMaxReached(prev => Math.max(prev, next))
  }, [index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(index + 1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, goTo])

  const handleMarkComplete = async () => {
    if (!clientUser || marking) return
    setMarking(true)
    try {
      const api = createPortalApi(clientUser.accessToken)
      await api.put('/portal/onboarding/step/step2BrandGuide', {})
      const res = await api.get('/portal/onboarding')
      onAdvance(res.data as OnboardingStatus)
    } catch { /* silent */ } finally { setMarking(false) }
  }

  const canComplete = maxReached >= SLIDES.length - 1
  const isFirst = index === 0
  const isLast = index === SLIDES.length - 1
  const progressPct = Math.round(((maxReached + 1) / SLIDES.length) * 100)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">The DBTA Brand Guide</h2>
          <p className="text-zinc-500 text-sm mt-1">
            {canComplete ? 'All slides read — you can continue.' : `Read all ${SLIDES.length} slides before continuing.`}
          </p>
        </div>
        <span className="flex-shrink-0 text-xs font-bold text-zinc-400 mt-1">{progressPct}%</span>
      </div>

      {/* Gold progress bar */}
      <div className="h-px bg-zinc-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: '#C6A84B' }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Slide card */}
      <div className="relative bg-[#08090D] rounded-2xl overflow-hidden" style={{ minHeight: 460 }}>

        {/* Watermark number */}
        <div className="absolute top-0 right-0 select-none pointer-events-none overflow-hidden"
          style={{ lineHeight: 1 }}>
          <span className="text-[140px] font-black text-white/[0.03] leading-none pr-4 pt-2 block">
            {slide.number}
          </span>
        </div>

        {/* Gold top rule */}
        <div className="h-[2px] w-16 bg-[#C6A84B] ml-8 mt-8" />

        {/* Content */}
        <div className="px-8 pt-6 pb-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-5"
            >
              {/* Tag */}
              <p className="text-[#C6A84B] text-[10px] font-bold uppercase tracking-[0.25em]">
                {slide.tag}
              </p>

              {/* Headline */}
              <div className="space-y-2">
                <h3 className="text-[#F5F0E8] font-black tracking-tight leading-tight"
                  style={{ fontSize: 'clamp(1.35rem, 3.5vw, 2rem)' }}>
                  {slide.headline}
                </h3>
                {slide.subheadline && (
                  <p className="text-[#6B6560] text-sm leading-relaxed">{slide.subheadline}</p>
                )}
              </div>

              {/* Body */}
              {slide.body.length > 0 && (
                <div className="space-y-2">
                  {slide.body.map((p, i) => (
                    <p key={i} className="text-[#F5F0E8]/75 text-sm leading-relaxed">{p}</p>
                  ))}
                </div>
              )}

              {/* Bullets */}
              {slide.bullets && (
                <ul className="space-y-2.5">
                  {slide.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-[#C6A84B] text-[11px] font-black mt-0.5 w-5 flex-shrink-0 text-center">
                        {b.icon}
                      </span>
                      <span className="text-[#F5F0E8]/80 text-sm leading-relaxed">{b.text}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Two-column */}
              {slide.twoCol && (
                <div className="grid grid-cols-2 gap-3">
                  {[slide.twoCol.left, slide.twoCol.right].map((col, ci) => (
                    <div key={ci} className="rounded-xl p-4 space-y-3"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[#C6A84B] text-[10px] font-bold uppercase tracking-widest">{col.label}</p>
                      <ul className="space-y-2">
                        {col.items.map((item, ii) => (
                          <li key={ii} className="text-[#F5F0E8]/70 text-sm flex items-center gap-2">
                            <span className="text-[#C6A84B] text-[10px] flex-shrink-0">◈</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Callout */}
              {slide.callout && (
                <div className="rounded-xl px-5 py-4 space-y-1"
                  style={{ background: 'rgba(198,168,75,0.07)', borderLeft: '2px solid #C6A84B' }}>
                  <p className="text-[#F5F0E8] text-sm font-medium leading-relaxed whitespace-pre-line">
                    {slide.callout}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation bar inside card */}
        <div className="flex items-center justify-between px-8 pb-7 pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>

          {/* Back button — always visible, disabled on first */}
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={isFirst}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-20"
            style={{ color: 'rgba(245,240,232,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={e => { if (!isFirst) { (e.currentTarget as HTMLButtonElement).style.color = '#F5F0E8'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)' } }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(245,240,232,0.6)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
          >
            ← Back
          </button>

          {/* Dot indicators — clickable for visited slides */}
          <div className="flex items-center gap-1 flex-wrap justify-center max-w-[200px]">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { if (i <= maxReached || i === index + 1) goTo(i) }}
                title={`Slide ${i + 1}`}
                className="rounded-full transition-all focus:outline-none"
                style={{
                  width: i === index ? 16 : 6,
                  height: 6,
                  background: i === index
                    ? '#C6A84B'
                    : i <= maxReached
                    ? 'rgba(255,255,255,0.3)'
                    : 'rgba(255,255,255,0.08)',
                  cursor: i <= maxReached || i === index + 1 ? 'pointer' : 'default',
                }}
              />
            ))}
          </div>

          {/* Forward / Complete */}
          {!isLast ? (
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ color: 'rgba(245,240,232,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F5F0E8'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(245,240,232,0.6)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleMarkComplete}
              disabled={marking}
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: '#C6A84B', color: '#08090D' }}
            >
              {marking ? 'Saving…' : 'Done ✓'}
            </button>
          )}
        </div>
      </div>

      {/* Continue banner — appears once all slides visited, even mid-deck */}
      {canComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 rounded-xl px-5 py-4"
          style={{ background: 'rgba(198,168,75,0.08)', border: '1px solid rgba(198,168,75,0.2)' }}
        >
          <p className="text-sm text-[#C6A84B] font-medium">
            You've read all {SLIDES.length} slides.
          </p>
          <button
            type="button"
            onClick={handleMarkComplete}
            disabled={marking}
            className="flex-shrink-0 px-5 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: '#C6A84B', color: '#08090D' }}
          >
            {marking ? 'Saving…' : 'Continue →'}
          </button>
        </motion.div>
      )}
    </div>
  )
}

// ── Step 3: Package Selection ─────────────────────────────────────
function OnboardingStep3({ onAdvance, adminCustomPkg }: {
  onAdvance: (o: OnboardingStatus) => void
  adminCustomPkg: AdminCustomPkgData | null
}) {
  const { clientUser } = useClientAuth()

  // If admin has set a custom package, parse its items
  const customItems: PackageLineItem[] = (() => {
    if (!adminCustomPkg) return []
    try { return JSON.parse(adminCustomPkg.lineItems) as PackageLineItem[] } catch { return [] }
  })()
  const hasCustomPkg = adminCustomPkg !== null

  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null)
  const [mode, setMode] = useState<'tiers' | 'custom'>('tiers')
  const [lineItems, setLineItems] = useState<PackageLineItem[]>([])
  const [customPages, setCustomPages] = useState<Array<{ id: string; title: string }>>([])
  const [generating, setGenerating] = useState(false)
  const [proposal, setProposal] = useState<PackageProposal | null>(null)
  const [pkgDraftSaving, setPkgDraftSaving] = useState(false)
  const [pkgDraftSaved, setPkgDraftSaved] = useState(false)
  const [signingCanvas, setSigningCanvas] = useState<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [sigMode, setSigMode] = useState<'draw' | 'type'>('draw')
  const [typedName, setTypedName] = useState('')
  const [hasSig, setHasSig] = useState(false)
  const [signing, setSigning] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [signError, setSignError] = useState('')

  // Load existing package if any
  useEffect(() => {
    if (!clientUser) return
    const api = createPortalApi(clientUser.accessToken)
    Promise.all([api.get('/portal/package'), api.get('/portal/package/proposal')]).then(([pkg, prop]) => {
      if (pkg.data) {
        const savedTierId: string = pkg.data.tier
        if (savedTierId === 'custom') {
          setMode('custom')
        } else {
          const tier = PRICING_TIERS.find(t => t.id === savedTierId)
          if (tier) setSelectedTier(tier)
        }
        if (pkg.data.lineItems) {
          const items = JSON.parse(pkg.data.lineItems) as PackageLineItem[]
          setLineItems(items)
          // Restore custom pages from standard_page line item
          const pageLine = items.find(l => l.serviceId === 'standard_page')
          if (pageLine && savedTierId === 'custom') {
            const titles = (pageLine.description ?? '').split(', ').filter(Boolean)
            setCustomPages(titles.map(t => ({ id: crypto.randomUUID(), title: t })))
          }
        }
      }
      if (prop.data) setProposal(prop.data as PackageProposal)
    }).catch(() => {/* no package yet */})
  }, [clientUser])

  // Auto-add base_website when entering à la carte mode
  useEffect(() => {
    if (mode === 'custom') {
      setLineItems(prev => {
        if (prev.some(l => l.serviceId === 'base_website')) return prev
        return [{ serviceId: 'base_website', label: 'Base Website Setup', description: 'Full project setup, hosting config, and deployment', qty: 1, unitPrice: 2500, amount: 2500 }, ...prev]
      })
    }
  }, [mode])

  // Sync custom pages into the standard_page line item
  useEffect(() => {
    if (mode !== 'custom') return
    setLineItems(prev => {
      const without = prev.filter(l => l.serviceId !== 'standard_page')
      if (customPages.length === 0) return without
      return [...without, {
        serviceId: 'standard_page', label: `Standard Pages (×${customPages.length})`,
        description: customPages.map(p => p.title).filter(Boolean).join(', ') || `${customPages.length} page(s)`,
        qty: customPages.length, unitPrice: 150, amount: customPages.length * 150,
      }]
    })
  }, [customPages, mode])

  const handleSelectTier = (tier: PricingTier) => {
    if (tier.isCustomContact) return // handled separately
    setSelectedTier(tier)
    setLineItems(tier.lineItems)
    setMode('tiers')
    setProposal(null) // reset if re-selecting
  }

  const getTotal = () => lineItems.filter(i => !i.included).reduce((sum, i) => sum + i.amount, 0)

  const handleGenerate = async () => {
    if (!clientUser) return
    if (mode !== 'custom' && !selectedTier) return
    setGenerating(true)
    try {
      const api = createPortalApi(clientUser.accessToken)
      const res = await api.post('/portal/package', {
        tier: mode === 'custom' ? 'custom' : selectedTier!.id,
        lineItems,
        subtotal: getTotal(),
        total: getTotal(),
      })
      setProposal(res.data.proposal as PackageProposal)
      // Re-fetch full proposal
      const propRes = await api.get('/portal/package/proposal')
      setProposal(propRes.data as PackageProposal)
    } catch { /* silent */ } finally { setGenerating(false) }
  }

  const handleSavePkgDraft = async () => {
    if (!clientUser || pkgDraftSaving) return
    const tierId = mode === 'custom' ? 'custom' : selectedTier?.id
    if (!tierId) return
    setPkgDraftSaving(true)
    try {
      const api = createPortalApi(clientUser.accessToken)
      await api.put('/portal/package/draft', { tier: tierId, lineItems, subtotal: getTotal(), total: getTotal() })
      setPkgDraftSaved(true)
      setTimeout(() => setPkgDraftSaved(false), 3000)
    } catch { /* silent */ } finally { setPkgDraftSaving(false) }
  }

  const handleSelectCustom = async () => {
    if (!clientUser || !adminCustomPkg) return
    setGenerating(true)
    try {
      const api = createPortalApi(clientUser.accessToken)
      const res = await api.post('/portal/package', {
        tier: 'custom',
        lineItems: customItems,
        subtotal: adminCustomPkg.subtotal,
        total: adminCustomPkg.total,
        notes: adminCustomPkg.notes ?? '',
      })
      setProposal(res.data.proposal as PackageProposal)
      const propRes = await api.get('/portal/package/proposal')
      setProposal(propRes.data as PackageProposal)
    } catch { /* silent */ } finally { setGenerating(false) }
  }

  // Signature canvas helpers
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!; if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
    setIsDrawing(true); setSigningCanvas(canvas)
  }
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !signingCanvas) return
    e.preventDefault()
    const ctx = signingCanvas.getContext('2d')!
    const pos = getPos(e, signingCanvas)
    ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke()
    setHasSig(true)
  }
  const stopDraw = () => setIsDrawing(false)
  const clearSig = () => {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setHasSig(false)
  }

  const handleSign = async () => {
    const canSign = sigMode === 'draw' ? hasSig : typedName.trim().length > 0
    if (!clientUser || !proposal?.signingToken || !canSign) return
    setSigning(true); setSignError('')
    try {
      let signature: string
      if (sigMode === 'type') {
        const c = document.createElement('canvas')
        c.width = 600; c.height = 150
        const ctx = c.getContext('2d')!
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, 600, 150)
        ctx.font = 'italic 52px Georgia, serif'
        ctx.fillStyle = '#000'
        ctx.textBaseline = 'middle'
        ctx.fillText(typedName.trim(), 24, 75)
        signature = c.toDataURL('image/png')
      } else {
        const canvas = canvasRef.current!
        signature = canvas.toDataURL('image/png')
      }
      const api = createPortalApi(clientUser.accessToken)
      await api.post(`/sign/${proposal.signingToken}`, { signature })
      // Refresh proposal
      const propRes = await api.get('/portal/package/proposal')
      setProposal(propRes.data as PackageProposal)
      // Advance onboarding
      const onbRes = await api.get('/portal/onboarding')
      onAdvance(onbRes.data as OnboardingStatus)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setSignError(err?.response?.data?.error ?? 'Failed to submit signature. Please try again.')
    } finally { setSigning(false) }
  }

  const handleSignatureInteraction = async () => {
    if (!clientUser || !proposal?.signingToken) return
    // If already signed, just advance
    if (proposal.clientSignedAt) {
      const api = createPortalApi(clientUser.accessToken)
      const res = await api.get('/portal/onboarding')
      onAdvance(res.data as OnboardingStatus)
    }
  }

  // If proposal is already signed, auto-advance
  useEffect(() => {
    if (proposal?.clientSignedAt && clientUser) {
      handleSignatureInteraction()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal?.clientSignedAt])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Choose Your Package</h2>
        <p className="text-zinc-500 text-sm mt-1">
          {hasCustomPkg
            ? 'Terrence has prepared a custom package tailored specifically for you.'
            : 'Select the experience that fits your goals. You can review and sign a proposal before checkout.'}
        </p>
      </div>

      {/* Custom package (admin-created) */}
      {hasCustomPkg && !proposal && (
        <div className="bg-[#f9f9f9] border border-zinc-200 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black text-white">Custom</span>
            <span className="text-xs text-zinc-400">Curated for you by Terrence Adderley</span>
          </div>
          {customItems.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Service</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {customItems.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-black">{item.label}</p>
                        {item.description && <p className="text-[11px] text-zinc-400 mt-0.5">{item.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-black">${item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-200 bg-zinc-50">
                    <td className="px-4 py-3 font-semibold text-black">Total</td>
                    <td className="px-4 py-3 text-right font-black text-lg text-black">${adminCustomPkg!.total.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          {adminCustomPkg?.notes && (
            <p className="text-sm text-zinc-500 italic">{adminCustomPkg.notes}</p>
          )}
          <button
            type="button"
            onClick={handleSelectCustom}
            disabled={generating}
            className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-40 transition-colors"
          >
            {generating ? 'Generating Proposal…' : 'Select This Package →'}
          </button>
        </div>
      )}

      {/* Standard tier cards */}
      {!hasCustomPkg && !proposal && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRICING_TIERS.map(tier => (
              <button key={tier.id} type="button" onClick={() => tier.isCustomContact ? undefined : handleSelectTier(tier)}
                className={`relative flex flex-col gap-3 p-5 rounded-xl border text-left transition-all ${
                  selectedTier?.id === tier.id
                    ? 'border-black bg-black text-white shadow-lg'
                    : 'border-zinc-200 bg-white hover:border-zinc-400 text-black'
                } ${tier.isCustomContact ? 'cursor-default opacity-90' : ''}`}>

                {tier.popular && (
                  <span className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${selectedTier?.id === tier.id ? 'bg-white/20 text-white' : 'bg-black text-white'}`}>
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-lg">{tier.emoji}</span>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-60">{tier.id.toUpperCase()}</span>
                </div>

                <div>
                  <p className="font-black text-xl tracking-tight">{tier.priceLabel}</p>
                  <p className="text-xs opacity-50 mt-0.5">{tier.valueLabel}</p>
                </div>

                <p className="text-sm opacity-70">{tier.tagline}</p>

                <ul className="space-y-1">
                  {tier.highlights.slice(0, 4).map((h, i) => (
                    <li key={i} className="text-xs flex items-center gap-1.5 opacity-80">
                      <span className="opacity-50">◈</span> {h}
                    </li>
                  ))}
                  {tier.highlights.length > 4 && (
                    <li className="text-xs opacity-40">+{tier.highlights.length - 4} more</li>
                  )}
                </ul>

                {tier.bonuses.length > 0 && (
                  <div className={`rounded-lg p-3 space-y-1 ${selectedTier?.id === tier.id ? 'bg-white/10' : 'bg-green-50'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedTier?.id === tier.id ? 'text-white/60' : 'text-green-700'}`}>Bundle Bonuses</p>
                    {tier.bonuses.map((b, i) => (
                      <p key={i} className={`text-xs ${selectedTier?.id === tier.id ? 'text-white/80' : 'text-green-700'}`}>
                        FREE {b.label} <span className="opacity-60">({b.value})</span>
                      </p>
                    ))}
                  </div>
                )}

                {tier.isCustomContact ? (
                  <a href="#" onClick={e => { e.preventDefault(); window.location.hash = '' }}
                    className={`mt-1 text-center text-sm font-bold py-2 rounded-lg transition-colors ${selectedTier?.id === tier.id ? 'bg-white text-black' : 'bg-black text-white hover:bg-zinc-800'}`}>
                    {tier.cta}
                  </a>
                ) : (
                  <div className={`mt-1 text-center text-sm font-bold py-2 rounded-lg ${selectedTier?.id === tier.id ? 'bg-white text-black' : 'border border-zinc-200 text-black hover:bg-zinc-50'}`}>
                    {selectedTier?.id === tier.id ? '✓ Selected' : tier.cta}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* À La Carte toggle */}
          <div className="border-t border-zinc-100 pt-4">
            <button type="button" onClick={() => setMode(m => m === 'custom' ? 'tiers' : 'custom')}
              className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors underline">
              {mode === 'custom' ? 'Hide à la carte' : 'Build a custom package instead →'}
            </button>
          </div>

          {mode === 'custom' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">À La Carte Services</h3>
                <span className="text-xs text-zinc-400">Select what you need</span>
              </div>
              {Array.from(new Set(ALA_CARTE.map(i => i.category))).map(cat => (
                <div key={cat}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">{cat}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALA_CARTE.filter(i => i.category === cat).map(item => {
                      const isRequired = item.id === 'base_website'
                      const isSelected = isRequired || lineItems.some(l => l.serviceId === item.id)
                      const isStandardPage = item.id === 'standard_page'
                      return (
                        <button key={item.id} type="button"
                          disabled={isRequired}
                          onClick={() => {
                            if (isRequired) return
                            if (isStandardPage) {
                              // toggle: add first page or remove all pages
                              if (isSelected) {
                                setCustomPages([])
                              } else {
                                setCustomPages([{ id: crypto.randomUUID(), title: '' }])
                              }
                              return
                            }
                            setLineItems(prev => isSelected
                              ? prev.filter(l => l.serviceId !== item.id)
                              : [...prev, { serviceId: item.id, label: item.label, description: item.description, qty: 1, unitPrice: item.price, amount: item.price }]
                            )
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                            isRequired ? 'border-black bg-black text-white cursor-default' :
                            isSelected ? 'border-black bg-black/5' : 'border-zinc-200 hover:border-zinc-400'
                          }`}>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className={`text-xs font-semibold ${isRequired ? 'text-white' : ''}`}>{item.label}</p>
                              {isRequired && <span className="text-[9px] font-bold uppercase tracking-widest bg-white/20 text-white px-1.5 py-0.5 rounded">Required</span>}
                            </div>
                            <p className={`text-[10px] ${isRequired ? 'text-white/60' : 'text-zinc-400'}`}>{item.description}</p>
                          </div>
                          <span className={`text-xs font-bold ml-3 flex-shrink-0 ${isRequired ? 'text-white' : ''}`}>{item.priceLabel}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Standard Page builder */}
              {customPages.length > 0 && (
                <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Pages to build <span className="text-zinc-400 font-normal normal-case tracking-normal">· $150 each</span></p>
                    <button type="button"
                      onClick={() => setCustomPages(prev => [...prev, { id: crypto.randomUUID(), title: '' }])}
                      className="text-xs font-semibold text-black border border-zinc-300 px-2.5 py-1 rounded-lg hover:bg-zinc-100 transition-colors">
                      + Add Page
                    </button>
                  </div>
                  <div className="space-y-2">
                    {customPages.map((page, idx) => (
                      <div key={page.id} className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 w-5 text-right flex-shrink-0">{idx + 1}.</span>
                        <input
                          type="text"
                          value={page.title}
                          onChange={e => setCustomPages(prev => prev.map(p => p.id === page.id ? { ...p, title: e.target.value } : p))}
                          placeholder={`Page title (e.g. ${['About', 'Services', 'Portfolio', 'Pricing'][idx] ?? 'Custom Page'})`}
                          className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black/20"
                        />
                        <button type="button"
                          onClick={() => setCustomPages(prev => prev.filter(p => p.id !== page.id))}
                          className="text-zinc-300 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-400">Total: ${customPages.length * 150}</p>
                </div>
              )}
            </div>
          )}

          {/* Summary + generate button — tiers OR à la carte */}
          {((selectedTier && !selectedTier.isCustomContact) || (mode === 'custom' && lineItems.length > 0)) && (
            <div className="bg-zinc-50 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Package Summary</h3>
                <span className="text-lg font-black">${getTotal().toLocaleString()}</span>
              </div>
              <div className="space-y-1">
                {lineItems.filter(i => !i.included && !i.bonus && i.amount > 0).map(item => (
                  <div key={item.serviceId} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">{item.label}</span>
                    <span className="font-medium">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
                {selectedTier?.bonuses.map(b => (
                  <div key={b.label} className="flex items-center justify-between text-xs text-green-600">
                    <span>+ {b.label}</span>
                    <span className="font-bold">FREE</span>
                  </div>
                ))}
              </div>
              <button type="button"
                onClick={handleGenerate}
                disabled={generating || lineItems.length === 0}
                className="w-full py-3 bg-black text-white font-bold text-sm rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-colors">
                {generating ? 'Generating Proposal…' : 'Generate My Proposal →'}
              </button>
              <button type="button"
                onClick={handleSavePkgDraft}
                disabled={pkgDraftSaving || lineItems.length === 0}
                className="w-full py-2 border border-zinc-200 text-zinc-600 text-sm font-medium rounded-xl hover:bg-zinc-50 disabled:opacity-40 transition-colors">
                {pkgDraftSaving ? 'Saving…' : pkgDraftSaved ? '✓ Saved — Come back anytime' : 'Save & Continue Later'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Proposal preview + signing */}
      {proposal && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Your Proposal</h3>
              <span className="text-xs text-zinc-400">{proposal.proposalNumber}</span>
            </div>

            {proposal.lineItems && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-400 text-xs uppercase border-b border-zinc-100">
                    <th className="text-left pb-2">Service</th>
                    <th className="text-right pb-2">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(JSON.parse(proposal.lineItems) as Array<{ description: string; quantity: number; unitPrice: number; amount: number }>).map((item, i) => (
                    <tr key={i} className="border-b border-zinc-50">
                      <td className="py-2 text-zinc-700">{item.description}</td>
                      <td className="py-2 text-right font-medium">
                        {item.unitPrice === 0 ? <span className="text-green-600 text-xs font-bold">FREE</span> : `$${item.amount.toLocaleString()}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="pt-3 font-bold">Total Investment</td>
                    <td className="pt-3 text-right font-black text-lg">${proposal.total.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {proposal.clientSignedAt ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-2">
              <p className="text-green-700 font-bold text-lg">Proposal Signed ✓</p>
              <p className="text-green-600 text-sm">Signed on {new Date(proposal.clientSignedAt).toLocaleDateString()}</p>
              <p className="text-xs text-zinc-400">Loading checkout…</p>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="font-bold mb-1">Sign the Proposal</h3>
                <p className="text-xs text-zinc-400">By signing, you agree to the scope and payment terms outlined above.</p>
              </div>

              {/* Signature mode tabs */}
              <div className="flex gap-0 border border-zinc-200 rounded-lg overflow-hidden">
                <button type="button" onClick={() => setSigMode('draw')}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors ${sigMode === 'draw' ? 'bg-black text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}>
                  ✏ Draw
                </button>
                <button type="button" onClick={() => setSigMode('type')}
                  className={`flex-1 py-2 text-xs font-semibold border-l border-zinc-200 transition-colors ${sigMode === 'type' ? 'bg-black text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}>
                  Aa Type
                </button>
              </div>

              {sigMode === 'draw' ? (
                <>
                  <div className="border border-zinc-200 rounded-lg overflow-hidden bg-[#f9f9f9]">
                    <canvas ref={canvasRef} width={600} height={150}
                      className="w-full touch-none cursor-crosshair"
                      onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                      onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
                  </div>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={clearSig}
                      className="text-xs text-zinc-400 hover:text-zinc-700 underline transition-colors">
                      Clear
                    </button>
                    {!hasSig && <p className="text-xs text-zinc-300">Draw your signature above</p>}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1.5">Type your full legal name</label>
                    <input
                      type="text"
                      value={typedName}
                      onChange={e => setTypedName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </div>
                  {typedName.trim() && (
                    <div className="border border-zinc-200 rounded-lg bg-[#f9f9f9] px-6 py-4 flex items-center min-h-[80px]">
                      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '2rem', color: '#000' }}>
                        {typedName}
                      </p>
                    </div>
                  )}
                  <p className="text-[11px] text-zinc-400">By typing your name, you confirm this serves as your legal signature.</p>
                </>
              )}

              {signError && <p className="text-red-500 text-xs">{signError}</p>}
              <button type="button" onClick={handleSign}
                disabled={(sigMode === 'draw' ? !hasSig : !typedName.trim()) || signing}
                className="w-full py-3 bg-black text-white font-bold text-sm rounded-xl hover:bg-zinc-800 disabled:opacity-40 transition-colors">
                {signing ? 'Submitting…' : 'Sign & Continue to Checkout →'}
              </button>
            </div>
          )}

          <button type="button" onClick={() => { setProposal(null); setSelectedTier(null); setLineItems([]) }}
            className="text-xs text-zinc-400 hover:text-zinc-700 underline transition-colors">
            ← Change package selection
          </button>
        </div>
      )}
    </div>
  )
}

// ── Step 4: Checkout ──────────────────────────────────────────────
interface PaymentSchedule {
  upfrontType: 'percent' | 'amount'
  upfront: number
  installments: number
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly'
}
const FREQ_LABEL: Record<PaymentSchedule['frequency'], string> = {
  weekly: 'weekly', biweekly: 'bi-weekly', monthly: 'monthly', yearly: 'annual',
}

function parseSchedule(paymentTerms: string | null): PaymentSchedule | null {
  if (!paymentTerms) return null
  try {
    const p = JSON.parse(paymentTerms) as Record<string, unknown>
    if (p && typeof p.upfront === 'number' && typeof p.installments === 'number') return p as unknown as PaymentSchedule
    return null
  } catch { return null }
}

function OnboardingStep4({ upfrontDiscountPct, packageTotal, adminCustomPkg, onAdvance }: {
  upfrontDiscountPct: number
  packageTotal: number
  adminCustomPkg: AdminCustomPkgData | null
  onAdvance: (o: OnboardingStatus) => void
}) {
  const { clientUser } = useClientAuth()
  const [selected, setSelected] = useState<'full' | 'split' | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  const customSchedule = parseSchedule(adminCustomPkg?.paymentTerms ?? null)

  const discountAmt = Math.round(packageTotal * (upfrontDiscountPct / 100) * 100) / 100
  const fullPrice = packageTotal - discountAmt

  // Option B amounts — use custom schedule if set, else standard 30%/3-monthly
  const upfrontAmt = customSchedule
    ? customSchedule.upfrontType === 'percent'
      ? Math.round(packageTotal * (customSchedule.upfront / 100) * 100) / 100
      : customSchedule.upfront
    : Math.round(packageTotal * 0.30 * 100) / 100
  const instCount = customSchedule ? customSchedule.installments : 3
  const instAmt = Math.round(((packageTotal - upfrontAmt) / instCount) * 100) / 100
  const freqLabel = customSchedule ? FREQ_LABEL[customSchedule.frequency] : 'monthly'
  const upfrontLabel = customSchedule
    ? customSchedule.upfrontType === 'percent' ? `${customSchedule.upfront}% deposit` : `deposit`
    : '30% deposit'

  const handleConfirm = async () => {
    if (!clientUser || !selected) return
    setConfirming(true); setError('')
    try {
      const api = createPortalApi(clientUser.accessToken)
      // Try Stripe in-portal checkout first
      try {
        const sessionRes = await api.post('/portal/checkout/session', { planType: selected })
        if (sessionRes.data?.url) {
          // Redirect to Stripe Checkout — will return to /portal?payment_success=1&...
          window.location.href = sessionRes.data.url
          return
        }
      } catch (stripeErr: unknown) {
        const e = stripeErr as { response?: { data?: { error?: string } } }
        // If Stripe not configured, fall through to legacy flow
        if (e?.response?.data?.error !== 'stripe_not_configured') throw stripeErr
      }
      // Fallback: create invoices without Stripe payment
      const res = await api.post('/portal/checkout', { planType: selected })
      onAdvance(res.data.onboarding as OnboardingStatus)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setError(err?.response?.data?.error ?? 'Something went wrong. Please try again.')
    } finally { setConfirming(false) }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Choose Your Payment Plan</h2>
        <p className="text-zinc-500 text-sm mt-1">Your project investment is <span className="font-bold text-black">${packageTotal.toLocaleString()}</span>. Choose how you'd like to pay.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pay in Full */}
        <button type="button" onClick={() => setSelected('full')}
          className={`flex flex-col gap-4 p-6 rounded-xl border text-left transition-all ${selected === 'full' ? 'border-black bg-black text-white' : 'border-zinc-200 bg-white hover:border-zinc-400'}`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Option A</p>
            <p className="text-xl font-black">Pay in Full</p>
          </div>
          <div>
            <p className="text-3xl font-black">${fullPrice.toLocaleString()}</p>
            {upfrontDiscountPct > 0 && (
              <p className={`text-sm mt-1 ${selected === 'full' ? 'text-white/70' : 'text-green-600'}`}>
                Save {upfrontDiscountPct}% — ${discountAmt.toLocaleString()} off
              </p>
            )}
          </div>
          <ul className="space-y-1">
            {['1 invoice total', 'Best value', 'Due within 7 days'].map(t => (
              <li key={t} className={`text-xs flex items-center gap-1.5 ${selected === 'full' ? 'opacity-70' : 'text-zinc-500'}`}>
                <span>◈</span> {t}
              </li>
            ))}
          </ul>
          <div className={`text-center text-sm font-bold py-2 rounded-lg ${selected === 'full' ? 'bg-white text-black' : 'border border-zinc-200'}`}>
            {selected === 'full' ? '✓ Selected' : 'Select'}
          </div>
        </button>

        {/* Option B — custom schedule or standard split */}
        <button type="button" onClick={() => setSelected('split')}
          className={`flex flex-col gap-4 p-6 rounded-xl border text-left transition-all ${selected === 'split' ? 'border-black bg-black text-white' : 'border-zinc-200 bg-white hover:border-zinc-400'}`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Option B</p>
            <p className="text-xl font-black">{customSchedule ? 'Custom Payment Plan' : 'Split Payment'}</p>
          </div>
          <div>
            <p className="text-3xl font-black">${upfrontAmt.toLocaleString()} <span className="text-base font-normal opacity-60">today</span></p>
            <p className={`text-sm mt-1 ${selected === 'split' ? 'text-white/70' : 'text-zinc-500'}`}>
              + {instCount} {freqLabel} payments of ${instAmt.toLocaleString()}
            </p>
          </div>
          <ul className="space-y-1">
            {[
              `${upfrontLabel.charAt(0).toUpperCase() + upfrontLabel.slice(1)} today`,
              `${instCount} ${freqLabel} installments`,
              `Total: $${packageTotal.toLocaleString()}`,
            ].map(t => (
              <li key={t} className={`text-xs flex items-center gap-1.5 ${selected === 'split' ? 'opacity-70' : 'text-zinc-500'}`}>
                <span>◈</span> {t}
              </li>
            ))}
          </ul>
          <div className={`text-center text-sm font-bold py-2 rounded-lg ${selected === 'split' ? 'bg-white text-black' : 'border border-zinc-200'}`}>
            {selected === 'split' ? '✓ Selected' : 'Select'}
          </div>
        </button>
      </div>

      {/* Standard payment policy (only shown when no custom package overrides) */}
      {!customSchedule && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <span className="text-amber-500 text-sm mt-0.5">⚠</span>
            <p className="text-xs text-amber-700">A <strong>$150 late fee</strong> applies if any invoice is more than 3 days past its due date.</p>
          </div>
          <div className="flex items-start gap-2 bg-zinc-50 border border-zinc-200 rounded-lg p-3">
            <span className="text-zinc-400 text-sm mt-0.5">ℹ</span>
            <p className="text-xs text-zinc-600">Work begins after the first payment is received. No deliverables will be released until the project is paid in full.</p>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="button" onClick={handleConfirm} disabled={!selected || confirming}
        className="w-full py-4 bg-black text-white font-black text-base rounded-xl hover:bg-zinc-800 disabled:opacity-40 transition-colors">
        {confirming ? 'Processing…' : selected ? `Confirm ${selected === 'full' ? 'Pay in Full' : 'Split Payment'} →` : 'Select a payment plan above'}
      </button>
    </div>
  )
}

// ── Onboarding Complete Screen ────────────────────────────────────
function OnboardingCompleteScreen({ onEnter }: { onEnter: () => void }) {
  useEffect(() => {
    const t = setTimeout(onEnter, 4000)
    return () => clearTimeout(t)
  }, [onEnter])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="text-center space-y-6 max-w-md">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Onboarding Complete</p>
        <h1 className="text-5xl font-black tracking-tighter">You're all set.</h1>
        <p className="text-zinc-400 leading-relaxed">
          Your project is officially in motion. Your invoices are on their way — once the first payment is received, we get started.
        </p>
        <button type="button" onClick={onEnter}
          className="mt-4 px-8 py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-100 transition-colors">
          Enter My Portal →
        </button>
      </motion.div>
    </div>
  )
}

// ── Onboarding Funnel ─────────────────────────────────────────────
function OnboardingFunnel({ onboarding: initial, packageTotal, upfrontDiscountPct, adminCustomPkg, onComplete }: {
  onboarding: OnboardingStatus
  packageTotal: number
  upfrontDiscountPct: number
  adminCustomPkg: AdminCustomPkgData | null
  onComplete: () => void
}) {
  const [onboarding, setOnboarding] = useState(initial)

  const activeStep = !onboarding.step1Questionnaire ? 1
    : !onboarding.step2BrandGuide ? 2
    : !onboarding.step3Package ? 3
    : !onboarding.step4Checkout ? 4
    : 0

  const advanceStep = (updated: OnboardingStatus) => {
    setOnboarding(updated)
    const allDone = updated.step1Questionnaire && updated.step2BrandGuide
      && updated.step3Package && updated.step4Checkout
    if (allDone) onComplete()
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <OnboardingHeader onboarding={onboarding} activeStep={activeStep} />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div key={activeStep} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}>
            {activeStep === 1 && <OnboardingStep1 onAdvance={advanceStep} />}
            {activeStep === 2 && <OnboardingStep2 onAdvance={advanceStep} />}
            {activeStep === 3 && <OnboardingStep3 onAdvance={advanceStep} adminCustomPkg={adminCustomPkg} />}
            {activeStep === 4 && (
              <OnboardingStep4
                upfrontDiscountPct={upfrontDiscountPct}
                packageTotal={packageTotal}
                adminCustomPkg={adminCustomPkg}
                onAdvance={advanceStep}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

// ── Onboarding Gate ───────────────────────────────────────────────
function OnboardingGate() {
  const { clientUser } = useClientAuth()
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null)
  const [packageTotal, setPackageTotal] = useState(0)
  const [upfrontDiscountPct, setUpfrontDiscountPct] = useState(0)
  const [adminCustomPkg, setAdminCustomPkg] = useState<AdminCustomPkgData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showComplete, setShowComplete] = useState(false)

  useEffect(() => {
    if (!clientUser) return
    const api = createPortalApi(clientUser.accessToken)

    // Check if returning from Stripe Checkout
    const params = new URLSearchParams(window.location.search)
    const paymentSuccess = params.get('payment_success')
    const stripeSessionId = params.get('sid')
    const planType = params.get('plan') as 'full' | 'split' | null

    if (paymentSuccess === '1' && stripeSessionId && planType) {
      // Clear URL params immediately
      window.history.replaceState({}, '', '/portal')
      // Confirm payment with server
      api.post('/portal/checkout/confirm', { sessionId: stripeSessionId, planType })
        .then(res => {
          // Payment confirmed — load full onboarding state
          return Promise.all([
            api.get('/portal/onboarding'),
            api.get('/portal/me'),
            api.get('/portal/package'),
            api.get('/portal/custom-package'),
          ]).then(([_onb, me, pkg, cust]) => {
            setOnboarding(res.data.onboarding as OnboardingStatus)
            setUpfrontDiscountPct(Number(me.data.upfrontDiscountPct ?? 0))
            if (pkg.data?.total) setPackageTotal(Number(pkg.data.total))
            if (cust.data) setAdminCustomPkg(cust.data as AdminCustomPkgData)
            setShowComplete(true)
          })
        })
        .catch(() => {/* fall through to normal load */})
        .finally(() => setLoading(false))
      return
    }

    Promise.all([
      api.get('/portal/onboarding'),
      api.get('/portal/me'),
      api.get('/portal/package'),
      api.get('/portal/custom-package'),
    ]).then(([onb, me, pkg, cust]) => {
      setOnboarding(onb.data as OnboardingStatus)
      setUpfrontDiscountPct(Number(me.data.upfrontDiscountPct ?? 0))
      if (pkg.data?.total) setPackageTotal(Number(pkg.data.total))
      if (cust.data) setAdminCustomPkg(cust.data as AdminCustomPkgData)
    }).catch(() => {/* show dashboard if onboarding fails */}).finally(() => setLoading(false))
  }, [clientUser])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (showComplete) {
    return <OnboardingCompleteScreen onEnter={() => setShowComplete(false)} />
  }

  if (!onboarding) {
    // If we can't fetch onboarding, just show the dashboard
    return <ClientDashboard />
  }

  const isComplete = onboarding.step1Questionnaire && onboarding.step2BrandGuide
    && onboarding.step3Package && onboarding.step4Checkout

  if (isComplete) return <ClientDashboard />

  return (
    <OnboardingFunnel
      onboarding={onboarding}
      packageTotal={packageTotal}
      upfrontDiscountPct={upfrontDiscountPct}
      adminCustomPkg={adminCustomPkg}
      onComplete={() => setShowComplete(true)}
    />
  )
}

// ── Main Export ──────────────────────────────────────────────────
export default function ClientPortal() {
  const { isClientAuthenticated } = useClientAuth()
  return isClientAuthenticated ? <OnboardingGate /> : <ClientLoginForm />
}

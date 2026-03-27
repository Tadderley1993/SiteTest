import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Save, Globe, User, Edit3,
  Instagram, Twitter, Linkedin, Facebook, Briefcase,
  KanbanSquare, Trash2, AlertCircle, DollarSign, Mail,
  MessageCircle, Send, Eye, EyeOff,
} from 'lucide-react'
import api, {
  Client, KanbanTask, ProjectScope,
  getClient, updateClient, updateProjectScope, deleteClient, ClientFormData,
  EmailTemplate, getEmailTemplates, sendEmailTemplate,
  updateJourneyPhase, JOURNEY_PHASES,
  AdminMessage, getClientMessages, sendAdminMessage,
} from '../../lib/api'
import KanbanBoard from './KanbanBoard'
import StandingSection from './StandingSection'
import DocumentManager from './DocumentManager'

interface Props {
  clientId: number
  onBack: () => void
  onDelete: () => void
}

type Section = 'profile' | 'scope' | 'kanban' | 'standing' | 'message' | 'chat'

export default function ClientProfile({ clientId, onBack, onDelete }: Props) {
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState<Section>('profile')

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<Partial<ClientFormData>>({})
  const [savingProfile, setSavingProfile] = useState(false)

  // Scope edit state
  const [isEditingScope, setIsEditingScope] = useState(false)
  const [scopeForm, setScopeForm] = useState<Partial<ProjectScope>>({})
  const [savingScope, setSavingScope] = useState(false)

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Portal access state
  const [showPortalForm, setShowPortalForm] = useState(false)
  const [portalPassword, setPortalPassword] = useState('')
  const [portalSaving, setPortalSaving] = useState(false)
  const [portalMsg, setPortalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Journey phase state
  const [journeyPhase, setJourneyPhase] = useState<string>('discovery')
  const [journeySaving, setJourneySaving] = useState(false)
  const [journeyMsg, setJourneyMsg] = useState('')

  // Message / email template state
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [templatesLoaded, setTemplatesLoaded] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('')
  const [msgVarValues, setMsgVarValues] = useState<Record<string, string>>({})
  const [msgSending, setMsgSending] = useState(false)
  const [msgResult, setMsgResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [agencyAutoFill, setAgencyAutoFill] = useState(true)

  const AGENCY_DEFAULTS: Record<string, string> = {
    agencyName:    'Designs By Terrence Adderley',
    agencyEmail:   'terrenceadderley@designsbyta.com',
    agencyWebsite: 'https://www.designsbyta.com',
    ctaUrl:        'https://www.designsbyta.com/contact',
  }

  // DM chat state
  const [chatMessages, setChatMessages] = useState<AdminMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [chatLoaded, setChatLoaded] = useState(false)
  const [showPortalPassword, setShowPortalPassword] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  const handleSetPortalPassword = async () => {
    if (!client) return
    if (portalPassword.length < 6) {
      setPortalMsg({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    setPortalSaving(true)
    setPortalMsg(null)
    try {
      await api.post(`/admin/clients/${client.id}/set-portal-password`, { password: portalPassword })
      setPortalMsg({ type: 'success', text: 'Portal access activated. Client can now log in.' })
      setPortalPassword('')
      setShowPortalForm(false)
    } catch {
      setPortalMsg({ type: 'error', text: 'Failed to set portal password' })
    } finally {
      setPortalSaving(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getClient(clientId)
        setClient(data)
        setProfileForm({
          firstName: data.firstName, lastName: data.lastName, title: data.title ?? '',
          email: data.email, phone: data.phone ?? '', website: data.website ?? '',
          organization: data.organization ?? '', instagram: data.instagram ?? '',
          twitter: data.twitter ?? '', linkedin: data.linkedin ?? '',
          facebook: data.facebook ?? '', notes: data.notes ?? '',
        })
        setScopeForm(data.projectScope ?? {})
        setJourneyPhase(data.journeyPhase ?? 'discovery')
      } catch {
        setError('Failed to load client')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [clientId])

  const handleSaveProfile = async () => {
    if (!client) return
    setSavingProfile(true)
    try {
      const updated = await updateClient(client.id, profileForm)
      setClient(updated)
      setIsEditingProfile(false)
    } catch {
      setError('Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveScope = async () => {
    if (!client) return
    setSavingScope(true)
    try {
      const scope = await updateProjectScope(client.id, scopeForm)
      setClient(prev => prev ? { ...prev, projectScope: scope } : prev)
      setIsEditingScope(false)
    } catch {
      setError('Failed to save project scope')
    } finally {
      setSavingScope(false)
    }
  }

  const handleJourneyPhaseChange = async (phase: string) => {
    if (!client) return
    setJourneyPhase(phase)
    setJourneySaving(true)
    setJourneyMsg('')
    try {
      await updateJourneyPhase(client.id, phase)
      setJourneyMsg('Saved')
      setTimeout(() => setJourneyMsg(''), 2000)
    } catch {
      setJourneyMsg('Failed to save')
    } finally {
      setJourneySaving(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!client) return
    try {
      await deleteClient(client.id)
      onDelete()
    } catch {
      setError('Failed to delete client')
    }
  }

  const handleTasksChange = (tasks: KanbanTask[]) => {
    setClient(prev => prev ? { ...prev, tasks } : prev)
  }

  // When switching to message tab, load templates once
  const handleOpenMessage = async () => {
    setActiveSection('message')
    setMsgResult(null)
    if (!templatesLoaded) {
      const tpls = await getEmailTemplates()
      setEmailTemplates(tpls)
      setTemplatesLoaded(true)
    }
  }

  // When switching to chat tab, load messages
  const handleOpenChat = async () => {
    setActiveSection('chat')
    if (!chatLoaded) {
      const msgs = await getClientMessages(clientId)
      setChatMessages(msgs)
      setChatLoaded(true)
    }
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatSending) return
    setChatSending(true)
    try {
      const msg = await sendAdminMessage(clientId, chatInput.trim())
      setChatMessages(prev => [...prev, msg])
      setChatInput('')
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } finally {
      setChatSending(false)
    }
  }

  // When a template is chosen, auto-fill client variables
  const handleTemplateSelect = (id: number | '') => {
    setSelectedTemplateId(id)
    setMsgResult(null)
    if (!id || !client) { setMsgVarValues({}); return }
    const tpl = emailTemplates.find(t => t.id === id)
    if (!tpl) return
    const combined = tpl.htmlContent + (tpl.cssContent ?? '')
    const vars = [...new Set([...combined.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]))]
    const fullName = `${client.firstName} ${client.lastName}`
    const clientMap: Record<string, string> = {
      clientName:        fullName,
      clientFirstName:   client.firstName,
      clientLastName:    client.lastName,
      firstName:         client.firstName,
      lastName:          client.lastName,
      name:              fullName,
      fullName:          fullName,
      recipientName:     fullName,
      toName:            fullName,
      clientEmail:       client.email,
      email:             client.email,
      phone:             client.phone ?? '',
      clientPhone:       client.phone ?? '',
      organization:      client.organization ?? '',
      company:           client.organization ?? '',
      clientCompany:     client.organization ?? '',
      businessName:      client.organization ?? '',
    }
    const prefilled: Record<string, string> = {}
    vars.forEach(v => {
      prefilled[v] = clientMap[v] ?? (agencyAutoFill ? (AGENCY_DEFAULTS[v] ?? '') : '')
    })
    setMsgVarValues(prefilled)
  }

  const handleSendMessage = async () => {
    if (!client || !selectedTemplateId) return
    setMsgSending(true)
    setMsgResult(null)
    try {
      await sendEmailTemplate(Number(selectedTemplateId), client.email, msgVarValues)
      setMsgResult({ type: 'success', text: `Email sent to ${client.email}` })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setMsgResult({ type: 'error', text: msg ?? 'Failed to send email' })
    } finally {
      setMsgSending(false)
    }
  }

  const pField = (key: keyof ClientFormData, label: string, type = 'text') => (
    <div>
      <label className="block text-xs text-zinc-500 mb-1">{label}</label>
      {isEditingProfile ? (
        <input
          type={type}
          value={(profileForm[key] as string) ?? ''}
          onChange={e => setProfileForm(p => ({ ...p, [key]: e.target.value }))}
          className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/10 text-sm transition-colors"
        />
      ) : (
        <p className="text-sm text-black py-2 border-b border-zinc-100">
          {(client as unknown as Record<string, string | undefined>)[key] || <span className="text-zinc-500">—</span>}
        </p>
      )}
    </div>
  )

  const sField = (key: keyof ProjectScope, label: string, textarea = false) => (
    <div>
      <label className="block text-xs text-zinc-500 mb-1">{label}</label>
      {isEditingScope ? (
        textarea ? (
          <textarea
            value={(scopeForm[key] as string) ?? ''}
            onChange={e => setScopeForm(s => ({ ...s, [key]: e.target.value }))}
            rows={3}
            className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/10 text-sm transition-colors resize-none"
          />
        ) : (
          <input
            type="text"
            value={(scopeForm[key] as string) ?? ''}
            onChange={e => setScopeForm(s => ({ ...s, [key]: e.target.value }))}
            className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/10 text-sm transition-colors"
          />
        )
      ) : (
        <p className="text-sm text-black py-2 border-b border-zinc-100 whitespace-pre-wrap">
          {(client?.projectScope as unknown as Record<string, string | undefined>)?.[key] || <span className="text-zinc-500">—</span>}
        </p>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-500">
        Loading client...
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex items-center justify-center py-24 text-red-500">
        {error || 'Client not found'}
      </div>
    )
  }

  const navItem = (section: Section, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveSection(section)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        activeSection === section
          ? 'bg-zinc-100 text-black border border-accent/20'
          : 'text-zinc-500 hover:text-black hover:bg-[#f3f3f3]'
      }`}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 hover:text-black transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </button>
          <div className="w-px h-4 bg-[#f3f3f3]" />
          <div>
            <h2 className="text-xl font-semibold text-black">
              {client.firstName} {client.lastName}
            </h2>
            {(client.title || client.organization) && (
              <p className="text-sm text-zinc-500">
                {client.title}{client.title && client.organization ? ' · ' : ''}{client.organization}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setShowPortalForm(p => !p); setPortalMsg(null) }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-accent/30 text-black hover:bg-zinc-100 transition-colors text-sm"
          >
            Portal Access
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-400/20 text-red-500 hover:bg-red-500/10 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Remove Client
          </button>
        </div>
      </div>

      {/* Portal Access Form */}
      {showPortalForm && (
        <div className="flex items-start gap-3 p-4 bg-black/5 border border-accent/20 rounded-xl">
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-black">
                Set portal password for <strong>{client?.firstName} {client?.lastName}</strong>
              </p>
              {(client as Client & { portalPasswordPlain?: string })?.portalPasswordPlain ? (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span>Current:</span>
                  <span className="font-mono bg-zinc-200 px-2 py-0.5 rounded">
                    {showPortalPassword
                      ? (client as Client & { portalPasswordPlain?: string }).portalPasswordPlain
                      : '••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPortalPassword(p => !p)}
                    className="text-zinc-400 hover:text-black transition-colors"
                  >
                    {showPortalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-zinc-400 italic">Password not yet created</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={portalPassword}
                onChange={e => setPortalPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="flex-1 bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/10 text-sm transition-colors"
              />
              <button
                type="button"
                onClick={handleSetPortalPassword}
                disabled={portalSaving}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {portalSaving ? 'Saving...' : 'Activate'}
              </button>
              <button
                type="button"
                onClick={() => { setShowPortalForm(false); setPortalMsg(null) }}
                className="px-3 py-2 text-zinc-500 hover:text-black text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
            {portalMsg && (
              <p className={`text-xs ${portalMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {portalMsg.text}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-400/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-black flex-1">
            Remove <strong>{client.firstName} {client.lastName}</strong> from current clients? This will also delete their project scope and all tasks.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(false)} className="text-sm text-zinc-500 hover:text-black px-3 py-1.5 transition-colors">Cancel</button>
            <button onClick={handleDeleteClient} className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">Delete</button>
          </div>
        </div>
      )}

      {/* Section nav */}
      <div className="flex gap-2 flex-wrap">
        {navItem('profile', 'Profile', <User className="w-4 h-4" />)}
        {navItem('scope', 'Project Scope', <Briefcase className="w-4 h-4" />)}
        {navItem('standing', 'Standing', <DollarSign className="w-4 h-4" />)}
        {navItem('kanban', 'Task Board', <KanbanSquare className="w-4 h-4" />)}
        <button
          onClick={handleOpenMessage}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'message'
              ? 'bg-zinc-100 text-black border border-accent/20'
              : 'text-zinc-500 hover:text-black hover:bg-[#f3f3f3]'
          }`}
        >
          <Mail className="w-4 h-4" />
          Email
        </button>
        <button
          onClick={handleOpenChat}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'chat'
              ? 'bg-zinc-100 text-black border border-accent/20'
              : 'text-zinc-500 hover:text-black hover:bg-[#f3f3f3]'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Chat
        </button>
      </div>

      {/* ── PROFILE SECTION ── */}
      {activeSection === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-black flex items-center gap-2">
                <User className="w-4 h-4 text-black" /> Contact Information
              </h3>
              {isEditingProfile ? (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingProfile(false)} className="text-sm text-zinc-500 hover:text-black px-3 py-1.5 transition-colors">Cancel</button>
                  <button onClick={handleSaveProfile} disabled={savingProfile} className="flex items-center gap-1.5 text-sm bg-black text-white px-4 py-1.5 rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors">
                    <Save className="w-3.5 h-3.5" />
                    {savingProfile ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-black transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {pField('firstName', 'First Name')}
              {pField('lastName', 'Last Name')}
              {pField('title', 'Title / Role')}
              {pField('organization', 'Organization')}
              {pField('email', 'Email', 'email')}
              {pField('phone', 'Phone')}
              {pField('website', 'Website', 'url')}
            </div>
          </div>

          <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-6">
            <h3 className="font-semibold text-black flex items-center gap-2 mb-6">
              <Globe className="w-4 h-4 text-black-secondary" /> Social Media
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 flex items-center gap-1.5"><Instagram className="w-3 h-3" />Instagram</label>
                {isEditingProfile ? (
                  <input value={profileForm.instagram ?? ''} onChange={e => setProfileForm(p => ({ ...p, instagram: e.target.value }))} className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/10 text-sm" />
                ) : (
                  <p className="text-sm text-black py-2 border-b border-zinc-100">{client.instagram || <span className="text-zinc-500">—</span>}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 flex items-center gap-1.5"><Twitter className="w-3 h-3" />Twitter / X</label>
                {isEditingProfile ? (
                  <input value={profileForm.twitter ?? ''} onChange={e => setProfileForm(p => ({ ...p, twitter: e.target.value }))} className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/10 text-sm" />
                ) : (
                  <p className="text-sm text-black py-2 border-b border-zinc-100">{client.twitter || <span className="text-zinc-500">—</span>}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 flex items-center gap-1.5"><Linkedin className="w-3 h-3" />LinkedIn</label>
                {isEditingProfile ? (
                  <input value={profileForm.linkedin ?? ''} onChange={e => setProfileForm(p => ({ ...p, linkedin: e.target.value }))} className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/10 text-sm" />
                ) : (
                  <p className="text-sm text-black py-2 border-b border-zinc-100">{client.linkedin || <span className="text-zinc-500">—</span>}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 flex items-center gap-1.5"><Facebook className="w-3 h-3" />Facebook</label>
                {isEditingProfile ? (
                  <input value={profileForm.facebook ?? ''} onChange={e => setProfileForm(p => ({ ...p, facebook: e.target.value }))} className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/10 text-sm" />
                ) : (
                  <p className="text-sm text-black py-2 border-b border-zinc-100">{client.facebook || <span className="text-zinc-500">—</span>}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-6">
            <h3 className="font-semibold text-black mb-4">Notes</h3>
            {isEditingProfile ? (
              <textarea
                value={profileForm.notes ?? ''}
                onChange={e => setProfileForm(p => ({ ...p, notes: e.target.value }))}
                rows={4}
                className="w-full bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/10 text-sm resize-none"
              />
            ) : (
              <p className="text-sm text-black whitespace-pre-wrap">
                {client.notes || <span className="text-zinc-500">No notes yet.</span>}
              </p>
            )}
          </div>

          {/* ── PROJECT JOURNEY ── */}
          <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-black flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">route</span>
                Project Journey
              </h3>
              <div className="flex items-center gap-2">
                {journeySaving && <span className="text-[11px] text-zinc-400">Saving…</span>}
                {journeyMsg && !journeySaving && (
                  <span className={`text-[11px] font-medium ${journeyMsg === 'Saved' ? 'text-green-600' : 'text-red-500'}`}>
                    {journeyMsg}
                  </span>
                )}
              </div>
            </div>

            {/* Phase stepper */}
            <div className="flex flex-col gap-2">
              {JOURNEY_PHASES.map((phase, i) => {
                const currentIdx = JOURNEY_PHASES.findIndex(p => p.id === journeyPhase)
                const isDone = i < currentIdx
                const isCurrent = phase.id === journeyPhase
                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => handleJourneyPhaseChange(phase.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                      isCurrent
                        ? 'bg-black text-white border-black'
                        : isDone
                        ? 'bg-zinc-100 border-zinc-200 text-zinc-400 line-through'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:border-black hover:bg-zinc-50'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 ${
                      isCurrent ? 'bg-white text-black' : isDone ? 'bg-zinc-300 text-zinc-500' : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      {isDone ? '✓' : i + 1}
                    </span>
                    <span className="text-sm font-medium">{phase.label}</span>
                    {isCurrent && (
                      <span className="ml-auto text-[10px] font-bold uppercase tracking-widest opacity-60">Current</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── PROJECT SCOPE SECTION ── */}
      {activeSection === 'scope' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-black flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-black" /> Project Scope
              </h3>
              {isEditingScope ? (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingScope(false)} className="text-sm text-zinc-500 hover:text-black px-3 py-1.5 transition-colors">Cancel</button>
                  <button onClick={handleSaveScope} disabled={savingScope} className="flex items-center gap-1.5 text-sm bg-black text-white px-4 py-1.5 rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors">
                    <Save className="w-3.5 h-3.5" />
                    {savingScope ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <button onClick={() => { setIsEditingScope(true); setScopeForm(client.projectScope ?? {}) }} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-black transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Project Status</label>
              {isEditingScope ? (
                <select
                  value={scopeForm.status ?? 'active'}
                  onChange={e => setScopeForm(s => ({ ...s, status: e.target.value }))}
                  className="bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-black focus:outline-none text-sm"
                >
                  <option value="active">Active</option>
                  <option value="onhold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              ) : (
                <span className={`inline-flex text-xs px-3 py-1 rounded-full font-medium ${
                  client.projectScope?.status === 'active' ? 'bg-green-500/10 text-green-600' :
                  client.projectScope?.status === 'completed' ? 'bg-zinc-100 text-black' :
                  client.projectScope?.status === 'onhold' ? 'bg-yellow-400/10 text-yellow-400' :
                  'bg-red-500/10 text-red-500'
                }`}>
                  {client.projectScope?.status ?? 'active'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {sField('projectName', 'Project Name')}
              {sField('projectType', 'Project Type')}
              {sField('services', 'Services / Scope')}
              {sField('budget', 'Budget')}
              {sField('startDate', 'Start Date')}
              {sField('endDate', 'End Date')}
              {sField('timeline', 'Timeline / Milestones')}
              {sField('techStack', 'Tech Stack')}
            </div>

            <div className="space-y-4">
              {sField('goals', 'Goals & Objectives', true)}
              {sField('targetAudience', 'Target Audience', true)}
              {sField('competitors', 'Competitors / References', true)}
              {sField('deliverables', 'Deliverables', true)}
              {sField('notes', 'Scope Notes', true)}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-6">
            <h3 className="font-semibold text-black mb-5 flex items-center gap-2">
              <span className="w-4 h-4 text-black">📁</span> Project Documents
            </h3>
            <DocumentManager clientId={client.id} />
          </div>
        </motion.div>
      )}

      {/* ── STANDING SECTION ── */}
      {activeSection === 'standing' && (
        <StandingSection clientId={client.id} />
      )}

      {/* ── KANBAN SECTION ── */}
      {activeSection === 'kanban' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-black flex items-center gap-2">
              <KanbanSquare className="w-4 h-4 text-black" /> Task Board
            </h3>
            <p className="text-xs text-zinc-500">{client.tasks.length} task{client.tasks.length !== 1 ? 's' : ''} total</p>
          </div>
          <KanbanBoard
            clientId={client.id}
            tasks={client.tasks}
            onTasksChange={handleTasksChange}
          />
        </motion.div>
      )}

      {/* ── MESSAGE SECTION ── */}
      {activeSection === 'message' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* ── Compose panel ── */}
          <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-black flex items-center gap-2">
                <Mail className="w-4 h-4 text-black" /> Send Email to {client.firstName} {client.lastName}
              </h3>
              {/* Agency auto-fill toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !agencyAutoFill
                  setAgencyAutoFill(next)
                  // Apply / remove agency defaults from current variable fields live
                  if (Object.keys(msgVarValues).length > 0) {
                    setMsgVarValues(prev => {
                      const updated = { ...prev }
                      Object.entries(AGENCY_DEFAULTS).forEach(([k, v]) => {
                        if (k in updated) updated[k] = next ? v : ''
                      })
                      return updated
                    })
                  }
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  agencyAutoFill
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  agencyAutoFill ? 'border-white bg-white' : 'border-zinc-400'
                }`}>
                  {agencyAutoFill && <span className="w-1.5 h-1.5 rounded-full bg-black block" />}
                </span>
                Auto-fill Agency Info
              </button>
            </div>

            <div className="space-y-4">
              {/* Template selector */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Email Template</label>
                {!templatesLoaded ? (
                  <p className="text-sm text-zinc-400">Loading templates…</p>
                ) : emailTemplates.length === 0 ? (
                  <p className="text-sm text-zinc-400">No email templates found. Create one in <strong>Email Templates</strong>.</p>
                ) : (
                  <select
                    value={selectedTemplateId}
                    onChange={e => { handleTemplateSelect(e.target.value === '' ? '' : Number(e.target.value)); setShowEmailPreview(false) }}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    <option value="">— Select a template —</option>
                    {emailTemplates.map(t => (
                      <option key={t.id} value={t.id}>
                        [{t.category.charAt(0).toUpperCase() + t.category.slice(1)}] {t.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedTemplateId !== '' && (() => {
                const tpl = emailTemplates.find(t => t.id === selectedTemplateId)
                if (!tpl) return null
                const subjectPreview = tpl.subject.replace(/\{\{(\w+)\}\}/g, (_, k) => msgVarValues[k] ?? `{{${k}}}`)

                // Long-text fields rendered as textarea
                const LONG_TEXT_KEYS = ['message', 'ctaText', 'body', 'notes', 'executiveSummary',
                  'clientNeeds', 'proposedSolution', 'projectScope', 'deliverables',
                  'timeline', 'paymentTerms', 'termsConditions', 'description']

                return (
                  <>
                    {/* Recipient + subject */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">Sending To</label>
                        <p className="text-sm text-black bg-white border border-zinc-200 rounded-lg px-3 py-2">{client.email}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">Subject</label>
                        <p className="text-sm text-black bg-white border border-zinc-200 rounded-lg px-3 py-2 italic truncate">{subjectPreview}</p>
                      </div>
                    </div>

                    {/* Variable fields */}
                    {Object.keys(msgVarValues).length > 0 && (
                      <div>
                        <label className="block text-xs text-zinc-500 mb-3">Personalize Message</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(msgVarValues).map(([key, val]) => {
                            const isLong = LONG_TEXT_KEYS.includes(key)
                            const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
                            return (
                              <div key={key} className={isLong ? 'sm:col-span-2' : ''}>
                                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{label}</label>
                                {isLong ? (
                                  <textarea
                                    value={val}
                                    onChange={e => setMsgVarValues(prev => ({ ...prev, [key]: e.target.value }))}
                                    placeholder={`{{${key}}}`}
                                    rows={5}
                                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 resize-y"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={val}
                                    onChange={e => setMsgVarValues(prev => ({ ...prev, [key]: e.target.value }))}
                                    placeholder={`{{${key}}}`}
                                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                                  />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 pt-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setShowEmailPreview(p => !p)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-black rounded-lg text-sm font-semibold hover:bg-zinc-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        {showEmailPreview ? 'Hide Preview' : 'Preview Email'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={msgSending}
                        className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                      >
                        {msgSending && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                        <Mail className="w-4 h-4" />
                        {msgSending ? 'Sending…' : 'Send Email'}
                      </button>
                      {msgResult && (
                        <p className={`text-sm font-medium ${msgResult.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                          {msgResult.text}
                        </p>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>

          {/* ── Email preview panel ── */}
          {showEmailPreview && selectedTemplateId !== '' && (() => {
            const tpl = emailTemplates.find(t => t.id === selectedTemplateId)
            if (!tpl) return null
            const rendered = (`<style>${tpl.cssContent ?? ''}</style>${tpl.htmlContent}`)
              .replace(/\{\{(\w+)\}\}/g, (_, k) => msgVarValues[k] ?? `<span style="background:#fef08a;color:#713f12;padding:0 2px;border-radius:2px">{{${k}}}</span>`)
            return (
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 bg-[#f3f3f3]">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-semibold text-black">Email Preview</span>
                    <span className="text-xs text-zinc-400">— unfilled tokens highlighted in yellow</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEmailPreview(false)}
                    className="text-zinc-400 hover:text-black transition-colors text-lg leading-none"
                  >×</button>
                </div>
                <div className="overflow-auto" style={{ maxHeight: '600px' }}>
                  <iframe
                    srcDoc={rendered}
                    title="Email Preview"
                    className="w-full border-none"
                    style={{ height: '600px' }}
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )
          })()}
        </motion.div>
      )}

      {/* ── CHAT SECTION ── */}
      {activeSection === 'chat' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl overflow-hidden flex flex-col" style={{ height: '520px' }}>
            {/* Header */}
            <div className="px-5 py-3 border-b border-zinc-200 bg-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-black" />
              <h3 className="font-semibold text-black text-sm">Direct Message — {client.firstName} {client.lastName}</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-zinc-400">
                  No messages yet. Start the conversation.
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-0.5 ${msg.fromAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] font-medium text-zinc-400 px-1">
                      {msg.fromAdmin ? 'You' : `${client.firstName} ${client.lastName}`}
                    </span>
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.fromAdmin
                          ? 'bg-black text-white rounded-br-sm'
                          : 'bg-white border border-zinc-200 text-black rounded-bl-sm'
                      }`}
                    >
                      <p>{msg.body}</p>
                      <p className={`text-[10px] mt-1 ${msg.fromAdmin ? 'text-white/50' : 'text-zinc-400'}`}>
                        {new Date(msg.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-zinc-200 bg-white flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat() } }}
                placeholder={`Message ${client.firstName}…`}
                className="flex-1 bg-[#f3f3f3] border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-colors"
              />
              <button
                type="button"
                onClick={handleSendChat}
                disabled={chatSending || !chatInput.trim()}
                className="px-3 py-2 bg-black text-white rounded-lg hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

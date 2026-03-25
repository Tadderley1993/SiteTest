import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Save, Globe, User, Edit3,
  Instagram, Twitter, Linkedin, Facebook, Briefcase,
  KanbanSquare, Trash2, AlertCircle, DollarSign
} from 'lucide-react'
import api, {
  Client, KanbanTask, ProjectScope,
  getClient, updateClient, updateProjectScope, deleteClient, ClientFormData
} from '../../lib/api'
import KanbanBoard from './KanbanBoard'
import StandingSection from './StandingSection'
import DocumentManager from './DocumentManager'

interface Props {
  clientId: number
  onBack: () => void
  onDelete: () => void
}

type Section = 'profile' | 'scope' | 'kanban' | 'standing'

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
            <p className="text-sm font-medium text-black">
              Set portal password for <strong>{client?.firstName} {client?.lastName}</strong>
            </p>
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
    </motion.div>
  )
}

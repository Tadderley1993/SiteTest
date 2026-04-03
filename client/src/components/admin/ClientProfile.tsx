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
import { ALA_CARTE, type AlaCarteItem } from '../../data/pricingTiers'
import KanbanBoard from './KanbanBoard'
import StandingSection from './StandingSection'
import DocumentManager from './DocumentManager'

const ALL_SERVICES = [
  { id: 'website',   label: 'Website Development' },
  { id: 'mobile',    label: 'Mobile Development' },
  { id: 'brand',     label: 'Brand Identity' },
  { id: 'revamp',    label: 'Identity Revamp' },
  { id: 'marketing', label: 'Marketing Material' },
  { id: 'seo',       label: 'SEO Optimization' },
]

const DISCOVERY_SECTIONS = [
  { key: 'section1', title: 'About Your Business', questions: [
    { id: 'businessName', label: 'Business name' },
    { id: 'industry', label: 'Industry / niche' },
    { id: 'description', label: 'Business description' },
    { id: 'uniqueValue', label: 'Unique value / differentiator' },
  ]},
  { key: 'section2', title: 'Goals & Objectives', questions: [
    { id: 'primaryGoal', label: 'Primary goal for the website' },
    { id: 'successLook', label: 'What success looks like in 6 months' },
    { id: 'currentPain', label: 'Current pain points' },
  ]},
  { key: 'section3', title: 'Your Audience', questions: [
    { id: 'targetAudience', label: 'Ideal customer profile' },
    { id: 'audienceNeeds', label: 'Audience pain points / desires' },
    { id: 'howTheyFind', label: 'How they currently find you' },
  ]},
  { key: 'section4', title: 'Brand Identity & Visual Style', questions: [
    { id: 'brandPersonality', label: 'Brand personality' },
    { id: 'colors', label: 'Brand colors' },
    { id: 'fonts', label: 'Typography preferences' },
    { id: 'existingAssets', label: 'Existing logo / brand assets' },
  ]},
  { key: 'section5', title: 'Website Vision', questions: [
    { id: 'mustHavePages', label: 'Must-have pages' },
    { id: 'keyFeatures', label: 'Key features needed' },
    { id: 'callToAction', label: 'Primary call to action' },
  ]},
  { key: 'section6', title: 'Design Inspiration', questions: [
    { id: 'likedSites', label: 'Sites they love and why' },
    { id: 'dislikedSites', label: 'Sites they dislike and why' },
    { id: 'styleKeywords', label: 'Style keywords' },
  ]},
  { key: 'section7', title: 'Mobile & User Experience', questions: [
    { id: 'mobileImportance', label: 'Importance of mobile' },
    { id: 'userJourney', label: 'Ideal visitor journey' },
  ]},
  { key: 'section8', title: 'Content & Messaging', questions: [
    { id: 'copyReady', label: 'Copy ready?' },
    { id: 'imagesReady', label: 'Professional photos?' },
    { id: 'headline', label: 'Main message for visitors' },
  ]},
  { key: 'section9', title: 'SEO & Growth', questions: [
    { id: 'seoImportance', label: 'Importance of SEO' },
    { id: 'targetKeywords', label: 'Target keywords' },
    { id: 'socialMedia', label: 'Active social platforms' },
  ]},
  { key: 'section10', title: 'Technical Details', questions: [
    { id: 'existingDomain', label: 'Existing domain' },
    { id: 'hosting', label: 'Hosting preference' },
    { id: 'integrations', label: 'Required integrations' },
  ]},
  { key: 'section11', title: 'Timeline & Budget', questions: [
    { id: 'launchDate', label: 'Target launch date' },
    { id: 'hardDeadline', label: 'Deadline flexibility' },
    { id: 'budget', label: 'Budget range' },
  ]},
  { key: 'section12', title: 'Collaboration & Expectations', questions: [
    { id: 'involvement', label: 'Desired involvement level' },
    { id: 'revisions', label: 'Expected revision rounds' },
    { id: 'communicationPref', label: 'Preferred communication' },
  ]},
  { key: 'section13', title: 'Final Vision', questions: [
    { id: 'dreamOutcome', label: 'Dream outcome (10/10 success)' },
    { id: 'anythingElse', label: 'Anything else' },
  ]},
]

interface Props {
  clientId: number
  onBack: () => void
  onDelete: () => void
}

type Section = 'profile' | 'scope' | 'kanban' | 'standing' | 'message' | 'chat' | 'discovery' | 'package'

interface OnboardingAdminData {
  onboarding: {
    step1Questionnaire: boolean
    step2BrandGuide: boolean
    step3Package: boolean
    step4Checkout: boolean
    completedAt: string | null
  } | null
  packageSelection: {
    tier: string
    lineItems: string
    subtotal: number
    total: number
    notes: string | null
    proposalId: number | null
    signingToken: string | null
    createdAt: string
  } | null
}

interface CustomPackageItem {
  serviceId: string
  label: string
  description: string
  category: string
  qty: number
  unitPrice: number
  amount: number
  pages?: Array<{ id: string; title: string }>
}

interface AdminCustomPkg {
  enabled: boolean
  lineItems: CustomPackageItem[]
  subtotal: number
  discountPct: number
  total: number
  notes: string | null
  paymentTerms?: string | null
  bundleName?: string | null
  bundleType?: string | null
  bundleExpiresAt?: string | null
}

interface PromoItem {
  id: string
  name: string
  description: string
  qty: number
  unitPrice: number
}

interface PromoCategory {
  id: string
  name: string
  items: PromoItem[]
}

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
  const [skipOnboarding, setSkipOnboarding] = useState(false)
  const [skipOnboardingSaving, setSkipOnboardingSaving] = useState(false)

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

  // Discovery questionnaire state
  const [discoveryData, setDiscoveryData] = useState<Record<string, unknown> | null>(null)
  const [discoveryLoaded, setDiscoveryLoaded] = useState(false)

  // Package / onboarding state
  const [onboardingAdminData, setOnboardingAdminData] = useState<OnboardingAdminData | null>(null)
  const [packageLoaded, setPackageLoaded] = useState(false)
  const [stepOverriding, setStepOverriding] = useState<string | null>(null)

  // Discount state
  const [upfrontDiscountPct, setUpfrontDiscountPct] = useState(0)
  const [discountSaving, setDiscountSaving] = useState(false)
  const [discountMsg, setDiscountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Custom package state
  const [, setCustomPkg] = useState<AdminCustomPkg | null>(null)
  const [, setCustomLoaded] = useState(false)
  const [customEnabled, setCustomEnabled] = useState(false)
  const [customSelectedIds, setCustomSelectedIds] = useState<Set<string>>(new Set())
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({})
  const [customDiscountPct, setCustomDiscountPct] = useState(0)
  const [customManualTotal, setCustomManualTotal] = useState<number | ''>('')
  const [customUseManual, setCustomUseManual] = useState(false)
  const [customPages, setCustomPages] = useState<Array<{ id: string; title: string }>>([])
  const [customNotes, setCustomNotes] = useState('')
  const [customScheduleEnabled, setCustomScheduleEnabled] = useState(false)
  const [customUpfrontType, setCustomUpfrontType] = useState<'percent' | 'amount'>('percent')
  const [customUpfrontValue, setCustomUpfrontValue] = useState<number | ''>(30)
  const [customInstallments, setCustomInstallments] = useState<number | ''>(3)
  const [customFrequency, setCustomFrequency] = useState<'weekly' | 'biweekly' | 'monthly' | 'yearly'>('monthly')
  const [customSaving, setCustomSaving] = useState(false)
  const [customMsg, setCustomMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Package sub-tab
  const [pkgSubTab, setPkgSubTab] = useState<'catalog' | 'promo'>('catalog')

  // Promo bundle state
  const [promoBundleName, setPromoBundleName] = useState('')
  const [promoCategories, setPromoCategories] = useState<PromoCategory[]>([])
  const [promoEnabled, setPromoEnabled] = useState(false)
  const [promoDiscountPct, setPromoDiscountPct] = useState(0)
  const [promoManualTotal, setPromoManualTotal] = useState<number | ''>('')
  const [promoUseManual, setPromoUseManual] = useState(false)
  const [promoNotes, setPromoNotes] = useState('')
  const [promoScheduleEnabled, setPromoScheduleEnabled] = useState(false)
  const [promoUpfrontType, setPromoUpfrontType] = useState<'percent' | 'amount'>('percent')
  const [promoUpfrontValue, setPromoUpfrontValue] = useState<number | ''>(30)
  const [promoInstallments, setPromoInstallments] = useState<number | ''>(3)
  const [promoFrequency, setPromoFrequency] = useState<'weekly' | 'biweekly' | 'monthly' | 'yearly'>('monthly')
  const [promoExpiresAt, setPromoExpiresAt] = useState('')
  const [promoSaving, setPromoSaving] = useState(false)
  const [promoMsg, setPromoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showPromoPreview, setShowPromoPreview] = useState(false)
  const [copyConfirm, setCopyConfirm] = useState(false)

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
        setUpfrontDiscountPct(Number((data as unknown as Record<string, unknown>).upfrontDiscountPct ?? 0))
        setSkipOnboarding(Boolean((data as unknown as Record<string, unknown>).skipOnboarding))
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

  const handleOpenDiscovery = async () => {
    setActiveSection('discovery')
    if (!discoveryLoaded) {
      try {
        const res = await api.get(`/admin/clients/${clientId}/questionnaire`)
        setDiscoveryData(res.data)
      } catch { /* silent */ } finally {
        setDiscoveryLoaded(true)
      }
    }
  }

  const handleOpenPackage = async () => {
    setActiveSection('package')
    if (!packageLoaded) {
      try {
        const [onbRes, custRes] = await Promise.all([
          api.get(`/admin/clients/${clientId}/onboarding`),
          api.get(`/admin/clients/${clientId}/custom-package`),
        ])
        setOnboardingAdminData(onbRes.data)
        if (custRes.data) {
          const pkg = custRes.data as AdminCustomPkg & { lineItems: string | CustomPackageItem[] }
          const items: CustomPackageItem[] = typeof pkg.lineItems === 'string'
            ? JSON.parse(pkg.lineItems) : pkg.lineItems
          setCustomPkg({ ...pkg, lineItems: items })
          setCustomEnabled(pkg.enabled)
          if (items.length > 0) {
            setCustomSelectedIds(new Set(items.map(i => i.serviceId)))
            setCustomPrices(Object.fromEntries(items.map(i => [i.serviceId, i.unitPrice])))
            const pageItem = items.find(i => i.serviceId === 'standard_page')
            if (pageItem?.pages) setCustomPages(pageItem.pages)
          }
          setCustomDiscountPct(Number(pkg.discountPct ?? 0))
          setCustomNotes(pkg.notes ?? '')
          const pt = (pkg as AdminCustomPkg & { paymentTerms?: string }).paymentTerms
          if (pt) {
            try {
              const s = JSON.parse(pt) as { upfrontType?: string; upfront?: number; installments?: number; frequency?: string }
              if (s && typeof s.upfront === 'number') {
                setCustomScheduleEnabled(true)
                setCustomUpfrontType((s.upfrontType as 'percent' | 'amount') ?? 'percent')
                setCustomUpfrontValue(s.upfront)
                setCustomInstallments(s.installments ?? 3)
                setCustomFrequency((s.frequency as 'weekly' | 'biweekly' | 'monthly' | 'yearly') ?? 'monthly')
              }
            } catch { /* not structured */ }
          }
          if (pkg.discountPct === 0 && pkg.total !== pkg.subtotal) {
            setCustomUseManual(true)
            setCustomManualTotal(pkg.total)
          }

          // Restore promo bundle state if bundleType is 'promo'
          const raw = custRes.data as AdminCustomPkg & { bundleType?: string; bundleName?: string; bundleExpiresAt?: string }
          if (raw.bundleType === 'promo') {
            setPkgSubTab('promo')
            setPromoBundleName(raw.bundleName ?? '')
            setPromoEnabled(raw.enabled)
            setPromoExpiresAt(raw.bundleExpiresAt ? raw.bundleExpiresAt.slice(0, 10) : '')
            const catMap = new Map<string, PromoItem[]>()
            items.forEach(item => {
              const cat = item.category ?? 'General'
              if (!catMap.has(cat)) catMap.set(cat, [])
              catMap.get(cat)!.push({ id: crypto.randomUUID(), name: item.label, description: item.description ?? '', qty: item.qty, unitPrice: item.unitPrice })
            })
            setPromoCategories(Array.from(catMap.entries()).map(([name, pitems]) => ({ id: crypto.randomUUID(), name, items: pitems })))
            setPromoDiscountPct(Number(pkg.discountPct ?? 0))
            setPromoNotes(pkg.notes ?? '')
            if (pkg.discountPct === 0 && pkg.total !== pkg.subtotal) {
              setPromoUseManual(true)
              setPromoManualTotal(pkg.total)
            }
            if (pt) {
              try {
                const s = JSON.parse(pt) as { upfrontType?: string; upfront?: number; installments?: number; frequency?: string }
                if (s && typeof s.upfront === 'number') {
                  setPromoScheduleEnabled(true)
                  setPromoUpfrontType((s.upfrontType as 'percent' | 'amount') ?? 'percent')
                  setPromoUpfrontValue(s.upfront)
                  setPromoInstallments(s.installments ?? 3)
                  setPromoFrequency((s.frequency as 'weekly' | 'biweekly' | 'monthly' | 'yearly') ?? 'monthly')
                }
              } catch { /* ignore */ }
            }
          } else {
            setPkgSubTab('catalog')
          }
        }
      } catch { /* silent */ } finally {
        setPackageLoaded(true)
        setCustomLoaded(true)
      }
    }
  }

  const handleStepOverride = async (step: string, value: boolean) => {
    setStepOverriding(step)
    try {
      const res = await api.put(`/admin/clients/${clientId}/onboarding`, { step, value })
      setOnboardingAdminData(prev => prev ? { ...prev, onboarding: res.data.onboarding } : prev)
    } catch { /* silent */ } finally {
      setStepOverriding(null)
    }
  }

  const handleSaveDiscount = async () => {
    if (!client) return
    setDiscountSaving(true)
    setDiscountMsg(null)
    try {
      await api.put(`/admin/clients/${clientId}/discount`, { upfrontDiscountPct })
      setDiscountMsg({ type: 'success', text: 'Discount saved.' })
      setTimeout(() => setDiscountMsg(null), 2500)
    } catch {
      setDiscountMsg({ type: 'error', text: 'Failed to save discount.' })
    } finally {
      setDiscountSaving(false)
    }
  }

  const handleSaveCustomPackage = async () => {
    setCustomSaving(true)
    setCustomMsg(null)
    try {
      const selectedItems: CustomPackageItem[] = ALA_CARTE
        .filter((s: AlaCarteItem) => customSelectedIds.has(s.id))
        .map((s: AlaCarteItem) => {
          const price = customPrices[s.id] ?? s.price
          if (s.id === 'standard_page') {
            const qty = customPages.length || 1
            return { serviceId: s.id, label: s.label, description: s.description, category: s.category, qty, unitPrice: price, amount: qty * price, pages: customPages }
          }
          return { serviceId: s.id, label: s.label, description: s.description, category: s.category, qty: 1, unitPrice: price, amount: price }
        })
      const subtotal = selectedItems.reduce((sum, i) => sum + i.amount, 0)
      const discountAmt = Math.round(subtotal * (customDiscountPct / 100) * 100) / 100
      const total = customUseManual && customManualTotal !== ''
        ? Number(customManualTotal)
        : Math.round((subtotal - discountAmt) * 100) / 100
      const res = await api.put(`/admin/clients/${clientId}/custom-package`, {
        enabled: customEnabled,
        lineItems: selectedItems,
        subtotal,
        discountPct: customUseManual ? 0 : customDiscountPct,
        total,
        notes: customNotes || null,
        paymentTerms: customScheduleEnabled && customUpfrontValue !== '' && customInstallments !== ''
          ? JSON.stringify({ upfrontType: customUpfrontType, upfront: Number(customUpfrontValue), installments: Number(customInstallments), frequency: customFrequency })
          : null,
        bundleType: 'catalog',
        bundleName: null,
        bundleExpiresAt: null,
      })
      const pkg = res.data as AdminCustomPkg & { lineItems: string | CustomPackageItem[] }
      const items: CustomPackageItem[] = typeof pkg.lineItems === 'string' ? JSON.parse(pkg.lineItems) : pkg.lineItems
      setCustomPkg({ ...pkg, lineItems: items })
      setCustomMsg({ type: 'success', text: 'Custom package saved.' })
      setTimeout(() => setCustomMsg(null), 3000)
    } catch {
      setCustomMsg({ type: 'error', text: 'Failed to save custom package.' })
    } finally {
      setCustomSaving(false)
    }
  }

  const handleToggleSkipOnboarding = async (val: boolean) => {
    setSkipOnboardingSaving(true)
    try {
      await api.put(`/admin/clients/${clientId}/skip-onboarding`, { skipOnboarding: val })
      setSkipOnboarding(val)
    } catch { /* silent */ } finally {
      setSkipOnboardingSaving(false)
    }
  }

  // ── Mutual exclusivity ─────────────────────────────────────────────────────
  const handleSetCustomEnabled = (val: boolean) => { setCustomEnabled(val); if (val) setPromoEnabled(false) }
  const handleSetPromoEnabled  = (val: boolean) => { setPromoEnabled(val);  if (val) setCustomEnabled(false) }

  // ── Promo category / item CRUD ──────────────────────────────────────────────
  const addPromoCategory = () =>
    setPromoCategories(prev => [...prev, { id: crypto.randomUUID(), name: '', items: [] }])

  const updatePromoCategoryName = (catId: string, name: string) =>
    setPromoCategories(prev => prev.map(c => c.id === catId ? { ...c, name } : c))

  const deletePromoCategory = (catId: string) =>
    setPromoCategories(prev => prev.filter(c => c.id !== catId))

  const addPromoItem = (catId: string) =>
    setPromoCategories(prev => prev.map(c => c.id === catId
      ? { ...c, items: [...c.items, { id: crypto.randomUUID(), name: '', description: '', qty: 1, unitPrice: 0 }] }
      : c))

  const updatePromoItem = (catId: string, itemId: string, patch: Partial<PromoItem>) =>
    setPromoCategories(prev => prev.map(c => c.id === catId
      ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, ...patch } : i) }
      : c))

  const deletePromoItem = (catId: string, itemId: string) =>
    setPromoCategories(prev => prev.map(c => c.id === catId
      ? { ...c, items: c.items.filter(i => i.id !== itemId) }
      : c))

  // ── Copy catalog items → promo builder ─────────────────────────────────────
  const handleCopyFromCatalog = () => {
    const catalogItems: CustomPackageItem[] = ALA_CARTE
      .filter((s: AlaCarteItem) => customSelectedIds.has(s.id))
      .map((s: AlaCarteItem) => {
        const price = customPrices[s.id] ?? s.price
        if (s.id === 'standard_page') {
          return { serviceId: s.id, label: s.label, description: s.description, category: s.category, qty: customPages.length || 1, unitPrice: price, amount: (customPages.length || 1) * price }
        }
        return { serviceId: s.id, label: s.label, description: s.description, category: s.category, qty: 1, unitPrice: price, amount: price }
      })
    const catMap = new Map<string, PromoItem[]>()
    catalogItems.forEach(item => {
      const cat = item.category ?? 'General'
      if (!catMap.has(cat)) catMap.set(cat, [])
      catMap.get(cat)!.push({ id: crypto.randomUUID(), name: item.label, description: item.description ?? '', qty: item.qty, unitPrice: item.unitPrice })
    })
    setPromoCategories(Array.from(catMap.entries()).map(([name, pitems]) => ({ id: crypto.randomUUID(), name, items: pitems })))
    setCopyConfirm(false)
  }

  // ── Save promo bundle ───────────────────────────────────────────────────────
  const handleSavePromoBundle = async () => {
    setPromoSaving(true)
    setPromoMsg(null)
    try {
      const lineItems: CustomPackageItem[] = promoCategories.flatMap(cat =>
        cat.items.map(item => ({
          serviceId: `promo_${crypto.randomUUID()}`,
          label: item.name,
          description: item.description,
          category: cat.name,
          qty: item.qty,
          unitPrice: item.unitPrice,
          amount: item.qty * item.unitPrice,
        }))
      )
      const subtotal = lineItems.reduce((sum, i) => sum + i.amount, 0)
      const discountAmt = Math.round(subtotal * (promoDiscountPct / 100) * 100) / 100
      const total = promoUseManual && promoManualTotal !== ''
        ? Number(promoManualTotal)
        : Math.round((subtotal - discountAmt) * 100) / 100
      await api.put(`/admin/clients/${clientId}/custom-package`, {
        enabled: promoEnabled,
        lineItems,
        subtotal,
        discountPct: promoUseManual ? 0 : promoDiscountPct,
        total,
        notes: promoNotes || null,
        paymentTerms: promoScheduleEnabled && promoUpfrontValue !== '' && promoInstallments !== ''
          ? JSON.stringify({ upfrontType: promoUpfrontType, upfront: Number(promoUpfrontValue), installments: Number(promoInstallments), frequency: promoFrequency })
          : null,
        bundleName: promoBundleName.trim() || null,
        bundleType: 'promo',
        bundleExpiresAt: promoExpiresAt || null,
      })
      setPromoMsg({ type: 'success', text: 'Promo bundle saved.' })
      setTimeout(() => setPromoMsg(null), 3000)
    } catch {
      setPromoMsg({ type: 'error', text: 'Failed to save promo bundle.' })
    } finally {
      setPromoSaving(false)
    }
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
            {/* Skip onboarding toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-black/10">
              <div>
                <p className="text-sm font-medium text-black">Skip onboarding funnel</p>
                <p className="text-xs text-zinc-400 mt-0.5">Client goes directly to the dashboard — no questionnaire, brand guide, or checkout required.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSkipOnboarding(!skipOnboarding)}
                disabled={skipOnboardingSaving}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${skipOnboarding ? 'bg-black' : 'bg-zinc-300'} disabled:opacity-50`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${skipOnboarding ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
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
        <button
          onClick={handleOpenDiscovery}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'discovery'
              ? 'bg-zinc-100 text-black border border-accent/20'
              : 'text-zinc-500 hover:text-black hover:bg-[#f3f3f3]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">assignment</span>
          Discovery
        </button>
        <button
          onClick={handleOpenPackage}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'package'
              ? 'bg-zinc-100 text-black border border-accent/20'
              : 'text-zinc-500 hover:text-black hover:bg-[#f3f3f3]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">package_2</span>
          Package
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

          {/* ── BILLING SETTINGS ── */}
          <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-black flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Billing Settings
              </h3>
              {discountMsg && (
                <span className={`text-xs font-medium ${discountMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {discountMsg.text}
                </span>
              )}
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1 max-w-xs">
                <label className="block text-xs text-zinc-500 mb-1">Pay-in-Full Discount (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={upfrontDiscountPct}
                  onChange={e => setUpfrontDiscountPct(Number(e.target.value))}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                />
                <p className="text-[11px] text-zinc-400 mt-1">Applied when client selects "Pay in Full" in checkout (e.g. 5 = 5% off)</p>
              </div>
              <button
                type="button"
                onClick={handleSaveDiscount}
                disabled={discountSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {discountSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
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

      {/* ── PACKAGE SECTION ── */}
      {activeSection === 'package' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {!packageLoaded ? (
            <div className="text-sm text-zinc-400 py-12 text-center">Loading package data…</div>
          ) : (
            <>
              {/* Sub-tab switcher */}
              <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl w-fit border border-zinc-200">
                <button type="button" onClick={() => setPkgSubTab('catalog')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${pkgSubTab === 'catalog' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-black'}`}>
                  Custom Package
                </button>
                <button type="button" onClick={() => setPkgSubTab('promo')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${pkgSubTab === 'promo' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-black'}`}>
                  Promo Bundle
                </button>
              </div>

              {/* ── CATALOG BUILDER (existing) ── */}
              {pkgSubTab === 'catalog' && <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-black flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                    Custom Package
                  </h3>
                  <div className="flex items-center gap-3">
                    {customMsg && (
                      <span className={`text-xs font-medium ${customMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                        {customMsg.text}
                      </span>
                    )}
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => handleSetCustomEnabled(!customEnabled)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${customEnabled ? 'bg-black' : 'bg-zinc-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${customEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {!customEnabled ? (
                  <p className="text-sm text-zinc-400">
                    Toggle on to build a custom package for this client. When enabled, the client will only see their custom package during onboarding — not the standard tiers.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {/* Service list grouped by category */}
                    {(() => {
                      const categories = [...new Set(ALA_CARTE.map((s: AlaCarteItem) => s.category))]
                      return categories.map(cat => (
                        <div key={cat}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">{cat}</p>
                          <div className="space-y-1">
                            {ALA_CARTE.filter((s: AlaCarteItem) => s.category === cat).map((svc: AlaCarteItem) => {
                              const checked = customSelectedIds.has(svc.id)
                              const price = customPrices[svc.id] ?? svc.price
                              const isPageSvc = svc.id === 'standard_page'
                              return (
                                <div key={svc.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${checked ? 'bg-white border-zinc-300' : 'bg-white/50 border-transparent'}`}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={e => {
                                      if (isPageSvc) {
                                        if (e.target.checked) {
                                          setCustomSelectedIds(prev => { const n = new Set(prev); n.add(svc.id); return n })
                                          if (customPages.length === 0) setCustomPages([{ id: crypto.randomUUID(), title: '' }])
                                        } else {
                                          setCustomSelectedIds(prev => { const n = new Set(prev); n.delete(svc.id); return n })
                                          setCustomPages([])
                                        }
                                      } else {
                                        setCustomSelectedIds(prev => {
                                          const next = new Set(prev)
                                          e.target.checked ? next.add(svc.id) : next.delete(svc.id)
                                          return next
                                        })
                                      }
                                    }}
                                    className="w-4 h-4 rounded accent-black flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-black leading-tight">{svc.label}</p>
                                    <p className="text-[11px] text-zinc-400 leading-tight">
                                      {isPageSvc ? `$${price}/page — add page titles below` : svc.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className="text-zinc-400 text-sm">$</span>
                                    <input
                                      type="number"
                                      min={0}
                                      value={price}
                                      disabled={!checked}
                                      onChange={e => setCustomPrices(prev => ({ ...prev, [svc.id]: Number(e.target.value) }))}
                                      className="w-20 text-right text-sm font-medium border border-zinc-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-black/20 disabled:opacity-30 disabled:cursor-not-allowed"
                                    />
                                    {isPageSvc && checked && <span className="text-[11px] text-zinc-400">/pg</span>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))
                    })()}

                    {/* Standard Page builder */}
                    {customPages.length > 0 && (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-black uppercase tracking-wide">Standard Pages</p>
                          <span className="text-[11px] text-zinc-400">{customPages.length} page{customPages.length !== 1 ? 's' : ''} × ${customPrices['standard_page'] ?? 400}/ea</span>
                        </div>
                        <div className="space-y-2">
                          {customPages.map((pg, idx) => (
                            <div key={pg.id} className="flex items-center gap-2">
                              <span className="text-[11px] text-zinc-400 w-5 text-right flex-shrink-0">{idx + 1}.</span>
                              <input
                                type="text"
                                value={pg.title}
                                onChange={e => setCustomPages(prev => prev.map(p => p.id === pg.id ? { ...p, title: e.target.value } : p))}
                                placeholder={`Page ${idx + 1} title (e.g. About Us)`}
                                className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black/20 bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomPages(prev => {
                                    const next = prev.filter(p => p.id !== pg.id)
                                    if (next.length === 0) {
                                      setCustomSelectedIds(ids => { const n = new Set(ids); n.delete('standard_page'); return n })
                                    }
                                    return next
                                  })
                                }}
                                className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded flex-shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setCustomPages(prev => [...prev, { id: crypto.randomUUID(), title: '' }])}
                          className="text-xs text-black font-medium hover:underline flex items-center gap-1"
                        >
                          + Add Page
                        </button>
                      </div>
                    )}

                    {/* Pricing summary */}
                    {(() => {
                      const subtotal = ALA_CARTE
                        .filter((s: AlaCarteItem) => customSelectedIds.has(s.id))
                        .reduce((sum: number, s: AlaCarteItem) => {
                          const price = customPrices[s.id] ?? s.price
                          if (s.id === 'standard_page') return sum + price * (customPages.length || 1)
                          return sum + price
                        }, 0)
                      const discountAmt = Math.round(subtotal * (customDiscountPct / 100) * 100) / 100
                      const autoTotal = Math.round((subtotal - discountAmt) * 100) / 100
                      const finalTotal = customUseManual && customManualTotal !== '' ? Number(customManualTotal) : autoTotal

                      return (
                        <div className="border-t border-zinc-200 pt-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500">Subtotal</span>
                            <span className="font-medium">${subtotal.toLocaleString()}</span>
                          </div>

                          {/* Discount vs manual toggle */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setCustomUseManual(false)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${!customUseManual ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'}`}
                            >
                              Discount %
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomUseManual(true)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${customUseManual ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'}`}
                            >
                              Set Total
                            </button>
                          </div>

                          {!customUseManual ? (
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <label className="block text-[11px] text-zinc-400 mb-1">Discount (%)</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={customDiscountPct}
                                  onChange={e => setCustomDiscountPct(Number(e.target.value))}
                                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black/20"
                                />
                              </div>
                              {customDiscountPct > 0 && (
                                <p className="text-[11px] text-green-600 mt-4">−${discountAmt.toLocaleString()} off</p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">Custom Total ($)</label>
                              <input
                                type="number"
                                min={0}
                                value={customManualTotal}
                                onChange={e => setCustomManualTotal(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black/20"
                                placeholder="e.g. 5000"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between py-2 border-t border-zinc-200">
                            <span className="font-semibold text-black">Total</span>
                            <span className="text-xl font-black text-black">${finalTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Notes */}
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Internal Notes (optional)</label>
                      <textarea
                        rows={2}
                        value={customNotes}
                        onChange={e => setCustomNotes(e.target.value)}
                        placeholder="Any notes about this custom package…"
                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black/20 resize-none bg-white"
                      />
                    </div>

                    {/* Custom Payment Schedule */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-black">Custom Payment Schedule</p>
                          <p className="text-[11px] text-zinc-400">Overrides standard checkout Option B for this client</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCustomScheduleEnabled(v => !v)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${customScheduleEnabled ? 'bg-black' : 'bg-zinc-300'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${customScheduleEnabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>

                      {customScheduleEnabled && (
                        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-4">
                          {/* Upfront row */}
                          <div>
                            <p className="text-[11px] text-zinc-400 mb-2">Upfront payment</p>
                            <div className="flex items-center gap-2">
                              <div className="flex rounded-lg overflow-hidden border border-zinc-200">
                                <button type="button"
                                  onClick={() => setCustomUpfrontType('percent')}
                                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${customUpfrontType === 'percent' ? 'bg-black text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
                                >%</button>
                                <button type="button"
                                  onClick={() => setCustomUpfrontType('amount')}
                                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${customUpfrontType === 'amount' ? 'bg-black text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
                                >$</button>
                              </div>
                              <div className="flex items-center gap-1 flex-1">
                                {customUpfrontType === 'amount' && <span className="text-zinc-400 text-sm">$</span>}
                                <input
                                  type="number"
                                  min={0}
                                  max={customUpfrontType === 'percent' ? 100 : undefined}
                                  value={customUpfrontValue}
                                  onChange={e => setCustomUpfrontValue(e.target.value === '' ? '' : Number(e.target.value))}
                                  placeholder={customUpfrontType === 'percent' ? 'e.g. 30' : 'e.g. 1500'}
                                  className="w-full border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black/20 bg-white"
                                />
                                {customUpfrontType === 'percent' && <span className="text-zinc-400 text-sm">%</span>}
                              </div>
                            </div>
                          </div>

                          {/* Installments row */}
                          <div>
                            <p className="text-[11px] text-zinc-400 mb-2">Remaining balance split into</p>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                max={52}
                                value={customInstallments}
                                onChange={e => setCustomInstallments(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-20 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-center font-semibold focus:outline-none focus:ring-1 focus:ring-black/20 bg-white"
                              />
                              <span className="text-sm text-zinc-500">payments</span>
                              <select
                                value={customFrequency}
                                onChange={e => setCustomFrequency(e.target.value as 'weekly' | 'biweekly' | 'monthly' | 'yearly')}
                                className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black/20 bg-white"
                              >
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Bi-weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                              </select>
                            </div>
                          </div>

                          {/* Preview */}
                          {customUpfrontValue !== '' && customInstallments !== '' && (
                            <div className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 leading-relaxed">
                              ✓ Client pays{' '}
                              <strong>{customUpfrontType === 'percent' ? `${customUpfrontValue}% upfront` : `$${Number(customUpfrontValue).toLocaleString()} upfront`}</strong>
                              , then <strong>{customInstallments} {customFrequency}</strong> installments for the balance.
                              This replaces the standard 30%/3-monthly Option B at checkout.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveCustomPackage}
                      disabled={customSaving || customSelectedIds.size === 0}
                      className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {customSaving ? 'Saving…' : 'Save Custom Package'}
                    </button>
                  </div>
                )}
              </div>}

              {/* ── PROMO BUNDLE BUILDER ── */}
              {pkgSubTab === 'promo' && (
                <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-6 space-y-6">

                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-black flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-[18px]">sell</span>
                        Custom Promotion Bundle
                      </h3>
                      <input
                        type="text"
                        value={promoBundleName}
                        onChange={e => setPromoBundleName(e.target.value)}
                        placeholder="Bundle name — e.g. Summer Pool Bundle"
                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black/20 bg-white placeholder:text-zinc-400"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-8 flex-shrink-0">
                      {promoMsg && (
                        <span className={`text-xs font-medium ${promoMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                          {promoMsg.text}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSetPromoEnabled(!promoEnabled)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${promoEnabled ? 'bg-black' : 'bg-zinc-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${promoEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expiry date */}
                  <div className="flex items-center gap-3">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 w-24 flex-shrink-0">Expires</label>
                    <input
                      type="date"
                      value={promoExpiresAt}
                      onChange={e => setPromoExpiresAt(e.target.value)}
                      className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black/20 bg-white"
                    />
                    {promoExpiresAt && (
                      <button type="button" onClick={() => setPromoExpiresAt('')} className="text-xs text-zinc-400 hover:text-red-500">Clear</button>
                    )}
                    <span className="text-[11px] text-zinc-400">Optional — bundle auto-hides after this date in the client portal.</span>
                  </div>

                  {/* Copy from catalog */}
                  {customSelectedIds.size > 0 && (
                    <div className="flex items-center gap-3 py-2 px-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <span className="text-xs text-blue-700 flex-1">You have saved items in the Custom Package builder. Import them as a starting point?</span>
                      {copyConfirm ? (
                        <div className="flex gap-2">
                          <button type="button" onClick={handleCopyFromCatalog} className="text-xs font-semibold text-blue-700 hover:text-blue-900">Yes, import</button>
                          <button type="button" onClick={() => setCopyConfirm(false)} className="text-xs text-zinc-400 hover:text-zinc-600">Cancel</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setCopyConfirm(true)} className="text-xs font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap">Import items</button>
                      )}
                    </div>
                  )}

                  {/* Category + Item builder */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Categories &amp; Items</p>
                    {promoCategories.length === 0 && (
                      <p className="text-sm text-zinc-400 py-4 text-center border border-dashed border-zinc-300 rounded-lg">No categories yet. Add one below.</p>
                    )}
                    {promoCategories.map((cat, ci) => (
                      <div key={cat.id} className="border border-zinc-200 rounded-xl bg-white overflow-hidden">
                        {/* Category header */}
                        <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 border-b border-zinc-200">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 w-6">{ci + 1}</span>
                          <input
                            type="text"
                            value={cat.name}
                            onChange={e => updatePromoCategoryName(cat.id, e.target.value)}
                            placeholder="Category name — e.g. Website, Mobile, Branding"
                            className="flex-1 bg-transparent text-sm font-semibold text-black focus:outline-none placeholder:text-zinc-300"
                          />
                          <button type="button" onClick={() => deletePromoCategory(cat.id)} className="text-zinc-300 hover:text-red-400 transition-colors">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>

                        {/* Items */}
                        <div className="divide-y divide-zinc-100">
                          {cat.items.map(item => (
                            <div key={item.id} className="px-4 py-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={e => updatePromoItem(cat.id, item.id, { name: e.target.value })}
                                  placeholder="Item name"
                                  className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black/20 bg-white"
                                />
                                <div className="flex items-center gap-1 w-20">
                                  <span className="text-zinc-400 text-xs">Qty</span>
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.qty}
                                    onChange={e => updatePromoItem(cat.id, item.id, { qty: Math.max(1, Number(e.target.value)) })}
                                    className="w-full border border-zinc-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-black/20 bg-white"
                                  />
                                </div>
                                <div className="flex items-center gap-1 w-28">
                                  <span className="text-zinc-400 text-xs">$</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.unitPrice}
                                    onChange={e => updatePromoItem(cat.id, item.id, { unitPrice: Number(e.target.value) })}
                                    placeholder="Price"
                                    className="w-full border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black/20 bg-white"
                                  />
                                </div>
                                <button type="button" onClick={() => deletePromoItem(cat.id, item.id)} className="text-zinc-300 hover:text-red-400 transition-colors flex-shrink-0">
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              </div>
                              <input
                                type="text"
                                value={item.description}
                                onChange={e => updatePromoItem(cat.id, item.id, { description: e.target.value })}
                                placeholder="Description (optional)"
                                className="w-full border border-zinc-100 rounded-lg px-3 py-1.5 text-xs text-zinc-500 focus:outline-none focus:ring-1 focus:ring-black/10 bg-zinc-50"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Add item */}
                        <div className="px-4 py-2.5 border-t border-zinc-100">
                          <button type="button" onClick={() => addPromoItem(cat.id)}
                            className="text-xs font-medium text-zinc-400 hover:text-black transition-colors flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">add</span> Add item
                          </button>
                        </div>
                      </div>
                    ))}

                    <button type="button" onClick={addPromoCategory}
                      className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-black transition-colors border border-dashed border-zinc-300 hover:border-black rounded-lg px-4 py-2.5 w-full justify-center">
                      <span className="material-symbols-outlined text-[16px]">add</span> Add category
                    </button>
                  </div>

                  {/* Pricing summary */}
                  {(() => {
                    const promoSubtotal = promoCategories.flatMap(c => c.items).reduce((s, i) => s + i.qty * i.unitPrice, 0)
                    const promoDiscountAmt = Math.round(promoSubtotal * (promoDiscountPct / 100) * 100) / 100
                    const promoFinalTotal = promoUseManual && promoManualTotal !== '' ? Number(promoManualTotal) : Math.round((promoSubtotal - promoDiscountAmt) * 100) / 100
                    return (
                      <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Pricing</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Subtotal</span>
                          <span className="font-medium">${promoSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        {/* Discount vs manual toggle */}
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setPromoUseManual(false)}
                            className={`px-3 py-1 text-xs rounded-lg border transition-colors ${!promoUseManual ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'}`}>
                            Discount %
                          </button>
                          <button type="button" onClick={() => setPromoUseManual(true)}
                            className={`px-3 py-1 text-xs rounded-lg border transition-colors ${promoUseManual ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'}`}>
                            Set total
                          </button>
                        </div>
                        {promoUseManual ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-zinc-400">$</span>
                            <input type="number" min={0} value={promoManualTotal} onChange={e => setPromoManualTotal(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="Enter total" className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black/20 bg-white" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input type="number" min={0} max={100} value={promoDiscountPct} onChange={e => setPromoDiscountPct(Number(e.target.value))}
                              className="w-20 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-black/20 bg-white" />
                            <span className="text-sm text-zinc-400">% discount</span>
                            {promoDiscountPct > 0 && <span className="text-xs text-green-600 font-medium">−${promoDiscountAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })} off</span>}
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold border-t border-zinc-100 pt-3">
                          <span>Total</span>
                          <span>${promoFinalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Notes */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Notes <span className="normal-case font-normal">(shown to client)</span></p>
                    <textarea
                      value={promoNotes}
                      onChange={e => setPromoNotes(e.target.value)}
                      placeholder="Any notes visible to the client under their bundle…"
                      rows={2}
                      className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black/20 bg-white resize-none"
                    />
                  </div>

                  {/* Payment schedule */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Custom Payment Schedule</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Overrides standard 30%/3-monthly Option B at checkout.</p>
                      </div>
                      <button type="button" onClick={() => setPromoScheduleEnabled(v => !v)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${promoScheduleEnabled ? 'bg-black' : 'bg-zinc-300'}`}>
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${promoScheduleEnabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    {promoScheduleEnabled && (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-4">
                        <div>
                          <p className="text-[11px] text-zinc-400 mb-2">Upfront payment</p>
                          <div className="flex items-center gap-2">
                            <div className="flex rounded-lg overflow-hidden border border-zinc-200">
                              <button type="button" onClick={() => setPromoUpfrontType('percent')}
                                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${promoUpfrontType === 'percent' ? 'bg-black text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}>%</button>
                              <button type="button" onClick={() => setPromoUpfrontType('amount')}
                                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${promoUpfrontType === 'amount' ? 'bg-black text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}>$</button>
                            </div>
                            <div className="flex items-center gap-1 flex-1">
                              {promoUpfrontType === 'amount' && <span className="text-zinc-400 text-sm">$</span>}
                              <input type="number" min={0} max={promoUpfrontType === 'percent' ? 100 : undefined}
                                value={promoUpfrontValue} onChange={e => setPromoUpfrontValue(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder={promoUpfrontType === 'percent' ? 'e.g. 30' : 'e.g. 1500'}
                                className="w-full border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black/20 bg-white" />
                              {promoUpfrontType === 'percent' && <span className="text-zinc-400 text-sm">%</span>}
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] text-zinc-400 mb-2">Remaining balance split into</p>
                          <div className="flex items-center gap-2">
                            <input type="number" min={1} max={52} value={promoInstallments}
                              onChange={e => setPromoInstallments(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-20 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-center font-semibold focus:outline-none focus:ring-1 focus:ring-black/20 bg-white" />
                            <span className="text-sm text-zinc-500">payments</span>
                            <select value={promoFrequency} onChange={e => setPromoFrequency(e.target.value as 'weekly' | 'biweekly' | 'monthly' | 'yearly')}
                              className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black/20 bg-white">
                              <option value="weekly">Weekly</option>
                              <option value="biweekly">Bi-weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </div>
                        </div>
                        {promoUpfrontValue !== '' && promoInstallments !== '' && (
                          <div className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 leading-relaxed">
                            ✓ Client pays <strong>{promoUpfrontType === 'percent' ? `${promoUpfrontValue}% upfront` : `$${Number(promoUpfrontValue).toLocaleString()} upfront`}</strong>, then <strong>{promoInstallments} {promoFrequency}</strong> installments for the balance.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Save button */}
                  <button
                    type="button"
                    onClick={handleSavePromoBundle}
                    disabled={promoSaving || promoCategories.every(c => c.items.length === 0)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {promoSaving ? 'Saving…' : 'Save Promo Bundle'}
                  </button>

                  {/* Live preview panel */}
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <button type="button" onClick={() => setShowPromoPreview(p => !p)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-colors text-sm font-medium text-zinc-600">
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">preview</span>
                        Preview as Client
                      </span>
                      <span className="material-symbols-outlined text-[16px]">{showPromoPreview ? 'expand_less' : 'expand_more'}</span>
                    </button>
                    {showPromoPreview && (() => {
                      const prevSubtotal = promoCategories.flatMap(c => c.items).reduce((s, i) => s + i.qty * i.unitPrice, 0)
                      const prevDiscount = Math.round(prevSubtotal * (promoDiscountPct / 100) * 100) / 100
                      const prevTotal = promoUseManual && promoManualTotal !== '' ? Number(promoManualTotal) : Math.round((prevSubtotal - prevDiscount) * 100) / 100
                      const catGroups = promoCategories.filter(c => c.items.length > 0)
                      const daysLeft = promoExpiresAt ? Math.ceil((new Date(promoExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
                      return (
                        <div style={{ background: '#f9f9f9', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
                          {/* Exact replica of the portal Step 3 card */}
                          <div style={{ background: '#f9f9f9', border: '1px solid #e4e4e7', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            {/* Header — badge + name + countdown */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ background: '#f59e0b', color: '#fff', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '3px 10px', borderRadius: '999px' }}>Special Offer</span>
                                {promoBundleName && <span style={{ fontWeight: 600, color: '#000', fontSize: '14px' }}>{promoBundleName}</span>}
                              </div>
                              {daysLeft !== null && daysLeft <= 7 && (
                                <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '4px 10px' }}>
                                  ⏰ Offer expires in {daysLeft <= 0 ? 'less than a day' : `${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                                </span>
                              )}
                            </div>

                            {/* Line items table */}
                            {catGroups.length > 0 && (
                              <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid #f4f4f5' }}>
                                      <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa' }}>Service</th>
                                      <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa' }}>Price</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {catGroups.map(cat => (
                                      <>
                                        <tr key={`h-${cat.id}`} style={{ background: '#f9f9f9' }}>
                                          <td colSpan={2} style={{ padding: '8px 16px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa' }}>{cat.name}</td>
                                        </tr>
                                        {cat.items.map(item => (
                                          <tr key={item.id} style={{ borderTop: '1px solid #f4f4f5' }}>
                                            <td style={{ padding: '12px 16px' }}>
                                              <p style={{ fontWeight: 500, color: '#000', margin: 0 }}>{item.name || '—'}</p>
                                              {item.description && <p style={{ fontSize: '11px', color: '#a1a1aa', margin: '2px 0 0' }}>{item.description}</p>}
                                              {item.qty > 1 && <p style={{ fontSize: '11px', color: '#a1a1aa', margin: '2px 0 0' }}>×{item.qty}</p>}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, color: '#000', whiteSpace: 'nowrap' }}>${(item.qty * item.unitPrice).toLocaleString()}</td>
                                          </tr>
                                        ))}
                                        <tr style={{ borderTop: '1px solid #f4f4f5', background: 'rgba(249,249,249,0.5)' }}>
                                          <td style={{ padding: '6px 16px', fontSize: '11px', color: '#a1a1aa' }}>Subtotal — {cat.name}</td>
                                          <td style={{ padding: '6px 16px', textAlign: 'right', fontSize: '11px', color: '#a1a1aa' }}>${cat.items.reduce((s, i) => s + i.qty * i.unitPrice, 0).toLocaleString()}</td>
                                        </tr>
                                      </>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr style={{ borderTop: '1px solid #e4e4e7', background: '#f9f9f9' }}>
                                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#000' }}>Total</td>
                                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, fontSize: '18px', color: '#000' }}>${prevTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            )}
                            {catGroups.length === 0 && (
                              <p style={{ color: '#a1a1aa', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No items added yet.</p>
                            )}

                            {promoNotes && <p style={{ fontSize: '13px', color: '#71717a', fontStyle: 'italic', margin: 0 }}>{promoNotes}</p>}

                            {/* CTA button */}
                            <div style={{ background: '#000', color: '#fff', borderRadius: '12px', padding: '14px', textAlign: 'center', fontWeight: 700, fontSize: '14px', opacity: 0.5, cursor: 'default' }}>
                              Select This Package →
                            </div>
                            <p style={{ fontSize: '10px', color: '#a1a1aa', textAlign: 'center', margin: 0 }}>Preview only — button is disabled</p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Onboarding Progress */}
              <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-6">
                <h3 className="font-semibold text-black mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">checklist</span>
                  Onboarding Progress
                </h3>
                {!onboardingAdminData?.onboarding ? (
                  <p className="text-sm text-zinc-400">No onboarding record yet. Set the portal password to initialize.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {([
                      { key: 'step1Questionnaire', label: 'Discovery' },
                      { key: 'step2BrandGuide', label: 'Brand Guide' },
                      { key: 'step3Package', label: 'Package' },
                      { key: 'step4Checkout', label: 'Checkout' },
                    ] as const).map(({ key, label }) => {
                      const done = onboardingAdminData.onboarding![key as keyof typeof onboardingAdminData.onboarding]
                      const isOverriding = stepOverriding === key
                      return (
                        <div
                          key={key}
                          className={`rounded-xl border p-4 flex flex-col gap-3 ${done ? 'bg-green-50 border-green-200' : 'bg-white border-zinc-200'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">{label}</span>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${done ? 'bg-green-500 text-white' : 'bg-zinc-200 text-zinc-400'}`}>
                              {done ? '✓' : '✗'}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={isOverriding}
                            onClick={() => handleStepOverride(key, !done)}
                            className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
                              done
                                ? 'border-red-300 text-red-500 hover:bg-red-50'
                                : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100'
                            }`}
                          >
                            {isOverriding ? '…' : done ? 'Reset' : 'Mark Complete'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
                {onboardingAdminData?.onboarding?.completedAt && (
                  <p className="text-xs text-zinc-400 mt-4">
                    Onboarding completed {new Date(onboardingAdminData.onboarding.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Package Selection */}
              <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-6">
                <h3 className="font-semibold text-black mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">package_2</span>
                  Selected Package
                </h3>
                {!onboardingAdminData?.packageSelection ? (
                  <p className="text-sm text-zinc-400">No package selected yet.</p>
                ) : (() => {
                  const pkg = onboardingAdminData.packageSelection
                  let lineItems: Array<{ serviceId: string; label: string; description: string; qty: number; unitPrice: number; amount: number; bonus?: boolean; included?: boolean }> = []
                  try { lineItems = JSON.parse(pkg.lineItems) } catch { /* ignore */ }
                  const tierColors: Record<string, string> = {
                    foundation: 'bg-green-100 text-green-700',
                    growth: 'bg-blue-100 text-blue-700',
                    authority: 'bg-red-100 text-red-700',
                    signature: 'bg-zinc-900 text-white',
                    custom: 'bg-zinc-100 text-zinc-700',
                  }
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${tierColors[pkg.tier] ?? 'bg-zinc-100 text-zinc-700'}`}>
                          {pkg.tier}
                        </span>
                        <span className="text-xs text-zinc-400">
                          Selected {new Date(pkg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {pkg.proposalId && pkg.signingToken && (
                          <a
                            href={`/sign/${pkg.signingToken}`}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-auto text-xs font-medium text-black border border-zinc-300 px-3 py-1 rounded-lg hover:bg-zinc-100 transition-colors"
                          >
                            View Proposal →
                          </a>
                        )}
                      </div>

                      {lineItems.length > 0 && (
                        <div className="overflow-hidden rounded-xl border border-zinc-200">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-zinc-100 border-b border-zinc-200">
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Service</th>
                                <th className="text-right px-4 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {lineItems.map((item, i) => (
                                <tr key={i} className={item.bonus ? 'bg-green-50/50' : 'bg-white'}>
                                  <td className="px-4 py-2.5">
                                    <div className="font-medium text-black text-sm">{item.label}</div>
                                    {item.description && <div className="text-xs text-zinc-400 mt-0.5">{item.description}</div>}
                                    {item.bonus && <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Bundle Bonus</span>}
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-medium text-black whitespace-nowrap">
                                    {item.bonus ? (
                                      <span className="text-green-600 font-bold text-xs">FREE</span>
                                    ) : item.included ? (
                                      <span className="text-zinc-400 text-xs">Included</span>
                                    ) : (
                                      `$${item.amount.toLocaleString()}`
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-zinc-50 border-t border-zinc-200">
                                <td className="px-4 py-3 font-semibold text-black">Total</td>
                                <td className="px-4 py-3 text-right font-bold text-black text-base">
                                  ${pkg.total.toLocaleString()}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}

                      {pkg.notes && (
                        <p className="text-sm text-zinc-600 bg-white border border-zinc-200 rounded-xl p-4 whitespace-pre-wrap">{pkg.notes}</p>
                      )}
                    </div>
                  )
                })()}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ── DISCOVERY SECTION ── */}
      {activeSection === 'discovery' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {!discoveryLoaded ? (
            <div className="text-sm text-zinc-400 py-12 text-center">Loading questionnaire…</div>
          ) : !discoveryData ? (
            <div className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-12 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-zinc-300">assignment</span>
              <p className="text-zinc-500 text-sm">No questionnaire submitted yet.</p>
              <p className="text-zinc-400 text-xs">The client will see a questionnaire form in their portal.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-black">Discovery Questionnaire</h3>
                  {(discoveryData as { submittedAt?: string }).submittedAt && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Submitted {new Date((discoveryData as { submittedAt: string }).submittedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                  (discoveryData as { status?: string }).status === 'submitted'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {(discoveryData as { status?: string }).status ?? 'not started'}
                </span>
              </div>
              {DISCOVERY_SECTIONS.map(sec => {
                const raw = (discoveryData as Record<string, string | null>)[sec.key]
                const submissionSvcs = ((discoveryData as Record<string, unknown>).submissionServices as string[]) ?? []
                let answers: Record<string, string> = {}
                if (raw) { try { answers = JSON.parse(raw) } catch { /* ignore */ } }
                const hasAnswers = Object.values(answers).some(v => v?.trim()) ||
                  (sec.key === 'section13' && submissionSvcs.length > 0)
                if (!hasAnswers) return null
                return (
                  <div key={sec.key} className="bg-[#f3f3f3] border border-zinc-200 rounded-xl p-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">{sec.title}</h4>
                    {sec.questions.map(q => {
                      if (q.id === 'additionalServices') {
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
                                  <span key={id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                    isOwned ? 'bg-black text-white' : 'bg-white border border-zinc-200 text-zinc-700'
                                  }`}>
                                    {svc?.label ?? id}
                                    {isOwned && <span className="ml-1 opacity-60 font-normal">· Already in package</span>}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )
                      }
                      if (!answers[q.id]?.trim()) return null
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
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

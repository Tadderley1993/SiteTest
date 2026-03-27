import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

// Submission types
export interface SubmissionData {
  firstName: string
  lastName: string
  email: string
  phone: string
  clientType: string
  services: string[]
  painPoints?: string[]
  description: string
  teamSize: string
  budget: string
  timelineMonths?: string
  timelineWeeks?: string
  timelineDays?: string
}

export interface Submission extends SubmissionData {
  id: number
  createdAt: string
}

// Auth types
export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  username: string
  role: string
  sessionId: number
}

// Client types
export interface ProjectScope {
  id: number
  clientId: number
  projectName?: string
  projectType?: string
  services?: string
  budget?: string
  timeline?: string
  goals?: string
  targetAudience?: string
  competitors?: string
  techStack?: string
  deliverables?: string
  notes?: string
  startDate?: string
  endDate?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface KanbanTask {
  id: number
  clientId?: number | null
  clientName?: string | null
  title: string
  description?: string
  column: string
  priority: string
  dueDate?: string
  order: number
  taskOwner: string
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: number
  firstName: string
  lastName: string
  title?: string
  email: string
  phone?: string
  website?: string
  organization?: string
  instagram?: string
  twitter?: string
  linkedin?: string
  facebook?: string
  notes?: string
  submissionId?: number
  projectScope?: ProjectScope
  tasks: KanbanTask[]
  journeyPhase?: string
  createdAt: string
  updatedAt: string
}

export interface ClientFormData {
  firstName: string
  lastName: string
  title?: string
  email: string
  phone?: string
  website?: string
  organization?: string
  instagram?: string
  twitter?: string
  linkedin?: string
  facebook?: string
  notes?: string
  submissionId?: number
}

export const JOURNEY_PHASES = [
  { id: 'discovery',       label: 'Discovery' },
  { id: 'planning',        label: 'Planning' },
  { id: 'design_1',        label: 'Phase 1 Design' },
  { id: 'design_2',        label: 'Phase 2 Design' },
  { id: 'development',     label: 'Development' },
  { id: 'review',          label: 'Client Review' },
  { id: 'final_approval',  label: 'Final Approval' },
  { id: 'handoff',         label: 'Handoff' },
] as const

export type JourneyPhaseId = typeof JOURNEY_PHASES[number]['id']

// API functions
export async function createSubmission(data: SubmissionData): Promise<Submission> {
  const response = await api.post('/submissions', data)
  return response.data
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await api.post('/auth/login', credentials)
  return response.data
}

export async function getSubmissions(): Promise<Submission[]> {
  const response = await api.get('/admin/submissions')
  return response.data
}

export async function getSubmission(id: number): Promise<Submission> {
  const response = await api.get(`/admin/submissions/${id}`)
  return response.data
}

// Client API
export async function getClients(): Promise<Client[]> {
  const response = await api.get('/admin/clients')
  return response.data
}

export async function getClient(id: number): Promise<Client> {
  const response = await api.get(`/admin/clients/${id}`)
  return response.data
}

export async function createClient(data: ClientFormData): Promise<Client> {
  const response = await api.post('/admin/clients', data)
  return response.data
}

export async function updateClient(id: number, data: Partial<ClientFormData>): Promise<Client> {
  const response = await api.put(`/admin/clients/${id}`, data)
  return response.data
}

export async function deleteClient(id: number): Promise<void> {
  await api.delete(`/admin/clients/${id}`)
}

export async function updateJourneyPhase(clientId: number, journeyPhase: string): Promise<{ journeyPhase: string }> {
  const res = await api.put(`/admin/clients/${clientId}/journey`, { journeyPhase })
  return res.data
}

export async function updateProjectScope(clientId: number, data: Partial<ProjectScope>): Promise<ProjectScope> {
  const response = await api.put(`/admin/clients/${clientId}/scope`, data)
  return response.data
}

export async function createTask(clientId: number, data: Partial<KanbanTask>): Promise<KanbanTask> {
  const response = await api.post(`/admin/clients/${clientId}/tasks`, data)
  return response.data
}

export async function updateTask(clientId: number, taskId: number, data: Partial<KanbanTask>): Promise<KanbanTask> {
  const response = await api.put(`/admin/clients/${clientId}/tasks/${taskId}`, data)
  return response.data
}

export async function deleteTask(clientId: number, taskId: number): Promise<void> {
  await api.delete(`/admin/clients/${clientId}/tasks/${taskId}`)
}

// Global task functions (production board — no clientId required)
export async function getAllTasks(params?: { owner?: string; clientId?: number; column?: string }): Promise<KanbanTask[]> {
  const response = await api.get('/admin/tasks', { params })
  return response.data
}

export async function createAdminTask(data: Partial<KanbanTask>): Promise<KanbanTask> {
  const response = await api.post('/admin/tasks', data)
  return response.data
}

export async function updateAnyTask(taskId: number, data: Partial<KanbanTask>): Promise<KanbanTask> {
  const response = await api.put(`/admin/tasks/${taskId}`, data)
  return response.data
}

export async function deleteAnyTask(taskId: number): Promise<void> {
  await api.delete(`/admin/tasks/${taskId}`)
}

// Standing types
export interface ClientStanding {
  id: number
  clientId: number
  currency: string
  totalContract: number
  notes?: string
  createdAt: string
  updatedAt: string
}

// status: pending | paid-on-time | paid-late | rearranged | overdue | cancelled
export interface PaymentEntry {
  id: number
  clientId: number
  label: string
  amount: number
  dueDate: string
  status: string
  paidDate?: string
  rearrangedTo?: string
  notes?: string
  order: number
  createdAt: string
  updatedAt: string
}

// status: draft | sent | paid | overdue | void
export interface Invoice {
  id: number
  clientId: number
  invoiceNumber: string
  description?: string
  amount: number
  issuedDate: string
  dueDate: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface StandingData {
  standing: ClientStanding | null
  payments: PaymentEntry[]
  invoices: Invoice[]
}

// Standing API
export async function getStanding(clientId: number): Promise<StandingData> {
  const response = await api.get(`/admin/clients/${clientId}/standing`)
  return response.data
}

export async function updateStanding(clientId: number, data: Partial<ClientStanding>): Promise<ClientStanding> {
  const response = await api.put(`/admin/clients/${clientId}/standing`, data)
  return response.data
}

export async function createPayment(clientId: number, data: Partial<PaymentEntry>): Promise<PaymentEntry> {
  const response = await api.post(`/admin/clients/${clientId}/payments`, data)
  return response.data
}

export async function updatePayment(clientId: number, paymentId: number, data: Partial<PaymentEntry>): Promise<PaymentEntry> {
  const response = await api.put(`/admin/clients/${clientId}/payments/${paymentId}`, data)
  return response.data
}

export async function deletePayment(clientId: number, paymentId: number): Promise<void> {
  await api.delete(`/admin/clients/${clientId}/payments/${paymentId}`)
}

export async function createInvoice(clientId: number, data: Partial<Invoice>): Promise<Invoice> {
  const response = await api.post(`/admin/clients/${clientId}/invoices`, data)
  return response.data
}

export async function updateInvoice(clientId: number, invoiceId: number, data: Partial<Invoice>): Promise<Invoice> {
  const response = await api.put(`/admin/clients/${clientId}/invoices/${invoiceId}`, data)
  return response.data
}

export async function deleteInvoice(clientId: number, invoiceId: number): Promise<void> {
  await api.delete(`/admin/clients/${clientId}/invoices/${invoiceId}`)
}

// Document types
export interface ClientDocument {
  id: number
  clientId: number
  fileName: string
  storedName: string
  docType: string
  mimeType: string
  size: number
  createdAt: string
}

export const DOC_TYPES: Record<string, string> = {
  'signed-proposal': 'Signed Proposal',
  'contract': 'Contract',
  'nda': 'NDA',
  'invoice': 'Invoice',
  'brief': 'Creative Brief',
  'reference': 'Reference / Inspiration',
  'asset': 'Brand Asset',
  'other': 'Other',
}

export async function getDocuments(clientId: number): Promise<ClientDocument[]> {
  const response = await api.get(`/admin/${clientId}/documents`)
  return response.data
}

export async function uploadDocument(clientId: number, file: File, docType: string): Promise<ClientDocument> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('docType', docType)
  const response = await api.post(`/admin/${clientId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function deleteDocument(clientId: number, docId: number): Promise<void> {
  await api.delete(`/admin/${clientId}/documents/${docId}`)
}

export function getDocumentDownloadUrl(docId: number): string {
  return `/api/admin/download/${docId}`
}

export async function downloadDocument(docId: number, fileName: string): Promise<void> {
  const res = await api.get(`/admin/download/${docId}`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// Proposal types
export interface LineItem {
  id: string
  description: string
  qty: number
  unitPrice: number
  total: number
}

export interface Proposal {
  id: number
  proposalNumber: string
  title: string
  status: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientCompany?: string
  clientAddress?: string
  clientId?: number
  submissionId?: number
  date: string
  validUntil?: string
  executiveSummary?: string
  clientNeeds?: string
  proposedSolution?: string
  projectScope?: string
  deliverables?: string
  timeline?: string
  lineItems?: string
  subtotal: number
  discountType: string
  discountValue: number
  taxRate: number
  total: number
  currency: string
  paymentTerms?: string
  termsConditions?: string
  notes?: string
  sentAt?: string
  signingToken?: string
  clientSignature?: string
  clientSignedAt?: string
  createdAt: string
  updatedAt: string
}

export async function getProposals(): Promise<Proposal[]> {
  const response = await api.get('/admin/proposals')
  return response.data
}

export async function getProposal(id: number): Promise<Proposal> {
  const response = await api.get(`/admin/proposals/${id}`)
  return response.data
}

export async function createProposal(data: Partial<Proposal>): Promise<Proposal> {
  const response = await api.post('/admin/proposals', data)
  return response.data
}

export async function updateProposal(id: number, data: Partial<Proposal>): Promise<Proposal> {
  const response = await api.put(`/admin/proposals/${id}`, data)
  return response.data
}

export async function deleteProposal(id: number): Promise<void> {
  await api.delete(`/admin/proposals/${id}`)
}

export async function generateSigningToken(id: number): Promise<{ token: string }> {
  const res = await api.post(`/sign/generate/${id}`)
  return res.data
}

export async function getProposalByToken(token: string): Promise<Partial<Proposal>> {
  const res = await axios.get(`/api/sign/${token}`)
  return res.data
}

export async function signProposal(token: string, signature: string): Promise<{ success: boolean; signedAt: string }> {
  const res = await axios.post(`/api/sign/${token}`, { signature })
  return res.data
}

export async function sendProposalEmail(
  id: number,
  payload: { to: string; subject: string; message: string; pdfBase64?: string }
): Promise<void> {
  await api.post(`/admin/proposals/${id}/send-email`, payload)
}

// ── Admin Settings ──

export interface AdminSettings {
  id: number
  paypalClientId: string | null
  paypalSecret: string | null
  hasSecret: boolean
  paypalEnvironment: string
  paypalMerchantId: string | null
  paypalEmail: string | null
  smtpHost: string | null
  smtpPort: string | null
  smtpUser: string | null
  smtpPass: string | null
  hasSmtpPass: boolean
  smtpFrom: string | null
  smtpSecure: boolean
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const res = await api.get('/admin/settings')
  return res.data
}

export async function saveAdminSettings(data: Partial<AdminSettings & { paypalSecret: string }>): Promise<AdminSettings> {
  const res = await api.put('/admin/settings', data)
  return res.data
}

export async function testPayPalConnection(): Promise<{ success: boolean; message: string; accountInfo: unknown }> {
  const res = await api.post('/admin/paypal/test')
  return res.data
}

export async function getPayPalInvoices(page = 1, pageSize = 25) {
  const res = await api.get(`/admin/paypal/invoices?page=${page}&page_size=${pageSize}`)
  return res.data
}

export async function createPayPalInvoice(data: unknown) {
  const res = await api.post('/admin/paypal/invoices', data)
  return res.data
}

export async function sendPayPalInvoice(invoiceId: string, opts?: { subject?: string; note?: string }) {
  const res = await api.post(`/admin/paypal/invoices/${invoiceId}/send`, opts ?? {})
  return res.data
}

export async function cancelPayPalInvoice(invoiceId: string, opts?: { subject?: string; note?: string }) {
  const res = await api.post(`/admin/paypal/invoices/${invoiceId}/cancel`, opts ?? {})
  return res.data
}

export async function deletePayPalInvoice(invoiceId: string) {
  await api.delete(`/admin/paypal/invoices/${invoiceId}`)
}

export async function getPayPalTransactions(startDate?: string, endDate?: string) {
  const params = new URLSearchParams()
  if (startDate) params.set('start_date', startDate)
  if (endDate) params.set('end_date', endDate)
  const res = await api.get(`/admin/paypal/transactions?${params}`)
  return res.data
}

// ── Expenses ──

export interface Expense {
  id: number
  title: string
  amount: number
  category: string
  date: string
  notes: string | null
  recurring: boolean
  frequency: string | null
  receiptPath: string | null
  receiptName: string | null
  createdAt: string
  updatedAt: string
}

export const EXPENSE_CATEGORIES = [
  'software', 'hosting', 'marketing', 'contractors', 'equipment',
  'office', 'travel', 'professional-services', 'other',
] as const

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  software: 'Software & Tools',
  hosting: 'Hosting & Infrastructure',
  marketing: 'Marketing & Ads',
  contractors: 'Contractors',
  equipment: 'Equipment & Hardware',
  office: 'Office & Utilities',
  travel: 'Travel',
  'professional-services': 'Professional Services',
  other: 'Other',
}

export async function getExpenses(): Promise<Expense[]> {
  const res = await api.get('/admin/expenses')
  return res.data
}

export async function createExpense(data: Partial<Expense>): Promise<Expense> {
  const res = await api.post('/admin/expenses', data)
  return res.data
}

export async function updateExpense(id: number, data: Partial<Expense>): Promise<Expense> {
  const res = await api.put(`/admin/expenses/${id}`, data)
  return res.data
}

export async function deleteExpense(id: number): Promise<void> {
  await api.delete(`/admin/expenses/${id}`)
}

export async function uploadExpenseReceipt(id: number, file: File): Promise<Expense> {
  const fd = new FormData()
  fd.append('receipt', file)
  const res = await api.post(`/admin/expenses/${id}/receipt`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function deleteExpenseReceipt(id: number): Promise<Expense> {
  const res = await api.delete(`/admin/expenses/${id}/receipt`)
  return res.data
}

export function getExpenseReceiptUrl(id: number): string {
  return `/api/admin/expenses/${id}/receipt`
}

export async function testSmtp(): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await api.post('/admin/settings/test-smtp')
  return res.data
}

// ── Financials ──

export interface FinancialSummary {
  totalRevenue: number
  totalCollected: number
  totalOutstanding: number
  totalOverdue: number
  totalContractValue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  conversionRate: number
  avgDealSize: number
  pipelineValue: number
  activeClients: number
  totalProposals: number
  acceptedProposals: number
  paypalConnected: boolean
  paypalCollected: number
  paypalOutstanding: number
  paypalTransactionCount: number
  localCollected: number
}

export interface MonthlyData {
  month: string
  label: string
  collected: number
  local: number
  paypal: number
  expenses: number
  profit: number
}

export interface QuarterlyData {
  label: string
  collected: number
  expenses: number
  profit: number
}

export interface FinancialsData {
  summary: FinancialSummary
  revenueByMonth: MonthlyData[]
  revenueByQuarter: QuarterlyData[]
  expenseCategories: { category: string; amount: number }[]
  clientRevenue: { name: string; collected: number; outstanding: number; contract: number }[]
  statusBreakdown: { collected: number; pending: number; overdue: number; cancelled: number }
  recentPayments: Array<{ id: number | string; label: string; amount: number; clientName: string; paidDate: string | null; status: string; source: 'local' | 'paypal' }>
}

export async function getFinancials(): Promise<FinancialsData> {
  const res = await api.get('/admin/financials/summary')
  return res.data
}

// ── Deals ────────────────────────────────────────────────────────
export interface Deal {
  id: number
  title: string
  company?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  value: number
  stage: 'lead' | 'qualified' | 'proposal_sent' | 'won' | 'lost'
  notes?: string
  clientId?: number
  client?: { id: number; firstName: string; lastName: string }
  createdAt: string
  updatedAt: string
}

export async function getDeals(): Promise<Deal[]> {
  const res = await api.get('/admin/deals')
  return res.data
}

export async function createDeal(data: Partial<Deal>): Promise<Deal> {
  const res = await api.post('/admin/deals', data)
  return res.data
}

export async function updateDeal(id: number, data: Partial<Deal>): Promise<Deal> {
  const res = await api.put(`/admin/deals/${id}`, data)
  return res.data
}

export async function moveDeal(id: number, stage: Deal['stage']): Promise<Deal> {
  const res = await api.patch(`/admin/deals/${id}/stage`, { stage })
  return res.data
}

export async function deleteDeal(id: number): Promise<void> {
  await api.delete(`/admin/deals/${id}`)
}

// ── Files ────────────────────────────────────────────────────────
export interface FileEntry extends ClientDocument {
  client: { id: number; firstName: string; lastName: string; organization?: string }
}

export interface FilesResponse {
  files: FileEntry[]
  stats: { total: number; portalVisible: number; totalSize: number }
}

export async function getAllFiles(): Promise<FilesResponse> {
  const res = await api.get('/admin/files')
  return res.data
}

export async function deleteFile(id: number): Promise<void> {
  await api.delete(`/admin/files/${id}`)
}

// ── Automations ──────────────────────────────────────────────────
export interface AutomationRule {
  id: number
  name: string
  type: string
  enabled: boolean
  delayDays: number
  subject?: string
  body?: string
  targetClientIds?: number[] | null
  dedupeEnabled?: boolean
  dedupeDays?: number
  lastRunAt?: string
  runCount: number
  createdAt: string
  updatedAt: string
  logs: AutomationLog[]
}

export interface AutomationLog {
  id: number
  ruleId: number
  status: string
  message?: string
  sentTo?: string
  createdAt: string
}

export async function getAutomations(): Promise<AutomationRule[]> {
  const res = await api.get('/admin/automations')
  return res.data
}

export async function createAutomation(data: Partial<AutomationRule>): Promise<AutomationRule> {
  const res = await api.post('/admin/automations', data)
  return res.data
}

export async function updateAutomation(id: number, data: Partial<AutomationRule>): Promise<AutomationRule> {
  const res = await api.put(`/admin/automations/${id}`, data)
  return res.data
}

export async function deleteAutomation(id: number): Promise<void> {
  await api.delete(`/admin/automations/${id}`)
}

export async function runAutomation(id: number): Promise<{ results: { status: string; message: string; sentTo?: string }[] }> {
  const res = await api.post(`/admin/automations/${id}/run`)
  return res.data
}

// ── Email Templates ──────────────────────────────────────────────
export interface EmailTemplate {
  id: number
  name: string
  category: string
  subject: string
  htmlContent: string
  cssContent: string
  createdAt: string
  updatedAt: string
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const res = await api.get('/admin/email-templates')
  return res.data
}

export async function getEmailTemplate(id: number): Promise<EmailTemplate> {
  const res = await api.get(`/admin/email-templates/${id}`)
  return res.data
}

export async function createEmailTemplate(data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
  const res = await api.post('/admin/email-templates', data)
  return res.data
}

export async function updateEmailTemplate(id: number, data: Partial<Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>>): Promise<EmailTemplate> {
  const res = await api.put(`/admin/email-templates/${id}`, data)
  return res.data
}

export async function deleteEmailTemplate(id: number): Promise<void> {
  await api.delete(`/admin/email-templates/${id}`)
}

export async function sendEmailTemplate(id: number, to: string, variables: Record<string, string>): Promise<void> {
  await api.post(`/admin/email-templates/${id}/send`, { to, variables })
}

export async function updateAdminAccount(data: { currentPassword: string; newUsername?: string; newPassword?: string }): Promise<{ message: string; username: string }> {
  const res = await api.put('/auth/account', data)
  return res.data
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface AdminNotification {
  id: number
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export async function getNotifications(): Promise<AdminNotification[]> {
  const res = await api.get('/admin/notifications')
  return res.data
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await api.get('/admin/notifications/unread-count')
  return res.data.count
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.patch(`/admin/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/admin/notifications/read-all')
}

export async function clearReadNotifications(): Promise<void> {
  await api.delete('/admin/notifications/clear')
}

// ── Messages ──────────────────────────────────────────────────────────────────

export interface AdminMessage {
  id: number
  clientId: number
  fromAdmin: boolean
  body: string
  read: boolean
  createdAt: string
}

export interface ClientThread {
  clientId: number
  firstName: string
  lastName: string
  email: string
  organization: string | null
  lastBody: string
  lastFromAdmin: boolean
  lastAt: string
  unreadCount: number
}

export async function getAllMessageThreads(): Promise<ClientThread[]> {
  const res = await api.get('/admin/messages')
  return res.data
}

export async function getClientMessages(clientId: number): Promise<AdminMessage[]> {
  const res = await api.get(`/admin/messages/${clientId}`)
  return res.data
}

export async function sendAdminMessage(clientId: number, body: string): Promise<AdminMessage> {
  const res = await api.post(`/admin/messages/${clientId}`, { body })
  return res.data
}

// ── Calendar ───────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: number
  title: string
  description: string | null
  startAt: string
  endAt: string | null
  allDay: boolean
  eventType: string
  clientId: number | null
  color: string
  createdAt: string
  updatedAt: string
  // joined
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  organization?: string | null
  projectStatus?: string | null
}

export interface CalendarClient {
  id: number
  firstName: string
  lastName: string
  email: string
  organization: string | null
  projectStatus: string | null
}

export async function getCalendarEvents(start: string, end: string): Promise<CalendarEvent[]> {
  const res = await api.get('/admin/calendar/events', { params: { start, end } })
  return res.data
}

export async function getUpcomingEvents(range: 'day' | 'week' | 'month'): Promise<CalendarEvent[]> {
  const res = await api.get('/admin/calendar/upcoming', { params: { range } })
  return res.data
}

export async function getCalendarClients(): Promise<CalendarClient[]> {
  const res = await api.get('/admin/calendar/clients')
  return res.data
}

export async function createCalendarEvent(data: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const res = await api.post('/admin/calendar/events', data)
  return res.data
}

export async function updateCalendarEvent(id: number, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const res = await api.put(`/admin/calendar/events/${id}`, data)
  return res.data
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  await api.delete(`/admin/calendar/events/${id}`)
}

export default api

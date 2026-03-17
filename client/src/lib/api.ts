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
  token: string
  username: string
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
  clientId: number
  title: string
  description?: string
  column: string
  priority: string
  dueDate?: string
  order: number
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

export default api

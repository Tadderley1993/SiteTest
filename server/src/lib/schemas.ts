import { z } from 'zod'

// ── Auth ─────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  username: z.string().min(1).max(64).trim(),
  password: z.string().min(1).max(128),
})

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
})

// ── Submissions ───────────────────────────────────────────────────
export const SubmissionSchema = z.object({
  firstName:      z.string().min(1).max(100).trim(),
  lastName:       z.string().min(1).max(100).trim(),
  email:          z.string().email().max(255).toLowerCase().trim(),
  phone:          z.string().min(7).max(30).trim(),
  clientType:     z.string().min(1).max(200).trim(),
  services:       z.array(z.string().min(1)).min(1),
  description:    z.string().min(1).max(5000).trim(),
  teamSize:       z.string().min(1).max(50),
  budget:         z.string().min(1).max(100).trim(),
  timelineMonths: z.coerce.number().int().nonnegative().optional(),
  timelineWeeks:  z.coerce.number().int().nonnegative().optional(),
  timelineDays:   z.coerce.number().int().nonnegative().optional(),
})

// ── Clients ───────────────────────────────────────────────────────
export const CreateClientSchema = z.object({
  firstName:    z.string().min(1).max(100).trim(),
  lastName:     z.string().min(1).max(100).trim(),
  title:        z.string().max(100).trim().optional(),
  email:        z.string().email().max(255).toLowerCase().trim(),
  phone:        z.string().max(30).trim().optional(),
  website:      z.string().url().max(255).optional().or(z.literal('')),
  organization: z.string().max(200).trim().optional(),
  instagram:    z.string().max(100).trim().optional(),
  twitter:      z.string().max(100).trim().optional(),
  linkedin:     z.string().max(255).trim().optional(),
  facebook:     z.string().max(255).trim().optional(),
  notes:        z.string().max(5000).trim().optional(),
  submissionId: z.number().int().positive().optional(),
})

export const UpdateClientSchema = CreateClientSchema.partial()

// ── Proposals ─────────────────────────────────────────────────────
export const CreateProposalSchema = z.object({
  title:           z.string().min(1).max(255).trim(),
  clientName:      z.string().min(1).max(200).trim(),
  clientEmail:     z.string().email().max(255),
  clientPhone:     z.string().max(30).optional(),
  clientCompany:   z.string().max(200).optional(),
  clientAddress:   z.string().max(500).optional(),
  clientId:        z.number().int().positive().optional(),
  submissionId:    z.number().int().positive().optional(),
  date:            z.string().min(1),
  validUntil:      z.string().optional(),
  executiveSummary:z.string().max(10000).optional(),
  clientNeeds:     z.string().max(10000).optional(),
  proposedSolution:z.string().max(10000).optional(),
  projectScope:    z.string().max(10000).optional(),
  deliverables:    z.string().max(10000).optional(),
  timeline:        z.string().max(5000).optional(),
  lineItems:       z.string().optional(),
  subtotal:        z.number().nonnegative().default(0),
  discountType:    z.enum(['fixed', 'percent']).default('fixed'),
  discountValue:   z.number().nonnegative().default(0),
  taxRate:         z.number().nonnegative().max(100).default(0),
  total:           z.number().nonnegative().default(0),
  currency:        z.string().length(3).default('USD'),
  paymentTerms:    z.string().max(2000).optional(),
  termsConditions: z.string().max(10000).optional(),
  notes:           z.string().max(5000).optional(),
})

// ── Expenses ──────────────────────────────────────────────────────
export const CreateExpenseSchema = z.object({
  title:     z.string().min(1).max(255).trim(),
  amount:    z.number().positive(),
  category:  z.string().min(1).max(100),
  date:      z.string().min(1),
  notes:     z.string().max(2000).optional(),
  recurring: z.boolean().default(false),
  frequency: z.string().max(50).optional(),
})

export const UpdateExpenseSchema = CreateExpenseSchema.partial()

// ── Kanban ────────────────────────────────────────────────────────
export const CreateTaskSchema = z.object({
  title:       z.string().min(1).max(255).trim(),
  description: z.string().max(5000).optional(),
  column:      z.enum(['backlog', 'in-progress', 'review', 'done']).default('backlog'),
  priority:    z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate:     z.string().optional(),
  order:       z.number().int().nonnegative().default(0),
})

export const UpdateTaskSchema = CreateTaskSchema.partial()

// ── Pagination ────────────────────────────────────────────────────
export const PaginationSchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

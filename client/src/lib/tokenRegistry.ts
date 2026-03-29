// ── Token Registry ─────────────────────────────────────────────────────────────
// Single source of truth for all template tokens.
// Used by ComposeEmailView and EmailTemplatesView for field type detection,
// category grouping, agency auto-fill, and line-item rendering.

export interface LineItem {
  id: string
  description: string
  qty: number
  unitPrice: number
}

export type FieldType = 'text' | 'textarea' | 'url' | 'email' | 'number' | 'date' | 'line-items'
export type TokenCategory = 'client' | 'agency' | 'invoice' | 'proposal' | 'custom'

export interface TokenDef {
  label: string
  category: TokenCategory
  fieldType: FieldType
  agencyDefault?: string
  hint?: string
}

export const TOKEN_REGISTRY: Record<string, TokenDef> = {
  // ── Client ──
  clientName:       { label: 'Client Full Name',    category: 'client',   fieldType: 'text' },
  clientFirstName:  { label: 'First Name',           category: 'client',   fieldType: 'text' },
  firstName:        { label: 'First Name',           category: 'client',   fieldType: 'text' },
  lastName:         { label: 'Last Name',            category: 'client',   fieldType: 'text' },
  clientEmail:      { label: 'Client Email',         category: 'client',   fieldType: 'email' },
  clientPhone:      { label: 'Client Phone',         category: 'client',   fieldType: 'text' },
  clientCompany:    { label: 'Company / Org',         category: 'client',   fieldType: 'text' },
  clientAddress:    { label: 'Client Address',       category: 'client',   fieldType: 'text' },
  clientWebsite:    { label: 'Client Website',       category: 'client',   fieldType: 'url' },
  projectName:      { label: 'Project Name',         category: 'client',   fieldType: 'text' },

  // ── Agency ──
  agencyName:       { label: 'Agency Name',          category: 'agency',   fieldType: 'text',  agencyDefault: 'Designs By Terrence Adderley' },
  agencyEmail:      { label: 'Agency Email',         category: 'agency',   fieldType: 'email', agencyDefault: 'terrenceadderley@designsbyta.com' },
  agencyPhone:      { label: 'Agency Phone',         category: 'agency',   fieldType: 'text',  agencyDefault: '' },
  agencyWebsite:    { label: 'Agency Website',       category: 'agency',   fieldType: 'url',   agencyDefault: 'https://www.designsbyta.com' },
  senderName:       { label: 'Sender Name',          category: 'agency',   fieldType: 'text',  agencyDefault: 'Terrence Adderley' },

  // ── Invoice ──
  invoiceNumber:    { label: 'Invoice #',            category: 'invoice',  fieldType: 'text' },
  invoiceTitle:     { label: 'Invoice Title',        category: 'invoice',  fieldType: 'text' },
  issuedDate:       { label: 'Issue Date',           category: 'invoice',  fieldType: 'date' },
  dueDate:          { label: 'Due Date',             category: 'invoice',  fieldType: 'date' },
  invoiceAmount:    { label: 'Invoice Amount',       category: 'invoice',  fieldType: 'number' },
  subtotal:         { label: 'Subtotal',             category: 'invoice',  fieldType: 'text' },
  discountValue:    { label: 'Discount',             category: 'invoice',  fieldType: 'text' },
  taxRate:          { label: 'Tax Rate',             category: 'invoice',  fieldType: 'text' },
  total:            { label: 'Total',                category: 'invoice',  fieldType: 'text' },
  currency:         { label: 'Currency',             category: 'invoice',  fieldType: 'text' },
  status:           { label: 'Invoice Status',       category: 'invoice',  fieldType: 'text' },
  paymentTerms:     { label: 'Payment Terms',        category: 'invoice',  fieldType: 'textarea' },
  stripeUrl:        { label: 'Stripe Payment Link',  category: 'invoice',  fieldType: 'url',   hint: 'Stripe hosted checkout URL for client payment' },
  lineItems:        { label: 'Line Items',           category: 'invoice',  fieldType: 'line-items', hint: 'Table rows: description, qty, unit price' },

  // ── Proposal ──
  proposalNumber:   { label: 'Proposal #',           category: 'proposal', fieldType: 'text' },
  proposalTitle:    { label: 'Proposal Title',       category: 'proposal', fieldType: 'text' },
  date:             { label: 'Proposal Date',        category: 'proposal', fieldType: 'date' },
  validUntil:       { label: 'Valid Until',          category: 'proposal', fieldType: 'date' },
  executiveSummary: { label: 'Executive Summary',    category: 'proposal', fieldType: 'textarea' },
  clientNeeds:      { label: 'Client Needs',         category: 'proposal', fieldType: 'textarea' },
  proposedSolution: { label: 'Proposed Solution',    category: 'proposal', fieldType: 'textarea' },
  projectScope:     { label: 'Project Scope',        category: 'proposal', fieldType: 'textarea' },
  deliverables:     { label: 'Deliverables',         category: 'proposal', fieldType: 'textarea' },
  timeline:         { label: 'Timeline',             category: 'proposal', fieldType: 'textarea' },
  signatureUrl:     { label: 'Signing Link URL',     category: 'proposal', fieldType: 'url' },

  // ── Custom / Content ──
  message:          { label: 'Message Body',         category: 'custom',   fieldType: 'textarea' },
  notes:            { label: 'Notes',                category: 'custom',   fieldType: 'textarea' },
  termsConditions:  { label: 'Terms & Conditions',   category: 'custom',   fieldType: 'textarea' },
  ctaText:          { label: 'Button Label',         category: 'custom',   fieldType: 'text' },
  ctaUrl:           { label: 'Button URL',           category: 'custom',   fieldType: 'url',   agencyDefault: 'https://www.designsbyta.com/contact' },
  subject:          { label: 'Email Subject',        category: 'custom',   fieldType: 'text' },
  buttonUrl:        { label: 'Button URL',           category: 'custom',   fieldType: 'url' },
  buttonLabel:      { label: 'Button Label',         category: 'custom',   fieldType: 'text' },
}

/** Returns the definition for a token, or a sensible fallback for unknown tokens. */
export function getTokenDef(token: string): TokenDef {
  return TOKEN_REGISTRY[token] ?? {
    label: token.replace(/([A-Z])/g, ' $1').replace(/\b\w/g, c => c.toUpperCase()).trim(),
    category: 'custom',
    fieldType: 'text',
  }
}

/**
 * Renders an array of LineItems into HTML <tr> rows.
 * Drop these rows inside a <tbody> in your template.
 * Style via .line-item-row / .line-item-desc / .line-item-qty /
 * .line-item-price / .line-item-total in your template CSS.
 */
export function renderLineItemsHtml(items: LineItem[]): string {
  if (!items.length) return ''
  return items
    .map(item => {
      const lineTotal = (item.qty * item.unitPrice).toFixed(2)
      return `<tr class="line-item-row">
  <td class="line-item-desc">${item.description}</td>
  <td class="line-item-qty">${item.qty}</td>
  <td class="line-item-price">$${Number(item.unitPrice).toFixed(2)}</td>
  <td class="line-item-total">$${lineTotal}</td>
</tr>`
    })
    .join('\n')
}

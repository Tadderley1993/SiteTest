/**
 * templateRenderer.ts
 *
 * Handles token substitution, HTML→PDF conversion, and document rendering
 * for proposal and invoice HTML templates.
 */

import type { Proposal } from './api'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LineItem {
  id?: string
  description: string
  qty?: number
  quantity?: number   // invoice uses 'quantity'
  unitPrice: number
  total?: number
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$',
}

function sym(currency: string | null | undefined): string {
  return CURRENCY_SYMBOLS[currency ?? 'USD'] ?? '$'
}

function fmt(amount: number, currency?: string | null): string {
  return `${sym(currency)}${amount.toFixed(2)}`
}

// ── Line Items HTML ───────────────────────────────────────────────────────────

/**
 * Builds <tr> rows for a line items table.
 * The template must have a <tbody> where {{lineItems}} is placed.
 */
export function buildLineItemsHtml(items: LineItem[], currency?: string | null): string {
  const s = sym(currency)
  return items
    .map(item => {
      const qty = item.qty ?? item.quantity ?? 1
      const total = item.total ?? qty * item.unitPrice
      return `<tr>
        <td>${item.description}</td>
        <td style="text-align:center">${qty}</td>
        <td style="text-align:right">${s}${item.unitPrice.toFixed(2)}</td>
        <td style="text-align:right">${s}${total.toFixed(2)}</td>
      </tr>`
    })
    .join('\n')
}

// ── Token Maps ────────────────────────────────────────────────────────────────

export function buildProposalTokenMap(
  proposal: Partial<Proposal>,
  lineItems: LineItem[],
  signatureUrl?: string,
): Record<string, string> {
  const currency = proposal.currency
  const subtotal  = proposal.subtotal ?? 0
  const discValue = proposal.discountValue ?? 0
  const discAmt   = proposal.discountType === 'percent'
    ? subtotal * (discValue / 100)
    : discValue
  const taxRate   = proposal.taxRate ?? 0
  const taxAmt    = (subtotal - discAmt) * (taxRate / 100)
  const total     = proposal.total ?? subtotal - discAmt + taxAmt

  return {
    // Client
    clientName:        proposal.clientName       ?? '',
    clientFirstName:   (proposal.clientName ?? '').split(' ')[0],
    clientEmail:       proposal.clientEmail      ?? '',
    clientPhone:       proposal.clientPhone      ?? '',
    clientCompany:     proposal.clientCompany    ?? '',
    clientAddress:     proposal.clientAddress    ?? '',

    // Proposal meta
    proposalTitle:     proposal.title            ?? '',
    proposalNumber:    (proposal as { proposalNumber?: string }).proposalNumber ?? '',
    date:              proposal.date             ?? '',
    validUntil:        proposal.validUntil       ?? '',

    // Content sections
    executiveSummary:  proposal.executiveSummary ?? '',
    clientNeeds:       proposal.clientNeeds      ?? '',
    proposedSolution:  proposal.proposedSolution ?? '',
    projectScope:      proposal.projectScope     ?? '',
    deliverables:      proposal.deliverables     ?? '',
    timeline:          proposal.timeline         ?? '',
    notes:             proposal.notes            ?? '',

    // Financials
    lineItems:         buildLineItemsHtml(lineItems, currency),
    subtotal:          fmt(subtotal, currency),
    discountValue:     fmt(discAmt, currency),
    taxRate:           `${taxRate}%`,
    total:             fmt(total, currency),
    currency:          currency ?? 'USD',
    paymentTerms:      proposal.paymentTerms     ?? '',
    termsConditions:   proposal.termsConditions  ?? '',

    // Signature & agency
    signatureUrl:      signatureUrl ?? '#',
    agencyName:        'Designs By Terrence Adderley',
    agencyEmail:       'terrenceadderley@designsbyta.com',
    agencyWebsite:     'www.designsbyta.com',
  }
}

// FullInvoice covers all fields used in InvoicesView (more complete than the api.ts Invoice type)
export interface FullInvoice {
  id?: number
  invoiceNumber?: string
  title?: string | null
  clientId?: number
  client?: { firstName: string; lastName: string; email: string }
  lineItems?: string | null
  currency?: string
  subtotal?: number
  discountType?: string
  discountValue?: number
  taxRate?: number
  amount?: number
  issuedDate?: string
  dueDate?: string
  status?: string
  notes?: string | null
  termsConditions?: string | null
  paypalInvoiceUrl?: string | null
}

export function buildInvoiceTokenMap(
  invoice: FullInvoice,
  lineItems: LineItem[],
): Record<string, string> {
  const currency  = invoice.currency
  const subtotal  = invoice.subtotal ?? 0
  const discValue = invoice.discountValue ?? 0
  const discAmt   = invoice.discountType === 'percent'
    ? subtotal * (discValue / 100)
    : discValue
  const taxRate   = invoice.taxRate ?? 0
  const taxAmt    = (subtotal - discAmt) * (taxRate / 100)
  const total     = invoice.amount ?? subtotal - discAmt + taxAmt

  const clientName = invoice.client
    ? `${invoice.client.firstName} ${invoice.client.lastName}`
    : ''

  return {
    // Client
    clientName,
    clientFirstName:   clientName.split(' ')[0],
    clientEmail:       invoice.client?.email ?? '',

    // Invoice meta
    invoiceNumber:     invoice.invoiceNumber  ?? '',
    invoiceTitle:      invoice.title          ?? '',
    issuedDate:        invoice.issuedDate     ?? '',
    dueDate:           invoice.dueDate        ?? '',
    status:            invoice.status         ?? 'draft',

    // Financials
    lineItems:         buildLineItemsHtml(lineItems, currency),
    subtotal:          fmt(subtotal, currency),
    discountValue:     fmt(discAmt, currency),
    taxRate:           `${taxRate}%`,
    total:             fmt(total, currency),
    currency:          currency ?? 'USD',
    notes:             invoice.notes              ?? '',
    termsConditions:   invoice.termsConditions    ?? '',
    paypalUrl:         invoice.paypalInvoiceUrl   ?? '',

    // Agency
    agencyName:        'Designs By Terrence Adderley',
    agencyEmail:       'terrenceadderley@designsbyta.com',
    agencyWebsite:     'www.designsbyta.com',
  }
}

// ── Token Substitution ────────────────────────────────────────────────────────

export function substituteTokens(
  html: string,
  tokens: Record<string, string>,
): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => tokens[key] ?? '')
}

// ── Full HTML Document Builder ────────────────────────────────────────────────

/**
 * Takes the raw htmlContent + cssContent from a saved template and returns
 * a complete, self-contained HTML document string with all tokens replaced.
 */
export function renderTemplateDocument(
  htmlContent: string,
  cssContent: string,
  tokens: Record<string, string>,
): string {
  const substituted = substituteTokens(htmlContent, tokens)

  // If the template is already a full HTML document, inject CSS into <head>
  if (/<html[\s>]/i.test(substituted)) {
    if (/<\/head>/i.test(substituted)) {
      return substituted.replace(/<\/head>/i, `<style>${cssContent}</style></head>`)
    }
    return substituted
  }

  // Otherwise wrap it
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${cssContent}</style>
</head>
<body>${substituted}</body>
</html>`
}

// ── html2pdf.js CDN loader ─────────────────────────────────────────────────────

type Html2PdfFn = () => { set: (o: unknown) => { from: (el: HTMLElement) => { outputPdf: (t: string) => Promise<Blob>; save: () => Promise<void> } }; from: (el: HTMLElement) => { outputPdf: (t: string) => Promise<Blob>; save: () => Promise<void> } }

async function loadHtml2Pdf(): Promise<Html2PdfFn> {
  if ((window as unknown as Record<string, unknown>).html2pdf) {
    return (window as unknown as Record<string, Html2PdfFn>).html2pdf
  }
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
  return (window as unknown as Record<string, Html2PdfFn>).html2pdf
}

// ── PDF Generation ────────────────────────────────────────────────────────────

/**
 * Converts a full HTML document string to a PDF Blob using html2pdf.js.
 * Returns the Blob so it can be attached to an email or downloaded.
 */
export async function htmlToPdfBlob(
  fullHtml: string,
  filename = 'document.pdf',
): Promise<Blob> {
  const html2pdf = await loadHtml2Pdf()

  // Create an off-screen container for html2pdf to render into
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:210mm;'
  container.innerHTML = fullHtml
  document.body.appendChild(container)

  try {
    const blob: Blob = await html2pdf()
      .set({
        margin:      [10, 10, 10, 10],   // mm
        filename,
        image:       { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(container)
      .outputPdf('blob') as Blob
    return blob
  } finally {
    document.body.removeChild(container)
  }
}

/**
 * Converts a Blob to a base64 string (strips the data URL prefix).
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Triggers a browser download of the rendered HTML as a PDF.
 */
export async function downloadTemplateAsPdf(
  htmlContent: string,
  cssContent: string,
  tokens: Record<string, string>,
  filename: string,
): Promise<void> {
  const fullHtml = renderTemplateDocument(htmlContent, cssContent, tokens)
  const html2pdf = await loadHtml2Pdf()

  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:210mm;'
  container.innerHTML = fullHtml
  document.body.appendChild(container)

  try {
    await html2pdf()
      .set({
        margin:      [10, 10, 10, 10],
        filename,
        image:       { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(container)
      .save()
  } finally {
    document.body.removeChild(container)
  }
}

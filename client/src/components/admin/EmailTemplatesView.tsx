import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { getTokenDef, renderLineItemsHtml, LineItem } from '../../lib/tokenRegistry'
import {
  EmailTemplate,
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  sendEmailTemplate,
} from '../../lib/api'

// ── Doc type tabs ──────────────────────────────────────────────────────────────

type DocType = 'email' | 'proposal' | 'invoice'

const DOC_TABS: { id: DocType; label: string; icon: string }[] = [
  { id: 'email',    label: 'Email',     icon: 'mail' },
  { id: 'proposal', label: 'Proposals', icon: 'description' },
  { id: 'invoice',  label: 'Invoices',  icon: 'receipt_long' },
]

// ── Email sub-categories ───────────────────────────────────────────────────────

const EMAIL_CATEGORIES = [
  { value: 'welcome',    label: 'Welcome',     icon: 'waving_hand' },
  { value: 'invoice',    label: 'Invoice',     icon: 'receipt_long' },
  { value: 'proposal',   label: 'Proposal',    icon: 'description' },
  { value: 'followup',   label: 'Follow-up',   icon: 'reply' },
  { value: 'reminder',   label: 'Reminder',    icon: 'notifications_active' },
  { value: 'onboarding',    label: 'Onboarding',    icon: 'rocket_launch' },
  { value: 'personalized', label: 'Personalized',  icon: 'person' },
  { value: 'general',      label: 'General',       icon: 'mail' },
]

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  EMAIL_CATEGORIES.map(c => [c.value, c.label])
)

// ── AI Prompts ─────────────────────────────────────────────────────────────────

const AI_PROMPTS: Record<DocType, { title: string; text: string }> = {
  email: {
    title: 'AI Prompt — Email Template',
    text: `Design a professional HTML email template for "Designs By Terrence Adderley" (DTA), a Boston MA freelance web design agency.

━━━ HARD RULES — EMAIL CLIENTS ARE NOT BROWSERS ━━━

1. NO external scripts of any kind.
   ✗ <script src="..."> — blocked by every email client
   ✗ Tailwind CDN, Bootstrap CDN, any CSS framework loaded via <script>
   ✗ Any JavaScript whatsoever
   All styling must be standard CSS only.

2. NO icon fonts. Not Material Icons. Not Font Awesome. Not Material Symbols.
   Email clients (Gmail, Outlook, Apple Mail) strip external font files.
   The icon name renders as literal raw text — e.g. "arrow_forward" or "mail".
   ✓ Use emoji instead: 📧 → 🌐 ✅ 🚀 💼 📄 ⏰ ✍️
   ✓ Or use inline SVG (self-contained, no external requests).

3. NO CSS frameworks that require a JS runtime.
   Tailwind utility classes do nothing without the Tailwind script. Do not use them.
   Write plain CSS in a <style> block in the <head>.

4. Google Fonts via <link> is acceptable — it is a CSS request, not a script.
   Brand fonts: Manrope (headlines, weights 700–800), Inter (body, weights 400–500).

5. Multi-column layout must use HTML <table role="presentation"> for the grid sections,
   not CSS Grid or Flexbox — Outlook and many mobile clients ignore those for layout.
   Single-column sections may use <div> freely.

6. All critical layout/color styles should be inline OR in the <style> block.
   Do not rely on classes that reference an external stylesheet.

━━━ BRAND ━━━

Dark variant (preferred):
  background: #121315   surface: #1f2021   surface-low: #0d0e0f
  accent (gold): #e4c463   accent-dim: #c6a84b   on-accent: #3c2f00
  text-primary: #e3e2e3   text-muted: #cfc6b2

Light variant (acceptable for simpler templates):
  background: #ffffff   surface: #f9f9f9
  accent (gold): #c6a84b   text-primary: #111111   text-muted: #555555

Max width: 650px, centered. Mobile breakpoint at 480px via @media in <style>.

━━━ CATEGORY — pick one and build accordingly ━━━

  welcome     – Warm welcome for a new client
  followup    – Following up on an unanswered proposal
  reminder    – Reminder for an upcoming or overdue payment/invoice
  onboarding  – Kick-off instructions and next steps for a new project
  invoice     – Notification that an invoice has been sent
  proposal    – Notification that a proposal has been shared
  general     – Flexible template for any message

━━━ TOKENS — include exactly as shown ━━━

  {{clientName}}       Full name of the recipient
  {{clientFirstName}}  First name only
  {{agencyName}}       Agency name (Designs By Terrence Adderley)
  {{agencyEmail}}      terrenceadderley@designsbyta.com
  {{agencyWebsite}}    www.designsbyta.com
  {{message}}          Main body copy (plain text, may contain line breaks)
  {{ctaText}}          Call-to-action button label (e.g. "View Proposal")
  {{ctaUrl}}           Call-to-action button URL

Add category-specific tokens where they make sense (e.g. {{invoiceNumber}}, {{dueDate}}).

Return ONLY valid HTML — no markdown, no code fences, no explanation. The response must start with <!DOCTYPE html>.`,
  },

  proposal: {
    title: 'AI Prompt — Proposal Document Template',
    text: `Design a professional HTML document template for a client-facing project proposal from "Designs By Terrence Adderley" (DTA), a Boston MA freelance web design agency.

Style requirements:
- Clean, premium, A4-friendly layout (max width 900px, centered, good print margins)
- Brand: dark (#08090A), gold accent (#C6A84B), clean white sections
- Use system fonts (Georgia, Arial, or similar — no external requests)
- Include visual section dividers, clear hierarchy, professional typography
- Should look great both on screen and when printed/saved as PDF
- CRITICAL: Do NOT use icon fonts (Material Icons, Font Awesome, etc.) — they will not render in email or PDF. Use emoji or inline SVG for any icons.

Sections to include (in order):
  1. Header — agency logo area (text-based: "DTA / Designs By Terrence Adderley"), proposal title, proposal number, date
  2. Client info block — client name, company, address
  3. Executive Summary — introductory paragraph
  4. Client Needs — the problem or goal
  5. Proposed Solution — what DTA will deliver
  6. Project Scope — detailed scope description
  7. Deliverables — bulleted or listed
  8. Timeline — project timeline overview
  9. Investment — line items table + subtotal / discount / tax / total
  10. Payment Terms
  11. Terms & Conditions
  12. Notes (optional)
  13. Signature block — client name, signature line, date line, accept/decline CTA button
  14. Footer — agency contact info

Use these {{tokens}} exactly — they will be replaced with real data:
  {{clientName}}         Client full name
  {{clientFirstName}}    Client first name
  {{clientEmail}}        Client email
  {{clientPhone}}        Client phone
  {{clientCompany}}      Client company/organization
  {{clientAddress}}      Client address
  {{proposalTitle}}      Title of the proposal
  {{proposalNumber}}     Reference number (e.g. P-0042)
  {{date}}               Proposal date
  {{validUntil}}         Expiry date
  {{executiveSummary}}   Executive summary paragraph
  {{clientNeeds}}        Client needs / problem statement
  {{proposedSolution}}   Proposed solution narrative
  {{projectScope}}       Full project scope description
  {{deliverables}}       Deliverables list (plain text, line-separated)
  {{timeline}}           Project timeline description
  {{lineItems}}          Pre-built HTML <tr> rows for the line items table — inject inside a <tbody>
  {{subtotal}}           Subtotal (formatted, e.g. $4,500.00)
  {{discountValue}}      Discount amount (e.g. $250.00)
  {{taxRate}}            Tax rate (e.g. 8.5%)
  {{total}}              Final total (e.g. $4,750.00)
  {{currency}}           Currency code (e.g. USD)
  {{paymentTerms}}       Payment terms paragraph
  {{termsConditions}}    Full terms and conditions text
  {{notes}}              Additional notes (may be empty)
  {{signatureUrl}}       URL where client clicks to legally sign online
  {{agencyName}}         Designs By Terrence Adderley
  {{agencyEmail}}        terrenceadderley@designsbyta.com
  {{agencyWebsite}}      www.designsbyta.com

Return ONLY valid HTML (no markdown code fences). Embed all CSS inside a <style> block in the <head>. Make it self-contained — no external CSS or JS files.`,
  },

  invoice: {
    title: 'AI Prompt — Invoice Document Template',
    text: `Design a professional HTML document template for a client invoice from "Designs By Terrence Adderley" (DTA), a Boston MA freelance web design agency.

Style requirements:
- Clean, trustworthy, finance-appropriate layout (max width 850px, centered)
- Brand: dark (#08090A), gold accent (#C6A84B), white background sections
- Use system fonts (Arial, Helvetica, or similar)
- Print-friendly — looks great as a PDF
- Include a clear visual hierarchy: header, client info, line items table, totals, payment CTA
- CRITICAL: Do NOT use icon fonts (Material Icons, Font Awesome, etc.) — they will not render in email or PDF. Use emoji or inline SVG for any icons.

Sections to include (in order):
  1. Header — agency name "DTA / Designs By Terrence Adderley", large "INVOICE" label, invoice number, issue date, due date
  2. Bill To block — client name, email
  3. Invoice title / description
  4. Line items table — columns: Description | Qty | Unit Price | Total — with alternating row shading
  5. Totals block — subtotal, discount (if any), tax, bold total
  6. Status badge — shows current invoice status (sent/paid/overdue)
  7. Payment section — Stripe payment button/link + payment terms
  8. Notes
  9. Terms & Conditions (smaller text)
  10. Footer — agency contact info

Use these {{tokens}} exactly — they will be replaced with real data:
  {{clientName}}         Client full name
  {{clientFirstName}}    Client first name
  {{clientEmail}}        Client email
  {{invoiceNumber}}      Invoice reference number (e.g. INV-0042)
  {{invoiceTitle}}       Invoice title or description
  {{issuedDate}}         Date invoice was issued
  {{dueDate}}            Payment due date
  {{status}}             Invoice status (draft / sent / paid / overdue)
  {{lineItems}}          Pre-built HTML <tr> rows for the line items table — inject inside a <tbody>
  {{subtotal}}           Subtotal before discount/tax (e.g. $4,500.00)
  {{discountValue}}      Discount amount (e.g. $250.00)
  {{taxRate}}            Tax rate (e.g. 8.5%)
  {{total}}              Final total (e.g. $4,750.00)
  {{currency}}           Currency code (e.g. USD)
  {{notes}}              Any additional notes
  {{termsConditions}}    Payment terms and conditions text
  {{stripeUrl}}          Stripe payment link (may be empty — hide Pay Now button if so)
  {{agencyName}}         Designs By Terrence Adderley
  {{agencyEmail}}        terrenceadderley@designsbyta.com
  {{agencyWebsite}}      www.designsbyta.com

Return ONLY valid HTML (no markdown code fences). Embed all CSS inside a <style> block in the <head>. Make it fully self-contained — no external dependencies.`,
  },
}

// ── Token Reference Data ───────────────────────────────────────────────────────

type TokenGroup = {
  label: string
  color: string        // tailwind bg + text classes for the group badge
  tokens: { token: string; description: string }[]
}

const TOKEN_REFERENCE: Record<DocType, TokenGroup[]> = {
  email: [
    {
      label: 'Client',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      tokens: [
        { token: '{{clientName}}',      description: 'Full name of the recipient (e.g. "John Smith")' },
        { token: '{{clientFirstName}}', description: 'First name only — use for personal greetings (e.g. "John")' },
        { token: '{{clientEmail}}',     description: "Recipient's email address" },
      ],
    },
    {
      label: 'Content',
      color: 'bg-violet-50 text-violet-700 border-violet-200',
      tokens: [
        { token: '{{message}}',  description: 'Main body copy — plain text, may contain line breaks' },
        { token: '{{ctaText}}',  description: 'Call-to-action button label (e.g. "View Proposal", "Pay Now")' },
        { token: '{{ctaUrl}}',   description: 'URL the CTA button links to' },
        { token: '{{subject}}',  description: 'Email subject line — useful to display inside the header banner' },
      ],
    },
    {
      label: 'Agency',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      tokens: [
        { token: '{{agencyName}}',    description: 'Designs By Terrence Adderley' },
        { token: '{{agencyEmail}}',   description: 'terrenceadderley@designsbyta.com' },
        { token: '{{agencyWebsite}}', description: 'www.designsbyta.com' },
      ],
    },
  ],

  proposal: [
    {
      label: 'Client Info',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      tokens: [
        { token: '{{clientName}}',      description: 'Full name of the client (e.g. "Jane Doe")' },
        { token: '{{clientFirstName}}', description: 'First name only — for personalized headings' },
        { token: '{{clientEmail}}',     description: "Client's email address" },
        { token: '{{clientPhone}}',     description: "Client's phone number" },
        { token: '{{clientCompany}}',   description: "Client's company or organization name" },
        { token: '{{clientAddress}}',   description: "Client's full mailing address" },
      ],
    },
    {
      label: 'Proposal Meta',
      color: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      tokens: [
        { token: '{{proposalTitle}}',  description: 'Title of the proposal document' },
        { token: '{{proposalNumber}}', description: 'Auto-generated reference number (e.g. P-0042)' },
        { token: '{{date}}',           description: 'Date the proposal was created' },
        { token: '{{validUntil}}',     description: 'Expiry date — after this the proposal is no longer valid' },
      ],
    },
    {
      label: 'Content Sections',
      color: 'bg-violet-50 text-violet-700 border-violet-200',
      tokens: [
        { token: '{{executiveSummary}}',  description: 'Opening paragraph summarizing the engagement' },
        { token: '{{clientNeeds}}',       description: "Description of the client's problem or goal" },
        { token: '{{proposedSolution}}',  description: "DTA's proposed approach and solution" },
        { token: '{{projectScope}}',      description: 'Full detailed scope of work' },
        { token: '{{deliverables}}',      description: 'List of project deliverables (line-separated text)' },
        { token: '{{timeline}}',          description: 'Project timeline overview or milestones' },
        { token: '{{notes}}',             description: 'Additional notes — may be empty, wrap in a conditional comment' },
      ],
    },
    {
      label: 'Financials',
      color: 'bg-green-50 text-green-700 border-green-200',
      tokens: [
        { token: '{{lineItems}}',     description: 'Pre-built HTML <tr> rows — inject directly inside a <tbody> tag in your table' },
        { token: '{{subtotal}}',      description: 'Subtotal before discount and tax (e.g. "$4,500.00")' },
        { token: '{{discountValue}}', description: 'Discount amount — show/hide this row if $0.00' },
        { token: '{{taxRate}}',       description: 'Tax rate as a percentage (e.g. "8.5%")' },
        { token: '{{total}}',         description: 'Final total after discount and tax (e.g. "$4,885.50")' },
        { token: '{{currency}}',      description: 'Currency code (e.g. "USD", "CAD")' },
        { token: '{{paymentTerms}}',  description: 'Payment schedule and terms paragraph' },
      ],
    },
    {
      label: 'Legal & Signature',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      tokens: [
        { token: '{{termsConditions}}', description: 'Full terms and conditions text block' },
        { token: '{{signatureUrl}}',    description: 'URL the client clicks to legally sign the proposal online — use as an anchor/button href' },
      ],
    },
    {
      label: 'Agency',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      tokens: [
        { token: '{{agencyName}}',    description: 'Designs By Terrence Adderley' },
        { token: '{{agencyEmail}}',   description: 'terrenceadderley@designsbyta.com' },
        { token: '{{agencyWebsite}}', description: 'www.designsbyta.com' },
      ],
    },
  ],

  invoice: [
    {
      label: 'Client Info',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      tokens: [
        { token: '{{clientName}}',      description: 'Full name of the client' },
        { token: '{{clientFirstName}}', description: 'First name — for personalized greeting lines' },
        { token: '{{clientEmail}}',     description: "Client's email address" },
      ],
    },
    {
      label: 'Invoice Meta',
      color: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      tokens: [
        { token: '{{invoiceNumber}}', description: 'Invoice reference number (e.g. "INV-0042")' },
        { token: '{{invoiceTitle}}',  description: 'Short description or title for the invoice' },
        { token: '{{issuedDate}}',    description: 'Date the invoice was issued' },
        { token: '{{dueDate}}',       description: 'Date payment is due' },
        { token: '{{status}}',        description: 'Current status: draft | sent | paid | overdue — use for a colored badge' },
      ],
    },
    {
      label: 'Financials',
      color: 'bg-green-50 text-green-700 border-green-200',
      tokens: [
        { token: '{{lineItems}}',     description: 'Pre-built HTML <tr> rows — inject directly inside a <tbody> tag in your table' },
        { token: '{{subtotal}}',      description: 'Subtotal before discount and tax (e.g. "$4,500.00")' },
        { token: '{{discountValue}}', description: 'Discount amount — hide this row if $0.00' },
        { token: '{{taxRate}}',       description: 'Tax rate as a percentage (e.g. "8.5%")' },
        { token: '{{total}}',         description: 'Final amount due (e.g. "$4,885.50")' },
        { token: '{{currency}}',      description: 'Currency code (e.g. "USD")' },
      ],
    },
    {
      label: 'Payment & Legal',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      tokens: [
        { token: '{{stripeUrl}}',       description: 'Stripe payment link — hide the Pay Now button entirely if this is empty' },
        { token: '{{notes}}',           description: 'Any extra notes for the client — may be empty' },
        { token: '{{termsConditions}}', description: 'Payment terms and conditions text' },
      ],
    },
    {
      label: 'Agency',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      tokens: [
        { token: '{{agencyName}}',    description: 'Designs By Terrence Adderley' },
        { token: '{{agencyEmail}}',   description: 'terrenceadderley@designsbyta.com' },
        { token: '{{agencyWebsite}}', description: 'www.designsbyta.com' },
      ],
    },
  ],
}

// ── Token Reference Component ─────────────────────────────────────────────────

function TokenReference({ docType }: { docType: DocType }) {
  const [open, setOpen] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const groups = TOKEN_REFERENCE[docType]

  const totalTokens = groups.reduce((n, g) => n + g.tokens.length, 0)

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token).then(() => {
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 1500)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
      >
        <span className="material-symbols-outlined text-[20px] text-zinc-400">data_object</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-black">Token Reference</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">{totalTokens} tokens available · click any token to copy</p>
        </div>
        <span className={`material-symbols-outlined text-[20px] text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          {groups.map(group => (
            <div key={group.label} className="px-5 py-4">
              {/* Group label */}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-3 ${group.color}`}>
                {group.label}
              </div>

              {/* Token rows */}
              <div className="space-y-2">
                {group.tokens.map(({ token, description }) => {
                  const isCopied = copiedToken === token
                  return (
                    <div key={token} className="flex items-start gap-3">
                      {/* Token chip — clickable to copy */}
                      <button
                        type="button"
                        onClick={() => handleCopyToken(token)}
                        title="Click to copy"
                        className={`flex-shrink-0 flex items-center gap-1 font-mono text-[11px] px-2 py-1 rounded-md border transition-all ${
                          isCopied
                            ? 'bg-green-50 border-green-300 text-green-700'
                            : 'bg-[#1e1e1e] border-zinc-700 text-[#9cdcfe] hover:border-zinc-400'
                        }`}
                      >
                        {isCopied
                          ? <><span className="material-symbols-outlined text-[12px]">check</span> copied</>
                          : token
                        }
                      </button>

                      {/* Description */}
                      <p className="text-xs text-zinc-500 leading-relaxed pt-1">{description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Footer note */}
          <div className="px-5 py-3 bg-zinc-50 flex items-start gap-2">
            <span className="material-symbols-outlined text-[14px] text-zinc-400 mt-0.5 flex-shrink-0">info</span>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Tokens are replaced with live data when the template is rendered. If a token has no value (e.g. empty optional field), it outputs an empty string — design defensively for blank sections.
              <br />
              <strong className="text-zinc-500">{'{{lineItems}}'}</strong> injects raw HTML rows — always place it inside a <code className="bg-zinc-200 px-1 rounded">{'<tbody>'}</code> tag.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Variable detection ────────────────────────────────────────────────────────

function extractVars(html: string, css: string): string[] {
  const combined = html + css
  const matches = [...combined.matchAll(/\{\{(\w+)\}\}/g)]
  return [...new Set(matches.map(m => m[1]))]
}

function humanLabel(varName: string): string {
  return varName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()
}

// ── Agency defaults ───────────────────────────────────────────────────────────

const AGENCY_DEFAULTS: Record<string, string> = {
  agencyName:    'Designs By Terrence Adderley',
  agencyEmail:   'terrenceadderley@designsbyta.com',
  agencyWebsite: 'https://www.designsbyta.com',
  ctaUrl:        'https://www.designsbyta.com/contact',
}

function applyAgencyDefaults(vars: string[], current: Record<string, string>): Record<string, string> {
  const updated = { ...current }
  vars.forEach(v => {
    if (AGENCY_DEFAULTS[v] && !updated[v]) updated[v] = AGENCY_DEFAULTS[v]
  })
  return updated
}

function removeAgencyDefaults(vars: string[], current: Record<string, string>): Record<string, string> {
  const updated = { ...current }
  vars.forEach(v => {
    if (AGENCY_DEFAULTS[v] && updated[v] === AGENCY_DEFAULTS[v]) delete updated[v]
  })
  return updated
}

// ── Preview builder ───────────────────────────────────────────────────────────

function buildPreviewDoc(html: string, css: string, vars: Record<string, string>, lineItems?: LineItem[]): string {
  const allVars = lineItems?.length ? { ...vars, lineItems: renderLineItemsHtml(lineItems) } : vars
  const substituted = (html + '').replace(/\{\{(\w+)\}\}/g, (_, k) => allVars[k] ?? `<span style="background:#fef9c3;color:#92400e;padding:0 4px;border-radius:3px">{{${k}}}</span>`)
  if (/<html[\s>]/i.test(substituted)) {
    return substituted.replace(/<\/head>/i, `<style>${css}</style></head>`)
  }
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>${substituted}</body></html>`
}

// ── Personalized template builder ─────────────────────────────────────────────

interface PersonalizedFields {
  headerText: string
  headerColor: string
  greeting: string
  message: string
  ctaText: string
  ctaUrl: string
  footerEmail: string
  footerWebsite: string
  accentColor: string
}

const PERSONALIZED_DEFAULTS: PersonalizedFields = {
  headerText: 'A Message For You',
  headerColor: '#111111',
  greeting: 'Hi {{clientName}},',
  message: '',
  ctaText: 'Get in Touch',
  ctaUrl: 'https://www.designsbyta.com/contact',
  footerEmail: 'terrenceadderley@designsbyta.com',
  footerWebsite: 'https://www.designsbyta.com',
  accentColor: '#C6A84B',
}

function buildPersonalizedHtml(f: PersonalizedFields): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr><td style="background:${f.headerColor};padding:32px 40px">
          <p style="margin:0;font-size:24px;font-weight:700;color:#fff;letter-spacing:-0.5px">${f.headerText}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px">
          <p style="margin:0 0 16px;font-size:14px;color:#111">${f.greeting}</p>
          <p style="margin:0 0 28px;font-size:14px;color:#444;line-height:1.75">{{message}}</p>
          <!-- CTA button -->
          <table cellpadding="0" cellspacing="0"><tr><td>
            <a href="{{ctaUrl}}" style="display:inline-block;background:${f.accentColor};color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px">{{ctaText}}</a>
          </td></tr></table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid #f0f0f0;background:#fafafa">
          <p style="margin:0;font-size:12px;color:#999">Designs By Terrence Adderley &middot; <a href="${f.footerWebsite}" style="color:#999">${f.footerWebsite}</a> &middot; ${f.footerEmail}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function parsePersonalizedFields(htmlContent: string): PersonalizedFields | null {
  try {
    const headerColorMatch = htmlContent.match(/background:(#[0-9a-fA-F]{3,8});padding:32px/)
    const headerTextMatch = htmlContent.match(/letter-spacing:-0\.5px">(.*?)<\/p>/)
    const greetingMatch = htmlContent.match(/margin:0 0 16px;font-size:14px;color:#111">(.*?)<\/p>/)
    const accentColorMatch = htmlContent.match(/background:(#[0-9a-fA-F]{3,8});color:#fff;font-size:14px;font-weight:700/)
    const footerWebsiteMatch = htmlContent.match(/href="(https?:\/\/[^"]+)"[^>]*style="color:#999"/)
    const footerEmailMatch = htmlContent.match(/&middot;\s*([^\s<&]+@[^\s<&]+)\s*<\/p>/)

    if (!headerColorMatch || !headerTextMatch) return null

    const footerWebsite = footerWebsiteMatch?.[1] ?? PERSONALIZED_DEFAULTS.footerWebsite
    const footerEmail = footerEmailMatch?.[1] ?? PERSONALIZED_DEFAULTS.footerEmail

    return {
      headerColor: headerColorMatch[1],
      headerText: headerTextMatch[1],
      greeting: greetingMatch?.[1] ?? PERSONALIZED_DEFAULTS.greeting,
      message: '',
      ctaText: '',
      ctaUrl: '',
      footerEmail,
      footerWebsite,
      accentColor: accentColorMatch?.[1] ?? PERSONALIZED_DEFAULTS.accentColor,
    }
  } catch {
    return null
  }
}

// ── Personalized form component ───────────────────────────────────────────────

interface ColorFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-9 h-9 rounded border border-zinc-200 cursor-pointer p-0.5 bg-white"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>
    </div>
  )
}

function PersonalizedFormBuilder({
  fields,
  onChange,
}: {
  fields: PersonalizedFields
  onChange: (f: PersonalizedFields) => void
}) {
  const set = (key: keyof PersonalizedFields) => (val: string) =>
    onChange({ ...fields, [key]: val })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Header Text</label>
          <input
            type="text"
            value={fields.headerText}
            onChange={e => set('headerText')(e.target.value)}
            placeholder="Banner / title text"
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
        <ColorField label="Header Color" value={fields.headerColor} onChange={set('headerColor')} />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Greeting</label>
        <input
          type="text"
          value={fields.greeting}
          onChange={e => set('greeting')(e.target.value)}
          placeholder="Hi {{clientName}},"
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Message <span className="normal-case font-normal text-zinc-400">— use {'{{tokens}}'} for dynamic values</span></label>
        <textarea
          value={fields.message}
          onChange={e => set('message')(e.target.value)}
          placeholder="Your message here. You can use {{tokens}} for dynamic content."
          rows={5}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">CTA Button Text</label>
          <input
            type="text"
            value={fields.ctaText}
            onChange={e => set('ctaText')(e.target.value)}
            placeholder="Get in Touch"
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">CTA URL</label>
          <input
            type="text"
            value={fields.ctaUrl}
            onChange={e => set('ctaUrl')(e.target.value)}
            placeholder="https://www.designsbyta.com/contact"
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Footer Email</label>
          <input
            type="text"
            value={fields.footerEmail}
            onChange={e => set('footerEmail')(e.target.value)}
            placeholder="terrenceadderley@designsbyta.com"
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Footer Website</label>
          <input
            type="text"
            value={fields.footerWebsite}
            onChange={e => set('footerWebsite')(e.target.value)}
            placeholder="https://www.designsbyta.com"
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
      </div>

      <ColorField label="Accent Color" value={fields.accentColor} onChange={set('accentColor')} />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CodeEditor({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      className="w-full h-72 font-mono text-[13px] leading-relaxed bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black/20 border border-zinc-200"
    />
  )
}

function LineItemBuilder({
  items,
  onChange,
}: {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
}) {
  const nextId = useRef(1)
  function addRow() {
    onChange([...items, { id: String(nextId.current++), description: '', qty: 1, unitPrice: 0 }])
  }
  function removeRow(id: string) { onChange(items.filter(i => i.id !== id)) }
  function updateRow(id: string, field: keyof Omit<LineItem, 'id'>, value: string) {
    onChange(items.map(i => i.id !== id ? i : { ...i, [field]: field === 'description' ? value : Number(value) || 0 }))
  }
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="grid gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1"
          style={{ gridTemplateColumns: '1fr 60px 90px 80px 28px' }}>
          <span>Description</span><span className="text-center">Qty</span>
          <span className="text-right">Unit Price</span><span className="text-right">Total</span><span />
        </div>
      )}
      {items.map(item => {
        const lineTotal = (item.qty * item.unitPrice).toFixed(2)
        return (
          <div key={item.id} className="grid gap-1.5 items-center"
            style={{ gridTemplateColumns: '1fr 60px 90px 80px 28px' }}>
            <input type="text" value={item.description} onChange={e => updateRow(item.id, 'description', e.target.value)}
              placeholder="Service or item…" className="border border-zinc-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10" />
            <input type="number" min="0" step="1" value={item.qty === 0 ? '' : item.qty}
              onChange={e => updateRow(item.id, 'qty', e.target.value)}
              className="border border-zinc-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-black/10" />
            <input type="number" min="0" step="0.01" value={item.unitPrice === 0 ? '' : item.unitPrice}
              onChange={e => updateRow(item.id, 'unitPrice', e.target.value)} placeholder="0.00"
              className="border border-zinc-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-black/10" />
            <div className="text-sm font-semibold text-right text-zinc-600 pr-1">${lineTotal}</div>
            <button type="button" onClick={() => removeRow(item.id)}
              className="w-6 h-6 rounded flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        )
      })}
      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={addRow}
          className="flex items-center gap-1 text-xs font-semibold text-black hover:text-zinc-600 transition-colors">
          <span className="material-symbols-outlined text-[14px]">add</span>Add Line Item
        </button>
        {items.length > 0 && <span className="text-xs font-bold text-zinc-600">Subtotal: ${subtotal.toFixed(2)}</span>}
      </div>
    </div>
  )
}

function VariableFields({
  vars,
  values,
  lineItems,
  onChange,
  onLineItemsChange,
}: {
  vars: string[]
  values: Record<string, string>
  lineItems: LineItem[]
  onChange: (key: string, val: string) => void
  onLineItemsChange: (items: LineItem[]) => void
}) {
  const nonLineItemVars = vars.filter(v => getTokenDef(v).fieldType !== 'line-items')
  const hasLineItems = vars.includes('lineItems')

  if (nonLineItemVars.length === 0 && !hasLineItems) {
    return (
      <p className="text-xs text-zinc-400 italic">
        No variables detected. Use <code className="bg-zinc-100 px-1 rounded">{'{{variableName}}'}</code> in your HTML or CSS.
      </p>
    )
  }
  const inputClass = 'w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10'
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {nonLineItemVars.map(v => {
          const def = getTokenDef(v)
          const isWide = def.fieldType === 'textarea'
          return (
            <div key={v} className={isWide ? 'sm:col-span-2' : ''}>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                {def.label}
              </label>
              {def.fieldType === 'textarea' ? (
                <textarea rows={3} value={values[v] ?? ''} onChange={e => onChange(v, e.target.value)}
                  placeholder={`{{${v}}}`} className={`${inputClass} resize-y`} />
              ) : def.fieldType === 'url' ? (
                <input type="url" value={values[v] ?? ''} onChange={e => onChange(v, e.target.value)}
                  placeholder="https://" className={inputClass} />
              ) : def.fieldType === 'email' ? (
                <input type="email" value={values[v] ?? ''} onChange={e => onChange(v, e.target.value)}
                  placeholder="email@example.com" className={inputClass} />
              ) : def.fieldType === 'number' ? (
                <input type="number" step="0.01" value={values[v] ?? ''} onChange={e => onChange(v, e.target.value)}
                  placeholder="0.00" className={inputClass} />
              ) : def.fieldType === 'date' ? (
                <input type="date" value={values[v] ?? ''} onChange={e => onChange(v, e.target.value)}
                  className={inputClass} />
              ) : (
                <input type="text" value={values[v] ?? ''} onChange={e => onChange(v, e.target.value)}
                  placeholder={`{{${v}}}`} className={inputClass} />
              )}
            </div>
          )
        })}
      </div>
      {hasLineItems && (
        <div className="pt-2 border-t border-zinc-100">
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Line Items <span className="normal-case font-normal text-zinc-400">— injected as table rows</span>
          </label>
          <LineItemBuilder items={lineItems} onChange={onLineItemsChange} />
        </div>
      )}
    </div>
  )
}

// ── AI Prompt Box ─────────────────────────────────────────────────────────────

function AiPromptBox({ docType }: { docType: DocType }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const prompt = AI_PROMPTS[docType]

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="border-t border-zinc-100">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px] text-zinc-400">auto_awesome</span>
        <span className="text-xs font-semibold text-zinc-600 flex-1">AI Prompt</span>
        <span className={`material-symbols-outlined text-[16px] text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Copy this prompt into Google Stitch, ChatGPT, or any AI tool to generate a {docType} template. Paste the returned HTML directly into the editor.
          </p>
          <div className="relative">
            <pre className="text-[10px] leading-relaxed bg-zinc-50 border border-zinc-200 rounded-lg p-3 whitespace-pre-wrap font-mono text-zinc-600 max-h-64 overflow-y-auto">
              {prompt.text}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-white border border-zinc-200 rounded text-[10px] font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[12px]">{copied ? 'check' : 'content_copy'}</span>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Send Modal ────────────────────────────────────────────────────────────────

function SendModal({ template, onClose }: { template: EmailTemplate; onClose: () => void }) {
  const vars = extractVars(template.htmlContent, template.cssContent ?? '')
  const [to, setTo] = useState('')
  const [varValues, setVarValues] = useState<Record<string, string>>(() => applyAgencyDefaults(vars, {}))
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [agencyAutoFill, setAgencyAutoFill] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const handleSend = async () => {
    if (!to) { setErr('Recipient email is required'); return }
    setSending(true)
    setErr('')
    try {
      const payload = { ...varValues }
      if (vars.includes('lineItems')) payload.lineItems = renderLineItemsHtml(lineItems)
      await sendEmailTemplate(template.id, to, payload)
      setSent(true)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setErr(msg ?? 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        {sent ? (
          <div className="text-center py-6">
            <span className="material-symbols-outlined text-5xl text-green-500 mb-3 block">check_circle</span>
            <p className="text-lg font-bold">Email sent!</p>
            <p className="text-sm text-zinc-500 mt-1">Template delivered to {to}</p>
            <button type="button" onClick={onClose} className="mt-6 px-5 py-2 bg-black text-white rounded-lg text-sm font-semibold">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Send "{template.name}"</h3>
              <button type="button" onClick={onClose} className="text-zinc-400 hover:text-black">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              {vars.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Personalize</p>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !agencyAutoFill
                        setAgencyAutoFill(next)
                        setVarValues(prev => next ? applyAgencyDefaults(vars, prev) : removeAgencyDefaults(vars, prev))
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                        agencyAutoFill
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">business</span>
                      Agency Auto-fill {agencyAutoFill ? 'On' : 'Off'}
                    </button>
                  </div>
                  <VariableFields
                    vars={vars}
                    values={varValues}
                    lineItems={lineItems}
                    onChange={(k, v) => setVarValues(prev => ({ ...prev, [k]: v }))}
                    onLineItemsChange={setLineItems}
                  />
                </div>
              )}
              {err && <p className="text-sm text-red-500">{err}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 border border-zinc-200 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-50">Cancel</button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                  {sending ? 'Sending…' : 'Send Email'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

function getDocCategory(docType: DocType): string {
  if (docType === 'proposal') return 'proposal_doc'
  if (docType === 'invoice') return 'invoice_doc'
  return 'general'
}

function isDocTemplate(t: EmailTemplate): boolean {
  return t.category === 'proposal_doc' || t.category === 'invoice_doc'
}

export default function EmailTemplatesView() {
  const [docType, setDocType] = useState<DocType>('email')
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selected, setSelected] = useState<EmailTemplate | null>(null)
  const [isNew, setIsNew] = useState(false)

  // Editor state
  const [name, setName] = useState('')
  const [category, setCategory] = useState('general')
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [css, setCss] = useState('')
  const [codeTab, setCodeTab] = useState<'html' | 'css'>('html')

  // Personalized template structured fields
  const [personalizedFields, setPersonalizedFields] = useState<PersonalizedFields>(PERSONALIZED_DEFAULTS)

  // When personalized fields change, regenerate HTML
  const handlePersonalizedChange = useCallback((f: PersonalizedFields) => {
    setPersonalizedFields(f)
    setHtml(buildPersonalizedHtml(f))
    setCss('')
  }, [])

  // Variables
  const vars = useMemo(() => extractVars(html, css), [html, css])
  const [varValues, setVarValues] = useState<Record<string, string>>({})
  const [editorLineItems, setEditorLineItems] = useState<LineItem[]>([])
  const [agencyAutoFill, setAgencyAutoFill] = useState(true)

  // Apply agency defaults whenever vars change and auto-fill is on
  useEffect(() => {
    if (agencyAutoFill) {
      setVarValues(prev => applyAgencyDefaults(vars, prev))
    }
  }, [vars, agencyAutoFill])

  // When category changes to personalized on a NEW template, seed HTML from defaults
  useEffect(() => {
    if (isNew && category === 'personalized') {
      setHtml(buildPersonalizedHtml(personalizedFields))
      setCss('')
    }
  }, [category]) // eslint-disable-line react-hooks/exhaustive-deps

  // Preview + send
  const [previewTab, setPreviewTab] = useState<'editor' | 'preview'>('editor')
  const [sendTarget, setSendTarget] = useState<EmailTemplate | null>(null)

  // Saving
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { load() }, [])

  // Reset selection when switching doc type
  useEffect(() => {
    setSelected(null)
    setIsNew(false)
    setCategoryFilter('all')
    setSaveMsg('')
  }, [docType])

  async function load() {
    setLoading(true)
    try {
      const data = await getEmailTemplates()
      setTemplates(data)
    } finally {
      setLoading(false)
    }
  }

  function openTemplate(t: EmailTemplate) {
    setSelected(t)
    setIsNew(false)
    setName(t.name)
    setCategory(t.category)
    setSubject(t.subject)
    setHtml(t.htmlContent)
    setCss(t.cssContent ?? '')
    // Try to restore personalized fields if applicable
    if (t.category === 'personalized') {
      const parsed = parsePersonalizedFields(t.htmlContent)
      setPersonalizedFields(parsed ?? PERSONALIZED_DEFAULTS)
    } else {
      setPersonalizedFields(PERSONALIZED_DEFAULTS)
    }
    const templateVars = extractVars(t.htmlContent, t.cssContent ?? '')
    setVarValues(agencyAutoFill ? applyAgencyDefaults(templateVars, {}) : {})
    setEditorLineItems([])
    setPreviewTab('editor')
    setCodeTab('html')
    setSaveMsg('')
  }

  function openNew() {
    setSelected(null)
    setIsNew(true)
    setName('')
    setCategory(getDocCategory(docType))
    setSubject('')
    const defaultFields = { ...PERSONALIZED_DEFAULTS }
    setPersonalizedFields(defaultFields)
    setHtml(`<!DOCTYPE html>\n<html>\n<head><meta charset="UTF-8" /></head>\n<body>\n  <h1>Hello, {{clientName}}!</h1>\n  <p>{{message}}</p>\n</body>\n</html>`)
    setCss(`body {\n  font-family: Arial, sans-serif;\n  color: #333;\n  max-width: 650px;\n  margin: 0 auto;\n  padding: 24px;\n}\nh1 { color: #111; }`)
    setVarValues({})
    setEditorLineItems([])
    setPreviewTab('editor')
    setCodeTab('html')
    setSaveMsg('')
  }

  async function handleSave() {
    if (!name || !html) { setSaveMsg('Name and HTML are required.'); return }
    if (docType === 'email' && !subject) { setSaveMsg('Subject is required for email templates.'); return }
    setSaving(true)
    setSaveMsg('')
    try {
      const payload = {
        name,
        category: docType === 'email' ? category : getDocCategory(docType),
        subject: subject || name,
        htmlContent: html,
        cssContent: css,
      }
      if (isNew) {
        const created = await createEmailTemplate(payload)
        setTemplates(prev => [created, ...prev])
        setSelected(created)
        setIsNew(false)
        setSaveMsg('Template created.')
      } else if (selected) {
        const updated = await updateEmailTemplate(selected.id, payload)
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t))
        setSelected(updated)
        setSaveMsg('Saved.')
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setSaveMsg(msg ? `Error: ${msg}` : 'Failed to save — check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selected || !confirm(`Delete "${selected.name}"?`)) return
    setDeleting(true)
    try {
      await deleteEmailTemplate(selected.id)
      setTemplates(prev => prev.filter(t => t.id !== selected.id))
      setSelected(null)
      setIsNew(false)
    } finally {
      setDeleting(false)
    }
  }

  const filteredTemplates = templates.filter(t => {
    if (docType === 'email') return !isDocTemplate(t)
    if (docType === 'proposal') return t.category === 'proposal_doc'
    if (docType === 'invoice') return t.category === 'invoice_doc'
    return true
  }).filter(t => {
    if (docType !== 'email') return true
    return categoryFilter === 'all' || t.category === categoryFilter
  })

  const previewDoc = buildPreviewDoc(html, css, varValues, editorLineItems)
  const hasEditor = isNew || selected !== null

  const pageTitle = docType === 'email' ? 'Email Templates' : docType === 'proposal' ? 'Proposal Templates' : 'Invoice Templates'
  const emptyIcon = docType === 'email' ? 'mail' : docType === 'proposal' ? 'description' : 'receipt_long'

  return (
    <div className="flex flex-col gap-0 -m-8">
      {/* ── Page header ── */}
      <div className="px-8 pt-8 pb-5 border-b border-zinc-200/60 bg-[#f9f9f9]">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex items-center gap-2 mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <span>Agency OS</span>
              <span>/</span>
              <span className="text-black">Templates</span>
            </nav>
            <h1 className="text-4xl font-bold tracking-tighter">Templates</h1>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Template
          </button>
        </div>

        {/* Doc type tabs */}
        <div className="flex items-center gap-1 mt-5">
          {DOC_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDocType(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                docType === tab.id
                  ? 'bg-black text-white'
                  : 'text-zinc-500 hover:text-black hover:bg-zinc-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0" style={{ height: 'calc(100vh - 200px)' }}>
        {/* ── Left sidebar ── */}
        <aside className="w-72 flex-shrink-0 border-r border-zinc-200/60 bg-white flex flex-col overflow-hidden">
          {/* Category filter — email only */}
          {docType === 'email' && (
            <div className="p-4 border-b border-zinc-100">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 bg-white"
              >
                <option value="all">All Categories</option>
                {EMAIL_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Template list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-zinc-400">Loading…</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-zinc-200 mb-2 block">{emptyIcon}</span>
                <p className="text-sm text-zinc-400">
                  {templates.length === 0 ? 'No templates yet. Create one!' : `No ${pageTitle.toLowerCase()} yet.`}
                </p>
              </div>
            ) : (
              filteredTemplates.map(t => {
                const isActive = selected?.id === t.id && !isNew
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => openTemplate(t)}
                    className={`w-full text-left px-4 py-3.5 border-b border-zinc-100 transition-colors ${
                      isActive ? 'bg-black text-white' : 'hover:bg-zinc-50 text-zinc-800'
                    }`}
                  >
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-black'}`}>{t.name}</p>
                    <p className={`text-[11px] mt-0.5 truncate ${isActive ? 'text-zinc-300' : 'text-zinc-400'}`}>
                      {docType === 'email'
                        ? `${CATEGORY_LABEL[t.category] ?? t.category} · ${t.subject}`
                        : t.subject || 'No description'}
                    </p>
                  </button>
                )
              })
            )}
          </div>

          {/* AI Prompt */}
          <AiPromptBox docType={docType} />
        </aside>

        {/* ── Main editor area ── */}
        {!hasEditor ? (
          <div className="flex-1 flex items-center justify-center text-zinc-400">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl mb-3 block text-zinc-300">{emptyIcon}</span>
              <p className="text-sm font-medium">Select a template to edit, or create a new one</p>
              <p className="text-xs text-zinc-400 mt-1">Use the AI Prompt in the sidebar to generate one with an AI tool</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-zinc-200/60 bg-white">
              <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPreviewTab('editor')}
                  className={`px-4 py-1.5 text-xs font-semibold transition-colors ${previewTab === 'editor' ? 'bg-black text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('preview')}
                  className={`px-4 py-1.5 text-xs font-semibold transition-colors ${previewTab === 'preview' ? 'bg-black text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
                >
                  Preview
                </button>
              </div>

              {/* Detected token badges */}
              {vars.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap max-w-xs overflow-hidden">
                  {vars.slice(0, 6).map(v => {
                    const def = getTokenDef(v)
                    const catColor: Record<string, string> = {
                      client: 'bg-blue-50 text-blue-600 border-blue-200',
                      agency: 'bg-amber-50 text-amber-600 border-amber-200',
                      invoice: 'bg-green-50 text-green-600 border-green-200',
                      proposal: 'bg-violet-50 text-violet-600 border-violet-200',
                      custom: 'bg-zinc-100 text-zinc-500 border-zinc-200',
                    }
                    return (
                      <span key={v} className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${catColor[def.category] ?? catColor.custom}`}>
                        {`{{${v}}}`}
                      </span>
                    )
                  })}
                  {vars.length > 6 && (
                    <span className="text-[9px] text-zinc-400 font-semibold">+{vars.length - 6}</span>
                  )}
                </div>
              )}

              <div className="flex-1" />

              {selected && docType === 'email' && (
                <button
                  type="button"
                  onClick={() => setSendTarget(selected)}
                  className="flex items-center gap-1.5 px-4 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold hover:bg-zinc-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">send</span>
                  Send
                </button>
              )}

              {selected && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {saving && <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>}
                {saving ? 'Saving…' : isNew ? 'Create Template' : 'Save Changes'}
              </button>

              {saveMsg && (
                <span className={`text-xs font-medium ${saveMsg.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                  {saveMsg}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {previewTab === 'editor' ? (
                <>
                  {/* Meta fields */}
                  <div className={`grid gap-4 ${docType === 'email' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Template Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder={docType === 'email' ? 'e.g. Welcome Email' : docType === 'proposal' ? 'e.g. Standard Proposal' : 'e.g. Standard Invoice'}
                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                      />
                    </div>

                    {docType === 'email' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Category</label>
                        <select
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 bg-white"
                        >
                          {EMAIL_CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                        {docType === 'email' ? 'Email Subject' : 'Description / Version'}
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder={docType === 'email' ? 'e.g. Welcome, {{clientName}}!' : 'e.g. v1 — Minimal Dark'}
                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                      />
                    </div>
                  </div>

                  {/* Code editor — or Personalized form builder */}
                  {category === 'personalized' ? (
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                      <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-100 bg-zinc-50">
                        <span className="material-symbols-outlined text-[18px] text-zinc-400">person</span>
                        <p className="text-sm font-bold text-black">Personalized Email Builder</p>
                        <span className="ml-auto text-[10px] text-zinc-400">HTML is auto-generated from these fields</span>
                      </div>
                      <div className="p-5">
                        <PersonalizedFormBuilder
                          fields={personalizedFields}
                          onChange={handlePersonalizedChange}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                      <div className="flex border-b border-zinc-200">
                        <button
                          type="button"
                          onClick={() => setCodeTab('html')}
                          className={`px-5 py-2.5 text-xs font-bold tracking-wide uppercase transition-colors border-r border-zinc-200 ${codeTab === 'html' ? 'bg-[#1e1e1e] text-[#d4d4d4]' : 'text-zinc-500 hover:bg-zinc-50'}`}
                        >
                          HTML
                        </button>
                        <button
                          type="button"
                          onClick={() => setCodeTab('css')}
                          className={`px-5 py-2.5 text-xs font-bold tracking-wide uppercase transition-colors ${codeTab === 'css' ? 'bg-[#1e1e1e] text-[#d4d4d4]' : 'text-zinc-500 hover:bg-zinc-50'}`}
                        >
                          CSS
                        </button>
                        <div className="flex-1 flex items-center justify-end px-4">
                          <span className="text-[10px] text-zinc-400">
                            Use <code className="bg-zinc-100 text-zinc-600 px-1 rounded">{'{{variableName}}'}</code> for dynamic values
                          </span>
                        </div>
                      </div>
                      {codeTab === 'html' ? (
                        <CodeEditor value={html} onChange={setHtml} placeholder="Paste AI-generated HTML here…" />
                      ) : (
                        <CodeEditor value={css} onChange={setCss} placeholder="body { font-family: sans-serif; }" />
                      )}
                    </div>
                  )}

                  {/* Detected variables */}
                  <div className="bg-white rounded-xl border border-zinc-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-[18px] text-zinc-400">tune</span>
                      <h3 className="text-sm font-bold text-zinc-700">Detected Variables</h3>
                      <span className="ml-auto text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-semibold">
                        {vars.length} found
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !agencyAutoFill
                          setAgencyAutoFill(next)
                          setVarValues(prev => next ? applyAgencyDefaults(vars, prev) : removeAgencyDefaults(vars, prev))
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                          agencyAutoFill
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">business</span>
                        Agency Auto-fill {agencyAutoFill ? 'On' : 'Off'}
                      </button>
                    </div>
                    <VariableFields
                      vars={vars}
                      values={varValues}
                      lineItems={editorLineItems}
                      onChange={(k, v) => setVarValues(prev => ({ ...prev, [k]: v }))}
                      onLineItemsChange={setEditorLineItems}
                    />
                    {vars.length > 0 && (
                      <p className="text-[11px] text-zinc-400 mt-3">
                        Fill in values above to see them rendered in the Preview tab.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                /* Preview tab */
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Live Preview</p>
                    <p className="text-[11px] text-zinc-400">
                      {vars.filter(v => varValues[v]).length}/{vars.length} variables filled
                    </p>
                  </div>

                  {vars.length > 0 && (
                    <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Preview Variables</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {vars.map(v => (
                          <div key={v} className="flex flex-col gap-0.5">
                            <label className="text-[10px] text-zinc-400 font-medium">{humanLabel(v)}</label>
                            <input
                              type="text"
                              value={varValues[v] ?? ''}
                              onChange={e => setVarValues(prev => ({ ...prev, [v]: e.target.value }))}
                              placeholder={`{{${v}}}`}
                              className="border border-zinc-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-black/10"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <iframe
                    srcDoc={previewDoc}
                    sandbox="allow-same-origin allow-scripts"
                    className="w-full"
                    style={{ height: '700px', border: 'none' }}
                    title="Template Preview"
                  />
                </div>
              )}

              {/* Token Reference — shown in both editor and preview tabs */}
              <TokenReference docType={docType} />
            </div>
          </div>
        )}
      </div>

      {/* Send modal */}
      {sendTarget && (
        <SendModal template={sendTarget} onClose={() => setSendTarget(null)} />
      )}
    </div>
  )
}

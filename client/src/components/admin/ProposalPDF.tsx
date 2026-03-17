import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { Proposal, LineItem } from '../../lib/api'

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$' }

const styles = StyleSheet.create({
  // paddingTop/Horizontal/Bottom on Page are re-applied as content insets on every page,
  // giving continuation pages proper top/side margins automatically.
  page: {
    backgroundColor: '#ffffff', fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a',
    paddingTop: 40, paddingHorizontal: 40, paddingBottom: 80,
  },
  // Negative margins let the header bleed to physical page edges despite page padding.
  header: {
    backgroundColor: '#0d1117',
    marginTop: -40, marginHorizontal: -40,
    paddingTop: 40, paddingHorizontal: 40, paddingBottom: 32,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  agencyName: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#e2f545', letterSpacing: 4 },
  agencyTagline: { fontSize: 10, color: '#6b7280', marginTop: 3 },
  proposalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#6b7280', letterSpacing: 3, textAlign: 'right' },
  proposalNumber: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#e2f545', textAlign: 'right', marginTop: 2 },
  dividerLine: { height: 1, backgroundColor: '#1f2937', marginBottom: 20 },
  headerMeta: { flexDirection: 'row' },
  metaBlock: { flex: 1, marginRight: 32 },
  metaLabel: { fontSize: 8, color: '#6b7280', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 },
  metaValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#f9fafb' },
  metaValueSmall: { fontSize: 10, color: '#d1d5db' },
  // paddingTop creates the gap between header and first section on page 1.
  // No paddingHorizontal or paddingBottom needed — page handles both.
  body: { paddingTop: 40 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb', borderBottomStyle: 'solid',
  },
  sectionDot: { width: 6, height: 6, backgroundColor: '#e2f545', borderRadius: 3, marginRight: 8 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#374151', letterSpacing: 2, textTransform: 'uppercase' },
  bodyText: { fontSize: 10, color: '#4b5563', lineHeight: 1.6 },
  // Pricing table
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', paddingVertical: 7, paddingHorizontal: 10 },
  tableHeaderCell: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6b7280', letterSpacing: 1.5, textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6', borderBottomStyle: 'solid',
  },
  tableRowAlt: { backgroundColor: '#fafafa' },
  tableCell: { fontSize: 10, color: '#1f2937' },
  // Col widths
  colDesc: { flex: 3 },
  colQty: { flex: 0.8, textAlign: 'center' },
  colRate: { flex: 1.2, textAlign: 'right' },
  colAmount: { flex: 1.2, textAlign: 'right' },
  // Totals
  totalsBox: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  totalLabel: { fontSize: 10, color: '#6b7280', width: 100, textAlign: 'right', marginRight: 40 },
  totalValue: { fontSize: 10, color: '#1f2937', width: 80, textAlign: 'right' },
  grandTotalRow: {
    flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, paddingTop: 8,
    borderTopWidth: 2, borderTopColor: '#0d1117', borderTopStyle: 'solid',
  },
  grandTotalLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#0d1117', width: 100, textAlign: 'right', marginRight: 40 },
  grandTotalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#0d1117', width: 80, textAlign: 'right' },
  // Signature
  signatureSection: { marginTop: 32, flexDirection: 'row' },
  signatureBlock: { flex: 1, marginRight: 40 },
  signatureLine: { height: 1, backgroundColor: '#d1d5db', marginBottom: 6, marginTop: 8 },
  signatureLabel: { fontSize: 9, color: '#9ca3af' },
  signatureHandwriting: { fontSize: 20, fontFamily: 'Helvetica-BoldOblique', color: '#1f2937', marginBottom: 4, marginTop: 16 },
  // Dedicated signature page — no padding so coordinates are from physical page edge
  sigPage: { backgroundColor: '#ffffff', fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  // Footer — fixed renders on every page; absolute positions from page bottom
  footer: {
    position: 'absolute', bottom: 28, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#e5e7eb', borderTopStyle: 'solid',
  },
  footerText: { fontSize: 8, color: '#9ca3af' },
  footerAccent: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#374151', letterSpacing: 1 },
  // Highlight box
  highlightBox: {
    backgroundColor: '#fafff0', padding: 12, marginBottom: 4,
    borderLeftWidth: 3, borderLeftColor: '#e2f545', borderLeftStyle: 'solid',
  },
  highlightText: { fontSize: 10, color: '#374151', lineHeight: 1.6 },
})

interface Props {
  proposal: Proposal
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionDot} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )
}

function fmt(amount: number, currency = 'USD') {
  const sym = CURRENCY_SYMBOLS[currency] ?? '$'
  return `${sym}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ProposalPDF({ proposal }: Props) {
  const sym = CURRENCY_SYMBOLS[proposal.currency] ?? '$'
  let lineItems: LineItem[] = []
  try {
    if (proposal.lineItems) lineItems = JSON.parse(proposal.lineItems)
  } catch {}

  const discount = proposal.discountType === 'percent'
    ? proposal.subtotal * (proposal.discountValue / 100)
    : proposal.discountValue
  const taxAmount = (proposal.subtotal - discount) * (proposal.taxRate / 100)

  return (
    <Document title={`${proposal.proposalNumber} — ${proposal.title}`} author="Designs By TA" creator="Designs By TA">
      <Page size="A4" style={styles.page}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.agencyName}>DESIGNS BY TA</Text>
              <Text style={styles.agencyTagline}>designsbyta.com</Text>
            </View>
            <View>
              <Text style={styles.proposalLabel}>PROPOSAL</Text>
              <Text style={styles.proposalNumber}>{proposal.proposalNumber}</Text>
            </View>
          </View>
          <View style={styles.dividerLine} />
          <View style={styles.headerMeta}>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Prepared For</Text>
              <Text style={styles.metaValue}>{proposal.clientName}</Text>
              {proposal.clientCompany && <Text style={styles.metaValueSmall}>{proposal.clientCompany}</Text>}
              <Text style={styles.metaValueSmall}>{proposal.clientEmail}</Text>
              {proposal.clientPhone && <Text style={styles.metaValueSmall}>{proposal.clientPhone}</Text>}
            </View>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Project</Text>
              <Text style={styles.metaValue}>{proposal.title}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValueSmall}>{proposal.date}</Text>
              {proposal.validUntil && (
                <>
                  <Text style={[styles.metaLabel, { marginTop: 8 }]}>Valid Until</Text>
                  <Text style={styles.metaValueSmall}>{proposal.validUntil}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Executive Summary */}
          {proposal.executiveSummary && (
            <View style={styles.section}>
              <SectionHeader title="Executive Summary" />
              <View style={styles.highlightBox}>
                <Text style={styles.highlightText}>{proposal.executiveSummary}</Text>
              </View>
            </View>
          )}

          {/* Client Needs */}
          {proposal.clientNeeds && (
            <View style={styles.section}>
              <SectionHeader title="Client Challenges & Needs" />
              <Text style={styles.bodyText}>{proposal.clientNeeds}</Text>
            </View>
          )}

          {/* Proposed Solution */}
          {proposal.proposedSolution && (
            <View style={styles.section}>
              <SectionHeader title="Our Proposed Solution" />
              <Text style={styles.bodyText}>{proposal.proposedSolution}</Text>
            </View>
          )}

          {/* Scope */}
          {proposal.projectScope && (
            <View style={styles.section}>
              <SectionHeader title="Project Scope" />
              <Text style={styles.bodyText}>{proposal.projectScope}</Text>
            </View>
          )}

          {/* Deliverables */}
          {proposal.deliverables && (
            <View style={styles.section}>
              <SectionHeader title="Deliverables" />
              <Text style={styles.bodyText}>{proposal.deliverables}</Text>
            </View>
          )}

          {/* Timeline */}
          {proposal.timeline && (
            <View style={styles.section}>
              <SectionHeader title="Timeline & Milestones" />
              <Text style={styles.bodyText}>{proposal.timeline}</Text>
            </View>
          )}

          {/* Investment */}
          <View style={styles.section}>
            <SectionHeader title="Investment" />
            {lineItems.length > 0 && (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
                  <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
                  <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate</Text>
                  <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
                </View>
                {lineItems.map((item, i) => (
                  <View key={item.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                    <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
                    <Text style={[styles.tableCell, styles.colQty]}>{item.qty}</Text>
                    <Text style={[styles.tableCell, styles.colRate]}>{sym}{item.unitPrice.toFixed(2)}</Text>
                    <Text style={[styles.tableCell, styles.colAmount]}>{sym}{item.total.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{fmt(proposal.subtotal, proposal.currency)}</Text>
              </View>
              {proposal.discountValue > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    Discount {proposal.discountType === 'percent' ? `(${proposal.discountValue}%)` : ''}
                  </Text>
                  <Text style={styles.totalValue}>-{fmt(discount, proposal.currency)}</Text>
                </View>
              )}
              {proposal.taxRate > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax ({proposal.taxRate}%)</Text>
                  <Text style={styles.totalValue}>{fmt(taxAmount, proposal.currency)}</Text>
                </View>
              )}
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalValue}>{fmt(proposal.total, proposal.currency)}</Text>
              </View>
            </View>
          </View>

          {/* Payment Terms */}
          {proposal.paymentTerms && (
            <View style={styles.section}>
              <SectionHeader title="Payment Terms" />
              <Text style={styles.bodyText}>{proposal.paymentTerms}</Text>
            </View>
          )}

          {/* T&C */}
          {proposal.termsConditions && (
            <View style={styles.section}>
              <SectionHeader title="Terms & Conditions" />
              <Text style={[styles.bodyText, { fontSize: 9 }]}>{proposal.termsConditions}</Text>
            </View>
          )}

          {/* Notes */}
          {proposal.notes && (
            <View style={styles.section}>
              <SectionHeader title="Additional Notes" />
              <Text style={styles.bodyText}>{proposal.notes}</Text>
            </View>
          )}
        </View>

        {/* Footer — fixed: appears on every page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {proposal.proposalNumber} · Prepared for {proposal.clientName} · {proposal.date}
          </Text>
          <Text style={styles.footerAccent}>DESIGNS BY TA</Text>
        </View>
      </Page>

      {/* ── SIGNATURE PAGE ─────────────────────────────────────────────────────
          All elements use position:'absolute' with coordinates from the physical
          page edge (no page-level padding). This lets addSignatureField.ts place
          the AcroForm text field at the exact same known coordinates.
          SIGN_BOX: left=40, top=110, width=240, height=80  ── */}
      <Page size="A4" style={styles.sigPage}>

        {/* Section header */}
        <View style={{ position: 'absolute', top: 40, left: 40, right: 40 }}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Signatures</Text>
          </View>
        </View>

        {/* ── CLIENT block ── */}
        <View style={{ position: 'absolute', top: 90, left: 40, width: 240 }}>
          <Text style={styles.signatureLabel}>Client Signature</Text>
          {/* Blank space for physical signature */}
          <View style={{ height: 60 }} />
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>{proposal.clientName}</Text>
          <Text style={[styles.signatureLabel, { marginTop: 2 }]}>{proposal.date}</Text>
        </View>

        {/* ── AGENCY block ── */}
        <View style={{ position: 'absolute', top: 90, left: 320, width: 240 }}>
          <Text style={styles.signatureLabel}>Authorized by Designs By TA</Text>
          <Text style={styles.signatureHandwriting}>Terrence Adderley</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Terrence Adderley</Text>
          <Text style={[styles.signatureLabel, { marginTop: 2 }]}>Designs By TA</Text>
        </View>

      </Page>
    </Document>
  )
}

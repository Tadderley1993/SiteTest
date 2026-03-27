import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { getPayPalSettings, getAccessToken, getBaseUrl } from '../lib/paypal.js'

const router = Router()
router.use(authMiddleware)

function monthKey(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '0000-00'
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  } catch { return '0000-00' }
}

// ── Fetch all PayPal data needed for financials (gracefully returns null if not configured) ──
interface PayPalFinancialData {
  collected: number
  outstanding: number
  invoicePaid: number
  invoiceOutstanding: number
  transactionCount: number
  // per-month buckets: key = "YYYY-MM", value = amount collected
  monthlyCollected: Record<string, number>
  recentTransactions: Array<{
    id: string
    description: string
    amount: number
    currency: string
    date: string
    payer: string
    status: string
    source: 'paypal'
  }>
}

// Only include PayPal data whose payer/recipient email matches a known client email.
// This prevents unrelated PayPal income from contaminating the financials.
async function fetchPayPalFinancials(clientEmails: Set<string>): Promise<PayPalFinancialData | null> {
  try {
    const creds = await getPayPalSettings()
    if (!creds) return null

    const token = await getAccessToken(creds.clientId, creds.secret, creds.environment)
    const baseUrl = getBaseUrl(creds.environment)

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    // Fetch last 12 months of transactions + all invoices in parallel
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    const endDate = new Date()

    const [txRes, invRes] = await Promise.allSettled([
      fetch(
        `${baseUrl}/v1/reporting/transactions?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}&fields=all&page_size=500&page=1`,
        { headers }
      ),
      fetch(
        `${baseUrl}/v2/invoicing/invoices?page=1&page_size=100&total_required=false`,
        { headers }
      ),
    ])

    let collected = 0
    let transactionCount = 0
    const monthlyCollected: Record<string, number> = {}
    const recentTransactions: PayPalFinancialData['recentTransactions'] = []

    // Process transactions — only include if payer email matches a client in the system
    if (txRes.status === 'fulfilled' && txRes.value.ok) {
      const txData = await txRes.value.json() as {
        transaction_details?: Array<{
          transaction_info: {
            transaction_id: string
            transaction_status: string
            transaction_amount: { value: string; currency_code: string }
            transaction_initiation_date: string
            transaction_subject?: string
          }
          payer_info?: { email_address?: string; payer_name?: { alternate_full_name?: string } }
        }>
      }

      for (const tx of txData.transaction_details ?? []) {
        const info = tx.transaction_info
        const payerEmail = tx.payer_info?.email_address?.toLowerCase() ?? ''

        // ── Client-only filter: skip if payer email not in our client list ──
        if (!clientEmails.has(payerEmail)) continue

        // Status 'S' = completed/success
        if (info.transaction_status !== 'S') continue
        const amount = parseFloat(info.transaction_amount?.value ?? '0')
        if (amount <= 0) continue // skip debits/fees

        collected += amount
        transactionCount++
        const mk = monthKey(info.transaction_initiation_date)
        monthlyCollected[mk] = (monthlyCollected[mk] ?? 0) + amount

        if (recentTransactions.length < 10) {
          recentTransactions.push({
            id: info.transaction_id,
            description: info.transaction_subject ?? 'PayPal payment',
            amount,
            currency: info.transaction_amount?.currency_code ?? 'USD',
            date: info.transaction_initiation_date,
            payer: tx.payer_info?.email_address
              ?? tx.payer_info?.payer_name?.alternate_full_name
              ?? 'PayPal customer',
            status: 'completed',
            source: 'paypal',
          })
        }
      }
    }

    // Process invoices — only include if recipient email matches a client in the system
    let invoicePaid = 0
    let invoiceOutstanding = 0

    if (invRes.status === 'fulfilled' && invRes.value.ok) {
      const invData = await invRes.value.json() as {
        items?: Array<{
          status: string
          primary_recipients?: Array<{
            billing_info?: { email_address?: string }
          }>
          amount?: { value: { currency_code: string; value: string } }
          payments?: { paid_amount?: { currency_code: string; value: string } }
          detail?: { invoice_date?: string }
        }>
      }

      for (const inv of invData.items ?? []) {
        const recipientEmail = inv.primary_recipients?.[0]?.billing_info?.email_address?.toLowerCase() ?? ''

        // ── Client-only filter: skip if recipient email not in our client list ──
        if (!clientEmails.has(recipientEmail)) continue

        const rawAmount = parseFloat(inv.amount?.value?.value ?? '0')
        if (inv.status === 'PAID' || inv.status === 'PARTIALLY_PAID') {
          const paid = parseFloat(inv.payments?.paid_amount?.value ?? '0')
          invoicePaid += paid > 0 ? paid : rawAmount
          const mk = monthKey(inv.detail?.invoice_date ?? '')
          if (mk !== '0000-00') monthlyCollected[mk] = (monthlyCollected[mk] ?? 0) + (paid > 0 ? paid : rawAmount)
        } else if (['SENT', 'UNPAID', 'VIEWED'].includes(inv.status)) {
          invoiceOutstanding += rawAmount
        }
      }
    }

    return {
      collected,
      outstanding: 0,
      invoicePaid,
      invoiceOutstanding,
      transactionCount,
      monthlyCollected,
      recentTransactions,
    }
  } catch {
    // PayPal unavailable — don't crash financials
    return null
  }
}

router.get('/summary', async (_req, res) => {
  try {
    // Load clients first so we can build the email filter for PayPal
    const clients = await prisma.client.findMany({ select: { id: true, firstName: true, lastName: true, email: true } })
    const clientEmails = new Set(clients.map(c => c.email.toLowerCase()))

    const [payments, invoices, standings, proposals, expenses, paypal] = await Promise.all([
      prisma.paymentEntry.findMany(),
      prisma.invoice.findMany({ include: { client: { select: { firstName: true, lastName: true } } } }),
      prisma.clientStanding.findMany(),
      prisma.proposal.findMany(),
      prisma.expense.findMany(),
      fetchPayPalFinancials(clientEmails),
    ])

    // ── Local income from PaymentEntry ──
    const paidStatuses = ['Paid On Time', 'Paid Late', 'Rearranged']
    const outstandingStatuses = ['pending', 'Pending', 'Overdue']
    const overdueStatuses = ['Overdue']

    const collectedPayments = payments.filter(p => paidStatuses.includes(p.status))
    const outstandingPayments = payments.filter(p => outstandingStatuses.includes(p.status))
    const overduePayments = payments.filter(p => overdueStatuses.includes(p.status))

    const localCollected = collectedPayments.reduce((s, p) => s + p.amount, 0)
    const totalOutstanding = outstandingPayments.reduce((s, p) => s + p.amount, 0)
    const totalOverdue = overduePayments.reduce((s, p) => s + p.amount, 0)

    const paidInvoices = invoices.filter(i => i.status === 'paid')
    const localInvoiceRevenue = paidInvoices.reduce((s, i) => s + i.amount, 0)
    const outstandingInvoices = invoices.filter(i => ['sent', 'unpaid', 'overdue'].includes(i.status))
    const localInvoiceOutstanding = outstandingInvoices.reduce((s, i) => s + i.amount, 0)

    // ── Merge PayPal ──
    const paypalCollected = paypal ? paypal.collected + paypal.invoicePaid : 0
    const paypalOutstanding = paypal ? paypal.invoiceOutstanding : 0

    const totalCollected = localCollected + localInvoiceRevenue + paypalCollected
    const totalOwed = totalOutstanding + localInvoiceOutstanding + paypalOutstanding
    const totalContractValue = standings.reduce((s, st) => s + st.totalContract, 0)

    // ── Expenses ──
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const netProfit = totalCollected - totalExpenses
    const profitMargin = totalCollected > 0 ? (netProfit / totalCollected) * 100 : 0

    // ── Proposals ──
    const acceptedProposals = proposals.filter(p => p.status === 'accepted')
    const sentProposals = proposals.filter(p => ['sent', 'accepted', 'declined'].includes(p.status))
    const conversionRate = sentProposals.length > 0 ? (acceptedProposals.length / sentProposals.length) * 100 : 0
    const avgDealSize = acceptedProposals.length > 0
      ? acceptedProposals.reduce((s, p) => s + p.total, 0) / acceptedProposals.length
      : 0
    const pipelineValue = proposals.filter(p => p.status === 'sent').reduce((s, p) => s + p.total, 0)

    // ── Monthly timeline (last 12 months) ──
    const now = new Date()
    const months: string[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    const revenueByMonth = months.map(mk => {
      const label = new Date(mk + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      const localAmount = collectedPayments
        .filter(p => monthKey(p.paidDate ?? p.dueDate) === mk)
        .reduce((s, p) => s + p.amount, 0)
        + paidInvoices
          .filter(i => monthKey(i.dueDate) === mk)
          .reduce((s, i) => s + i.amount, 0)

      const ppAmount = paypal?.monthlyCollected[mk] ?? 0

      const exp = expenses
        .filter(e => monthKey(e.date) === mk)
        .reduce((s, e) => s + e.amount, 0)

      const collectedTotal = localAmount + ppAmount
      return {
        month: mk,
        label,
        collected: collectedTotal,
        local: localAmount,
        paypal: ppAmount,
        expenses: exp,
        profit: collectedTotal - exp,
      }
    })

    // ── Quarterly data ──
    const quarters: Record<string, { collected: number; expenses: number; profit: number }> = {}
    revenueByMonth.forEach(m => {
      const d = new Date(m.month + '-01')
      const q = `${d.getFullYear()} Q${Math.ceil((d.getMonth() + 1) / 3)}`
      if (!quarters[q]) quarters[q] = { collected: 0, expenses: 0, profit: 0 }
      quarters[q].collected += m.collected
      quarters[q].expenses += m.expenses
      quarters[q].profit += m.profit
    })
    const revenueByQuarter = Object.entries(quarters).map(([label, data]) => ({ label, ...data }))

    // ── Expense by category ──
    const expenseByCategory: Record<string, number> = {}
    expenses.forEach(e => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] ?? 0) + e.amount
    })
    const expenseCategories = Object.entries(expenseByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    // ── Revenue by client ──
    const clientRevenueMap: Record<number, { name: string; collected: number; outstanding: number; contract: number }> = {}
    clients.forEach(c => {
      clientRevenueMap[c.id] = { name: `${c.firstName} ${c.lastName}`, collected: 0, outstanding: 0, contract: 0 }
    })
    payments.forEach(p => {
      if (!clientRevenueMap[p.clientId]) return
      if (paidStatuses.includes(p.status)) clientRevenueMap[p.clientId].collected += p.amount
      else if (outstandingStatuses.includes(p.status)) clientRevenueMap[p.clientId].outstanding += p.amount
    })
    standings.forEach(s => {
      if (clientRevenueMap[s.clientId]) clientRevenueMap[s.clientId].contract = s.totalContract
    })
    const clientRevenue = Object.values(clientRevenueMap)
      .filter(c => c.collected > 0 || c.outstanding > 0 || c.contract > 0)
      .sort((a, b) => b.collected - a.collected)
      .slice(0, 10)

    // ── Payment status breakdown ──
    const statusBreakdown = {
      collected: collectedPayments.length + (paypal?.transactionCount ?? 0),
      pending: outstandingPayments.filter(p => !overdueStatuses.includes(p.status)).length,
      overdue: overduePayments.length,
      cancelled: payments.filter(p => p.status === 'Cancelled').length,
    }

    // ── Recent payments: merge local + PayPal, sort by date ──
    const localRecent = collectedPayments
      .sort((a, b) => new Date(b.paidDate ?? b.dueDate).getTime() - new Date(a.paidDate ?? a.dueDate).getTime())
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        label: p.label,
        amount: p.amount,
        clientName: clients.find(c => c.id === p.clientId)
          ? `${clients.find(c => c.id === p.clientId)!.firstName} ${clients.find(c => c.id === p.clientId)!.lastName}`
          : 'Unknown',
        paidDate: p.paidDate,
        status: p.status,
        source: 'local' as const,
      }))

    const ppRecent = (paypal?.recentTransactions ?? []).map(tx => ({
      id: tx.id,
      label: tx.description,
      amount: tx.amount,
      clientName: tx.payer,
      paidDate: tx.date,
      status: tx.status,
      source: 'paypal' as const,
    }))

    const recentPayments = [...localRecent, ...ppRecent]
      .sort((a, b) => new Date(b.paidDate ?? '').getTime() - new Date(a.paidDate ?? '').getTime())
      .slice(0, 15)

    res.json({
      summary: {
        totalRevenue: totalCollected,
        totalCollected,
        totalOutstanding: totalOwed,
        totalOverdue,
        totalContractValue,
        totalExpenses,
        netProfit,
        profitMargin,
        conversionRate,
        avgDealSize,
        pipelineValue,
        activeClients: clients.length,
        totalProposals: proposals.length,
        acceptedProposals: acceptedProposals.length,
        // PayPal-specific breakdown
        paypalConnected: paypal !== null,
        paypalCollected,
        paypalOutstanding,
        paypalTransactionCount: paypal?.transactionCount ?? 0,
        localCollected: localCollected + localInvoiceRevenue,
      },
      revenueByMonth,
      revenueByQuarter,
      expenseCategories,
      clientRevenue,
      statusBreakdown,
      recentPayments,
    })
  } catch (error) {
    console.error('Financials error:', error)
    res.status(500).json({ error: 'Failed to compute financials' })
  }
})

export { router as financialsRouter }

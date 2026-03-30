import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { logger } from '../lib/logger.js'
import { authMiddleware } from '../middleware/auth.js'
import { getStripeSettings, getStripeClient } from '../lib/stripe.js'

const router = Router()
router.use(authMiddleware)

function monthKey(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '0000-00'
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  } catch { return '0000-00' }
}

// ── Fetch Stripe data needed for financials (gracefully returns null if not configured) ──
interface StripeFinancialData {
  collected: number
  transactionCount: number
  monthlyCollected: Record<string, number>
  recentTransactions: Array<{
    id: string
    description: string
    amount: number
    currency: string
    date: string
    payer: string
    status: string
    source: 'stripe'
  }>
}

async function fetchStripeFinancials(): Promise<StripeFinancialData | null> {
  try {
    const creds = await getStripeSettings()
    if (!creds) return null

    const stripe = getStripeClient(creds.secretKey)
    const startTimestamp = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60 // 12 months ago

    // Fetch last 100 successful charges in the past 12 months
    const charges = await stripe.charges.list({
      limit: 100,
      created: { gte: startTimestamp },
    })

    let collected = 0
    let transactionCount = 0
    const monthlyCollected: Record<string, number> = {}
    const recentTransactions: StripeFinancialData['recentTransactions'] = []

    for (const charge of charges.data) {
      if (!charge.paid || charge.status !== 'succeeded' || charge.refunded) continue
      if (charge.amount <= 0) continue

      const amount = charge.amount / 100 // cents → dollars
      collected += amount
      transactionCount++

      const date = new Date(charge.created * 1000).toISOString()
      const mk = monthKey(date)
      monthlyCollected[mk] = (monthlyCollected[mk] ?? 0) + amount

      if (recentTransactions.length < 10) {
        recentTransactions.push({
          id: charge.id,
          description: charge.description ?? charge.statement_descriptor ?? 'Stripe payment',
          amount,
          currency: charge.currency.toUpperCase(),
          date,
          payer: charge.billing_details?.email ?? charge.billing_details?.name ?? 'Stripe customer',
          status: 'completed',
          source: 'stripe',
        })
      }
    }

    return { collected, transactionCount, monthlyCollected, recentTransactions }
  } catch {
    // Stripe unavailable — don't crash financials
    return null
  }
}

router.get('/summary', async (_req, res) => {
  try {
    const clients = await prisma.client.findMany({ select: { id: true, firstName: true, lastName: true, email: true } })

    const [payments, invoices, standings, proposals, expenses, stripe] = await Promise.all([
      prisma.paymentEntry.findMany(),
      prisma.invoice.findMany({ include: { client: { select: { firstName: true, lastName: true } } } }),
      prisma.clientStanding.findMany(),
      prisma.proposal.findMany(),
      prisma.expense.findMany(),
      fetchStripeFinancials(),
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

    // ── Merge Stripe ──
    const stripeCollected = stripe ? stripe.collected : 0

    const totalCollected = localCollected + localInvoiceRevenue + stripeCollected
    const totalOwed = totalOutstanding + localInvoiceOutstanding
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

      const ppAmount = stripe?.monthlyCollected[mk] ?? 0

      const exp = expenses
        .filter(e => monthKey(e.date) === mk)
        .reduce((s, e) => s + e.amount, 0)

      const collectedTotal = localAmount + ppAmount
      return {
        month: mk,
        label,
        collected: collectedTotal,
        local: localAmount,
        stripe: ppAmount,
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
      collected: collectedPayments.length + (stripe?.transactionCount ?? 0),
      pending: outstandingPayments.filter(p => !overdueStatuses.includes(p.status)).length,
      overdue: overduePayments.length,
      cancelled: payments.filter(p => p.status === 'Cancelled').length,
    }

    // ── Recent payments: merge local + Stripe, sort by date ──
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

    const ppRecent = (stripe?.recentTransactions ?? []).map(tx => ({
      id: tx.id,
      label: tx.description,
      amount: tx.amount,
      clientName: tx.payer,
      paidDate: tx.date,
      status: tx.status,
      source: 'stripe' as const,
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
        // Stripe-specific breakdown
        stripeConnected: stripe !== null,
        stripeCollected,
        stripeTransactionCount: stripe?.transactionCount ?? 0,
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
    logger.error({ err: error }, 'Financials error')
    res.status(500).json({ error: 'Failed to compute financials' })
  }
})

export { router as financialsRouter }

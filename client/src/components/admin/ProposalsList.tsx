import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, FileText, Send, CheckCircle, XCircle, Clock, Trash2, Edit2 } from 'lucide-react'
import { getProposals, deleteProposal, Proposal } from '../../lib/api'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:    { label: 'Draft',    color: 'text-text-muted bg-white/5 border-white/10',     icon: <Clock className="w-3 h-3" /> },
  sent:     { label: 'Sent',     color: 'text-accent-secondary bg-accent-secondary/10 border-accent-secondary/20', icon: <Send className="w-3 h-3" /> },
  accepted: { label: 'Accepted', color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: <CheckCircle className="w-3 h-3" /> },
  declined: { label: 'Declined', color: 'text-red-400 bg-red-400/10 border-red-400/20',   icon: <XCircle className="w-3 h-3" /> },
}

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$' }

interface Props {
  onNew: () => void
  onEdit: (proposal: Proposal) => void
}

export default function ProposalsList({ onNew, onEdit }: Props) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    getProposals()
      .then(setProposals)
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = proposals.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.proposalNumber.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this proposal? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await deleteProposal(id)
      setProposals(prev => prev.filter(p => p.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const totalValue = proposals.filter(p => p.status === 'accepted').reduce((sum, p) => sum + p.total, 0)
  const sentCount = proposals.filter(p => p.status === 'sent').length

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-semibold text-text-primary">Proposals</h2>
          <span className="text-xs text-text-muted bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            {proposals.length}
          </span>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-background text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Proposal
        </button>
      </div>

      {/* Stats */}
      {proposals.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Proposals', value: proposals.length, color: 'text-text-primary' },
            { label: 'Awaiting Response', value: sentCount, color: 'text-accent-secondary' },
            { label: 'Accepted Value', value: `$${totalValue.toLocaleString()}`, color: 'text-green-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search proposals..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent/40"
      />

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-text-muted">Loading proposals...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-40" />
          <p className="text-text-muted mb-4">{search ? 'No proposals match your search.' : 'No proposals yet.'}</p>
          {!search && (
            <button
              onClick={onNew}
              className="px-4 py-2 bg-accent text-background text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
            >
              Create your first proposal
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((proposal, i) => {
            const cfg = STATUS_CONFIG[proposal.status] ?? STATUS_CONFIG.draft
            const sym = CURRENCY_SYMBOLS[proposal.currency] ?? '$'
            return (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4 hover:border-white/15 transition-colors"
              >
                {/* Number + status */}
                <div className="flex-shrink-0 w-28">
                  <p className="text-xs text-text-muted font-mono">{proposal.proposalNumber}</p>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-1 ${cfg.color}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>

                {/* Title + client */}
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-medium truncate">{proposal.title}</p>
                  <p className="text-text-muted text-sm truncate">
                    {proposal.clientName}
                    {proposal.clientCompany && ` · ${proposal.clientCompany}`}
                  </p>
                </div>

                {/* Date */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs text-text-muted">Created</p>
                  <p className="text-sm text-text-primary">{proposal.date}</p>
                  {proposal.validUntil && (
                    <p className="text-xs text-text-muted">Valid until {proposal.validUntil}</p>
                  )}
                </div>

                {/* Total */}
                <div className="text-right flex-shrink-0 w-28">
                  <p className="text-xs text-text-muted">Total</p>
                  <p className="text-lg font-bold text-accent">{sym}{proposal.total.toLocaleString()}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onEdit(proposal)}
                    className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(proposal.id)}
                    disabled={deletingId === proposal.id}
                    className="p-2 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

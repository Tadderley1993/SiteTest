import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, FileText, Send, CheckCircle, XCircle, Clock, Trash2, Edit2 } from 'lucide-react'
import { getProposals, deleteProposal, Proposal } from '../../lib/api'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:    { label: 'Draft',    color: 'text-zinc-500 bg-[#f3f3f3] border-zinc-200',     icon: <Clock className="w-3 h-3" /> },
  sent:     { label: 'Sent',     color: 'text-black-secondary bg-black-secondary/10 border-accent-secondary/20', icon: <Send className="w-3 h-3" /> },
  accepted: { label: 'Accepted', color: 'text-green-600 bg-green-500/10 border-green-400/20', icon: <CheckCircle className="w-3 h-3" /> },
  declined: { label: 'Declined', color: 'text-red-500 bg-red-500/10 border-red-400/20',   icon: <XCircle className="w-3 h-3" /> },
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
          <FileText className="w-5 h-5 text-black" />
          <h2 className="text-xl font-semibold text-black">Proposals</h2>
          <span className="text-xs text-zinc-500 bg-[#f3f3f3] border border-zinc-200 px-2 py-0.5 rounded-full">
            {proposals.length}
          </span>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 bg-black text-background text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Proposal
        </button>
      </div>

      {/* Stats */}
      {proposals.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Proposals', value: proposals.length, color: 'text-black' },
            { label: 'Awaiting Response', value: sentCount, color: 'text-black-secondary' },
            { label: 'Accepted Value', value: `$${totalValue.toLocaleString()}`, color: 'text-green-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-zinc-200 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
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
        className="w-full mb-4 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-black placeholder-text-muted text-sm focus:outline-none focus:border-black/20"
      />

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-zinc-500">Loading proposals...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-zinc-500 mx-auto mb-4 opacity-40" />
          <p className="text-zinc-500 mb-4">{search ? 'No proposals match your search.' : 'No proposals yet.'}</p>
          {!search && (
            <button
              onClick={onNew}
              className="px-4 py-2 bg-black text-background text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors"
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
                className="bg-white border border-zinc-200 rounded-xl p-5 flex items-center gap-4 hover:border-zinc-300 transition-colors"
              >
                {/* Number + status */}
                <div className="flex-shrink-0 w-28">
                  <p className="text-xs text-zinc-500 font-mono">{proposal.proposalNumber}</p>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-1 ${cfg.color}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>

                {/* Title + client */}
                <div className="flex-1 min-w-0">
                  <p className="text-black font-medium truncate">{proposal.title}</p>
                  <p className="text-zinc-500 text-sm truncate">
                    {proposal.clientName}
                    {proposal.clientCompany && ` · ${proposal.clientCompany}`}
                  </p>
                </div>

                {/* Date */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs text-zinc-500">Created</p>
                  <p className="text-sm text-black">{proposal.date}</p>
                  {proposal.validUntil && (
                    <p className="text-xs text-zinc-500">Valid until {proposal.validUntil}</p>
                  )}
                </div>

                {/* Total */}
                <div className="text-right flex-shrink-0 w-28">
                  <p className="text-xs text-zinc-500">Total</p>
                  <p className="text-lg font-bold text-black">{sym}{proposal.total.toLocaleString()}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onEdit(proposal)}
                    className="p-2 text-zinc-500 hover:text-black hover:bg-[#f3f3f3] rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(proposal.id)}
                    disabled={deletingId === proposal.id}
                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
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

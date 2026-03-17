import { Fragment, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, UserPlus, Check } from 'lucide-react'
import { Submission } from '../../lib/api'

interface Props {
  submissions: Submission[]
  onQuickAdd?: (submission: Submission) => Promise<void>
  clientSubmissionIds?: Set<number>
}

const SERVICE_LABELS: Record<string, string> = {
  website: 'Website',
  mobile: 'Mobile',
  brand: 'Brand',
  revamp: 'Revamp',
  marketing: 'Marketing',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTimeline(s: Submission) {
  const parts = [
    s.timelineMonths ? `${s.timelineMonths}mo` : '',
    s.timelineWeeks  ? `${s.timelineWeeks}wk`  : '',
    s.timelineDays   ? `${s.timelineDays}d`    : '',
  ].filter(Boolean)
  return parts.length ? parts.join(' ') : '—'
}

// Shared cell class helpers
const th = 'text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3 whitespace-nowrap'
const td = 'px-4 py-3 text-sm align-middle'

export default function SubmissionsTable({ submissions, onQuickAdd, clientSubmissionIds }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm]  = useState('')
  const [addingId, setAddingId]      = useState<number | null>(null)

  const filtered = submissions.filter(s =>
    s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleQuickAdd = async (e: React.MouseEvent, submission: Submission) => {
    e.stopPropagation()
    if (!onQuickAdd || addingId === submission.id) return
    setAddingId(submission.id)
    try { await onQuickAdd(submission) } finally { setAddingId(null) }
  }

  // Total column count for colSpan on the expanded description row
  const totalCols = (onQuickAdd ? 11 : 10) + 1 // +1 for chevron col

  return (
    <div className="space-y-4">
      {/* Search + count */}
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent transition-colors w-64 text-sm"
        />
        <span className="text-text-muted text-sm">
          {filtered.length} submission{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-x-auto">
        <table className="w-full table-fixed border-collapse" style={{ minWidth: onQuickAdd ? 1240 : 1140 }}>

          {/* Column widths — keeps headers & cells locked together */}
          <colgroup>
            <col style={{ width: 56  }} />   {/* ID        */}
            <col style={{ width: 155 }} />   {/* Name      */}
            <col style={{ width: 195 }} />   {/* Email     */}
            <col style={{ width: 125 }} />   {/* Phone     */}
            <col style={{ width: 95  }} />   {/* Type      */}
            <col style={{ width: 165 }} />   {/* Services  */}
            <col style={{ width: 90  }} />   {/* Budget    */}
            <col style={{ width: 70  }} />   {/* Team      */}
            <col style={{ width: 90  }} />   {/* Timeline  */}
            <col style={{ width: 105 }} />   {/* Date      */}
            {onQuickAdd && <col style={{ width: 100 }} />}   {/* Add       */}
            <col style={{ width: 40  }} />   {/* Chevron   */}
          </colgroup>

          <thead>
            <tr className="border-b border-white/10">
              <th className={th}>ID</th>
              <th className={th}>Name</th>
              <th className={th}>Email</th>
              <th className={th}>Phone</th>
              <th className={th}>Type</th>
              <th className={th}>Services</th>
              <th className={th}>Budget</th>
              <th className={th}>Team</th>
              <th className={th}>Timeline</th>
              <th className={th}>Date</th>
              {onQuickAdd && <th className={th}>Add</th>}
              <th className="w-10" />
            </tr>
          </thead>

          <tbody>
            {filtered.map((s, idx) => {
              const isExpanded = expandedId === s.id
              const isClient   = clientSubmissionIds?.has(s.id)
              const isAdding   = addingId === s.id

              return (
                <Fragment key={s.id}>
                  {/* ── Main row ── */}
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className={`cursor-pointer border-b border-white/[0.04] transition-colors ${
                      idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'
                    } hover:bg-white/[0.05]`}
                  >
                    <td className={`${td} text-text-muted`}>{s.id}</td>

                    <td className={`${td} text-text-primary font-medium`}>
                      <span className="block truncate">{s.firstName} {s.lastName}</span>
                    </td>

                    <td className={`${td} text-text-primary`}>
                      <span className="block truncate">{s.email}</span>
                    </td>

                    <td className={`${td} text-text-muted`}>
                      <span className="block truncate">{s.phone || '—'}</span>
                    </td>

                    <td className={`${td} text-text-muted capitalize`}>{s.clientType}</td>

                    <td className={td}>
                      <div className="flex flex-wrap gap-1">
                        {s.services.map(svc => (
                          <span key={svc} className="px-1.5 py-0.5 bg-accent/10 text-accent text-xs rounded whitespace-nowrap">
                            {SERVICE_LABELS[svc] || svc}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className={`${td} text-text-primary`}>${s.budget}</td>

                    <td className={`${td} text-text-muted`}>{s.teamSize || '—'}</td>

                    <td className={`${td} text-text-muted`}>{formatTimeline(s)}</td>

                    <td className={`${td} text-text-muted whitespace-nowrap`}>{formatDate(s.createdAt)}</td>

                    {onQuickAdd && (
                      <td className="px-3 py-3 align-middle" onClick={e => e.stopPropagation()}>
                        {isClient ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-400 px-2 py-1 bg-green-400/10 rounded-md whitespace-nowrap">
                            <Check className="w-3 h-3" /> Added
                          </span>
                        ) : (
                          <button
                            onClick={e => handleQuickAdd(e, s)}
                            disabled={isAdding}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-accent/30 text-accent hover:bg-accent/10 disabled:opacity-50 transition-colors font-medium whitespace-nowrap"
                          >
                            <UserPlus className="w-3 h-3" />
                            {isAdding ? '…' : 'Quick Add'}
                          </button>
                        )}
                      </td>
                    )}

                    <td className="px-2 py-3 align-middle text-text-muted">
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />}
                    </td>
                  </motion.tr>

                  {/* ── Expanded description row ── */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.tr
                        key={`${s.id}-desc`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <td colSpan={totalCols} className="p-0 bg-white/[0.02] border-b border-white/[0.04]">
                          <div className="px-4 py-3 border-t border-white/5">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Description</p>
                            <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                              {s.description || '—'}
                            </p>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-text-muted text-sm">
            {searchTerm ? 'No submissions match your search.' : 'No submissions yet.'}
          </div>
        )}
      </div>
    </div>
  )
}

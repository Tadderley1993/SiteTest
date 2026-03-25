import { Fragment, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

const th = 'text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap'
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

  const totalCols = (onQuickAdd ? 11 : 10) + 1

  return (
    <div className="space-y-4">
      {/* Search + count */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-[#e8e8e8] border-none rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 w-72 placeholder-zinc-400"
          />
        </div>
        <span className="text-zinc-400 text-sm font-medium">
          {filtered.length} submission{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl ring-1 ring-black/[0.05] overflow-x-auto shadow-sm">
        <table className="w-full table-fixed border-collapse" style={{ minWidth: onQuickAdd ? 1240 : 1140 }}>
          <colgroup>
            <col style={{ width: 56  }} />
            <col style={{ width: 180 }} />
            <col style={{ width: 195 }} />
            <col style={{ width: 125 }} />
            <col style={{ width: 95  }} />
            <col style={{ width: 165 }} />
            <col style={{ width: 90  }} />
            <col style={{ width: 70  }} />
            <col style={{ width: 90  }} />
            <col style={{ width: 105 }} />
            {onQuickAdd && <col style={{ width: 110 }} />}
            <col style={{ width: 40  }} />
          </colgroup>

          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100">
              <th className={th}>ID</th>
              <th className={th}>Inquirer</th>
              <th className={th}>Email</th>
              <th className={th}>Phone</th>
              <th className={th}>Business</th>
              <th className={th}>Services</th>
              <th className={th}>Budget</th>
              <th className={th}>Team</th>
              <th className={th}>Timeline</th>
              <th className={th}>Date</th>
              {onQuickAdd && <th className={th}>Action</th>}
              <th className="w-10" />
            </tr>
          </thead>

          <tbody>
            {filtered.map((s, idx) => {
              const isExpanded = expandedId === s.id
              const isClient   = clientSubmissionIds?.has(s.id)
              const isAdding   = addingId === s.id
              const isHighValue = Number(s.budget?.replace(/\D/g, '') ?? 0) >= 5000

              return (
                <Fragment key={s.id}>
                  {/* Main row */}
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className={`cursor-pointer border-b border-zinc-50 transition-colors group ${
                      isHighValue ? 'border-l-2 border-l-black bg-zinc-50/20' : ''
                    } hover:bg-zinc-50`}
                  >
                    <td className={`${td} text-zinc-400 text-xs font-mono`}>{s.id}</td>

                    <td className={td}>
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-black flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {getInitials(s.firstName, s.lastName)}
                        </div>
                        <span className="block truncate font-semibold text-black text-xs">
                          {s.firstName} {s.lastName}
                        </span>
                      </div>
                    </td>

                    <td className={`${td} text-zinc-500`}>
                      <span className="block truncate text-xs">{s.email}</span>
                    </td>

                    <td className={`${td} text-zinc-400`}>
                      <span className="block truncate text-xs">{s.phone || '—'}</span>
                    </td>

                    <td className={`${td} text-zinc-500 capitalize text-xs`}>{s.clientType}</td>

                    <td className={td}>
                      <div className="flex flex-wrap gap-1">
                        {s.services.map(svc => (
                          <span
                            key={svc}
                            className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-medium rounded-md whitespace-nowrap"
                          >
                            {SERVICE_LABELS[svc] || svc}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className={`${td} text-black font-semibold text-xs`}>
                      {s.budget?.startsWith('$') || s.budget?.startsWith('U') ? s.budget : `$${s.budget}`}
                    </td>

                    <td className={`${td} text-zinc-400 text-xs`}>{s.teamSize || '—'}</td>

                    <td className={`${td} text-zinc-400 text-xs`}>{formatTimeline(s)}</td>

                    <td className={`${td} text-zinc-400 whitespace-nowrap text-xs`}>{formatDate(s.createdAt)}</td>

                    {onQuickAdd && (
                      <td className="px-3 py-3 align-middle" onClick={e => e.stopPropagation()}>
                        {isClient ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 px-2 py-1 bg-green-50 rounded-md whitespace-nowrap font-medium">
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            Client
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={e => handleQuickAdd(e, s)}
                            disabled={isAdding}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-black text-white opacity-0 group-hover:opacity-100 disabled:opacity-50 transition-all font-semibold whitespace-nowrap hover:bg-zinc-800"
                          >
                            <span className="material-symbols-outlined text-[14px]">person_add</span>
                            {isAdding ? '…' : 'Convert'}
                          </button>
                        )}
                      </td>
                    )}

                    <td className="px-2 py-3 align-middle text-zinc-400">
                      <span className="material-symbols-outlined text-[18px]">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </td>
                  </motion.tr>

                  {/* Expanded description row */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.tr
                        key={`${s.id}-desc`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <td colSpan={totalCols} className="p-0 border-b border-zinc-100">
                          <div className="px-6 py-4 bg-zinc-50">
                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5 font-bold">Description</p>
                            <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
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
          <div className="px-4 py-12 text-center text-zinc-400 text-sm">
            {searchTerm ? 'No submissions match your search.' : 'No submissions yet.'}
          </div>
        )}
      </div>
    </div>
  )
}

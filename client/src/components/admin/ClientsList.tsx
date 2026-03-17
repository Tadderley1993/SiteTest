import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, Search, Globe, Mail, Phone, Building2, ArrowRight } from 'lucide-react'
import { Client, Submission, getClients, createClient, ClientFormData } from '../../lib/api'
import AddClientModal from './AddClientModal'

interface Props {
  submissions: Submission[]
  onSelectClient: (id: number) => void
}

export default function ClientsList({ submissions, onSelectClient }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getClients()
        setClients(data)
      } catch {
        setError('Failed to load clients')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const handleCreate = async (data: ClientFormData) => {
    try {
      const client = await createClient(data)
      setClients(prev => [client, ...prev])
      setShowModal(false)
    } catch {
      setError('Failed to create client')
    }
  }

  const filtered = clients.filter(c =>
    `${c.firstName} ${c.lastName} ${c.email} ${c.organization ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  // Available submissions (not already converted to clients)
  const usedSubmissionIds = new Set(clients.map(c => c.submissionId).filter(Boolean))
  const availableSubmissions = submissions.filter(s => !usedSubmissionIds.has(s.id))

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Current Clients</h2>
            <p className="text-sm text-text-muted mt-0.5">{clients.length} active client{clients.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-lg font-medium text-sm hover:bg-accent/90 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Client
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent/40 text-sm transition-colors"
          />
        </div>

        {/* Error */}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Loading */}
        {isLoading ? (
          <div className="py-16 text-center text-text-muted">Loading clients...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-muted text-sm">
              {search ? 'No clients match your search.' : 'No current clients yet. Add your first client!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((client, i) => {
              const taskCount = client.tasks?.length ?? 0
              const doneTasks = client.tasks?.filter(t => t.column === 'done').length ?? 0
              const status = client.projectScope?.status ?? 'active'

              return (
                <motion.button
                  key={client.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => onSelectClient(client.id)}
                  className="group text-left bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-white/20 rounded-xl p-5 transition-all"
                >
                  {/* Avatar + name */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-semibold text-sm flex-shrink-0">
                        {client.firstName[0]}{client.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary text-sm leading-tight">
                          {client.firstName} {client.lastName}
                        </p>
                        {client.title && (
                          <p className="text-xs text-text-muted mt-0.5">{client.title}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      status === 'active' ? 'bg-green-400/10 text-green-400' :
                      status === 'completed' ? 'bg-accent/10 text-accent' :
                      status === 'onhold' ? 'bg-yellow-400/10 text-yellow-400' :
                      'bg-red-400/10 text-red-400'
                    }`}>
                      {status}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5 mb-4">
                    {client.organization && (
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{client.organization}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.website && (
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <Globe className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{client.website}</span>
                      </div>
                    )}
                  </div>

                  {/* Task progress */}
                  {taskCount > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                        <span>Tasks</span>
                        <span>{doneTasks}/{taskCount}</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${taskCount > 0 ? (doneTasks / taskCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Project name */}
                  {client.projectScope?.projectName && (
                    <p className="text-xs text-accent/70 truncate mb-3">
                      {client.projectScope.projectName}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-text-muted">
                      {new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <AddClientModal
          submissions={availableSubmissions}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  )
}

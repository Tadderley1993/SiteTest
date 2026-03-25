import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Client, Submission, getClients, createClient, ClientFormData } from '../../lib/api'
import AddClientModal from './AddClientModal'

interface Props {
  submissions: Submission[]
  onSelectClient: (id: number) => void
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'active':    return 'bg-green-50 text-green-700'
    case 'completed': return 'bg-blue-50 text-blue-700'
    case 'onhold':    return 'bg-amber-50 text-amber-700'
    case 'onboarding': return 'bg-violet-50 text-violet-700'
    default:          return 'bg-zinc-100 text-zinc-500'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'active':    return 'Active'
    case 'completed': return 'Completed'
    case 'onhold':    return 'Paused'
    case 'onboarding': return 'Onboarding'
    default:          return status
  }
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

  const usedSubmissionIds = new Set(clients.map(c => c.submissionId).filter(Boolean))
  const availableSubmissions = submissions.filter(s => !usedSubmissionIds.has(s.id))

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <nav className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <span>Agency OS</span>
              <span>/</span>
              <span className="text-black">Clients</span>
            </nav>
            <h1 className="text-4xl font-bold tracking-tighter">Client Ecosystem</h1>
            <p className="text-zinc-400 text-sm mt-1">
              {clients.length} client{clients.length !== 1 ? 's' : ''} in your network
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="bg-black text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add New Client
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#e8e8e8] border-none rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 placeholder-zinc-400"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {isLoading ? (
          <div className="py-16 text-center text-zinc-400">Loading clients...</div>
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
                  className="group text-left bg-white hover:shadow-xl ring-1 ring-black/[0.05] rounded-xl p-5 transition-all"
                >
                  {/* Avatar + name + status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {getInitials(client.firstName, client.lastName)}
                      </div>
                      <div>
                        <p className="font-bold text-black text-sm leading-tight">
                          {client.firstName} {client.lastName}
                        </p>
                        {client.title && (
                          <p className="text-xs text-zinc-400 mt-0.5">{client.title}</p>
                        )}
                        {client.organization && (
                          <p className="text-xs text-zinc-400 mt-0.5">{client.organization}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex-shrink-0 ${getStatusStyle(status)}`}>
                      {getStatusLabel(status)}
                    </span>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="material-symbols-outlined text-[14px] text-zinc-300">mail</span>
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="material-symbols-outlined text-[14px] text-zinc-300">call</span>
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.website && (
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="material-symbols-outlined text-[14px] text-zinc-300">language</span>
                        <span className="truncate">{client.website}</span>
                      </div>
                    )}
                  </div>

                  {/* Task progress */}
                  {taskCount > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                        <span>Tasks</span>
                        <span className="font-medium">{doneTasks}/{taskCount}</span>
                      </div>
                      <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-black rounded-full transition-all"
                          style={{ width: `${(doneTasks / taskCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Project name */}
                  {client.projectScope?.projectName && (
                    <p className="text-xs text-zinc-400 truncate mb-3 italic">
                      {client.projectScope.projectName}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    <span className="text-xs text-zinc-400">
                      {new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-zinc-300 group-hover:text-black group-hover:translate-x-0.5 transition-all">
                      arrow_forward
                    </span>
                  </div>
                </motion.button>
              )
            })}

            {/* Add new client card */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: filtered.length * 0.04 }}
              onClick={() => setShowModal(true)}
              className="group text-left bg-white hover:bg-black ring-1 ring-black/[0.05] border-2 border-dashed border-zinc-200 hover:border-black rounded-xl p-5 transition-all flex flex-col items-center justify-center min-h-[200px] gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-zinc-400 group-hover:text-white text-[22px] transition-colors">add</span>
              </div>
              <p className="text-sm font-semibold text-zinc-400 group-hover:text-white transition-colors">Add New Client</p>
            </motion.button>
          </div>
        )}

        {!isLoading && filtered.length === 0 && search && (
          <div className="py-16 text-center text-zinc-400 text-sm">No clients match your search.</div>
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

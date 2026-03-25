import { useState, useEffect } from 'react'
import KanbanBoard from './KanbanBoard'
import { getClients, Client, KanbanTask } from '../../lib/api'

export default function ProjectsView() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getClients()
      .then(data => {
        setClients(data)
        if (data.length > 0) setSelectedClientId(data[0].id)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const selectedClient = clients.find(c => c.id === selectedClientId)

  const handleTasksChange = (tasks: KanbanTask[]) => {
    if (!selectedClientId) return
    setClients(prev =>
      prev.map(c =>
        c.id === selectedClientId ? { ...c, tasks } : c
      )
    )
  }

  return (
    <div>
      <div className="mb-8">
        <nav className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <span>Agency OS</span>
          <span>/</span>
          <span className="text-black">Projects</span>
        </nav>
        <h1 className="text-4xl font-bold tracking-tighter">Production Board</h1>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-zinc-400 text-sm">Loading projects...</div>
      ) : clients.length === 0 ? (
        <div className="py-16 text-center text-zinc-400 text-sm">No clients yet. Add a client to get started.</div>
      ) : (
        <>
          {/* Client selector */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClientId(c.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedClientId === c.id
                    ? 'bg-black text-white'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 ring-1 ring-black/[0.06]'
                }`}
              >
                {c.firstName} {c.lastName}
              </button>
            ))}
          </div>

          {selectedClient && (
            <KanbanBoard
              clientId={selectedClient.id}
              tasks={selectedClient.tasks ?? []}
              onTasksChange={handleTasksChange}
            />
          )}
        </>
      )}
    </div>
  )
}

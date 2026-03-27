import { useEffect, useRef, useState } from 'react'
import {
  AdminMessage,
  ClientThread,
  getAllMessageThreads,
  getClientMessages,
  sendAdminMessage,
} from '../../lib/api'

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function fullTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MessagesView() {
  const [threads, setThreads] = useState<ClientThread[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load all threads
  useEffect(() => {
    getAllMessageThreads()
      .then(setThreads)
      .catch(() => {})
      .finally(() => setLoadingThreads(false))
  }, [])

  // Load messages when active thread changes
  useEffect(() => {
    if (activeId === null) return
    setLoadingMessages(true)
    getClientMessages(activeId)
      .then(msgs => {
        setMessages(msgs)
        // Mark thread unread count as 0 locally
        setThreads(prev => prev.map(t => t.clientId === activeId ? { ...t, unreadCount: 0 } : t))
      })
      .catch(() => {})
      .finally(() => setLoadingMessages(false))
  }, [activeId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const activeThread = threads.find(t => t.clientId === activeId) ?? null

  const filteredThreads = threads.filter(t => {
    const name = `${t.firstName} ${t.lastName}`.toLowerCase()
    const org = (t.organization ?? '').toLowerCase()
    const q = search.toLowerCase()
    return name.includes(q) || org.includes(q) || t.email.toLowerCase().includes(q)
  })

  const handleSend = async () => {
    if (!input.trim() || activeId === null || sending) return
    setSending(true)
    try {
      const msg = await sendAdminMessage(activeId, input.trim())
      setMessages(prev => [...prev, msg])
      setInput('')
      // Update thread preview
      setThreads(prev => prev.map(t =>
        t.clientId === activeId
          ? { ...t, lastBody: msg.body, lastFromAdmin: true, lastAt: msg.createdAt }
          : t
      ))
    } catch { /* ignore */ } finally {
      setSending(false)
    }
  }

  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0)

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-zinc-200/60 shadow-sm bg-white">

      {/* ── Thread list ────────────────────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-zinc-100">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold tracking-tight text-black">
              Messages
              {totalUnread > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-black text-white text-[10px] font-bold leading-none">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </h2>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[16px]">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-full bg-zinc-100 rounded-lg py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {loadingThreads ? (
            <div className="text-center py-12 text-zinc-400 text-sm">Loading...</div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm">
              {search ? 'No results' : 'No messages yet'}
            </div>
          ) : (
            filteredThreads.map(thread => {
              const isActive = thread.clientId === activeId
              return (
                <button
                  key={thread.clientId}
                  type="button"
                  onClick={() => setActiveId(thread.clientId)}
                  className={`w-full text-left px-4 py-3.5 flex gap-3 border-b border-zinc-50 transition-colors ${
                    isActive ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-black">
                    {thread.firstName[0]}{thread.lastName[0]}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${thread.unreadCount > 0 ? 'font-bold text-black' : 'font-medium text-zinc-800'}`}>
                        {thread.firstName} {thread.lastName}
                      </span>
                      <span className="text-[10px] text-zinc-400 ml-2 flex-shrink-0">{timeAgo(thread.lastAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {thread.lastFromAdmin && (
                        <span className="text-[11px] text-zinc-400">You:</span>
                      )}
                      <p className={`text-xs truncate ${thread.unreadCount > 0 ? 'text-black font-medium' : 'text-zinc-500'}`}>
                        {thread.lastBody}
                      </p>
                      {thread.unreadCount > 0 && (
                        <span className="ml-auto flex-shrink-0 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-black text-white text-[9px] font-bold leading-none">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Conversation panel ─────────────────────────────────────────────── */}
      {activeId === null ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-zinc-400">
          <span className="material-symbols-outlined text-[48px] text-zinc-200">chat_bubble</span>
          <p className="text-sm font-medium">Select a conversation</p>
          <p className="text-xs text-zinc-300">Choose a client thread from the left</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Conversation header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100">
            {activeThread && (
              <>
                <div className="h-9 w-9 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
                  {activeThread.firstName[0]}{activeThread.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-black leading-tight">
                    {activeThread.firstName} {activeThread.lastName}
                  </p>
                  <p className="text-xs text-zinc-400">{activeThread.email}</p>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
            {loadingMessages ? (
              <div className="text-center py-12 text-zinc-400 text-sm">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm">No messages yet. Start the conversation.</div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.fromAdmin ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-medium text-zinc-400 px-1">
                    {msg.fromAdmin ? 'You' : (activeThread ? `${activeThread.firstName} ${activeThread.lastName}` : 'Client')}
                  </span>
                  <div className={`max-w-[68%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.fromAdmin
                      ? 'bg-black text-white rounded-br-sm'
                      : 'bg-zinc-100 text-black rounded-bl-sm'
                  }`}>
                    <p>{msg.body}</p>
                    <p className={`text-[10px] mt-1 ${msg.fromAdmin ? 'text-white/50' : 'text-zinc-400'}`}>
                      {fullTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-zinc-100">
            <div className="flex items-center gap-3 bg-zinc-100 rounded-xl px-4 py-2.5">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-zinc-400"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-40 transition-opacity hover:bg-zinc-800"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

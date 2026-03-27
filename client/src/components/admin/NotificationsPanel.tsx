import { useState, useEffect, useRef } from 'react'
import {
  AdminNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearReadNotifications,
} from '../../lib/api'

// ── Icon per notification type ────────────────────────────────────────────────

function NotifIcon({ type }: { type: string }) {
  const base = 'material-symbols-outlined text-[18px]'
  const map: Record<string, { icon: string; color: string }> = {
    submission:    { icon: 'send',          color: 'text-blue-500' },
    email_sent:    { icon: 'mail',          color: 'text-violet-500' },
    file_uploaded: { icon: 'upload_file',   color: 'text-amber-500' },
    invoice_sent:  { icon: 'receipt_long',  color: 'text-zinc-600' },
    invoice_paid:  { icon: 'paid',          color: 'text-green-600' },
    message:       { icon: 'chat_bubble',   color: 'text-sky-500' },
  }
  const { icon, color } = map[type] ?? { icon: 'notifications', color: 'text-zinc-400' }
  return <span className={`${base} ${color}`}>{icon}</span>
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onUnreadCountChange: (count: number) => void
}

export default function NotificationsPanel({ onUnreadCountChange }: Props) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifs.filter(n => !n.read).length

  // Keep parent badge in sync
  useEffect(() => {
    onUnreadCountChange(unreadCount)
  }, [unreadCount, onUnreadCountChange])

  // Initial load + polling every 30s
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await getNotifications()
        if (mounted) setNotifs(data)
      } catch { /* silent */ }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = async () => {
    setOpen(o => !o)
    if (!open) {
      setLoading(true)
      try {
        const data = await getNotifications()
        setNotifs(data)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleClear = async () => {
    await clearReadNotifications()
    setNotifs(prev => prev.filter(n => !n.read))
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative text-zinc-500 hover:text-black transition-colors"
        title="Notifications"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-10 w-[360px] bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-zinc-200/60 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-black">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-zinc-500 hover:text-black transition-colors font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={handleClear}
                className="text-[11px] text-zinc-400 hover:text-black transition-colors"
                title="Clear read notifications"
              >
                <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="py-10 text-center text-sm text-zinc-400">Loading…</div>
            ) : notifs.length === 0 ? (
              <div className="py-10 text-center text-sm text-zinc-400">No notifications yet</div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-zinc-50 transition-colors ${
                    !n.read
                      ? 'bg-zinc-50 hover:bg-zinc-100 cursor-pointer'
                      : 'hover:bg-zinc-50/50'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                    <NotifIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-black' : 'font-medium text-zinc-700'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-zinc-400 flex-shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{n.body}</p>
                  </div>
                  {!n.read && (
                    <div className="flex-shrink-0 mt-2 w-2 h-2 rounded-full bg-black" />
                  )}
                </div>
              ))
            )}
          </div>

          {notifs.length > 0 && (
            <div className="px-4 py-2 text-center border-t border-zinc-100">
              <span className="text-[11px] text-zinc-400">
                {notifs.filter(n => !n.read).length} unread · {notifs.length} total
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface ReminderToastItem {
  key: string          // unique: `${eventId}_${offset}`
  eventId: number
  title: string
  eventType: string
  startAt: string
  minutesBefore: number
  color: string
}

interface Props {
  toasts: ReminderToastItem[]
  onDismiss: (key: string) => void
}

const TYPE_ICON: Record<string, string> = {
  reminder: 'notifications',
  event:    'event',
  call:     'call',
  followup: 'reply',
  meeting:  'group',
  deadline: 'flag',
}

function timeLabel(minutesBefore: number): string {
  if (minutesBefore < 60) return `${minutesBefore} min`
  if (minutesBefore < 1440) return `${minutesBefore / 60} hr`
  return `${minutesBefore / 1440} day${minutesBefore / 1440 > 1 ? 's' : ''}`
}

function formatStart(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function ToastItem({ toast, onDismiss }: { toast: ReminderToastItem; onDismiss: () => void }) {
  // Auto-dismiss after 30 seconds
  useEffect(() => {
    const t = setTimeout(onDismiss, 30000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const [blink, setBlink] = useState(true)

  // Bell blink stops after 5 seconds
  useEffect(() => {
    const t = setTimeout(() => setBlink(false), 5000)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex items-start gap-3 bg-white rounded-xl shadow-2xl border border-zinc-200 p-4 w-80 overflow-hidden"
    >
      {/* Left color stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: toast.color }}
      />

      {/* Bell icon with pulse ring */}
      <div className="relative shrink-0 mt-0.5 ml-1">
        <div className={`absolute inset-0 rounded-full ${blink ? 'animate-ping' : ''} bg-amber-400/40`} />
        <div className="relative w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
          <span className={`material-symbols-outlined text-[18px] text-amber-500 ${blink ? 'animate-pulse' : ''}`}>
            {TYPE_ICON[toast.eventType] ?? 'notifications'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">
          Reminder — {timeLabel(toast.minutesBefore)} before
        </p>
        <p className="text-sm font-bold text-black truncate">{toast.title}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{formatStart(toast.startAt)}</p>
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-zinc-300 hover:text-zinc-600 transition-colors mt-0.5"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>

      {/* Progress bar — depletes over 30s */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-100">
        <motion.div
          className="h-full bg-amber-400"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 30, ease: 'linear' }}
          style={{ transformOrigin: 'left' }}
        />
      </div>
    </motion.div>
  )
}

export default function ReminderToast({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.slice(0, 4).map(t => (
          <div key={t.key} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={() => onDismiss(t.key)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

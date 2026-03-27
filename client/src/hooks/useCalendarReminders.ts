import { useEffect, useRef, useState, useCallback } from 'react'
import { getCalendarEvents, createNotification } from '../lib/api'
import type { ReminderToastItem } from '../components/admin/ReminderToast'

// localStorage key prefix for tracking fired reminders
const FIRED_KEY = (eventId: number, offset: number) => `dta_reminder_fired_${eventId}_${offset}`

// How long after the fire time we still consider a reminder "active" (ms)
const WINDOW_MS = 10 * 60 * 1000  // 10 minutes

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function useCalendarReminders() {
  const [toasts, setToasts] = useState<ReminderToastItem[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const checkReminders = useCallback(async () => {
    const now = Date.now()
    // Fetch events for the next 31 days
    const start = new Date().toISOString()
    const end = new Date(now + 31 * 24 * 60 * 60 * 1000).toISOString()

    let events
    try {
      events = await getCalendarEvents(start, end)
    } catch {
      return
    }

    const fired: ReminderToastItem[] = []

    for (const event of events) {
      let offsets: number[] = []
      try { offsets = JSON.parse(event.reminders ?? '[]') } catch { continue }
      if (!offsets.length) continue

      const eventTime = new Date(event.startAt).getTime()

      for (const offset of offsets) {
        const fireTime = eventTime - offset * 60 * 1000
        const key = FIRED_KEY(event.id, offset)

        // Already fired today? Skip.
        const alreadyFired = localStorage.getItem(key)
        if (alreadyFired === getToday()) continue

        // Within the fire window?
        if (now >= fireTime && now <= fireTime + WINDOW_MS) {
          // Mark as fired
          localStorage.setItem(key, getToday())

          fired.push({
            key: `${event.id}_${offset}`,
            eventId: event.id,
            title: event.title,
            eventType: event.eventType,
            startAt: event.startAt,
            minutesBefore: offset,
            color: event.color,
          })

          // Create bell notification
          const label = offset < 60 ? `${offset} min` : offset < 1440 ? `${offset / 60} hr` : `${offset / 1440} day`
          createNotification(
            'reminder',
            `Reminder: ${event.title}`,
            `Starting in ${label} — ${new Date(event.startAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
          ).catch(() => { /* silent */ })
        }
      }
    }

    if (fired.length > 0) {
      setToasts(prev => {
        const existingKeys = new Set(prev.map(t => t.key))
        const newOnes = fired.filter(f => !existingKeys.has(f.key))
        return [...prev, ...newOnes]
      })
    }
  }, [])

  useEffect(() => {
    // Check immediately on mount
    checkReminders()
    // Then every 30 seconds
    intervalRef.current = setInterval(checkReminders, 30 * 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [checkReminders])

  const dismiss = useCallback((key: string) => {
    setToasts(prev => prev.filter(t => t.key !== key))
  }, [])

  return { toasts, dismiss }
}

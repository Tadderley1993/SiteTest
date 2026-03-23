import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, Layers, Send, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import FormPanel from '../form/FormPanel'

const ITEMS = [
  { icon: Home,       label: 'Home',      href: '/',          exact: true },
  { icon: LayoutGrid, label: 'Portfolio', href: '/portfolio', exact: false },
  { icon: Layers,     label: 'Services',  href: '/services',  exact: false },
  { icon: Send,       label: 'Contact',   href: null,         exact: false },
]

export default function BottomNav() {
  const location = useLocation()
  const [modalOpen, setModalOpen] = useState(false)
  const [formDone, setFormDone] = useState(false)

  const isActive = (href: string, exact: boolean) =>
    exact ? location.pathname === href : location.pathname.startsWith(href)

  return (
    <>
      {/* ── Bottom nav bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-background border-t border-[rgba(0,0,0,0.08)] shadow-[0_-8px_32px_rgba(29,28,23,0.06)]">
        {ITEMS.map(({ icon: Icon, label, href, exact }) => {
          const active = href ? isActive(href, exact) : modalOpen
          const cls = `flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
            active
              ? 'bg-accent text-[#1C1917] scale-90'
              : 'text-text-primary hover:bg-[rgba(0,0,0,0.05)]'
          }`

          if (!href) {
            return (
              <button key={label} type="button" onClick={() => { setFormDone(false); setModalOpen(true) }} className={cls} aria-label={label}>
                <Icon size={20} strokeWidth={active ? 2 : 1.75} />
              </button>
            )
          }
          return (
            <Link key={label} to={href} className={cls} aria-label={label}>
              <Icon size={20} strokeWidth={active ? 2 : 1.75} />
            </Link>
          )
        })}
      </nav>

      {/* ── CTA popup overlay ── */}
      <AnimatePresence>
        {modalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[61] bg-[#1C1917] rounded-t-2xl overflow-hidden"
              style={{ maxHeight: '90dvh' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[rgba(255,255,255,0.07)]">
                <div>
                  <p className="text-[11px] tracking-[0.12em] uppercase text-[#78706A] mb-0.5">Get Started</p>
                  <h2 className="text-[20px] font-bold text-[#F5F0E8] tracking-tight">Start Your Project</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] text-[#F5F0E8] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
                  aria-label="Close"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Form */}
              <div className="overflow-y-auto px-6 py-6" style={{ maxHeight: 'calc(90dvh - 80px)' }}>
                {formDone ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-full bg-[rgba(198,168,75,0.15)] flex items-center justify-center mx-auto mb-5">
                      <span className="text-2xl text-accent">✓</span>
                    </div>
                    <h3 className="text-[22px] font-bold text-[#F5F0E8] mb-2">You're all set.</h3>
                    <p className="text-[#78706A] text-sm">I'll be in touch within 24 hours to discuss your project.</p>
                    <button type="button" onClick={() => setModalOpen(false)} className="mt-6 text-accent text-sm underline underline-offset-4">Close</button>
                  </div>
                ) : (
                  <FormPanel onComplete={() => setFormDone(true)} />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

import { useState, useEffect } from 'react'
import type React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Sparkles, User, Layers, LayoutGrid, BarChart2, Menu, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/',              label: 'Home',          icon: Home },
  { href: '/why-choose-me', label: 'Why Choose Me', icon: Sparkles },
  { href: '/about',         label: 'About',         icon: User },
  { href: '/services',      label: 'Services',      icon: Layers },
  { href: '/portfolio',     label: 'Portfolio',     icon: LayoutGrid },
  { href: '/case-studies',  label: 'Case Studies',  icon: BarChart2 },
]

function NavButton({ href, label, icon: Icon, active }: {
  href: string; label: string; icon: LucideIcon; active: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="relative flex items-center">
      <motion.div
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <Link
          to={href}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative flex items-center justify-center w-10 h-10 rounded-full"
          style={{
            background: active
              ? 'rgba(255,255,255,1)'
              : hovered
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.18)',
            backdropFilter: active ? 'blur(20px) saturate(180%)' : 'blur(6px)',
            WebkitBackdropFilter: active ? 'blur(20px) saturate(180%)' : 'blur(6px)',
            boxShadow: active
              ? '0 0 0 1.5px rgba(255,255,255,0.65), 0 0 20px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 28px rgba(255,255,255,0.35), 0 0 60px rgba(255,255,255,0.15)'
              : hovered
                ? '0 0 0 1px rgba(255,255,255,0.3), 0 0 12px rgba(255,255,255,0.12)'
                : '0 0 0 1px rgba(255,255,255,0.08), 0 0 10px rgba(255,255,255,0.04)',
            transition: 'background 0.2s, box-shadow 0.2s',
          }}
        >
          <Icon
            size={15}
            strokeWidth={active ? 2 : 1.75}
            style={{
              color: active ? '#C6A84B' : 'rgba(255,255,255,0.9)',
              filter: active
                ? 'drop-shadow(0 0 4px rgba(198,168,75,0.5))'
                : hovered
                  ? 'drop-shadow(0 0 4px rgba(255,255,255,0.4))'
                  : 'none',
              transition: 'color 0.2s, filter 0.2s',
            }}
          />
        </Link>
      </motion.div>

      {/* Floating label on hover / active */}
      <AnimatePresence>
        {(hovered || active) && (
          <motion.div
            initial={{ opacity: 0, x: -6, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -4, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-12 pointer-events-none"
          >
            <span
              className="block px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                color: 'rgba(255,255,255,0.95)',
                textShadow: active ? '0 0 8px rgba(255,255,255,0.8), 0 0 16px rgba(255,255,255,0.4)' : 'none',
                boxShadow: active
                  ? '0 0 0 1px rgba(198,168,75,0.35), 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)'
                  : '0 0 0 1px rgba(255,255,255,0.14), 0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                letterSpacing: '0.02em',
              }}
            >
              {label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Sidebar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setMobileOpen(false)
  }

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-4 bg-[rgba(15,12,10,0.72)] backdrop-blur-md border-b border-[rgba(255,255,255,0.06)]">

        {/* Hamburger */}
        <motion.button
          type="button"
          onClick={() => setMobileOpen(v => !v)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          className="flex items-center justify-center w-9 h-9 rounded-full text-white/80"
          aria-label="Toggle menu"
          style={{
            background: 'rgba(255,255,255,0.1)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.12)',
          }}
        >
          {mobileOpen ? <X size={17} /> : <Menu size={17} />}
        </motion.button>

        {/* Logo — centered */}
        <Link to="/" onClick={handleLogoClick} className="absolute left-1/2 -translate-x-1/2">
          <img
            src="/logo-white.png"
            alt="Designs By TA"
            style={{ height: 36, width: 'auto' }}
          />
        </Link>

        {/* Start a Project — right */}
        <a
          href="#start-project"
          className="px-3.5 py-1.5 rounded-full bg-accent text-[#1C1917] text-[12px] font-semibold tracking-[0.03em] hover:bg-accent-dim transition-colors"
        >
          Start a Project
        </a>
      </div>

      {/* ── Mobile dropdown menu ────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/30"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden fixed top-16 left-4 right-4 z-50 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(240,235,227,0.98)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.15)',
              }}
            >
              {/* Logo button — above Home */}
              <Link
                to="/"
                className="flex items-center justify-center py-5 border-b border-[rgba(0,0,0,0.07)]"
                onClick={handleLogoClick}
              >
                <img
                  src="/logo-white.png"
                  alt="Designs By TA"
                  style={{ height: 40, width: 'auto' }}
                />
              </Link>

              {/* Nav links */}
              <div className="px-2 py-2 flex flex-col gap-0.5">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href)
                  return (
                    <Link
                      key={href}
                      to={href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors"
                      style={{
                        color: active ? '#1C1917' : '#78706A',
                        background: active ? 'rgba(198,168,75,0.1)' : 'transparent',
                      }}
                    >
                      <Icon size={16} strokeWidth={active ? 2 : 1.75} style={{ color: active ? '#C6A84B' : '#78706A' }} />
                      {label}
                    </Link>
                  )
                })}
              </div>

              {/* CTA */}
              <div className="px-4 pb-4 pt-2 border-t border-[rgba(0,0,0,0.06)]">
                <a
                  href="#start-project"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center w-full py-3 rounded-full bg-accent text-[#1C1917] text-[14px] font-semibold tracking-[0.03em] hover:bg-accent-dim transition-colors"
                >
                  Start a Project
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop — floating button stack with logo on top ─────────── */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-50 h-screen flex-col items-start px-4">

        {/* Logo at top */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="pt-5"
        >
          <Link to="/" onClick={handleLogoClick}>
            <img
              src="/logo-white.png"
              alt="Designs By TA"
              style={{ height: 36, width: 'auto' }}
            />
          </Link>
        </motion.div>

        {/* Nav buttons — vertically centered in remaining space */}
        <div className="flex-1 flex items-center">
          <motion.nav
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
            }}
            className="flex flex-col gap-3"
          >
            {NAV_LINKS.map(link => (
              <motion.div
                key={link.href}
                variants={{
                  hidden: { opacity: 0, x: -16 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                }}
              >
                <NavButton {...link} active={isActive(link.href)} />
              </motion.div>
            ))}
          </motion.nav>
        </div>
      </aside>
    </>
  )
}

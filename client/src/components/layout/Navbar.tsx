import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '/',              label: 'Home' },
  { href: '/why-choose-me', label: 'Why Choose Me' },
  { href: '/about',         label: 'About' },
  { href: '/services',      label: 'Services' },
  { href: '/portfolio',     label: 'Portfolio' },
  { href: '/case-studies',  label: 'Case Studies' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? 'bg-[#F0EBE3]/95 backdrop-blur-md border-b border-[rgba(0,0,0,0.08)]'
          : 'bg-[#F0EBE3] border-b border-[rgba(0,0,0,0.06)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo — top left, links to home */}
          <Link to="/" className="flex items-center shrink-0">
            <img
              src="/logo-white.png"
              alt="Designs By TA"
              className="h-10 w-auto"
              style={{ filter: 'invert(1)' }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                to={href}
                className={`px-3.5 py-2 text-[13px] font-medium transition-colors duration-150 border-b-2 ${
                  isActive(href)
                    ? 'text-text-primary border-text-primary'
                    : 'text-text-muted hover:text-text-primary border-transparent'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:block">
            <a
              href="#start-project"
              className="inline-flex items-center px-5 py-2.5 rounded-full bg-accent text-[#1C1917] text-[13px] font-semibold tracking-[0.03em] hover:bg-accent-dim transition-colors duration-150"
            >
              Start a Project
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden p-2 rounded-md text-text-muted hover:text-text-primary transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[rgba(0,0,0,0.08)] bg-[#F0EBE3]">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">

            {/* Logo button — above Home */}
            <Link
              to="/"
              className="flex items-center justify-center py-4 mb-2 border-b border-[rgba(0,0,0,0.07)]"
            >
              <img
                src="/logo-white.png"
                alt="Designs By TA — Home"
                className="h-10 w-auto"
                style={{ filter: 'invert(1)' }}
              />
            </Link>

            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                to={href}
                className={`px-3 py-3 text-[15px] font-medium border-b transition-colors ${
                  isActive(href)
                    ? 'text-text-primary border-text-primary'
                    : 'text-text-muted hover:text-text-primary border-transparent'
                }`}
              >
                {label}
              </Link>
            ))}

            <a
              href="#start-project"
              className="mt-3 px-4 py-3 rounded-full bg-accent text-[#1C1917] text-[14px] font-semibold text-center tracking-[0.03em] hover:bg-accent-dim transition-colors"
            >
              Start a Project
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}

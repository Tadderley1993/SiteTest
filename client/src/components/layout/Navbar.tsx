import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/',          label: 'Home'     },
  { to: '/services',  label: 'Services' },
  { to: '/about',     label: 'About'    },
  { to: '/insights',  label: 'Insights' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-[#e5e5e5]'
            : 'bg-white border-b border-[#e5e5e5]'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-[60px] flex items-center justify-between">
          {/* Brand */}
          <Link
            to="/"
            onClick={() => {
              if (location.pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="flex items-center gap-2.5 select-none"
          >
            <img
              src="/dbt_slate.png"
              alt="Designs By TA"
              style={{ height: 28, width: 'auto' }}
            />
            <span className="text-[12px] tracking-[0.12em] uppercase text-black font-bold leading-tight">
              <span className="font-light text-[#888] tracking-[0.08em]">Designs By </span>Terrence Adderley
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `text-[13px] font-medium tracking-wide transition-colors duration-150 ${
                    isActive ? 'text-black' : 'text-[#474747] hover:text-black'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center">
            <Link
              to="/contact"
              className="bg-black text-white text-[11px] font-semibold tracking-[0.1em] uppercase px-5 py-2.5 hover:bg-[#222] transition-colors"
            >
              Book a Free Consultation
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden flex flex-col justify-center gap-[5px] w-8 h-8 p-1"
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span
              className={`block w-full h-[1.5px] bg-black transition-all duration-200 origin-center ${
                menuOpen ? 'translate-y-[6.5px] rotate-45' : ''
              }`}
            />
            <span
              className={`block w-full h-[1.5px] bg-black transition-all duration-200 ${
                menuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block w-full h-[1.5px] bg-black transition-all duration-200 origin-center ${
                menuOpen ? '-translate-y-[6.5px] -rotate-45' : ''
              }`}
            />
          </button>
        </nav>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 bg-white flex flex-col pt-[60px] transition-all duration-200 md:hidden ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col px-6 pt-6 gap-0">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="py-5 text-[22px] font-semibold tracking-tight text-black border-b border-[#e5e5e5] hover:text-[#474747] transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link
            to="/contact"
            className="block text-center mt-8 bg-black text-white text-[12px] font-semibold tracking-[0.1em] uppercase py-4 hover:bg-[#222] transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Book a Free Consultation
          </Link>
        </nav>
        {/* dismiss overlay */}
        <div
          className="flex-1"
          onClick={() => { navigate('/contact'); setMenuOpen(false) }}
        />
      </div>
    </>
  )
}

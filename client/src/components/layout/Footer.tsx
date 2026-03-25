import { Link } from 'react-router-dom'

const NAV = [
  { to: '/',          label: 'Home'     },
  { to: '/services',  label: 'Services' },
  { to: '/about',     label: 'About'    },
  { to: '/contact',   label: 'Contact'  },
  { to: '/insights',  label: 'Insights' },
]

const SERVICES = [
  'Brand Identity',
  'Web Design',
  'Web Development',
  'SEO Optimization',
  'E-Commerce',
]

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-white/10">

          {/* Brand */}
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-5">
              TERRENCE ADDERLEY
            </p>
            <p className="text-[14px] text-white/50 leading-relaxed max-w-[240px]">
              Freelance web designer and developer in Boston, MA. Building websites that work as hard as you do.
            </p>
          </div>

          {/* Pages */}
          <div>
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/40 mb-5">Pages</p>
            <ul className="flex flex-col gap-3">
              {NAV.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-[14px] text-white/60 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services + contact */}
          <div>
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/40 mb-5">Services</p>
            <ul className="flex flex-col gap-3 mb-8">
              {SERVICES.map(s => (
                <li key={s}>
                  <Link to="/services" className="text-[14px] text-white/60 hover:text-white transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to="/contact"
              className="inline-block border border-white/30 text-white text-[12px] font-semibold tracking-[0.08em] uppercase px-5 py-3 hover:bg-white hover:text-black transition-all"
            >
              Start a Project →
            </Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/30">
            © {new Date().getFullYear()} Terrence Adderley. All rights reserved.
          </p>
          <p className="text-[12px] text-white/30">
            Boston, MA · Available Worldwide
          </p>
        </div>
      </div>
    </footer>
  )
}

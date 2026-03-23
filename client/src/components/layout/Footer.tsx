import { Link } from 'react-router-dom'

const PAGES = [
  { href: '/',              label: 'Home' },
  { href: '/why-choose-me', label: 'Why Choose Me' },
  { href: '/about',         label: 'About' },
  { href: '/services',      label: 'Services' },
  { href: '/portfolio',     label: 'Portfolio' },
  { href: '/case-studies',  label: 'Case Studies' },
]

const SERVICES = [
  'Brand Identity',
  'Web Design',
  'Web Development',
  'SEO Optimization',
  'E-Commerce',
  'Ongoing Maintenance',
]

export default function Footer() {
  return (
    <footer className="bg-background border-t border-[rgba(0,0,0,0.08)] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img src="/logo.png" alt="Designs By TA" className="h-7 w-auto" />
            </Link>
            <p className="text-text-muted text-[14px] leading-relaxed max-w-[220px]">
              Freelance web design agency in Boston, MA. Turning ideas into digital experiences that drive results.
            </p>
          </div>

          {/* Pages */}
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-accent mb-4">Pages</p>
            <ul className="flex flex-col gap-2.5">
              {PAGES.map(({ href, label }) => (
                <li key={href}>
                  <Link to={href} className="text-[14px] text-text-muted hover:text-text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-accent mb-4">Services</p>
            <ul className="flex flex-col gap-2.5">
              {SERVICES.map(s => (
                <li key={s}>
                  <Link to="/services" className="text-[14px] text-text-muted hover:text-text-primary transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-accent mb-4">Boston, MA</p>
            <p className="text-[14px] text-text-muted leading-relaxed mb-5">
              Serving clients in Boston and beyond.
            </p>
            <a
              href="#start-project"
              className="inline-flex items-center px-5 py-2.5 rounded-full border border-text-primary text-text-primary text-[13px] font-semibold tracking-[0.03em] hover:bg-text-primary hover:text-background transition-all duration-150"
            >
              Start a Project →
            </a>
          </div>
        </div>

        <div className="border-t border-[rgba(0,0,0,0.08)] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[13px] text-text-muted">
            © {new Date().getFullYear()} Designs By TA. All rights reserved.
          </p>
          <p className="text-[13px] text-text-muted">
            Boston, MA · Web Design Agency
          </p>
        </div>
      </div>
    </footer>
  )
}

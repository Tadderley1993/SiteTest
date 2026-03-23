import { Link, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, Layers, Send } from 'lucide-react'

const ITEMS = [
  { icon: Home,        label: 'Home',      href: '/',           exact: true,  isAnchor: false },
  { icon: LayoutGrid,  label: 'Portfolio', href: '/portfolio',  exact: false, isAnchor: false },
  { icon: Layers,      label: 'Services',  href: '/services',   exact: false, isAnchor: false },
  { icon: Send,        label: 'Contact',   href: '#start-project', exact: false, isAnchor: true },
]

export default function BottomNav() {
  const location = useLocation()

  const isActive = (href: string, exact: boolean) =>
    exact ? location.pathname === href : location.pathname.startsWith(href)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-background border-t border-[rgba(0,0,0,0.08)] shadow-[0_-8px_32px_rgba(29,28,23,0.06)]">
      {ITEMS.map(({ icon: Icon, label, href, exact, isAnchor }) => {
        const active = !isAnchor && isActive(href, exact)
        const cls = `flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
          active
            ? 'bg-accent text-[#1C1917] scale-90'
            : 'text-text-primary hover:bg-[rgba(0,0,0,0.05)]'
        }`
        return isAnchor ? (
          <a key={label} href={href} className={cls} aria-label={label}>
            <Icon size={20} strokeWidth={1.75} />
          </a>
        ) : (
          <Link key={label} to={href} className={cls} aria-label={label}>
            <Icon size={20} strokeWidth={active ? 2 : 1.75} />
          </Link>
        )
      })}
    </nav>
  )
}

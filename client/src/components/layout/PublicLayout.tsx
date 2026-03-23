import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* Sidebar is fixed/overlaid — content stays full width */}
      {/* pt-14: offset mobile top bar · pb-20 md:pb-0: clear mobile bottom nav */}
      <div className="flex-1 min-w-0 pt-14 pb-20 md:pb-0 lg:pt-0">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}

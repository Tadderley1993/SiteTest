import type { ReactNode } from 'react'
import Sidebar from './Sidebar'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* Sidebar is fixed/overlaid — content stays full width, mobile gets top bar offset */}
      <div className="flex-1 min-w-0 pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  )
}

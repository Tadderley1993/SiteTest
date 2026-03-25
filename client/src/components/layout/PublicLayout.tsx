import type { ReactNode } from 'react'
import Navbar from './Navbar'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* pt-[60px] offsets the fixed navbar height */}
      <div className="pt-[60px]">
        {children}
      </div>
    </div>
  )
}

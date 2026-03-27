import { Link } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'

export default function NotFound() {
  return (
    <PageWrapper
      title="Page Not Found | Designs By TA"
      description="The page you're looking for doesn't exist. Return to the Designs By TA homepage."
      canonical="https://designsbyta.com/404"
    >
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <p className="text-[120px] font-black leading-none text-accent opacity-20 select-none">404</p>
        <h1 className="text-3xl font-bold text-text-primary mt-4 mb-3">Page not found</h1>
        <p className="text-text-muted max-w-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="px-6 py-3 bg-accent text-[#1C1917] font-semibold rounded-full hover:bg-accent-dim transition-colors"
        >
          Back to home
        </Link>
      </div>
    </PageWrapper>
  )
}

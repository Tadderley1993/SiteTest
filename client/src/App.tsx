import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './context/AuthContext'
import { ClientAuthProvider } from './context/ClientAuthContext'
import PublicLayout from './components/layout/PublicLayout'

// Eagerly loaded — small, fast, always needed
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Contact from './pages/Contact'
import Insights from './pages/Insights'
import WhyChooseMe from './pages/WhyChooseMe'
import CaseStudies from './pages/CaseStudies'
import Portfolio from './pages/Portfolio'
import NotFound from './pages/NotFound'

// Lazily loaded — heavy pages not needed on initial load
const Admin = lazy(() => import('./pages/Admin'))
const ClientPortal = lazy(() => import('./pages/ClientPortal'))
const FintechDemo = lazy(() => import('./pages/demos/FintechDemo'))
const RestaurantDemo = lazy(() => import('./pages/demos/RestaurantDemo'))
const ProductDemo = lazy(() => import('./pages/demos/ProductDemo'))
const SignProposal = lazy(() => import('./pages/SignProposal'))
const Concepts = lazy(() => import('./pages/Concepts'))
const NexaBank = lazy(() => import('./pages/concepts/NexaBank'))
const CuratedHorizon = lazy(() => import('./pages/concepts/CuratedHorizon'))
const BrandGuide = lazy(() => import('./pages/BrandGuide'))

const SuspenseFallback = <div className="min-h-screen bg-[#08090D]" />

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function GtagInjector() {
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/admin/analytics/gtag-id`)
      .then(r => r.json())
      .then(({ measurementId }: { measurementId: string | null }) => {
        if (!measurementId || document.getElementById('gtag-script')) return
        const s1 = document.createElement('script')
        s1.id = 'gtag-script'
        s1.async = true
        s1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
        document.head.appendChild(s1)
        const s2 = document.createElement('script')
        s2.id = 'gtag-init'
        s2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${measurementId}');`
        document.head.appendChild(s2)
      })
      .catch(() => {})
  }, [])
  return null
}

function App() {
  return (
    <HelmetProvider>
      <ClientAuthProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <GtagInjector />
          <Suspense fallback={SuspenseFallback}>
            <Routes>
              <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
              <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
              <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
              <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
              <Route path="/insights" element={<PublicLayout><Insights /></PublicLayout>} />
              {/* Legacy redirects */}
              <Route path="/why-choose-me" element={<WhyChooseMe />} />
              <Route path="/case-studies" element={<CaseStudies />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/demo/fintech" element={<FintechDemo />} />
              <Route path="/demo/restaurant" element={<RestaurantDemo />} />
              <Route path="/demo/product" element={<ProductDemo />} />
              <Route path="/sign/:token" element={<SignProposal />} />
              <Route path="/portal" element={<ClientPortal />} />
              <Route path="/concepts" element={<PublicLayout><Concepts /></PublicLayout>} />
              <Route path="/concepts/nexabank" element={<NexaBank />} />
              <Route path="/concepts/curated-horizon" element={<CuratedHorizon />} />
              <Route path="/guide" element={<BrandGuide />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
      </ClientAuthProvider>
    </HelmetProvider>
  )
}

export default App

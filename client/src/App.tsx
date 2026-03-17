import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'
import Admin from './pages/Admin'
import FintechDemo from './pages/demos/FintechDemo'
import RestaurantDemo from './pages/demos/RestaurantDemo'
import ProductDemo from './pages/demos/ProductDemo'
import SignProposal from './pages/SignProposal'

function GtagInjector() {
  useEffect(() => {
    fetch('/api/admin/analytics/gtag-id')
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
    <AuthProvider>
      <BrowserRouter>
        <GtagInjector />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/demo/fintech" element={<FintechDemo />} />
          <Route path="/demo/restaurant" element={<RestaurantDemo />} />
          <Route path="/demo/product" element={<ProductDemo />} />
          <Route path="/sign/:token" element={<SignProposal />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

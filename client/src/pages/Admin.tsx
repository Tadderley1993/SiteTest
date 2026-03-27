import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import LoginForm from '../components/admin/LoginForm'
import Dashboard from '../components/admin/Dashboard'
import ForceChangePassword from '../components/admin/ForceChangePassword'

export default function Admin() {
  const { isAuthenticated, mustChangePassword } = useAuth()
  const [showDashboard, setShowDashboard] = useState(false)

  if (!isAuthenticated && !showDashboard) {
    return <LoginForm onSuccess={() => setShowDashboard(true)} />
  }

  if (mustChangePassword) {
    return <ForceChangePassword />
  }

  if (isAuthenticated || showDashboard) {
    return <Dashboard onLogout={() => setShowDashboard(false)} />
  }

  return <LoginForm onSuccess={() => setShowDashboard(true)} />
}

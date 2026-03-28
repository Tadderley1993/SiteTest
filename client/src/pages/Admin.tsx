import { useAuth } from '../context/AuthContext'
import LoginForm from '../components/admin/LoginForm'
import Dashboard from '../components/admin/Dashboard'
import ForceChangePassword from '../components/admin/ForceChangePassword'

export default function Admin() {
  const { isAuthenticated, isRestoring, mustChangePassword } = useAuth()

  if (isRestoring) {
    return <div className="min-h-screen bg-[#f9f9f9]" />
  }

  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => {}} />
  }

  if (mustChangePassword) {
    return <ForceChangePassword />
  }

  return <Dashboard onLogout={() => {}} />
}

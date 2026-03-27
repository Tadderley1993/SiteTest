import { createContext, useContext, useState, ReactNode } from 'react'
import { login as apiLogin, setAuthToken } from '../lib/api'

interface AuthContextType {
  isAuthenticated: boolean
  username: string | null
  mustChangePassword: boolean
  clearMustChangePassword: () => void
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  const login = async (username: string, password: string) => {
    const response = await apiLogin({ username, password })
    setToken(response.accessToken)
    setUsername(response.username)
    setAuthToken(response.accessToken)
    setMustChangePassword(response.mustChangePassword ?? false)
  }

  const logout = () => {
    setToken(null)
    setUsername(null)
    setMustChangePassword(false)
    setAuthToken(null)
  }

  const clearMustChangePassword = () => setMustChangePassword(false)

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        username,
        mustChangePassword,
        clearMustChangePassword,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

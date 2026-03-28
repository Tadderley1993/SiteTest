import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { login as apiLogin, setAuthToken, api } from '../lib/api'

const REFRESH_KEY = 'admin_refresh_token'
const USERNAME_KEY = 'admin_username'

interface AuthContextType {
  isAuthenticated: boolean
  isRestoring: boolean
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
  const [isRestoring, setIsRestoring] = useState(true)

  // On mount: try to restore session from stored refresh token
  useEffect(() => {
    const stored = localStorage.getItem(REFRESH_KEY)
    if (!stored) { setIsRestoring(false); return }

    api.post<{ accessToken: string; refreshToken?: string }>('/auth/refresh', { refreshToken: stored })
      .then(res => {
        setToken(res.data.accessToken)
        setAuthToken(res.data.accessToken)
        setUsername(localStorage.getItem(USERNAME_KEY))
        if (res.data.refreshToken) {
          localStorage.setItem(REFRESH_KEY, res.data.refreshToken)
        }
      })
      .catch(() => {
        localStorage.removeItem(REFRESH_KEY)
        localStorage.removeItem(USERNAME_KEY)
      })
      .finally(() => setIsRestoring(false))
  }, [])

  const login = async (u: string, password: string) => {
    const response = await apiLogin({ username: u, password })
    setToken(response.accessToken)
    setUsername(response.username)
    setAuthToken(response.accessToken)
    setMustChangePassword(response.mustChangePassword ?? false)
    localStorage.setItem(REFRESH_KEY, response.refreshToken)
    localStorage.setItem(USERNAME_KEY, response.username)
  }

  const logout = () => {
    setToken(null)
    setUsername(null)
    setMustChangePassword(false)
    setAuthToken(null)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USERNAME_KEY)
  }

  const clearMustChangePassword = () => setMustChangePassword(false)

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        isRestoring,
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

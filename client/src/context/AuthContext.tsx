import { createContext, useContext, useState, ReactNode } from 'react'
import { login as apiLogin, setAuthToken } from '../lib/api'

interface AuthContextType {
  isAuthenticated: boolean
  username: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  const login = async (username: string, password: string) => {
    const response = await apiLogin({ username, password })
    setToken(response.accessToken)
    setUsername(response.username)
    setAuthToken(response.accessToken)
  }

  const logout = () => {
    setToken(null)
    setUsername(null)
    setAuthToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        username,
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

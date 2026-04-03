import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import api from '../lib/api'

interface ClientUser {
  clientId: number
  name: string
  email: string
  accessToken: string
}

interface ClientAuthContextType {
  clientUser: ClientUser | null
  clientLogin: (email: string, password: string) => Promise<void>
  clientLogout: () => void
  isClientAuthenticated: boolean
}

const SESSION_KEY = 'client_session'
const ClientAuthContext = createContext<ClientAuthContextType | null>(null)

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [clientUser, setClientUser] = useState<ClientUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      return stored ? (JSON.parse(stored) as ClientUser) : null
    } catch {
      return null
    }
  })

  // Keep sessionStorage in sync whenever clientUser changes
  useEffect(() => {
    if (clientUser) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(clientUser))
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
  }, [clientUser])

  const clientLogin = useCallback(async (email: string, password: string) => {
    const res = await api.post('/client-auth/login', { email, password })
    setClientUser(res.data)
  }, [])

  const clientLogout = useCallback(() => {
    setClientUser(null)
  }, [])

  return (
    <ClientAuthContext.Provider value={{
      clientUser,
      clientLogin,
      clientLogout,
      isClientAuthenticated: !!clientUser,
    }}>
      {children}
    </ClientAuthContext.Provider>
  )
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext)
  if (!ctx) throw new Error('useClientAuth must be inside ClientAuthProvider')
  return ctx
}

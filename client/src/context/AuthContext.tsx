import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { UserPublic } from '../types'
import * as authApi from '../api/auth'
import { getRefreshToken, authEvents } from '../api/client'

interface AuthState {
  user: UserPublic | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedRefreshToken = getRefreshToken()
    if (!storedRefreshToken) {
      setIsLoading(false)
      return
    }

    authApi.refreshAccessToken()
      .then((token) => {
        if (token) {
          return authApi.getMe()
        }
        return null
      })
      .then((u) => {
        if (u) setUser(u)
      })
      .catch(() => {
        authApi.logout()
      })
      .finally(() => setIsLoading(false))

    const handleLogout = () => {
      setUser(null)
    }
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const data = await authApi.login({ username, password })
    setUser(data.user)
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    const data = await authApi.register({ username, password })
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    authApi.logout()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const updated = await authApi.getMe()
      setUser(updated)
    } catch {
      // ignore
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

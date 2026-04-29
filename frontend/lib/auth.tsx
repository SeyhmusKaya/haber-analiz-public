"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { AuthUser, apiMe, apiLogout } from "./api"

interface AuthCtx {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (user: AuthUser, token: string) => void
  logout: () => Promise<void>
  refresh: () => Promise<void>
  forceLogout: () => void
}

const AuthContext = createContext<AuthCtx>({
  user: null, token: null, loading: true,
  login: () => {}, logout: async () => {}, refresh: async () => {}, forceLogout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 401 hatada çağrılır - sessizce çıkış yapar
  const forceLogout = useCallback(() => {
    localStorage.removeItem("auth_token")
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem("auth_token")
    if (stored) {
      setToken(stored)
      apiMe()
        .then(setUser)
        .catch(() => {
          // Token geçersiz veya süresi dolmuş
          localStorage.removeItem("auth_token")
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // Global 401 interceptor - tüm fetch isteklerinde token süresi dolmuşsa otomatik logout
  useEffect(() => {
    const originalFetch = window.fetch.bind(window)
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      if (response.status === 401 && token) {
        const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url
        // Login/register isteklerinde logout yapma
        if (!url.includes("/auth/login") && !url.includes("/auth/register")) {
          forceLogout()
        }
      }
      return response
    }
    return () => { window.fetch = originalFetch }
  }, [token, forceLogout])

  const login = (u: AuthUser, t: string) => {
    localStorage.setItem("auth_token", t)
    setToken(t)
    setUser(u)
  }

  const logout = async () => {
    try { await apiLogout() } catch { /* ignore */ }
    localStorage.removeItem("auth_token")
    setToken(null)
    setUser(null)
  }

  const refresh = async () => {
    try {
      const u = await apiMe()
      setUser(u)
    } catch {
      forceLogout()
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refresh, forceLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

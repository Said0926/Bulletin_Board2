'use client'

// Контекст авторизации: хранит данные текущего пользователя,
// предоставляет функции login/logout всем дочерним компонентам

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getMe, saveTokens, clearTokens } from './api'

type User = {
  id: number
  email: string
  is_email_verified: boolean
}

type AuthContextType = {
  user: User | null
  loading: boolean
  setTokensAndLoad: (access: string, refresh: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // При загрузке страницы пробуем загрузить профиль по сохранённому токену
  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    setLoading(true)
    try {
      const res = await getMe()
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Вызывается после успешного логина/верификации
  async function setTokensAndLoad(access: string, refresh: string) {
    saveTokens(access, refresh)
    await loadUser()
  }

  function logout() {
    clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, setTokensAndLoad, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

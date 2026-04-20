'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const router = useRouter()
  const { setTokensAndLoad, user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.push('/')
  }, [user, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await login(email, password)
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Неверный email или пароль.')
        return
      }
      await setTokensAndLoad(data.access, data.refresh)
      router.push('/')
    } catch {
      setError('Сервер недоступен.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="text-center mb-8">
        <h1
          className="font-heading text-2xl mb-2"
          style={{ color: 'var(--gold)', letterSpacing: '0.08em' }}
        >
          Вход в гильдию
        </h1>
        <div className="gold-divider" />
      </div>

      <div className="auth-panel">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-sm mb-2 font-heading"
              style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="field-input"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label
              className="block text-sm mb-2 font-heading"
              style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}
            >
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="field-input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-gold w-full py-3 mt-2">
            {submitting ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--text-faint)' }}>
        Нет аккаунта?{' '}
        <Link
          href="/auth/register"
          className="transition-colors duration-200 hover:text-guild-gold"
          style={{ color: 'var(--text-muted)' }}
        >
          Зарегистрироваться
        </Link>
      </p>
    </div>
  )
}

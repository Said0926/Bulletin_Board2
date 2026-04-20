'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user) router.push('/')
  }, [user, authLoading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await register(email, password)
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || data.email?.[0] || 'Ошибка регистрации.')
        return
      }
      sessionStorage.setItem('pending_email', email)
      router.push('/auth/verify')
    } catch {
      setError('Сервер недоступен.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return null

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="text-center mb-8">
        <h1
          className="font-heading text-2xl mb-2"
          style={{ color: 'var(--gold)', letterSpacing: '0.08em' }}
        >
          Вступить в гильдию
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
              Пароль{' '}
              <span style={{ color: 'var(--text-faint)', fontFamily: 'inherit', fontSize: '12px' }}>
                (минимум 8 символов)
              </span>
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className="field-input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-gold w-full py-3 mt-2">
            {loading ? 'Отправка...' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--text-faint)' }}>
        Уже есть аккаунт?{' '}
        <Link
          href="/auth/login"
          className="transition-colors duration-200 hover:text-guild-gold"
          style={{ color: 'var(--text-muted)' }}
        >
          Войти
        </Link>
      </p>
    </div>
  )
}

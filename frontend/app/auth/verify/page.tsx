'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { verifyEmail } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

export default function VerifyPage() {
  const router = useRouter()
  const { setTokensAndLoad } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem('pending_email')
    if (saved) setEmail(saved)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await verifyEmail(email, code)
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || data.non_field_errors?.[0] || 'Неверный код.')
        return
      }
      sessionStorage.removeItem('pending_email')
      await setTokensAndLoad(data.access, data.refresh)
      router.push('/')
    } catch {
      setError('Сервер недоступен.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="text-center mb-8">
        <h1
          className="font-heading text-2xl mb-2"
          style={{ color: 'var(--gold)', letterSpacing: '0.08em' }}
        >
          Подтверждение email
        </h1>
        <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
          Введите 6-значный код, отправленный на{' '}
          <span style={{ color: 'var(--text)' }}>{email || 'ваш email'}</span>
        </p>
        <div className="gold-divider mt-4" />
      </div>

      <div className="auth-panel">
        <form onSubmit={handleSubmit} className="space-y-5">
          {!email && (
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
          )}

          <div>
            <label
              className="block text-sm mb-2 font-heading"
              style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}
            >
              Код подтверждения
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              required
              className="field-input text-center text-2xl tracking-[0.4em]"
              style={{ fontFamily: 'var(--font-cinzel, Georgia, serif)' }}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn-gold w-full py-3 mt-2"
          >
            {loading ? 'Проверка...' : 'Подтвердить'}
          </button>
        </form>
      </div>
    </div>
  )
}

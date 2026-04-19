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
    // Берём email, сохранённый со страницы регистрации
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
      <h1 className="text-2xl font-bold mb-2 text-center">Подтверждение email</h1>
      <p className="text-sm text-gray-600 text-center mb-6">
        Введите 6-значный код, отправленный на{' '}
        <span className="font-medium">{email || 'ваш email'}</span>
      </p>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 shadow-sm">
        {!email && (
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Код подтверждения</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? 'Проверка...' : 'Подтвердить'}
        </button>
      </form>
    </div>
  )
}

'use client'

// Приватная страница: отклики на мои объявления.
// Фильтр по объявлению, принятие отклика, удаление.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMyResponses, acceptResponse, deleteResponse, type AdResponse } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

export default function MyResponsesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [responses, setResponses] = useState<AdResponse[]>([])
  const [filterAdId, setFilterAdId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
  }, [user, authLoading, router])

  // Загружаем отклики (с фильтром или без)
  useEffect(() => {
    if (!user) return
    setLoading(true)
    getMyResponses(filterAdId ? Number(filterAdId) : undefined)
      .then(res => (res.ok ? res.json() : []))
      .then(setResponses)
      .catch(() => setResponses([]))
      .finally(() => setLoading(false))
  }, [user, filterAdId])

  async function handleAccept(id: number) {
    const res = await acceptResponse(id)
    if (res.ok) {
      const updated = await res.json()
      setResponses(prev => prev.map(r => r.id === id ? updated : r))
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить отклик?')) return
    const res = await deleteResponse(id)
    if (res.ok) {
      setResponses(prev => prev.filter(r => r.id !== id))
    }
  }

  if (authLoading) return <p className="text-gray-500">Загрузка...</p>
  if (!user) return null

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Отклики на мои объявления</h1>

      {/* Фильтр по объявлению — строим из уже загруженных откликов */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-medium">Объявление:</label>
        <select
          value={filterAdId}
          onChange={e => setFilterAdId(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">Все объявления</option>
          {Array.from(new Map(responses.map(r => [r.ad, r.ad_title])).entries()).map(([id, title]) => (
            <option key={id} value={id}>{title}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-500">Загрузка...</p>}

      {!loading && responses.length === 0 && (
        <p className="text-gray-500">Откликов пока нет.</p>
      )}

      <div className="space-y-4">
        {responses.map(r => (
          <div
            key={r.id}
            className={`bg-white border rounded-lg p-4 ${
              r.status === 'accepted'
                ? 'border-green-300 bg-green-50'
                : r.status === 'rejected'
                ? 'border-gray-200 opacity-60'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-medium">{r.author_email}</span>
                <span className="text-xs text-gray-400 ml-2">
                  на «{r.ad_title}»
                </span>
              </div>
              <div className="flex items-center gap-2">
                {r.status === 'accepted' ? (
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded">✓ Принят</span>
                ) : r.status === 'rejected' ? (
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Отклонён</span>
                ) : (
                  <button
                    onClick={() => handleAccept(r.id)}
                    className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 rounded transition"
                  >
                    Принять
                  </button>
                )}
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition"
                >
                  Удалить
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.text}</p>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(r.created_at).toLocaleString('ru-RU')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

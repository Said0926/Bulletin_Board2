'use client'

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

  if (authLoading) return <p style={{ color: 'var(--text-faint)' }}>Загрузка...</p>
  if (!user) return null

  return (
    <div>
      {/* Заголовок */}
      <div className="mb-7">
        <h1
          className="font-heading text-2xl mb-2"
          style={{ color: 'var(--gold)', letterSpacing: '0.06em' }}
        >
          Отклики на мои объявления
        </h1>
        <div className="gold-divider" />
      </div>

      {/* Фильтр по объявлению */}
      <div className="mb-6 flex items-center gap-3">
        <label
          className="text-sm font-heading shrink-0"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}
        >
          Объявление:
        </label>
        <select
          value={filterAdId}
          onChange={e => setFilterAdId(e.target.value)}
          className="field-select"
          style={{ maxWidth: '320px' }}
        >
          <option value="">Все объявления</option>
          {Array.from(new Map(responses.map(r => [r.ad, r.ad_title])).entries()).map(([id, title]) => (
            <option key={id} value={id}>{title}</option>
          ))}
        </select>
      </div>

      {loading && <p style={{ color: 'var(--text-faint)' }}>Загрузка...</p>}

      {!loading && responses.length === 0 && (
        <p style={{ color: 'var(--text-faint)' }}>Откликов пока нет.</p>
      )}

      <div className="space-y-4">
        {responses.map(r => (
          <div
            key={r.id}
            className="guild-card rounded-lg p-5"
            style={{
              opacity: r.status === 'rejected' ? 0.5 : 1,
              borderLeft: r.status === 'accepted'
                ? '3px solid var(--success)'
                : r.status === 'rejected'
                ? '3px solid var(--border)'
                : '3px solid var(--gold-dim)',
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {r.author_email}
                </span>
                <span className="text-xs ml-2" style={{ color: 'var(--text-faint)' }}>
                  на «{r.ad_title}»
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {r.status === 'accepted' ? (
                  <span
                    className="status-badge"
                    style={{ background: 'rgba(77,175,111,0.15)', color: 'var(--success)', border: '1px solid rgba(77,175,111,0.3)' }}
                  >
                    ✓ Принят
                  </span>
                ) : r.status === 'rejected' ? (
                  <span
                    className="status-badge"
                    style={{ background: 'var(--surface-raised)', color: 'var(--text-faint)', border: '1px solid var(--border-subtle)' }}
                  >
                    Отклонён
                  </span>
                ) : (
                  <button
                    onClick={() => handleAccept(r.id)}
                    className="btn-gold px-3 py-1 text-xs"
                  >
                    Принять
                  </button>
                )}
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-sm transition-colors duration-200 hover:text-guild-danger"
                  style={{ color: 'var(--text-faint)' }}
                >
                  Удалить
                </button>
              </div>
            </div>

            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
              {r.text}
            </p>
            <p className="text-xs mt-3" style={{ color: 'var(--text-faint)' }}>
              {new Date(r.created_at).toLocaleString('ru-RU')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

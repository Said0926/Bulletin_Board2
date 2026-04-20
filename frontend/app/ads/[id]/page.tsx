'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAd, createResponse, deleteAd, type Ad } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

const CATEGORY_BORDER: Record<string, string> = {
  TANK: '#2563eb', HEALER: '#16a34a', DPS: '#dc2626',
  TRADER: '#ca8a04', GUILDMASTER: '#9333ea', QUESTGIVER: '#ea580c',
  BLACKSMITH: '#78716c', TANNER: '#b45309', ALCHEMIST: '#0d9488',
  SPELLMASTER: '#7c3aed',
}

export default function AdDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { user } = useAuth()
  const [ad, setAd] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)
  const [responseText, setResponseText] = useState('')
  const [responseError, setResponseError] = useState('')
  const [responseSent, setResponseSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getAd(Number(id))
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(setAd)
      .catch(() => router.push('/'))
      .finally(() => setLoading(false))
  }, [id, router])

  async function handleDelete() {
    if (!confirm('Удалить объявление?')) return
    await deleteAd(Number(id))
    router.push('/')
  }

  async function handleResponse(e: React.FormEvent) {
    e.preventDefault()
    setResponseError('')
    setSubmitting(true)
    try {
      const res = await createResponse(Number(id), responseText)
      const data = await res.json()
      if (!res.ok) {
        setResponseError(data.detail || 'Ошибка при отправке.')
        return
      }
      setResponseText('')
      setResponseSent(true)
    } catch {
      setResponseError('Сервер недоступен.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--text-faint)' }}>Загрузка...</p>
  if (!ad) return null

  const isAuthor = user?.id === ad.author_id
  const borderColor = CATEGORY_BORDER[ad.category] ?? 'var(--gold-dim)'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Шапка */}
      <div className="flex items-start justify-between mb-3 gap-4">
        <span
          className="status-badge text-xs px-2.5 py-1 rounded"
          style={{
            borderLeft: `3px solid ${borderColor}`,
            background: 'var(--surface)',
            color: 'var(--text-muted)',
            border: `1px solid var(--border-subtle)`,
            borderLeftColor: borderColor,
            borderLeftWidth: '3px',
          }}
        >
          {ad.category_display}
        </span>
        <span className="text-sm shrink-0" style={{ color: 'var(--text-faint)' }}>
          {new Date(ad.created_at).toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </span>
      </div>

      <h1
        className="font-heading text-2xl mb-1 leading-snug"
        style={{ color: 'var(--text)', letterSpacing: '0.03em' }}
      >
        {ad.title}
      </h1>
      <p className="text-sm mb-5" style={{ color: 'var(--text-faint)' }}>
        Автор: {ad.author_email}
      </p>

      {/* Кнопки автора */}
      {isAuthor && (
        <div className="flex gap-2 mb-5">
          <Link href={`/ads/${ad.id}/edit`} className="btn-ghost px-4 py-1.5 text-sm">
            Редактировать
          </Link>
          <button onClick={handleDelete} className="btn-danger-sm">
            Удалить
          </button>
        </div>
      )}

      <div className="gold-divider mb-5" />

      {/* Контент объявления */}
      <div
        className="ad-content guild-card p-6 mb-8"
        dangerouslySetInnerHTML={{ __html: ad.content }}
      />

      {/* Форма отклика */}
      {user && !isAuthor && (
        <div className="guild-card p-6">
          <h2
            className="font-heading text-base mb-4"
            style={{ color: 'var(--gold)', letterSpacing: '0.05em' }}
          >
            Оставить отклик
          </h2>

          {responseSent ? (
            <p className="text-sm" style={{ color: 'var(--success)' }}>
              ✓ Отклик отправлен! Автор получит уведомление на email.
            </p>
          ) : (
            <form onSubmit={handleResponse} className="space-y-4">
              <textarea
                value={responseText}
                onChange={e => setResponseText(e.target.value)}
                required
                rows={4}
                placeholder="Напишите ваш отклик..."
                className="field-input resize-y"
                style={{ minHeight: '100px' }}
              />
              {responseError && (
                <p className="text-sm" style={{ color: 'var(--danger)' }}>{responseError}</p>
              )}
              <button type="submit" disabled={submitting} className="btn-gold px-6 py-2.5">
                {submitting ? 'Отправка...' : 'Отправить отклик'}
              </button>
            </form>
          )}
        </div>
      )}

      {!user && (
        <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
          <Link
            href="/auth/login"
            className="transition-colors duration-200 hover:text-guild-gold"
            style={{ color: 'var(--text-muted)' }}
          >
            Войдите
          </Link>
          , чтобы оставить отклик.
        </p>
      )}
    </div>
  )
}

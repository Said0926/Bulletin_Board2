'use client'

// Детальная страница объявления.
// Показывает контент, кнопки редактирования/удаления для автора,
// форму отклика для других авторизованных пользователей.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAd, createResponse, deleteAd, type Ad } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

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

  if (loading) return <p className="text-gray-500">Загрузка...</p>
  if (!ad) return null

  const isAuthor = user?.id === ad.author_id

  return (
    <div className="max-w-2xl mx-auto">
      {/* Шапка */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
          {ad.category_display}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(ad.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      <h1 className="text-2xl font-bold mb-1">{ad.title}</h1>
      <p className="text-sm text-gray-500 mb-4">Автор: {ad.author_email}</p>

      {/* Кнопки автора */}
      {isAuthor && (
        <div className="flex gap-2 mb-4">
          <Link
            href={`/ads/${ad.id}/edit`}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded transition"
          >
            Редактировать
          </Link>
          <button
            onClick={handleDelete}
            className="text-sm bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded transition"
          >
            Удалить
          </button>
        </div>
      )}

      {/* HTML-контент от TipTap */}
      <div
        className="prose prose-sm max-w-none bg-white border border-gray-200 rounded-lg p-6 mb-8"
        dangerouslySetInnerHTML={{ __html: ad.content }}
      />

      {/* Форма отклика */}
      {user && !isAuthor && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold mb-3">Оставить отклик</h2>
          {responseSent ? (
            <p className="text-green-600 text-sm">
              ✓ Отклик отправлен! Автор получит уведомление на email.
            </p>
          ) : (
            <form onSubmit={handleResponse} className="space-y-3">
              <textarea
                value={responseText}
                onChange={e => setResponseText(e.target.value)}
                required
                rows={4}
                placeholder="Напишите ваш отклик..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {responseError && <p className="text-red-500 text-sm">{responseError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {submitting ? 'Отправка...' : 'Отправить отклик'}
              </button>
            </form>
          )}
        </div>
      )}

      {!user && (
        <p className="text-sm text-gray-500">
          <Link href="/auth/login" className="text-indigo-600 hover:underline">Войдите</Link>, чтобы оставить отклик.
        </p>
      )}
    </div>
  )
}

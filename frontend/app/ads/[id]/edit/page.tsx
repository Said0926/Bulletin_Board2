'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getAd, updateAd, getCategories, type Ad, type Category } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

const TipTapEditor = dynamic(() => import('@/components/TipTapEditor'), { ssr: false })

export default function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [ad, setAd] = useState<Ad | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
    getAd(Number(id))
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then((data: Ad) => {
        setAd(data)
        setTitle(data.title)
        setContent(data.content)
        setCategory(data.category)
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false))
  }, [id, router])

  useEffect(() => {
    if (!authLoading && !loading && ad && user?.id !== ad.author_id) {
      router.push(`/ads/${id}`)
    }
  }, [authLoading, loading, ad, user, id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await updateAd(Number(id), { title, content, category })
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Ошибка сохранения.')
        return
      }
      router.push(`/ads/${id}`)
    } catch {
      setError('Сервер недоступен.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || authLoading) return <p style={{ color: 'var(--text-faint)' }}>Загрузка...</p>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-7">
        <h1
          className="font-heading text-2xl mb-2"
          style={{ color: 'var(--gold)', letterSpacing: '0.06em' }}
        >
          Редактировать объявление
        </h1>
        <div className="gold-divider" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            className="block text-sm mb-2 font-heading"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}
          >
            Заголовок
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            maxLength={255}
            className="field-input"
          />
        </div>

        <div>
          <label
            className="block text-sm mb-2 font-heading"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}
          >
            Категория
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
            className="field-select"
          >
            {categories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="block text-sm mb-2 font-heading"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}
          >
            Содержание
          </label>
          {/* Ключ нужен чтобы TipTap переинициализировался когда content загружен */}
          {content !== '' && (
            <TipTapEditor key={content.slice(0, 20)} content={content} onChange={setContent} />
          )}
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="btn-gold px-8 py-2.5">
            {submitting ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/ads/${id}`)}
            className="btn-ghost px-8 py-2.5"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

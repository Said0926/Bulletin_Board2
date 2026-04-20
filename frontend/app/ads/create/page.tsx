'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createAd, getCategories, type Category } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

const TipTapEditor = dynamic(() => import('@/components/TipTapEditor'), { ssr: false })

export default function CreateAdPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!content || content === '<p></p>') {
      setError('Заполните содержание объявления.')
      return
    }
    setSubmitting(true)
    try {
      const res = await createAd({ title, content, category })
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || Object.values(data).flat().join(' '))
        return
      }
      const ad = await res.json()
      router.push(`/ads/${ad.id}`)
    } catch {
      setError('Сервер недоступен.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--text-faint)' }}>Загрузка...</p>
  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-7">
        <h1
          className="font-heading text-2xl mb-2"
          style={{ color: 'var(--gold)', letterSpacing: '0.06em' }}
        >
          Новое объявление
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
            placeholder="Кратко опишите ваш запрос..."
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
            <option value="">— Выберите роль —</option>
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
          <TipTapEditor content={content} onChange={setContent} />
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
        )}

        <div className="pt-2">
          <button type="submit" disabled={submitting} className="btn-gold px-8 py-2.5">
            {submitting ? 'Сохранение...' : 'Опубликовать'}
          </button>
        </div>
      </form>
    </div>
  )
}

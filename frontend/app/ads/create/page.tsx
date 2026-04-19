'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createAd, getCategories, type Category } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

// TipTap использует browser API, поэтому только client-side
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

  // Редирект неавторизованных пользователей
  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!content || content === '<p></p>') {
      setError('Заполни��е содержание объявления.')
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

  if (loading) return <p className="text-gray-500">Загрузка...</p>
  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Новое объявление</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Заголовок</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            maxLength={255}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Категория</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">— Выберите категорию —</option>
            {categories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Содержание</label>
          <TipTapEditor content={content} onChange={setContent} />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {submitting ? 'Сохранение...' : 'Опубликовать'}
        </button>
      </form>
    </div>
  )
}

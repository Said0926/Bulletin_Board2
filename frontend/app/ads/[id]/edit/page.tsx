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

  // Только автор может редактировать
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

  if (loading || authLoading) return <p className="text-gray-500">Загрузка...</p>

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Редактировать объявление</h1>
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
            {categories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Содержание</label>
          {/* Ключ нужен чтобы TipTap переинициализировался когда content загружен */}
          {content !== '' && <TipTapEditor key={content.slice(0, 20)} content={content} onChange={setContent} />}
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {submitting ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/ads/${id}`)}
            className="px-6 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

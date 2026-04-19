'use client'

// Главная страница — список объявлений с фильтром по категории

import { useEffect, useState } from 'react'
import { getAds, getCategories, type Ad, type Category, type PaginatedResponse } from '@/lib/api'
import AdCard from '@/components/AdCard'

export default function HomePage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [nextPage, setNextPage] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    getAds(activeCategory || undefined)
      .then(res => {
        if (!res.ok) throw new Error('Ошибка загрузки')
        return res.json() as Promise<PaginatedResponse<Ad>>
      })
      .then(data => {
        setAds(data.results)
        setNextPage(data.next)
      })
      .catch(() => setError('Не удалось загрузить объявления.'))
      .finally(() => setLoading(false))
  }, [activeCategory])

  // Загрузить следующую страницу объявлений
  async function loadMore() {
    if (!nextPage) return
    setLoadingMore(true)
    try {
      const res = await fetch(nextPage)
      if (!res.ok) throw new Error()
      const data: PaginatedResponse<Ad> = await res.json()
      setAds(prev => [...prev, ...data.results])
      setNextPage(data.next)
    } catch {
      setError('Не удалось загрузить следующую страницу.')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Объявления</h1>

      {/* Фильтр по категории */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCategory('')}
          className={`px-3 py-1.5 rounded-full text-sm border transition ${
            activeCategory === ''
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'border-gray-300 hover:bg-gray-100'
          }`}
        >
          Все
        </button>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              activeCategory === cat.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Загрузка...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && ads.length === 0 && (
        <p className="text-gray-500">Объявлений пока нет.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {ads.map(ad => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>

      {nextPage && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-5 py-2 rounded border border-gray-300 text-sm hover:bg-gray-100 transition disabled:opacity-50"
          >
            {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
          </button>
        </div>
      )}
    </div>
  )
}

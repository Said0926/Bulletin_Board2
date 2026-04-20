'use client'

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
      {/* Заголовок страницы */}
      <div className="mb-8">
        <h1
          className="font-heading text-3xl mb-1"
          style={{ color: 'var(--gold)', letterSpacing: '0.06em' }}
        >
          Доска объявлений
        </h1>
        <div className="gold-divider mt-3" />
      </div>

      {/* Фильтр по категориям */}
      <div className="flex flex-wrap gap-2 mb-7">
        <button
          onClick={() => setActiveCategory('')}
          className="px-3 py-1.5 rounded-full text-sm transition-all duration-200"
          style={
            activeCategory === ''
              ? {
                  background: 'var(--gold-dim)',
                  color: 'var(--gold-bright)',
                  border: '1px solid var(--gold)',
                  fontFamily: 'var(--font-cinzel, Georgia, serif)',
                  letterSpacing: '0.04em',
                }
              : {
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }
          }
        >
          Все
        </button>

        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className="px-3 py-1.5 rounded-full text-sm transition-all duration-200"
            style={
              activeCategory === cat.value
                ? {
                    background: 'var(--gold-dim)',
                    color: 'var(--gold-bright)',
                    border: '1px solid var(--gold)',
                    fontFamily: 'var(--font-cinzel, Georgia, serif)',
                    letterSpacing: '0.04em',
                  }
                : {
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }
            }
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading && (
        <p style={{ color: 'var(--text-faint)' }}>Загрузка...</p>
      )}
      {error && (
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      )}

      {!loading && !error && ads.length === 0 && (
        <p style={{ color: 'var(--text-faint)' }}>Объявлений пока нет.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {ads.map(ad => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>

      {nextPage && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn-ghost px-8 py-2.5 text-sm disabled:opacity-50"
          >
            {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
          </button>
        </div>
      )}
    </div>
  )
}

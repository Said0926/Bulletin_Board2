import Link from 'next/link'
import type { Ad } from '@/lib/api'

type Props = { ad: Ad }

export default function AdCard({ ad }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
          {ad.category_display}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(ad.created_at).toLocaleDateString('ru-RU')}
        </span>
      </div>
      <Link href={`/ads/${ad.id}`}>
        <h2 className="text-lg font-semibold text-gray-800 hover:text-indigo-600 transition line-clamp-2">
          {ad.title}
        </h2>
      </Link>
      <p className="text-sm text-gray-500 mt-1">{ad.author_email}</p>
    </div>
  )
}

import Link from 'next/link'
import type { Ad } from '@/lib/api'

type Props = { ad: Ad }

// Цвета бейджа и левой полосы карточки — уникальные для каждой роли
const CATEGORY_STYLES: Record<string, { badge: string; borderColor: string }> = {
  TANK:        { badge: 'bg-blue-950 text-blue-300 border border-blue-800',        borderColor: '#2563eb' },
  HEALER:      { badge: 'bg-green-950 text-green-300 border border-green-800',     borderColor: '#16a34a' },
  DPS:         { badge: 'bg-red-950 text-red-300 border border-red-800',           borderColor: '#dc2626' },
  TRADER:      { badge: 'bg-yellow-950 text-yellow-300 border border-yellow-800',  borderColor: '#ca8a04' },
  GUILDMASTER: { badge: 'bg-purple-950 text-purple-300 border border-purple-800',  borderColor: '#9333ea' },
  QUESTGIVER:  { badge: 'bg-orange-950 text-orange-300 border border-orange-800',  borderColor: '#ea580c' },
  BLACKSMITH:  { badge: 'bg-stone-900 text-stone-300 border border-stone-700',     borderColor: '#78716c' },
  TANNER:      { badge: 'bg-amber-950 text-amber-400 border border-amber-700',     borderColor: '#b45309' },
  ALCHEMIST:   { badge: 'bg-teal-950 text-teal-300 border border-teal-700',        borderColor: '#0d9488' },
  SPELLMASTER: { badge: 'bg-violet-950 text-violet-300 border border-violet-800',  borderColor: '#7c3aed' },
}

const DEFAULT_STYLE = { badge: 'bg-stone-900 text-stone-300 border border-stone-700', borderColor: 'var(--gold-dim)' }

export default function AdCard({ ad }: Props) {
  const style = CATEGORY_STYLES[ad.category] ?? DEFAULT_STYLE

  return (
    <div
      className="guild-card guild-card-hover rounded-lg p-5 flex flex-col gap-3"
      style={{ borderLeft: `3px solid ${style.borderColor}` }}
    >
      <div className="flex items-center justify-between">
        <span className={`status-badge text-xs ${style.badge}`}>
          {ad.category_display}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
          {new Date(ad.created_at).toLocaleDateString('ru-RU')}
        </span>
      </div>

      <Link href={`/ads/${ad.id}`}>
        <h2
          className="font-heading text-base leading-snug transition-colors duration-200 hover:text-guild-gold line-clamp-2"
          style={{ letterSpacing: '0.02em', color: 'var(--text)' }}
        >
          {ad.title}
        </h2>
      </Link>

      <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
        {ad.author_email}
      </p>
    </div>
  )
}

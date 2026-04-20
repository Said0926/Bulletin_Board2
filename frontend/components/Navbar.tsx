'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push('/')
  }

  return (
    <header>
      <nav style={{ background: '#0d0b09', borderBottom: '1px solid #3d3120' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-display tracking-widest transition-colors duration-200 hover:text-guild-gold-bright"
            style={{
              fontFamily: 'var(--font-cinzel-decorative, Georgia, serif)',
              color: 'var(--gold)',
              fontSize: '1.2rem',
              letterSpacing: '0.1em',
            }}
          >
            ⚔ BulletinBoard
          </Link>

          <div className="flex items-center gap-5">
            {loading ? null : user ? (
              <>
                <span
                  className="text-sm hidden sm:block truncate max-w-[180px]"
                  style={{ color: 'var(--text-faint)', fontSize: '13px' }}
                >
                  {user.email}
                </span>

                <Link href="/ads/create" className="btn-gold px-4 py-1.5 text-sm">
                  + Объявление
                </Link>

                <Link
                  href="/profile/responses"
                  className="text-sm text-guild-text-muted hover:text-guild-gold transition-colors duration-200"
                >
                  Мои отклики
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-sm text-guild-text-faint hover:text-guild-danger transition-colors duration-200"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-guild-text-muted hover:text-guild-gold transition-colors duration-200"
                >
                  Войти
                </Link>
                <Link href="/auth/register" className="btn-gold px-4 py-1.5 text-sm">
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <div className="gold-divider" />
    </header>
  )
}

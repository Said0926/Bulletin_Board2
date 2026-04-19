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
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600 hover:text-indigo-700">
          ⚔️ BulletinBoard
        </Link>

        <div className="flex items-center gap-4">
          {loading ? null : user ? (
            <>
              <span className="text-sm text-gray-600">{user.email}</span>
              <Link
                href="/ads/create"
                className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded hover:bg-indigo-700 transition"
              >
                + Объявление
              </Link>
              <Link
                href="/profile/responses"
                className="text-sm text-gray-600 hover:text-indigo-600 transition"
              >
                Мои отклики
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-500 transition"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-gray-600 hover:text-indigo-600 transition">
                Войти
              </Link>
              <Link
                href="/auth/register"
                className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded hover:bg-indigo-700 transition"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

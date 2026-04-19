// API-клиент: обёртки вокруг fetch() для работы с Django backend

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Ключи хранилища токенов
const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_KEY)
}

export function saveTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

// Авто-рефреш токена при 401 ответе
async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem(REFRESH_KEY)
  if (!refresh) return null

  const res = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })

  if (!res.ok) {
    clearTokens()
    return null
  }

  const data = await res.json()
  localStorage.setItem(ACCESS_KEY, data.access)
  return data.access
}

// Базовая функция запроса с авто-рефрешем
async function request(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<Response> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // JSON-контент по умолчанию (если не FormData)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  // Пробуем рефрешнуть токен при 401
  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return request(path, options, false)
    }
  }

  return res
}

// ───────────────────────── Auth ─────────────────────────

export async function register(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return res
}

export async function verifyEmail(email: string, code: string) {
  const res = await fetch(`${BASE_URL}/api/auth/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })
  return res
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return res
}

export async function getMe() {
  return request('/api/auth/me/')
}

// ───────────────────────── Ads ─────────────────────────

export type Ad = {
  id: number
  title: string
  content: string
  category: string
  category_display: string
  author_id: number
  author_email: string
  created_at: string
  updated_at: string
}

export type Category = { value: string; label: string }

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE_URL}/api/categories/`)
  return res.json()
}

export async function getAds(category?: string) {
  const url = category ? `/api/ads/?category=${category}` : '/api/ads/'
  return request(url)
}

export async function getAd(id: number) {
  return request(`/api/ads/${id}/`)
}

export async function createAd(data: { title: string; content: string; category: string }) {
  return request('/api/ads/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAd(id: number, data: { title: string; content: string; category: string }) {
  return request(`/api/ads/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteAd(id: number) {
  return request(`/api/ads/${id}/`, { method: 'DELETE' })
}

// ───────────────────────── Responses ─────────────────────────

export type AdResponse = {
  id: number
  ad: number
  ad_title: string
  author_id: number
  author_email: string
  text: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

// Формат ответа от пагинированных DRF-эндпоинтов
export type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function createResponse(adId: number, text: string) {
  return request(`/api/ads/${adId}/responses/`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}

export async function getMyResponses(adId?: number) {
  const url = adId ? `/api/my/responses/?ad=${adId}` : '/api/my/responses/'
  return request(url)
}

export async function acceptResponse(id: number) {
  return request(`/api/responses/${id}/accept/`, { method: 'POST' })
}

export async function deleteResponse(id: number) {
  return request(`/api/responses/${id}/`, { method: 'DELETE' })
}

// ───────────────────────── Upload ─────────────────────────

export async function uploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData()
  form.append('image', file)
  const res = await request('/api/upload/image/', { method: 'POST', body: form })
  return res.json()
}

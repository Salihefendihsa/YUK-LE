import axios, { AxiosError } from 'axios'
import { translateUserFacingError } from '../utils/apiErrors'

const BASE_URL = 'http://localhost:5151/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

type ApiErrorPayload = {
  message?: string
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

function collectValidationErrors(payload?: ApiErrorPayload) {
  if (!payload?.errors) return []
  return Object.entries(payload.errors)
    .flatMap(([, messages]) => messages)
    .filter(Boolean)
}

function getTurkishErrorMessage(error: AxiosError<ApiErrorPayload>) {
  const payload = error.response?.data

  if (!error.response) {
    return 'Sunucuya bağlanılamadı. Lütfen backend servisinin açık olduğunu kontrol edin.'
  }

  const validationErrors = collectValidationErrors(payload)
  if (validationErrors.length > 0) {
    return validationErrors.map((line) => translateUserFacingError(line)).join('\n')
  }

  const serverMessage = payload?.message ?? payload?.detail ?? payload?.title
  if (serverMessage) return translateUserFacingError(serverMessage)

  if (error.response.status === 401) return 'Kullanıcı adı veya şifre hatalı.'
  if (error.response.status === 403) return 'Bu işlem için yetkiniz yok.'
  if (error.response.status === 404) return 'İstenen kaynak bulunamadı.'
  if (error.response.status === 429) return 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.'
  if (error.response.status >= 500) return 'Sunucuda bir hata oluştu. Lütfen tekrar deneyin.'

  return 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.'
}

// ── Request interceptor: inject JWT ───────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('yükle-auth')
  if (raw) {
    try {
      const store = JSON.parse(raw)
      const token = store?.state?.token
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {
      // corrupted storage — ignore
    }
  }
  return config
})

// ── Response interceptor: 401 → refresh → retry ───────────────────────
let isRefreshing = false
let pendingQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  pendingQueue = []
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as typeof err.config & { _retry?: boolean }
    if (err.response?.status !== 401 || original._retry) {
      const uiError = err as AxiosError<ApiErrorPayload> & { uiMessage?: string; uiDetails?: string[] }
      uiError.uiMessage = getTurkishErrorMessage(err as AxiosError<ApiErrorPayload>)
      uiError.uiDetails = collectValidationErrors((err as AxiosError<ApiErrorPayload>).response?.data)
      return Promise.reject(uiError)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers!.Authorization = `Bearer ${token}`
        return apiClient(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const raw = localStorage.getItem('yükle-auth')
      if (!raw) throw new Error('No auth data')
      const store = JSON.parse(raw)
      const { token, refreshToken } = store?.state ?? {}
      if (!token || !refreshToken) throw new Error('Missing tokens')

      const { data } = await axios.post(`${BASE_URL}/Auth/refresh-token`, { accessToken: token, refreshToken })
      const newToken: string = data.token

      // Update store
      store.state.token = newToken
      store.state.refreshToken = data.refreshToken
      localStorage.setItem('yükle-auth', JSON.stringify(store))

      processQueue(null, newToken)
      original.headers!.Authorization = `Bearer ${newToken}`
      return apiClient(original)
    } catch (refreshErr) {
      processQueue(refreshErr, null)
      localStorage.removeItem('yükle-auth')
      window.location.href = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login'
      const refreshAxiosErr = refreshErr as AxiosError<ApiErrorPayload>
      ;(refreshAxiosErr as AxiosError<ApiErrorPayload> & { uiMessage?: string; uiDetails?: string[] }).uiMessage =
        getTurkishErrorMessage(refreshAxiosErr)
      ;(refreshAxiosErr as AxiosError<ApiErrorPayload> & { uiMessage?: string; uiDetails?: string[] }).uiDetails =
        collectValidationErrors(refreshAxiosErr.response?.data)
      return Promise.reject(refreshAxiosErr)
    } finally {
      isRefreshing = false
    }
  }
)

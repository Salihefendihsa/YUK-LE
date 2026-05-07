import axios, { AxiosError } from 'axios'

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
    return 'Sunucuya baglanilamadi. Lutfen backend servisinin acik oldugunu kontrol edin.'
  }

  const validationErrors = collectValidationErrors(payload)
  if (validationErrors.length > 0) {
    return validationErrors.join('\n')
  }

  if (payload?.message) return payload.message
  if (payload?.detail) return payload.detail
  if (payload?.title) return payload.title

  if (error.response.status === 401) return 'Kullanici adi veya sifre hatali.'
  if (error.response.status === 403) return 'Bu islem icin yetkiniz yok.'
  if (error.response.status === 404) return 'Istenen kaynak bulunamadi.'
  if (error.response.status === 429) return 'Cok fazla istek gonderdiniz. Lutfen biraz bekleyin.'
  if (error.response.status >= 500) return 'Sunucuda bir hata olustu. Lutfen tekrar deneyin.'

  return 'Islem sirasinda bir hata olustu. Lutfen tekrar deneyin.'
}

// ── Request interceptor: inject JWT ───────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('yukle-auth')
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
      const raw = localStorage.getItem('yukle-auth')
      if (!raw) throw new Error('No auth data')
      const store = JSON.parse(raw)
      const { token, refreshToken } = store?.state ?? {}
      if (!token || !refreshToken) throw new Error('Missing tokens')

      const { data } = await axios.post(`${BASE_URL}/Auth/refresh-token`, { accessToken: token, refreshToken })
      const newToken: string = data.token

      // Update store
      store.state.token = newToken
      store.state.refreshToken = data.refreshToken
      localStorage.setItem('yukle-auth', JSON.stringify(store))

      processQueue(null, newToken)
      original.headers!.Authorization = `Bearer ${newToken}`
      return apiClient(original)
    } catch (refreshErr) {
      processQueue(refreshErr, null)
      localStorage.removeItem('yukle-auth')
      window.location.href = '/login'
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

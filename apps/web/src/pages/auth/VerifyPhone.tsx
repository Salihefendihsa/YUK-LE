import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { login, verifyOtp } from '../../api/auth'
import { useAuthStore } from '../../store/auth.store'
import './VerifyPhone.css'

const OTP_LENGTH = 6

export default function VerifyPhone() {
  const [params] = useSearchParams()
  const phone = params.get('phone') ?? ''
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(60)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    refs.current[0]?.focus()
    const timer = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [])

  function handleChange(i: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...digits]
    next[i] = val.slice(-1)
    setDigits(next)
    if (val && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus()
    if (next.every(Boolean)) submitOtp(next.join(''))
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (text.length === OTP_LENGTH) {
      setDigits(text.split(''))
      submitOtp(text)
    }
  }

  async function submitOtp(code: string) {
    setLoading(true)
    setError('')
    try {
      await verifyOtp({ phone, code })

      const pendingAuthRaw = sessionStorage.getItem('yukle-pending-auth')
      if (pendingAuthRaw) {
        const pendingAuth = JSON.parse(pendingAuthRaw) as {
          phone?: string
          password?: string
        }

        if (pendingAuth.phone && pendingAuth.password) {
          const data = await login({ phone: pendingAuth.phone, password: pendingAuth.password })
          setAuth(data)
          sessionStorage.removeItem('yukle-pending-auth')

          if (data.role === 'Customer') navigate('/customer/dashboard')
          else if (data.role === 'Driver') navigate('/driver/dashboard')
          else navigate('/admin/dashboard')
          return
        }
      }

      navigate('/login?verified=1')
    } catch (err: unknown) {
      const msg = (err as { uiMessage?: string; response?: { data?: { message?: string } } })?.uiMessage
        ?? (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Kod hatalı veya süresi dolmuş.')
      setDigits(Array(OTP_LENGTH).fill(''))
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="verify-page">
      <div className="verify-box">
        <div className="verify-icon">📱</div>
        <h1 className="verify-title">Telefon Doğrulama</h1>
        <p className="verify-subtitle">
          <strong>{phone}</strong> numarasına gönderilen<br />
          6 haneli kodu girin
        </p>

        {error && <div className="error-banner">{error}</div>}

        <div className="otp-inputs" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className={`otp-box ${d ? 'filled' : ''} ${loading ? 'loading' : ''}`}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              aria-label={`Rakam ${i + 1}`}
            />
          ))}
        </div>

        {loading && (
          <div className="verify-loading">
            <span className="spinner" style={{ borderTopColor: 'var(--color-brand)' }} />
            <span>Doğrulanıyor...</span>
          </div>
        )}

        <div className="resend-row">
          {secondsLeft > 0 ? (
            <p className="resend-timer">
              Kodu tekrar gönder: <strong>{secondsLeft}s</strong>
            </p>
          ) : (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSecondsLeft(60)}
            >
              Kodu Tekrar Gönder
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

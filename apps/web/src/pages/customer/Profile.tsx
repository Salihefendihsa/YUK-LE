import { useEffect, useState } from 'react'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/auth.store'
import { PageSkeleton } from '../../components/common/PageStates'
import { digitsOnly, formatPhone, validateEmail, validatePassword, validatePhone, validateTaxNumber } from '../../utils/validators'
import '../shared/Page.css'

export default function CustomerProfilePage() {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [taxNumber, setTaxNumber] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [needsOtp, setNeedsOtp] = useState(false)
  const [status, setStatus] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 250)
    return () => clearTimeout(timer)
  }, [])
  const passwordState = validatePassword(newPassword)
  async function saveTaxNumber() {
    if (!user?.userId) return
    if (!needsOtp) {
      setNeedsOtp(true)
      setStatus('Güvenlik için telefonunuza gönderilen onay kodunu girin.')
      return
    }
    if (!otpCode.trim()) {
      setStatus('Onay kodu gerekli.')
      return
    }
    if (!validateTaxNumber(taxNumber)) {
      setStatus('Vergi numarası 10 haneli olmalıdır')
      return
    }
    if (email && !validateEmail(email)) {
      setStatus('Geçerli bir e-posta adresi giriniz')
      return
    }
    if (phone && !validatePhone(digitsOnly(phone))) {
      setStatus('Telefon numarası 5 ile başlayan 10 haneli olmalıdır')
      return
    }
    if (newPassword && !passwordState.valid) {
      setStatus('Şifre güvenlik koşullarını sağlamıyor.')
      return
    }
    await apiClient.put(`/Users/${user.userId}`, { taxNumberOrTCKN: taxNumber, verificationCode: otpCode })
    setStatus('Vergi numarası güncellendi.')
    setNeedsOtp(false)
    setOtpCode('')
  }
  if (loading) return <PageSkeleton rows={3} variant="card" />
  return (
    <div className="page-wrap">
      <h1 className="page-title">Müşteri Profili</h1>
      <div className="card form-grid">
        <input className="form-input" placeholder="Ad Soyad" />
        <input className="form-input" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="form-input" placeholder="Telefon" value={phone} maxLength={10} onChange={(e) => setPhone(formatPhone(e.target.value))} />
      </div>
      <div className="card form-grid">
        <input className="form-input" placeholder="Şirket Adı" />
        <input className="form-input" placeholder="Vergi Numarası" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
        <input className="form-input" style={{ gridColumn: '1 / -1' }} placeholder="Şirket Adresi" />
        {needsOtp ? <input className="form-input" placeholder="Onay Kodu" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} /> : null}
        <button className="btn btn-primary btn-sm" type="button" onClick={() => void saveTaxNumber()}>Vergi Numarasını Kaydet</button>
        {status ? <p className="muted" style={{ gridColumn: '1 / -1' }}>{status}</p> : null}
      </div>
      <div className="card form-grid">
        <input className="form-input" type="password" placeholder="Mevcut Şifre" />
        <input className="form-input" type="password" placeholder="Yeni Şifre" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <input className="form-input" type="password" placeholder="Yeni Şifre Tekrar" />
        <p className="muted" style={{ gridColumn: '1 / -1' }}>Şifre gücü: {passwordState.strength}</p>
      </div>
      <div className="card" style={{ borderColor: '#7f1d1d' }}>
        <button className="btn btn-danger">Hesabımı Sil</button>
      </div>
    </div>
  )
}

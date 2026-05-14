import { useEffect, useState } from 'react'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/auth.store'
import { PageSkeleton } from '../../components/common/PageStates'
import { validateEmail, validatePassword } from '../../utils/validators'
import '../shared/Page.css'

type ProfileDto = {
  fullName: string
  email: string
  phone: string
  companyName?: string | null
  taxNumber?: string | null
  companyAddress?: string | null
}

export default function CustomerProfilePage() {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [taxNumber, setTaxNumber] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!user?.userId) {
      setLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const { data } = await apiClient.get<ProfileDto>(`/Users/${user.userId}`)
        if (cancelled) return
        setFullName(data.fullName)
        setEmail(data.email)
        setPhone(data.phone)
        setCompanyName(data.companyName ?? '')
        setCompanyAddress(data.companyAddress ?? '')
        setTaxNumber(data.taxNumber ?? '')
      } catch {
        if (!cancelled) setLoadError('Profil yüklenemedi. Lütfen tekrar deneyin.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.userId])

  const passwordState = validatePassword(newPassword)

  async function saveProfile() {
    if (!user?.userId) return
    if (!fullName.trim()) {
      setStatus('Ad soyad zorunludur.')
      return
    }
    if (!validateEmail(email)) {
      setStatus('Geçerli bir e-posta adresi giriniz.')
      return
    }
    setStatus('')
    try {
      await apiClient.put(`/Users/${user.userId}`, {
        fullName: fullName.trim(),
        email: email.trim(),
        companyName: companyName.trim() || undefined,
        companyAddress: companyAddress.trim() || undefined,
      })
      setStatus('Profil kaydedildi.')
    } catch (e: unknown) {
      const msg = (e as { uiMessage?: string })?.uiMessage ?? 'Kayıt başarısız.'
      setStatus(msg)
    }
  }

  async function changePassword() {
    if (!newPassword || newPassword !== newPassword2) {
      setStatus('Yeni şifreler eşleşmiyor.')
      return
    }
    if (!passwordState.valid) {
      setStatus('Şifre güvenlik koşullarını sağlamıyor.')
      return
    }
    if (!currentPassword) {
      setStatus('Mevcut şifrenizi girin.')
      return
    }
    setStatus('')
    try {
      await apiClient.post('/Auth/change-password', {
        currentPassword,
        newPassword,
      })
      setStatus('Şifre güncellendi.')
      setCurrentPassword('')
      setNewPassword('')
      setNewPassword2('')
    } catch (e: unknown) {
      const msg = (e as { uiMessage?: string })?.uiMessage ?? 'Şifre değiştirilemedi.'
      setStatus(msg)
    }
  }

  if (loading) return <PageSkeleton rows={3} variant="card" />
  if (loadError) {
    return (
      <div className="page-wrap">
        <h1 className="page-title">Müşteri Profili</h1>
        <div className="card">
          <p className="muted">{loadError}</p>
          <button className="btn btn-primary btn-sm" type="button" onClick={() => window.location.reload()}>
            Yeniden dene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrap">
      <h1 className="page-title">Müşteri Profili</h1>
      <div className="card form-grid">
        <input className="form-input" placeholder="Ad Soyad" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className="form-input" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="form-input" placeholder="Telefon (maskeli)" value={phone} readOnly />
      </div>
      <div className="card form-grid">
        <input className="form-input" placeholder="Şirket Adı" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        <input className="form-input" placeholder="Vergi Numarası (maskeli)" value={taxNumber} readOnly />
        <input
          className="form-input"
          style={{ gridColumn: '1 / -1' }}
          placeholder="Şirket Adresi"
          value={companyAddress}
          onChange={(e) => setCompanyAddress(e.target.value)}
        />
        <button className="btn btn-primary btn-sm" type="button" onClick={() => void saveProfile()}>
          Kaydet
        </button>
      </div>
      <div className="card form-grid">
        <input className="form-input" type="password" placeholder="Mevcut Şifre" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <input className="form-input" type="password" placeholder="Yeni Şifre" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <input className="form-input" type="password" placeholder="Yeni Şifre Tekrar" value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)} />
        <p className="muted" style={{ gridColumn: '1 / -1' }}>
          Şifre gücü: {passwordState.strength}
        </p>
        <button className="btn btn-primary btn-sm" type="button" onClick={() => void changePassword()}>
          Şifreyi Güncelle
        </button>
      </div>
      {status ? <p className="muted">{status}</p> : null}
      <div className="card" style={{ borderColor: '#7f1d1d' }}>
        <button className="btn btn-danger">Hesabımı Sil</button>
      </div>
    </div>
  )
}

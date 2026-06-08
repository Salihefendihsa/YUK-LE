import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/auth.store'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import { formatIBAN, validateEmail, validateIBAN } from '../../utils/validators'
import '../shared/Page.css'

type ProfileDto = {
  fullName: string
  email: string
  phone: string
  tcIdentityNumber?: string | null
  iban?: string | null
  licenseClass?: string | null
  homeAddress?: string | null
  vehiclePlate?: string | null
  vehicleType?: string | null
  averageRating: number
  totalRatingCount: number
}

export default function DriverProfilePage() {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [iban, setIban] = useState('')
  const [licenseClass, setLicenseClass] = useState('B')
  const [plate, setPlate] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [tcMasked, setTcMasked] = useState('')
  const [homeAddress, setHomeAddress] = useState('')
  const [averageRating, setAverageRating] = useState(0)
  const [totalRatingCount, setTotalRatingCount] = useState(0)
  const [error, setError] = useState('')
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
        setTcMasked(data.tcIdentityNumber ?? '')
        setIban(data.iban ? formatIBAN(data.iban.replace(/\s/g, '')) : '')
        setLicenseClass(data.licenseClass ?? 'B')
        setPlate(data.vehiclePlate ?? '')
        setVehicleType(data.vehicleType ?? '')
        setHomeAddress(data.homeAddress ?? '')
        setAverageRating(data.averageRating)
        setTotalRatingCount(data.totalRatingCount)
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

  function validateLocal() {
    if (email && !validateEmail(email)) return 'Geçerli bir e-posta adresi giriniz'
    const ibanRaw = iban.replace(/\s/g, '')
    if (ibanRaw && !validateIBAN(ibanRaw)) return 'IBAN TR ile başlayan 26 karakter olmalıdır'
    return ''
  }

  async function save() {
    if (!user?.userId) return
    const v = validateLocal()
    if (v) {
      setError(v)
      return
    }
    if (!fullName.trim()) {
      setError('Ad soyad zorunludur.')
      return
    }
    setError('')
    setStatus('')
    try {
      const ibanRaw = iban.replace(/\s/g, '')
      await apiClient.put(`/Users/${user.userId}`, {
        fullName: fullName.trim(),
        email: email.trim(),
        iban: ibanRaw || undefined,
        homeAddress: homeAddress.trim() || undefined,
      })
      setStatus('Profil kaydedildi.')
    } catch (e: unknown) {
      const msg = (e as { uiMessage?: string })?.uiMessage ?? 'Kayıt başarısız.'
      setError(msg)
    }
  }

  if (loading) return <PageSkeleton rows={3} variant="card" />
  if (loadError) {
    return (
      <div className="page-wrap">
        <div className="page-head">
          <div>
            <h1 className="page-title">Şoför Profili</h1>
            <p className="page-sub">Ehliyet, araç ve iletişim</p>
          </div>
        </div>
        <PageError message={loadError} />
      </div>
    )
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Şoför Profili</h1>
          <p className="page-sub">Puan: ⭐ {averageRating.toFixed(1)} ({totalRatingCount} değerlendirme)</p>
        </div>
      </div>
      <div className="card form-grid">
        <input className="form-input" placeholder="Ad Soyad" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className="form-input" placeholder="Telefon (maskeli)" value={phone} readOnly />
        <input className="form-input" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="form-input" placeholder="T.C. Kimlik (maskeli)" value={tcMasked} readOnly />
        <input className="form-input" placeholder="IBAN" maxLength={34} value={iban} onChange={(e) => setIban(formatIBAN(e.target.value).slice(0, 34))} />
        <select className="form-input" value={licenseClass} disabled>
          {['B', 'C', 'CE', 'D', 'DE', 'E'].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input className="form-input" placeholder="İkametgah" value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} />
        <input className="form-input" placeholder="Plaka" value={plate} readOnly />
        <input className="form-input" placeholder="Araç tipi" value={vehicleType} readOnly />
        <button className="btn btn-primary btn-sm" type="button" onClick={() => void save()}>
          Kaydet
        </button>
        {error ? (
          <p className="muted" style={{ gridColumn: '1 / -1', color: '#ef4444' }}>
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="muted" style={{ gridColumn: '1 / -1' }}>
            {status}
          </p>
        ) : null}
      </div>
      <div className="card">
        <h3>Belgeler</h3>
        <p className="muted">Ruhsat, SRC ve ehliyet durumlarını bu alandan takip edebilirsiniz.</p>
        <Link to="/driver/documents" className="btn btn-primary btn-sm" style={{ marginTop: 12, display: 'inline-block' }}>
          Belgelerime Git →
        </Link>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { PageSkeleton } from '../../components/common/PageStates'
import { digitsOnly, formatIBAN, formatPhone, validateEmail, validateIBAN, validatePhone, validatePlate } from '../../utils/validators'
import '../shared/Page.css'

export default function DriverProfilePage() {
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [iban, setIban] = useState('')
  const [licenseClass, setLicenseClass] = useState('B')
  const [plate, setPlate] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 250)
    return () => clearTimeout(timer)
  }, [])
  function validateLocal() {
    if (phone && !validatePhone(digitsOnly(phone))) return 'Telefon numarası 5 ile başlayan 10 haneli olmalıdır'
    if (email && !validateEmail(email)) return 'Geçerli bir e-posta adresi giriniz'
    if (iban && !validateIBAN(iban)) return 'IBAN TR ile başlayan 26 karakter olmalıdır'
    if (plate && !validatePlate(plate)) return 'Plaka formatı geçersiz'
    return ''
  }
  if (loading) return <PageSkeleton rows={3} variant="card" />
  return (
    <div className="page-wrap">
      <h1 className="page-title">Şoför Profili</h1>
      <div className="card form-grid">
        <input className="form-input" placeholder="Ad Soyad" />
        <input className="form-input" placeholder="Telefon" maxLength={10} value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
        <input className="form-input" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="form-input" placeholder="IBAN" maxLength={32} value={iban} onChange={(e) => setIban(formatIBAN(e.target.value).slice(0, 32))} />
        <select className="form-input" value={licenseClass} onChange={(e) => setLicenseClass(e.target.value)}>
          {['B', 'C', 'CE', 'D', 'DE', 'E'].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="form-input" placeholder="Plaka (34 ABC 1234)" maxLength={9} value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} />
        <button className="btn btn-primary btn-sm" type="button" onClick={() => setError(validateLocal())}>Kaydet</button>
        {error ? <p className="muted" style={{ gridColumn: '1 / -1', color: '#ef4444' }}>{error}</p> : null}
      </div>
      <div className="card">
        <h3>Belgeler</h3>
        <p className="muted">Ruhsat, SRC ve ehliyet durumlarını bu alandan takip edebilirsiniz.</p>
      </div>
    </div>
  )
}

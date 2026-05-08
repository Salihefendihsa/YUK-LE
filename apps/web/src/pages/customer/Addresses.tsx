import { useEffect, useState } from 'react'
import { createAddress, deleteAddress, getMyAddresses, setDefaultAddress, type DeliveryAddress } from '../../api/addresses'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

const emptyAddress = { title: '', companyName: '', contactPerson: '', contactPhone: '', address: '', city: '', district: '', isDefault: false }

export default function CustomerAddressesPage() {
  const [items, setItems] = useState<DeliveryAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyAddress)

  async function load() {
    const data = await getMyAddresses()
    setItems(data)
  }

  useEffect(() => {
    load().catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Adresler yüklenemedi.')).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton rows={6} variant="card" />
  return (
    <div className="page-wrap">
      <h1 className="page-title">Teslimat Adreslerim</h1>
      <p className="page-sub">Sık kullandığınız teslimat noktalarını kaydedin.</p>
      {error ? <PageError message={error} onRetry={() => void load()} /> : null}
      <div className="card form-grid">
        <input className="form-input" placeholder="Başlık" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
        <input className="form-input" placeholder="Şirket Adı" value={form.companyName} onChange={(e) => setForm((s) => ({ ...s, companyName: e.target.value }))} />
        <input className="form-input" placeholder="Yetkili Kişi" value={form.contactPerson} onChange={(e) => setForm((s) => ({ ...s, contactPerson: e.target.value }))} />
        <input className="form-input" placeholder="Telefon" value={form.contactPhone} onChange={(e) => setForm((s) => ({ ...s, contactPhone: e.target.value }))} />
        <input className="form-input" placeholder="Şehir" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
        <input className="form-input" placeholder="İlçe" value={form.district} onChange={(e) => setForm((s) => ({ ...s, district: e.target.value }))} />
        <input className="form-input" style={{ gridColumn: '1 / -1' }} placeholder="Tam Adres" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
        <button className="btn btn-primary" onClick={async () => { await createAddress(form); setForm(emptyAddress); await load() }}>Adres Ekle</button>
      </div>
      <div className="list-grid">
        {items.map((a) => (
          <div className="item-card" key={a.id}>
            <strong>📍 {a.title} {a.isDefault ? <span className="badge badge-success">Varsayılan</span> : null}</strong>
            <p className="muted">{a.companyName} - {a.contactPerson} ({a.contactPhone})</p>
            <p className="muted">{a.address}, {a.district}/{a.city}</p>
            <div className="item-row">
              <button className="btn btn-ghost btn-sm" onClick={async () => { await setDefaultAddress(a.id); await load() }}>Varsayılan Yap</button>
              <button className="btn btn-danger btn-sm" onClick={async () => { await deleteAddress(a.id); await load() }}>Sil</button>
            </div>
          </div>
        ))}
        {items.length === 0 ? (
          <PageEmpty
            icon="📍"
            title="Kayıtlı adres bulunamadı"
            description="Teslimat adresi ekleyerek ilan oluştururken hızlı seçim yapabilirsiniz."
            actionLabel="Adres Ekle"
            onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
        ) : null}
      </div>
    </div>
  )
}

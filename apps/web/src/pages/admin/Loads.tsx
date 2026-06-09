import { useEffect, useState } from 'react'
import { cancelAdminLoad, getAdminLoads } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import './AdminPanel.css'
import { Link } from 'react-router-dom'
import { formatCurrencyTRY } from '../../utils/format'
import { formatLoadStatusLabel } from '../../utils/displayLabels'
import type { AdminLoadRow } from '../../api/admin'

// Durum dropdown: Türkçe etiket → backend LoadStatus enum adı.
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tüm durumlar' },
  { value: 'Active', label: 'Yayında' },
  { value: 'Assigned', label: 'Atandı' },
  { value: 'OnWay', label: 'Yolda' },
  { value: 'Arrived', label: 'Varıldı' },
  { value: 'Delivered', label: 'Teslim edildi' },
  { value: 'Cancelled', label: 'İptal edildi' },
]

export default function AdminLoadsPage() {
  const [loads, setLoads] = useState<AdminLoadRow[]>([])
  const [status, setStatus] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Yapısal filtreler sunucuya gider (status/şehir/tarih). Metin araması (ID/müşteri/
  // şoför/şehir) client-side uygulanır — isim alanları DB'de şifreli olduğundan sunucuda
  // LIKE araması yapılamaz; sayfalama olmadığı için client filtre tüm sonucu kapsar.
  async function loadData() {
    setError('')
    const data = await getAdminLoads({
      status: status || undefined,
      fromCity: cityFilter.trim() || undefined,
      dateFrom: dateFrom || undefined,
      // Bitiş tarihini gün sonuna çek (aynı günü dahil et).
      dateTo: dateTo ? `${dateTo}T23:59:59` : undefined,
    })
    setLoads(data)
  }

  useEffect(() => {
    loadData()
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'İlanlar yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  async function cancelLoad(id: string) {
    await cancelAdminLoad(id)
    await loadData()
  }

  if (loading) return <PageSkeleton rows={8} />
  const rows = Array.isArray(loads) ? loads : []
  const term = search.trim().toLocaleLowerCase('tr-TR')
  const loadList = term
    ? rows.filter((l) =>
        [l.id, l.fromCity, l.toCity, l.customerName ?? '', l.driverName ?? '']
          .some((f) => f.toLocaleLowerCase('tr-TR').includes(term)),
      )
    : rows

  return (
    <div className="admin-page">
      <h1 className="admin-title">İlan Yönetimi</h1>
      {error ? <PageError message={error} /> : null}
      <div className="admin-filters">
        <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input className="form-input" type="date" title="Başlangıç tarihi" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input className="form-input" type="date" title="Bitiş tarihi" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <input className="form-input" placeholder="Şehir filtresi (kalkış)" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
        <input className="form-input" placeholder="İlan ID, müşteri, şoför" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={() => void loadData()}>Filtrele</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>İlan ID</th><th>Güzergah</th><th>Durum</th><th>Anlaşılan Fiyat</th><th>AI Önerilen</th><th>İşlemler</th></tr>
          </thead>
          <tbody>
            {loadList.map((load) => (
              <tr key={load.id}>
                <td className="mono"><Link to={`/admin/loads/${load.id}`}>{load.id.slice(0, 8)}</Link></td>
                <td>{load.fromCity} → {load.toCity}</td>
                <td>{formatLoadStatusLabel(load.status)}</td>
                <td>{formatCurrencyTRY(load.price)}</td>
                <td>{formatCurrencyTRY(load.price)}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => {
                    if (window.confirm('Bu işlem geri alınamaz. İlan iptal edilsin mi?')) void cancelLoad(load.id)
                  }}>İptal Et</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loadList.length === 0 ? <div className="admin-card empty-state">📦 İlan bulunamadı.</div> : null}
    </div>
  )
}

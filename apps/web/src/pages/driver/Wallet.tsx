import { useEffect, useState } from 'react'
import { getWalletSummary, getWalletTransactions } from '../../api/wallet'
import { PageEmpty, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

export default function DriverWalletPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [tx, setTx] = useState<Array<Record<string, unknown>>>([])

  useEffect(() => {
    Promise.all([getWalletSummary(), getWalletTransactions()])
      .then(([s, t]) => {
        setSummary(s)
        setTx(t.items ?? t.Items ?? t ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton rows={6} variant="table" />
  return (
    <div className="page-wrap">
      <h1 className="page-title">Cüzdanım</h1>
      <div className="stats-grid">
        <div className="stat-card"><span>Bakiye</span><strong>₺{Number(summary.walletBalance ?? 0).toLocaleString('tr-TR')}</strong></div>
        <div className="stat-card"><span>Bekleyen</span><strong>₺{Number(summary.pendingBalance ?? 0).toLocaleString('tr-TR')}</strong></div>
        <div className="stat-card"><span>Aylık Kazanç</span><strong>₺{Number(summary.monthAmount ?? 0).toLocaleString('tr-TR')}</strong></div>
      </div>
      <div className="card">
        <h3>İşlem Geçmişi</h3>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Tarih</th><th>Açıklama</th><th>Tutar</th><th>Durum</th></tr></thead>
            <tbody>
              {tx.map((i, idx) => <tr key={idx}><td>{String(i.createdAt ?? i.date ?? '-')}</td><td>{String(i.description ?? '-')}</td><td>₺{Number(i.amount ?? 0).toLocaleString('tr-TR')}</td><td>{String(i.status ?? '-')}</td></tr>)}
            </tbody>
          </table>
        </div>
        {tx.length === 0 ? <PageEmpty icon="💳" title="İşlem bulunamadı" description="Henüz cüzdan hareketiniz yok." actionLabel="Yükleri İncele" onAction={() => { window.location.href = '/driver/loads' }} /> : null}
      </div>
    </div>
  )
}

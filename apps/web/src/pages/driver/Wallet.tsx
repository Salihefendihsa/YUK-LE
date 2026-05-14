import { useEffect, useState } from 'react'
import { getWalletSummary, getWalletTransactions } from '../../api/wallet'
import { PageEmpty, PageSkeleton } from '../../components/common/PageStates'
import { formatCurrencyTRY, formatDateTR, normalizeArray } from '../../utils/format'
import '../shared/Page.css'
import '../admin/AdminPanel.css'

export default function DriverWalletPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [tx, setTx] = useState<Array<Record<string, unknown>>>([])

  useEffect(() => {
    Promise.all([getWalletSummary(), getWalletTransactions()])
      .then(([s, t]) => {
        setSummary(s)
        setTx(normalizeArray<Record<string, unknown>>(t))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton rows={6} variant="table" />
  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Cüzdanım</h1>
          <p className="page-sub">Bakiye, bekleyen tutarlar ve hareketler</p>
        </div>
      </div>

      <div className="card panel-driver-hero" style={{ gridTemplateColumns: '1fr auto' }}>
        <div>
          <p className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
            Kullanılabilir bakiye
          </p>
          <div className="hero-earn">{formatCurrencyTRY(summary.walletBalance ?? 0)}</div>
        </div>
        <div className="panel-wallet-icon" aria-hidden>
          💰
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <span className="muted">Kullanılabilir</span>
          <strong className="stat-value" style={{ fontSize: 22, display: 'block', marginTop: 8 }}>
            {formatCurrencyTRY(summary.walletBalance ?? 0)}
          </strong>
        </div>
        <div className="card stat-card">
          <span className="muted">Bekleyen</span>
          <strong className="stat-value" style={{ fontSize: 22, display: 'block', marginTop: 8 }}>
            {formatCurrencyTRY(summary.pendingBalance ?? 0)}
          </strong>
        </div>
        <div className="card stat-card">
          <span className="muted">Bu ay</span>
          <strong className="stat-value" style={{ fontSize: 22, display: 'block', marginTop: 8 }}>
            {formatCurrencyTRY(summary.monthAmount ?? 0)}
          </strong>
        </div>
      </div>

      <div className="card panel-table-card">
        <h3 style={{ marginBottom: 12 }}>İşlem geçmişi</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th>Tutar</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {tx.map((i, idx) => (
                <tr key={idx}>
                  <td>{formatDateTR(String(i.createdAt ?? i.date ?? ''))}</td>
                  <td>{String(i.description ?? '-')}</td>
                  <td>{formatCurrencyTRY(i.amount as number | string | undefined)}</td>
                  <td>{String(i.status ?? '-')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tx.length === 0 ? (
          <PageEmpty
            icon="💳"
            title="İşlem bulunamadı"
            description="Henüz cüzdan hareketiniz yok."
            actionLabel="Yükleri İncele"
            onAction={() => {
              window.location.href = '/driver/loads'
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

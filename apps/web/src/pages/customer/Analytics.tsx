import { useEffect, useState } from 'react'
import { getUserRatings } from '../../api/ratings'
import { useAuthStore } from '../../store/auth.store'
import '../shared/Page.css'

function downloadCsv(name: string, rows: string[][]) {
  const bom = '\uFEFF'
  const body = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([bom + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export default function CustomerAnalyticsPage() {
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz']
  const spend = [8200, 9100, 7800, 12450, 9900, 11200]

  // Memnuniyet puanı: Dashboard ile AYNI gerçek kaynaktan (Ratings) — sabit/demo değil.
  const userId = useAuthStore((s) => s.user?.userId)
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null)

  useEffect(() => {
    if (!userId) return
    getUserRatings(userId)
      .then((r) => {
        const data = r as { average?: number; count?: number } | null
        setRating(data ? { average: Number(data.average ?? 0), count: Number(data.count ?? 0) } : null)
      })
      .catch(() => setRating(null))
  }, [userId])

  return (
    <div className="page-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Analitik</h1>
          <p className="page-sub">Harcama, güzergah ve sürdürülebilirlik özeti (demo veri)</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() =>
              downloadCsv('yukle-harcama.csv', [['Ay', 'Harcama (₺)'], ...months.map((m, i) => [m, String(spend[i])])])
            }
          >
            CSV indir
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.print()}>
            PDF / Yazdır
          </button>
        </div>
      </div>

      <div className="analytics-grid">
        <section className="card">
          <h2>Toplam harcama</h2>
          <p className="muted" style={{ fontSize: 13 }}>
            Aylık trend (demo)
          </p>
          <div className="bar-chart">
            {spend.map((v, i) => (
              <div key={months[i]} className="bar-wrap" title={`${months[i]}: ₺${v.toLocaleString('tr-TR')}`}>
                <div className="bar" style={{ height: `${(v / 15000) * 100}%` }} />
                <span className="bar-label">{months[i]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>En çok kullanılan güzergahlar</h2>
          <ol style={{ margin: '12px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
            <li>İstanbul → Ankara</li>
            <li>İzmir → Bursa</li>
            <li>Ankara → Mersin</li>
          </ol>
        </section>

        <section className="card">
          <h2>Memnuniyet puanınız</h2>
          {rating && rating.count > 0 ? (
            <>
              <p style={{ fontSize: 42, fontWeight: 800, margin: '8px 0', color: 'var(--color-brand)' }}>
                {rating.average.toFixed(1)}
              </p>
              <p className="muted" style={{ fontSize: 13 }}>
                {rating.count} değerlendirme ortalaması
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 42, fontWeight: 800, margin: '8px 0', color: 'var(--color-text-muted)' }}>—</p>
              <p className="muted" style={{ fontSize: 13 }}>
                Henüz değerlendirme yok
              </p>
            </>
          )}
        </section>

        <section className="card">
          <h2>Karbon ayak izi</h2>
          <p className="muted" style={{ fontSize: 14 }}>
            Tahmini emisyon: <strong>2.4 t CO₂e</strong> bu ay. Yeşil araç tercihi ile{' '}
            <strong>%12</strong> azaltılabilir.
          </p>
        </section>

        <section className="card">
          <h2>Bu ay tasarruf</h2>
          <p style={{ fontSize: 32, fontWeight: 800, margin: '8px 0' }}>₺1.240</p>
          <p className="muted" style={{ fontSize: 13 }}>
            Akıllı eşleştirme ve güzergah optimizasyonu ile (demo).
          </p>
        </section>
      </div>

      <style>{`
        .analytics-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); margin-top: 20px; }
        .bar-chart { display: flex; align-items: flex-end; gap: 10px; height: 180px; margin-top: 16px; }
        .bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; }
        .bar { width: 100%; max-width: 36px; margin-top: auto; border-radius: 8px 8px 4px 4px; background: linear-gradient(180deg, #ff9a48, #ff6b00); min-height: 8px; }
        .bar-label { font-size: 11px; color: var(--color-text-muted); }
      `}</style>
    </div>
  )
}

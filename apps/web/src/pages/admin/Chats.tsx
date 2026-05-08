import { useEffect, useState } from 'react'
import { getAdminBlockedMessages } from '../../api/admin'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import './AdminPanel.css'

export default function AdminChatsPage() {
  const [blocked, setBlocked] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = () => getAdminBlockedMessages()
      .then(setBlocked)
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Sohbet verisi alınamadı.'))
      .finally(() => setLoading(false))
    load()
    const timer = setInterval(() => { void load() }, 30000)
    return () => clearInterval(timer)
  }, [])

  if (loading) return <PageSkeleton rows={8} variant="table" />

  return (
    <div className="admin-page">
      <h1 className="admin-title">Sohbet Yönetimi</h1>
      {error ? <PageError message={error} /> : null}
      <div className="admin-grid-2">
        <div className="admin-card">
          <h3>Konuşma Listesi</h3>
          <PageEmpty icon="💬" title="Konuşma listesi boş" description="Sohbetler burada izleme modunda listelenecek." actionLabel="Yenile" onAction={() => window.location.reload()} />
        </div>
        <div className="admin-card">
          <h3>Mesaj Görüntüleyici</h3>
          <PageEmpty icon="🧾" title="Mesaj detayı bekleniyor" description="Bir konuşma seçtiğinizde geçmiş burada gösterilir." actionLabel="Yenile" onAction={() => window.location.reload()} />
        </div>
      </div>

      <div className="admin-card">
        <h3>Engellenen Mesajlar</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Zaman</th><th>Kim</th><th>Yük</th><th>Mesaj</th></tr></thead>
            <tbody>
              {blocked.map((b, i) => (
                <tr key={`${String(b.timestampUtc)}-${i}`}>
                  <td>{new Date(String(b.timestampUtc)).toLocaleString('tr-TR')}</td>
                  <td>{String(b.senderName)}</td>
                  <td className="mono">{String(b.loadId)}</td>
                  <td className="danger">{String(b.message)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {blocked.length === 0 ? <PageEmpty icon="🛡️" title="Engellenen mesaj yok" description="Filtrelenen mesajlar burada listelenir." actionLabel="Yenile" onAction={() => window.location.reload()} /> : null}
      </div>
    </div>
  )
}

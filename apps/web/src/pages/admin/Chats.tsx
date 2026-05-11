import { useEffect, useState } from 'react'
import { getAdminBlockedMessages } from '../../api/admin'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { formatDateTR, formatTimeTR, normalizeArray } from '../../utils/format'
import './AdminPanel.css'

export default function AdminChatsPage() {
  const [blocked, setBlocked] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLoadId, setSelectedLoadId] = useState<string>('')

  useEffect(() => {
    const load = () => getAdminBlockedMessages()
      .then((data) => setBlocked(normalizeArray<Record<string, unknown>>(data)))
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Sohbet verisi alınamadı.'))
      .finally(() => setLoading(false))
    load()
    const timer = setInterval(() => { void load() }, 30000)
    return () => clearInterval(timer)
  }, [])

  if (loading) return <PageSkeleton rows={8} variant="table" />
  const groupedConversations = Object.values(
    blocked.reduce((acc, msg) => {
      const loadId = String(msg.loadId ?? '')
      if (!loadId) return acc
      const bucket = (acc[loadId] ?? []) as Array<Record<string, unknown>>
      bucket.push(msg)
      acc[loadId] = bucket
      return acc
    }, {} as Record<string, Array<Record<string, unknown>>>)
  ) as Array<Array<Record<string, unknown>>>
  const activeConversation: Array<Record<string, unknown>> =
    groupedConversations.find((group) => String(group[0]?.loadId ?? '') === selectedLoadId) ?? []

  return (
    <div className="admin-page">
      <h1 className="admin-title">Sohbet Yönetimi</h1>
      {error ? <PageError message={error} /> : null}
      <div className="admin-grid-2">
        <div className="admin-card">
          <h3>Konuşma Listesi</h3>
          {groupedConversations.map((group) => {
            const first = group[0] ?? {}
            const loadId = String(first.loadId ?? '')
            const last = group[group.length - 1] ?? {}
            return (
              <button
                key={loadId}
                className="admin-card"
                style={{ width: '100%', textAlign: 'left', marginBottom: 8, borderColor: selectedLoadId === loadId ? '#f97316' : undefined }}
                onClick={() => setSelectedLoadId(loadId)}
              >
                <strong>Yük #{loadId}</strong>
                <p className="muted">Şoför: {String(first.driverName ?? '-')} | Müşteri: {String(first.customerName ?? '-')}</p>
                <p className="muted">Son: {String(last.message ?? '-')}</p>
              </button>
            )
          })}
          {groupedConversations.length === 0 ? <PageEmpty icon="💬" title="Konuşma listesi boş" description="Sohbetler burada izleme modunda listelenecek." actionLabel="Yenile" onAction={() => window.location.reload()} /> : null}
        </div>
        <div className="admin-card">
          <h3>Mesaj Görüntüleyici</h3>
          {activeConversation.map((msg, i) => (
            <div key={`${String(msg.timestampUtc)}-${i}`} className="admin-card" style={{ marginBottom: 8 }}>
              <div className="item-row">
                <strong>{String(msg.senderName ?? 'Kullanıcı')}</strong>
                <span className="muted">{formatDateTR(String(msg.timestampUtc))} {formatTimeTR(String(msg.timestampUtc))}</span>
              </div>
              <p style={{ color: Boolean(msg.isBlocked) ? '#ef4444' : undefined }}>{String(msg.message ?? '')}</p>
            </div>
          ))}
          {activeConversation.length > 0 ? <button className="btn btn-warning btn-sm">Kullanıcıyı Uyar</button> : null}
          {activeConversation.length === 0 ? <PageEmpty icon="🧾" title="Mesaj detayı bekleniyor" description="Bir konuşma seçtiğinizde geçmiş burada gösterilir." actionLabel="Yenile" onAction={() => window.location.reload()} /> : null}
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
                  <td>{formatDateTR(String(b.timestampUtc))} {formatTimeTR(String(b.timestampUtc))}</td>
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

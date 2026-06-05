import { useCallback, useEffect, useState } from 'react'
import {
  getAdminBlockedMessages,
  getAdminChatMessages,
  getAdminChats,
  type AdminChatMessageRow,
  type AdminChatSummaryRow,
} from '../../api/admin'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { formatDateTR, formatTimeTR, normalizeArray } from '../../utils/format'
import './AdminPanel.css'

type Tab = 'all' | 'blocked'

export default function AdminChatsPage() {
  const [tab, setTab] = useState<Tab>('all')

  // Tüm sohbetler (read-only tam transkript)
  const [chats, setChats] = useState<AdminChatSummaryRow[]>([])
  const [selected, setSelected] = useState<AdminChatSummaryRow | null>(null)
  const [messages, setMessages] = useState<AdminChatMessageRow[]>([])
  const [msgLoading, setMsgLoading] = useState(false)

  // Engellenen mesajlar
  const [blocked, setBlocked] = useState<Array<Record<string, unknown>>>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadChats = useCallback(
    () =>
      getAdminChats()
        .then((data) => setChats(data))
        .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Sohbet listesi alınamadı.')),
    [],
  )

  const loadBlocked = useCallback(
    () =>
      getAdminBlockedMessages()
        .then((data) => setBlocked(normalizeArray<Record<string, unknown>>(data)))
        .catch((e: { uiMessage?: string }) =>
          setError(e.uiMessage ?? 'Engellenen mesajlar alınamadı.'),
        ),
    [],
  )

  useEffect(() => {
    Promise.all([loadChats(), loadBlocked()]).finally(() => setLoading(false))
    const timer = setInterval(() => {
      void loadChats()
      void loadBlocked()
    }, 30000)
    return () => clearInterval(timer)
  }, [loadChats, loadBlocked])

  const openChat = async (row: AdminChatSummaryRow) => {
    setSelected(row)
    setMsgLoading(true)
    setMessages([])
    try {
      setMessages(await getAdminChatMessages(row.loadId))
    } catch (e) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'Mesaj geçmişi alınamadı.')
    } finally {
      setMsgLoading(false)
    }
  }

  if (loading) return <PageSkeleton rows={8} variant="table" />

  return (
    <div className="admin-page">
      <h1 className="admin-title">Sohbet Yönetimi</h1>
      <p className="muted">İzleme modu — yönetici sohbete katılmaz, yalnızca okur.</p>
      {error ? <PageError message={error} /> : null}

      <div className="admin-filters">
        <button
          className={tab === 'all' ? 'btn btn-primary btn-sm' : 'btn btn-sm'}
          onClick={() => setTab('all')}
        >
          💬 Tüm Sohbetler
        </button>
        <button
          className={tab === 'blocked' ? 'btn btn-primary btn-sm' : 'btn btn-sm'}
          onClick={() => setTab('blocked')}
        >
          🛡️ Engellenen Mesajlar {blocked.length > 0 ? `(${blocked.length})` : ''}
        </button>
      </div>

      {tab === 'all' ? (
        <div className="admin-grid-2">
          <div className="admin-card">
            <h3>Konuşma Listesi</h3>
            {chats.map((c) => (
              <button
                key={c.loadId}
                className="admin-card"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: 8,
                  borderColor: selected?.loadId === c.loadId ? '#f97316' : undefined,
                }}
                onClick={() => void openChat(c)}
              >
                <strong>{c.route || `Yük #${c.loadId}`}</strong>
                <p className="muted">
                  Müşteri: {c.customerName} | Şoför: {c.driverName}
                </p>
                <p className="muted">Son: {c.lastMessage || '-'}</p>
                <p className="muted">
                  {c.lastMessageAt ? `${formatDateTR(c.lastMessageAt)} ${formatTimeTR(c.lastMessageAt)} · ` : ''}
                  {c.messageCount} mesaj
                </p>
              </button>
            ))}
            {chats.length === 0 ? (
              <PageEmpty
                icon="💬"
                title="Konuşma kaydı yok"
                description="Müşteri ↔ şoför sohbetleri burada izleme modunda listelenir."
                actionLabel="Yenile"
                onAction={() => void loadChats()}
              />
            ) : null}
          </div>

          <div className="admin-card">
            <h3>Mesaj Geçmişi {selected ? `— ${selected.customerName} / ${selected.driverName}` : ''}</h3>
            {msgLoading ? <PageSkeleton rows={5} /> : null}
            {!msgLoading &&
              messages.map((m) => (
                <div
                  key={m.id}
                  className="admin-card"
                  style={{ marginBottom: 8, borderColor: m.isBlocked ? '#ef4444' : undefined }}
                >
                  <div className="item-row">
                    <strong>
                      {m.senderName} {m.senderRole ? `(${m.senderRole})` : ''}
                      {m.isBlocked ? ' · 🚫 Engellendi' : ''}
                    </strong>
                    <span className="muted">
                      {formatDateTR(m.createdAt)} {formatTimeTR(m.createdAt)}
                    </span>
                  </div>
                  <p style={{ color: m.isBlocked ? '#ef4444' : undefined }}>{m.message}</p>
                  {m.blockReason ? <p className="muted">Sebep: {m.blockReason}</p> : null}
                </div>
              ))}
            {!msgLoading && selected && messages.length === 0 ? (
              <PageEmpty
                icon="🧾"
                title="Bu konuşmada mesaj yok"
                description="Henüz mesaj gönderilmemiş."
                actionLabel="Yenile"
                onAction={() => void openChat(selected)}
              />
            ) : null}
            {!msgLoading && !selected ? (
              <PageEmpty
                icon="🧾"
                title="Mesaj detayı bekleniyor"
                description="Bir konuşma seçtiğinizde tam geçmiş burada gösterilir."
                actionLabel="Listeyi yenile"
                onAction={() => void loadChats()}
              />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <h3>Engellenen Mesajlar</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Zaman</th>
                  <th>Kim</th>
                  <th>Yük</th>
                  <th>Mesaj</th>
                </tr>
              </thead>
              <tbody>
                {blocked.map((b, i) => (
                  <tr key={`${String(b.timestampUtc)}-${i}`}>
                    <td>
                      {formatDateTR(String(b.timestampUtc))} {formatTimeTR(String(b.timestampUtc))}
                    </td>
                    <td>{String(b.senderName)}</td>
                    <td className="mono">{String(b.loadId)}</td>
                    <td className="danger">{String(b.message)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {blocked.length === 0 ? (
            <PageEmpty
              icon="🛡️"
              title="Engellenen mesaj yok"
              description="Filtrelenen mesajlar burada listelenir."
              actionLabel="Yenile"
              onAction={() => void loadBlocked()}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}

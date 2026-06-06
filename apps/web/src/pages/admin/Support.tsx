import { useCallback, useEffect, useState } from 'react'
import {
  getAdminSupportTickets,
  slaRemainingLabel,
  supportStatusLabel,
  type SupportTicketSummary,
} from '../../api/support'
import SupportThread from '../../components/support/SupportThread'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { formatDateTR, formatTimeTR } from '../../utils/format'
import './AdminPanel.css'

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(
    () =>
      getAdminSupportTickets()
        .then((data) => setTickets(data))
        .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Talepler alınamadı.')),
    [],
  )

  useEffect(() => {
    load().finally(() => setLoading(false))
    const timer = setInterval(() => void load(), 15000)
    return () => clearInterval(timer)
  }, [load])

  const openCount = tickets.filter((t) => t.status === 'Open').length

  if (loading) return <PageSkeleton rows={8} variant="table" />

  return (
    <div className="admin-page">
      <h1 className="admin-title">
        Destek Talepleri {openCount > 0 ? <span className="badge" style={{ background: '#ff6b00', color: '#0a0a0a' }}>{openCount} açık</span> : null}
      </h1>
      <p className="muted">Operatör bekleyen (açık) talepler üstte, SLA'ya göre sıralı listelenir.</p>
      {error ? <PageError message={error} onRetry={() => void load()} /> : null}

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3>Talep Listesi</h3>
          {tickets.map((t) => (
            <button
              key={t.id}
              className="admin-card"
              style={{
                width: '100%',
                textAlign: 'left',
                marginBottom: 8,
                borderColor: selectedId === t.id ? '#f97316' : t.isOverdue ? '#ef4444' : undefined,
              }}
              onClick={() => setSelectedId(t.id)}
            >
              <div className="item-row">
                <strong>{t.subject}</strong>
                <span className={`support-status-pill status-${t.status.toLowerCase()}`}>
                  {supportStatusLabel(t.status)}
                </span>
              </div>
              <p className="muted">{t.userName}</p>
              <p className="muted">Son: {t.lastMessagePreview || '—'}</p>
              <div className="item-row">
                <span className={t.isOverdue ? 'support-sla overdue' : 'support-sla'}>
                  {t.isOverdue ? '⚠ ' : ''}
                  {slaRemainingLabel(t.slaDeadline, t.status)}
                </span>
                <span className="muted">
                  {formatDateTR(t.lastMessageAt)} {formatTimeTR(t.lastMessageAt)} · {t.messageCount} mesaj
                </span>
              </div>
            </button>
          ))}
          {tickets.length === 0 ? (
            <PageEmpty
              icon="🎧"
              title="Destek talebi yok"
              description="Kullanıcı talepleri burada listelenir."
              actionLabel="Yenile"
              onAction={() => void load()}
            />
          ) : null}
        </div>

        <div className="admin-card">
          <h3>Talep Detayı</h3>
          {selectedId ? (
            <SupportThread ticketId={selectedId} mode="admin" onUpdated={() => void load()} />
          ) : (
            <PageEmpty
              icon="🧾"
              title="Talep seçilmedi"
              description="Soldan bir talep seçtiğinizde tam yazışma ve yanıt kutusu burada görünür."
              actionLabel="Listeyi yenile"
              onAction={() => void load()}
            />
          )}
        </div>
      </div>
    </div>
  )
}

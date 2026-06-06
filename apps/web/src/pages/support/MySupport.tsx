import { useCallback, useEffect, useState } from 'react'
import {
  createSupportTicket,
  getMySupportTickets,
  slaRemainingLabel,
  supportStatusLabel,
  type SupportTicketSummary,
} from '../../api/support'
import SupportThread from '../../components/support/SupportThread'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { formatDateTR, formatTimeTR } from '../../utils/format'
import '../../components/support/support.css'

export default function MySupportPage() {
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [draft, setDraft] = useState('')

  const load = useCallback(
    () =>
      getMySupportTickets()
        .then((data) => {
          setTickets(data)
          setSelectedId((cur) => cur ?? data[0]?.id ?? null)
        })
        .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Talepler alınamadı.')),
    [],
  )

  useEffect(() => {
    load().finally(() => setLoading(false))
    const timer = setInterval(() => void load(), 15000)
    return () => clearInterval(timer)
  }, [load])

  const createTicket = async () => {
    const text = draft.trim()
    if (!text || creating) return
    setCreating(true)
    setError('')
    try {
      const detail = await createSupportTicket(text)
      setDraft('')
      setShowNew(false)
      await load()
      setSelectedId(detail.id)
    } catch (e) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'Talep oluşturulamadı.')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <PageSkeleton rows={6} variant="table" />

  return (
    <div className="support-page">
      <div className="support-page-head">
        <div>
          <h1 style={{ margin: 0 }}>Taleplerim</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Yapay zeka asistanı anında yanıtlar; gerektiğinde insan operatöre aktarın.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNew((s) => !s)}>
          {showNew ? 'Vazgeç' : '+ Yeni Talep'}
        </button>
      </div>

      {error ? <PageError message={error} onRetry={() => void load()} /> : null}

      {showNew ? (
        <div className="card" style={{ padding: 14, marginBottom: 14 }}>
          <textarea
            className="fab-ta"
            rows={3}
            placeholder="Sorununuzu veya sorunuzu yazın…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            className="btn btn-primary btn-sm"
            style={{ marginTop: 8 }}
            onClick={() => void createTicket()}
            disabled={creating || !draft.trim()}
          >
            {creating ? 'Oluşturuluyor…' : 'Asistana Sor'}
          </button>
        </div>
      ) : null}

      {tickets.length === 0 && !showNew ? (
        <PageEmpty
          icon="🎧"
          title="Henüz destek talebiniz yok"
          description="Bir sorunuz mu var? Yapay zeka asistanımız anında yardımcı olsun."
          actionLabel="+ Yeni Talep"
          onAction={() => setShowNew(true)}
        />
      ) : (
        <div className="support-page-grid">
          <div className="card support-list">
            {tickets.map((t) => (
              <button
                key={t.id}
                className={`support-list-item ${selectedId === t.id ? 'active' : ''}`}
                onClick={() => setSelectedId(t.id)}
              >
                <div className="support-list-row">
                  <strong>{t.subject}</strong>
                  <span className={`support-status-pill status-${t.status.toLowerCase()}`}>
                    {supportStatusLabel(t.status)}
                  </span>
                </div>
                <p className="muted support-list-preview">{t.lastMessagePreview || '—'}</p>
                <div className="support-list-meta">
                  <span className={t.isOverdue ? 'support-sla overdue' : 'support-sla'}>
                    {t.isOverdue ? '⚠ ' : ''}
                    {slaRemainingLabel(t.slaDeadline, t.status)}
                  </span>
                  <span className="muted">
                    {formatDateTR(t.lastMessageAt)} {formatTimeTR(t.lastMessageAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="card support-detail-pane">
            {selectedId ? (
              <SupportThread ticketId={selectedId} mode="user" onUpdated={() => void load()} />
            ) : (
              <p className="muted" style={{ padding: 12 }}>Görüntülemek için bir talep seçin.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

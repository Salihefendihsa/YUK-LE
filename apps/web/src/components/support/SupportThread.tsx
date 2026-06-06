import { useCallback, useEffect, useRef, useState } from 'react'
import {
  escalateSupportTicket,
  getSupportTicket,
  postSupportMessage,
  slaRemainingLabel,
  supportStatusLabel,
  updateSupportStatus,
  type SupportTicketDetail,
} from '../../api/support'
import { formatDateTR, formatTimeTR } from '../../utils/format'
import './support.css'

interface SupportThreadProps {
  ticketId: string
  mode: 'user' | 'admin'
  /** Daha kompakt (widget) görünüm. */
  compact?: boolean
  /** Thread her güncellendiğinde (gönderim/poll) tetiklenir — listeleri tazelemek için. */
  onUpdated?: (detail: SupportTicketDetail) => void
}

const POLL_MS = 5000

export default function SupportThread({ ticketId, mode, compact, onUpdated }: SupportThreadProps) {
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const onUpdatedRef = useRef(onUpdated)
  onUpdatedRef.current = onUpdated

  const apply = useCallback((d: SupportTicketDetail) => {
    setDetail(d)
    onUpdatedRef.current?.(d)
  }, [])

  // İlk yükleme + 5sn polling (admin yanıtı / yeni mesaj için).
  useEffect(() => {
    let alive = true
    setDetail(null)
    getSupportTicket(ticketId)
      .then((d) => alive && apply(d))
      .catch((e: { uiMessage?: string }) => alive && setError(e.uiMessage ?? 'Talep yüklenemedi.'))

    const timer = setInterval(() => {
      getSupportTicket(ticketId)
        .then((d) => alive && apply(d))
        .catch(() => {
          /* sessiz: polling hatası kullanıcıyı rahatsız etmesin */
        })
    }, POLL_MS)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [ticketId, apply])

  // Yeni mesaj geldiğinde en alta kaydır.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [detail?.messages.length])

  const send = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    setError('')
    try {
      apply(await postSupportMessage(ticketId, text))
      setDraft('')
    } catch (e) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'Mesaj gönderilemedi.')
    } finally {
      setSending(false)
    }
  }

  const escalate = async () => {
    setSending(true)
    setError('')
    try {
      apply(await escalateSupportTicket(ticketId))
    } catch (e) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'İşlem başarısız.')
    } finally {
      setSending(false)
    }
  }

  const resolve = async () => {
    setSending(true)
    setError('')
    try {
      apply(await updateSupportStatus(ticketId, 'Resolved'))
    } catch (e) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'İşlem başarısız.')
    } finally {
      setSending(false)
    }
  }

  if (!detail) {
    return <div className="support-thread-loading muted">Yükleniyor…</div>
  }

  const isClosed = detail.status === 'Resolved' || detail.status === 'Closed'
  const canEscalate = mode === 'user' && detail.status !== 'Open' && !isClosed

  return (
    <div className={`support-thread ${compact ? 'compact' : ''}`}>
      <div className="support-thread-head">
        <span className={`support-status-pill status-${detail.status.toLowerCase()}`}>
          {supportStatusLabel(detail.status)}
        </span>
        <span className={`support-sla ${detail.isOverdue ? 'overdue' : ''}`}>
          {detail.isOverdue ? '⚠ ' : ''}
          {slaRemainingLabel(detail.slaDeadline, detail.status)}
        </span>
      </div>

      <div className="support-msgs" ref={scrollRef}>
        {detail.messages.map((m) => {
          const mine = m.senderRole === 'User'
          const variant = m.senderRole === 'AI' ? 'ai' : m.senderRole === 'Admin' ? 'admin' : 'me'
          return (
            <div key={m.id} className={`support-msg ${mine ? 'right' : 'left'}`}>
              <div className={`support-bubble ${variant}`}>
                {!mine ? (
                  <span className="support-sender">
                    {m.senderRole === 'AI' ? '🤖 ' : m.senderRole === 'Admin' ? '🎧 ' : ''}
                    {m.senderName}
                  </span>
                ) : null}
                <span className="support-content">{m.content}</span>
                <span className="support-time">
                  {formatTimeTR(m.createdAt)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {error ? <div className="support-error">{error}</div> : null}

      {canEscalate ? (
        <button type="button" className="btn btn-ghost btn-sm support-escalate" onClick={() => void escalate()} disabled={sending}>
          🎧 İnsan operatöre aktar
        </button>
      ) : null}

      {detail.status === 'Open' && mode === 'user' ? (
        <p className="support-hint muted">Talebiniz operatöre iletildi — 24 saat içinde dönüş hedefliyoruz.</p>
      ) : null}

      {mode === 'admin' && !isClosed ? (
        <button type="button" className="btn btn-ghost btn-sm support-escalate" onClick={() => void resolve()} disabled={sending}>
          ✓ Çözüldü olarak işaretle
        </button>
      ) : null}

      {!isClosed ? (
        <div className="support-composer">
          <textarea
            className="fab-ta"
            rows={compact ? 2 : 3}
            placeholder={mode === 'admin' ? 'Operatör yanıtı yazın…' : 'Mesajınızı yazın…'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => void send()}
            disabled={sending || !draft.trim()}
          >
            {sending ? '…' : 'Gönder'}
          </button>
        </div>
      ) : (
        <p className="support-hint muted">Bu talep kapatıldı. Yeni bir konu için yeni talep oluşturabilirsiniz.</p>
      )}

      {!compact ? (
        <p className="support-meta muted">
          Oluşturulma: {formatDateTR(detail.createdAt)} {formatTimeTR(detail.createdAt)}
        </p>
      ) : null}
    </div>
  )
}

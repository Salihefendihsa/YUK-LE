import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { createSupportTicket } from '../../api/support'
import SupportThread from '../support/SupportThread'
import './FloatingSupportChat.css'

const SUGGESTIONS = [
  'Ödeme ne zaman şoföre geçer?',
  'İlanımı nasıl iptal ederim?',
  'Teslimat QR kodu nasıl çalışır?',
  'Adil fiyat önerisi nasıl hesaplanıyor?',
]

const STORAGE_KEY = 'navlonix-support-ticket'

export default function FloatingSupportChat() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [ticketId, setTicketId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  })
  const [draft, setDraft] = useState('')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  // Admin'ler destek panelini kullanır — widget yalnızca müşteri/şoför için.
  if (!user || user.role === 'Admin') return null

  const supportPath = user.role === 'Driver' ? '/driver/support' : '/customer/support'

  const persistTicket = (id: string | null) => {
    setTicketId(id)
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }

  const start = async () => {
    const text = draft.trim()
    if (!text || starting) return
    setStarting(true)
    setError('')
    try {
      const detail = await createSupportTicket(text)
      persistTicket(detail.id)
      setDraft('')
    } catch (e) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'Sohbet başlatılamadı. Lütfen tekrar deneyin.')
    } finally {
      setStarting(false)
    }
  }

  return (
    <>
      <button type="button" className="fab-support" onClick={() => setOpen(true)} aria-label="Canlı destek">
        💬
      </button>
      {open ? (
        <div className="fab-panel-root" role="dialog" aria-modal="true" aria-label="Destek">
          <button type="button" className="fab-panel-backdrop" onClick={() => setOpen(false)} aria-label="Kapat" />
          <div className="fab-panel card">
            <header className="fab-panel-head">
              <div>
                <strong>Navlonix Destek</strong>
                <p className="muted" style={{ fontSize: 12, margin: '2px 0 0' }}>
                  🤖 Yapay zeka asistanı · gerektiğinde operatöre aktarın
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
                ✕
              </button>
            </header>

            {ticketId ? (
              <>
                <SupportThread ticketId={ticketId} mode="user" compact />
                <div className="fab-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => persistTicket(null)}>
                    + Yeni konu
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setOpen(false)
                      navigate(supportPath)
                    }}
                  >
                    Taleplerim →
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
                  Size nasıl yardımcı olabilirim? Sorununuzu yazın, asistanımız anında yanıtlasın.
                </p>
                <div className="fab-faq">
                  {SUGGESTIONS.map((q) => (
                    <button key={q} type="button" className="fab-faq-item" onClick={() => setDraft(q)}>
                      {q}
                    </button>
                  ))}
                </div>
                <textarea
                  className="fab-ta"
                  rows={2}
                  placeholder="Mesajınızı yazın…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void start()
                    }
                  }}
                />
                {error ? <div className="support-error" style={{ marginTop: 6 }}>{error}</div> : null}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={() => void start()}
                  disabled={starting || !draft.trim()}
                >
                  {starting ? 'Başlatılıyor…' : 'Asistana Sor'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', marginTop: 6 }}
                  onClick={() => {
                    setOpen(false)
                    navigate(supportPath)
                  }}
                >
                  Önceki taleplerim →
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}

import { useState } from 'react'
import './FloatingSupportChat.css'

const FAQ = [
  { q: 'Ödeme ne zaman şoföre geçer?', a: 'Teslim onayından sonra cüzdana aktarılır. Detaylar için Cüzdan sayfasına bakın.' },
  { q: 'İlanımı nasıl iptal ederim?', a: 'İlanlarım → ilan detayından durumunu kontrol edin; iptal seçenekleri atanmamış ilanlarda görünür.' },
  { q: 'Operatörle konuşmak istiyorum', a: 'Bu sohbet demo amaçlıdır. Gerçek destek için uygulama içi destek hattınızı veya yöneticinizi kullanın.' },
]

export default function FloatingSupportChat() {
  const [open, setOpen] = useState(false)
  const [reply, setReply] = useState('')
  const [draft, setDraft] = useState('')

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
              <strong>Size nasıl yardımcı olabilirim?</strong>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
                ✕
              </button>
            </header>
            <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
              Sık sorulanlar — bot cevaplayamazsa operatöre yönlendirileceksiniz (demo).
            </p>
            <div className="fab-faq">
              {FAQ.map((f) => (
                <button
                  key={f.q}
                  type="button"
                  className="fab-faq-item"
                  onClick={() => setReply(f.a)}
                >
                  {f.q}
                </button>
              ))}
            </div>
            {reply ? <div className="fab-reply glass-msg">{reply}</div> : null}
            <textarea
              className="fab-ta"
              rows={2}
              placeholder="Mesajınızı yazın…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => {
                setReply('Talebiniz alındı. Kısa süre içinde bir operatör size dönecek.')
                setDraft('')
              }}
            >
              İnsan operatöre aktar
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

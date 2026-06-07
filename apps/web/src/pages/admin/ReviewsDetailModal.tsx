import { useCallback, useEffect, useMemo, useState, type WheelEvent } from 'react'
import type { PendingReview } from '../../api/admin'
import { openConfirm } from '@/components/common/ConfirmModal'
import { toast } from '@/components/common/Toast'

function parseAi(raw?: string) {
  if (!raw) return {} as Record<string, unknown>
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

type Props = {
  review: PendingReview
  onClose: () => void
  onApprove: (reason: string) => Promise<void>
  onReject: (reason: string) => Promise<void>
  onManual: () => void
}

export function ReviewsDetailModal({ review, onClose, onApprove, onReject, onManual }: Props) {
  const ai = useMemo(() => parseAi(review.aiInferenceDetails), [review.aiInferenceDetails])
  const docUrl =
    (typeof ai.DocumentUrl === 'string' && ai.DocumentUrl) ||
    (typeof ai.PreviewUrl === 'string' && ai.PreviewUrl) ||
    (typeof ai.ImageUrl === 'string' && ai.ImageUrl) ||
    ''

  const tcMaskedDisplay = useMemo(() => {
    const raw = ai.TcMasked ?? ai.NationalIdMasked
    if (typeof raw === 'string' && raw.length > 4) return raw
    const last = String(ai.TcLast4 ?? ai.TcSuffix ?? '').replace(/\D/g, '')
    if (last.length >= 4) return `*******${last.slice(-4)}`
    return '*** ****** *****'
  }, [ai])

  const [adminNote, setAdminNote] = useState(review.adminReviewNote ?? '')
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [page, setPage] = useState(0)
  const totalPages = 1

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectText, setRejectText] = useState('')
  const [rejectPreset, setRejectPreset] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    setScale((s) => Math.min(3, Math.max(0.4, s - e.deltaY * 0.001)))
  }, [])

  async function handleApprove() {
    const ok = await openConfirm({
      title: 'Belgeyi onaylıyor musunuz?',
      description:
        'Bu belgeyi onaylıyorsunuz. Şoför sisteme erişim kazanacak. Devam edilsin mi?',
      confirmText: 'Evet, Onayla',
      cancelText: 'Vazgeç',
      variant: 'primary',
    })
    if (!ok) return
    const reason = adminNote.trim() || 'Belgeler manuel olarak onaylandı.'
    await onApprove(reason)
  }

  const combinedReject = useMemo(() => {
    const presetPart = rejectPreset === 'other' || !rejectPreset ? '' : `${rejectPreset}. `
    return `${presetPart}${rejectText}`.trim()
  }, [rejectPreset, rejectText])

  async function handleRejectSubmit() {
    if (combinedReject.length < 20) return
    await onReject(combinedReject)
  }

  return (
    <div className="review-modal-root" role="dialog" aria-modal aria-labelledby="review-modal-title">
      <div className="review-modal-pane">
        <div className="item-row" style={{ marginBottom: 12 }}>
          <h2 id="review-modal-title" className="admin-title" style={{ margin: 0 }}>
            Belge İnceleme
          </h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Kapat
          </button>
        </div>

        <div className="review-doc-stage" onWheel={onWheel}>
          <span className="review-doc-zoom-hint">%{Math.round(scale * 100)}</span>
          <div
            className="review-doc-inner"
            style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
          >
            {docUrl ? (
              <img src={docUrl} alt="Belge önizleme" draggable={false} />
            ) : (
              <div className="muted" style={{ padding: 40, textAlign: 'center' }}>
                Belge görseli API yanıtında yok.
                <br />
                <span style={{ fontSize: 12 }}>Örnek önizleme alanı — zoom için fare tekerleği</span>
              </div>
            )}
          </div>
          <div className="review-doc-toolbar">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRotation((r) => r + 90)}>
              Döndür 90°
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Önceki
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Sonraki →
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setScale(1)}>
              Sıfırla
            </button>
          </div>
        </div>
      </div>

      <div className="review-modal-pane">
        <div className="review-profile-card">
          <div className="item-row" style={{ alignItems: 'center' }}>
            <div className="ad-hero-avatar" style={{ width: 56, height: 56, fontSize: 22 }}>
              {review.fullName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <strong style={{ fontSize: 17 }}>{review.fullName}</strong>
              <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                Telefon: {review.phone}
              </p>
              <p className="muted" style={{ fontSize: 13 }}>
                T.C.: {tcMaskedDisplay}
              </p>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Kayıt: {new Date(review.createdAt).toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Önceki belge analizleri: AI güven skoru geçmişi sistemde saklanır.
          </p>
        </div>

        <div className="review-ai-card">
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>AI analiz sonucu</h3>
          <p className="muted" style={{ fontSize: 13 }}>
            AI belge analiz göstergesi şu an devre dışı. Lütfen belge görselini
            inceleyip kararı manuel verin.
          </p>
        </div>

        <label className="form-group">
          <span className="form-label">Admin notları</span>
          <textarea
            className="form-input"
            rows={3}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="İnceleme notu (onayda isteğe bağlı, redde önerilir)"
          />
        </label>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ marginBottom: 16 }}
          onClick={() => toast.info('Not taslak olarak saklandı; onay veya red ile birlikte gönderilir.')}
        >
          Notu Kaydet
        </button>

        {rejectOpen ? (
          <div className="review-ai-card" style={{ borderColor: 'rgba(239,68,68,0.35)' }}>
            <h4 style={{ marginBottom: 8 }}>Red sebebi</h4>
            <select className="form-input" value={rejectPreset} onChange={(e) => setRejectPreset(e.target.value)}>
              <option value="">Hazır sebep seçin</option>
              <option value="Belge kalitesi yetersiz">Belge kalitesi yetersiz</option>
              <option value="Belge süresi dolmuş">Belge süresi dolmuş</option>
              <option value="Bilgi uyuşmuyor">Bilgi uyuşmuyor</option>
              <option value="Sahte belge şüphesi">Sahte belge şüphesi</option>
              <option value="other">Diğer (manuel)</option>
            </select>
            <textarea
              className="form-input"
              style={{ marginTop: 8 }}
              rows={4}
              placeholder="Açıklama (zorunlu, en az 20 karakter)"
              value={rejectText}
              onChange={(e) => setRejectText(e.target.value)}
            />
            <div className="item-row" style={{ marginTop: 10 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRejectOpen(false)}>
                Vazgeç
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={combinedReject.length < 20}
                onClick={() => void handleRejectSubmit()}
              >
                Reddet ve Gönder
              </button>
            </div>
          </div>
        ) : null}

        <div className="review-actions">
          <button type="button" className="btn-approve-xl" onClick={() => void handleApprove()}>
            ✓ Belgeyi Onayla
          </button>
          <button type="button" className="btn-reject-xl" onClick={() => setRejectOpen(true)}>
            ✗ Belgeyi Reddet
          </button>
          <button
            type="button"
            className="btn-manual-xl"
            onClick={() => {
              onManual()
              onClose()
            }}
          >
            ⏸️ Manuel İncele — 24 saat içinde karar verilecek
          </button>
        </div>
      </div>
    </div>
  )
}

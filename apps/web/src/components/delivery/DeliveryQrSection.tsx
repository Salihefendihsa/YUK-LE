import { useEffect, useState } from 'react'
import { QRCode } from 'react-qrcode-logo'
import { getDeliveryQr } from '../../api/loads'

type Props = {
  loadId: string
}

export default function DeliveryQrSection({ loadId }: Props) {
  const [token, setToken] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await getDeliveryQr(loadId)
        if (!cancelled) setToken(data.token)
      } catch (e: unknown) {
        if (!cancelled) setErr((e as { uiMessage?: string }).uiMessage ?? 'QR kod alınamadı.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadId])

  function downloadPng() {
    const wrap = document.getElementById('delivery-qr-wrap')
    const canvas = wrap?.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `yuk-${loadId}-qr.png`
    a.click()
  }

  if (loading) return <p className="muted">QR kod hazırlanıyor…</p>
  if (err || !token) return <p className="muted">{err || 'QR kod üretilemedi.'}</p>

  return (
    <div style={{ marginTop: 16 }}>
      <p className="muted" style={{ marginBottom: 8 }}>
        Bu QR kodu şoföre gösterin. Teslimatta okutulacak güvenli anahtar 15 dakika geçerlidir.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div id="delivery-qr-wrap">
          <QRCode value={token} size={220} ecLevel="M" eyeRadius={4} />
        </div>
        <span className="muted" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, letterSpacing: 1 }}>
          Teslimat Kodu: #{loadId.slice(0, 8).toUpperCase()}
        </span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => downloadPng()}>
          QR Kodu İndir
        </button>
      </div>
    </div>
  )
}

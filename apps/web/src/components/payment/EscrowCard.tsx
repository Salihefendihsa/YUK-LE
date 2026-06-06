import { useEffect, useState } from 'react'
import { getPaymentForLoad, type PaymentInfo } from '../../api/payments'
import { formatCurrencyTRY } from '../../utils/format'
import './escrow.css'

interface EscrowCardProps {
  loadId: string
  /** Yük durumu — değiştiğinde (kabul/teslim) emanet bilgisi tazelenir. */
  loadStatus: string
  /** 'customer' → ödeyen bakışı; 'driver' → kazanç bakışı. */
  view?: 'customer' | 'driver'
}

export default function EscrowCard({ loadId, loadStatus, view = 'customer' }: EscrowCardProps) {
  const [payment, setPayment] = useState<PaymentInfo | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    setLoaded(false)
    getPaymentForLoad(loadId)
      .then((p) => alive && setPayment(p))
      .finally(() => alive && setLoaded(true))
    return () => {
      alive = false
    }
  }, [loadId, loadStatus])

  if (!loaded) return null

  // Emanet henüz yok: ilan aktifse bilgilendir, değilse hiçbir şey gösterme.
  if (!payment) {
    if (loadStatus === 'Active') {
      return (
        <div className="card escrow-card">
          <h3 className="escrow-title">💳 Güvenli Ödeme (Emanet)</h3>
          <p className="muted escrow-hint">
            Bir teklifi kabul ettiğinizde ödeme <strong>emanete</strong> alınır ve teslimat onaylanana
            kadar güvende tutulur.
          </p>
        </div>
      )
    }
    return null
  }

  const pct = Math.round(payment.commissionRate * 1000) / 10 // %X.X
  const isHeld = payment.status === 'Held'
  const isReleased = payment.status === 'Released'
  const isRefunded = payment.status === 'Refunded'

  return (
    <div className={`card escrow-card status-${payment.status.toLowerCase()}`}>
      <div className="escrow-head">
        <h3 className="escrow-title">💳 Güvenli Ödeme (Emanet)</h3>
        <span className={`escrow-badge ${payment.status.toLowerCase()}`}>
          {isHeld ? 'Emanette' : isReleased ? 'Ödendi' : 'İade edildi'}
        </span>
      </div>

      {isHeld ? (
        <p className="escrow-lead">
          <strong>{formatCurrencyTRY(payment.customerTotal)}</strong> emanette tutuluyor.
          {view === 'driver'
            ? ' Teslimat onaylandığında net tutar cüzdanınıza geçecek.'
            : ' Teslimat onaylandığında şoföre aktarılacak.'}
        </p>
      ) : null}
      {isReleased ? (
        <p className="escrow-lead">
          ✓ Ödeme tamamlandı. <strong>{formatCurrencyTRY(payment.netAmount)}</strong> şoför cüzdanına aktarıldı.
        </p>
      ) : null}
      {isRefunded ? (
        <p className="escrow-lead">Bu yükün ödemesi müşteriye iade edildi.</p>
      ) : null}

      <div className="escrow-breakdown">
        <div className="escrow-row">
          <span>Navlun (brüt)</span>
          <span>{formatCurrencyTRY(payment.grossAmount)}</span>
        </div>
        <div className="escrow-row">
          <span>Platform komisyonu (%{pct})</span>
          <span>−{formatCurrencyTRY(payment.commissionAmount)}</span>
        </div>
        {payment.withholding > 0 ? (
          <div className="escrow-row">
            <span>Stopaj</span>
            <span>−{formatCurrencyTRY(payment.withholding)}</span>
          </div>
        ) : null}
        <div className="escrow-row total">
          <span>{view === 'driver' ? 'Şoföre net' : 'Şoföre aktarılacak net'}</span>
          <span>{formatCurrencyTRY(payment.netAmount)}</span>
        </div>
        {view === 'customer' ? (
          <div className="escrow-row total customer">
            <span>Ödediğiniz toplam</span>
            <span>{formatCurrencyTRY(payment.customerTotal)}</span>
          </div>
        ) : null}
      </div>

      <p className="muted escrow-foot">Demo: ödeme altyapısı mock'tur, gerçek tahsilat yapılmaz.</p>
    </div>
  )
}

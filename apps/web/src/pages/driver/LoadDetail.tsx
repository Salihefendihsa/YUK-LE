import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getLoad } from '../../api/loads'
import { getLoadMatch } from '../../api/matching'
import { submitBid } from '../../api/bids'
import type { Load, MatchedLoad } from '../../api/types'
import LoadChatPanel from '../../components/chat/LoadChatPanel'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import { formatCurrencyTRY } from '../../utils/format'
import { formatCurrency } from '../../utils/validators'
import '../shared/Page.css'

export default function DriverLoadDetailPage() {
  const { id = '' } = useParams()
  const [load, setLoad] = useState<Load | null>(null)
  const [match, setMatch] = useState<MatchedLoad | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    Promise.all([getLoad(id), getLoadMatch(id)])
      .then(([loadData, matchData]) => {
        setLoad(loadData)
        setMatch(matchData)
      })
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Yük detayi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [id])

  async function onSubmitBid() {
    setMessage('')
    const numericAmount = Number(amount)
    if (Number.isNaN(numericAmount) || numericAmount < 100 || numericAmount > 9999999) {
      setError('Fiyat 100 ₺ ile 9.999.999 ₺ arasında olmalıdır')
      return
    }
    try {
      await submitBid({ loadId: id, amount: numericAmount })
      setMessage('Teklifiniz basariyla gonderildi.')
      setAmount('')
    } catch (e: unknown) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'Teklif gonderilemedi.')
    }
  }

  if (loading) return <PageSkeleton rows={7} />

  return (
    <div className="page-wrap">
      <div>
        <h1 className="page-title">Yük Detayi</h1>
        <p className="page-sub">
          {load ? `${load.fromCity} → ${load.toCity}` : ''}
        </p>
      </div>
      {error ? <PageError message={error} /> : null}
      {message ? <div className="card muted">{message}</div> : null}

      {load ? (
        <div className="card">
          <div className="item-row">
            <strong>Fiyat</strong>
            <span>{formatCurrencyTRY(load.price)}</span>
          </div>
          <div className="item-row" style={{ marginTop: 8 }}>
            <strong>Agirlik</strong>
            <span>{load.weight} kg</span>
          </div>
          <div className="item-row" style={{ marginTop: 8 }}>
            <strong>Yük turu</strong>
            <span>{load.type}</span>
          </div>
        </div>
      ) : null}

      {match ? (
        <div className="card">
          <h3>AI Uyum Analizi</h3>
          <p className="muted" style={{ marginTop: 8 }}>
            Uyum skoru: %{match.match.matchScore} - {match.match.personalizedReason}
          </p>
        </div>
      ) : null}

      <div className="card">
        <h3>Teklif Ver</h3>
        <div className="item-row" style={{ marginTop: 12 }}>
          <input
            className="form-input"
            type="number"
            min={100}
            max={9999999}
            placeholder="Teklif tutari"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button className="btn btn-primary" onClick={onSubmitBid}>
            Teklif Gonder
          </button>
        </div>
      </div>
      {amount ? <p className="muted">Teklif önizleme: {formatCurrency(Number(amount))}</p> : null}
      {load && (load.status === 'Assigned' || load.status === 'OnWay' || load.status === 'Delivered') ? (
        <div className="card">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowChat((v) => !v)}>Müşteriyle Sohbet</button>
        </div>
      ) : null}
      {showChat ? <LoadChatPanel loadId={id} /> : null}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { updateLocation } from '../../api/location'
import { PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

export default function DriverActiveLoadPage() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('Canlı konum paylaşımı kapalı.')
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 250)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!sharing) return
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await updateLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, loadId: '' })
        setMessage(`Son konum gönderildi: ${new Date().toLocaleTimeString('tr-TR')}`)
      })
    }, 10000)
    return () => clearInterval(interval)
  }, [sharing])

  if (loading) return <PageSkeleton rows={3} variant="card" />

  return (
    <div className="page-wrap">
      <h1 className="page-title">Aktif Yük - Canlı Konum</h1>
      <p className="page-sub">Aktif seferde iken 10 saniyede bir konum gönderilir.</p>
      <div className="card">
        <div className="item-row">
          <strong>Durum</strong>
          <span className="badge badge-info">{sharing ? 'Paylaşılıyor' : 'Kapalı'}</span>
        </div>
        <p className="muted">{message}</p>
        <button className="btn btn-primary" onClick={() => setSharing((s) => !s)}>
          {sharing ? 'Paylaşımı Durdur' : 'Konumu Paylaş'}
        </button>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { getActiveLoads } from '../../api/loads'
import type { Load } from '../../api/types'
import { PageEmpty, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

export default function DriverHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Load[]>([])
  useEffect(() => {
    getActiveLoads().then((x) => setItems(x.filter((i) => String(i.status) === 'Delivered' || String(i.status) === 'OnWay'))).finally(() => setLoading(false))
  }, [])
  if (loading) return <PageSkeleton rows={5} variant="card" />
  return <div className="page-wrap"><h1 className="page-title">Geçmiş Seferlerim</h1><div className="list-grid">{items.map((i) => <div key={String(i.id)} className="item-card"><strong>{String(i.fromCity)} → {String(i.toCity)}</strong><p className="muted">Fiyat: ₺{Number(i.price ?? 0).toLocaleString('tr-TR')}</p></div>)}{items.length===0?<PageEmpty icon="🚚" title="Geçmiş sefer bulunamadı" description="Tamamlanan seferler burada listelenecek." actionLabel="Yükleri İncele" onAction={()=>{window.location.href='/driver/loads'}} />:null}</div></div>
}

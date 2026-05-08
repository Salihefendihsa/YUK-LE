import { useEffect, useState } from 'react'
import { getActiveLoads } from '../../api/loads'
import type { Load } from '../../api/types'
import { PageEmpty, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

export default function CustomerHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Load[]>([])
  useEffect(() => {
    getActiveLoads().then((x) => setItems(x.filter((i) => String(i.status) === 'Delivered'))).finally(() => setLoading(false))
  }, [])
  if (loading) return <PageSkeleton rows={5} variant="card" />
  return <div className="page-wrap"><h1 className="page-title">Geçmiş Seferler</h1><div className="list-grid">{items.map((i) => <div key={String(i.id)} className="item-card"><strong>{String(i.fromCity)} → {String(i.toCity)}</strong><p className="muted">₺{Number(i.price ?? 0).toLocaleString('tr-TR')}</p></div>)}{items.length===0?<PageEmpty icon="🧾" title="Geçmiş sefer bulunamadı" description="Teslim edilen seferler burada listelenecek." actionLabel="İlanlara Git" onAction={()=>{window.location.href='/customer/loads'}} />:null}</div></div>
}

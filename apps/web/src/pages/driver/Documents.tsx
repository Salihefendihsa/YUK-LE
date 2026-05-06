import { useState } from 'react'
import { uploadDocumentForAi } from '../../api/ai'
import { PageError } from '../../components/common/PageStates'
import '../shared/Page.css'

type Status = 'Bekleniyor' | 'Onayli' | 'Reddedildi' | 'Inceleniyor'

export default function DriverDocumentsPage() {
  const [status, setStatus] = useState<Status>('Bekleniyor')
  const [error, setError] = useState('')
  const [resultText, setResultText] = useState('')

  async function handleUpload(file: File | null) {
    if (!file) return
    setError('')
    setStatus('Inceleniyor')
    try {
      const result = await uploadDocumentForAi(file)
      const isValid = Boolean(result?.isValid ?? result?.IsValid)
      setStatus(isValid ? 'Onayli' : 'Reddedildi')
      setResultText(result?.validationMessage ?? result?.ValidationMessage ?? 'AI analiz tamamlandi.')
    } catch (e: unknown) {
      setStatus('Reddedildi')
      setError((e as { uiMessage?: string }).uiMessage ?? 'Belge analizi basarisiz.')
    }
  }

  return (
    <div className="page-wrap">
      <div>
        <h1 className="page-title">Belgelerim</h1>
        <p className="page-sub">Belge yukleyin, AI analiz sonucunu gorun</p>
      </div>
      {error ? <PageError message={error} /> : null}
      <div className="card">
        <div className="item-row">
          <span>Belge Durumu</span>
          <span className="badge badge-info">{status}</span>
        </div>
        <div style={{ marginTop: 12 }}>
          <input type="file" onChange={(e) => handleUpload(e.target.files?.[0] ?? null)} />
        </div>
        {resultText ? <p className="muted" style={{ marginTop: 12 }}>{resultText}</p> : null}
      </div>
    </div>
  )
}

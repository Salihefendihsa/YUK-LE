import { useEffect, useState } from 'react'
import { uploadDocumentForAi, uploadDriverDocument } from '../../api/ai'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

type Status = 'Bekleniyor' | 'İnceleniyor' | 'İncelemeye Alındı' | 'Reddedildi'

export default function DriverDocumentsPage() {
  const [bootLoading, setBootLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setBootLoading(false), 250)
    return () => clearTimeout(timer)
  }, [])
  const [status, setStatus] = useState<Status>('Bekleniyor')
  const [error, setError] = useState('')
  const [resultText, setResultText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('')
      return
    }

    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedFile])

  async function handleAnalyzeAndUpload() {
    if (!selectedFile) return
    setLoading(true)
    setError('')
    setStatus('İnceleniyor')
    try {
      const result = await uploadDocumentForAi(selectedFile)
      const isValid = Boolean(result?.isValid ?? result?.IsValid)
      if (!isValid) {
        setStatus('Reddedildi')
        setResultText(result?.validationMessage ?? result?.ValidationMessage ?? 'Belge AI analizinden geçemedi.')
        return
      }

      const uploadResult = await uploadDriverDocument(selectedFile)
      const serverMessage = uploadResult?.message ?? uploadResult?.Message
      setStatus('İncelemeye Alındı')
      setResultText(serverMessage || 'Belgeniz incelemeye alındı.')
    } catch (e: unknown) {
      setStatus('Reddedildi')
      setError((e as { uiMessage?: string }).uiMessage ?? 'Belge analizi veya yükleme işlemi başarısız.')
    } finally {
      setLoading(false)
    }
  }

  if (bootLoading) return <PageSkeleton rows={4} variant="card" />

  return (
    <div className="page-wrap">
      <div>
        <h1 className="page-title">Belgelerim</h1>
        <p className="page-sub">Belgenizi seçin, AI analizini tamamlayın ve incelemeye gönderin.</p>
      </div>
      {error ? <PageError message={error} onRetry={handleAnalyzeAndUpload} /> : null}
      <div className="card">
        <div className="item-row">
          <span>Belge Durumu</span>
          <span className="badge badge-info">{status}</span>
        </div>
        <div style={{ marginTop: 12 }}>
          <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
        </div>
        {selectedFile && previewUrl ? (
          <div style={{ marginTop: 12 }}>
            <p className="muted">{selectedFile.name}</p>
            <img
              src={previewUrl}
              alt="Belge önizleme"
              style={{ width: '100%', maxWidth: 320, borderRadius: 10, border: '1px solid var(--color-border)' }}
            />
          </div>
        ) : null}
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 12 }}
          onClick={handleAnalyzeAndUpload}
          disabled={!selectedFile || loading}
        >
          {loading ? 'Analiz ediliyor...' : 'AI Analiz Et ve Kaydet'}
        </button>
        {resultText ? <p className="muted" style={{ marginTop: 12 }}>{resultText}</p> : null}
      </div>
    </div>
  )
}

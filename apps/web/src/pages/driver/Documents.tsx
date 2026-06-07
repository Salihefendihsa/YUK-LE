import { useEffect, useState } from 'react'
import { uploadDocumentForAi, uploadDriverDocument } from '../../api/ai'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

type Status = 'Bekleniyor' | 'İnceleniyor' | 'Onaylı' | 'Reddedildi'
type DocType = 'license' | 'src' | 'psychotechnic'
type DocState = { status: Status; file: File | null; resultText: string; loading: boolean }

/** Yerel kart tipi → backend DocumentType enum adi. */
const DOC_TYPE_MAP: Record<DocType, string> = {
  license: 'DriverLicense',
  src: 'SrcCertificate',
  psychotechnic: 'Psychotechnical',
}

export default function DriverDocumentsPage() {
  const [bootLoading, setBootLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setBootLoading(false), 250)
    return () => clearTimeout(timer)
  }, [])
  const [error, setError] = useState('')
  const [docs, setDocs] = useState<Record<DocType, DocState>>({
    license: { status: 'Bekleniyor', file: null, resultText: '', loading: false },
    src: { status: 'Bekleniyor', file: null, resultText: '', loading: false },
    psychotechnic: { status: 'Bekleniyor', file: null, resultText: '', loading: false },
  })

  async function handleAnalyzeAndUpload(type: DocType) {
    const selectedFile = docs[type].file
    if (!selectedFile) return
    // Yerel kart tipini backend DocumentType enum adina esle (yoksa hep DriverLicense gider).
    const docType = DOC_TYPE_MAP[type]
    setDocs((prev) => ({ ...prev, [type]: { ...prev[type], loading: true, status: 'İnceleniyor' } }))
    setError('')
    try {
      const result = await uploadDocumentForAi(selectedFile, docType)
      const isValid = Boolean(result?.isValid ?? result?.IsValid)
      if (!isValid) {
        setDocs((prev) => ({
          ...prev,
          [type]: {
            ...prev[type],
            loading: false,
            status: 'Reddedildi',
            resultText: result?.validationMessage ?? result?.ValidationMessage ?? 'Belge incelemesinden geçemedi.',
          },
        }))
        return
      }

      const uploadResult = await uploadDriverDocument(selectedFile, docType)
      const serverMessage = uploadResult?.message ?? uploadResult?.Message
      setDocs((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          loading: false,
          status: 'Onaylı',
          resultText: serverMessage || 'Belgeniz başarıyla işlendi.',
        },
      }))
    } catch (e: unknown) {
      setDocs((prev) => ({
        ...prev,
        [type]: { ...prev[type], loading: false, status: 'Reddedildi' },
      }))
      setError((e as { uiMessage?: string }).uiMessage ?? 'Belge analizi veya yükleme işlemi başarısız.')
    }
  }

  if (bootLoading) return <PageSkeleton rows={4} variant="card" />
  const cards: Array<{ key: DocType; title: string; icon: string }> = [
    { key: 'license', title: 'Sürücü Belgesi (Ehliyet)', icon: '📋' },
    { key: 'src', title: 'SRC Belgesi', icon: '🏆' },
    { key: 'psychotechnic', title: 'Psikoteknik Belgesi', icon: '🧠' },
  ]

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Belgelerim</h1>
          <p className="page-sub">Belgeleri sürükle-bırak veya dosya seç ile yükleyin.</p>
        </div>
      </div>
      {error ? <PageError message={error} /> : null}
      <div className="panel-doc-grid">
        {cards.map((card) => {
          const state = docs[card.key]
          const meter =
            state.status === 'Onaylı' ? 100 : state.status === 'İnceleniyor' ? 55 : state.status === 'Reddedildi' ? 25 : 15
          return (
            <div key={card.key} className="panel-doc-card">
              <div className="item-row">
                <strong>
                  {card.icon} {card.title}
                </strong>
                <span
                  className={`badge ${state.status === 'Onaylı' ? 'badge-success' : state.status === 'Reddedildi' ? 'badge-error' : 'badge-info'}`}
                >
                  {state.status === 'Onaylı'
                    ? '✅ Onaylı'
                    : state.status === 'Reddedildi'
                      ? '❌ Reddedildi'
                      : state.status === 'İnceleniyor'
                        ? '⏳ İnceleniyor'
                        : '⏳ Bekleniyor'}
                </span>
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                Belge güven skoru (tahmini)
              </p>
              <div className="panel-ai-meter">
                <span style={{ width: `${meter}%` }} />
              </div>
              <div
                className="panel-dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files?.[0] ?? null
                  setDocs((prev) => ({ ...prev, [card.key]: { ...prev[card.key], file } }))
                }}
              >
                <p className="muted">Dosyayı buraya bırakın veya aşağıdan seçin.</p>
                <input
                  type="file"
                  aria-label="Dosya Seç"
                  onChange={(e) =>
                    setDocs((prev) => ({ ...prev, [card.key]: { ...prev[card.key], file: e.target.files?.[0] ?? null } }))
                  }
                />
                <p className="muted" style={{ marginTop: 6 }}>
                  {state.file ? state.file.name : 'Dosya seçilmedi'}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: 12 }}
                onClick={() => void handleAnalyzeAndUpload(card.key)}
                disabled={!state.file || state.loading}
              >
                {state.loading ? 'Belge inceleniyor…' : 'İncele ve Kaydet'}
              </button>
              {state.resultText ? (
                <p className="muted" style={{ marginTop: 12 }}>
                  {state.resultText}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

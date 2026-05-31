import { Link } from 'react-router-dom'
import { MARKETING_DOCS, type MarketingDocId } from './marketingContent'
import { Logo } from '@/components/brand/Logo'
import './marketing.css'

const CTA_REGISTER_IDS = new Set<MarketingDocId>(['belge-tanima', 'adil-fiyat', 'akilli-eslestirme', 'features', 'pricing'])

type Props = { id: MarketingDocId }

export default function MarketingDocumentPage({ id }: Props) {
  const doc = MARKETING_DOCS[id]
  if (!doc) return null

  const showRegisterCta = CTA_REGISTER_IDS.has(id)

  return (
    <div className="marketing-page">
      <div className="marketing-page__bg" aria-hidden />
      <header className="marketing-page__header">
        <Link to="/" className="marketing-page__logo">
          <Logo variant="full" size="sm" theme="dark" />
        </Link>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link to="/login" className="marketing-page__link">
            Giriş
          </Link>
          <Link to="/register" className="marketing-page__link">
            Kayıt Ol
          </Link>
        </div>
      </header>
      <article className="marketing-page__article glass-card">
        <p className="marketing-page__eyebrow">Kurumsal</p>
        <h1 className="marketing-page__title">{doc.title}</h1>
        <p className="marketing-page__subtitle">{doc.subtitle}</p>
        <div className="marketing-page__body">
          {doc.sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          ))}
        </div>
        {showRegisterCta ? (
          <p style={{ marginTop: '1.5rem' }}>
            <Link to="/register" className="marketing-page__link">
              {id === 'adil-fiyat' ? 'Hemen Başla' : id === 'akilli-eslestirme' ? 'Hemen Dene' : 'Şimdi Dene'}
            </Link>
          </p>
        ) : null}
        <p className="marketing-page__footer">
          <Link to="/">← Ana sayfa</Link>
        </p>
      </article>
    </div>
  )
}

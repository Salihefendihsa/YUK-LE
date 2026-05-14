import { Link } from 'react-router-dom'
import { MARKETING_DOCS, type MarketingDocId } from './marketingContent'
import './marketing.css'

type Props = { id: MarketingDocId }

export default function MarketingDocumentPage({ id }: Props) {
  const doc = MARKETING_DOCS[id]
  if (!doc) return null

  return (
    <div className="marketing-page">
      <div className="marketing-page__bg" aria-hidden />
      <header className="marketing-page__header">
        <Link to="/" className="marketing-page__logo">
          🚛 <span>YÜK-LE</span>
        </Link>
        <Link to="/login" className="marketing-page__link">
          Giriş
        </Link>
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
        <p className="marketing-page__footer">
          <Link to="/">← Ana sayfa</Link>
        </p>
      </article>
    </div>
  )
}

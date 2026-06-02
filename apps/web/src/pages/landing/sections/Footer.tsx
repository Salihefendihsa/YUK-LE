import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import {
  FOOTER_COLUMNS,
  FOOTER_SOCIAL,
  getFooterTopic,
  type FooterPoint,
  type FooterTopic,
} from '../data/footerTopics'

const MARQUEE_ITEMS = ['NAVLONIX', 'LOJİSTİK', 'YAPAY ZEKA', 'GÜVEN', 'TÜRKİYE'] as const

function MarqueeStrip() {
  const segment = `${MARQUEE_ITEMS.map((item) => `${item} ·`).join(' ')} `
  const viewportRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [copyCount, setCopyCount] = useState(6)

  const syncMarquee = useCallback(() => {
    const viewport = viewportRef.current
    const measure = measureRef.current
    const track = trackRef.current
    if (!viewport || !measure || !track) return

    const segmentWidth = measure.getBoundingClientRect().width
    const viewportWidth = viewport.getBoundingClientRect().width
    if (!segmentWidth || !viewportWidth) return

    const needed = Math.max(4, Math.ceil(viewportWidth / segmentWidth) + 3)
    setCopyCount((prev) => (prev === needed ? prev : needed))
    track.style.setProperty('--marquee-shift', `${segmentWidth}px`)
  }, [])

  useEffect(() => {
    syncMarquee()
    const viewport = viewportRef.current
    if (!viewport) return

    const ro = new ResizeObserver(syncMarquee)
    ro.observe(viewport)
    window.addEventListener('resize', syncMarquee)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', syncMarquee)
    }
  }, [syncMarquee])

  return (
    <div className="landing-footer__marquee" aria-hidden>
      <div className="landing-footer__marquee-fade landing-footer__marquee-fade--left" />
      <div className="landing-footer__marquee-fade landing-footer__marquee-fade--right" />
      <div ref={viewportRef} className="landing-footer__marquee-viewport">
        <span
          ref={measureRef}
          className="landing-footer__marquee-segment landing-footer__marquee-segment--measure"
        >
          {segment}
        </span>
        <div ref={trackRef} className="landing-footer__marquee-track">
          {Array.from({ length: copyCount }, (_, index) => (
            <span key={index} className="landing-footer__marquee-segment">
              {segment}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function scrollToLandingSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function FooterDocLink({
  to,
  label,
  onNavigate,
}: {
  to: string
  label: string
  onNavigate: () => void
}) {
  const hashMatch = /^\/#([\w-]+)$/.exec(to)
  if (hashMatch) {
    const sectionId = hashMatch[1]
    return (
      <button
        type="button"
        className="landing-footer-modal__cta"
        data-cursor-hover
        onClick={() => {
          onNavigate()
          window.requestAnimationFrame(() => scrollToLandingSection(sectionId))
        }}
      >
        {label}
        <span className="landing-footer-modal__cta-arrow" aria-hidden>
          →
        </span>
      </button>
    )
  }

  return (
    <Link to={to} className="landing-footer-modal__cta" data-cursor-hover onClick={onNavigate}>
      {label}
      <span className="landing-footer-modal__cta-arrow" aria-hidden>
        →
      </span>
    </Link>
  )
}

function PointList({ points }: { points: FooterPoint[] }) {
  return (
    <ul className="landing-footer-modal__list">
      {points.map((point) => (
        <li key={point.label}>
          <strong>{point.label}</strong>
          <span>{point.text}</span>
        </li>
      ))}
    </ul>
  )
}

function FooterDetailModal({ topic, onClose }: { topic: FooterTopic; onClose: () => void }) {
  const titleId = useId()
  const summaryId = useId()

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div className="landing-footer-modal" role="presentation">
      <button
        type="button"
        className="landing-footer-modal__backdrop"
        aria-label="Detay penceresini kapat"
        onClick={onClose}
      />
      <div
        className="landing-footer-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={summaryId}
      >
        <button type="button" className="landing-footer-modal__close" onClick={onClose} aria-label="Kapat">
          ×
        </button>

        <header className="landing-footer-modal__head">
          <p className="landing-footer-modal__eyebrow">{topic.group}</p>
          <h3 id={titleId} className="landing-footer-modal__title">
            {topic.label}
          </h3>
          <p id={summaryId} className="landing-footer-modal__summary">
            {topic.summary}
          </p>
        </header>

        <div className="landing-footer-modal__scroll">
          <div className="landing-footer-modal__cols">
            <section className="landing-footer-modal__block landing-footer-modal__block--customer">
              <h4 className="landing-footer-modal__block-title">
                <span className="landing-footer-modal__role-dot" aria-hidden />
                {topic.customerTitle}
              </h4>
              <PointList points={topic.customerPoints} />
            </section>

            <section className="landing-footer-modal__block landing-footer-modal__block--driver">
              <h4 className="landing-footer-modal__block-title">
                <span
                  className="landing-footer-modal__role-dot landing-footer-modal__role-dot--driver"
                  aria-hidden
                />
                {topic.driverTitle}
              </h4>
              <PointList points={topic.driverPoints} />
            </section>
          </div>
        </div>

        {topic.docLink ? (
          <footer className="landing-footer-modal__foot">
            <FooterDocLink to={topic.docLink.to} label={topic.docLink.label} onNavigate={onClose} />
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

export function LandingFooter() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeTopic = activeId ? getFooterTopic(activeId) : null

  const openTopic = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const closeModal = useCallback(() => {
    setActiveId(null)
  }, [])

  return (
    <footer className={`landing-footer${activeTopic ? ' landing-footer--modal-open' : ''}`}>
      {activeTopic ? <FooterDetailModal topic={activeTopic} onClose={closeModal} /> : null}

      <p className="landing-footer__strip">
        <span className="landing-footer__strip-dot" aria-hidden />
        500+ fabrika ile güveniliyoruz
      </p>

      <MarqueeStrip />

      <div className="landing-footer__inner">
        <div className="landing-footer__grid">
          <div className="landing-footer__brand-col">
            <p className="landing-footer__brand">
              <Logo variant="wordmark" size="md" theme="dark" />
            </p>
            <p className="landing-footer__tag">Yapay Zeka Destekli Yük Platformu</p>
            <div className="landing-footer__social" role="list" aria-label="Sosyal medya (yakında)">
              {FOOTER_SOCIAL.map((name) => (
                <span
                  key={name}
                  role="listitem"
                  className="landing-footer__social-item"
                  title="Yakında"
                  aria-disabled="true"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="landing-footer__col">
              <p className="landing-footer__col-title">{col.title}</p>
              <ul className="landing-footer__link-list">
                {col.topics.map((topic) => (
                  <li key={topic.id}>
                    <button
                      type="button"
                      className={`landing-footer__link${topic.soonBadge ? ' landing-footer__link--soon' : ''}`}
                      data-cursor-hover
                      onClick={() => openTopic(topic.id)}
                    >
                      {topic.label}
                      {topic.soonBadge ? (
                        <span className="landing-footer__soon-badge">Yakında</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="landing-footer__bottom">
          <p>© 2026 Navlonix — Yapay Zekâ Destekli Lojistik.</p>
          <p className="landing-footer__locale">
            <span aria-hidden>🇹🇷</span> Türkiye · TR
          </p>
        </div>
      </div>
    </footer>
  )
}

import { usePixelNavigate } from '../hooks/usePixelNavigate'

const STATS = [
  { value: '2.847', label: 'Fabrika' },
  { value: '8.500+', label: 'Şoför' },
  { value: '47.000+', label: 'Teslimat' },
] as const

const TRUST = [
  {
    label: 'KVKK Uyumlu',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Güvenli Ödeme',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M8 10V8a4 4 0 118 0v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: '7/24 Destek',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
        <path d="M12 8v4l2.5 2.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
] as const

function scrollToHowItWorks() {
  document.getElementById('yolculuk')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function CTASection() {
  const { go, overlay } = usePixelNavigate()

  return (
    <section className="landing-cta" id="cta">
      {overlay}
      <div className="landing-cta__bg" aria-hidden>
        <div className="landing-cta__glow" />
        <div className="landing-cta__grid" />
        <img className="landing-cta__trucks" src="/hero-trucks.jpg" alt="" decoding="async" />
      </div>

      <div className="landing-cta__inner">
        <p className="landing-cta__kicker">
          <span className="landing-cta__kicker-mark" aria-hidden>
            YOLA ÇIK
          </span>
        </p>
        <h2 className="landing-cta__title">
          Yükünüz İçin En İyi Teklifi
          <span className="landing-cta__title-accent"> Bugün Alın</span>
        </h2>
        <p className="landing-cta__sub">
          Kayıt 2 Dakika Sürer — Akıllı Eşleştirme İle Dakikalar İçinde Teklif Alın.
        </p>

        <ul className="landing-cta__stats" aria-label="Platform özeti">
          {STATS.map((s) => (
            <li key={s.label} className="landing-cta__stat">
              <span className="landing-cta__stat-value">{s.value}</span>
              <span className="landing-cta__stat-label">{s.label}</span>
            </li>
          ))}
        </ul>

        <div className="landing-cta__btns">
          <button type="button" className="landing-cta__mega" data-cursor-hover onClick={() => go('/register')}>
            Hemen Başla
          </button>
          <button type="button" className="landing-cta__ghost" data-cursor-hover onClick={scrollToHowItWorks}>
            Nasıl Çalışır?
          </button>
        </div>

        <ul className="landing-cta__trust" aria-label="Güven rozetleri">
          {TRUST.map((t, i) => (
            <li key={t.label}>
              {i > 0 ? <span className="landing-cta__trust-sep" aria-hidden>·</span> : null}
              <span className="landing-cta__trust-item">
                {t.icon}
                {t.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

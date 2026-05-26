import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'

export function MobileDemoSection({ reduceMotion }: { reduceMotion: boolean }) {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = root.current
    if (!el || reduceMotion) return
    gsap.fromTo(
      el.querySelectorAll('.landing-mobile__reveal'),
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 75%', once: true },
      },
    )
  }, [reduceMotion])

  return (
    <section ref={root} className="landing-mobile" id="mobile">
      <div className="landing-mobile__inner">
        <div className="landing-mobile__text">
          <p className="landing-mobile__eyebrow landing-mobile__reveal">Mobil</p>
          <h2 className="landing-mobile__reveal">Cebinizde Yük Yönetimi</h2>
          <p className="landing-mobile__p landing-mobile__reveal">
            İlan açın, teklifleri görün, teslimatı takip edin — tek uygulamada.
          </p>
          <div className="landing-mobile__stores landing-mobile__reveal">
            <span className="landing-mobile__badge">Yakında</span>
            <button type="button" className="landing-mobile__store" data-cursor-hover>
              App Store
            </button>
            <button type="button" className="landing-mobile__store" data-cursor-hover>
              Google Play
            </button>
          </div>
        </div>
        <div className="landing-mobile__device landing-mobile__reveal" aria-hidden>
          <div className="landing-mobile__phone">
            <div className="landing-mobile__island" />
            <div className={`landing-mobile__screen-shell ${reduceMotion ? 'landing-mobile__screen-shell--reduced' : ''}`}>
              <div className="landing-mobile-mini__nav">
                <span className="landing-mobile-mini__wordmark">YÜK-LE</span>
              </div>
              <div className="landing-mobile-mini__hero">
                <div className="landing-mobile-mini__hero-bg" />
                <div className="landing-mobile-mini__hero-top-gradient" />
                <div className="landing-mobile-mini__hero-copy">
                  <div className="landing-mobile-mini__hero-line">Yükünüz GÜVENDE,</div>
                  <div className="landing-mobile-mini__hero-line landing-mobile-mini__hero-line--accent">Yolunuz AÇIK.</div>
                </div>
              </div>
              <div className="landing-mobile-mini__cta-wrap">
                <button type="button" className="landing-mobile-mini__cta-btn">
                  Hemen Başla
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

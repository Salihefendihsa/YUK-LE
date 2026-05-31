import { Link } from 'react-router-dom'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, registerGsapPlugins } from '../../lib/gsap'
import { useHeroParallax } from './hooks/useHeroParallax'
import { useMagneticHover } from './hooks/useMagneticHover'
import { HeroBackground } from './HeroBackground'

registerGsapPlugins()
gsap.registerPlugin(useGSAP)

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

const HERO_FROM = {
  opacity: 0,
  y: 24,
  filter: 'blur(12px)',
}

const HERO_TO = {
  opacity: 1,
  y: 0,
  filter: 'blur(0px)',
  duration: 0.65,
  ease: 'power3.out',
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ScrollCue() {
  return (
    <a href="#journey" className="hero-scroll-cue" aria-label="Türkiye ağına kaydır">
      Aşağı kaydır
      <span className="hero-scroll-cue__chevron" aria-hidden>
        <span className="hero-scroll-cue__line" />
        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" style={{ marginTop: 4 }}>
          <path
            d="M1 1l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </a>
  )
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoParallaxRef = useRef<HTMLDivElement>(null)
  const eyebrowParallaxRef = useRef<HTMLDivElement>(null)
  const contentParallaxRef = useRef<HTMLDivElement>(null)
  const primaryCtaWrapRef = useRef<HTMLDivElement>(null)

  useHeroParallax(sectionRef, [
    { ref: videoParallaxRef, max: 6, factor: 0.32 },
    { ref: eyebrowParallaxRef, max: 10, factor: 0.92 },
    { ref: contentParallaxRef, max: 10, factor: 1 },
  ])

  useMagneticHover(primaryCtaWrapRef, 0.2)

  useGSAP(() => {
    const reducedMotion = window.matchMedia(REDUCED_MOTION).matches
    const animated = gsap.utils.toArray<HTMLElement>('[data-hero-animate]')

    if (!animated.length) return

    if (reducedMotion) {
      gsap.set(animated, { opacity: 1, y: 0, filter: 'blur(0px)', clearProps: 'filter' })
      return
    }

    gsap.set(animated, HERO_FROM)

    animated.forEach((el) => {
      const delay = Number.parseFloat(el.dataset.heroDelay ?? '0') || 0
      gsap.to(el, { ...HERO_TO, delay })
    })
  }, [])

  return (
    <section ref={sectionRef} id="hero" className="lm-hero section-rhythm-a">
      <div ref={videoParallaxRef} className="lm-hero-media">
        <HeroBackground />
      </div>

      <div className="lm-container lm-hero-content">
        <div className="lm-hero-copy">
          <div
            ref={eyebrowParallaxRef}
            data-hero-animate
            data-hero-delay="0.4"
            className="lm-eyebrow liquid-glass will-change-transform"
          >
            <span className="hero-eyebrow-dot" aria-hidden />
            TR&apos;nin ilk AI lojistiği
          </div>

          <div ref={contentParallaxRef} className="will-change-transform">
            <h1 className="lm-hero-title">
              <span data-hero-animate data-hero-delay="0.55" style={{ display: 'block' }}>
                Yükünüz GÜVENDE,
              </span>
              <span data-hero-animate data-hero-delay="0.68" style={{ display: 'block', marginTop: '0.25rem' }}>
                Yolunuz <span className="lm-accent">AÇIK</span>.
              </span>
            </h1>

            <p data-hero-animate data-hero-delay="0.82" className="lm-hero-sub">
              Saniyeler içinde eşleş. Akıllıca taşı. Güvenle teslim al.
            </p>

            <div data-hero-animate data-hero-delay="0.95" className="lm-hero-ctas">
              <div ref={primaryCtaWrapRef} className="will-change-transform">
                <Link to="/register" className="hero-cta-primary">
                  Hemen Başla
                  <ArrowIcon />
                </Link>
              </div>
              <Link to="/demo" className="lm-hero-secondary-cta liquid-glass liquid-glass-hover">
                Demo Talep Et
              </Link>
            </div>

            <div data-hero-animate data-hero-delay="1.1" className="lm-hero-stats">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div className="lm-avatar-stack" aria-hidden>
                  {['M', 'A', 'Z', 'F'].map((initial) => (
                    <span key={initial}>{initial}</span>
                  ))}
                </div>
                <span>
                  <strong>2.847</strong> fabrika
                </span>
              </div>
              <span aria-hidden>·</span>
              <span>
                ★ <strong>4.9</strong>
              </span>
              <span aria-hidden>·</span>
              <span>
                <strong>247</strong> aktif sefer
              </span>
              <span style={{ width: '100%', fontSize: '0.75rem' }}>(örnek veri)</span>
            </div>
          </div>
        </div>
      </div>

      <ScrollCue />
    </section>
  )
}

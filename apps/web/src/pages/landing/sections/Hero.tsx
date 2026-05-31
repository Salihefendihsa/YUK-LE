import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HeroVideoBackground } from '../components/HeroVideoBackground'
import { ShimmerText } from '../components/ShimmerText'

function ArrowRightIcon() {
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

const ease = [0.22, 1, 0.36, 1] as const

const containerVariants = {
  hidden: {},
  visible: (reduceMotion: boolean) => ({
    transition: {
      staggerChildren: reduceMotion ? 0 : 0.12,
      delayChildren: reduceMotion ? 0 : 0.1,
    },
  }),
}

const itemVariants = {
  hidden: (reduceMotion: boolean) =>
    reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
  visible: (reduceMotion: boolean) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: reduceMotion ? 0 : 0.7,
      ease,
    },
  }),
}

function MagneticCtaLink({
  to,
  className,
  children,
  magneticDisabled,
  withShimmer,
}: {
  to: string
  className: string
  children: ReactNode
  magneticDisabled: boolean
  withShimmer?: boolean
}) {
  const linkRef = useRef<HTMLAnchorElement>(null)
  const innerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (magneticDisabled) return
    const link = linkRef.current
    const inner = innerRef.current
    if (!link || !inner) return

    const strength = 0.22
    const onMove = (e: MouseEvent) => {
      const rect = link.getBoundingClientRect()
      const x = e.clientX - (rect.left + rect.width / 2)
      const y = e.clientY - (rect.top + rect.height / 2)
      inner.style.transform = `translate(${x * strength}px, ${y * strength}px)`
    }
    const reset = () => {
      inner.style.transform = 'translate(0, 0)'
    }
    link.addEventListener('mousemove', onMove)
    link.addEventListener('mouseleave', reset)
    return () => {
      link.removeEventListener('mousemove', onMove)
      link.removeEventListener('mouseleave', reset)
    }
  }, [magneticDisabled])

  return (
    <Link ref={linkRef} to={to} className={className} data-cursor-hover>
      <span ref={innerRef} className="hero-cta-magnetic-inner">
        {children}
      </span>
      {withShimmer ? <span className="cta-shimmer" aria-hidden /> : null}
    </Link>
  )
}

export function HeroSection({ reduceMotion }: { reduceMotion: boolean }) {
  const r = reduceMotion

  return (
    <section className="hero-cinematic" id="top">
      <HeroVideoBackground />
      <div className="hero-grid-pattern" aria-hidden />
      <div className="hero-vignette" aria-hidden />

      <div className="hero-content-wrapper">
        <motion.div
          className="hero-content"
          initial={r ? false : 'hidden'}
          animate="visible"
          variants={containerVariants}
          custom={r}
        >
          <motion.div className="hero-badge" variants={itemVariants} custom={r}>
            <span className="hero-badge-dot" aria-hidden />
            <span>TR&apos;NİN İLK YAPAY ZEKÂ LOJİSTİĞİ</span>
          </motion.div>

          <motion.h1 className="hero-headline" variants={itemVariants} custom={r}>
            <span className="hero-headline-line">
              Yükünüz <ShimmerText variant="white">GÜVENDE</ShimmerText>,
            </span>
            <span className="hero-headline-line">
              Yolunuz <ShimmerText variant="orange">AÇIK</ShimmerText>.
            </span>
          </motion.h1>

          <motion.p className="hero-subtitle" variants={itemVariants} custom={r}>
            Saniyeler İçinde Eşleş. Akıllıca Taşı.
            <br />
            Güvenle Teslim Al.
          </motion.p>

          <motion.div className="hero-cta-group" variants={itemVariants} custom={r}>
            <MagneticCtaLink
              to="/register"
              className="cta-primary"
              magneticDisabled={r}
              withShimmer
            >
              <span>Hemen Başla</span>
              <ArrowRightIcon />
            </MagneticCtaLink>
            <MagneticCtaLink to="/demo" className="cta-secondary" magneticDisabled={r}>
              Demo Talep Et
            </MagneticCtaLink>
          </motion.div>

          <motion.div
            className="hero-trust-live"
            variants={itemVariants}
            custom={r}
            aria-label="Güven ve canlı aktivite"
          >
            <div className="trust-avatars">
              {['M', 'A', 'Z', 'F'].map((initial, i) => (
                <div key={i} className={`trust-avatar trust-avatar-${i}`}>
                  {initial}
                </div>
              ))}
            </div>
            <div className="trust-text">
              <strong>2.847</strong> fabrika · <span className="trust-rating">★ 4.9</span>
            </div>
            <div className="trust-divider" aria-hidden />
            <div className="trust-live">
              <span className="live-dot" aria-hidden />
              <strong>247</strong> aktif sefer
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

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

function motionBlock(delay: number, reduceMotion: boolean) {
  if (reduceMotion) {
    return { initial: false, animate: { opacity: 1, y: 0 } }
  }
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease, delay },
  }
}

export function HeroSection({ reduceMotion }: { reduceMotion: boolean }) {
  const r = reduceMotion

  return (
    <section className="landing-hero" id="top">
      <div className="landing-hero__layers" aria-hidden>
        <div className="landing-hero__glow" />
        <div className="landing-hero__dotgrid" />
        <div className="landing-hero__vignette" />
      </div>

      <div className="landing-hero__container">
        <motion.div className="landing-hero__badge" {...motionBlock(0.1, r)}>
          <span className="landing-hero__badge-dot" aria-hidden />
          <span>TR&apos;NİN İLK AI LOJİSTİĞİ</span>
        </motion.div>

        <motion.h1 className="landing-hero__title" {...motionBlock(0.2, r)}>
          Yükünüz <span className="landing-hero__title-soft">güvende</span>,
          <br />
          Yolunuz <span className="landing-hero__title-accent">açık</span>.
        </motion.h1>

        <motion.p className="landing-hero__subtitle" {...motionBlock(0.4, r)}>
          Saniyeler içinde eşleş. Akıllıca taşı. Güvenle teslim al.
        </motion.p>

        <motion.div className="landing-hero__cta-group" {...motionBlock(0.6, r)}>
          <Link to="/register" className="landing-hero__cta-primary" data-cursor-hover>
            Hemen Başla
            <ArrowRightIcon />
          </Link>
          <Link to="/demo" className="landing-hero__cta-secondary" data-cursor-hover>
            Demo Talep Et
          </Link>
        </motion.div>

        <motion.div className="landing-hero__trust" {...motionBlock(0.8, r)} aria-label="Güven göstergesi">
          <div className="landing-hero__trust-avatars">
            <div className="landing-hero__trust-avatar landing-hero__trust-avatar--1">M</div>
            <div className="landing-hero__trust-avatar landing-hero__trust-avatar--2">Z</div>
            <div className="landing-hero__trust-avatar landing-hero__trust-avatar--3">F</div>
            <div className="landing-hero__trust-avatar landing-hero__trust-avatar--4">A</div>
          </div>
          <span>500+ fabrika güveniyor</span>
          <span className="landing-hero__trust-rating">★ 4.9/5</span>
        </motion.div>
      </div>

      <div className="landing-hero__scroll" aria-hidden>
        <span className="landing-hero__scroll-label">KAYDIRIN</span>
        <div className="landing-hero__scroll-line">
          <div className="landing-hero__scroll-dot" />
        </div>
      </div>
    </section>
  )
}

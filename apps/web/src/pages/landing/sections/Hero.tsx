import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Vector2 } from 'three'
import { gsap } from 'gsap'
import { HeroScene } from '../scenes/HeroScene'
import { Link } from 'react-router-dom'
import { ScrollIndicator } from '../components/ScrollIndicator'

export function HeroSection({ reduceMotion }: { reduceMotion: boolean }) {
  const root = useRef<HTMLElement>(null)
  const mouseRef = useRef(new Vector2(0, 0))

  useEffect(() => {
    const el = root.current
    if (!el) return
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - r.left) / r.width) * 2 - 1
      mouseRef.current.y = -(((e.clientY - r.top) / r.height) * 2 - 1)
    }
    el.addEventListener('pointermove', onMove, { passive: true })
    return () => el.removeEventListener('pointermove', onMove)
  }, [])

  useEffect(() => {
    if (reduceMotion) return
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .from('.landing-hero__badge', { y: -50, opacity: 0, duration: 0.6 })
        .from(
          '.landing-hero__title .landing-hero__line',
          { y: 100, opacity: 0, stagger: 0.15, duration: 0.8 },
          '-=0.3',
        )
        .from('.landing-hero__sub', { y: 30, opacity: 0, duration: 0.55 }, '-=0.4')
        .from('.landing-hero__ctas', { y: 30, opacity: 0, duration: 0.5 }, '-=0.35')
        .from('.landing-hero__scroll', { opacity: 0, duration: 0.45 }, '-=0.25')
    }, el)
    return () => ctx.revert()
  }, [reduceMotion])

  return (
    <section ref={root} className="landing-hero" id="top">
      <div className="landing-hero__canvas-wrap" aria-hidden>
        <Canvas
          shadows
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ fov: 75, position: [0, 1.6, 5.2], near: 0.1, far: 80 }}
        >
          <HeroScene mouseRef={mouseRef} reduceEffects={reduceMotion} />
        </Canvas>
      </div>

      <div className="landing-hero__ui">
        <div className="landing-hero__left">
          <div className="landing-hero__badge">TR&apos;NİN İLK AI LOJİSTİĞİ</div>
          <h1 className="landing-hero__title">
            <span className="landing-hero__line">YÜKÜNÜZ</span>
            <span className="landing-hero__line">GÜVENDE,</span>
            <span className="landing-hero__line landing-hero__line--accent">YOLUNUZ</span>
            <span className="landing-hero__line landing-hero__line--last">
              <strong>AÇIK</strong>
              <span className="landing-hero__dot" aria-hidden>
                .
              </span>
            </span>
          </h1>
          <p className="landing-hero__sub">
            Saniyeler içinde eşleş. Akıllıca taşı.
            <br />
            Güvenle teslim al.
          </p>
          <div className="landing-hero__ctas">
            <Link to="/register" className="landing-hero__btn landing-hero__btn--primary" data-cursor-hover>
              Hemen Başla <span className="landing-hero__arrow">→</span>
            </Link>
            <Link to="/demo" className="landing-hero__btn landing-hero__btn--ghost" data-cursor-hover>
              Demo Talep Et
            </Link>
          </div>
        </div>
        <div className="landing-hero__scroll">
          <ScrollIndicator />
        </div>
      </div>
    </section>
  )
}

import { Suspense, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import { AIScene } from '../scenes/AIScene'
import { useSectionInView } from '../hooks/useSectionInView'

const cards = [
  {
    icon: '📄',
    title: 'Belge Tanıma',
    to: '/features/belge-tanima',
    text: 'Ehliyet ve evraklar yapay zeka ile okunur, anında doğrulanır.',
    tag: '✓ Doğrulandı',
  },
  {
    icon: '💰',
    title: 'Adil Fiyat',
    to: '/features/adil-fiyat',
    text: 'Mesafe, yük ve talep dengesiyle şeffaf fiyat önerisi.',
    tag: '₺3.847',
  },
  {
    icon: '🎯',
    title: 'Akıllı Eşleştirme',
    to: '/features/akilli-eslestirme',
    text: 'Şoför ve yük profilleri %95 uyum ile eşleşir.',
    tag: '%95 uyum',
  },
]

export function AISection({ reduceMotion }: { reduceMotion: boolean }) {
  const root = useRef<HTMLElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const inView = useSectionInView(root)
  const canvasActive = inView && !reduceMotion

  useEffect(() => {
    const el = root.current
    if (!el) return
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - r.left) / r.width) * 2 - 1
      mouseRef.current.y = ((e.clientY - r.top) / r.height) * 2 - 1
    }
    el.addEventListener('pointermove', onMove, { passive: true })
    return () => el.removeEventListener('pointermove', onMove)
  }, [])

  useEffect(() => {
    const el = root.current
    if (!el || reduceMotion) return
    gsap.fromTo(
      el.querySelectorAll('.landing-ai__reveal'),
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
    <section ref={root} className="landing-ai" id="ai">
      <div className="landing-ai__canvas" aria-hidden>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 8], fov: 50 }}
          gl={{ alpha: true }}
          frameloop={canvasActive ? 'always' : 'never'}
        >
          <Suspense fallback={null}>
            <AIScene mouseRef={mouseRef} active={canvasActive} />
          </Suspense>
        </Canvas>
      </div>
      <div className="landing-ai__content">
        <div className="landing-ai__glass landing-ai__reveal">
          <p className="landing-ai__eyebrow">Yapay Zeka Destekli</p>
          <div className="landing-ai__terminal" aria-live="polite">
            <span>{'>'} Analiz ediliyor...</span>
            <span>{'>'} Fiyat hesaplanıyor...</span>
            <span className="landing-ai__price">₺3.847</span>
            <span>{'>'} %95 uyum bulundu</span>
          </div>
        </div>
        <h2 className="landing-ai__h2 landing-ai__reveal">Yapay Zekâ Her Adımda Yanınızda</h2>
        <div className="landing-ai__cards">
          {cards.map((c) => (
            <Link key={c.title} to={c.to} className="landing-ai__card-wrap" data-cursor-hover>
              <article className="landing-ai__card landing-ai__reveal">
                <div className="landing-ai__card-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
                <span className="landing-ai__tag">{c.tag}</span>
                <span className="landing-ai__more">Detayları Gör →</span>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

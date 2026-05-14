import { useEffect, useState, type CSSProperties } from 'react'

type LandingLoaderProps = {
  onDone: () => void
}

export function LandingLoader({ onDone }: LandingLoaderProps) {
  const [pct, setPct] = useState(0)
  const [phase, setPhase] = useState<'load' | 'burst'>('load')

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 2200)
      const eased = 1 - Math.pow(1 - t, 2.2)
      setPct(Math.min(100, Math.floor(eased * 100)))
      if (t < 1) raf = requestAnimationFrame(tick)
      else {
        setPct(100)
        setPhase('burst')
        window.setTimeout(onDone, 700)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onDone])

  return (
    <div className={`landing-loader ${phase === 'burst' ? 'landing-loader--burst' : ''}`}>
      <div className="landing-loader__ring" />
      <div className="landing-loader__logo">YÜK-LE</div>
      <p className="landing-loader__label">Yükleniyor... %{pct}</p>
      {phase === 'burst' && (
        <div className="landing-loader__pixels" aria-hidden>
          {Array.from({ length: 900 }).map((_, i) => (
            <span key={i} className="landing-loader__pixel" style={{ '--d': `${(i % 37) * 12}ms` } as CSSProperties} />
          ))}
        </div>
      )}
    </div>
  )
}

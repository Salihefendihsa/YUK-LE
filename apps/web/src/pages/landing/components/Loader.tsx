import { useEffect, useMemo, useState, type CSSProperties } from 'react'

type LandingLoaderProps = {
  onDone: () => void
}

const LOGO_CHARS = ['Y', 'Ü', 'K', '-', 'L', 'E'] as const

export function LandingLoader({ onDone }: LandingLoaderProps) {
  const [pct, setPct] = useState(0)
  const [phase, setPhase] = useState<'load' | 'burst'>('load')

  const stars = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      l: `${5 + Math.random() * 90}%`,
      t: `${4 + Math.random() * 88}%`,
      d: `${(i * 97) % 3200}ms`,
    }))
  }, [])

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 2400)
      const eased = 1 - Math.pow(1 - t, 2.2)
      setPct(Math.min(100, Math.floor(eased * 100)))
      if (t < 1) raf = requestAnimationFrame(tick)
      else {
        setPct(100)
        setPhase('burst')
        window.setTimeout(onDone, 820)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onDone])

  return (
    <div className={`landing-loader ${phase === 'burst' ? 'landing-loader--burst' : ''}`}>
      <div className="landing-loader__stars" aria-hidden>
        {stars.map((s) => (
          <span key={s.id} className="landing-loader__star" style={{ left: s.l, top: s.t, animationDelay: s.d } as CSSProperties} />
        ))}
      </div>

      <div className="landing-loader__center">
        <div className="landing-loader__rings" aria-hidden>
          <div className="landing-loader__ring-wrap landing-loader__ring-wrap--outer">
            <div className="landing-loader__ring landing-loader__ring--outer" />
          </div>
          <div className="landing-loader__ring-wrap landing-loader__ring-wrap--mid">
            <div className="landing-loader__ring landing-loader__ring--mid" />
          </div>
          <div className="landing-loader__ring-wrap landing-loader__ring-wrap--inner">
            <div className="landing-loader__ring landing-loader__ring--inner" />
          </div>
        </div>

        <div className="landing-loader__logo" aria-label="YÜK-LE">
          {LOGO_CHARS.map((ch, i) => (
            <span key={`${ch}-${i}`} style={{ animationDelay: `${0.08 + i * 0.07}s` }}>
              {ch}
            </span>
          ))}
        </div>
      </div>

      <div className="landing-loader__footer">
        <p>
          <span className="landing-loader__muted">Yükleniyor… </span>
          <span className="landing-loader__pct">%{pct}</span>
        </p>
        <div className="landing-loader__bar" aria-hidden>
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>

      {phase === 'burst' ? (
        <div className="landing-loader__pixels" aria-hidden>
          {Array.from({ length: 900 }).map((_, i) => (
            <span key={i} className="landing-loader__pixel" style={{ '--d': `${(i % 37) * 12}ms` } as CSSProperties} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

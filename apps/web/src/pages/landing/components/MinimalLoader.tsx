import { useEffect, useRef, useState, useId, type CSSProperties } from 'react'

type MinimalLoaderProps = {
  onComplete: () => void
  onProgress?: (progress: number) => void
  duration?: number
}

type LoaderPhase = 'loading' | 'reveal' | 'exiting'

const RADIUS = 70

export function MinimalLoader({ onComplete, onProgress, duration = 2500 }: MinimalLoaderProps) {
  const uid = useId().replace(/:/g, '')
  const gradId = `circleGrad-${uid}`
  const glowId = `circleGlow-${uid}`

  const onProgressRef = useRef(onProgress)
  onProgressRef.current = onProgress

  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<LoaderPhase>('loading')
  const rafRef = useRef(0)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phaseRef = useRef<LoaderPhase>('loading')

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      onProgressRef.current?.(100)
      const t = window.setTimeout(() => onComplete(), 200)
      return () => window.clearTimeout(t)
    }

    phaseRef.current = 'loading'

    const startTime = Date.now()
    const loadDuration = duration - 500

    const tick = () => {
      const elapsed = Date.now() - startTime

      if (elapsed < loadDuration) {
        const t = elapsed / loadDuration
        const eased = 1 - Math.pow(1 - t, 3)
        const p = eased * 100
        setProgress(p)
        onProgressRef.current?.(p)
        rafRef.current = requestAnimationFrame(tick)
      } else if (elapsed < duration) {
        setProgress(100)
        onProgressRef.current?.(100)
        if (phaseRef.current === 'loading') {
          phaseRef.current = 'reveal'
          setPhase('reveal')
        }
        rafRef.current = requestAnimationFrame(tick)
      } else if (phaseRef.current !== 'exiting') {
        phaseRef.current = 'exiting'
        setPhase('exiting')
        exitTimerRef.current = window.setTimeout(() => onComplete(), 300)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current)
    }
  }, [duration, onComplete])

  const panelOpacity =
    phase === 'exiting'
      ? 0
      : progress < 80
        ? 1
        : Math.max(1 - ((progress - 80) / 20) * 0.7, 0.3)

  const auroraBoost = progress < 80 ? 1 : 1 + ((progress - 80) / 20) * 0.5

  const rootStyle = {
    ['--loader-panel-opacity' as string]: String(panelOpacity),
    ['--loader-aurora-boost' as string]: String(auroraBoost),
  } as CSSProperties

  const circumference = 2 * Math.PI * RADIUS
  const offset = circumference - (progress / 100) * circumference
  const arcAngle = (-Math.PI / 2) + (Math.min(progress, 100) / 100) * Math.PI * 2
  const dotCx = 90 + RADIUS * Math.cos(arcAngle)
  const dotCy = 90 + RADIUS * Math.sin(arcAngle)

  const pct = Math.floor(progress)

  return (
    <div
      className={`circle-loader circle-loader--${phase}`}
      style={rootStyle}
      data-progress-late={progress >= 80 && phase === 'loading' ? 'true' : 'false'}
    >
      <div className="circle-loader-bg" aria-hidden />
      <div className="circle-loader-vignette" aria-hidden />
      <div className="circle-loader-content">
        <div className="circle-loader-spinner">
          <svg
            className={phase === 'loading' ? 'circle-loader-spinner-svg' : undefined}
            width="180"
            height="180"
            viewBox="0 0 180 180"
            aria-hidden
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B00" />
                <stop offset="50%" stopColor="#FFB627" />
                <stop offset="100%" stopColor="#FF6B00" />
              </linearGradient>
              <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle
              cx="90"
              cy="90"
              r={RADIUS}
              fill="none"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="2"
            />
            <circle
              cx="90"
              cy="90"
              r={RADIUS}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 90 90)"
              filter={`url(#${glowId})`}
              className="circle-loader-arc"
            />
            {progress > 0 && progress < 100 ? (
              <circle
                cx={dotCx}
                cy={dotCy}
                r="4"
                fill="#FFB627"
                style={{ filter: 'drop-shadow(0 0 6px #FF6B00)' }}
              />
            ) : null}
          </svg>
          <div className="circle-loader-wordmark">
            <span className="circle-loader-dot" aria-hidden />
            <span className="circle-loader-text">YÜK-LE</span>
          </div>
        </div>
        <div className="circle-loader-status">
          <span>YUKLENIYOR</span>
          <span className="circle-loader-status-sep" aria-hidden>
            ·
          </span>
          <span className="circle-loader-status-pct">%{pct}</span>
        </div>
      </div>
    </div>
  )
}

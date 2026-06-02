import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Logo } from '@/components/brand/Logo'

type MinimalLoaderProps = {
  onComplete: () => void
  onProgress?: (progress: number) => void
  duration?: number
}

type LoaderPhase = 'loading' | 'reveal' | 'exiting'

export function MinimalLoader({ onComplete, onProgress, duration = 1200 }: MinimalLoaderProps) {
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

  const pct = Math.floor(progress)

  return (
    <div
      className={`circle-loader circle-loader--${phase}`}
      style={rootStyle}
      data-progress-late={progress >= 80 && phase === 'loading' ? 'true' : 'false'}
      aria-busy="true"
      aria-live="polite"
      aria-label="Yükleniyor"
    >
      <div className="circle-loader-bg" aria-hidden />
      <div className="circle-loader-vignette" aria-hidden />
      <div className="circle-loader-content">
        <div className="circle-loader-brand">
          <Logo variant="full" size="md" theme="dark" fadeIn />
        </div>
        <div
          className="circle-loader-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Yükleme ilerlemesi"
        >
          <span
            className="circle-loader-progress-fill"
            style={{ transform: `scaleX(${Math.min(Math.max(progress, 0), 100) / 100})` } as CSSProperties}
          />
        </div>
        <div className="circle-loader-status">
          <span>YÜKLENİYOR</span>
          <span className="circle-loader-status-pct">%{pct}</span>
        </div>
      </div>
    </div>
  )
}

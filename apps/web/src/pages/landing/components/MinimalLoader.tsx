import { useEffect, useRef, useState } from 'react'

type MinimalLoaderProps = {
  onComplete: () => void
  minDuration?: number
}

export function MinimalLoader({ onComplete, minDuration = 800 }: MinimalLoaderProps) {
  const [progress, setProgress] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const rafRef = useRef<number>(0)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      const t = window.setTimeout(() => onComplete(), 200)
      return () => window.clearTimeout(t)
    }

    const startTime = Date.now()

    const tick = () => {
      const elapsed = Date.now() - startTime
      const t = Math.min(elapsed / minDuration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(eased * 100)

      if (elapsed >= minDuration) {
        setProgress(100)
        setIsExiting(true)
        exitTimerRef.current = window.setTimeout(() => onComplete(), 400)
      } else {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current)
    }
  }, [minDuration, onComplete])

  const pct = Math.round(progress)

  return (
    <div className={`minimal-loader ${isExiting ? 'minimal-loader--exiting' : ''}`}>
      <div className="minimal-loader-overlay" aria-hidden />
      <div className="minimal-loader-content">
        <div className="minimal-loader-logo">
          <span className="minimal-loader-dot" aria-hidden />
          <span className="minimal-loader-wordmark">YÜK-LE</span>
        </div>
        <div className="minimal-loader-bar">
          <div className="minimal-loader-bar-fill" style={{ width: `${progress}%` }} />
          <div className="minimal-loader-bar-shimmer" aria-hidden />
        </div>
        <div className="minimal-loader-status">
          Yükleniyor<span aria-hidden> · </span>
          <span className="minimal-loader-status-pct">{pct}%</span>
        </div>
      </div>
    </div>
  )
}

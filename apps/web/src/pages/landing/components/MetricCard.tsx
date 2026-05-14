import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion'

export type MetricCardProps = {
  label: string
  target: number
  decimals?: number
  suffix: string
  trend: string
  icon: ReactNode
  showLiveDot?: boolean
  reduceMotion: boolean
}

export function MetricCard({
  label,
  target,
  decimals = 0,
  suffix,
  trend,
  icon,
  showLiveDot,
  reduceMotion,
}: MetricCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const count = useMotionValue(0)
  const formatted = useTransform(count, (v) => (decimals > 0 ? v.toFixed(decimals) : String(Math.round(v))))
  const [text, setText] = useState(decimals > 0 ? '0.0' : '0')

  useMotionValueEvent(formatted, 'change', (latest) => {
    setText(latest)
  })

  useEffect(() => {
    if (!isInView) return
    if (reduceMotion) {
      count.set(target)
      setText(decimals > 0 ? target.toFixed(decimals) : String(Math.round(target)))
      return
    }
    const c = animate(count, target, { duration: 2, ease: [0.22, 1, 0.36, 1] })
    return () => c.stop()
  }, [isInView, target, count, reduceMotion, decimals])

  return (
    <div ref={ref} className="metric-card">
      <div className="metric-card-header">
        <span className="metric-card-header-label">
          {showLiveDot ? <span className="metric-live-dot" aria-hidden /> : null}
          {label}
        </span>
        <div className="metric-card-icon" aria-hidden>
          {icon}
        </div>
      </div>
      <div className="metric-card-value">
        <span>{text}</span>
        {suffix ? <span className="metric-card-suffix">{suffix}</span> : null}
      </div>
      <p className="metric-card-trend">{trend}</p>
    </div>
  )
}

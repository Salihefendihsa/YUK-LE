import { useEffect, useRef } from 'react'

type CinematicLoaderProps = {
  onComplete: () => void
  /** Fired once at ~1.8s when particles explode — sync Hero pixel-reveal under the loader. */
  onRevealHero?: () => void
}

type Particle = {
  birthX: number
  birthY: number
  targetX: number
  targetY: number
  x: number
  y: number
  baseSize: number
  size: number
  opacity: number
  color: string
  driftA: number
  driftB: number
  explodeAngle: number
  explodeDist: number
}

const PARTICLE_COUNT = 400
const LOGO_TEXT = 'YÜK-LE'
const TOTAL_MS = 2500

const TIMING = {
  scatterEnd: 300,
  convergeEnd: 1500,
  holdEnd: 1800,
  explodeEnd: 2500,
} as const

/** Easing similar to cubic-bezier(0.22, 1, 0.36, 1) — strong ease-out */
function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutQuint(t: number) {
  return 1 - Math.pow(1 - t, 5)
}

function getTextPixels(width: number, height: number): Array<{ x: number; y: number }> {
  const offscreen = document.createElement('canvas')
  offscreen.width = width
  offscreen.height = height
  const ctx = offscreen.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []

  const fontSize = Math.min(width * 0.18, 200)
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = `${-fontSize * 0.04}px`
  ctx.fillText(LOGO_TEXT, width / 2, height / 2)

  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels: Array<{ x: number; y: number }> = []
  const sampleStep = Math.max(3, Math.floor(Math.min(width, height) / 180))

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const idx = (y * width + x) * 4
      const alpha = imageData.data[idx + 3]
      if (alpha > 128) pixels.push({ x, y })
    }
  }

  for (let i = pixels.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pixels[i], pixels[j]] = [pixels[j], pixels[i]]
  }
  return pixels
}

function initParticles(width: number, height: number): Particle[] {
  const textPixels = getTextPixels(width, height)
  if (textPixels.length === 0) return []

  const cx = width / 2
  const cy = height / 2
  const particles: Particle[] = []

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const target = textPixels[i % textPixels.length]
    const baseSize = 1 + Math.random() * 1.5
    const startAngle = Math.random() * Math.PI * 2
    const startRadius = Math.max(width, height) * (0.32 + Math.random() * 0.38)
    const birthX = cx + Math.cos(startAngle) * startRadius
    const birthY = cy + Math.sin(startAngle) * startRadius

    const toCenter = Math.atan2(target.y - cy, target.x - cx)
    const explodeAngle = toCenter + (Math.random() - 0.5) * 0.55
    const explodeDist = Math.max(width, height) * (0.45 + Math.random() * 0.35)

    particles.push({
      birthX,
      birthY,
      targetX: target.x,
      targetY: target.y,
      x: birthX,
      y: birthY,
      baseSize,
      size: baseSize,
      opacity: 0,
      color: i % 5 === 0 ? '#FFB627' : '#FF6B00',
      driftA: Math.random() * Math.PI * 2,
      driftB: Math.random() * Math.PI * 2,
      explodeAngle,
      explodeDist,
    })
  }
  return particles
}

export function CinematicLoader({ onComplete, onRevealHero }: CinematicLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)
  const doneRef = useRef(false)
  const revealHeroFiredRef = useRef(false)
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      const t = window.setTimeout(() => onComplete(), 80)
      return () => {
        window.clearTimeout(t)
      }
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let logicalW = window.innerWidth
    let logicalH = window.innerHeight

    const resize = () => {
      logicalW = window.innerWidth
      logicalH = window.innerHeight
      canvas.width = Math.floor(logicalW * dpr)
      canvas.height = Math.floor(logicalH * dpr)
      canvas.style.width = `${logicalW}px`
      canvas.style.height = `${logicalH}px`
    }
    resize()

    particlesRef.current = initParticles(logicalW, logicalH)
    if (particlesRef.current.length === 0) {
      onRevealHero?.()
      onComplete()
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      onRevealHero?.()
      onComplete()
      return
    }

    const finish = () => {
      if (doneRef.current) return
      doneRef.current = true
      wrapRef.current?.classList.add('cinematic-loader--exiting')
      finishTimerRef.current = window.setTimeout(() => onComplete(), 400)
    }

    const animate = (timestamp: number) => {
      if (doneRef.current) return
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current

      if (!revealHeroFiredRef.current && elapsed >= TIMING.holdEnd) {
        revealHeroFiredRef.current = true
        wrapRef.current?.classList.add('cinematic-loader--bleed')
        onRevealHero?.()
      }

      const progressPct = Math.min((elapsed / TOTAL_MS) * 100, 100)
      if (progressRef.current) progressRef.current.style.width = `${progressPct}%`

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const trailA = elapsed >= TIMING.holdEnd ? 0.12 : 0.22
      ctx.fillStyle = `rgba(5, 6, 8, ${trailA})`
      ctx.fillRect(0, 0, logicalW, logicalH)

      const particles = particlesRef.current
      const scatterDur = TIMING.scatterEnd
      const convergeDur = TIMING.convergeEnd - TIMING.scatterEnd
      const explodeDur = TIMING.explodeEnd - TIMING.holdEnd

      for (const p of particles) {
        if (elapsed < scatterDur) {
          const t = elapsed / scatterDur
          const wobble = 14 * easeInOutCubic(t)
          p.x = p.birthX + Math.sin(p.driftA + t * 4.2) * wobble * 0.35
          p.y = p.birthY + Math.cos(p.driftB + t * 3.6) * wobble * 0.35
          p.opacity = Math.min(t * 1.25, 1)
          p.size = p.baseSize * (0.85 + t * 0.15)
        } else if (elapsed < TIMING.convergeEnd) {
          const localT = (elapsed - scatterDur) / convergeDur
          const eased = easeOutExpo(localT)
          p.x = p.birthX + (p.targetX - p.birthX) * eased
          p.y = p.birthY + (p.targetY - p.birthY) * eased
          const dx = p.targetX - p.x
          const dy = p.targetY - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          p.size = p.baseSize + (1 - Math.min(dist / 220, 1)) * 1.6
          p.opacity = 1
        } else if (elapsed < TIMING.holdEnd) {
          const holdDur = TIMING.holdEnd - TIMING.convergeEnd
          const ht = (elapsed - TIMING.convergeEnd) / holdDur
          const breath = Math.sin(ht * Math.PI) * 0.45
          p.x = p.targetX
          p.y = p.targetY
          p.size = p.baseSize + 1 + breath
          p.opacity = 1
        } else {
          const localT = Math.min((elapsed - TIMING.holdEnd) / explodeDur, 1)
          const eased = easeOutQuint(localT)
          const burst = eased * p.explodeDist
          p.x = p.targetX + Math.cos(p.explodeAngle) * burst
          p.y = p.targetY + Math.sin(p.explodeAngle) * burst - eased * 110
          p.opacity = Math.max(0, 1 - eased * 1.05)
          p.size = p.baseSize * (1 + eased * 2.2)
        }

        ctx.save()
        ctx.globalAlpha = p.opacity
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.2)
        g.addColorStop(0, p.color)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      if (elapsed < TOTAL_MS) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        cancelAnimationFrame(rafRef.current)
        finish()
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current)
    }
  }, [onComplete, onRevealHero])

  return (
    <div ref={wrapRef} className="cinematic-loader">
      <canvas ref={canvasRef} className="cinematic-loader-canvas" aria-hidden />
      <div className="cinematic-loader-progress">
        <div className="cinematic-loader-progress-bar">
          <div ref={progressRef} className="cinematic-loader-progress-fill" style={{ width: '0%' }} />
        </div>
      </div>
    </div>
  )
}

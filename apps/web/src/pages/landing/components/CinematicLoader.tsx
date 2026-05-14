import { useEffect, useRef } from 'react'

type CinematicLoaderProps = {
  onComplete: () => void
  /** Fired once when dissolve ends (~2.2s) — Hero pixel-reveal + loader bleed. */
  onRevealHero?: () => void
}

type Particle = {
  x: number
  y: number
  targetX: number
  targetY: number
  scatterX: number
  scatterY: number
  baseSize: number
  size: number
  opacity: number
  color: string
}

const PARTICLE_COUNT = 400
const LOGO_TEXT = 'YÜK-LE'
const TOTAL_MS = 3000

const TIMING = {
  revealEnd: 500,
  holdEnd: 1400,
  dissolveEnd: 2200,
  fadeoutEnd: 3000,
} as const

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

  const particles: Particle[] = []

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const target = textPixels[i % textPixels.length]
    const baseSize = 1 + Math.random() * 1.5
    const scatterAngle = Math.random() * Math.PI * 2
    const scatterDistance = Math.max(width, height) * (0.4 + Math.random() * 0.5)

    const scatterX = target.x + Math.cos(scatterAngle) * scatterDistance
    const scatterY = target.y + Math.sin(scatterAngle) * scatterDistance - 80

    particles.push({
      x: target.x,
      y: target.y,
      targetX: target.x,
      targetY: target.y,
      scatterX,
      scatterY,
      baseSize,
      size: baseSize,
      opacity: 0,
      color: i % 5 === 0 ? '#FFB627' : '#FF6B00',
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

    const revealDur = TIMING.revealEnd
    const holdDur = TIMING.holdEnd - TIMING.revealEnd
    const dissolveDur = TIMING.dissolveEnd - TIMING.holdEnd
    const fadeoutDur = TIMING.fadeoutEnd - TIMING.dissolveEnd

    const animate = (timestamp: number) => {
      if (doneRef.current) return
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current

      if (!revealHeroFiredRef.current && elapsed >= TIMING.dissolveEnd) {
        revealHeroFiredRef.current = true
        wrapRef.current?.classList.add('cinematic-loader--bleed')
        onRevealHero?.()
      }

      const progressPct = Math.min((elapsed / TOTAL_MS) * 100, 100)
      if (progressRef.current) progressRef.current.style.width = `${progressPct}%`

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const pastDissolve = elapsed >= TIMING.dissolveEnd
      if (pastDissolve) {
        ctx.fillStyle = 'rgba(5, 6, 8, 0.14)'
      } else {
        ctx.fillStyle = '#050608'
      }
      ctx.fillRect(0, 0, logicalW, logicalH)

      const particles = particlesRef.current

      for (let pi = 0; pi < particles.length; pi++) {
        const p = particles[pi]

        if (elapsed < TIMING.revealEnd) {
          const t = elapsed / revealDur
          const staggerDelay = ((pi % 20) / 20) * 0.3
          const denom = Math.max(1 - staggerDelay, 0.06)
          const localT = t <= staggerDelay ? 0 : Math.min(1, (t - staggerDelay) / denom)
          const eased = easeOutQuint(localT)

          p.x = p.targetX
          p.y = p.targetY
          p.opacity = Math.min(eased * 1.2, 1)
          p.size = p.baseSize + eased * 1.2
        } else if (elapsed < TIMING.holdEnd) {
          const localT = (elapsed - TIMING.revealEnd) / holdDur
          const breath = Math.sin(localT * Math.PI * 2) * 0.4
          const shimmerT = (elapsed - TIMING.revealEnd) * 0.003
          const shimmerWave = Math.sin(p.targetX * 0.02 + shimmerT) * 0.5 + 0.5

          p.x = p.targetX
          p.y = p.targetY
          p.size = p.baseSize + 1 + breath
          p.opacity = 0.7 + shimmerWave * 0.3
        } else if (elapsed < TIMING.dissolveEnd) {
          const localT = (elapsed - TIMING.holdEnd) / dissolveDur
          const eased = easeOutQuint(localT)

          p.x = p.targetX + (p.scatterX - p.targetX) * eased
          p.y = p.targetY + (p.scatterY - p.targetY) * eased
          p.opacity = 1 - eased * 0.7
          p.size = p.baseSize + (1 - eased * 0.3) + 0.5
        } else {
          const localT = Math.min((elapsed - TIMING.dissolveEnd) / fadeoutDur, 1)
          const eased = easeOutQuint(localT)
          const dx = p.scatterX - p.targetX
          const dy = p.scatterY - p.targetY

          p.x = p.scatterX + dx * eased * 0.3
          p.y = p.scatterY + dy * eased * 0.3
          p.opacity = 0.3 * (1 - eased)
          p.size = p.baseSize * (1 + eased * 1.5)
        }

        if (p.opacity <= 0.01) continue

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

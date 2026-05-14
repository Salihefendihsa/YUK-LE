import { useEffect, useRef, useState } from 'react'
import createGlobe, { type Arc, type Marker } from 'cobe'

const HUB: [number, number] = [39.0, 35.5]

const TURKEY_MARKERS: Marker[] = [
  { location: HUB, size: 0.15 },
  { location: [41.0082, 28.9784], size: 0.1 },
  { location: [39.9334, 32.8597], size: 0.08 },
  { location: [38.4192, 27.1287], size: 0.07 },
  { location: [52.52, 13.405], size: 0.06 },
  { location: [51.507, -0.128], size: 0.06 },
  { location: [41.902, 12.496], size: 0.06 },
  { location: [40.713, -74.006], size: 0.07 },
  { location: [34.052, -118.244], size: 0.06 },
  { location: [25.205, 55.27], size: 0.06 },
  { location: [1.352, 103.819], size: 0.05 },
  { location: [35.676, 139.65], size: 0.06 },
  { location: [-33.868, 151.209], size: 0.05 },
  { location: [-23.55, -46.633], size: 0.05 },
]

const GLOBAL_ARCS: Arc[] = [
  { from: HUB, to: [52.52, 13.405], color: [1, 0.44, 0.12] },
  { from: HUB, to: [51.5074, -0.1278], color: [1, 0.42, 0.1] },
  { from: HUB, to: [41.9028, 12.4964], color: [1, 0.43, 0.11] },
  { from: HUB, to: [40.7128, -74.006], color: [1, 0.45, 0.12] },
  { from: HUB, to: [34.0522, -118.2437], color: [1, 0.46, 0.13] },
  { from: HUB, to: [25.2048, 55.2708], color: [1, 0.48, 0.14] },
  { from: HUB, to: [1.3521, 103.8198], color: [1, 0.44, 0.11] },
  { from: HUB, to: [35.6762, 139.6503], color: [1, 0.43, 0.1] },
  { from: HUB, to: [-33.8688, 151.2093], color: [1, 0.46, 0.13] },
  { from: HUB, to: [-23.5505, -46.6333], color: [1, 0.42, 0.1] },
]

type Props = {
  reduceMotion?: boolean
}

export function NetworkGlobe({ reduceMotion = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const phiRef = useRef(-0.62)
  const draggingRef = useRef(false)
  const lastXRef = useRef(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => setWidth(el.offsetWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      ro.disconnect()
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || width === 0) return

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const buf = width * 2

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: buf,
      height: buf,
      phi: phiRef.current,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.2, 0.2, 0.25],
      markerColor: [1, 0.42, 0],
      glowColor: [1, 0.5, 0.1],
      markers: TURKEY_MARKERS,
      arcs: GLOBAL_ARCS,
      arcColor: [1, 0.45, 0.15],
      arcWidth: 1.2,
      arcHeight: 0.25,
      offset: [0, 0],
    })

    let raf = 0
    let cancelled = false

    const frame = () => {
      if (cancelled) return
      if (!draggingRef.current && !reduceMotion) {
        phiRef.current += 0.0025
      }
      globe.update({
        phi: phiRef.current,
        width: buf,
        height: buf,
      })
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const fade = window.setTimeout(() => {
      canvas.style.opacity = '1'
    }, 100)

    const onPointerDown = (e: PointerEvent) => {
      draggingRef.current = true
      lastXRef.current = e.clientX
      canvas.setPointerCapture(e.pointerId)
      canvas.style.cursor = 'grabbing'
    }

    const onPointerUp = (e: PointerEvent) => {
      draggingRef.current = false
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      canvas.style.cursor = 'pointer'
    }

    const onPointerLeave = () => {
      draggingRef.current = false
      canvas.style.cursor = 'pointer'
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return
      const delta = e.clientX - lastXRef.current
      lastXRef.current = e.clientX
      phiRef.current += delta * 0.005
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerLeave)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.clearTimeout(fade)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      globe.destroy()
      canvas.style.opacity = '0'
    }
  }, [width, reduceMotion])

  return (
    <div ref={containerRef} className="globe-container">
      <div className="globe-canvas-stack">
        <div className="globe-ambient" aria-hidden />
        <div className="globe-spotlight" aria-hidden />
        <canvas
          ref={canvasRef}
          className="globe-canvas"
          style={{
            contain: 'layout paint size',
            opacity: 0,
            transition: 'opacity 1s ease',
            cursor: 'pointer',
          }}
        />
        <p className="globe-hint">Ülkeler aşağıdan seçilir · sürükleyerek döndür</p>
      </div>
    </div>
  )
}

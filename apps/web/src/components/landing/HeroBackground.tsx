import { useEffect, useRef, useState } from 'react'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

export function HeroBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [usePosterOnly, setUsePosterOnly] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION)

    const apply = () => {
      const reduced = mq.matches
      setUsePosterOnly(reduced)
      const video = videoRef.current
      if (!video) return
      if (reduced) {
        video.pause()
      } else {
        void video.play().catch(() => {})
      }
    }

    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return (
    <div className="lm-hero-bg" aria-hidden>
      {!usePosterOnly ? (
        <video
          ref={videoRef}
          src="/hero-trucks.mp4"
          poster="/hero-trucks.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <img src="/hero-trucks.jpg" alt="" />
      )}

      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.22) 60%, transparent 100%),
            linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)
          `,
        }}
      />

      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 240,
          height: 70,
          zIndex: 10,
          background:
            'radial-gradient(ellipse at 100% 100%, rgba(0,0,0,0.92) 0%, transparent 72%)',
        }}
      />

      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          right: 20,
          bottom: 16,
          zIndex: 11,
          fontSize: 11,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: '0.08em',
        }}
      >
        © 2026 Navlonix
      </div>
    </div>
  )
}

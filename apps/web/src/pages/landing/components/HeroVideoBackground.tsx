import { useEffect, useRef, useState } from 'react'
import { Logo } from '@/components/brand/Logo'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

export function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [usePosterOnly, setUsePosterOnly] = useState(false)

  useEffect(() => {
    const motionMq = window.matchMedia(REDUCED_MOTION)

    const apply = () => {
      const posterOnly = motionMq.matches
      setUsePosterOnly(posterOnly)
      const video = videoRef.current
      if (!video) return
      if (posterOnly) {
        video.pause()
      } else {
        void video.play().catch(() => {})
      }
    }

    apply()
    motionMq.addEventListener('change', apply)
    return () => {
      motionMq.removeEventListener('change', apply)
    }
  }, [])

  return (
    <div className="hero-video-bg" aria-hidden>
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
      <div className="hero-video-scrim" />
      <div className="hero-video-brand-watermark" aria-hidden>
        <Logo variant="full" size="sm" theme="dark" />
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

export function HeroVideoBackground() {
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
    </div>
  )
}

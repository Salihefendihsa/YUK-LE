"use client";

import { useEffect, useRef, useState } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

export function HeroBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [usePosterOnly, setUsePosterOnly] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION);

    const apply = () => {
      const reduced = mq.matches;
      setUsePosterOnly(reduced);
      const video = videoRef.current;
      if (!video) return;
      if (reduced) {
        video.pause();
      } else {
        void video.play().catch(() => {
          /* autoplay blocked — poster remains visible */
        });
      }
    };

    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[var(--bg-page)]" aria-hidden>
      {!usePosterOnly ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute" }}
          src="/hero-trucks.mp4"
          poster="/hero-trucks.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/hero-trucks.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute" }}
        />
      )}

      {/* Ana scrim — sol ve alt (video gorunur, metin okunur) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.22) 60%, transparent 100%),
            linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)
          `,
        }}
      />

      {/* Watermark örtme — sağ alt */}
      <div
        className="pointer-events-none absolute right-0 bottom-0"
        style={{
          width: 220,
          height: 70,
          background:
            "radial-gradient(ellipse at bottom right, rgba(0,0,0,0.92) 0%, transparent 75%)",
        }}
      />
    </div>
  );
}

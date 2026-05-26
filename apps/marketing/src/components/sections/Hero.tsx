"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import { useHeroParallax } from "@/hooks/useHeroParallax";
import { useMagneticHover } from "@/hooks/useMagneticHover";
import { HeroBackground } from "./HeroBackground";

registerGsapPlugins();
gsap.registerPlugin(useGSAP);

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const HERO_FROM = {
  opacity: 0,
  y: 24,
  filter: "blur(12px)",
};

const HERO_TO = {
  opacity: 1,
  y: 0,
  filter: "blur(0px)",
  duration: 0.65,
  ease: "power3.out",
};

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="transition-transform duration-300 group-hover:translate-x-0.5"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScrollCue() {
  return (
    <a
      href="#yolculuk"
      className="hero-scroll-cue absolute bottom-8 left-1/2 z-20 -translate-x-1/2 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
      aria-label="Aşağı kaydır"
    >
      <span className="text-[0.625rem] font-semibold tracking-[0.24em] uppercase">
        Aşağı kaydır
      </span>
      <span className="hero-scroll-cue__chevron flex flex-col items-center" aria-hidden>
        <span className="hero-scroll-cue__line" />
        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" className="mt-1 text-brand-500/80">
          <path
            d="M1 1l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </a>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoParallaxRef = useRef<HTMLDivElement>(null);
  const eyebrowParallaxRef = useRef<HTMLDivElement>(null);
  const contentParallaxRef = useRef<HTMLDivElement>(null);
  const primaryCtaWrapRef = useRef<HTMLDivElement>(null);

  useHeroParallax(sectionRef, [
    { ref: videoParallaxRef, max: 6, factor: 0.32 },
    { ref: eyebrowParallaxRef, max: 10, factor: 0.92 },
    { ref: contentParallaxRef, max: 10, factor: 1 },
  ]);

  useMagneticHover(primaryCtaWrapRef, 0.2);

  useGSAP(() => {
    const reducedMotion = window.matchMedia(REDUCED_MOTION).matches;
    const animated = gsap.utils.toArray<HTMLElement>("[data-hero-animate]");

    if (!animated.length) return;

    if (reducedMotion) {
      gsap.set(animated, { opacity: 1, y: 0, filter: "blur(0px)", clearProps: "filter" });
      return;
    }

    gsap.set(animated, HERO_FROM);

    animated.forEach((el) => {
      const delay = Number.parseFloat(el.dataset.heroDelay ?? "0") || 0;
      gsap.to(el, { ...HERO_TO, delay });
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="section-rhythm-a relative flex min-h-[100dvh] flex-col justify-center overflow-hidden pt-[4.25rem]"
    >
      <div ref={videoParallaxRef} className="absolute inset-0 z-0 will-change-transform">
        <HeroBackground />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 py-16 lg:px-8">
        <div className="flex max-w-2xl flex-col">
          <div
            ref={eyebrowParallaxRef}
            data-hero-animate
            data-hero-delay="0.4"
            className="liquid-glass mb-8 inline-flex w-fit items-center gap-2.5 rounded-full px-4 py-2 text-[0.6875rem] font-bold tracking-[0.16em] text-neutral-200 uppercase will-change-transform"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="hero-eyebrow-dot inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            TR&apos;nin ilk AI lojistiği
          </div>

          <div ref={contentParallaxRef} className="will-change-transform">
            <h1 className="font-display text-[clamp(2.75rem,7vw,5rem)] leading-[1.05] font-extrabold tracking-[-0.03em]">
              <span
                data-hero-animate
                data-hero-delay="0.55"
                className="block text-white"
              >
                Yükünüz GÜVENDE,
              </span>
              <span
                data-hero-animate
                data-hero-delay="0.68"
                className="mt-1 block text-white"
              >
                Yolunuz{" "}
                <span className="text-brand-500">AÇIK</span>.
              </span>
            </h1>

            <p
              data-hero-animate
              data-hero-delay="0.82"
              className="mt-6 max-w-lg text-[1.1rem] leading-relaxed text-neutral-300"
            >
              Saniyeler içinde eşleş. Akıllıca taşı. Güvenle teslim al.
            </p>

            <div
              data-hero-animate
              data-hero-delay="0.95"
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <div ref={primaryCtaWrapRef} className="inline-flex will-change-transform">
                <Link
                  href="/register"
                  className="hero-cta-primary group inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-full bg-brand-500 px-8 text-base font-semibold text-white hover:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  Hemen Başla
                  <ArrowIcon />
                </Link>
              </div>
              <Link
                href="#demo"
                className="liquid-glass liquid-glass-hover inline-flex h-[3.25rem] items-center justify-center rounded-full px-8 text-base font-semibold text-neutral-100 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
              >
                Demo Talep Et
              </Link>
            </div>

            <div
              data-hero-animate
              data-hero-delay="1.1"
              className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-neutral-400"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-2" aria-hidden>
                  {["M", "A", "Z", "F"].map((initial) => (
                    <span
                      key={initial}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-neutral-900/80 text-xs font-semibold text-neutral-200"
                    >
                      {initial}
                    </span>
                  ))}
                </div>
                <span>
                  <strong className="text-neutral-200">2.847</strong> fabrika
                </span>
              </div>
              <span className="text-neutral-500" aria-hidden>
                ·
              </span>
              <span>
                ★ <strong className="text-neutral-200">4.9</strong>
              </span>
              <span className="text-neutral-500" aria-hidden>
                ·
              </span>
              <span>
                <strong className="text-neutral-200">247</strong> aktif sefer
              </span>
              <span className="w-full text-xs text-neutral-500 sm:w-auto">
                (örnek veri)
              </span>
            </div>
          </div>
        </div>
      </div>

      <ScrollCue />
    </section>
  );
}

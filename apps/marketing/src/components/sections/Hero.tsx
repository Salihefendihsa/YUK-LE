"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsapPlugins } from "@/lib/gsap";

registerGsapPlugins();
gsap.registerPlugin(useGSAP);

const DESKTOP_BREAKPOINT = "(min-width: 1024px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

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

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-sm">
      <p className="text-xs text-neutral-400">{label}</p>
      <p
        className={`mt-1 font-display text-lg font-bold ${accent ? "text-brand-400" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia(REDUCED_MOTION).matches;
      const isDesktop = window.matchMedia(DESKTOP_BREAKPOINT).matches;

      const revealItems =
        contentRef.current?.querySelectorAll("[data-hero-reveal]");

      if (revealItems?.length && !reducedMotion) {
        gsap.fromTo(
          revealItems,
          { autoAlpha: 0, y: 36 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.95,
            stagger: 0.11,
            ease: "power3.out",
            delay: 0.12,
          },
        );
      } else if (revealItems?.length) {
        gsap.set(revealItems, { autoAlpha: 1, y: 0 });
      }

      if (reducedMotion || !isDesktop) return;

      if (visualRef.current && sectionRef.current) {
        gsap.to(visualRef.current, {
          yPercent: 14,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
          },
        });
      }

      if (glowRef.current && sectionRef.current) {
        gsap.to(glowRef.current, {
          yPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.4,
          },
        });
      }
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-[100dvh] overflow-hidden bg-neutral-950 pt-24 pb-16 md:pt-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
      />

      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-[120px] will-change-transform"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-12 px-5 lg:flex-row lg:items-center lg:gap-16 lg:px-8">
        <div ref={contentRef} className="flex max-w-2xl flex-1 flex-col">
          <div
            data-hero-reveal
            className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-[0.14em] text-neutral-300 uppercase backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            TR&apos;nin ilk AI lojistiği
          </div>

          <h1
            data-hero-reveal
            className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-white"
          >
            Yükünüz{" "}
            <span className="bg-linear-to-r from-white to-neutral-400 bg-clip-text text-transparent">
              güvende
            </span>
            ,
            <br />
            yolunuz{" "}
            <span className="bg-linear-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
              açık
            </span>
            .
          </h1>

          <p
            data-hero-reveal
            className="mt-6 max-w-xl text-base leading-relaxed text-neutral-300 md:text-lg"
          >
            Fabrikalar ile belgeli tır şoförlerini saniyeler içinde buluşturan
            yapay zeka destekli lojistik pazaryeri. Eşleş, taşı, güvenle teslim
            al.
          </p>

          <div
            data-hero-reveal
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link
              href="/register"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-sm font-semibold text-white transition-[transform,opacity,background-color] duration-300 hover:bg-brand-400 active:scale-[0.98]"
            >
              Hemen Başla
              <ArrowIcon />
            </Link>
            <Link
              href="#features"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold text-neutral-200 transition-[transform,opacity,background-color] duration-300 hover:border-white/30 hover:bg-white/5 active:scale-[0.98]"
            >
              Nasıl Çalışır?
            </Link>
          </div>

          <div
            data-hero-reveal
            className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-neutral-400"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["M", "A", "Z", "F"].map((initial) => (
                  <span
                    key={initial}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800 bg-neutral-800 text-xs font-semibold text-neutral-200"
                  >
                    {initial}
                  </span>
                ))}
              </div>
              <span>
                <strong className="text-neutral-200">2.847</strong> fabrika
              </span>
            </div>
            <span
              className="hidden h-4 w-px bg-neutral-700 sm:block"
              aria-hidden
            />
            <span className="text-neutral-300">
              ★ <strong className="text-neutral-100">4.9</strong> ortalama puan
            </span>
            <span
              className="hidden h-4 w-px bg-neutral-700 sm:block"
              aria-hidden
            />
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success-500" aria-hidden />
              <strong className="text-neutral-200">247</strong> aktif sefer
            </span>
          </div>
        </div>

        <div
          ref={visualRef}
          className="relative flex flex-1 items-center justify-center will-change-transform lg:justify-end"
        >
          <div className="relative aspect-4/5 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-[0_24px_80px_rgba(0,0,0,0.45)] lg:max-w-lg">
            <div className="absolute inset-0 bg-linear-to-br from-brand-500/25 via-transparent to-ai-500/20" />

            <div className="relative flex h-full flex-col justify-between p-6 md:p-8">
              <div>
                <p className="text-xs font-medium tracking-[0.12em] text-neutral-400 uppercase">
                  Canlı rota
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-white">
                  İstanbul → Ankara
                </p>
                <p className="mt-1 text-sm text-neutral-400">
                  Tır · 24 ton · Soğutmalı
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Mesafe" value="452 km" />
                <StatCard label="AI fiyat" value="₺18.400" accent />
                <StatCard label="Teklif" value="3 dk" />
                <StatCard label="Teslimat" value="6 saat" />
              </div>
            </div>
          </div>

          <div className="absolute -bottom-4 -left-2 rounded-2xl border border-white/10 bg-neutral-900/90 px-4 py-3 shadow-xl backdrop-blur-md md:-left-6">
            <p className="text-xs text-neutral-400">Gemini AI eşleştirme</p>
            <p className="mt-0.5 text-sm font-semibold text-ai-300">
              %97 uyumluluk skoru
            </p>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
      >
        <span className="text-[10px] font-semibold tracking-[0.24em] text-neutral-500 uppercase">
          Kaydırın
        </span>
        <span className="relative h-10 w-px overflow-hidden bg-neutral-700">
          <span className="absolute top-0 left-0 h-3 w-full animate-[scroll-dot_1.8s_ease-in-out_infinite] bg-brand-500" />
        </span>
      </div>
    </section>
  );
}

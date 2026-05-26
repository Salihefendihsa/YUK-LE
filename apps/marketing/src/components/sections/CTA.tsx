"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsapPlugins } from "@/lib/gsap";

registerGsapPlugins();
gsap.registerPlugin(useGSAP);

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const CTA_FROM = {
  opacity: 0,
  y: 50,
  filter: "blur(12px)",
};

const CTA_TO = {
  opacity: 1,
  y: 0,
  filter: "blur(0px)",
  duration: 0.85,
  ease: "power3.out",
};

export function CTA() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia(REDUCED_MOTION).matches;
      const items = sectionRef.current?.querySelectorAll("[data-cta-reveal]");
      if (!items?.length) return;

      if (reducedMotion) {
        gsap.set(items, { opacity: 1, y: 0, filter: "blur(0px)", clearProps: "filter" });
        return;
      }

      gsap.set(items, CTA_FROM);

      gsap.to(items, {
        ...CTA_TO,
        stagger: 0.12,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 82%",
          once: true,
        },
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="cta"
      className="section-rhythm-b section-rhythm--fade relative flex min-h-[min(100dvh,920px)] w-full items-center justify-center overflow-hidden px-5 py-24 md:py-32"
      aria-labelledby="cta-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 115%, rgba(255,107,0,0.18) 0%, rgba(9,11,14,0.4) 45%, #090b0e 72%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 18% 28%, rgba(255,255,255,0.35), transparent),
            radial-gradient(1px 1px at 72% 62%, rgba(255,255,255,0.25), transparent),
            radial-gradient(1px 1px at 44% 78%, rgba(255,255,255,0.2), transparent)
          `,
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
        <h2
          id="cta-heading"
          className="font-display font-extrabold leading-[1.02] tracking-[-0.04em]"
        >
          <span
            data-cta-reveal
            className="block text-[clamp(3.25rem,14vw,9rem)] text-white"
          >
            YOLA
          </span>
          <span
            data-cta-reveal
            className="mt-1 block text-[clamp(3.25rem,14vw,9rem)] text-white"
          >
            ÇIK
            <span
              className="ml-1 inline-block align-super text-[0.28em] leading-none text-brand-500"
              style={{ textShadow: "0 0 24px rgba(255,107,0,0.55)" }}
              aria-hidden
            >
              .
            </span>
          </span>
        </h2>

        <p
          data-cta-reveal
          className="mt-6 text-[1.05rem] font-light tracking-wide text-[var(--text-secondary)]"
        >
          Kayıt 2 dakika sürer
        </p>

        <div
          data-cta-reveal
          className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4"
        >
          <Link
            href="/register"
            className="inline-flex h-14 items-center justify-center rounded-2xl bg-linear-to-br from-brand-400 to-brand-500 px-10 text-base font-extrabold text-neutral-950 shadow-[0_12px_40px_rgba(255,107,0,0.45)] transition-[transform,box-shadow] hover:shadow-[0_16px_48px_rgba(255,107,0,0.55)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Hemen Kaydol
          </Link>
          <Link
            href="#demo"
            className="liquid-glass inline-flex h-14 items-center justify-center rounded-2xl px-10 text-base font-bold text-white transition-[transform,opacity] hover:bg-white/15 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            Demo Talep Et
          </Link>
        </div>
      </div>
    </section>
  );
}

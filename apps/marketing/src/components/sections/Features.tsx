"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsapPlugins } from "@/lib/gsap";

registerGsapPlugins();
gsap.registerPlugin(useGSAP);

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

type Feature = {
  title: string;
  description: string;
  icon: ReactNode;
  aiFeature?: boolean;
  gridClass: string;
};

function IconAiMatch() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l2.2 4.4 4.9.7-3.5 3.4.8 4.9L12 13.2 7.6 15.4l.8-4.9-3.5-3.4 4.9-.7L12 2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M8 18h8M10 21h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconLiveMap() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6c3-1.5 9-1.5 12 0v12c-3 1.5-9 1.5-12 0V6z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 12l3.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconVerified() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEscrow() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 10V8a4 4 0 118 0v2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
    </svg>
  );
}

const FEATURES: Feature[] = [
  {
    title: "Yapay Zekâ İle En Doğru Eşleşme",
    description:
      "Fabrikalar ve belgeli şoförler saniyeler içinde en optimum rotada buluşur. Zaman ve maliyet kaybı biter.",
    icon: <IconAiMatch />,
    aiFeature: true,
    gridClass: "md:col-span-7 md:row-span-2",
  },
  {
    title: "Kapıdan Kapıya Canlı Konum",
    description:
      "Yükün durumunu ve tırın rotasını anlık olarak harita üzerinden şeffafça izleyin. Her adım kontrolünüzde olsun.",
    icon: <IconLiveMap />,
    gridClass: "md:col-span-5",
  },
  {
    title: "Belgeli Ve Doğrulanmış Şoförler",
    description:
      "Tüm sürücülerin evrakları, K1 ve psikoteknik belgeleri admin panelinde sıkı denetimden geçer. Güven önceliğimizdir.",
    icon: <IconVerified />,
    gridClass: "md:col-span-5",
  },
  {
    title: "Teslimatta Serbest Bırakılan Güvenli Ödeme",
    description:
      "Ödeme yük teslim edilene kadar güvence altında tutulur. Teslimat sorunsuz tamamlandığında şoföre aktarılır.",
    icon: <IconEscrow />,
    gridClass: "md:col-span-7",
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const isAi = feature.aiFeature;

  return (
    <article
      data-feature-card
      className={`marketing-surface-card flex h-full flex-col justify-between rounded-2xl p-6 transition-[box-shadow,border-color] focus-within:ring-2 focus-within:ring-brand-500/50 focus-within:outline-none md:p-8 ${
        isAi ? "ring-1 ring-brand-500/20" : ""
      } ${feature.gridClass}`}
    >
      <div>
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-white/10">
          {feature.icon}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-[var(--text-primary)] md:text-2xl">
            {feature.title}
          </h3>
          {isAi ? (
            <span className="inline-flex items-center rounded-full bg-ai-500/20 px-2 py-0.5 text-[0.625rem] font-bold tracking-[0.12em] text-ai-300 ring-1 ring-ai-500/40">
              AI
            </span>
          ) : null}
        </div>

        <p className="mt-3 max-w-prose text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
          {feature.description}
        </p>
      </div>

      {!isAi ? (
        <span
          aria-hidden
          className="mt-6 inline-block h-0.5 w-10 rounded-full bg-brand-500/80"
        />
      ) : (
        <span
          aria-hidden
          className="mt-6 inline-block h-0.5 w-10 rounded-full bg-ai-500/70"
        />
      )}
    </article>
  );
}

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia(REDUCED_MOTION).matches;
      const cards = sectionRef.current?.querySelectorAll("[data-feature-card]");
      if (!cards?.length) return;

      if (reducedMotion) {
        gsap.set(cards, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        cards,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="ozellikler"
      className="section-rhythm-a section-rhythm--fade relative py-20 md:py-28"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <header className="mx-auto mb-12 max-w-2xl text-center md:mb-14">
          <p className="section-eyebrow section-eyebrow--accent">Özellikler</p>
          <h2 id="features-heading" className="section-heading mt-3">
            Lojistiği Yeniden Tanımlayan Güç
          </h2>
          <p className="section-lead section-lead--center">
            Eşleşmeden Ödemeye Kadar Her Adımda Şeffaflık Ve Kontrol.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:auto-rows-min md:gap-5">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

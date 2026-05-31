"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { RevealGroup } from "@/components/Reveal";
import { useScrollReveal } from "@/hooks/useScrollReveal";

type Step = {
  title: string;
  description: string;
  icon: ReactNode;
};

function IconPackage() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 12 20 7.5M12 12V21M12 12 4 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconShieldCheck() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 5 6v6c0 4.2 3 7.5 7 8.5 4-1 7-4.3 7-8.5V6l-7-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l2.4 4.8 5.4.8-3.9 3.8.9 5.4L12 14.8 7.2 17l.9-5.4L4.2 7.6l5.4-.8L12 3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STEPS: Step[] = [
  {
    title: "İlan Ver",
    description:
      "Yükünüzü, güzergâhı ve detayları girin; önerilen fiyat saniyeler içinde karşınıza çıksın.",
    icon: <IconPackage />,
  },
  {
    title: "Teklifleri Toplayın",
    description:
      "Belgeli tır şoförleri ilanınıza teklif versin; en uygununu siz seçin.",
    icon: <IconSearch />,
  },
  {
    title: "Güvenle Anlaşın",
    description:
      "Ödeme güvenli havuzda tutulur, iş tamamlanınca şoföre aktarılır.",
    icon: <IconShieldCheck />,
  },
  {
    title: "Canlı Takip",
    description: "Aracın konumunu yol boyunca harita üzerinde anlık izleyin.",
    icon: <IconMapPin />,
  },
  {
    title: "Teslim & Puan",
    description:
      "Teslimat onaylanır, ödeme tamamlanır, karşılıklı puanlama yapılır.",
    icon: <IconStar />,
  },
];

function StepCard({
  step,
  index,
  isLast,
}: {
  step: Step;
  index: number;
  isLast: boolean;
}) {
  const num = String(index + 1).padStart(2, "0");

  return (
    <li className="relative flex min-w-0 flex-col">
      {!isLast ? (
        <span
          aria-hidden
          className="pointer-events-none absolute top-12 left-[calc(50%+3rem)] hidden h-px w-[calc(100%-3rem)] bg-white/10 lg:block"
        />
      ) : null}

      {!isLast ? (
        <span
          aria-hidden
          className="pointer-events-none absolute top-[4.75rem] bottom-0 left-7 w-px bg-white/10 lg:hidden"
        />
      ) : null}

      <article
        data-reveal
        className="marketing-surface-card relative z-[1] flex h-full flex-col rounded-2xl p-6 transition-[box-shadow,border-color] focus-within:ring-2 focus-within:ring-brand-500/50 focus-within:outline-none md:p-7"
      >
        <span className="mb-4 inline-flex w-fit items-center justify-center rounded-full bg-brand-500/20 px-3 py-1 font-mono text-xs font-bold tracking-widest text-brand-500 ring-1 ring-brand-500/35">
          {num}
        </span>

        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-white/10">
          {step.icon}
        </div>

        <h3 className="font-display text-lg font-bold tracking-[-0.02em] text-[var(--text-primary)] md:text-xl">
          {step.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{step.description}</p>
      </article>
    </li>
  );
}

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useScrollReveal(cardsRef, {
    selector: "[data-reveal]",
    stagger: 0.1,
    start: "top 80%",
    trigger: sectionRef,
  });

  return (
    <section
      ref={sectionRef}
      id="yolculuk"
      className="section-rhythm-b section-rhythm--fade w-full py-20 md:py-28"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <RevealGroup className="mx-auto mb-14 max-w-2xl text-center md:mb-16" stagger={0.1}>
          <p
            data-reveal
            className="liquid-glass section-eyebrow mx-auto mb-5 inline-flex w-fit items-center gap-2.5 rounded-full px-4 py-2 text-brand-500"
          >
            <span className="inline-flex h-2 w-2 rounded-full bg-brand-500" aria-hidden />
            Nasıl Çalışır
          </p>
          <h2 id="how-it-works-heading" data-reveal className="section-heading">
            Yük Vermek Hiç Bu Kadar Kolay Olmamıştı
          </h2>
          <p data-reveal className="section-lead section-lead--center">
            Beş Adımda İlandan Teslimata — Şeffaf Teklifler, Güvenli Ödeme Ve Canlı Takip
            Tek Akışta.
          </p>
        </RevealGroup>

        <div ref={cardsRef}>
          <ol className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-5 lg:gap-5">
            {STEPS.map((step, index) => (
              <StepCard
                key={step.title}
                step={step}
                index={index}
                isLast={index === STEPS.length - 1}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

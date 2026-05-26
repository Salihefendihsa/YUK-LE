"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsapPlugins } from "@/lib/gsap";

registerGsapPlugins();
gsap.registerPlugin(useGSAP);

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function formatTrInteger(value: number): string {
  return Math.round(value).toLocaleString("tr-TR");
}

function IconShield() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M12 3l8 4v6c0 4-3.5 6.5-8 8-4.5-1.5-8-4-8-8V7l8-4z"
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

function IconLockWallet() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 10V8a4 4 0 118 0v2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M12 14h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function QuoteMarkGlow() {
  return (
    <svg
      width="44"
      height="36"
      viewBox="0 0 44 36"
      fill="none"
      aria-hidden
      className="text-brand-500 drop-shadow-[0_0_14px_rgba(255,107,0,0.65)]"
    >
      <path
        d="M8 22V12c0-4.5 3-7.5 7.5-7.5.8 0 1.5.15 2.1.4L12 2C6.5 2.8 3 6.5 3 12.5 3 17 5 20 8 20v2zm22 0V12c0-4.5 3-7.5 7.5-7.5.8 0 1.5.15 2.1.4L34 2c-5.5.8-9 4.5-9 10.5 0 4.5 2 7.5 5 7.5v2z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function AuthorCheckBadge() {
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 ring-1 ring-brand-500/40"
      aria-hidden
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M2.5 6l2.5 2.5 4.5-4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand-400"
        />
      </svg>
    </span>
  );
}

function MiniShieldAccent() {
  return (
    <span
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/25 transition-transform duration-300 group-hover:scale-110"
      aria-hidden
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3l8 4v6c0 4-3.5 6.5-8 8-4.5-1.5-8-4-8-8V7l8-4z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
}: {
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <figure
      data-testimonial-card
      className="group marketing-surface-card relative flex h-full flex-col overflow-hidden rounded-2xl p-6 will-change-transform md:p-8"
      style={{ transformStyle: "preserve-3d" }}
    >
      <QuoteMarkGlow />

      <blockquote className="mt-5 flex-1">
        <p className="font-body text-[0.9375rem] leading-relaxed text-neutral-300 md:text-base">
          {quote}
        </p>
      </blockquote>

      <figcaption className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <AuthorCheckBadge />
          <div className="min-w-0">
            <p className="font-display text-sm font-bold tracking-[-0.01em] text-white">
              {author}
            </p>
            {role ? (
              <p className="mt-0.5 truncate text-xs text-neutral-400">{role}</p>
            ) : null}
          </div>
        </div>
        <MiniShieldAccent />
      </figcaption>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-linear-to-r from-transparent via-brand-500/70 to-transparent opacity-80 md:inset-x-8"
      />
    </figure>
  );
}

const SECURITY_CARDS = [
  {
    title: "Sıkı Belge Denetimi",
    text: "Tüm şoförlerin K1 yetki belgeleri, psikoteknik raporları ve sabıka kayıtları admin onayından geçer. Sisteme sadece profesyoneller girer.",
    icon: <IconShield />,
  },
  {
    title: "Güvenli Ödeme Altyapısı",
    text: "Ödemeniz, yük sorunsuz teslim edilene kadar havuzda güvende tutulur. Teslimat onayıyla birlikte şoföre aktarılır.",
    icon: <IconLockWallet />,
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Yapay zekâ eşleşmesi sayesinde boş dönme derdim bitti. Dönüş rotama anında yük buluyorum.",
    author: "Ahmet Y.",
    role: "Bireysel Nakliyeci",
  },
  {
    quote:
      "Eskiden telefon başında saatler harcardık, şimdi tek tıkla doğrulanmış tır kapımızda. Süreci haritadan izlemek harika.",
    author: "XYZ Lojistik A.Ş.",
    role: "",
  },
] as const;

type StatConfig = {
  target: number;
  format: (v: number) => string;
  label: string;
};

const STATS: StatConfig[] = [
  {
    target: 2847,
    format: (v) => `${formatTrInteger(v)}+`,
    label: "Kayıtlı Fabrika ve İşletme",
  },
  {
    target: 247,
    format: (v) => formatTrInteger(v),
    label: "Şu An Aktif Sefer",
  },
  {
    target: 4.9,
    format: (v) => `${v.toFixed(1)}/5`,
    label: "Müşteri Memnuniyeti",
  },
];

function runCountUp(
  el: HTMLElement,
  config: StatConfig,
  reducedMotion: boolean,
  position: number,
  timeline: gsap.core.Timeline,
) {
  const finalText = config.format(config.target);
  if (reducedMotion) {
    el.textContent = finalText;
    return;
  }

  const proxy = { value: 0 };
  timeline.to(
    proxy,
    {
      value: config.target,
      duration: config.target < 10 ? 1.4 : 2,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = config.format(proxy.value);
      },
      onComplete: () => {
        el.textContent = finalText;
      },
    },
    position,
  );
}

export function Trust() {
  const sectionRef = useRef<HTMLElement>(null);
  const statRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const testimonialsZoneRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia(REDUCED_MOTION).matches;
      const securityCards = sectionRef.current?.querySelectorAll("[data-trust-reveal]");
      const testimonialCards = testimonialsZoneRef.current?.querySelectorAll(
        "[data-testimonial-card]",
      );
      const statElements = statRefs.current.filter(Boolean) as HTMLSpanElement[];

      const scrollConfig = {
        trigger: sectionRef.current,
        start: "top 78%",
        once: true,
      };

      const tl = gsap.timeline({
        scrollTrigger: scrollConfig,
        defaults: { ease: "power3.out" },
      });

      statElements.forEach((el, index) => {
        if (!STATS[index]) return;
        runCountUp(el, STATS[index], reducedMotion, 0, tl);
      });

      if (securityCards?.length) {
        if (reducedMotion) {
          gsap.set(securityCards, { opacity: 1, y: 0 });
        } else {
          tl.fromTo(
            securityCards,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.75,
              stagger: 0.2,
            },
            0.35,
          );
        }
      }

      if (testimonialCards?.length) {
        if (reducedMotion) {
          gsap.set(testimonialCards, {
            opacity: 1,
            y: 0,
            skewX: 0,
            skewY: 0,
            clearProps: "transform",
          });
        } else {
          gsap.fromTo(
            testimonialCards,
            { opacity: 0, y: 60, skewX: 10, skewY: 5 },
            {
              opacity: 1,
              y: 0,
              skewX: 0,
              skewY: 0,
              ease: "none",
              stagger: 0.12,
              scrollTrigger: {
                trigger: testimonialsZoneRef.current,
                start: "top 92%",
                end: "top 38%",
                scrub: 1,
              },
            },
          );
        }
      }
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="guven"
      className="section-rhythm-a section-rhythm--fade relative border-t border-white/5 py-20 md:py-28"
      aria-labelledby="trust-heading"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <header className="mx-auto mb-14 max-w-2xl text-center">
          <p className="section-eyebrow section-eyebrow--accent">Güven</p>
          <h2 id="trust-heading" className="section-heading mt-3">
            Rakamlarla ve deneyimle güven
          </h2>
        </header>

        {/* 1 — İstatistik şeridi */}
        <ul className="grid grid-cols-1 gap-10 border-b border-white/10 pb-14 sm:grid-cols-3 sm:gap-8">
          {STATS.map((stat, index) => (
            <li key={stat.label} className="text-center">
              <span
                ref={(node) => {
                  statRefs.current[index] = node;
                }}
                className="block font-display text-5xl font-extrabold tracking-[-0.03em] text-brand-500 md:text-6xl"
                aria-label={stat.format(stat.target)}
              >
                {stat.format(0)}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
                {stat.label}
              </p>
            </li>
          ))}
        </ul>

        {/* 2 — Güvenlik kartları */}
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {SECURITY_CARDS.map((card) => (
            <article
              key={card.title}
              data-trust-reveal
              className="marketing-surface-card flex flex-col gap-5 rounded-2xl p-6 md:flex-row md:items-start md:p-8"
            >
              <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400 ring-1 ring-white/10">
                {card.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-white">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-300 md:text-base">
                  {card.text}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* 3 — Kullanıcı yorumları (premium glass) */}
        <div
          ref={testimonialsZoneRef}
          className="relative mt-16 overflow-hidden rounded-3xl border border-white/5 md:mt-20"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-brand-500/12 blur-[100px]" />
            <div className="absolute -right-16 -bottom-24 h-80 w-80 rounded-full bg-ai-500/10 blur-[110px]" />
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(135deg, rgba(255,107,0,0.06) 0%, transparent 45%),
                  linear-gradient(315deg, rgba(139,92,246,0.05) 0%, transparent 50%),
                  linear-gradient(to bottom, rgba(9,11,14,0.2) 0%, rgba(9,11,14,0.85) 100%)
                `,
              }}
            />
          </div>

          <div className="relative px-5 py-12 md:px-10 md:py-14">
            <p className="mb-8 text-center text-xs font-semibold tracking-[0.2em] text-neutral-500 uppercase">
              Kullanıcı deneyimleri
            </p>

            <div
              className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6"
              style={{ perspective: "1000px" }}
            >
              {TESTIMONIALS.map((item) => (
                <TestimonialCard
                  key={item.author}
                  quote={item.quote}
                  author={item.author}
                  role={item.role}
                />
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-neutral-500">(örnek veri)</p>
          </div>
        </div>
      </div>
    </section>
  );
}

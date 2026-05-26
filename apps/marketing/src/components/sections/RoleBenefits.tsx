"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsapPlugins } from "@/lib/gsap";

registerGsapPlugins();
gsap.registerPlugin(useGSAP);

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

type RoleCard = {
  role: string;
  slogan: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaPrimary: boolean;
  icon: ReactNode;
};

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.25" className="text-brand-500/50" />
      <path
        d="M5 8l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand-500"
      />
    </svg>
  );
}

function IconCustomer() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8h16v11H4V8zM8 8V6a4 4 0 118 0v2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M9 13h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconDriver() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 14h18l-1.5-5H4.5L3 14zM5 14v3h2v-3M17 14v3h2v-3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="18" r="1.25" fill="currentColor" />
      <circle cx="16.5" cy="18" r="1.25" fill="currentColor" />
      <path d="M8 9h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconAdmin() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l8 4v6c0 4-3.5 6.5-8 8-4.5-1.5-8-4-8-8V7l8-4z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <rect x="8" y="10" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 13h4M10 15h2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="transition-transform group-hover:translate-x-0.5">
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

const ROLES: RoleCard[] = [
  {
    role: "Müşteri (Yük Sahibi)",
    slogan: "Yükün güvende, süreç şeffaf.",
    bullets: [
      "Anında fiyat teklifleri ve kolay seçim.",
      "Harita üzerinden 7/24 canlı konum takibi.",
      "Teslimatta serbest bırakılan güvenli ödeme.",
    ],
    ctaLabel: "İlan Ver",
    ctaHref: "/register",
    ctaPrimary: false,
    icon: <IconCustomer />,
  },
  {
    role: "Şoför (Nakliyeci)",
    slogan: "Boş dönme yok — kazancını artır.",
    bullets: [
      "Dönüş rotana uygun yapay zekâ eşleşmeleri.",
      "Bekleme yapmadan hızlı ödeme garantisi.",
      "Evraklarla uğraşmadan tek tıkla teklif ver.",
    ],
    ctaLabel: "Yük Bul",
    ctaHref: "/register",
    ctaPrimary: true,
    icon: <IconDriver />,
  },
  {
    role: "Admin (Platform Yöneticisi)",
    slogan: "Tüm operasyon tek panelde, kontrol sende.",
    bullets: [
      "Şoför, belge ve K1 yetki denetimi.",
      "Tüm aktif seferlerin anlık harita moderasyonu.",
      "Otomatik komisyon ve ödeme raporlaması.",
    ],
    ctaLabel: "Panele Git",
    ctaHref: "/login",
    ctaPrimary: false,
    icon: <IconAdmin />,
  },
];

function RoleCardBlock({ card }: { card: RoleCard }) {
  return (
    <article
      data-role-card
      className="marketing-surface-card flex h-full flex-col rounded-2xl p-6 focus-within:ring-2 focus-within:ring-brand-500/50 focus-within:outline-none md:p-8"
    >
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-white/10">
        {card.icon}
      </div>

      <p className="text-xs font-semibold tracking-[0.14em] text-brand-500 uppercase">
        {card.role}
      </p>

      <p className="mt-3 font-display text-xl font-bold leading-snug tracking-[-0.02em] text-[var(--text-primary)] md:text-2xl">
        {card.slogan}
      </p>

      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {card.bullets.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">
            <CheckIcon />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <Link
        href={card.ctaHref}
        className={`group mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-[transform,opacity,background-color] active:scale-[0.98] ${
          card.ctaPrimary
            ? "bg-brand-500 text-white hover:bg-brand-400"
            : "liquid-glass text-neutral-100 hover:bg-white/15"
        }`}
      >
        {card.ctaLabel}
        <ArrowIcon />
      </Link>
    </article>
  );
}

export function RoleBenefits() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia(REDUCED_MOTION).matches;
      const cards = sectionRef.current?.querySelectorAll("[data-role-card]");
      const header = headerRef.current;

      if (reducedMotion) {
        if (header) gsap.set(header, { opacity: 1, y: 0 });
        if (cards?.length) gsap.set(cards, { opacity: 1, y: 0 });
        return;
      }

      const trigger = {
        trigger: sectionRef.current,
        start: "top 80%",
        once: true,
      };

      if (header) {
        gsap.fromTo(
          header,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.65, ease: "power3.out", scrollTrigger: trigger },
        );
      }

      if (cards?.length) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: "power3.out",
            stagger: 0.2,
            delay: 0.12,
            scrollTrigger: trigger,
          },
        );
      }
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="kimin-icin"
      className="section-rhythm-b section-rhythm--fade relative py-20 md:py-28"
      aria-labelledby="role-benefits-heading"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <header
          ref={headerRef}
          className="mx-auto mb-12 max-w-2xl text-center md:mb-14"
        >
          <p className="section-eyebrow section-eyebrow--accent">Kimin için</p>
          <h2 id="role-benefits-heading" className="section-heading mt-3">
            Herkes İçin Tek Platform
          </h2>
          <p className="section-lead section-lead--center">
            Yük sahipleri, şoförler ve operasyon yöneticileri için özel olarak
            tasarlandı.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {ROLES.map((card) => (
            <RoleCardBlock key={card.role} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

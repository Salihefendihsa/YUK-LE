"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsapPlugins } from "@/lib/gsap";

registerGsapPlugins();
gsap.registerPlugin(useGSAP);

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const MARQUEE_TEXT = "YÜK-LE · LOJİSTİK · YAPAY ZEKA · GÜVEN · TÜRKİYE · ";

const FOOTER_COLUMNS = [
  {
    title: "Ürün",
    links: [
      { href: "#ozellikler", label: "Özellikler" },
      { href: "#fiyat", label: "Fiyat" },
      { href: "#demo", label: "Demo" },
      { href: "#", label: "API" },
    ],
  },
  {
    title: "Şirket",
    links: [
      { href: "#", label: "Hakkımızda" },
      { href: "#", label: "Kariyer" },
      { href: "#", label: "Blog" },
      { href: "#", label: "Basın" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { href: "#", label: "KVKK" },
      { href: "#", label: "Koşullar" },
      { href: "#", label: "Gizlilik" },
      { href: "#", label: "Çerezler" },
    ],
  },
] as const;

const SOCIAL_LINKS = [
  { href: "https://twitter.com", label: "Twitter" },
  { href: "https://linkedin.com", label: "LinkedIn" },
  { href: "https://instagram.com", label: "Instagram" },
] as const;

export function Footer() {
  const marqueeTrackRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const track = marqueeTrackRef.current;
    if (!track) return;

    const reducedMotion = window.matchMedia(REDUCED_MOTION).matches;
    const segment = track.querySelector<HTMLElement>("[data-marquee-segment]");
    if (!segment) return;

    const segmentWidth = segment.offsetWidth;
    if (!segmentWidth) return;

    if (reducedMotion) {
      gsap.set(track, { x: 0 });
      return;
    }

    gsap.fromTo(
      track,
      { x: 0 },
      {
        x: -segmentWidth,
        duration: 28,
        ease: "none",
        repeat: -1,
      },
    );
  }, []);

  return (
    <footer className="section-rhythm-a border-t border-white/6">
      {/* Marquee — en üst */}
      <div className="overflow-hidden border-b border-white/5 py-3" aria-hidden>
        <div ref={marqueeTrackRef} className="inline-flex will-change-transform">
          <span
            data-marquee-segment
            className="inline-block shrink-0 pr-16 text-[0.78rem] tracking-[0.14em] whitespace-nowrap text-neutral-500 uppercase"
          >
            {MARQUEE_TEXT}
          </span>
          <span className="inline-block shrink-0 pr-16 text-[0.78rem] tracking-[0.14em] whitespace-nowrap text-neutral-500 uppercase">
            {MARQUEE_TEXT}
          </span>
        </div>
      </div>

      <p className="py-4 text-center text-[0.65rem] tracking-[0.28em] text-neutral-500 uppercase">
        500+ FABRİKA İLE GÜVENİLİYORUZ
      </p>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-5 py-10 sm:grid-cols-2 md:grid-cols-4 lg:px-8">
        <div>
          <p className="font-display text-lg font-extrabold tracking-[-0.03em] text-white">
            YÜK<span className="text-brand-500">-LE</span>
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            Yapay zeka destekli yük platformu
          </p>
          <div className="mt-5 flex flex-wrap gap-4">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-400 transition-colors hover:text-brand-400 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-semibold tracking-[0.16em] text-neutral-300 uppercase">
              {col.title}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 transition-colors hover:text-white focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 border-t border-white/6 px-5 py-6 text-sm text-neutral-500 sm:flex-row lg:px-8">
        <p>© 2026 YÜK-LE — Yapay zeka destekli lojistik.</p>
        <p>Türkiye TR</p>
      </div>
    </footer>
  );
}

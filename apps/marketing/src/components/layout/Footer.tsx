"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";

const MARQUEE_TEXT = "NAVLONIX · LOJİSTİK · YAPAY ZEKA · GÜVEN · TÜRKİYE · ";

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

function FooterMarquee() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [copyCount, setCopyCount] = useState(6);

  const syncMarquee = useCallback(() => {
    const viewport = viewportRef.current;
    const measure = measureRef.current;
    const track = trackRef.current;
    if (!viewport || !measure || !track) return;

    const segmentWidth = measure.getBoundingClientRect().width;
    const viewportWidth = viewport.getBoundingClientRect().width;
    if (!segmentWidth || !viewportWidth) return;

    const needed = Math.max(4, Math.ceil(viewportWidth / segmentWidth) + 3);
    setCopyCount((prev) => (prev === needed ? prev : needed));
    track.style.setProperty("--marquee-shift", `${segmentWidth}px`);
  }, []);

  useEffect(() => {
    syncMarquee();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const ro = new ResizeObserver(syncMarquee);
    ro.observe(viewport);
    window.addEventListener("resize", syncMarquee);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncMarquee);
    };
  }, [syncMarquee]);

  return (
    <div className="footer-marquee border-b border-white/5 py-3" aria-hidden>
      <div ref={viewportRef} className="footer-marquee__viewport">
        <span ref={measureRef} className="footer-marquee__segment footer-marquee__segment--measure">
          {MARQUEE_TEXT}
        </span>
        <div ref={trackRef} className="footer-marquee__track">
          {Array.from({ length: copyCount }, (_, index) => (
            <span key={index} className="footer-marquee__segment">
              {MARQUEE_TEXT}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="section-rhythm-a border-t border-white/6">
      <FooterMarquee />

      <p className="py-4 text-center text-[0.65rem] tracking-[0.28em] text-neutral-500 uppercase">
        500+ FABRİKA İLE GÜVENİLİYORUZ
      </p>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-5 py-10 sm:grid-cols-2 md:grid-cols-4 lg:px-8">
        <div>
          <Logo variant="full" size="md" theme="dark" />
          <p className="mt-2 text-sm capitalize text-neutral-400">
            Yapay Zeka Destekli Yük Platformu
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
            <p className="text-xs font-semibold tracking-[0.18em] text-neutral-300 uppercase">
              {col.title}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 transition-colors hover:text-neutral-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 px-5 py-5 text-center lg:px-8">
        <p>© 2026 Navlonix — Yapay zeka destekli lojistik.</p>
      </div>
    </footer>
  );
}

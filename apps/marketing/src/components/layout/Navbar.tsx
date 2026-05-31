import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const navLinks = [
  { href: "#yolculuk", label: "Yolculuk" },
  { href: "#ai", label: "AI Destek" },
  { href: "#guven", label: "Güvenlik" },
  { href: "#fiyat", label: "Fiyat" },
];

export function Navbar() {
  return (
    <header className="liquid-glass-dark fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <Link
          href="/"
          data-hero-animate
          data-hero-delay="0.1"
          className="inline-flex items-center"
        >
          <Logo variant="full" size="md" theme="dark" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Ana menü">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-hero-animate
              data-hero-delay="0.2"
              className="nav-link-glow text-sm font-medium text-neutral-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            data-hero-animate
            data-hero-delay="0.2"
            className="liquid-glass liquid-glass-hover hidden h-10 items-center rounded-full px-5 text-sm font-semibold text-neutral-100 active:scale-[0.98] sm:inline-flex"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            data-hero-animate
            data-hero-delay="0.2"
            className="inline-flex h-10 items-center rounded-full bg-brand-500 px-5 text-sm font-semibold text-white transition-[transform,opacity,background-color] hover:bg-brand-400 active:scale-[0.98]"
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    </header>
  );
}

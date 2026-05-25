import Link from "next/link";

const navLinks = [
  { href: "#features", label: "Özellikler" },
  { href: "#ai", label: "AI Motoru" },
  { href: "#pricing", label: "Fiyatlandırma" },
];

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-neutral-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link
          href="/"
          className="font-display text-lg font-extrabold tracking-[-0.04em] text-white"
        >
          YÜK<span className="text-brand-500">-LE</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-neutral-400 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-neutral-300 transition-colors hover:text-white sm:inline-flex"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center rounded-full bg-brand-500 px-4 text-sm font-semibold text-white transition-[transform,opacity,background-color] hover:bg-brand-400 active:scale-[0.98]"
          >
            Başla
          </Link>
        </div>
      </div>
    </header>
  );
}

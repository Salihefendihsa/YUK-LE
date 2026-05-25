import { Hero } from "@/components/sections/Hero";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <section
        id="features"
        className="mx-auto max-w-7xl px-5 py-24 lg:px-8"
        aria-label="Özellikler bölümü yakında"
      >
        <p className="text-center text-sm tracking-[0.2em] text-neutral-500 uppercase">
          Sırada: Features · AI · Stats · Pricing
        </p>
      </section>
    </main>
  );
}

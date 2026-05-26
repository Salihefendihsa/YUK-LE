import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Features } from "@/components/sections/Features";
import { RoleBenefits } from "@/components/sections/RoleBenefits";
import { Trust } from "@/components/sections/Trust";
import { CTA } from "@/components/sections/CTA";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <Features />
      <RoleBenefits />
      <Trust />
      <CTA />
      <Footer />
      <div id="demo" className="sr-only" aria-hidden />
      <div id="ai" className="sr-only" aria-hidden />
      <div id="fiyat" className="sr-only" aria-hidden />
    </main>
  );
}

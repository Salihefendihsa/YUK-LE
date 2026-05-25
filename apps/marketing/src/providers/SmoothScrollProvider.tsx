"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap, registerGsapPlugins } from "@/lib/gsap";

const DESKTOP_BREAKPOINT = "(min-width: 1024px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function shouldUseLenis() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia(DESKTOP_BREAKPOINT).matches &&
    !window.matchMedia(REDUCED_MOTION).matches
  );
}

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    registerGsapPlugins();

    if (!shouldUseLenis()) {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      syncTouch: false,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const desktopQuery = window.matchMedia(DESKTOP_BREAKPOINT);
    const motionQuery = window.matchMedia(REDUCED_MOTION);

    const handleBreakpointChange = () => {
      if (!shouldUseLenis()) {
        lenis.destroy();
        gsap.ticker.remove(raf);
      }
    };

    desktopQuery.addEventListener("change", handleBreakpointChange);
    motionQuery.addEventListener("change", handleBreakpointChange);

    return () => {
      desktopQuery.removeEventListener("change", handleBreakpointChange);
      motionQuery.removeEventListener("change", handleBreakpointChange);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return children;
}

import gsap from "gsap";

/** Scroll-reveal animasyon sabitleri — hero blur-fade-up ile aynı his. */

export const REVEAL_FROM = {
  opacity: 0,
  y: 28,
  filter: "blur(10px)",
} as const;

export const REVEAL_TO = {
  opacity: 1,
  y: 0,
  filter: "blur(0px)",
  duration: 0.7,
  ease: "power3.out",
} as const;

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function setRevealVisible(targets: gsap.TweenTarget) {
  gsap.set(targets, {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    clearProps: "filter",
  });
}

"use client";

import { useEffect, type RefObject } from "react";

const DESKTOP_BREAKPOINT = "(min-width: 1024px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** CTA üzerinde hafif manyetik yaslanma — masaüstü, reduced-motion kapalı */
export function useMagneticHover(
  ref: RefObject<HTMLElement | null>,
  strength = 0.22,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const desktop = window.matchMedia(DESKTOP_BREAKPOINT);
    const reduced = window.matchMedia(REDUCED_MOTION);

    let rafId = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const reset = () => {
      currentX = 0;
      currentY = 0;
      targetX = 0;
      targetY = 0;
      el.style.transform = "";
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      rafId = requestAnimationFrame(tick);
    };

    const onMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetX = (event.clientX - cx) * strength;
      targetY = (event.clientY - cy) * strength;
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const bind = () => {
      if (!desktop.matches || reduced.matches) {
        reset();
        return;
      }
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      rafId = requestAnimationFrame(tick);
    };

    const unbind = () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafId);
      reset();
    };

    bind();

    const onMq = () => {
      unbind();
      bind();
    };

    desktop.addEventListener("change", onMq);
    reduced.addEventListener("change", onMq);

    return () => {
      desktop.removeEventListener("change", onMq);
      reduced.removeEventListener("change", onMq);
      unbind();
    };
  }, [ref, strength]);
}

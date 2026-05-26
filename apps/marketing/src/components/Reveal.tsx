"use client";

import { type ReactNode, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import {
  REVEAL_FROM,
  REVEAL_TO,
  prefersReducedMotion,
  setRevealVisible,
} from "@/lib/scrollReveal";
import { useScrollReveal } from "@/hooks/useScrollReveal";

registerGsapPlugins();
gsap.registerPlugin(useGSAP);

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/** Tek ogeyi scroll'da blur-fade-up ile gosterir. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      if (prefersReducedMotion()) {
        setRevealVisible(el);
        return;
      }

      gsap.set(el, REVEAL_FROM);
      gsap.to(el, {
        ...REVEAL_TO,
        delay,
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className} data-reveal>
      {children}
    </div>
  );
}

type RevealGroupProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  start?: string;
};

/** Alt ogelerde `data-reveal` ile kademeli scroll reveal. */
export function RevealGroup({
  children,
  className,
  stagger = 0.1,
  start = "top 82%",
}: RevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollReveal(ref, { stagger, start });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

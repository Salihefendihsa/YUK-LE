/** Mikro-animasyon sureleri — cross-platform (RN Animated / Reanimated uyumlu). */
export const motion = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 250,
  },
  press: {
    scale: 0.98,
    opacity: 0.92,
  },
  fade: {
    enter: 200,
    exit: 150,
  },
  shimmer: {
    duration: 1200,
  },
} as const;

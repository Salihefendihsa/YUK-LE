import { space } from './spacing';

export const sizes = {
  button: {
    primary: 52,
    secondary: 48,
    compact: 40,
    paddingHorizontal: space.lg,
    labelMinScale: 0.82,
  },
  input: {
    minHeight: 52,
  },
  icon: {
    sm: 18,
    md: 24,
    lg: 32,
  },
  header: {
    menuHit: 40,
  },
  hitSlop: space.sm,
} as const;

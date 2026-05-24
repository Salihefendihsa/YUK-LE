/**
 * H.1 tasarim token tek kaynak.
 * Mevcut theme modullerini birlestirir; ekranlarda `import { palette, space, motion } from '@/theme/tokens'` kullanilabilir.
 */
export { palette, Colors, gray } from './colors';
export { spacing, space } from './spacing';
export { radius } from './radius';
export { shadows } from './shadows';
export { fontFamily, typography } from './typography';
export { motion } from './motion';
export { sizes } from './sizes';

import { palette } from './colors';
import { space } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { typography } from './typography';
import { motion } from './motion';
import { sizes } from './sizes';

export const tokens = {
  color: palette,
  space,
  radius,
  shadow: shadows,
  type: typography,
  motion,
  size: sizes,
} as const;

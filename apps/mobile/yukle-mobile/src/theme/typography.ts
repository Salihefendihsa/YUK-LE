import { Platform, TextStyle } from 'react-native';
import { palette } from './colors';

const nativeFontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

/** Web: expo-font adlari veya sistem yigini (font yuklenmese de okunakli kalir) */
const webFontFamily = {
  regular: 'PlusJakartaSans_400Regular, system-ui, -apple-system, sans-serif',
  medium: 'PlusJakartaSans_500Medium, system-ui, sans-serif',
  semiBold: 'PlusJakartaSans_600SemiBold, system-ui, sans-serif',
  bold: 'PlusJakartaSans_700Bold, system-ui, sans-serif',
} as const;

export const fontFamily = Platform.OS === 'web' ? webFontFamily : nativeFontFamily;

export const typography = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: palette.text,
  } as TextStyle,
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
    color: palette.text,
  } as TextStyle,
  h2: {
    fontFamily: fontFamily.semiBold,
    fontSize: 20,
    lineHeight: 26,
    color: palette.text,
  } as TextStyle,
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: 17,
    lineHeight: 22,
    color: palette.text,
  } as TextStyle,
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: palette.text,
  } as TextStyle,
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
    color: palette.text,
  } as TextStyle,
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: palette.textSecondary,
  } as TextStyle,
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    color: palette.textSecondary,
    textTransform: 'uppercase',
  } as TextStyle,
  link: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: palette.gold,
  } as TextStyle,
};

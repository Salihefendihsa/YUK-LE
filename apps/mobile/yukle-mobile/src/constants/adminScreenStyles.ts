import { StyleSheet } from 'react-native';
import { palette } from '../theme/colors';
import { fontFamily, typography } from '../theme/typography';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';

/** Admin stack ekranlari — tema ile uyumlu ortak stiller */
export const adminScreenStyles = StyleSheet.create({
  scroll: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  backLink: { ...typography.link, marginBottom: spacing[2] },
  title: { ...typography.h1 },
  sub: { ...typography.caption, textTransform: 'none', marginBottom: spacing[2] },
  muted: { ...typography.caption, textTransform: 'none' },
  mono: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: palette.textMuted,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderLight,
    padding: spacing[4],
    gap: spacing[2],
  },
  cardTitle: { ...typography.h3 },
  linkBtn: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.brandBorder,
    padding: spacing[4],
    gap: spacing[1],
  },
  linkTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: palette.brand,
  },
  linkSub: { ...typography.caption, textTransform: 'none' },
  input: {
    backgroundColor: palette.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    color: palette.text,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  filterBtn: {
    backgroundColor: palette.brand,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  filterBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: palette.onBrand,
  },
  errorBox: {
    backgroundColor: palette.errorBg,
    borderRadius: radius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: palette.errorBorder,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: palette.error,
  },
  successBox: {
    backgroundColor: palette.successBg,
    borderRadius: radius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: palette.successBorder,
  },
  successText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: palette.success,
  },
  empty: { padding: spacing[6], alignItems: 'center' },
  emptyTitle: { ...typography.h3, color: palette.textMuted },
  placeholderBanner: {
    backgroundColor: palette.goldMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.goldBorder,
    padding: spacing[3],
    gap: spacing[1],
  },
  placeholderText: {
    ...typography.caption,
    textTransform: 'none',
    color: palette.gold,
    lineHeight: 18,
  },
  danger: { color: palette.error },
  btnDanger: {
    backgroundColor: palette.error,
    borderRadius: radius.md,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  btnDangerText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: palette.text,
  },
  btnDisabled: { opacity: 0.5 },
  statusOk: { color: palette.success },
  statusBad: { color: palette.error },
});

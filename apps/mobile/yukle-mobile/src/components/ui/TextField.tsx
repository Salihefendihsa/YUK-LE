import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { palette } from '../../theme/colors';
import { fontFamily, typography } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  right?: ReactNode;
};

export function TextField({ label, error, icon, right, style, ...inputProps }: Props) {
  const hasError = Boolean(error);
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, hasError && styles.fieldError]}>
        {icon ? (
          <Ionicons name={icon} size={18} color={palette.textMuted} style={styles.icon} />
        ) : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={palette.textMuted}
          {...inputProps}
        />
        {right}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing[4], gap: spacing[2] },
  label: { ...typography.caption, textTransform: 'none', color: palette.textSecondary },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.input,
    paddingHorizontal: spacing[4],
  },
  fieldError: {
    borderColor: palette.errorBorder,
    backgroundColor: palette.errorBg,
  },
  icon: { marginRight: spacing[3] },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: palette.text,
    paddingVertical: spacing[3],
  },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: palette.error,
  },
});

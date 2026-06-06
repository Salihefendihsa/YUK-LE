import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { space } from '../../theme/spacing';
import { sizes } from '../../theme/sizes';
import { useRoleAccent } from '../../theme/useRoleAccent';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  right?: ReactNode;
};

export function TextField({ label, error, icon, right, style, onFocus, onBlur, ...inputProps }: Props) {
  const [focused, setFocused] = useState(false);
  const accent = useRoleAccent();
  const hasError = Boolean(error);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          focused && !hasError && { borderColor: accent.accentBorder, backgroundColor: accent.accentMuted },
          hasError && styles.fieldError,
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={sizes.icon.sm} color={palette.textMuted} style={styles.icon} />
        ) : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={palette.textMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />
        {right}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md, gap: space.sm },
  label: { ...typography.caption, textTransform: 'none', color: palette.textSecondary },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.input.minHeight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.input,
    paddingHorizontal: space.md,
  },
  fieldFocused: {
    borderColor: palette.brandBorder,
    backgroundColor: palette.brandMuted,
  },
  fieldError: {
    borderColor: palette.errorBorder,
    backgroundColor: palette.errorBg,
  },
  icon: { marginRight: space.sm + 4 },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: space.sm + 4,
  },
  error: {
    ...typography.bodySmall,
    fontSize: 12,
    color: palette.error,
  },
});

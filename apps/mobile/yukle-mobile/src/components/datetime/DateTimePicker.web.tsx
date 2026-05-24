import { createElement, type ChangeEvent } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDateTimeTR, isoToLocalInputValue, localInputValueToIso } from '../../utils/date';
import { palette } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';
import type { DateTimePickerProps } from './DateTimePicker.types';

export function DateTimePicker({ value, onChange, minimumDate }: DateTimePickerProps) {
  const minStr = minimumDate ? isoToLocalInputValue(minimumDate.toISOString()) : undefined;

  return (
    <View style={styles.wrap}>
      <Text style={styles.display}>{formatDateTimeTR(value)}</Text>
      {createElement('input', {
        type: 'datetime-local',
        value: value ? isoToLocalInputValue(value) : '',
        min: minStr,
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
          const iso = localInputValueToIso(e.target.value);
          if (iso) onChange(iso);
        },
        style: {
          width: '100%',
          padding: 12,
          borderRadius: 8,
          border: `1px solid ${palette.borderLight}`,
          fontSize: 15,
          fontFamily: 'inherit',
          backgroundColor: palette.input,
          color: palette.text,
          boxSizing: 'border-box',
        },
      })}
      {!value ? (
        <Pressable
          onPress={() => onChange(new Date().toISOString())}
          style={styles.todayBtn}
        >
          <Text style={styles.todayText}>Bugün</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[2] },
  display: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: palette.textSecondary,
  },
  todayBtn: { alignSelf: 'flex-start' },
  todayText: { fontFamily: fontFamily.semiBold, fontSize: 13, color: palette.brand },
});

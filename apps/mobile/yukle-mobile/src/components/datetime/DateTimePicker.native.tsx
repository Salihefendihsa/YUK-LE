import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePickerNative from '@react-native-community/datetimepicker';
import { formatDateTimeTR } from '../../utils/date';
import { palette } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';
import type { DateTimePickerProps } from './DateTimePicker.types';

export function DateTimePicker({ value, onChange, minimumDate }: DateTimePickerProps) {
  const parsed = value ? new Date(value) : new Date();
  const current = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const [show, setShow] = useState(false);

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.btn} onPress={() => setShow(true)}>
        <Text style={styles.btnText}>{formatDateTimeTR(value)}</Text>
      </Pressable>
      {show ? (
        <DateTimePickerNative
          value={current}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate}
          locale="tr-TR"
          onChange={(_, selected) => {
            if (Platform.OS === 'android') setShow(false);
            if (selected) onChange(selected.toISOString());
          }}
        />
      ) : null}
      {Platform.OS === 'ios' && show ? (
        <Pressable onPress={() => setShow(false)} style={styles.doneBtn}>
          <Text style={styles.doneText}>Tamam</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[2] },
  btn: {
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: palette.input,
  },
  btnText: { fontFamily: fontFamily.regular, fontSize: 15, color: palette.text },
  doneBtn: { alignSelf: 'flex-end', paddingVertical: spacing[2] },
  doneText: { fontFamily: fontFamily.semiBold, fontSize: 14, color: palette.brand },
});

import { Platform, StyleSheet, Text, View } from 'react-native';
import { DateTimePicker } from './DateTimePicker';

type Props = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  minimumDate?: Date;
};

export function DateTimePickerField({ label, value, onChange, minimumDate }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <DateTimePicker value={value} onChange={onChange} minimumDate={minimumDate} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: {
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#888',
    marginBottom: 6,
  },
});

import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type Props = { label: string; value: string };

export function DetailRow({ label, value }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[3],
    paddingVertical: spacing[1],
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: palette.textSecondary,
    flex: 1,
  },
  value: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: palette.text,
    flex: 1,
    textAlign: 'right',
  },
});

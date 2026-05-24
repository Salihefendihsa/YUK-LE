import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export type QrDeliveryScannerProps = {
  onScan: (token: string) => void;
  disabled?: boolean;
};

/** Web: kamera modülü yok; manuel token girisi kullanılır. */
export function QrDeliveryScanner(_props: QrDeliveryScannerProps) {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>
        Web sürümünde QR okutma desteklenmez. Müşterinin verdiği token’ı aşağıdaki alana yapıştırın.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: spacing[3],
    borderRadius: 8,
    backgroundColor: palette.input,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  text: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
});

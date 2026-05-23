import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type Props = {
  message?: string;
};

export function LoadingState({ message = 'Yükleniyor...' }: Props) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={palette.brand} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    padding: spacing[8],
  },
  text: typography.caption,
});

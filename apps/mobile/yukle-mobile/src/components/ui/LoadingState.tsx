import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { space } from '../../theme/spacing';
import { SkeletonBlock } from './Skeleton';

type Props = {
  message?: string;
  /** Gorsel: spinner (varsayilan) veya skeleton placeholder */
  variant?: 'spinner' | 'skeleton';
};

export function LoadingState({ message = 'Yükleniyor...', variant = 'spinner' }: Props) {
  if (variant === 'skeleton') {
    return (
      <View style={styles.wrap}>
        <SkeletonBlock lines={4} />
        {message ? <Text style={styles.text}>{message}</Text> : null}
      </View>
    );
  }

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
    gap: space.md,
    padding: space.xl,
    width: '100%',
    maxWidth: 320,
  },
  text: typography.caption,
});

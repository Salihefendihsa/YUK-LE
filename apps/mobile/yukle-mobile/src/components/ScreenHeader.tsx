import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/colors';
import { fontFamily } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { NotificationBell } from './NotificationBell';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      <View style={styles.actions}>
        {right}
        <NotificationBell />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  textCol: { flex: 1, gap: spacing[1] },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: palette.text,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: palette.textSecondary,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
});

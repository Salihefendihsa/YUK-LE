import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export function SectionHeader({ title, subtitle, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  textCol: { flex: 1, gap: spacing[1] },
  title: typography.h2,
  sub: typography.caption,
});

import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { SecondaryButton } from './SecondaryButton';

type Props = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon = '📭', title, description, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <SecondaryButton title={actionLabel} onPress={onAction} style={styles.btn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: spacing[8], gap: spacing[3] },
  icon: { fontSize: 40, marginBottom: spacing[2] },
  title: { ...typography.h3, textAlign: 'center' },
  desc: { ...typography.caption, textAlign: 'center', color: palette.textMuted },
  btn: { marginTop: spacing[4], minWidth: 160 },
});

import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { space } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { SecondaryButton } from './SecondaryButton';
import { FadeInView } from './FadeInView';

type Props = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon = '📭', title, description, actionLabel, onAction }: Props) {
  return (
    <FadeInView style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <SecondaryButton title={actionLabel} onPress={onAction} style={styles.btn} />
      ) : null}
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: space.xl, gap: space.sm + 4 },
  icon: { fontSize: 40, marginBottom: space.sm },
  title: { ...typography.h3, textAlign: 'center' },
  desc: { ...typography.bodySmall, textAlign: 'center', color: palette.textMuted },
  btn: { marginTop: space.md, minWidth: 160, borderRadius: radius.md, ...shadows.sm },
});

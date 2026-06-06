import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { space } from '../../theme/spacing';
import { PrimaryButton } from './PrimaryButton';
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
        <View style={styles.btn}>
          <PrimaryButton title={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: space.xl, gap: space.sm + 4 },
  icon: { fontSize: 40, marginBottom: space.sm },
  title: { ...typography.h3, textAlign: 'center' },
  desc: { ...typography.bodySmall, textAlign: 'center', color: palette.textMuted },
  btn: { marginTop: space.md, minWidth: 180, maxWidth: 260 },
});

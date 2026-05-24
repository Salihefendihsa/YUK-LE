import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LoadStatus } from '../../types/load';
import { palette } from '../../theme/colors';
import { fontFamily, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const FLOW: LoadStatus[] = ['Active', 'Assigned', 'OnWay', 'Delivered'];

const STEP_LABELS: Record<string, string> = {
  Active: 'Oluşturuldu',
  Assigned: 'Şoför atandı',
  OnWay: 'Yolda',
  Delivered: 'Teslim edildi',
  Cancelled: 'İptal edildi',
};

type StepState = 'done' | 'current' | 'pending';

type Props = {
  status: LoadStatus;
};

export function LoadStatusTimeline({ status }: Props) {
  const steps = useMemo(() => {
    if (status === 'Cancelled') {
      return [{ key: 'cancel', label: STEP_LABELS.Cancelled, state: 'current' as StepState }];
    }
    const idx = Math.max(
      0,
      FLOW.indexOf(status === 'Arrived' ? 'OnWay' : status)
    );
    return FLOW.map((st, i) => {
      let state: StepState = 'pending';
      if (i < idx) state = 'done';
      else if (i === idx) state = 'current';
      if (status === 'Delivered') {
        state = i < FLOW.length - 1 ? 'done' : 'current';
      }
      return { key: st, label: STEP_LABELS[st] ?? st, state };
    });
  }, [status]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Süreç</Text>
      <View style={styles.row}>
        {steps.map((step) => (
          <View key={step.key} style={styles.stepCol}>
            <View
              style={[
                styles.dot,
                step.state === 'done' && styles.dotDone,
                step.state === 'current' && styles.dotCurrent,
              ]}
            />
            <Text
              style={[
                styles.label,
                step.state === 'current' && styles.labelCurrent,
                step.state === 'done' && styles.labelDone,
              ]}
              numberOfLines={2}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing[2] },
  title: { ...typography.label, color: palette.textMuted, marginBottom: spacing[3] },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[1] },
  stepCol: { flex: 1, alignItems: 'center', minWidth: 0 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.borderLight,
    borderWidth: 2,
    borderColor: palette.borderSubtle,
    marginBottom: spacing[2],
  },
  dotDone: { backgroundColor: palette.success, borderColor: palette.successBorder },
  dotCurrent: { backgroundColor: palette.brand, borderColor: palette.brandBorder },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: 9,
    color: palette.textMuted,
    textAlign: 'center',
  },
  labelCurrent: { fontFamily: fontFamily.semiBold, color: palette.brand },
  labelDone: { color: palette.textSecondary },
});

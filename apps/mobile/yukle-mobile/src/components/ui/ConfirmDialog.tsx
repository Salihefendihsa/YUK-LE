import { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { palette } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { space, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

export type ConfirmTone = 'default' | 'danger';

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Native-uyumlu, marka dilinde modal confirm. Ham Alert.alert yerine kullan —
 * useConfirm hook'u promise-based wrap sunar.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  tone = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8, tension: 120 }),
      ]).start();
    } else {
      fade.setValue(0);
      scale.setValue(0.96);
    }
  }, [visible, fade, scale]);

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onCancel}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable
          accessibilityLabel="Kapat"
          style={StyleSheet.absoluteFill}
          onPress={loading ? undefined : onCancel}
        />
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actions}>
            <SecondaryButton title={cancelLabel} onPress={onCancel} style={styles.cancelBtn} />
            <PrimaryButton
              title={confirmLabel}
              onPress={onConfirm}
              loading={loading}
              style={tone === 'danger' ? styles.dangerBtn : undefined}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 8, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[5],
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: palette.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderLight,
    padding: spacing[5],
    gap: spacing[3],
  },
  title: {
    ...typography.h3,
    color: palette.text,
  },
  message: {
    ...typography.body,
    color: palette.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: spacing[3],
  },
  cancelBtn: {
    flex: 1,
  },
  dangerBtn: {
    backgroundColor: palette.error,
  },
});

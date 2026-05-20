import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '../../theme/colors';
import { fontFamily, typography } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';
import { Card } from './Card';

type Props = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function AuthScreen({ children, title, subtitle, footer, contentStyle }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[palette.bgElevated, palette.bg, '#000000']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orbOrange]} />
      <View style={[styles.orb, styles.orbBlue]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing[6], paddingBottom: insets.bottom + spacing[6] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoBlock}>
            <View style={styles.logoBox}>
              <Ionicons name="cube" size={28} color={palette.brand} />
            </View>
            <Text style={styles.brand}>YUK-LE</Text>
            <Text style={styles.tagline}>Akilli lojistik platformu</Text>
          </View>

          <Card variant="glass" padding={6} style={[styles.formCard, contentStyle]}>
            <Text style={styles.formTitle}>{title}</Text>
            {subtitle ? <Text style={styles.formSub}>{subtitle}</Text> : null}
            {children}
          </Card>

          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.22,
  },
  orbOrange: {
    width: 220,
    height: 220,
    backgroundColor: palette.brand,
    top: -40,
    right: -60,
  },
  orbBlue: {
    width: 160,
    height: 160,
    backgroundColor: '#4A6CF7',
    bottom: 80,
    left: -50,
    opacity: 0.12,
  },
  logoBlock: { alignItems: 'center', marginBottom: spacing[8] },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: palette.brandMuted,
    borderWidth: 1,
    borderColor: palette.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  brand: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    letterSpacing: 1,
    color: palette.text,
  },
  tagline: {
    ...typography.caption,
    marginTop: spacing[1],
    color: palette.textSecondary,
  },
  formCard: {
    width: '100%',
  },
  formTitle: {
    ...typography.h1,
    marginBottom: spacing[1],
  },
  formSub: {
    ...typography.caption,
    marginBottom: spacing[5],
    textTransform: 'none',
  },
});

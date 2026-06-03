import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../components/brand/Logo';
import { FadeInView } from '../components/ui/FadeInView';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { palette } from '../theme/colors';
import { space, spacing } from '../theme/spacing';
import { logoFontFamily, typography } from '../theme/typography';

const WELCOME_BG = require('../../assets/welcome-bg.png');

type ValueCard = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
};

const VALUE_CARDS: ValueCard[] = [
  { icon: 'sparkles', title: 'AI Adil Fiyat', desc: 'Rota + piyasa verisiyle aralık önerisi' },
  { icon: 'navigate', title: 'Canlı Takip', desc: 'Şoför konumu ve ETA tek dokunuş' },
  { icon: 'shield-checkmark', title: 'Güvenli Ödeme', desc: 'Bloke havuz + teslim sonrası serbest' },
];

export function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reduceMotion, setReduceMotion] = useState(false);

  // Reduced-motion guard — kullanıcı sistem ayarında animasyonları kapattıysa
  // stagger fade-in'i atla, doğrudan görünür hale getir.
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => {
        if (!cancelled) setReduceMotion(Boolean(v));
      })
      .catch(() => {
        /* fail-open: animation on */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const Stagger = ({
    children,
    delay = 0,
    style,
  }: {
    children: React.ReactNode;
    delay?: number;
    style?: StyleProp<ViewStyle>;
  }) =>
    reduceMotion ? <View style={style}>{children}</View> : (
      <FadeInView delay={delay} style={style}>
        {children}
      </FadeInView>
    );

  return (
    <View style={styles.root}>
      <ImageBackground
        source={WELCOME_BG}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      >
        {/* Üst→alt koyu gradient: metnin okunması için */}
        <LinearGradient
          colors={['rgba(5,6,8,0.55)', 'rgba(5,6,8,0.78)', 'rgba(5,6,8,0.95)']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing[6], paddingBottom: insets.bottom + spacing[4] },
        ]}
      >
        <Stagger style={styles.logoBlock}>
          <Logo variant="full" size="lg" theme="dark" />
        </Stagger>

        <View style={styles.heroBlock}>
          <Stagger delay={100}>
            <Text style={styles.title}>
              Yükünüz Güvende,{'\n'}Yolunuz <Text style={styles.titleAccent}>Açık.</Text>
            </Text>
          </Stagger>
          <Stagger delay={160}>
            <Text style={styles.subtitle}>
              Yapay zekâ destekli lojistik — saniyeler içinde eşleş, adil fiyatla taşı.
            </Text>
          </Stagger>
        </View>

        <View style={styles.cards}>
          {VALUE_CARDS.map((card, i) => (
            <Stagger key={card.title} delay={220 + i * 50}>
              <View style={styles.card}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name={card.icon} size={20} color={palette.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardDesc}>{card.desc}</Text>
                </View>
              </View>
            </Stagger>
          ))}
        </View>

        <Stagger delay={400} style={styles.ctas}>
          <PrimaryButton
            title="Hemen Başla"
            onPress={() => router.push('/(auth)/register')}
          />
          <Pressable
            style={styles.ghostBtn}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.ghostText}>Giriş Yap</Text>
          </Pressable>
        </Stagger>

        <Stagger delay={500} style={styles.footer}>
          <Pressable onPress={() => router.push('/onboarding')} hitSlop={8}>
            <Text style={styles.footerLink}>Nasıl çalışır? →</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(auth)/admin-login')} hitSlop={8}>
            <Text style={styles.adminLink}>Yönetici girişi</Text>
          </Pressable>
        </Stagger>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    justifyContent: 'space-between',
  },
  logoBlock: { alignItems: 'flex-start' },
  heroBlock: { gap: spacing[3], marginTop: spacing[8] },
  title: {
    fontFamily: logoFontFamily.bold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1,
    color: '#FFFFFF',
  },
  titleAccent: { color: palette.brand },
  subtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 22,
    maxWidth: 420,
  },
  cards: { gap: spacing[3], marginVertical: spacing[6] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: 'rgba(28, 32, 41, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.brandMuted,
    borderWidth: 1,
    borderColor: palette.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 15,
    color: '#FFFFFF',
  },
  cardDesc: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'none',
    marginTop: 2,
  },
  ctas: { gap: spacing[3] },
  ghostBtn: {
    paddingVertical: space.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  ghostText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[5],
  },
  footerLink: {
    ...typography.caption,
    textTransform: 'none',
    color: 'rgba(255,255,255,0.7)',
  },
  adminLink: {
    ...typography.caption,
    textTransform: 'none',
    color: palette.gold,
  },
});

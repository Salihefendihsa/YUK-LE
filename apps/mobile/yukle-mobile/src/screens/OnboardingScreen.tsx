import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../components/brand/Logo';
import { NavlonixMonogram } from '../components/brand/NavlonixMonogram';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { logoFontFamily, typography } from '../theme/typography';
import { markOnboardingSeen } from '../utils/onboarding';

type Slide = {
  key: string;
  title: string;
  body: string;
  visual: 'logo' | 'spark' | 'roles';
};

const SLIDES: Slide[] = [
  {
    key: 'brand',
    title: 'Yapay Zekâ Destekli Lojistik',
    body: 'Yük ve şoför arasında akıllı eşleşme, rota ve fiyat — hepsi tek uygulamada.',
    visual: 'logo',
  },
  {
    key: 'ai-pricing',
    title: 'Adil Fiyat, Şeffaf Teklif',
    body: 'Yapay zekâ rota, ağırlık ve piyasa verisiyle her teklifte size doğru fiyat aralığını önerir.',
    visual: 'spark',
  },
  {
    key: 'roles',
    title: 'Müşteri ve Şoför İçin',
    body: 'Yük gönder, teklif al ve teslimatı canlı takip et — ya da seferine en uygun yükleri bul.',
    visual: 'roles',
  },
];

export function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const { width } = Dimensions.get('window');

  const goNext = () => {
    const next = index + 1;
    if (next < SLIDES.length) {
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setIndex(next);
    } else {
      finish();
    }
  };

  const finish = async () => {
    // Welcome ana giriş; onboarding bittiğinde yeni kullanıcı muhtemelen kayda
    // yönelir. Mevcut kullanıcı login'i Welcome'dan zaten seçebilir.
    await markOnboardingSeen();
    router.replace('/(auth)/register');
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) setIndex(newIndex);
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[palette.bgElevated, palette.bg, '#000000']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orbOrange]} />
      <View style={[styles.orb, styles.orbBlue]} />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing[2] }]}>
        <Logo variant="full" size="sm" theme="dark" />
        <Pressable onPress={finish} hitSlop={12} style={styles.skipBtn}>
          <Text style={styles.skipText}>Atla</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={styles.pager}
        contentContainerStyle={{ alignItems: 'stretch' }}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]}>
            <View style={styles.visualWrap}>
              {slide.visual === 'logo' ? <LogoVisual /> : null}
              {slide.visual === 'spark' ? <SparkVisual /> : null}
              {slide.visual === 'roles' ? <RolesVisual /> : null}
            </View>

            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[6] }]}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>

        <PrimaryButton
          title={isLast ? 'Başla' : 'Devam'}
          onPress={goNext}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

function LogoVisual() {
  return (
    <View style={visualStyles.logoBlock}>
      <Logo variant="full" size="lg" theme="dark" />
      <View style={visualStyles.tagPill}>
        <Ionicons name="sparkles" size={14} color={palette.brand} />
        <Text style={visualStyles.tagText}>AI destekli</Text>
      </View>
    </View>
  );
}

function SparkVisual() {
  return (
    <View style={visualStyles.sparkBlock}>
      <View style={visualStyles.markHalo}>
        <NavlonixMonogram size={88} />
      </View>
      <View style={visualStyles.sparkRow}>
        <Ionicons name="trending-down-outline" size={20} color={palette.success} />
        <Text style={visualStyles.sparkLabel}>Düşük fiyat</Text>
        <View style={visualStyles.sparkDot} />
        <Ionicons name="checkmark-circle" size={20} color={palette.brand} />
        <Text style={[visualStyles.sparkLabel, { color: palette.brand }]}>Adil aralık</Text>
        <View style={visualStyles.sparkDot} />
        <Ionicons name="trending-up-outline" size={20} color={palette.error} />
        <Text style={visualStyles.sparkLabel}>Yüksek fiyat</Text>
      </View>
    </View>
  );
}

function RolesVisual() {
  return (
    <View style={visualStyles.rolesBlock}>
      <View style={visualStyles.roleCard}>
        <View style={visualStyles.roleIconWrap}>
          <Ionicons name="cube-outline" size={26} color={palette.brand} />
        </View>
        <Text style={visualStyles.roleTitle}>Müşteri</Text>
        <Text style={visualStyles.roleSub}>Yük gönder, teklif al</Text>
      </View>
      <View style={visualStyles.roleCard}>
        <View style={visualStyles.roleIconWrap}>
          <Ionicons name="car-sport-outline" size={26} color={palette.brand} />
        </View>
        <Text style={visualStyles.roleTitle}>Şoför</Text>
        <Text style={visualStyles.roleSub}>Sefere uygun yük bul</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  skipBtn: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
  },
  skipText: {
    ...typography.label,
    color: palette.textSecondary,
    textTransform: 'none',
    letterSpacing: 0,
  },
  pager: { flex: 1 },
  slide: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    alignItems: 'center',
  },
  visualWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  title: {
    fontFamily: logoFontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: palette.text,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  body: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    maxWidth: 360,
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    gap: spacing[5],
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.borderSubtle,
  },
  dotActive: {
    width: 22,
    backgroundColor: palette.brand,
  },
  cta: {},
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.22 },
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
    bottom: 120,
    left: -60,
    opacity: 0.12,
  },
});

const visualStyles = StyleSheet.create({
  logoBlock: { alignItems: 'center', gap: spacing[4] },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: 999,
    backgroundColor: palette.brandMuted,
    borderWidth: 1,
    borderColor: palette.brandBorder,
  },
  tagText: {
    ...typography.label,
    color: palette.brand,
    textTransform: 'none',
    letterSpacing: 0,
  },
  sparkBlock: { alignItems: 'center', gap: spacing[5] },
  markHalo: {
    padding: spacing[4],
    borderRadius: 28,
    backgroundColor: palette.brandMuted,
    borderWidth: 1,
    borderColor: palette.brandBorder,
  },
  sparkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  sparkLabel: {
    ...typography.caption,
    color: palette.textSecondary,
    textTransform: 'none',
  },
  sparkDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.borderSubtle,
    marginHorizontal: spacing[1],
  },
  rolesBlock: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  roleCard: {
    width: 140,
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[4],
    borderRadius: 18,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    alignItems: 'center',
    gap: spacing[3],
  },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: palette.brandMuted,
    borderWidth: 1,
    borderColor: palette.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    ...typography.h3,
    color: palette.text,
  },
  roleSub: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
    textTransform: 'none',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../components/brand/Logo';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { logoFontFamily } from '../theme/typography';

// ── Sabitler ──────────────────────────────────────────────────────────────
const USE_VIDEO = true; // false → statik poster + hafif fade fallback
const SLIDE_MS = 4200; // her slayt süresi
const FADE_MS = 700; // içerik cross-fade süresi
const ORANGE = '#FF6B00';
const ORANGE_HI = '#FF8C38'; // vurgu / parlak turuncu (web brand-hover)
const BG = '#0A0D12';
const MAX_W = 480; // web/geniş ekran ortalama

const VIDEO_SRC = require('../../assets/hero-trucks.mp4');
const POSTER = require('../../assets/welcome-bg.png');

// ── Slayt verisi ──────────────────────────────────────────────────────────
type Slide = {
  icon: keyof typeof Ionicons.glyphMap | null;
  label?: string;
  title: string[];
  subtitle: string;
};

const SLIDES: Slide[] = [
  {
    icon: null,
    title: ['Yükünüz güvende,', 'yolunuz {AÇIK}'],
    subtitle: 'Yapay zekâ destekli lojistik — saniyeler içinde eşleş.',
  },
  {
    icon: 'sparkles',
    label: 'AI ADİL FİYAT',
    title: ['Saniyeler içinde', 'adil fiyat.'],
    subtitle: 'Rota ve piyasa verisiyle akıllı öneri.',
  },
  {
    icon: 'navigate',
    label: 'CANLI TAKİP',
    title: ['Yükünü yolda', 'canlı izle.'],
    subtitle: 'Şoför konumu ve ETA tek dokunuşta.',
  },
  {
    icon: 'shield-checkmark',
    label: 'GÜVENLİ ÖDEME',
    title: ['Ödemen', 'güvende.'],
    subtitle: 'Bloke havuz, teslim sonrası serbest.',
  },
];

// {KELIME} → o kelime ORANGE_HI renkte render edilir.
function renderTitleLine(line: string) {
  return line
    .split(/(\{[^}]+\})/g)
    .filter(Boolean)
    .map((part, i) => {
      const m = part.match(/^\{([^}]+)\}$/);
      return m ? (
        <Text key={i} style={styles.titleAccent}>
          {m[1]}
        </Text>
      ) : (
        <Text key={i}>{part}</Text>
      );
    });
}

export function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [reduceMotion, setReduceMotion] = useState(false);
  const [focused, setFocused] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current; // width 0→1
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(14)).current;

  // Video oynatıcı — döngülü, sessiz. Görünüm yalnız hazır olunca biner (poster arkada).
  const player = useVideoPlayer(VIDEO_SRC, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Reduced-motion: video + otomatik geçiş kapanır, dokunmayla manuel gezinme kalır.
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => {
        if (!cancelled) setReduceMotion(Boolean(v));
      })
      .catch(() => {
        /* fail-open: motion on */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) player.pause();
  }, [reduceMotion, player]);

  // Video hazır olunca göster; hata/yükleme sırasında poster kalır (siyah flash yok).
  useEffect(() => {
    // readyToPlay olayı listener bağlanmadan ÖNCE gerçekleşmiş olabilir (özellikle
    // Android'de hızlı/önbellekli decode) → mevcut durumu da oku; yoksa olay kaçar
    // ve video hiç görünmez (poster takılı kalır).
    if (player.status === 'readyToPlay') setVideoReady(true);
    const sub = player.addListener('statusChange', (payload: { status: string }) => {
      setVideoReady(payload.status === 'readyToPlay');
    });
    return () => sub.remove();
  }, [player]);

  // Ekran odağı: blur'da timer + video durur, geri gelince devam eder.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      if (USE_VIDEO && !reduceMotion) player.play();
      return () => {
        setFocused(false);
        player.pause();
      };
    }, [player, reduceMotion]),
  );

  // Otomatik slayt motoru + progress animasyonu. activeIndex değişince (dokunma dahil) resetlenir.
  useEffect(() => {
    if (reduceMotion || !focused) return;
    progressAnim.setValue(0);
    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration: SLIDE_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start();
    const t = setTimeout(() => {
      setActiveIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_MS);
    return () => {
      clearTimeout(t);
      anim.stop();
    };
  }, [activeIndex, reduceMotion, focused, progressAnim]);

  // İçerik cross-fade (opacity + translateY) her slayt değişiminde.
  useEffect(() => {
    if (reduceMotion) {
      contentOpacity.setValue(1);
      contentTranslate.setValue(0);
      return;
    }
    contentOpacity.setValue(0);
    contentTranslate.setValue(14);
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: FADE_MS,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: FADE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex, reduceMotion, contentOpacity, contentTranslate]);

  const goNext = useCallback(() => setActiveIndex((i) => (i + 1) % SLIDES.length), []);
  const goPrev = useCallback(
    () => setActiveIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length),
    [],
  );

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const slide = SLIDES[activeIndex];
  const showVideo = USE_VIDEO && !reduceMotion && videoReady;
  const touchBottom = insets.bottom + 248; // CTA bloğunu açıkta bırak

  return (
    <View style={styles.root}>
      {/* ── Arka plan katmanı ─────────────────────────────────────────── */}
      <View style={styles.bgLayer}>
        <ImageBackground source={POSTER} resizeMode="cover" style={StyleSheet.absoluteFill} />
        {showVideo && (
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
            pointerEvents="none"
          />
        )}
        {/* Alttan koyu scrim — yazı her zaman net */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.82)', '#000']}
          locations={[0, 0.35, 0.7, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Sağ-alt vignette (watermark sigortası) */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.vignette}
          pointerEvents="none"
        />
      </View>

      {/* ── Dokunma bölgeleri (sol önceki / sağ sonraki) — CTA üstünde değil ─ */}
      {!reduceMotion && (
        <>
          <Pressable
            style={[styles.touchZone, { left: 0, bottom: touchBottom }]}
            onPress={goPrev}
            accessibilityLabel="Önceki tanıtım"
          />
          <Pressable
            style={[styles.touchZone, { right: 0, bottom: touchBottom }]}
            onPress={goNext}
            accessibilityLabel="Sonraki tanıtım"
          />
        </>
      )}

      {/* ── İçerik ────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing[4], paddingBottom: insets.bottom + spacing[4] },
        ]}
        pointerEvents="box-none"
      >
        {/* Üst: progress bar + logo */}
        <View style={styles.col} pointerEvents="box-none">
          <View style={styles.progressRow}>
            {SLIDES.map((_, i) => (
              <View key={i} style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width:
                        i < activeIndex
                          ? '100%'
                          : i === activeIndex
                            ? reduceMotion
                              ? '100%'
                              : progressWidth
                            : '0%',
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.logoBlock}>
            <Logo variant="full" size="lg" theme="dark" />
          </View>
        </View>

        <View style={{ flex: 1 }} pointerEvents="none" />

        {/* Alt: slayt metni + CTA */}
        <View style={styles.col} pointerEvents="box-none">
          <Animated.View
            style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslate }] }}
            pointerEvents="none"
          >
            {!!slide.label && (
              <View style={styles.labelRow}>
                {!!slide.icon && <Ionicons name={slide.icon} size={16} color={ORANGE_HI} />}
                <Text style={styles.label}>{slide.label}</Text>
              </View>
            )}
            <Text style={styles.title}>
              {slide.title.map((line, idx) => (
                <Text key={idx}>
                  {renderTitleLine(line)}
                  {idx < slide.title.length - 1 ? '\n' : ''}
                </Text>
              ))}
            </Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </Animated.View>

          <View style={styles.ctas}>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <LinearGradient
                colors={['#FF6B00', '#FF8C38']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryText}>Hemen başla</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.ghostBtn} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.ghostText}>Giriş yap</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/onboarding')}
              hitSlop={8}
              style={styles.howWrap}
            >
              <Text style={styles.howText}>Nasıl çalışır? →</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(auth)/admin-login')}
              hitSlop={8}
              style={styles.adminWrap}
            >
              <Text style={styles.adminText}>Yönetici girişi</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const textShadow = {
  textShadowColor: 'rgba(0,0,0,0.5)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 8,
} as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  bgLayer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  vignette: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 180,
    height: 180,
  },
  touchZone: {
    position: 'absolute',
    top: 0,
    width: '40%',
    zIndex: 1,
  },
  content: {
    flex: 1,
    zIndex: 2,
    paddingHorizontal: spacing[6],
  },
  col: {
    width: '100%',
    maxWidth: MAX_W,
    alignSelf: 'center',
  },
  // Progress bar
  progressRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  logoBlock: { alignItems: 'flex-start', marginTop: spacing[5] },
  // Slayt metni
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing[3],
  },
  label: {
    fontFamily: logoFontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: ORANGE_HI,
    textTransform: 'uppercase',
    ...textShadow,
  },
  title: {
    fontFamily: logoFontFamily.bold,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -1,
    color: '#FFFFFF',
    ...textShadow,
  },
  titleAccent: { color: ORANGE_HI },
  subtitle: {
    fontFamily: logoFontFamily.regular,
    fontSize: 16,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.82)',
    marginTop: spacing[3],
    ...textShadow,
  },
  // CTA
  ctas: { marginTop: spacing[6], gap: spacing[3] },
  primaryBtn: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: logoFontFamily.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  ghostBtn: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: ORANGE,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    fontFamily: logoFontFamily.semiBold,
    fontSize: 16,
    color: ORANGE_HI,
  },
  howWrap: { alignItems: 'center', marginTop: spacing[1] },
  howText: {
    fontFamily: logoFontFamily.regular,
    fontSize: 14,
    color: ORANGE_HI,
  },
  adminWrap: { alignItems: 'center', marginTop: spacing[1] },
  adminText: {
    fontFamily: logoFontFamily.regular,
    fontSize: 13,
    color: palette.gold,
  },
});

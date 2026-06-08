import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PressableScale } from '../../../src/components/ui/PressableScale';
import { StatusPill, type StatusTone } from '../../../src/components/ui/StatusPill';
import { ScreenContainer, ScreenScroll } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getAdminDashboard } from '../../../src/services/admin.service';
import { getSupportOpenCount } from '../../../src/services/support.service';
import type { AdminDashboardStats } from '../../../src/types/admin';
import { useAuthStore } from '../../../src/store/auth.store';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { radius } from '../../../src/theme/radius';
import { useRoleAccent } from '../../../src/theme/useRoleAccent';
import type { RoleAccent } from '../../../src/theme/roleAccent';
import { formatAdminActivity, formatCurrencyTRY } from '../../../src/utils/format';
import { formatSystemServiceLabel, getSystemServicePill } from '../../../src/utils/statusPills';

type IconName = keyof typeof Ionicons.glyphMap;

/** Kırmızı-tint ikon çipi — aksan kuralı: kırmızı yalnız çip/hero/kritik/aktif. */
function IconChip({ name, accent }: { name: IconName; accent: RoleAccent }) {
  return (
    <View
      style={[styles.iconChip, { backgroundColor: accent.accentMuted, borderColor: accent.accentBorder }]}
    >
      <Ionicons name={name} size={18} color={accent.accent} />
    </View>
  );
}

/** Tıklanabilir KPI kartı — gerçek veriden. */
function KpiTile({
  icon,
  label,
  value,
  accent,
  onPress,
  badge,
  badgeTone,
  danger,
}: {
  icon: IconName;
  label: string;
  value: string;
  accent: RoleAccent;
  onPress: () => void;
  badge?: string;
  badgeTone?: StatusTone;
  danger?: boolean;
}) {
  return (
    <View style={styles.tile}>
      <PressableScale onPress={onPress} accessibilityRole="button">
        <Card variant="elevated" padding={4} style={[styles.kpiCard, danger && styles.tileDanger]}>
          <View style={styles.tileHead}>
            <IconChip name={icon} accent={accent} />
            <View style={styles.tileHeadRight}>
              {badge ? <StatusPill label={badge} tone={badgeTone ?? 'neutral'} /> : null}
              <Ionicons name="chevron-forward" size={16} color={palette.textMuted} />
            </View>
          </View>
          <Text style={[styles.tileValue, danger && styles.tileValueDanger]}>{value}</Text>
          {/* Sabit yükseklik etiket alanı — 1 vs 2 satır kartı uzatıp grid'i bozmasın. */}
          <Text style={styles.tileLabel} numberOfLines={2}>
            {label}
          </Text>
        </Card>
      </PressableScale>
    </View>
  );
}

/** Tıklanabilir hızlı işlem çipi. */
function QuickAction({
  icon,
  label,
  count,
  accent,
  onPress,
}: {
  icon: IconName;
  label: string;
  count?: number;
  accent: RoleAccent;
  onPress: () => void;
}) {
  return (
    <View style={styles.tile}>
      <PressableScale onPress={onPress} accessibilityRole="button">
        <Card variant="elevated" padding={3} style={styles.quickCard}>
          <IconChip name={icon} accent={accent} />
          <Text style={styles.quickLabel} numberOfLines={1}>
            {label}
          </Text>
          {count != null && count > 0 ? (
            <View style={[styles.countBadge, { backgroundColor: accent.accentMuted, borderColor: accent.accentBorder }]}>
              <Text style={[styles.countBadgeText, { color: accent.accent }]}>{count}</Text>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={16} color={palette.textMuted} />
        </Card>
      </PressableScale>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const accent = useRoleAccent();
  const router = useRouter();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [supportOpen, setSupportOpen] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      // Ana hook korunur; destek açık-sayısı opsiyonel (başarısızsa 0, dashboard'u bozmaz).
      const [data, openCount] = await Promise.all([
        getAdminDashboard(),
        getSupportOpenCount().catch(() => 0),
      ]);
      setStats(data);
      setSupportOpen(openCount);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setStats(null);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Komuta merkezi yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  const sys = stats?.systemStatus;

  return (
    <ScreenScroll
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent.accent} />
      }
    >
      {/* (a) Üst bar: menü + başlık + bildirim zili (ScreenHeader içinde) */}
      <ScreenHeader
        title="Komuta Merkezi"
        subtitle={`Yönetici — ${user?.fullName ?? 'System administrator'}`}
      />

      {error ? <AlertBanner message={error} tone="error" /> : null}

      {stats ? (
        <>
          {/* (b) Hero — toplam işlem hacmi (gerçek), tıklanınca Ödemeler */}
          <FadeInView>
            <PressableScale
              onPress={() => router.push('/(admin)/(tabs)/payments')}
              accessibilityRole="button"
            >
              <Card variant="hero" padding={4} accent={accent}>
                <View style={styles.heroTop}>
                  <View style={[styles.heroIcon, { backgroundColor: accent.hero.iconBg }]}>
                    <Ionicons name="shield-checkmark" size={24} color={accent.hero.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroTitle}>Operasyon özeti</Text>
                    <Text style={styles.heroSub}>Platform genel bakış</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={accent.hero.iconColor} />
                </View>
                <Text style={styles.heroLabel}>Toplam işlem hacmi</Text>
                <Text style={[styles.heroValue, { color: accent.hero.value }]}>
                  {formatCurrencyTRY(stats.totalTransactionVolume)}
                </Text>
              </Card>
            </PressableScale>
          </FadeInView>

          {/* (c) Servis durum pill'leri — mevcut mantık korunur */}
          <View style={styles.statusRow}>
            {sys?.api ? (
              <StatusPill
                {...getSystemServicePill(sys.api)}
                label={`Servis: ${formatSystemServiceLabel(sys.api)}`}
              />
            ) : null}
            {sys?.db ? (
              <StatusPill
                {...getSystemServicePill(sys.db)}
                label={`Veritabanı: ${formatSystemServiceLabel(sys.db)}`}
              />
            ) : null}
            {sys?.redis ? (
              <StatusPill
                {...getSystemServicePill(sys.redis)}
                label={`Önbellek (bellek-içi): ${formatSystemServiceLabel(sys.redis)}`}
              />
            ) : null}
          </View>

          {/* (d) 2x2 KPI — hepsi gerçek veriden, tıklanabilir */}
          <FadeInView delay={60}>
            <View style={styles.grid}>
              <View style={styles.row2}>
                <KpiTile
                  icon="people-outline"
                  label="Toplam kullanıcı"
                  value={String(stats.totalUsers)}
                  accent={accent}
                  onPress={() => router.push('/(admin)/(tabs)/users')}
                />
                <KpiTile
                  icon="cube-outline"
                  label="Aktif ilan"
                  value={String(stats.activeLoadCount)}
                  accent={accent}
                  badge="Yayında"
                  badgeTone="success"
                  onPress={() => router.push('/(admin)/(tabs)/loads')}
                />
              </View>
              <View style={styles.row2}>
                <KpiTile
                  icon="document-text-outline"
                  label="Bekleyen belge onayı"
                  value={String(stats.pendingReviewCount)}
                  accent={accent}
                  badge="Kritik"
                  badgeTone="error"
                  danger={stats.pendingReviewCount > 0}
                  onPress={() => router.push('/(admin)/(tabs)/reviews')}
                />
                <KpiTile
                  icon="headset-outline"
                  label="Açık destek talebi"
                  value={String(supportOpen)}
                  accent={accent}
                  onPress={() => router.push('/(admin)/(tabs)/support')}
                />
              </View>
            </View>
          </FadeInView>

          {/* (e) Hızlı işlemler 2x2 */}
          <FadeInView delay={100}>
            <Text style={styles.sectionTitle}>Hızlı işlemler</Text>
            <View style={styles.grid}>
              <View style={styles.row2}>
                <QuickAction
                  icon="document-text-outline"
                  label="Belge onayı"
                  count={stats.pendingReviewCount}
                  accent={accent}
                  onPress={() => router.push('/(admin)/(tabs)/reviews')}
                />
                <QuickAction
                  icon="card-outline"
                  label="Ödemeler"
                  accent={accent}
                  onPress={() => router.push('/(admin)/(tabs)/payments')}
                />
              </View>
              <View style={styles.row2}>
                <QuickAction
                  icon="chatbubbles-outline"
                  label="Sohbetler"
                  accent={accent}
                  onPress={() => router.push('/(admin)/(tabs)/chats')}
                />
                <QuickAction
                  icon="settings-outline"
                  label="Sistem"
                  accent={accent}
                  onPress={() => router.push('/(admin)/(tabs)/system')}
                />
              </View>
            </View>
          </FadeInView>

          {/* (g) Canlı aktivite — recentActions (Türkçe + kısaltılmış GUID) */}
          <Card variant="elevated" padding={4}>
            <Text style={styles.cardTitle}>Canlı aktivite</Text>
            {stats.recentActions.length === 0 ? (
              <Text style={styles.muted}>Aktivite bulunamadı.</Text>
            ) : (
              stats.recentActions.slice(0, 10).map((a, index) => (
                <FadeInView key={a.id} delay={Math.min(index * 35, 175)}>
                  <View style={styles.actionRow}>
                    <Text style={styles.actionTime}>
                      {a.timestampUtc
                        ? new Date(a.timestampUtc).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </Text>
                    <Text style={styles.actionNote} numberOfLines={2}>
                      {formatAdminActivity(a.action, a.note, a.targetUserId)}
                    </Text>
                  </View>
                </FadeInView>
              ))
            )}
          </Card>

        </>
      ) : null}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: spacing[3] },

  // Hero — odak kart; KPI'ları ezmeyecek ölçüde (ikon 44, değer 26)
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 4 },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { ...typography.h3, color: palette.text },
  heroSub: { ...typography.caption, textTransform: 'none', marginTop: space.xs },
  heroLabel: { ...typography.caption, textTransform: 'none', marginTop: space.sm },
  heroValue: { ...typography.display, fontSize: 26, letterSpacing: -0.6, marginTop: space.xs },

  // Status pills
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },

  // Grid — kartlar arası eşit gap (space.sm = 8); bölüm ritmi scroll gap (12) ile ayrı
  grid: { gap: space.sm },
  // alignItems:stretch → her sütundaki dış sarmalayıcı en uzun karta eşit yükseklik alır
  row2: { flexDirection: 'row', gap: space.sm, alignItems: 'stretch' },
  // Eşit GENİŞLİK: tile dış View satırın flex çocuğudur (her biri %50); PressableScale/Card içini doldurur
  tile: { flex: 1 },

  // İkon çip — TÜM kartlarda aynı (36×36, glyph 18)
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // KPI tile — kompakt + 4 kart birebir aynı (minHeight + 2-satır etiket alanı)
  kpiCard: { minHeight: 132 },
  tileHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileHeadRight: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  tileValue: { ...typography.h2, fontSize: 22, letterSpacing: -0.5, marginTop: space.sm },
  tileValueDanger: { color: palette.error },
  tileLabel: { ...typography.caption, textTransform: 'none', marginTop: space.xs, minHeight: 34 },
  tileDanger: { borderColor: palette.errorBorder },

  // Quick action — tek satır, sayı sağda küçük rozet
  quickCard: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 60 },
  quickLabel: { ...typography.bodyMedium, fontSize: 14, flex: 1, minWidth: 0 },
  countBadge: {
    minWidth: 22,
    paddingHorizontal: space.xs + 1,
    paddingVertical: 1,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { ...typography.caption, fontSize: 11, fontWeight: '700' },

  // Sections / activity
  sectionTitle: { ...typography.h3, marginBottom: space.sm },
  cardTitle: { ...typography.h3, marginBottom: space.sm },
  muted: { ...typography.caption, textTransform: 'none' },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSubtle,
  },
  actionTime: { ...typography.caption, fontSize: 11, color: palette.textMuted, width: 48 },
  actionNote: { ...typography.bodySmall, color: palette.textSecondary, flex: 1 },
});

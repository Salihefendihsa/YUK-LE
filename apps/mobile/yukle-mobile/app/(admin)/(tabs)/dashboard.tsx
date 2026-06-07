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
import { ADMIN_DASHBOARD_DEMO } from '../../../src/constants/admin-dashboard-demo';
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
import {
  formatAdminLogAction,
  formatAdminLogNote,
  formatCurrencyTRY,
} from '../../../src/utils/format';
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
    <PressableScale style={styles.tile} onPress={onPress} accessibilityRole="button">
      <Card variant="elevated" padding={4} style={danger ? styles.tileDanger : undefined}>
        <View style={styles.tileHead}>
          <IconChip name={icon} accent={accent} />
          <Ionicons name="chevron-forward" size={16} color={palette.textMuted} />
        </View>
        <Text style={[styles.tileValue, danger && styles.tileValueDanger]}>{value}</Text>
        <View style={styles.tileLabelRow}>
          <Text style={styles.tileLabel} numberOfLines={2}>
            {label}
          </Text>
        </View>
        {badge ? (
          <View style={styles.tileBadge}>
            <StatusPill label={badge} tone={badgeTone ?? 'neutral'} />
          </View>
        ) : null}
      </Card>
    </PressableScale>
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
    <PressableScale style={styles.tile} onPress={onPress} accessibilityRole="button">
      <Card variant="elevated" padding={3} style={styles.quickCard}>
        <IconChip name={icon} accent={accent} />
        <View style={styles.quickTextCol}>
          <Text style={styles.quickLabel} numberOfLines={1}>
            {label}
          </Text>
          {count != null ? <Text style={styles.quickCount}>{count}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={15} color={palette.textMuted} />
      </Card>
    </PressableScale>
  );
}

/** Demo metrik mini kartı — her zaman amber "DEMO" rozetli, nötr (kırmızı yok). */
function DemoTile({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <Card variant="elevated" padding={3} style={styles.tile}>
      <View style={styles.tileHead}>
        <View style={styles.demoChip}>
          <Ionicons name={icon} size={17} color={palette.textSecondary} />
        </View>
        <StatusPill label="DEMO" tone="warning" />
      </View>
      <Text style={styles.demoValue}>{value}</Text>
      <Text style={styles.tileLabel} numberOfLines={2}>
        {label}
      </Text>
    </Card>
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
  const demo = ADMIN_DASHBOARD_DEMO;

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
              <Card variant="hero" padding={5} accent={accent} style={styles.hero}>
                <View style={styles.heroTop}>
                  <View style={[styles.heroIcon, { backgroundColor: accent.hero.iconBg }]}>
                    <Ionicons name="shield-checkmark" size={26} color={accent.hero.iconColor} />
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
                label={`Önbellek: ${formatSystemServiceLabel(sys.redis)}`}
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
                      {a.note ? formatAdminLogNote(a.note) : formatAdminLogAction(a.action)}
                    </Text>
                  </View>
                </FadeInView>
              ))
            )}
          </Card>

          {/* (h) Demo veriler — gerçek kaynak yok; amber DEMO rozetli */}
          <FadeInView delay={140}>
            <Text style={styles.sectionTitle}>Demo veriler</Text>
            <View style={styles.grid}>
              <View style={styles.row2}>
                <DemoTile
                  icon="checkmark-done-outline"
                  label="Tamamlanan sefer"
                  value={String(demo.completedTrips)}
                />
                <DemoTile
                  icon="navigate-outline"
                  label="Aktif sefer"
                  value={String(demo.activeTrips)}
                />
              </View>
              <View style={styles.row2}>
                <DemoTile
                  icon="cash-outline"
                  label="Bu ay komisyon"
                  value={formatCurrencyTRY(demo.monthlyCommissionTRY)}
                />
                <DemoTile
                  icon="time-outline"
                  label="Ort. teslimat"
                  value={`${demo.avgDeliveryHours} sa`}
                />
              </View>
            </View>
          </FadeInView>
        </>
      ) : null}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: spacing[3] },

  // Hero
  hero: { marginBottom: space.xs },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { ...typography.h3, color: palette.text },
  heroSub: { ...typography.caption, textTransform: 'none', marginTop: space.xs },
  heroLabel: { ...typography.caption, textTransform: 'none', marginTop: space.md },
  heroValue: { ...typography.display, fontSize: 30, letterSpacing: -0.8, marginTop: space.xs },

  // Status pills
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },

  // Grid
  grid: { gap: space.sm },
  row2: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1 },

  // Icon chip
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // KPI tile
  tileHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileValue: { ...typography.h2, fontSize: 24, letterSpacing: -0.5, marginTop: space.sm },
  tileValueDanger: { color: palette.error },
  tileLabelRow: { marginTop: space.xs },
  tileLabel: { ...typography.caption, textTransform: 'none' },
  tileBadge: { marginTop: space.sm },
  tileDanger: { borderColor: palette.errorBorder },

  // Quick action
  quickCard: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  quickTextCol: { flex: 1, minWidth: 0 },
  quickLabel: { ...typography.bodyMedium, fontSize: 14 },
  quickCount: { ...typography.caption, textTransform: 'none', color: palette.textMuted, marginTop: 1 },

  // Demo tile
  demoChip: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoValue: { ...typography.h3, fontSize: 19, letterSpacing: -0.3, marginTop: space.sm },

  // Sections / activity
  sectionTitle: { ...typography.h3, marginBottom: space.sm, marginTop: space.xs },
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

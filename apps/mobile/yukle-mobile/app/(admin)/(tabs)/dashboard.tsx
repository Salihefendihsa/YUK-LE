import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { ScreenContainer, ScreenScroll, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getAdminDashboard } from '../../../src/services/admin.service';
import type { AdminDashboardStats } from '../../../src/types/admin';
import { useAuthStore } from '../../../src/store/auth.store';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { radius } from '../../../src/theme/radius';
import { useRoleAccent } from '../../../src/theme/useRoleAccent';
import type { RoleAccent } from '../../../src/theme/roleAccent';
import { formatCurrencyTRY } from '../../../src/utils/format';
import { formatSystemServiceLabel, getSystemServicePill } from '../../../src/utils/statusPills';

function KpiCard({
  label,
  value,
  accent,
  danger,
  badge,
}: {
  label: string;
  value: string;
  accent: RoleAccent;
  danger?: boolean;
  badge?: string;
}) {
  return (
    <Card variant="elevated" padding={4} style={danger ? styles.kpiDanger : undefined}>
      <View style={styles.kpiHead}>
        <Text style={styles.kpiLabel}>{label}</Text>
        {badge ? (
          <View style={[styles.kpiBadge, { backgroundColor: accent.accentMuted, borderColor: accent.accentBorder }]}>
            <Text style={[styles.kpiBadgeText, { color: accent.accent }]}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.kpiValue, danger && styles.kpiValueDanger]}>{value}</Text>
    </Card>
  );
}

export default function AdminDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const accent = useRoleAccent();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const data = await getAdminDashboard();
      setStats(data);
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
      <ScreenHeader
        title="Komuta Merkezi"
        subtitle={`Canlı operasyon — ${user?.fullName ?? 'Yönetici'}`}
      />

      {error ? <AlertBanner message={error} tone="error" /> : null}

      {stats ? (
        <>
          <FadeInView>
          <Card variant="gradient" padding={5} accent={accent} style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={[styles.heroIcon, { backgroundColor: accent.accentMuted, borderColor: accent.accentBorder }]}>
                <Ionicons name="shield-checkmark" size={26} color={accent.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Operasyon özeti</Text>
                <Text style={styles.heroSub}>Platform genel bakış</Text>
              </View>
            </View>
          </Card>
          </FadeInView>

          <View style={styles.statusRow}>
            {sys?.api ? (
              <StatusPill {...getSystemServicePill(sys.api)} label={`Servis: ${formatSystemServiceLabel(sys.api)}`} />
            ) : null}
            {sys?.db ? (
              <StatusPill {...getSystemServicePill(sys.db)} label={`Veritabanı: ${formatSystemServiceLabel(sys.db)}`} />
            ) : null}
            {sys?.redis ? (
              <StatusPill
                {...getSystemServicePill(sys.redis)}
                label={`Önbellek: ${formatSystemServiceLabel(sys.redis)}`}
              />
            ) : null}
          </View>

          <View style={styles.kpiGrid}>
            <KpiCard label="Toplam kullanıcı" value={String(stats.totalUsers)} accent={accent} />
            <KpiCard label="Aktif ilan" value={String(stats.activeLoadCount)} accent={accent} badge="Yayında" />
            <KpiCard
              label="Bekleyen belge onayı"
              value={String(stats.pendingReviewCount)}
              accent={accent}
              danger={stats.pendingReviewCount > 0}
              badge="Kritik"
            />
            <KpiCard
              label="Toplam islem hacmi"
              value={formatCurrencyTRY(stats.totalTransactionVolume)}
              accent={accent}
            />
          </View>

          <Card variant="elevated" padding={4}>
            <Text style={styles.cardTitle}>Canli aktivite</Text>
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
                    {a.note ?? a.action ?? 'Aksiyon'}
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
  hero: { marginBottom: space.xs },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: palette.goldMuted,
    borderWidth: 1,
    borderColor: palette.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { ...typography.h3, color: palette.text },
  heroSub: { ...typography.caption, textTransform: 'none', marginTop: space.xs },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  kpiGrid: { gap: space.sm },
  kpiHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiLabel: { ...typography.caption, textTransform: 'none' },
  kpiBadge: {
    borderWidth: 1,
    borderColor: palette.goldBorder,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm - 2,
    paddingVertical: space.xs,
    backgroundColor: palette.goldMuted,
  },
  kpiBadgeText: { ...typography.caption, fontSize: 10, color: palette.gold },
  kpiValue: { ...typography.h2, fontSize: 22, letterSpacing: -0.5 },
  kpiValueDanger: { color: palette.error },
  kpiDanger: { borderColor: palette.errorBorder },
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

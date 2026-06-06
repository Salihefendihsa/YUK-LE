import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PressableScale } from '../../../src/components/ui/PressableScale';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { adminScreenStyles as s } from '../../../src/constants/adminScreenStyles';
import { ScreenContainer, ScreenScroll } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getAdminSystemFull } from '../../../src/services/admin.service';
import type { AdminSystemInfo, SystemExternalStatus } from '../../../src/types/admin';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { radius } from '../../../src/theme/radius';
import { space, spacing } from '../../../src/theme/spacing';
import { useRoleAccent } from '../../../src/theme/useRoleAccent';
import {
  formatExternalEnvironmentLabel,
  formatExternalFrameworkLabel,
  formatExternalStatusMessage,
} from '../../../src/utils/apiErrors';
import { formatDateTimeTR } from '../../../src/utils/format';
import { formatSystemServiceLabel, getSystemServicePill } from '../../../src/utils/statusPills';

const MENU: { title: string; sub: string; href: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { title: 'İlan Yönetimi', sub: 'Tüm ilanlar ve iptal işlemleri', href: '/(admin)/(tabs)/loads', icon: 'cube-outline' },
  { title: 'Sistem Logları', sub: 'Admin işlem kayıtları', href: '/(admin)/(tabs)/logs', icon: 'list-outline' },
  {
    title: 'Engellenen Mesajlar',
    sub: 'Moderasyon kayıtları',
    href: '/(admin)/(tabs)/blocked-messages',
    icon: 'ban-outline',
  },
  { title: 'Sohbetler', sub: 'Konu özeti + mesaj geçmişi', href: '/(admin)/(tabs)/chats', icon: 'chatbubbles-outline' },
  { title: 'Puanlar', sub: 'Yorum listesi, silme', href: '/(admin)/(tabs)/ratings', icon: 'star-outline' },
  { title: 'Canlı Takip', sub: 'Aktif şoför konumları', href: '/(admin)/(tabs)/tracking', icon: 'navigate-outline' },
  { title: 'Ayarlar', sub: 'Hesap ve bildirim tercihleri (yakında)', href: '/(admin)/(tabs)/settings', icon: 'options-outline' },
];

export default function AdminSystemTab() {
  const router = useRouter();
  const accent = useRoleAccent();
  const [system, setSystem] = useState<AdminSystemInfo | null>(null);
  const [external, setExternal] = useState<SystemExternalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      setError('');
      const data = await getAdminSystemFull();
      setSystem(data.system);
      setExternal(data.external);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    fetchStatus().finally(() => setLoading(false));
    const timer = setInterval(() => {
      void fetchStatus();
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Sistem durumu yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenScroll
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent.accent} />
      }
    >
      <ScreenHeader title="Sistem" subtitle="Sistem durumu ve yönetim modülleri" />

      {error ? <AlertBanner message={error} tone="error" /> : null}

      <Card variant="elevated" padding={4}>
        <Text style={styles.cardTitle}>Servis / Veritabanı</Text>
        <View style={styles.pillRow}>
          {system?.api ? (
            <StatusPill
              {...getSystemServicePill(system.api)}
              label={`Servis: ${formatSystemServiceLabel(system.api)}`}
            />
          ) : null}
          {system?.db ? (
            <StatusPill
              {...getSystemServicePill(system.db)}
              label={`Veritabanı: ${formatSystemServiceLabel(system.db)}`}
            />
          ) : null}
        </View>
        <Text style={styles.muted}>
          U-ETDS kuyruk bekleyen: {system?.workers?.uetdsPending ?? 0}
        </Text>
        <Text style={styles.note}>
          Ek sistem metrikleri bu sürümde gösterilmez.
        </Text>
      </Card>

      <Card variant="elevated" padding={4}>
        <Text style={styles.cardTitle}>Sunucu durumu</Text>
        <Text style={styles.muted}>{formatExternalStatusMessage(external?.message)}</Text>
        <Text style={styles.muted}>
          Ortam: {formatExternalEnvironmentLabel(external?.environment)}
        </Text>
        <Text style={styles.muted}>
          Sunucu: {formatExternalFrameworkLabel(external?.framework)}
        </Text>
        <Text style={styles.muted}>
          Sunucu saati: {external?.serverTime ? formatDateTimeTR(external.serverTime) : '-'}
        </Text>
      </Card>

      <Text style={styles.sectionLabel}>Modüller</Text>
      {MENU.map((item) => (
        <PressableScale key={item.href} style={s.linkBtn} onPress={() => router.push(item.href as never)}>
          <View style={styles.linkRow}>
            <View style={[styles.linkIcon, { backgroundColor: accent.accentMuted, borderColor: accent.accentBorder }]}>
              <Ionicons name={item.icon} size={20} color={accent.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.linkTitle}>{item.title}</Text>
              <Text style={s.linkSub}>{item.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
          </View>
        </PressableScale>
      ))}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: space.md },
  cardTitle: { ...typography.h3, marginBottom: space.sm },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.sm },
  muted: { ...typography.caption, textTransform: 'none' },
  note: {
    ...typography.caption,
    fontSize: 11,
    color: palette.textMuted,
    marginTop: space.sm,
    lineHeight: 16,
    textTransform: 'none',
  },
  sectionLabel: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: space.sm,
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: palette.brandMuted,
    borderWidth: 1,
    borderColor: palette.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

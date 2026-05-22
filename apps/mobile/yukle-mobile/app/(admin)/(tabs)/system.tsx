import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { SectionHeader } from '../../../src/components/ui/SectionHeader';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { adminScreenStyles as s } from '../../../src/constants/adminScreenStyles';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getAdminSystemFull } from '../../../src/services/admin.service';
import type { AdminSystemInfo, SystemExternalStatus } from '../../../src/types/admin';
import { palette } from '../../../src/theme/colors';
import { fontFamily, typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { formatDateTimeTR } from '../../../src/utils/format';
import { getSystemServicePill } from '../../../src/utils/statusPills';

const MENU: { title: string; sub: string; href: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { title: 'Ilan Yonetimi', sub: 'Tum ilanlar, iptal (gercek API)', href: '/(admin)/loads', icon: 'cube-outline' },
  { title: 'Sistem Loglari', sub: 'Admin islem kayitlari', href: '/(admin)/logs', icon: 'list-outline' },
  {
    title: 'Engellenen Mesajlar',
    sub: 'Moderasyon kayitlari (bellek)',
    href: '/(admin)/blocked-messages',
    icon: 'ban-outline',
  },
  { title: 'Sohbetler', sub: 'Konu ozeti + mesaj gecmisi', href: '/(admin)/chats', icon: 'chatbubbles-outline' },
  { title: 'Puanlar', sub: 'Yorum listesi, silme', href: '/(admin)/ratings', icon: 'star-outline' },
  { title: 'Canli Takip', sub: 'Aktif sofor konumlari (REST)', href: '/(admin)/tracking', icon: 'navigate-outline' },
  { title: 'Ayarlar', sub: 'UI only — kaydedilmiyor', href: '/(admin)/settings', icon: 'options-outline' },
];

export default function AdminSystemTab() {
  const router = useRouter();
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
      <View style={screenRootStyle}>
        <LoadingState message="Sistem durumu yukleniyor..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={screenRootStyle}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
      }
    >
      <SectionHeader title="Sistem ve Yonetim" subtitle="Gercek API durumu + moduller" />

      {error ? <AlertBanner message={error} tone="error" /> : null}

      <Card variant="elevated" padding={4}>
        <Text style={styles.cardTitle}>API / Veritabani</Text>
        <View style={styles.pillRow}>
          {system?.api ? (
            <StatusPill {...getSystemServicePill(system.api)} label={`API: ${system.api}`} />
          ) : null}
          {system?.db ? (
            <StatusPill {...getSystemServicePill(system.db)} label={`DB: ${system.db}`} />
          ) : null}
        </View>
        <Text style={styles.muted}>
          U-ETDS kuyruk (bekleyen): {system?.workers?.uetdsPending ?? 0}
        </Text>
        <Text style={styles.note}>
          Webdeki Redis/Gemini/uptime metrikleri placeholder — gosterilmiyor.
        </Text>
      </Card>

      <Card variant="elevated" padding={4}>
        <Text style={styles.cardTitle}>Sunucu (GET /System/status)</Text>
        <Text style={styles.muted}>{external?.message ?? '-'}</Text>
        <Text style={styles.muted}>Ortam: {external?.environment ?? '-'}</Text>
        <Text style={styles.muted}>Framework: {external?.framework ?? '-'}</Text>
        <Text style={styles.muted}>
          Sunucu saati: {external?.serverTime ? formatDateTimeTR(external.serverTime) : '-'}
        </Text>
      </Card>

      <Text style={styles.sectionLabel}>Moduller</Text>
      {MENU.map((item) => (
        <Pressable key={item.href} style={s.linkBtn} onPress={() => router.push(item.href as never)}>
          <View style={styles.linkRow}>
            <View style={styles.linkIcon}>
              <Ionicons name={item.icon} size={20} color={palette.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.linkTitle}>{item.title}</Text>
              <Text style={s.linkSub}>{item.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[3] },
  cardTitle: { ...typography.h3, marginBottom: spacing[2] },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[2] },
  muted: { ...typography.caption, textTransform: 'none' },
  note: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: palette.textMuted,
    marginTop: spacing[2],
    lineHeight: 16,
  },
  sectionLabel: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: spacing[2],
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: palette.brandMuted,
    borderWidth: 1,
    borderColor: palette.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

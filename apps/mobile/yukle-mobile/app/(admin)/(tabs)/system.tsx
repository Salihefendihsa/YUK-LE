import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { adminScreenStyles as s } from '../../../src/constants/adminScreenStyles';
import { Colors } from '../../../src/constants/colors';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getAdminSystemFull } from '../../../src/services/admin.service';
import type { AdminSystemInfo, SystemExternalStatus } from '../../../src/types/admin';
import { formatDateTimeTR } from '../../../src/utils/format';

const MENU: { title: string; sub: string; href: string }[] = [
  { title: 'Ilan Yonetimi', sub: 'Tum ilanlar, iptal (gercek API)', href: '/(admin)/loads' },
  { title: 'Sistem Loglari', sub: 'Admin islem kayitlari', href: '/(admin)/logs' },
  { title: 'Engellenen Mesajlar', sub: 'Moderasyon kayitlari (bellek)', href: '/(admin)/blocked-messages' },
  { title: 'Sohbetler', sub: 'Konu ozeti + mesaj gecmisi', href: '/(admin)/chats' },
  { title: 'Puanlar', sub: 'Yorum listesi, silme', href: '/(admin)/ratings' },
  { title: 'Canli Takip', sub: 'Aktif sofor konumlari (REST)', href: '/(admin)/tracking' },
  { title: 'Ayarlar', sub: 'UI only — kaydedilmiyor', href: '/(admin)/settings' },
];

function statusColor(val: string): string {
  const v = val.toLowerCase();
  if (v.includes('online') || v === 'ok') return '#4ade80';
  return '#f87171';
}

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
      <View style={[screenRootStyle, s.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={s.muted}>Sistem durumu yukleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={screenRootStyle}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      <Text style={s.title}>Sistem ve Yonetim</Text>
      <Text style={s.sub}>Gercek API durumu + moduller</Text>

      {error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={s.card}>
        <Text style={s.cardTitle}>API / Veritabani (GET /Admin/system)</Text>
        <Text style={s.muted}>
          API: <Text style={{ color: statusColor(system?.api ?? '-') }}>{system?.api ?? '-'}</Text>
        </Text>
        <Text style={s.muted}>
          DB: <Text style={{ color: statusColor(system?.db ?? '-') }}>{system?.db ?? '-'}</Text>
        </Text>
        <Text style={s.muted}>
          U-ETDS kuyruk (bekleyen): {system?.workers?.uetdsPending ?? 0}
        </Text>
        <Text style={[s.muted, { fontSize: 11, marginTop: 4 }]}>
          Webdeki Redis/Gemini/uptime metrikleri placeholder — gosterilmiyor.
        </Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Sunucu (GET /System/status)</Text>
        <Text style={s.muted}>{external?.message ?? '-'}</Text>
        <Text style={s.muted}>Ortam: {external?.environment ?? '-'}</Text>
        <Text style={s.muted}>Framework: {external?.framework ?? '-'}</Text>
        <Text style={s.muted}>
          Sunucu saati: {external?.serverTime ? formatDateTimeTR(external.serverTime) : '-'}
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Moduller</Text>
      {MENU.map((item) => (
        <Pressable key={item.href} style={s.linkBtn} onPress={() => router.push(item.href as never)}>
          <Text style={s.linkTitle}>{item.title}</Text>
          <Text style={s.linkSub}>{item.sub}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 10 },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

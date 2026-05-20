import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AdminLoadDetailModal } from '../../src/components/admin/AdminLoadDetailModal';
import { Colors } from '../../src/constants/colors';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { cancelAdminLoad, getAdminLoads } from '../../src/services/admin.service';
import type { AdminLoadRow } from '../../src/types/admin';
import { formatCurrencyTRY, formatDateTR } from '../../src/utils/format';

const CANCELLABLE = new Set(['Active', 'Assigned', 'OnWay', 'Arrived']);

function canCancelLoad(status: string): boolean {
  return CANCELLABLE.has(status);
}

export default function AdminLoadsScreen() {
  const router = useRouter();
  const [loads, setLoads] = useState<AdminLoadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminLoadRow | null>(null);

  const fetchData = useCallback(async (q?: string, st?: string) => {
    try {
      setError('');
      const data = await getAdminLoads({
        q: (q !== undefined ? q : search).trim() || undefined,
        status: (st !== undefined ? st : statusFilter).trim() || undefined,
      });
      setLoads(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setLoads([]);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchData('', '').finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const confirmCancel = (row: AdminLoadRow) => {
    Alert.alert(
      'Ilani iptal et',
      `${row.fromCity} → ${row.toCity} ilani iptal edilecek. Bu islem geri alinamaz. Devam?`,
      [
        { text: 'Vazgec', style: 'cancel' },
        {
          text: 'Iptal Et',
          style: 'destructive',
          onPress: () => void doCancel(row),
        },
      ]
    );
  };

  const doCancel = async (row: AdminLoadRow) => {
    setBusyId(row.id);
    setStatusMsg('');
    try {
      await cancelAdminLoad(row.id);
      setStatusMsg('Ilan iptal edildi.');
      setSelected(null);
      await fetchData();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <View style={[screenRootStyle, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Ilanlar yukleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <FlatList
        data={loads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.backLink}>← Geri</Text>
            </Pressable>
            <Text style={styles.title}>Ilan Yonetimi</Text>
            <Text style={styles.sub}>Tum ilanlar — API listesinde musteri/sofor yok</Text>

            <TextInput
              style={styles.input}
              placeholder="Durum (Active, Assigned, ...)"
              placeholderTextColor={Colors.textMuted}
              value={statusFilter}
              onChangeText={setStatusFilter}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Ara: sehir veya aciklama"
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            <Pressable style={styles.filterBtn} onPress={() => fetchData()}>
              <Text style={styles.filterBtnText}>Filtrele / Yenile</Text>
            </Pressable>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            {statusMsg ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{statusMsg}</Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Ilan bulunamadi</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable onPress={() => setSelected(item)}>
              <Text style={styles.route}>
                {item.fromCity} → {item.toCity}
              </Text>
              <Text style={styles.muted}>Durum: {item.status}</Text>
              <Text style={styles.muted}>Fiyat: {formatCurrencyTRY(item.price)}</Text>
              <Text style={styles.muted}>Tarih: {formatDateTR(item.createdAt)}</Text>
              <Text style={styles.detailLink}>Detay →</Text>
            </Pressable>
            {canCancelLoad(item.status) ? (
              <Pressable
                style={[styles.cancelBtn, busyId === item.id && styles.btnDisabled]}
                onPress={() => confirmCancel(item)}
                disabled={busyId === item.id}
              >
                {busyId === item.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.cancelBtnText}>Iptal Et</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        )}
      />

      {selected ? (
        <AdminLoadDetailModal
          row={selected}
          visible={!!selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  backLink: { color: Colors.primary, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: Colors.textSecondary, fontSize: 12, marginBottom: 12 },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    marginBottom: 8,
  },
  filterBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filterBtnText: { color: Colors.primary, fontWeight: '600' },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  route: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  detailLink: { color: Colors.primary, fontSize: 13, fontWeight: '700', marginTop: 4 },
  cancelBtn: {
    backgroundColor: Colors.error,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#fff', fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
  successBox: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  successText: { color: Colors.success, fontSize: 13, fontWeight: '600' },
});

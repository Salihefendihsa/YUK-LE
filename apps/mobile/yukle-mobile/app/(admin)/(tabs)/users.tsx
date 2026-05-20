import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { AdminUserDetailModal } from '../../../src/components/admin/AdminUserDetailModal';
import { Colors } from '../../../src/constants/colors';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import {
  customerToListItem,
  driverToListItem,
  getAdminCustomers,
  getAdminDrivers,
  toggleUserActive,
} from '../../../src/services/admin.service';
import type { AdminUserListItem } from '../../../src/types/admin';
import { formatCurrencyTRY } from '../../../src/utils/format';

type UserTab = 'Driver' | 'Customer';

export default function AdminUsersTab() {
  const [tab, setTab] = useState<UserTab>('Driver');
  const [drivers, setDrivers] = useState<AdminUserListItem[]>([]);
  const [customers, setCustomers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminUserListItem | null>(null);

  const fetchData = useCallback(async (searchQuery?: string) => {
    try {
      setError('');
      const q = (searchQuery !== undefined ? searchQuery : search).trim() || undefined;
      const [driverRows, customerRows] = await Promise.all([
        getAdminDrivers({ search: q }),
        getAdminCustomers({ search: q }),
      ]);
      setDrivers(driverRows.map(driverToListItem));
      setCustomers(customerRows.map(customerToListItem));
    } catch (e) {
      setError(getApiErrorMessage(e));
      setDrivers([]);
      setCustomers([]);
    }
  }, [search]);

  useEffect(() => {
    fetchData('').finally(() => setLoading(false));
  }, [fetchData]);

  const list = useMemo(() => (tab === 'Driver' ? drivers : customers), [tab, drivers, customers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const confirmToggle = (item: AdminUserListItem) => {
    const nextActive = !item.isActive;
    const action = nextActive ? 'aktif etmek' : 'pasif / askiya almak';
    Alert.alert(
      'Hesap durumu',
      `${item.fullName} kullanicisini ${action} istiyor musunuz?`,
      [
        { text: 'Iptal', style: 'cancel' },
        {
          text: 'Onayla',
          style: nextActive ? 'default' : 'destructive',
          onPress: () => void doToggle(item),
        },
      ]
    );
  };

  const doToggle = async (item: AdminUserListItem) => {
    setTogglingId(item.id);
    setStatusMsg('');
    setError('');
    try {
      const result = await toggleUserActive(item.id);
      setStatusMsg(
        `${item.fullName} — ${result.isActive ? 'Aktif' : 'Pasif'} olarak guncellendi.`
      );
      await fetchData();
      if (selected?.id === item.id) {
        setSelected({ ...item, isActive: result.isActive });
      }
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <View style={[screenRootStyle, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Kullanicilar yukleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <FlatList
        data={list}
        keyExtractor={(item) => `${item.role}-${item.id}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Kullanicilar</Text>
            <Text style={styles.sub}>Sofor ve musteri yonetimi</Text>

            <View style={styles.tabRow}>
              <Pressable
                style={[styles.tabBtn, tab === 'Driver' && styles.tabBtnActive]}
                onPress={() => setTab('Driver')}
              >
                <Text style={[styles.tabText, tab === 'Driver' && styles.tabTextActive]}>
                  Soforler ({drivers.length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tabBtn, tab === 'Customer' && styles.tabBtnActive]}
                onPress={() => setTab('Customer')}
              >
                <Text style={[styles.tabText, tab === 'Customer' && styles.tabTextActive]}>
                  Musteriler ({customers.length})
                </Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.search}
              value={search}
              onChangeText={setSearch}
              placeholder="Ad, e-posta veya telefon ara..."
              placeholderTextColor={Colors.textMuted}
              onSubmitEditing={() => fetchData()}
            />
            <Pressable style={styles.filterBtn} onPress={() => fetchData()}>
              <Text style={styles.filterBtnText}>Ara / Yenile</Text>
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
              <Text style={styles.emptyTitle}>
                {tab === 'Driver' ? 'Sofor bulunamadi' : 'Musteri bulunamadi'}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable onPress={() => setSelected(item)}>
              <View style={styles.cardHead}>
                <Text style={styles.cardName}>{item.fullName}</Text>
                <Text style={[styles.statusBadge, item.isActive ? styles.active : styles.inactive]}>
                  {item.isActive ? 'Aktif' : 'Pasif'}
                </Text>
              </View>
              <Text style={styles.muted}>{item.phone}</Text>
              <Text style={styles.muted}>
                {item.role === 'Driver' ? 'Sofor' : 'Musteri'}
                {item.role === 'Driver' && item.approvalStatus
                  ? ` · Onay: ${item.approvalStatus}`
                  : ''}
              </Text>
              {item.role === 'Driver' && item.vehicle ? (
                <Text style={styles.muted}>Plaka: {item.vehicle}</Text>
              ) : null}
              {item.role === 'Customer' ? (
                <Text style={styles.muted}>
                  Ilan: {item.totalLoadCount ?? 0} · Harcama:{' '}
                  {formatCurrencyTRY(item.totalSpent ?? 0)}
                </Text>
              ) : null}
              <Text style={styles.detailLink}>Detay →</Text>
            </Pressable>

            <Pressable
              style={[styles.toggleBtn, togglingId === item.id && styles.btnDisabled]}
              onPress={() => confirmToggle(item)}
              disabled={togglingId === item.id}
            >
              {togglingId === item.id ? (
                <ActivityIndicator color={Colors.bgDark} size="small" />
              ) : (
                <Text style={styles.toggleBtnText}>
                  {item.isActive ? 'Pasif Yap' : 'Aktif Et'}
                </Text>
              )}
            </Pressable>
          </View>
        )}
      />

      {selected ? (
        <AdminUserDetailModal
          item={selected}
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
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: Colors.textSecondary, fontSize: 13, marginBottom: 12 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tabBtnActive: { borderColor: Colors.primary, backgroundColor: 'rgba(255,107,0,0.12)' },
  tabText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  search: {
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
  filterBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
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
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', flex: 1 },
  statusBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  active: { color: Colors.success, borderWidth: 1, borderColor: Colors.success },
  inactive: { color: Colors.error, borderWidth: 1, borderColor: Colors.error },
  detailLink: { color: Colors.primary, fontSize: 13, fontWeight: '700', marginTop: 4 },
  toggleBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleBtnText: { color: Colors.bgDark, fontWeight: '700', fontSize: 14 },
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

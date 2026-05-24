import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AdminUserDetailModal } from '../../../src/components/admin/AdminUserDetailModal';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PrimaryButton } from '../../../src/components/ui/PrimaryButton';
import { SectionHeader } from '../../../src/components/ui/SectionHeader';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { TextField } from '../../../src/components/ui/TextField';
import { ScreenContainer, ScreenScroll, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import {
  activateUser,
  customerToListItem,
  driverToListItem,
  getAdminCustomers,
  getAdminDrivers,
} from '../../../src/services/admin.service';
import type { AdminUserListItem } from '../../../src/types/admin';
import { palette } from '../../../src/theme/colors';
import { fontFamily, typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY } from '../../../src/utils/format';
import { getApprovalStatusPill } from '../../../src/utils/statusPills';

type UserTab = 'Driver' | 'Customer';

function activePill(isActive: boolean) {
  return isActive
    ? { label: 'Aktif', tone: 'success' as const }
    : { label: 'Pasif', tone: 'error' as const };
}

export default function AdminUsersTab() {
  const { contentInset } = useScreenInsets();
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

  const onAccountAction = (item: AdminUserListItem) => {
    if (item.isActive) {
      setSelected(item);
      return;
    }
    Alert.alert('Hesabi aktif et', `${item.fullName} yeniden aktif edilsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Aktif Et',
        onPress: () => void doActivate(item),
      },
    ]);
  };

  const doActivate = async (item: AdminUserListItem) => {
    setTogglingId(item.id);
    setStatusMsg('');
    setError('');
    try {
      await activateUser(item.id);
      setStatusMsg(`${item.fullName} aktif edildi.`);
      await fetchData();
      if (selected?.id === item.id) {
        setSelected({ ...item, isActive: true });
      }
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Kullanıcılar yükleniyor..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={list}
        keyExtractor={(item) => `${item.role}-${item.id}`}
        contentContainerStyle={[styles.list, contentInset]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader title="Kullanıcılar" subtitle="Şoför ve müşteri yönetimi" />

            <View style={styles.tabRow}>
              <Pressable
                style={[styles.tabBtn, tab === 'Driver' && styles.tabBtnActive]}
                onPress={() => setTab('Driver')}
              >
                <Text style={[styles.tabText, tab === 'Driver' && styles.tabTextActive]}>
                  Şoförler ({drivers.length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tabBtn, tab === 'Customer' && styles.tabBtnActive]}
                onPress={() => setTab('Customer')}
              >
                <Text style={[styles.tabText, tab === 'Customer' && styles.tabTextActive]}>
                  Müşteriler ({customers.length})
                </Text>
              </Pressable>
            </View>

            <TextField
              icon="search-outline"
              placeholder="Ad, e-posta veya telefon ara..."
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => fetchData()}
            />
            <PrimaryButton
              title="Ara / Yenile"
              onPress={() => fetchData()}
              style={styles.searchBtn}
            />

            {error ? <AlertBanner message={error} tone="error" /> : null}
            {statusMsg ? <AlertBanner message={statusMsg} tone="success" /> : null}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="👥"
              title={tab === 'Driver' ? 'Şoför bulunamadı' : 'Müşteri bulunamadı'}
              description="Arama kriterlerini değiştirin veya yenileyin."
            />
          ) : null
        }
        renderItem={({ item }) => {
          const ap = activePill(item.isActive);
          const approvalPill =
            item.role === 'Driver' && item.approvalStatus
              ? getApprovalStatusPill(item.approvalStatus)
              : null;

          return (
            <Card variant="elevated" padding={4} style={styles.userCard}>
              <Pressable onPress={() => setSelected(item)}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.fullName}
                  </Text>
                  <StatusPill label={ap.label} tone={ap.tone} />
                </View>
                <Text style={styles.muted}>{item.phone}</Text>
                <View style={styles.pillRow}>
                  <StatusPill
                    label={item.role === 'Driver' ? 'Şoför' : 'Müşteri'}
                    tone="brand"
                  />
                  {approvalPill ? <StatusPill {...approvalPill} /> : null}
                </View>
                {item.role === 'Driver' && item.vehicle ? (
                  <Text style={styles.muted}>Plaka: {item.vehicle}</Text>
                ) : null}
                {item.role === 'Customer' ? (
                  <Text style={styles.muted}>
                    İlan: {item.totalLoadCount ?? 0} · Harcama:{' '}
                    {formatCurrencyTRY(item.totalSpent ?? 0)}
                  </Text>
                ) : null}
                <Text style={styles.detailLink}>Detay →</Text>
              </Pressable>

              {togglingId === item.id ? (
                <View style={styles.toggleLoading}>
                  <ActivityIndicator color={palette.brand} size="small" />
                </View>
              ) : (
                <PrimaryButton
                  title={item.isActive ? 'Askiya Al' : 'Aktif Et'}
                  onPress={() => onAccountAction(item)}
                  style={styles.toggleBtn}
                />
              )}
            </Card>
          );
        }}
      />

      {selected ? (
        <AdminUserDetailModal
          item={selected}
          visible={!!selected}
          onClose={() => setSelected(null)}
          onUpdated={() => void fetchData()}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[2] },
  tabRow: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[3] },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: 'center',
    backgroundColor: palette.surface,
  },
  tabBtnActive: {
    borderColor: palette.brandBorder,
    backgroundColor: palette.brandMuted,
  },
  tabText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: palette.textMuted,
  },
  tabTextActive: { color: palette.brand },
  searchBtn: { marginBottom: spacing[3] },
  userCard: { marginBottom: spacing[2], gap: spacing[2] },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing[2] },
  cardName: { ...typography.h3, flex: 1 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[1] },
  muted: { ...typography.caption, textTransform: 'none' },
  detailLink: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: palette.brand,
    marginTop: spacing[2],
  },
  toggleBtn: { marginTop: spacing[1] },
  toggleLoading: { paddingVertical: spacing[3], alignItems: 'center' },
});

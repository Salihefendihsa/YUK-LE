import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AdminLoadDetailModal } from '../../../src/components/admin/AdminLoadDetailModal';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PressableScale } from '../../../src/components/ui/PressableScale';
import { PrimaryButton } from '../../../src/components/ui/PrimaryButton';
import { SectionHeader } from '../../../src/components/ui/SectionHeader';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { TextField } from '../../../src/components/ui/TextField';
import { ScreenContainer, ScreenScroll, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { cancelAdminLoad, getAdminLoads } from '../../../src/services/admin.service';
import { previewSettlement } from '../../../src/services/settlement.service';
import type { AdminLoadRow } from '../../../src/types/admin';
import { palette } from '../../../src/theme/colors';
import { roleAccents } from '../../../src/theme/roleAccent';
import { typography } from '../../../src/theme/typography';
import { radius } from '../../../src/theme/radius';
import { space, spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY, formatDateTR } from '../../../src/utils/format';
import { getLoadStatusPill } from '../../../src/utils/statusPills';

const CANCELLABLE = new Set(['Active', 'Assigned']);

function canCancelLoad(status: string): boolean {
  return CANCELLABLE.has(status);
}

function blockCancelMessage(status: string): string {
  if (status === 'OnWay' || status === 'Arrived')
    return 'Sefer başladığı için iptal edilemez; destek ile iletişime geçin.';
  if (status === 'Delivered') return 'Teslim edilmiş ilan iptal edilemez.';
  if (status === 'Cancelled') return 'İlan zaten iptal edilmiş.';
  return 'Bu ilan iptal edilemez.';
}

export default function AdminLoadsScreen() {
  const { contentInset } = useScreenInsets();
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

  const confirmCancel = async (row: AdminLoadRow) => {
    if (!canCancelLoad(row.status)) {
      Alert.alert('İptal edilemez', blockCancelMessage(row.status));
      return;
    }

    let message = `${row.fromCity} → ${row.toCity} ilanı iptal edilecek. Bu işlem geri alınamaz.`;
    if (row.status === 'Assigned' && row.price > 0) {
      try {
        const s = await previewSettlement(row.price);
        message = `${message}\n\nMüşteriye iade: ${formatCurrencyTRY(s.customerTotal)}`;
      } catch {
        message = `${message}\n\nMüşteriye tam iade yapılacak.`;
      }
    }

    Alert.alert('İlanı iptal et', message, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal Et',
        style: 'destructive',
        onPress: () => void doCancel(row),
      },
    ]);
  };

  const doCancel = async (row: AdminLoadRow) => {
    setBusyId(row.id);
    setStatusMsg('');
    try {
      const res = await cancelAdminLoad(row.id);
      setStatusMsg(res.refundAmount != null && res.refundAmount > 0
        ? `${res.message} İade: ${formatCurrencyTRY(res.refundAmount)}`
        : res.message || 'İlan iptal edildi.');
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
      <ScreenContainer>
        <LoadingState message="İlanlar yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={loads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, contentInset]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={roleAccents.admin.accent} />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader title="İlanlar" subtitle="Tüm ilanlar — müşteri ve şoför adları" />

            <TextField
              icon="filter-outline"
              placeholder="Durum filtrele"
              value={statusFilter}
              onChangeText={setStatusFilter}
              autoCapitalize="none"
            />
            <TextField
              icon="search-outline"
              placeholder="Ara: şehir veya açıklama"
              value={search}
              onChangeText={setSearch}
            />
            <PrimaryButton title="Filtrele / Yenile" onPress={() => fetchData()} style={styles.filterBtn} />

            {error ? <AlertBanner message={error} tone="error" /> : null}
            {statusMsg ? <AlertBanner message={statusMsg} tone="success" /> : null}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState icon="📦" title="İlan bulunamadı" description="Filtreyi değiştirin." />
          ) : null
        }
        renderItem={({ item, index }) => {
          const pill = getLoadStatusPill(item.status);
          return (
            <FadeInView delay={Math.min(index * 40, 200)}>
            <Card variant="elevated" padding={4} style={styles.loadCard}>
              <PressableScale onPress={() => setSelected(item)}>
                <View style={styles.loadHead}>
                  <Text style={styles.route}>
                    {item.fromCity} → {item.toCity}
                  </Text>
                  <StatusPill {...pill} />
                </View>
                <Text style={styles.muted}>Müşteri: {item.customerName ?? '—'}</Text>
                <Text style={styles.muted}>Şoför: {item.driverName ?? 'Atanmadı'}</Text>
                <Text style={styles.muted}>Fiyat: {formatCurrencyTRY(item.price)}</Text>
                <Text style={styles.muted}>Tarih: {formatDateTR(item.createdAt)}</Text>
                <Text style={styles.detailLink}>Detay →</Text>
              </PressableScale>
              {canCancelLoad(item.status) ? (
                busyId === item.id ? (
                  <View style={styles.cancelLoading}>
                    <ActivityIndicator color={palette.error} size="small" />
                  </View>
                ) : (
                  <PressableScale style={styles.cancelBtn} onPress={() => confirmCancel(item)}>
                    <Text style={styles.cancelBtnText}>İptal Et</Text>
                  </PressableScale>
                )
              ) : null}
            </Card>
            </FadeInView>
          );
        }}
      />

      {selected ? (
        <AdminLoadDetailModal
          row={selected}
          visible={!!selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.md, paddingBottom: spacing[10], gap: space.sm },
  filterBtn: { marginBottom: space.md },
  loadCard: { marginBottom: space.sm, gap: space.sm },
  loadHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.sm,
  },
  route: { ...typography.h3, flex: 1 },
  muted: { ...typography.caption, textTransform: 'none' },
  detailLink: { ...typography.bodyMedium, fontSize: 13, color: roleAccents.admin.accent, marginTop: space.xs },
  cancelBtn: {
    backgroundColor: palette.error,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  cancelBtnText: { ...typography.bodyMedium, color: palette.text },
  cancelLoading: { paddingVertical: space.md, alignItems: 'center' },
});

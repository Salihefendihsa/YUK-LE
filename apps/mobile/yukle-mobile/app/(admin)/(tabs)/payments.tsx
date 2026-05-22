import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PrimaryButton } from '../../../src/components/ui/PrimaryButton';
import { SectionHeader } from '../../../src/components/ui/SectionHeader';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { TextField } from '../../../src/components/ui/TextField';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getAdminPayments, releaseAdminPayment } from '../../../src/services/admin.service';
import type { AdminPaymentRow } from '../../../src/types/admin';
import { palette } from '../../../src/theme/colors';
import { fontFamily, typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY, formatDateTR } from '../../../src/utils/format';
import { getPaymentStatusPill } from '../../../src/utils/statusPills';

function canRelease(status: string): boolean {
  return status === 'Blocked';
}

export default function AdminPaymentsTab() {
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async (st?: string) => {
    try {
      setError('');
      const data = await getAdminPayments({
        status: (st !== undefined ? st : statusFilter).trim() || undefined,
      });
      setPayments(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setPayments([]);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData('').finally(() => setLoading(false));
  }, [fetchData]);

  const summary = useMemo(() => {
    const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
    const blockedCount = payments.filter((p) => p.status === 'Blocked').length;
    const releasedCount = payments.filter((p) => p.status === 'Released').length;
    return { totalAmount, blockedCount, releasedCount, count: payments.length };
  }, [payments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const confirmRelease = (row: AdminPaymentRow) => {
    Alert.alert(
      'Serbest birak',
      `${formatCurrencyTRY(row.amount)} tutarli odeme serbest birakilsin mi?`,
      [
        { text: 'Vazgec', style: 'cancel' },
        { text: 'Serbest Birak', onPress: () => void doRelease(row) },
      ]
    );
  };

  const doRelease = async (row: AdminPaymentRow) => {
    setBusyId(row.id);
    setStatusMsg('');
    try {
      await releaseAdminPayment(row.id);
      setStatusMsg('Odeme serbest birakildi.');
      await fetchData();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <View style={screenRootStyle}>
        <LoadingState message="Odemeler yukleniyor..." />
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        ListHeaderComponent={
          <>
            <SectionHeader
              title="Odeme ve Havuz"
              subtitle="Gercek API alanlari — sahte komisyon KPI yok"
            />

            <View style={styles.kpiRow}>
              <Card variant="elevated" padding={3} style={styles.kpi}>
                <Text style={styles.kpiLabel}>Kayit</Text>
                <Text style={styles.kpiValue}>{summary.count}</Text>
              </Card>
              <Card variant="elevated" padding={3} style={styles.kpi}>
                <Text style={styles.kpiLabel}>Toplam tutar</Text>
                <Text style={styles.kpiValueSmall}>{formatCurrencyTRY(summary.totalAmount)}</Text>
              </Card>
              <Card variant="elevated" padding={3} style={styles.kpi}>
                <Text style={styles.kpiLabel}>Havuzda</Text>
                <Text style={styles.kpiValue}>{summary.blockedCount}</Text>
              </Card>
              <Card variant="elevated" padding={3} style={styles.kpi}>
                <Text style={styles.kpiLabel}>Serbest</Text>
                <Text style={styles.kpiValue}>{summary.releasedCount}</Text>
              </Card>
            </View>

            <TextField
              icon="filter-outline"
              placeholder="Durum (Blocked, Released, ...)"
              value={statusFilter}
              onChangeText={setStatusFilter}
              autoCapitalize="none"
            />
            <PrimaryButton
              title="Filtrele / Yenile"
              onPress={() => fetchData()}
              style={styles.filterBtn}
            />

            {error ? <AlertBanner message={error} tone="error" /> : null}
            {statusMsg ? <AlertBanner message={statusMsg} tone="success" /> : null}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState icon="💳" title="Odeme kaydi yok" description="Filtreyi degistirin." />
          ) : null
        }
        renderItem={({ item }) => {
          const pill = getPaymentStatusPill(item.status);
          return (
            <Card variant="elevated" padding={4} style={styles.payCard}>
              <View style={styles.payHead}>
                <Text style={styles.amount}>{formatCurrencyTRY(item.amount)}</Text>
                <StatusPill {...pill} />
              </View>
              <Text style={styles.muted}>Ilan: {item.loadId.slice(0, 8)}...</Text>
              <Text style={styles.muted}>Islem: {item.transactionId || '-'}</Text>
              <Text style={styles.muted}>Tarih: {formatDateTR(item.createdAt)}</Text>
              {canRelease(item.status) ? (
                busyId === item.id ? (
                  <View style={styles.releaseLoading}>
                    <ActivityIndicator color={palette.brand} size="small" />
                  </View>
                ) : (
                  <PrimaryButton
                    title="Serbest Birak"
                    onPress={() => confirmRelease(item)}
                    style={styles.releaseBtn}
                  />
                )
              ) : null}
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[2] },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[3] },
  kpi: { flex: 1, minWidth: '45%', gap: spacing[1] },
  kpiLabel: { ...typography.caption, textTransform: 'none' },
  kpiValue: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: palette.gold,
  },
  kpiValueSmall: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: palette.gold,
  },
  filterBtn: { marginBottom: spacing[3] },
  payCard: { marginBottom: spacing[2], gap: spacing[1] },
  payHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
  },
  amount: { ...typography.h3, flex: 1 },
  muted: { ...typography.caption, textTransform: 'none' },
  releaseBtn: { marginTop: spacing[2] },
  releaseLoading: { paddingVertical: spacing[3], alignItems: 'center' },
});

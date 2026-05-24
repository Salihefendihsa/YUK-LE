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
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PrimaryButton } from '../../../src/components/ui/PrimaryButton';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { TextField } from '../../../src/components/ui/TextField';
import { ScreenContainer, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getAdminPayments, releaseAdminPayment } from '../../../src/services/admin.service';
import type { AdminPaymentRow } from '../../../src/types/admin';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY, formatDateTR } from '../../../src/utils/format';
import { getPaymentStatusPill } from '../../../src/utils/statusPills';

function canRelease(status: string): boolean {
  return status === 'Blocked';
}

export default function AdminPaymentsTab() {
  const { contentInset } = useScreenInsets();
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
      'Serbest bırak',
      `${formatCurrencyTRY(row.amount)} tutarlı ödeme serbest bırakılsın mı?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Serbest Bırak', onPress: () => void doRelease(row) },
      ]
    );
  };

  const doRelease = async (row: AdminPaymentRow) => {
    setBusyId(row.id);
    setStatusMsg('');
    try {
      await releaseAdminPayment(row.id);
      setStatusMsg('Ödeme serbest bırakıldı.');
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
        <LoadingState message="Ödemeler yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, contentInset]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="Ödemeler"
              subtitle="Ödeme kayıtları — sahte komisyon KPI yok"
            />

            <View style={styles.kpiRow}>
              <Card variant="elevated" padding={3} style={styles.kpi}>
                <Text style={styles.kpiLabel}>Kayıt</Text>
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
              placeholder="Durum filtrele"
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
            <EmptyState icon="💳" title="Ödeme kaydı yok" description="Filtreyi değiştirin." />
          ) : null
        }
        renderItem={({ item, index }) => {
          const pill = getPaymentStatusPill(item.status);
          return (
            <FadeInView delay={Math.min(index * 40, 200)}>
              <Card variant="elevated" padding={4} style={styles.payCard}>
                <View style={styles.payHead}>
                  <Text style={styles.amount}>{formatCurrencyTRY(item.amount)}</Text>
                  <StatusPill {...pill} />
                </View>
                <Text style={styles.muted}>İlan: {item.loadId.slice(0, 8)}...</Text>
                <Text style={styles.muted}>İşlem: {item.transactionId || '-'}</Text>
                <Text style={styles.muted}>Tarih: {formatDateTR(item.createdAt)}</Text>
                {canRelease(item.status) ? (
                  busyId === item.id ? (
                    <View style={styles.releaseLoading}>
                      <ActivityIndicator color={palette.brand} size="small" />
                    </View>
                  ) : (
                    <PrimaryButton
                      title="Serbest Bırak"
                      onPress={() => confirmRelease(item)}
                      style={styles.releaseBtn}
                    />
                  )
                ) : null}
              </Card>
            </FadeInView>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.md, paddingBottom: spacing[10], gap: space.sm },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
  kpi: { flex: 1, minWidth: '45%', gap: space.xs },
  kpiLabel: { ...typography.caption, textTransform: 'none' },
  kpiValue: { ...typography.h2, color: palette.gold },
  kpiValueSmall: { ...typography.bodyMedium, color: palette.gold },
  filterBtn: { marginBottom: space.md },
  payCard: { marginBottom: space.sm, gap: space.xs },
  payHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.sm,
  },
  amount: { ...typography.h3, flex: 1 },
  muted: { ...typography.caption, textTransform: 'none' },
  releaseBtn: { marginTop: space.sm },
  releaseLoading: { paddingVertical: space.md, alignItems: 'center' },
});

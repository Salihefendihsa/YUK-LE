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
import { Colors } from '../../../src/constants/colors';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getAdminPayments, releaseAdminPayment } from '../../../src/services/admin.service';
import type { AdminPaymentRow } from '../../../src/types/admin';
import { formatCurrencyTRY, formatDateTR } from '../../../src/utils/format';

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
      <View style={[screenRootStyle, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Odemeler yukleniyor...</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Odeme ve Havuz</Text>
            <Text style={styles.sub}>Gercek API alanlari — sahte komisyon KPI yok</Text>

            <View style={styles.kpiRow}>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>Kayit</Text>
                <Text style={styles.kpiValue}>{summary.count}</Text>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>Toplam tutar</Text>
                <Text style={styles.kpiValueSmall}>{formatCurrencyTRY(summary.totalAmount)}</Text>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>Havuzda</Text>
                <Text style={styles.kpiValue}>{summary.blockedCount}</Text>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>Serbest</Text>
                <Text style={styles.kpiValue}>{summary.releasedCount}</Text>
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Durum (Blocked, Released, ...)"
              placeholderTextColor={Colors.textMuted}
              value={statusFilter}
              onChangeText={setStatusFilter}
              autoCapitalize="none"
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
              <Text style={styles.emptyTitle}>Odeme kaydi yok</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.amount}>{formatCurrencyTRY(item.amount)}</Text>
            <Text style={styles.muted}>Durum: {item.status}</Text>
            <Text style={styles.muted}>Ilan: {item.loadId.slice(0, 8)}...</Text>
            <Text style={styles.muted}>Islem: {item.transactionId || '-'}</Text>
            <Text style={styles.muted}>Tarih: {formatDateTR(item.createdAt)}</Text>
            {canRelease(item.status) ? (
              <Pressable
                style={[styles.releaseBtn, busyId === item.id && styles.btnDisabled]}
                onPress={() => confirmRelease(item)}
                disabled={busyId === item.id}
              >
                {busyId === item.id ? (
                  <ActivityIndicator color={Colors.bgDark} size="small" />
                ) : (
                  <Text style={styles.releaseBtnText}>Serbest Birak</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: Colors.textSecondary, fontSize: 12, marginBottom: 12 },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  kpi: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.bgCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    gap: 4,
  },
  kpiLabel: { color: Colors.textMuted, fontSize: 11 },
  kpiValue: { color: Colors.primaryGold, fontSize: 20, fontWeight: '800' },
  kpiValueSmall: { color: Colors.primaryGold, fontSize: 14, fontWeight: '700' },
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
    gap: 6,
  },
  amount: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  releaseBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  releaseBtnText: { color: Colors.bgDark, fontWeight: '700' },
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

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../../src/constants/colors';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getWalletSummary, getWalletTransactions } from '../../../src/services/wallet.service';
import type { WalletSummary, WalletTransaction } from '../../../src/types/wallet';
import { formatCurrencyTRY, formatDateTR } from '../../../src/utils/format';

export default function DriverWalletScreen() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [tx, setTx] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [s, t] = await Promise.all([getWalletSummary(), getWalletTransactions()]);
      setSummary(s);
      setTx(t);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setSummary(null);
      setTx([]);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[screenRootStyle, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Cuzdan yukleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <FlatList
        data={tx}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Cuzdan</Text>
            <Text style={styles.sub}>Bakiye, bekleyen tutarlar ve hareketler</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.hero}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mutedSmall}>Cekilebilir bakiye</Text>
                <Text style={styles.heroAmount}>
                  {formatCurrencyTRY(summary?.walletBalance ?? 0)}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.mutedSmall}>Kullanilabilir</Text>
                <Text style={styles.statValue}>
                  {formatCurrencyTRY(summary?.walletBalance ?? 0)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.mutedSmall}>Bekleyen / Blokeli</Text>
                <Text style={styles.statValue}>
                  {formatCurrencyTRY(summary?.pendingBalance ?? 0)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.mutedSmall}>Bu ay</Text>
                <Text style={styles.statValue}>
                  {formatCurrencyTRY(summary?.monthAmount ?? 0)}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Islem gecmisi</Text>
          </>
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Islem bulunamadi</Text>
              <Text style={styles.muted}>Henuz cuzdan hareketiniz yok.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txDesc}>{item.description ?? '-'}</Text>
              <Text style={styles.mutedSmall}>{formatDateTR(item.createdAt)}</Text>
            </View>
            <View style={styles.txRight}>
              <Text
                style={[
                  styles.txAmount,
                  item.direction === 'in' && styles.txIn,
                  item.direction === 'out' && styles.txOut,
                ]}
              >
                {item.direction === 'out' ? '-' : item.direction === 'in' ? '+' : ''}
                {formatCurrencyTRY(item.amount)}
              </Text>
              <Text style={styles.txStatus}>{item.status}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  sub: { color: Colors.textSecondary, fontSize: 14, marginBottom: 16 },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  mutedSmall: { color: Colors.textMuted, fontSize: 12 },
  hero: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 16,
    marginBottom: 12,
  },
  heroAmount: { color: Colors.primaryGold, fontSize: 28, fontWeight: '800', marginTop: 6 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 4,
  },
  statValue: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 10 },
  txRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 8,
  },
  txDesc: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  txRight: { alignItems: 'flex-end' },
  txAmount: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  txIn: { color: Colors.success },
  txOut: { color: Colors.error },
  txStatus: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
});

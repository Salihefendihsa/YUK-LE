import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getWalletSummary, getWalletTransactions } from '../../../src/services/wallet.service';
import type { WalletSummary, WalletTransaction } from '../../../src/types/wallet';
import { palette } from '../../../src/theme/colors';
import { fontFamily, typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY, formatDateTR } from '../../../src/utils/format';
import { getWalletTxStatusPill } from '../../../src/utils/statusPills';

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
      <View style={screenRootStyle}>
        <LoadingState message="Cuzdan yukleniyor..." />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        ListHeaderComponent={
          <>
            <View style={styles.headerPad}>
              <ScreenHeader title="Cuzdan" subtitle="Bakiye, bekleyen tutarlar ve hareketler" />
              {error ? <AlertBanner message={error} tone="error" /> : null}
            </View>

            <Card variant="glass" padding={5} style={styles.hero}>
              <Text style={styles.heroLabel}>Cekilebilir bakiye</Text>
              <Text style={styles.heroAmount}>
                {formatCurrencyTRY(summary?.walletBalance ?? 0)}
              </Text>
            </Card>

            <View style={styles.statsRow}>
              <Card variant="default" padding={3} style={styles.stat}>
                <Text style={styles.statLabel}>Kullanilabilir</Text>
                <Text style={styles.statValue}>
                  {formatCurrencyTRY(summary?.walletBalance ?? 0)}
                </Text>
              </Card>
              <Card variant="default" padding={3} style={styles.stat}>
                <Text style={styles.statLabel}>Bekleyen / Blokeli</Text>
                <Text style={styles.statValue}>
                  {formatCurrencyTRY(summary?.pendingBalance ?? 0)}
                </Text>
              </Card>
              <Card variant="default" padding={3} style={styles.stat}>
                <Text style={styles.statLabel}>Bu ay</Text>
                <Text style={styles.statValue}>
                  {formatCurrencyTRY(summary?.monthAmount ?? 0)}
                </Text>
              </Card>
            </View>

            <Text style={styles.sectionTitle}>Islem gecmisi</Text>
          </>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="💳"
              title="Islem bulunamadi"
              description="Henuz cuzdan hareketiniz yok."
            />
          ) : null
        }
        renderItem={({ item }) => {
          const pill = getWalletTxStatusPill(item.status);
          return (
            <Card variant="default" padding={4} style={styles.txCard}>
              <View style={styles.txRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txDesc}>{item.description ?? '-'}</Text>
                  <Text style={styles.txDate}>{formatDateTR(item.createdAt)}</Text>
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
                  <StatusPill label={pill.label} tone={pill.tone} />
                </View>
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing[4], paddingBottom: spacing[8] },
  headerPad: { paddingTop: spacing[4] },
  hero: {
    marginBottom: spacing[4],
    borderColor: palette.brandBorder,
  },
  heroLabel: { ...typography.label, color: palette.textMuted },
  heroAmount: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    color: palette.gold,
    marginTop: spacing[2],
  },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[5] },
  stat: { flex: 1, minWidth: 100 },
  statLabel: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: palette.text,
    marginTop: spacing[1],
  },
  sectionTitle: { ...typography.h3, marginBottom: spacing[3] },
  txCard: { marginBottom: spacing[2] },
  txRow: { flexDirection: 'row', gap: spacing[3] },
  txDesc: { fontFamily: fontFamily.semiBold, fontSize: 14, color: palette.text },
  txDate: { ...typography.caption, textTransform: 'none', marginTop: 2 },
  txRight: { alignItems: 'flex-end', gap: spacing[2] },
  txAmount: { fontFamily: fontFamily.bold, fontSize: 14, color: palette.text },
  txIn: { color: palette.success },
  txOut: { color: palette.error },
});

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { ScreenContainer, ScreenScroll, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { SettlementBreakdown } from '../../../src/components/settlement/SettlementBreakdown';
import { getWalletSummary, getWalletTransactions } from '../../../src/services/wallet.service';
import { buildDriverSettlementsFromTransactions } from '../../../src/utils/walletSettlement';
import type { WalletSummary, WalletTransaction } from '../../../src/types/wallet';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY, formatDateTR } from '../../../src/utils/format';
import { getWalletTxStatusPill } from '../../../src/utils/statusPills';

export default function DriverWalletScreen() {
  const { contentInset } = useScreenInsets();
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

  const loadSettlements = useMemo(() => buildDriverSettlementsFromTransactions(tx), [tx]);

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Cüzdan yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={tx}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, contentInset]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        ListHeaderComponent={
          <>
            <View style={styles.headerPad}>
              <ScreenHeader title="Cüzdan" subtitle="Bakiye, bekleyen tutarlar ve hareketler" />
              {error ? <AlertBanner message={error} tone="error" /> : null}
            </View>

            <Card variant="glass" padding={5} style={styles.hero}>
              <Text style={styles.heroLabel}>Çekilebilir bakiye</Text>
              <Text style={styles.heroAmount}>
                {formatCurrencyTRY(summary?.walletBalance ?? 0)}
              </Text>
            </Card>

            <View style={styles.statsRow}>
              <Card variant="default" padding={3} style={styles.stat}>
                <Text style={styles.statLabel}>Kullanılabilir</Text>
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

            {loadSettlements.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Yük bazlı ödeme dökümü</Text>
                {loadSettlements.slice(0, 5).map((item, index) => (
                  <FadeInView key={item.loadId} delay={index * 40}>
                  <Card variant="default" padding={4} style={styles.settleCard}>
                    <Text style={styles.settleLoad}>
                      Yük {item.loadId.slice(0, 8)}…
                      {item.hasRelease ? ' · Ödendi' : ' · Beklemede'}
                    </Text>
                    <SettlementBreakdown settlement={item.settlement} mode="driver" compact />
                  </Card>
                  </FadeInView>
                ))}
              </>
            ) : null}

            <Text style={styles.sectionTitle}>İşlem geçmişi</Text>
          </>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="💳"
              title="İşlem bulunamadı"
              description="Henüz cüzdan hareketiniz yok."
            />
          ) : null
        }
        renderItem={({ item, index }) => {
          const pill = getWalletTxStatusPill(item.status);
          return (
            <FadeInView delay={Math.min(index * 35, 175)}>
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
                    {item.direction === 'out'
                      ? '−'
                      : item.direction === 'in'
                        ? '+'
                        : item.status === 'Hold'
                          ? '⏳ '
                          : ''}
                    {formatCurrencyTRY(item.amount)}
                  </Text>
                  <StatusPill label={pill.label} tone={pill.tone} />
                </View>
              </View>
            </Card>
            </FadeInView>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: space.md, paddingBottom: space.xl },
  headerPad: { paddingTop: space.md },
  hero: { marginBottom: space.md, borderColor: palette.brandBorder },
  heroLabel: { ...typography.label, color: palette.textMuted },
  heroAmount: { ...typography.h1, fontSize: 32, color: palette.gold, marginTop: space.sm },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: spacing[5] },
  stat: { flex: 1, flexShrink: 1, minWidth: 0, maxWidth: '50%' },
  statLabel: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  statValue: { ...typography.bodyMedium, fontSize: 15, marginTop: space.xs },
  sectionTitle: { ...typography.h3, marginBottom: spacing[3] },
  settleCard: { marginBottom: space.sm },
  settleLoad: { ...typography.caption, color: palette.textMuted, marginBottom: space.xs },
  txCard: { marginBottom: space.sm },
  txRow: { flexDirection: 'row', gap: spacing[3] },
  txDesc: { ...typography.bodySmall, fontFamily: typography.bodyMedium.fontFamily },
  txDate: { ...typography.caption, textTransform: 'none', marginTop: space.xs },
  txRight: { alignItems: 'flex-end', gap: space.sm },
  txAmount: { ...typography.bodySmall, fontFamily: typography.bodyMedium.fontFamily },
  txIn: { color: palette.success },
  txOut: { color: palette.error },
});

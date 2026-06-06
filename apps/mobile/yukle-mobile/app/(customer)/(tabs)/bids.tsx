import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PrimaryButton } from '../../../src/components/ui/PrimaryButton';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { ScreenScroll } from '../../../src/constants/layout';
import { useConfirm } from '../../../src/hooks/useConfirm';
import { acceptBid, getBidsForLoad } from '../../../src/services/bids.service';
import { getCustomerLoads } from '../../../src/services/loads.service';
import type { LoadBid } from '../../../src/types/bid';
import type { Load } from '../../../src/types/load';
import { palette } from '../../../src/theme/colors';
import { space, spacing } from '../../../src/theme/spacing';
import { typography } from '../../../src/theme/typography';
import { formatCurrencyTRY, formatDateTR } from '../../../src/utils/format';
import { getBidStatusPill } from '../../../src/utils/statusPills';

type LoadBidGroup = {
  load: Load;
  bids: LoadBid[];
};

export default function CustomerBidsHubScreen() {
  const router = useRouter();
  const { confirm, dialog: confirmDialog, setConfirmLoading } = useConfirm();

  const [groups, setGroups] = useState<LoadBidGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setError('');
    const loads = await getCustomerLoads();
    const activeLoads = loads.filter((l) => l.status === 'Active');
    const withBids = await Promise.all(
      activeLoads.map(async (load) => ({
        load,
        bids: await getBidsForLoad(load.id),
      }))
    );
    setGroups(withBids.filter((g) => g.bids.length > 0));
  }, []);

  useEffect(() => {
    fetchAll()
      .catch((e) => {
        const msg = (e as { uiMessage?: string })?.uiMessage ?? 'Teklifler yüklenemedi.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setInfo('');
    try {
      await fetchAll();
    } catch (e) {
      setError((e as { uiMessage?: string })?.uiMessage ?? 'Teklifler yüklenemedi.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchAll]);

  const pendingCount = useMemo(
    () =>
      groups.reduce((n, g) => n + g.bids.filter((b) => b.status === 'Pending').length, 0),
    [groups]
  );

  const handleAccept = useCallback(
    async (bid: LoadBid, load: Load) => {
      if (load.status !== 'Active' || bid.status !== 'Pending') return;
      const ok = await confirm({
        title: 'Teklifi kabul et',
        message: `${formatCurrencyTRY(
          bid.amount
        )} tutarlı teklifi kabul etmek istiyor musunuz? Ödeme güvenli havuzda blokede edilir.`,
        confirmLabel: 'Kabul et',
      });
      if (!ok) return;
      setAcceptingId(bid.id);
      setConfirmLoading(true);
      setError('');
      setInfo('');
      try {
        await acceptBid(bid.id);
        setInfo('Teklif kabul edildi. İlan detayına yönlendiriliyorsunuz.');
        await fetchAll();
        router.push({
          pathname: '/(customer)/load-detail',
          params: { id: load.id },
        });
      } catch (e) {
        setError((e as { uiMessage?: string })?.uiMessage ?? 'Teklif kabul işlemi başarısız.');
      } finally {
        setAcceptingId(null);
        setConfirmLoading(false);
      }
    },
    [confirm, fetchAll, router, setConfirmLoading]
  );

  if (loading) {
    return (
      <ScreenScroll contentContainerStyle={styles.scroll}>
        <ScreenHeader title="Teklifler" subtitle="İlanlarınıza gelen teklifler" />
        <LoadingState message="Teklifler yükleniyor..." variant="skeleton" />
      </ScreenScroll>
    );
  }

  return (
    <>
      <ScreenScroll
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
      >
        <ScreenHeader
          title="Teklifler"
          subtitle={
            pendingCount > 0
              ? `İlanlarınıza gelen teklifler · ${pendingCount} beklemede`
              : 'İlanlarınıza gelen teklifler'
          }
        />

        {error ? <AlertBanner message={error} tone="error" /> : null}
        {info ? <AlertBanner message={info} tone="success" /> : null}

        {groups.length === 0 ? (
          <EmptyState
            icon="💼"
            title="Henüz teklif yok"
            description="Aktif ilanlarınıza şoför teklifi geldiğinde burada listelenir."
            actionLabel="İlanlarım"
            onAction={() => router.push('/(customer)/(tabs)/loads')}
          />
        ) : (
          groups.map((group, i) => (
            <FadeInView key={group.load.id} delay={i * 40}>
              <Card variant="elevated" padding={4} style={styles.groupCard}>
                <View style={styles.groupHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupRoute} numberOfLines={1}>
                      {group.load.fromCity} → {group.load.toCity}
                    </Text>
                    <Text style={styles.groupSub} numberOfLines={1}>
                      Liste fiyatı: {formatCurrencyTRY(group.load.price)} · {group.bids.length} teklif
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
                </View>

                <View style={styles.bidList}>
                  {group.bids.map((bid) => {
                    const pill = getBidStatusPill(bid.status);
                    const isPendingActive =
                      bid.status === 'Pending' && group.load.status === 'Active';
                    return (
                      <View key={bid.id} style={styles.bidRow}>
                        <View style={styles.bidHeader}>
                          <Text style={styles.driverName} numberOfLines={1}>
                            {bid.driverFullName}
                          </Text>
                          <Text style={styles.amount}>{formatCurrencyTRY(bid.amount)}</Text>
                        </View>
                        <View style={styles.bidMeta}>
                          <Text style={styles.bidDate}>
                            {formatDateTR(bid.offerDate)}
                            {bid.note ? ` · ${bid.note}` : ''}
                          </Text>
                          <StatusPill label={pill.label} tone={pill.tone} />
                        </View>
                        {isPendingActive ? (
                          <PrimaryButton
                            title={acceptingId === bid.id ? 'Kabul ediliyor…' : 'Kabul Et'}
                            onPress={() => void handleAccept(bid, group.load)}
                            loading={acceptingId === bid.id}
                            style={styles.acceptBtn}
                          />
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </Card>
            </FadeInView>
          ))
        )}
      </ScreenScroll>
      {confirmDialog}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: space.md },
  groupCard: { gap: spacing[3] },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  groupRoute: {
    ...typography.h3,
    color: palette.text,
  },
  groupSub: {
    ...typography.caption,
    textTransform: 'none',
    color: palette.textMuted,
    marginTop: spacing[1],
  },
  bidList: {
    gap: spacing[3],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
  },
  bidRow: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    padding: spacing[3],
    gap: spacing[2],
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
  },
  driverName: {
    ...typography.bodyMedium,
    color: palette.text,
    flex: 1,
  },
  amount: {
    ...typography.bodyMedium,
    color: palette.brand,
  },
  bidMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  bidDate: {
    ...typography.caption,
    textTransform: 'none',
    color: palette.textMuted,
    flex: 1,
  },
  acceptBtn: {
    marginTop: spacing[1],
  },
});

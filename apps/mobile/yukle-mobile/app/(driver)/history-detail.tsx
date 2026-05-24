import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DetailRow } from '../../src/components/driver/DetailRow';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { Card } from '../../src/components/ui/Card';
import { FadeInView } from '../../src/components/ui/FadeInView';
import { GhostButton } from '../../src/components/ui/GhostButton';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';
import { StatusPill } from '../../src/components/ui/StatusPill';
import { ScreenContainer, ScreenScroll } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { getLoadById } from '../../src/services/loads.service';
import {
  getWalletTransactions,
  mapReleaseEarningsByLoadId,
} from '../../src/services/wallet.service';
import type { Load } from '../../src/types/load';
import { palette } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { space, spacing } from '../../src/theme/spacing';
import {
  formatCurrencyTRY,
  formatDateTR,
  formatLoadTypeLabel,
  formatWeightKg,
} from '../../src/utils/format';
import { getLoadStatusPill } from '../../src/utils/statusPills';
import { CustomerRatingForm } from '../../src/components/driver/CustomerRatingForm';

export default function DriverHistoryDetailScreen() {
  const router = useRouter();
  const { id, netEarn: netEarnParam } = useLocalSearchParams<{
    id?: string;
    netEarn?: string;
  }>();
  const loadId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

  const [load, setLoad] = useState<Load | null>(null);
  const [netEarn, setNetEarn] = useState<number | null>(
    netEarnParam != null && netEarnParam !== '' ? Number(netEarnParam) : null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!loadId) {
      setError('Geçersiz sefer ID.');
      setLoading(false);
      return;
    }
    try {
      setError('');
      const [loadData, txs] = await Promise.all([getLoadById(loadId), getWalletTransactions()]);
      setLoad(loadData);
      const earnMap = mapReleaseEarningsByLoadId(txs);
      const fromWallet = earnMap.get(loadId);
      if (fromWallet != null) setNetEarn(fromWallet);
      else if (netEarnParam != null && netEarnParam !== '') setNetEarn(Number(netEarnParam));
    } catch (e) {
      setError(getApiErrorMessage(e));
      setLoad(null);
    } finally {
      setLoading(false);
    }
  }, [loadId, netEarnParam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Sefer detayı yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  if (error || !load) {
    return (
      <ScreenContainer style={styles.centered}>
        <AlertBanner message={error || 'Sefer bulunamadı.'} tone="error" />
        <SecondaryButton title="Geri" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  const pill = getLoadStatusPill(load.status);
  const kazanc = netEarn != null && netEarn > 0 ? netEarn : null;

  return (
    <ScreenScroll contentContainerStyle={styles.scroll}>
      <GhostButton title="← Geçmiş" onPress={() => router.back()} style={styles.backBtn} />

      <FadeInView>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Sefer Detayı</Text>
          <Text style={styles.route}>
            {load.fromCity} → {load.toCity}
          </Text>
        </View>
        <StatusPill label={pill.label} tone={pill.tone} />
      </View>
      </FadeInView>

      <FadeInView delay={50}>
      <Card variant="glass" padding={4}>
        <DetailRow label="Net kazanç" value={kazanc != null ? formatCurrencyTRY(kazanc) : '—'} />
        <DetailRow label="Liste fiyatı" value={formatCurrencyTRY(load.price)} />
        <DetailRow
          label="Teslim tarihi"
          value={load.deliveryDate ? formatDateTR(load.deliveryDate) : '-'}
        />
        <DetailRow label="Müşteri" value={load.ownerFullName || '-'} />
        <DetailRow label="Yük tipi" value={formatLoadTypeLabel(load.loadType ?? load.type)} />
        <DetailRow label="Ağırlık" value={formatWeightKg(load.weight)} />
      </Card>
      </FadeInView>

      {load.status === 'Delivered' && load.ownerId ? (
        <CustomerRatingForm
          loadId={load.id}
          customerUserId={load.ownerId}
          customerName={load.ownerFullName}
        />
      ) : null}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: space.md },
  backBtn: { alignSelf: 'flex-start' },
  centered: { flex: 1, justifyContent: 'center', padding: space.lg, gap: space.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  pageTitle: { ...typography.h1, marginBottom: space.xs },
  route: { ...typography.h2, fontSize: 18, color: palette.gold },
});

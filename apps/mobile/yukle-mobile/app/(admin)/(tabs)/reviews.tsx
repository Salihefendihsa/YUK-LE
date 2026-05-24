import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { ReviewsDetailModal } from '../../../src/components/admin/ReviewsDetailModal';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PressableScale } from '../../../src/components/ui/PressableScale';
import { SectionHeader } from '../../../src/components/ui/SectionHeader';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { ScreenContainer, ScreenScroll, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import {
  decideReview,
  getPendingReviews,
  parseAiInferenceDetails,
} from '../../../src/services/admin.service';
import type { PendingReview } from '../../../src/types/admin';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { radius } from '../../../src/theme/radius';
import { space, spacing } from '../../../src/theme/spacing';
import { formatDateTR } from '../../../src/utils/format';
import { getAiConfidencePill, getApprovalStatusPill } from '../../../src/utils/statusPills';

type QueueFilter = 'all' | 'PendingReview' | 'Pending' | 'ManualApprovalRequired';

const QUEUE_FILTERS: { id: QueueFilter; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'PendingReview', label: 'İnceleme' },
  { id: 'Pending', label: 'Bekleyen' },
  { id: 'ManualApprovalRequired', label: 'Manuel' },
];

function confidenceOf(review: PendingReview): number {
  const ai = parseAiInferenceDetails(review.aiInferenceDetails);
  return ai.confidenceScore ?? 100;
}

export default function AdminReviewsTab() {
  const { contentInset } = useScreenInsets();
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [selected, setSelected] = useState<PendingReview | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setError('');
      const data = await getPendingReviews(
        queueFilter === 'all' ? undefined : { status: queueFilter }
      );
      setReviews(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setReviews([]);
    }
  }, [queueFilter]);

  useEffect(() => {
    fetchQueue().finally(() => setLoading(false));
  }, [fetchQueue]);

  const sorted = useMemo(
    () => [...reviews].sort((a, b) => confidenceOf(a) - confidenceOf(b)),
    [reviews]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQueue();
    setRefreshing(false);
  };

  const handleDecide = async (
    userId: number,
    isApproved: boolean,
    reason: string,
    documentType?: string
  ) => {
    setBusy(true);
    setStatusMsg('');
    setError('');
    try {
      await decideReview(userId, { isApproved, reason, documentType });
      setStatusMsg(isApproved ? 'Belge onaylandı.' : 'Belge reddedildi.');
      setSelected(null);
      await fetchQueue();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Belge kuyruğu yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={sorted}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, contentInset]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="Belge Kuyruğu"
              subtitle="Güven skoruna göre sıralı manuel karar"
            />

            {error ? <AlertBanner message={error} tone="error" /> : null}
            {statusMsg ? <AlertBanner message={statusMsg} tone="success" /> : null}

            <View style={styles.filterRow}>
              {QUEUE_FILTERS.map((f) => (
                <PressableScale
                  key={f.id}
                  style={[styles.filterBtn, queueFilter === f.id && styles.filterBtnActive]}
                  onPress={() => setQueueFilter(f.id)}
                >
                  <Text
                    style={[styles.filterText, queueFilter === f.id && styles.filterTextActive]}
                  >
                    {f.label}
                  </Text>
                </PressableScale>
              ))}
            </View>

            <Card variant="glass" padding={4} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Bekleyen</Text>
              <Text style={styles.kpiValue}>{reviews.length}</Text>
            </Card>
          </>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="📄"
              title="Bekleyen belge yok"
              description="Şoför belge yükleyip inceleme bekliyor durumuna düşerse burada listelenir."
            />
          ) : null
        }
        renderItem={({ item, index }) => {
          const ai = parseAiInferenceDetails(item.aiInferenceDetails);
          const docType = ai.documentType ?? 'Sürücü belgesi';
          const score = ai.confidenceScore;
          const statusKey = item.approvalStatus ?? 'PendingReview';
          const pendingPill = getApprovalStatusPill(statusKey);
          const aiPill = getAiConfidencePill(score);

          return (
            <FadeInView delay={Math.min(index * 40, 200)}>
            <PressableScale onPress={() => setSelected(item)}>
              <Card variant="elevated" padding={4} style={styles.queueCard}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.fullName}
                  </Text>
                  <StatusPill {...pendingPill} />
                </View>
                <Text style={styles.muted}>{item.phone}</Text>
                <Text style={styles.muted}>
                  Belge: {docType} · Yükleme: {formatDateTR(item.createdAt)}
                </Text>
                <View style={styles.pillRow}>
                  <StatusPill {...aiPill} />
                </View>
                <Text style={styles.detailLink}>Detaylı incele →</Text>
              </Card>
            </PressableScale>
            </FadeInView>
          );
        }}
      />

      {selected ? (
        <ReviewsDetailModal
          review={selected}
          visible={!!selected}
          busy={busy}
          onClose={() => !busy && setSelected(null)}
          onApprove={(reason, documentType) =>
            handleDecide(selected.id, true, reason, documentType)
          }
          onReject={(reason, documentType) =>
            handleDecide(selected.id, false, reason, documentType)
          }
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.md, paddingBottom: spacing[10], gap: space.sm },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.sm },
  filterBtn: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  filterBtnActive: { borderColor: palette.brandBorder, backgroundColor: palette.brandMuted },
  filterText: { ...typography.bodyMedium, fontSize: 12, color: palette.textMuted },
  filterTextActive: { color: palette.brand },
  kpiCard: { marginBottom: space.sm, gap: space.xs },
  kpiLabel: { ...typography.caption, textTransform: 'none' },
  kpiValue: { ...typography.h1, fontSize: 28, color: palette.gold, letterSpacing: -0.5 },
  queueCard: { marginBottom: space.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  cardName: { ...typography.h3, flex: 1 },
  muted: { ...typography.caption, textTransform: 'none' },
  pillRow: { flexDirection: 'row', marginTop: space.xs },
  detailLink: { ...typography.bodyMedium, fontSize: 13, color: palette.brand, marginTop: space.sm },
});

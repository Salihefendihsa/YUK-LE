import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ReviewsDetailModal } from '../../../src/components/admin/ReviewsDetailModal';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { SectionHeader } from '../../../src/components/ui/SectionHeader';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import {
  decideReview,
  getPendingReviews,
  parseAiInferenceDetails,
} from '../../../src/services/admin.service';
import type { PendingReview } from '../../../src/types/admin';
import { palette } from '../../../src/theme/colors';
import { fontFamily, typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { formatDateTR } from '../../../src/utils/format';
import { getAiConfidencePill, getApprovalStatusPill } from '../../../src/utils/statusPills';

function confidenceOf(review: PendingReview): number {
  const ai = parseAiInferenceDetails(review.aiInferenceDetails);
  return ai.confidenceScore ?? 100;
}

export default function AdminReviewsTab() {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [selected, setSelected] = useState<PendingReview | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setError('');
      const data = await getPendingReviews();
      setReviews(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setReviews([]);
    }
  }, []);

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

  const handleDecide = async (userId: number, isApproved: boolean, reason: string) => {
    setBusy(true);
    setStatusMsg('');
    setError('');
    try {
      await decideReview(userId, { isApproved, reason });
      setStatusMsg(isApproved ? 'Belge onaylandi.' : 'Belge reddedildi.');
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
      <View style={screenRootStyle}>
        <LoadingState message="Belge kuyrugu yukleniyor..." />
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        ListHeaderComponent={
          <>
            <SectionHeader
              title="Belge Inceleme"
              subtitle="AI skoruna gore sirali manuel karar"
            />

            {error ? <AlertBanner message={error} tone="error" /> : null}
            {statusMsg ? <AlertBanner message={statusMsg} tone="success" /> : null}

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
              description="Sofor belge yukleyip PendingReview durumuna duserse burada listelenir."
            />
          ) : null
        }
        renderItem={({ item }) => {
          const ai = parseAiInferenceDetails(item.aiInferenceDetails);
          const docType = ai.documentType ?? 'Surucu belgesi';
          const score = ai.confidenceScore;
          const pendingPill = getApprovalStatusPill('PendingReview');
          const aiPill = getAiConfidencePill(score);

          return (
            <Pressable onPress={() => setSelected(item)}>
              <Card variant="elevated" padding={4} style={styles.queueCard}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.fullName}
                  </Text>
                  <StatusPill {...pendingPill} />
                </View>
                <Text style={styles.muted}>{item.phone}</Text>
                <Text style={styles.muted}>
                  Belge: {docType} · Yukleme: {formatDateTR(item.createdAt)}
                </Text>
                <View style={styles.pillRow}>
                  <StatusPill {...aiPill} />
                </View>
                <Text style={styles.detailLink}>Detayli incele →</Text>
              </Card>
            </Pressable>
          );
        }}
      />

      {selected ? (
        <ReviewsDetailModal
          review={selected}
          visible={!!selected}
          busy={busy}
          onClose={() => !busy && setSelected(null)}
          onApprove={(reason) => handleDecide(selected.id, true, reason)}
          onReject={(reason) => handleDecide(selected.id, false, reason)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[2] },
  kpiCard: { marginBottom: spacing[2], gap: spacing[1] },
  kpiLabel: { ...typography.caption, textTransform: 'none' },
  kpiValue: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: palette.gold,
    letterSpacing: -0.5,
  },
  queueCard: { marginBottom: spacing[2] },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing[2] },
  cardName: { ...typography.h3, flex: 1 },
  muted: { ...typography.caption, textTransform: 'none' },
  pillRow: { flexDirection: 'row', marginTop: spacing[1] },
  detailLink: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: palette.brand,
    marginTop: spacing[2],
  },
});

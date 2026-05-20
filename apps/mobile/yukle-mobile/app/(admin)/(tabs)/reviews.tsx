import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ReviewsDetailModal } from '../../../src/components/admin/ReviewsDetailModal';
import { Colors } from '../../../src/constants/colors';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import {
  decideReview,
  getPendingReviews,
  parseAiInferenceDetails,
} from '../../../src/services/admin.service';
import type { PendingReview } from '../../../src/types/admin';
import { formatDateTR } from '../../../src/utils/format';

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
      <View style={[screenRootStyle, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Belge kuyrugu yukleniyor...</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Belge Inceleme</Text>
            <Text style={styles.sub}>AI skoruna gore sirali manuel karar</Text>

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

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Bekleyen</Text>
              <Text style={styles.kpiValue}>{reviews.length}</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Bekleyen belge yok</Text>
              <Text style={styles.muted}>
                Sofor belge yukleyip PendingReview durumuna duserse burada listelenir.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const ai = parseAiInferenceDetails(item.aiInferenceDetails);
          const docType = ai.documentType ?? 'Surucu belgesi';
          const score = ai.confidenceScore;

          return (
            <Pressable style={styles.card} onPress={() => setSelected(item)}>
              <View style={styles.cardRow}>
                <Text style={styles.cardName}>{item.fullName}</Text>
                <Text style={styles.badge}>Beklemede</Text>
              </View>
              <Text style={styles.muted}>{item.phone}</Text>
              <Text style={styles.muted}>
                Belge: {docType} · Yukleme: {formatDateTR(item.createdAt)}
              </Text>
              <Text style={styles.muted}>
                AI guven: {score != null ? `%${Math.round(score)}` : 'N/A'}
              </Text>
              <Text style={styles.detailLink}>Detayli incele →</Text>
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
  list: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: Colors.textSecondary, fontSize: 13, marginBottom: 12 },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  kpiCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    padding: 14,
    marginBottom: 12,
    gap: 4,
  },
  kpiLabel: { color: Colors.textMuted, fontSize: 12 },
  kpiValue: { color: Colors.primaryGold, fontSize: 28, fontWeight: '800' },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 4,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', flex: 1 },
  badge: {
    color: Colors.primaryGold,
    fontSize: 11,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  detailLink: { color: Colors.primary, fontSize: 13, fontWeight: '700', marginTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
  successBox: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: Colors.success,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  successText: { color: Colors.success, fontSize: 13, fontWeight: '600' },
});

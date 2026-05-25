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
import { PressableScale } from '../../../src/components/ui/PressableScale';
import { PrimaryButton } from '../../../src/components/ui/PrimaryButton';
import { TextField } from '../../../src/components/ui/TextField';
import { ScreenContainer, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { deleteRating, getAllRatings } from '../../../src/services/admin.service';
import type { AdminRatingRow } from '../../../src/types/admin';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { radius } from '../../../src/theme/radius';
import { space, spacing } from '../../../src/theme/spacing';
import { formatDateTR } from '../../../src/utils/format';

function starsText(n: number): string {
  const s = Math.min(5, Math.max(0, Math.round(n)));
  return '★'.repeat(s) + '☆'.repeat(5 - s);
}

export default function AdminRatingsScreen() {
  const { contentInset } = useScreenInsets();
  const [rows, setRows] = useState<AdminRatingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');

  const fetchData = useCallback(async (f?: string) => {
    try {
      setError('');
      const data = await getAllRatings({
        filter: (f !== undefined ? f : filter).trim() || undefined,
      });
      setRows(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setRows([]);
    }
  }, [filter]);

  useEffect(() => {
    fetchData('').finally(() => setLoading(false));
  }, [fetchData]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter((r) => {
      const comment = (r.comment ?? '').toLowerCase();
      const by = (r.givenByName ?? '').toLowerCase();
      const to = (r.givenToName ?? '').toLowerCase();
      return comment.includes(qq) || by.includes(qq) || to.includes(qq);
    });
  }, [rows, q]);

  const avg = useMemo(() => {
    if (!filtered.length) return 0;
    return filtered.reduce((a, b) => a + b.score, 0) / filtered.length;
  }, [filtered]);

  const confirmDelete = (row: AdminRatingRow) => {
    Alert.alert('Puanı sil', 'Bu yorum kalıcı silinecek. Devam?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => void doDelete(row) },
    ]);
  };

  const doDelete = async (row: AdminRatingRow) => {
    setBusyId(row.id);
    setStatusMsg('');
    try {
      await deleteRating(row.id);
      setStatusMsg('Puan silindi.');
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
        <LoadingState message="Puanlar yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, contentInset]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchData();
              setRefreshing(false);
            }}
            tintColor={palette.brand}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="Puanlar"
              subtitle={`Ortalama: ${avg.toFixed(1)} · ${filtered.length} kayıt`}
            />
            <TextField
              icon="filter-outline"
              placeholder="Puana göre: düşük veya yüksek"
              value={filter}
              onChangeText={setFilter}
              autoCapitalize="none"
            />
            <TextField
              icon="search-outline"
              placeholder="Yerel ara: isim veya yorum"
              value={q}
              onChangeText={setQ}
            />
            <PrimaryButton title="Filtrele / Yenile" onPress={() => fetchData()} style={styles.filterBtn} />
            {error ? <AlertBanner message={error} tone="error" /> : null}
            {statusMsg ? <AlertBanner message={statusMsg} tone="success" /> : null}
          </>
        }
        ListEmptyComponent={
          !error ? <EmptyState icon="⭐" title="Puan kaydı yok" /> : null
        }
        renderItem={({ item, index }) => (
          <FadeInView delay={Math.min(index * 40, 200)}>
            <Card variant="elevated" padding={4} style={styles.rateCard}>
              <Text style={styles.stars}>
                {starsText(item.score)} ({item.score})
              </Text>
              <Text style={styles.muted}>
                {item.givenByName} → {item.givenToName}
              </Text>
              <Text style={styles.muted}>{formatDateTR(item.createdAt)}</Text>
              <Text style={styles.mono}>İlan: {item.loadId.slice(0, 8)}...</Text>
              <Text style={styles.muted} numberOfLines={4}>
                {item.comment || '(yorum yok)'}
              </Text>
              {busyId === item.id ? (
                <ActivityIndicator color={palette.error} style={{ marginTop: space.sm }} />
              ) : (
                <PressableScale style={styles.deleteBtn} onPress={() => confirmDelete(item)}>
                  <Text style={styles.deleteBtnText}>Sil</Text>
                </PressableScale>
              )}
            </Card>
          </FadeInView>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.md, paddingBottom: spacing[10], gap: space.sm },
  filterBtn: { marginBottom: space.md },
  rateCard: { marginBottom: space.sm, gap: space.xs },
  stars: { ...typography.h3, color: palette.gold },
  muted: { ...typography.caption, textTransform: 'none' },
  mono: { ...typography.caption, fontSize: 11, color: palette.textMuted, textTransform: 'none' },
  deleteBtn: {
    backgroundColor: palette.error,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
    marginTop: space.sm,
  },
  deleteBtnText: { ...typography.bodyMedium, color: palette.text },
});

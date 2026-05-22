import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { Card } from '../../src/components/ui/Card';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { TextField } from '../../src/components/ui/TextField';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { deleteRating, getAllRatings } from '../../src/services/admin.service';
import type { AdminRatingRow } from '../../src/types/admin';
import { palette } from '../../src/theme/colors';
import { fontFamily, typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { formatDateTR } from '../../src/utils/format';

function starsText(n: number): string {
  const s = Math.min(5, Math.max(0, Math.round(n)));
  return '★'.repeat(s) + '☆'.repeat(5 - s);
}

export default function AdminRatingsScreen() {
  const router = useRouter();
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
    return rows.filter(
      (r) =>
        r.comment.toLowerCase().includes(qq) ||
        r.givenByName.toLowerCase().includes(qq) ||
        r.givenToName.toLowerCase().includes(qq)
    );
  }, [rows, q]);

  const avg = useMemo(() => {
    if (!filtered.length) return 0;
    return filtered.reduce((a, b) => a + b.score, 0) / filtered.length;
  }, [filtered]);

  const confirmDelete = (row: AdminRatingRow) => {
    Alert.alert('Puani sil', 'Bu yorum kalici silinecek. Devam?', [
      { text: 'Vazgec', style: 'cancel' },
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
      <View style={screenRootStyle}>
        <LoadingState message="Puanlar yukleniyor..." />
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
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
            <Pressable onPress={() => router.back()} style={styles.back}>
              <Text style={typography.link}>← Geri</Text>
            </Pressable>
            <SectionHeader
              title="Puanlar"
              subtitle={`Gercek API. Ortalama: ${avg.toFixed(1)} · ${filtered.length} kayit`}
            />
            <TextField
              icon="filter-outline"
              placeholder="API filter: low | high"
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
          !error ? <EmptyState icon="⭐" title="Puan kaydi yok" /> : null
        }
        renderItem={({ item }) => (
          <Card variant="elevated" padding={4} style={styles.rateCard}>
            <Text style={styles.stars}>
              {starsText(item.score)} ({item.score})
            </Text>
            <Text style={styles.muted}>
              {item.givenByName} → {item.givenToName}
            </Text>
            <Text style={styles.muted}>{formatDateTR(item.createdAt)}</Text>
            <Text style={styles.mono}>Ilan: {item.loadId.slice(0, 8)}...</Text>
            <Text style={styles.muted} numberOfLines={4}>
              {item.comment || '(yorum yok)'}
            </Text>
            {busyId === item.id ? (
              <ActivityIndicator color={palette.error} style={{ marginTop: spacing[2] }} />
            ) : (
              <Pressable style={styles.deleteBtn} onPress={() => confirmDelete(item)}>
                <Text style={styles.deleteBtnText}>Sil</Text>
              </Pressable>
            )}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[2] },
  back: { marginBottom: spacing[2] },
  filterBtn: { marginBottom: spacing[3] },
  rateCard: { marginBottom: spacing[2], gap: spacing[1] },
  stars: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: palette.gold,
  },
  muted: { ...typography.caption, textTransform: 'none' },
  mono: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: palette.textMuted,
  },
  deleteBtn: {
    backgroundColor: palette.error,
    borderRadius: 10,
    paddingVertical: spacing[3],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  deleteBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: palette.text,
  },
});

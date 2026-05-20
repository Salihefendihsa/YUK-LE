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
  TextInput,
  View,
} from 'react-native';
import { adminScreenStyles as s } from '../../src/constants/adminScreenStyles';
import { Colors } from '../../src/constants/colors';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { deleteRating, getAllRatings } from '../../src/services/admin.service';
import type { AdminRatingRow } from '../../src/types/admin';
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
      <View style={[screenRootStyle, s.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
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
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            <Pressable onPress={() => router.back()}>
              <Text style={s.backLink}>← Geri</Text>
            </Pressable>
            <Text style={s.title}>Puanlar</Text>
            <Text style={s.sub}>
              Gercek API (web MOCK kullaniyordu). Ortalama: {avg.toFixed(1)} · {filtered.length} kayit
            </Text>
            <TextInput
              style={s.input}
              placeholder="API filter: low | high"
              placeholderTextColor={Colors.textMuted}
              value={filter}
              onChangeText={setFilter}
              autoCapitalize="none"
            />
            <TextInput
              style={s.input}
              placeholder="Yerel ara: isim veya yorum"
              placeholderTextColor={Colors.textMuted}
              value={q}
              onChangeText={setQ}
            />
            <Pressable style={s.filterBtn} onPress={() => fetchData()}>
              <Text style={s.filterBtnText}>Filtrele / Yenile</Text>
            </Pressable>
            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}
            {statusMsg ? (
              <View style={s.successBox}>
                <Text style={s.successText}>{statusMsg}</Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>Puan kaydi yok</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.cardTitle}>
              {starsText(item.score)} ({item.score})
            </Text>
            <Text style={s.muted}>
              {item.givenByName} → {item.givenToName}
            </Text>
            <Text style={s.muted}>{formatDateTR(item.createdAt)}</Text>
            <Text style={s.mono}>Ilan: {item.loadId.slice(0, 8)}...</Text>
            <Text style={s.muted} numberOfLines={4}>
              {item.comment || '(yorum yok)'}
            </Text>
            <Pressable
              style={[s.btnDanger, busyId === item.id && s.btnDisabled]}
              onPress={() => confirmDelete(item)}
              disabled={busyId === item.id}
            >
              {busyId === item.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.btnDangerText}>Sil</Text>
              )}
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 10 },
});

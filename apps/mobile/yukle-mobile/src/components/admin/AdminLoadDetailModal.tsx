import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { getApiErrorMessage } from '../../services/api.client';
import { getLoadById } from '../../services/loads.service';
import type { AdminLoadRow } from '../../types/admin';
import type { Load } from '../../types/load';
import { formatCurrencyTRY, formatDateTR, formatWeightKg } from '../../utils/format';

type Props = {
  row: AdminLoadRow;
  visible: boolean;
  onClose: () => void;
};

export function AdminLoadDetailModal({ row, visible, onClose }: Props) {
  const [load, setLoad] = useState<Load | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible || !row.id) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setLoad(null);
    void getLoadById(row.id)
      .then((data) => {
        if (!cancelled) setLoad(data);
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [row.id, visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Ilan Detayi</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.close}>Kapat</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.route}>
              {row.fromCity} → {row.toCity}
            </Text>
            <Text style={styles.muted}>Durum: {row.status}</Text>
            <Text style={styles.muted}>Fiyat: {formatCurrencyTRY(row.price)}</Text>
            <Text style={styles.muted}>Olusturma: {formatDateTR(row.createdAt)}</Text>
            <Text style={styles.mono}>ID: {row.id}</Text>
          </View>

          <View style={styles.mockNote}>
            <Text style={styles.mockNoteText}>
              Web ilan detayindaki teklif listesi (MOCK_OFFERS) ve harita yer tutucu
              gosterilmiyor.
            </Text>
          </View>

          {loading ? <ActivityIndicator color={Colors.primary} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {load ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>GET /Loads/{'{id}'} (gercek)</Text>
              <Text style={styles.muted}>Musteri: {load.ownerFullName}</Text>
              <Text style={styles.muted}>
                Sofor ID: {load.driverId != null ? String(load.driverId) : '-'}
              </Text>
              <Text style={styles.muted}>Agirlik: {formatWeightKg(load.weight)}</Text>
              <Text style={styles.muted}>Yuk tipi: {load.loadType ?? load.type}</Text>
              {load.description ? (
                <Text style={styles.muted}>Aciklama: {load.description}</Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  close: { color: Colors.primary, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 6,
  },
  route: { color: Colors.primaryGold, fontSize: 18, fontWeight: '700' },
  sectionTitle: { color: Colors.primaryGold, fontSize: 14, fontWeight: '700' },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  mono: { color: Colors.textMuted, fontSize: 11 },
  mockNote: {
    backgroundColor: 'rgba(255,182,39,0.1)',
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    borderRadius: 8,
    padding: 10,
  },
  mockNoteText: { color: Colors.primaryGold, fontSize: 12, lineHeight: 18 },
  error: { color: Colors.error, fontSize: 13 },
});

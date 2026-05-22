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
import { getApiErrorMessage } from '../../services/api.client';
import { getLoadById } from '../../services/loads.service';
import type { AdminLoadRow } from '../../types/admin';
import type { Load } from '../../types/load';
import { palette } from '../../theme/colors';
import { fontFamily, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { formatCurrencyTRY, formatDateTR, formatWeightKg } from '../../utils/format';
import { getLoadStatusPill } from '../../utils/statusPills';
import { Card } from '../ui/Card';
import { StatusPill } from '../ui/StatusPill';

type Props = {
  row: AdminLoadRow;
  visible: boolean;
  onClose: () => void;
};

export function AdminLoadDetailModal({ row, visible, onClose }: Props) {
  const [load, setLoad] = useState<Load | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const statusPill = getLoadStatusPill(row.status);

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
          <Card variant="elevated" padding={4}>
            <View style={styles.routeRow}>
              <Text style={styles.route}>
                {row.fromCity} → {row.toCity}
              </Text>
              <StatusPill {...statusPill} />
            </View>
            <Text style={styles.muted}>Fiyat: {formatCurrencyTRY(row.price)}</Text>
            <Text style={styles.muted}>Olusturma: {formatDateTR(row.createdAt)}</Text>
            <Text style={styles.mono}>ID: {row.id}</Text>
          </Card>

          <View style={styles.mockNote}>
            <Text style={styles.mockNoteText}>
              Web ilan detayindaki teklif listesi (MOCK_OFFERS) ve harita yer tutucu
              gosterilmiyor.
            </Text>
          </View>

          {loading ? <ActivityIndicator color={palette.brand} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {load ? (
            <Card variant="elevated" padding={4}>
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
            </Card>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: 48,
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSubtle,
  },
  title: { ...typography.h2 },
  close: { ...typography.link },
  scroll: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[3] },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  route: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: palette.gold,
    flex: 1,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: palette.gold,
    marginBottom: spacing[2],
  },
  muted: { ...typography.caption, textTransform: 'none' },
  mono: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: palette.textMuted,
  },
  mockNote: {
    backgroundColor: palette.goldMuted,
    borderWidth: 1,
    borderColor: palette.goldBorder,
    borderRadius: 10,
    padding: spacing[3],
  },
  mockNoteText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: palette.gold,
    lineHeight: 18,
  },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: palette.error,
  },
});

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
import { typography } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { space, spacing } from '../../theme/spacing';
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
          <Text style={styles.title}>İlan Detayı</Text>
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
            <Text style={styles.muted}>Müşteri: {row.customerName ?? '—'}</Text>
            <Text style={styles.muted}>Şoför: {row.driverName ?? 'Atanmadı'}</Text>
            <Text style={styles.muted}>Fiyat: {formatCurrencyTRY(row.price)}</Text>
            <Text style={styles.muted}>Oluşturma: {formatDateTR(row.createdAt)}</Text>
            <Text style={styles.mono}>ID: {row.id}</Text>
          </Card>

          <View style={styles.mockNote}>
            <Text style={styles.mockNoteText}>
              Teklif listesi ve harita önizlemesi bu ekranda gösterilmez.
            </Text>
          </View>

          {loading ? <ActivityIndicator color={palette.brand} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {load ? (
            <Card variant="elevated" padding={4}>
              <Text style={styles.sectionTitle}>İlan özeti</Text>
              <Text style={styles.muted}>Müşteri: {load.ownerFullName}</Text>
              <Text style={styles.muted}>
                Şoför ID: {load.driverId != null ? String(load.driverId) : '-'}
              </Text>
              <Text style={styles.muted}>Ağırlık: {formatWeightKg(load.weight)}</Text>
              <Text style={styles.muted}>Yük tipi: {load.loadType ?? load.type}</Text>
              {load.description ? (
                <Text style={styles.muted}>Açıklama: {load.description}</Text>
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
    paddingHorizontal: space.md,
    paddingTop: 48,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSubtle,
  },
  title: { ...typography.h2 },
  close: { ...typography.link },
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: space.md },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.sm,
    marginBottom: space.sm,
  },
  route: { ...typography.h3, color: palette.gold, flex: 1 },
  sectionTitle: { ...typography.h3, color: palette.gold, marginBottom: space.sm },
  muted: { ...typography.caption, textTransform: 'none' },
  mono: { ...typography.caption, fontSize: 11, color: palette.textMuted, textTransform: 'none' },
  mockNote: {
    backgroundColor: palette.goldMuted,
    borderWidth: 1,
    borderColor: palette.goldBorder,
    borderRadius: radius.md,
    padding: space.md,
  },
  mockNoteText: {
    ...typography.caption,
    color: palette.gold,
    lineHeight: 18,
    textTransform: 'none',
  },
  error: { ...typography.bodySmall, color: palette.error },
});

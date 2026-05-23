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
import { getUserProfile } from '../../services/user.service';
import type { AdminUserListItem } from '../../types/admin';
import type { UserProfile } from '../../types/user';
import { palette } from '../../theme/colors';
import { fontFamily, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { formatCurrencyTRY } from '../../utils/format';
import { getApprovalStatusPill } from '../../utils/statusPills';
import { Card } from '../ui/Card';
import { StatusPill } from '../ui/StatusPill';
import { DetailRow } from '../driver/DetailRow';

type Props = {
  item: AdminUserListItem;
  visible: boolean;
  onClose: () => void;
};

export function AdminUserDetailModal({ item, visible, onClose }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible || !item.id) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setProfile(null);
    void getUserProfile(item.id)
      .then((p) => {
        if (!cancelled) setProfile(p);
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
  }, [item.id, visible]);

  const activePill = item.isActive
    ? { label: 'Aktif', tone: 'success' as const }
    : { label: 'Pasif', tone: 'error' as const };
  const approvalPill =
    item.role === 'Driver' && item.approvalStatus
      ? getApprovalStatusPill(item.approvalStatus)
      : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Kullanici Detayi</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.close}>Kapat</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Card variant="elevated" padding={4}>
            <Text style={styles.name}>{item.fullName}</Text>
            <View style={styles.pillRow}>
              <StatusPill label={item.role === 'Driver' ? 'Şoför' : 'Müşteri'} tone="brand" />
              <StatusPill label={activePill.label} tone={activePill.tone} />
              {approvalPill ? <StatusPill {...approvalPill} /> : null}
            </View>
            <Text style={styles.muted}>Telefon: {item.phone}</Text>
            <Text style={styles.muted}>E-posta: {item.email}</Text>
            {item.role === 'Driver' && item.vehicle ? (
              <Text style={styles.muted}>Plaka: {item.vehicle}</Text>
            ) : null}
            {item.role === 'Driver' && item.rating != null ? (
              <Text style={styles.muted}>Puan: {item.rating.toFixed(1)}</Text>
            ) : null}
            {item.role === 'Customer' ? (
              <>
                <Text style={styles.muted}>Toplam ilan: {item.totalLoadCount ?? 0}</Text>
                <Text style={styles.muted}>
                  Toplam harcama: {formatCurrencyTRY(item.totalSpent ?? 0)}
                </Text>
              </>
            ) : null}
          </Card>

          <View style={styles.mockNote}>
            <Text style={styles.mockNoteText}>
              Geçmiş seferler, finans ve admin notları bu ekranda gösterilmez.
            </Text>
          </View>

          {loading ? <ActivityIndicator color={palette.brand} style={{ marginTop: spacing[4] }} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {profile ? (
            <Card variant="elevated" padding={4}>
              <Text style={styles.sectionTitle}>Profil özeti</Text>
              <DetailRow label="Ad soyad" value={profile.fullName} />
              <DetailRow label="E-posta" value={profile.email} />
              <DetailRow label="Telefon" value={profile.phone} />
              <DetailRow label="Rol" value={profile.role} />
              <DetailRow label="Onay durumu" value={profile.approvalStatus} />
              {profile.companyName ? (
                <DetailRow label="Sirket" value={profile.companyName} />
              ) : null}
              {profile.companyAddress ? (
                <DetailRow label="Sirket adresi" value={profile.companyAddress} />
              ) : null}
              {profile.taxNumber ? <DetailRow label="Vergi no" value={profile.taxNumber} /> : null}
              {item.role === 'Driver' && profile.vehiclePlate ? (
                <DetailRow label="Plaka" value={profile.vehiclePlate} />
              ) : null}
              {item.role === 'Driver' && profile.vehicleType ? (
                <DetailRow label="Arac tipi" value={profile.vehicleType} />
              ) : null}
              {item.role === 'Driver' && profile.licenseClass ? (
                <DetailRow label="Ehliyet" value={profile.licenseClass} />
              ) : null}
              {item.role === 'Driver' ? (
                <DetailRow
                  label="Degerlendirme"
                  value={`${profile.averageRating.toFixed(1)} (${profile.totalRatingCount})`}
                />
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
  name: { ...typography.h2, marginBottom: spacing[2] },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[2] },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: palette.gold,
    marginBottom: spacing[2],
  },
  muted: { ...typography.caption, textTransform: 'none' },
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

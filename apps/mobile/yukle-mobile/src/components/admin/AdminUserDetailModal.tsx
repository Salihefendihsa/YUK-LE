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
import { getUserProfile } from '../../services/user.service';
import type { AdminUserListItem } from '../../types/admin';
import type { UserProfile } from '../../types/user';
import { formatCurrencyTRY } from '../../utils/format';

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
          <View style={styles.card}>
            <Text style={styles.name}>{item.fullName}</Text>
            <Text style={styles.muted}>Rol: {item.role === 'Driver' ? 'Sofor' : 'Musteri'}</Text>
            <Text style={styles.muted}>Telefon: {item.phone}</Text>
            <Text style={styles.muted}>E-posta: {item.email}</Text>
            <Text style={styles.muted}>
              Hesap: {item.isActive ? 'Aktif' : 'Pasif / Askida'}
            </Text>
            {item.role === 'Driver' && item.approvalStatus ? (
              <Text style={styles.muted}>Onay: {item.approvalStatus}</Text>
            ) : null}
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
          </View>

          <View style={styles.mockNote}>
            <Text style={styles.mockNoteText}>
              Web detay sayfasindaki gecmis seferler, finans ve admin notlari MOCK — mobilde
              gosterilmiyor.
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {profile ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>GET /Users/{'{id}'} (gercek)</Text>
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
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
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
  name: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  sectionTitle: { color: Colors.primaryGold, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  mockNote: {
    backgroundColor: 'rgba(255,182,39,0.1)',
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    borderRadius: 8,
    padding: 10,
  },
  mockNoteText: { color: Colors.primaryGold, fontSize: 12, lineHeight: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingVertical: 4 },
  rowLabel: { color: Colors.textMuted, fontSize: 12, flex: 1 },
  rowValue: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600', flex: 1, textAlign: 'right' },
  error: { color: Colors.error, fontSize: 13 },
});

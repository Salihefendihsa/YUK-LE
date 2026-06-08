import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getApiErrorMessage } from '../../services/api.client';
import {
  activateUser,
  addUserNote,
  getAdminLoads,
  getAdminPayments,
  getCustomerStats,
  getDriverStats,
  suspendUser,
  warnUser,
  type CustomerStats,
  type DriverStats,
} from '../../services/admin.service';
import { getUserProfile } from '../../services/user.service';
import type { AdminLoadRow, AdminPaymentRow, AdminUserListItem } from '../../types/admin';
import type { UserProfile } from '../../types/user';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { space, spacing } from '../../theme/spacing';
import { roleAccents } from '../../theme/roleAccent';
import { formatCurrencyTRY, formatDateTR } from '../../utils/format';
import {
  getApprovalStatusPill,
  getLoadStatusPill,
  getPaymentStatusPill,
} from '../../utils/statusPills';
import { Card } from '../ui/Card';
import { PressableScale } from '../ui/PressableScale';
import { PrimaryButton } from '../ui/PrimaryButton';
import { StatusPill } from '../ui/StatusPill';
import { TextField } from '../ui/TextField';
import { DetailRow } from '../driver/DetailRow';

type Props = {
  item: AdminUserListItem;
  visible: boolean;
  onClose: () => void;
  onUpdated?: () => void;
};

const ADMIN = roleAccents.admin;

type DetailTab = 'genel' | 'ilanlar' | 'odemeler';

function TabBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </PressableScale>
  );
}

export function AdminUserDetailModal({ item, visible, onClose, onUpdated }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [driverStats, setDriverStats] = useState<DriverStats | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [warnReason, setWarnReason] = useState('');
  // Aksiyon sonrası modal içi durum güncellensin (item prop'u değişmez).
  const [activeOverride, setActiveOverride] = useState<boolean | null>(null);
  // Geçmiş sekmeleri (web CustomerDetail/DriverDetail paritesi).
  const [tab, setTab] = useState<DetailTab>('genel');
  const [loads, setLoads] = useState<AdminLoadRow[]>([]);
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!visible || !item.id) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setStatusMsg('');
    setProfile(null);
    setDriverStats(null);
    setCustomerStats(null);
    setSuspendReason('');
    setAdminNote('');
    setWarnReason('');
    setActiveOverride(null);
    setTab('genel');
    setLoads([]);
    setPayments([]);
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

    // Sefer & finansal özet (web admin DriverDetail/CustomerDetail karşılığı) —
    // best-effort: stats hatası ana akışı bozmasın, kart gizli kalır.
    if (item.role === 'Driver') {
      void getDriverStats(item.id)
        .then((s) => !cancelled && setDriverStats(s))
        .catch(() => {});
    } else {
      void getCustomerStats(item.id)
        .then((s) => !cancelled && setCustomerStats(s))
        .catch(() => {});
    }

    // İlan/ödeme geçmişi — best-effort; hata ana akışı bozmasın, sekme boş kalır.
    setHistoryLoading(true);
    const historyTasks: Promise<unknown>[] = [
      getAdminLoads(item.role === 'Driver' ? { driverId: item.id } : { customerId: item.id })
        .then((rows) => !cancelled && setLoads(rows))
        .catch(() => {}),
    ];
    if (item.role === 'Customer') {
      historyTasks.push(
        getAdminPayments({ customerId: item.id })
          .then((rows) => !cancelled && setPayments(rows))
          .catch(() => {}),
      );
    }
    void Promise.all(historyTasks).finally(() => {
      if (!cancelled) setHistoryLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [item.id, visible]);

  const effectiveActive = activeOverride ?? item.isActive;
  const activePill = effectiveActive
    ? { label: 'Aktif', tone: 'success' as const }
    : { label: 'Pasif', tone: 'error' as const };
  const approvalPill =
    item.role === 'Driver' && item.approvalStatus
      ? getApprovalStatusPill(item.approvalStatus)
      : null;

  const runAction = async (
    fn: () => Promise<void>,
    success: string,
    onSuccess?: () => void,
  ) => {
    setActionBusy(true);
    setError('');
    setStatusMsg('');
    try {
      await fn();
      setStatusMsg(success);
      onSuccess?.();
      onUpdated?.();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setActionBusy(false);
    }
  };

  const submitSuspend = () => {
    const reason = suspendReason.trim();
    if (reason.length < 5) {
      Alert.alert('Askıya alma', 'Lütfen en az 5 karakterlik bir sebep girin.');
      return;
    }
    Alert.alert('Askıya al', `${item.fullName} askıya alınacak. Onaylıyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Askıya Al',
        style: 'destructive',
        onPress: () =>
          void runAction(
            () => suspendUser(item.id, reason),
            'Kullanıcı askıya alındı.',
            () => setActiveOverride(false),
          ),
      },
    ]);
  };

  const submitNote = () => {
    const text = adminNote.trim();
    if (!text) {
      Alert.alert('Admin notu', 'Not metni boş olamaz.');
      return;
    }
    void runAction(() => addUserNote(item.id, text), 'Admin notu kaydedildi.');
  };

  const submitWarn = () => {
    void runAction(
      () => warnUser(item.id, warnReason.trim() || 'Uyarı'),
      'Uyarı kaydı oluşturuldu.'
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Kullanıcı Detayı</Text>
          <Pressable onPress={onClose} disabled={actionBusy}>
            <Text style={styles.close}>Kapat</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {statusMsg ? <Text style={styles.success}>{statusMsg}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

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

          <View style={styles.tabRow}>
            <TabBtn label="Genel" active={tab === 'genel'} onPress={() => setTab('genel')} />
            <TabBtn
              label={item.role === 'Driver' ? 'Seferler' : 'İlanlar'}
              active={tab === 'ilanlar'}
              onPress={() => setTab('ilanlar')}
            />
            {item.role === 'Customer' ? (
              <TabBtn
                label="Ödemeler"
                active={tab === 'odemeler'}
                onPress={() => setTab('odemeler')}
              />
            ) : null}
          </View>

          {tab === 'genel' ? (
          <>
          {item.role === 'Driver' && driverStats ? (
            <Card variant="elevated" padding={4}>
              <Text style={styles.sectionTitle}>Sefer & finansal özet</Text>
              <View style={styles.statGrid}>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{driverStats.totalTrips}</Text>
                  <Text style={styles.statLabel}>Sefer</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{formatCurrencyTRY(driverStats.totalEarnings)}</Text>
                  <Text style={styles.statLabel}>Kazanç</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{driverStats.totalWeight.toLocaleString('tr-TR')} kg</Text>
                  <Text style={styles.statLabel}>Taşınan yük</Text>
                </View>
              </View>
              {driverStats.topRoutes.length ? (
                <View style={styles.routeBlock}>
                  <Text style={styles.routeHead}>En çok kullanılan güzergahlar</Text>
                  {driverStats.topRoutes.map((r, i) => (
                    <View key={r.route} style={styles.routeRow}>
                      <Text style={styles.routeIndex}>{i + 1}</Text>
                      <Text style={styles.routeLine}>{r.route.replace('->', ' → ')}</Text>
                      <Text style={styles.routeCount}>{r.count} sefer</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          ) : null}

          {item.role === 'Customer' && customerStats ? (
            <Card variant="elevated" padding={4}>
              <Text style={styles.sectionTitle}>Sefer & finansal özet</Text>
              <View style={styles.statGrid}>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{customerStats.totalLoads}</Text>
                  <Text style={styles.statLabel}>Toplam ilan</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{customerStats.delivered}</Text>
                  <Text style={styles.statLabel}>Teslim edilen</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{customerStats.cancelled}</Text>
                  <Text style={styles.statLabel}>İptal</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{formatCurrencyTRY(customerStats.totalSpend)}</Text>
                  <Text style={styles.statLabel}>Toplam harcama</Text>
                </View>
              </View>
            </Card>
          ) : null}

          <Card variant="elevated" padding={4}>
            <Text style={styles.sectionTitle}>Hesap işlemleri</Text>
            {effectiveActive ? (
              <>
                <TextField
                  placeholder="Askıya alma sebebi (zorunlu)"
                  value={suspendReason}
                  onChangeText={setSuspendReason}
                  multiline
                  style={styles.field}
                />
                <PrimaryButton
                  title="Askıya Al"
                  onPress={submitSuspend}
                  loading={actionBusy}
                  style={styles.actionBtn}
                />
              </>
            ) : (
              <PrimaryButton
                title="Hesabı Aktif Et"
                onPress={() =>
                  void runAction(() => activateUser(item.id), 'Kullanıcı aktif edildi.', () =>
                    setActiveOverride(true),
                  )
                }
                loading={actionBusy}
                style={styles.actionBtn}
              />
            )}
          </Card>

          <Card variant="elevated" padding={4}>
            <Text style={styles.sectionTitle}>Admin notu</Text>
            <TextField
              placeholder="İç not (işlem kaydı)"
              value={adminNote}
              onChangeText={setAdminNote}
              multiline
              style={styles.field}
            />
            <PrimaryButton
              title="Not Kaydet"
              onPress={submitNote}
              loading={actionBusy}
              style={styles.actionBtn}
            />
          </Card>

          <Card variant="elevated" padding={4}>
            <Text style={styles.sectionTitle}>Uyarı gönder</Text>
            <TextField
              placeholder="Uyarı metni (opsiyonel)"
              value={warnReason}
              onChangeText={setWarnReason}
              multiline
              style={styles.field}
            />
            <PrimaryButton
              title="Uyarı Kaydet"
              onPress={submitWarn}
              loading={actionBusy}
              style={styles.actionBtn}
            />
          </Card>

          {loading ? <ActivityIndicator color={palette.brand} style={{ marginTop: space.lg }} /> : null}

          {profile ? (
            <Card variant="elevated" padding={4}>
              <Text style={styles.sectionTitle}>Profil özeti</Text>
              <DetailRow label="Ad soyad" value={profile.fullName} />
              <DetailRow label="E-posta" value={profile.email} />
              <DetailRow label="Telefon" value={profile.phone} />
              <DetailRow label="Rol" value={profile.role} />
              <DetailRow label="Onay durumu" value={profile.approvalStatus} />
              {profile.companyName ? (
                <DetailRow label="Şirket" value={profile.companyName} />
              ) : null}
              {profile.companyAddress ? (
                <DetailRow label="Şirket adresi" value={profile.companyAddress} />
              ) : null}
              {profile.taxNumber ? <DetailRow label="Vergi no" value={profile.taxNumber} /> : null}
              {item.role === 'Driver' && profile.vehiclePlate ? (
                <DetailRow label="Plaka" value={profile.vehiclePlate} />
              ) : null}
              {item.role === 'Driver' && profile.vehicleType ? (
                <DetailRow label="Araç tipi" value={profile.vehicleType} />
              ) : null}
              {item.role === 'Driver' && profile.licenseClass ? (
                <DetailRow label="Ehliyet" value={profile.licenseClass} />
              ) : null}
              {item.role === 'Driver' ? (
                <DetailRow
                  label="Değerlendirme"
                  value={`${profile.averageRating.toFixed(1)} (${profile.totalRatingCount})`}
                />
              ) : null}
            </Card>
          ) : null}
          </>
          ) : null}

          {tab === 'ilanlar' ? (
            <Card variant="elevated" padding={4}>
              <Text style={styles.sectionTitle}>
                {item.role === 'Driver' ? 'Sefer geçmişi' : 'İlan geçmişi'}
              </Text>
              {historyLoading && loads.length === 0 ? (
                <ActivityIndicator color={ADMIN.accent} style={{ marginTop: space.sm }} />
              ) : loads.length === 0 ? (
                <Text style={styles.muted}>Kayıt bulunamadı.</Text>
              ) : (
                loads.map((l) => {
                  const pill = getLoadStatusPill(l.status);
                  return (
                    <View key={l.id} style={styles.histRow}>
                      <View style={styles.histHead}>
                        <Text style={styles.histTitle} numberOfLines={1}>
                          {l.fromCity} → {l.toCity}
                        </Text>
                        <StatusPill {...pill} />
                      </View>
                      <Text style={styles.muted}>
                        {formatCurrencyTRY(l.price)} · {formatDateTR(l.createdAt)}
                      </Text>
                      {item.role === 'Driver' && l.customerName ? (
                        <Text style={styles.muted}>Müşteri: {l.customerName}</Text>
                      ) : null}
                      {item.role === 'Customer' && l.driverName ? (
                        <Text style={styles.muted}>Şoför: {l.driverName}</Text>
                      ) : null}
                    </View>
                  );
                })
              )}
            </Card>
          ) : null}

          {tab === 'odemeler' ? (
            <Card variant="elevated" padding={4}>
              <Text style={styles.sectionTitle}>Ödeme geçmişi</Text>
              {historyLoading && payments.length === 0 ? (
                <ActivityIndicator color={ADMIN.accent} style={{ marginTop: space.sm }} />
              ) : payments.length === 0 ? (
                <Text style={styles.muted}>Ödeme kaydı bulunamadı.</Text>
              ) : (
                payments.map((p) => {
                  const pill = getPaymentStatusPill(p.status);
                  return (
                    <View key={p.id} style={styles.histRow}>
                      <View style={styles.histHead}>
                        <Text style={styles.histTitle}>{formatCurrencyTRY(p.amount)}</Text>
                        <StatusPill {...pill} />
                      </View>
                      <Text style={styles.muted}>İlan: {p.loadId.slice(0, 8)}...</Text>
                      <Text style={styles.muted}>{formatDateTR(p.createdAt)}</Text>
                    </View>
                  );
                })
              )}
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
  name: { ...typography.h2, marginBottom: space.sm },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.sm },
  tabRow: { flexDirection: 'row', gap: space.sm },
  tabBtn: {
    flex: 1,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: 'center',
    backgroundColor: palette.surface,
  },
  tabBtnActive: { borderColor: ADMIN.accentBorder, backgroundColor: ADMIN.accentMuted },
  tabText: { ...typography.bodyMedium, fontSize: 13, color: palette.textMuted },
  tabTextActive: { color: ADMIN.accent },
  histRow: {
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSubtle,
    gap: 2,
  },
  histHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.sm,
  },
  histTitle: { ...typography.bodyMedium, fontSize: 14, color: palette.text, flex: 1 },
  sectionTitle: { ...typography.h3, color: palette.gold, marginBottom: space.sm },
  muted: { ...typography.caption, textTransform: 'none' },
  field: { minHeight: 72, marginBottom: space.sm },
  actionBtn: { marginTop: space.xs },
  success: { ...typography.bodySmall, color: palette.success },
  error: { ...typography.bodySmall, color: palette.error },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  statChip: {
    flexGrow: 1,
    flexBasis: '30%',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: space.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surface,
    gap: 2,
  },
  statValue: { ...typography.h3, color: palette.brand },
  statLabel: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  routeBlock: { marginTop: space.md, gap: space.xs },
  routeHead: { ...typography.bodyMedium, fontSize: 13, color: palette.textSecondary, marginBottom: space.xs },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  routeIndex: { ...typography.bodySmall, color: palette.brand, width: 18 },
  routeLine: { ...typography.bodySmall, color: palette.text, flex: 1 },
  routeCount: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
});

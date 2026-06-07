import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { API_BASE_URL } from '../../constants/api';
import {
  fetchReviewDocumentDataUri,
  parseAiInferenceDetails,
} from '../../services/admin.service';
import type { PendingReview } from '../../types/admin';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { space, spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { formatDateTR } from '../../utils/format';
import { getAiConfidencePill } from '../../utils/statusPills';
import { Card } from '../ui/Card';
import { PressableScale } from '../ui/PressableScale';
import { SecondaryButton } from '../ui/SecondaryButton';
import { StatusPill } from '../ui/StatusPill';
import { TextField } from '../ui/TextField';

const REJECT_PRESETS = [
  { id: '', label: 'Hazır sebep seçin' },
  { id: 'Belge kalitesi yetersiz', label: 'Belge kalitesi yetersiz' },
  { id: 'Belge süresi dolmuş', label: 'Belge süresi dolmuş' },
  { id: 'Bilgi uyuşmuyor', label: 'Bilgi uyuşmuyor' },
  { id: 'Sahte belge şüphesi', label: 'Sahte belge şüphesi' },
] as const;

type Props = {
  review: PendingReview;
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onApprove: (reason: string, documentType?: string) => Promise<void>;
  onReject: (reason: string, documentType?: string) => Promise<void>;
};

function resolveImageUri(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
}

export function ReviewsDetailModal({ review, visible, busy, onClose, onApprove, onReject }: Props) {
  const ai = useMemo(() => parseAiInferenceDetails(review.aiInferenceDetails), [review.aiInferenceDetails]);
  const docType = ai.documentType;
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const imageUri = previewUri ?? resolveImageUri(ai.documentUrl);
  const confidence = ai.confidenceScore ?? null;
  const aiPill = getAiConfidencePill(confidence);

  const [adminNote, setAdminNote] = useState(review.adminReviewNote ?? '');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectPreset, setRejectPreset] = useState('');
  const [rejectText, setRejectText] = useState('');

  useEffect(() => {
    if (!visible) return;
    setAdminNote(review.adminReviewNote ?? '');
    setRejectOpen(false);
    setRejectText('');
    setRejectPreset('');
    setPreviewUri(null);
  }, [review.id, visible, review.adminReviewNote]);

  useEffect(() => {
    if (!visible || !review.id) return;
    let cancelled = false;
    const direct = resolveImageUri(ai.documentUrl);
    if (direct?.startsWith('data:')) {
      setPreviewUri(direct);
      return;
    }
    if (!docType) return;

    setPreviewLoading(true);
    void fetchReviewDocumentDataUri(review.id, docType)
      .then((uri) => {
        if (!cancelled) setPreviewUri(uri ?? direct);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, review.id, docType, ai.documentUrl]);

  const combinedReject = `${rejectPreset ? `${rejectPreset}. ` : ''}${rejectText}`.trim();

  const confirmApprove = () => {
    Alert.alert(
      'Belgeyi onayla',
      'Bu belgeyi onaylıyorsunuz. Şoför sisteme erişim kazanacak. Devam edilsin mi?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, Onayla',
          onPress: async () => {
            const reason = adminNote.trim() || 'Belgeler manuel olarak onaylandı.';
            await onApprove(reason, docType);
            setRejectOpen(false);
          },
        },
      ]
    );
  };

  const submitReject = async () => {
    if (combinedReject.length < 20) {
      Alert.alert('Red sebebi', 'Açıklama en az 20 karakter olmalıdır.');
      return;
    }
    await onReject(combinedReject, docType);
    setRejectOpen(false);
    setRejectText('');
    setRejectPreset('');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Belge İnceleme</Text>
          <PressableScale onPress={onClose} disabled={busy}>
            <Text style={styles.closeText}>Kapat</Text>
          </PressableScale>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.previewBox}>
            {previewLoading ? (
              <Text style={styles.previewPlaceholder}>Belge önizlemesi yükleniyor...</Text>
            ) : imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImg} resizeMode="contain" />
            ) : (
              <Text style={styles.previewPlaceholder}>
                Belge görseli henüz yüklenmemiş veya depoda yok. Belge bilgileri aşağıda.
              </Text>
            )}
          </View>

          <Card variant="elevated" padding={4}>
            <Text style={styles.driverName}>{review.fullName}</Text>
            <Text style={styles.muted}>Telefon: {review.phone}</Text>
            <Text style={styles.muted}>E-posta: {review.email}</Text>
            <Text style={styles.muted}>Kayıt: {formatDateTR(review.createdAt)}</Text>
          </Card>

          <Card variant="elevated" padding={4}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Belge inceleme sonucu</Text>
              <StatusPill {...aiPill} />
            </View>
            <DocRow label="Belge tipi" value={ai.documentType ?? '-'} />
            <DocRow label="Geçerlilik" value={ai.expiryDate ?? ai.validUntil ?? '-'} />
            <DocRow
              label="Geçerli mi"
              value={ai.isValid == null ? '-' : ai.isValid ? 'Evet' : 'Hayır'}
            />
            {ai.validationMessage ? <Text style={styles.docMsg}>{ai.validationMessage}</Text> : null}
            {ai.documentClasses && ai.documentClasses.length > 0 ? (
              <Text style={styles.muted}>Sınıflar: {ai.documentClasses.join(', ')}</Text>
            ) : null}
            {review.adminReviewNote ? (
              <Text style={styles.muted}>Sistem notu: {review.adminReviewNote}</Text>
            ) : null}
          </Card>

          <Card variant="elevated" padding={4}>
            <Text style={styles.fieldLabel}>Admin notu</Text>
            <TextField
              placeholder="İnceleme notu (onayda isteğe bağlı)"
              value={adminNote}
              onChangeText={setAdminNote}
              multiline
              style={styles.noteField}
            />
          </Card>

          {rejectOpen ? (
            <Card variant="elevated" padding={4} style={styles.rejectCard}>
              <Text style={styles.sectionTitle}>Red sebebi</Text>
              {REJECT_PRESETS.map((p) => (
                <PressableScale
                  key={p.id || 'empty'}
                  style={[styles.presetBtn, rejectPreset === p.id && styles.presetBtnActive]}
                  onPress={() => setRejectPreset(p.id)}
                >
                  <Text style={styles.presetText}>{p.label}</Text>
                </PressableScale>
              ))}
              <TextField
                placeholder="Açıklama (zorunlu, en az 20 karakter)"
                value={rejectText}
                onChangeText={setRejectText}
                multiline
              />
              <View style={styles.rowBtns}>
                <SecondaryButton title="Vazgeç" onPress={() => setRejectOpen(false)} style={{ flex: 1 }} />
                <PressableScale
                  style={[styles.dangerBtn, (busy || combinedReject.length < 20) && styles.btnDisabled]}
                  onPress={submitReject}
                  disabled={busy || combinedReject.length < 20}
                >
                  <Text style={styles.dangerText}>Reddet ve Gönder</Text>
                </PressableScale>
              </View>
            </Card>
          ) : null}

          <PressableScale
            style={[styles.approveBtn, busy && styles.btnDisabled]}
            onPress={confirmApprove}
            disabled={busy}
          >
            <Text style={styles.approveText}>Belgeyi Onayla</Text>
          </PressableScale>

          {!rejectOpen ? (
            <PressableScale
              style={[styles.rejectBtn, busy && styles.btnDisabled]}
              onPress={() => setRejectOpen(true)}
              disabled={busy}
            >
              <Text style={styles.rejectBtnText}>Belgeyi Reddet</Text>
            </PressableScale>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function DocRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.docRow}>
      <Text style={styles.docLabel}>{label}</Text>
      <Text style={styles.docValue}>{value}</Text>
    </View>
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
  closeText: { ...typography.link },
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: space.md },
  previewBox: {
    minHeight: 180,
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImg: { width: '100%', height: 220 },
  previewPlaceholder: {
    ...typography.caption,
    textTransform: 'none',
    textAlign: 'center',
    padding: spacing[6],
  },
  rejectCard: { borderColor: palette.errorBorder },
  driverName: { ...typography.h3 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  sectionTitle: { ...typography.bodyMedium, color: palette.gold },
  muted: { ...typography.caption, textTransform: 'none' },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm, paddingVertical: space.xs },
  docLabel: { ...typography.caption, textTransform: 'none' },
  docValue: { ...typography.bodyMedium, fontSize: 13, color: palette.text, flex: 1, textAlign: 'right' },
  docMsg: { ...typography.caption, color: palette.textSecondary, marginTop: space.sm, lineHeight: 18 },
  fieldLabel: { ...typography.caption, marginBottom: space.sm },
  noteField: { minHeight: 80 },
  presetBtn: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    marginBottom: space.sm,
  },
  presetBtnActive: { borderColor: palette.brandBorder, backgroundColor: palette.brandMuted },
  presetText: { ...typography.caption, textTransform: 'none' },
  rowBtns: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  dangerBtn: {
    flex: 1,
    paddingVertical: space.md,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: palette.errorSolid,
  },
  dangerText: { ...typography.bodyMedium, color: palette.text },
  approveBtn: {
    backgroundColor: palette.success,
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  approveText: { ...typography.bodyMedium, fontSize: 16, color: palette.text },
  rejectBtn: {
    backgroundColor: palette.errorBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.errorBorder,
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  rejectBtnText: { ...typography.bodyMedium, fontSize: 16, color: palette.error },
  btnDisabled: { opacity: 0.5 },
});

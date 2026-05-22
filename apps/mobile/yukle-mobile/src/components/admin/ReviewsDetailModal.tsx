import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { API_BASE_URL } from '../../constants/api';
import { parseAiInferenceDetails } from '../../services/admin.service';
import type { PendingReview } from '../../types/admin';
import { palette } from '../../theme/colors';
import { fontFamily, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { formatDateTR } from '../../utils/format';
import { getAiConfidencePill } from '../../utils/statusPills';
import { Card } from '../ui/Card';
import { SecondaryButton } from '../ui/SecondaryButton';
import { StatusPill } from '../ui/StatusPill';
import { TextField } from '../ui/TextField';

const REJECT_PRESETS = [
  { id: '', label: 'Hazir sebep secin' },
  { id: 'Belge kalitesi yetersiz', label: 'Belge kalitesi yetersiz' },
  { id: 'Belge suresi dolmus', label: 'Belge suresi dolmus' },
  { id: 'Bilgi uyusmuyor', label: 'Bilgi uyusmuyor' },
  { id: 'Sahte belge suphesi', label: 'Sahte belge suphesi' },
] as const;

type Props = {
  review: PendingReview;
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onApprove: (reason: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
};

function resolveImageUri(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
}

export function ReviewsDetailModal({ review, visible, busy, onClose, onApprove, onReject }: Props) {
  const ai = useMemo(() => parseAiInferenceDetails(review.aiInferenceDetails), [review.aiInferenceDetails]);
  const imageUri = resolveImageUri(ai.documentUrl);
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
  }, [review.id, visible, review.adminReviewNote]);

  const combinedReject = `${rejectPreset ? `${rejectPreset}. ` : ''}${rejectText}`.trim();

  const confirmApprove = () => {
    Alert.alert(
      'Belgeyi onayla',
      'Bu belgeyi onayliyorsunuz. Sofor sisteme erisim kazanacak. Devam edilsin mi?',
      [
        { text: 'Vazgec', style: 'cancel' },
        {
          text: 'Evet, Onayla',
          onPress: async () => {
            const reason = adminNote.trim() || 'Belgeler manuel olarak onaylandi.';
            await onApprove(reason);
            setRejectOpen(false);
          },
        },
      ]
    );
  };

  const submitReject = async () => {
    if (combinedReject.length < 20) {
      Alert.alert('Red sebebi', 'Aciklama en az 20 karakter olmalidir.');
      return;
    }
    await onReject(combinedReject);
    setRejectOpen(false);
    setRejectText('');
    setRejectPreset('');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Belge Inceleme</Text>
          <Pressable onPress={onClose} disabled={busy}>
            <Text style={styles.closeText}>Kapat</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.previewBox}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImg} resizeMode="contain" />
            ) : (
              <Text style={styles.previewPlaceholder}>
                Belge gorseli API yanitinda yok. AI analiz bilgileri asagida.
              </Text>
            )}
          </View>

          <Card variant="elevated" padding={4}>
            <Text style={styles.driverName}>{review.fullName}</Text>
            <Text style={styles.muted}>Telefon: {review.phone}</Text>
            <Text style={styles.muted}>E-posta: {review.email}</Text>
            <Text style={styles.muted}>Kayit: {formatDateTR(review.createdAt)}</Text>
          </Card>

          <Card variant="elevated" padding={4}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>AI analiz sonucu</Text>
              <StatusPill {...aiPill} />
            </View>
            <AiRow label="Belge tipi" value={ai.documentType ?? '-'} />
            <AiRow label="Gecerlilik" value={ai.expiryDate ?? ai.validUntil ?? '-'} />
            <AiRow
              label="Gecerli mi"
              value={ai.isValid == null ? '-' : ai.isValid ? 'Evet' : 'Hayir'}
            />
            {ai.validationMessage ? <Text style={styles.aiMsg}>{ai.validationMessage}</Text> : null}
            {ai.documentClasses && ai.documentClasses.length > 0 ? (
              <Text style={styles.muted}>Siniflar: {ai.documentClasses.join(', ')}</Text>
            ) : null}
            {review.adminReviewNote ? (
              <Text style={styles.muted}>Sistem notu: {review.adminReviewNote}</Text>
            ) : null}
          </Card>

          <Card variant="elevated" padding={4}>
            <Text style={styles.fieldLabel}>Admin notu</Text>
            <TextField
              placeholder="Inceleme notu (onayda istege bagli)"
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
                <Pressable
                  key={p.id || 'empty'}
                  style={[styles.presetBtn, rejectPreset === p.id && styles.presetBtnActive]}
                  onPress={() => setRejectPreset(p.id)}
                >
                  <Text style={styles.presetText}>{p.label}</Text>
                </Pressable>
              ))}
              <TextField
                placeholder="Aciklama (zorunlu, en az 20 karakter)"
                value={rejectText}
                onChangeText={setRejectText}
                multiline
              />
              <View style={styles.rowBtns}>
                <SecondaryButton title="Vazgec" onPress={() => setRejectOpen(false)} style={{ flex: 1 }} />
                <Pressable
                  style={[styles.dangerBtn, (busy || combinedReject.length < 20) && styles.btnDisabled]}
                  onPress={submitReject}
                  disabled={busy || combinedReject.length < 20}
                >
                  <Text style={styles.dangerText}>Reddet ve Gonder</Text>
                </Pressable>
              </View>
            </Card>
          ) : null}

          <Pressable
            style={[styles.approveBtn, busy && styles.btnDisabled]}
            onPress={confirmApprove}
            disabled={busy}
          >
            <Text style={styles.approveText}>Belgeyi Onayla</Text>
          </Pressable>

          {!rejectOpen ? (
            <Pressable
              style={[styles.rejectBtn, busy && styles.btnDisabled]}
              onPress={() => setRejectOpen(true)}
              disabled={busy}
            >
              <Text style={styles.rejectBtnText}>Belgeyi Reddet</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function AiRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.aiRow}>
      <Text style={styles.aiLabel}>{label}</Text>
      <Text style={styles.aiValue}>{value}</Text>
    </View>
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
  closeText: { ...typography.link },
  scroll: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[3] },
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
    marginBottom: spacing[2],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: palette.gold,
  },
  muted: { ...typography.caption, textTransform: 'none' },
  aiRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[2], paddingVertical: 4 },
  aiLabel: { ...typography.caption, textTransform: 'none' },
  aiValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: palette.text,
    flex: 1,
    textAlign: 'right',
  },
  aiMsg: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: palette.textSecondary,
    marginTop: spacing[2],
    lineHeight: 18,
  },
  fieldLabel: { ...typography.caption, marginBottom: spacing[2] },
  noteField: { minHeight: 80 },
  presetBtn: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    marginBottom: spacing[2],
  },
  presetBtnActive: { borderColor: palette.brandBorder, backgroundColor: palette.brandMuted },
  presetText: { ...typography.caption, textTransform: 'none' },
  rowBtns: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[2] },
  dangerBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: palette.error,
  },
  dangerText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: palette.text,
  },
  approveBtn: {
    backgroundColor: palette.success,
    borderRadius: radius.lg,
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  approveText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: palette.text,
  },
  rejectBtn: {
    backgroundColor: palette.errorBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.errorBorder,
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  rejectBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: palette.error,
  },
  btnDisabled: { opacity: 0.5 },
});

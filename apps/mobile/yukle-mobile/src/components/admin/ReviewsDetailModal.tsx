import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { API_BASE_URL } from '../../constants/api';
import { Colors } from '../../constants/colors';
import { parseAiInferenceDetails } from '../../services/admin.service';
import type { PendingReview } from '../../types/admin';
import { formatDateTR } from '../../utils/format';

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

          <View style={styles.card}>
            <Text style={styles.driverName}>{review.fullName}</Text>
            <Text style={styles.muted}>Telefon: {review.phone}</Text>
            <Text style={styles.muted}>E-posta: {review.email}</Text>
            <Text style={styles.muted}>Kayit: {formatDateTR(review.createdAt)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>AI analiz sonucu</Text>
            <AiRow label="Belge tipi" value={ai.documentType ?? '-'} />
            <AiRow
              label="Gecerlilik"
              value={ai.expiryDate ?? ai.validUntil ?? '-'}
            />
            <AiRow label="Gecerli mi" value={ai.isValid == null ? '-' : ai.isValid ? 'Evet' : 'Hayir'} />
            <AiRow
              label="Guven skoru"
              value={confidence != null ? `%${Math.round(confidence)}` : 'N/A'}
            />
            {ai.validationMessage ? (
              <Text style={styles.aiMsg}>{ai.validationMessage}</Text>
            ) : null}
            {ai.documentClasses && ai.documentClasses.length > 0 ? (
              <Text style={styles.muted}>Siniflar: {ai.documentClasses.join(', ')}</Text>
            ) : null}
            {review.adminReviewNote ? (
              <Text style={styles.muted}>Sistem notu: {review.adminReviewNote}</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Admin notu</Text>
            <TextInput
              style={styles.textArea}
              value={adminNote}
              onChangeText={setAdminNote}
              placeholder="Inceleme notu (onayda istege bagli)"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
          </View>

          {rejectOpen ? (
            <View style={[styles.card, styles.rejectCard]}>
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
              <TextInput
                style={styles.textArea}
                value={rejectText}
                onChangeText={setRejectText}
                placeholder="Aciklama (zorunlu, en az 20 karakter)"
                placeholderTextColor={Colors.textMuted}
                multiline
              />
              <View style={styles.rowBtns}>
                <Pressable style={styles.ghostBtn} onPress={() => setRejectOpen(false)}>
                  <Text style={styles.ghostText}>Vazgec</Text>
                </Pressable>
                <Pressable
                  style={[styles.dangerBtn, (busy || combinedReject.length < 20) && styles.btnDisabled]}
                  onPress={submitReject}
                  disabled={busy || combinedReject.length < 20}
                >
                  <Text style={styles.dangerText}>Reddet ve Gonder</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <Pressable
            style={[styles.approveBtn, busy && styles.btnDisabled]}
            onPress={confirmApprove}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={Colors.bgDark} />
            ) : (
              <Text style={styles.approveText}>Belgeyi Onayla</Text>
            )}
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
  closeText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  previewBox: {
    minHeight: 180,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImg: { width: '100%', height: 220 },
  previewPlaceholder: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', padding: 24 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 6,
  },
  rejectCard: { borderColor: 'rgba(239,68,68,0.4)' },
  driverName: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700' },
  sectionTitle: { color: Colors.primaryGold, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  aiRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingVertical: 4 },
  aiLabel: { color: Colors.textMuted, fontSize: 13 },
  aiValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  aiMsg: { color: Colors.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 18 },
  fieldLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  textArea: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  presetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  presetBtnActive: { borderColor: Colors.primary, backgroundColor: 'rgba(255,107,0,0.1)' },
  presetText: { color: Colors.textSecondary, fontSize: 13 },
  rowBtns: { flexDirection: 'row', gap: 8, marginTop: 8 },
  ghostBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghostText: { color: Colors.textSecondary, fontWeight: '600' },
  dangerBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.error,
  },
  dangerText: { color: '#fff', fontWeight: '700' },
  approveBtn: {
    backgroundColor: Colors.success,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  approveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rejectBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.error,
    paddingVertical: 16,
    alignItems: 'center',
  },
  rejectBtnText: { color: Colors.error, fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});

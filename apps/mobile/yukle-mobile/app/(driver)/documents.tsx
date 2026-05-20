import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../src/constants/colors';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { uploadDocumentOcr, uploadDriverDocument } from '../../src/services/documents.service';
import { useAuthStore } from '../../src/store/auth.store';
import type { DocUiStatus, DriverDocType, PickedDocumentFile } from '../../src/types/document';
import { pickDocumentImage } from '../../src/utils/pickDocument';

type DocKey = 'license' | 'src' | 'psychotechnic';

type DocCardConfig = {
  key: DocKey;
  title: string;
  docType: DriverDocType;
  icon: string;
};

const DOC_CARDS: DocCardConfig[] = [
  { key: 'license', title: 'Surucu Belgesi (Ehliyet)', docType: 'DriverLicense', icon: '📋' },
  { key: 'src', title: 'SRC Belgesi', docType: 'SrcCertificate', icon: '🏆' },
  { key: 'psychotechnic', title: 'Psikoteknik Belgesi', docType: 'Psychotechnical', icon: '🧠' },
];

type DocState = {
  status: DocUiStatus;
  file: PickedDocumentFile | null;
  fileLabel: string;
  resultText: string;
  approvalStatus: string;
  loading: boolean;
};

const INITIAL_DOC_STATE: DocState = {
  status: 'Bekleniyor',
  file: null,
  fileLabel: 'Dosya secilmedi',
  resultText: '',
  approvalStatus: '',
  loading: false,
};

function mapApprovalToUi(status: string): DocUiStatus {
  const s = status.toLowerCase();
  if (s.includes('reject')) return 'Reddedildi';
  if (s === 'active' || s.includes('approv')) return 'Onayli';
  if (s.includes('pending') || s.includes('manual') || s.includes('review')) return 'Inceleniyor';
  return 'Inceleniyor';
}

function accountApprovalLabel(status: string | undefined): string {
  if (!status) return 'Bilinmiyor';
  if (status === 'Active') return 'Onayli';
  if (status === 'Rejected') return 'Reddedildi';
  if (status === 'Pending' || status === 'PendingReview') return 'Pending';
  if (status === 'ManualApprovalRequired') return 'Manuel inceleme';
  return status;
}

export default function DriverDocumentsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [error, setError] = useState('');
  const [docs, setDocs] = useState<Record<DocKey, DocState>>({
    license: { ...INITIAL_DOC_STATE },
    src: { ...INITIAL_DOC_STATE },
    psychotechnic: { ...INITIAL_DOC_STATE },
  });

  const pickFile = async (key: DocKey) => {
    setError('');
    try {
      const file = await pickDocumentImage();
      if (!file) return;
      setDocs((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          file,
          fileLabel: file.name,
          status: 'Bekleniyor',
          resultText: '',
        },
      }));
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const handleAnalyzeAndUpload = async (card: DocCardConfig) => {
    const state = docs[card.key];
    if (!state.file) return;

    setDocs((prev) => ({
      ...prev,
      [card.key]: { ...prev[card.key], loading: true, status: 'Inceleniyor' },
    }));
    setError('');

    try {
      const ocr = await uploadDocumentOcr(state.file, card.docType);
      if (!ocr.isValid) {
        setDocs((prev) => ({
          ...prev,
          [card.key]: {
            ...prev[card.key],
            loading: false,
            status: 'Reddedildi',
            resultText: ocr.validationMessage ?? 'Belge AI analizinden gecemedi.',
          },
        }));
        return;
      }

      const upload = await uploadDriverDocument(state.file, card.docType);
      const approval = upload.approvalStatus ?? '';
      const uiStatus = mapApprovalToUi(approval);

      setDocs((prev) => ({
        ...prev,
        [card.key]: {
          ...prev[card.key],
          loading: false,
          status: uiStatus,
          approvalStatus: approval,
          resultText:
            upload.message ??
            upload.validationMessage ??
            `OCR: ${ocr.fullName ?? 'OK'} | Onay: ${approval || 'islem tamam'}`,
        },
      }));
    } catch (e) {
      setDocs((prev) => ({
        ...prev,
        [card.key]: { ...prev[card.key], loading: false, status: 'Reddedildi' },
      }));
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <ScrollView style={screenRootStyle} contentContainerStyle={styles.scroll}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>← Geri</Text>
      </Pressable>

      <Text style={styles.title}>Belgelerim</Text>
      <Text style={styles.sub}>
        Ehliyet, SRC ve psikoteknik belgelerinizi yukleyin. {Platform.OS === 'web' ? 'Web: dosya secici' : 'Native: galeri'}.
      </Text>

      <View style={styles.accountCard}>
        <Text style={styles.mutedSmall}>Hesap onay durumu</Text>
        <Text style={styles.accountStatus}>{accountApprovalLabel(user?.approvalStatus)}</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {DOC_CARDS.map((card) => {
        const state = docs[card.key];
        const badgeStyle =
          state.status === 'Onayli'
            ? styles.badgeOk
            : state.status === 'Reddedildi'
              ? styles.badgeErr
              : state.status === 'Inceleniyor'
                ? styles.badgePending
                : styles.badgeMuted;

        return (
          <View key={card.key} style={styles.docCard}>
            <View style={styles.docHead}>
              <Text style={styles.docTitle}>
                {card.icon} {card.title}
              </Text>
              <View style={[styles.badge, badgeStyle]}>
                <Text style={styles.badgeText}>{state.status}</Text>
              </View>
            </View>

            {state.approvalStatus ? (
              <Text style={styles.mutedSmall}>ApprovalStatus: {state.approvalStatus}</Text>
            ) : null}

            <Pressable style={styles.pickBtn} onPress={() => pickFile(card.key)} disabled={state.loading}>
              <Text style={styles.pickBtnText}>Dosya Sec</Text>
            </Pressable>
            <Text style={styles.mutedSmall}>{state.fileLabel}</Text>

            <Pressable
              style={[styles.uploadBtn, (!state.file || state.loading) && styles.btnDisabled]}
              onPress={() => handleAnalyzeAndUpload(card)}
              disabled={!state.file || state.loading}
            >
              {state.loading ? (
                <ActivityIndicator color={Colors.bgDark} />
              ) : (
                <Text style={styles.uploadBtnText}>AI Analiz Et ve Kaydet</Text>
              )}
            </Pressable>

            {state.resultText ? <Text style={styles.result}>{state.resultText}</Text> : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  backLink: { color: Colors.primary, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: Colors.textSecondary, fontSize: 13 },
  accountCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 4,
  },
  accountStatus: { color: Colors.primaryGold, fontSize: 16, fontWeight: '700' },
  docCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  docHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  docTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.bgDark },
  badgeOk: { backgroundColor: Colors.success },
  badgeErr: { backgroundColor: Colors.error },
  badgePending: { backgroundColor: Colors.primaryGold },
  badgeMuted: { backgroundColor: Colors.textMuted },
  pickBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
  },
  pickBtnText: { color: Colors.textPrimary, fontWeight: '600' },
  uploadBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  uploadBtnText: { color: Colors.bgDark, fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.45 },
  result: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  mutedSmall: { color: Colors.textMuted, fontSize: 12 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
});

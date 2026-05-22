import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { Card } from '../../src/components/ui/Card';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';
import { StatusPill } from '../../src/components/ui/StatusPill';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { uploadDocumentOcr, uploadDriverDocument } from '../../src/services/documents.service';
import { useAuthStore } from '../../src/store/auth.store';
import type { DocUiStatus, DriverDocType, PickedDocumentFile } from '../../src/types/document';
import { palette } from '../../src/theme/colors';
import { fontFamily, typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { pickDocumentImage } from '../../src/utils/pickDocument';
import { getApprovalStatusPill, getDocUiStatusPill } from '../../src/utils/statusPills';

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

export default function DriverDocumentsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [error, setError] = useState('');
  const [docs, setDocs] = useState<Record<DocKey, DocState>>({
    license: { ...INITIAL_DOC_STATE },
    src: { ...INITIAL_DOC_STATE },
    psychotechnic: { ...INITIAL_DOC_STATE },
  });

  const accountPill = getApprovalStatusPill(user?.approvalStatus);

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
        <Text style={typography.link}>← Geri</Text>
      </Pressable>

      <Text style={styles.title}>Belgelerim</Text>
      <Text style={styles.sub}>
        Ehliyet, SRC ve psikoteknik belgelerinizi yukleyin.{' '}
        {Platform.OS === 'web' ? 'Web: dosya secici' : 'Native: galeri'}.
      </Text>

      <Card variant="glass" padding={4}>
        <Text style={styles.accountLabel}>Hesap onay durumu</Text>
        <View style={styles.accountRow}>
          <Text style={styles.accountHint}>ApprovalStatus</Text>
          <StatusPill label={accountPill.label} tone={accountPill.tone} />
        </View>
      </Card>

      {error ? <AlertBanner message={error} tone="error" /> : null}

      {DOC_CARDS.map((card) => {
        const state = docs[card.key];
        const pill = getDocUiStatusPill(state.status);

        return (
          <Card key={card.key} variant="default" padding={4} style={styles.docCard}>
            <View style={styles.docHead}>
              <Text style={styles.docTitle}>
                {card.icon} {card.title}
              </Text>
              <StatusPill label={pill.label} tone={pill.tone} />
            </View>

            {state.approvalStatus ? (
              <Text style={styles.approvalRaw}>API: {state.approvalStatus}</Text>
            ) : null}

            <SecondaryButton title="Dosya Sec" onPress={() => pickFile(card.key)} disabled={state.loading} />
            <Text style={styles.fileLabel}>{state.fileLabel}</Text>

            <PrimaryButton
              title="AI Analiz Et ve Kaydet"
              onPress={() => handleAnalyzeAndUpload(card)}
              loading={state.loading}
              disabled={!state.file || state.loading}
            />

            {state.resultText ? <Text style={styles.result}>{state.resultText}</Text> : null}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] },
  title: { ...typography.h1 },
  sub: { ...typography.caption, textTransform: 'none', marginBottom: spacing[1] },
  accountLabel: { ...typography.label, marginBottom: spacing[2] },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing[2] },
  accountHint: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  docCard: { gap: spacing[3] },
  docHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[2] },
  docTitle: { fontFamily: fontFamily.semiBold, fontSize: 15, color: palette.text, flex: 1 },
  approvalRaw: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  fileLabel: { ...typography.caption, textTransform: 'none', textAlign: 'center' },
  result: { ...typography.caption, textTransform: 'none', lineHeight: 18 },
});

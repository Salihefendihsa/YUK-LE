import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PrimaryButton } from '../../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../../src/components/ui/SecondaryButton';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { ScreenContainer, ScreenScroll } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { uploadDocumentOcr, uploadDriverDocument } from '../../../src/services/documents.service';
import { getUserProfile } from '../../../src/services/user.service';
import { useAuthStore } from '../../../src/store/auth.store';
import type { DocUiStatus, DriverDocType, PickedDocumentFile } from '../../../src/types/document';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { pickDocumentImage } from '../../../src/utils/pickDocument';
import { getApprovalStatusPill, getDocUiStatusPill } from '../../../src/utils/statusPills';

type DocKey = 'license' | 'src' | 'psychotechnic';

type DocCardConfig = {
  key: DocKey;
  title: string;
  docType: DriverDocType;
  icon: string;
  approvedFlag: 'isDriverLicenseApproved' | 'isSrcApproved' | 'isPsychotechnicalApproved';
};

const DOC_CARDS: DocCardConfig[] = [
  {
    key: 'license',
    title: 'Sürücü Belgesi (Ehliyet)',
    docType: 'DriverLicense',
    icon: '📋',
    approvedFlag: 'isDriverLicenseApproved',
  },
  { key: 'src', title: 'SRC Belgesi', docType: 'SrcCertificate', icon: '🏆', approvedFlag: 'isSrcApproved' },
  {
    key: 'psychotechnic',
    title: 'Psikoteknik Belgesi',
    docType: 'Psychotechnical',
    icon: '🧠',
    approvedFlag: 'isPsychotechnicalApproved',
  },
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
  fileLabel: 'Dosya seçilmedi',
  resultText: '',
  approvalStatus: '',
  loading: false,
};

function mapApprovalToUi(approved: boolean | undefined, accountStatus: string): DocUiStatus {
  if (approved === true) return 'Onayli';
  const s = accountStatus.toLowerCase();
  if (s.includes('reject')) return 'Reddedildi';
  if (approved === false && (s.includes('pending') || s.includes('review') || s.includes('manual'))) {
    return 'Inceleniyor';
  }
  if (approved === false) return 'Bekleniyor';
  return 'Bekleniyor';
}

export default function DriverDocumentsScreen() {
  const user = useAuthStore((s) => s.user);
  const [error, setError] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState(user?.approvalStatus ?? '');
  const [docs, setDocs] = useState<Record<DocKey, DocState>>({
    license: { ...INITIAL_DOC_STATE },
    src: { ...INITIAL_DOC_STATE },
    psychotechnic: { ...INITIAL_DOC_STATE },
  });
  const [flags, setFlags] = useState({
    isDriverLicenseApproved: false,
    isSrcApproved: false,
    isPsychotechnicalApproved: false,
  });

  const syncFromProfile = useCallback(
    (profile: Awaited<ReturnType<typeof getUserProfile>>) => {
      setAccountStatus(profile.approvalStatus);
      setFlags({
        isDriverLicenseApproved: profile.isDriverLicenseApproved ?? false,
        isSrcApproved: profile.isSrcApproved ?? false,
        isPsychotechnicalApproved: profile.isPsychotechnicalApproved ?? false,
      });
      setDocs((prev) => {
        const next = { ...prev };
        for (const card of DOC_CARDS) {
          const approved = profile[card.approvedFlag];
          next[card.key] = {
            ...prev[card.key],
            status: mapApprovalToUi(approved, profile.approvalStatus),
            resultText:
              approved === false && profile.lastValidationMessage
                ? profile.lastValidationMessage
                : prev[card.key].resultText,
          };
        }
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (!user?.userId) {
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    void getUserProfile(user.userId)
      .then((profile) => {
        if (!cancelled) syncFromProfile(profile);
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.userId, syncFromProfile]);

  const accountPill = getApprovalStatusPill(accountStatus);

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
            resultText: ocr.validationMessage ?? 'Belge doğrulamasından geçemedi.',
          },
        }));
        return;
      }

      const upload = await uploadDriverDocument(state.file, card.docType);
      const approval = upload.approvalStatus ?? '';
      const uiStatus = mapApprovalToUi(
        upload.isDocumentValid === true,
        approval || accountStatus
      );

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
            (ocr.fullName ? `Belge işlendi: ${ocr.fullName}` : 'Belge işlendi.'),
        },
      }));

      if (user?.userId) {
        const profile = await getUserProfile(user.userId);
        syncFromProfile(profile);
      }
    } catch (e) {
      setDocs((prev) => ({
        ...prev,
        [card.key]: { ...prev[card.key], loading: false, status: 'Reddedildi' },
      }));
      setError(getApiErrorMessage(e));
    }
  };

  if (profileLoading) {
    return (
      <ScreenContainer>
        <LoadingState message="Belge durumu yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenScroll contentContainerStyle={styles.scroll}>
      <ScreenHeader
        title="Belgeler"
        subtitle={`Ehliyet, SRC ve psikoteknik belgelerinizi yükleyin. ${Platform.OS === 'web' ? 'Dosya seçici' : 'Galeriden seçim veya kamera'} kullanılır.`}
      />

      <Card variant="glass" padding={4}>
        <Text style={styles.accountLabel}>Hesap onay durumu</Text>
        <View style={styles.accountRow}>
          <Text style={styles.accountHint}>Onay durumu</Text>
          <StatusPill label={accountPill.label} tone={accountPill.tone} />
        </View>
      </Card>

      {error ? <AlertBanner message={error} tone="error" /> : null}

      {DOC_CARDS.map((card, index) => {
        const state = docs[card.key];
        const pill = getDocUiStatusPill(state.status);
        const serverApproved = flags[card.approvedFlag];
        const canReupload = state.status === 'Reddedildi' || (!serverApproved && state.status !== 'Onayli');

        return (
          <FadeInView key={card.key} delay={index * 50}>
          <Card variant="default" padding={4} style={styles.docCard}>
            <View style={styles.docHead}>
              <Text style={styles.docTitle}>
                {card.icon} {card.title}
              </Text>
              <StatusPill label={pill.label} tone={pill.tone} />
            </View>

            {canReupload ? (
              <>
                <SecondaryButton title="Dosya Seç" onPress={() => pickFile(card.key)} disabled={state.loading} />
                <Text style={styles.fileLabel}>{state.fileLabel}</Text>
                <PrimaryButton
                  title={state.status === 'Reddedildi' ? 'Yeniden yükle' : 'Belgeyi yükle'}
                  onPress={() => handleAnalyzeAndUpload(card)}
                  loading={state.loading}
                  disabled={!state.file || state.loading}
                />
              </>
            ) : (
              <Text style={styles.approvedHint}>Bu belge onaylı. Güncellemek için destek ile iletişime geçin.</Text>
            )}

            {state.resultText ? <Text style={styles.result}>{state.resultText}</Text> : null}
          </Card>
          </FadeInView>
        );
      })}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: space.md },
  accountLabel: { ...typography.label, marginBottom: space.sm },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  accountHint: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  docCard: { gap: spacing[3] },
  docHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.sm },
  docTitle: { ...typography.bodyMedium, flex: 1 },
  fileLabel: { ...typography.caption, textTransform: 'none', textAlign: 'center' },
  result: { ...typography.caption, textTransform: 'none', lineHeight: 18 },
  approvedHint: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
});

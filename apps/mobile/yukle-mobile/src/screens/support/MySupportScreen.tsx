import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SupportThread } from '../../components/support/SupportThread';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PressableScale } from '../../components/ui/PressableScale';
import { StatusPill } from '../../components/ui/StatusPill';
import { ScreenContainer, ScreenScroll } from '../../constants/layout';
import { getApiErrorMessage } from '../../services/api.client';
import {
  createSupportTicket,
  getMySupportTickets,
  slaRemainingLabel,
  supportStatusLabel,
  supportStatusTone,
  type SupportTicketSummary,
} from '../../services/support.service';
import { palette } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { sizes } from '../../theme/sizes';
import { space, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatDateTR, formatTimeTR } from '../../utils/format';

/**
 * Taleplerim — müşteri & şoför ortak destek ekranı (web MySupport.tsx karşılığı).
 * AI asistan anında yanıtlar; gerektiğinde insan operatöre aktarılır. Mobil
 * master-detail: liste → seçili talep thread'i.
 */
export function MySupportScreen() {
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState('');

  const load = useCallback(
    () =>
      getMySupportTickets()
        .then((data) => setTickets(data))
        .catch((e) => setError(getApiErrorMessage(e))),
    [],
  );

  useEffect(() => {
    void load().finally(() => setLoading(false));
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, [load]);

  const createTicket = async () => {
    const text = draft.trim();
    if (!text || creating) return;
    setCreating(true);
    setError('');
    try {
      const detail = await createSupportTicket(text);
      setDraft('');
      setShowNew(false);
      await load();
      setSelectedId(detail.id);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Talepler yükleniyor…" variant="skeleton" />
      </ScreenContainer>
    );
  }

  // Detay (thread) görünümü — seçili talep tüm ekranı kaplar.
  if (selectedId) {
    return (
      <ScreenContainer style={styles.threadWrap}>
        <SupportThread
          ticketId={selectedId}
          mode="user"
          onUpdated={() => void load()}
          onBack={() => setSelectedId(null)}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenScroll contentContainerStyle={styles.scroll}>
      <ScreenHeader
        title="Taleplerim"
        subtitle="Yapay zeka asistanı anında yanıtlar; gerektiğinde insan operatöre aktarın."
        right={
          <PressableScale style={styles.newBtn} onPress={() => setShowNew((s) => !s)}>
            <Text style={styles.newBtnText}>{showNew ? 'Vazgeç' : '+ Yeni'}</Text>
          </PressableScale>
        }
      />

      {error ? <AlertBanner message={error} tone="error" /> : null}

      {showNew ? (
        <Card variant="elevated" padding={4} style={styles.newCard}>
          <TextInput
            style={styles.newInput}
            placeholder="Sorununuzu veya sorunuzu yazın…"
            placeholderTextColor={palette.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <PressableScale
            style={[styles.askBtn, (creating || !draft.trim()) && styles.askBtnDisabled]}
            onPress={() => void createTicket()}
            disabled={creating || !draft.trim()}
          >
            <Text style={styles.askBtnText}>{creating ? 'Oluşturuluyor…' : 'Asistana Sor'}</Text>
          </PressableScale>
        </Card>
      ) : null}

      {tickets.length === 0 && !showNew ? (
        <EmptyState
          icon="🎧"
          title="Henüz destek talebiniz yok"
          description="Bir sorunuz mu var? Yapay zeka asistanımız anında yardımcı olsun."
          actionLabel="+ Yeni Talep"
          onAction={() => setShowNew(true)}
        />
      ) : (
        tickets.map((t) => (
          <PressableScale key={t.id} onPress={() => setSelectedId(t.id)}>
            <Card variant="elevated" padding={4} style={styles.item}>
              <View style={styles.itemRow}>
                <Text style={styles.itemSubject} numberOfLines={1}>
                  {t.subject}
                </Text>
                <StatusPill label={supportStatusLabel(t.status)} tone={supportStatusTone(t.status)} />
              </View>
              <Text style={styles.itemPreview} numberOfLines={2}>
                {t.lastMessagePreview || '—'}
              </Text>
              <View style={styles.itemMeta}>
                <Text style={[styles.sla, t.isOverdue && styles.slaOverdue]}>
                  {t.isOverdue ? '⚠ ' : ''}
                  {slaRemainingLabel(t.slaDeadline, t.status)}
                </Text>
                <Text style={styles.itemTime}>
                  {formatDateTR(t.lastMessageAt)} {formatTimeTR(t.lastMessageAt)}
                </Text>
              </View>
            </Card>
          </PressableScale>
        ))
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, gap: spacing[3] },
  threadWrap: { padding: space.md },
  newBtn: {
    backgroundColor: palette.brand,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: space.xs,
  },
  newBtnText: { ...typography.bodySmall, fontFamily: typography.bodyMedium.fontFamily, color: palette.onBrand },
  newCard: { gap: spacing[3] },
  newInput: {
    backgroundColor: palette.input,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    color: palette.text,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    ...typography.body,
    minHeight: 72,
    maxHeight: 160,
  },
  askBtn: {
    alignSelf: 'flex-start',
    backgroundColor: palette.brand,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  askBtnDisabled: { opacity: 0.45 },
  askBtnText: { ...typography.bodySmall, fontFamily: typography.bodyMedium.fontFamily, color: palette.onBrand },
  item: { gap: space.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  itemSubject: { ...typography.h3, flexShrink: 1 },
  itemPreview: { ...typography.bodySmall, color: palette.textMuted },
  itemMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  sla: { ...typography.caption, textTransform: 'none', color: palette.textSecondary },
  slaOverdue: { color: palette.error },
  itemTime: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
});

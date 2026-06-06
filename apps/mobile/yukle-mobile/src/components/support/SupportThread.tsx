import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getApiErrorMessage } from '../../services/api.client';
import {
  escalateSupportTicket,
  getSupportTicket,
  postSupportMessage,
  slaRemainingLabel,
  supportStatusLabel,
  supportStatusTone,
  updateSupportStatus,
  type SupportTicketDetail,
} from '../../services/support.service';
import { palette } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { sizes } from '../../theme/sizes';
import { space, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useRoleAccent } from '../../theme/useRoleAccent';
import { formatDateTR, formatTimeTR } from '../../utils/format';
import { AlertBanner } from '../ui/AlertBanner';
import { GhostButton } from '../ui/GhostButton';
import { PressableScale } from '../ui/PressableScale';
import { StatusPill } from '../ui/StatusPill';

/** Web AI accent token (#8B5CF6) — asistan balonu vurgusu. */
const AI_ACCENT = '#8B5CF6';
const POLL_MS = 5000;

type Props = {
  ticketId: string;
  mode: 'user' | 'admin';
  /** Thread her güncellendiğinde (gönderim/poll) tetiklenir — listeleri tazelemek için. */
  onUpdated?: (detail: SupportTicketDetail) => void;
  /** Üstte "← Geri" gösterir (mobil master-detail). */
  onBack?: () => void;
};

/**
 * Destek yazışma thread'i — web SupportThread.tsx karşılığı, RN primitifleriyle.
 * 5sn polling (admin yanıtı / yeni mesaj), composer, operatöre aktar / çözüldü işaretle.
 */
export function SupportThread({ ticketId, mode, onUpdated, onBack }: Props) {
  const accent = useRoleAccent();
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView | null>(null);
  const onUpdatedRef = useRef(onUpdated);
  onUpdatedRef.current = onUpdated;

  const apply = useCallback((d: SupportTicketDetail) => {
    setDetail(d);
    onUpdatedRef.current?.(d);
  }, []);

  // İlk yükleme + 5sn polling.
  useEffect(() => {
    let alive = true;
    setDetail(null);
    setError('');
    void getSupportTicket(ticketId)
      .then((d) => alive && apply(d))
      .catch((e) => alive && setError(getApiErrorMessage(e)));

    const timer = setInterval(() => {
      void getSupportTicket(ticketId)
        .then((d) => alive && apply(d))
        .catch(() => {
          /* sessiz: polling hatası kullanıcıyı rahatsız etmesin */
        });
    }, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [ticketId, apply]);

  const msgCount = detail?.messages.length ?? 0;
  useEffect(() => {
    if (msgCount > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [msgCount]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    try {
      apply(await postSupportMessage(ticketId, text));
      setDraft('');
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const escalate = async () => {
    setSending(true);
    setError('');
    try {
      apply(await escalateSupportTicket(ticketId));
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const resolve = async () => {
    setSending(true);
    setError('');
    try {
      apply(await updateSupportStatus(ticketId, 'Resolved'));
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  if (!detail) {
    return (
      <View style={styles.loading}>
        {onBack ? <GhostButton title="← Geri" onPress={onBack} /> : null}
        <ActivityIndicator color={accent.accent} />
        <Text style={styles.loadingText}>Yükleniyor…</Text>
      </View>
    );
  }

  const isClosed = detail.status === 'Resolved' || detail.status === 'Closed';
  const canEscalate = mode === 'user' && detail.status !== 'Open' && !isClosed;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.head}>
        {onBack ? <GhostButton title="← Geri" onPress={onBack} /> : <View />}
        <View style={styles.headMeta}>
          <StatusPill label={supportStatusLabel(detail.status)} tone={supportStatusTone(detail.status)} />
          <Text style={[styles.sla, detail.isOverdue && styles.slaOverdue]}>
            {detail.isOverdue ? '⚠ ' : ''}
            {slaRemainingLabel(detail.slaDeadline, detail.status)}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.msgs}
        contentContainerStyle={styles.msgsContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
      >
        {detail.messages.map((m) => {
          const mine = m.senderRole === 'User';
          const isAi = m.senderRole === 'AI';
          const isAdmin = m.senderRole === 'Admin';
          return (
            <View key={m.id} style={[styles.row, mine ? styles.rowMine : styles.rowOther]}>
              <View
                style={[
                  styles.bubble,
                  mine ? [styles.bubbleMine, { backgroundColor: accent.accent, borderColor: accent.accent }] : isAi ? styles.bubbleAi : isAdmin ? styles.bubbleAdmin : styles.bubbleOther,
                ]}
              >
                {!mine ? (
                  <Text style={[styles.sender, isAi && styles.senderAi]}>
                    {isAi ? '🤖 ' : isAdmin ? '🎧 ' : ''}
                    {m.senderName}
                  </Text>
                ) : null}
                <Text style={styles.content}>{m.content}</Text>
                <Text style={styles.time}>{formatTimeTR(m.createdAt)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {error ? <AlertBanner message={error} tone="error" /> : null}

      {canEscalate ? (
        <PressableScale style={styles.actionBtn} onPress={() => void escalate()} disabled={sending}>
          <Text style={styles.actionText}>🎧 İnsan operatöre aktar</Text>
        </PressableScale>
      ) : null}

      {detail.status === 'Open' && mode === 'user' ? (
        <Text style={styles.hint}>Talebiniz operatöre iletildi — 24 saat içinde dönüş hedefliyoruz.</Text>
      ) : null}

      {mode === 'admin' && !isClosed ? (
        <PressableScale style={styles.actionBtn} onPress={() => void resolve()} disabled={sending}>
          <Text style={styles.actionText}>✓ Çözüldü olarak işaretle</Text>
        </PressableScale>
      ) : null}

      {!isClosed ? (
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder={mode === 'admin' ? 'Operatör yanıtı yazın…' : 'Mesajınızı yazın…'}
            placeholderTextColor={palette.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <PressableScale
            style={[styles.sendBtn, { backgroundColor: accent.accent }, (sending || !draft.trim()) && styles.sendBtnDisabled]}
            onPress={() => void send()}
            disabled={sending || !draft.trim()}
          >
            <Text style={[styles.sendBtnText, { color: accent.onAccent }]}>{sending ? '…' : 'Gönder'}</Text>
          </PressableScale>
        </View>
      ) : (
        <Text style={styles.hint}>Bu talep kapatıldı. Yeni bir konu için yeni talep oluşturabilirsiniz.</Text>
      )}

      <Text style={styles.metaLine}>
        Oluşturulma: {formatDateTR(detail.createdAt)} {formatTimeTR(detail.createdAt)}
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  loadingText: { ...typography.bodySmall, color: palette.textMuted },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
    gap: space.sm,
  },
  headMeta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  sla: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  slaOverdue: { color: palette.error },
  msgs: { flex: 1 },
  msgsContent: { paddingVertical: space.sm, gap: spacing[2] },
  row: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '86%', borderRadius: radius.md, padding: spacing[3], gap: space.xs, borderWidth: 1 },
  bubbleMine: { backgroundColor: palette.brand, borderColor: palette.brand },
  bubbleOther: { backgroundColor: palette.card, borderColor: palette.borderLight },
  bubbleAi: { backgroundColor: 'rgba(139, 92, 246, 0.12)', borderColor: 'rgba(139, 92, 246, 0.35)' },
  bubbleAdmin: { backgroundColor: palette.infoBg, borderColor: palette.infoBorder },
  sender: { ...typography.caption, fontSize: 12, color: palette.textSecondary, textTransform: 'none' },
  senderAi: { color: AI_ACCENT },
  content: { ...typography.body, color: palette.text },
  time: { ...typography.caption, fontSize: 11, color: palette.textMuted, alignSelf: 'flex-end' },
  actionBtn: {
    alignSelf: 'flex-start',
    paddingVertical: space.xs,
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    marginTop: space.sm,
  },
  actionText: { ...typography.bodySmall, color: palette.textSecondary },
  hint: { ...typography.caption, textTransform: 'none', color: palette.textMuted, marginTop: space.sm },
  composer: { flexDirection: 'row', gap: space.sm, marginTop: spacing[3], alignItems: 'flex-end' },
  input: {
    flex: 1,
    backgroundColor: palette.input,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    color: palette.text,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    ...typography.body,
    minHeight: sizes.input.minHeight - 8,
    maxHeight: 120,
  },
  sendBtn: {
    backgroundColor: palette.brand,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    justifyContent: 'center',
    minHeight: sizes.button.compact,
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnText: { ...typography.bodySmall, fontFamily: typography.bodyMedium.fontFamily, color: palette.onBrand },
  metaLine: { ...typography.caption, textTransform: 'none', color: palette.textMuted, marginTop: space.sm },
});

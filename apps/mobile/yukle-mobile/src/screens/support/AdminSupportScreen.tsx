import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  getAdminSupportTickets,
  slaRemainingLabel,
  supportStatusLabel,
  supportStatusTone,
  type SupportTicketSummary,
} from '../../services/support.service';
import { palette } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { space, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatDateTR, formatTimeTR } from '../../utils/format';

/**
 * Destek Talepleri (admin) — web AdminSupport.tsx karşılığı. Açık (operatör
 * bekleyen) talepler üstte, SLA'ya göre sıralı (backend AdminList sıralar).
 * Mobil master-detail: liste → seçili talep thread'i (mode admin).
 */
export function AdminSupportScreen() {
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    () =>
      getAdminSupportTickets()
        .then((data) => setTickets(data))
        .catch((e) => setError(getApiErrorMessage(e))),
    [],
  );

  useEffect(() => {
    void load().finally(() => setLoading(false));
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, [load]);

  const openCount = tickets.filter((t) => t.status === 'Open').length;

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Talepler yükleniyor…" variant="skeleton" />
      </ScreenContainer>
    );
  }

  if (selectedId) {
    return (
      <ScreenContainer style={styles.threadWrap}>
        <SupportThread
          ticketId={selectedId}
          mode="admin"
          onUpdated={() => void load()}
          onBack={() => setSelectedId(null)}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenScroll contentContainerStyle={styles.scroll}>
      <ScreenHeader
        title="Destek Talepleri"
        subtitle="Operatör bekleyen (açık) talepler üstte, SLA'ya göre sıralı."
        right={
          openCount > 0 ? (
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>{openCount} açık</Text>
            </View>
          ) : undefined
        }
      />

      {error ? <AlertBanner message={error} tone="error" /> : null}

      {tickets.length === 0 ? (
        <EmptyState
          icon="🎧"
          title="Destek talebi yok"
          description="Kullanıcı talepleri burada listelenir."
          actionLabel="Yenile"
          onAction={() => void load()}
        />
      ) : (
        tickets.map((t) => (
          <PressableScale key={t.id} onPress={() => setSelectedId(t.id)}>
            <Card
              variant="glass"
              padding={4}
              style={[styles.item, t.status === 'Open' && t.isOverdue ? styles.itemOverdue : null]}
            >
              <View style={styles.itemRow}>
                <Text style={styles.itemSubject} numberOfLines={1}>
                  {t.subject}
                </Text>
                <StatusPill label={supportStatusLabel(t.status)} tone={supportStatusTone(t.status)} />
              </View>
              <Text style={styles.itemUser}>{t.userName}</Text>
              <Text style={styles.itemPreview} numberOfLines={2}>
                Son: {t.lastMessagePreview || '—'}
              </Text>
              <View style={styles.itemMeta}>
                <Text style={[styles.sla, t.isOverdue && styles.slaOverdue]}>
                  {t.isOverdue ? '⚠ ' : ''}
                  {slaRemainingLabel(t.slaDeadline, t.status)}
                </Text>
                <Text style={styles.itemTime}>
                  {formatDateTR(t.lastMessageAt)} {formatTimeTR(t.lastMessageAt)} · {t.messageCount} mesaj
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
  openBadge: {
    backgroundColor: palette.brand,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: space.xs,
  },
  openBadgeText: { ...typography.caption, fontFamily: typography.bodyMedium.fontFamily, color: palette.onBrand },
  item: { gap: space.sm },
  itemOverdue: { borderColor: palette.errorBorder },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  itemSubject: { ...typography.h3, flexShrink: 1 },
  itemUser: { ...typography.bodySmall, color: palette.textSecondary },
  itemPreview: { ...typography.bodySmall, color: palette.textMuted },
  itemMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  sla: { ...typography.caption, textTransform: 'none', color: palette.textSecondary },
  slaOverdue: { color: palette.error },
  itemTime: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
});

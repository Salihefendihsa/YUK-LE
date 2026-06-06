import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PressableScale } from '../../../src/components/ui/PressableScale';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { ScreenContainer, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getAdminChatMessages, getAdminChats } from '../../../src/services/admin.service';
import type { AdminChatMessageRow, AdminChatSummaryRow } from '../../../src/types/admin';
import { palette } from '../../../src/theme/colors';
import { roleAccents } from '../../../src/theme/roleAccent';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { formatDateTimeTR } from '../../../src/utils/format';

export default function AdminChatsScreen() {
  const { contentInset } = useScreenInsets();
  const [chats, setChats] = useState<AdminChatSummaryRow[]>([]);
  const [messages, setMessages] = useState<AdminChatMessageRow[]>([]);
  const [selected, setSelected] = useState<AdminChatSummaryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchChats = useCallback(async () => {
    try {
      setError('');
      setChats(await getAdminChats());
    } catch (e) {
      setError(getApiErrorMessage(e));
      setChats([]);
    }
  }, []);

  useEffect(() => {
    fetchChats().finally(() => setLoading(false));
  }, [fetchChats]);

  const openChat = async (row: AdminChatSummaryRow) => {
    setSelected(row);
    setMsgLoading(true);
    setMessages([]);
    try {
      setMessages(await getAdminChatMessages(row.loadId));
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setMsgLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Sohbetler yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.loadId}
        contentContainerStyle={[styles.list, contentInset]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchChats();
              setRefreshing(false);
            }}
            tintColor={roleAccents.admin.accent}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader title="Sohbetler" subtitle="Konu özeti ve mesaj geçmişi" />
            {error && !selected ? <AlertBanner message={error} tone="error" /> : null}
          </>
        }
        ListEmptyComponent={
          !error ? <EmptyState icon="💬" title="Sohbet kaydı yok" /> : null
        }
        renderItem={({ item, index }) => (
          <FadeInView delay={Math.min(index * 40, 200)}>
            <PressableScale onPress={() => void openChat(item)}>
              <Card variant="elevated" padding={4} style={styles.chatCard}>
                <Text style={styles.cardTitle}>{item.route || `İlan ${item.loadId.slice(0, 8)}`}</Text>
                <Text style={styles.muted}>
                  Müşteri: {item.customerName} | Şoför: {item.driverName}
                </Text>
                <Text style={styles.muted} numberOfLines={2}>
                  Son: {item.lastMessage}
                </Text>
                <Text style={styles.muted}>
                  {formatDateTimeTR(item.lastMessageAt)} · {item.messageCount} mesaj
                </Text>
              </Card>
            </PressableScale>
          </FadeInView>
        )}
      />

      <Modal visible={selected != null} animationType="slide" onRequestClose={() => setSelected(null)}>
        <ScreenContainer style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mesaj Geçmişi</Text>
            <PressableScale onPress={() => setSelected(null)}>
              <Text style={typography.link}>Kapat</Text>
            </PressableScale>
          </View>
          {selected ? (
            <Text style={styles.muted}>
              {selected.route} — {selected.customerName} / {selected.driverName}
            </Text>
          ) : null}
          {msgLoading ? (
            <ActivityIndicator color={roleAccents.admin.accent} style={{ marginTop: spacing[6] }} />
          ) : (
            <ScrollView contentContainerStyle={[styles.msgScroll, contentInset]}>
              {messages.map((m) => (
                <Card
                  key={m.id}
                  variant="elevated"
                  padding={4}
                  style={m.isBlocked ? styles.blockedMsg : undefined}
                >
                  <View style={styles.msgHead}>
                    <Text style={styles.cardTitle}>
                      {m.senderName} ({m.senderRole})
                    </Text>
                    {m.isBlocked ? <StatusPill label="Engellendi" tone="error" /> : null}
                  </View>
                  <Text style={styles.muted}>{formatDateTimeTR(m.createdAt)}</Text>
                  <Text style={m.isBlocked ? styles.danger : styles.muted}>{m.message}</Text>
                  {m.blockReason ? <Text style={styles.muted}>Sebep: {m.blockReason}</Text> : null}
                </Card>
              ))}
              {messages.length === 0 && !msgLoading ? (
                <EmptyState icon="💬" title="Mesaj yok" />
              ) : null}
            </ScrollView>
          )}
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.md, paddingBottom: spacing[10], gap: space.sm },
  chatCard: { marginBottom: space.sm },
  cardTitle: { ...typography.h3 },
  muted: { ...typography.caption, textTransform: 'none' },
  modal: { padding: space.md, flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  modalTitle: { ...typography.h2 },
  msgScroll: { gap: space.sm, paddingBottom: spacing[8], paddingTop: space.sm },
  msgHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  blockedMsg: { borderColor: palette.errorBorder },
  danger: { ...typography.bodySmall, color: palette.error },
});

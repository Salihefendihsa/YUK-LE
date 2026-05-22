import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { Card } from '../../src/components/ui/Card';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { StatusPill } from '../../src/components/ui/StatusPill';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { getAdminChatMessages, getAdminChats } from '../../src/services/admin.service';
import type { AdminChatMessageRow, AdminChatSummaryRow } from '../../src/types/admin';
import { palette } from '../../src/theme/colors';
import { fontFamily, typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { formatDateTimeTR } from '../../src/utils/format';

export default function AdminChatsScreen() {
  const router = useRouter();
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
      <View style={screenRootStyle}>
        <LoadingState message="Sohbetler yukleniyor..." />
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.loadId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchChats();
              setRefreshing(false);
            }}
            tintColor={palette.brand}
          />
        }
        ListHeaderComponent={
          <>
            <Pressable onPress={() => router.back()} style={styles.back}>
              <Text style={typography.link}>← Geri</Text>
            </Pressable>
            <SectionHeader
              title="Sohbetler"
              subtitle="Ozet: GET /Admin/chats — Mesaj: GET /Admin/chats/loadId"
            />
            {error && !selected ? <AlertBanner message={error} tone="error" /> : null}
          </>
        }
        ListEmptyComponent={
          !error ? <EmptyState icon="💬" title="Sohbet kaydi yok" /> : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => void openChat(item)}>
            <Card variant="elevated" padding={4} style={styles.chatCard}>
              <Text style={styles.cardTitle}>{item.route || `Ilan ${item.loadId.slice(0, 8)}`}</Text>
              <Text style={styles.muted}>
                Musteri: {item.customerName} | Sofor: {item.driverName}
              </Text>
              <Text style={styles.muted} numberOfLines={2}>
                Son: {item.lastMessage}
              </Text>
              <Text style={styles.muted}>
                {formatDateTimeTR(item.lastMessageAt)} · {item.messageCount} mesaj
              </Text>
            </Card>
          </Pressable>
        )}
      />

      <Modal visible={selected != null} animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={[screenRootStyle, styles.modal]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mesaj Gecmisi</Text>
            <Pressable onPress={() => setSelected(null)}>
              <Text style={typography.link}>Kapat</Text>
            </Pressable>
          </View>
          {selected ? (
            <Text style={styles.muted}>
              {selected.route} — {selected.customerName} / {selected.driverName}
            </Text>
          ) : null}
          {msgLoading ? (
            <ActivityIndicator color={palette.brand} style={{ marginTop: spacing[6] }} />
          ) : (
            <ScrollView contentContainerStyle={styles.msgScroll}>
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
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[2] },
  back: { marginBottom: spacing[2] },
  chatCard: { marginBottom: spacing[2] },
  cardTitle: { ...typography.h3 },
  muted: { ...typography.caption, textTransform: 'none' },
  modal: { padding: spacing[4], flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  modalTitle: { ...typography.h2 },
  msgScroll: { gap: spacing[2], paddingBottom: spacing[8], paddingTop: spacing[2] },
  msgHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing[2] },
  blockedMsg: { borderColor: palette.errorBorder },
  danger: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: palette.error,
  },
});

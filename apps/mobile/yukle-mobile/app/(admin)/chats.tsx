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
import { adminScreenStyles as s } from '../../src/constants/adminScreenStyles';
import { Colors } from '../../src/constants/colors';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { getAdminChatMessages, getAdminChats } from '../../src/services/admin.service';
import type { AdminChatMessageRow, AdminChatSummaryRow } from '../../src/types/admin';
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
      <View style={[screenRootStyle, s.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
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
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            <Pressable onPress={() => router.back()}>
              <Text style={s.backLink}>← Geri</Text>
            </Pressable>
            <Text style={s.title}>Sohbetler</Text>
            <Text style={s.sub}>Ozet: GET /Admin/chats — Mesaj: GET /Admin/chats/loadId</Text>
            {error && !selected ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>Sohbet kaydi yok</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={s.card} onPress={() => void openChat(item)}>
            <Text style={s.cardTitle}>{item.route || `Ilan ${item.loadId.slice(0, 8)}`}</Text>
            <Text style={s.muted}>
              Musteri: {item.customerName} | Sofor: {item.driverName}
            </Text>
            <Text style={s.muted} numberOfLines={2}>
              Son: {item.lastMessage}
            </Text>
            <Text style={s.muted}>
              {formatDateTimeTR(item.lastMessageAt)} · {item.messageCount} mesaj
            </Text>
          </Pressable>
        )}
      />

      <Modal visible={selected != null} animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={[screenRootStyle, styles.modal]}>
          <View style={styles.modalHeader}>
            <Text style={s.title}>Mesaj Gecmisi</Text>
            <Pressable onPress={() => setSelected(null)}>
              <Text style={s.backLink}>Kapat</Text>
            </Pressable>
          </View>
          {selected ? (
            <Text style={s.muted}>
              {selected.route} — {selected.customerName} / {selected.driverName}
            </Text>
          ) : null}
          {msgLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
          ) : (
            <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 24 }}>
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[s.card, m.isBlocked && { borderColor: 'rgba(239,68,68,0.5)' }]}
                >
                  <Text style={s.cardTitle}>
                    {m.senderName} ({m.senderRole})
                  </Text>
                  <Text style={s.muted}>{formatDateTimeTR(m.createdAt)}</Text>
                  <Text style={m.isBlocked ? s.danger : s.muted}>{m.message}</Text>
                  {m.blockReason ? <Text style={s.muted}>Sebep: {m.blockReason}</Text> : null}
                </View>
              ))}
              {messages.length === 0 && !msgLoading ? (
                <Text style={s.emptyTitle}>Mesaj yok</Text>
              ) : null}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 10 },
  modal: { padding: 16, flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

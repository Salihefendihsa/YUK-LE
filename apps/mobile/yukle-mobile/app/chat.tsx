import * as signalR from '@microsoft/signalr';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/colors';
import { screenRootStyle } from '../src/constants/layout';
import { getApiErrorMessage } from '../src/services/api.client';
import { getChatMessages } from '../src/services/chat.service';
import { createChatConnection } from '../src/services/chatHub';
import { useAuthStore } from '../src/store/auth.store';
import type { ChatConnectionState, ChatMessage } from '../src/types/chat';
import { formatTimeTR } from '../src/utils/format';

function normalizeHubMessage(raw: unknown): ChatMessage {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? `${Date.now()}-${Math.random()}`),
    loadId: '',
    senderId: Number(r.senderId ?? 0),
    senderName: String(r.senderName ?? ''),
    senderRole: String(r.senderRole ?? ''),
    message: String(r.message ?? ''),
    sentAt: String(r.timestampUtc ?? r.timestamp ?? new Date().toISOString()),
  };
}

const STATUS_LABEL: Record<ChatConnectionState, string> = {
  connecting: 'Bağlanıyor...',
  connected: 'Canli',
  reconnecting: 'Yeniden bağlanıyor...',
  disconnected: 'Baglanti koptu',
};

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loadId: loadIdParam } = useLocalSearchParams<{ loadId?: string }>();
  const loadId = typeof loadIdParam === 'string' ? loadIdParam : Array.isArray(loadIdParam) ? loadIdParam[0] : '';

  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.userId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [connState, setConnState] = useState<ChatConnectionState>('connecting');
  const [historyError, setHistoryError] = useState('');
  const [sendError, setSendError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);

  const connRef = useRef<signalR.HubConnection | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  useEffect(() => {
    if (!loadId || !token) return;

    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError('');
    void getChatMessages(loadId)
      .then((rows) => {
        if (!cancelled) setMessages(rows);
      })
      .catch((e) => {
        if (!cancelled) setHistoryError(getApiErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });

    const connection = createChatConnection(token);
    connRef.current = connection;

    connection.on('ReceiveMessage', (payload: unknown) => {
      const msg = normalizeHubMessage(payload);
      appendMessage(msg);
    });

    connection.onreconnecting(() => setConnState('reconnecting'));
    connection.onreconnected(async () => {
      setConnState('connected');
      try {
        await connection.invoke('JoinChatGroup', loadId);
      } catch {
        /* ignore */
      }
    });
    connection.onclose(() => setConnState('disconnected'));

    void (async () => {
      try {
        setConnState('connecting');
        await connection.start();
        if (cancelled) return;
        setConnState('connected');
        await connection.invoke('JoinChatGroup', loadId);
      } catch {
        if (!cancelled) setConnState('disconnected');
      }
    })();

    return () => {
      cancelled = true;
      void connection.stop();
      connRef.current = null;
    };
  }, [loadId, token, appendMessage]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    const conn = connRef.current;
    if (!conn || connState !== 'connected' || !trimmed) return;
    setSendError('');
    try {
      await conn.invoke('SendMessage', loadId, trimmed);
      setText('');
    } catch (e) {
      const msg = getApiErrorMessage(e);
      setSendError(msg.includes('Uygunsuz') ? msg : msg || 'Mesaj gonderilemedi.');
    }
  };

  if (!isAuthenticated || !token) {
    return <Redirect href="/" />;
  }

  if (!loadId) {
    return (
      <View style={[screenRootStyle, styles.centered]}>
        <Text style={styles.errorText}>Geçersiz ilan ID</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Geri</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[screenRootStyle, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>← Geri</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Sohbet</Text>
          <Text style={[styles.status, connState === 'connected' && styles.statusOk]}>
            {STATUS_LABEL[connState]}
          </Text>
        </View>
      </View>

      {historyError ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{historyError}</Text>
        </View>
      ) : null}

      {historyLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item, i) => item.id || `m-${i}`}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={styles.empty}>Henüz mesaj yok.</Text>}
          renderItem={({ item }) => {
            const mine = item.senderId === userId;
            return (
              <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowOther]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={styles.bubbleName}>{mine ? 'Siz' : item.senderName || 'Karsi taraf'}</Text>
                  <Text style={styles.bubbleText}>{item.message}</Text>
                  <Text style={styles.bubbleTime}>{formatTimeTR(item.sentAt)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {sendError ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{sendError}</Text>
        </View>
      ) : null}

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          placeholder="Mesajınızı yazın..."
          placeholderTextColor={Colors.textMuted}
          value={text}
          onChangeText={setText}
          editable={connState === 'connected'}
        />
        <Pressable
          style={[styles.sendBtn, (connState !== 'connected' || !text.trim()) && styles.sendBtnDisabled]}
          onPress={() => void sendMessage()}
          disabled={connState !== 'connected' || !text.trim()}
        >
          <Text style={styles.sendBtnText}>Gönder</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  headerCenter: { flex: 1 },
  backLink: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  title: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  status: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  statusOk: { color: '#4ade80' },
  list: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 40 },
  bubbleRow: { marginBottom: 10, flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: 12, padding: 10, gap: 4 },
  bubbleMine: { backgroundColor: Colors.primary },
  bubbleOther: { backgroundColor: '#374151' },
  bubbleName: { color: '#f3f4f6', fontSize: 12, fontWeight: '700' },
  bubbleText: { color: '#fff', fontSize: 15 },
  bubbleTime: { color: 'rgba(255,255,255,0.75)', fontSize: 11, alignSelf: 'flex-end' },
  composer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgDark,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnText: { color: '#050608', fontWeight: '700' },
  banner: {
    marginHorizontal: 12,
    marginTop: 6,
    padding: 10,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 8,
  },
  bannerText: { color: '#fca5a5', fontSize: 12 },
  errorText: { color: Colors.error },
});

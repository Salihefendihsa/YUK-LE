import * as signalR from '@microsoft/signalr';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertBanner } from '../src/components/ui/AlertBanner';
import { FadeInView } from '../src/components/ui/FadeInView';
import { GhostButton } from '../src/components/ui/GhostButton';
import { LoadingState } from '../src/components/ui/LoadingState';
import { PressableScale } from '../src/components/ui/PressableScale';
import { screenRootStyle } from '../src/constants/layout';
import { getApiErrorMessage } from '../src/services/api.client';
import { getChatMessages } from '../src/services/chat.service';
import { createChatConnection } from '../src/services/chatHub';
import { useAuthStore } from '../src/store/auth.store';
import type { ChatConnectionState, ChatMessage } from '../src/types/chat';
import { palette } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { space, spacing } from '../src/theme/spacing';
import { radius } from '../src/theme/radius';
import { sizes } from '../src/theme/sizes';
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
  connected: 'Canlı',
  reconnecting: 'Yeniden bağlanıyor...',
  disconnected: 'Bağlantı koptu',
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
      appendMessage(normalizeHubMessage(payload));
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
      setSendError(msg.includes('Uygunsuz') ? msg : msg || 'Mesaj gönderilemedi.');
    }
  };

  if (!isAuthenticated || !token) {
    return <Redirect href="/" />;
  }

  if (!loadId) {
    return (
      <View style={[screenRootStyle, styles.centered]}>
        <Text style={styles.errorText}>Geçersiz ilan ID</Text>
        <GhostButton title="Geri" onPress={() => router.back()} />
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
        <GhostButton title="← Geri" onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Sohbet</Text>
          <Text style={[styles.status, connState === 'connected' && styles.statusOk]}>
            {STATUS_LABEL[connState]}
          </Text>
        </View>
      </View>

      {historyError ? <AlertBanner message={historyError} tone="error" /> : null}

      {historyLoading ? (
        <LoadingState message="Mesajlar yükleniyor..." variant="skeleton" />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item, i) => item.id || `m-${i}`}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <FadeInView>
              <Text style={styles.empty}>Henüz mesaj yok.</Text>
            </FadeInView>
          }
          renderItem={({ item, index }) => {
            const mine = item.senderId === userId;
            return (
              <FadeInView delay={Math.min(index * 30, 150)}>
                <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowOther]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                    <Text style={styles.bubbleName}>{mine ? 'Siz' : item.senderName || 'Karşı taraf'}</Text>
                    <Text style={styles.bubbleText}>{item.message}</Text>
                    <Text style={styles.bubbleTime}>{formatTimeTR(item.sentAt)}</Text>
                  </View>
                </View>
              </FadeInView>
            );
          }}
        />
      )}

      {sendError ? <AlertBanner message={sendError} tone="error" /> : null}

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}>
        <TextInput
          style={styles.input}
          placeholder="Mesajınızı yazın..."
          placeholderTextColor={palette.textMuted}
          value={text}
          onChangeText={setText}
          editable={connState === 'connected'}
        />
        <PressableScale
          style={[styles.sendBtn, (connState !== 'connected' || !text.trim()) && styles.sendBtnDisabled]}
          onPress={() => void sendMessage()}
          disabled={connState !== 'connected' || !text.trim()}
        >
          <Text style={styles.sendBtnText}>Gönder</Text>
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSubtle,
    gap: spacing[3],
  },
  headerCenter: { flex: 1 },
  title: { ...typography.h2, fontSize: 18 },
  status: { ...typography.caption, textTransform: 'none', color: palette.textMuted, marginTop: space.xs },
  statusOk: { color: palette.success },
  list: { padding: space.md, paddingBottom: space.sm, flexGrow: 1 },
  empty: { ...typography.bodySmall, color: palette.textMuted, textAlign: 'center', marginTop: space.xl },
  bubbleRow: { marginBottom: spacing[3], flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: radius.md, padding: spacing[3], gap: space.xs },
  bubbleMine: { backgroundColor: palette.brand },
  bubbleOther: { backgroundColor: palette.gray700 },
  bubbleName: { ...typography.caption, fontSize: 12, color: palette.gray100 },
  bubbleText: { ...typography.body, color: palette.text },
  bubbleTime: { ...typography.caption, fontSize: 11, color: 'rgba(255,255,255,0.75)', alignSelf: 'flex-end' },
  composer: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
    backgroundColor: palette.bg,
  },
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
  errorText: { ...typography.body, color: palette.error },
});

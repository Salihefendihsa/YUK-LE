export interface ChatMessage {
  id: string;
  loadId: string;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  sentAt: string;
  isBlocked?: boolean;
}

export type ChatConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

/** Mesajlar merkezi — yüke bağlı sohbet özeti */
export interface ChatThreadSummary {
  loadId: string;
  route: string;
  counterpartName: string;
  lastMessage: string;
  lastMessageAt: string | null;
  hasMessages: boolean;
}

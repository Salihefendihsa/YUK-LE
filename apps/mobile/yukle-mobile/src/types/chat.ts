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

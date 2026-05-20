import type { ChatMessage } from '../types/chat';
import { apiClient } from './api.client';

function normalizeMessage(raw: unknown): ChatMessage {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    loadId: String(r.loadId ?? ''),
    senderId: Number(r.senderId ?? 0),
    senderName: String(r.senderName ?? ''),
    senderRole: String(r.senderRole ?? ''),
    message: String(r.message ?? ''),
    sentAt: String(r.sentAt ?? r.timestampUtc ?? r.timestamp ?? ''),
    isBlocked: Boolean(r.isBlocked ?? false),
  };
}

/** GET /Chat/{loadId}/messages */
export async function getChatMessages(loadId: string): Promise<ChatMessage[]> {
  const res = await apiClient.get(`/Chat/${loadId}/messages`);
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeMessage);
}

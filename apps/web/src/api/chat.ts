import { apiClient } from './client'

export type ChatMessageDto = {
  id: string
  loadId: string
  senderId: number
  senderName: string
  senderRole: string
  message: string
  sentAt: string
  isBlocked: boolean
}

export async function getChatMessages(loadId: string): Promise<ChatMessageDto[]> {
  const res = await apiClient.get<ChatMessageDto[]>(`/Chat/${loadId}/messages`)
  return Array.isArray(res.data) ? res.data : []
}

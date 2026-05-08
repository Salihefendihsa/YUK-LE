import { apiClient } from './client'

export async function getNotifications(page = 1, pageSize = 20, isRead?: boolean) {
  const res = await apiClient.get('/Notifications', { params: { page, pageSize, isRead } })
  return res.data
}

export async function getUnreadCount() {
  const res = await apiClient.get('/Notifications/unread-count')
  return res.data as { count: number }
}

export async function markNotificationRead(id: number) {
  await apiClient.put(`/Notifications/${id}/read`)
}

export async function readAllNotifications() {
  await apiClient.put('/Notifications/read-all')
}

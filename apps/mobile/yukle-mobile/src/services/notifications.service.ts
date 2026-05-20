import type { NotificationRow, NotificationsListResult } from '../types/notification';
import { apiClient } from './api.client';

function normalizeRow(raw: unknown): NotificationRow {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id ?? 0),
    title: String(r.title ?? ''),
    message: String(r.message ?? ''),
    isRead: Boolean(r.isRead ?? r.IsRead),
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
    type: r.type != null ? String(r.type) : undefined,
  };
}

/** GET /Notifications */
export async function getNotifications(params?: {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
}): Promise<NotificationsListResult> {
  const res = await apiClient.get('/Notifications', { params });
  const d = res.data as Record<string, unknown>;
  const itemsRaw = d.items ?? d.Items;
  const items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizeRow) : [];
  return {
    total: Number(d.total ?? d.Total ?? items.length),
    items,
  };
}

/** GET /Notifications/unread-count */
export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get('/Notifications/unread-count');
  const d = res.data as Record<string, unknown>;
  return Number(d.count ?? d.Count ?? 0);
}

/** PUT /Notifications/{id}/read */
export async function markNotificationRead(id: number): Promise<void> {
  await apiClient.put(`/Notifications/${id}/read`);
}

/** PUT /Notifications/read-all */
export async function readAllNotifications(): Promise<void> {
  await apiClient.put('/Notifications/read-all');
}

export function normalizeHubNotification(raw: unknown): NotificationRow {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id ?? 0),
    title: String(r.title ?? 'Bildirim'),
    message: String(r.message ?? ''),
    isRead: false,
    createdAt: String(r.createdAt ?? new Date().toISOString()),
    type: r.type != null ? String(r.type) : undefined,
  };
}

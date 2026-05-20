export interface NotificationRow {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
}

export interface NotificationsListResult {
  total: number;
  items: NotificationRow[];
}

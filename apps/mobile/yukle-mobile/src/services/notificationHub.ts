import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '../constants/api';

export function buildNotificationHubUrl(accessToken: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}/hubs/notifications?access_token=${encodeURIComponent(accessToken)}`;
}

export function createNotificationConnection(accessToken: string): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(buildNotificationHubUrl(accessToken), {
      accessTokenFactory: () => accessToken,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

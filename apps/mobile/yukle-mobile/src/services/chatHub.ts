import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '../constants/api';

/** Hub URL with JWT in query string (backend OnMessageReceived). */
export function buildChatHubUrl(accessToken: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}/hubs/chat?access_token=${encodeURIComponent(accessToken)}`;
}

export function createChatConnection(accessToken: string): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(buildChatHubUrl(accessToken), {
      accessTokenFactory: () => accessToken,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

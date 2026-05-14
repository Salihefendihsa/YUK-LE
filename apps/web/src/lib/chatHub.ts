import * as signalR from '@microsoft/signalr'
import { apiClient } from '../api/client'

function hubUrlFromApiBase(): string {
  const base = apiClient.defaults.baseURL ?? 'http://localhost:5151/api'
  const u = new URL(base)
  return `${u.origin}/hubs/chat`
}

export function createChatConnection(accessToken: string) {
  return new signalR.HubConnectionBuilder()
    .withUrl(hubUrlFromApiBase(), {
      accessTokenFactory: () => accessToken,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build()
}

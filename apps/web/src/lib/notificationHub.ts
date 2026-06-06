import type { AccessTokenFactory } from '@navlonix/shared'
import * as signalR from '@microsoft/signalr'
import { apiClient } from '../api/client'

function hubUrlFromApiBase(): string {
  const base = apiClient.defaults.baseURL ?? 'http://localhost:5151/api'
  const u = new URL(base)
  return `${u.origin}/hubs/notifications`
}

export function createNotificationConnection(accessToken: string) {
  const hubUrl = `${hubUrlFromApiBase()}?access_token=${encodeURIComponent(accessToken)}`
  // Ortak sözleşme: @navlonix/shared AccessTokenFactory (burada yakalanmış token — legacy desen, davranış korunur).
  const accessTokenFactory: AccessTokenFactory = () => accessToken
  return new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build()
}

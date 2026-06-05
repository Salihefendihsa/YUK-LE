import * as signalR from '@microsoft/signalr'
import { apiClient } from '../api/client'
import { getAccessTokenForHub } from '../utils/signalrToken'

function hubUrlFromApiBase(): string {
  const base = apiClient.defaults.baseURL ?? 'http://localhost:5151/api'
  const u = new URL(base)
  return `${u.origin}/hubs/chat`
}

export function createChatConnection() {
  // accessTokenFactory her (yeniden) bağlanışta çağrılır → token'ı depodan TAZE okur.
  // Eskiden token mount anında bir kez yakalanıyordu; REST 401'de token yenilenince
  // hub bayat token'la kalıp negotiate 401 alıyor ve kalıcı "Bağlantı kuruluyor"da takılıyordu.
  return new signalR.HubConnectionBuilder()
    .withUrl(hubUrlFromApiBase(), {
      accessTokenFactory: () => getAccessTokenForHub(),
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build()
}

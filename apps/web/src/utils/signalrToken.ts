/** JWT for SignalR (Authorization header is not used by browser WebSocket). */
export function getAccessTokenForHub(): string {
  const direct = localStorage.getItem('token')
  if (direct) return direct
  try {
    const raw = localStorage.getItem('yükle-auth')
    if (!raw) return ''
    const store = JSON.parse(raw) as { state?: { token?: string } }
    return store?.state?.token ?? ''
  } catch {
    return ''
  }
}

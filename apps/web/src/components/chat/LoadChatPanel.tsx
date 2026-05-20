import { useEffect, useMemo, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import { getChatMessages } from '../../api/chat'
import { createChatConnection } from '../../lib/chatHub'
import { useAuthStore } from '../../store/auth.store'
import { formatTimeTR } from '../../utils/format'
import { getAccessTokenForHub } from '../../utils/signalrToken'

type ChatMessage = {
  id?: string
  senderId?: number
  senderName?: string
  senderRole?: string
  message: string
  timestampUtc?: string
  timestamp?: string
}

type Props = {
  loadId: string
}

export default function LoadChatPanel({ loadId }: Props) {
  const user = useAuthStore((s) => s.user)
  const [conn, setConn] = useState<signalR.HubConnection | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const token = getAccessTokenForHub()
    const connection = createChatConnection(token)

    connection.on('ReceiveMessage', (payload: ChatMessage) => {
      setMessages((prev) => {
        if (payload.id && prev.some((m) => m.id === payload.id)) return prev
        return [...prev, payload]
      })
    })

    let cancelled = false
    void (async () => {
      try {
        const data = await getChatMessages(loadId)
        if (!cancelled) {
          setMessages(
            data.map((r) => ({
              id: r.id,
              senderId: r.senderId,
              senderName: r.senderName,
              senderRole: r.senderRole,
              message: r.message,
              timestampUtc: r.sentAt,
            })),
          )
        }
      } catch {
        /* geçmiş mesajlar yoksa sessiz */
      }
    })()

    connection
      .start()
      .then(async () => {
        if (cancelled) return
        setConnected(true)
        await connection.invoke('JoinChatGroup', loadId)
      })
      .catch(() => {
        if (!cancelled) setConnected(false)
      })

    setConn(connection)
    return () => {
      cancelled = true
      void connection.stop()
    }
  }, [loadId])

  const canSend = useMemo(() => connected && text.trim().length > 0, [connected, text])

  const send = async () => {
    if (!conn || !canSend) return
    await conn.invoke('SendMessage', loadId, text.trim())
    setText('')
  }

  return (
    <div className="card">
      <h3>Sohbet</h3>
      <p className="muted">{connected ? 'Bağlı' : 'Bağlantı kuruluyor...'}</p>
      <div style={{ maxHeight: 260, overflow: 'auto', display: 'grid', gap: 8, marginTop: 10 }}>
        {messages.map((m, idx) => {
          const mine = Number(m.senderId ?? -1) === Number(user?.userId ?? -2)
          return (
            <div key={idx} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '80%', background: mine ? '#f97316' : '#374151', color: '#fff', borderRadius: 12, padding: '8px 10px' }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{m.senderName ?? (mine ? 'Sen' : 'Karşı taraf')}</p>
                <p>{m.message}</p>
                <span style={{ fontSize: 11, opacity: 0.8 }}>{formatTimeTR(m.timestampUtc ?? m.timestamp ?? new Date().toISOString())}</span>
              </div>
            </div>
          )
        })}
        {messages.length === 0 ? <p className="muted">Henüz mesaj yok.</p> : null}
      </div>
      <div className="item-row" style={{ marginTop: 10 }}>
        <input className="form-input" placeholder="Mesajınızı yazın..." value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary btn-sm" disabled={!canSend} onClick={() => void send()}>Gönder</button>
      </div>
    </div>
  )
}

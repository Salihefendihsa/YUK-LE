import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { HubConnection } from '@microsoft/signalr'
import { getChatMessages, type ChatMessageDto } from '../../api/chat'
import { getLoads, getCustomerLoadHistory, getDriverLoadHistory, type HistoryRow } from '../../api/loads'
import type { Load } from '../../api/types'
import { createChatConnection } from '../../lib/chatHub'
import { useAuthStore } from '../../store/auth.store'
import '../shared/Page.css'
import './ChatsPage.css'

export type ChatsMode = 'customer' | 'driver'

type UiMsg = {
  id: string
  senderId: number
  senderName: string
  senderRole: string
  message: string
  sentAt: string
}

type Thread = {
  loadId: string
  route: string
  peerName: string
  plateHint: string
  updatedAt: string
}

function readToken(): string | null {
  try {
    const raw = localStorage.getItem('yükle-auth')
    if (!raw) return null
    return JSON.parse(raw)?.state?.token ?? null
  } catch {
    return null
  }
}

function timeAgo(iso: string) {
  const t = new Date(iso).getTime()
  const d = Math.max(0, Date.now() - t)
  const m = Math.floor(d / 60000)
  if (m < 1) return 'Az önce'
  if (m < 60) return `${m} dk önce`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h} sa önce`
  return new Date(iso).toLocaleDateString('tr-TR')
}

export default function ChatsPage({ mode }: { mode: ChatsMode }) {
  const user = useAuthStore((s) => s.user)
  const [threads, setThreads] = useState<Thread[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'unread'>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMsg[]>([])
  const [draft, setDraft] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [err, setErr] = useState('')
  const [conn, setConn] = useState<HubConnection | null>(null)

  const base = mode === 'customer' ? '/customer' : '/driver'

  const loadThreads = useCallback(async () => {
    if (!user) return
    setLoadingList(true)
    setErr('')
    try {
      const map = new Map<string, Thread>()
      if (mode === 'customer') {
        const [hist, loads] = await Promise.all([
          getCustomerLoadHistory(1, 80),
          getLoads({ page: 1, pageSize: 80 }),
        ])
        const rows = hist.items ?? []
        rows.forEach((r: HistoryRow) => {
          map.set(r.id, {
            loadId: r.id,
            route: `${r.fromCity} → ${r.toCity}`,
            peerName: r.driverName ?? 'Şoför',
            plateHint: '',
            updatedAt: r.deliveryDate ?? new Date().toISOString(),
          })
        })
        const arr = Array.isArray(loads) ? loads : []
        arr
          .filter((l: Load) => l.ownerId === user.userId)
          .forEach((l: Load) => {
            const prev = map.get(l.id)
            const peer = l.driverId ? 'Şoför' : 'Atama bekleniyor'
            map.set(l.id, {
              loadId: l.id,
              route: `${l.fromCity} → ${l.toCity}`,
              peerName: peer,
              plateHint: (l.requiredVehicleType as string) ?? '',
              updatedAt: prev?.updatedAt ?? l.createdAt,
            })
          })
      } else {
        const hist = await getDriverLoadHistory(1, 80)
        const rows = hist.items ?? []
        rows.forEach((r: HistoryRow) => {
          map.set(r.id, {
            loadId: r.id,
            route: `${r.fromCity} → ${r.toCity}`,
            peerName: r.customerName ?? 'Müşteri',
            plateHint: '',
            updatedAt: r.deliveryDate ?? new Date().toISOString(),
          })
        })
        const loads = await getLoads({ page: 1, pageSize: 80 })
        const arr = Array.isArray(loads) ? loads : []
        arr
          .filter((l: Load) => l.driverId === user.userId)
          .forEach((l: Load) => {
            map.set(l.id, {
              loadId: l.id,
              route: `${l.fromCity} → ${l.toCity}`,
              peerName: l.ownerFullName ?? 'Müşteri',
              plateHint: (l.requiredVehicleType as string) ?? '',
              updatedAt: l.createdAt,
            })
          })
      }
      const list = [...map.values()].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      setThreads(list)
      setSelectedId((cur) => {
        if (cur && list.some((t) => t.loadId === cur)) return cur
        return list[0]?.loadId ?? null
      })
    } catch (e: unknown) {
      setErr((e as { uiMessage?: string })?.uiMessage ?? 'Sohbet listesi yüklenemedi.')
    } finally {
      setLoadingList(false)
    }
  }, [mode, user])

  useEffect(() => {
    void loadThreads()
  }, [loadThreads])

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    setLoadingMsg(true)
    getChatMessages(selectedId)
      .then((rows) => {
        if (cancelled) return
        setMessages(
          rows.map((m: ChatMessageDto) => ({
            id: m.id,
            senderId: m.senderId,
            senderName: m.senderName,
            senderRole: m.senderRole,
            message: m.message,
            sentAt: m.sentAt,
          }))
        )
      })
      .catch(() => {
        if (!cancelled) setMessages([])
      })
      .finally(() => {
        if (!cancelled) setLoadingMsg(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) return
    const token = readToken()
    if (!token) return

    const connection = createChatConnection()
    setConn(connection)

    connection.on('ReceiveMessage', (payload: Record<string, unknown>) => {
      const id = String(payload.id ?? crypto.randomUUID())
      const senderId = Number(payload.senderId ?? 0)
      const senderName = String(payload.senderName ?? '')
      const senderRole = String(payload.senderRole ?? '')
      const message = String(payload.message ?? '')
      const ts = (payload.timestampUtc ?? payload.timestamp) as string
      setMessages((prev) => {
        if (prev.some((p) => p.id === id)) return prev
        return [
          ...prev,
          {
            id,
            senderId,
            senderName,
            senderRole,
            message,
            sentAt: ts,
          },
        ]
      })
    })

    void (async () => {
      try {
        await connection.start()
        await connection.invoke('JoinChatGroup', selectedId)
      } catch {
        /* hub errors surfaced on send */
      }
    })()

    return () => {
      void connection.stop()
      setConn(null)
    }
  }, [selectedId])

  const activeThread = useMemo(() => threads.find((t) => t.loadId === selectedId), [threads, selectedId])

  const filteredThreads = useMemo(() => {
    const s = search.trim().toLowerCase()
    return threads.filter((t) => {
      if (filter === 'active' && t.peerName.includes('beklen')) return false
      if (filter === 'unread') return false
      if (!s) return true
      return t.route.toLowerCase().includes(s) || t.peerName.toLowerCase().includes(s)
    })
  }, [threads, search, filter])

  async function send() {
    const text = draft.trim()
    if (!text || !conn || !selectedId) return
    setDraft('')
    try {
      await conn.invoke('SendMessage', selectedId, text)
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? 'Mesaj gönderilemedi.'
      setErr(msg)
    }
  }

  return (
    <div className="page-wrap chats-page">
      <div className="chats-layout card">
        <aside className="chats-sidebar">
          <div className="chats-sidebar-head">
            <h1 className="page-title" style={{ fontSize: '1.25rem' }}>
              Sohbetlerim
            </h1>
            <input
              type="search"
              className="chats-search"
              placeholder="Ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="chats-filters">
              <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
                Tümü
              </button>
              <button type="button" className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>
                Aktif
              </button>
              <button type="button" className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>
                Okunmamış
              </button>
            </div>
          </div>
          <div className="chats-thread-list">
            {loadingList ? (
              <p className="muted" style={{ padding: 16 }}>
                Yükleniyor…
              </p>
            ) : filteredThreads.length === 0 ? (
              <p className="muted" style={{ padding: 16 }}>
                Henüz sohbet yok.
              </p>
            ) : (
              filteredThreads.map((t) => (
                <button
                  key={t.loadId}
                  type="button"
                  className={`chats-thread ${t.loadId === selectedId ? 'active' : ''}`}
                  onClick={() => setSelectedId(t.loadId)}
                >
                  <div className="chats-thread-avatar">{t.peerName[0]?.toUpperCase() ?? '?'}</div>
                  <div className="chats-thread-body">
                    <div className="chats-thread-top">
                      <strong>{t.peerName}</strong>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {timeAgo(t.updatedAt)}
                      </span>
                    </div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {t.route}
                    </div>
                    {t.plateHint ? (
                      <div className="muted" style={{ fontSize: 11 }}>
                        Araç: {t.plateHint}
                      </div>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="chats-main">
          {!activeThread ? (
            <div className="chats-empty muted">Bir konuşma seçin</div>
          ) : (
            <>
              <header className="chats-main-head">
                <div className="chats-peer">
                  <div className="chats-thread-avatar chats-thread-avatar--lg">{activeThread.peerName[0]?.toUpperCase() ?? '?'}</div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{activeThread.peerName}</h2>
                    <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                      {activeThread.route}
                    </p>
                  </div>
                </div>
                <Link to={`${base}/loads/${activeThread.loadId}`} className="btn btn-ghost btn-sm">
                  Yük detayı
                </Link>
              </header>
              {err ? (
                <p className="error-banner" style={{ margin: 8 }}>
                  {err}
                </p>
              ) : null}
              <div className="chats-scroll">
                {loadingMsg ? (
                  <p className="muted">Mesajlar yükleniyor…</p>
                ) : (
                  messages.map((m) => {
                    const mine = m.senderId === user?.userId
                    return (
                      <div key={m.id} className={`chat-bubble-row ${mine ? 'mine' : 'theirs'}`}>
                        <div className={`chat-bubble ${mine ? 'chat-bubble--mine' : 'chat-bubble--glass'}`}>
                          <p style={{ margin: 0 }}>{m.message}</p>
                          <div className="chat-meta muted">
                            <span>{new Date(m.sentAt).toLocaleString('tr-TR')}</span>
                            {mine ? <span> ✓✓</span> : null}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              <footer className="chats-compose">
                <textarea
                  className="chats-ta"
                  rows={2}
                  placeholder="Mesaj yazın…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void send()
                    }
                  }}
                />
                <div className="chats-compose-actions">
                  <button type="button" className="btn btn-ghost btn-sm" title="Emoji">
                    🙂
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" title="Dosya (yakında)">
                    📎
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => void send()}>
                    Gönder
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

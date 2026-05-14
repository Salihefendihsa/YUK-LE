import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import './CommandPalette.css'

type Action = { id: string; label: string; hint?: string; path: string }

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.user?.role)

  const actions = useMemo<Action[]>(() => {
    if (role === 'Customer') {
      return [
        { id: 'c1', label: 'Yeni İlan Oluştur', path: '/customer/loads/create' },
        { id: 'c2', label: 'İlanlarımı Gör', path: '/customer/loads' },
        { id: 'c3', label: 'Şoför Ara (Teklifler)', path: '/customer/bids' },
        { id: 'c4', label: 'Hesabım / Cüzdan', path: '/customer/profile' },
        { id: 'c5', label: 'Sohbetlerim', path: '/customer/chats' },
        { id: 'c6', label: 'Analitik', path: '/customer/analytics' },
        { id: 'c7', label: 'Ayarlar', path: '/customer/settings' },
      ]
    }
    if (role === 'Driver') {
      return [
        { id: 'd1', label: 'Yük Panosu', path: '/driver/loads' },
        { id: 'd2', label: 'Aktif Seferim', path: '/driver/active-load' },
        { id: 'd3', label: 'Cüzdanım', path: '/driver/wallet' },
        { id: 'd4', label: 'Sohbetlerim', path: '/driver/chats' },
        { id: 'd5', label: 'Ayarlar', path: '/driver/settings' },
      ]
    }
    return [
      { id: 'a1', label: 'Genel Bakış', path: '/admin/dashboard' },
      { id: 'a2', label: 'Tüm Sohbetler', path: '/admin/chats' },
      { id: 'a3', label: 'İlanlar', path: '/admin/loads' },
      { id: 'a4', label: 'Ayarlar', path: '/admin/settings' },
    ]
  }, [role])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return actions
    return actions.filter((a) => a.label.toLowerCase().includes(s) || (a.hint ?? '').toLowerCase().includes(s))
  }, [actions, q])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
        setQ('')
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null

  return (
    <div className="cmdp-root" role="dialog" aria-modal="true" aria-label="Hızlı eylemler">
      <button type="button" className="cmdp-backdrop" onClick={() => setOpen(false)} aria-label="Kapat" />
      <div className="cmdp-panel card">
        <div className="cmdp-head">
          <span className="cmdp-kbd">Ctrl K</span>
          <input
            className="cmdp-input"
            autoFocus
            placeholder="Sayfa veya eylem ara…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <ul className="cmdp-list">
          {filtered.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="cmdp-item"
                onClick={() => {
                  navigate(a.path)
                  setOpen(false)
                  setQ('')
                }}
              >
                <span>{a.label}</span>
                <span className="cmdp-arrow">↵</span>
              </button>
            </li>
          ))}
        </ul>
        {filtered.length === 0 ? <p className="cmdp-empty muted">Sonuç yok</p> : null}
      </div>
    </div>
  )
}

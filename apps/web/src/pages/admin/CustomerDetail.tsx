import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  addUserNote,
  getAdminLoads,
  getAdminPayments,
  getAdminCustomers,
  getCustomerStats,
  toggleUserActive,
  warnUser,
  type AdminCustomerRow,
  type AdminLoadRow,
  type AdminPaymentRow,
  type CustomerStats,
} from '../../api/admin'
import { getUserProfile, type UserProfile } from '../../api/users'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { openConfirm } from '@/components/common/ConfirmModal'
import { toast } from '@/components/common/Toast'
import { formatPaymentStatusLabel, formatLoadStatusLabel } from '../../utils/displayLabels'
import { formatCurrencyTRY, formatDateTR } from '../../utils/format'
import { formatDateTime } from '../../utils/formatters'
import { maskEmail, maskPhone, maskTax, safeInitial } from '../../utils/pii'
import './AdminPanel.css'
import '../../styles/overlays.css'

type TabId = 'overview' | 'listings' | 'payments' | 'notes'

function isThisMonth(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return !Number.isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function topRoutesFromLoads(loads: AdminLoadRow[], limit = 5): string[] {
  const counts = new Map<string, number>()
  for (const l of loads) {
    const key = `${l.fromCity} → ${l.toCity}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([route, n]) => `${route} (${n})`)
}

export default function AdminCustomerDetailPage() {
  const { id: idParam } = useParams()
  const userId = Number(idParam)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState<TabId>('overview')
  const [listRow, setListRow] = useState<AdminCustomerRow | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loads, setLoads] = useState<AdminLoadRow[]>([])
  const [payments, setPayments] = useState<AdminPaymentRow[]>([])
  const [newNote, setNewNote] = useState('')
  const [noteBusy, setNoteBusy] = useState(false)

  const loadAll = useCallback(async () => {
    if (!userId || Number.isNaN(userId)) {
      setNotFound(true)
      return
    }
    setError('')
    setNotFound(false)
    try {
      const [customers, prof, st, loadRows, payRows] = await Promise.all([
        getAdminCustomers(),
        getUserProfile(userId),
        getCustomerStats(userId),
        getAdminLoads({ customerId: userId }),
        getAdminPayments({ customerId: userId }),
      ])
      setListRow(customers.find((c) => c.id === userId) ?? null)
      setProfile(prof)
      setStats(st)
      setLoads(loadRows)
      setPayments(payRows)
    } catch (e: unknown) {
      const err = e as { response?: { status?: number }; uiMessage?: string }
      if (err.response?.status === 404) {
        setNotFound(true)
        return
      }
      setError(err.uiMessage ?? 'Müşteri detayı yüklenemedi.')
    }
  }, [userId])

  useEffect(() => {
    setLoading(true)
    void loadAll().finally(() => setLoading(false))
  }, [loadAll])

  const displayName = useMemo(() => {
    const company = profile?.companyName?.trim()
    if (company) return company
    return profile?.fullName?.trim() || listRow?.fullName || 'Müşteri'
  }, [profile, listRow])

  const monthLoads = useMemo(() => loads.filter((l) => isThisMonth(l.createdAt)), [loads])
  const monthSpend = useMemo(() => monthLoads.reduce((s, l) => s + l.price, 0), [monthLoads])
  const completionPct = useMemo(() => {
    if (!stats || stats.totalLoads === 0) return null
    return Math.round((stats.delivered / stats.totalLoads) * 100)
  }, [stats])
  const cancelPct = useMemo(() => {
    if (!stats || stats.totalLoads === 0) return null
    return Math.round((stats.cancelled / stats.totalLoads) * 100)
  }, [stats])

  const topRoutes = useMemo(() => topRoutesFromLoads(loads), [loads])
  const isActive = listRow?.isActive ?? true

  async function handleToggleActive() {
    const ok = await openConfirm({
      title: isActive ? 'Hesabı askıya al?' : 'Hesabı aktifleştir?',
      description: isActive ? 'Müşteri geçici olarak sisteme erişemez.' : 'Müşteri yeniden erişim kazanır.',
      variant: isActive ? 'danger' : 'primary',
      confirmText: 'Devam Et',
    })
    if (!ok) return
    try {
      await toggleUserActive(userId)
      toast.success(isActive ? 'Hesap askıya alındı.' : 'Hesap aktifleştirildi.')
      await loadAll()
    } catch (e: unknown) {
      toast.error((e as { uiMessage?: string }).uiMessage ?? 'İşlem başarısız.')
    }
  }

  if (loading) return <PageSkeleton rows={9} variant="card" />
  if (notFound) {
    return (
      <div className="admin-page">
        <PageEmpty
          icon="👤"
          title="Müşteri bulunamadı"
          description="Bu numaraya ait kayıt yok veya erişim yetkiniz bulunmuyor."
          actionLabel="Müşteri listesine dön"
          onAction={() => {
            window.location.href = '/admin/customers'
          }}
        />
      </div>
    )
  }
  if (error) return <PageError message={error} onRetry={() => void loadAll()} />
  if (!profile) return null

  const totalLoads = stats?.totalLoads ?? listRow?.totalLoadCount ?? 0
  const totalSpend = stats?.totalSpend ?? listRow?.totalSpent ?? 0
  const delivered = stats?.delivered ?? 0

  return (
    <div className="admin-page">
      <div className="ad-hero">
        <div className="ad-hero-avatar" aria-hidden>
          {safeInitial(displayName)}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 className="ad-hero-name">{displayName}</h1>
          <p className="muted" style={{ marginBottom: 8 }}>
            Müşteri #{userId}
          </p>
          <p className="muted" style={{ fontSize: 14 }}>
            {maskPhone(listRow?.phone || profile.phone)} · {maskEmail(profile.email)}
          </p>
          {profile.companyName ? (
            <p className="muted" style={{ fontSize: 14 }}>
              Vergi no: {maskTax(profile.taxNumber)}
            </p>
          ) : null}
          <div style={{ marginTop: 12 }}>
            {profile.companyName ? <span className="ad-badge-pulse">Kurumsal üye</span> : null}
            <span className="ad-stat-pill" style={{ marginLeft: profile.companyName ? 8 : 0 }}>
              {isActive ? 'Aktif' : 'Pasif'}
            </span>
          </div>
          <div className="ad-stat-row">
            <span className="ad-stat-pill">📦 {totalLoads} toplam ilan</span>
            <span className="ad-stat-pill">✅ {delivered} tamamlanan</span>
            <span className="ad-stat-pill">💰 {formatCurrencyTRY(totalSpend)} harcama</span>
          </div>
        </div>
      </div>

      <div className="ad-detail-layout">
        <div>
          <div className="ad-tab-bar" role="tablist">
            {(
              [
                ['overview', '📊 Genel Bakış'],
                ['listings', '📦 İlan Geçmişi'],
                ['payments', '💰 Ödeme Geçmişi'],
                ['notes', '⚠️ Notlar'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                className={`ad-tab${tab === k ? ' active' : ''}`}
                onClick={() => setTab(k)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'overview' ? (
            <>
              <div className="ad-kpi-grid-4">
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Bu ay ilan</div>
                  <div className="kpi-value">{monthLoads.length}</div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Bu ay harcama</div>
                  <div className="kpi-value">{formatCurrencyTRY(monthSpend)}</div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Tamamlama</div>
                  <div className="kpi-value success">{completionPct != null ? `%${completionPct}` : '—'}</div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">İptal</div>
                  <div className="kpi-value danger">{cancelPct != null ? `%${cancelPct}` : '—'}</div>
                </div>
              </div>
              <div className="admin-card">
                <h3 style={{ marginTop: 0 }}>En yoğun güzergahlar</h3>
                {topRoutes.length ? (
                  <ul className="muted" style={{ lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
                    {topRoutes.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Henüz yeterli sefer verisi yok.</p>
                )}
              </div>
            </>
          ) : null}

          {tab === 'listings' ? (
            <div className="ad-data-table-wrap">
              {loads.length === 0 ? (
                <p className="muted" style={{ padding: 16 }}>
                  Bu müşteriye ait ilan kaydı yok.
                </p>
              ) : (
                <table className="ad-data-table">
                  <thead>
                    <tr>
                      <th>İlan</th>
                      <th>Güzergah</th>
                      <th>Tarih</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loads.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <Link className="mono-id" to={`/admin/loads/${r.id}`}>
                            {String(r.id).slice(0, 8)}…
                          </Link>
                        </td>
                        <td>
                          {r.fromCity} → {r.toCity}
                        </td>
                        <td>{formatDateTR(r.createdAt)}</td>
                        <td>{formatLoadStatusLabel(r.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : null}

          {tab === 'payments' ? (
            <div className="ad-data-table-wrap">
              {payments.length === 0 ? (
                <p className="muted" style={{ padding: 16 }}>
                  Ödeme kaydı bulunamadı.
                </p>
              ) : (
                <table className="ad-data-table">
                  <thead>
                    <tr>
                      <th>Ödeme</th>
                      <th>İlan</th>
                      <th>Tutar</th>
                      <th>Tarih</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="mono-id">{String(p.id).slice(0, 8)}…</td>
                        <td>
                          <Link className="mono-id" to={`/admin/loads/${p.loadId}`}>
                            {String(p.loadId).slice(0, 8)}…
                          </Link>
                        </td>
                        <td>{formatCurrencyTRY(p.amount)}</td>
                        <td>{formatDateTime(p.createdAt)}</td>
                        <td>{formatPaymentStatusLabel(p.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : null}

          {tab === 'notes' ? (
            <div className="admin-card">
              <p className="muted" style={{ fontSize: 13 }}>
                Notlar yönetim günlüğüne kaydedilir.
              </p>
              <label className="form-group">
                <span className="form-label">Yeni not</span>
                <textarea
                  className="form-input"
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  disabled={noteBusy}
                />
              </label>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginTop: 8 }}
                disabled={noteBusy}
                onClick={() => {
                  const t = newNote.trim()
                  if (!t) {
                    toast.error('Not boş olamaz.')
                    return
                  }
                  setNoteBusy(true)
                  void addUserNote(userId, t)
                    .then(() => {
                      setNewNote('')
                      toast.success('Not kaydedildi.')
                    })
                    .catch((e: { uiMessage?: string }) => toast.error(e.uiMessage ?? 'Not kaydedilemedi.'))
                    .finally(() => setNoteBusy(false))
                }}
              >
                Notu Kaydet
              </button>
            </div>
          ) : null}
        </div>

        <aside className="ad-sidebar">
          <strong>Hızlı aksiyonlar</strong>
          <button
            type="button"
            className={isActive ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'}
            onClick={() => void handleToggleActive()}
          >
            {isActive ? '🔴 Askıya al' : '🟢 Hesabı aktifleştir'}
          </button>
          <button
            type="button"
            className="btn btn-warning btn-sm"
            onClick={() => {
              void openConfirm({
                title: 'Uyarı gönder',
                description: 'Müşteriye sistem uyarısı iletilecek.',
                confirmText: 'Gönder',
              }).then((ok) => {
                if (!ok) return
                void warnUser(userId)
                  .then(() => toast.warning('Uyarı gönderildi.'))
                  .catch((e: { uiMessage?: string }) => toast.error(e.uiMessage ?? 'Uyarı gönderilemedi.'))
              })
            }}
          >
            ⚠️ Uyarı gönder
          </button>
        </aside>
      </div>
    </div>
  )
}

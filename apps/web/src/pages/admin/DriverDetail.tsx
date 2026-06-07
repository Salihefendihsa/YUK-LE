import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  addUserNote,
  getAdminDrivers,
  getAdminLoads,
  getDriverStats,
  toggleUserActive,
  warnUser,
  type AdminDriverRow,
  type AdminLoadRow,
  type DriverStats,
} from '../../api/admin'
import { getUserProfile, type UserProfile } from '../../api/users'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { openConfirm } from '@/components/common/ConfirmModal'
import { toast } from '@/components/common/Toast'
import { formatApprovalStatusLabel, formatLoadStatusLabel } from '../../utils/displayLabels'
import { formatCurrencyTRY, formatDateTR } from '../../utils/format'
import { maskIban, safeInitial } from '../../utils/pii'
import './AdminPanel.css'
import '../../styles/overlays.css'

type TabId = 'overview' | 'trips' | 'finance' | 'docs' | 'notes'

function isThisMonth(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return !Number.isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function docLabel(approved: boolean | undefined): string {
  if (approved === true) return 'Onaylı'
  if (approved === false) return 'Beklemede'
  return 'Bilinmiyor'
}

export default function AdminDriverDetailPage() {
  const { id: idParam } = useParams()
  const userId = Number(idParam)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState<TabId>('overview')
  const [listRow, setListRow] = useState<AdminDriverRow | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<DriverStats | null>(null)
  const [loads, setLoads] = useState<AdminLoadRow[]>([])
  const [tripStatus, setTripStatus] = useState<string>('Tümü')
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
      const [drivers, prof, st, loadRows] = await Promise.all([
        getAdminDrivers(),
        getUserProfile(userId),
        getDriverStats(userId),
        getAdminLoads({ driverId: userId }),
      ])
      setListRow(drivers.find((d) => d.id === userId) ?? null)
      setProfile(prof)
      setStats(st)
      setLoads(loadRows)
    } catch (e: unknown) {
      const err = e as { response?: { status?: number }; uiMessage?: string }
      if (err.response?.status === 404) {
        setNotFound(true)
        return
      }
      setError(err.uiMessage ?? 'Şoför detayı yüklenemedi.')
    }
  }, [userId])

  useEffect(() => {
    setLoading(true)
    void loadAll().finally(() => setLoading(false))
  }, [loadAll])

  const filteredTrips = useMemo(() => {
    if (tripStatus === 'Tümü') return loads
    if (tripStatus === 'Tamamlandı') return loads.filter((r) => String(r.status).toLowerCase() === 'delivered')
    if (tripStatus === 'İptal') return loads.filter((r) => String(r.status).toLowerCase() === 'cancelled')
    return loads
  }, [loads, tripStatus])

  const monthTrips = useMemo(() => loads.filter((l) => isThisMonth(l.createdAt)), [loads])
  const monthEarnings = useMemo(() => monthTrips.reduce((s, l) => s + l.price, 0), [monthTrips])

  const isActive = listRow?.isActive ?? true
  const displayName = profile?.fullName?.trim() || listRow?.fullName || 'Şoför'
  const rating = profile?.averageRating ?? listRow?.rating ?? 0
  const totalTrips = stats?.totalTrips ?? loads.length
  const totalEarnings = stats?.totalEarnings ?? loads.reduce((s, l) => s + l.price, 0)

  const deliveredCount = loads.filter((l) => String(l.status).toLowerCase() === 'delivered').length
  const completionPct = loads.length ? Math.round((deliveredCount / loads.length) * 100) : null
  const cancelCount = loads.filter((l) => String(l.status).toLowerCase() === 'cancelled').length
  const cancelPct = loads.length ? Math.round((cancelCount / loads.length) * 100) : null

  async function handleToggleActive() {
    const ok = await openConfirm({
      title: isActive ? 'Hesabı askıya al?' : 'Hesabı aktifleştir?',
      description: isActive ? 'Şoför geçici olarak sisteme erişemez.' : 'Şoför yeniden erişim kazanır.',
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

  if (loading) return <PageSkeleton rows={10} variant="card" />
  if (notFound) {
    return (
      <div className="admin-page">
        <PageEmpty
          icon="🚛"
          title="Şoför bulunamadı"
          description="Bu numaraya ait kayıt yok veya erişim yetkiniz bulunmuyor."
          actionLabel="Şoför listesine dön"
          onAction={() => {
            window.location.href = '/admin/drivers'
          }}
        />
      </div>
    )
  }
  if (error) return <PageError message={error} onRetry={() => void loadAll()} />
  if (!profile) return null

  const approvalLabel = formatApprovalStatusLabel(listRow?.approvalStatus ?? profile.approvalStatus)

  const docs = [
    { t: 'Sürücü belgesi', s: docLabel(profile.isDriverLicenseApproved) },
    { t: 'SRC belgesi', s: docLabel(profile.isSrcApproved) },
    { t: 'Psikoteknik', s: docLabel(profile.isPsychotechnicalApproved) },
  ]

  return (
    <div className="admin-page">
      <div className="ad-hero">
        <div className="ad-hero-avatar" aria-hidden>
          {safeInitial(displayName)}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 className="ad-hero-name">{displayName}</h1>
          <p className="muted" style={{ marginBottom: 8 }}>
            Şoför #{userId}
          </p>
          <p className="muted" style={{ fontSize: 14 }}>
            {listRow?.phone || profile.phone} · {profile.email}
          </p>
          <div style={{ marginTop: 12 }}>
            <span className="ad-badge-pulse">{approvalLabel}</span>
            <span className="ad-stat-pill" style={{ marginLeft: 8 }}>
              {isActive ? 'Aktif' : 'Pasif'}
            </span>
          </div>
          <div className="ad-stat-row">
            <span className="ad-stat-pill">⭐ {rating.toFixed(1)} puan</span>
            <span className="ad-stat-pill">🚛 {totalTrips} sefer</span>
            <span className="ad-stat-pill">💰 {formatCurrencyTRY(totalEarnings)} toplam kazanç</span>
            {profile.vehiclePlate ? (
              <span className="ad-stat-pill">🚗 {profile.vehiclePlate}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="ad-detail-layout">
        <div>
          <div className="ad-tab-bar" role="tablist">
            {(
              [
                ['overview', '📊 Genel Bakış'],
                ['trips', '📦 Sefer Geçmişi'],
                ['finance', '💰 Finansal'],
                ['docs', '📄 Belgeler'],
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
                  <div className="kpi-label">Bu ay sefer</div>
                  <div className="kpi-value">{monthTrips.length}</div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Bu ay kazanç</div>
                  <div className="kpi-value">{formatCurrencyTRY(monthEarnings)}</div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Tamamlama oranı</div>
                  <div className="kpi-value success">{completionPct != null ? `%${completionPct}` : '—'}</div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">İptal oranı</div>
                  <div className="kpi-value danger">{cancelPct != null ? `%${cancelPct}` : '—'}</div>
                </div>
              </div>
              <div className="admin-card" style={{ marginBottom: 14 }}>
                <h3 style={{ marginTop: 0 }}>En çok gidilen güzergahlar</h3>
                {stats?.topRoutes?.length ? (
                  <ol className="muted" style={{ lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
                    {stats.topRoutes.map((r) => (
                      <li key={r.route}>
                        {r.route.replace('->', ' → ')} — {r.count} sefer
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="muted">Henüz yeterli sefer verisi yok.</p>
                )}
              </div>
            </>
          ) : null}

          {tab === 'trips' ? (
            <div className="admin-card">
              <div className="item-row" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <label className="muted" style={{ fontSize: 13 }}>
                  Durum
                  <select
                    className="form-input"
                    style={{ marginTop: 4, maxWidth: 200 }}
                    value={tripStatus}
                    onChange={(e) => setTripStatus(e.target.value)}
                  >
                    <option>Tümü</option>
                    <option>Tamamlandı</option>
                    <option>İptal</option>
                  </select>
                </label>
              </div>
              <div className="ad-data-table-wrap">
                {filteredTrips.length === 0 ? (
                  <p className="muted" style={{ padding: 16 }}>
                    Sefer kaydı bulunamadı.
                  </p>
                ) : (
                  <table className="ad-data-table">
                    <thead>
                      <tr>
                        <th>İlan</th>
                        <th>Güzergah</th>
                        <th>Tarih</th>
                        <th>Kazanç</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrips.map((r) => (
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
                          <td>{formatCurrencyTRY(r.price)}</td>
                          <td>{formatLoadStatusLabel(r.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : null}

          {tab === 'finance' ? (
            <div className="admin-card">
              <div className="ad-kpi-grid-4" style={{ marginBottom: 16 }}>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Toplam kazanç</div>
                  <div className="kpi-value">{formatCurrencyTRY(totalEarnings)}</div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Bu ay kazanç</div>
                  <div className="kpi-value">{formatCurrencyTRY(monthEarnings)}</div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Toplam ağırlık</div>
                  <div className="kpi-value">{stats?.totalWeight != null ? `${stats.totalWeight.toLocaleString('tr-TR')} kg` : '—'}</div>
                </div>
              </div>
              <div className="admin-card">
                <h4 style={{ marginTop: 0 }}>IBAN</h4>
                <p className="mono-id muted">{maskIban(profile.iban)}</p>
              </div>
            </div>
          ) : null}

          {tab === 'docs' ? (
            <div className="ad-doc-grid">
              {docs.map((d) => (
                <div key={d.t} className="ad-doc-card">
                  <strong>{d.t}</strong>
                  <span className="ad-stat-pill">{d.s}</span>
                  {profile.lastValidationMessage ? (
                    <span className="muted" style={{ fontSize: 12 }}>
                      {profile.lastValidationMessage}
                    </span>
                  ) : null}
                </div>
              ))}
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
                  placeholder="Admin notu yazın…"
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
                description: 'Şoföre sistem uyarısı iletilecek.',
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

import { useState } from 'react'
import { openConfirm } from '../../components/common/ConfirmModal'
import '../shared/Page.css'

export default function CustomerSettingsPage() {
  const [email, setEmail] = useState(true)
  const [sms, setSms] = useState(false)
  const [push, setPush] = useState(true)
  const [lang, setLang] = useState<'tr' | 'en'>('tr')
  const [apiToken, setApiToken] = useState('yk_live_••••••••••••••••')
  const [pwdCur, setPwdCur] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [pwd2, setPwd2] = useState('')

  return (
    <div className="page-wrap">
      <h1 className="page-title">Ayarlar</h1>
      <p className="page-sub">Bildirim, görünüm ve hesap tercihleri</p>

      <div className="settings-grid">
        <section className="card settings-card">
          <h2>Bildirim tercihleri</h2>
          <label className="settings-row">
            <span>E-posta</span>
            <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />
          </label>
          <label className="settings-row">
            <span>SMS</span>
            <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} />
          </label>
          <label className="settings-row">
            <span>Push</span>
            <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} />
          </label>
          <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
            Hangi olaylarda bildirim alacağınız ve sessiz saatler yakında hesabınıza bağlanacak.
          </p>
        </section>

        <section className="card settings-card">
          <h2>Dil</h2>
          <select className="settings-select" value={lang} onChange={(e) => setLang(e.target.value as 'tr' | 'en')}>
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
          <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
            Arayüz dili (demo — tam çeviri yakında).
          </p>
        </section>

        <section className="card settings-card">
          <h2>Şifre değiştir</h2>
          <label className="settings-field">
            Mevcut şifre
            <input type="password" className="form-input" value={pwdCur} onChange={(e) => setPwdCur(e.target.value)} autoComplete="current-password" />
          </label>
          <label className="settings-field">
            Yeni şifre
            <input type="password" className="form-input" value={pwdNew} onChange={(e) => setPwdNew(e.target.value)} autoComplete="new-password" />
          </label>
          <label className="settings-field">
            Yeni şifre (tekrar)
            <input type="password" className="form-input" value={pwd2} onChange={(e) => setPwd2(e.target.value)} autoComplete="new-password" />
          </label>
          <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => alert('Şifre API bağlantısı aynı — bu ekran yer tutucu.')}>
            Şifreyi güncelle
          </button>
        </section>

        <section className="card settings-card">
          <h2>Gizlilik</h2>
          <p className="muted" style={{ fontSize: 14 }}>
            Profil görünürlüğü ve veri paylaşımı tercihleri. Ayrıntılar için{' '}
            <a href="/gizlilik" className="forgot-link">
              Gizlilik
            </a>{' '}
            sayfasına bakın.
          </p>
        </section>

        <section className="card settings-card">
          <h2>API token (kurumsal)</h2>
          <input className="form-input" readOnly value={apiToken} />
          <div className="settings-actions" style={{ marginTop: 10 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setApiToken(`yk_live_${crypto.randomUUID().slice(0, 8)}…`)}>
              Yenile
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(apiToken)}>
              Kopyala
            </button>
          </div>
        </section>

        <section className="card settings-card settings-card--danger">
          <h2>Hesabı sil</h2>
          <p className="muted" style={{ fontSize: 14 }}>
            Bu işlem geri alınamaz. Tüm ilan geçmişi ve mesajlar silinir.
          </p>
          <button
            type="button"
            className="btn btn-sm"
            style={{ marginTop: 12, background: 'rgba(239,68,68,0.15)', color: '#fecaca', border: '1px solid rgba(239,68,68,0.45)' }}
            onClick={async () => {
              const ok = await openConfirm({
                title: 'Hesabı silmek üzeresiniz',
                description: 'Devam etmek için aşağıya SİL yazın.',
                requireTypeText: 'SİL',
                variant: 'danger',
                irreversibleHint: true,
                confirmText: 'Hesabı sil',
              })
              if (ok) alert('Demo: silme isteği kaydedilmedi.')
            }}
          >
            Hesabı sil…
          </button>
        </section>
      </div>

      <style>{`
        .settings-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-top: 20px; }
        .settings-card h2 { margin: 0 0 12px; font-size: 1rem; }
        .settings-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .settings-field { display: flex; flex-direction: column; gap: 6px; font-size: 13px; margin-top: 10px; }
        .settings-select { margin-top: 8px; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--color-border-light); background: rgba(9,11,14,0.4); color: inherit; }
        .settings-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      `}</style>
    </div>
  )
}

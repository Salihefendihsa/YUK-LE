import { useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

export type ConfirmVariant = 'danger' | 'primary'

export type ConfirmOptions = {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  /** Kullanıcı tam olarak bu metni yazmadan onaylanamaz */
  requireTypeText?: string
  /** Tehlike uyarısı satırı */
  irreversibleHint?: boolean
}

type Pending = ConfirmOptions & { resolve: (v: boolean) => void }

let pending: Pending | null = null
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return pending
}

function setPending(p: Pending | null) {
  pending = p
  listeners.forEach((l) => l())
}

export function openConfirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    setPending({ ...opts, resolve })
  })
}

export function ConfirmViewport() {
  const state = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => null
  )
  const [typed, setTyped] = useState('')

  useEffect(() => {
    setTyped('')
  }, [state?.title])

  if (!state) return null

  const dialog = state
  const variant = dialog.variant ?? 'primary'
  const needType = Boolean(dialog.requireTypeText?.trim())
  const canConfirm = !needType || typed.trim() === dialog.requireTypeText?.trim()

  function close(ok: boolean) {
    dialog.resolve(ok)
    setPending(null)
  }

  return createPortal(
    <div className="confirm-backdrop" role="presentation" onClick={() => close(false)}>
      <div
        className="confirm-card glass-card"
        role="dialog"
        aria-modal
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon-wrap" aria-hidden>
          ⚠️
        </div>
        <h2 id="confirm-title" className="confirm-title">
          {dialog.title}
        </h2>
        {dialog.description ? <p className="confirm-desc">{dialog.description}</p> : null}
        {dialog.irreversibleHint ? <p className="confirm-warn">Bu işlem geri alınamaz.</p> : null}
        {needType ? (
          <label className="confirm-type-label">
            <span>Onay için yazın: {dialog.requireTypeText}</span>
            <input className="form-input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </label>
        ) : null}
        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost" onClick={() => close(false)}>
            {dialog.cancelText ?? 'İptal'}
          </button>
          <button
            type="button"
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            disabled={!canConfirm}
            onClick={() => close(true)}
          >
            {dialog.confirmText ?? 'Devam Et'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

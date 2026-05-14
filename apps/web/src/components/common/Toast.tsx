import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

export type ToastKind = 'success' | 'error' | 'warning' | 'info'

type ToastItem = { id: number; kind: ToastKind; message: string }

let toasts: ToastItem[] = []
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return toasts
}

function push(kind: ToastKind, message: string) {
  const id = Date.now() + Math.random()
  toasts = [...toasts, { id, kind, message }]
  emit()
  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 3200)
}

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  warning: (message: string) => push('warning', message),
  info: (message: string) => push('info', message),
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

const ICON: Record<ToastKind, string> = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
}

export function ToastViewport() {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => [])
  if (items.length === 0) return null
  return createPortal(
    <div className="toast-viewport" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast-glass toast-${t.kind}`} role="status">
          <span className="toast-icon" aria-hidden>
            {ICON[t.kind]}
          </span>
          <span className="toast-msg">{t.message}</span>
          <button type="button" className="toast-close" aria-label="Kapat" onClick={() => dismissToast(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}

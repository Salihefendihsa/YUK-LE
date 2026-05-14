import './KeyboardShortcutsModal.css'

const ROWS: [string, string][] = [
  ['Ctrl / Cmd + K', 'Hızlı eylem paleti'],
  ['N', 'Yeni ilan (müşteri paneli)'],
  ['I', 'İlanlarım'],
  ['C', 'Cüzdan'],
  ['?', 'Bu kısayol listesi'],
  ['Esc', 'Açık modal / palet kapat'],
]

export default function KeyboardShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="ks-root" role="dialog" aria-modal="true" aria-label="Klavye kısayolları">
      <button type="button" className="ks-backdrop" onClick={onClose} aria-label="Kapat" />
      <div className="ks-panel card">
        <div className="ks-head">
          <h2>Kısayollar</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Kapat
          </button>
        </div>
        <table className="ks-table">
          <tbody>
            {ROWS.map(([k, d]) => (
              <tr key={k}>
                <td>
                  <kbd className="ks-kbd">{k}</kbd>
                </td>
                <td>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useMemo } from 'react'

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

type Props = {
  value?: string
  onChange: (isoValue: string) => void
  onClear?: () => void
}

export default function TurkishDateTimePicker({ value, onChange, onClear }: Props) {
  const current = useMemo(() => {
    const d = value ? new Date(value) : new Date()
    return Number.isNaN(d.getTime()) ? new Date() : d
  }, [value])

  const day = current.getDate()
  const month = current.getMonth() + 1
  const year = current.getFullYear()
  const hour = current.getHours()
  const minute = current.getMinutes()

  const update = (next: { day?: number; month?: number; year?: number; hour?: number; minute?: number }) => {
    const date = new Date(
      next.year ?? year,
      (next.month ?? month) - 1,
      next.day ?? day,
      next.hour ?? hour,
      next.minute ?? minute,
      0,
      0
    )
    onChange(date.toISOString())
  }

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="item-row" style={{ marginBottom: 8 }}>
        <strong>{MONTHS[month - 1]} {year}</strong>
        <span className="muted">{DAYS.join(' · ')}</span>
      </div>
      <div className="item-row">
        <select className="form-input" value={day} onChange={(e) => update({ day: Number(e.target.value) })}>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{String(d).padStart(2, '0')}</option>)}
        </select>
        <select className="form-input" value={month} onChange={(e) => update({ month: Number(e.target.value) })}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select className="form-input" value={year} onChange={(e) => update({ year: Number(e.target.value) })}>
          {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() + i).map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="form-input" value={hour} onChange={(e) => update({ hour: Number(e.target.value) })}>
          {Array.from({ length: 24 }, (_, i) => i).map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
        </select>
        <select className="form-input" value={minute} onChange={(e) => update({ minute: Number(e.target.value) })}>
          {Array.from({ length: 60 }, (_, i) => i).map((m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
        </select>
      </div>
      <div className="item-row" style={{ marginTop: 8 }}>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => onChange(new Date().toISOString())}>Bugün</button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => onClear?.()}>Temizle</button>
      </div>
    </div>
  )
}

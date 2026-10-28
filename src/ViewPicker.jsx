import { useEffect, useState } from 'react'
import './ViewPicker.css'

// 2026-10-28 (user: too many view buttons on phones) -- Going Yard's copy of the shared PRISM Labs view picker. On a phone
// (640px or narrower) a row of 4+ views becomes a full-width dropdown showing the current view; wider screens keep the
// pill row (Going Yard's gyPill style, passed in). options = [[key, label], ...]. `after` = extra controls (help buttons)
// that sit beside the row or the dropdown.
const QUERY = '(max-width: 640px)'

export function useNarrow() {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches)
  useEffect(() => {
    const m = window.matchMedia?.(QUERY)
    if (!m) return undefined
    const on = () => setNarrow(m.matches)
    on()
    if (m.addEventListener) m.addEventListener('change', on); else m.addListener(on)
    return () => { if (m.removeEventListener) m.removeEventListener('change', on); else m.removeListener(on) }
  }, [])
  return narrow
}

export function ViewSelect({ options, value, onChange, label = 'View' }) {
  return (
    <label className="vp">
      <span className="vp-label">{label}</span>
      <select className="vp-select" value={String(value)}
        onChange={(e) => { const o = options.find(([k]) => String(k) === e.target.value); if (o) onChange(o[0]) }}>
        {options.map(([k, l]) => <option key={String(k)} value={String(k)}>{l}</option>)}
      </select>
      <span className="vp-chev" aria-hidden="true">▾</span>
    </label>
  )
}

// phone vs desktop markup (the grouped Scouting rows / the Home row keep their desktop layout)
export function Responsive({ phone, desktop }) {
  return useNarrow() ? phone : desktop
}

export default function ViewPicker({ options, value, onChange, pillStyle, rowClass = 'gy-pill-row', rowStyle, min = 4, label = 'View', after = null }) {
  const narrow = useNarrow()
  if (narrow && options.length >= min) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', ...(rowStyle || {}) }}>
        <ViewSelect options={options} value={value} onChange={onChange} label={label} />
        {after}
      </div>
    )
  }
  return (
    <div className={rowClass} style={rowStyle}>
      {options.map(([k, l]) => <button key={String(k)} type="button" onClick={() => onChange(k)} style={pillStyle(value === k)}>{l}</button>)}
      {after}
    </div>
  )
}

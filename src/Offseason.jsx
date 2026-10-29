import { useEffect, useState } from 'react'
import './Offseason.css'

// 2026-10-29 (user: the 2026 season is over -- tell people before they browse; no PRISM Picks in the offseason).
// Offseason = after the last game of the season and before the date the app comes back. Change these two lines in March.
export const SEASON = {
  over: '2026-10-28',            // World Series Game 5 (final game of 2026)
  back: '2027-03-15',            // banner + notice stop showing from this date (daily data returns for Opening Day)
  champion: 'Milwaukee Brewers',
  series: 'won the World Series 4–1 over the Tampa Bay Rays',
}
const KEY = 'gyOffseasonNotice2026'
const etToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
export const isOffseason = () => { const d = etToday(); return d > SEASON.over && d < SEASON.back }

// slim banner under the header on every page + a one-time notice on first visit
export default function OffseasonNotice() {
  const off = isOffseason()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!off) return
    try { if (!localStorage.getItem(KEY)) setOpen(true) } catch { setOpen(true) }
  }, [off])
  if (!off) return null
  const close = () => { setOpen(false); try { localStorage.setItem(KEY, '1') } catch { /* private mode */ } }
  return (
    <>
      <div className="gy-off-banner" role="status">
        <span>🏁 <b>Offseason</b> · 2026 is in the books — data is frozen after the World Series (Oct 28). Daily picks return for Opening Day 2027.</span>
        <button type="button" onClick={() => setOpen(true)}>What&apos;s here?</button>
      </div>
      {open && (
        <div className="gy-off-back" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
          <div className="gy-off-card" role="dialog" aria-modal="true" aria-labelledby="gyOffTitle">
            <div className="gy-off-kicker">⚾ 2026 season complete</div>
            <h2 id="gyOffTitle">{SEASON.champion} {SEASON.series}.</h2>
            <p>Going Yard is in <b>offseason mode</b> until spring. Everything you see is frozen at the end of the 2026 season.</p>
            <div className="gy-off-cols">
              <div><b>Still here</b><ul><li>Track Record — the full 2026 season, every signal graded</li><li>Player stats, splits and HR leaders</li><li>Scouting tools and slideouts (2026 data)</li></ul></div>
              <div><b>Paused until Opening Day</b><ul><li>Daily picks, PRISM Picks and Top 4 Tonight</li><li>Live games, HR alerts and push notifications</li><li>Weather, lineups and odds</li></ul></div>
            </div>
            <button type="button" className="gy-off-go" onClick={close}>Browse the 2026 season</button>
          </div>
        </div>
      )}
    </>
  )
}

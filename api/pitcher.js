// api/pitcher.js
// Fetches pitcher season stats from MLB Stats API (always works)
// Savant pitch mix data is optional/bonus — never blocks the response

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, s-maxage=3600'); // cache 1hr

  const { pid, name, year = '2026' } = req.query;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json,*/*',
  };

  try {
    // ── Step 1: Resolve pitcher ID ─────────────────────────────
    let pitcherId = pid ? String(parseInt(pid) || pid) : null;

    if (!pitcherId && name) {
      try {
        const r = await fetch(
          `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(name)}&sportId=1`,
          { headers }
        );
        if (r.ok) {
          const d = await r.json();
          const p = d.people?.find(p =>
            p.primaryPosition?.code === '1' || p.primaryPosition?.type === 'Pitcher'
          );
          if (p) pitcherId = String(p.id);
        }
      } catch(e) { /* search failed — continue without ID */ }
    }

    if (!pitcherId) {
      return res.status(200).json({ found: false, pitchMix: [], stats: {} });
    }

    // ── Step 2: MLB Stats API season stats (always fetch this) ──
    let stats = {};
    try {
      const r = await fetch(
        `https://statsapi.mlb.com/api/v1/people/${pitcherId}/stats?stats=season&group=pitching&season=${year}&sportId=1`,
        { headers }
      );
      if (r.ok) {
        const d = await r.json();
        // Try current season first, fall back to previous
        let s = d.stats?.[0]?.splits?.[0]?.stat;
        if (!s || !s.era) {
          // Try previous season as fallback
          const r2 = await fetch(
            `https://statsapi.mlb.com/api/v1/people/${pitcherId}/stats?stats=season&group=pitching&season=${parseInt(year)-1}&sportId=1`,
            { headers }
          );
          if (r2.ok) {
            const d2 = await r2.json();
            s = d2.stats?.[0]?.splits?.[0]?.stat;
          }
        }
        if (s) {
          stats = {
            era:  s.era              || '—',
            whip: s.whip             || '—',
            ip:   s.inningsPitched   || '0',
            k9:   s.strikeoutsPer9Inn|| '—',
            bb9:  s.walksPer9Inn     || '—',
            hr9:  s.homeRunsPer9     || '—',
            kPct: s.strikeoutPercentage || '—',
            bbPct:s.walkPercentage   || '—',
            hits: s.hits  || 0,
            hr:   s.homeRuns || 0,
            obp:  s.obp    || '—',
            avg:  s.avg    || '—',
            wins: s.wins   || 0,
            losses: s.losses || 0,
          };
        }
      }
    } catch(e) {
      console.warn('[Pitcher] MLB Stats API failed:', e.message);
    }

    // ── Step 3: Savant pitch mix (optional — don't block) ───────
    let pitchMix = [];
    try {
      const r = await fetch(
        `https://baseballsavant.mlb.com/leaderboard/pitch-movement?year=${year}&team=&min=1&type=pitcher&pitcher_hand=&pitch_type=&run_value_sort=run_value_per_100&csv=true`,
        { headers, signal: AbortSignal.timeout(5000) }
      );
      if (r.ok) {
        const csv = await r.text();
        const rows = csv.trim().split('\n');
        const hdrs = rows[0].split(',').map(h => h.replace(/"/g,'').trim());
        const playerRows = rows.slice(1)
          .map(row => {
            const vals = row.split(',').map(v => v.replace(/"/g,'').trim());
            const o = {};
            hdrs.forEach((h,i) => { o[h] = vals[i] || ''; });
            return o;
          })
          .filter(r => (r.pitcher_id || r.player_id) === pitcherId);

        if (playerRows.length > 0) {
          const COLORS = {
            FF:'#ff4020',SI:'#ff8020',FC:'#f5a623',
            SL:'#38b8f2',SV:'#38b8f2',ST:'#38b8f2',
            CU:'#f5a623',KC:'#f5a623',
            CH:'#27c97a',FS:'#27c97a',
          };
          pitchMix = playerRows.map(r => ({
            name:     r.pitch_name || r.pitch_type || '?',
            code:     r.pitch_type || '',
            pct:      parseFloat(r.pitch_usage_pct || r.pitch_percent || 0),
            velo:     parseFloat(r.avg_speed || 0).toFixed(1),
            color:    COLORS[r.pitch_type] || '#8899aa',
            whiffPct: parseFloat(r.whiff_percent || 0),
            runValue: parseFloat(r.run_value_per_100 || 0),
          })).filter(p => p.pct > 0).sort((a,b) => b.pct - a.pct);
        }
      }
    } catch(e) {
      console.warn('[Pitcher] Savant fetch skipped:', e.message);
    }

    console.log(`[Pitcher] ${pitcherId} | ERA ${stats.era} K/9 ${stats.k9} | ${pitchMix.length} pitches`);

    return res.status(200).json({
      found: true,
      pid: pitcherId,
      pitchMix,
      stats,
    });

  } catch(err) {
    console.error('[Pitcher] Fatal:', err.message);
    return res.status(200).json({ found: false, pitchMix: [], stats: {} });
  }
}

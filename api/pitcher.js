// api/pitcher.js
// Season stats: MLB Stats API (reliable)
// Pitch arsenal: MLB Stats API pitchArsenal endpoint (reliable, no Savant needed)
// Batted ball: Savant custom leaderboard (optional, best-effort)

// Shared mapper for a single MLB Stats API pitching stat leaf object —
// same shape whether it comes from stats=season or a statSplits vl/vr split.
// Added 2026-07-28 so the vs-LHB/vs-RHB split (below) returns objects the
// client can run through the exact same color-threshold logic as the
// existing overall `stats` object, with zero special-casing on that side.
function mapPitchingStat(s, hand) {
  if (!s) return null;
  return {
    era:   s.era               || '—',
    whip:  s.whip              || '—',
    ip:    s.inningsPitched    || '0',
    k9:    s.strikeoutsPer9Inn || '—',
    bb9:   s.walksPer9Inn      || '—',
    hr9:   s.homeRunsPer9      || '—',
    hr:    s.homeRuns          || 0,
    hits:  s.hits              || 0,
    avg:   s.avg               || '—',
    obp:   s.obp               || '—',
    wins:  s.wins              || 0,
    losses:s.losses            || 0,
    so:    s.strikeOuts        || 0,
    bb:    s.baseOnBalls       || 0,
    kPct:  s.strikeoutPercentage || '—',
    bbPct: s.walkPercentage    || '—',
    hand,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');

  const { pid, name, year = '2026' } = req.query;
  const H = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json,*/*' };

  try {
    // ── Step 1: Resolve pitcher ID ──────────────────────────────
    let pitcherId = pid ? String(parseInt(pid) || pid) : null;
    if (!pitcherId && name) {
      try {
        const r = await fetch(`https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(name)}&sportId=1`, { headers: H });
        if (r.ok) {
          const d = await r.json();
          const p = d.people?.find(p => p.primaryPosition?.code === '1' || p.primaryPosition?.type === 'Pitcher');
          if (p) pitcherId = String(p.id);
        }
      } catch(e) {}
    }
    if (!pitcherId) return res.status(200).json({ found: false, pitchMix: [], stats: {} });

    // ── Step 2: Season stats + pitch arsenal + vs-hand splits in parallel ──
    let stats = {}, hand = 'R', pitchMix = [], battedBall = {};
    let handSplits = { vsL: null, vsR: null };

    const [rPeople, rStats, rArsenal, rSplits] = await Promise.allSettled([
      fetch(`https://statsapi.mlb.com/api/v1/people/${pitcherId}`, { headers: H }),
      fetch(`https://statsapi.mlb.com/api/v1/people/${pitcherId}/stats?stats=season&group=pitching&season=${year}&sportId=1`, { headers: H }),
      fetch(`https://statsapi.mlb.com/api/v1/people/${pitcherId}/stats?stats=pitchArsenal&season=${year}&sportId=1`, { headers: H }),
      // vs-LHB/vs-RHB split — same statSplits/sitCodes=vl,vr endpoint the
      // engine's fetch_pitcher_hand_splits() already uses (matchup_engine.py)
      // for hand-specific grading. Added 2026-07-28 to power a vs-hand toggle
      // in PitcherSlideIn. Works for ANY pitcher (not just today's probable
      // starters), unlike the AB-log-derived pitcher_*_vs_R/vs_L fields in
      // daily_picks.csv. Note (known from the July 2026 Ben Rice case study):
      // this endpoint sometimes omits `era` in the split leaf object — WHIP,
      // HR/9, K/9, BB/9, and raw HR count come through reliably regardless.
      fetch(`https://statsapi.mlb.com/api/v1/people/${pitcherId}/stats?stats=statSplits&group=pitching&sitCodes=vl,vr&season=${year}&sportId=1`, { headers: H }),
    ]);

    // Handedness
    if (rPeople.status === 'fulfilled' && rPeople.value.ok) {
      const d = await rPeople.value.json();
      hand = d.people?.[0]?.pitchHand?.code || 'R';
    }

    // Season stats (try current year, fall back to prior)
    if (rStats.status === 'fulfilled' && rStats.value.ok) {
      const d = await rStats.value.json();
      let s = d.stats?.[0]?.splits?.[0]?.stat;
      if (!s || !s.era) {
        try {
          const r2 = await fetch(`https://statsapi.mlb.com/api/v1/people/${pitcherId}/stats?stats=season&group=pitching&season=${parseInt(year)-1}&sportId=1`, { headers: H });
          if (r2.ok) { const d2 = await r2.json(); s = d2.stats?.[0]?.splits?.[0]?.stat; }
        } catch(e) {}
      }
      const mapped = mapPitchingStat(s, hand);
      if (mapped) stats = mapped;
    }

    // vs-LHB / vs-RHB splits
    if (rSplits.status === 'fulfilled' && rSplits.value.ok) {
      try {
        const d = await rSplits.value.json();
        for (const split of (d.stats?.[0]?.splits || [])) {
          const code = split.split?.code || '';
          const mapped = mapPitchingStat(split.stat, hand);
          if (code === 'vl') handSplits.vsL = mapped;
          else if (code === 'vr') handSplits.vsR = mapped;
        }
      } catch (e) {}
    }

    // Pitch arsenal from MLB Stats API — much more reliable than Savant CSV
    if (rArsenal.status === 'fulfilled' && rArsenal.value.ok) {
      const d = await rArsenal.value.json();
      const splits = d.stats?.[0]?.splits || [];
      const COLORS = { FF:'#ff4020', SI:'#ff8020', FC:'#f5a623', SL:'#38b8f2',
        SV:'#38b8f2', ST:'#38b8f2', CU:'#f5a623', KC:'#f5a623', CH:'#27c97a', FS:'#27c97a', CS:'#f5a623' };
      pitchMix = splits.map(s => ({
        name:     s.stat?.pitchName || s.stat?.type?.description || '?',
        code:     s.stat?.type?.code || '',
        pct:      parseFloat(s.stat?.percentage || 0),
        velo:     parseFloat(s.stat?.averageSpeed || 0),
        color:    COLORS[s.stat?.type?.code] || '#8899aa',
        whiffPct: parseFloat(s.stat?.whiffPercent || 0),
      })).filter(p => p.pct > 0).sort((a, b) => b.pct - a.pct);
    }

    // Batted ball from Savant (optional — don't block if it fails)
    try {
      const rBB = await fetch(
        `https://baseballsavant.mlb.com/leaderboard/custom?year=${year}&type=pitcher&filter=&min=1&selections=pa,barrel_batted_rate,hard_hit_percent,groundballs_percent,flyballs_percent,linedrives_percent&csv=true`,
        { headers: H, signal: AbortSignal.timeout(4000) }
      );
      if (rBB.ok) {
        const csv = await rBB.text();
        const rows = csv.trim().split('\n');
        const hdrs = rows[0].split(',').map(h => h.replace(/"/g,'').trim());
        const found = rows.slice(1).find(row => {
          const vals = row.split(',');
          const o = {}; hdrs.forEach((h,i)=>{ o[h]=vals[i]?.replace(/"/g,'').trim()||''; });
          return (o.player_id||o.pitcher_id||o.mlbam_id) === pitcherId;
        });
        if (found) {
          const vals = found.split(',');
          const o = {}; hdrs.forEach((h,i)=>{ o[h]=vals[i]?.replace(/"/g,'').trim()||''; });
          battedBall = {
            gbPct:     parseFloat(o.groundballs_percent||0)||null,
            fbPct:     parseFloat(o.flyballs_percent||0)||null,
            ldPct:     parseFloat(o.linedrives_percent||0)||null,
            hhPct:     parseFloat(o.hard_hit_percent||0)||null,
            barrelPct: parseFloat(o.barrel_batted_rate||0)||null,
          };
        }
      }
    } catch(e) { console.warn('[Pitcher] Savant batted ball skipped:', e.message); }

    console.log(`[Pitcher] ${pitcherId} ERA:${stats.era} K/9:${stats.k9} Pitches:${pitchMix.length} GB%:${battedBall.gbPct}`);

    return res.status(200).json({ found: true, pid: pitcherId, pitchMix, battedBall, stats, handSplits });

  } catch(err) {
    console.error('[Pitcher] Fatal:', err.message);
    return res.status(200).json({ found: false, pitchMix: [], stats: {} });
  }
}

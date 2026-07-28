// api/batter-splits.js
// Batter's own season hitting stats vs LHP / vs RHP — same pattern as the
// vs-LHB/vs-RHB addition to api/pitcher.js (2026-07-28), mirrored for the
// batter slideout. New standalone file rather than an extension, since no
// existing endpoint already covers a batter's own live season stats (the
// "Statcast Profile" section in AtBatSlideIn reads from the static
// PLAYER_DATA_CACHE/players.json instead — this endpoint only supplies the
// two hand-specific splits that cache doesn't have).
//
// Same MLB Stats API shape as the pitching-side splits, just group=hitting.
// Field names verified against a real live pull before shipping (José
// Ramírez, 608070, 2026): avg/obp/slg/ops/homeRuns/atBats/plateAppearances/
// hits/rbi/strikeOuts/baseOnBalls/doubles/triples/babip all present and
// correctly split by hand (vsL 96 PA .313/.396/.566, vsR 236 PA .204/.311/.338).

function mapHittingStat(s) {
  if (!s) return null;
  return {
    avg:   s.avg    || '—',
    obp:   s.obp    || '—',
    slg:   s.slg    || '—',
    ops:   s.ops    || '—',
    pa:    s.plateAppearances || 0,
    ab:    s.atBats           || 0,
    hits:  s.hits             || 0,
    hr:    s.homeRuns         || 0,
    rbi:   s.rbi              || 0,
    doubles: s.doubles        || 0,
    triples: s.triples        || 0,
    so:    s.strikeOuts       || 0,
    bb:    s.baseOnBalls      || 0,
    babip: s.babip  || '—',
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');

  const { pid, year = '2026' } = req.query;
  const H = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json,*/*' };

  const batterId = pid ? String(parseInt(pid) || pid) : null;
  if (!batterId) return res.status(200).json({ found: false, handSplits: { vsL: null, vsR: null } });

  const handSplits = { vsL: null, vsR: null };
  try {
    const url = `https://statsapi.mlb.com/api/v1/people/${batterId}/stats?stats=statSplits&group=hitting&sitCodes=vl,vr&season=${year}&sportId=1`;
    const r = await fetch(url, { headers: H });
    if (r.ok) {
      const d = await r.json();
      for (const split of (d.stats?.[0]?.splits || [])) {
        const code = split.split?.code || '';
        const mapped = mapHittingStat(split.stat);
        // MLB's own split codes are from the PITCHER's perspective — "vl"
        // means "vs a Left-handed pitcher" (i.e. the split we want to key
        // as vsL for "this batter facing LHP"). No inversion needed, but
        // confirmed by name here since a mislabeled key would silently
        // swap which hand's numbers show under which toggle position.
        if (code === 'vl') handSplits.vsL = mapped;
        else if (code === 'vr') handSplits.vsR = mapped;
      }
    }
  } catch (e) {
    console.error('[BatterSplits] Fatal:', e.message);
  }

  return res.status(200).json({ found: true, pid: batterId, handSplits });
}

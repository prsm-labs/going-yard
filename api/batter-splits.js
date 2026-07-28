// api/batter-splits.js
// Batter's own season hitting stats vs LHP / vs RHP, and Home / Away —
// same pattern as the vs-LHB/vs-RHB addition to api/pitcher.js (2026-07-28),
// mirrored for the batter slideout. New standalone file rather than an
// extension, since no existing endpoint already covers a batter's own live
// season stats (the "Statcast Profile" section in AtBatSlideIn reads from
// the static PLAYER_DATA_CACHE/players.json instead — this endpoint only
// supplies the splits that cache doesn't have).
//
// Same MLB Stats API shape as the pitching-side splits, just group=hitting.
// Field names verified against a real live pull before shipping (José
// Ramírez, 608070, 2026): avg/obp/slg/ops/homeRuns/atBats/plateAppearances/
// hits/rbi/strikeOuts/baseOnBalls/doubles/triples/babip all present and
// correctly split by hand (vsL 96 PA .313/.396/.566, vsR 236 PA .204/.311/.338).
//
// Home/Away sitCode gotcha (2026-07-28, caught before shipping): the naive
// guess "sitCodes=h,r" does NOT return home/road — 'r' resolves to
// "Batting Right" (a platoon split reusing the same letter), silently
// returning the wrong data with no error. Confirmed live: the correct pair
// is "h,a" ('h'=Home Games, 'a'=Away Games). Verified real split for
// José Ramírez 2026: Home .257/.366/.404 (4 HR, 165 PA), Away .216/.305/.405
// (6 HR, 167 PA).

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
  if (!batterId) return res.status(200).json({
    found: false, handSplits: { vsL: null, vsR: null }, homeAwaySplits: { home: null, away: null },
  });

  const handSplits = { vsL: null, vsR: null };
  const homeAwaySplits = { home: null, away: null };

  const [rHand, rHomeAway] = await Promise.allSettled([
    fetch(`https://statsapi.mlb.com/api/v1/people/${batterId}/stats?stats=statSplits&group=hitting&sitCodes=vl,vr&season=${year}&sportId=1`, { headers: H }),
    fetch(`https://statsapi.mlb.com/api/v1/people/${batterId}/stats?stats=statSplits&group=hitting&sitCodes=h,a&season=${year}&sportId=1`, { headers: H }),
  ]);

  try {
    if (rHand.status === 'fulfilled' && rHand.value.ok) {
      const d = await rHand.value.json();
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
    console.error('[BatterSplits] Hand fetch fatal:', e.message);
  }

  try {
    if (rHomeAway.status === 'fulfilled' && rHomeAway.value.ok) {
      const d = await rHomeAway.value.json();
      for (const split of (d.stats?.[0]?.splits || [])) {
        const code = split.split?.code || '';
        const mapped = mapHittingStat(split.stat);
        if (code === 'h') homeAwaySplits.home = mapped;
        else if (code === 'a') homeAwaySplits.away = mapped;
      }
    }
  } catch (e) {
    console.error('[BatterSplits] Home/Away fetch fatal:', e.message);
  }

  return res.status(200).json({ found: true, pid: batterId, handSplits, homeAwaySplits });
}

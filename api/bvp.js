// api/bvp.js
// Batter vs Pitcher career history — MLB Stats API vsPlayer endpoint
// Tries two URL formats since MLB API can be inconsistent

const CACHE = {};
const TTL = 4 * 60 * 60 * 1000;
const H = { 'User-Agent': 'Mozilla/5.0 (compatible)', 'Accept': 'application/json' };

async function fetchBvP(batterId, pitcherId) {
  const k = `${batterId}_${pitcherId}`;
  if (CACHE[k] && (Date.now() - CACHE[k].ts) < TTL) return CACHE[k].data;

  // Normalize IDs (strip float suffix "123456.0" → "123456")
  const bid = String(parseInt(batterId) || batterId);
  const pid = String(parseInt(pitcherId) || pitcherId);

  const EMPTY = { pa:0, ab:0, h:0, hr:0, b1:0, b2:0, b3:0, bb:0, k:0, sb:0,
                  avg:'—', obp:'—', slg:'—', _debug: '' };

  try {
    // Primary: people/{id}/stats endpoint
    const url1 = `https://statsapi.mlb.com/api/v1/people/${bid}/stats` +
      `?stats=vsPlayer&opposingPlayerId=${pid}&group=hitting&sportId=1&gameType=R`;

    const r1 = await fetch(url1, { headers: H, signal: AbortSignal.timeout(7000) });
    if (!r1.ok) {
      console.warn(`[BvP] ${bid} vs ${pid}: HTTP ${r1.status} on primary URL`);
      // Try alternate URL format
      const url2 = `https://statsapi.mlb.com/api/v1/stats` +
        `?stats=vsPlayer&playerId=${bid}&opposingPlayerId=${pid}&group=hitting&sportId=1&gameType=R`;
      const r2 = await fetch(url2, { headers: H, signal: AbortSignal.timeout(7000) });
      if (!r2.ok) throw new Error(`Both URLs failed: ${r1.status}, ${r2.status}`);
      const d2 = await r2.json();
      const s2 = d2.stats?.[0]?.splits?.[0]?.stat;
      console.log(`[BvP] Alt URL result for ${bid} vs ${pid}: PA=${s2?.plateAppearances}`);
      if (!s2?.plateAppearances) { CACHE[k] = { data: EMPTY, ts: Date.now() }; return EMPTY; }
      return buildResult(s2, k);
    }

    const d = await r1.json();
    const s = d.stats?.[0]?.splits?.[0]?.stat;
    console.log(`[BvP] ${bid} vs ${pid}: PA=${s?.plateAppearances} H=${s?.hits}`);

    if (!s?.plateAppearances) {
      CACHE[k] = { data: EMPTY, ts: Date.now() };
      return EMPTY;
    }
    return buildResult(s, k);

  } catch(e) {
    console.error(`[BvP] ${bid} vs ${pid}: ${e.message}`);
    CACHE[k] = { data: { ...EMPTY, _debug: e.message }, ts: Date.now() };
    return EMPTY;
  }
}

function buildResult(s, k) {
  const h  = parseInt(s.hits        || 0);
  const hr = parseInt(s.homeRuns    || 0);
  const b2 = parseInt(s.doubles     || 0);
  const b3 = parseInt(s.triples     || 0);
  const result = {
    pa:  parseInt(s.plateAppearances || 0),
    ab:  parseInt(s.atBats           || 0),
    h, hr, b2, b3,
    b1:  Math.max(0, h - hr - b2 - b3),
    bb:  parseInt(s.baseOnBalls      || 0),
    k:   parseInt(s.strikeOuts       || 0),
    sb:  parseInt(s.stolenBases      || 0),
    avg: s.avg  || '—',
    obp: s.obp  || '—',
    slg: s.slg  || '—',
  };
  CACHE[k] = { data: result, ts: Date.now() };
  return result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { batter, batters, pitcher, debug } = req.query;
  if (!pitcher) return res.status(400).json({ error: 'pitcher param required' });

  // Debug mode — show raw API response
  if (debug && batter) {
    const bid = String(parseInt(batter)||batter);
    const pid = String(parseInt(pitcher)||pitcher);
    try {
      const url = `https://statsapi.mlb.com/api/v1/people/${bid}/stats` +
        `?stats=vsPlayer&opposingPlayerId=${pid}&group=hitting&sportId=1&gameType=R`;
      const r = await fetch(url, { headers: H });
      const d = await r.json();
      return res.status(200).json({ url, status: r.status, raw: d });
    } catch(e) { return res.status(200).json({ error: e.message }); }
  }

  if (batter) {
    const data = await fetchBvP(batter, pitcher);
    return res.status(200).json({ batter, pitcher, ...data });
  }

  if (batters) {
    const ids = batters.split(',').map(s => s.trim()).filter(Boolean).slice(0, 20);
    const results = await Promise.all(
      ids.map(async bid => ({ batter: bid, ...(await fetchBvP(bid, pitcher)) }))
    );
    return res.status(200).json({ pitcher, results });
  }

  return res.status(400).json({ error: 'batter or batters param required' });
}

// api/player-search.js
// Free-text player search for the BvP Machine — any batter or pitcher,
// not limited to today's slate. Proxies MLB Stats API people/search
// (server-side to sidestep any CORS/rate quirks, same pattern as bvp.js).

const CACHE = {};
const TTL = 6 * 60 * 60 * 1000; // names/teams don't change intra-day
const H = { 'User-Agent': 'Mozilla/5.0 (compatible)', 'Accept': 'application/json' };

const TEAM_ID_TO_ABBR = {
  108:'LAA',109:'AZ',110:'BAL',111:'BOS',112:'CHC',113:'CIN',
  114:'CLE',115:'COL',116:'DET',117:'HOU',118:'KC', 119:'LAD',
  120:'WSH',121:'NYM',133:'ATH',134:'PIT',135:'SD', 136:'SEA',
  137:'SF', 138:'STL',139:'TB', 140:'TEX',141:'TOR',142:'MIN',
  143:'PHI',144:'ATL',145:'CWS',146:'MIA',147:'NYY',158:'MIL',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, type } = req.query; // type: 'batter' | 'pitcher' | undefined (any)
  if (!q || q.trim().length < 2) return res.status(200).json({ results: [] });

  const key = `${q.trim().toLowerCase()}_${type || 'all'}`;
  const cached = CACHE[key];
  if (cached && (Date.now() - cached.ts) < TTL) return res.status(200).json(cached.data);

  try {
    const url = `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(q.trim())}&sportId=1`;
    const r = await fetch(url, { headers: H, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return res.status(200).json({ results: [] });
    const d = await r.json();

    let results = (d.people || [])
      .filter(p => p.active !== false) // keep unknown-active too, only drop explicit false
      .map(p => ({
        id:      p.id,
        name:    p.fullName,
        team:    TEAM_ID_TO_ABBR[p.currentTeam?.id] || '',
        teamId:  p.currentTeam?.id || null,
        pos:     p.primaryPosition?.abbreviation || '',
        isPitcher: p.primaryPosition?.type === 'Pitcher',
        bats:    p.batSide?.code   || '',
        throws:  p.pitchHand?.code || '',
      }));

    if (type === 'pitcher') results = results.filter(p => p.isPitcher);
    if (type === 'batter')  results = results.filter(p => !p.isPitcher);

    // Prefer players with a current team (rules out long-retired name collisions)
    results.sort((a, b) => (b.teamId ? 1 : 0) - (a.teamId ? 1 : 0));
    results = results.slice(0, 15);

    const data = { results };
    CACHE[key] = { data, ts: Date.now() };
    return res.status(200).json(data);
  } catch (e) {
    console.error('[player-search]', e.message);
    return res.status(200).json({ results: [] });
  }
}

// api/allstar.js
// All-Star Week — Game, Rosters, History, and HR Derby. Fully year-agnostic:
// no hardcoded years, venues, player IDs, or gamePks anywhere in this file.
//
// All-Star Game: discovered fresh each call via /schedule?gameType=A&season={season}
// — MLB always returns exactly one game for that query, whatever the year.
//
// HR Derby: has NO gamePk and NO presence in the schedule API at all (confirmed
// via direct testing, July 2026) — but MLB's own Gameday Derby webapp resolves
// a distinct "non-game event" ID from a small, stable, unauthenticated config
// file that MLB republishes each year at the SAME url (confirmed via Wayback
// Machine archives back to 2022): config.defaultPk is that year's Derby ID,
// which then unlocks a real, rich bracket/live-scoring API. This is NOT part
// of MLB's documented Stats API — same risk category as the HR Tracker's
// existing video-highlight matching (api/homeruns.js), which also depends on
// an undocumented MLB endpoint. Fails gracefully (derby: null) if MLB changes
// or removes either piece.
const DERBY_CONFIG_URL = 'https://prod-gameday.mlbstatic.com/home-run-derby-assets/2.0.0/configs/config.json';
const UA = { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } };

async function fetchAllStarGame(season) {
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&gameType=A&season=${season}`;
  const res = await fetch(url, UA);
  if (!res.ok) return null;
  const data = await res.json();
  const game = data?.dates?.[0]?.games?.[0] || null;
  if (!game) return null;
  return {
    gamePk: game.gamePk,
    gameDate: game.gameDate,
    officialDate: game.officialDate,
    status: game.status?.detailedState || 'Unknown',
    abstractState: game.status?.abstractGameState || 'Preview',
    venue: { id: game.venue?.id || null, name: game.venue?.name || 'TBD' },
    teams: {
      away: { id: game.teams?.away?.team?.id, name: game.teams?.away?.team?.name, score: game.teams?.away?.score ?? null },
      home: { id: game.teams?.home?.team?.id, name: game.teams?.home?.team?.name, score: game.teams?.home?.score ?? null },
    },
    isWinner: { away: !!game.teams?.away?.isWinner, home: !!game.teams?.home?.isWinner },
    description: game.description || '',
  };
}

async function fetchRosters(gamePk) {
  const rosters = { away: [], home: [] };
  if (!gamePk) return rosters;
  try {
    const res = await fetch(`https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`, UA);
    if (!res.ok) return rosters;
    const data = await res.json();
    for (const side of ['away', 'home']) {
      const players = data?.teams?.[side]?.players || {};
      rosters[side] = Object.values(players).map(p => ({
        id: p.person?.id || null,
        name: p.person?.fullName || 'Unknown',
        pos: p.position?.abbreviation || '',
        battingOrder: p.battingOrder ? Math.round(p.battingOrder / 100) : null,
        jerseyNumber: p.jerseyNumber || '',
      })).sort((a, b) => (a.battingOrder || 99) - (b.battingOrder || 99));
    }
  } catch (e) {
    console.error('[AllStar] roster fetch failed:', e.message);
  }
  return rosters;
}

async function fetchDerby() {
  try {
    const cfgRes = await fetch(DERBY_CONFIG_URL, UA);
    if (!cfgRes.ok) return null;
    const cfg = await cfgRes.json();
    const derbyPk = cfg?.defaultPk;
    if (!derbyPk) return null;
    const derbyRes = await fetch(`https://statsapi.mlb.com/api/v1/homeRunDerby/${derbyPk}/mixed`, UA);
    if (!derbyRes.ok) return null;
    const d = await derbyRes.json();
    return {
      id: d.info?.id || derbyPk,
      name: d.info?.name || 'Home Run Derby',
      eventDate: d.info?.eventDate || null,
      venue: d.info?.venue || null,
      status: d.status || null,
      rounds: d.rounds || [],
    };
  } catch (e) {
    console.error('[AllStar] derby fetch failed:', e.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const season = parseInt(req.query.season) || new Date().getFullYear();
    const derbyOnly = req.query.derbyOnly === '1';

    // Lightweight path for frequent live-polling during the Derby — skips the
    // schedule + boxscore fetches, which don't change during Derby play.
    if (derbyOnly) {
      const derby = await fetchDerby();
      res.status(200).json({ season, derby });
      return;
    }

    const asg = await fetchAllStarGame(season);
    // config.json's defaultPk is MLB's *current* Derby pointer — it has no
    // historical mode, so it always resolves to THIS year's event regardless
    // of what season was requested. Only fetch it when the requested season
    // actually is the current one; for any past season, derby stays null
    // rather than silently showing the wrong year's bracket.
    const isCurrentSeason = season === new Date().getFullYear();
    const [rosters, derby] = await Promise.all([
      fetchRosters(asg?.gamePk),
      isCurrentSeason ? fetchDerby() : Promise.resolve(null),
    ]);

    console.log(`[AllStar] season=${season} asg=${asg?.gamePk || 'none'} derby=${derby?.id || 'none'} rosters=${rosters.away.length}/${rosters.home.length}`);
    res.status(200).json({ season, asg, rosters, derby });
  } catch (err) {
    console.error('[AllStar] Fatal:', err.message);
    res.status(500).json({ error: err.message });
  }
}

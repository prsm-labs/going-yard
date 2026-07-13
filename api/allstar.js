// api/allstar.js
// All-Star Week — Game, Rosters, History, and HR Derby. Fully year-agnostic:
// no hardcoded years, venues, player IDs, or gamePks anywhere in this file.
//
// All-Star Game: discovered fresh each call via /schedule?gameType=A&season={season}
// — MLB always returns exactly one game for that query, whatever the year.
//
// HR Derby (current year, live): has NO gamePk and NO presence in the schedule
// API at all (confirmed via direct testing, July 2026) — but MLB's own Gameday
// Derby webapp resolves a distinct "non-game event" ID from a small, stable,
// unauthenticated config file MLB republishes each year at the SAME url:
// config.defaultPk is that year's Derby ID, which unlocks a real, rich
// bracket/live-scoring API. Not part of MLB's documented Stats API — same risk
// category as the HR Tracker's existing video-highlight matching, which also
// depends on an undocumented MLB endpoint.
//
// HR Derby (past years): config.json only ever reflects the CURRENT event, no
// historical mode. Past years' IDs are recovered via the Wayback Machine's
// archived snapshots of that same config url (confirmed working back to 2022)
// — an extra, genuinely external dependency (archive.org) on top of MLB's own
// undocumented endpoint. Fails gracefully (derby: null) at every step if any
// of this breaks.
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

// Linescore, attendance/duration, and HR log — all from the one feed/live
// call (confirmed it carries liveData.linescore + gameData.gameInfo + full
// play-by-play, no separate /linescore or extra fetches needed).
async function fetchAllStarGameDetail(gamePk) {
  if (!gamePk) return null;
  try {
    const res = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`, UA);
    if (!res.ok) return null;
    const d = await res.json();
    const ls = d?.liveData?.linescore || null;
    const gi = d?.gameData?.gameInfo || {};
    const plays = d?.liveData?.plays?.allPlays || [];
    const hrLog = plays
      .filter(p => (p.result?.event || '').toLowerCase() === 'home run')
      .map(p => ({
        batterId: p.matchup?.batter?.id || null,
        batterName: p.matchup?.batter?.fullName || 'Unknown',
        inning: p.about?.inning || null,
        halfInning: p.about?.halfInning || '',
        rbi: p.result?.rbi ?? null,
      }));
    return {
      innings: ls?.innings || [],
      teamTotals: ls?.teams || null,
      attendance: gi.attendance ?? null,
      firstPitch: gi.firstPitch || null,
      durationMinutes: gi.gameDurationMinutes ?? null,
      hrLog,
    };
  } catch (e) {
    console.error('[AllStar] game detail fetch failed:', e.message);
    return null;
  }
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
        // Real MLB team (not "AL"/"NL") — client maps this id to an
        // abbreviation via its existing TEAM_ID_TO_ABBR constant.
        parentTeamId: p.parentTeamId || null,
      })).sort((a, b) => (a.battingOrder || 99) - (b.battingOrder || 99));
    }
  } catch (e) {
    console.error('[AllStar] roster fetch failed:', e.message);
  }
  return rosters;
}

async function fetchDerbyBracket(derbyPk) {
  if (!derbyPk) return null;
  try {
    const res = await fetch(`https://statsapi.mlb.com/api/v1/homeRunDerby/${derbyPk}/mixed`, UA);
    if (!res.ok) return null;
    const d = await res.json();
    return {
      id: d.info?.id || derbyPk,
      name: d.info?.name || 'Home Run Derby',
      eventDate: d.info?.eventDate || null,
      venue: d.info?.venue || null,
      status: d.status || null,
      rounds: d.rounds || [],
    };
  } catch (e) {
    console.error('[AllStar] derby bracket fetch failed:', e.message);
    return null;
  }
}

async function fetchCurrentDerbyPk() {
  try {
    const res = await fetch(DERBY_CONFIG_URL, UA);
    if (!res.ok) return null;
    const cfg = await res.json();
    return cfg?.defaultPk || null;
  } catch (e) {
    console.error('[AllStar] current derby config fetch failed:', e.message);
    return null;
  }
}

// Historical Derby ID recovery via Wayback Machine — genuinely external
// dependency (archive.org), separate from MLB's own infrastructure. Scopes
// the CDX search to July of the requested season (Derby is always mid-July)
// and takes the last snapshot in that window, which in every year checked
// (2022-2025) was captured shortly AFTER that year's Derby concluded.
// archive.org rate-limits or hiccups occasionally under normal use (observed
// directly during testing — isolated requests succeeded every time, but rapid
// back-to-back calls sometimes got an HTML error page instead of JSON). Two
// retries with a short backoff smooths over that without masking a genuine
// structural failure (e.g. no snapshot existing for that year at all).
async function fetchJsonWithRetry(url, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url, UA);
      if (r.ok) return await r.json();
    } catch (e) { /* fall through to retry */ }
    if (i < attempts - 1) await new Promise(r => setTimeout(r, 400 * (i + 1)));
  }
  return null;
}

async function fetchHistoricalDerbyPk(season) {
  const cdxUrl = `http://web.archive.org/cdx/search/cdx?url=prod-gameday.mlbstatic.com/home-run-derby-assets/2.0.0/configs/config.json&output=json&from=${season}0701&to=${season}0801&limit=10`;
  const rows = await fetchJsonWithRetry(cdxUrl);
  if (!Array.isArray(rows) || rows.length < 2) return null; // rows[0] is the CDX header row
  const timestamp = rows[rows.length - 1][1];
  // "id_" forces Wayback's raw, unwrapped replay — without it, the same URL
  // intermittently returns an HTML "Wayback Machine" toolbar page instead of
  // the actual archived JSON (confirmed directly: same exact URL returned
  // clean JSON once and an HTML wrapper moments later with no code change —
  // a real service-side inconsistency, not a fluke). id_ was reliable in
  // every retest.
  const archivedUrl = `http://web.archive.org/web/${timestamp}id_/https://prod-gameday.mlbstatic.com/home-run-derby-assets/2.0.0/configs/config.json`;
  const cfg = await fetchJsonWithRetry(archivedUrl);
  return cfg?.defaultPk || null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const season = parseInt(req.query.season) || new Date().getFullYear();
    const derbyOnly = req.query.derbyOnly === '1';
    const isCurrentSeason = season === new Date().getFullYear();

    // Lightweight path for frequent live-polling during the Derby — skips the
    // schedule + boxscore + game-detail fetches, which don't change during
    // Derby play. Always resolves the current-year config (live polling only
    // makes sense for the event happening right now).
    if (derbyOnly) {
      const derbyPk = await fetchCurrentDerbyPk();
      const derby = await fetchDerbyBracket(derbyPk);
      res.status(200).json({ season, derby });
      return;
    }

    const asg = await fetchAllStarGame(season);
    const [rosters, gameDetail, derbyPk] = await Promise.all([
      fetchRosters(asg?.gamePk),
      fetchAllStarGameDetail(asg?.gamePk),
      isCurrentSeason ? fetchCurrentDerbyPk() : fetchHistoricalDerbyPk(season),
    ]);
    const derby = await fetchDerbyBracket(derbyPk);
    if (asg && gameDetail) Object.assign(asg, { detail: gameDetail });

    console.log(`[AllStar] season=${season} asg=${asg?.gamePk || 'none'} derby=${derby?.id || 'none'} rosters=${rosters.away.length}/${rosters.home.length}`);
    res.status(200).json({ season, asg, rosters, derby });
  } catch (err) {
    console.error('[AllStar] Fatal:', err.message);
    res.status(500).json({ error: err.message });
  }
}

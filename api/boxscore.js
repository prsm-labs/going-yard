// api/boxscore.js — MLB game boxscore + live feed Statcast proxy
// Fetches both boxscore AND live feed play-by-play server-side
// Avoids CORS issues with direct browser calls to statsapi.mlb.com
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const { gamePk } = req.query;
    if (!gamePk) return res.status(400).json({ error: 'gamePk required' });

    const headers = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' };

    // Fetch boxscore and live feed in parallel
    const [boxRes, liveRes] = await Promise.all([
      fetch(`https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`, { headers }),
      fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`, { headers }),
    ]);

    if (!boxRes.ok) throw new Error(`Boxscore ${boxRes.status}`);
    const boxData = await boxRes.json();

    // Parse live feed for Statcast hitData per batter
    // Returns map: batterId → { evs, las, distances, hardHits, barrels, atBats[] }
    const statcastByBatter = {};

    let currentBatterId = null;
    let onDeckId        = null;
    let inTheHoleId     = null;
    let linescore       = null;
    let lastPlay        = null;
    let lineupHome      = [];
    let lineupAway      = [];

    if (liveRes.ok) {
      const liveData = await liveRes.json();
      const plays    = liveData?.liveData?.plays?.allPlays || [];

      // ── Linescore (base runners, inning, outs, score) ──────────
      linescore = liveData?.liveData?.linescore || null;

      // ── Current batter / on-deck / in-the-hole ─────────────────
      const offense = linescore?.offense || {};
      currentBatterId = offense.batter?.id || null;
      onDeckId        = offense.onDeck?.id  || null;
      inTheHoleId     = offense.inHole?.id  || null;

      // ── Active lineup arrays (used to detect subbed-out players) ─
      const boxTeams = liveData?.liveData?.boxscore?.teams || {};
      lineupHome = (boxTeams.home?.battingOrder || []).map(id => Number(id));
      lineupAway = (boxTeams.away?.battingOrder || []).map(id => Number(id));

      // ── Last completed play (for live at-bat result banner) ──────
      const currentPlay = liveData?.liveData?.plays?.currentPlay;
      if (currentPlay?.result?.event) {
        lastPlay = {
          event:       currentPlay.result.event              || null,
          description: currentPlay.result.description        || null,
          batterId:    currentPlay.matchup?.batter?.id       || null,
          batterName:  currentPlay.matchup?.batter?.fullName || null,
        };
      }

      // ── Statcast per batter ─────────────────────────────────────
      for (const play of plays) {
        const batterId    = play.matchup?.batter?.id;
        const pitcherName = play.matchup?.pitcher?.fullName || null;
        if (!batterId) continue;

        if (!statcastByBatter[batterId]) {
          statcastByBatter[batterId] = {
            evs: [], las: [], distances: [],
            hardHits: 0, barrels: 0,
            atBats: [],
          };
        }

        const sc = statcastByBatter[batterId];
        const result     = play.result?.event || play.result?.description || null;
        const inning     = play.about?.inning      || null;
        const halfInning = play.about?.halfInning   || null;

        let ev = null, la = null, dist = null, pitchType = null;

        for (const evt of (play.playEvents || [])) {
          if (evt.details?.type?.code) {
            pitchType = evt.details.type.description || evt.details.type.code;
          }

          const hd = evt.hitData;
          if (!hd?.launchSpeed) continue;

          ev   = parseFloat(hd.launchSpeed   || 0) || null;
          la   = parseFloat(hd.launchAngle   || 0);
          dist = parseFloat(hd.totalDistance || 0) || null;

          if (!ev || ev <= 0) { ev = null; continue; }

          sc.evs.push(ev);
          sc.las.push(la);
          if (dist > 0) sc.distances.push(dist);
          if (ev >= 95) sc.hardHits++;

          const barrel =
            (ev >= 116) ||
            (ev >= 110 && la >= 18 && la <= 42) ||
            (ev >= 105 && la >= 22 && la <= 38) ||
            (ev >= 103 && la >= 24 && la <= 36) ||
            (ev >= 101 && la >= 25 && la <= 35) ||
            (ev >= 99  && la >= 25 && la <= 33) ||
            (ev >= 98  && la >= 26 && la <= 30);
          if (barrel) sc.barrels++;
        }

        if (result) {
          sc.atBats.push({
            result, inning, halfInning, pitcherName, pitchType,
            ev:   ev   ? Math.round(ev * 10) / 10 : null,
            la:   ev   ? Math.round(la * 10) / 10 : null,
            dist: dist ? Math.round(dist)          : null,
          });
        }
      }
    }

    console.log(`[Boxscore] gamePk=${gamePk} | Statcast batters: ${Object.keys(statcastByBatter).length}`);

    res.status(200).json({
      ...boxData,
      statcastByBatter,
      currentBatterId,
      onDeckId,
      inTheHoleId,
      linescore,
      lastPlay,
      // Attach active lineup arrays to each team so front-end can detect subs
      teams: {
        ...(boxData.teams || {}),
        home: { ...(boxData.teams?.home || {}), lineup: lineupHome },
        away: { ...(boxData.teams?.away || {}), lineup: lineupAway },
      },
    });

  } catch (err) {
    console.error('[Boxscore] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

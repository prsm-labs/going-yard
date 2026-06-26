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
    // Returns map: batterId → { evs, las, distances, hardHits, barrels, atBats[], closeCalls }
    const statcastByBatter = {};
    const statcastByPitcher = {};

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

      // ── Truly-current pitcher (Spec 3 fix) ───────────────────────
      // sc.currentPitcherId (set per-batter below) only reflects who THAT
      // SPECIFIC batter last faced, which goes stale for the rest of the
      // lineup the moment a pitching change happens but before they bat
      // again. currentPlay always reflects the actual live state, so it's
      // the reliable source for "who is pitching right now" — applied to
      // every batter on the offense's team in the API response below,
      // not looked up per-batter from history.
      const liveCurrentPitcherId   = currentPlay?.matchup?.pitcher?.id     || null;
      const liveCurrentPitcherName = currentPlay?.matchup?.pitcher?.fullName || null;
      // isTopInning tells us which side is batting (away bats top, home bats bottom)
      const offenseIsAway = currentPlay?.about?.isTopInning ?? null;

      // ── Statcast per batter AND per pitcher ─────────────────────
      for (const play of plays) {
        const batterId    = play.matchup?.batter?.id;
        const pitcherId    = play.matchup?.pitcher?.id;
        const pitcherName = play.matchup?.pitcher?.fullName || null;
        if (!batterId) continue;

        if (!statcastByBatter[batterId]) {
          statcastByBatter[batterId] = {
            evs: [], las: [], distances: [],
            hardHits: 0, barrels: 0,
            atBats: [],
            // ── Close call tracking ──────────────────────────────
            // Non-HR batted balls: EV≥98, LA 18-35°, dist≥350ft
            // Collected server-side so data persists after game ends
            closeCalls: 0, ccMaxEV: 0, ccMaxDist: 0,
            // ── Form inputs (Spec 3) ──────────────────────────────
            pitchesSeen: 0, swings: 0, chases: 0, zonePitches: 0,
            calledStrikes: 0, swingingStrikes: 0, fouls: 0,
            trajectories: { ground_ball:0, fly_ball:0, line_drive:0, popup:0 },
            hardnessOnHard: { soft:0, medium:0, hard:0 }, // hardness tag on EV>=95 contact only
          };
        }
        if (pitcherId && !statcastByPitcher[pitcherId]) {
          statcastByPitcher[pitcherId] = {
            name: pitcherName, evsAllowed: [], hardHitsAllowed: 0, barrelsAllowed: 0,
            outsOnHardHit: 0, hitsOnHardHit: 0, // Spec 3 open Q1: hard contact crossed with result
            pitchesThrown: 0, whiffs: 0, strikeouts: 0, calledStrikes: 0, fouls: 0,
            fbVelos: [], // fastball-only velocity this game (FF/SI/FC) — Spec 3 open Q2 (within-pitch-type)
            battersFaced: new Set(),
          };
        }

        const sc = statcastByBatter[batterId];
        const pc = pitcherId ? statcastByPitcher[pitcherId] : null;
        if (pc) pc.battersFaced.add(batterId);

        const result     = play.result?.event || play.result?.description || null;
        const inning     = play.about?.inning      || null;
        const halfInning = play.about?.halfInning   || null;
        const isHR       = (play.result?.event || '').toLowerCase() === 'home_run';
        const isK        = (play.result?.event || '').toLowerCase().includes('strikeout');
        if (isK && pc) pc.strikeouts++;

        let ev = null, la = null, dist = null, pitchType = null, trajectory = null, hardness = null;

        for (const evt of (play.playEvents || [])) {
          if (!evt.isPitch) continue;
          const det = evt.details || {};
          if (det.type?.code) pitchType = det.type.code;

          // ── Pitch-call counting (Form inputs) ───────────────────
          sc.pitchesSeen++;
          if (pc) pc.pitchesThrown++;
          const isFastball = ['FF','SI','FC'].includes(det.type?.code);
          const startSpeed = evt.pitchData?.startSpeed;
          if (pc && isFastball && startSpeed) pc.fbVelos.push(parseFloat(startSpeed));

          const zoneNum = evt.pitchData?.zone;
          const inZone  = (zoneNum != null) ? (zoneNum <= 9) : null; // mirrors matchup_engine.py rule: zone>=11 is out
          if (inZone !== null) sc.zonePitches += inZone ? 1 : 0;

          const swung = det.isInPlay || (det.description||'').toLowerCase().includes('swinging') || (det.description||'').toLowerCase().includes('foul');
          if (swung) {
            sc.swings++;
            if (inZone === false) sc.chases++;
          }
          if ((det.description||'') === 'Called Strike') { sc.calledStrikes++; if (pc) pc.calledStrikes++; }
          if ((det.description||'').toLowerCase().includes('swinging strike')) { sc.swingingStrikes++; if (pc) pc.whiffs++; }
          if ((det.description||'').toLowerCase().includes('foul') && !det.isInPlay) { sc.fouls++; if (pc) pc.fouls++; }

          const hd = evt.hitData;
          if (!hd?.launchSpeed) continue;

          ev   = parseFloat(hd.launchSpeed   || 0) || null;
          la   = parseFloat(hd.launchAngle   || 0);
          dist = parseFloat(hd.totalDistance || 0) || null;
          trajectory = hd.trajectory || null;
          hardness   = hd.hardness   || null;

          if (!ev || ev <= 0) { ev = null; continue; }

          sc.evs.push(ev);
          sc.las.push(la);
          if (dist > 0) sc.distances.push(dist);
          if (trajectory && sc.trajectories[trajectory] !== undefined) sc.trajectories[trajectory]++;
          if (ev >= 95) {
            sc.hardHits++;
            if (hardness && sc.hardnessOnHard[hardness] !== undefined) sc.hardnessOnHard[hardness]++;
          }
          if (pc) {
            pc.evsAllowed.push(ev);
            if (ev >= 95) {
              pc.hardHitsAllowed++;
              // Spec 3 open Q1: cross hard contact against the actual play result
              const wasOut = !!(play.result?.isOut);
              if (wasOut) pc.outsOnHardHit++; else pc.hitsOnHardHit++;
            }
          }

          const barrel =
            (ev >= 116) ||
            (ev >= 110 && la >= 18 && la <= 42) ||
            (ev >= 105 && la >= 22 && la <= 38) ||
            (ev >= 103 && la >= 24 && la <= 36) ||
            (ev >= 101 && la >= 25 && la <= 35) ||
            (ev >= 99  && la >= 25 && la <= 33) ||
            (ev >= 98  && la >= 26 && la <= 30);
          if (barrel) { sc.barrels++; if (pc) pc.barrelsAllowed++; }

          // ── Close call detection ─────────────────────────────────
          // Same criteria as LIVE_CC_MAP in App.jsx — computed here
          // server-side so it survives game finalization
          if (!isHR && ev >= 98 && la >= 18 && la <= 35 && dist >= 350) {
            sc.closeCalls++;
            if (ev   > sc.ccMaxEV)   sc.ccMaxEV   = ev;
            if (dist > sc.ccMaxDist) sc.ccMaxDist = dist;
          }
        }

        if (result) {
          sc.atBats.push({
            result, inning, halfInning, pitcherName, pitcherId: pitcherId || null, pitchType,
            ev:   ev   ? Math.round(ev * 10) / 10 : null,
            la:   ev   ? Math.round(la * 10) / 10 : null,
            dist: dist ? Math.round(dist)          : null,
          });
        }
        // NOTE: this per-batter currentPitcherId reflects who THIS BATTER last
        // faced — accurate for him, but goes stale for teammates who haven't
        // batted since a pitching change. Use liveCurrentPitcherId (below) for
        // "who is pitching right now" instead — see fix note above.
        if (pitcherId) sc.currentPitcherId = pitcherId;
      }
    }

    // Sets don't survive JSON.stringify — convert battersFaced to a count
    const statcastByPitcherOut = {};
    for (const [pid, p] of Object.entries(statcastByPitcher)) {
      statcastByPitcherOut[pid] = { ...p, battersFacedCount: p.battersFaced.size, battersFaced: undefined };
    }

    console.log(`[Boxscore] gamePk=${gamePk} | Statcast batters: ${Object.keys(statcastByBatter).length} | pitchers: ${Object.keys(statcastByPitcher).length}`);

    res.status(200).json({
      ...boxData,
      statcastByBatter,
      statcastByPitcher: statcastByPitcherOut,
      liveCurrentPitcherId,
      liveCurrentPitcherName,
      offenseIsAway,    // true = away team batting (home team pitching), false = home batting
      currentBatterId,
      onDeckId,
      inTheHoleId,
      liveLinescore: linescore,   // renamed to avoid collision with boxscore's own linescore
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

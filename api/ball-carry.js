// api/ball-carry.js — live in-game "dead ball / juiced ball" tracker
//
// Physics basis: holding Exit Velocity and Launch Angle fixed, a batted
// ball's carry distance should be predictable. If actual distance
// deviates significantly from that EV/LA-implied expected distance,
// the ball itself is the most likely explanation — not the swing.
//
// Deliberately does NOT use temperature or wind in the DEAD/JUICED
// classification — weather changes throughout a game and is noisy at
// single-game granularity (see CLAUDE.md ball carry research,
// 2026-07-22). Elevation IS accounted for, via PARK_CARRY_BASELINE
// below (each park's own seasonal mean deviation, subtracted before
// classifying) — this is what stops a high-altitude park like Coors
// from reading as "juiced" on every single game purely from altitude.
//
// CARRY_COEFFS / PARK_CARRY_BASELINE / thresholds below are a
// periodically-refreshed SNAPSHOT (validated against the full 2026
// season AB log, 2026-07-22 — see output/ball_carry_research/ and
// output/ball_carry_by_game.csv). They are NOT auto-generated — re-run
// ball_carry_tracker.py and update these constants by hand if the
// printed reference values drift meaningfully as the season progresses.

const CARRY_COEFFS = [-428.26623, 4.91685, 20.61916, -0.00624, -0.35935, 0.02836];
// [intercept, EV, LA, EV^2, LA^2, EV*LA]

// Home park -> that park's own seasonal mean carry deviation (ft), used
// to park/altitude-adjust before classifying. Snapshot from 2026-07-22.
const PARK_CARRY_BASELINE = {
  COL: 20.18, KC: 12.73, TEX: 11.59, ATH: 11.36, MIL: 9.61, AZ: 9.33,
  TB: 8.67, SF: 8.56, MIA: 8.37, DET: 7.46, TOR: 7.37, ATL: 7.22,
  PHI: 6.32, WSH: 6.16, STL: 4.70, BOS: 3.82, LAD: 3.80, SEA: 3.36,
  MIN: 3.36, PIT: 3.29, CHC: 1.89, BAL: 1.46, NYY: 0.82, HOU: 0.81,
  CIN: 0.24, CLE: 0.13, SD: -1.86, NYM: -1.95, CWS: -2.18, LAA: -2.23,
};

const DEAD_THRESHOLD_FT   = -12.1; // park-adjusted deviation <= this -> DEAD
const JUICED_THRESHOLD_FT = 11.9;  // park-adjusted deviation >= this -> JUICED
const MIN_BALLS_LIVE = 3;          // fewer than this -> not enough data yet

function expectedCarry(ev, la) {
  const c = CARRY_COEFFS;
  return c[0] + c[1]*ev + c[2]*la + c[3]*ev*ev + c[4]*la*la + c[5]*ev*la;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const { gamePk } = req.query;
    if (!gamePk) return res.status(400).json({ error: 'gamePk required' });

    const feed = await fetch(
      `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
    ).then(r => r.json());

    const homeAbbr = feed?.gameData?.teams?.home?.abbreviation || null;
    const awayAbbr = feed?.gameData?.teams?.away?.abbreviation || null;
    const venue    = feed?.gameData?.venue?.name || null;
    const plays = feed?.liveData?.plays?.allPlays || [];

    // hitData lives on playEvents[i].hitData (the event where contact was
    // made), NOT on the play object directly — confirmed 2026-07-22 against
    // Going Yard's own working api/boxscore.js and api/homeruns.js, which
    // already parse it correctly this way.
    const balls = [];
    for (const play of plays) {
      let hd = null;
      for (const evt of (play.playEvents || [])) {
        if (evt?.hitData?.launchSpeed) hd = evt.hitData; // last real contact event in the play
      }
      if (!hd) continue;
      const ev   = parseFloat(hd.launchSpeed || 0);
      const la   = hd.launchAngle;
      const dist = parseFloat(hd.totalDistance || 0);
      const traj = hd.trajectory || '';

      // Quality contact only — same filter as the historical model's
      // per-game aggregation (EV>=95, LA 15-40, dist>=200, fly ball/line drive)
      if (ev < 95 || la == null || la < 15 || la > 40 || dist < 200) continue;
      if (!['fly_ball', 'line_drive'].includes(traj)) continue;

      const exp_dist = expectedCarry(ev, la);
      balls.push({
        batter:    play.matchup?.batter?.fullName || '?',
        inning:    play.about?.inning || 0,
        ev, la, dist,
        exp_dist:  Math.round(exp_dist * 10) / 10,
        deviation: Math.round((dist - exp_dist) * 10) / 10,
        isHR:      play.result?.event === 'Home Run',
      });
    }

    if (balls.length < MIN_BALLS_LIVE) {
      return res.json({
        gamePk, homeAbbr, awayAbbr, venue,
        n: balls.length, status: 'insufficient_data',
        avg_deviation: null, park_adj_deviation: null, verdict: null, balls,
      });
    }

    const avg_dev = balls.reduce((s, b) => s + b.deviation, 0) / balls.length;
    const parkBaseline = homeAbbr != null ? (PARK_CARRY_BASELINE[homeAbbr] ?? 0) : 0;
    const park_adj = avg_dev - parkBaseline;

    let verdict = 'NORMAL';
    if (park_adj <= DEAD_THRESHOLD_FT)   verdict = 'DEAD';
    if (park_adj >= JUICED_THRESHOLD_FT) verdict = 'JUICED';

    return res.json({
      gamePk, homeAbbr, awayAbbr, venue,
      n: balls.length,
      avg_deviation: Math.round(avg_dev * 10) / 10,
      park_baseline_ft: parkBaseline,
      park_adj_deviation: Math.round(park_adj * 10) / 10,
      status: 'ok', verdict, balls,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

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
// Direction (added 2026-07-22): also corrects for batted-ball direction
// (Pull/Center/Oppo). Validated against the full 2026 AB log: Center
// contact carries ~14-17ft farther than Pull or Oppo at the same EV+LA
// (pure backspin vs. sidespin bleed-off from bat-ball collision angle)
// — a real, physically-explicable effect. Without this term, a game's
// small quality-contact sample (3-10 balls) landing unusually
// center-heavy or pull/oppo-heavy by chance produces a false
// DEAD/JUICED verdict unrelated to the ball. Confirmed this flips the
// verdict on 68/1,168 games (5.8%) in the season-to-date validation —
// a real, not cosmetic, correction. Direction is derived from
// hitData.coordinates (MLB Gameday x/y landing spot) + the batter's
// handedness (matchup.batSide.code) — both already in the live feed,
// no extra API call needed. The coordinate-to-angle conversion was
// empirically fit against 321 real batted balls cross-referenced
// against the AB log's own Spray Angle (MAE 1.08 degrees) rather than
// assumed from a public formula.
//
// CARRY_COEFFS / PARK_CARRY_BASELINE / thresholds below are a
// periodically-refreshed SNAPSHOT. They are NOT auto-generated — re-run
// ball_carry_tracker.py and update these constants by hand if the
// printed reference values drift meaningfully as the season progresses.
// Refreshed 2026-07-23 (see CLAUDE.md "Ball Carry live/offline divergence
// fix" session log): coefficients refit fresh against the current AB log
// (barely moved from the 07-22 snapshot — <0.2ft expected-distance effect
// at typical EV/LA); park baselines pulled from today's
// output/ball_carry_by_game.csv.
//
// Known residual (not fixable here): even with the quality-ball filter
// now matching ball_carry_tracker.py exactly (same balls get selected),
// this endpoint's real-time hitData.totalDistance runs ~1-2ft long vs.
// the finalized Statcast Hit Distance that eventually lands in the AB
// log for the SAME batted ball (confirmed 2026-07-23, cross-checked
// ball-by-ball on a real game) — an inherent live-estimate-vs-final-
// reconciled-data gap, not a bug. On a genuinely borderline game (park-
// adj deviation within ~3ft of a threshold) this can still occasionally
// disagree with the offline verdict; it will no longer disagree because
// of counting a different SET of balls, which was the dominant failure
// mode before this fix.

const CARRY_COEFFS = [
  -365.71759, 3.86423, 20.45814, -0.00091, -0.35807, 0.02922, -13.70602, -11.8523,
];
// [intercept, EV, LA, EV^2, LA^2, EV*LA, is_pull, is_oppo] — is_pull/is_oppo
// are relative to Center (the implicit baseline when both are 0).

// Direction band: Spray Angle (post-conversion, see sprayAngleFromCoords)
// empirically centers on ~90 in the 2026 AB log (RHB mean 95.8, LHB mean
// 81.7). +/-10 deg around 90 = "Center"; outside that band, which side
// counts as "Pull" depends on batter hand.
const CENTER_LO = 80, CENTER_HI = 100;

// Home park -> that park's own seasonal mean carry deviation (ft), used
// to park/altitude-adjust before classifying. Refreshed 2026-07-23.
const PARK_CARRY_BASELINE = {
  COL: 19.73, KC: 12.24, ATH: 11.02, TEX: 10.82, MIL: 9.19, AZ: 9.13,
  TB: 8.81, SF: 8.53, MIA: 8.12, DET: 7.15, TOR: 6.93, ATL: 6.77,
  PHI: 6.02, WSH: 5.89, STL: 4.45, LAD: 4.08, MIN: 3.65, BOS: 3.06,
  PIT: 2.97, SEA: 2.48, CHC: 2.26, BAL: 1.58, HOU: 1.37, NYY: 0.57,
  CLE: 0.57, CIN: 0.43, NYM: -1.25, SD: -1.61, CWS: -1.86, LAA: -2.44,
};

const DEAD_THRESHOLD_FT   = -11.8; // park-adjusted deviation <= this -> DEAD
const JUICED_THRESHOLD_FT = 11.7;  // park-adjusted deviation >= this -> JUICED
const MIN_BALLS_LIVE = 3;          // fewer than this -> not enough data yet

function expectedCarry(ev, la, isPull, isOppo) {
  const c = CARRY_COEFFS;
  return c[0] + c[1]*ev + c[2]*la + c[3]*ev*ev + c[4]*la*la + c[5]*ev*la
       + c[6]*(isPull?1:0) + c[7]*(isOppo?1:0);
}

// MLB Gameday coordX/coordY (hitData.coordinates) -> Spray Angle, matching
// the AB log's own precomputed Spray Angle convention. Empirically fit
// 2026-07-22 against 321 real batted balls (coordinates cross-referenced
// to the AB log by Play ID = `${gamePk}_${atBatIndex+1}`): MAE 1.08 deg.
function sprayAngleFromCoords(coordX, coordY) {
  const angleRaw = Math.atan2(coordX - 125, 203.5 - coordY) * (180 / Math.PI);
  return -1.0754 * angleRaw + 90.1427;
}

// Pull / Center / Oppo from Spray Angle + batter handedness. Returns
// 'Center' (neutral, zero adjustment) when inputs are missing.
function classifyDirection(sprayAngle, batHand) {
  if (sprayAngle == null || (batHand !== 'L' && batHand !== 'R')) return 'Center';
  if (sprayAngle >= CENTER_LO && sprayAngle <= CENTER_HI) return 'Center';
  if (batHand === 'R') return sprayAngle > CENTER_HI ? 'Pull' : 'Oppo';
  return sprayAngle < CENTER_LO ? 'Pull' : 'Oppo';
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

      // Quality contact only — must match ball_carry_tracker.py's actual
      // per-game aggregation filter EXACTLY (EV>=95, LA 15-35, dist>=150,
      // no trajectory filter — confirmed 2026-07-23 these two filters had
      // drifted apart: this endpoint was using LA<=40/dist>=200/trajectory-
      // required, none of which match the offline script it's supposed to
      // mirror. That mismatch caused real verdict flips on borderline games
      // — e.g. CHC@DET 2026-07-21 read DEAD offline (7 balls, LA<=35) but
      // NORMAL here (8 balls, a 39° fly ball only admitted under the old
      // LA<=40 cutoff). See CLAUDE.md "Ball Carry live/offline divergence
      // fix" session log.
      if (ev < 95 || la == null || la < 15 || la > 35 || dist < 150) continue;

      const batHand = play.matchup?.batSide?.code || null;
      const coords = hd.coordinates || {};
      const sprayAngle = (coords.coordX != null && coords.coordY != null)
        ? sprayAngleFromCoords(coords.coordX, coords.coordY) : null;
      const direction = classifyDirection(sprayAngle, batHand);
      const isPull = direction === 'Pull';
      const isOppo = direction === 'Oppo';

      const exp_dist = expectedCarry(ev, la, isPull, isOppo);
      balls.push({
        batter:    play.matchup?.batter?.fullName || '?',
        inning:    play.about?.inning || 0,
        ev, la, dist,
        exp_dist:  Math.round(exp_dist * 10) / 10,
        deviation: Math.round((dist - exp_dist) * 10) / 10,
        direction,
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
      // Returned (not hardcoded client-side) so the UI can show margin-to-
      // threshold without duplicating these constants in two places.
      dead_threshold_ft: DEAD_THRESHOLD_FT,
      juiced_threshold_ft: JUICED_THRESHOLD_FT,
      status: 'ok', verdict, balls,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

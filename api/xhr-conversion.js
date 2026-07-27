// api/xhr-conversion.js — live in-game "expected vs actual HR" tracker
//
// Physics basis: unlike ball-carry.js (which holds EV+LA fixed and checks
// whether a ball's *distance* matches what physics predicts), this endpoint
// predicts the actual OUTCOME PROBABILITY — will this specific batted ball
// clear the fence — via a logistic regression fit on every batted ball with
// real Exit Velocity + Launch Angle + direction this season. Summed across a
// game/day, that gives an "expected HR count" directly comparable to the
// actual count. Built 2026-07-26 as the live counterpart to
// xhr_conversion_tracker.py (the offline/batch version that already feeds
// Track Record's "xHR" column) — same model family, same coefficients
// (refit fresh periodically; see that script's own printed reference block).
//
// Deliberately uses ALL batted balls with recorded contact, not just
// "quality" contact (EV>=95 etc, the filter ball-carry.js uses) — the model
// needs to see weak contact too so it correctly predicts near-zero
// probability for grounders/weak pops rather than only ever having seen
// already-good contact. Matches xhr_conversion_tracker.py's own design
// exactly (see that script's header comment).
//
// Verdict uses a z-score (Poisson-binomial variance: sum of p*(1-p) across
// the game's batted balls), not a fixed distance threshold like
// ball-carry.js — same statistically-principled approach as the offline
// tracker, just computed live from whatever balls have landed so far.
//
// XHR_COEFFS below is a periodically-refreshed SNAPSHOT, not auto-generated
// — re-run xhr_conversion_tracker.py and update this array by hand if the
// printed reference coefficients drift meaningfully as the season
// progresses. Refreshed 2026-07-26 (fit on 74,062 batted balls through
// 2026-07-25; in-sample calibration check: actual=3,426 HR vs predicted
// sum=3,428.5 — no gross bias).

// [intercept, EV, LA, EV^2, LA^2, EV*LA, is_pull, is_oppo] — is_pull/is_oppo
// are relative to Center (the implicit baseline when both are 0), same
// convention as ball-carry.js's CARRY_COEFFS.
const XHR_COEFFS = [
  -0.03716138, -0.762706, 0.96950711, 0.00442716, -0.03107505, 0.00972109, 2.54719723, 0.96177523,
];

// Direction band — identical convention to ball-carry.js / xhr_conversion_tracker.py.
const CENTER_LO = 80, CENTER_HI = 100;
const Z_THRESHOLD = 2.0;     // |z| >= this -> DEAD/JUICED (~95% confidence), matches the offline tracker
const MIN_BALLS_LIVE = 5;    // fewer than this -> not enough data yet (offline table uses 10)

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

function xhrProb(ev, la, isPull, isOppo) {
  const c = XHR_COEFFS;
  const z = c[0] + c[1]*ev + c[2]*la + c[3]*ev*ev + c[4]*la*la + c[5]*ev*la
          + c[6]*(isPull?1:0) + c[7]*(isOppo?1:0);
  return sigmoid(z);
}

// MLB Gameday coordX/coordY -> Spray Angle — same empirically-fit conversion
// as ball-carry.js (MAE 1.08 deg against 321 real cross-referenced balls).
function sprayAngleFromCoords(coordX, coordY) {
  const angleRaw = Math.atan2(coordX - 125, 203.5 - coordY) * (180 / Math.PI);
  return -1.0754 * angleRaw + 90.1427;
}

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

    // hitData lives on playEvents[i].hitData — same confirmed pattern as
    // ball-carry.js / boxscore.js / homeruns.js.
    const balls = [];
    for (const play of plays) {
      let hd = null;
      for (const evt of (play.playEvents || [])) {
        if (evt?.hitData?.launchSpeed) hd = evt.hitData;
      }
      if (!hd) continue;
      const ev   = parseFloat(hd.launchSpeed);
      const la   = hd.launchAngle;
      const dist = hd.totalDistance;
      // No quality filter — see header comment. Only require the three
      // fields the model actually needs to exist.
      if (!Number.isFinite(ev) || la == null || dist == null) continue;

      const batHand = play.matchup?.batSide?.code || null;
      const coords = hd.coordinates || {};
      const sprayAngle = (coords.coordX != null && coords.coordY != null)
        ? sprayAngleFromCoords(coords.coordX, coords.coordY) : null;
      const direction = classifyDirection(sprayAngle, batHand);
      const isPull = direction === 'Pull';
      const isOppo = direction === 'Oppo';

      const prob = xhrProb(ev, la, isPull, isOppo);
      const isHR = play.result?.event === 'Home Run';
      balls.push({
        batter:    play.matchup?.batter?.fullName || '?',
        inning:    play.about?.inning || 0,
        ev, la, dist, direction,
        xhr_prob:  Math.round(prob * 1000) / 1000,
        isHR,
      });
    }

    if (balls.length < MIN_BALLS_LIVE) {
      return res.json({
        gamePk, homeAbbr, awayAbbr, venue,
        n: balls.length, status: 'insufficient_data',
        actual_hr: null, expected_hr: null, z: null, verdict: null, balls,
      });
    }

    const actual_hr   = balls.filter(b => b.isHR).length;
    const expected_hr = balls.reduce((s, b) => s + b.xhr_prob, 0);
    const variance     = balls.reduce((s, b) => s + b.xhr_prob * (1 - b.xhr_prob), 0);
    const se = Math.sqrt(variance);
    const z  = se > 0 ? (actual_hr - expected_hr) / se : 0;

    let verdict = 'NORMAL';
    if (z <= -Z_THRESHOLD) verdict = 'DEAD';
    if (z >= Z_THRESHOLD)  verdict = 'JUICED';

    return res.json({
      gamePk, homeAbbr, awayAbbr, venue,
      n: balls.length,
      actual_hr,
      expected_hr: Math.round(expected_hr * 100) / 100,
      se: Math.round(se * 100) / 100,
      z: Math.round(z * 100) / 100,
      z_threshold: Z_THRESHOLD,
      status: 'ok', verdict, balls,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// api/statcast_raw.js
// Returns pre-aggregated filtered metrics for a specific batter
// Data comes from mlb_players_aggregated.json (produced by mlbdata_aggregate.py)
//
// Query params:
//   batter_id      - MLBAM player ID
//   pitch_types    - comma-separated codes: "FF,SL" or empty = all
//   pitcher_throws - "R", "L", or empty = all
//   days           - 7, 14, 30, 60, or empty = season
//
// Returns pre-calculated metrics for the matching slice
// No raw row fetching needed — all slices pre-aggregated by mlbdata_aggregate.py

const PITCH_CODE_MAP = {
  '4-Seam FB': 'FF', 'Sinker': 'SI', 'Cutter': 'FC',
  'Slider': 'SL', 'Sweeper': 'ST', 'Curveball': 'CU',
  'Knuckle-Curve': 'KC', 'Changeup': 'CH', 'Splitter': 'FS',
};

let DATA_CACHE = null;
let DATA_CACHE_TS = 0;
const THREE_HOURS = 3 * 60 * 60 * 1000;

async function getPlayerData() {
  const now = Date.now();
  if (DATA_CACHE && (now - DATA_CACHE_TS) < THREE_HOURS) return DATA_CACHE;

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  let data = null;
  try {
    const r = await fetch(`${baseUrl}/data/players.json`);
    if (r.ok) data = await r.json();
  } catch(e) {}

  if (!data?.players?.length) {
    try {
      const r = await fetch('https://raw.githubusercontent.com/prsm-labs/going-yard/main/public/data/players.json');
      if (r.ok) data = await r.json();
    } catch(e) {}
  }

  if (data?.players) {
    // Index by pid for fast lookup
    DATA_CACHE = {};
    for (const p of data.players) DATA_CACHE[p.pid] = p;
    DATA_CACHE_TS = now;
    console.log('[StatcastRaw] Loaded', data.players.length, 'players');
  }
  return DATA_CACHE;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const { batter_id, pitch_types = '', pitcher_throws = '', days = '' } = req.query;
    if (!batter_id) return res.status(400).json({ error: 'batter_id required' });

    const playerMap = await getPlayerData();
    const player = playerMap?.[parseInt(batter_id)];

    if (!player) {
      return res.status(200).json({ rows: 0, metrics: null, found: false });
    }

    // ── Determine which pre-aggregated slice to return ────────
    const pitchCodes = pitch_types
      ? pitch_types.split(',').map(p => PITCH_CODE_MAP[p.trim()] || p.trim().toUpperCase())
      : [];
    const hand = pitcher_throws?.toUpperCase();
    const daysNum = parseInt(days) || 0;

    let metrics = null;

    if (pitchCodes.length > 0) {
      // Return pitch-type specific metrics
      // If single pitch type: use pre-computed split
      // If multiple: blend the splits (weighted by PA)
      const splits = pitchCodes
        .map(code => player.pitchSplits?.[code])
        .filter(Boolean);

      if (splits.length === 1) {
        metrics = splits[0];
      } else if (splits.length > 1) {
        // Weighted average by PA
        const totalPA = splits.reduce((s, m) => s + (m.pa || 0), 0);
        if (totalPA > 0) {
          metrics = blendMetrics(splits, totalPA);
        }
      }

      // Apply handedness filter on top if specified
      if (metrics && hand && (hand === 'R' || hand === 'L')) {
        const handSplit = hand === 'R' ? player.vsRHP : player.vsLHP;
        if (handSplit) {
          // Intersect: adjust metrics toward handedness split
          metrics = blendMetrics([metrics, handSplit], metrics.pa + handSplit.pa);
        }
      }
    } else if (hand === 'R' || hand === 'L') {
      // Handedness only
      metrics = hand === 'R' ? player.vsRHP : player.vsLHP;
    } else if (daysNum > 0) {
      // Date window
      const windowKey = daysNum <= 7 ? 'last7' : daysNum <= 14 ? 'last14' :
                        daysNum <= 30 ? 'last30' : 'last60';
      metrics = player.windows?.[windowKey];
    } else {
      // Season (no filter)
      metrics = extractSeasonMetrics(player);
    }

    if (!metrics) {
      return res.status(200).json({ rows: 0, metrics: null, filtered: true, found: true });
    }

    res.status(200).json({
      rows:     metrics.pa || 0,
      metrics,
      filtered: pitchCodes.length > 0 || !!hand || daysNum > 0,
      found:    true,
      source:   'aggregated_log',
    });

  } catch (err) {
    console.error('[StatcastRaw] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

function extractSeasonMetrics(p) {
  return {
    pa: p.pa, ab: p.ab, bip: p.bip,
    avgEV: p.avgEV, launchAngle: p.launchAngle, avgDist: p.avgDist || 0,
    hardHitPct: p.hardHit, barrelPct: p.barrel,
    flyBallPct: p.flyBall, pulledAirPct: p.pullAir,
    pulledBarrelPct: p.pulledBarrel, almostHRPct: p.almostHRPct || p.almostHR || 0,
    chasePct: p.oSwing || p.chasePct, zContactPct: p.zContact,
    avg: p.avg, bbPct: p.bbPct, kPct: p.kPct,
    hr: p.hr, hits: p.hits, xbh: p.xbh, totalBases: p.totalBases,
    daysSinceHR: p.daysSinceHR,
  };
}

function blendMetrics(splits, totalPA) {
  // Weighted average of numeric metrics by PA
  const keys = ['avgEV','launchAngle','hardHitPct','barrelPct','flyBallPct',
                 'pulledAirPct','pulledBarrelPct','almostHRPct','chasePct',
                 'zContactPct','avg','bbPct','kPct'];
  const out = { pa: totalPA };
  for (const key of keys) {
    const weighted = splits.reduce((s, m) => s + (m[key]||0) * (m.pa||0), 0);
    out[key] = totalPA > 0 ? Math.round(weighted / totalPA * 10) / 10 : 0;
  }
  // Sum stats
  out.hr         = splits.reduce((s,m) => s + (m.hr||0), 0);
  out.hits       = splits.reduce((s,m) => s + (m.hits||0), 0);
  out.xbh        = splits.reduce((s,m) => s + (m.xbh||0), 0);
  out.totalBases = splits.reduce((s,m) => s + (m.totalBases||0), 0);
  return out;
}

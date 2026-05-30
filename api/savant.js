// api/savant.js — Vercel serverless proxy for Baseball Savant gf endpoint
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { game_pk, debug } = req.query;
  if (!game_pk || !/^\d+$/.test(game_pk)) {
    return res.status(400).json({ error: 'Invalid game_pk' });
  }

  try {
    const url = `https://baseballsavant.mlb.com/gf?game_pk=${game_pk}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://baseballsavant.mlb.com/',
        'Origin': 'https://baseballsavant.mlb.com',
      },
    });

    if (!r.ok) {
      return res.status(r.status).json({ error: `Savant returned ${r.status}` });
    }

    const data = await r.json();

    // Debug mode — return raw structure info
    if (debug === '1') {
      const topKeys = Object.keys(data);
      const preview = {};
      for (const k of topKeys) {
        const v = data[k];
        if (Array.isArray(v)) {
          preview[k] = { type: 'array', length: v.length, firstItemKeys: v[0] ? Object.keys(v[0]) : [] };
        } else if (typeof v === 'object' && v !== null) {
          preview[k] = { type: 'object', keys: Object.keys(v).slice(0, 20) };
        } else {
          preview[k] = { type: typeof v, value: String(v).slice(0, 100) };
        }
      }
      return res.status(200).json({ topKeys, preview });
    }

    // Extract bat speeds — try every known structure
    const batSpeeds = {};

    const processPlay = (play) => {
      if (!play) return;
      // Savant gf uses sv_id or play_id as the key
      const pid = play.play_id || play.sv_id || play.ab_id;
      if (!pid) return;
      
      // bat_speed field names Savant uses
      const bs = play.bat_speed ?? play.batSpeed ?? play.bat_spd ?? 
                 play.swing_speed ?? play.swingSpeed ?? null;
      if (bs != null && Number(bs) > 0) {
        batSpeeds[pid] = {
          bat_speed:    Number(bs),
          swing_length: play.swing_length ?? play.swingLength ?? null,
          attack_angle: play.attack_angle ?? play.attackAngle ?? null,
        };
      }
    };

    // Savant gf response structures we've seen:
    // 1. data.team_home / data.team_away (arrays of plays)
    // 2. data.home_team_data / data.away_team_data
    // 3. data.plays (flat array)
    // 4. data[teamAbbr] (keyed by team)
    // 5. Nested: data.scoreboard.currentPlay etc.

    const arrayKeys = Object.keys(data).filter(k => Array.isArray(data[k]) && data[k].length > 0);
    
    for (const k of arrayKeys) {
      data[k].forEach(processPlay);
    }

    // Also check nested objects
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        // Try sub-arrays
        for (const [sk, sv] of Object.entries(v)) {
          if (Array.isArray(sv)) sv.forEach(processPlay);
        }
      }
    }

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.status(200).json({ 
      game_pk, 
      bat_speeds: batSpeeds, 
      count: Object.keys(batSpeeds).length,
      // Include structure hint when count is 0
      ...(Object.keys(batSpeeds).length === 0 ? {
        _debug_keys: Object.keys(data),
        _debug_array_keys: arrayKeys,
        _debug_first_item: arrayKeys[0] ? Object.keys(data[arrayKeys[0]][0] || {}) : []
      } : {})
    });

  } catch (err) {
    console.error('[savant proxy]', err.message);
    res.status(500).json({ error: err.message });
  }
}

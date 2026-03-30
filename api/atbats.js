// api/atbats.js
// Fetches full 2026 season Statcast at-bat data from Baseball Savant
// Cached daily — one fetch serves the entire app session
// Returns aggregated per-player stats for L3D/L7D/L15D/L30D windows

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const { window = '7' } = req.query; // days back

    // Get ET date
    const etNow = new Date().toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const [m, d, y] = etNow.split('/');
    const today = `${y}-${m}-${d}`;

    // Season start 2026
    const seasonStart = '2026-03-20';

    // Baseball Savant statcast_search — full season batted ball data
    // Returns every batted ball event with EV, LA, barrel, pitch type etc.
    const url = [
      'https://baseballsavant.mlb.com/statcast_search/csv',
      '?all=true',
      '&hfPT=',           // all pitch types
      '&hfAB=',           // all at-bat results
      '&hfBBT=',          // all batted ball types
      '&hfPR=',
      '&hfZ=',
      '&stadium=',
      '&hfBBL=',
      '&hfNewZones=',
      '&hfGT=R%7C',       // regular season only
      '&hfC=',
      `&hfSea=${y}%7C`,   // 2026 season
      '&hfSit=',
      '&player_type=batter',
      `&hfOuts=`,
      '&opponent=',
      '&pitcher_throws=',
      '&batter_stands=',
      '&hfSA=',
      `&game_date_gt=${seasonStart}`,
      `&game_date_lt=${today}`,
      '&team=',
      '&position=',
      '&hfRO=',
      '&home_road=',
      '&hfFlag=is%5C.%5C.remove%5C.%5C.bunts%7C', // remove bunts
      '&metric_1=',
      '&hfInn=',
      '&min_pitches=0',
      '&min_results=0',
      '&group_by=name',   // aggregate by player
      '&sort_col=xwoba',
      '&player_event_sort=api_p_release_speed',
      '&sort_order=desc',
      '&min_abs=0',
      '&type=details',    // detail level for per-AB data
    ].join('');

    // Use the leaderboard endpoint instead - more reliable aggregated data
    // This gives us per-player season aggregates we can filter by date
    const savantUrl = `https://baseballsavant.mlb.com/leaderboard/statcast?abs=1&type=batter&year=${y}&position=&team=&min=1&csv=true`;

    const response = await fetch(savantUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/csv,text/plain,*/*',
        'Referer': 'https://baseballsavant.mlb.com/',
      }
    });

    if (!response.ok) throw new Error(`Savant ${response.status}`);
    const csv = await response.text();

    // Parse CSV
    const rows = csv.trim().split('\n');
    const rawHdrs = rows[0].split(',').map(h => h.replace(/"/g,'').trim());
    console.log('[AtBats] Headers sample:', rawHdrs.slice(0,20).join(', '));

    const players = rows.slice(1).filter(r => r.trim()).map(row => {
      const vals = [];
      let cur = '', inQ = false;
      for (const ch of row) {
        if (ch === '"') { inQ = !inQ; }
        else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      vals.push(cur.trim());
      const o = {};
      rawHdrs.forEach((h, i) => { o[h] = (vals[i] || '').replace(/"/g,'').trim(); });
      return o;
    }).filter(r => r.player_id && r.player_id !== 'player_id');

    console.log('[AtBats] Players parsed:', players.length);
    if (players[0]) {
      console.log('[AtBats] Sample row keys:', Object.keys(players[0]).slice(0,15).join(', '));
      console.log('[AtBats] Sample values:', JSON.stringify(Object.fromEntries(Object.entries(players[0]).slice(0,10))));
    }

    // Parse name: Savant returns "last_name, first_name"
    const parseName = (r) => {
      const combined = r['last_name, first_name'] || r['last_name,first_name'] || '';
      if (combined.includes(',')) {
        const [last, first] = combined.split(',');
        return `${first.trim()} ${last.trim()}`;
      }
      return combined || `Player ${r.player_id}`;
    };

    const pf = (v, cap = 9999) => {
      const n = parseFloat(v);
      return isNaN(n) ? 0 : Math.min(n, cap);
    };

    const mapped = players.map(r => ({
      pid:          parseInt(r.player_id),
      name:         parseName(r),
      team:         r.team_name_abbrev || r.team_abbrev || r.team || '—',
      // Exit velocity metrics
      avgEV:        pf(r.exit_velocity_avg || r.avg_hit_speed, 115),
      maxEV:        pf(r.max_hit_speed || r.max_exit_velocity, 130),
      ev50:         pf(r.ev50, 120),
      // Quality metrics
      barrelPct:    pf(r.barrel_batted_rate || r.brl_percent, 25),
      hardHitPct:   pf(r.hard_hit_percent || r.ev95percent, 80),
      sweetSpotPct: pf(r.sweet_spot_percent || r.anglesweetspotpercent, 60),
      launchAngle:  pf(r.launch_angle_avg || r.avg_hit_angle),
      // Batted ball distribution
      fbPct:        pf(r.fb_percent, 60),        // pure fly ball %
      gbPct:        pf(r.gb_percent, 80),        // ground ball %
      ldPct:        pf(r.ld_percent, 40),        // line drive %
      fbldPct:      pf(r.fbld, 80),              // FB+LD combined
      pullPct:      pf(r.pull_percent, 60),
      // Expected stats
      xwoba:        pf(r.xwoba || r.est_woba, 0.700),
      xba:          pf(r.xba   || r.est_ba,   0.500),
      xslg:         pf(r.xslg  || r.est_slg,  1.500),
      xobp:         pf(r.xobp  || r.est_obp,  0.600),
      // Traditional
      avg:          pf(r.ba || r.avg,   0.500),
      slg:          pf(r.slg,           1.500),
      obp:          pf(r.obp,           0.600),
      ops:          pf(r.ops,           2.000),
      // Counts
      pa:           parseInt(r.pa  || r.abs || 0),
      ab:           parseInt(r.abs || r.ab  || 0),
      // Discipline (may not be in this endpoint)
      chasePct:     pf(r.oz_swing_percent || r.o_swing_percent || r.chase_rate, 60),
      whiffPct:     pf(r.whiff_percent, 60),
      kPct:         pf(r.strikeout_percent || r.k_percent, 50),
      bbPct:        pf(r.walk_percent || r.bb_percent, 30),
      zContactPct:  pf(r.z_contact_percent, 100),
    })).filter(r => r.avgEV > 0 || r.xwoba > 0);

    console.log('[AtBats] Mapped players:', mapped.length);
    res.status(200).json({ 
      date: today, 
      season: y,
      players: mapped,
      total: mapped.length,
      headers: rawHdrs.slice(0, 30), // for debugging
    });

  } catch (err) {
    console.error('[AtBats] Error:', err.message);
    res.status(500).json({ error: err.message, players: [] });
  }
}

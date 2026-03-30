// api/atbats.js — Full 2026 season Statcast data, 3-hour cache
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const year = '2026';
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/csv,text/plain,*/*',
      'Referer': 'https://baseballsavant.mlb.com/',
    };

    // THREE endpoints to get everything we need:
    // 1. expected_statistics: xBA, xSLG, xwOBA, BA, SLG, OBP, K%, BB%
    // 2. statcast leaderboard: EV, Barrel%, HardHit%, SweetSpot%, fbld, GB%
    // 3. custom leaderboard: Pull%, FB%, GB%, LD% — the batted ball direction data
    const [expRes, statRes, customRes] = await Promise.all([
      fetch(`https://baseballsavant.mlb.com/leaderboard/expected_statistics?type=batter&year=${year}&position=&team=&min=5&csv=true`, { headers }),
      fetch(`https://baseballsavant.mlb.com/leaderboard/statcast?abs=5&type=batter&year=${year}&position=&team=&min=5&csv=true`, { headers }),
      // Custom leaderboard with pull%, flyball%, groundball% direction splits
      fetch(`https://baseballsavant.mlb.com/leaderboard/custom?year=${year}&type=batter&filter=&sort=4&sortDir=desc&min=5&selections=player_age,b_ab,b_total_pa,b_total_hits,b_home_run,b_strikeout,b_walk,b_k_percent,b_bb_percent,batting_avg,slg_percent,on_base_percent,on_base_plus_slg,b_rbi,exit_velocity_avg,launch_angle_avg,sweet_spot_percent,barrel_batted_rate,hard_hit_percent,b_pulled_balls,b_opposite_field_balls,b_total_balls_in_play,pull_percent,straightaway_percent,opposite_percent,b_fly_ball,b_ground_ball,b_line_drive,b_pop_up,fly_ball_percent,ground_ball_percent,line_drive_percent,pop_up_percent&chart=false&x=exit_velocity_avg&y=exit_velocity_avg&r=no&chartType=beeswarm&csv=true`, { headers }),
    ]);

    const parseCSV = (csv) => {
      if (!csv || csv.length < 50 || csv.startsWith('<') || csv.startsWith('{')) return { hdrs: [], rows: [] };
      const lines = csv.trim().split('\n');
      const parseRow = (line) => {
        const vals = []; let cur = '', inQ = false;
        for (const ch of line) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
          else { cur += ch; }
        }
        vals.push(cur.trim());
        return vals.map(v => v.replace(/^"|"$/g, '').trim());
      };
      const hdrs = parseRow(lines[0]);
      const rows = lines.slice(1).filter(l => l.trim()).map(line => {
        const vals = parseRow(line);
        const o = {};
        hdrs.forEach((h, i) => { o[h] = vals[i] || ''; });
        return o;
      });
      return { hdrs, rows };
    };

    const { hdrs: expHdrs, rows: expRows } = parseCSV(expRes.ok ? await expRes.text() : '');
    const { hdrs: statHdrs, rows: statRows } = parseCSV(statRes.ok ? await statRes.text() : '');
    const { hdrs: custHdrs, rows: custRows } = parseCSV(customRes.ok ? await customRes.text() : '');

    console.log('[AtBats] Expected cols:', expHdrs.slice(0,10).join(', '));
    console.log('[AtBats] Statcast cols:', statHdrs.join(', '));
    console.log('[AtBats] Custom cols:', custHdrs.join(', '));
    console.log('[AtBats] Rows:', expRows.length, statRows.length, custRows.length);

    // Build lookup maps
    const statMap = {};
    statRows.forEach(r => { if (r.player_id) statMap[r.player_id] = r; });
    const custMap = {};
    custRows.forEach(r => { if (r.player_id) custMap[r.player_id] = r; });

    // Name parser — handles "last_name, first_name" as literal column key
    const getName = (r) => {
      const keys = Object.keys(r);
      // Look for a key containing both "last" and "first"
      const combo = keys.find(k => k.includes('last_name') && k.includes('first_name'));
      if (combo && r[combo]?.includes(',')) {
        const [last, ...rest] = r[combo].split(',');
        return `${rest.join(',').trim()} ${last.trim()}`;
      }
      // Separate fields
      const lk = keys.find(k => k === 'last_name');
      const fk = keys.find(k => k === 'first_name');
      if (lk && fk && r[lk] && r[fk]) return `${r[fk].trim()} ${r[lk].trim()}`;
      // last_name alone contains "Last, First"
      if (lk && r[lk]?.includes(',')) {
        const [l, ...f] = r[lk].split(',');
        return `${f.join(',').trim()} ${l.trim()}`;
      }
      return r['player_name'] || r['name'] || '';
    };

    const pf = (v, cap = 999) => { const n = parseFloat(v); return isNaN(n) ? 0 : Math.min(n, cap); };

    const source = expRows.length > 0 ? expRows : statRows;

    const players = source.filter(r => r.player_id).map(r => {
      const s = statMap[r.player_id] || {};
      const c = custMap[r.player_id] || {};

      // ── EXACT column names from Savant CSV (verified from baseballr docs) ──
      // Statcast leaderboard: avg_hit_speed, brl_percent, ev95percent,
      //   anglesweetspotpercent, avg_hit_angle, fbld, gb_percent
      // Custom leaderboard: fly_ball_percent, ground_ball_percent,
      //   line_drive_percent, pull_percent

      // FB% — prefer custom leaderboard (has pure fly_ball_percent)
      // statcast leaderboard has "fbld" = fly ball + line drive combined
      const flyBall = pf(c['fly_ball_percent'] || c['b_fly_ball_pct'], 60) ||
                      Math.min(Math.round(pf(s['fbld']) * 0.61 * 10) / 10, 52);

      // Pull% — from custom leaderboard
      const pullPct = pf(c['pull_percent'] || c['b_pull_percent'], 60);

      // Pulled barrel estimate: pull% * barrel% * 1.3 (pull side has more barrels)
      const barrelPct = pf(s['brl_percent'] || s['barrel_batted_rate'], 25);
      const pulledBarrelPct = pullPct > 0 && barrelPct > 0
        ? Math.round(barrelPct * (pullPct / 100) * 1.4 * 10) / 10
        : 0;

      const name = getName({ ...s, ...c, ...r });
      const team = r.team_name_abbrev || s.team_name_abbrev || c.team_name_abbrev || '—';

      return {
        pid:          parseInt(r.player_id),
        name,
        team,
        avgEV:        pf(s['avg_hit_speed'] || s['exit_velocity_avg'], 115),
        maxEV:        pf(s['max_hit_speed'] || s['max_exit_velocity'], 130),
        barrelPct,
        hardHitPct:   pf(s['ev95percent'] || s['hard_hit_percent'], 80),
        sweetSpotPct: pf(s['anglesweetspotpercent'] || s['sweet_spot_percent'], 60),
        launchAngle:  pf(s['avg_hit_angle'] || s['launch_angle_avg']),
        flyBall,
        gbPct:        pf(c['ground_ball_percent'] || s['gb_percent'], 80),
        ldPct:        pf(c['line_drive_percent'], 40),
        pullPct,
        pulledBarrelPct,
        xwoba:        pf(r['xwoba'] || r['est_woba'], 0.700),
        xba:          pf(r['xba']   || r['est_ba'],   0.500),
        xslg:         pf(r['xslg']  || r['est_slg'],  1.500),
        avg:          pf(r['ba']    || r['batting_avg'] || c['batting_avg'], 0.500),
        slg:          pf(r['slg']   || r['slg_percent'] || c['slg_percent'], 1.500),
        obp:          pf(r['obp']   || r['on_base_percent'] || c['on_base_percent'], 0.600),
        pa:           parseInt(r['pa'] || c['b_total_pa'] || 0),
        ab:           parseInt(r['abs'] || c['b_ab'] || 0),
        chasePct:     pf(s['oz_swing_percent'] || s['o_swing_percent'], 60),
        kPct:         pf(r['strikeout_percent'] || c['b_k_percent'], 50),
        bbPct:        pf(r['walk_percent'] || c['b_bb_percent'], 30),
        zContactPct:  pf(s['z_contact_percent'], 100),
      };
    }).filter(r => r.avgEV > 0 || r.xwoba > 0);

    console.log('[AtBats] Final players:', players.length);
    if (players[0]) {
      const p = players[0];
      console.log(`[AtBats] Sample: ${p.name} | EV:${p.avgEV} | FB%:${p.flyBall} | Pull%:${p.pullPct} | Barrel%:${p.barrelPct}`);
    }

    // Name fallback from MLB Stats API if needed
    const missingNames = players.filter(p => !p.name || p.name.trim() === '');
    if (missingNames.length > players.length * 0.3) {
      console.log('[AtBats] Fetching names from MLB Stats API for', missingNames.length, 'players');
      try {
        const mlbRes = await fetch('https://statsapi.mlb.com/api/v1/sports/1/players?season=2026&sportId=1');
        const mlbData = await mlbRes.json();
        const mlbMap = {};
        for (const p of (mlbData.people || [])) {
          mlbMap[p.id] = { name: p.fullName, team: p.currentTeam?.abbreviation };
        }
        players.forEach(p => {
          if ((!p.name || p.name.trim() === '') && mlbMap[p.pid]) {
            p.name = mlbMap[p.pid].name;
            if (!p.team || p.team === '—') p.team = mlbMap[p.pid].team || '—';
          }
        });
      } catch(e) { console.warn('[AtBats] MLB name fallback failed:', e.message); }
    }

    res.status(200).json({ players, total: players.length });

  } catch (err) {
    console.error('[AtBats] Error:', err.message);
    res.status(500).json({ error: err.message, players: [] });
  }
}

// api/atbats.js — Full 2026 season Statcast data
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

    // Fetch both leaderboards in parallel
    // Expected stats: xBA, xSLG, xwOBA + traditional
    // Statcast leaderboard: EV, Barrel%, HardHit%, FB%, GB%, Pull% etc
    const [expRes, statRes] = await Promise.all([
      fetch(`https://baseballsavant.mlb.com/leaderboard/expected_statistics?type=batter&year=${year}&position=&team=&min=5&csv=true`, { headers }),
      fetch(`https://baseballsavant.mlb.com/leaderboard/statcast?abs=5&type=batter&year=${year}&position=&team=&min=5&csv=true`, { headers }),
    ]);

    const expCsv  = expRes.ok  ? await expRes.text()  : '';
    const statCsv = statRes.ok ? await statRes.text() : '';

    const parseCSV = (csv) => {
      if (!csv || csv.length < 50 || csv.startsWith('<')) return { hdrs: [], rows: [] };
      const lines = csv.trim().split('\n');
      const parseRow = (line) => {
        const vals = []; let cur = '', inQ = false;
        for (const ch of line) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
          else { cur += ch; }
        }
        vals.push(cur.trim());
        return vals.map(v => v.replace(/^"|"$/g,'').trim());
      };
      const hdrs = parseRow(lines[0]);
      const rows = lines.slice(1).filter(l=>l.trim()).map(line => {
        const vals = parseRow(line);
        const o = {};
        hdrs.forEach((h,i) => { o[h] = vals[i] || ''; });
        return o;
      });
      return { hdrs, rows };
    };

    const { hdrs: expHdrs, rows: expRows } = parseCSV(expCsv);
    const { hdrs: statHdrs, rows: statRows } = parseCSV(statCsv);

    // Log ALL column names so we know exactly what Savant returns
    console.log('[AtBats] Expected columns:', expHdrs.join(', '));
    console.log('[AtBats] Statcast columns:', statHdrs.join(', '));
    console.log('[AtBats] Rows:', expRows.length, statRows.length);
    if (statRows[0]) {
      console.log('[AtBats] Stat sample row:', JSON.stringify(statRows[0]));
      // Log specifically the batted ball columns
      const bbCols = Object.keys(statRows[0]).filter(k =>
        ['fb','pull','fly','gb','ld','barrel','hard','ev','swing','contact','zone'].some(kw => k.toLowerCase().includes(kw))
      );
      console.log('[AtBats] Batted ball columns:', bbCols.join(', '));
      console.log('[AtBats] Batted ball values:', bbCols.map(k => `${k}=${statRows[0][k]}`).join(' | '));
    }

    // Name parser
    const getName = (r) => {
      const keys = Object.keys(r);
      const combinedKey = keys.find(k => k.toLowerCase().includes('last_name') && k.toLowerCase().includes('first_name'));
      if (combinedKey && r[combinedKey]?.includes(',')) {
        const [last, ...rest] = r[combinedKey].split(',');
        return `${rest.join('').trim()} ${last.trim()}`;
      }
      const lk = keys.find(k => k === 'last_name');
      const fk = keys.find(k => k === 'first_name');
      if (lk && fk && r[lk] && r[fk]) return `${r[fk].trim()} ${r[lk].trim()}`;
      if (lk && r[lk]?.includes(',')) {
        const [l,...f] = r[lk].split(','); return `${f.join('').trim()} ${l.trim()}`;
      }
      return r['player_name'] || r['name'] || '';
    };

    // Build statcast map by player_id
    const statMap = {};
    statRows.forEach(r => { if (r.player_id) statMap[r.player_id] = r; });

    const pf = (v, cap=999) => { const n=parseFloat(v); return isNaN(n)?0:Math.min(n,cap); };

    const source = expRows.length > 0 ? expRows : statRows;

    const players = source.filter(r => r.player_id).map(r => {
      const s = statMap[r.player_id] || {};

      // ── FlyBall% — Savant uses these column names in statcast leaderboard:
      // "bb_type" breakdown columns: "fb_percent", "gb_percent", "ld_percent", "iffb_percent"
      // OR combined: "fbld" = FB + LD rate (not a percentage, raw rate)
      // Try every possible column name
      // Try all possible column name variations for FB% and Pull%
      // The actual column names depend on which Savant endpoint version is live
      const sKeys = Object.keys(s);

      const findCol = (keywords) => {
        const k = sKeys.find(col =>
          keywords.some(kw => col.toLowerCase().replace(/[^a-z0-9]/g,'').includes(kw.toLowerCase().replace(/[^a-z0-9]/g,'')))
        );
        return k ? s[k] : '';
      };

      const rawFB   = findCol(['fb_percent','fly_ball_percent','flyballs_percent','flyball_percent','fb%']);
      const rawFBLD = findCol(['fbld','fb_ld']);
      const rawGB   = findCol(['gb_percent','ground_ball_percent','groundball_percent','gb%']);
      const rawLD   = findCol(['ld_percent','line_drive_percent','linedrive_percent','ld%']);
      const rawPullRaw = findCol(['pull_percent','pull_bip','pulled_percent','pullpercent']);

      const fbldVal = parseFloat(rawFBLD) || 0;
      let flyBall = 0;
      if (parseFloat(rawFB) > 0) {
        flyBall = Math.min(parseFloat(rawFB), 60);
      } else if (fbldVal > 0) {
        // fbld is a percentage (e.g. 56.7) representing FB+LD%
        // Pure FB% is ~61% of that value for typical hitters
        flyBall = Math.min(Math.round(fbldVal * 0.61 * 10)/10, 52);
      }

      const pullPct = pf(rawPullRaw, 60);

      // ── Pulled Barrel% — barrels hit to pull side
      // Savant doesn't have this directly but we can estimate:
      // pulled_barrels or pulled_bip columns if they exist
      const rawPulledBarrel = s['pulled_brl'] || s['pull_barrel_percent'] || s['pulled_barrel_bip'] || '';
      // Estimate: pull% * barrel% * adjustment factor (pull side barrels = ~60% of all barrels)
      const barrelPct = pf(s['barrel_batted_rate'] || s['brl_percent'], 25);
      const pulledBarrelPct = rawPulledBarrel
        ? pf(rawPulledBarrel, 20)
        : Math.round(barrelPct * (pullPct/100) * 1.4 * 10) / 10; // estimate

      return {
        pid:          parseInt(r.player_id),
        name:         getName({...s,...r}),
        team:         r.team_name_abbrev || s.team_name_abbrev || r.team_abbreviation || '—',
        avgEV:        pf(s['exit_velocity_avg'] || s['avg_hit_speed'], 115),
        maxEV:        pf(s['max_hit_speed'] || s['max_exit_velocity'], 130),
        barrelPct,
        hardHitPct:   pf(s['hard_hit_percent'] || s['ev95percent'], 80),
        sweetSpotPct: pf(s['sweet_spot_percent'] || s['anglesweetspotpercent'], 60),
        launchAngle:  pf(s['launch_angle_avg'] || s['avg_hit_angle']),
        flyBall,
        gbPct:        pf(rawGB, 70),
        ldPct:        pf(rawLD, 40),
        pullPct,
        pulledBarrelPct,
        xwoba:        pf(r['xwoba'] || r['est_woba'], 0.700),
        xba:          pf(r['xba']   || r['est_ba'],   0.500),
        xslg:         pf(r['xslg']  || r['est_slg'],  1.500),
        avg:          pf(r['ba']    || r['avg'],       0.500),
        slg:          pf(r['slg'],  1.500),
        obp:          pf(r['obp'],  0.600),
        pa:           parseInt(r['pa']  || 0),
        ab:           parseInt(r['abs'] || r['ab'] || 0),
        chasePct:     pf(s['oz_swing_percent'] || s['o_swing_percent'], 60),
        kPct:         pf(r['strikeout_percent'] || r['k_percent'] || s['k_percent'], 50),
        bbPct:        pf(r['walk_percent']      || r['bb_percent'] || s['bb_percent'], 30),
        zContactPct:  pf(s['z_contact_percent'], 100),
      };
    }).filter(r => r.avgEV > 0 || r.xwoba > 0);

    console.log('[AtBats] Mapped:', players.length);
    if (players[0]) {
      console.log('[AtBats] Sample:', players[0].name,
        '| EV:', players[0].avgEV,
        '| FB%:', players[0].flyBall,
        '| Pull%:', players[0].pullPct,
        '| Barrel%:', players[0].barrelPct
      );
    }

    // If names failed, enrich from MLB Stats API
    const noName = players.filter(p => !p.name || p.name.trim() === '');
    if (noName.length > players.length * 0.5) {
      console.log('[AtBats] Names missing — fetching from MLB Stats API');
      try {
        const mlbRes = await fetch('https://statsapi.mlb.com/api/v1/sports/1/players?season=2026&sportId=1');
        const mlbData = await mlbRes.json();
        const mlbMap = {};
        for (const p of (mlbData.people || [])) {
          mlbMap[p.id] = { name: p.fullName, team: p.currentTeam?.abbreviation };
        }
        players.forEach(p => {
          if (!p.name && mlbMap[p.pid]) {
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

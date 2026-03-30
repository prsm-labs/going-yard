// api/atbats.js — Full 2026 season Statcast data, refreshes every 3 hours
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const year = '2026';
    const minAB = '5';

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/csv,text/plain,*/*',
      'Referer': 'https://baseballsavant.mlb.com/',
    };

    // Fetch both leaderboards in parallel
    const [expRes, statRes] = await Promise.all([
      fetch(`https://baseballsavant.mlb.com/leaderboard/expected_statistics?type=batter&year=${year}&position=&team=&min=${minAB}&csv=true`, { headers }),
      fetch(`https://baseballsavant.mlb.com/leaderboard/statcast?abs=${minAB}&type=batter&year=${year}&position=&team=&min=${minAB}&csv=true`, { headers }),
    ]);

    const expCsv  = expRes.ok  ? await expRes.text()  : '';
    const statCsv = statRes.ok ? await statRes.text() : '';

    // ── CSV parser that handles the "last_name, first_name" column correctly ──
    // The trick: Savant wraps that field in quotes so it stays as one column
    const parseCSV = (csv) => {
      if (!csv || csv.length < 50 || csv.startsWith('<')) return { headers: [], rows: [] };
      const lines = csv.trim().split('\n');
      if (lines.length < 2) return { headers: [], rows: [] };

      // Parse header row — handle quoted fields with commas inside
      const parseRow = (line) => {
        const vals = []; let cur = '', inQ = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') { inQ = !inQ; }
          else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
          else { cur += ch; }
        }
        vals.push(cur.trim());
        return vals;
      };

      const hdrs = parseRow(lines[0]).map(h => h.replace(/"/g, '').trim());

      // Log ALL headers so we can see exact column names
      console.log('[AtBats] All headers:', hdrs.join(' | '));

      const rows = lines.slice(1).filter(l => l.trim()).map(line => {
        const vals = parseRow(line).map(v => v.replace(/^"|"$/g, '').trim());
        const o = {};
        hdrs.forEach((h, i) => { o[h] = vals[i] || ''; });
        return o;
      });

      return { headers: hdrs, rows };
    };

    const { headers: expHdrs, rows: expRows } = parseCSV(expCsv);
    const { headers: statHdrs, rows: statRows } = parseCSV(statCsv);

    console.log('[AtBats] Expected rows:', expRows.length, 'Stat rows:', statRows.length);
    if (expRows[0]) console.log('[AtBats] Expected sample:', JSON.stringify(Object.fromEntries(Object.entries(expRows[0]).slice(0, 8))));
    if (statRows[0]) console.log('[AtBats] Stat sample:', JSON.stringify(Object.fromEntries(Object.entries(statRows[0]).slice(0, 8))));

    // Build name from whatever fields exist
    const getName = (r) => {
      // Try every possible name field combination
      // After CSV parse, "last_name, first_name" may become:
      // - key exactly: r['last_name, first_name']  (if quoted in CSV)
      // - split: r['last_name'] + next column value bled in
      // - or separate first_name / last_name columns

      const allKeys = Object.keys(r);

      // Check for a key that contains both 'last' and 'first' (the combined field)
      const combinedKey = allKeys.find(k => k.includes('last_name') && k.includes('first_name'));
      if (combinedKey) {
        const val = r[combinedKey];
        if (val && val.includes(',')) {
          const [last, ...rest] = val.split(',');
          return `${rest.join(',').trim()} ${last.trim()}`;
        }
      }

      // Try separate fields
      const lastKey  = allKeys.find(k => k === 'last_name');
      const firstKey = allKeys.find(k => k === 'first_name');
      if (lastKey && firstKey && r[lastKey] && r[firstKey]) {
        return `${r[firstKey].trim()} ${r[lastKey].trim()}`;
      }

      // Try player_name or name field
      const nameKey = allKeys.find(k => k === 'player_name' || k === 'name');
      if (nameKey && r[nameKey]) return r[nameKey];

      // If last_name exists alone, it might contain "Last, First" 
      if (lastKey && r[lastKey] && r[lastKey].includes(',')) {
        const [last, first] = r[lastKey].split(',');
        return `${first?.trim()} ${last?.trim()}`;
      }

      return '';
    };

    // Merge by player_id
    const statMap = {};
    statRows.forEach(r => { if (r.player_id) statMap[r.player_id] = r; });

    const source = expRows.length > 0 ? expRows : statRows;
    const pf = (v, cap = 999) => { const n = parseFloat(v); return isNaN(n) ? 0 : Math.min(n, cap); };

    const players = source
      .filter(r => r.player_id)
      .map(r => {
        const s = statMap[r.player_id] || {};
        const name = getName({ ...s, ...r });
        const team = r.team_name_abbrev || s.team_name_abbrev || r.team_abbreviation || s.team_abbreviation || '—';

        return {
          pid:          parseInt(r.player_id),
          name:         name || `P${r.player_id}`, // temporary ID if name fails
          team,
          avgEV:        pf(s.exit_velocity_avg || s.avg_hit_speed, 115),
          maxEV:        pf(s.max_hit_speed, 130),
          barrelPct:    pf(s.barrel_batted_rate || s.brl_percent, 25),
          hardHitPct:   pf(s.hard_hit_percent   || s.ev95percent, 80),
          sweetSpotPct: pf(s.sweet_spot_percent || s.anglesweetspotpercent, 60),
          launchAngle:  pf(s.launch_angle_avg   || s.avg_hit_angle),
          fbPct:        pf(s.fb_percent, 60),
          fbldPct:      pf(s.fbld, 80),
          gbPct:        pf(s.gb_percent, 70),
          pullPct:      pf(s.pull_percent, 60),
          xwoba:        pf(r.xwoba || r.est_woba, 0.700),
          xba:          pf(r.xba   || r.est_ba,   0.500),
          xslg:         pf(r.xslg  || r.est_slg,  1.500),
          avg:          pf(r.ba    || r.avg, 0.500),
          slg:          pf(r.slg, 1.500),
          obp:          pf(r.obp, 0.600),
          pa:           parseInt(r.pa || 0),
          ab:           parseInt(r.abs || r.ab || 0),
          chasePct:     pf(s.oz_swing_percent || s.o_swing_percent, 60),
          kPct:         pf(r.strikeout_percent || s.k_percent, 50),
          bbPct:        pf(r.walk_percent || s.bb_percent, 30),
          zContactPct:  pf(s.z_contact_percent, 100),
        };
      })
      .filter(r => r.avgEV > 0 || r.xwoba > 0);

    // Log name results
    const withNames = players.filter(p => p.name && !p.name.startsWith('P'));
    const withoutNames = players.filter(p => !p.name || p.name.startsWith('P'));
    console.log('[AtBats] Players with names:', withNames.length, 'without:', withoutNames.length);
    if (players[0]) console.log('[AtBats] Sample player:', JSON.stringify({ name: players[0].name, team: players[0].team, avgEV: players[0].avgEV, xwoba: players[0].xwoba }));

    // If no names resolved, fetch them from MLB Stats API as fallback
    if (withNames.length === 0 && players.length > 0) {
      console.log('[AtBats] Name parse failed — fetching names from MLB Stats API');
      try {
        const mlbRes = await fetch('https://statsapi.mlb.com/api/v1/sports/1/players?season=2026&gameType=R');
        const mlbData = await mlbRes.json();
        const mlbMap = {};
        for (const p of (mlbData.people || [])) {
          mlbMap[p.id] = { name: p.fullName, team: p.currentTeam?.abbreviation };
        }
        players.forEach(p => {
          if (mlbMap[p.pid]) {
            p.name = mlbMap[p.pid].name;
            if (!p.team || p.team === '—') p.team = mlbMap[p.pid].team || '—';
          }
        });
        console.log('[AtBats] MLB name enrichment done. Sample:', players[0]?.name);
      } catch(e) {
        console.warn('[AtBats] MLB name fallback failed:', e.message);
      }
    }

    res.status(200).json({ players, total: players.length });

  } catch (err) {
    console.error('[AtBats] Error:', err.message);
    res.status(500).json({ error: err.message, players: [] });
  }
}

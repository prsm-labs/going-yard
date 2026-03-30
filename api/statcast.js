// api/statcast.js — Baseball Savant Statcast leaderboard proxy
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const { year = '2026', minAB = '5' } = req.query;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/csv,text/plain,*/*',
      'Referer': 'https://baseballsavant.mlb.com/',
    };

    // Fetch both endpoints in parallel
    const [expectedRes, battedRes] = await Promise.all([
      fetch(`https://baseballsavant.mlb.com/leaderboard/expected_statistics?type=batter&year=${year}&position=&team=&min=${minAB}&csv=true`, { headers }),
      fetch(`https://baseballsavant.mlb.com/leaderboard/statcast?abs=${minAB}&type=batter&year=${year}&position=&team=&min=${minAB}&csv=true`, { headers }),
    ]);

    const parseCSV = (csv) => {
      if (!csv || csv.startsWith('{') || csv.startsWith('<') || csv.length < 100) return [];
      const rows = csv.trim().split('\n');
      if (rows.length < 2) return [];
      // Parse headers — handle quoted fields
      const hdrs = rows[0].split(',').map(h => h.replace(/"/g,'').trim());
      console.log('[Statcast] CSV headers:', hdrs.slice(0,15).join(' | '));
      return rows.slice(1).filter(r => r.trim()).map(row => {
        const vals = []; let cur = '', inQ = false;
        for (const ch of row) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
          else cur += ch;
        }
        vals.push(cur.trim());
        const o = {};
        hdrs.forEach((h,i) => { o[h] = (vals[i]||'').replace(/^"|"$/g,'').trim(); });
        return o;
      });
    };

    const parseName = (r) => {
      // Savant CSV: column is literally named "last_name, first_name"
      // After CSV parse this becomes key "last_name" with value " first_name"
      // OR the combined key exists as-is
      const combined = r['last_name, first_name'] || r['last_name,first_name'] || '';
      if (combined && combined.includes(',')) {
        const parts = combined.split(',');
        return `${parts[1].trim()} ${parts[0].trim()}`;
      }
      // Try split fields
      const last  = r['last_name']  || '';
      const first = r['first_name'] || r['player_first_name'] || '';
      if (first && last) return `${first.trim()} ${last.trim()}`;
      if (last) return last.trim();
      // Try player_name field
      const pn = r['player_name'] || r['name'] || '';
      if (pn) return pn;
      return '';
    };

    const expectedCsv = expectedRes.ok ? await expectedRes.text() : '';
    const battedCsv   = battedRes.ok   ? await battedRes.text()   : '';

    const expectedData = parseCSV(expectedCsv);
    const battedData   = parseCSV(battedCsv);

    console.log('[Statcast] Expected rows:', expectedData.length, 'Batted rows:', battedData.length);

    // Log sample row to see actual keys
    if (expectedData[0]) {
      console.log('[Statcast] Expected sample keys:', Object.keys(expectedData[0]).slice(0,12).join(', '));
      console.log('[Statcast] Expected sample vals:', JSON.stringify(Object.fromEntries(Object.entries(expectedData[0]).slice(0,8))));
    }
    if (battedData[0]) {
      console.log('[Statcast] Batted sample keys:', Object.keys(battedData[0]).slice(0,12).join(', '));
    }

    // Merge by player_id
    const battedMap = {};
    battedData.forEach(r => { if (r.player_id) battedMap[r.player_id] = r; });

    const source = expectedData.length > 0 ? expectedData : battedData;

    const pf = (v, cap=999) => { const n = parseFloat(v); return isNaN(n) ? 0 : Math.min(n, cap); };

    const players = source
      .filter(r => r.player_id)
      .map(r => {
        const b = battedMap[r.player_id] || {};
        const name = parseName({...b, ...r});
        return {
          player_id:            r.player_id,
          pid:                  parseInt(r.player_id),
          name,
          team_name_abbrev:     r.team_name_abbrev || b.team_name_abbrev || r.team_abbreviation || b.team_abbreviation || '—',
          // Expected stats (from expected_statistics endpoint)
          xwoba:                r.xwoba   || r.est_woba || b.xwoba || '',
          xba:                  r.xba     || r.est_ba   || b.xba   || '',
          xslg:                 r.xslg    || r.est_slg  || b.xslg  || '',
          // EV / contact quality (from statcast leaderboard)
          exit_velocity_avg:    b.exit_velocity_avg    || b.avg_hit_speed       || r.exit_velocity_avg    || '',
          launch_angle_avg:     b.launch_angle_avg     || b.avg_hit_angle       || r.launch_angle_avg     || '',
          barrel_batted_rate:   b.barrel_batted_rate   || b.brl_percent         || r.barrel_batted_rate   || '',
          hard_hit_percent:     b.hard_hit_percent     || b.ev95percent         || r.hard_hit_percent     || '',
          sweet_spot_percent:   b.sweet_spot_percent   || b.anglesweetspotpercent || '',
          fb_percent:           b.fb_percent           || '',
          gb_percent:           b.gb_percent           || '',
          ld_percent:           b.ld_percent           || '',
          fbld:                 b.fbld                 || '',
          pull_percent:         b.pull_percent         || '',
          max_hit_speed:        b.max_hit_speed        || '',
          // Traditional
          ba:                   r.ba  || b.ba  || '',
          slg:                  r.slg || b.slg || '',
          obp:                  r.obp || b.obp || '',
          pa:                   r.pa  || b.pa  || '',
          abs:                  r.abs || b.abs || b.ab || '',
          // Discipline
          oz_swing_percent:     b.oz_swing_percent   || b.o_swing_percent || '',
          z_contact_percent:    b.z_contact_percent  || '',
          strikeout_percent:    r.strikeout_percent  || b.k_percent || '',
          walk_percent:         r.walk_percent       || b.bb_percent || '',
        };
      });

    console.log('[Statcast] Final players:', players.length);
    if (players[0]) console.log('[Statcast] First player:', players[0].name, players[0].team_name_abbrev, 'EV:', players[0].exit_velocity_avg);

    res.status(200).json({ players, total: players.length });
  } catch (err) {
    console.error('[Statcast] Error:', err.message);
    res.status(500).json({ error: err.message, players: [] });
  }
}

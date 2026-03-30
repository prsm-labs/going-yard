// api/statcast.js — Baseball Savant Statcast leaderboard proxy
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const { year = '2026', minAB = '5' } = req.query;

    const savantUrl = `https://baseballsavant.mlb.com/leaderboard/expected_statistics?type=batter&year=${year}&position=&team=&min=${minAB}&csv=true`;
    const battedUrl = `https://baseballsavant.mlb.com/leaderboard/statcast?abs=${minAB}&type=batter&year=${year}&position=&team=&min=${minAB}&csv=true`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/csv,text/plain,*/*',
      'Referer': 'https://baseballsavant.mlb.com/',
    };

    const [expectedRes, battedRes] = await Promise.all([
      fetch(savantUrl, { headers }).catch(() => null),
      fetch(battedUrl, { headers }).catch(() => null),
    ]);

    const parseCSV = (csv) => {
      if (!csv || csv.startsWith('{') || csv.startsWith('<')) return [];
      const rows = csv.trim().split('\n');
      if (rows.length < 2) return [];
      const hdrs = rows[0].split(',').map(h => h.replace(/"/g,'').trim());
      return rows.slice(1).filter(r => r.trim()).map(row => {
        const vals = []; let cur = '', inQ = false;
        for (const ch of row) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
          else cur += ch;
        }
        vals.push(cur.trim());
        const o = {};
        hdrs.forEach((h,i) => { o[h] = (vals[i]||'').replace(/"/g,'').trim(); });
        return o;
      });
    };

    const parseName = (r) => {
      const combined = r['last_name, first_name'] || r['last_name,first_name'] || '';
      if (combined.includes(',')) {
        const [last, ...firstParts] = combined.split(',');
        return `${firstParts.join(',').trim()} ${last.trim()}`;
      }
      const fn = r.first_name || r.player_first_name || '';
      const ln = r.last_name  || r.player_last_name  || '';
      if (fn || ln) return `${fn} ${ln}`.trim();
      return combined || '';
    };

    const expectedCsv = expectedRes?.ok ? await expectedRes.text() : '';
    const battedCsv   = battedRes?.ok   ? await battedRes.text()   : '';

    console.log('[Statcast] Expected rows:', expectedCsv.split('\n').length - 1);
    console.log('[Statcast] Batted rows:', battedCsv.split('\n').length - 1);

    const expectedData = parseCSV(expectedCsv);
    const battedData   = parseCSV(battedCsv);

    // Merge by player_id
    const battedMap = {};
    battedData.forEach(r => { if (r.player_id) battedMap[r.player_id] = r; });

    const source = expectedData.length > 0 ? expectedData : battedData;
    
    const players = source
      .filter(r => r.player_id)
      .map(r => {
        const b = battedMap[r.player_id] || {};
        const merged = { ...b, ...r };
        return {
          player_id: r.player_id,
          name: parseName(merged),
          team_name_abbrev: r.team_name_abbrev || b.team_name_abbrev || r.team_abbreviation || b.team_abbreviation || '—',
          // Expected stats
          xwoba:  r.xwoba  || r.est_woba || '',
          xba:    r.xba    || r.est_ba   || '',
          xslg:   r.xslg   || r.est_slg  || '',
          xobp:   r.xobp   || r.est_obp  || '',
          // Batted ball / Statcast
          exit_velocity_avg:    b.exit_velocity_avg    || b.avg_hit_speed    || '',
          launch_angle_avg:     b.launch_angle_avg     || b.avg_hit_angle    || '',
          barrel_batted_rate:   b.barrel_batted_rate   || b.brl_percent      || '',
          hard_hit_percent:     b.hard_hit_percent     || b.ev95percent      || '',
          sweet_spot_percent:   b.sweet_spot_percent   || b.anglesweetspotpercent || '',
          fb_percent:           b.fb_percent           || '',
          gb_percent:           b.gb_percent           || '',
          ld_percent:           b.ld_percent           || '',
          fbld:                 b.fbld                 || '',
          pull_percent:         b.pull_percent         || '',
          max_hit_speed:        b.max_hit_speed        || '',
          ev50:                 b.ev50                 || '',
          // Traditional
          ba:  r.ba  || b.ba  || '',
          slg: r.slg || b.slg || '',
          obp: r.obp || b.obp || '',
          ops: r.ops || b.ops || '',
          pa:  r.pa  || b.pa  || '',
          abs: r.abs || b.abs || b.ab || '',
          // Discipline
          oz_swing_percent: b.oz_swing_percent || b.o_swing_percent || '',
          z_contact_percent: b.z_contact_percent || '',
          strikeout_percent: r.strikeout_percent || b.k_percent || '',
          walk_percent: r.walk_percent || b.bb_percent || '',
        };
      })
      .filter(r => r.name && r.name !== '');

    console.log('[Statcast] Merged players:', players.length);
    if (players[0]) console.log('[Statcast] Sample:', players[0].name, players[0].team_name_abbrev);

    res.status(200).json({ players });
  } catch (err) {
    console.error('[Statcast] Error:', err.message);
    res.status(500).json({ error: err.message, players: [] });
  }
}

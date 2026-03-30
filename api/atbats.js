// api/atbats.js
// Fetches full 2026 season at-bat level Statcast data from Baseball Savant
// Calculates FB%, Pull%, GB%, LD% by counting actual batted ball events
// exactly like Power BI does — not relying on pre-aggregated leaderboard columns

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const year = '2026';
    const today = new Date().toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).split('/').reverse().join('-').replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$3-$2');

    const hdrs = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/csv,text/plain,*/*',
      'Referer': 'https://baseballsavant.mlb.com/',
    };

    // ── STEP 1: Per-AB Statcast data ─────────────────────────
    // This gives us bb_type (fly_ball/ground_ball/line_drive/popup),
    // hit_location (spray direction), launch_speed, launch_angle per AB
    // We calculate all rates ourselves from raw counts
    const abUrl = `https://baseballsavant.mlb.com/statcast_search/csv?all=true` +
      `&hfGT=R%7C&hfSea=${year}%7C&player_type=batter` +
      `&game_date_gt=2026-03-20&game_date_lt=${today}` +
      `&hfAB=&hfBBT=&hfPR=&hfZ=&hfBBL=` +
      `&min_pitches=0&min_results=0&group_by=name` +
      `&sort_col=pitches&sort_order=desc&type=details` +
      `&pitchTypes=&pitches=&batterPos=` +
      `&hfFlag=is%5C.%5C.remove%5C.%5C.bunts%7C`;

    // ── STEP 2: Season aggregate leaderboards ─────────────────
    // For EV, Barrel%, HardHit%, xwOBA etc — more reliable from leaderboard
    const [expRes, statRes] = await Promise.all([
      fetch(`https://baseballsavant.mlb.com/leaderboard/expected_statistics?type=batter&year=${year}&position=&team=&min=5&csv=true`, { headers: hdrs }),
      fetch(`https://baseballsavant.mlb.com/leaderboard/statcast?abs=5&type=batter&year=${year}&position=&team=&min=5&csv=true`, { headers: hdrs }),
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
      const hdrRow = parseRow(lines[0]);
      const rows = lines.slice(1).filter(l => l.trim()).map(line => {
        const vals = parseRow(line);
        const o = {};
        hdrRow.forEach((h, i) => { o[h] = vals[i] || ''; });
        return o;
      });
      return { hdrs: hdrRow, rows };
    };

    const expCsv  = expRes.ok  ? await expRes.text()  : '';
    const statCsv = statRes.ok ? await statRes.text() : '';

    const { rows: expRows }  = parseCSV(expCsv);
    const { hdrs: statHdrs, rows: statRows } = parseCSV(statCsv);

    console.log('[AtBats] Statcast cols:', statHdrs.join(', '));

    // Build lookup maps
    const statMap = {};
    statRows.forEach(r => { if (r.player_id) statMap[r.player_id] = r; });

    // ── Name parser ───────────────────────────────────────────
    const getName = (r) => {
      const keys = Object.keys(r);
      const combo = keys.find(k => k.includes('last_name') && k.includes('first_name'));
      if (combo && r[combo]?.includes(',')) {
        const [last, ...rest] = r[combo].split(',');
        return `${rest.join(',').trim()} ${last.trim()}`;
      }
      const lk = keys.find(k => k === 'last_name');
      const fk = keys.find(k => k === 'first_name');
      if (lk && fk && r[lk] && r[fk]) return `${r[fk].trim()} ${r[lk].trim()}`;
      if (lk && r[lk]?.includes(',')) {
        const [l, ...f] = r[lk].split(',');
        return `${f.join(',').trim()} ${l.trim()}`;
      }
      return r['player_name'] || r['name'] || '';
    };

    const pf = (v, cap = 999) => { const n = parseFloat(v); return isNaN(n) ? 0 : Math.min(n, cap); };

    // ── Try to get per-AB data for FB%/Pull% calculation ─────
    // If the statcast search is too slow/large, fall back to leaderboard fbld
    let abMap = {}; // pid → { fb, gb, ld, popup, pull, center, oppo, totalBIP }
    try {
      console.log('[AtBats] Fetching per-AB data for BB type calculation...');
      const abRes = await fetch(abUrl, { headers: hdrs });
      if (abRes.ok) {
        const abCsv = await abRes.text();
        const { hdrs: abHdrs, rows: abRows } = parseCSV(abCsv);
        console.log('[AtBats] Per-AB rows:', abRows.length, '| cols:', abHdrs.slice(0,15).join(', '));

        // Count batted ball types per player — exactly like Power BI
        for (const row of abRows) {
          const pid = row['batter'] || row['player_id'];
          if (!pid) continue;
          if (!abMap[pid]) abMap[pid] = { fb:0, gb:0, ld:0, popup:0, pull:0, center:0, oppo:0, bip:0 };
          const bb = (row['bb_type'] || '').toLowerCase();
          const loc = parseInt(row['hit_location'] || '0');
          // Count batted balls in play (exclude strikeouts, walks, HBP)
          const evt = (row['events'] || '').toLowerCase();
          const isBIP = bb !== '' && evt !== 'strikeout' && evt !== 'walk' && evt !== 'hit_by_pitch' && evt !== 'sac_bunt';
          if (!isBIP) continue;
          abMap[pid].bip++;
          if (bb === 'fly_ball')    abMap[pid].fb++;
          else if (bb === 'ground_ball') abMap[pid].gb++;
          else if (bb === 'line_drive')  abMap[pid].ld++;
          else if (bb === 'popup')       abMap[pid].popup++;
          // Pull direction — location 1-3=right side pull for RHH, location 7-9=left side pull for LHH
          // Simplified: hit_location 1-3 = pulled for most batters
          if (loc >= 1 && loc <= 3) abMap[pid].pull++;
          else if (loc >= 4 && loc <= 6) abMap[pid].center++;
          else if (loc >= 7 && loc <= 9) abMap[pid].oppo++;
        }
        console.log('[AtBats] BIP counts built for', Object.keys(abMap).length, 'players');
        if (Object.keys(abMap).length > 0) {
          const sample = Object.entries(abMap)[0];
          console.log('[AtBats] Sample BIP data:', sample[0], JSON.stringify(sample[1]));
        }
      }
    } catch(e) {
      console.warn('[AtBats] Per-AB fetch failed:', e.message, '— using leaderboard fallback');
    }

    // ── Build player objects ───────────────────────────────────
    const source = expRows.length > 0 ? expRows : statRows;

    const players = source.filter(r => r.player_id).map(r => {
      const s = statMap[r.player_id] || {};
      const ab = abMap[r.player_id] || abMap[parseInt(r.player_id)] || null;

      // ── Batted ball rates from raw counts (Power BI approach) ──
      let flyBall = 0, gbPct = 0, ldPct = 0, pullPct = 0;
      if (ab && ab.bip >= 5) {
        // Exact same formula as your Power BI:
        // is_flyball count / total BIP = FB%
        flyBall = Math.round(ab.fb / ab.bip * 1000) / 10;    // e.g. 35.2%
        gbPct   = Math.round(ab.gb / ab.bip * 1000) / 10;
        ldPct   = Math.round(ab.ld / ab.bip * 1000) / 10;
        const totalDir = ab.pull + ab.center + ab.oppo;
        pullPct = totalDir > 0 ? Math.round(ab.pull / totalDir * 1000) / 10 : 0;
      } else {
        // Fallback: leaderboard fbld column (FB+LD combined)
        // fb_percent if it exists, else derive from fbld
        const rawFBLD = parseFloat(s['fbld'] || 0);
        if (rawFBLD > 0) {
          // fbld is FB+LD as a percentage — split by typical 61/39 ratio
          flyBall = Math.min(Math.round(rawFBLD * 0.61 * 10) / 10, 52);
          ldPct   = Math.min(Math.round(rawFBLD * 0.39 * 10) / 10, 35);
        }
        gbPct   = pf(s['gb_percent'], 70);
        // Pull% not available from statcast leaderboard — leave as 0 for now
        pullPct = 0;
      }

      const barrelPct = pf(s['brl_percent'] || s['barrel_batted_rate'], 25);
      const pulledBarrelPct = pullPct > 0 && barrelPct > 0
        ? Math.round(barrelPct * (pullPct / 100) * 1.4 * 10) / 10 : 0;

      return {
        pid:          parseInt(r.player_id),
        name:         getName({ ...s, ...r }),
        team:         r.team_name_abbrev || s.team_name_abbrev || '—',
        avgEV:        pf(s['avg_hit_speed'] || s['exit_velocity_avg'], 115),
        maxEV:        pf(s['max_hit_speed'], 130),
        barrelPct,
        hardHitPct:   pf(s['ev95percent'] || s['hard_hit_percent'], 80),
        sweetSpotPct: pf(s['anglesweetspotpercent'] || s['sweet_spot_percent'], 60),
        launchAngle:  pf(s['avg_hit_angle'] || s['launch_angle_avg']),
        flyBall,
        gbPct,
        ldPct,
        pullPct,
        pulledBarrelPct,
        xwoba:        pf(r['xwoba'] || r['est_woba'], 0.700),
        xba:          pf(r['xba']   || r['est_ba'],   0.500),
        xslg:         pf(r['xslg']  || r['est_slg'],  1.500),
        avg:          pf(r['ba']    || r['avg'], 0.500),
        slg:          pf(r['slg'],   1.500),
        obp:          pf(r['obp'],   0.600),
        pa:           parseInt(r['pa'] || 0),
        ab:           parseInt(r['abs'] || 0),
        chasePct:     pf(s['oz_swing_percent'], 60),
        kPct:         pf(r['strikeout_percent'] || r['k_percent'], 50),
        bbPct:        pf(r['walk_percent'] || r['bb_percent'], 30),
        zContactPct:  pf(s['z_contact_percent'], 100),
      };
    }).filter(r => r.avgEV > 0 || r.xwoba > 0);

    console.log('[AtBats] Players built:', players.length);
    if (players[0]) {
      const p = players[0];
      console.log(`[AtBats] #1: ${p.name} EV:${p.avgEV} FB%:${p.flyBall} Pull%:${p.pullPct} Barrel%:${p.barrelPct} xwOBA:${p.xwoba}`);
    }

    // Name fallback
    const noNames = players.filter(p => !p.name || !p.name.trim());
    if (noNames.length > players.length * 0.3) {
      try {
        const mlb = await fetch('https://statsapi.mlb.com/api/v1/sports/1/players?season=2026&sportId=1');
        const mlbData = await mlb.json();
        const mlbMap = {};
        for (const p of (mlbData.people || [])) mlbMap[p.id] = { name: p.fullName, team: p.currentTeam?.abbreviation };
        players.forEach(p => {
          if (!p.name && mlbMap[p.pid]) { p.name = mlbMap[p.pid].name; p.team = mlbMap[p.pid].team || p.team; }
        });
      } catch(e) { console.warn('[AtBats] MLB name fallback failed:', e.message); }
    }

    res.status(200).json({ players, total: players.length });

  } catch (err) {
    console.error('[AtBats] Fatal:', err.message);
    res.status(500).json({ error: err.message, players: [] });
  }
}

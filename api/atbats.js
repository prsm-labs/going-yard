// api/atbats.js
// Fetches pre-aggregated player metrics from mlb_players_aggregated.json
// That file is generated daily by mlbdata_aggregate.py from the full at-bat log
// and committed to the repo at public/data/players.json
//
// All metrics in players.json are calculated from raw at-bat rows (not leaderboard averages)
// using the same logic as the Power BI DAX measures.
//
// Cache: 3-hour TTL

let PLAYER_CACHE = null;
let PLAYER_CACHE_TS = 0;
const THREE_HOURS = 3 * 60 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const now = Date.now();

    // 3-hour cache
    if (PLAYER_CACHE && (now - PLAYER_CACHE_TS) < THREE_HOURS) {
      console.log('[AtBats] Cache hit —', Math.round((now - PLAYER_CACHE_TS) / 60000), 'min old');
      return res.status(200).json({ players: PLAYER_CACHE, total: PLAYER_CACHE.length, fromCache: true });
    }

    // Fetch pre-aggregated JSON from the repo's public folder
    // This file is produced by mlbdata_aggregate.py and committed daily
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    let data = null;

    // Try local static file first (Vercel serves public/ at root)
    try {
      const staticRes = await fetch(`${baseUrl}/data/players.json`, {
        headers: { 'Accept': 'application/json' }
      });
      if (staticRes.ok) {
        data = await staticRes.json();
        console.log('[AtBats] Loaded from static file:', data?.total, 'players');
      }
    } catch(e) {
      console.warn('[AtBats] Static file fetch failed:', e.message);
    }

    // Fallback: try GitHub raw URL (for when static file isn't committed yet)
    if (!data?.players?.length) {
      try {
        const ghRes = await fetch(
          'https://raw.githubusercontent.com/prsm-labs/going-yard/main/public/data/players.json',
          { headers: { 'Accept': 'application/json' } }
        );
        if (ghRes.ok) {
          data = await ghRes.json();
          console.log('[AtBats] Loaded from GitHub:', data?.total, 'players');
        }
      } catch(e) {
        console.warn('[AtBats] GitHub fetch failed:', e.message);
      }
    }

    // Last fallback: Baseball Savant leaderboard (season averages)
    // Used on day 1 before first players.json is committed
    if (!data?.players?.length) {
      console.log('[AtBats] No players.json found — falling back to Savant leaderboard');
      return await savantFallback(res);
    }

    const players = data.players.map(p => normalizePlayer(p));
    const valid = players.filter(p => p.pid && p.avgEV > 0);

    PLAYER_CACHE = valid;
    PLAYER_CACHE_TS = now;

    console.log(`[AtBats] Ready: ${valid.length} players | Generated: ${data.generated || 'unknown'}`);
    res.status(200).json({ players: valid, total: valid.length, generated: data.generated });

  } catch (err) {
    console.error('[AtBats] Fatal:', err.message);
    if (PLAYER_CACHE) {
      return res.status(200).json({ players: PLAYER_CACHE, total: PLAYER_CACHE.length, fromCache: true });
    }
    return await savantFallback(res);
  }
}

// Normalize player object from aggregated JSON to match app field names
function normalizePlayer(p) {
  return {
    pid:          p.pid,
    team:         p.team       || '—',
    hand:         p.hand       || 'R',
    pos:          p.pos        || '',
    // Core Statcast — from raw at-bat rows
    avgEV:        p.avgEV      || 0,
    maxEV:        p.maxEV      || 0,
    barrel:       p.barrel     || 0,
    hardHit:      p.hardHit    || 0,
    sweetSpot:    p.sweetSpot  || 0,
    launchAngle:  p.launchAngle|| 0,
    flyBall:      p.flyBall    || 0,
    pullAir:      p.pullAir    || 0,
    pulledBarrel: p.pulledBarrel|| 0,
    almostHRPct:  p.almostHR   || 0,
    oSwing:       p.chasePct   || p.oSwing || 0,
    zContact:     p.zContact   || 0,
    // Traditional
    avg:          p.avg        || 0,
    hits:         p.hits       || 0,
    hr:           p.hr         || 0,
    xbh:          p.xbh        || 0,
    bb:           p.bb         || 0,
    k:            p.k          || 0,
    bbPct:        p.bbPct      || 0,
    kPct:         p.kPct       || 0,
    totalBases:   p.totalBases || 0,
    abPerHR:      p.abPerHR    || 99,
    pa:           p.pa         || 0,
    ab:           p.ab         || 0,
    bip:          p.bip        || 0,
    // Days since HR — from real game log
    daysSinceHR:  p.daysSinceHR !== undefined ? p.daysSinceHR : (p.careerDaysSinceHR || null),
    lastHRDate:   p.lastHRDate || p.careerLastHRDate || null,
    careerHR:     p.careerHR   || p.hr || 0,
    careerAB:     p.careerAB   || p.ab || 0,
    // Splits — for pitch type and handedness filters
    vsRHP:        p.vsRHP      || null,
    vsLHP:        p.vsLHP      || null,
    pitchSplits:  p.pitchSplits|| {},
    windows:      p.windows    || {},
    // xwOBA will be null until added to the aggregate script
    xwoba: 0, xba: 0, xslg: 0,
  };
}

// Savant leaderboard fallback — used on day 1 before players.json exists
async function savantFallback(res) {
  try {
    const hdrs = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/csv,*/*',
      'Referer': 'https://baseballsavant.mlb.com/',
    };
    const year = '2026';
    const [expRes, statRes] = await Promise.all([
      fetch(`https://baseballsavant.mlb.com/leaderboard/expected_statistics?type=batter&year=${year}&position=&team=&min=5&csv=true`, { headers: hdrs }),
      fetch(`https://baseballsavant.mlb.com/leaderboard/statcast?abs=5&type=batter&year=${year}&position=&team=&min=5&csv=true`, { headers: hdrs }),
    ]);
    const parseCSV = (csv) => {
      if (!csv || csv.length < 50 || csv.startsWith('<')) return [];
      const lines = csv.trim().split('\n');
      const hdrow = lines[0].split(',').map(h => h.replace(/"/g,'').trim());
      return lines.slice(1).filter(l=>l.trim()).map(line => {
        const vals = []; let cur='',inQ=false;
        for (const ch of line) { if(ch==='"'){inQ=!inQ;}else if(ch===','&&!inQ){vals.push(cur.trim());cur='';}else cur+=ch; }
        vals.push(cur.trim());
        const o={}; hdrow.forEach((h,i)=>{o[h]=(vals[i]||'').replace(/^"|"$/g,'').trim();}); return o;
      });
    };
    const expRows  = expRes.ok  ? parseCSV(await expRes.text())  : [];
    const statRows = statRes.ok ? parseCSV(await statRes.text()) : [];
    const statMap  = {}; statRows.forEach(r => { if(r.player_id) statMap[r.player_id]=r; });
    const pf = (v,cap=999) => { const n=parseFloat(v); return isNaN(n)?0:Math.min(n,cap); };
    const getName = (r) => {
      const lk=Object.keys(r).find(k=>k.includes('last_name'));
      const fk=Object.keys(r).find(k=>k.includes('first_name'));
      if(lk&&fk&&r[lk]&&r[fk]) return `${r[fk].trim()} ${r[lk].trim()}`;
      if(lk&&r[lk]?.includes(',')){ const[l,...f]=r[lk].split(','); return `${f.join(',').trim()} ${l.trim()}`; }
      return r['player_name']||'';
    };
    const players = (expRows.length>0?expRows:statRows).filter(r=>r.player_id).map(r => {
      const s=statMap[r.player_id]||{};
      return {
        pid: parseInt(r.player_id), team: r.team_name_abbrev||s.team_name_abbrev||'—',
        hand:'R', pos:'', name: getName({...s,...r}),
        avgEV: pf(s.avg_hit_speed||s.exit_velocity_avg,115),
        barrel: pf(s.brl_percent||s.barrel_batted_rate,25),
        hardHit: pf(s.ev95percent||s.hard_hit_percent,80),
        sweetSpot: pf(s.anglesweetspotpercent||s.sweet_spot_percent,60),
        launchAngle: pf(s.avg_hit_angle||s.launch_angle_avg),
        flyBall: pf(s.fb_percent,52),
        pullAir: 0, pulledBarrel:0, almostHRPct:0,
        oSwing: pf(s.oz_swing_percent,60), zContact: pf(s.z_contact_percent,100),
        xwoba: pf(r.xwoba||r.est_woba,0.7), xba:pf(r.xba||r.est_ba,0.5), xslg:pf(r.xslg||r.est_slg,1.5),
        avg:pf(r.ba||r.avg,0.5), pa:parseInt(r.pa||0), ab:parseInt(r.abs||0),
        bbPct:pf(r.walk_percent||r.bb_percent,30), kPct:pf(r.strikeout_percent||r.k_percent,50),
        hits:0,hr:0,xbh:0,bb:0,k:0,totalBases:0,abPerHR:99,bip:0,
        daysSinceHR:null,careerHR:0,careerAB:0,
        vsRHP:null,vsLHP:null,pitchSplits:{},windows:{},
      };
    }).filter(p=>p.avgEV>0||p.xwoba>0);
    res.status(200).json({ players, total: players.length, fallback: true });
  } catch(e) {
    res.status(500).json({ error: e.message, players: [] });
  }
}

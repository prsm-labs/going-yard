// api/statcast.js — Baseball Savant Statcast leaderboard proxy
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const { year = '2026', minAB = '10' } = req.query;

    // Fetch two endpoints and merge:
    // 1. Expected stats (xBA, xSLG, xwOBA, EV, Barrel%, HardHit%)
    // 2. Batted ball (FB%, GB%, Pull%, Sprint speed)
    const [expectedRes, battedRes] = await Promise.all([
      fetch(`https://baseballsavant.mlb.com/leaderboard/expected_statistics?type=batter&year=${year}&position=&team=&min=${minAB}&csv=true`, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://baseballsavant.mlb.com/' }
      }),
      fetch(`https://baseballsavant.mlb.com/leaderboard/statcast?abs=${minAB}&type=batter&year=${year}&position=&team=&min=${minAB}&csv=true`, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://baseballsavant.mlb.com/' }
      }),
    ]);

    const expectedCsv = expectedRes.ok ? await expectedRes.text() : '';
    const battedCsv   = battedRes.ok  ? await battedRes.text()   : '';

    // Log headers for debugging
    console.log('[Statcast] Expected headers:', expectedCsv.split('\n')[0]?.slice(0, 400));
    console.log('[Statcast] Batted headers:',  battedCsv.split('\n')[0]?.slice(0, 400));

    // Return both as JSON so we can merge on player_id in the app
    const parseCSV = (csv) => {
      if (!csv || csv.startsWith('{')) return [];
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
        const o = {}; hdrs.forEach((h,i) => { o[h] = (vals[i]||'').replace(/"/g,'').trim(); });
        return o;
      });
    };

    const expectedData = parseCSV(expectedCsv);
    const battedData   = parseCSV(battedCsv);

    console.log('[Statcast] Expected rows:', expectedData.length, 'Batted rows:', battedData.length);
    if (expectedData[0]) console.log('[Statcast] Expected sample:', JSON.stringify(Object.fromEntries(Object.entries(expectedData[0]).slice(0,12))));
    if (battedData[0])   console.log('[Statcast] Batted sample:',  JSON.stringify(Object.fromEntries(Object.entries(battedData[0]).slice(0,12))));

    // Merge by player_id
    const battedMap = {};
    battedData.forEach(r => { if (r.player_id) battedMap[r.player_id] = r; });

    const merged = expectedData.map(r => ({
      ...battedMap[r.player_id] || {},
      ...r, // expected stats take priority for shared fields
    }));

    res.status(200).json({ players: merged.length > 0 ? merged : battedData });
  } catch (err) {
    console.error('[Statcast] Error:', err.message);
    res.status(500).json({ error: err.message, players: [] });
  }
}

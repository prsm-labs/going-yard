// api/statcast.js
// Fetches real Statcast data from Baseball Savant
// Uses the custom stats endpoint which has accurate per-player metrics
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const { year = '2026', minAB = '10' } = req.query;

    // Use the Baseball Savant expected stats / Statcast leaderboard
    // This endpoint returns: xBA, xSLG, xwOBA, EV, LA, Barrel%, HardHit%, Sprint speed etc.
    const url = `https://baseballsavant.mlb.com/leaderboard/statcast?abs=${minAB}&type=batter&year=${year}&position=&team=&min=${minAB}&csv=true`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/csv,text/plain,*/*',
        'Referer': 'https://baseballsavant.mlb.com/leaderboard/statcast',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) throw new Error(`Savant ${response.status}`);
    const csv = await response.text();
    const lines = csv.split('\n');

    // Log actual headers so we know exactly what columns exist
    console.log('[Statcast] Headers:', lines[0]?.slice(0, 500));
    console.log('[Statcast] Row count:', lines.length);
    console.log('[Statcast] Sample row:', lines[1]?.slice(0, 300));

    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(csv);
  } catch (err) {
    console.error('[Statcast] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

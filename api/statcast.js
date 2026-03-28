// api/statcast.js
// Proxies Baseball Savant Statcast leaderboard — bypasses CORS
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const { year = '2026', minAB = '25', type = 'batter' } = req.query;

    // Primary: exit velo / barrel / contact quality leaderboard
    const url = `https://baseballsavant.mlb.com/leaderboard/statcast?abs=${minAB}&type=${type}&year=${year}&position=&team=&min=q&csv=true`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/csv, text/plain, */*',
        'Referer': 'https://baseballsavant.mlb.com/',
      }
    });

    if (!response.ok) throw new Error(`Savant error: ${response.status}`);

    const csv = await response.text();

    // Log first line of CSV for debugging
    const firstLine = csv.split('\n')[0];
    console.log('[Statcast API] Headers:', firstLine.slice(0, 300));

    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(csv);
  } catch (err) {
    console.error('[Statcast API] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

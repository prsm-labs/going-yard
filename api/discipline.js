// api/discipline.js
// Fetches plate discipline stats from Baseball Savant
// Provides: BB%, K%, O-Swing%, Z-Contact% per player
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const { year = '2025' } = req.query;

    // Statcast discipline leaderboard
    const url = `https://baseballsavant.mlb.com/leaderboard/statcast?abs=25&type=batter&year=${year}&position=&team=&min=q&csv=true&sort=k_percent&sortDir=asc`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/csv, text/plain, */*',
        'Referer': 'https://baseballsavant.mlb.com/',
      }
    });

    if (!response.ok) throw new Error(`Savant discipline error: ${response.status}`);

    const csv = await response.text();
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(csv);
  } catch (err) {
    console.error('[Discipline API] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

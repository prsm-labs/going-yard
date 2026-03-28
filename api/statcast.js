// api/statcast.js
// Vercel Serverless Function — proxies Baseball Savant to avoid CORS
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const { year = '2025', minAB = '25' } = req.query;

    const url = `https://baseballsavant.mlb.com/leaderboard/statcast?abs=${minAB}&type=batter&year=${year}&position=&team=&min=q&csv=true`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GoingYard/1.0)',
        'Accept': 'text/csv,*/*',
      }
    });

    if (!response.ok) throw new Error(`Savant error: ${response.status}`);

    const csv = await response.text();
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

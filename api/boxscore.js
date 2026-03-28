// api/boxscore.js
// Vercel Serverless Function — proxies MLB boxscore API
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const { gamePk } = req.query;
    if (!gamePk) return res.status(400).json({ error: 'gamePk required' });

    const url = `https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`MLB API error: ${response.status}`);

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

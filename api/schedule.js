// api/schedule.js
// Vercel Serverless Function — proxies MLB Stats API to avoid CORS
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const { date } = req.query;
    const today = date || new Date().toISOString().slice(0, 10);

    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=linescore,boxscore,decisions,person,stats,probablePitcher,lineups`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`MLB API error: ${response.status}`);

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

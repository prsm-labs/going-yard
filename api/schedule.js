// api/schedule.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const { date } = req.query;
    const today = date || new Date().toISOString().slice(0, 10);
    // Use simpler hydration — team,linescore,probablePitcher is most reliable
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team,linescore,probablePitcher,lineups`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`MLB API ${response.status}`);
    const data = await response.json();

    // Log what we're getting for debugging
    const firstGame = data.dates?.[0]?.games?.[0];
    console.log('[Schedule] First game teams:',
      firstGame?.teams?.away?.team?.abbreviation,
      'vs',
      firstGame?.teams?.home?.team?.abbreviation
    );
    console.log('[Schedule] Total games:', data.dates?.[0]?.games?.length ?? 0);

    res.status(200).json(data);
  } catch (err) {
    console.error('[Schedule] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

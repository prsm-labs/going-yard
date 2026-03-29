// api/schedule.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const { date } = req.query;

    // Use Eastern Time if no date provided — MLB schedule is ET-based
    let today = date;
    if (!today) {
      const etDate = new Date().toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        year: "numeric", month: "2-digit", day: "2-digit"
      });
      const [m,d,y] = etDate.split("/");
      today = `${y}-${m}-${d}`;
    }

    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team,linescore,probablePitcher,lineups`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`MLB API ${response.status}`);
    const data = await response.json();

    const games = data.dates?.[0]?.games || [];
    console.log(`[Schedule] date=${today} games=${games.length}`);
    games.slice(0,3).forEach(g => {
      console.log(`  ${g.teams?.away?.team?.abbreviation}@${g.teams?.home?.team?.abbreviation} status=${g.status?.abstractGameState} coded=${g.status?.codedGameState}`);
    });

    res.status(200).json(data);
  } catch (err) {
    console.error('[Schedule] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

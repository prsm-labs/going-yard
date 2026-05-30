// api/savant.js — Vercel serverless proxy for Baseball Savant gf endpoint
// Fetches real-time bat speed + Statcast data from Savant's gamefeed API
// Called by Bat Tracking tab: /api/savant?game_pk=XXXXXX

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { game_pk } = req.query;
  if (!game_pk || !/^\d+$/.test(game_pk)) {
    return res.status(400).json({ error: 'Invalid game_pk' });
  }

  try {
    const url = `https://baseballsavant.mlb.com/gf?game_pk=${game_pk}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://baseballsavant.mlb.com/',
        'Origin': 'https://baseballsavant.mlb.com',
      },
    });

    if (!r.ok) {
      return res.status(r.status).json({ error: `Savant returned ${r.status}` });
    }

    const data = await r.json();

    // Extract bat speed keyed by play_id (format: gamePk_atBatIndex)
    // Savant gf response has home_team_data and away_team_data arrays
    // Each play has: play_id, bat_speed, swing_length, attack_angle etc.
    const batSpeeds = {};

    const processPlays = (plays) => {
      if (!Array.isArray(plays)) return;
      plays.forEach(play => {
        const pid = play.play_id;
        if (pid && play.bat_speed != null) {
          batSpeeds[pid] = {
            bat_speed:    play.bat_speed,
            swing_length: play.swing_length   ?? null,
            attack_angle: play.attack_angle   ?? null,
            squared_up:   play.squared_up_percent ?? null,
          };
        }
      });
    };

    // Savant gf returns data keyed by team — try both structures
    if (data.home_team_data) processPlays(data.home_team_data);
    if (data.away_team_data) processPlays(data.away_team_data);
    // Also try top-level arrays
    if (Array.isArray(data.plays)) processPlays(data.plays);
    if (Array.isArray(data)) processPlays(data);

    // Cache for 30 seconds (live games) — aggressive enough to stay fresh
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.status(200).json({ game_pk, bat_speeds: batSpeeds, count: Object.keys(batSpeeds).length });

  } catch (err) {
    console.error('[savant proxy]', err.message);
    res.status(500).json({ error: err.message });
  }
}

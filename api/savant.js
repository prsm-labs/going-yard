// api/savant.js — Vercel serverless proxy for Baseball Savant gf endpoint
// Savant gf response uses: team_home[] and team_away[] arrays
// Each item has: play_id, batSpeed, ab_number, launch_speed, launch_angle etc.
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

    // Savant gf uses team_home[] and team_away[] — each pitch/play has batSpeed
    // play_id format matches our {gamePk}_{atBatNumber} key
    const batSpeeds = {};

    const processPlay = (play) => {
      if (!play) return;
      const pid = play.play_id;
      if (!pid) return;
      // batSpeed is camelCase in Savant gf response
      const bs = play.batSpeed ?? play.bat_speed ?? null;
      if (bs != null && Number(bs) > 0) {
        batSpeeds[pid] = {
          bat_speed:    Number(bs),
          swing_length: play.swing_length ?? null,
          attack_angle: play.attack_angle ?? null,
          hit_speed:    play.hit_speed_round ?? null,
        };
      }
    };

    // The two main pitch arrays
    if (Array.isArray(data.team_home)) data.team_home.forEach(processPlay);
    if (Array.isArray(data.team_away)) data.team_away.forEach(processPlay);
    // Fallback — also check exit_velocity array (another pitch array)
    if (Array.isArray(data.exit_velocity)) data.exit_velocity.forEach(processPlay);

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.status(200).json({
      game_pk,
      bat_speeds: batSpeeds,
      count: Object.keys(batSpeeds).length,
    });

  } catch (err) {
    console.error('[savant proxy]', err.message);
    res.status(500).json({ error: err.message });
  }
}

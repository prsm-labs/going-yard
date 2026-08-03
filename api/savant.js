// api/savant.js — Vercel serverless proxy for Baseball Savant gf endpoint
// Savant gf response uses: team_home[] and team_away[] arrays, one entry per
// PITCH (not just batted balls). Each entry has real per-pitch Statcast data
// that MLB's own Stats API playByPlay endpoint doesn't expose, keyed by the
// same play_id (pitch UUID) BatTrackingTab already resolves from MLB's PBP
// events (details?.playId / details?.event_uuid).
//
// EXPANDED 2026-08-02 (Bat Tracking visual overhaul) — verified live against
// real completed games before building anything: the gf response's per-pitch
// object genuinely includes `xba` (real Statcast expected BA, e.g. ".470"),
// `contextMetrics.homeRunBallparks` (real 0-30 count — exactly the "HR
// ballparks" stat), `hc_x_ft`/`hc_y_ft` (hit coordinates, ALREADY converted
// to feet — no pixel-to-feet conversion needed), `is_barrel`, `spin_rate`,
// and `stand` (batter handedness). Previously this endpoint only surfaced
// bat_speed/swing_length/attack_angle and discarded everything else.
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

    // Keyed by play_id (pitch UUID) — matches BatTrackingTab's savantPlayId
    // resolution from MLB PBP's details.playId / details.event_uuid.
    const plays = {};

    const processPlay = (play) => {
      if (!play) return;
      const pid = play.play_id;
      if (!pid) return;
      const bs = play.batSpeed ?? play.bat_speed ?? null;
      // xba/hit_distance/hit_speed/launch_angle arrive as numeric-looking
      // strings from Savant (e.g. ".470", "385") — coerce, don't trust type.
      const num = v => (v == null || v === '') ? null : Number(v);
      plays[pid] = {
        bat_speed:      num(bs) > 0 ? num(bs) : null,
        swing_length:   play.swing_length ?? null,
        attack_angle:   play.attack_angle ?? null,
        xba:            num(play.xba),
        hr_ballparks:   play.contextMetrics?.homeRunBallparks ?? null,
        hc_x_ft:        num(play.hc_x_ft),
        hc_y_ft:         num(play.hc_y_ft),
        is_barrel:      play.is_barrel === 1,
        spin_rate:      num(play.spin_rate),
        stand:          play.stand || null, // batter hand, 'L'/'R' — Savant's own field
      };
    };

    if (Array.isArray(data.team_home)) data.team_home.forEach(processPlay);
    if (Array.isArray(data.team_away)) data.team_away.forEach(processPlay);
    if (Array.isArray(data.exit_velocity)) data.exit_velocity.forEach(processPlay);

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.status(200).json({
      game_pk,
      plays,
      count: Object.keys(plays).length,
    });

  } catch (err) {
    console.error('[savant proxy]', err.message);
    res.status(500).json({ error: err.message });
  }
}

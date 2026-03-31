// api/boxscore.js — MLB game boxscore + live feed Statcast proxy
// Fetches both boxscore AND live feed play-by-play server-side
// Avoids CORS issues with direct browser calls to statsapi.mlb.com
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const { gamePk } = req.query;
    if (!gamePk) return res.status(400).json({ error: 'gamePk required' });

    const headers = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' };

    // Fetch boxscore and live feed in parallel
    const [boxRes, liveRes] = await Promise.all([
      fetch(`https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`, { headers }),
      fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`, { headers }),
    ]);

    if (!boxRes.ok) throw new Error(`Boxscore ${boxRes.status}`);
    const boxData = await boxRes.json();

    // Parse live feed for Statcast hitData per batter
    // Returns map: batterId → { evs, las, distances, hardHits, barrels }
    const statcastByBatter = {};

    if (liveRes.ok) {
      const liveData = await liveRes.json();
      const plays = liveData?.liveData?.plays?.allPlays || [];

      for (const play of plays) {
        const batterId = play.matchup?.batter?.id;
        if (!batterId) continue;

        if (!statcastByBatter[batterId]) {
          statcastByBatter[batterId] = {
            evs: [], las: [], distances: [],
            hardHits: 0, barrels: 0
          };
        }

        const sc = statcastByBatter[batterId];

        // Each play has playEvents — find the terminal batted ball event
        for (const evt of (play.playEvents || [])) {
          const hd = evt.hitData;
          if (!hd?.launchSpeed) continue; // only batted balls have hitData

          const ev   = parseFloat(hd.launchSpeed   || 0);
          const la   = parseFloat(hd.launchAngle   || 0);
          const dist = parseFloat(hd.totalDistance || 0);

          if (ev <= 0) continue;

          sc.evs.push(ev);
          sc.las.push(la);
          if (dist > 0) sc.distances.push(dist);

          // Hard Hit: ≥ 95 mph per Statcast/Baseball Savant definition
          if (ev >= 95) sc.hardHits++;

          // Barrel: official MLB Statcast barrel zones
          // EV ≥ 98 + LA 26-30°, expanding as EV increases
          const barrel =
            (ev >= 116) ||
            (ev >= 110 && la >= 18 && la <= 42) ||
            (ev >= 105 && la >= 22 && la <= 38) ||
            (ev >= 103 && la >= 24 && la <= 36) ||
            (ev >= 101 && la >= 25 && la <= 35) ||
            (ev >= 99  && la >= 25 && la <= 33) ||
            (ev >= 98  && la >= 26 && la <= 30);
          if (barrel) sc.barrels++;
        }
      }
    }

    console.log(`[Boxscore] gamePk=${gamePk} | Statcast batters with data: ${Object.keys(statcastByBatter).length}`);
    if (Object.keys(statcastByBatter).length > 0) {
      const sample = Object.entries(statcastByBatter)[0];
      console.log(`[Boxscore] Sample batter ${sample[0]}:`, JSON.stringify(sample[1]));
    }

    // Attach statcast data to the response
    res.status(200).json({
      ...boxData,
      statcastByBatter,
    });

  } catch (err) {
    console.error('[Boxscore] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

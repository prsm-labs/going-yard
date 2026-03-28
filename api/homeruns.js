// api/homeruns.js
// Fetches all home runs hit today from MLB Stats API
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const { date } = req.query;
    const today = date || new Date().toISOString().slice(0, 10);

    // Get today's schedule
    const schedRes = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team`
    );
    const schedData = await schedRes.json();
    const games = schedData.dates?.[0]?.games || [];

    const allHRs = [];

    // Fetch play-by-play for each game to find HRs
    await Promise.all(games.map(async (game) => {
      try {
        const pbpRes = await fetch(
          `https://statsapi.mlb.com/api/v1/game/${game.gamePk}/playByPlay`
        );
        const pbpData = await pbpRes.json();
        const awayAbbr = game.teams?.away?.team?.abbreviation || "???";
        const homeAbbr = game.teams?.home?.team?.abbreviation || "???";

        for (const play of (pbpData.allPlays || [])) {
          const result = play.result;
          if (result?.eventType !== "home_run") continue;

          const batter = play.matchup?.batter;
          const pitcher = play.matchup?.pitcher;
          const about = play.about;
          const hitData = play.hitData || {};

          // RBI count from description
          const desc = result.description || "";
          const rbiMatch = desc.match(/(\d+)-run/i);
          const rbi = rbiMatch ? parseInt(rbiMatch[1]) : 1;

          // Solo/multi-run label
          const hrType = rbi === 1 ? "Solo" : rbi === 2 ? "2-Run" : rbi === 3 ? "3-Run" : "Grand Slam 🎉";

          allHRs.push({
            gamePk: game.gamePk,
            gameId: `${awayAbbr} @ ${homeAbbr}`,
            awayAbbr, homeAbbr,
            batterName: batter?.fullName || "Unknown",
            batterId: batter?.id,
            batterTeam: about?.halfInning === "top" ? awayAbbr : homeAbbr,
            pitcherName: pitcher?.fullName || "Unknown",
            pitcherId: pitcher?.id,
            pitcherTeam: about?.halfInning === "top" ? homeAbbr : awayAbbr,
            inning: about?.inning || 0,
            halfInning: about?.halfInning || "top",
            outs: about?.outs || 0,
            rbi,
            hrType,
            exitVelo: hitData.launchSpeed ? Math.round(hitData.launchSpeed * 10) / 10 : null,
            launchAngle: hitData.launchAngle ? Math.round(hitData.launchAngle * 10) / 10 : null,
            distance: hitData.totalDistance ? Math.round(hitData.totalDistance) : null,
            pitch: play.matchup?.pitchHand ? null : null, // pitch type not in this endpoint
            description: desc,
            atBatIndex: about?.atBatIndex || 0,
            // Runners on base at time of HR
            rob: play.runners?.filter(r => r.movement?.start && r.movement?.start !== "score")?.length || 0,
          });
        }
      } catch(e) {
        console.warn(`[HRs] Game ${game.gamePk} failed:`, e.message);
      }
    }));

    // Sort by most recent (highest atBatIndex across games)
    allHRs.sort((a, b) => b.atBatIndex - a.atBatIndex || b.gamePk - a.gamePk);

    console.log(`[HRs] Found ${allHRs.length} home runs for ${today}`);
    res.status(200).json({ date: today, homeruns: allHRs, total: allHRs.length });
  } catch (err) {
    console.error('[HRs] Error:', err.message);
    res.status(500).json({ error: err.message, homeruns: [] });
  }
}

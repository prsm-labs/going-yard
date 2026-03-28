// api/homeruns.js
// Fetches all HRs today using MLB live feed which includes hitData (EV, distance, angle)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const { date } = req.query;
    const today = date || new Date().toISOString().slice(0, 10);

    // Step 1: Get today's games
    const schedRes = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team,linescore`
    );
    const schedData = await schedRes.json();
    const games = schedData.dates?.[0]?.games || [];
    console.log(`[HRs] ${games.length} games on ${today}`);

    const allHRs = [];

    // Step 2: For each game fetch the live feed — contains full hitData per play
    await Promise.all(games.map(async (game) => {
      try {
        const awayAbbr = game.teams?.away?.team?.abbreviation || "???";
        const homeAbbr = game.teams?.home?.team?.abbreviation || "???";
        const status = game.status?.abstractGameState || "Preview";

        // Skip games that haven't started
        if (status === "Preview") return;

        // Use the live game feed which has hitData.launchSpeed, totalDistance, launchAngle
        const feedRes = await fetch(
          `https://statsapi.mlb.com/api/v1.1/game/${game.gamePk}/feed/live?fields=liveData,plays,allPlays,result,about,matchup,hitData,pitchIndex,playEvents,details,type,description`
        );
        const feedData = await feedRes.json();
        const allPlays = feedData.liveData?.plays?.allPlays || [];

        for (const play of allPlays) {
          const result = play.result;
          if (result?.eventType !== "home_run") continue;

          const batter = play.matchup?.batter;
          const pitcher = play.matchup?.pitcher;
          const about = play.about;

          // hitData lives on the last play event
          const playEvents = play.playEvents || [];
          const lastEvent = [...playEvents].reverse().find(e => e.hitData) || {};
          const hitData = lastEvent.hitData || play.hitData || {};

          // Get pitch type from the last pitch event
          const lastPitch = [...playEvents].reverse().find(e => e.details?.type?.description);
          const pitchType = lastPitch?.details?.type?.description || null;

          const desc = result.description || "";
          const rbiMatch = desc.match(/(\d+)-run/i);
          const rbi = rbiMatch ? parseInt(rbiMatch[1]) : 1;
          const hrType = rbi >= 4 ? "Grand Slam 🎉" : rbi === 3 ? "3-Run" : rbi === 2 ? "2-Run" : "Solo";

          const exitVelo = hitData.launchSpeed
            ? Math.round(hitData.launchSpeed * 10) / 10
            : null;
          const distance = hitData.totalDistance
            ? Math.round(hitData.totalDistance)
            : null;
          const launchAngle = hitData.launchAngle
            ? Math.round(hitData.launchAngle * 10) / 10
            : null;

          // Runners on base
          const rob = (play.runners || []).filter(r =>
            r.movement?.originBase && r.movement?.originBase !== "score"
          ).length;

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
            outs: about?.outs ?? 0,
            rbi, hrType, rob,
            exitVelo,
            launchAngle,
            distance,
            pitchType,
            description: desc,
            atBatIndex: about?.atBatIndex || 0,
          });
        }
      } catch(e) {
        console.warn(`[HRs] Game ${game.gamePk} failed:`, e.message);
      }
    }));

    // Sort by most recent first
    allHRs.sort((a, b) => b.atBatIndex - a.atBatIndex || b.inning - a.inning);

    console.log(`[HRs] Found ${allHRs.length} home runs for ${today}`);
    res.status(200).json({ date: today, homeruns: allHRs, total: allHRs.length });
  } catch (err) {
    console.error('[HRs] Error:', err.message);
    res.status(500).json({ error: err.message, homeruns: [] });
  }
}

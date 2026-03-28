// api/homeruns.js
// Fetches today's HRs — batched parallel with per-game timeout
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const { date } = req.query;
    const today = date || new Date().toISOString().slice(0, 10);

    // Get schedule
    const schedRes = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team,linescore`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!schedRes.ok) throw new Error(`Schedule ${schedRes.status}`);
    const schedData = await schedRes.json();

    const games = (schedData.dates?.[0]?.games || [])
      .filter(g => g.status?.abstractGameState !== "Preview");

    console.log(`[HRs] ${games.length} active games on ${today}`);
    if (games.length === 0) {
      return res.status(200).json({ date: today, homeruns: [], total: 0 });
    }

    // Fetch each game's play-by-play with a strict 5s timeout per game
    // Use batches of 5 to avoid hammering the API
    const allHRs = [];
    const BATCH = 5;

    for (let i = 0; i < games.length; i += BATCH) {
      const batch = games.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(game => fetchGameHRs(game))
      );
      for (const r of results) {
        if (r.status === "fulfilled") allHRs.push(...r.value);
      }
    }

    allHRs.sort((a, b) => b.atBatIndex - a.atBatIndex || b.inning - a.inning);
    console.log(`[HRs] Returning ${allHRs.length} home runs`);
    res.status(200).json({ date: today, homeruns: allHRs, total: allHRs.length });

  } catch (err) {
    console.error('[HRs] Fatal:', err.message);
    res.status(500).json({ error: err.message, homeruns: [] });
  }
}

async function fetchGameHRs(game) {
  const awayAbbr = game.teams?.away?.team?.abbreviation || "???";
  const homeAbbr = game.teams?.home?.team?.abbreviation || "???";
  const hrs = [];

  try {
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/game/${game.gamePk}/playByPlay`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return hrs;
    const data = await res.json();
    const plays = data.allPlays || [];

    for (const play of plays) {
      const eventType = (play.result?.eventType || "").toLowerCase();
      const event = (play.result?.event || "").toLowerCase();
      if (!eventType.includes("home_run") && !event.includes("home run")) continue;

      const batter = play.matchup?.batter;
      const pitcher = play.matchup?.pitcher;
      const about = play.about || {};
      const desc = play.result?.description || "";

      // Extract Statcast data
      let ev = null, dist = null, la = null, pitch = null;
      const hd = play.hitData || {};
      if (hd.launchSpeed) ev = Math.round(hd.launchSpeed * 10) / 10;
      if (hd.totalDistance) dist = Math.round(hd.totalDistance);
      if (hd.launchAngle) la = Math.round(hd.launchAngle * 10) / 10;

      for (const pe of [...(play.playEvents || [])].reverse()) {
        if (!ev && pe.hitData?.launchSpeed) ev = Math.round(pe.hitData.launchSpeed * 10) / 10;
        if (!dist && pe.hitData?.totalDistance) dist = Math.round(pe.hitData.totalDistance);
        if (!la && pe.hitData?.launchAngle) la = Math.round(pe.hitData.launchAngle * 10) / 10;
        if (!pitch && pe.details?.type?.description) pitch = pe.details.type.description;
      }

      const rbiMatch = desc.match(/(\d+)-run/i);
      const rbi = rbiMatch ? parseInt(rbiMatch[1]) : 1;
      const hrType = rbi >= 4 ? "Grand Slam 🎉" : rbi === 3 ? "3-Run" : rbi === 2 ? "2-Run" : "Solo";
      const isTop = about.halfInning === "top";

      hrs.push({
        gamePk: game.gamePk,
        gameId: `${awayAbbr} @ ${homeAbbr}`,
        awayAbbr, homeAbbr,
        batterName: batter?.fullName || "Unknown",
        batterId: batter?.id,
        batterTeam: isTop ? awayAbbr : homeAbbr,
        pitcherName: pitcher?.fullName || "Unknown",
        pitcherTeam: isTop ? homeAbbr : awayAbbr,
        inning: about.inning || 0,
        halfInning: about.halfInning || "top",
        outs: about.outs ?? 0,
        rbi, hrType,
        exitVelo: ev, distance: dist, launchAngle: la, pitchType: pitch,
        description: desc,
        atBatIndex: about.atBatIndex || 0,
      });
    }
  } catch(e) {
    console.warn(`[HRs] Game ${game.gamePk} (${awayAbbr}@${homeAbbr}): ${e.message}`);
  }
  return hrs;
}

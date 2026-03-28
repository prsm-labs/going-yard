// api/homeruns.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const { date } = req.query;
    const today = date || new Date().toISOString().slice(0, 10);

    const schedRes = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team,linescore`
    );
    const schedData = await schedRes.json();
    const games = schedData.dates?.[0]?.games || [];
    console.log(`[HRs] ${games.length} games on ${today}`);

    const allHRs = [];
    let globalIndex = 0; // for chronological ordering across games

    await Promise.allSettled(games.map(async (game) => {
      const awayAbbr = game.teams?.away?.team?.abbreviation || "???";
      const homeAbbr = game.teams?.home?.team?.abbreviation || "???";
      const status   = game.status?.abstractGameState || "Preview";
      if (status === "Preview") return;

      const pbpRes  = await fetch(`https://statsapi.mlb.com/api/v1/game/${game.gamePk}/playByPlay`);
      const pbpData = await pbpRes.json();
      const plays   = pbpData.allPlays || [];
      console.log(`[HRs] ${awayAbbr}@${homeAbbr} gamePk=${game.gamePk} plays=${plays.length}`);

      for (const play of plays) {
        const event = (play.result?.eventType || play.result?.event || "").toLowerCase();
        if (!event.includes("home_run") && !event.includes("home run")) continue;

        const batter  = play.matchup?.batter;
        const pitcher = play.matchup?.pitcher;
        const about   = play.about || {};
        const desc    = play.result?.description || "";

        // ── RBI COUNT — multiple detection methods ──────────
        // Method 1: "X-run home run" in description
        let rbi = 1;
        const runMatch = desc.match(/(\d+)-run/i);
        if (runMatch) {
          rbi = parseInt(runMatch[1]);
        } else {
          // Method 2: count from result.rbi field directly
          if (play.result?.rbi != null) {
            rbi = parseInt(play.result.rbi) || 1;
          } else {
            // Method 3: count runners from play.runners who scored
            const scoredRunners = (play.runners || []).filter(r =>
              r.movement?.end === "score" || r.details?.scored === true
            ).length;
            if (scoredRunners > 0) rbi = scoredRunners;
          }
        }

        // Clamp to valid range
        rbi = Math.min(Math.max(rbi, 1), 4);
        const hrType = rbi >= 4 ? "Grand Slam 🎉" : rbi === 3 ? "3-Run" : rbi === 2 ? "2-Run" : "Solo";

        // ── HIT DATA ────────────────────────────────────────
        let ev = null, dist = null, la = null, pitch = null;
        const hd = play.hitData || {};
        if (hd.launchSpeed)   ev   = Math.round(hd.launchSpeed   * 10) / 10;
        if (hd.totalDistance) dist = Math.round(hd.totalDistance);
        if (hd.launchAngle)   la   = Math.round(hd.launchAngle   * 10) / 10;

        for (const pe of [...(play.playEvents || [])].reverse()) {
          if (!ev   && pe.hitData?.launchSpeed)   ev   = Math.round(pe.hitData.launchSpeed   * 10) / 10;
          if (!dist && pe.hitData?.totalDistance) dist = Math.round(pe.hitData.totalDistance);
          if (!la   && pe.hitData?.launchAngle)   la   = Math.round(pe.hitData.launchAngle   * 10) / 10;
          if (!pitch && pe.details?.type?.description) pitch = pe.details.type.description;
        }

        const isTop = about.halfInning === "top";
        // Unique chronological index: inning * 1000 + atBatIndex
        const chronoIndex = (about.inning || 0) * 1000 + (about.atBatIndex || globalIndex++);

        allHRs.push({
          gamePk:      game.gamePk,
          gameId:      `${awayAbbr} @ ${homeAbbr}`,
          awayAbbr, homeAbbr,
          batterName:  batter?.fullName  || "Unknown",
          batterId:    batter?.id,
          batterTeam:  isTop ? awayAbbr : homeAbbr,
          pitcherName: pitcher?.fullName || "Unknown",
          pitcherTeam: isTop ? homeAbbr  : awayAbbr,
          inning:      about.inning      || 0,
          halfInning:  about.halfInning  || "top",
          outs:        about.outs        ?? 0,
          rbi, hrType,
          exitVelo:    ev,
          distance:    dist,
          launchAngle: la,
          pitchType:   pitch,
          description: desc,
          atBatIndex:  about.atBatIndex  || 0,
          chronoIndex,
        });
      }
    }));

    // Sort most recent first — highest inning + atBatIndex = most recent
    allHRs.sort((a, b) => b.chronoIndex - a.chronoIndex);
    console.log(`[HRs] returning ${allHRs.length} home runs`);
    res.status(200).json({ date: today, homeruns: allHRs, total: allHRs.length });
  } catch (err) {
    console.error('[HRs] fatal:', err.message);
    res.status(500).json({ error: err.message, homeruns: [] });
  }
}

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
    console.log(`[HRs] date=${today} games=${games.length}`);

    const allHRs = [];
    const debugInfo = [];

    await Promise.allSettled(games.map(async (game) => {
      const awayAbbr = game.teams?.away?.team?.abbreviation || "???";
      const homeAbbr = game.teams?.home?.team?.abbreviation || "???";
      const status   = game.status?.abstractGameState || "Preview";
      const detailed = game.status?.detailedState || "";

      debugInfo.push(`${awayAbbr}@${homeAbbr} status=${status} detail=${detailed}`);
      if (status === "Preview") return;

      try {
        const pbpRes  = await fetch(
          `https://statsapi.mlb.com/api/v1/game/${game.gamePk}/playByPlay`
        );
        const pbpData = await pbpRes.json();
        const plays   = pbpData.allPlays || [];

        // Log ALL event types to find what home runs are called
        const eventTypes = [...new Set(plays.map(p =>
          p.result?.eventType || p.result?.event || "unknown"
        ))];
        console.log(`[HRs] ${awayAbbr}@${homeAbbr} plays=${plays.length} events=${eventTypes.slice(0,10).join(',')}`);
        debugInfo.push(`  plays=${plays.length} eventTypes=${eventTypes.join(',')}`);

        for (const play of plays) {
          const eventType = (play.result?.eventType || "").toLowerCase();
          const event     = (play.result?.event     || "").toLowerCase();

          // Cast wide net — catch any variation
          const isHR = eventType === "home_run"
            || event === "home run"
            || event.includes("home run")
            || event.includes("homer")
            || eventType.includes("home");

          if (!isHR) continue;

          const batter  = play.matchup?.batter;
          const pitcher = play.matchup?.pitcher;
          const about   = play.about || {};
          const desc    = play.result?.description || "";

          // RBI: try result.rbi first (most reliable), then parse description
          let rbi = parseInt(play.result?.rbi) || 0;
          if (!rbi) {
            const runMatch = desc.match(/(\d+)-run/i);
            rbi = runMatch ? parseInt(runMatch[1]) : 1;
          }
          if (!rbi) rbi = 1;
          rbi = Math.min(Math.max(rbi, 1), 4);

          const hrType = rbi >= 4 ? "Grand Slam 🎉" : rbi === 3 ? "3-Run" : rbi === 2 ? "2-Run" : "Solo";

          let ev = null, dist = null, la = null, pitch = null;
          // Check hitData on play directly
          if (play.hitData?.launchSpeed)   ev   = Math.round(play.hitData.launchSpeed   * 10) / 10;
          if (play.hitData?.totalDistance) dist = Math.round(play.hitData.totalDistance);
          if (play.hitData?.launchAngle)   la   = Math.round(play.hitData.launchAngle   * 10) / 10;
          // Check each playEvent in reverse (last event has hit data)
          for (const pe of [...(play.playEvents || [])].reverse()) {
            if (!ev   && pe.hitData?.launchSpeed)           ev    = Math.round(pe.hitData.launchSpeed   * 10) / 10;
            if (!dist && pe.hitData?.totalDistance)         dist  = Math.round(pe.hitData.totalDistance);
            if (!la   && pe.hitData?.launchAngle)           la    = Math.round(pe.hitData.launchAngle   * 10) / 10;
            if (!pitch && pe.details?.type?.description)   pitch = pe.details.type.description;
          }

          const isTop = about.halfInning === "top";
          const chronoIndex = (about.inning || 0) * 1000 + (about.atBatIndex || 0);

          console.log(`[HRs] ✅ HR: ${batter?.fullName} (${isTop?awayAbbr:homeAbbr}) inn=${about.inning} rbi=${rbi} ev=${ev} dist=${dist}`);

          allHRs.push({
            gamePk:      game.gamePk,
            gameId:      `${awayAbbr} @ ${homeAbbr}`,
            awayAbbr,    homeAbbr,
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
      } catch(gameErr) {
        console.error(`[HRs] Game ${game.gamePk} error:`, gameErr.message);
        debugInfo.push(`  ERROR: ${gameErr.message}`);
      }
    }));

    allHRs.sort((a, b) => b.chronoIndex - a.chronoIndex);
    console.log(`[HRs] TOTAL HRs found: ${allHRs.length}`);

    res.status(200).json({
      date: today,
      homeruns: allHRs,
      total: allHRs.length,
      debug: debugInfo, // include debug in response so we can see it in Network tab
    });
  } catch (err) {
    console.error('[HRs] fatal:', err.message);
    res.status(500).json({ error: err.message, homeruns: [], debug: [] });
  }
}

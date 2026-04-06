// api/homeruns.js
// Uses MLB Stats API game content + live feed for reliable HR detection
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    // ET date
    const etDate = new Date().toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      year: "numeric", month: "2-digit", day: "2-digit"
    });
    const [m,d,y] = etDate.split("/");
    const today = req.query.date || `${y}-${m}-${d}`;

    // Get schedule
    const schedRes = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team,linescore`
    );
    const schedData = await schedRes.json();
    const games = schedData.dates?.[0]?.games || [];
    console.log(`[HRs] date=${today} total games=${games.length}`);

    const allHRs = [];

    await Promise.allSettled(games.map(async (game) => {
      const awayAbbr = game.teams?.away?.team?.abbreviation || "???";
      const homeAbbr = game.teams?.home?.team?.abbreviation || "???";
      const abs = game.status?.abstractGameState || "";
      const coded = game.status?.codedGameState || "";
      const isActive = abs === "Live" || abs === "Final" ||
                       coded === "I" || coded === "F" || coded === "O" || coded === "M";
      if (!isActive) {
        console.log(`[HRs] Skipping ${awayAbbr}@${homeAbbr} status=${abs}/${coded}`);
        return;
      }

      try {
        // Use the live game feed v1.1 — most complete data
        const feedRes = await fetch(
          `https://statsapi.mlb.com/api/v1.1/game/${game.gamePk}/feed/live`
        );
        const feedData = await feedRes.json();
        const allPlays = feedData?.liveData?.plays?.allPlays || [];
        console.log(`[HRs] ${awayAbbr}@${homeAbbr} gamePk=${game.gamePk} plays=${allPlays.length}`);

        // Log first few event types for debugging
        const events = allPlays.slice(0,5).map(p=>p.result?.event||p.result?.eventType||"?");
        console.log(`[HRs] Sample events: ${events.join(", ")}`);

        for (const play of allPlays) {
          const event = (play.result?.event || "").toLowerCase();
          const eventType = (play.result?.eventType || "").toLowerCase();
          if (event !== "home run" && eventType !== "home_run") continue;

          const batter  = play.matchup?.batter;
          const pitcher = play.matchup?.pitcher;
          const about   = play.about || {};
          const desc    = play.result?.description || "";

          // RBI — use result.rbi (most reliable in live feed)
          let rbi = parseInt(play.result?.rbi);
          if (!rbi || isNaN(rbi)) {
            const m = desc.match(/(\d+)-run/i);
            rbi = m ? parseInt(m[1]) : 1;
          }
          rbi = Math.min(Math.max(rbi || 1, 1), 4);
          const hrType = rbi >= 4 ? "Grand Slam 🎉" : rbi === 3 ? "3-Run" : rbi === 2 ? "2-Run" : "Solo";

          // hitData from playEvents
          let ev = null, dist = null, la = null, pitch = null;
          for (const pe of [...(play.playEvents || [])].reverse()) {
            if (!ev   && pe.hitData?.launchSpeed)          ev    = Math.round(pe.hitData.launchSpeed   * 10) / 10;
            if (!dist && pe.hitData?.totalDistance)        dist  = Math.round(pe.hitData.totalDistance);
            if (!la   && pe.hitData?.launchAngle)          la    = Math.round(pe.hitData.launchAngle   * 10) / 10;
            if (!pitch && pe.details?.type?.description)   pitch = pe.details.type.description;
          }

          const isTop = about.halfInning === "top";
          const chronoIndex = (about.inning || 0) * 1000 + (about.atBatIndex || 0);
          // Get HR time in ET
          const playTime = about.endTime || about.startTime || "";
          let timeET = "", time24 = "";
          if (playTime) {
            try {
              const d = new Date(playTime);
              timeET = d.toLocaleTimeString("en-US", {
                timeZone: "America/New_York",
                hour: "numeric", minute: "2-digit", hour12: true
              });
              });
              const hh = d.toLocaleString("en-US",{timeZone:"America/New_York",hour:"2-digit",hour12:false});
              const mm = d.toLocaleString("en-US",{timeZone:"America/New_York",minute:"2-digit"});
              time24 = String(parseInt(hh)||0).padStart(2,"0")+":"+String(parseInt(mm)||0).padStart(2,"0");
          }
          console.log(`[HRs] ✅ ${batter?.fullName} (${isTop?awayAbbr:homeAbbr}) inn=${about.inning} rbi=${rbi} ev=${ev} dist=${dist} pitch=${pitch}`);

          allHRs.push({
            gamePk: game.gamePk,
            gameId: `${awayAbbr} @ ${homeAbbr}`,
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
            timeET,
            time24,
          });
        }
      } catch(e) {
        console.error(`[HRs] Game ${game.gamePk} failed:`, e.message);
      }
    }));

    allHRs.sort((a, b) => b.chronoIndex - a.chronoIndex);
    console.log(`[HRs] Returning ${allHRs.length} home runs`);
    res.status(200).json({ date: today, homeruns: allHRs, total: allHRs.length });
  } catch (err) {
    console.error('[HRs] Fatal:', err.message);
    res.status(500).json({ error: err.message, homeruns: [] });
  }
}

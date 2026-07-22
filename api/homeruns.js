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
    // Batters with 2+ total bases today who have NOT homered — "2-bagger" signal.
    // Sourced from the same feed/live response already fetched below for HR
    // detection (feedData.liveData.boxscore), so this adds zero extra API calls.
    const allTwoBaggers = [];

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

        // 2-bagger scan — boxscore batting lines already in this same response.
        // Also builds seasonHRByBatter: batterId → season HR total AS OF this
        // specific game (boxscore's own seasonStats snapshot, not "current/today"
        // like PLAYER_DATA_CACHE on the client — correct for past dates too).
        const boxTeams = feedData?.liveData?.boxscore?.teams || {};
        const seasonHRByBatter = {};
        for (const side of ['away', 'home']) {
          const teamBox = boxTeams[side];
          const sideAbbr = side === 'away' ? awayAbbr : homeAbbr;
          const players = teamBox?.players || {};
          for (const key of Object.keys(players)) {
            const p = players[key];
            const bat = p?.stats?.batting || {};
            const hits = parseInt(bat.hits || 0);
            const doubles = parseInt(bat.doubles || 0);
            const triples = parseInt(bat.triples || 0);
            const homeRuns = parseInt(bat.homeRuns || 0);
            const totalBases = hits + doubles + (triples * 2) + (homeRuns * 3);
            if (totalBases >= 2 && homeRuns === 0) {
              allTwoBaggers.push({
                gamePk: game.gamePk,
                gameId: `${awayAbbr} @ ${homeAbbr}`,
                batterId: p?.person?.id,
                batterName: p?.person?.fullName || 'Unknown',
                batterTeam: sideAbbr,
                totalBases, hits,
              });
            }
            const seasonHR = p?.seasonStats?.batting?.homeRuns;
            if (p?.person?.id != null && seasonHR != null) {
              seasonHRByBatter[p.person.id] = parseInt(seasonHR) || 0;
            }
          }
        }

        // Log first few event types for debugging
        const events = allPlays.slice(0,5).map(p=>p.result?.event||p.result?.eventType||"?");
        console.log(`[HRs] Sample events: ${events.join(", ")}`);

        // Collected per-game, then re-numbered below before merging into
        // allHRs — a batter with 2+ HRs in this game needs each one stamped
        // with its own sequential season total, not all of them stamped with
        // seasonHRByBatter's single current snapshot value (see below).
        const gameHRs = [];

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
              const hh = d.toLocaleString("en-US",{timeZone:"America/New_York",hour:"2-digit",hour12:false});
              const mm = d.toLocaleString("en-US",{timeZone:"America/New_York",minute:"2-digit"});
              time24 = String(parseInt(hh)||0).padStart(2,"0")+":"+String(parseInt(mm)||0).padStart(2,"0");
            } catch(e) {}
          }
          console.log(`[HRs] ✅ ${batter?.fullName} (${isTop?awayAbbr:homeAbbr}) inn=${about.inning} rbi=${rbi} ev=${ev} dist=${dist} pitch=${pitch}`);

          gameHRs.push({
            gamePk: game.gamePk,
            gameId: `${awayAbbr} @ ${homeAbbr}`,
            awayAbbr, homeAbbr,
            batterName:  batter?.fullName  || "Unknown",
            batterId:    batter?.id,
            batterTeam:  isTop ? awayAbbr : homeAbbr,
            pitcherName: pitcher?.fullName || "Unknown",
            pitcherId:   pitcher?.id,
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
            // seasonHR assigned below, after all of this game's HRs are known —
            // see the per-batter re-numbering pass.
            seasonHR:    null,
            atBatIndex:  about.atBatIndex  || 0,
            chronoIndex,
            timeET,
            time24,
          });
        }

        // Assign correct sequential season HR# per batter within this game.
        // FIXED 2026-07-18: seasonHRByBatter[id] is the batter's CURRENT
        // season total as of this fetch — it already reflects every HR that
        // batter has hit today up to and including the most recent one. A
        // batter with 2+ HRs in the same game was getting that single
        // current value stamped on every one of their HR rows (confirmed
        // bug: Francisco Alvarez's 10th and 11th HR both showed "11").
        // Sorting each batter's HRs chronologically and counting backward
        // from the current total gives each one its correct number (10,
        // then 11) regardless of how many have happened by fetch time.
        const byBatter = {};
        for (const hr of gameHRs) {
          if (hr.batterId == null) continue;
          if (!byBatter[hr.batterId]) byBatter[hr.batterId] = [];
          byBatter[hr.batterId].push(hr);
        }
        for (const bid of Object.keys(byBatter)) {
          const group = byBatter[bid].sort((a, b) => a.chronoIndex - b.chronoIndex);
          const currentTotal = seasonHRByBatter[bid];
          if (currentTotal == null) continue; // no seasonStats — leave null, client falls back
          group.forEach((hr, idx) => {
            hr.seasonHR = currentTotal - (group.length - 1 - idx);
          });
        }

        allHRs.push(...gameHRs);
      } catch(e) {
        console.error(`[HRs] Game ${game.gamePk} failed:`, e.message);
      }
    }));

    allHRs.sort((a, b) => b.chronoIndex - a.chronoIndex);
    console.log(`[HRs] Returning ${allHRs.length} home runs, ${allTwoBaggers.length} two-baggers`);
    res.status(200).json({
      date: today,
      homeruns: allHRs, total: allHRs.length,
      twoBaggers: allTwoBaggers, totalTwoBaggers: allTwoBaggers.length,
    });
  } catch (err) {
    console.error('[HRs] Fatal:', err.message);
    res.status(500).json({ error: err.message, homeruns: [] });
  }
}

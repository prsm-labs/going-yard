// onBaseWorker.js — Going Yard Monte Carlo 2+ Total Bases Simulation
// Runs 10,000 simulated games per eligible batter in a background thread.
// Counts games where batter accumulates 2 or more total bases.
//
// Baseline: g2tb_pct — actual season % of games with 2+ TB per batter.
// The sim adjusts for pitcher, park, wind, platoon, and lineup slot PA variance.
//
// Key difference from barrelWorker.js:
//   - Simulates cumulative TB across a full game (3-5 PAs)
//   - Success = total TB across all PAs in that game >= 2
//   - Tracks singles (1 TB), XBH (2-4 TB), plus cumulative paths

self.onmessage = function(e) {
  const { batters, weatherData } = e.data;
  const N_RUNS = 10000;
  const results = {};

  batters.forEach(r => {
    const bid = String(r.batter_id || '').split('.')[0];

    // ── Batter TB distribution ──────────────────────────────────────────────
    const kPct   = parseFloat(r.k_pct   || 20) / 100;
    const bbPct  = parseFloat(r.bb_pct  || 8)  / 100;
    const hrRate = parseFloat(r.hr_rate || 4)   / 100;
    const avg    = parseFloat(r.avg     || 0.250);
    const slg    = parseFloat(r.slg     || 0.400);

    // Derive hit type rates from AVG and SLG
    const iso        = slg - avg;
    const hrPerAB    = hrRate;
    const tripleRate = Math.max(0, iso * 0.05);
    const doubleRate = Math.max(0, iso * 0.55 - hrPerAB * 0.55);
    const singleRate = Math.max(0, avg - hrPerAB - tripleRate - doubleRate);

    // ── Pitcher adjustments ─────────────────────────────────────────────────
    const bHand = (r.batter_hand || '').toUpperCase();
    const pitcherFbAllowed = parseFloat(
      bHand === 'R'
        ? (r.pitcher_fb_pct_vs_R || r.pitcher_fb_pct_allowed || 20)
        : (r.pitcher_fb_pct_vs_L || r.pitcher_fb_pct_allowed || 20)
    ) / 100;

    const pitcherBrlAllowed = parseFloat(r.pitcher_barrel_pct_allowed || 6.5) / 100;
    const xbhMult = 1 + (pitcherFbAllowed - 0.20) * 0.5
                      + (pitcherBrlAllowed - 0.065) * 0.3;

    const grade = (r.pitcher_grade_label || r._pgLabel || '').toLowerCase();
    const gradeMult =
      grade.includes('elite')    ? 0.72 :
      grade.includes('tough')    ? 0.85 :
      grade.includes('target')   ? 1.18 :
      grade.includes('hittable') ? 1.10 : 1.00;

    // ── Environmental adjustments ───────────────────────────────────────────
    const gameId     = String(r.game_id || '');
    const wx         = (weatherData && weatherData[gameId]) || {};
    const parkFactor = parseFloat(wx.hr_factor || 1.00);
    const windStr    = String(r.wind_effect || '').toLowerCase();
    const windMph    = parseFloat(r.wind_speed_mph || 0);
    const windBoost  = windStr.includes('out') ?  windMph * 0.005
                     : windStr.includes('in')  ? -windMph * 0.003
                     : 0;

    // ── Platoon adjustment ──────────────────────────────────────────────────
    const pHand      = (r.pitcher_hand || '').toUpperCase();
    const seasonWoba = parseFloat(r.season_xwoba || 0.310);
    const vsHandWoba = parseFloat(r.vs_hand_woba  || seasonWoba);
    const platoonMult = seasonWoba > 0
      ? Math.min(1.35, Math.max(0.75, vsHandWoba / seasonWoba))
      : (bHand !== pHand ? 1.06 : 0.95);

    // ── Adjusted hit rates ──────────────────────────────────────────────────
    const adjMult   = gradeMult * xbhMult * platoonMult * (1 + windBoost);
    const adjSingle = Math.min(0.35, singleRate * adjMult * 0.9);
    const adjDouble = Math.min(0.15, doubleRate * adjMult);
    const adjTriple = Math.min(0.03, tripleRate * adjMult);
    const adjHR     = Math.min(0.12, hrRate * parkFactor * gradeMult * platoonMult);

    const hitTotal = adjSingle + adjDouble + adjTriple + adjHR;
    const outRate  = Math.max(0, 1 - kPct - bbPct - hitTotal);

    // ── PA count variance by lineup slot ────────────────────────────────────
    const slot   = parseInt(r.lineup_slot || 5);
    const avgPAs = slot <= 3 ? 4.3 : slot <= 6 ? 4.0 : 3.7;
    const minPAs = Math.max(2, Math.round(avgPAs - 1));
    const maxPAs = Math.round(avgPAs + 1.5);

    // ── 10,000 simulation runs ───────────────────────────────────────────────
    let tb2Count = 0;
    let totalPAs = 0;

    for (let run = 0; run < N_RUNS; run++) {
      const nPAs  = minPAs + Math.floor(Math.random() * (maxPAs - minPAs + 1));
      totalPAs   += nPAs;
      let gameTB  = 0;

      for (let pa = 0; pa < nPAs; pa++) {
        const roll = Math.random();

        if (roll < kPct)                       continue; // K
        if (roll < kPct + bbPct)               continue; // BB
        if (roll < kPct + bbPct + outRate)     continue; // out in play

        const hitRoll = Math.random();
        const total   = adjSingle + adjDouble + adjTriple + adjHR;
        if (total <= 0) continue;

        const r1 = adjSingle / total;
        const r2 = (adjSingle + adjDouble) / total;
        const r3 = (adjSingle + adjDouble + adjTriple) / total;

        if (hitRoll < r1)       gameTB += 1; // single
        else if (hitRoll < r2)  gameTB += 2; // double
        else if (hitRoll < r3)  gameTB += 3; // triple
        else                    gameTB += 4; // HR
      }

      if (gameTB >= 2) tb2Count++;
    }

    results[bid] = {
      simTB2Rate: tb2Count / N_RUNS,
      simPAs:     totalPAs / N_RUNS,
    };
  });

  self.postMessage({ results });
};

// barrelWorker.js — Monte Carlo HR simulation for Barrel Lab
// Receives: { batters, weatherData }
// Posts back: { results: { batter_id: { simHRRate, simPAs } } }

self.onmessage = function(e) {
  const { batters } = e.data;
  const N_RUNS = 10000;
  const results = {};

  // Check if pitcher GB/K fields are present on any row
  const sampleRow = batters[0] || {};
  const hasPitcherGB = sampleRow.gb_pct_p != null || sampleRow.pitcher_gb_pct != null;
  const hasPitcherK  = sampleRow.k_pct_p  != null || sampleRow.pitcher_k_pct  != null;

  batters.forEach(r => {
    const bid = String(r.batter_id || '').split('.')[0];

    // ── Batter BIP distribution (use confirmed CSV field names) ──────────
    const kPct  = parseFloat(r.recent_k_pct  || 20) / 100;
    const bbPct = parseFloat(r.season_bb_pct || 8)  / 100;
    const fbPct = parseFloat(r.recent_fb_pct || 20) / 100;
    const gbPct = parseFloat(r.recent_gb_pct || 45) / 100;
    const ldPct = parseFloat(r.ld_pct || 0) > 0
      ? parseFloat(r.ld_pct) / 100
      : Math.max(0, (1 - fbPct - gbPct) * 0.72);

    // HR/FB% — derived from batter's recent rates
    const hrRate  = parseFloat(r.recent_hr_rate || 0) / 100;
    const hrPerFB = fbPct > 0.01
      ? Math.min(0.35, hrRate / fbPct)
      : 0.10;

    // ── Pitcher tendency adjustments ─────────────────────────────────────
    // gb_pct_p / k_pct_p not in CSV — use league-average defaults
    const pitcherGB = parseFloat(r.gb_pct_p || r.pitcher_gb_pct || 45) / 100;
    const pitcherK  = parseFloat(r.k_pct_p  || r.pitcher_k_pct  || 22) / 100;

    const adjFbPct = Math.max(0.05,
      fbPct * (1 - Math.max(0, pitcherGB - 0.45) * 0.8)
    );
    const adjKPct  = Math.min(0.50,
      kPct + Math.max(0, pitcherK - 0.22) * 0.4
    );

    // ── Environmental adjustments ────────────────────────────────────────
    // hr_factor in CSV is decimal (e.g. 1.06 = 6% above neutral)
    const parkFactor = parseFloat(r.hr_factor || 1.00);
    // wind_effect is a text string in CSV; wind_speed_mph is numeric
    // Positive wind boost if wind_effect contains "Out", else neutral
    const windStr   = String(r.wind_effect || '').toLowerCase();
    const windMph   = parseFloat(r.wind_speed_mph || 0);
    const windBoost = windStr.includes('out') ? windMph * 0.008
                    : windStr.includes('in')  ? windMph * -0.004
                    : 0;
    const windMult  = 1 + windBoost;

    // ── Pitcher grade multiplier ─────────────────────────────────────────
    const grade = (r._pgLabel || '').toLowerCase();
    const pitcherMult =
      grade.includes('elite')    ? 0.60 :
      grade.includes('tough')    ? 0.78 :
      grade.includes('target')   ? 1.25 :
      grade.includes('hittable') ? 1.15 : 1.00;

    // ── Full platoon split adjustment ────────────────────────────────────
    // vs_hand_woba is already filtered to this pitcher's hand by the engine
    const seasonWoba = parseFloat(r.season_xwoba || 0.310);
    const vsHandWoba = parseFloat(r.vs_hand_woba || seasonWoba);
    const bHand = (r.batter_hand || '').toUpperCase();
    const pHand = (r.pitcher_hand || '').replace(/^(L|R).*/i, '$1').toUpperCase();
    const platoonMult = seasonWoba > 0
      ? Math.min(1.40, Math.max(0.70, vsHandWoba / seasonWoba))
      : (bHand !== pHand ? 1.08 : 0.94);

    // ── Adjusted HR/FB% ──────────────────────────────────────────────────
    const adjHRperFB = Math.min(0.45,
      hrPerFB * parkFactor * windMult * pitcherMult * platoonMult
    );

    // ── PA count variance by lineup slot ────────────────────────────────
    const slot   = parseInt(r.lineup_slot || 5);
    const avgPAs = slot <= 3 ? 4.3 : slot <= 6 ? 4.0 : 3.7;
    const minPAs = Math.max(2, Math.round(avgPAs - 1));
    const maxPAs = Math.round(avgPAs + 1.5);

    // ── 10,000 simulation runs ───────────────────────────────────────────
    let hrCount  = 0;
    let totalPAs = 0;

    for (let run = 0; run < N_RUNS; run++) {
      const nPAs = minPAs + Math.floor(Math.random() * (maxPAs - minPAs + 1));
      totalPAs += nPAs;

      for (let pa = 0; pa < nPAs; pa++) {
        const roll = Math.random();
        if (roll < adjKPct) continue;
        if (roll < adjKPct + bbPct) continue;
        const contactRoll = Math.random();
        if (contactRoll < adjFbPct) {
          if (Math.random() < adjHRperFB) hrCount++;
        }
      }
    }

    results[bid] = {
      simHRRate: hrCount / N_RUNS,
      simPAs:    totalPAs / N_RUNS,
    };
  });

  self.postMessage({ results });
};

// barrelWorker.js — Going Yard Monte Carlo HR Simulation
// 10,000 PA simulations per eligible batter. Runs in a background Web Worker thread.
//
// Pitcher inputs now wired from daily_picks.csv (Option 1 — July 2026):
//   pitcher_fb_pct_vs_R / pitcher_fb_pct_vs_L  → hand-specific FB% allowed
//   pitcher_hr_pct_vs_R / pitcher_hr_pct_vs_L  → hand-specific HR rate allowed (blended into hrPerFB)
//   pitcher_barrel_pct_allowed                  → barrel suppressor on adjHRperFB ceiling
//
// Still using league-average defaults (Option 2 — requires pipeline addition):
//   pitcher_k_pct_allowed  → not yet in matchup_engine.py pitcher_vulnerability
//   pitcher_gb_pct_allowed → not yet in matchup_engine.py pitcher_vulnerability
//
// Platoon split: vs_hand_woba / season_xwoba ratio — already real data, unchanged.
// Park factor: hr_factor decimal — already wired, unchanged.
// Wind: wind_effect string + wind_speed_mph — already wired, unchanged.

self.onmessage = function(e) {
  const { batters } = e.data;
  const N_RUNS = 10000;
  const results = {};

  // Note: pitcher_gb_pct / pitcher_k_pct not yet in daily_picks.csv.
  // Will be wired in Option 2 when matchup_engine.py adds those fields.

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

    // HR/FB% — blend batter tendency with pitcher HR rate allowed by hand.
    // Pitcher-specific rate is the actual observed HR rate this pitcher
    // allows to this batter's handedness — more predictive than batter alone.
    const hrRate = parseFloat(r.recent_hr_rate || 0) / 100;
    const batterHRperFB = fbPct > 0.01
      ? Math.min(0.35, hrRate / fbPct)
      : 0.10;

    const bHand = (r.batter_hand || '').toUpperCase();
    const pitcherHRpct = parseFloat(
      bHand === 'R'
        ? (r.pitcher_hr_pct_vs_R || r.pitcher_hr_pct_vs_L || 0)
        : (r.pitcher_hr_pct_vs_L || r.pitcher_hr_pct_vs_R || 0)
    ) / 100;

    // If pitcher HR rate data exists, blend 50/50 with batter tendency.
    // If not (new pitcher / insufficient sample), use batter rate only.
    const hrPerFB = pitcherHRpct > 0
      ? (batterHRperFB * 0.50 + pitcherHRpct * 0.50)
      : batterHRperFB;

    // ── Pitcher tendency adjustments (real data from daily_picks.csv) ────
    // Use hand-specific pitcher FB% allowed — the actual rate this pitcher
    // allows fly balls to this batter's handedness.
    // High pitcher FB% = fly ball pitcher = more HR opportunities.
    // Low pitcher FB% = groundball pitcher = suppressed HR opportunities.
    const pitcherFbAllowed = parseFloat(
      bHand === 'R'
        ? (r.pitcher_fb_pct_vs_R || r.pitcher_fb_pct_allowed || 20)
        : (r.pitcher_fb_pct_vs_L || r.pitcher_fb_pct_allowed || 20)
    ) / 100;

    // Blend batter FB% tendency with pitcher FB% allowed (60/40 pitcher-weighted).
    // Pitcher controls ball type more than the batter in any given matchup.
    const adjFbPct = Math.max(0.05,
      fbPct * 0.40 + pitcherFbAllowed * 0.60
    );

    // K% — pitcher-specific K rate not yet in CSV (Option 2).
    // Use batter's own recent K% unchanged for now.
    const adjKPct = Math.min(0.50, kPct);

    // Pitcher barrel% allowed — suppresses HR/FB ceiling for tough contact pitchers.
    const pitcherBrlAllowed = parseFloat(r.pitcher_barrel_pct_allowed || 6.5) / 100;
    const brlSuppressor = pitcherBrlAllowed < 0.040  ? 0.88  // elite barrel suppressor
                        : pitcherBrlAllowed < 0.055  ? 0.94  // good
                        : pitcherBrlAllowed > 0.100  ? 1.08  // hittable — barrels allowed freely
                        : 1.00;

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
    const pHand = (r.pitcher_hand || '').replace(/^(L|R).*/i, '$1').toUpperCase();
    const platoonMult = seasonWoba > 0
      ? Math.min(1.40, Math.max(0.70, vsHandWoba / seasonWoba))
      : (bHand !== pHand ? 1.08 : 0.94);

    // ── Adjusted HR/FB% ──────────────────────────────────────────────────
    const adjHRperFB = Math.min(0.45,
      hrPerFB * parkFactor * windMult * pitcherMult * platoonMult * brlSuppressor
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

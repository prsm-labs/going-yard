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
    const rawBatterHRperFB = fbPct > 0.01
      ? Math.min(0.35, hrRate / fbPct)
      : 0.10;

    // ── ISO-anchored floor (2026-07-14 validation fix) ───────────────────
    // recent_hr_rate is a raw L7 rate that's literally 0 for most batters
    // most weeks (confirmed: 85% of all daily_picks.csv rows have
    // recent_hr_rate === 0) -- the line above then computes batterHRperFB
    // as a hard, deterministic ZERO for any of them, which the simulation
    // then can never overcome across all 10,000 runs. Real tracker check
    // (2,820 matched batter-days, 2026-07-14): batters landing at a literal
    // 0% SimHR still hit at a real 6.9% rate, not far below the ~9.4% rate
    // for batters whose recent window happened to have a nonzero HR. This
    // floor uses the batter's season-blended ISO (recent_iso — a real
    // 20/30/50 season/L15/L7 blend, never a hard zero for anyone with
    // playing time) as a backstop, via an empirical ISO -> game-level HR
    // rate mapping derived directly from 23,923 real 2026 season batter-days
    // (all-matchups-season-2026.csv). Converted to a per-FB rate assuming
    // ~4 PAs/game, same avgPAs anchor used later in this function.
    const isoVal = parseFloat(r.recent_iso || 0);
    const isoGameHRrate =
      isoVal >= 0.32 ? 0.097 :
      isoVal >= 0.28 ? 0.095 :
      isoVal >= 0.24 ? 0.095 :
      isoVal >= 0.20 ? 0.103 :
      isoVal >= 0.16 ? 0.111 :
      isoVal >= 0.12 ? 0.084 :
      isoVal >= 0.08 ? 0.053 : 0.041;
    const isoFloorHRperFB = fbPct > 0.01 ? Math.min(0.35, (isoGameHRrate / 4.0) / fbPct) : 0;
    const batterHRperFB = Math.max(rawBatterHRperFB, isoFloorHRperFB);

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
    // wind_carry_factor_v2 (Phase 3 weather fix, July 2026) is a clean [0,1]
    // cosine of wind alignment to CF — 1.0 = pure tailwind, 0 = crosswind/
    // headwind. Prefer it over the wind_effect text-string heuristic, which
    // couldn't distinguish a direct tailwind from a quartering one. Falls
    // back to the old heuristic when the field isn't populated yet.
    const windCarryV2 = parseFloat(r.wind_carry_factor_v2 || 0);
    let windMult;
    if (windCarryV2 > 0) {
      windMult = 1 + windCarryV2 * 0.08;
    } else {
      const windStr   = String(r.wind_effect || '').toLowerCase();
      const windMph   = parseFloat(r.wind_speed_mph || 0);
      const windBoost = windStr.includes('out') ? windMph * 0.008
                      : windStr.includes('in')  ? windMph * -0.004
                      : 0;
      windMult = 1 + windBoost;
    }

    // ── Pitcher grade multiplier (hand-specific) ──────────────────────────
    // LHB/Switch faces the pitcher's vs-LHB profile, RHB faces vs-RHB.
    // Falls back to the overall (hand-agnostic) grade when the hand-specific
    // engine field isn't populated yet (requires a matchup_engine.py run —
    // see PROMPT_AllSignalStackFixes.md Part 1 gate).
    // FIX (July 9 2026): this was inverted — vsR was being read for L/S
    // batters and vsL for R batters. Corrected to match App.jsx's
    // getHandSpecificGrade(), the verified-correct reference implementation.
    const gradeLabel = (bHand === 'L' || bHand === 'S')
      ? (r.pitcher_grade_label_vsL || r.pitcher_grade_label || r._pgLabel || '')
      : (r.pitcher_grade_label_vsR || r.pitcher_grade_label || r._pgLabel || '');
    const grade = gradeLabel.toLowerCase();

    // Unified multipliers — matches PITCHER_GRADE_MULT in App.jsx (audit Q9:
    // this file previously used its own Elite=0.60, one of 5 divergent values).
    const pitcherMult =
      grade.includes('elite')    || grade.includes('‼️') ? 0.62 :
      grade.includes('tough')    || grade.includes('⚠️') ? 0.80 :
      grade.includes('hittable') || grade.includes('💥') ? 1.12 :
      grade.includes('target')   || grade.includes('🎯') ? 1.22 : 1.00;

    // ── Full platoon split adjustment ────────────────────────────────────
    // vs_hand_woba is already filtered to this pitcher's hand by the engine
    const seasonWoba = parseFloat(r.season_xwoba || 0.310);
    const vsHandWoba = parseFloat(r.vs_hand_woba || seasonWoba);
    const pHand = (r.pitcher_hand || '').replace(/^(L|R).*/i, '$1').toUpperCase();
    const platoonMult = seasonWoba > 0
      ? Math.min(1.40, Math.max(0.70, vsHandWoba / seasonWoba))
      : (bHand !== pHand ? 1.08 : 0.94);

    // ── Adjusted HR/FB% ──────────────────────────────────────────────────
    // Diminishing-returns taper (2026-07-14 validation fix) replacing the old
    // flat 0.45 ceiling — same pattern as taperGHR() elsewhere in this app.
    // Real tracker check (2,820 matched batter-days): the flat cap let
    // multiplier-stacking cases (hot batter x hitter's park x tailwind x weak
    // pitcher, all compounding in the same direction) predict ~30% game-level
    // HR probability in the top tier when the real rate there was ~11%.
    // Tapering above 0.20 brought the Brier score from 0.0905 to 0.0843 on
    // that same tracker sample (still short of a trivial always-predict-
    // base-rate baseline of 0.0805 -- flagging honestly, not claiming this
    // is now well-calibrated, just meaningfully less overconfident).
    const rawHRperFB = hrPerFB * parkFactor * windMult * pitcherMult * platoonMult * brlSuppressor;
    const TAPER_CAP = 0.20;
    const adjHRperFB = rawHRperFB <= TAPER_CAP
      ? rawHRperFB
      : TAPER_CAP + Math.sqrt(rawHRperFB - TAPER_CAP) * 0.15;

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

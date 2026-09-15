// api/batter-scouting-note.js — Scouting Note (2026-08-03)
//
// REWORK (2026-09-15): the original design anchored the whole note on
// RECENT real batted-ball data (last-10 events, per-pitch-type recent FB%,
// and recent at-bats vs the pitcher's mix matched to today's day/night +
// home/away context). Subsequent research (the 2026-09-03/09-06 Top ISO /
// Prime ISO backtests, and consistent with this project's much older
// gHR-lag-echo and recent-vs-season-weighting findings) found recent/L7
// batted-ball data carries little to no standalone HR correlation, while
// Arsenal Fit — the batter's SEASON-LONG performance specifically vs this
// pitcher's real pitch mix + handedness, already computed by the engine as
// bvp_iso/bvp_avg_ev/bvp_barrel_pct/ps_convergence and exported to
// daily_picks.csv — is the dominant, validated signal. The note is now
// anchored on Arsenal Fit (client-supplied straight from the daily_picks.csv
// row already in hand, per the same pattern the weather fields already use
// below — no new server-side fetch), with recent batted-ball mechanics kept
// only as an explicitly-subordinated "recent form" side note, never the
// note's main analytical claim. The recent-games "vs this mix, matched to
// today's context" distance citation (matchTieredContext(), the most
// literally "recent batted ball vs mix" piece of the old design) is removed
// outright — it's now redundant with, and weaker than, the real season-long
// bvp_iso/ps_convergence numbers.
//
// Computes verified stats for a batter against today's opposing pitcher,
// then asks Claude to phrase those EXACT numbers into a short scouting
// note. Claude never computes or invents a single number here — every
// figure in the prompt is pre-verified server-side (or client-supplied from
// an already-verified source), the same discipline every other stat in
// this app already follows, since this feeds a real betting-decision
// surface (AtBatSlideIn's collapsed "Scouting Note" section).
//
// Day/night + home/away (2026-08-03, same-day follow-up): the first version
// hardcoded "night" — correct by coincidence for that day's two validation
// matchups (both real night games), but wrong in general (day games happen
// every week) and ignored home/away entirely. Fixed by resolving TODAY's
// real game context (both dimensions) and matching recent at-bats against
// it with a tiered fallback (matchTieredContext(), removed 2026-09-15 — see
// the file-header rework note) rather than a fixed filter — a batter with a
// thin same-context sample still got a real answer, just at a looser (and
// honestly-labeled) tier instead of silence.
//
// Weather/park factor (2026-08-09): user asked directly whether these were
// factored in — they weren't (confirmed via grep, zero mentions anywhere in
// this file before this date). Added as an OPTIONAL client-supplied field
// (tempF/windMph/windEffect/hrFactor/isDome/rainPct), sourced from
// daily_picks.csv's own pre-game forecast columns — no new server-side
// fetch. Claude is instructed to only mention it when genuinely notable
// (hot + hitter's park, strong wind out, or a dome making it irrelevant)
// rather than padding every note with an unremarkable forecast.
//
// Data sources:
//   - Arsenal Fit (bvpPa/bvpIso/bvpAvgEv/bvpBarrelPct/bvpFbPct/bvpHrCount/
//     psConvergence/psConvPitch) — CLIENT-SUPPLIED, straight off the exact
//     daily_picks.csv row already open in the caller's batter slideout (the
//     same client-already-has-it pattern the weather fields below use). No
//     server fetch or CSV re-parse needed — this is only available when the
//     batter is today's real probable-starter matchup; absent for a
//     historical/non-slate lookup, in which case the note falls back to
//     recent form alone (see computeRecentStats()'s gate in handler()).
//   - schedule?gamePk={id}             → TODAY's real dayNight + home/away
//     team IDs, for the one specific game this slideout is about (cheap —
//     lighter than a full feed/live pull for just this one flag). Still
//     used for the weather-line day/night label even though the recent-
//     batted-ball mix-matching that originally needed it is gone.
//   - people/{id}/stats?stats=gameLog  → batter's recent games (secondary/
//     demoted "recent form" side note only, see the rework note above)
//   - game/{gamePk}/feed/live          → real batted-ball events (hitData)
//     PLUS gameData.datetime.dayNight for free, same response. Home/away
//     per event comes from about.isTopInning.
//   - people/{id}/stats?stats=pitchArsenal → pitcher's real pitch mix
//     (same endpoint api/pitcher.js already uses) — still reported in the
//     note as context on what the batter's being fit against.
//
// Barrel is approximated from EV+LA using the same widened-EV-scaled
// formula mlbdata_yesterday.py falls back to when Statcast's own
// launch_speed_angle (1-6, 6=Barrel) isn't available — feed/live's hitData
// never carries that field, so this endpoint always uses the approximation.
// Pull/Center/Oppo direction reuses the exact sprayAngleFromCoords()/
// classifyDirection() formulas from api/ball-carry.js (already empirically
// validated against real 2026 data, 2026-07-22).
//
// Cached per {batterId}_{pitcherId}_{ET date} in the same Upstash Redis
// instance already used for picks/push-subscription storage — one real
// generation per matchup per day, not per slideout open.
//
// Free-tier gate (added 2026-08-07, reworked 2026-08-10): every cache HIT
// stays free for anyone, signed in or not — the note's already paid for. A
// cache MISS (a genuinely new Anthropic call) is only free for a matchup
// this endpoint judges to be roughly today's real Top 4 Tonight tier — see
// isTodaysTop4()'s own comment for the full history. Deliberately NOT
// trusted from the client (a client-asserted isTop3:true flag would be
// trivially spoofable via devtools) — this endpoint independently
// recomputes an approximate score server-side from daily_picks.csv
// (serverTrueHRScore()/serverMatchupScore(), also used by
// api/barrel-notify.js for the same purpose) and checks whether the
// requested batter falls within a generous top-percentile slice of today's
// eligible pool — not an exact top-1-per-tier match (tried that 2026-08-09,
// confirmed live it fails almost always; see isTodaysTop4()). Fails CLOSED
// (treats a data-load failure as "not eligible", i.e. requires sign-in)
// rather than open.

import { Redis } from '@upstash/redis';
import { verifyToken } from '@clerk/backend';
import { readFileSync } from 'fs';
import { join } from 'path';

// Minimal dependency-free RFC4180-style CSV parser. api/barrel-notify.js
// imports `{ parse } from 'csv-parse/sync'` for the same daily_picks.csv
// read, but that package is NOT actually a dependency anywhere in this repo
// (confirmed 2026-08-07: absent from package.json, node_modules, AND
// package-lock.json) — a top-level import of a missing package crashes the
// whole module at load time, before its own try/catch fallback ever runs.
// Deliberately not inheriting that here; daily_picks.csv has 242+ columns
// so a real quoted-field-aware parser is needed (column position shifts
// with which fields are present), not a naive .split(',').
//
// BOM STRIP (2026-08-10): daily_picks.csv has no BOM, but
// track-record-matchups.csv does — it's written via Python's
// encoding='utf-8-sig' (gy_csv.py's append_to_season_file(), confirmed in
// CLAUDE.md's July 2026 session history), and Node's readFileSync('utf-8')
// does NOT strip a BOM automatically. Without this, the header parses as
// '﻿export_date' instead of 'export_date' — every row.export_date read
// silently comes back undefined, which is exactly what made
// loadRecentHRExcludeSet() (added this same day) return an always-empty
// Set: confirmed live via a standalone debug run (rows.length=34800 parsed
// fine, but unique dates=0). Stripping it here fixes it for every current
// and future caller of this parser, not just that one call site.
function parseCsv(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

// ── serverTrueHRScore / serverMatchupScore ──────────────────────────────
// Copied verbatim from api/barrel-notify.js (2026-07-08, still the live
// approximation used there for Barrel Signal push detection) rather than
// imported — every api/*.js file in this app is self-contained by existing
// convention (see e.g. CARRY_COEFFS duplicated in api/ball-carry.js). If
// barrel-notify.js's copy is ever recalibrated, this one should be updated
// to match.
function serverTrueHRScore(r) {
  const la      = parseFloat(r.la_mean || r.la_mean_l15 || r.season_la_mean || 18);
  const laStd   = parseFloat(r.la_std  || r.la_stddev   || 8);
  const laDistScore    = Math.max(0, 1 - Math.abs(la - 19.5) / 15);
  const laConsistency  = Math.max(0, 1 - (laStd - 5) / 12);
  const sweetSpotScore = (laDistScore * 0.7 + laConsistency * 0.3) * 100;
  const pbrl      = parseFloat(r.pbrl_pct || r.recent_pulled_barrel_pct || 0);
  const pbrlScore = Math.min(100, pbrl * 8);
  const hh        = parseFloat(r.hh_pct  || r.recent_hh_pct  || 0);
  const hhScore   = Math.min(100, hh * 2.2);
  const xwoba      = parseFloat(r.season_xwoba || 0);
  const xwobaScore = Math.min(100, Math.max(0, (xwoba - 0.250) / 0.200 * 100));
  const A = sweetSpotScore * 0.35 + pbrlScore * 0.30
          + hhScore * 0.20 + xwobaScore * 0.15;

  const zf       = parseFloat(r.zone_fit || 0);
  const zfScore  = Math.min(100, zf * 13.5);
  const grade    = (r.pitcher_grade_label || '').toLowerCase();
  const gradeScore =
    grade.includes('elite')    ? 15 :
    grade.includes('tough')    ? 40 :
    grade.includes('hittable') ? 82 :
    grade.includes('target')   ? 92 :
    grade.includes('average')  ? 62 : 60;
  const seasonWoba  = parseFloat(r.season_xwoba  || 0.310);
  const vsHandWoba  = parseFloat(r.vs_hand_woba   || seasonWoba);
  const bHand       = (r.batter_hand  || '').toUpperCase();
  const pHand       = (r.pitcher_hand || '').toUpperCase();
  const platoonScore = Math.min(100, Math.max(0,
    (vsHandWoba - 0.250) / 0.200 * 100));
  const platoonMult  = bHand !== pHand ? 1.15 : 0.88;
  const ps       = parseFloat(r.ps_score || 0);
  const psScore  = Math.min(100, (ps / 25) * 100);
  const pitcherGB    = parseFloat(r.gb_pct_p || r.pitcher_gb_pct || 45) / 100;
  const gbSuppressor = pitcherGB > 0.55 ? 0.88 : pitcherGB < 0.35 ? 1.10 : 1.0;
  const B = Math.min(100, Math.max(0,
    (zfScore * 0.30 + gradeScore * 0.25 +
     (platoonScore * platoonMult) * 0.25 + psScore * 0.20)
    * gbSuppressor));

  const ghr       = parseFloat(r.gHR || 0);
  const ghrScore  = Math.min(100, ghr * 2.5);
  const iso       = parseFloat(r.recent_iso || 0);
  const isoScore  = Math.min(100, Math.max(0, (iso - 0.050) / 0.350 * 100));
  const recentHR      = parseInt(r.recent_hr_count || 0);
  const recentHRScore = Math.min(100, recentHR * 25);
  const formScore     = (ghrScore * 1.5 + isoScore * 1.0) / 2.5;
  const C = formScore * 0.70 + recentHRScore * 0.30;

  return Math.round(Math.min(100, Math.max(0,
    A * 0.40 + B * 0.35 + C * 0.25)));
}

function serverMatchupScore(r) {
  const zf      = parseFloat(r.zone_fit || 0);
  const zfScore = Math.min(100, zf * 13.5);
  const ps      = parseFloat(r.ps_score || 0);
  const psScore = Math.min(100, (ps / 25) * 100);
  const seasonWoba = parseFloat(r.season_xwoba || 0.310);
  const vsHandWoba = parseFloat(r.vs_hand_woba  || seasonWoba);
  const bHand      = (r.batter_hand  || '').toUpperCase();
  const pHand      = (r.pitcher_hand || '').toUpperCase();
  const handScore  = Math.min(100, Math.max(0,
    (vsHandWoba - 0.250) / 0.200 * 100));
  const platoonMult = bHand !== pHand ? 1.12 : 0.90;
  const grade    = (r.pitcher_grade_label || '').toLowerCase();
  const gradeMult =
    grade.includes('elite')    ? 0.55 :
    grade.includes('tough')    ? 0.75 :
    grade.includes('target')   ? 1.20 :
    grade.includes('hittable') ? 1.10 : 1.0;
  const pitcherGB = parseFloat(r.gb_pct_p || r.pitcher_gb_pct || 45) / 100;
  const gbMult    = pitcherGB > 0.55 ? 0.88 : pitcherGB < 0.35 ? 1.10 : 1.0;
  return Math.round(Math.min(100, Math.max(0,
    (zfScore * 0.40 + psScore * 0.35 + (handScore * platoonMult) * 0.25)
    * gradeMult * gbMult)));
}

// Sauce tier + Bullpen Tier bonuses — same thresholds/points as
// isSauce2Batter/isSauce25Batter/isSauce3Batter and bullpenTierInfo() in
// App.jsx (2026-07-30/08-02/08-04 sessions). Highest qualifying Sauce tier
// only (never stacked), matching the app's own badge-precedence rule.
function sauceBonus(r) {
  const grade = (r.pitcher_grade_label || '').toLowerCase();
  if (grade.includes('elite') || grade.includes('tough')) return 0; // already excluded upstream, defensive
  const zf     = parseFloat(r.zone_fit || 0);
  const xwoba  = parseFloat(r.season_xwoba || 0);
  const recIso = parseFloat(r.recent_iso || 0);
  const bvpIso = parseFloat(r.bvp_iso || 0);
  if (zf >= 2 && xwoba >= 0.360 && recIso >= 0.250 && bvpIso >= 0.250) return 10; // Sauce 3.0
  if (zf >= 2 && xwoba >= 0.330 && recIso >= 0.220 && bvpIso >= 0.220) return 6;  // Sauce 2.5
  if (zf >= 2 && xwoba >= 0.360) return 3;                                        // Sauce 2.0
  return 0;
}
function bullpenBonus(r) {
  const rank = parseInt(r.bullpen_hr_rank || 0);
  if (!rank) return 0;
  if (rank <= 10) return 8;   // Soft Pen
  if (rank >= 21) return -8;  // Tough Pen
  return 0;
}

function loadDailyPicksRows() {
  for (const p of [
    join(process.cwd(), 'public', 'data', 'daily_picks.csv'),
    join(process.cwd(), 'going-yard', 'public', 'data', 'daily_picks.csv'),
  ]) {
    try {
      const rows = parseCsv(readFileSync(p, 'utf-8'));
      if (rows.length) return rows;
    } catch (_) { /* try next path */ }
  }
  return [];
}

// Recent-HR exclusion (2026-08-10) — server-side port of App.jsx's
// loadRecentHRLookup()/eligibleBatters filter (see that file's comment for
// the full rationale: this project's own gHR lag-echo / Hot-Hand research
// found HR rate INVERTS as the recent-HR signal climbs, not the reverse, so
// a batter who just went yard is excluded from Top 4 Tonight's pool outright
// rather than merely down-weighted). Kept in sync here for the same reason
// the tier-bucketing rework was needed 2026-08-09: a stale copy here would
// silently treat a now-excluded batter as a legitimate free-tier pick again.
function loadRecentHRExcludeSet() {
  for (const p of [
    join(process.cwd(), 'public', 'data', 'track-record-matchups.csv'),
    join(process.cwd(), 'going-yard', 'public', 'data', 'track-record-matchups.csv'),
  ]) {
    try {
      const rows = parseCsv(readFileSync(p, 'utf-8'));
      if (!rows.length) continue;
      const dateSet = new Set(rows.map(r => r.export_date).filter(Boolean));
      const parsedDates = Array.from(dateSet)
        .map(d => ({ raw: d, dt: new Date(d) }))
        .filter(x => !isNaN(x.dt.getTime()));
      parsedDates.sort((a, b) => b.dt - a.dt);
      const mostRecent = parsedDates[0]?.raw;
      if (!mostRecent) continue;
      const names = new Set();
      rows.forEach(r => {
        if (r.export_date !== mostRecent) return;
        if ((r['Gone Yard'] || '').trim().toUpperCase() !== 'YES') return;
        const name = (r.Batter || '').trim().toLowerCase();
        if (name) names.add(name);
      });
      return names;
    } catch (_) { /* try next path */ }
  }
  return new Set();
}

// Independently recomputes today's real Top 4 Tonight selection server-side
// (never trusts a client-supplied flag — see header comment). Fails CLOSED:
// any load/parse failure returns false (requires sign-in) rather than
// silently handing out free generations.
//
// REWORK 2026-08-10: the 2026-08-09 version tried to exactly replicate the
// client's tier-bucketed selection (one specific top-1-per-tier pick) —
// confirmed live, via a standalone debug run against today's real slate,
// that this fails almost always, not just occasionally. Two distinct causes
// found: (1) TIER-CLASSIFICATION divergence — serverIsLongshot()'s gate used
// this file's own raw, non-pool-normalized trueHR/matchup approximation,
// which landed real client picks in the WRONG tier entirely (e.g. Freddie
// Freeman was the client's real Longshot pick but classified Mid-Tier here;
// Royce Lewis was the client's real Mid-Tier pick but classified Longshot
// here) — no amount of within-tier rank widening fixes a batter who isn't
// even in the right pool. (2) Even where the tier agreed, the raw score
// approximation doesn't reliably land the SAME batter at exactly rank #1
// (e.g. Shohei Ohtani, correctly Chalk on both sides, ranked #2 of 35 here,
// essentially tied with #1). Net result debugged live: 0 of 4 real picks
// matched, every single card.
//
// Rather than continue chasing exact parity with a client algorithm this
// approximation can't precisely reproduce (per-game pool normalization,
// full compute*Score() internals), this drops the tier-exact-match
// requirement and checks a single, more robust bound instead: is this a
// REAL matchup today, non-Elite/Tough, not recent-HR-excluded, and among
// the top slice of today's eligible pool by this file's own score. A
// self-calibrating percentage (not a fixed count) so it scales with a
// light vs. full slate. Validated against today's real 4 live picks before
// shipping: they ranked #2, #23, #50, #67 of 630 eligible — top 15%
// (≈top 95 today) comfortably covers all 4 with real margin, while still
// excluding ~85% of the pool (meaningfully bounds bulk free-tier abuse,
// which is what this gate actually exists to prevent — see header comment).
async function isTodaysTop4(batterId, pitcherId) {
  try {
    const rows = loadDailyPicksRows();
    if (!rows.length) return false;
    const recentHrExclude = loadRecentHRExcludeSet();
    const bId = String(batterId), pId = String(pitcherId);

    const eligible = rows
      .filter(r => r.batter_id && r.pitcher_id)
      .filter(r => {
        const grade = (r.pitcher_grade_label || '').toLowerCase();
        return !grade.includes('elite') && !grade.includes('tough'); // outright excluded, matches TopThreeTab
      })
      .filter(r => !recentHrExclude.has((r.batter || '').trim().toLowerCase())) // 2026-08-10, matches TopThreeTab
      .map(r => ({
        batterId: String(parseInt(r.batter_id) || 0),
        pitcherId: String(parseInt(r.pitcher_id) || 0),
        score: serverTrueHRScore(r) * 0.5 + serverMatchupScore(r) * 0.5 + sauceBonus(r) + bullpenBonus(r),
      }))
      .sort((a, b) => b.score - a.score);

    if (!eligible.length) return false;
    const cutoffN = Math.max(20, Math.ceil(eligible.length * 0.15));
    return eligible.slice(0, cutoffN).some(p => p.batterId === bId && p.pitcherId === pId);
  } catch (e) {
    return false; // fail closed
  }
}

const H = { 'User-Agent': 'Mozilla/5.0' };
const MIN_BBE = 8;        // recent-form side note needs at least this many recent BBEs to report
const RECENT_N = 10;      // "L10 BBE" recent-form window
const POOL_GAMES = 25;    // recent games scanned for the L10 recent-form pool
const MIN_ARSENAL_PCT = 0.08; // pitcher's real mix = pitches thrown >=8% of the time
// Arsenal Fit sample-size trust floor — mirrors App.jsx's own
// MIN_BVP_PA_TRUST (2026-07-28), which itself mirrors the engine's
// MIN_PA_BVP_RATED (8 PA). Below this, the Arsenal Fit numbers are still
// reported (never hidden — same "show it, flag it" convention this app
// always uses for thin samples) but explicitly labeled thin.
const MIN_BVP_PA_TRUST = 8;

function getETDateStr() {
  const et = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const d = new Date(et);
  return d.toISOString().slice(0, 10);
}

function sprayAngleFromCoords(coordX, coordY) {
  const angleRaw = Math.atan2(coordX - 125, 203.5 - coordY) * (180 / Math.PI);
  return -1.0754 * angleRaw + 90.1427;
}
function classifyDirection(sprayAngle, batHand) {
  if (sprayAngle == null || (batHand !== 'L' && batHand !== 'R')) return 'Center';
  if (sprayAngle >= 80 && sprayAngle <= 100) return 'Center';
  if (batHand === 'R') return sprayAngle > 100 ? 'Pull' : 'Oppo';
  return sprayAngle < 80 ? 'Pull' : 'Oppo';
}
function approxBarrel(ev, la) {
  if (ev == null || la == null || ev < 98) return false;
  const over = Math.min(ev - 98, 18);
  const lo = 26 - (over / 18) * 18;   // widens 26 -> 8 as EV climbs 98 -> 116+
  const hi = 30 + (over / 18) * 20;   // widens 30 -> 50 as EV climbs 98 -> 116+
  return la >= lo && la <= hi;
}

// TODAY's real game context — the light schedule-by-gamePk endpoint, not a
// full feed/live pull (all we need here is one string + two team IDs).
// Returns null on any failure so callers can gracefully skip the
// today-context tiers rather than erroring the whole note.
async function fetchTodayContext(gameId) {
  if (!gameId) return null;
  try {
    const res = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&gamePk=${gameId}`, { headers: H });
    if (!res.ok) return null;
    const d = await res.json();
    const g = d.dates?.[0]?.games?.[0];
    if (!g) return null;
    return {
      dayNight: g.dayNight || null,
      homeTeamId: g.teams?.home?.team?.id ?? null,
      awayTeamId: g.teams?.away?.team?.id ?? null,
    };
  } catch (e) { return null; }
}

async function fetchRecentBattedBalls(batterId, season) {
  const glRes = await fetch(`https://statsapi.mlb.com/api/v1/people/${batterId}/stats?stats=gameLog&group=hitting&season=${season}&sportId=1`, { headers: H });
  if (!glRes.ok) return [];
  const gl = await glRes.json();
  const games = (gl.stats?.[0]?.splits || [])
    .filter(s => (s.stat?.atBats || 0) > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, POOL_GAMES);

  const events = [];
  for (const g of games) {
    const gamePk = g.game?.gamePk;
    if (!gamePk) continue;
    try {
      const liveRes = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`, { headers: H });
      if (!liveRes.ok) continue;
      const live = await liveRes.json();
      const dayNight = live.gameData?.datetime?.dayNight || null;
      const plays = live.liveData?.plays?.allPlays || [];
      for (const p of plays) {
        if (p.matchup?.batter?.id !== batterId) continue;
        for (const pe of (p.playEvents || [])) {
          const hd = pe.hitData;
          if (!hd) continue;
          // Top of the inning = the away team is batting; bottom = home
          // team batting — a direct read, no team-ID comparison needed.
          const isHome = p.about?.isTopInning === false ? true
            : p.about?.isTopInning === true ? false : null;
          events.push({
            date: g.date, dayNight, isHome,
            ev: hd.launchSpeed ?? null, la: hd.launchAngle ?? null,
            dist: hd.totalDistance ?? null, trajectory: hd.trajectory || null,
            coordX: hd.coordinates?.coordX ?? null, coordY: hd.coordinates?.coordY ?? null,
            pitchType: pe.details?.type?.code || null,
          });
        }
      }
    } catch (e) { /* skip a game that fails to load; the rest still count */ }
  }
  return events; // already recency-ordered — games fetched newest-first, plays appended in that order
}

async function fetchPitcherArsenal(pitcherId, season) {
  const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${pitcherId}/stats?stats=pitchArsenal&season=${season}&sportId=1`, { headers: H });
  if (!res.ok) return [];
  const d = await res.json();
  const splits = d.stats?.[0]?.splits || [];
  return splits
    .filter(s => (s.stat?.percentage || 0) >= MIN_ARSENAL_PCT)
    .map(s => ({ code: s.stat?.type?.code, name: s.stat?.type?.description, pct: Math.round((s.stat?.percentage || 0) * 100) }))
    .filter(p => p.code);
}

// Recent-form side note (DEMOTED, 2026-09-15 — see the file-header rework
// comment). General "is this batter hot or cold right now" contact-quality
// context only — NOT matched to the opposing pitcher's specific mix (that
// citation, matchTieredContext(), was removed outright: it was the most
// literally "recent batted-ball data vs the mix" piece of the old design,
// and research found that exact class of data carries little standalone
// HR signal). Returns null below MIN_BBE — a thin recent-form sample simply
// means the note leans on Arsenal Fit alone, not that it should be refused.
function computeRecentStats(events, batterHand, pitcherHand) {
  if (events.length < MIN_BBE) return null;

  // Switch hitters ('S') bat from the side OPPOSITE the opposing pitcher's
  // throwing hand for this specific matchup — resolve to a real L/R before
  // classifying pull direction. Found via live validation 2026-08-03:
  // Perdomo (a real switch hitter) came back 0% Pull against a real
  // batted-ball set that clearly wasn't all-center — classifyDirection()
  // silently defaulted to 'Center' for every ball because 'S' isn't 'L' or
  // 'R'. Same resolution rule already used elsewhere in this app
  // (HandFilter/getHandSpecificGrade-style switch-hitter handling).
  const effectiveHand = batterHand === 'S'
    ? (pitcherHand === 'L' ? 'R' : 'L')
    : batterHand;

  const l10 = events.slice(0, RECENT_N);
  const barrelPct = Math.round(100 * l10.filter(e => approxBarrel(e.ev, e.la)).length / l10.length);
  const fbPct     = Math.round(100 * l10.filter(e => e.trajectory === 'fly_ball').length / l10.length);
  const pullPct   = Math.round(100 * l10.filter(e => {
    const sa = (e.coordX != null && e.coordY != null) ? sprayAngleFromCoords(e.coordX, e.coordY) : null;
    return classifyDirection(sa, effectiveHand) === 'Pull';
  }).length / l10.length);
  const farBallCount = l10.filter(e => (e.dist || 0) >= 350).length;

  return { l10BBE: l10.length, barrelPct, fbPct, pullPct, farBallCount, poolSize: events.length };
}

// Arsenal Fit — the PRIMARY, validated data block (2026-09-15 rework, see
// file header). Client-supplied straight off the daily_picks.csv row
// already open in the caller's slideout (bvp_pa/bvp_iso/bvp_avg_ev/
// bvp_barrel_pct/bvp_fb_pct/bvp_hr_count/ps_convergence/ps_conv_pitch —
// exact field names confirmed against App.jsx's own OB_COLS/ARSENAL_FIT_COLS
// usage before wiring this). Returns null when the fields aren't present at
// all (e.g. a historical/non-slate lookup where this batter isn't today's
// real probable-starter matchup) rather than fabricating zeros.
function buildArsenalFit({ bvpPa, bvpIso, bvpAvgEv, bvpBarrelPct, bvpFbPct, bvpHrCount, psConvergence, psConvPitch }) {
  const pa = parseInt(bvpPa);
  if (!Number.isFinite(pa) || pa <= 0) return null;
  return {
    pa,
    iso: Number.isFinite(parseFloat(bvpIso)) ? parseFloat(bvpIso) : null,
    avgEv: Number.isFinite(parseFloat(bvpAvgEv)) ? parseFloat(bvpAvgEv) : null,
    barrelPct: Number.isFinite(parseFloat(bvpBarrelPct)) ? parseFloat(bvpBarrelPct) : null,
    fbPct: Number.isFinite(parseFloat(bvpFbPct)) ? parseFloat(bvpFbPct) : null,
    hrCount: Number.isFinite(parseInt(bvpHrCount)) ? parseInt(bvpHrCount) : null,
    psConvergence: Number.isFinite(parseFloat(psConvergence)) ? parseFloat(psConvergence) : null,
    psConvPitch: psConvPitch || null,
    trustworthy: pa >= MIN_BVP_PA_TRUST,
  };
}

function buildPrompt({ batterName, pitcherName, pitcherGrade, batterHand, pitcherHand, arsenal, arsenalFit, recentStats, selectionContext, weather, dayNight }) {
  const arsenalStr = arsenal.map(a => `${a.name} (${a.pct}%)`).join(', ');

  // Arsenal Fit (2026-09-15) — the PRIMARY data block. Season-long, not
  // recent — the validated signal per the file-header rework comment.
  const afStr = arsenalFit
    ? `${arsenalFit.pa} season PA vs this pitcher's real pitch mix + handedness${arsenalFit.trustworthy ? '' : ' (THIN sample — under 8 PA, treat cautiously)'}: `
      + [
          arsenalFit.iso != null ? `${arsenalFit.iso.toFixed(3)} ISO` : null,
          arsenalFit.avgEv != null ? `${arsenalFit.avgEv.toFixed(1)}mph avg EV` : null,
          arsenalFit.barrelPct != null ? `${arsenalFit.barrelPct.toFixed(1)}% Barrel` : null,
          arsenalFit.fbPct != null ? `${arsenalFit.fbPct.toFixed(1)}% Fly Ball` : null,
          arsenalFit.hrCount != null ? `${arsenalFit.hrCount} HR` : null,
        ].filter(Boolean).join(', ')
      + (arsenalFit.psConvergence != null ? `. Pitch-convergence fit score ${arsenalFit.psConvergence.toFixed(1)}${arsenalFit.psConvPitch ? ` (driven mainly by his ${arsenalFit.psConvPitch})` : ''}` : '')
      + '.'
    : 'unavailable for this matchup (not resolvable to a real today\'s-slate pitcher).';

  const recentStr = recentStats
    ? `${recentStats.barrelPct}% Barrel, ${recentStats.fbPct}% Fly Ball, ${recentStats.pullPct}% Pull, ${recentStats.farBallCount} balls hit 350ft+ (last ${recentStats.l10BBE} real batted-ball events, any opponent)`
    : null;

  // Weather/park (2026-08-09) — client-supplied from daily_picks.csv's own
  // pre-game forecast columns (temp_f/wind_speed_mph/wind_effect/
  // hr_factor_int), the same fields WeatherStrip/Ball Carry/xHR Conversion
  // already use — no new server-side fetch, no new data source. This is a
  // PRE-GAME FORECAST snapshot from the last pipeline run, not a live
  // reading — worded that way below rather than implying real-time weather.
  const weatherStr = weather?.isDome
    ? 'Dome/retractable roof — weather is not a factor.'
    : (weather && weather.tempF != null)
      ? `${weather.tempF}°F, wind ${weather.windEffect || 'calm'}${weather.windMph != null ? ` at ${weather.windMph}mph` : ''}, park HR factor ${weather.hrFactor ?? 100} (100=neutral)${weather.rainPct >= 40 ? `, ${weather.rainPct}% rain risk` : ''}.`
      : null;
  // Labeled day/night context, still used for the weather line (2026-08-03
  // fix — never hardcode "tonight") even though the recent-batted-ball
  // mix-matching that originally needed this value is gone.
  const dnLabel = dayNight === 'day' ? "today's day game" : dayNight === 'night' ? "today's night game" : "today's game";

  const system = `You are writing a terse, factual scouting note for a baseball betting/DFS tool. You will be given a fixed set of real, pre-verified statistics. Write 2-4 sentences using ONLY the numbers provided below — never introduce, estimate, or infer any statistic not explicitly given. If a data point is marked unavailable, do not mention it or make one up. Be direct and concise, matchup-analyst tone, no hedging filler like "it's worth noting." Always mention the pitcher's grade for balance — do not write a purely bullish note about a batter facing a Tough or Elite pitcher without saying so.

The "Arsenal Fit" data (season-long performance specifically vs this pitcher's real pitch mix + handedness) is the DOMINANT, validated signal for home run prediction and MUST anchor the note's main analytical claim — lead with it. The "Recent form" data (if given) is a SECONDARY, subordinated side note only — general contact-quality trend, not matched to this specific pitcher's mix, and this project's own research found this class of recent-batted-ball data carries little to no standalone HR correlation on its own. Never present recent form as equally predictive to Arsenal Fit, and never let it override or contradict what Arsenal Fit says — if the two disagree (e.g. strong Arsenal Fit numbers but a cold recent stretch, or vice versa), name that tension explicitly and still treat Arsenal Fit as the more trustworthy read. If Arsenal Fit itself is marked unavailable, say so plainly and lean on recent form and the pitcher's grade instead, without overstating confidence. If Arsenal Fit is marked as a THIN sample, note the small sample size rather than treating it with full confidence.${selectionContext ? ` A "Selection context" line will also be given, explaining why this batter was picked (typically a season-length composite score). If the data below doesn't clearly support that reasoning, say so plainly and name that tension directly — do not write an artificially bullish note just because the batter was already selected.` : ''}${weatherStr ? ` A "${dnLabel} conditions" line will also be given (a pre-game forecast, not a live reading) — only work it into the note when it's genuinely notable for a home run (e.g. hot temperature combined with a hitter-friendly park factor, a strong double-digit-mph wind blowing out, or a dome making weather irrelevant); skip it silently if conditions are unremarkable rather than padding the note with a forced mention. If you reference this game at all, describe it exactly as "${dnLabel}" — never call it "tonight" unless that literal phrase was given. Never state a wind direction, temperature, or park factor other than exactly what's given.` : ''}`;

  const user = `Batter: ${batterName} (bats ${batterHand})
Opposing pitcher: ${pitcherName} (throws ${pitcherHand}, grade: ${pitcherGrade || 'unknown'})
Pitcher's real arsenal (>=8% usage): ${arsenalStr || 'unavailable'}
${selectionContext ? `\nSelection context: ${selectionContext}\n` : ''}${weatherStr ? `\n${dnLabel[0].toUpperCase()}${dnLabel.slice(1)} conditions (pre-game forecast, not a live reading): ${weatherStr}\n` : ''}
Arsenal Fit (season-long vs this exact pitch mix + hand — the dominant signal): ${afStr}
${recentStr ? `Recent form (secondary, general contact trend — NOT matched to this pitcher's mix, weaker signal): ${recentStr}.` : 'Recent form: not enough recent batted-ball events to report.'}

Write the scouting note now.`;

  return { system, user };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { batterId, pitcherId, batterName, pitcherName, batterHand, pitcherHand, pitcherGrade, gameId, isHomeToday, selectionContext,
    tempF, windMph, windEffect, hrFactor, isDome, rainPct,
    // Arsenal Fit (2026-09-15) — client-supplied straight off the exact
    // daily_picks.csv row already open in the caller's slideout, same
    // pattern as the weather fields above. See buildArsenalFit()'s comment.
    bvpPa, bvpIso, bvpAvgEv, bvpBarrelPct, bvpFbPct, bvpHrCount, psConvergence, psConvPitch } = req.body || {};
  if (!batterId || !pitcherId) return res.status(400).json({ error: 'batterId and pitcherId required' });

  const season = new Date().getFullYear();
  const etDate = getETDateStr();
  // 2026-08-04: selectionContext changes both the system prompt (adds the
  // tension-naming instruction) and the user prompt (adds the "Selection
  // context" line), so it must be part of the cache key — otherwise whichever
  // caller (the plain batter-slideout note vs. Top 3 Tonight's tension-aware
  // one) generates first for a given batter/pitcher/date silently poisons the
  // cache for the other, serving back a note written under the wrong prompt.
  // :v2 (2026-09-15) — bumped so a note cached earlier today under the OLD
  // recent-batted-ball-anchored architecture (pre-rework) can never be
  // served as a "cached" hit under the new Arsenal Fit-anchored one; the
  // old key still expires naturally via its own 20h TTL, just orphaned.
  const cacheKey = `scoutnote:${batterId}:${pitcherId}:${etDate}${selectionContext ? ':sel' : ''}:v2`;

  let redis = null;
  if (process.env.UPSTASH_KV_REST_API_URL && process.env.UPSTASH_KV_REST_API_TOKEN) {
    redis = new Redis({ url: process.env.UPSTASH_KV_REST_API_URL, token: process.env.UPSTASH_KV_REST_API_TOKEN });
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.status(200).json({ ...cached, cached: true }); // cache hits are ALWAYS free, no auth check
    } catch (e) { /* cache miss/unavailable — proceed to generate */ }
  }

  // Free-tier gate (2026-08-07, reworked 2026-08-09) — cache miss = a
  // genuinely new Anthropic call. Free without sign-in only for today's real
  // Top 4 Tonight picks (recomputed server-side, see isTodaysTop4() above);
  // everyone else needs a valid Clerk session token. Same verifyToken()
  // pattern already used in api/save-picks.js for Cloud picks sync.
  if (!(await isTodaysTop4(batterId, pitcherId))) {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    let signedIn = false;
    if (token) {
      try {
        const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
        signedIn = !!payload?.sub;
      } catch (e) { signedIn = false; }
    }
    if (!signedIn) {
      return res.status(401).json({
        error: 'sign_in_required',
        message: "Sign in to generate a Scouting Note for this matchup — today's Top 3 picks and any note someone's already generated today are always free.",
      });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  try {
    const [events, arsenal, scheduleCtx] = await Promise.all([
      fetchRecentBattedBalls(parseInt(batterId), season),
      fetchPitcherArsenal(parseInt(pitcherId), season),
      fetchTodayContext(gameId),
    ]);
    // isHomeToday is client-supplied (trivial there: dp.batting_team ===
    // dp.home_team) rather than resolved server-side — the schedule lookup
    // above gives team IDs, which would need the batter's own team ID to
    // compare against; the client already has the answer as a plain string
    // comparison, no reason to re-derive it here.
    const todayContext = {
      dayNight: scheduleCtx?.dayNight ?? null,
      isHomeToday: typeof isHomeToday === 'boolean' ? isHomeToday : null,
    };

    const arsenalFit = buildArsenalFit({ bvpPa, bvpIso, bvpAvgEv, bvpBarrelPct, bvpFbPct, bvpHrCount, psConvergence, psConvPitch });
    const recentStats = computeRecentStats(events, batterHand, pitcherHand);
    // Decline only if BOTH data sources are unavailable — Arsenal Fit
    // (the primary, validated signal) alone is enough to write a note even
    // when the batter's recent games are thin (early season, off IL, etc.);
    // recent form alone still works when Arsenal Fit isn't resolvable to a
    // real today's-slate matchup (see buildArsenalFit()'s own comment).
    if (!arsenalFit && !recentStats) {
      const thin = { insufficientData: true, note: null, stats: null, cached: false };
      return res.status(200).json(thin);
    }

    const weather = (tempF != null || isDome === true)
      ? { tempF: tempF ?? null, windMph: windMph ?? null, windEffect: windEffect || null,
          hrFactor: hrFactor ?? null, isDome: !!isDome, rainPct: rainPct ?? null }
      : null;
    const { system, user } = buildPrompt({ batterName, pitcherName, pitcherGrade, batterHand, pitcherHand, arsenal, arsenalFit, recentStats, selectionContext, weather, dayNight: todayContext.dayNight });

    const anthRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    const anthData = await anthRes.json();
    if (!anthRes.ok) {
      return res.status(anthRes.status).json({ error: anthData?.error?.message || 'Anthropic API error' });
    }
    const note = anthData?.content?.[0]?.text?.trim() || null;

    // arsenalFit/recentStats returned separately (was one combined `stats`
    // object pre-rework) so the client can render the raw verified numbers
    // behind the note under their correct primary/secondary labels rather
    // than one flat block — see AtBatSlideIn's render, updated to match.
    const payload = { insufficientData: false, note, arsenalFit, recentStats, arsenal, cached: false };
    if (redis && note) {
      try { await redis.set(cacheKey, payload, { ex: 60 * 60 * 20 }); } catch (e) { /* cache write failure is non-fatal */ }
    }
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

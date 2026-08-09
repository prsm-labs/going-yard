// api/batter-scouting-note.js — Scouting Note (2026-08-03)
//
// Computes verified recent-form stats for a batter against TODAY's opposing
// pitcher's real arsenal (last-10 real batted-ball events, per-pitch-type
// FB%, and at-bats vs that mix in games matching TODAY's actual day/night +
// home/away context, with their literal distances), then asks Claude to
// phrase those EXACT numbers into a short scouting note. Claude never
// computes or invents a single number here — every figure in the prompt is
// pre-verified server-side by this endpoint, the same discipline every
// other stat in this app already follows, since this feeds a real
// betting-decision surface (AtBatSlideIn's collapsed "Scouting Note"
// section).
//
// Day/night + home/away (2026-08-03, same-day follow-up): the first version
// hardcoded "night" — correct by coincidence for that day's two validation
// matchups (both real night games), but wrong in general (day games happen
// every week) and ignored home/away entirely. Fixed by resolving TODAY's
// real game context (both dimensions) and matching recent at-bats against
// it with a tiered fallback (see matchTieredContext()) rather than a fixed
// filter — a batter with a thin same-context sample still gets a real
// answer, just at a looser (and honestly-labeled) tier instead of silence.
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
// Data sources — all MLB Stats API, no Baseball Savant scraping needed:
//   - schedule?gamePk={id}             → TODAY's real dayNight + home/away
//     team IDs, for the one specific game this slideout is about (cheap —
//     lighter than a full feed/live pull for just this one flag).
//   - people/{id}/stats?stats=gameLog  → batter's recent games
//   - game/{gamePk}/feed/live          → real batted-ball events (hitData)
//     PLUS gameData.datetime.dayNight for free, same response — no
//     separate schedule join needed for the RECENT games (confirmed live
//     2026-08-03). Home/away per event comes from about.isTopInning (top =
//     away team batting, bottom = home team batting) — no team-ID
//     comparison needed either.
//   - people/{id}/stats?stats=pitchArsenal → pitcher's real pitch mix
//     (same endpoint api/pitcher.js already uses).
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
// Free-tier gate (added 2026-08-07): every cache HIT stays free for anyone,
// signed in or not — the note's already paid for. A cache MISS (a genuinely
// new Anthropic call) is only free for today's real Top 3 Tonight picks;
// everyone else must be signed in (Clerk — same auth already wired in for
// Cloud picks sync, api/save-picks.js/api/get-picks.js). "Today's real Top
// 3" is deliberately NOT trusted from the client (a client-asserted
// isTop3:true flag would be trivially spoofable via devtools) — instead
// this endpoint independently recomputes an approximate ranking server-side
// from daily_picks.csv, reusing the exact serverTrueHRScore()/
// serverMatchupScore() approximations already proven out in
// api/barrel-notify.js for the same "read the CSV, score every batter,
// don't trust the client" purpose. Won't be byte-identical to the client's
// own (more precise, per-game-pool-normalized) Top 3 Tonight ranking, but
// uses the same signals/weights and will overlap heavily in practice — and
// fails CLOSED (treats a data-load failure as "not top 3", i.e. requires
// sign-in) rather than open.

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
function parseCsv(text) {
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

// Independently recomputes an approximate "today's real Top 3 Tonight"
// ranking server-side (never trusts a client-supplied flag — see header
// comment). Fails CLOSED: any load/parse failure returns false (requires
// sign-in) rather than silently handing out free generations.
async function isTodaysTop3(batterId, pitcherId) {
  try {
    const rows = loadDailyPicksRows();
    if (!rows.length) return false;
    const bId = String(batterId), pId = String(pitcherId);
    const scored = rows
      .filter(r => r.batter_id && r.pitcher_id)
      .filter(r => {
        const grade = (r.pitcher_grade_label || '').toLowerCase();
        return !grade.includes('elite') && !grade.includes('tough'); // outright excluded, matches TopThreeTab
      })
      .map(r => ({
        batterId: String(parseInt(r.batter_id) || 0),
        pitcherId: String(parseInt(r.pitcher_id) || 0),
        score: serverTrueHRScore(r) * 0.5 + serverMatchupScore(r) * 0.5 + sauceBonus(r) + bullpenBonus(r),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    return scored.some(s => s.batterId === bId && s.pitcherId === pId);
  } catch (e) {
    return false; // fail closed
  }
}

const H = { 'User-Agent': 'Mozilla/5.0' };
const MIN_BBE = 8;        // below this, decline to generate — too thin a sample to say anything
const RECENT_N = 10;      // "L10 BBE" headline window
const POOL_GAMES = 25;    // recent games scanned for the larger per-pitch-type / night-vs-mix pool
const MIN_PITCH_PA = 3;   // minimum batted balls vs a single pitch type before reporting its FB%
const MIN_ARSENAL_PCT = 0.08; // pitcher's real mix = pitches thrown >=8% of the time

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

// Tiered fallback for the "vs this mix, in a context like today's game"
// citation. Requiring BOTH day/night AND home/away to match today can
// starve the sample (home/away alone roughly halves it on top of whatever
// day/night already cut) — so this tries the most specific match first and
// only loosens when the strict tier comes up thin, always labeling which
// tier actually produced the numbers so the note never overstates how
// context-matched the citation really is.
function matchTieredContext(events, arsenalCodes, todayDayNight, isHomeToday) {
  const base = events.filter(e => arsenalCodes.includes(e.pitchType) && (e.dist || 0) >= 150);
  const tiers = [];
  if (todayDayNight != null && isHomeToday != null) {
    tiers.push({ label: `${todayDayNight} games, ${isHomeToday ? 'home' : 'away'}`,
      pool: base.filter(e => e.dayNight === todayDayNight && e.isHome === isHomeToday) });
  }
  if (todayDayNight != null) {
    tiers.push({ label: `${todayDayNight} games (any venue)`,
      pool: base.filter(e => e.dayNight === todayDayNight) });
  }
  if (isHomeToday != null) {
    tiers.push({ label: `${isHomeToday ? 'home' : 'away'} games (any time of day)`,
      pool: base.filter(e => e.isHome === isHomeToday) });
  }
  tiers.push({ label: 'any recent game', pool: base });

  for (const t of tiers) {
    if (t.pool.length >= 3) {
      return { label: t.label, distances: t.pool.slice(0, 8).map(e => Math.round(e.dist || 0)) };
    }
  }
  // Nothing hit the 3-event floor at any tier — return the loosest pool
  // anyway (even 1-2 real data points), honestly labeled as thin.
  const loosest = tiers[tiers.length - 1];
  return { label: loosest.label + ' (thin sample)', distances: loosest.pool.slice(0, 8).map(e => Math.round(e.dist || 0)) };
}

function computeStats(events, batterHand, pitcherHand, arsenal, todayContext) {
  if (events.length < MIN_BBE) return null;
  const arsenalCodes = arsenal.map(a => a.code);

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

  const byPitchFB = [];
  for (const a of arsenal) {
    const sub = events.filter(e => e.pitchType === a.code);
    if (sub.length >= MIN_PITCH_PA) {
      byPitchFB.push({
        pitch: a.name, code: a.code, usagePct: a.pct, n: sub.length,
        fbPct: Math.round(100 * sub.filter(e => e.trajectory === 'fly_ball').length / sub.length),
      });
    }
  }

  // Matched to TODAY's real day/night + home/away context, not a fixed
  // "night" filter — see matchTieredContext()'s own comment for the tiered-
  // fallback rationale. Distance floor (150ft) unchanged from the original
  // fix: keeps real fly/line-drive contact, drops dribbler/foul-tip noise.
  const mixContext = matchTieredContext(
    events, arsenalCodes, todayContext?.dayNight ?? null, todayContext?.isHomeToday ?? null);

  return {
    l10BBE: l10.length, barrelPct, fbPct, pullPct, farBallCount,
    byPitchFB, mixContextLabel: mixContext.label, mixContextDistances: mixContext.distances,
    poolSize: events.length,
  };
}

function buildPrompt({ batterName, pitcherName, pitcherGrade, batterHand, pitcherHand, arsenal, stats, selectionContext, weather, dayNight }) {
  const arsenalStr = arsenal.map(a => `${a.name} (${a.pct}%)`).join(', ');
  const byPitchStr = stats.byPitchFB.length
    ? stats.byPitchFB.map(p => `${p.fbPct}% FB rate vs ${p.pitch} (n=${p.n})`).join('; ')
    : 'not enough recent at-bats vs individual pitch types to report';
  // mixContextLabel describes whichever tier actually produced the numbers
  // (matched to TODAY's real day/night + home/away, or a looser fallback —
  // see matchTieredContext()) — never hardcoded, so the note correctly says
  // "day games" / "away games" / etc. on the days that's what's true,
  // instead of always claiming "at night" regardless of today's real slate.
  const mixStr = stats.mixContextDistances.length
    ? `${stats.mixContextDistances.length} recent at-bats vs this pitch mix in ${stats.mixContextLabel}, batted-ball distances: ${stats.mixContextDistances.join('ft, ')}ft`
    : `no recent at-bats vs this specific pitch mix on record (checked: ${stats.mixContextLabel})`;
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
  // Same day/night value the "at-bats vs this pitch mix" line above is
  // matched against (see matchTieredContext()) — labeled explicitly rather
  // than a generic "today" so the weather line can never contradict what
  // the mix-context line already says about today's real game (e.g. a
  // Sunday day-game slate must never read "tonight" anywhere in the note).
  const dnLabel = dayNight === 'day' ? "today's day game" : dayNight === 'night' ? "today's night game" : "today's game";

  const system = `You are writing a terse, factual scouting note for a baseball betting/DFS tool. You will be given a fixed set of real, pre-verified statistics. Write 2-4 sentences using ONLY the numbers provided below — never introduce, estimate, or infer any statistic not explicitly given, including the specific game context (day/night, home/away) the "at-bats vs this pitch mix" figure is drawn from — state exactly what's given, do not assume it's a night game or a home game unless the data says so. If a data point is marked unavailable, do not mention it or make one up. Be direct and concise, matchup-analyst tone, no hedging filler like "it's worth noting." Always mention the pitcher's grade for balance — do not write a purely bullish note about a batter facing a Tough or Elite pitcher without saying so.${selectionContext ? ` A "Selection context" line will also be given, explaining why this batter was picked (typically a season-length composite score, not today's recent form). If the recent batted-ball stats below don't clearly support that reasoning — e.g. a low/0% barrel rate, few long fly balls, a cold-looking recent stretch — say so plainly and name that tension directly (e.g. "ranked on season form, but recent contact has been quiet"). Do not write an artificially bullish note just because the batter was already selected as a pick — the note's job is to report what the recent data actually shows, even when that cuts against the selection.` : ''}${weatherStr ? ` A "${dnLabel} conditions" line will also be given (a pre-game forecast, not a live reading) — only work it into the note when it's genuinely notable for a home run (e.g. hot temperature combined with a hitter-friendly park factor, a strong double-digit-mph wind blowing out, or a dome making weather irrelevant); skip it silently if conditions are unremarkable (mild temp, calm wind, a roughly neutral park factor near 100) rather than padding the note with a forced mention. If you reference this game at all, describe it exactly as "${dnLabel}" — never call it "tonight" unless that literal phrase was given, and never contradict the day/night context already established by the "at-bats vs this pitch mix" data above. Never state a wind direction, temperature, or park factor other than exactly what's given.` : ''}`;

  const user = `Batter: ${batterName} (bats ${batterHand})
Opposing pitcher: ${pitcherName} (throws ${pitcherHand}, grade: ${pitcherGrade || 'unknown'})
Pitcher's real arsenal (>=8% usage): ${arsenalStr || 'unavailable'}
${selectionContext ? `\nSelection context: ${selectionContext}\n` : ''}${weatherStr ? `\n${dnLabel[0].toUpperCase()}${dnLabel.slice(1)} conditions (pre-game forecast, not a live reading): ${weatherStr}\n` : ''}
Batter's last ${stats.l10BBE} real batted-ball events: ${stats.barrelPct}% Barrel, ${stats.fbPct}% Fly Ball, ${stats.pullPct}% Pull, ${stats.farBallCount} balls hit 350ft+.
Batter's fly-ball rate by pitch type (recent games, larger sample): ${byPitchStr}.
Batter vs this exact pitch mix, matched to today's real game context: ${mixStr}.

Write the scouting note now.`;

  return { system, user };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { batterId, pitcherId, batterName, pitcherName, batterHand, pitcherHand, pitcherGrade, gameId, isHomeToday, selectionContext,
    tempF, windMph, windEffect, hrFactor, isDome, rainPct } = req.body || {};
  if (!batterId || !pitcherId) return res.status(400).json({ error: 'batterId and pitcherId required' });

  const season = new Date().getFullYear();
  const etDate = getETDateStr();
  // 2026-08-04: selectionContext changes both the system prompt (adds the
  // tension-naming instruction) and the user prompt (adds the "Selection
  // context" line), so it must be part of the cache key — otherwise whichever
  // caller (the plain batter-slideout note vs. Top 3 Tonight's tension-aware
  // one) generates first for a given batter/pitcher/date silently poisons the
  // cache for the other, serving back a note written under the wrong prompt.
  const cacheKey = `scoutnote:${batterId}:${pitcherId}:${etDate}${selectionContext ? ':sel' : ''}`;

  let redis = null;
  if (process.env.UPSTASH_KV_REST_API_URL && process.env.UPSTASH_KV_REST_API_TOKEN) {
    redis = new Redis({ url: process.env.UPSTASH_KV_REST_API_URL, token: process.env.UPSTASH_KV_REST_API_TOKEN });
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.status(200).json({ ...cached, cached: true }); // cache hits are ALWAYS free, no auth check
    } catch (e) { /* cache miss/unavailable — proceed to generate */ }
  }

  // Free-tier gate (2026-08-07) — cache miss = a genuinely new Anthropic
  // call. Free without sign-in only for today's real Top 3 Tonight picks
  // (recomputed server-side, see isTodaysTop3() above); everyone else needs
  // a valid Clerk session token. Same verifyToken() pattern already used in
  // api/save-picks.js for Cloud picks sync.
  if (!(await isTodaysTop3(batterId, pitcherId))) {
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

    const stats = computeStats(events, batterHand, pitcherHand, arsenal, todayContext);
    if (!stats) {
      const thin = { insufficientData: true, note: null, stats: null, cached: false };
      return res.status(200).json(thin); // not enough recent contact — don't force a writeup, don't cache a null result
    }

    const weather = (tempF != null || isDome === true)
      ? { tempF: tempF ?? null, windMph: windMph ?? null, windEffect: windEffect || null,
          hrFactor: hrFactor ?? null, isDome: !!isDome, rainPct: rainPct ?? null }
      : null;
    const { system, user } = buildPrompt({ batterName, pitcherName, pitcherGrade, batterHand, pitcherHand, arsenal, stats, selectionContext, weather, dayNight: todayContext.dayNight });

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

    const payload = { insufficientData: false, note, stats, arsenal, cached: false };
    if (redis && note) {
      try { await redis.set(cacheKey, payload, { ex: 60 * 60 * 20 }); } catch (e) { /* cache write failure is non-fatal */ }
    }
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

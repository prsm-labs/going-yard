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

import { Redis } from '@upstash/redis';

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

function buildPrompt({ batterName, pitcherName, pitcherGrade, batterHand, pitcherHand, arsenal, stats, selectionContext }) {
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

  const system = `You are writing a terse, factual scouting note for a baseball betting/DFS tool. You will be given a fixed set of real, pre-verified statistics. Write 2-4 sentences using ONLY the numbers provided below — never introduce, estimate, or infer any statistic not explicitly given, including the specific game context (day/night, home/away) the "at-bats vs this pitch mix" figure is drawn from — state exactly what's given, do not assume it's a night game or a home game unless the data says so. If a data point is marked unavailable, do not mention it or make one up. Be direct and concise, matchup-analyst tone, no hedging filler like "it's worth noting." Always mention the pitcher's grade for balance — do not write a purely bullish note about a batter facing a Tough or Elite pitcher without saying so.${selectionContext ? ` A "Selection context" line will also be given, explaining why this batter was picked (typically a season-length composite score, not today's recent form). If the recent batted-ball stats below don't clearly support that reasoning — e.g. a low/0% barrel rate, few long fly balls, a cold-looking recent stretch — say so plainly and name that tension directly (e.g. "ranked on season form, but recent contact has been quiet"). Do not write an artificially bullish note just because the batter was already selected as a pick — the note's job is to report what the recent data actually shows, even when that cuts against the selection.` : ''}`;

  const user = `Batter: ${batterName} (bats ${batterHand})
Opposing pitcher: ${pitcherName} (throws ${pitcherHand}, grade: ${pitcherGrade || 'unknown'})
Pitcher's real arsenal (>=8% usage): ${arsenalStr || 'unavailable'}
${selectionContext ? `\nSelection context: ${selectionContext}\n` : ''}
Batter's last ${stats.l10BBE} real batted-ball events: ${stats.barrelPct}% Barrel, ${stats.fbPct}% Fly Ball, ${stats.pullPct}% Pull, ${stats.farBallCount} balls hit 350ft+.
Batter's fly-ball rate by pitch type (recent games, larger sample): ${byPitchStr}.
Batter vs this exact pitch mix, matched to today's real game context: ${mixStr}.

Write the scouting note now.`;

  return { system, user };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { batterId, pitcherId, batterName, pitcherName, batterHand, pitcherHand, pitcherGrade, gameId, isHomeToday, selectionContext } = req.body || {};
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
      if (cached) return res.status(200).json({ ...cached, cached: true });
    } catch (e) { /* cache miss/unavailable — proceed to generate */ }
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

    const { system, user } = buildPrompt({ batterName, pitcherName, pitcherGrade, batterHand, pitcherHand, arsenal, stats, selectionContext });

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

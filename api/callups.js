// api/callups.js — Young Guns: recent MLB call-up feed (2026-08-18)
//
// Detects real MLB call-ups via the Stats API transactions endpoint,
// typeCode CU ("Recalled") + SE ("Selected" — a contract purchase, i.e. a
// literal debut) — confirmed live against real August 2026 transactions
// before building this (Connor Norby/COL, Charles McAdoo/TOR, Zach
// Morgan/SF, etc. all came back cleanly with fromTeam/toTeam/date).
//
// Deliberately does NOT fetch each player's current MLB stat line here —
// that would mean one extra API call per player on every cache build. The
// client already has PLAYER_DATA_CACHE (players.json, loaded app-wide on
// startup) to show current-season MLB PA/AVG/HR inline in the list for
// free; a per-player live fetch only happens on-demand when a user opens
// that specific player's Majors/Minors detail (same on-demand pattern as
// AtBatSlideIn/PitcherSlideIn elsewhere in this app).
//
// Window: trailing 45 days, not full-season — a call-up older than that is
// no longer "recent" for this page's purpose, and the existing Young Gun
// signal (season_pa<100) already self-limits who's still relevant if they
// stuck in the majors. Keeps the transactions payload small and the season
// year is never hardcoded (unlike ~10 other pre-existing spots in this
// file — deliberately not inheriting that debt here).
//
// Cache: one Redis key, 6-hour TTL — transactions don't change fast enough
// to justify a shorter window, and this avoids re-querying + re-resolving
// team levels on every page load. Same Upstash instance as
// api/top4-lock.js / api/batter-scouting-note.js.

import { Redis } from '@upstash/redis';

const CACHE_KEY = 'callups:list:v1';
const CACHE_TTL_SEC = 6 * 60 * 60;
const WINDOW_DAYS = 45;

function getETDateStr(d) {
  const et = (d || new Date()).toLocaleString('en-US', { timeZone: 'America/New_York' });
  return new Date(et).toISOString().slice(0, 10);
}

function daysAgoStr(days) {
  const d = new Date(Date.now() - days * 86400000);
  return getETDateStr(d);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  return res.json();
}

// "{Team} recalled/selected the contract of {POS} {Name} from {fromTeam}."
// — position abbreviation right after the verb phrase. Confirmed against 5
// real transactions before writing this (C, 2B, RHP, 1B, RHP all matched).
// A description that doesn't match this shape defaults to "keep" (not
// pitcher) — better to occasionally let a mis-parsed pitcher through than
// silently drop a real batter.
function isPitcherTxn(desc) {
  const m = (desc || '').match(/(?:recalled|selected the contract of)\s+(\S+)\s/i);
  const pos = m ? m[1].toUpperCase() : '';
  return pos === 'RHP' || pos === 'LHP' || pos === 'P';
}

const teamLevelCache = new Map();
async function resolveTeamLevel(teamId) {
  if (!teamId) return { sportId: null, sportName: '' };
  if (teamLevelCache.has(teamId)) return teamLevelCache.get(teamId);
  let info = { sportId: null, sportName: '' };
  try {
    const d = await fetchJson(`https://statsapi.mlb.com/api/v1/teams/${teamId}`);
    const t = d.teams && d.teams[0];
    info = { sportId: t?.sport?.id ?? null, sportName: t?.sport?.name || '' };
  } catch { /* leave default */ }
  teamLevelCache.set(teamId, info);
  return info;
}

export default async function handler(req, res) {
  if (!process.env.UPSTASH_KV_REST_API_URL || !process.env.UPSTASH_KV_REST_API_TOKEN) {
    return res.status(500).json({ error: 'Redis not configured' });
  }
  const redis = new Redis({ url: process.env.UPSTASH_KV_REST_API_URL, token: process.env.UPSTASH_KV_REST_API_TOKEN });

  try {
    const today = getETDateStr();
    const cached = await redis.get(CACHE_KEY).catch(() => null);
    if (cached && cached.builtDate === today && !req.query?.force) {
      return res.status(200).json({ ...cached, cachedHit: true });
    }

    const startDate = daysAgoStr(WINDOW_DAYS);
    const txnData = await fetchJson(
      `https://statsapi.mlb.com/api/v1/transactions?startDate=${startDate}&endDate=${today}&sportId=1`
    );
    const txns = (txnData.transactions || []).filter(t => t.typeCode === 'CU' || t.typeCode === 'SE');

    // Most recent call-up event per player only (someone can be
    // recalled/optioned multiple times inside the window).
    const byPlayer = new Map();
    for (const t of txns) {
      const pid = t.person && t.person.id;
      if (!pid) continue;
      const existing = byPlayer.get(pid);
      if (!existing || t.date > existing.date) byPlayer.set(pid, t);
    }

    const batterTxns = [...byPlayer.values()].filter(t => !isPitcherTxn(t.description));

    const players = [];
    for (const t of batterTxns) {
      const level = await resolveTeamLevel(t.fromTeam && t.fromTeam.id);
      players.push({
        playerId: t.person.id,
        name: t.person.fullName,
        callupDate: t.date,
        typeCode: t.typeCode,
        typeDesc: t.typeDesc,
        toTeam: (t.toTeam && t.toTeam.name) || '',
        toTeamId: (t.toTeam && t.toTeam.id) || null,
        fromTeam: (t.fromTeam && t.fromTeam.name) || '',
        fromTeamId: (t.fromTeam && t.fromTeam.id) || null,
        fromLevel: level.sportName,
        fromLevelSportId: level.sportId,
        description: t.description || '',
      });
    }

    players.sort((a, b) => b.callupDate.localeCompare(a.callupDate));

    const payload = { builtDate: today, windowDays: WINDOW_DAYS, count: players.length, players };
    await redis.set(CACHE_KEY, payload, { ex: CACHE_TTL_SEC }).catch(() => {});
    return res.status(200).json({ ...payload, cachedHit: false });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'callups fetch failed' });
  }
}

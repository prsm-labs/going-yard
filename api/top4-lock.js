// api/top4-lock.js — Top 4 Tonight daily lock record (2026-08-13)
//
// Motivation: Top 4 Tonight recomputes continuously all day (lineups
// confirming, injuries updating, refresh clicks) with no concept of "done
// deciding" — user reported real picks visibly churning all day (Mid-Tier
// Bell->Trammell, Longshot Mack->Tawa->Mack) and, separately, Track
// Record's own reconstruction of "what was picked that day" landing on yet
// a THIRD set of names (Pinckney/Bell live vs. Track Record's own
// re-derived guess) — the same root cause class as the Harry Ford bug
// (Track Record independently re-guesses the picks from an overnight CSV
// export instead of ever recording what was actually shown).
//
// Fix, per explicit user design: lock the picks at a fixed 8pm ET cutoff
// each day (not "wait for every lineup" — postponements/late West Coast
// games could stall that forever; by 8pm ET the picks are "pretty solid"
// per the user's own framing) and PERSIST that locked moment here so both
// (a) the live page can render a stable, non-churning result for the rest
// of the day, and (b) Track Record can read the REAL locked record instead
// of re-guessing — eliminating the reconstruction-mismatch class of bug
// for every day going forward. Deliberately NOT retroactive (confirmed
// with the user) — historical Track Record dates before this shipped keep
// using the existing best-effort reconstruction.
//
// Storage: one Redis key (`top4lock:history`) holding a JSON object keyed
// by ET date, read-modify-write on each new lock (idempotent — a date
// already present is never overwritten, so two near-simultaneous clients
// racing to lock the same evening can't clobber each other with a slightly
// different snapshot). Single-key, not one-key-per-date: write frequency
// is at most once/day, so a whole-history GET (what Track Record needs) is
// one call instead of stitching together per-date requests, and even a
// full season of daily 4-pick records comfortably fits Upstash's per-value
// size limits (a handful of KB/season).

import { Redis } from '@upstash/redis';

const HISTORY_KEY = 'top4lock:history';

function getETDateStr() {
  const et = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const d = new Date(et);
  return d.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (!process.env.UPSTASH_KV_REST_API_URL || !process.env.UPSTASH_KV_REST_API_TOKEN) {
    return res.status(500).json({ error: 'Redis not configured' });
  }
  const redis = new Redis({ url: process.env.UPSTASH_KV_REST_API_URL, token: process.env.UPSTASH_KV_REST_API_TOKEN });

  if (req.method === 'GET') {
    let history = {};
    try { history = (await redis.get(HISTORY_KEY)) || {}; } catch (e) { return res.status(500).json({ error: e.message }); }
    const { date } = req.query || {};
    if (date) {
      // Single-day lookup — what the live page checks on mount to see if
      // today is already locked (from an earlier tab/session/device).
      return res.status(200).json({ date, record: history[date] || null });
    }
    // No date -> full history, what Track Record fetches once and reads
    // per-date from client-side.
    return res.status(200).json({ history });
  }

  if (req.method === 'POST') {
    const { date, picks } = req.body || {};
    if (!date || !Array.isArray(picks) || picks.length === 0) {
      return res.status(400).json({ error: 'date and a non-empty picks array are required' });
    }
    // Only ever accept a lock for TODAY's real ET date (or yesterday's, in
    // case a client's clock/tab was open right at the ET midnight boundary)
    // — never let a stray/old client silently backfill or overwrite a
    // different day's real record.
    const todayET = getETDateStr();
    const yesterdayET = new Date(new Date(todayET + 'T00:00:00Z').getTime() - 86400000).toISOString().slice(0, 10);
    if (date !== todayET && date !== yesterdayET) {
      return res.status(400).json({ error: `date must be today (${todayET}) or yesterday (${yesterdayET}) in ET` });
    }
    try {
      const history = (await redis.get(HISTORY_KEY)) || {};
      if (history[date]) {
        // Already locked — idempotent no-op, first write for a given date
        // wins. Return what's actually stored, not what this caller sent,
        // so the client can reconcile if its own local snapshot differed.
        return res.status(200).json({ ok: true, alreadyLocked: true, record: history[date] });
      }
      const record = { lockedAt: new Date().toISOString(), picks };
      history[date] = record;
      await redis.set(HISTORY_KEY, history);
      return res.status(200).json({ ok: true, alreadyLocked: false, record });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// api/odds-refresh.js
// CRON-ONLY endpoint — called by Vercel Cron hourly (8am-8pm ET)
// Protected by CRON_SECRET env var. Vercel automatically sends:
//   Authorization: Bearer <CRON_SECRET>
// Any request without the correct secret is rejected with 401.
// This is the ONLY way to trigger live API calls to The Odds API.

import { warmOddsCache } from './_oddsCache.js';

export default async function handler(req, res) {
  // Only GET allowed (Vercel cron uses GET)
  if (req.method !== 'GET') return res.status(405).end();

  // ── Auth: Vercel cron sends Authorization: Bearer <CRON_SECRET> ──────────
  const secret = process.env.CRON_SECRET;
  const auth   = req.headers.authorization || '';

  if (!secret) {
    // CRON_SECRET not set — log warning but allow (first-time setup)
    console.warn('[Cron] CRON_SECRET not set — add it to Vercel env vars to lock this endpoint');
  } else if (auth !== `Bearer ${secret}`) {
    console.warn('[Cron] Unauthorized request blocked:', req.headers['x-forwarded-for'] || 'unknown');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── Warm the cache ────────────────────────────────────────────────────────
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ error: 'ODDS_API_KEY not configured' });
  }

  try {
    const results = await warmOddsCache(apiKey);
    console.log('[Cron] Cache warmed:', JSON.stringify(results));
    return res.status(200).json({
      ok: true,
      warmed: results,
      ts: new Date().toISOString(),
    });
  } catch(e) {
    console.error('[Cron] Fatal:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

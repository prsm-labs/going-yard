// api/odds.js
// READ-ONLY — serves cached data only. NEVER makes live API calls.
// Cache is filled exclusively by /api/odds-refresh (Vercel Cron, cron-only).
// Any visitor hitting this endpoint gets cached data or "not_cached" — zero quota burned.

import { get, normalizeGameOdds, normalizeProps } from './_oddsCache.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type = 'h2h', eventId } = req.query;

  // ── Batter props ──────────────────────────────────────────────────────────
  if (['props','props_alt','hrr'].includes(type)) {
    const propType = type === 'props' ? 'std' : type === 'props_alt' ? 'alt' : 'hrr';
    const events = get('events');
    if (!events) return notCached(res);

    const targets = eventId ? events.filter(e=>e.id===eventId) : events;
    const propResults = [];
    for (const event of targets) {
      const cached = get(`${propType}_${event.id}`);
      if (cached) propResults.push(normalizeProps(event, cached));
    }
    if (!propResults.length) return notCached(res, events);

    return res.status(200).json({
      status: 'ok', fromCache: true,
      props: propResults,
      events: events.map(e=>({ id:e.id, home_team:e.home_team, away_team:e.away_team, commence:e.commence_time })),
    });
  }

  // ── Game odds ──────────────────────────────────────────────────────────────
  const cached = get(type);
  if (!cached) return notCached(res);
  return res.status(200).json({
    status:'ok', fromCache:true,
    markets: normalizeGameOdds(cached, type), type,
  });
}

function notCached(res, events) {
  return res.status(200).json({
    status: 'not_cached',
    message: 'Odds refresh automatically every hour between 8am–8pm ET',
    markets: [], props: [],
    events: (events||[]).map(e=>({ id:e.id, home_team:e.home_team, away_team:e.away_team, commence:e.commence_time })),
  });
}

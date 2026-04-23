// api/_oddsCache.js
// Shared in-memory cache + fetch logic for The Odds API
// Used by odds.js (read-only) and odds-refresh.js (write via cron)
// Underscore prefix = private Vercel file (not exposed as a route)

export const CACHE = {};
export const TTL   = 65 * 60 * 1000; // 65 min — covers 1hr cron interval with 5min buffer

export const set = (k, v) => { CACHE[k] = { data: v, ts: Date.now() }; };
export const get = (k) => {
  const e = CACHE[k];
  return (e && Date.now() - e.ts < TTL) ? e.data : null;
};

const BASE = 'https://api.the-odds-api.com/v4/sports/baseball_mlb';

// ── All prop markets ──────────────────────────────────────────────────────
export const PROP_MARKETS = {
  std: [
    'batter_home_runs',
    'batter_hits',
    'batter_total_bases',
    'batter_rbis',
    'batter_stolen_bases',
    'batter_singles',
    'batter_doubles',
    'batter_triples',
    'batter_walks',
  ].join(','),
  alt: [
    'batter_home_runs_alternate',
    'batter_hits_alternate',
    'batter_total_bases_alternate',
  ].join(','),
  hrr: 'batter_hits_runs_rbis',
};

export const PROP_LABELS = {
  batter_home_runs:            'HR',
  batter_home_runs_alternate:  'HR (Alt)',
  batter_hits:                 'Hits',
  batter_hits_alternate:       'Hits (Alt)',
  batter_total_bases:          'Total Bases',
  batter_total_bases_alternate:'Total Bases (Alt)',
  batter_rbis:                 'RBIs',
  batter_stolen_bases:         'SB',
  batter_singles:              'Singles',
  batter_doubles:              'Doubles',
  batter_triples:              'Triples',
  batter_walks:                'Walks',
  batter_hits_runs_rbis:       'H+R+RBI',
};

// Market display order in UI
export const MARKET_ORDER = Object.keys(PROP_LABELS);

// ── Fetch helpers ─────────────────────────────────────────────────────────

export async function fetchEvents(apiKey) {
  const cached = get('events');
  if (cached) return cached;
  const r = await fetch(`${BASE}/events?apiKey=${apiKey}&dateFormat=iso`);
  if (!r.ok) throw new Error(`Events fetch failed: ${r.status}`);
  const data = await r.json();
  set('events', data);
  console.log(`[OddsCache] ${data.length} events cached. Remaining: ${r.headers.get('x-requests-remaining')}`);
  return data;
}

export async function fetchGameOdds(apiKey, type) {
  const cached = get(type);
  if (cached) return { data: cached, fromCache: true };
  const r = await fetch(
    `${BASE}/odds/?apiKey=${apiKey}&regions=us&markets=${type}&oddsFormat=american&dateFormat=iso`
  );
  const remaining = r.headers.get('x-requests-remaining');
  const used      = r.headers.get('x-requests-used');
  console.log(`[OddsCache] Game odds (${type}) — used:${used} remaining:${remaining}`);
  if (!r.ok) throw new Error(`Game odds fetch failed: ${r.status}`);
  const data = await r.json();
  set(type, data);
  return { data, fromCache: false, quota: { remaining, used } };
}

export async function fetchEventProps(apiKey, eventId, propType) {
  const markets = PROP_MARKETS[propType] || PROP_MARKETS.std;
  const ck = `${propType}_${eventId}`;
  const cached = get(ck);
  if (cached) return { data: cached, fromCache: true };
  const r = await fetch(
    `${BASE}/events/${eventId}/odds?apiKey=${apiKey}&regions=us&markets=${markets}&oddsFormat=american&dateFormat=iso`
  );
  const remaining = r.headers.get('x-requests-remaining');
  const used      = r.headers.get('x-requests-used');
  console.log(`[OddsCache] Props (${propType}/${eventId}) — used:${used} remaining:${remaining}`);
  if (!r.ok) throw new Error(`Props fetch failed: ${r.status} for ${eventId}`);
  const data = await r.json();
  set(ck, data);
  return { data, fromCache: false, quota: { remaining, used } };
}

// ── Pre-warm everything for cron ─────────────────────────────────────────
export async function warmOddsCache(apiKey) {
  const results = {};

  // Game lines
  for (const mkt of ['h2h', 'spreads', 'totals']) {
    try {
      const r = await fetchGameOdds(apiKey, mkt);
      results[mkt] = r.fromCache ? 'already_cached' : 'fetched';
    } catch(e) { results[mkt] = `error: ${e.message}`; }
  }

  // Event list
  try {
    const events = await fetchEvents(apiKey);
    results.events = `${events.length} games`;

    // Pre-warm props for up to 6 games
    const targets = events.slice(0, 6);
    for (const evt of targets) {
      for (const pt of ['std', 'alt', 'hrr']) {
        try {
          const r = await fetchEventProps(apiKey, evt.id, pt);
          results[`${pt}_${evt.away_team}@${evt.home_team}`] = r.fromCache ? 'cached' : 'fetched';
        } catch(e) {
          results[`${pt}_${evt.id}`] = `skip: ${e.message.slice(0,40)}`;
        }
      }
    }
  } catch(e) { results.events = `error: ${e.message}`; }

  return results;
}

// ── Normalize props response ─────────────────────────────────────────────
export function normalizeProps(event, pd) {
  const playerMap = {};

  (pd.bookmakers || []).forEach(bk => {
    (bk.markets || []).forEach(mkt => {
      const label = PROP_LABELS[mkt.key];
      if (!label) return;

      (mkt.outcomes || []).forEach(o => {
        let pname, dir, point;
        if (o.description) {
          pname = o.description; dir = o.name; point = o.point;
        } else {
          const m = (o.name || '').match(/^(.+?)\s+(Over|Under)\s+([\d.]+)$/i);
          if (!m) return;
          [, pname, dir, point] = m; point = parseFloat(point);
        }
        const k = `${pname}|${mkt.key}|${point}`;
        if (!playerMap[k]) playerMap[k] = { playerName:pname, market:mkt.key, label, point:point??null, books:{} };
        if (!playerMap[k].books[bk.key]) playerMap[k].books[bk.key] = { title:bk.title };
        if (/over/i.test(dir))  playerMap[k].books[bk.key].overPrice  = o.price;
        else                    playerMap[k].books[bk.key].underPrice = o.price;
      });
    });
  });

  const players = Object.values(playerMap).map(p => {
    const bl = Object.values(p.books);
    const bestOver  = bl.reduce((b,x)=>x.overPrice !=null&&(b==null||x.overPrice >b.price)?{price:x.overPrice, book:x.title}:b, null);
    const bestUnder = bl.reduce((b,x)=>x.underPrice!=null&&(b==null||x.underPrice>b.price)?{price:x.underPrice,book:x.title}:b, null);
    return { ...p, bestOver, bestUnder, allBooks: Object.values(p.books) };
  }).sort((a,b) =>
    MARKET_ORDER.indexOf(a.market) - MARKET_ORDER.indexOf(b.market) ||
    (a.point??99) - (b.point??99) ||
    a.playerName.localeCompare(b.playerName)
  );

  return {
    eventId:   event.id,
    home_team: event.home_team || pd.home_team,
    away_team: event.away_team || pd.away_team,
    commence:  event.commence_time || pd.commence_time,
    players,
  };
}

// ── Normalize game odds ──────────────────────────────────────────────────
export function normalizeGameOdds(raw, type) {
  return (raw || []).map(game => {
    const books = {};
    (game.bookmakers||[]).forEach(bk=>{
      (bk.markets||[]).forEach(mkt=>{
        if (mkt.key !== type) return;
        books[bk.key] = {
          title: bk.title,
          outcomes: (mkt.outcomes||[]).map(o=>({ name:o.name, price:o.price, point:o.point??null })),
        };
      });
    });
    const best = {};
    Object.values(books).forEach(bk=>
      (bk.outcomes||[]).forEach(o=>{
        if (!best[o.name]||o.price>best[o.name].price) best[o.name]={...o,book:bk.title};
      })
    );
    return { id:game.id, home_team:game.home_team, away_team:game.away_team, commence:game.commence_time, books, best };
  });
}

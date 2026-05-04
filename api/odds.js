// api/odds.js
// HR PROPS ONLY — batter_home_runs (Over 0.5 / 1+ HR)
// Cron warms cache 5x/day. Cold-start auto-warms synchronously so
// every instance serves fresh data regardless of which instance the cron hit.

const CACHE = {};
const TTL   = 4 * 60 * 60 * 1000; // 4 hours

const set = (k,v) => { CACHE[k]={data:v,ts:Date.now()}; };
const get = k => { const e=CACHE[k]; return (e&&Date.now()-e.ts<TTL)?e.data:null; };

const BASE = 'https://api.the-odds-api.com/v4/sports/baseball_mlb';

function normalizeHRProps(event, pd) {
  const pm = {};
  (pd.bookmakers||[]).forEach(bk => {
    (bk.markets||[]).forEach(mkt => {
      if (mkt.key !== 'batter_home_runs') return;
      (mkt.outcomes||[]).forEach(o => {
        let pname, dir, point;
        if (o.description) {
          pname = o.description; dir = o.name; point = o.point;
        } else {
          const m = (o.name||'').match(/^(.+?)\s+(Over|Under)\s+([\d.]+)$/i);
          if (!m) return;
          [, pname, dir, point] = m; point = parseFloat(point);
        }
        const k = `${pname}|${point}`;
        if (!pm[k]) pm[k] = { playerName:pname, market:'batter_home_runs', label:'HR', point:point??0.5, books:{} };
        if (!pm[k].books[bk.key]) pm[k].books[bk.key] = { title:bk.title };
        if (/over/i.test(dir))  pm[k].books[bk.key].overPrice  = o.price;
        else                    pm[k].books[bk.key].underPrice = o.price;
      });
    });
  });

  const players = Object.values(pm).map(p => {
    const bl = Object.values(p.books);
    const bestOver  = bl.reduce((b,x) => x.overPrice  != null && (b==null||x.overPrice  > b.price) ? {price:x.overPrice,  book:x.title} : b, null);
    const bestUnder = bl.reduce((b,x) => x.underPrice != null && (b==null||x.underPrice > b.price) ? {price:x.underPrice, book:x.title} : b, null);
    const overPrices = bl.map(x=>x.overPrice).filter(v=>v!=null);
    const avgImplied = overPrices.length
      ? overPrices.reduce((s,o) => s + (o<0 ? (-o)/(-o+100) : 100/(o+100)), 0) / overPrices.length
      : null;
    return {
      ...p,
      bestOver,
      bestUnder,
      bookCount:  overPrices.length,
      avgImplied: avgImplied ? Math.round(avgImplied * 1000) / 10 : null,
      allBooks:   bl,
    };
  }).sort((a,b) => (a.point??99)-(b.point??99) || a.playerName.localeCompare(b.playerName));

  return {
    eventId:   event.id,
    home_team: event.home_team || pd.home_team,
    away_team: event.away_team || pd.away_team,
    commence:  event.commence_time || pd.commence_time,
    players,
  };
}

async function fetchEvents(apiKey) {
  const r = await fetch(`${BASE}/events?apiKey=${apiKey}&dateFormat=iso`);
  if (!r.ok) throw new Error(`Events ${r.status}`);
  const data = await r.json();
  console.log(`[Odds] ${data.length} events | remaining: ${r.headers.get('x-requests-remaining')}`);
  return data;
}

async function fetchEventHRProps(apiKey, eventId) {
  const r = await fetch(
    `${BASE}/events/${eventId}/odds?apiKey=${apiKey}&regions=us&markets=batter_home_runs&oddsFormat=american&dateFormat=iso`
  );
  console.log(`[Odds] props ${eventId} | remaining: ${r.headers.get('x-requests-remaining')}`);
  if (!r.ok) return null;
  return r.json();
}

async function warmCache(apiKey) {
  const results = {};
  let events = [];
  try {
    events = await fetchEvents(apiKey);
    set('events', events);
    results.events = `${events.length} games`;
  } catch(e) {
    results.events = `error: ${e.message}`;
    return results;
  }

  // Fetch all game props in parallel — faster than sequential, avoids timeout
  await Promise.allSettled(
    events.map(async evt => {
      try {
        const pd = await fetchEventHRProps(apiKey, evt.id);
        if (pd) {
          set(`hr_${evt.id}`, pd);
          results[`${evt.away_team}@${evt.home_team}`] = 'ok';
        }
      } catch(e) {
        results[evt.id] = `skip: ${e.message.slice(0,30)}`;
      }
    })
  );
  return results;
}

function notCached(res, events) {
  return res.status(200).json({
    status:  'not_cached',
    message: 'HR odds warming — refresh in a moment',
    props:   [],
    events:  (events||[]).map(e => ({id:e.id, home_team:e.home_team, away_team:e.away_team, commence:e.commence_time})),
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type = 'props', eventId } = req.query;
  const apiKey = process.env.ODDS_API_KEY;

  // ── CRON / MANUAL REFRESH ─────────────────────────────────────────────────
  if (type === 'refresh') {
    const secret     = process.env.CRON_SECRET;
    const auth       = req.headers.authorization || `Bearer ${req.query.auth || ''}`;
    const fromVercel = req.headers['x-vercel-cron'] === '1';
    if (secret && auth !== `Bearer ${secret}` && !fromVercel) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!apiKey) return res.status(200).json({ error: 'ODDS_API_KEY not configured' });
    try {
      const results = await warmCache(apiKey);
      return res.status(200).json({ ok:true, results, ts:new Date().toISOString() });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── PROPS — warm synchronously if this instance is cold ──────────────────
  if (type === 'props') {
    if (!apiKey) return notCached(res);

    // KEY FIX: old code did fire-and-forget on cold start, returned empty,
    // and left the user with no odds because the cron warmed a DIFFERENT
    // serverless instance. Now we warm synchronously so this instance always
    // has data before responding.
    if (!get('events')) {
      console.log('[Odds] Cold instance — warming synchronously...');
      try {
        await warmCache(apiKey);
      } catch(e) {
        console.error('[Odds] Warm failed:', e.message);
        return notCached(res);
      }
    }

    const events = get('events');
    if (!events) return notCached(res);

    const targets = eventId ? events.filter(e => e.id === eventId) : events;

    // Fill any per-game gaps (partial warm / newly added games)
    await Promise.allSettled(
      targets
        .filter(evt => !get(`hr_${evt.id}`))
        .map(async evt => {
          try {
            const pd = await fetchEventHRProps(apiKey, evt.id);
            if (pd) set(`hr_${evt.id}`, pd);
          } catch(e) {}
        })
    );

    const results = targets
      .map(evt => { const c = get(`hr_${evt.id}`); return c ? normalizeHRProps(evt, c) : null; })
      .filter(Boolean);

    if (!results.length) return notCached(res, events);
    return res.status(200).json({
      status: 'ok',
      props:  results,
      events: events.map(e => ({id:e.id, home_team:e.home_team, away_team:e.away_team, commence:e.commence_time})),
    });
  }

  return res.status(400).json({ error: `Unknown type: ${type}` });
}

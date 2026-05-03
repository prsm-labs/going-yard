// api/odds.js
// HR PROPS ONLY — batter_home_runs (Over 0.5 / 1+ HR)
// Cron warms cache 5x/day. Props fetched per-event on demand if cache cold.

const CACHE = {};
const TTL   = 4 * 60 * 60 * 1000; // 4 hours — covers 3hr cron interval with buffer
let   COLD_START_DONE = false;

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
    const bestUnder = bl.reduce((b,x) => x.underPrice != null && (b==null||x.underPrice > b.price) ? {price:x.underUnder, book:x.title} : b, null);
    const overPrices = bl.map(x=>x.overPrice).filter(v=>v!=null);
    const avgImplied = overPrices.length
      ? overPrices.reduce((s,o) => s + (o<0 ? (-o)/(-o+100) : 100/(o+100)), 0) / overPrices.length
      : null;
    return {
      ...p,
      bestOver,
      bestUnder,
      bookCount: overPrices.length,
      avgImplied: avgImplied ? Math.round(avgImplied * 1000) / 10 : null,
      allBooks: bl,
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
  if (!r.ok) throw new Error(`Events failed: ${r.status}`);
  const data = await r.json();
  console.log(`[Odds] ${data.length} events | quota remaining: ${r.headers.get('x-requests-remaining')}`);
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
  } catch(e) { results.events = `error: ${e.message}`; return results; }

  // Fetch HR props for every game — this is the only market we care about
  for (const evt of events) {
    try {
      const pd = await fetchEventHRProps(apiKey, evt.id);
      if (pd) {
        set(`hr_${evt.id}`, pd);
        results[`${evt.away_team}@${evt.home_team}`] = 'ok';
      }
    } catch(e) {
      results[`${evt.id}`] = `skip: ${e.message.slice(0,30)}`;
    }
  }
  return results;
}

function notCached(res, events) {
  return res.status(200).json({
    status:  'not_cached',
    message: 'HR odds refresh at 7am, 10am, 1pm, 4pm, 7pm ET',
    props:   [],
    events:  (events||[]).map(e => ({id:e.id, home_team:e.home_team, away_team:e.away_team, commence:e.commence_time})),
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type = 'props', eventId } = req.query;
  const apiKey = process.env.ODDS_API_KEY;

  // ── CRON REFRESH (Vercel native cron — no auth header sent by Vercel) ───
  if (type === 'refresh') {
    const secret = process.env.CRON_SECRET;
    const auth   = req.headers.authorization || '';
    // Allow if: no secret set, OR auth matches, OR request is from Vercel cron
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

  // ── PROPS — serve from cache, auto-fetch per event if missing ────────────
  if (type === 'props') {
    // Cold start: warm events list once per instance if totally empty
    if (apiKey && !COLD_START_DONE && !get('events')) {
      COLD_START_DONE = true;
      fetchEvents(apiKey).then(evts => set('events', evts)).catch(()=>{});
      return notCached(res);
    }

    const events = get('events');
    if (!events) return notCached(res);

    const targets = eventId ? events.filter(e => e.id === eventId) : events;
    const results = [];

    for (const evt of targets) {
      // Auto-fetch this game's props if not cached
      if (apiKey && !get(`hr_${evt.id}`)) {
        try {
          const pd = await fetchEventHRProps(apiKey, evt.id);
          if (pd) set(`hr_${evt.id}`, pd);
        } catch(e) {}
      }
      const cached = get(`hr_${evt.id}`);
      if (cached) results.push(normalizeHRProps(evt, cached));
    }

    if (!results.length) return notCached(res, events);
    return res.status(200).json({
      status: 'ok',
      props:  results,
      events: events.map(e => ({id:e.id, home_team:e.home_team, away_team:e.away_team, commence:e.commence_time})),
    });
  }

  return res.status(400).json({ error: `Unknown type: ${type}` });
}

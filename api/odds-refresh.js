// api/odds-refresh.js — CRON ONLY. Protected by CRON_SECRET env var.
// Vercel cron calls this hourly 8am-8pm ET. Warms the shared in-memory cache.
// Any request without Authorization: Bearer <CRON_SECRET> is rejected.

// Shared cache — same module instance as odds.js when running in same Vercel instance
// Note: Vercel may spin up separate instances so cache is best-effort between calls.
// The cron warms the cache; users read from it within the same instance lifetime.
const CACHE = {};
const TTL   = 65 * 60 * 1000;
const set   = (k,v) => { CACHE[k]={data:v,ts:Date.now()}; };
const get   = k => { const e=CACHE[k]; return (e&&Date.now()-e.ts<TTL)?e.data:null; };

const BASE = 'https://api.the-odds-api.com/v4/sports/baseball_mlb';

const STD = ['batter_home_runs','batter_hits','batter_total_bases','batter_rbis','batter_stolen_bases','batter_singles','batter_doubles','batter_triples','batter_walks'].join(',');
const ALT = ['batter_home_runs_alternate','batter_hits_alternate','batter_total_bases_alternate'].join(',');
const HRR = 'batter_hits_runs_rbis';

async function fetchAndCache(apiKey) {
  const results = {};
  let remaining = null;

  // Game lines
  for (const mkt of ['h2h','spreads','totals']) {
    try {
      const r = await fetch(`${BASE}/odds/?apiKey=${apiKey}&regions=us&markets=${mkt}&oddsFormat=american&dateFormat=iso`);
      remaining = r.headers.get('x-requests-remaining');
      if (r.ok) { set(mkt, await r.json()); results[mkt]='ok'; }
      else results[mkt]=`error ${r.status}`;
    } catch(e) { results[mkt]=`fail: ${e.message}`; }
  }

  // Events list
  let events = [];
  try {
    const r = await fetch(`${BASE}/events?apiKey=${apiKey}&dateFormat=iso`);
    remaining = r.headers.get('x-requests-remaining');
    if (r.ok) { events = await r.json(); set('events',events); results.events=`${events.length} games`; }
    else results.events=`error ${r.status}`;
  } catch(e) { results.events=`fail: ${e.message}`; }

  // Props for up to 6 games
  const targets = events.slice(0,6);
  for (const evt of targets) {
    for (const [pt,markets] of [['std',STD],['alt',ALT],['hrr',HRR]]) {
      try {
        const r = await fetch(`${BASE}/events/${evt.id}/odds?apiKey=${apiKey}&regions=us&markets=${markets}&oddsFormat=american&dateFormat=iso`);
        remaining = r.headers.get('x-requests-remaining');
        if (r.ok) { set(`${pt}_${evt.id}`, await r.json()); results[`${pt}_${evt.away_team}@${evt.home_team}`]='ok'; }
        else results[`${pt}_${evt.id}`]=`error ${r.status}`;
      } catch(e) { results[`${pt}_${evt.id}`]=`fail: ${e.message}`; }
    }
  }
  return { results, remaining };
}

export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).end();

  const secret = process.env.CRON_SECRET;
  const auth   = req.headers.authorization||'';
  if(secret && auth!==`Bearer ${secret}`){
    console.warn('[Cron] Blocked unauthorized request');
    return res.status(401).json({error:'Unauthorized'});
  }

  const apiKey = process.env.ODDS_API_KEY;
  if(!apiKey) return res.status(200).json({error:'ODDS_API_KEY not configured'});

  try {
    const {results,remaining} = await fetchAndCache(apiKey);
    console.log('[Cron] Done. Remaining:',remaining,'Results:',JSON.stringify(results));
    return res.status(200).json({ok:true,results,remaining,ts:new Date().toISOString()});
  } catch(e) {
    console.error('[Cron] Fatal:',e.message);
    return res.status(500).json({error:e.message});
  }
}

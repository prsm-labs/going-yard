// api/odds.js
// Dual-mode: READ cache for visitors, WRITE cache for cron refresh
// Cron refresh protected by CRON_SECRET env var
// Visitors: zero API calls ever — read-only from cache
// Cron: GET /api/odds?type=refresh  (Vercel sends Authorization: Bearer <CRON_SECRET>)

const CACHE = {};
const TTL   = 65 * 60 * 1000;
const set   = (k,v) => { CACHE[k]={data:v,ts:Date.now()}; };
const get   = k => { const e=CACHE[k]; return (e&&Date.now()-e.ts<TTL)?e.data:null; };

const BASE = 'https://api.the-odds-api.com/v4/sports/baseball_mlb';
const STD  = ['batter_home_runs','batter_hits','batter_total_bases','batter_rbis','batter_stolen_bases','batter_singles','batter_doubles','batter_triples','batter_walks'].join(',');
const ALT  = ['batter_home_runs_alternate','batter_hits_alternate','batter_total_bases_alternate'].join(',');
const HRR  = 'batter_hits_runs_rbis';

const PROP_LABELS = {
  batter_home_runs:'HR', batter_home_runs_alternate:'HR (Alt)',
  batter_hits:'Hits', batter_hits_alternate:'Hits (Alt)',
  batter_total_bases:'Total Bases', batter_total_bases_alternate:'Total Bases (Alt)',
  batter_rbis:'RBIs', batter_stolen_bases:'SB',
  batter_singles:'Singles', batter_doubles:'Doubles',
  batter_triples:'Triples', batter_walks:'Walks',
  batter_hits_runs_rbis:'H+R+RBI',
};
const MORDER = Object.keys(PROP_LABELS);

function normalizeProps(event, pd) {
  const pm = {};
  (pd.bookmakers||[]).forEach(bk=>{
    (bk.markets||[]).forEach(mkt=>{
      const label=PROP_LABELS[mkt.key]; if(!label) return;
      (mkt.outcomes||[]).forEach(o=>{
        let pname,dir,point;
        if(o.description){pname=o.description;dir=o.name;point=o.point;}
        else{const m=(o.name||'').match(/^(.+?)\s+(Over|Under)\s+([\d.]+)$/i);if(!m)return;[,pname,dir,point]=m;point=parseFloat(point);}
        const k=`${pname}|${mkt.key}|${point}`;
        if(!pm[k]) pm[k]={playerName:pname,market:mkt.key,label,point:point??null,books:{}};
        if(!pm[k].books[bk.key]) pm[k].books[bk.key]={title:bk.title};
        if(/over/i.test(dir)) pm[k].books[bk.key].overPrice=o.price;
        else pm[k].books[bk.key].underPrice=o.price;
      });
    });
  });
  const players=Object.values(pm).map(p=>{
    const bl=Object.values(p.books);
    const bestOver =bl.reduce((b,x)=>x.overPrice !=null&&(b==null||x.overPrice >b.price)?{price:x.overPrice, book:x.title}:b,null);
    const bestUnder=bl.reduce((b,x)=>x.underPrice!=null&&(b==null||x.underPrice>b.price)?{price:x.underPrice,book:x.title}:b,null);
    return {...p,bestOver,bestUnder,allBooks:Object.values(p.books)};
  }).sort((a,b)=>MORDER.indexOf(a.market)-MORDER.indexOf(b.market)||(a.point??99)-(b.point??99)||a.playerName.localeCompare(b.playerName));
  return {eventId:event.id,home_team:event.home_team||pd.home_team,away_team:event.away_team||pd.away_team,commence:event.commence_time||pd.commence_time,players};
}

function normalizeGame(raw,type){
  return (raw||[]).map(g=>{
    const books={};
    (g.bookmakers||[]).forEach(bk=>{(bk.markets||[]).forEach(mkt=>{if(mkt.key!==type)return;books[bk.key]={title:bk.title,outcomes:(mkt.outcomes||[]).map(o=>({name:o.name,price:o.price,point:o.point??null}))};});});
    const best={};
    Object.values(books).forEach(bk=>(bk.outcomes||[]).forEach(o=>{if(!best[o.name]||o.price>best[o.name].price)best[o.name]={...o,book:bk.title};}));
    return {id:g.id,home_team:g.home_team,away_team:g.away_team,commence:g.commence_time,books,best};
  });
}

function notCached(res,events){
  return res.status(200).json({status:'not_cached',message:'Odds refresh automatically every hour between 8am–8pm ET',markets:[],props:[],events:(events||[]).map(e=>({id:e.id,home_team:e.home_team,away_team:e.away_team,commence:e.commence_time}))});
}

async function warmCache(apiKey){
  const results={};
  // Game lines
  for(const mkt of ['h2h','spreads','totals']){
    try{const r=await fetch(`${BASE}/odds/?apiKey=${apiKey}&regions=us&markets=${mkt}&oddsFormat=american&dateFormat=iso`);if(r.ok){set(mkt,await r.json());results[mkt]='ok';}else results[mkt]=`${r.status}`;}catch(e){results[mkt]=`fail`;}
  }
  // Events
  let events=[];
  try{const r=await fetch(`${BASE}/events?apiKey=${apiKey}&dateFormat=iso`);if(r.ok){events=await r.json();set('events',events);results.events=`${events.length} games`;}else results.events=`${r.status}`;}catch(e){results.events='fail';}
  // Props for up to 6 games
  for(const evt of events.slice(0,6)){
    for(const [pt,mkts] of [['std',STD],['alt',ALT],['hrr',HRR]]){
      try{const r=await fetch(`${BASE}/events/${evt.id}/odds?apiKey=${apiKey}&regions=us&markets=${mkts}&oddsFormat=american&dateFormat=iso`);if(r.ok){set(`${pt}_${evt.id}`,await r.json());results[`${pt}_${evt.away_team}@${evt.home_team}`]='ok';}else results[`${pt}_${evt.id}`]=`${r.status}`;}catch(e){results[`${pt}_${evt.id}`]='fail';}
    }
  }
  return results;
}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();

  const {type='h2h',eventId}=req.query;

  // ── CRON REFRESH (protected) ──────────────────────────────────────────────
  if(type==='refresh'){
    const secret=process.env.CRON_SECRET;
    const auth=req.headers.authorization||'';
    if(secret && auth!==`Bearer ${secret}`){
      console.warn('[Odds] Blocked unauthorized refresh');
      return res.status(401).json({error:'Unauthorized'});
    }
    const apiKey=process.env.ODDS_API_KEY;
    if(!apiKey) return res.status(200).json({error:'ODDS_API_KEY not configured'});
    try{
      const results=await warmCache(apiKey);
      return res.status(200).json({ok:true,results,ts:new Date().toISOString()});
    }catch(e){return res.status(500).json({error:e.message});}
  }

  // ── BATTER PROPS (read cache only) ────────────────────────────────────────
  if(['props','props_alt','hrr'].includes(type)){
    const pt=type==='props'?'std':type==='props_alt'?'alt':'hrr';
    const events=get('events');
    if(!events) return notCached(res);
    const targets=eventId?events.filter(e=>e.id===eventId):events;
    const results=[];
    for(const evt of targets){const c=get(`${pt}_${evt.id}`);if(c) results.push(normalizeProps(evt,c));}
    if(!results.length) return notCached(res,events);
    return res.status(200).json({status:'ok',fromCache:true,props:results,events:events.map(e=>({id:e.id,home_team:e.home_team,away_team:e.away_team,commence:e.commence_time}))});
  }

  // ── GAME ODDS (read cache only) ───────────────────────────────────────────
  const cached=get(type);
  if(!cached) return notCached(res);
  return res.status(200).json({status:'ok',fromCache:true,markets:normalizeGame(cached,type),type});
}

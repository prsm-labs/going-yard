// api/odds.js — READ-ONLY, serves cache only, zero live API calls from visitors

const CACHE = {};
const TTL   = 65 * 60 * 1000;
const get   = k => { const e=CACHE[k]; return (e&&Date.now()-e.ts<TTL)?e.data:null; };

const PROP_LABELS = {
  batter_home_runs:'HR', batter_home_runs_alternate:'HR (Alt)',
  batter_hits:'Hits', batter_hits_alternate:'Hits (Alt)',
  batter_total_bases:'Total Bases', batter_total_bases_alternate:'Total Bases (Alt)',
  batter_rbis:'RBIs', batter_stolen_bases:'SB',
  batter_singles:'Singles', batter_doubles:'Doubles',
  batter_triples:'Triples', batter_walks:'Walks',
  batter_hits_runs_rbis:'H+R+RBI',
};
const MARKET_ORDER = Object.keys(PROP_LABELS);

function normalizeProps(event, pd) {
  const playerMap = {};
  (pd.bookmakers||[]).forEach(bk=>{
    (bk.markets||[]).forEach(mkt=>{
      const label=PROP_LABELS[mkt.key]; if(!label) return;
      (mkt.outcomes||[]).forEach(o=>{
        let pname,dir,point;
        if(o.description){pname=o.description;dir=o.name;point=o.point;}
        else{const m=(o.name||'').match(/^(.+?)\s+(Over|Under)\s+([\d.]+)$/i);if(!m)return;[,pname,dir,point]=m;point=parseFloat(point);}
        const k=`${pname}|${mkt.key}|${point}`;
        if(!playerMap[k]) playerMap[k]={playerName:pname,market:mkt.key,label,point:point??null,books:{}};
        if(!playerMap[k].books[bk.key]) playerMap[k].books[bk.key]={title:bk.title};
        if(/over/i.test(dir)) playerMap[k].books[bk.key].overPrice=o.price;
        else playerMap[k].books[bk.key].underPrice=o.price;
      });
    });
  });
  const players=Object.values(playerMap).map(p=>{
    const bl=Object.values(p.books);
    const bestOver =bl.reduce((b,x)=>x.overPrice !=null&&(b==null||x.overPrice >b.price)?{price:x.overPrice, book:x.title}:b,null);
    const bestUnder=bl.reduce((b,x)=>x.underPrice!=null&&(b==null||x.underPrice>b.price)?{price:x.underPrice,book:x.title}:b,null);
    return {...p,bestOver,bestUnder,allBooks:Object.values(p.books)};
  }).sort((a,b)=>MARKET_ORDER.indexOf(a.market)-MARKET_ORDER.indexOf(b.market)||(a.point??99)-(b.point??99)||a.playerName.localeCompare(b.playerName));
  return {eventId:event.id,home_team:event.home_team||pd.home_team,away_team:event.away_team||pd.away_team,commence:event.commence_time||pd.commence_time,players};
}

function normalizeGameOdds(raw,type){
  return (raw||[]).map(game=>{
    const books={};
    (game.bookmakers||[]).forEach(bk=>{(bk.markets||[]).forEach(mkt=>{if(mkt.key!==type)return;books[bk.key]={title:bk.title,outcomes:(mkt.outcomes||[]).map(o=>({name:o.name,price:o.price,point:o.point??null}))};});});
    const best={};
    Object.values(books).forEach(bk=>(bk.outcomes||[]).forEach(o=>{if(!best[o.name]||o.price>best[o.name].price)best[o.name]={...o,book:bk.title};}));
    return {id:game.id,home_team:game.home_team,away_team:game.away_team,commence:game.commence_time,books,best};
  });
}

function notCached(res,events){
  return res.status(200).json({status:'not_cached',message:'Odds refresh automatically every hour between 8am–8pm ET',markets:[],props:[],events:(events||[]).map(e=>({id:e.id,home_team:e.home_team,away_team:e.away_team,commence:e.commence_time}))});
}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();

  const {type='h2h',eventId}=req.query;

  if(['props','props_alt','hrr'].includes(type)){
    const propType=type==='props'?'std':type==='props_alt'?'alt':'hrr';
    const events=get('events');
    if(!events) return notCached(res);
    const targets=eventId?events.filter(e=>e.id===eventId):events;
    const propResults=[];
    for(const event of targets){
      const cached=get(`${propType}_${event.id}`);
      if(cached) propResults.push(normalizeProps(event,cached));
    }
    if(!propResults.length) return notCached(res,events);
    return res.status(200).json({status:'ok',fromCache:true,props:propResults,events:events.map(e=>({id:e.id,home_team:e.home_team,away_team:e.away_team,commence:e.commence_time}))});
  }

  const cached=get(type);
  if(!cached) return notCached(res);
  return res.status(200).json({status:'ok',fromCache:true,markets:normalizeGameOdds(cached,type),type});
}

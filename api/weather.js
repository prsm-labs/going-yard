// api/weather.js
// Returns full 24-hour forecast so the FRONTEND can pick the game-time hour.
// Avoids UTC/local timezone mismatch on Vercel servers entirely.
// cfDir = compass bearing from home plate toward center field

const WEATHER_API_KEY = "1a64b4c500b44b62884115954253006";

const STADIUMS = {
  NYY:{lat:40.8296,lon:-73.9262,name:"Yankee Stadium",          cfDir:185,dome:false},
  NYM:{lat:40.7571,lon:-73.8458,name:"Citi Field",              cfDir:155,dome:false},
  BOS:{lat:42.3467,lon:-71.0972,name:"Fenway Park",             cfDir:65, dome:false},
  LAD:{lat:34.0739,lon:-118.240,name:"Dodger Stadium",          cfDir:350,dome:false},
  LAA:{lat:33.8003,lon:-117.883,name:"Angel Stadium",           cfDir:335,dome:false},
  HOU:{lat:29.7573,lon:-95.3555,name:"Minute Maid Park",        cfDir:30, dome:true },
  SF: {lat:37.7786,lon:-122.389,name:"Oracle Park",             cfDir:315,dome:false},
  SEA:{lat:47.5914,lon:-122.333,name:"T-Mobile Park",           cfDir:335,dome:true },
  TEX:{lat:32.7512,lon:-97.0832,name:"Globe Life Field",        cfDir:40, dome:true },
  MIN:{lat:44.9817,lon:-93.2781,name:"Target Field",            cfDir:30,dome:false},
  KC: {lat:39.0517,lon:-94.4803,name:"Kauffman Stadium",        cfDir:10, dome:false},
  CHW:{lat:41.8299,lon:-87.6338,name:"Guaranteed Rate Field",   cfDir:5,  dome:false},
  CHC:{lat:41.9484,lon:-87.6553,name:"Wrigley Field",           cfDir:80, dome:false},
  CLE:{lat:41.4962,lon:-81.6852,name:"Progressive Field",       cfDir:5,dome:false},
  DET:{lat:42.3390,lon:-83.0485,name:"Comerica Park",           cfDir:5,dome:false},
  TOR:{lat:43.6414,lon:-79.3894,name:"Rogers Centre",           cfDir:15, dome:true },
  TB: {lat:27.7683,lon:-82.6534,name:"Tropicana Field",         cfDir:0,  dome:true },
  BAL:{lat:39.2838,lon:-76.6218,name:"Camden Yards",            cfDir:355, dome:false},
  PHI:{lat:39.9061,lon:-75.1665,name:"Citizens Bank Park",      cfDir:355, dome:false},
  ATL:{lat:33.7350,lon:-84.3900,name:"Truist Park",             cfDir:65, dome:false},
  MIA:{lat:25.7781,lon:-80.2197,name:"LoanDepot Park",          cfDir:20, dome:true },
  WSH:{lat:38.8730,lon:-77.0074,name:"Nationals Park",          cfDir:355, dome:false},
  PIT:{lat:40.4469,lon:-80.0057,name:"PNC Park",                cfDir:340,dome:false},
  CIN:{lat:39.0975,lon:-84.5081,name:"Great American Ball Park",cfDir:350, dome:false},
  STL:{lat:38.6226,lon:-90.1928,name:"Busch Stadium",           cfDir:5,dome:false},
  MIL:{lat:43.0280,lon:-87.9712,name:"American Family Field",   cfDir:15, dome:true },
  COL:{lat:39.7559,lon:-104.994,name:"Coors Field",             cfDir:315,dome:false},
  ARI:{lat:33.4453,lon:-112.067,name:"Chase Field",             cfDir:340,dome:true },
  SD: {lat:32.7076,lon:-117.157,name:"Petco Park",              cfDir:320,dome:false},
  OAK:{lat:37.7516,lon:-122.201,name:"Oakland Coliseum",        cfDir:235,dome:false},
  ATH:{lat:37.7516,lon:-122.201,name:"Oakland Coliseum",        cfDir:235,dome:false},
};

const PARK_FACTORS = {
  COL:{hr:136},CIN:{hr:119},PHI:{hr:114},MIL:{hr:113},TEX:{hr:112},
  NYY:{hr:111},CHC:{hr:110},BAL:{hr:108},ATL:{hr:107},BOS:{hr:106},
  DET:{hr:104},STL:{hr:103},CLE:{hr:102},MIN:{hr:101},WSH:{hr:100},
  HOU:{hr:99},LAA:{hr:98},KC:{hr:97},CHW:{hr:96},MIA:{hr:95},
  LAD:{hr:94},SF:{hr:93},PIT:{hr:92},SEA:{hr:91},NYM:{hr:90},
  TOR:{hr:89},ARI:{hr:88},SD:{hr:88},OAK:{hr:91},ATH:{hr:91},TB:{hr:86},
};

// Parse hour from WeatherAPI local time string "2026-04-08 19:00" → 19
// NEVER use new Date() — Vercel is UTC, WeatherAPI returns local time
function parseHour(t) {
  try { return parseInt(t.split(' ')[1].split(':')[0], 10); }
  catch { return -1; }
}

// Field-relative wind direction
// windDeg: meteorological FROM direction (e.g. 157 = FROM SSE, blowing toward NNW)
// cfDir: bearing from home plate toward center field
function fieldWind(windDeg, windSpeed, cfDir) {
  if (windSpeed < 3) return { label:'Calm', dir:'calm' };
  const toward = (windDeg + 180) % 360;
  let diff = ((toward - cfDir) % 360 + 360) % 360;
  if (diff > 180) diff = 360 - diff;
  if (diff <= 45)  return windSpeed >= 15 ? {label:`Blowing Out ${windSpeed}mph`,dir:'out-strong'} : {label:`Out ${windSpeed}mph`,dir:'out'};
  if (diff >= 135) return windSpeed >= 12 ? {label:`Blowing In ${windSpeed}mph`, dir:'in-strong'}  : {label:`In ${windSpeed}mph`, dir:'in'};
  return {label:`Crosswind ${windSpeed}mph`, dir:'cross'};
}

function hrEnv(temp, windDir, pfHr) {
  const t  = temp>=80?1.08:temp>=70?1.04:temp>=60?1.0:temp>=50?0.95:0.88;
  const w  = windDir==='out-strong'?1.15:windDir==='out'?1.06:windDir==='in-strong'?0.86:windDir==='in'?0.93:1.0;
  const pf = ((pfHr||100)-85)/30;
  return Math.round(Math.min(100,Math.max(0, 50+(t-1)*80+(w-1)*60+pf*25)));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store'); // never cache — always fresh

  try {
    const { team } = req.query;
    const stadium  = STADIUMS[team];
    if (!stadium) return res.status(404).json({error:`Unknown team: ${team}`});

    const pf = PARK_FACTORS[team] || {hr:100};

    if (stadium.dome) {
      return res.status(200).json({
        team, stadium:stadium.name, cfDir:stadium.cfDir,
        parkFactorHR:pf.hr, isDome:true, current:null, hourly:[],
      });
    }

    // Fetch 2 days of hourly data
    const q   = `${stadium.lat},${stadium.lon}`;
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${q}&days=2&aqi=no&alerts=no`;
    const r   = await fetch(url, {headers:{Accept:'application/json'}});
    if (!r.ok) throw new Error(`WeatherAPI ${r.status}`);
    const d   = await r.json();

    const cur = d.current || {};

    // Map ALL hours — let frontend pick by game time
    const allHours = (d.forecast?.forecastday||[]).flatMap(day => day.hour||[]);
    const hourly = allHours.map(h => {
      const spd = Math.round(h.wind_mph||0);
      const deg = Math.round(h.wind_degree||0);
      const fw  = fieldWind(deg, spd, stadium.cfDir);
      return {
        hour:       parseHour(h.time),    // local hour 0-23
        timeLabel:  h.time,               // full string for debugging
        temp:       Math.round(h.temp_f||72),
        feelsLike:  Math.round(h.feelslike_f||72),
        humidity:   Math.round(h.humidity||50),
        windSpeed:  spd,
        windDeg:    deg,
        windDirRaw: h.wind_dir||'',
        windLabel:  fw.label,
        windDir:    fw.dir,
        condition:  h.condition?.text||'',
        condIcon:   h.condition?.icon||'',
        rainChance: parseInt(h.chance_of_rain||0),
        hrEnvScore: hrEnv(Math.round(h.temp_f||72), fw.dir, pf.hr),
      };
    });

    // Current conditions (for pre-game/live reference)
    const cspd = Math.round(cur.wind_mph||0);
    const cdeg = Math.round(cur.wind_degree||0);
    const cfw  = fieldWind(cdeg, cspd, stadium.cfDir);
    const current = {
      temp:       Math.round(cur.temp_f||72),
      feelsLike:  Math.round(cur.feelslike_f||72),
      humidity:   Math.round(cur.humidity||50),
      windSpeed:  cspd,
      windDeg:    cdeg,
      windDirRaw: cur.wind_dir||'',
      windLabel:  cfw.label,
      windDir:    cfw.dir,
      condition:  cur.condition?.text||'',
      hrEnvScore: hrEnv(Math.round(cur.temp_f||72), cfw.dir, pf.hr),
    };

    console.log(`[Weather] ${team} cfDir=${stadium.cfDir} | now: ${current.temp}F ${current.windDirRaw} ${current.windSpeed}mph → ${current.windLabel} | ${hourly.length} hours`);

    res.status(200).json({
      team, stadium:stadium.name, cfDir:stadium.cfDir,
      parkFactorHR:pf.hr, isDome:false,
      current, hourly,
    });

  } catch(e) {
    console.error('[Weather]',e.message);
    res.status(500).json({error:e.message});
  }
}

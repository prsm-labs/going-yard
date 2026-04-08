// api/weather.js — MLB Game-Time Weather with Hourly Breakdown
// WeatherAPI.com returns LOCAL time strings — parse hours directly, never via new Date()
// cfDir = compass bearing from home plate toward center field (degrees)

const WEATHER_API_KEY = "1a64b4c500b44b62884115954253006";

const STADIUMS = {
  NYY:{lat:40.8296,lon:-73.9262,name:"Yankee Stadium",          cfDir:320,dome:false},
  NYM:{lat:40.7571,lon:-73.8458,name:"Citi Field",              cfDir:190,dome:false},
  BOS:{lat:42.3467,lon:-71.0972,name:"Fenway Park",             cfDir:95, dome:false},
  LAD:{lat:34.0739,lon:-118.240,name:"Dodger Stadium",          cfDir:330,dome:false},
  LAA:{lat:33.8003,lon:-117.883,name:"Angel Stadium",           cfDir:220,dome:false},
  HOU:{lat:29.7573,lon:-95.3555,name:"Minute Maid Park",        cfDir:30, dome:true},
  SF: {lat:37.7786,lon:-122.389,name:"Oracle Park",             cfDir:345,dome:false},
  SEA:{lat:47.5914,lon:-122.333,name:"T-Mobile Park",           cfDir:335,dome:true},
  TEX:{lat:32.7512,lon:-97.0832,name:"Globe Life Field",        cfDir:40, dome:true},
  MIN:{lat:44.9817,lon:-93.2781,name:"Target Field",            cfDir:350,dome:false},
  KC: {lat:39.0517,lon:-94.4803,name:"Kauffman Stadium",        cfDir:10, dome:false},
  CHW:{lat:41.8299,lon:-87.6338,name:"Guaranteed Rate Field",   cfDir:5,  dome:false},
  CHC:{lat:41.9484,lon:-87.6553,name:"Wrigley Field",           cfDir:75, dome:false},
  CLE:{lat:41.4962,lon:-81.6852,name:"Progressive Field",       cfDir:315,dome:false},
  DET:{lat:42.3390,lon:-83.0485,name:"Comerica Park",           cfDir:345,dome:false},
  TOR:{lat:43.6414,lon:-79.3894,name:"Rogers Centre",           cfDir:15, dome:true},
  TB: {lat:27.7683,lon:-82.6534,name:"Tropicana Field",         cfDir:0,  dome:true},
  BAL:{lat:39.2838,lon:-76.6218,name:"Camden Yards",            cfDir:55, dome:false},
  PHI:{lat:39.9061,lon:-75.1665,name:"Citizens Bank Park",      cfDir:10, dome:false},
  ATL:{lat:33.7350,lon:-84.3900,name:"Truist Park",             cfDir:20, dome:false},
  MIA:{lat:25.7781,lon:-80.2197,name:"LoanDepot Park",          cfDir:20, dome:true},
  WSH:{lat:38.8730,lon:-77.0074,name:"Nationals Park",          cfDir:10, dome:false},
  PIT:{lat:40.4469,lon:-80.0057,name:"PNC Park",                cfDir:335,dome:false},
  CIN:{lat:39.0975,lon:-84.5081,name:"Great American Ball Park",cfDir:15, dome:false},
  STL:{lat:38.6226,lon:-90.1928,name:"Busch Stadium",           cfDir:345,dome:false},
  MIL:{lat:43.0280,lon:-87.9712,name:"American Family Field",   cfDir:15, dome:true},
  COL:{lat:39.7559,lon:-104.994,name:"Coors Field",             cfDir:340,dome:false},
  ARI:{lat:33.4453,lon:-112.067,name:"Chase Field",             cfDir:340,dome:true},
  SD: {lat:32.7076,lon:-117.157,name:"Petco Park",              cfDir:330,dome:false},
  OAK:{lat:37.7516,lon:-122.201,name:"Oakland Coliseum",        cfDir:330,dome:false},
  ATH:{lat:37.7516,lon:-122.201,name:"Oakland Coliseum",        cfDir:330,dome:false},
};

const PARK_FACTORS = {
  COL:{hr:136,label:"Coors Field — Extreme HR park"},
  CIN:{hr:119,label:"Great American — HR friendly"},
  PHI:{hr:114,label:"Citizens Bank — Hitter friendly"},
  MIL:{hr:113,label:"Am. Family — Hitter friendly"},
  TEX:{hr:112,label:"Globe Life — HR friendly"},
  NYY:{hr:111,label:"Yankee Stadium — Short porch RF"},
  CHC:{hr:110,label:"Wrigley — Wind dependent"},
  BAL:{hr:108,label:"Camden Yards — Slight HR boost"},
  ATL:{hr:107,label:"Truist Park — Slight boost"},
  BOS:{hr:106,label:"Fenway — Park quirks"},
  DET:{hr:104,label:"Comerica — Slight boost"},
  STL:{hr:103,label:"Busch Stadium — Neutral"},
  CLE:{hr:102,label:"Progressive — Neutral"},
  MIN:{hr:101,label:"Target Field — Neutral"},
  WSH:{hr:100,label:"Nationals Park — Neutral"},
  HOU:{hr:99, label:"Minute Maid — Neutral"},
  LAA:{hr:98, label:"Angel Stadium — Slight suppressor"},
  KC: {hr:97, label:"Kauffman — Slight suppressor"},
  CHW:{hr:96, label:"Guaranteed Rate — Suppressor"},
  MIA:{hr:95, label:"LoanDepot — Dome suppressor"},
  LAD:{hr:94, label:"Dodger Stadium — Suppressor"},
  SF: {hr:93, label:"Oracle Park — Wind/fog suppressor"},
  PIT:{hr:92, label:"PNC Park — Suppressor"},
  SEA:{hr:91, label:"T-Mobile — Dome suppressor"},
  NYM:{hr:90, label:"Citi Field — Suppressor"},
  TOR:{hr:89, label:"Rogers Centre — Dome suppressor"},
  ARI:{hr:88, label:"Chase Field — Dome suppressor"},
  SD: {hr:88, label:"Petco Park — Marine suppressor"},
  OAK:{hr:91, label:"Oakland — Suppressor"},
  ATH:{hr:91, label:"Oakland — Suppressor"},
  TB: {hr:86, label:"Tropicana — Extreme suppressor"},
};

// Parse hour directly from WeatherAPI time string "2026-04-08 19:00"
// NEVER use new Date() — Vercel runs UTC, WeatherAPI returns local time strings
function parseHour(timeStr) {
  try { return parseInt(timeStr.split(' ')[1].split(':')[0], 10); }
  catch { return -1; }
}

// Parse game time string "7:05 PM" → 24hr integer (19)
function parseGameHour(gameTime) {
  if (!gameTime) return null;
  try {
    const m = String(gameTime).trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
    if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
    return h;
  } catch { return null; }
}

// Field-relative wind: is wind blowing toward CF (out) or away from CF (in)?
// windDeg: meteorological FROM direction (WeatherAPI wind_degree)
//   e.g. 157 = FROM SSE, meaning wind blows TOWARD NNW
// cfDir: bearing from home plate → center field
function fieldWind(windDeg, windSpeed, cfDir) {
  if (windSpeed < 3) return { label: 'Calm', dir: 'calm' };

  // WHERE the wind is blowing TOWARD (opposite of FROM)
  const windToward = (windDeg + 180) % 360;

  // Angular difference between wind destination and CF direction
  // 0° = wind going directly toward CF = blowing OUT
  // 180° = wind going directly away from CF = blowing IN
  let diff = ((windToward - cfDir) % 360 + 360) % 360;
  if (diff > 180) diff = 360 - diff;

  if (diff <= 45) {
    return windSpeed >= 15
      ? { label: `Blowing Out ${windSpeed}mph`, dir: 'out-strong' }
      : { label: `Out ${windSpeed}mph`,         dir: 'out' };
  } else if (diff >= 135) {
    return windSpeed >= 12
      ? { label: `Blowing In ${windSpeed}mph`,  dir: 'in-strong' }
      : { label: `In ${windSpeed}mph`,          dir: 'in' };
  } else {
    return { label: `Crosswind ${windSpeed}mph`, dir: 'cross' };
  }
}

function hrScore(temp, windDir, pfHr) {
  const t = temp >= 80 ? 1.08 : temp >= 70 ? 1.04 : temp >= 60 ? 1.0 : temp >= 50 ? 0.95 : 0.88;
  const w = windDir === 'out-strong' ? 1.15 : windDir === 'out' ? 1.06
          : windDir === 'in-strong'  ? 0.86 : windDir === 'in'  ? 0.93 : 1.0;
  const pf = ((pfHr || 100) - 85) / 30;
  return Math.round(Math.min(100, Math.max(0, 50 + (t-1)*80 + (w-1)*60 + pf*25)));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const { team, gameTime } = req.query;
    const stadium = STADIUMS[team];
    if (!stadium) return res.status(404).json({ error: `Unknown team: ${team}` });

    const pf = PARK_FACTORS[team] || { hr: 100, label: 'Neutral park' };

    if (stadium.dome) {
      return res.status(200).json({
        team, stadium: stadium.name, parkFactor: pf,
        weather: { isDome: true }, hrEnvScore: 50, hourly: [],
      });
    }

    const gameHour = parseGameHour(gameTime);

    // Fetch 2 days so late games don't fall off the end
    const q = `${stadium.lat},${stadium.lon}`;
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${q}&days=2&aqi=no&alerts=no`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) throw new Error(`WeatherAPI ${resp.status}`);
    const data = await resp.json();

    // Flatten all hourly slots across both days
    const allHours = (data.forecast?.forecastday || []).flatMap(d => d.hour || []);

    // Match game-time hour using direct string parse (avoids UTC confusion on Vercel)
    let gameHourData = null;
    if (gameHour !== null) {
      gameHourData = allHours.find(h => parseHour(h.time) === gameHour) || null;
    }

    // Fall back to current conditions if game hour not found
    const cur = data.current || {};
    const src = gameHourData || {
      temp_f: cur.temp_f, humidity: cur.humidity,
      wind_mph: cur.wind_mph, wind_degree: cur.wind_degree,
      wind_dir: cur.wind_dir, precip_in: cur.precip_in,
      condition: cur.condition, chance_of_rain: 0,
    };

    const temp       = Math.round(src.temp_f      || 72);
    const humidity   = Math.round(src.humidity    || 50);
    const windSpeed  = Math.round(src.wind_mph    || 0);
    const windDeg    = Math.round(src.wind_degree || 0);
    const windDirRaw = src.wind_dir || '';
    const precip     = parseFloat(src.precip_in   || 0);
    const rainChance = parseInt(src.chance_of_rain || 0);
    const condition  = src.condition?.text || '';
    const wind       = fieldWind(windDeg, windSpeed, stadium.cfDir);
    const envScore   = hrScore(temp, wind.dir, pf.hr);

    // 5 hourly slots starting from game time (or current hour if no game time)
    const startHour = gameHour !== null ? gameHour : parseHour(data.current?.last_updated || '00:00');
    const hourly = allHours
      .filter(h => parseHour(h.time) >= startHour)
      .slice(0, 5)
      .map(h => {
        const hw = fieldWind(Math.round(h.wind_degree||0), Math.round(h.wind_mph||0), stadium.cfDir);
        return {
          hour:      parseHour(h.time),
          temp:      Math.round(h.temp_f    || 72),
          windSpeed: Math.round(h.wind_mph  || 0),
          windDeg:   Math.round(h.wind_degree || 0),
          windDirRaw:h.wind_dir || '',
          windLabel: hw.label,
          windDir:   hw.dir,
          condition: h.condition?.text || '',
          humidity:  Math.round(h.humidity  || 50),
          rainChance:parseInt(h.chance_of_rain || 0),
          hrScore:   hrScore(Math.round(h.temp_f||72), hw.dir, pf.hr),
        };
      });

    console.log(`[Weather] ${team} | gameTime="${gameTime}" → gameHour=${gameHour} | src=${gameHourData?'hourly':'current'} | ${temp}F ${windDirRaw} ${windDeg}deg → ${wind.label} | hrEnv=${envScore}`);

    res.status(200).json({
      team, stadium: stadium.name, parkFactor: pf,
      weather: {
        isDome: false, temp, humidity, precip, rainChance,
        windSpeed, windDeg, windDirRaw,
        windLabel: wind.label,
        windDir2:  wind.dir,
        condition, venueName: stadium.name,
        gameTimeHour: gameHour,
        usedHourly: !!gameHourData,
      },
      hrEnvScore: envScore,
      hourly,
    });

  } catch (err) {
    console.error('[Weather] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

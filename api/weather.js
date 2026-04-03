// api/weather.js — MLB Game-Time Weather
// Uses WeatherAPI.com for accurate hourly forecasts at game start time
// Uses cfDir (compass bearing home plate → CF) for field-relative wind labels
// Domes skip weather fetch entirely and return isDome:true

const WEATHER_API_KEY = "1a64b4c500b44b62884115954253006";

const STADIUMS = {
  NYY:{lat:40.8296,lon:-73.9262,name:"Yankee Stadium",         elv:18,  cfDir:320,dome:false},
  NYM:{lat:40.7571,lon:-73.8458,name:"Citi Field",             elv:10,  cfDir:190,dome:false},
  BOS:{lat:42.3467,lon:-71.0972,name:"Fenway Park",            elv:9,   cfDir:95, dome:false},
  LAD:{lat:34.0739,lon:-118.240,name:"Dodger Stadium",         elv:161, cfDir:330,dome:false},
  LAA:{lat:33.8003,lon:-117.883,name:"Angel Stadium",          elv:43,  cfDir:220,dome:false},
  HOU:{lat:29.7573,lon:-95.3555,name:"Minute Maid Park",       elv:15,  cfDir:30, dome:true},
  SF: {lat:37.7786,lon:-122.389,name:"Oracle Park",            elv:3,   cfDir:345,dome:false},
  SEA:{lat:47.5914,lon:-122.333,name:"T-Mobile Park",          elv:4,   cfDir:335,dome:true},
  TEX:{lat:32.7512,lon:-97.0832,name:"Globe Life Field",       elv:170, cfDir:40, dome:true},
  MIN:{lat:44.9817,lon:-93.2781,name:"Target Field",           elv:263, cfDir:350,dome:false},
  KC: {lat:39.0517,lon:-94.4803,name:"Kauffman Stadium",       elv:330, cfDir:10, dome:false},
  CHW:{lat:41.8299,lon:-87.6338,name:"Guaranteed Rate Field",  elv:184, cfDir:5,  dome:false},
  CHC:{lat:41.9484,lon:-87.6553,name:"Wrigley Field",          elv:182, cfDir:75, dome:false},
  CLE:{lat:41.4962,lon:-81.6852,name:"Progressive Field",      elv:200, cfDir:315,dome:false},
  DET:{lat:42.3390,lon:-83.0485,name:"Comerica Park",          elv:183, cfDir:345,dome:false},
  TOR:{lat:43.6414,lon:-79.3894,name:"Rogers Centre",          elv:76,  cfDir:15, dome:true},
  TB: {lat:27.7683,lon:-82.6534,name:"Tropicana Field",        elv:9,   cfDir:0,  dome:true},
  BAL:{lat:39.2838,lon:-76.6218,name:"Camden Yards",           elv:10,  cfDir:55, dome:false},
  PHI:{lat:39.9061,lon:-75.1665,name:"Citizens Bank Park",     elv:10,  cfDir:10, dome:false},
  ATL:{lat:33.7350,lon:-84.3900,name:"Truist Park",            elv:305, cfDir:20, dome:false},
  MIA:{lat:25.7781,lon:-80.2197,name:"LoanDepot Park",         elv:3,   cfDir:20, dome:true},
  WSH:{lat:38.8730,lon:-77.0074,name:"Nationals Park",         elv:5,   cfDir:10, dome:false},
  PIT:{lat:40.4469,lon:-80.0057,name:"PNC Park",               elv:222, cfDir:335,dome:false},
  CIN:{lat:39.0975,lon:-84.5081,name:"Great American Ball Park",elv:149,cfDir:15, dome:false},
  STL:{lat:38.6226,lon:-90.1928,name:"Busch Stadium",          elv:142, cfDir:345,dome:false},
  MIL:{lat:43.0280,lon:-87.9712,name:"American Family Field",  elv:194, cfDir:15, dome:true},
  COL:{lat:39.7559,lon:-104.994,name:"Coors Field",            elv:1580,cfDir:340,dome:false},
  ARI:{lat:33.4453,lon:-112.067,name:"Chase Field",            elv:331, cfDir:340,dome:true},
  SD: {lat:32.7076,lon:-117.157,name:"Petco Park",             elv:9,   cfDir:330,dome:false},
  OAK:{lat:37.7516,lon:-122.201,name:"Oakland Coliseum",       elv:3,   cfDir:330,dome:false},
};

const PARK_FACTORS = {
  COL:{hr:136,xbh:118,avg:112,rank:1, label:"🏔️ Coors — Extreme HR park"},
  CIN:{hr:119,xbh:108,avg:106,rank:2, label:"🔥 Great American — HR friendly"},
  PHI:{hr:114,xbh:107,avg:104,rank:3, label:"⚡ Citizens Bank — Hitter friendly"},
  MIL:{hr:113,xbh:106,avg:103,rank:4, label:"⚡ Am. Family — Hitter friendly"},
  TEX:{hr:112,xbh:105,avg:103,rank:5, label:"⚡ Globe Life — HR friendly"},
  NYY:{hr:111,xbh:105,avg:102,rank:6, label:"⚡ Yankee Stadium — Short porch RF"},
  CHC:{hr:110,xbh:107,avg:101,rank:7, label:"⚡ Wrigley — Wind dependent"},
  BAL:{hr:108,xbh:104,avg:102,rank:8, label:"📈 Camden Yards — Slight HR boost"},
  ATL:{hr:107,xbh:103,avg:102,rank:9, label:"📈 Truist Park — Slight boost"},
  BOS:{hr:106,xbh:103,avg:103,rank:10,label:"📈 Fenway — Park quirks"},
  DET:{hr:104,xbh:102,avg:101,rank:11,label:"📈 Comerica — Slight boost"},
  STL:{hr:103,xbh:101,avg:100,rank:12,label:"— Busch Stadium — Neutral"},
  CLE:{hr:102,xbh:101,avg:100,rank:13,label:"— Progressive — Neutral"},
  MIN:{hr:101,xbh:100,avg:100,rank:14,label:"— Target Field — Neutral"},
  WSH:{hr:100,xbh:100,avg:100,rank:15,label:"— Nationals Park — Neutral"},
  HOU:{hr:99, xbh:99, avg:99, rank:16,label:"— Minute Maid — Neutral"},
  LAA:{hr:98, xbh:99, avg:99, rank:17,label:"— Angel Stadium — Slight suppressor"},
  KC: {hr:97, xbh:98, avg:99, rank:18,label:"📉 Kauffman — Slight suppressor"},
  CHW:{hr:96, xbh:97, avg:98, rank:19,label:"📉 Guaranteed Rate — Suppressor"},
  MIA:{hr:95, xbh:98, avg:99, rank:20,label:"📉 LoanDepot — Dome suppressor"},
  LAD:{hr:94, xbh:97, avg:98, rank:21,label:"📉 Dodger Stadium — Suppressor"},
  SF: {hr:93, xbh:97, avg:97, rank:22,label:"📉 Oracle Park — Wind/fog suppressor"},
  PIT:{hr:92, xbh:96, avg:97, rank:23,label:"📉 PNC Park — Suppressor"},
  SEA:{hr:91, xbh:96, avg:96, rank:24,label:"📉 T-Mobile — Dome suppressor"},
  NYM:{hr:90, xbh:96, avg:97, rank:25,label:"📉 Citi Field — Suppressor"},
  TOR:{hr:89, xbh:95, avg:96, rank:26,label:"📉 Rogers Centre — Dome suppressor"},
  ARI:{hr:88, xbh:95, avg:97, rank:27,label:"📉 Chase Field — Dome suppressor"},
  SD: {hr:88, xbh:96, avg:97, rank:28,label:"📉 Petco Park — Marine suppressor"},
  OAK:{hr:91, xbh:97, avg:96, rank:29,label:"📉 Oakland — Suppressor"},
  TB: {hr:86, xbh:94, avg:95, rank:30,label:"🧊 Tropicana — Extreme suppressor"},
};

// Field-relative wind direction
// windDeg = meteorological "FROM" direction (e.g. 270 = wind blowing FROM west, going east)
// cfDir   = compass bearing from home plate toward center field
// To get wind relative to field: find if wind is blowing TOWARD CF or AWAY from CF
function fieldWind(windDeg, windSpeed, cfDir) {
  if (windSpeed < 3) return { label: "🌤️ Calm", dir: "calm" };

  // Wind is blowing TOWARD (windDeg + 180) % 360
  const windToward = (windDeg + 180) % 360;

  // Angular difference between where wind is going and where CF is
  let diff = ((windToward - cfDir) % 360 + 360) % 360;
  if (diff > 180) diff = 360 - diff; // 0 = directly out, 180 = directly in

  if (diff <= 45) {
    if (windSpeed >= 15) return { label: `💨 Blowing Out ${windSpeed} mph`, dir: "out" };
    return { label: `🌬️ Out ${windSpeed} mph`, dir: "out-mild" };
  } else if (diff >= 135) {
    if (windSpeed >= 12) return { label: `❄️ Blowing In ${windSpeed} mph`, dir: "in" };
    return { label: `🌬️ In ${windSpeed} mph`, dir: "in-mild" };
  } else {
    return { label: `↔️ Crosswind ${windSpeed} mph`, dir: "cross" };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const { team, gameTime } = req.query;
    const stadium = STADIUMS[team];
    if (!stadium) return res.status(404).json({ error: `Unknown team: ${team}` });

    const pf = PARK_FACTORS[team] || { hr:100, xbh:100, avg:100, rank:15, label:"— Neutral park" };

    // Domes: skip weather entirely, return clean dome response
    if (stadium.dome) {
      return res.status(200).json({
        team, stadium: stadium.name,
        parkFactor: pf,
        weather: { isDome: true },
        hrEnvScore: 50,
      });
    }

    // Parse game time → target hour (local stadium time)
    let targetHour = null;
    if (gameTime) {
      try {
        const parts = gameTime.trim().split(' ');
        const ampm = parts[1] || '';
        let [h, m] = parts[0].split(':').map(Number);
        if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
        if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
        targetHour = h;
      } catch(e) {}
    }

    // WeatherAPI.com forecast endpoint — 1 day of hourly data
    const q = `${stadium.lat},${stadium.lon}`;
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${q}&days=1&aqi=no&alerts=no`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) throw new Error(`WeatherAPI ${resp.status}`);
    const data = await resp.json();

    // Find the right hour — use game time if provided, else current
    let hourData = null;
    if (targetHour !== null && data.forecast?.forecastday?.[0]?.hour) {
      hourData = data.forecast.forecastday[0].hour.find(h => {
        const hNum = new Date(h.time).getHours();
        return hNum === targetHour;
      }) || null;
    }

    // Fall back to current conditions
    const cur = data.current || {};
    const src = hourData || {
      temp_f:           cur.temp_f,
      humidity:         cur.humidity,
      wind_mph:         cur.wind_mph,
      wind_degree:      cur.wind_degree,
      wind_dir:         cur.wind_dir,
      precip_in:        cur.precip_in,
      condition:        cur.condition,
      chance_of_rain:   0,
      chance_of_snow:   0,
      feelslike_f:      cur.feelslike_f,
    };

    const temp      = Math.round(src.temp_f     || 72);
    const humidity  = Math.round(src.humidity   || 50);
    const windSpeed = Math.round(src.wind_mph   || 0);
    const windDeg   = Math.round(src.wind_degree|| 0);
    const windDirRaw= src.wind_dir || '';           // e.g. "NW", "SSW"
    const precip    = parseFloat(src.precip_in  || 0);
    const rainChance= parseInt(src.chance_of_rain || 0);
    const condition = src.condition?.text || '';
    const condCode  = src.condition?.code || 1000;

    // Field-relative wind
    const wind = fieldWind(windDeg, windSpeed, stadium.cfDir);

    // HR environment score (0-100)
    const tempBonus  = temp >= 80 ? 1.08 : temp >= 70 ? 1.04 : temp >= 60 ? 1.0 : temp >= 50 ? 0.95 : 0.88;
    const windFactor = wind.dir === 'out'      ? 1.12
                     : wind.dir === 'out-mild' ? 1.05
                     : wind.dir === 'in'       ? 0.88
                     : wind.dir === 'in-mild'  ? 0.94 : 1.0;
    const pfNorm   = (pf.hr - 85) / 30;
    const elevBonus = stadium.elv > 1000 ? 1.15 : stadium.elv > 500 ? 1.04 : 1.0;
    const hrEnvScore = Math.round(Math.min(100, Math.max(0,
      50 + (tempBonus - 1) * 80 + (windFactor - 1) * 60 + pfNorm * 25 + (elevBonus - 1) * 40
    )));

    console.log(`[Weather] ${team} @ ${stadium.name} | ${targetHour !== null ? `game-time ${targetHour}:00` : 'current'} | ${temp}°F ${wind.label} | HR env: ${hrEnvScore}`);

    res.status(200).json({
      team,
      stadium:    stadium.name,
      parkFactor: pf,
      weather: {
        isDome:      false,
        temp,
        humidity,
        precip,
        rainChance,
        windSpeed,
        windDir:     windDeg,
        windDirRaw,
        windLabel:   wind.label,
        windDir2:    wind.dir,
        condition,
        condCode,
        venueName:   stadium.name,
        gameTimeHour: targetHour,
      },
      hrEnvScore,
    });

  } catch(err) {
    console.error('[Weather] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

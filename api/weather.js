// api/weather.js
// Fetches weather for MLB stadiums using Open-Meteo (free, no API key needed)
// Also returns park factors from our static database

const STADIUMS = {
  NYY:{lat:40.8296,lon:-73.9262,name:"Yankee Stadium",      elevation:18},
  NYM:{lat:40.7571,lon:-73.8458,name:"Citi Field",          elevation:10},
  BOS:{lat:42.3467,lon:-71.0972,name:"Fenway Park",         elevation:9},
  LAD:{lat:34.0739,lon:-118.2400,name:"Dodger Stadium",     elevation:161},
  LAA:{lat:33.8003,lon:-117.8827,name:"Angel Stadium",      elevation:43},
  HOU:{lat:29.7573,lon:-95.3555,name:"Minute Maid Park",    elevation:15},
  SF: {lat:37.7786,lon:-122.3893,name:"Oracle Park",        elevation:3},
  OAK:{lat:37.7516,lon:-122.2005,name:"Oakland Coliseum",   elevation:3},
  SEA:{lat:47.5914,lon:-122.3325,name:"T-Mobile Park",      elevation:4},
  TEX:{lat:32.7512,lon:-97.0832,name:"Globe Life Field",    elevation:170},
  HOU:{lat:29.7573,lon:-95.3555,name:"Minute Maid Park",    elevation:15},
  MIN:{lat:44.9817,lon:-93.2781,name:"Target Field",        elevation:263},
  KC: {lat:39.0517,lon:-94.4803,name:"Kauffman Stadium",    elevation:330},
  CHW:{lat:41.8299,lon:-87.6338,name:"Guaranteed Rate Field",elevation:184},
  CHC:{lat:41.9484,lon:-87.6553,name:"Wrigley Field",       elevation:182},
  CLE:{lat:41.4962,lon:-81.6852,name:"Progressive Field",   elevation:200},
  DET:{lat:42.3390,lon:-83.0485,name:"Comerica Park",       elevation:183},
  TOR:{lat:43.6414,lon:-79.3894,name:"Rogers Centre",       elevation:76},
  TB: {lat:27.7683,lon:-82.6534,name:"Tropicana Field",     elevation:9},
  BAL:{lat:39.2838,lon:-76.6218,name:"Camden Yards",        elevation:10},
  PHI:{lat:39.9061,lon:-75.1665,name:"Citizens Bank Park",  elevation:10},
  ATL:{lat:33.7350,lon:-84.3900,name:"Truist Park",         elevation:305},
  MIA:{lat:25.7781,lon:-80.2197,name:"LoanDepot Park",      elevation:3},
  WSH:{lat:38.8730,lon:-77.0074,name:"Nationals Park",      elevation:5},
  PIT:{lat:40.4469,lon:-80.0057,name:"PNC Park",            elevation:222},
  CIN:{lat:39.0975,lon:-84.5081,name:"Great American Ball Park",elevation:149},
  STL:{lat:38.6226,lon:-90.1928,name:"Busch Stadium",       elevation:142},
  MIL:{lat:43.0280,lon:-87.9712,name:"American Family Field",elevation:194},
  COL:{lat:39.7559,lon:-104.9942,name:"Coors Field",        elevation:1580},
  ARI:{lat:33.4453,lon:-112.0667,name:"Chase Field",        elevation:331},
  SD: {lat:32.7076,lon:-117.1570,name:"Petco Park",         elevation:9},
};

// Park factors — 100 = neutral, >100 = hitter friendly, <100 = pitcher friendly
// Source: Fangraphs 3yr park factors (2023-2025)
const PARK_FACTORS = {
  COL:{hr:136,xbh:118,avg:112,rank:1,label:"🏔️ Coors — Extreme HR park"},
  CIN:{hr:119,xbh:108,avg:106,rank:2,label:"🔥 Great American — HR friendly"},
  PHI:{hr:114,xbh:107,avg:104,rank:3,label:"⚡ Citizens Bank — Hitter friendly"},
  MIL:{hr:113,xbh:106,avg:103,rank:4,label:"⚡ Am. Family — Hitter friendly"},
  TEX:{hr:112,xbh:105,avg:103,rank:5,label:"⚡ Globe Life — HR friendly"},
  NYY:{hr:111,xbh:105,avg:102,rank:6,label:"⚡ Yankee Stadium — Short porch RF"},
  CHC:{hr:110,xbh:106,avg:103,rank:7,label:"⚡ Wrigley — Wind-dependent"},
  ATL:{hr:108,xbh:104,avg:102,rank:8,label:"📈 Truist — Slightly hitter friendly"},
  BAL:{hr:107,xbh:103,avg:101,rank:9,label:"📈 Camden — Slight HR boost"},
  HOU:{hr:106,xbh:103,avg:101,rank:10,label:"📈 Minute Maid — Crawford Boxes"},
  BOS:{hr:105,xbh:108,avg:104,rank:11,label:"📈 Fenway — Green Monster XBH"},
  ARI:{hr:104,xbh:103,avg:101,rank:12,label:"📈 Chase Field — Retractable roof"},
  STL:{hr:101,xbh:101,avg:100,rank:13,label:"— Busch Stadium — Neutral"},
  MIN:{hr:100,xbh:100,avg:100,rank:14,label:"— Target Field — Neutral"},
  DET:{hr:100,xbh:100,avg:100,rank:15,label:"— Comerica — Neutral"},
  WSH:{hr:99, xbh:99, avg:99, rank:16,label:"— Nationals Park — Neutral"},
  CLE:{hr:98, xbh:99, avg:99, rank:17,label:"— Progressive — Slight suppressor"},
  CHW:{hr:97, xbh:98, avg:98, rank:18,label:"📉 Guaranteed Rate — Slight pitcher park"},
  TOR:{hr:97, xbh:97, avg:98, rank:19,label:"📉 Rogers Centre — Dome suppressor"},
  MIA:{hr:96, xbh:97, avg:97, rank:20,label:"📉 LoanDepot — Dome suppressor"},
  KC: {hr:96, xbh:97, avg:98, rank:21,label:"📉 Kauffman — Slight suppressor"},
  LAA:{hr:95, xbh:97, avg:98, rank:22,label:"📉 Angel Stadium — Suppressor"},
  PIT:{hr:95, xbh:97, avg:98, rank:23,label:"📉 PNC Park — Suppressor"},
  TB: {hr:94, xbh:96, avg:97, rank:24,label:"📉 Tropicana — Dome suppressor"},
  NYM:{hr:94, xbh:96, avg:97, rank:25,label:"📉 Citi Field — Pitcher friendly"},
  LAD:{hr:93, xbh:95, avg:97, rank:26,label:"📉 Dodger Stadium — Pitcher park"},
  SEA:{hr:92, xbh:95, avg:96, rank:27,label:"📉 T-Mobile — Marine air suppressor"},
  SF: {hr:91, xbh:94, avg:96, rank:28,label:"📉 Oracle Park — Wind suppressor"},
  CIN:{hr:89, xbh:93, avg:95, rank:29,label:"🧊 Petco — Strong pitcher park"}, // duplicate key, will use SD below
  SD: {hr:89, xbh:93, avg:95, rank:30,label:"🧊 Petco — Strong pitcher park"},
  OAK:{hr:88, xbh:93, avg:95, rank:31,label:"🧊 Oakland — Extreme suppressor"},
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const { team, gameTime } = req.query;
    if (!team) return res.status(400).json({ error: 'team required' });

    const stadium = STADIUMS[team];
    const parkFactor = PARK_FACTORS[team] || {hr:100,xbh:100,avg:100,rank:15,label:"— Neutral park"};

    if (!stadium) {
      return res.status(200).json({ parkFactor, weather: null, team });
    }

    // Open-Meteo — free weather API, no key needed
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${stadium.lat}&longitude=${stadium.lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,relative_humidity_2m,weather_code&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation_probability,weather_code,relative_humidity_2m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=1`;

    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    // Try to get forecast at game time if provided, else use current
    let targetHour = null;
    if (gameTime) {
      try {
        // gameTime is like "7:10 PM" — parse it into a local hour
        const d = new Date();
        const [timePart, ampm] = gameTime.split(' ');
        let [h, m] = timePart.split(':').map(Number);
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        targetHour = h;
      } catch(e) {}
    }

    // Get hourly data at game time hour, fallback to current
    const hourly = weatherData.hourly || {};
    const hours  = hourly.time || [];
    let hourIdx  = -1;
    if (targetHour !== null && hours.length > 0) {
      hourIdx = hours.findIndex(t => new Date(t).getHours() === targetHour);
    }

    const getVal = (hourlyKey, currentKey) => {
      if (hourIdx >= 0 && hourly[hourlyKey]?.[hourIdx] != null) {
        return hourly[hourlyKey][hourIdx];
      }
      return (weatherData.current || {})[currentKey] ?? null;
    };

    const current = weatherData.current || {};
    const windDir   = getVal('wind_direction_10m',   'wind_direction_10m')   || 0;
    const windSpeed = getVal('wind_speed_10m',        'wind_speed_10m')       || 0;
    const temp      = getVal('temperature_2m',        'temperature_2m')       || 72;
    const humidity  = getVal('relative_humidity_2m',  'relative_humidity_2m') || 50;
    const precipProb= hourIdx >= 0 ? (hourly['precipitation_probability']?.[hourIdx] || 0) : 0;
    const precip    = precipProb > 30 ? precipProb / 100 : (current.precipitation || 0);
    const weatherCode = current.weather_code || 0;

    // Weather multiplier for HR probability
    // Warm + dry + wind out = max boost; cold + wind in = penalty
    const tempBonus = temp >= 80 ? 1.08 : temp >= 70 ? 1.03 : temp >= 60 ? 1.0 : temp >= 50 ? 0.96 : 0.92;

    // Rough wind factor — blowing out (toward CF) boosts HRs
    // We use a simplified model: high speed out = boost, high speed in = penalty
    const windLabel = windSpeed >= 15 ? (windSpeed >= 20 ? "💨 Strong wind" : "🌬️ Moderate wind") : windSpeed >= 8 ? "🍃 Light wind" : "🌤️ Calm";

    // Elevation bonus — Coors adds ~15% distance
    const elevationBonus = stadium.elevation > 1000 ? 1.15 : stadium.elevation > 500 ? 1.04 : 1.0;

    // Dome/indoor stadiums ignore weather
    const isDome = ["TB","TOR","MIA","ARI","MIL","HOU","SEA"].includes(team);

    const weatherSummary = {
      temp: Math.round(temp),
      windSpeed: Math.round(windSpeed),
      windDir: Math.round(windDir),
      windLabel,
      humidity: Math.round(humidity),
      precip: Math.round(precip * 100) / 100,
      weatherCode,
      isDome,
      tempBonus: isDome ? 1.0 : tempBonus,
      elevationBonus,
      stadium: stadium.name,
    };

    res.status(200).json({
      team, parkFactor, weather: weatherSummary,
      // Combined HR environment score 0-100
      // 50 = neutral, >50 = hitter friendly, <50 = pitcher friendly
      hrEnvScore: Math.round(
        ((parkFactor.hr / 100) * (isDome ? 1.0 : tempBonus) * elevationBonus - 0.5) * 100 + 50
      ),
    });
  } catch (err) {
    console.error('[Weather API] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

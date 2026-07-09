// api/weather.js
// Primary: METAR (NWS Aviation Weather) for real observed winds — no API key needed
// Secondary: WeatherAPI.com for hourly forecast (game-time prediction)
// Frontend picks the game-time hour — no UTC/timezone issues on Vercel

const WEATHER_API_KEY = "1a64b4c500b44b62884115954253006";

// Nearest METAR station to each stadium
// Station choice: closest airport with reliable hourly METAR observation
const METAR_STATIONS = {
  NYY:"KTEB",  // Teterboro — closest to Yankee Stadium
  NYM:"KLGA",  // LaGuardia — adjacent to Citi Field
  BOS:"KBOS",  // Logan
  LAD:"KBUR",  // Burbank — closer than LAX to Dodger Stadium
  LAA:"KSNA",  // John Wayne / Orange County
  HOU:"KHOU",  // Hobby — closer to downtown than IAH
  SF: "KSFO",  // SFO — across bay, representative of bay wind
  SEA:"KSEA",  // Seattle-Tacoma
  TEX:"KAFW",  // Fort Worth Alliance
  MIN:"KMSP",  // Minneapolis-St Paul
  KC: "KOJC",  // Johnson County — closer than MCI to Kauffman
  CWS:"KMDW",  // Midway — south side Chicago
  CHC:"KMDW",  // Midway — closer to Wrigley than O'Hare
  CLE:"KCLE",  // Cleveland Hopkins
  DET:"KDET",  // Detroit City Airport — much closer than DTW
  TOR:"CYTZ",  // Billy Bishop — downtown Toronto
  TB: "KTPA",  // Tampa International
  BAL:"KBWI",  // BWI
  PHI:"KPHL",  // Philadelphia International
  ATL:"KATL",  // Hartsfield-Jackson
  MIA:"KMIA",  // Miami International
  WSH:"KDCA",  // Reagan National — very close to Nationals Park
  PIT:"KAGC",  // Allegheny County — closer than KPIT to PNC Park
  CIN:"KLUK",  // Lunken — closer to GABP than CVG
  STL:"KSTL",  // St Louis Lambert
  MIL:"KMKE",  // Milwaukee Mitchell
  COL:"KDEN",  // Denver International
  AZ: "KPHX",  // Phoenix Sky Harbor
  ARI:"KPHX",  // alias
  SD: "KSAN",  // San Diego International
  ATH:"KSAC",  // Sacramento Executive — closest to Sutter Health Park
  OAK:"KOAK",  // Oakland Metro
  WSH:"KDCA",
};

const STADIUMS = {
  NYY:{lat:40.8296, lon:-73.9262,  name:"Yankee Stadium",           cfDir:75,  dome:false},
  NYM:{lat:40.7571, lon:-73.8458,  name:"Citi Field",               cfDir:155, dome:false},
  BOS:{lat:42.3467, lon:-71.0972,  name:"Fenway Park",              cfDir:45,  dome:false},
  LAD:{lat:34.0739, lon:-118.2390, name:"Dodger Stadium",           cfDir:30,  dome:false},
  LAA:{lat:33.8003, lon:-117.8827, name:"Angel Stadium",            cfDir:335, dome:false},
  HOU:{lat:29.7572, lon:-95.3556,  name:"Minute Maid Park",         cfDir:30,  dome:true },
  SF: {lat:37.7786, lon:-122.3893, name:"Oracle Park",              cfDir:315, dome:false},
  SEA:{lat:47.5914, lon:-122.3325, name:"T-Mobile Park",            cfDir:335, dome:true },
  TEX:{lat:32.7478, lon:-97.0847,  name:"Globe Life Field",         cfDir:40,  dome:true },
  MIN:{lat:44.9817, lon:-93.2783,  name:"Target Field",             cfDir:30,  dome:false},
  KC: {lat:39.0517, lon:-94.4803,  name:"Kauffman Stadium",         cfDir:10,  dome:false},
  CWS:{lat:41.8309, lon:-87.6345,  name:"Guaranteed Rate Field",    cfDir:5,   dome:false},
  CHC:{lat:41.9484, lon:-87.6553,  name:"Wrigley Field",            cfDir:80,  dome:false},
  CLE:{lat:41.4962, lon:-81.6852,  name:"Progressive Field",        cfDir:5,   dome:false},
  DET:{lat:42.3390, lon:-83.0485,  name:"Comerica Park",            cfDir:5,   dome:false},
  TOR:{lat:43.6414, lon:-79.3894,  name:"Rogers Centre",            cfDir:15,  dome:true },
  TB: {lat:27.7683, lon:-82.6534,  name:"Tropicana Field",          cfDir:0,   dome:true },
  BAL:{lat:39.2838, lon:-76.6218,  name:"Camden Yards",             cfDir:30,  dome:false},
  PHI:{lat:39.9061, lon:-75.1665,  name:"Citizens Bank Park",       cfDir:15,  dome:false},
  ATL:{lat:33.8908, lon:-84.4675,  name:"Truist Park",              cfDir:120, dome:false},
  MIA:{lat:25.7781, lon:-80.2197,  name:"LoanDepot Park",           cfDir:20,  dome:true },
  WSH:{lat:38.8730, lon:-77.0074,  name:"Nationals Park",           cfDir:355, dome:false},
  PIT:{lat:40.4469, lon:-80.0057,  name:"PNC Park",                 cfDir:340, dome:false},
  CIN:{lat:39.0972, lon:-84.5078,  name:"Great American Ball Park", cfDir:350, dome:false},
  STL:{lat:38.6226, lon:-90.1928,  name:"Busch Stadium",            cfDir:5,   dome:false},
  MIL:{lat:43.0280, lon:-87.9711,  name:"American Family Field",    cfDir:15,  dome:true },
  COL:{lat:39.7561, lon:-104.9942, name:"Coors Field",              cfDir:105, dome:false},
  AZ: {lat:33.4455, lon:-112.0667, name:"Chase Field",              cfDir:80,  dome:true },
  ARI:{lat:33.4455, lon:-112.0667, name:"Chase Field",              cfDir:80,  dome:true },
  SD: {lat:32.7076, lon:-117.1570, name:"Petco Park",               cfDir:115, dome:false},
  // ATH: Sutter Health Park, Sacramento — NOT Oakland Coliseum
  ATH:{lat:38.5801, lon:-121.5136, name:"Sutter Health Park",       cfDir:115, dome:false},
  OAK:{lat:37.7516, lon:-122.2010, name:"Oakland Coliseum",         cfDir:235, dome:false},
};

const PARK_FACTORS = {
  COL:{hr:136},CIN:{hr:119},PHI:{hr:114},MIL:{hr:113},TEX:{hr:112},
  NYY:{hr:121},CHC:{hr:110},BAL:{hr:108},ATL:{hr:107},BOS:{hr:106},
  DET:{hr:104},STL:{hr:103},CLE:{hr:102},MIN:{hr:101},WSH:{hr:100},
  HOU:{hr:99}, LAA:{hr:98}, KC:{hr:97},  CWS:{hr:96}, MIA:{hr:95},
  LAD:{hr:128},SF:{hr:90},  PIT:{hr:78}, SEA:{hr:91}, NYM:{hr:88},
  TOR:{hr:103},AZ:{hr:103}, ARI:{hr:103},SD:{hr:104}, ATH:{hr:95},
  OAK:{hr:91}, TB:{hr:100},
};

function parseHour(t) {
  try { return parseInt(t.split(' ')[1].split(':')[0], 10); }
  catch { return -1; }
}

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

// Fetch METAR from NWS Aviation Weather — real observed conditions, no API key needed
// Returns {windDeg, windSpeedMph, temp_c, valid_time} or null on failure
async function fetchMETAR(station) {
  if (!station) return null;
  try {
    const url = `https://aviationweather.gov/api/data/metar?ids=${station}&format=json&hours=2`;
    const r = await fetch(url, { headers:{ Accept:'application/json' }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const data = await r.json();
    if (!Array.isArray(data) || !data.length) return null;

    // Take the most recent observation
    const obs = data[0];
    if (!obs) return null;

    const wdir  = obs.wdir;              // degrees, may be "VRB"
    const wspd  = obs.wspd;              // knots
    const temp  = obs.temp;              // Celsius
    const obsTime = obs.reportTime || obs.receiptTime || '';

    // Reject variable or missing wind direction
    if (!wdir || wdir === 'VRB' || wspd == null) return null;

    // Convert knots → mph (1 knot = 1.15078 mph)
    const windSpeedMph = Math.round(Number(wspd) * 1.15078);
    const windDeg      = Math.round(Number(wdir));
    const temp_f       = temp != null ? Math.round(Number(temp) * 9/5 + 32) : null;

    // Reject if observation is more than 90 minutes old
    if (obsTime) {
      const age = Date.now() - new Date(obsTime).getTime();
      if (age > 90 * 60 * 1000) {
        console.log(`[METAR] ${station} obs is ${Math.round(age/60000)}min old — too stale, skipping`);
        return null;
      }
    }

    console.log(`[METAR] ${station}: ${windDeg}° @ ${windSpeedMph}mph (${Number(wspd)}kts) temp=${temp_f}F obs=${obsTime}`);
    return { windDeg, windSpeedMph, temp_f, obsTime };

  } catch(e) {
    console.warn(`[METAR] ${station} failed:`, e.message);
    return null;
  }
}

// Cardinal direction from degrees
function degToCard(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');

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

    // Fetch METAR and WeatherAPI forecast in parallel — neither blocks the other
    const metarStation = METAR_STATIONS[team];
    const [metarData, weatherResp] = await Promise.allSettled([
      fetchMETAR(metarStation),
      fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${stadium.lat},${stadium.lon}&days=2&aqi=no&alerts=no`,
        { headers:{ Accept:'application/json' } }
      )
    ]);

    const metar = metarData.status === 'fulfilled' ? metarData.value : null;
    if (!weatherResp.value?.ok) throw new Error(`WeatherAPI ${weatherResp.value?.status||'failed'}`);
    const d = await weatherResp.value.json();
    const cur = d.current || {};

    // Build hourly from WeatherAPI (forecast — best available for future game times)
    const allHours = (d.forecast?.forecastday||[]).flatMap(day => day.hour||[]);
    const hourly = allHours.map(h => {
      const spd = Math.round(h.wind_mph||0);
      const deg = Math.round(h.wind_degree||0);
      const fw  = fieldWind(deg, spd, stadium.cfDir);
      return {
        hour:       parseHour(h.time),
        timeLabel:  h.time,
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

    // Current conditions: prefer METAR (real observed) over WeatherAPI model output
    let currentWindDeg   = Math.round(cur.wind_degree||0);
    let currentWindSpeed = Math.round(cur.wind_mph||0);
    let currentWindRaw   = cur.wind_dir||'';
    let currentTemp      = Math.round(cur.temp_f||72);
    let currentFeels     = Math.round(cur.feelslike_f||72);
    let metarUsed        = false;

    if (metar) {
      // METAR is real observed data — override the WeatherAPI current conditions
      currentWindDeg   = metar.windDeg;
      currentWindSpeed = metar.windSpeedMph;
      currentWindRaw   = degToCard(metar.windDeg);
      if (metar.temp_f != null) {
        currentTemp  = metar.temp_f;
        currentFeels = metar.temp_f; // METAR doesn't give feels-like, use temp
      }
      metarUsed = true;
      console.log(`[Weather] ${team} using METAR ${metarStation}: ${currentWindDeg}° ${currentWindSpeed}mph`);
    } else {
      console.log(`[Weather] ${team} METAR unavailable, using WeatherAPI current`);
    }

    const cfw = fieldWind(currentWindDeg, currentWindSpeed, stadium.cfDir);
    const current = {
      temp:       currentTemp,
      feelsLike:  currentFeels,
      humidity:   Math.round(cur.humidity||50),
      windSpeed:  currentWindSpeed,
      windDeg:    currentWindDeg,
      windDirRaw: currentWindRaw,
      windLabel:  cfw.label,
      windDir:    cfw.dir,
      condition:  cur.condition?.text||'',
      hrEnvScore: hrEnv(currentTemp, cfw.dir, pf.hr),
      metarSource: metarUsed ? metarStation : null, // flag so app can show data source
    };

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

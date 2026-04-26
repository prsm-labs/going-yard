export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { pid = '592450', group = 'hitting' } = req.query;
  const season = new Date().getFullYear();
  const results = {};

  const attempts = [
    // Try global stats endpoint with playerId
    [`v1/stats?stats=statSplits&group=${group}&season=${season}&sportId=1&playerIds=${pid}`, 'stats[0].splits'],
    // Try with sitCodes
    [`v1/people/${pid}/stats?stats=statSplits&group=${group}&season=${season}&sportId=1&sitCodes=vl,vr,h,a,d,n`, 'stats[0].splits'],
    // Try hydrate
    [`v1/people/${pid}/stats?stats=statSplits&group=${group}&season=${season}&sportId=1&hydrate=splits`, 'stats[0].splits'],
    // Try vsLeft specifically
    [`v1/people/${pid}/stats?stats=vsLeft&group=${group}&season=${season}&sportId=1`, 'stats[0].splits'],
    // Try career splits
    [`v1/people/${pid}/stats?stats=careerStatSplits&group=${group}&sportId=1`, 'stats[0].splits'],
    // Try the stats endpoint differently
    [`v1/people/${pid}/stats?stats=season&group=${group}&season=${season}&sportId=1`, 'stats[0].splits'],
    // Try with different gameType
    [`v1/people/${pid}/stats?stats=statSplits&group=${group}&season=${season}&sportId=1&gameType=A`, 'stats[0].splits'],
    // No season at all
    [`v1/people/${pid}/stats?stats=statSplits&group=${group}&sportId=1&gameType=R`, 'stats[0].splits'],
  ];

  for (const [path, accessor] of attempts) {
    try {
      const url = `https://statsapi.mlb.com/api/${path}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const d = await r.json();
      // Try to navigate to splits
      const parts = accessor.split('.');
      let val = d;
      for (const p of parts) {
        const m = p.match(/(\w+)\[(\d+)\]/);
        if (m) val = val?.[m[1]]?.[parseInt(m[2])];
        else val = val?.[p];
      }
      results[path] = { count: Array.isArray(val) ? val.length : 'not array', sample: Array.isArray(val) ? val.slice(0,2).map(s=>({code:s.split?.code,desc:s.split?.description,pa:s.stat?.plateAppearances,avg:s.stat?.avg})) : val };
    } catch(e) { results[path] = { error: e.message }; }
  }

  return res.status(200).json(results);
}

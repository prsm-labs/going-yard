// api/splits-test.js — debug, try multiple param combos
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { pid = '592450', group = 'hitting' } = req.query;
  const season = new Date().getFullYear();
  const results = {};

  const attempts = [
    `?stats=statSplits&group=${group}&season=${season}&sportId=1`,
    `?stats=statSplits&group=${group}&season=${season}&sportId=1&gameType=R`,
    `?stats=statSplits&group=${group}&season=${season-1}&sportId=1&gameType=R`,
    `?stats=vsTeam&group=${group}&season=${season}&sportId=1`,
    `?stats=statSplits&group=${group}&sportId=1`,
  ];

  for (const q of attempts) {
    try {
      const r = await fetch(`https://statsapi.mlb.com/api/v1/people/${pid}/stats${q}`);
      const d = await r.json();
      const splits = d.stats?.[0]?.splits || [];
      results[q] = {
        count: splits.length,
        first3: splits.slice(0,3).map(s=>({code:s.split?.code,desc:s.split?.description,pa:s.stat?.plateAppearances,avg:s.stat?.avg}))
      };
    } catch(e) { results[q] = { error: e.message }; }
  }

  return res.status(200).json(results);
}

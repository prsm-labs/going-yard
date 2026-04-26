// api/splits-test.js — TEMPORARY debug endpoint, delete after confirming codes
// Hit: https://goingyard.app/api/splits-test?pid=592450&group=hitting
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { pid = '592450', group = 'hitting' } = req.query;
  const season = new Date().getFullYear();
  try {
    const r = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${pid}/stats?stats=statSplits&group=${group}&season=${season}&sportId=1&gameType=R`
    );
    const d = await r.json();
    const splits = d.stats?.[0]?.splits || [];
    const summary = splits.map(s => ({
      code: s.split?.code,
      desc: s.split?.description,
      pa:   s.stat?.plateAppearances,
      avg:  s.stat?.avg,
      era:  s.stat?.era,
    }));
    return res.status(200).json({ pid, group, season, count: splits.length, splits: summary });
  } catch(e) {
    return res.status(200).json({ error: e.message });
  }
}

// api/playerstats.js
// Fetches real rolling stats for a player from MLB Stats API
// Returns L3D, L7D, L15D, L30D windows using actual game logs
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const { pid, season = '2026' } = req.query;
    if (!pid) return res.status(400).json({ error: 'pid required' });

    // Fetch game log for this player - gives us per-game stats
    const gameLogRes = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${pid}/stats?stats=gameLog&group=hitting&season=${season}&sportId=1`
    );
    const gameLogData = await gameLogRes.json();
    const games = gameLogData.stats?.[0]?.splits || [];

    if (games.length === 0) {
      return res.status(200).json({ pid, windows: null, games: [] });
    }

    // Sort games newest first
    const sorted = [...games].sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    const today = new Date();

    // Calculate stats for a window of days
    function windowStats(days) {
      const cutoff = new Date(today);
      cutoff.setDate(cutoff.getDate() - days);

      const windowGames = sorted.filter(g => new Date(g.date) >= cutoff);

      if (windowGames.length === 0) return null;

      const totals = windowGames.reduce((acc, g) => {
        const s = g.stat;
        acc.ab       += parseInt(s.atBats      || 0);
        acc.hits     += parseInt(s.hits        || 0);
        acc.hr       += parseInt(s.homeRuns    || 0);
        acc.rbi      += parseInt(s.rbi         || 0);
        acc.bb       += parseInt(s.baseOnBalls || 0);
        acc.k        += parseInt(s.strikeOuts  || 0);
        acc.xbh      += parseInt(s.doubles     || 0) + parseInt(s.triples || 0) + parseInt(s.homeRuns || 0);
        acc.tb       += parseInt(s.totalBases  || 0);
        acc.runs     += parseInt(s.runs        || 0);
        acc.games    += 1;
        return acc;
      }, { ab:0, hits:0, hr:0, rbi:0, bb:0, k:0, xbh:0, tb:0, runs:0, games:0 });

      const avg   = totals.ab > 0 ? (totals.hits / totals.ab).toFixed(3) : '.000';
      const bbPct = totals.ab > 0 ? Math.round((totals.bb / (totals.ab + totals.bb)) * 100 * 10) / 10 : 0;
      const kPct  = totals.ab > 0 ? Math.round((totals.k  / (totals.ab + totals.bb)) * 100 * 10) / 10 : 0;
      const abPerHR = totals.hr > 0 ? Math.round(totals.ab / totals.hr * 10) / 10 : 99;

      return {
        days, games: totals.games,
        ab: totals.ab, hits: totals.hits, hr: totals.hr,
        rbi: totals.rbi, bb: totals.bb, k: totals.k,
        xbh: totals.xbh, tb: totals.tb, runs: totals.runs,
        avg, bbPct, kPct, abPerHR,
        abSinceHR: (() => {
          // Count ABs since last HR
          let abCount = 0;
          for (const g of sorted) {
            if (parseInt(g.stat.homeRuns || 0) > 0) break;
            abCount += parseInt(g.stat.atBats || 0);
          }
          return abCount;
        })(),
      };
    }

    const windows = {
      3:  windowStats(3),
      7:  windowStats(7),
      15: windowStats(15),
      30: windowStats(30),
    };

    // Recent game log for player page
    const recentGames = sorted.slice(0, 10).map(g => ({
      date: g.date,
      opponent: g.opponent?.abbreviation || g.team?.abbreviation || '—',
      ab: g.stat.atBats,
      hits: g.stat.hits,
      hr: g.stat.homeRuns,
      runs: g.stat.runs,
      rbi: g.stat.rbi,
      bb: g.stat.baseOnBalls,
      k: g.stat.strikeOuts,
      avg: g.stat.avg,
    }));

    res.status(200).json({ pid, windows, games: recentGames });
  } catch (err) {
    console.error('[PlayerStats]', err.message);
    res.status(500).json({ error: err.message });
  }
}

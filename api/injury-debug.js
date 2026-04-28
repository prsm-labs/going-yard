// api/injury-debug.js — DELETE after diagnosis
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const season = new Date().getFullYear();

    // Approach 1: transactions
    const today = new Date().toISOString().slice(0,10);
    const ago90 = new Date(Date.now()-90*864e5).toISOString().slice(0,10);
    const txR = await fetch(
      `https://statsapi.mlb.com/api/v1/transactions?sportId=1&startDate=${ago90}&endDate=${today}&gameType=R`,
      { signal: AbortSignal.timeout(8000) }
    );
    const txD = await txR.json();
    const allCodes = [...new Set((txD.transactions||[]).map(t=>t.typeCode))].sort();
    const sample = (txD.transactions||[]).slice(0,5).map(t=>({
      pid: t.person?.id, name: t.person?.fullName,
      typeCode: t.typeCode, typeDesc: t.typeDesc,
      date: t.date, resolutionDate: t.resolutionDate,
      description: (t.description||'').slice(0,80),
    }));

    // Approach 2: IL roster for Mets (Lindor's team = 121)
    const rosterR = await fetch(
      `https://statsapi.mlb.com/api/v1/teams/121/roster?rosterType=injuredList&season=${season}&hydrate=person`,
      { signal: AbortSignal.timeout(8000) }
    );
    const rosterD = await rosterR.json();
    const ilRoster = (rosterD.roster||[]).map(p=>({
      pid: p.person?.id, name: p.person?.fullName,
      position: p.position?.abbreviation,
      status: p.status?.description,
    }));

    // Approach 3: All teams IL roster in one call
    const allTeamsR = await fetch(
      `https://statsapi.mlb.com/api/v1/teams?sportId=1&season=${season}&hydrate=roster(rosterType=injuredList)`,
      { signal: AbortSignal.timeout(10000) }
    );
    const allTeamsD = await allTeamsR.json();
    const allIL = [];
    for (const team of (allTeamsD.teams||[])) {
      for (const p of (team.roster||[])) {
        allIL.push({
          pid: p.person?.id, name: p.person?.fullName,
          team: team.abbreviation,
          status: p.status?.description,
          position: p.position?.abbreviation,
        });
      }
    }

    return res.status(200).json({
      transactions: { total: (txD.transactions||[]).length, allTypeCodes: allCodes, sample },
      metsIL: { total: ilRoster.length, players: ilRoster },
      allTeamsIL: { total: allIL.length, sample: allIL.slice(0,5) },
      lindorInIL: allIL.filter(p=>p.name?.includes('Lindor')),
    });
  } catch(e) {
    return res.status(200).json({ error: e.message });
  }
}

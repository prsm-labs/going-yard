// api/injury-debug.js — v2
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const today = new Date().toISOString().slice(0,10);
    const ago30 = new Date(Date.now()-30*864e5).toISOString().slice(0,10);
    const results = {};

    // ── Test 1: Transactions WITHOUT gameType=R ──────────────────────────
    const t1 = await fetch(
      `https://statsapi.mlb.com/api/v1/transactions?sportId=1&startDate=${ago30}&endDate=${today}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const d1 = await t1.json();
    const allCodes = [...new Set((d1.transactions||[]).map(t=>t.typeCode))].sort();
    const ilSC = (d1.transactions||[]).filter(t =>
      t.typeCode === 'SC' && (t.description||'').toLowerCase().includes('injured list')
    ).slice(0,5).map(t => ({
      pid: t.person?.id, name: t.person?.fullName,
      desc: (t.description||'').slice(0,120), date: t.date
    }));
    const lindorTx = (d1.transactions||[])
      .filter(t => t.person?.id === 596019)
      .map(t => ({ typeCode: t.typeCode, desc: t.description, date: t.date }));
    results.txNoGameType = { total: (d1.transactions||[]).length, allCodes, ilSCSample: ilSC, lindorTx };

    // ── Test 2: ESPN injuries ────────────────────────────────────────────
    try {
      const espnR = await fetch(
        'https://site.api.espn.com/apis/v2/sports/baseball/mlb/injuries',
        { signal: AbortSignal.timeout(8000) }
      );
      const espnD = await espnR.json();
      const injuries = espnD.injuries || [];
      const sample = injuries.slice(0,3).map(e => ({
        espnId: e.athlete?.id, name: e.athlete?.fullName,
        team: e.team?.abbreviation,
        status: e.injuries?.[0]?.status,
        type: e.injuries?.[0]?.type,
        detail: e.injuries?.[0]?.details?.detail,
        returnDate: e.injuries?.[0]?.details?.returnDate,
        comment: e.injuries?.[0]?.shortComment,
      }));
      const lindorEspn = injuries.filter(e => (e.athlete?.fullName||'').includes('Lindor'));
      results.espn = { total: injuries.length, sample, lindorEspn };
    } catch(e) { results.espn = { error: e.message }; }

    // ── Test 3: Lindor directly ──────────────────────────────────────────
    const lR = await fetch(
      'https://statsapi.mlb.com/api/v1/people/596019?hydrate=currentTeam,rosterEntries',
      { signal: AbortSignal.timeout(5000) }
    );
    const lD = await lR.json();
    const lp = lD.people?.[0] || {};
    results.lindorDirect = {
      name: lp.fullName, active: lp.active,
      currentTeam: lp.currentTeam?.abbreviation,
      rosterEntries: lp.rosterEntries,
    };

    // ── Test 4: Mets ACTIVE 26-man (Lindor should be MISSING if injured) ─
    const activeR = await fetch(
      'https://statsapi.mlb.com/api/v1/teams/121/roster?rosterType=active&season=2026',
      { signal: AbortSignal.timeout(5000) }
    );
    const activeD = await activeR.json();
    results.metsActive26 = {
      total: (activeD.roster||[]).length,
      hasLindor: (activeD.roster||[]).some(p => p.person?.id === 596019),
      players: (activeD.roster||[]).map(p=>({pid:p.person?.id, name:p.person?.fullName})),
    };

    // ── Test 5: All teams 40-man vs active ───────────────────────────────
    // Get all team IDs first
    const teamsR = await fetch(
      'https://statsapi.mlb.com/api/v1/teams?sportId=1&season=2026&activeStatus=Y',
      { signal: AbortSignal.timeout(5000) }
    );
    const teamsD = await teamsR.json();
    const teamIds = (teamsD.teams||[]).map(t=>t.id);
    results.teamCount = teamIds.length;
    results.teamIds = teamIds.slice(0,5); // sample

    return res.status(200).json(results);
  } catch(e) {
    return res.status(200).json({ error: e.message, stack: e.stack?.slice(0,300) });
  }
}

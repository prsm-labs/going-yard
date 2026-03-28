// api/roster.js
// Fetches live roster + injury list for a given MLB team
// Uses MLB Stats API — always current, no hardcoding needed
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const { teamId } = req.query;
    if (!teamId) return res.status(400).json({ error: 'teamId required' });

    // Fetch active 26-man roster
    const [rosterRes, injuryRes] = await Promise.all([
      fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active&season=2026&hydrate=person`),
      fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=injured&season=2026&hydrate=person`),
    ]);

    const rosterData  = await rosterRes.json();
    const injuryData  = await injuryRes.json();

    const injured = new Set(
      (injuryData.roster || []).map(p => p.person?.id)
    );

    const players = (rosterData.roster || [])
      .filter(p => p.position?.type === "Hitter" || p.position?.abbreviation !== "P")
      .map(p => ({
        id:       p.person?.id,
        name:     p.person?.fullName,
        hand:     p.person?.batSide?.code || "R",
        position: p.position?.abbreviation,
        injured:  injured.has(p.person?.id),
        jerseyNumber: p.jerseyNumber,
      }));

    res.status(200).json({ players, teamId });
  } catch (err) {
    console.error('[Roster API] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

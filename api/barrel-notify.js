// api/barrel-notify.js
// Vercel cron: noon, 4pm, 6pm ET (16:00, 20:00, 22:00 UTC)
// Finds today's Barrel Signal batters and sends push via /api/notify.
// 6pm run = confirmed only. Noon + 4pm include projected lineups.

import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';

function serverTrueHRScore(r) {
  // Field-name OR-chains: CSV uses recent_*/la_mean_l15/la_stddev; fallback to prompt names
  const la      = parseFloat(r.la_mean || r.la_mean_l15 || r.season_la_mean || 18);
  const laStd   = parseFloat(r.la_std  || r.la_stddev   || 8);
  const laDistScore    = Math.max(0, 1 - Math.abs(la - 19.5) / 15);
  const laConsistency  = Math.max(0, 1 - (laStd - 5) / 12);
  const sweetSpotScore = (laDistScore * 0.7 + laConsistency * 0.3) * 100;
  const pbrl      = parseFloat(r.pbrl_pct || r.recent_pulled_barrel_pct || 0);
  const pbrlScore = Math.min(100, pbrl * 8);
  const hh        = parseFloat(r.hh_pct  || r.recent_hh_pct  || 0);
  const hhScore   = Math.min(100, hh * 2.2);
  const xwoba      = parseFloat(r.season_xwoba || 0);
  const xwobaScore = Math.min(100, Math.max(0, (xwoba - 0.250) / 0.200 * 100));
  const A = sweetSpotScore * 0.35 + pbrlScore * 0.30
          + hhScore * 0.20 + xwobaScore * 0.15;

  const zf       = parseFloat(r.zone_fit || 0);
  const zfScore  = Math.min(100, zf * 13.5);
  const grade    = (r.pitcher_grade_label || '').toLowerCase();
  const gradeScore =
    grade.includes('elite')    ? 15 :
    grade.includes('tough')    ? 40 :
    grade.includes('hittable') ? 82 :
    grade.includes('target')   ? 92 :
    grade.includes('average')  ? 62 : 60;
  const seasonWoba  = parseFloat(r.season_xwoba  || 0.310);
  const vsHandWoba  = parseFloat(r.vs_hand_woba   || seasonWoba);
  const bHand       = (r.batter_hand  || '').toUpperCase();
  const pHand       = (r.pitcher_hand || '').toUpperCase();
  const platoonScore = Math.min(100, Math.max(0,
    (vsHandWoba - 0.250) / 0.200 * 100));
  const platoonMult  = bHand !== pHand ? 1.15 : 0.88;
  const ps       = parseFloat(r.ps_score || 0);
  const psScore  = Math.min(100, (ps / 25) * 100);
  const pitcherGB    = parseFloat(r.gb_pct_p || r.pitcher_gb_pct || 45) / 100;
  const gbSuppressor = pitcherGB > 0.55 ? 0.88 : pitcherGB < 0.35 ? 1.10 : 1.0;
  const B = Math.min(100, Math.max(0,
    (zfScore * 0.30 + gradeScore * 0.25 +
     (platoonScore * platoonMult) * 0.25 + psScore * 0.20)
    * gbSuppressor));

  const ghr       = parseFloat(r.gHR || 0);
  const ghrScore  = Math.min(100, ghr * 2.5);
  const iso       = parseFloat(r.recent_iso || 0);
  const isoScore  = Math.min(100, Math.max(0, (iso - 0.050) / 0.350 * 100));
  const recentHR      = parseInt(r.recent_hr_count || 0);
  const recentHRScore = Math.min(100, recentHR * 25);
  const formScore     = (ghrScore * 1.5 + isoScore * 1.0) / 2.5;
  const C = formScore * 0.70 + recentHRScore * 0.30;

  return Math.round(Math.min(100, Math.max(0,
    A * 0.40 + B * 0.35 + C * 0.25)));
}

function serverMatchupScore(r) {
  const zf      = parseFloat(r.zone_fit || 0);
  const zfScore = Math.min(100, zf * 13.5);
  const ps      = parseFloat(r.ps_score || 0);
  const psScore = Math.min(100, (ps / 25) * 100);
  const seasonWoba = parseFloat(r.season_xwoba || 0.310);
  const vsHandWoba = parseFloat(r.vs_hand_woba  || seasonWoba);
  const bHand      = (r.batter_hand  || '').toUpperCase();
  const pHand      = (r.pitcher_hand || '').toUpperCase();
  const handScore  = Math.min(100, Math.max(0,
    (vsHandWoba - 0.250) / 0.200 * 100));
  const platoonMult = bHand !== pHand ? 1.12 : 0.90;
  const grade    = (r.pitcher_grade_label || '').toLowerCase();
  const gradeMult =
    grade.includes('elite')    ? 0.55 :
    grade.includes('tough')    ? 0.75 :
    grade.includes('target')   ? 1.20 :
    grade.includes('hittable') ? 1.10 : 1.0;
  const pitcherGB = parseFloat(r.gb_pct_p || r.pitcher_gb_pct || 45) / 100;
  const gbMult    = pitcherGB > 0.55 ? 0.88 : pitcherGB < 0.35 ? 1.10 : 1.0;
  return Math.round(Math.min(100, Math.max(0,
    (zfScore * 0.40 + psScore * 0.35 + (handScore * platoonMult) * 0.25)
    * gradeMult * gbMult)));
}

// sim_tb >= 1.5 is the server-safe proxy for SimHRRate% >= 12%
// NOTE (July 21, 2026): the client-side gate (App.jsx BarrelLabTab) briefly
// applied a 0.67x suppression to SimHR% (July 13-21) before this same 12.0
// threshold check, but that suppression was reverted July 21 — it stacked
// on top of the July 14 barrelWorker.js fix (ISO floor + taper) which
// already corrected the same overconfidence at the source, and the two
// together over-rejected good candidates (confirmed: post-All-Star-break
// tracker showed 8.2% hit rate with the stacked suppression vs 18.4% with
// it removed, n=61 vs n=141). The client gate is back to a plain
// simHRPct>=12.0 check, matching this server-side sim_tb>=1.5 proxy's own
// intent. This proxy was never separately measured against actual outcomes
// and is left unchanged here rather than guessing an adjustment — the two
// gates may still diverge slightly until sim_tb's own accuracy is checked
// against the tracker.
function isBarrelSignal(r, trueHRScore, matchupScore) {
  return trueHRScore >= 75 && matchupScore >= 60
    && parseFloat(r.sim_tb || 0) >= 1.5;
}

export default async function handler(req, res) {
  const isManual = req.method === 'POST';
  if (isManual) {
    const { secret } = req.body || {};
    if (secret !== process.env.NOTIFY_SECRET)
      return res.status(401).json({ error: 'Unauthorized' });
  }

  const etHour = parseInt(new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York', hour: 'numeric', hour12: false,
  }));

  const confirmedOnly = etHour >= 18;
  const runLabel      = etHour >= 18 ? '6pm' : etHour >= 16 ? '4pm' : 'Noon';

  // Load daily_picks.csv — try csv-parse first, fall back to manual parse
  let rows = [];
  for (const p of [
    join(process.cwd(), 'public', 'data', 'daily_picks.csv'),
    join(process.cwd(), 'going-yard', 'public', 'data', 'daily_picks.csv'),
  ]) {
    try {
      rows = parse(readFileSync(p, 'utf-8'),
        { columns: true, skip_empty_lines: true });
      break;
    } catch(_) {}
  }

  if (!rows.length) {
    try {
      for (const p of [
        join(process.cwd(), 'public', 'data', 'daily_picks.csv'),
        join(process.cwd(), 'going-yard', 'public', 'data', 'daily_picks.csv'),
      ]) {
        try {
          const raw     = readFileSync(p, 'utf-8');
          const lines   = raw.split('\n').filter(Boolean);
          const headers = lines[0].split(',')
            .map(h => h.trim().replace(/^"|"$/g, ''));
          rows = lines.slice(1).map(line => {
            const vals = line.split(',');
            return Object.fromEntries(
              headers.map((h, i) => [h, (vals[i]||'').trim()
                .replace(/^"|"$/g,'')])
            );
          });
          break;
        } catch(_) {}
      }
    } catch(_) {}
  }

  if (!rows.length) {
    console.warn('[barrel-notify] daily_picks.csv not found');
    return res.json({ ok: false, reason: 'no data' });
  }

  const eligible = rows.filter(r => {
    if (!r.batter || !r.game_id) return false;
    if (confirmedOnly) {
      const c = r.lineup_confirmed;
      if (c !== true && c !== 1 &&
          String(c).toLowerCase() !== 'true' &&
          String(c) !== '1') return false;
    }
    return true;
  });

  const scored = eligible.map(r => {
    const trueHRScore  = serverTrueHRScore(r);
    const matchupScore = serverMatchupScore(r);
    const signal       = isBarrelSignal(r, trueHRScore, matchupScore);
    return { ...r, trueHRScore, matchupScore, signal };
  });

  const signals    = scored.filter(r => r.signal)
    .sort((a,b) => b.trueHRScore - a.trueHRScore);
  const topBatters = signals.length > 0 ? signals
    : scored.sort((a,b) => b.trueHRScore - a.trueHRScore).slice(0,8);

  if (!topBatters.length)
    return res.json({ ok: false, reason: 'no eligible batters' });

  const count    = topBatters.length;
  const topNames = topBatters.slice(0,5).map(r => {
    const p = (r.batter||'').trim().split(' ');
    return p.length >= 2 ? p[p.length-1] : r.batter;
  });
  const remainder = count > 5 ? `+${count-5} more` : '';

  const etDate = new Date().toLocaleDateString('en-US', {
    timeZone:'America/New_York', month:'short', day:'2-digit' });

  const title    = signals.length > 0
    ? `🛢️ ${count} Barrel Signal${count!==1?'s':''} — ${etDate} (${runLabel})`
    : `⭐ ${count} Top Reads — ${etDate} (${runLabel})`;
  const body     = [topNames.join(', '), remainder].filter(Boolean).join(' ');
  const dedupKey = `barrel-signals-${etDate.replace(/\s/g,'-')}-${runLabel}`;

  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://yard.prsmlabs.app';
    const r = await fetch(`${base}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret:   process.env.NOTIFY_SECRET,
        title, body, dedupKey,
        url: 'https://yard.prsmlabs.app/#scouting/barrellab',
      }),
    });
    const data = await r.json();
    console.log('[barrel-notify]', runLabel, '—', count, 'signals');
    return res.json({ ok:true, count, runLabel, title, body,
      notifyResult: data });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}

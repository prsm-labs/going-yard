import { useEffect, useState } from "react";
import "./PrismPicks.css";

// 💎 PRISM Picks card (2026-10-27, top of the Cheat Sheet) -- same card as the other PRISM Labs apps: tonight's best looks on
// real lines a batter only clears about half the time (hits 1+ / 2+, total bases 2+ / 3+). Picks, calibration and the graded
// record come from public/data/prism_picks.json (mlb_project/build_prism_picks.py, locked by the last pipeline run before first
// pitch, graded next morning from the at-bat log). The big number is the track record at that chance. Never a lock.
// Collapsed by default, like the other apps.
const pct = (v) => (v == null ? "—" : `${Math.round(v)}%`);
const share = (h, n) => (n ? `${Math.round((h / n) * 100)}%` : "—");
const md = (d) => (d ? `${+d.slice(5, 7)}/${+d.slice(8, 10)}` : "");

export default function PrismPicks({ onOpen, actions, avatar }) {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    fetch("/data/prism_picks.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => setData(null));
  }, []);
  if (!data?.backtest) return null;
  const picks = data.tonight?.picks || [];
  const bt = data.backtest, live = data.live || { n: 0, hits: 0 };
  const past = [...(data.nights || [])].filter((n) => n.graded).reverse();
  const rule = data.rule;
  return (
    <div className={`gy-prism-card ${open ? "open" : "collapsed"}`}>
      <div className="gy-prism-head">
        <span className="gy-prism-gem" aria-hidden="true">💎</span>
        <div className="gy-prism-titles">
          <div className="gy-prism-title">PRISM Picks</div>
          <div className="gy-prism-sub">
            {data.tonight?.date ? `${md(data.tonight.date)} · ` : ""}Best looks on real lines — the kind a book posts
          </div>
        </div>
        <button type="button" className="gy-prism-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? "▴ Hide" : `▾ Show${picks.length ? ` ${picks.length} pick${picks.length === 1 ? "" : "s"}` : ""}`}
        </button>
      </div>
      {picks.length === 0 && (
        <div className="gy-prism-empty">
          No real line clears the bar today — PRISM Picks only shows looks that have hit about {share(bt.hits + live.hits, bt.n + live.n)} of the time.
        </div>
      )}
      {picks.map((p, i) => (
        <div key={`${p.playerId}-${p.stat}`} className="gy-prism-row" onClick={() => onOpen?.(p)}>
          <span className="gy-prism-rank">{i + 1}.</span>
          {avatar?.(p)}
          <div className="gy-prism-main">
            <div className="gy-prism-who">
              {p.name} <span className="gy-prism-muted">({p.team} {p.home ? "vs" : "@"} {p.opp})</span>{" "}
              <span onClick={(e) => e.stopPropagation()}>{actions?.(p)}</span>
            </div>
            <div className="gy-prism-line">{p.label}</div>
            <div className="gy-prism-muted">
              had it in {Math.round(p.own * p.n)} of his last {p.n} · vs {p.pitcher} · {p.lineup === "confirmed" ? "lineup confirmed" : "lineup projected"}
            </div>
          </div>
          <div className="gy-prism-stat"
            title={`Past PRISM Picks at a ${pct(p.chancePct)} chance hit ${pct(p.track)}. The model alone says ${pct(p.chancePct)}.`}>
            <b>{pct(p.track)}</b>
            <span>track record</span>
            <span>model {pct(p.chancePct)}</span>
          </div>
        </div>
      ))}
      <div className="gy-prism-foot">
        Track record: backtest {bt.hits.toLocaleString()} of {bt.n.toLocaleString()} hit ({share(bt.hits, bt.n)}, said {Math.round(bt.said * 100)}%) over {bt.nights} nights,
        {" "}{md(bt.from)}–{md(bt.to)} 2026, each month predicted only from the months before it
        {live.n ? ` · live since ${md(live.since)}: ${live.hits} of ${live.n} (${share(live.hits, live.n)})` : ""}.
        {" "}Rule: real lines only — hits or total bases — that he cleared in {Math.round(rule.real * 100)}% or fewer of his last {rule.last_n} games,
        where the model gives him {Math.round(rule.floor * 100)}% to {Math.round(rule.cap * 100)}%; likely starters only, one prop per player, {rule.per_game} per game.
        Locked by the last update before first pitch. Not a lock.
      </div>
      {past.length > 0 && (
        <details className="gy-prism-past">
          <summary>Past days</summary>
          {past.map((n) => (
            <div key={n.date} className="gy-prism-past-row">
              <b>{md(n.date)}</b> {n.picks.filter((p) => p.result === "hit").length}/{n.picks.filter((p) => p.result !== "void").length}{" "}
              <span className="gy-prism-muted">
                {n.picks.map((p) => `${p.result === "hit" ? "✅" : p.result === "void" ? "–" : "✗"} ${p.name} ${p.label}${p.actual != null ? ` (${p.actual})` : ""}`).join(" · ")}
              </span>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

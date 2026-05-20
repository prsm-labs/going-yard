import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ReactDOM from "react-dom";

// ── PWA Push Notifications ───────────────────────────────────────────────────
const VAPID_PUBLIC_KEY = (typeof window !== 'undefined' && window.__VAPID_KEY__) || '';
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
  // Handle deep-link navigation posted by the service worker on notification click
  navigator.serviceWorker.addEventListener('message', e => {
    if (!e.data || e.data.type !== 'NOTIFY_NAV') return;
    const hash  = (e.data.url || '').split('#')[1] || '';
    const parts = hash.replace(/^[/]/, '').split('/');
    const targetTab  = parts[0] || 'live';
    const targetView = parts[1] || null;
    if (_GLOBAL_NAV) {
      _GLOBAL_NAV.setTab(targetTab);
      if (targetView && _GLOBAL_NAV.setLiveView) _GLOBAL_NAV.setLiveView(targetView);
    }
  });
}
// Kick off injury fetch early
fetchInjuries();
// HR odds fetched on demand via useHROdds() hooks
async function subscribeToPush() {
  try {
    if (!('PushManager' in window)) return 'unsupported';
    const reg = await navigator.serviceWorker.ready;
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return 'denied';
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY,
    });
    const r = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub }),
    });
    return r.ok ? 'subscribed' : 'error';
  } catch(e) { console.warn('[Push]', e); return 'error'; }
}
async function getPushState() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'granted') {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (!reg) return 'unsupported';
    const sub = await reg.pushManager.getSubscription().catch(() => null);
    return sub ? 'subscribed' : 'granted';
  }
  return 'default';
}

const BUILD_TIMESTAMP = "2026-05-03 11:09 PM ET";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@300;400;500;600;700&family=DM+Mono:ital,wght@0,400;0,500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#080c10;--surface:#0d1318;--surface2:#131b22;--border:#1e2d3a;
    --accent:#e8411a;--accent2:#f5a623;--ice:#38b8f2;--green:#27c97a;
    --text:#e8edf2;--muted:#8a9db0;--fire2:#ff7a00;--fire3:#ffb700;
    --aplus:#ff3010;--a:#ff7000;--b:#f5a623;--c:#8bc4e8;--d:#8a9db0;--f:#38b8f2;
  }
  html,body{background:var(--bg);color:var(--text);font-family:'Oswald',sans-serif;min-height:100vh;overflow-x:clip;max-width:100%;width:100%;}
  .app{min-height:100vh;display:flex;flex-direction:column;overflow-x:clip;max-width:100%;width:100%;}
  .app-inner{width:100%;display:flex;flex-direction:column;min-height:100%;}
  .header{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:linear-gradient(180deg,#0a1520 0%,var(--bg) 100%);gap:8px;overflow:hidden;}
  .logo{font-family:'Oswald',sans-serif;font-weight:700;font-size:17px;text-transform:uppercase;letter-spacing:1.5px;color:var(--text);display:flex;align-items:center;gap:6px;min-width:0;flex-shrink:1;overflow:hidden;white-space:nowrap;}
  .logo span{color:var(--accent);}
  .logo-dot{width:9px;height:9px;background:var(--accent);border-radius:50%;animation:pulse 1.8s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}
  .live-badge{display:flex;align-items:center;gap:6px;background:rgba(232,65,26,.15);border:1px solid rgba(232,65,26,.3);padding:4px 11px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:1.5px;color:var(--accent);text-transform:uppercase;}
  .live-dot{width:6px;height:6px;background:var(--accent);border-radius:50%;animation:pulse 1s infinite;}
  .tabs{display:flex;padding:0 16px;background:var(--surface);border-bottom:1px solid var(--border);overflow-x:auto;}
  .tab{padding:10px 9px;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;cursor:pointer;border:none;background:none;color:var(--muted);border-bottom:2px solid transparent;transition:all .2s;font-family:'Oswald',sans-serif;font-weight:500;white-space:nowrap;}
  .tab:hover{color:var(--text);}
  .tab.active{color:var(--text);border-bottom-color:var(--accent);}
  .content{flex:1;padding:22px;width:100%;box-sizing:border-box;}
@media(min-width:900px){
  .content{padding:24px 40px;}
  .tab{padding:11px 14px;font-size:11px;letter-spacing:1px;}
  body,html{font-size:15px;}
  .gc{padding:18px 20px;}
  .gg{grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:14px;}
  .section-title{font-size:22px;}
  table td, table th{padding:8px 10px;font-size:12px;}
  .dr td{padding:8px 10px;}
}
  .section-title{font-family:'Oswald',sans-serif;font-weight:700;font-size:26px;text-transform:uppercase;letter-spacing:2px;color:var(--text);}
  .section-sub{font-size:12px;color:var(--muted);margin-top:3px;font-family:'Oswald',sans-serif;font-weight:300;letter-spacing:.5px;}
  .section-header{margin-bottom:18px;}
  .hrow{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px;flex-wrap:wrap;gap:10px;}
  .filters{display:flex;gap:7px;margin-bottom:14px;flex-wrap:wrap;align-items:center;}
  .chip{padding:4px 11px;border-radius:6px;font-size:11px;font-weight:500;border:1px solid var(--border);background:var(--surface2);color:var(--muted);cursor:pointer;transition:all .15s;font-family:'DM Mono',monospace;}
  .chip.active{border-color:var(--accent);color:var(--accent);background:rgba(232,65,26,.08);}
  .window-active{border-color:var(--accent2)!important;color:var(--accent2)!important;background:rgba(245,166,35,.1)!important;}
  .chip:hover{border-color:var(--muted);color:var(--text);}
  .fl{font-size:11px;color:var(--muted);font-family:'DM Mono',monospace;margin-right:4px;}
  .tw{overflow-x:auto;overflow-y:auto;max-height:72vh;border-radius:10px;border:1px solid var(--border);}
  .tw table{border-collapse:separate;border-spacing:0;}
  .tw th{position:sticky;top:0;z-index:10;background:var(--surface2);}
  .tw th.sticky-batter{position:sticky;top:0;left:0;z-index:20;background:var(--surface2);}
  .tw td.sticky-batter{position:sticky;left:0;z-index:5;background:var(--surface);}
  .tw tr:hover td.sticky-batter{background:var(--surface2);}
  .tw thead tr:first-child th{border-bottom:2px solid var(--border);}
  table{width:100%;border-collapse:collapse;}
  thead tr{background:var(--surface2);}
  th{padding:9px 12px;text-align:left;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted);font-family:'DM Mono',monospace;white-space:nowrap;border-bottom:1px solid var(--border);cursor:pointer;user-select:none;transition:color .15s;}  th:hover{color:var(--text);}
  th:hover{color:var(--text);}
  th.sk{color:var(--accent);}
  td{padding:10px 12px;font-size:12px;border-bottom:1px solid rgba(30,45,58,.5);vertical-align:middle;}
  tr:last-child td{border-bottom:none;}
  tr.dr:hover td{background:rgba(255,255,255,.02);cursor:pointer;}
  tr.dr.ex td{background:rgba(232,65,26,.03);border-bottom:none;}
  tr.xr td{padding:0;border-bottom:1px solid var(--border);}
  .pc{display:flex;align-items:center;gap:9px;}
  .av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--surface2),var(--border));display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--text);flex-shrink:0;border:1px solid var(--border);}
  .pn{font-weight:700;font-size:13px;letter-spacing:.3px;}
  .pt{font-size:10px;color:var(--muted);font-family:'DM Mono',monospace;}
  .sv{font-family:'DM Mono',monospace;font-size:11px;font-weight:500;}
  .sv.hot{color:var(--fire2);}
  .sv.warm{color:var(--fire3);}
  .sv.good{color:var(--green);}
  .sv.avg{color:var(--text);}
  .sv.cold{color:var(--ice);}
  .sv.dng{color:#ff3010;}
  .hbc{display:flex;align-items:center;gap:6px;}
  .hbb{flex:1;height:4px;border-radius:2px;background:var(--border);overflow:hidden;min-width:50px;}
  .hbf{height:100%;border-radius:2px;transition:width .6s ease;}
  .hbn{font-family:'Oswald',sans-serif;font-weight:700;font-size:16px;min-width:28px;}
  .hl{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:9px;font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;font-family:'DM Mono',monospace;white-space:nowrap;}
  .splash-overlay{position:fixed;inset:0;background:#0d0d0f;display:flex;flex-direction:column;
  align-items:center;justify-content:center;z-index:99999;transition:opacity .6s ease,visibility .6s ease;}
.splash-overlay.fade-out{opacity:0;visibility:hidden;}
@keyframes ball-pulse{
  0%,100% { filter: drop-shadow(0 0 18px rgba(232,65,26,.6)) drop-shadow(0 0 6px rgba(255,160,50,.4)); transform: scale(1); }
  50%      { filter: drop-shadow(0 0 38px rgba(232,65,26,.9)) drop-shadow(0 0 16px rgba(255,200,50,.7)); transform: scale(1.07); }
}
@keyframes arc-float{
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-12px); }
}
@keyframes splash-fade-in{
  from { opacity:0; transform:scale(.85); }
  to   { opacity:1; transform:scale(1); }
}
@keyframes text-rise{
  from { opacity:0; transform:translateY(14px); }
  to   { opacity:1; transform:translateY(0); }
}
.splash-ball-wrap{
  animation: arc-float 1.6s ease-in-out infinite;
}
.splash-ball{
  width:130px;height:130px;object-fit:contain;
  animation: ball-pulse 1.6s ease-in-out infinite;
}
.splash-logo-wrap{
  animation: splash-fade-in .5s ease both;
  display:flex;flex-direction:column;align-items:center;gap:22px;
}
.splash-title{
  font-family:'Oswald',sans-serif;font-weight:800;font-size:30px;
  letter-spacing:3px;color:#fff;
  animation: text-rise .55s ease .25s both;
}
.splash-sub{
  font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;
  color:rgba(255,255,255,.35);text-transform:uppercase;
  animation: text-rise .55s ease .4s both;
}
.splash-bar-wrap{
  width:120px;height:2px;background:rgba(255,255,255,.08);border-radius:2px;
  overflow:hidden;margin-top:8px;animation: text-rise .55s ease .5s both;
}
.splash-bar{
  height:100%;background:linear-gradient(90deg,#e8411a,#ff8020);border-radius:2px;
  animation: splash-bar-fill 1.8s ease .3s both;
}
@keyframes splash-bar-fill{
  from{width:0%} to{width:100%}
}
.hl.gone_yard{background:rgba(255,20,0,.25);color:#fff;border:1px solid rgba(255,20,0,.5);font-weight:800;letter-spacing:.5px;}
  .hl.elite{background:rgba(255,45,0,.18);color:#ff6040;border:1px solid rgba(255,45,0,.3);}
  .hl.hot{background:rgba(255,122,0,.15);color:#ff9a30;border:1px solid rgba(255,122,0,.25);}
  .hl.warm{background:rgba(255,183,0,.12);color:#ffc840;border:1px solid rgba(255,183,0,.2);}
  .hl.avg{background:rgba(90,112,128,.12);color:var(--muted);border:1px solid var(--border);}
  .hl.cold{background:rgba(56,184,242,.1);color:var(--ice);border:1px solid rgba(56,184,242,.2);}
  .lw{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:16px;}
  .sp{width:32px;height:32px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .lt{font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);}
  .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:9px;margin-bottom:18px;}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:12px 15px;}
  .cl{font-size:9px;color:var(--muted);font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:1px;}
  .cv{font-family:'Oswald',sans-serif;font-weight:700;font-size:28px;letter-spacing:2px;color:var(--text);margin:2px 0 1px;}
  .cs{font-size:9px;color:var(--muted);font-family:'DM Mono',monospace;}
  .leg{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px;padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:8px;}
  .legt{font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;}
  .legi{display:flex;gap:9px;flex-wrap:wrap;}
  .leit{display:flex;align-items:center;gap:4px;font-size:10px;font-family:'DM Mono',monospace;}
  .ld{width:6px;height:6px;border-radius:50%;}
  .tw2{position:relative;display:inline-flex;}
  .ti{width:11px;height:11px;border-radius:50%;background:var(--border);color:var(--muted);font-size:8px;display:flex;align-items:center;justify-content:center;cursor:help;}
  .tb{position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:#1a2630;border:1px solid var(--border);border-radius:5px;padding:5px 9px;font-size:10px;color:var(--text);font-family:'DM Mono',monospace;white-space:nowrap;z-index:200;pointer-events:none;opacity:0;transition:opacity .15s;}
  .tw2:hover .tb{opacity:1;}
  .note{background:rgba(56,184,242,.06);border:1px solid rgba(56,184,242,.15);border-radius:7px;padding:9px 13px;font-size:11px;color:rgba(56,184,242,.8);font-family:'DM Mono',monospace;margin-bottom:14px;line-height:1.6;}
  .warn{background:rgba(232,65,26,.06);border:1px solid rgba(232,65,26,.25);border-radius:7px;padding:9px 13px;font-size:11px;color:rgba(232,65,26,.85);font-family:'DM Mono',monospace;margin-bottom:12px;}
  .rb{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:6px;border:1px solid var(--border);background:var(--surface2);color:var(--muted);font-size:11px;font-family:'DM Mono',monospace;cursor:pointer;transition:all .15s;}
  .rb:hover{border-color:var(--accent);color:var(--accent);}
  .rb.sp2 svg{animation:spin .8s linear infinite;}
  .div{font-size:10px;color:var(--muted);font-family:'DM Mono',monospace;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;}
  .gg{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:11px;margin-bottom:6px;max-width:100%;min-width:0;}
  .gc{overflow:hidden;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px;cursor:pointer;transition:all .2s;position:relative;min-width:0;max-width:100%;}
  .gc:hover{border-color:rgba(232,65,26,.5);}
  .gc.exp{border-color:var(--accent);border-bottom-left-radius:0;border-bottom-right-radius:0;border-bottom:none;}
  .gc::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent),var(--accent2));opacity:0;transition:opacity .2s;}
  .gc.exp::before,.gc:hover::before{opacity:1;}
  .gh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
  .gs{font-family:'DM Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:1px;text-transform:uppercase;}
  .gs.fin{color:var(--muted);}
  .gs.pre{color:var(--green);}
  .gm{display:flex;align-items:center;justify-content:space-between;}
  .gt{text-align:center;}
  .ta{font-family:'Oswald',sans-serif;font-weight:700;font-size:22px;letter-spacing:2px;text-transform:uppercase;}
  .tsc{font-family:'Oswald',sans-serif;font-weight:600;font-size:18px;letter-spacing:1px;color:var(--muted);}
  .tsc.win{color:var(--text);}
  .gd{color:var(--muted);font-size:11px;font-family:'DM Mono',monospace;}
  .gi{font-family:'DM Mono',monospace;font-size:10px;text-align:center;margin-top:5px;}
  .cv2{font-size:10px;color:var(--muted);transition:transform .2s;display:inline-block;}
  .cv2.op{transform:rotate(180deg);}
  .gpw{margin-bottom:14px;grid-column:1/-1;min-width:0;width:100%;max-width:100%;}
  .gp{overflow:visible;min-width:0;width:100%;max-width:100%;border:1px solid var(--accent);border-top:none;border-bottom-left-radius:10px;border-bottom-right-radius:10px;background:#0a1218;overflow:hidden;animation:sd .2s ease;width:100%;}
  @keyframes sd{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  .gph{padding:9px 15px;border-bottom:1px solid var(--border);}
  .gpt{font-family:'Oswald',sans-serif;font-size:13px;letter-spacing:1.5px;color:var(--text);}
  .gps{font-size:9px;color:var(--muted);font-family:'DM Mono',monospace;margin-top:1px;}
  .xd{background:rgba(10,18,28,.95);border-top:1px solid var(--border);padding:12px 15px;animation:sd .15s ease;}
  .xg{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:7px;margin-bottom:10px;}
  .xb{background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 10px;}
  .xbl{font-size:9px;color:var(--muted);font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;}
  .xbv{font-family:'Oswald',sans-serif;font-size:18px;letter-spacing:1px;}
  .xbs{font-size:9px;font-family:'DM Mono',monospace;margin-top:1px;}
  .cbr{display:flex;gap:6px;align-items:center;margin-bottom:5px;}
  .cbl{font-size:9px;color:var(--muted);font-family:'DM Mono',monospace;width:58px;flex-shrink:0;}
  .cbg{flex:1;display:flex;gap:6px;align-items:center;}
  .cbw{flex:1;}
  .cbwl{font-size:8px;color:var(--muted);font-family:'DM Mono',monospace;margin-bottom:1px;}
  .cbb{height:5px;border-radius:3px;background:var(--border);overflow:hidden;}
  .cbbf{height:100%;border-radius:3px;transition:width .5s ease;}
  .cbv{font-size:9px;font-family:'DM Mono',monospace;min-width:28px;text-align:right;}
  .stags{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px;}
  .stag{padding:2px 7px;border-radius:8px;font-size:9px;font-family:'DM Mono',monospace;font-weight:600;}
  .stag.pos{background:rgba(39,201,122,.12);color:var(--green);border:1px solid rgba(39,201,122,.2);}
  .stag.neg{background:rgba(56,184,242,.08);color:var(--ice);border:1px solid rgba(56,184,242,.15);}
  .stag.neu{background:rgba(90,112,128,.1);color:var(--muted);border:1px solid var(--border);}
  .stag.fire{background:rgba(255,90,0,.14);color:#ff7020;border:1px solid rgba(255,90,0,.25);}
  .lr{padding:9px 12px;border-bottom:1px solid rgba(30,45,58,.4);display:flex;flex-direction:column;gap:5px;transition:background .15s;}
  .lr-top{display:flex;align-items:center;gap:7px;min-width:0;}
  .lr:last-child{border-bottom:none;}
  .lr:hover{background:rgba(255,255,255,.02);}
  .lrk{font-family:'Oswald',sans-serif;font-size:14px;color:var(--muted);min-width:14px;flex-shrink:0;}
  .li{flex:1;min-width:0;}
  .ln{font-weight:600;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .lm{font-size:10px;color:var(--muted);font-family:'DM Mono',monospace;margin-top:1px;}
  .ls{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;}
  .lv{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:9px;font-size:9px;font-weight:700;letter-spacing:.8px;font-family:'DM Mono',monospace;white-space:nowrap;}
  .lv.primed{background:rgba(255,45,0,.2);color:#ff5030;border:1px solid rgba(255,45,0,.35);}
  .lv.hot{background:rgba(255,122,0,.15);color:#ff9a30;border:1px solid rgba(255,122,0,.3);}
  .lv.watch{background:rgba(255,183,0,.12);color:#ffc840;border:1px solid rgba(255,183,0,.22);}
  .lv.cold{background:rgba(56,184,242,.1);color:var(--ice);border:1px solid rgba(56,184,242,.2);}
  .lmini{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;width:100%;}
  .lms{text-align:center;padding:3px 2px;background:rgba(255,255,255,.04);border-radius:4px;}
  .lmsv{font-family:'DM Mono',monospace;font-size:10px;font-weight:700;line-height:1.2;}
  .lmsl{font-size:7px;color:var(--muted);font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:.3px;}
  .sr{position:relative;width:42px;height:42px;flex-shrink:0;}
  .sr svg{transform:rotate(-90deg);}
  .srv{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-size:13px;}
  .gb{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:6px;font-family:'Oswald',sans-serif;font-weight:700;font-size:18px;flex-shrink:0;}
  .gb.aplus{background:rgba(255,48,16,.2);color:var(--aplus);border:2px solid rgba(255,48,16,.4);}
  .gb.a{background:rgba(255,112,0,.18);color:var(--a);border:2px solid rgba(255,112,0,.35);}
  .gb.b{background:rgba(245,166,35,.14);color:var(--b);border:2px solid rgba(245,166,35,.28);}
  .gb.c{background:rgba(139,196,232,.1);color:var(--c);border:2px solid rgba(139,196,232,.2);}
  .gb.d{background:rgba(90,112,128,.1);color:var(--d);border:1px solid var(--border);}
  .gb.f{background:rgba(56,184,242,.08);color:var(--f);border:1px solid rgba(56,184,242,.15);}
  .gb.x{background:rgba(42,58,72,.3);color:#3a5060;border:1px solid var(--border);}
  .sp3{padding:2px 6px;border-radius:5px;font-size:9px;font-family:'DM Mono',monospace;font-weight:600;background:var(--surface2);border:1px solid var(--border);}
  .sp3.cq{border-color:rgba(255,112,0,.3);color:#ff7000;}
  .sp3.hi{border-color:rgba(255,48,16,.3);color:#ff3010;}
  .sp3.rd{border-color:rgba(39,201,122,.3);color:var(--green);}
  .bgs{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px;}
  .bgb{padding:6px 12px;border-radius:7px;font-size:10px;font-family:'DM Mono',monospace;font-weight:600;border:1px solid var(--border);background:var(--surface2);color:var(--muted);cursor:pointer;transition:all .15s;text-align:center;}
  .bgb:hover{border-color:var(--accent);color:var(--text);}
  .bgb.active{border-color:var(--accent);background:rgba(232,65,26,.08);color:var(--accent);}
  .bgbt{font-size:12px;font-family:'Oswald',sans-serif;letter-spacing:1px;color:var(--text);}
  .bgbs{font-size:9px;color:var(--muted);margin-top:1px;}
  .pc2{background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:14px 16px;margin-bottom:16px;}
  .ph{display:flex;align-items:center;gap:11px;margin-bottom:11px;}
  .pa{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#1a2a38,#0d1a28);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid var(--border);}
  .pnam{font-family:'Oswald',sans-serif;font-size:18px;letter-spacing:1.5px;}
  .psub{font-size:10px;color:var(--muted);font-family:'DM Mono',monospace;}
  .hnd{display:inline-block;padding:1px 6px;border-radius:3px;font-size:9px;font-family:'DM Mono',monospace;font-weight:700;background:rgba(232,65,26,.1);color:var(--accent);border:1px solid rgba(232,65,26,.2);margin-left:6px;}
  .pmg{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:7px;}
  .pmc{background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:9px 11px;}
  .pmh{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;}
  .pmn{font-size:10px;font-weight:600;font-family:'DM Mono',monospace;}
  .pmp{font-family:'Oswald',sans-serif;font-size:17px;letter-spacing:1px;}
  .pub{height:3px;border-radius:1px;background:var(--border);overflow:hidden;margin-bottom:6px;}
  .puf{height:100%;border-radius:1px;}
  .psr{display:flex;justify-content:space-between;font-size:9px;font-family:'DM Mono',monospace;color:var(--muted);}
  .psv2{font-weight:600;}
  .psv2.gd{color:var(--green);}
  .psv2.bd{color:#ff3010;}
  .psv2.nu{color:var(--fire3);}
  .pta{display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:4px;font-size:9px;font-family:'DM Mono',monospace;font-weight:700;background:rgba(255,48,16,.15);color:#ff5030;border:1px solid rgba(255,48,16,.25);margin-top:3px;}
  .bvr{padding:11px 15px;border-bottom:1px solid rgba(30,45,58,.4);display:grid;grid-template-columns:auto 1fr auto auto;gap:11px;align-items:center;}
  .bvr:last-child{border-bottom:none;}
  .bvr:hover{background:rgba(255,255,255,.02);}
  .h2h{display:flex;gap:9px;}
  .h2hs{text-align:center;}
  .h2hv{font-family:'Oswald',sans-serif;font-size:16px;letter-spacing:1px;}
  .h2hl{font-size:8px;color:var(--muted);font-family:'DM Mono',monospace;text-transform:uppercase;}
  .vr{display:flex;align-items:center;gap:4px;font-size:9px;font-family:'DM Mono',monospace;margin-bottom:3px;}
  .vrl{color:var(--muted);width:44px;font-size:8px;}
  .vrb{flex:1;height:3px;border-radius:2px;background:var(--border);overflow:hidden;}
  .vrbf{height:100%;border-radius:2px;}
  .vrv{font-size:8px;min-width:24px;text-align:right;}
  .rab{display:flex;gap:3px;flex-wrap:wrap;}
  .abr{width:19px;height:19px;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;font-family:'DM Mono',monospace;font-weight:700;}
  .abr.hr{background:rgba(255,48,16,.25);color:#ff5030;border:1px solid rgba(255,48,16,.3);}
  .abr.hit{background:rgba(39,201,122,.15);color:var(--green);border:1px solid rgba(39,201,122,.2);}
  .abr.out{background:rgba(30,45,58,.5);color:var(--muted);border:1px solid var(--border);}
  .abr.k{background:rgba(56,184,242,.1);color:var(--ice);border:1px solid rgba(56,184,242,.15);}
  /* HR Ticker */
  .ticker-wrap{background:#0a0e14;border-bottom:1px solid rgba(232,65,26,.25);overflow:hidden;height:32px;display:flex;align-items:center;position:relative;}
  .ticker-label{background:var(--accent);color:white;padding:0 12px;height:100%;display:flex;align-items:center;font-family:'Oswald',sans-serif;font-weight:700;font-size:11px;letter-spacing:2px;white-space:nowrap;flex-shrink:0;z-index:2;gap:5px;}
  .ticker-track{display:flex;gap:0;animation:ticker-scroll 60s linear infinite;white-space:nowrap;}
  .ticker-track:hover{animation-play-state:paused;}
  @keyframes ticker-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  .ticker-item{padding:0 24px;font-family:'DM Mono',monospace;font-size:11px;color:var(--text);cursor:pointer;display:flex;align-items:center;gap:7px;height:32px;border-right:1px solid rgba(255,255,255,.05);transition:background .15s;}
  .ticker-item:hover{background:rgba(232,65,26,.1);}
  .ticker-sep{color:var(--accent);font-size:14px;padding:0 8px;}
  /* HR Tracker table */
  .hr-badge{display:inline-flex;align-items:center;justify-content:center;padding:2px 8px;border-radius:4px;font-family:'Oswald',sans-serif;font-weight:700;font-size:11px;letter-spacing:1px;}
  .hr-badge.solo{background:rgba(56,184,242,.15);color:var(--ice);border:1px solid rgba(56,184,242,.25);}
  .hr-badge.multi{background:rgba(232,65,26,.18);color:var(--accent);border:1px solid rgba(232,65,26,.3);}
  .hr-badge.slam{background:rgba(255,183,0,.18);color:var(--accent2);border:1px solid rgba(255,183,0,.3);}
  /* Pick buttons */
  input[type=text]{outline:none;}
  input[type=text]::placeholder{color:var(--muted);}
  /* Scrollable table with frozen header */
  .tw-scroll{border-radius:10px;border:1px solid var(--border);overflow:hidden;}
  .tw-scroll-inner{overflow-x:auto;overflow-y:auto;max-height:62vh;}
  .tw-scroll table{width:100%;border-collapse:separate;border-spacing:0;}
  .tw-scroll th{padding:9px 12px;text-align:left;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted);font-family:'DM Mono',monospace;white-space:nowrap;border-bottom:2px solid var(--border);cursor:pointer;user-select:none;background:var(--surface2);position:sticky;top:0;z-index:20;}
  .tw-scroll td{padding:10px 12px;font-size:12px;border-bottom:1px solid rgba(30,45,58,.5);vertical-align:middle;}
  ::-webkit-scrollbar{width:5px;height:5px;}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}}
  ::-webkit-scrollbar-track{background:var(--bg);}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px;}
@media(max-width:768px){
    html,body,#root,.app{overflow-x:clip;max-width:100%;width:100%;}
    .content{padding:10px;}.header{padding:10px 12px;}
    .gg{grid-template-columns:1fr;}.cards{grid-template-columns:repeat(2,1fr);}
    .xg{grid-template-columns:repeat(2,1fr);}
    .bvr{grid-template-columns:auto 1fr;}.h2h{display:none;}.pmg{grid-template-columns:repeat(2,1fr);}
    .tabs{overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap;padding:0 8px;}
    @media(orientation:landscape){.landscape-hint{display:none!important;}}
    .tab{white-space:nowrap;flex-shrink:0;padding:10px 9px;font-size:10px;}
    '    .gc{overflow:visible;}'
    .tw{overflow-x:auto;overflow-y:auto;max-height:72vh;-webkit-overflow-scrolling:touch;}
    }
`;

// THRESHOLDS
// ── PLAYER DATA CACHE (module-level, persists across renders) ────
const PLAYER_DATA_CACHE = {};
let PLAYER_CACHE_DATE = null; // timestamp (ms) — refreshes every 3 hours
function cachePlayer(p) { if (p.pid) PLAYER_DATA_CACHE[String(p.pid)] = p; }
function getCachedPlayer(pid) { return PLAYER_DATA_CACHE[String(pid)] || PLAYER_DATA_CACHE[parseInt(pid)] || null; }
// Hot bat: 3+ HRs in last 7 days — works on player cache AND engine rows
function isHotBatPlayer(p) {
  if (!p) return false;
  const pid = String(p.pid || p.id || p.batter_id || '');
  // Prefer daily_picks.csv recent_hr_count (pipeline-verified) over players.json last7.hr
  const fromPicks = pid ? parseFloat(DAILY_PICKS_CACHE[pid]?.recent_hr_count ?? -1) : -1;
  const fromCache = parseFloat(p.windows?.last7?.hr ?? p.l7hr ?? -1);
  const fromRow   = parseFloat(p.recent_hr_count ?? -1);
  const val = fromPicks >= 0 ? fromPicks : fromRow >= 0 ? fromRow : fromCache >= 0 ? fromCache : -1;
  return val >= 3;
}
// Normalize team abbreviations — MLB API still returns legacy codes for relocated teams
const TEAM_ABBR_MAP = { OAK: 'ATH' };
// Venue name overrides — MLB Stats API sometimes returns stale/old names
const VENUE_NAME_MAP = {
  'Oakland Coliseum':          'Sutter Health Park',
  'RingCentral Coliseum':      'Sutter Health Park',
  'Oakland-Alameda County Coliseum': 'Sutter Health Park',
  'Tropicana Field':           'George M. Steinbrenner Field',
};
const normVenue = name => VENUE_NAME_MAP[name] || name;
const normTeam = t => (t && TEAM_ABBR_MAP[t]) || t || '—';

const T={
  EV_HH:95,       // Hard hit entry point
  EV_HR:103,       // HR probability spike
  EV_EL:108,       // Elite power contact
  LA_MIN:25,       // HR sweet spot floor
  LA_MAX:35,       // HR sweet spot ceiling
  BAR_EL:15,       // Elite barrel% (12-18% range, 15 = center)
  BAR_GD:10,       // Good barrel%
  BAR_MAX:18,      // Above this = over-swinging
  FB_MIN:35,       // Fly ball% floor (sweet spot)
  FB_MAX:45,       // Fly ball% ceiling (above 50% = too many outs)
  PULL_EL:45,      // Elite pull air% (40-50% range)
  PULL_GD:35,      // Good pull air%
  CHASE_EL:20,     // Elite chase rate (below this)
  CHASE_GD:25,     // Good chase rate threshold
  HH_EL:50,HH_GD:42,
};
const inHRZ = (la) => la >= T.LA_MIN && la <= T.LA_MAX;
const getLAZ = (la) => {
  if (la >= T.LA_MIN && la <= T.LA_MAX) return "💥 HR Sweet Spot (25–35°)";
  if (la > T.LA_MAX) return "📈 Too high";
  if (la > 0) return "📉 Too low";
  return null;
};
const getHS = (r) => {
  // EV: 30pts — scales from 95 (entry) to 108 (elite)
  const ev = Math.min(Math.max((r.avgEV - T.EV_HH) / (T.EV_EL - T.EV_HH), 0), 1) * 30;
  // LA in sweet spot 25-35°: 25pts — penalize outside zone
  const la = r.launchAngle ?? r.sweetSpotLA ?? 22;
  const laScore = (la >= T.LA_MIN && la <= T.LA_MAX) ? 25 : (la >= 19 && la < T.LA_MIN) ? 12 : (la > T.LA_MAX && la <= 40) ? 10 : 0;
  // Barrel% 12-18% sweet zone: 20pts — peaks at 15%, penalize >18%
  const barPct = r.barrel ?? 0;
  const barScore = barPct >= T.BAR_MAX ? Math.min(18, 20) : Math.min((barPct / T.BAR_EL) * 20, 20);
  // FlyBall% 35-45% sweet zone: 10pts
  const fb = r.flyBall ?? r.sweetSpot ?? 35;
  const fbScore = (fb >= T.FB_MIN && fb <= T.FB_MAX) ? 10 : (fb >= 30 && fb < T.FB_MIN) ? 5 : (fb > T.FB_MAX && fb <= 55) ? 6 : 2;
  // Pull Air% 40-50% elite zone: 10pts
  const pull = r.pullAir ?? 20;
  const pullScore = pull >= T.PULL_EL ? 10 : pull >= T.PULL_GD ? 6 : Math.min((pull / T.PULL_GD) * 6, 6);
  // Chase rate <25% bonus: 5pts
  const chase = r.oSwing ?? r.chaseRate ?? 30;
  const chaseScore = chase <= T.CHASE_EL ? 5 : chase <= T.CHASE_GD ? 3 : 0;
  return Math.round(ev + laScore + barScore + fbScore + pullScore + chaseScore);
};
const getHC = (s) => s >= 75 ? "#ff4020" : s >= 58 ? "#ff8020" : s >= 42 ? "#ffbe20" : s >= 25 ? "#8899a6" : "#38b8f2";
const getLHL = (ev, la, hh) => {
  const ep = ev >= T.EV_EL ? 3 : ev >= T.EV_HH ? 2 : ev >= 90 ? 1 : 0;
  
  
  const lp = (la>=T.LA_MIN&&la<=T.LA_MAX)?3:(la>=19&&la<T.LA_MIN)?2:la>0?1:0;
  const hp = hh >= 3 ? 4 : hh >= 2 ? 3 : hh === 1 ? 1 : 0;
  const sc = ep + lp + hp;
  return sc >= 8 ? {label:"🔥 On Fire",cls:"elite"} : sc >= 5 ? {label:"🔥 Heating Up",cls:"hot"} : sc >= 3 ? {label:"🌡 Warm",cls:"warm"} : sc >= 1 ? {label:"— Neutral",cls:"avg"} : {label:"🧊 Ice Cold",cls:"cold"};
};
const ini = (n) => n?.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2) || "?";

// PlayerAvatar — MLB headshot with initials fallback
// Uses MLB's public CDN: no auth, served by player ID
function PlayerAvatar({ pid, name, size=32, border='1.5px solid var(--border)', style={} }) {
  const [failed, setFailed] = React.useState(false);
  const cleanId = pid ? String(parseInt(pid)||0) : '0';
  const src = cleanId !== '0'
    ? 'https://img.mlbstatic.com/mlb-photos/image/upload/w_180,q_auto:best/v1/people/'+cleanId+'/headshot/67/current'
    : null;
  const initials = ini(name||'');
  if (!src || failed) {
    return (
      <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,
        background:'var(--surface2)',border,
        display:'flex',alignItems:'center',justifyContent:'center',
        fontFamily:"'DM Mono',monospace",fontWeight:700,
        fontSize:Math.round(size*0.35),color:'var(--muted)',...style}}>
        {initials}
      </div>
    );
  }
  return (
    <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,
      overflow:'hidden',border,...style}}>
      <img src={src} alt={name||''} onError={()=>setFailed(true)}
        style={{width:'100%',height:'160%',objectFit:'cover',
          objectPosition:'center 28%',marginTop:'-18%'}}/>
    </div>
  );
}

// Position abbreviation → color mapping
const POS_COLORS = {
  "C":   "#38b8f2", // catcher — blue
  "1B":  "#f5a623", // first base — orange
  "2B":  "#f5a623",
  "3B":  "#f5a623",
  "SS":  "#f5a623",
  "LF":  "#27c97a", // outfield — green
  "CF":  "#27c97a",
  "RF":  "#27c97a",
  "OF":  "#27c97a",
  "DH":  "#e8411a", // DH — red
  "P":   "#5a7080", // pitcher — muted (shouldn't appear)
};

// PosAvatar — shows position abbreviation with color coding
// Falls back to initials if no position available
const PosAvatar = ({ player, size=30, style={} }) => {
  const pos = player?.pos || GLOBAL_PLAYER_TEAM_MAP[player?.pid]?.pos || '';
  const color = POS_COLORS[pos] || "var(--muted)";
  const display = pos || ini(player?.name || '');
  const fontSize = pos ? (pos.length > 2 ? 8 : pos.length === 2 ? 10 : 12) : 10;
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:`${color}18`,
      border:`1.5px solid ${color}60`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'DM Mono',monospace", fontWeight:700,
      fontSize, color, flexShrink:0, ...style
    }}>
      {display}
    </div>
  );
};

// SCOUTING ENGINE
const calcCQ = (p) => {
  // Contact Quality — EV backbone + barrel + hard hit + sweet spot
  // Returns 0-10 score used for display in Scouting tab
  const ev = p.avgEV ?? 0;
  const evN = ev >= 94.5 ? 4.0 : ev >= 90 ? 3.2 : ev >= 87 ? 2.5 :
              ev >= 84   ? 1.8 : ev >= 81 ? 1.0 : ev > 0 ? 0.5 : 0;
  const barN = Math.min((p.barrel  ?? 0) / 15, 1) * 3.0;
  const hhN  = Math.min((p.hardHit ?? 0) / 50, 1) * 2.0;
  const ssN  = Math.min((p.sweetSpot ?? 0) / 35, 1) * 1.0;
  return Math.round((evN + barN + hhN + ssN) * 10) / 10;
};
const calcHRI = (p) => {
  // HR Intent — pull%, flyball%, xSLG, HR rate
  // Returns 0-10 score used for display in Scouting tab
  const pull = p.pullAir ?? 0;
  const pullN = pull >= 45 ? 1 : pull >= 35 ? 0.8 : pull >= 25 ? 0.55 :
                pull >= 15 ? 0.3 : pull > 0 ? 0.15 : 0;
  const fb = p.flyBall ?? 0;
  const fbN = (fb >= 35 && fb <= 45) ? 1 : (fb >= 28 && fb < 35) ? 0.75 :
              (fb > 45 && fb <= 52)   ? 0.65 : fb >= 20 ? 0.4 : fb > 0 ? 0.2 : 0;
  const xslg = p.xslg ?? p.slg ?? 0;
  const xslgN = xslg >= 0.600 ? 1 : xslg >= 0.500 ? 0.82 : xslg >= 0.420 ? 0.62 :
                xslg >= 0.360 ? 0.42 : xslg > 0 ? 0.22 : 0;
  const hrN = Math.min((p.hr ?? 0) / 25, 1);
  return Math.round((pullN*3 + fbN*2.5 + xslgN*2.5 + hrN*2) * 10) / 10;
};
const calcRD = (p) => {
  // Readiness — chase%, K%, BB%, zone contact%
  // Returns 0-10 score used for display in Scouting tab
  const chase = p.oSwing ?? p.chasePct ?? 30;
  const chaseN = chase <= 20 ? 1 : chase <= 25 ? 0.8 : chase <= 30 ? 0.58 :
                 chase <= 35 ? 0.38 : chase <= 40 ? 0.2 : 0.05;
  const bb = p.bbPct ?? 0;
  const bbN = bb >= 12 ? 1 : bb >= 9 ? 0.8 : bb >= 7 ? 0.6 :
              bb >= 5  ? 0.4 : bb > 0 ? 0.2 : 0;
  const k = p.kPct ?? 22;
  const kN = k <= 15 ? 1 : k <= 20 ? 0.78 : k <= 25 ? 0.55 :
             k <= 30 ? 0.33 : k <= 35 ? 0.15 : 0.05;
  const zc = p.zContact ?? p.zContactPct ?? 80;
  const zcN = zc >= 88 ? 1 : zc >= 83 ? 0.78 : zc >= 78 ? 0.55 :
              zc >= 72 ? 0.33 : zc > 0 ? 0.15 : 0.5;
  return Math.round((chaseN*3.5 + kN*2.5 + bbN*2 + zcN*2) * 10) / 10;
};
const calcOS = (p) => {
  // ── Matches Power BI spec exactly: CQ 50% + HRI 30% + RD 20% ──
  // Each sub-score normalised 0-100, then weighted

  // ── CONTACT QUALITY (50%) ─────────────────────────────────
  // EV is the backbone — gates everything else
  const ev = p.avgEV ?? 0;
  // EV grade per spec: A+ ≥94.5, A ≥90, B ≥87, C ≥84, D ≥81, F <81
  const evScore =
    ev >= 94.5 ? 100 :
    ev >= 90.0 ?  82 :
    ev >= 87.0 ?  65 :
    ev >= 84.0 ?  48 :
    ev >= 81.0 ?  30 : ev > 0 ? 15 : 0;
  // Barrel%, HardHit%, SweetSpot% boost within EV tier
  const barrelScore  = Math.min((p.barrel   ?? 0) / 20 * 100, 100);
  const hardHitScore = Math.min((p.hardHit  ?? 0) / 55 * 100, 100);
  const ssScore      = Math.min((p.sweetSpot?? 0) / 40 * 100, 100);
  // xwOBA: strongest predictor of true contact quality
  const xw = p.xwoba ?? 0;
  const xwobaScore = xw >= 0.420 ? 100 : xw >= 0.380 ? 85 : xw >= 0.340 ? 68 :
                     xw >= 0.310 ? 50  : xw >= 0.280 ? 32 : xw > 0 ? 15 : 0;
  // Blend: EV 35% + xwOBA 30% + Barrel 20% + HardHit 10% + SweetSpot 5%
  const cqScore = xw > 0
    ? (evScore*0.35 + xwobaScore*0.30 + barrelScore*0.20 + hardHitScore*0.10 + ssScore*0.05)
    : (evScore*0.50 + barrelScore*0.30 + hardHitScore*0.15 + ssScore*0.05);

  // ── HR INTENT (30%) ───────────────────────────────────────
  // Pull Air% + Fly Ball% + HR rate + xSLG
  const pull = p.pullAir ?? 0;
  const pullScore = pull >= 45 ? 100 : pull >= 35 ? 80 : pull >= 25 ? 55 :
                    pull >= 15 ? 30  : pull > 0 ? 15 : 0;
  const fb = p.flyBall ?? 0;
  const fbScore = (fb >= 35 && fb <= 45) ? 100 : (fb >= 28 && fb < 35) ? 75 :
                  (fb > 45 && fb <= 52)   ? 65  : fb >= 20 ? 40 : fb > 0 ? 20 : 0;
  const hrRate = (p.hr ?? 0) / Math.max(p.pa ?? p.ab ?? 1, 1);
  const hrRateScore = Math.min(hrRate / 0.060 * 100, 100); // 6% HR rate = elite
  const xslg = p.xslg ?? p.slg ?? 0;
  const xslgScore = xslg >= 0.600 ? 100 : xslg >= 0.500 ? 82 : xslg >= 0.420 ? 62 :
                    xslg >= 0.360 ? 42  : xslg > 0 ? 22 : 0;
  // Blend: Pull% 30% + FB% 25% + xSLG 25% + HR rate 20%
  const hriScore = (pullScore*0.30 + fbScore*0.25 + xslgScore*0.25 + hrRateScore*0.20);

  // ── READINESS (20%) ───────────────────────────────────────
  // Chase%, Whiff%, BB%, K%, Zone contact%
  const chase = p.oSwing ?? p.chasePct ?? 30;
  const chaseScore = chase <= 20 ? 100 : chase <= 25 ? 80 : chase <= 30 ? 58 :
                     chase <= 35 ? 38  : chase <= 40 ? 20 : 5;
  const bb = p.bbPct ?? 0;
  const bbScore = bb >= 12 ? 100 : bb >= 9 ? 80 : bb >= 7 ? 60 :
                  bb >= 5  ? 40  : bb > 0  ? 20 : 0;
  const k = p.kPct ?? 22;
  const kScore = k <= 15 ? 100 : k <= 20 ? 78 : k <= 25 ? 55 :
                 k <= 30  ? 33  : k <= 35 ? 15 : 5;
  const zc = p.zContact ?? p.zContactPct ?? 80;
  const zcScore = zc >= 88 ? 100 : zc >= 83 ? 78 : zc >= 78 ? 55 :
                  zc >= 72 ? 33  : zc > 0   ? 15 : 50; // 50 default if unknown
  // Blend: Chase% 35% + K% 25% + BB% 20% + ZContact% 20%
  const rdScore = (chaseScore*0.35 + kScore*0.25 + bbScore*0.20 + zcScore*0.20);

  // ── UNIFIED SCORE: CQ 50% + HRI 30% + RD 20% ─────────────
  const unified = (cqScore * 0.50) + (hriScore * 0.30) + (rdScore * 0.20);
  return Math.round(unified * 10) / 10;
};
const getSG = (s) => {
  // Score bands — unified 0-100 scale matching spec
  // A+ ≥78 — red-hot elite, immediate HR threat
  // A  ≥62 — impact bat, above-avg damage probability
  // B  ≥48 — heating up, trending positive
  // C  ≥34 — watchlist, neutral
  // D  ≥20 — cooling off
  // F  ≥10 — cold
  // X  <10  — no meaningful data
  if (s >= 78) return {grade:"A+",cls:"aplus",label:"🔴 Elite damage threat",  color:"var(--aplus)"};
  if (s >= 62) return {grade:"A", cls:"a",    label:"🔥 Above-avg power",      color:"var(--a)"};
  if (s >= 48) return {grade:"B", cls:"b",    label:"⚡ Heating up",           color:"var(--b)"};
  if (s >= 34) return {grade:"C", cls:"c",    label:"👀 Watch list",           color:"var(--c)"};
  if (s >= 20) return {grade:"D", cls:"d",    label:"🌡 Cooling off",          color:"var(--d)"};
  if (s >= 10) return {grade:"F", cls:"f",    label:"🧊 Cold",                 color:"var(--f)"};
  return              {grade:"X", cls:"x",    label:"❌ Insufficient data",    color:"#2a3a48"};
};
const getPIQ = (p) => {
  const chase = p.oSwing ?? 30, zc = p.zContact ?? 80, bbk = p.bbkRatio ?? 0.35;
  // Chase rate <20% = elite (40pts), <25% = good — tighter now
  const chaseScore = chase <= T.CHASE_EL ? 40 : chase <= T.CHASE_GD ? 28 : Math.max(0, (35 - chase) / 10) * 20;
  const zcScore = Math.min(zc / 90, 1) * 30;
  const bbkScore = Math.min(bbk / 0.7, 1) * 30;
  const sc = chaseScore + zcScore + bbkScore;
  if (sc >= 75) return {label:"🎯 Elite IQ",color:"var(--green)"};
  if (sc >= 55) return {label:"✅ Patient",color:"var(--green)"};
  if (sc >= 38) return {label:"— Average",color:"var(--muted)"};
  if (sc >= 22) return {label:"⚠️ Chaser",color:"var(--fire3)"};
  return {label:"🚫 Free Swinger",color:"#ff3010"};
};

// BvP ENGINE
const calcMS = (b, p) => {
  const fb = Math.min(Math.max(((b.evVsFB ?? 88) - (p.fbVelo ?? 93)) / 8, 0), 1) * 30;
  const bk = Math.max(1 - (b.whiffBK ?? 30) / 50, 0) * 25;
  const os = Math.max(1 - (b.chaseOS ?? 35) / 50, 0) * 20;
  const h2h = Math.min(((b.careerBA ?? 0.25) - 0.2) / 0.1, 1) * 15 + Math.min((b.careerHR ?? 0) / 3, 1) * 10;
  return Math.round(Math.min(fb + bk + os + h2h, 100) * 10) / 10;
};

// LIFTOFF ENGINE
const calcLS = (b) => {
  const rb = b.recentBarrel ?? b.barrel ?? 0;
  const rh = b.recentHardHit ?? b.hardHit ?? 0;
  const re = b.recentAvgEV ?? b.avgEV ?? 88;
  const streak = Math.min(((rb / 14) * 18) + ((rh / 55) * 12) + (Math.max(0, (re - 88) / 10) * 10), 40);
  const ds = b.daysSinceHR;
  const due = ds <= 1 ? 5 : ds <= 3 ? 12 : ds <= 7 ? 25 : ds <= 14 ? 18 : 8;
  const pf = b.pitcherFactor ?? 0;
  const pit = pf > 0 ? 12 : pf < 0 ? 3 : 7;
  const home = b.isHome ? (b.homeHR ?? 0) > (b.awayHR ?? 0) ? 10 : 5 : (b.awayHR ?? 0) > (b.homeHR ?? 0) ? 10 : 5;
  const sea = Math.min(((b.barrel ?? 0) / T.BAR_EL) * 10, 10);
  return Math.round(streak + due + pit + home + sea);
};
const getLV = (s) => s >= 75 ? {label:"🚀 Primed",cls:"primed"} : s >= 55 ? {label:"🔥 Hot",cls:"hot"} : s >= 38 ? {label:"⚡ Watch",cls:"watch"} : {label:"❄️ Cold",cls:"cold"};
const getLSigs = (b) => {
  const sigs = [], ds = b.daysSinceHR, rb = b.recentBarrel ?? b.barrel ?? 0, re = b.recentAvgEV ?? b.avgEV ?? 88, rh = b.recentHardHit ?? b.hardHit ?? 0;
  if (ds != null && ds >= 4 && ds <= 10) sigs.push({t:`${ds}d since last HR`, c:"fire"});
  else if (ds != null && ds > 14) sigs.push({t:`${ds}d HR drought`, c:"neg"});
  if (rb >= 14) sigs.push({t:`${rb.toFixed(0)}% barrel L7`, c:"pos"});
  else if (rb >= 8) sigs.push({t:`${rb.toFixed(0)}% barrel L7`, c:"neu"});
  if (re >= T.EV_HH) sigs.push({t:`${re.toFixed(0)} mph EV (95+)`, c:"pos"});
  if ((b.pitcherFactor ?? 0) > 0) sigs.push({t:"Favorable matchup", c:"pos"});
  if ((b.pitcherFactor ?? 0) < 0) sigs.push({t:"Tough pitcher", c:"neg"});
  if (b.isHome && (b.hr ?? 0) > 0 && (b.homeHR ?? 0) > (b.awayHR ?? 0)) sigs.push({t:"Home HR boost", c:"pos"});
  if (rh >= 50) sigs.push({t:"Hard contact streak", c:"fire"});
  return sigs.slice(0, 4);
};

const enrichP = (r) => {
  r.bbkRatio = r.kPct > 0 ? r.bbPct / r.kPct : 0.35;
  r.heatScore = getHS(r);
  r.cq = calcCQ(r); r.hri = calcHRI(r); r.rd = calcRD(r);
  r.os = calcOS(r); r.grade = getSG(r.os); r.piq = getPIQ(r);
  // Generate windowed stats if not already present
  // Use existing windows from cache if available — NEVER regenerate Statcast metrics
  const existingCached = getCachedPlayer(r.pid);
  if (existingCached?.windows) {
    r.windows = existingCached.windows;
  } else if (!r.windows) {
    r.windows = genWindows(r);
  }
  // Async window fetch — updates in background without blocking
  if (r.pid && !WINDOW_CACHE[r.pid]) {
    fetchRealWindows(r.pid).then(realWin => {
      if (realWin) {
        // Merge real counting stats with Statcast metrics
        const cached = getCachedPlayer(r.pid);
        if (cached) {
          [3,7,15,30].forEach(w => {
            if (realWin[w] && cached.windows?.[w]) {
              // Real data: AB, H, HR, BB, K, AVG, BB%, K%, abSinceHR
              // Keep Statcast metrics: EV, Barrel%, HardHit%, FlyBall%, Launch°
              Object.assign(cached.windows[w], {
                hits: realWin[w].hits,
                hr: realWin[w].hr,
                atBats: realWin[w].ab,
                xbh: realWin[w].xbh,
                tb: realWin[w].tb,
                avg: parseFloat(realWin[w].avg),
                bbPct: realWin[w].bbPct,
                kPct: realWin[w].kPct,
                abPerHR: realWin[w].abPerHR,
                abSinceHR: realWin[w].abSinceHR,
                games: realWin[w].games,
              });
            }
          });
        }
        WINDOW_CACHE[r.pid] = { data: realWin, ts: Date.now() };
      }
    }).catch(() => {});
  }
  return r;
};

// ── WINDOW STAT GENERATOR ─────────────────────────────────────
// Uses real MLB Stats API game log data via /api/playerstats
// Falls back to Statcast season baseline only if API unavailable
const WINDOW_CACHE = {}; // pid → {windows, ts}

async function fetchRealWindows(pid) {
  if (!pid) return null;
  const cached = WINDOW_CACHE[pid];
  if (cached && Date.now() - cached.ts < 3600000) return cached.data; // 1hr cache
  try {
    const res = await fetch(`/api/playerstats?pid=${pid}`);
    const data = await res.json();
    if (data.windows) {
      WINDOW_CACHE[pid] = { data: data.windows, ts: Date.now() };
      return data.windows;
    }
  } catch(e) { console.warn('[Windows] fetch failed:', e.message); }
  return null;
}

// Fallback: build windows from season Statcast baseline (no random, seeded by pid)
function genWindows(p) {
  const windows = {};
  const keyMap = { 3:'last7', 7:'last7', 14:'last14', 30:'last30', 60:'last60' };
  [7, 14, 30, 60].forEach((w) => {
    const avgEV        = p.avgEV        || 0;
    const barrel       = p.barrel       || 0;
    const flyBall      = p.flyBall      || 0;
    const launchAngle  = p.launchAngle  || 0;
    const pullAir      = p.pullAir      || 0;
    const pulledBarrel = p.pulledBarrel || 0;
    const hardHit      = p.hardHit      || 0;
    const oSwing       = p.oSwing       || 0;
    const bbPct        = p.bbPct        || 0;
    const kPct         = p.kPct         || 0;
    const gamesInWindow = Math.round(w * 0.9);
    const abPerGame = 3.8;
    const atBats    = Math.round(gamesInWindow * abPerGame);
    const hits      = Math.round(atBats * (p.avg || 0));
    const hr        = Math.round(gamesInWindow * (p.hr > 0 ? p.hr / 162 : 0));
    const xbh       = Math.round(hits * 0.28);
    const tb        = hits + xbh + hr * 2;
    const abPerHR   = hr > 0 ? Math.round(atBats / hr * 10) / 10 : 99;
    const abSinceHR = p.daysSinceHR != null ? Math.round(p.daysSinceHR * 3.8) : 99;
    const almostPct = flyBall > 0 ? Math.round(Math.min(flyBall * (avgEV >= T.EV_HH ? 0.45 : 0.3), 35) * 10) / 10 : 0;
    const avg = atBats > 0 ? parseFloat((hits / atBats).toFixed(3)) : 0;
    const wp = { ...p, avgEV, barrel, flyBall, launchAngle, pullAir, oSwing, hardHit, bbPct, kPct, bbkRatio: bbPct / Math.max(kPct, 1) };
    const wos = calcOS(wp); const wgrade = getSG(wos);
    const key = keyMap[w] || `last${w}`;
    windows[key] = {
      avgEV, barrel, flyBall, launchAngle, pullAir, pulledBarrel, oSwing, hardHit,
      bbPct, kPct, hits, hr, xbh, tb, atBats, abPerHR, abSinceHR,
      almostPct, avg, games: gamesInWindow, os: wos, grade: wgrade,
      heatScore: getHS(wp),
    };
  });
  return windows;
}


// ── SEEDED DETERMINISTIC RANDOM ─────────────────────────────
// Replaces seededRand(1540,30) for all player stat generation
// Same pid → same values every time, no flickering on refresh
function seededRand(seed, index) {
  const s = ((seed * 9301) + (49297 * (index + 1))) % 233280;
  return s / 233280;
}
function sr(pid, idx, min, max) {
  return min + seededRand(pid || 1, idx || 0) * (max - min);
}

// ── SEARCH BAR ───────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder = "Search players…" }) {
  return (
    <div style={{position:"relative",flex:1,minWidth:160,maxWidth:300}}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{width:"100%",padding:"6px 10px 6px 30px",background:"var(--surface2)",
          border:"1px solid var(--border)",borderRadius:7,color:"var(--text)",
          fontFamily:"'DM Mono',monospace",fontSize:11,outline:"none",boxSizing:"border-box"}}
      />
      <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",
        fontSize:12,color:"var(--muted)",pointerEvents:"none"}}>🔍</span>
      {value && <button onClick={()=>onChange("")}
        style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",
          background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:12,padding:0}}>✕</button>}
    </div>
  );
}

// ── PICK TYPES + STORE ────────────────────────────────────────
const PICK_TYPES = {
  favorite:  {label:"💣 Favorite",   cls:"favorite",  color:"#ff4020"},
  darkhorse: {label:"⭐ Dark Horse",  cls:"darkhorse", color:"#f5a623"},
  longshot:  {label:"🎯 Longshot",    cls:"longshot",  color:"#38b8f2"},
  daylate:   {label:"📆 Day Late",    cls:"daylate",   color:"#a855f7"},
  due:       {label:"⏳ Due",         cls:"due",        color:"#22d3ee"},
  tailed:    {label:"🤝 Tailed",      cls:"tailed",    color:"#34d399"},
  hotbat:    {label:"🔥 Hot Bat",     cls:"hotbat",    color:"#fb923c"},
  listed:    {label:"🗒️ Listed",      cls:"listed",    color:"#94a3b8"},
  b2b:       {label:"🔁 Back to Back",cls:"b2b",       color:"#fbbf24"},
};
function loadPicks() { try { return JSON.parse(localStorage.getItem("gy_picks")||"{}"); } catch { return {}; } }
function savePicks(p) { try { localStorage.setItem("gy_picks",JSON.stringify(p)); } catch {} }
let GLOBAL_PICKS = loadPicks();
const PICKS_LISTENERS = new Set();
function subscribePicks(fn) { PICKS_LISTENERS.add(fn); return ()=>PICKS_LISTENERS.delete(fn); }
function setPick(pid, name, team, type) {
  pid = String(pid);
  if (GLOBAL_PICKS[pid]?.type===type) { delete GLOBAL_PICKS[pid]; }
  else { GLOBAL_PICKS[pid]={pid,name,team,type,ts:Date.now()}; }
  savePicks(GLOBAL_PICKS);
  PICKS_LISTENERS.forEach(fn=>fn({...GLOBAL_PICKS}));
}
function usePicks() {
  const [picks,setPicksState] = useState({...GLOBAL_PICKS});
  useEffect(()=>subscribePicks(setPicksState),[]);
  return picks;
}

// ── BATTER PROPS — persisted per-batter prop selections ───────
const BATTER_PROP_OPTS = [
  { value:'',    label:'— Prop',  color:'var(--muted)' },
  { value:'HIT', label:'HIT',     color:'#27c97a' },
  { value:'2B+', label:'2 Bases', color:'#38b8f2' },
  { value:'2B',  label:'Double',  color:'#38b8f2' },
  { value:'3B',  label:'Triple',  color:'#f5a623' },
  { value:'RBI', label:'RBI',     color:'#ff8020' },
  { value:'HRR', label:'H+R+R',   color:'var(--accent)' },
  { value:'HR',  label:'HR',      color:'#ff3010' },
];
function loadBatterProps() { try { return JSON.parse(localStorage.getItem("gy_bprops")||"{}"); } catch { return {}; } }
function saveBatterProps(p) { try { localStorage.setItem("gy_bprops",JSON.stringify(p)); } catch {} }
let GLOBAL_BPROPS = loadBatterProps();
const BPROP_LISTENERS = new Set();
function setBatterProp(pid, value) {
  pid = String(pid);
  if (!value) delete GLOBAL_BPROPS[pid];
  else GLOBAL_BPROPS[pid] = value;
  saveBatterProps(GLOBAL_BPROPS);
  BPROP_LISTENERS.forEach(fn => fn({...GLOBAL_BPROPS}));
}
function useBatterProps() {
  const [bprops, setState] = useState({...GLOBAL_BPROPS});
  useEffect(() => { BPROP_LISTENERS.add(setState); return () => BPROP_LISTENERS.delete(setState); }, []);
  return bprops;
}

// ── PICK BUTTON ───────────────────────────────────────────────
function PickButton({pid,name,team}) {
  const picks = usePicks();
  const key = String(pid);
  const current = picks[key]?.type;
  const [open,setOpen] = useState(false);
  const [pos,setPos] = useState({top:0,left:0});
  const btnRef = useRef(null);
  useEffect(()=>{
    if(!open) return;
    const handler = ()=>setOpen(false);
    document.addEventListener('click', handler);
    return ()=>document.removeEventListener('click', handler);
  },[open]);
  const handleOpen = (e) => {
    e.stopPropagation();
    if(!open && btnRef.current){
      const r = btnRef.current.getBoundingClientRect();
      const menuW = 148;
      const menuH = 240; // approx height of the menu
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Horizontal: prefer right-aligned to button, clamp to viewport
      let left = r.right - menuW;
      if (left < 4) left = Math.min(4, r.left);
      if (left + menuW > vw - 4) left = vw - menuW - 4;
      // Vertical: open below by default, flip above if not enough room below
      let top = r.bottom + 4;
      if (top + menuH > vh - 8) top = Math.max(8, r.top - menuH - 4);
      setPos({ top, left });
    }
    setOpen(o=>!o);
  };
  // Portal menu — rendered into document.body so CSS transform on
  // parent slideouts (which break position:fixed) can't clip it
  const menu = open ? ReactDOM.createPortal(
    <div style={{position:'fixed',top:pos.top,left:pos.left,zIndex:99999,
      background:'#0d1318',border:'1px solid var(--border)',borderRadius:8,padding:5,
      display:'flex',flexDirection:'column',gap:3,minWidth:148,
      boxShadow:'0 8px 28px rgba(0,0,0,.85)'}}
      onClick={e=>e.stopPropagation()}>
      {Object.entries(PICK_TYPES).map(([type,cfg])=>(
        <button key={type} onClick={()=>{setPick(pid,name,getTeam(pid,team),type);setOpen(false);}}
          style={{padding:'5px 9px',borderRadius:5,cursor:'pointer',textAlign:'left',
          fontFamily:"'DM Mono',monospace",fontSize:11,
          border:`1px solid ${current===type?cfg.color:'transparent'}`,
          background:current===type?`${cfg.color}20`:'transparent',
          color:current===type?cfg.color:'var(--text)'}}>
          {cfg.label}
        </button>
      ))}
      {current&&<button onClick={()=>{setPick(pid,name,getTeam(pid,team),current);setOpen(false);}}
        style={{padding:'5px 9px',borderRadius:5,cursor:'pointer',textAlign:'left',
        fontFamily:"'DM Mono',monospace",fontSize:11,border:'1px solid transparent',
        background:'transparent',color:'var(--muted)'}}>✕ Remove</button>}
    </div>,
    document.body
  ) : null;

  return (
    <div style={{position:'relative',display:'inline-block'}}>
      <button ref={btnRef} onClick={handleOpen}
        style={{padding:'2px 7px',borderRadius:5,fontSize:10,fontFamily:"'DM Mono',monospace",
        cursor:'pointer',border:`1px solid ${current?PICK_TYPES[current].color:'var(--border)'}`,
        background:current?`${PICK_TYPES[current].color}20`:'var(--surface2)',
        color:current?PICK_TYPES[current].color:'var(--muted)'}}>
        {current?PICK_TYPES[current].label.split(' ')[0]:'＋'}
      </button>
      {menu}
    </div>
  );
}

// ── MY PICKS TAB ──────────────────────────────────────────────

// ── PITCHER TAB ───────────────────────────────────────────────
function PitcherTab() {
  const [year, setYear] = useState('2026');
  const [pitchers, setPitchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState('hr9');
  const [sortDir, setSortDir] = useState(-1);
  const [selPitcher, setSelPitcher] = useState(null);
  const [pitcherDetail, setPitcherDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchOneSeason = async (yr) => {
    // Fetch directly from statsapi - simpler endpoint that actually works
    const url = `https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&gameType=R&season=${yr}&sportId=1&limit=500&hydrate=person,currentTeam`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const splits = data.stats?.[0]?.splits || [];
    return splits
      .filter(l => parseInt(l.stat?.gamesStarted||0) >= 1)
      .map(l => {
        const s = l.stat || {};
        return {
          pid:   l.person?.id,
          name:  l.person?.fullName || '—',
          team:  l.team?.abbreviation || '—',
          hand:  l.person?.pitchHand?.code === 'L' ? 'LHP' : 'RHP',
          era:   s.era   || '—',
          whip:  s.whip  || '—',
          ip:    s.inningsPitched || '0',
          k9:    s.strikeoutsPer9Inn || '—',
          bb9:   s.walksPer9Inn || '—',
          hr9:   parseFloat(s.homeRunsPer9 || 0),
          hr:    parseInt(s.homeRuns || 0),
          hits:  parseInt(s.hits || 0),
          obp:   s.obp   || '—',
          avg:   s.avg   || '—',
          gs:    parseInt(s.gamesStarted || 0),
          season: yr,
        };
      })
      .filter(p => p.pid);
  };

  const load = async (yr) => {
    setLoading(true);
    setPitchers([]);
    setSelPitcher(null);
    try {
      let results = [];
      if (yr === 'all') {
        // Fetch all three seasons and merge, dedup by pid keeping best HR/9
        const [r2024, r2025, r2026] = await Promise.all([
          fetchOneSeason(2024), fetchOneSeason(2025), fetchOneSeason(2026),
        ]);
        const merged = {};
        for (const p of [...r2024, ...r2025, ...r2026]) {
          const key = p.pid;
          if (!merged[key] || (p.hr9||0) > (merged[key].hr9||0)) merged[key] = p;
        }
        results = Object.values(merged);
      } else {
        results = await fetchOneSeason(yr);
      }
      console.log('[PitcherTab] loaded:', results.length, 'pitchers for', yr);
      results.sort((a,b) => (b.hr9||0) - (a.hr9||0));
      setPitchers(results);
    } catch(e) {
      console.warn('[PitcherTab]', e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(year); }, [year]);

  const loadDetail = async (p) => {
    if (!p.pid) return;
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/pitcher?pid=${p.pid}&year=${year}`);
      const data = await res.json();
      setPitcherDetail(data);
    } catch(e) {}
    setLoadingDetail(false);
  };

  const hs = (k) => { if (sortKey===k) setSortDir(d=>-d); else { setSortKey(k); setSortDir(-1); } };

  const sorted = [...pitchers].sort((a,b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1; if (bv == null) return -1;
    if (typeof av === 'string') return sortDir * av.localeCompare(bv);
    return sortDir * (bv - av);
  });

  return <div>
    <div className="hrow">

      {/* Year selector */}
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        {['2024','2025','2026'].map(yr=>(
          <button key={yr}
            className={`chip ${year===yr?'active':''}`}
            onClick={()=>setYear(yr)}
            style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13}}>
            {yr}
          </button>
        ))}
        <button className={`chip ${year==='all'?'active':''}`} onClick={()=>setYear('all')}
          style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13}}>All</button>
      </div>
    </div>

    {loading
      ? <div className="lw"><div className="sp"/><div className="lt">Loading {year} pitcher stats…</div></div>
      : sorted.length === 0
        ? <div style={{padding:'40px',textAlign:'center',color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>No pitcher data available for {year}.</div>
        : <div className="tw-scroll"><div className="tw-scroll-inner"><table style={{width:'100%'}}>
            <thead><tr>
              <th style={{width:24}}>#</th>
              {[
                {key:'name',  label:'Pitcher', tip:'Starting pitcher'},
                {key:'team',  label:'Team',    tip:"Pitcher's team"},
                {key:'hand',  label:'Hand',    tip:'Throws L or R'},
                {key:'gs',    label:'GS',      tip:'Games started'},
                {key:'ip',    label:'IP',      tip:'Innings pitched'},
                {key:'era',   label:'ERA',     tip:'Earned run average'},
                {key:'whip',  label:'WHIP',    tip:'Walks + hits per inning'},
                {key:'hr9',   label:'HR/9',    tip:'Home runs per 9 innings — higher = more hittable'},
                {key:'hr',    label:'HR',      tip:'Home runs allowed'},
                {key:'obp',   label:'OBP',     tip:'Opponent on-base %'},
                {key:'avg',   label:'BAA',     tip:'Batting average against'},
                {key:'k9',    label:'K/9',     tip:'Strikeouts per 9'},
                {key:'bb9',   label:'BB/9',    tip:'Walks per 9'},
                {key:'hits',  label:'H',       tip:'Hits allowed'},
              ].map(c=>(
                <th key={c.key} className={sortKey===c.key?'sk':''} onClick={()=>hs(c.key)} style={{cursor:'pointer'}}>
                  <div style={{display:'flex',alignItems:'center',gap:2}}>
                    <Tip text={c.tip}><span>{c.label}</span></Tip>
                    {sortKey===c.key&&<span style={{color:'var(--accent)'}}>{sortDir<0?'↓':'↑'}</span>}
                  </div>
                </th>
              ))}
            </tr></thead>
            <tbody>
              {sorted.map((p,i)=>{
                const isSelected = selPitcher?.pid === p.pid;
                const hr9C = (p.hr9||0)>=1.5?'hot':(p.hr9||0)>=1.0?'warm':'avg';
                return <>
                  <tr key={p.pid} className={isSelected?'ex':''} style={{cursor:'pointer'}}
                    onClick={()=>{ setSelPitcher(isSelected?null:p); if(!isSelected){setPitcherDetail(null);loadDetail(p);} }}>
                    <td><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,color:i<3?'var(--accent)':'var(--muted)'}}>{i+1}</span></td>
                    <td><div className="pn" style={{fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}
                      onClick={e=>{e.stopPropagation();openPitcherSlide({pid:p.pid,name:p.name,team:p.team,hand:p.hand,pitchMix:[]});}}
                    >{p.name}<span style={{fontSize:10,color:'var(--muted)',opacity:.5}}>›</span></div></td>
                    <td><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,color:'var(--accent2)'}}>{p.team}</span></td>
                    <td><span style={{fontSize:10,fontFamily:"'DM Mono',monospace",padding:'2px 6px',borderRadius:4,background:p.hand==='LHP'?'rgba(56,184,242,.15)':'rgba(232,65,26,.1)',color:p.hand==='LHP'?'var(--ice)':'var(--accent)'}}>{p.hand}</span></td>
                    <td><span className="sv avg">{p.gs}</span></td>
                    <td><span className="sv avg">{p.ip}</span></td>
                    <td><span className={`sv ${parseFloat(p.era)>=5?'hot':parseFloat(p.era)>=4?'warm':'avg'}`}>{p.era}</span></td>
                    <td><span className={`sv ${parseFloat(p.whip)>=1.4?'hot':parseFloat(p.whip)>=1.2?'warm':'avg'}`}>{p.whip}</span></td>
                    <td><span className={`sv ${hr9C}`} style={{fontWeight:700}}>{p.hr9>0?p.hr9.toFixed(2):'—'}</span></td>
                    <td><span className={`sv ${p.hr>=10?'hot':p.hr>=5?'warm':'avg'}`}>{p.hr}</span></td>
                    <td><span className={`sv ${parseFloat(p.obp)>=0.360?'hot':parseFloat(p.obp)>=0.320?'warm':'avg'}`}>{p.obp}</span></td>
                    <td><span className={`sv ${parseFloat(p.avg)>=0.280?'hot':parseFloat(p.avg)>=0.250?'warm':'avg'}`}>{p.avg}</span></td>
                    <td><span className={`sv ${parseFloat(p.k9)>=9?'good':parseFloat(p.k9)>=7?'avg':'cold'}`}>{p.k9}</span></td>
                    <td><span className={`sv ${parseFloat(p.bb9)>=3.5?'hot':parseFloat(p.bb9)>=2.5?'warm':'avg'}`}>{p.bb9}</span></td>
                    <td><span className="sv avg">{p.hits}</span></td>
                  </tr>
                  {isSelected && <tr key={p.pid+'-detail'} className="xr">
                    <td colSpan={15} style={{padding:'14px 20px',background:'var(--surface2)'}}>
                      {loadingDetail
                        ? <div style={{display:'flex',alignItems:'center',gap:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:11}}><div className="sp" style={{width:14,height:14,borderWidth:2}}/> Loading pitch mix…</div>
                        : pitcherDetail?.pitchMix?.length > 0
                          ? <div>
                              <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Pitch Arsenal — {p.name} ({year})</div>
                              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                                {pitcherDetail.pitchMix.map(pitch=>(
                                  <div key={pitch.name} style={{background:'var(--surface)',border:"1px solid " + (pitch.color||"var(--border)") + "40",borderRadius:8,padding:'10px 14px',minWidth:120}}>
                                    <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,color:pitch.color||'var(--text)'}}>{pitch.name}</div>
                                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:700,color:'var(--text)',margin:'4px 0'}}>{pitch.pct?.toFixed(1)}%</div>
                                    <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>
                                      {pitch.velo>0&&<div>{pitch.velo} mph</div>}
                                      {pitch.whiffPct>0&&<div>Whiff: {pitch.whiffPct.toFixed(1)}%</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          : <div style={{color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:11}}>No pitch mix data available for {p.name} in {year}.</div>
                      }
                    </td>
                  </tr>}
                </>;
              })}
            </tbody>
          </table></div></div>
    }
  </div>;
}


function ClearButton() {
  const [open, setOpen] = useState(false);
  const bprops = useBatterProps();
  const hasProps = Object.keys(bprops).length > 0;
  const clearPicks = () => {
    Object.keys(GLOBAL_PICKS).forEach(k=>delete GLOBAL_PICKS[k]);
    savePicks(GLOBAL_PICKS);
    PICKS_LISTENERS.forEach(fn=>fn({...GLOBAL_PICKS}));
  };
  const clearProps = () => {
    Object.keys(GLOBAL_BPROPS).forEach(k=>delete GLOBAL_BPROPS[k]);
    saveBatterProps(GLOBAL_BPROPS);
    BPROP_LISTENERS.forEach(fn=>fn({...GLOBAL_BPROPS}));
  };
  return (
    <div style={{position:'relative',display:'inline-flex',flexShrink:0}}>
      <button onClick={clearPicks}
        style={{padding:"5px 10px",borderRadius:"6px 0 0 6px",
          background:"rgba(232,65,26,.1)",border:"1px solid rgba(232,65,26,.3)",
          borderRight:'none',color:"var(--accent)",cursor:"pointer",
          fontFamily:"'DM Mono',monospace",fontSize:11}}>
        ✕ Clear Picks
      </button>
      <button onClick={()=>setOpen(o=>!o)}
        style={{padding:"5px 8px",borderRadius:"0 6px 6px 0",
          background:"rgba(232,65,26,.1)",border:"1px solid rgba(232,65,26,.3)",
          color:"var(--accent)",cursor:"pointer",fontSize:11,lineHeight:1}}>
        ▾
      </button>
      {open && <>
        <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:9998}}/>
        <div style={{position:'absolute',top:'calc(100% + 4px)',right:0,zIndex:9999,
          background:'#0d1318',border:'1px solid rgba(232,65,26,.3)',borderRadius:8,
          padding:5,display:'flex',flexDirection:'column',gap:3,minWidth:160,
          boxShadow:'0 8px 24px rgba(0,0,0,.7)'}}>
          <button onClick={()=>{clearPicks();setOpen(false);}}
            style={{padding:'7px 12px',borderRadius:5,cursor:'pointer',textAlign:'left',
              fontFamily:"'DM Mono',monospace",fontSize:11,
              border:'1px solid transparent',background:'transparent',color:'var(--accent)'}}>
            ✕ Clear Picks only
          </button>
          <button onClick={()=>{clearProps();setOpen(false);}}
            style={{padding:'7px 12px',borderRadius:5,cursor:'pointer',textAlign:'left',
              fontFamily:"'DM Mono',monospace",fontSize:11,
              border:'1px solid transparent',background:'transparent',
              color:'#f5a623',opacity:hasProps?1:.4,cursor:hasProps?'pointer':'default'}}>
            ✕ Clear Props only
          </button>
          <div style={{borderTop:'1px solid var(--border)',margin:'3px 0'}}/>
          <button onClick={()=>{clearPicks();clearProps();setOpen(false);}}
            style={{padding:'7px 12px',borderRadius:5,cursor:'pointer',textAlign:'left',
              fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,
              border:'1px solid transparent',background:'transparent',color:'var(--text)'}}>
            ✕ Clear Both
          </button>
        </div>
      </>}
    </div>
  );
}

function openBetSlip(picks, bprops) {
  const pickList = Object.values(picks).sort((a,b)=>a.type.localeCompare(b.type));
  const today = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});

  // State
  const slipState = {}; // pid -> { checked, prop }
  pickList.forEach(p => {
    const existing = bprops[String(p.pid)] || '';
    slipState[p.pid] = { checked: !!existing, prop: existing };
  });

  let activeTypeFilter = 'all'; // tracks which category pill is active

  // Overlay — scrollable on mobile
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px 12px 32px';

  const container = document.createElement('div');
  container.style.cssText = 'max-width:420px;margin:0 auto;display:flex;flex-direction:column;gap:10px';
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  const close = () => { if(document.body.contains(overlay)) document.body.removeChild(overlay); };
  overlay.addEventListener('click', e => { if(e.target===overlay) close(); });

  // ── PHASE 1: BUILDER ───────────────────────────────────────────
  function renderBuilder() {
    container.innerHTML = '';

    // Header
    const hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:4px 0 8px';
    hdr.innerHTML = '<div style="font-family:Oswald,sans-serif;font-weight:800;font-size:16px;color:#ff4020;letter-spacing:1px">📸 BUILD SLIP</div>'+
      '<button id="gy-close-btn" style="background:none;border:1px solid rgba(255,255,255,.15);border-radius:6px;color:rgba(255,255,255,.65);cursor:pointer;padding:4px 10px;font-size:11px;font-family:DM Mono,monospace">✕</button>';
    container.appendChild(hdr);
    hdr.querySelector('#gy-close-btn').addEventListener('click', close);

    const hint = document.createElement('div');
    hint.textContent = 'Check batters to include · set a prop for each one';
    hint.style.cssText = 'font-size:10px;color:rgba(255,255,255,.6);font-family:DM Mono,monospace;padding-bottom:6px';
    container.appendChild(hint);

    // ── Toolbar: Select All + category filter pills ──────────────
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:6px 0 8px;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:8px';

    // Select All / Deselect All button
    const selAllBtn = document.createElement('button');
    const visiblePicks = () => activeTypeFilter === 'all'
      ? pickList
      : pickList.filter(p => p.type === activeTypeFilter);
    const allVisible  = () => visiblePicks().every(p => slipState[p.pid].checked);
    const updateSelAllBtn = () => {
      const all = allVisible();
      selAllBtn.textContent = all ? '☐ Deselect All' : '☑ Select All';
      selAllBtn.style.background = all ? 'rgba(255,255,255,.06)' : 'rgba(255,96,24,.15)';
      selAllBtn.style.borderColor = all ? 'rgba(255,255,255,.2)' : 'rgba(255,96,24,.4)';
      selAllBtn.style.color = all ? 'rgba(255,255,255,.5)' : '#ff6018';
    };
    selAllBtn.style.cssText = 'padding:4px 10px;border-radius:6px;border:1px solid rgba(255,96,24,.4);background:rgba(255,96,24,.15);color:#ff6018;font-family:DM Mono,monospace;font-size:10px;font-weight:700;cursor:pointer;flex-shrink:0';
    selAllBtn.addEventListener('click', () => {
      const shouldCheckAll = !allVisible();
      visiblePicks().forEach(p => {
        slipState[p.pid].checked = shouldCheckAll;
      });
      renderBuilder();
    });
    toolbar.appendChild(selAllBtn);

    // Spacer
    const sp = document.createElement('div');
    sp.style.cssText = 'flex:1;min-width:4px';
    toolbar.appendChild(sp);

    // Category filter pills — one per type present in pickList
    const typesPresent = [...new Set(pickList.map(p => p.type))];
    ['all', ...typesPresent].forEach(type => {
      const cfg = type === 'all' ? { label: '🗂 All', color: 'rgba(255,255,255,.5)' } : (PICK_TYPES[type] || {});
      const pill = document.createElement('button');
      const isActive = activeTypeFilter === type;
      const col = cfg.color || '#888';
      pill.textContent = type === 'all' ? '🗂 All' : (cfg.label || type);
      pill.style.cssText = `padding:3px 9px;border-radius:20px;border:1px solid ${isActive ? col : 'rgba(255,255,255,.1)'};background:${isActive ? col+'25' : 'transparent'};color:${isActive ? col : 'rgba(255,255,255,.3)'};font-family:DM Mono,monospace;font-size:10px;font-weight:${isActive?700:400};cursor:pointer;white-space:nowrap`;
      pill.addEventListener('click', () => {
        activeTypeFilter = type;
        renderBuilder();
      });
      toolbar.appendChild(pill);
    });

    container.appendChild(toolbar);
    updateSelAllBtn();

    // Batter rows — filtered by activeTypeFilter
    const filteredList = activeTypeFilter === 'all'
      ? pickList
      : pickList.filter(p => p.type === activeTypeFilter);

    filteredList.forEach(p => {
      const cfg  = PICK_TYPES[p.type] || {};
      const col  = cfg.color || '#888';
      const ini  = (p.name||'').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
      const st   = slipState[p.pid];

      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;background:'+(st.checked?'rgba(255,255,255,.06)':'rgba(255,255,255,.02)')+';border:1px solid '+(st.checked?col+'50':'rgba(255,255,255,.08)')+';transition:all .15s';

      // Checkbox
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = st.checked;
      cb.style.cssText = 'width:16px;height:16px;flex-shrink:0;cursor:pointer;accent-color:'+col;
      cb.addEventListener('change', () => {
        st.checked = cb.checked;
        row.style.background = st.checked ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.02)';
        row.style.border = '1px solid '+(st.checked ? col+'50' : 'rgba(255,255,255,.08)');
        updatePreviewBtn();
      });

      // Avatar — MLB headshot with initials fallback
      const cleanPid = p.pid ? String(parseInt(p.pid)||0) : '0';
      const av = document.createElement('div');
      av.style.cssText = 'width:30px;height:30px;border-radius:50%;flex-shrink:0;overflow:hidden;border:1px solid '+col+'50;flex-shrink:0';
      if (cleanPid !== '0') {
        const img = document.createElement('img');
        img.src = 'https://img.mlbstatic.com/mlb-photos/image/upload/w_180,q_auto:best/v1/people/'+cleanPid+'/headshot/67/current';
        img.style.cssText = 'width:100%;height:160%;object-fit:cover;object-position:center 28%;margin-top:-18%';
        img.onerror = () => { av.removeChild(img); av.textContent = ini; av.style.cssText += ';display:flex;align-items:center;justify-content:center;font-family:Oswald,sans-serif;font-weight:700;font-size:10px;color:'+col+';background:'+col+'22'; };
        av.appendChild(img);
      } else {
        av.textContent = ini;
        av.style.cssText = 'width:30px;height:30px;border-radius:50%;flex-shrink:0;background:'+col+'22;border:1px solid '+col+'50;display:flex;align-items:center;justify-content:center;font-family:Oswald,sans-serif;font-weight:700;font-size:10px;color:'+col;
      }

      // Name + type
      const info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0';
      info.innerHTML = '<div style="font-family:Oswald,sans-serif;font-weight:700;font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</div>'+
        '<div style="font-size:9px;color:'+col+';font-weight:700">'+(cfg.label?cfg.label.split(' ').slice(1).join(' '):'')+'</div>';

      // Prop selector
      const sel = document.createElement('select');
      sel.style.cssText = 'padding:4px 6px;border-radius:6px;background:#0d1117;border:1px solid rgba(255,255,255,.15);color:#fff;font-size:11px;font-family:DM Mono,monospace;cursor:pointer;flex-shrink:0;max-width:90px';
      BATTER_PROP_OPTS.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        if(o.value === st.prop) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', () => {
        st.prop = sel.value;
        if(sel.value && !st.checked) { cb.checked = true; st.checked = true; row.style.background='rgba(255,255,255,.06)'; row.style.border='1px solid '+col+'50'; }
        updatePreviewBtn();
      });

      row.appendChild(cb);
      row.appendChild(av);
      row.appendChild(info);
      row.appendChild(sel);
      container.appendChild(row);
    });

    // Preview button
    const previewBtn = document.createElement('button');
    previewBtn.id = 'gy-preview-btn';
    previewBtn.style.cssText = 'padding:13px;border-radius:10px;border:none;background:#ff6018;color:white;font-size:14px;font-weight:700;cursor:pointer;font-family:Oswald,sans-serif;letter-spacing:1px;width:100%;margin-top:6px;opacity:0.4';
    previewBtn.textContent = '👁 Preview Slip';
    previewBtn.disabled = true;
    previewBtn.addEventListener('click', renderPreview);
    container.appendChild(previewBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✕ Cancel';
    cancelBtn.style.cssText = 'background:none;border:1px solid rgba(255,255,255,.1);border-radius:8px;color:rgba(255,255,255,.55);cursor:pointer;padding:8px;font-family:DM Mono,monospace;font-size:11px;width:100%';
    cancelBtn.addEventListener('click', close);
    container.appendChild(cancelBtn);

    updatePreviewBtn();
  }

  function updatePreviewBtn() {
    const btn = document.getElementById('gy-preview-btn');
    if(!btn) return;
    const anyChecked = pickList.some(p => slipState[p.pid].checked);
    btn.disabled = !anyChecked;
    btn.style.opacity = anyChecked ? '1' : '0.4';
    btn.style.cursor = anyChecked ? 'pointer' : 'not-allowed';
    const n = pickList.filter(p=>slipState[p.pid].checked).length;
    btn.textContent = anyChecked ? '👁 Preview Slip ('+n+' pick'+(n!==1?'s':'')+')'  : '👁 Preview Slip';
  }

  // ── PHASE 2: PREVIEW ──────────────────────────────────────────
  function renderPreview() {
    const selected = pickList.filter(p => slipState[p.pid].checked);
    container.innerHTML = '';

    // Back button
    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back';
    backBtn.style.cssText = 'background:none;border:none;color:rgba(255,255,255,.65);cursor:pointer;padding:4px 0;font-family:DM Mono,monospace;font-size:11px;text-align:left;width:fit-content';
    backBtn.addEventListener('click', renderBuilder);
    container.appendChild(backBtn);

    // Slip card (screenshot target)
    const slipRows = selected.map(p => {
      const cfg     = PICK_TYPES[p.type] || {};
      const propVal = slipState[p.pid].prop;
      const propOpt = propVal ? BATTER_PROP_OPTS.find(o=>o.value===propVal) : null;
      const dp      = DAILY_PICKS_CACHE[String(p.pid)];
      const myTeam  = (dp && dp.batting_team) || p.team || '';
      const gid     = (dp && dp._gid) || '';
      const teams   = gid ? [...(DAILY_GAME_MAP[gid]||[])] : [];
      const opp     = teams.find(t=>t!==myTeam) || '';
      const matchup = opp ? myTeam+' vs '+opp : myTeam;
      const gt      = (dp && dp.game_time) || '';
      const col     = cfg.color || '#555555';
      const ini     = (p.name||'').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
      const spid    = p.pid ? String(parseInt(p.pid)||0) : '0';
      const avatarHtml = spid !== '0'
        ? '<div style="width:32px;height:32px;border-radius:50%;flex-shrink:0;overflow:hidden;border:1px solid '+col+'50"><img src="https://img.mlbstatic.com/mlb-photos/image/upload/w_180,q_auto:best/v1/people/'+spid+'/headshot/67/current" style="width:100%;height:160%;object-fit:cover;object-position:center 28%;margin-top:-18%" onerror="this.parentNode.innerHTML=\''+ini+'\'"/></div>'
        : '<div style="width:32px;height:32px;border-radius:50%;flex-shrink:0;background:'+col+'22;border:1px solid '+col+'50;display:flex;align-items:center;justify-content:center;font-family:Oswald,sans-serif;font-weight:700;font-size:11px;color:'+col+'">'+ini+'</div>';
      const propHtml = propOpt ? '<div style="padding:2px 8px;border-radius:5px;margin-bottom:3px;background:'+(propOpt.color||'#888')+'22;border:1px solid '+(propOpt.color||'#888')+'50;font-size:10px;font-weight:700;color:'+(propOpt.color||'#888')+'">'+propOpt.label+'</div>' : '';
      const typeLabel = cfg.label ? cfg.label.split(' ').slice(1).join(' ') : '';
      return '<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;margin-bottom:6px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid '+col+'50;border-left:3px solid '+col+'">'+
        avatarHtml+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-family:Oswald,sans-serif;font-weight:700;font-size:14px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</div>'+
          '<div style="font-size:9px;color:rgba(255,255,255,.65);margin-top:1px">'+matchup+(gt?' · '+gt:'')+'</div>'+
        '</div>'+
        '<div style="text-align:right;flex-shrink:0">'+propHtml+'<div style="font-size:9px;color:'+col+';font-weight:700">'+typeLabel+'</div></div>'+
      '</div>';
    }).join('');

    const slipCard = document.createElement('div');
    slipCard.id = 'gy-slip';
    slipCard.style.cssText = 'background:#0d1117;border:1px solid #1e2d3a;border-radius:14px;padding:20px 18px;font-family:DM Mono,monospace';
    slipCard.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'+
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<span style="font-size:20px">💣</span>'+
          '<div><div style="font-family:Oswald,sans-serif;font-weight:800;font-size:18px;color:#ff4020;letter-spacing:1px">GOING YARD</div>'+
          '<div style="font-size:9px;color:#38b8f2;letter-spacing:2px">goingyard.app</div></div>'+
        '</div>'+
        '<div style="text-align:right">'+
          '<div style="font-size:10px;color:rgba(255,255,255,.65)">Bet Slip</div>'+
          '<div style="font-size:10px;color:rgba(255,255,255,.65)">'+today+'</div>'+
        '</div>'+
      '</div>'+
      '<div style="height:1px;background:rgba(255,64,32,.25);margin-bottom:14px"></div>'+
      slipRows+
      '<div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between">'+
        '<div style="font-size:8px;color:rgba(255,255,255,.2);letter-spacing:1px">'+selected.length+' PICK'+(selected.length!==1?'S':'')+'</div>'+
        '<div style="font-size:8px;color:rgba(255,255,255,.2);letter-spacing:1px">FOR ENTERTAINMENT PURPOSES ONLY</div>'+
      '</div>';
    container.appendChild(slipCard);

    // Helper: render slip to canvas, then call cb(blob)
    function getSlipBlob(cb, statusEl) {
      statusEl.textContent = '📸 Capturing…';
      const el = document.getElementById('gy-slip');
      function doCapture() {
        window.html2canvas(el, {backgroundColor:'#0d1117',scale:2,useCORS:true,logging:false})
          .then(canvas => canvas.toBlob(blob => cb(blob), 'image/png'))
          .catch(() => { statusEl.textContent = '✗ Capture failed'; });
      }
      if(!window.html2canvas) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = doCapture;
        s.onerror = () => { statusEl.textContent = '✗ Load failed'; };
        document.head.appendChild(s);
      } else { doCapture(); }
    }

    // Two-button row
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;width:100%';

    // ① Download button
    const dlBtn = document.createElement('button');
    dlBtn.textContent = '⬇ Download';
    dlBtn.style.cssText = 'flex:1;padding:11px 6px;border-radius:9px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:Oswald,sans-serif;letter-spacing:.5px';
    dlBtn.addEventListener('click', () => {
      dlBtn.disabled = true;
      getSlipBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'going-yard-slip.png'; a.click();
        URL.revokeObjectURL(url);
        dlBtn.textContent = '✓ Saved!';
        dlBtn.style.background = 'rgba(39,201,122,.25)';
        dlBtn.style.borderColor = '#27c97a';
        dlBtn.style.color = '#27c97a';
        setTimeout(() => { dlBtn.textContent = '⬇ Download'; dlBtn.style.cssText = 'flex:1;padding:11px 6px;border-radius:9px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:Oswald,sans-serif;letter-spacing:.5px'; dlBtn.disabled = false; }, 2000);
      }, dlBtn);
    });

    // ② Open Gambly button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '🎰 Open Gambly';
    copyBtn.style.cssText = 'flex:1;padding:11px 6px;border-radius:9px;border:none;background:#ff6018;color:white;font-size:12px;font-weight:700;cursor:pointer;font-family:Oswald,sans-serif;letter-spacing:.5px';
    copyBtn.addEventListener('click', () => {
      window.open('https://gambly.com', '_blank');
    });

    btnRow.appendChild(dlBtn);
    btnRow.appendChild(copyBtn);
    container.appendChild(btnRow);

    const note = document.createElement('div');
    note.textContent = 'Download slip · then paste into Gambly to get your share link';
    note.style.cssText = 'text-align:center;font-size:10px;color:rgba(255,255,255,.55);font-family:DM Mono,monospace';
    container.appendChild(note);
  }

  renderBuilder();
}


function PickRow({p, bprops}) {
    const cfg = PICK_TYPES[p.type];
    const propVal = bprops[String(p.pid)];
    const propOpt = propVal ? BATTER_PROP_OPTS.find(o=>o.value===propVal) : null;
    return <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderBottom:"1px solid rgba(30,45,58,.4)"}}>
      {/* Avatar */}
      <div onClick={()=>openAtBatSlide(p)} style={{cursor:"pointer",flexShrink:0}}>
        <PlayerAvatar pid={p.pid} name={p.name} size={32} border={"2px solid "+cfg.color}/>
      </div>

      {/* Name + team — clickable, grade-colored from DAILY_PICKS_CACHE */}
      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>openAtBatSlide(p)}>
        {(() => {
          const dp = DAILY_PICKS_CACHE[String(p.pid)] || null;
          const gc = dp?.grade ? (GRADE_CFG[dp.grade] || null) : null;
          return <>
            <div style={{fontWeight:700,fontSize:11,whiteSpace:"nowrap",overflow:"hidden",
              textOverflow:"ellipsis",letterSpacing:.2,
              color: gc ? gc.color : 'var(--text)'}}>{p.name}</div>
            <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",display:"flex",gap:5,alignItems:"center",marginTop:1}}>
              <span style={{color:"var(--accent2)",fontWeight:700}}>{getTeam(p.pid, p.team)}</span>
              {gc && !INJURY_MAP[String(p.pid||'')] && <span style={{padding:'0px 4px',borderRadius:3,fontSize:8,fontWeight:800,
                background:gc.bg,color:gc.color,border:`1px solid ${gc.border}`}}>{dp.grade}</span>}
            </div>
          </>;
        })()}
      </div>

      {/* Prop dropdown */}
      <select
        value={propVal}
        onChange={e=>{e.stopPropagation();setBatterProp(p.pid,e.target.value);}}
        onClick={e=>e.stopPropagation()}
        style={{
          padding:'3px 5px',flexShrink:0,
          background: propVal ? 'rgba(0,0,0,.35)' : 'var(--surface2)',
          border:"1px solid " + (propVal ? (propOpt?.color||"var(--border)") : "var(--border)"),
          borderRadius:6,
          color: propVal ? (propOpt?.color||'var(--text)') : 'var(--muted)',
          fontFamily:"'DM Mono',monospace",fontSize:10,
          fontWeight:propVal?700:400,cursor:'pointer',outline:'none',minWidth:60,
        }}>
        {BATTER_PROP_OPTS.map(o=>(
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Pick type switcher — single compact dropdown */}
      <select value={p.type} onChange={e=>setPick(p.pid,p.name,p.team,e.target.value)}
        style={{
          padding:'3px 6px', borderRadius:6, cursor:'pointer', outline:'none',
          border:"1px solid " + (PICK_TYPES[p.type]?.color||"var(--border)"),
          background:(PICK_TYPES[p.type]?.color||"transparent") + "18",
          color:PICK_TYPES[p.type]?.color||'var(--muted)',
          fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:700,
          flexShrink:0,
        }}>
        {Object.entries(PICK_TYPES).map(([type,c])=>(
          <option key={type} value={type}>{c.label.split(' ')[0]}</option>
        ))}
      </select>

      {/* Remove */}
      <button onClick={()=>setPick(p.pid,p.name,p.team,p.type)}
        style={{background:"none",border:"1px solid var(--border)",borderRadius:5,
          color:"var(--muted)",cursor:"pointer",padding:"2px 7px",fontSize:10,flexShrink:0}}>✕</button>
    </div>;
  };
function MyPicksTab() {
  const picks = usePicks();
  const bprops = useBatterProps();
  const [selPlayer,setSelPlayer] = useState(null);
  const pickList = Object.values(picks).sort((a,b)=>a.type.localeCompare(b.type));
  const grouped = {
    favorite:  pickList.filter(p=>p.type==="favorite"),
    darkhorse: pickList.filter(p=>p.type==="darkhorse"),
    longshot:  pickList.filter(p=>p.type==="longshot"),
    daylate:   pickList.filter(p=>p.type==="daylate"),
    due:       pickList.filter(p=>p.type==="due"),
    tailed:    pickList.filter(p=>p.type==="tailed"),
    hotbat:    pickList.filter(p=>p.type==="hotbat"),
  };

  return <div>

    {pickList.length>0&&<div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:12,flexWrap:'wrap'}}>
      <button onClick={()=>openBetSlip(picks, bprops)}
        style={{padding:"5px 12px",borderRadius:6,
          background:"rgba(255,100,20,.18)",
          border:"1px solid rgba(255,128,32,.4)",color:"#ff8020",cursor:"pointer",
          fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700}}>
        📸 Get Slip
      </button>
      <button onClick={()=>{
        const rows = [["Pick Type","Team","Batter Name","Prop","Game Time","Matchup"]];
        pickList.forEach(p=>{
          const cfg = PICK_TYPES[p.type];
          const typeName = (cfg && cfg.label) ? cfg.label.split(" ").slice(1).join(" ") : p.type;
          const propVal = GLOBAL_BPROPS[String(p.pid)] || "";
          const propOpt = propVal ? BATTER_PROP_OPTS.find(o=>o.value===propVal) : null;
          const dp       = DAILY_PICKS_CACHE[String(p.pid)] || null;
          const gameTime = (dp && dp.game_time) || '—';
          const myTeam   = (dp && dp.batting_team) || p.team || '—';
          const gid      = (dp && dp._gid) || '';
          const teams    = gid ? [...(DAILY_GAME_MAP[gid] || [])] : [];
          const opponent = teams.find(t => t !== myTeam) || '—';
          const matchup  = opponent !== '—' ? myTeam+" vs "+opponent : '—';
          rows.push([typeName, p.team||"-", p.name||"-", (propOpt && propOpt.label)||"", gameTime, matchup]);
        });
        const csv = rows.map(r=>r.map(c=>'"'+c+'"').join(",")).join("\n");
        const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href=url; a.download="my-picks.csv"; a.click();
        URL.revokeObjectURL(url);
      }} style={{padding:"5px 12px",borderRadius:6,background:"rgba(56,184,242,.1)",
        border:"1px solid rgba(56,184,242,.3)",color:"var(--ice)",cursor:"pointer",
        fontFamily:"'DM Mono',monospace",fontSize:11}}>⬇ Export CSV</button>
      <ClearButton/>
    </div>}
    <div style={{marginBottom:14,padding:'12px 14px',background:'var(--surface)',
      border:'1px solid var(--border)',borderRadius:10}}>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',
        textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Pick Type Legend</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:'2px 20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:5,minWidth:200,marginBottom:2}}>
          <span style={{fontSize:13}}>💣</span>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,color:'#ff4020',minWidth:78}}>Favorite</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',lineHeight:1.4}}>Your highest-confidence play today</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:5,minWidth:200,marginBottom:2}}>
          <span style={{fontSize:13}}>⭐</span>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,color:'#f5a623',minWidth:78}}>Dark Horse</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',lineHeight:1.4}}>Good matchup, flying under the radar</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:5,minWidth:200,marginBottom:2}}>
          <span style={{fontSize:13}}>🎯</span>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,color:'#38b8f2',minWidth:78}}>Longshot</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',lineHeight:1.4}}>Higher risk, higher reward</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:5,minWidth:200,marginBottom:2}}>
          <span style={{fontSize:13}}>📆</span>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,color:'#a855f7',minWidth:78}}>Day Late</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',lineHeight:1.4}}>Missed it yesterday — doubling down</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:5,minWidth:200,marginBottom:2}}>
          <span style={{fontSize:13}}>⏳</span>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,color:'#22d3ee',minWidth:78}}>Due</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',lineHeight:1.4}}>Overdue based on HR rate — variance play</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:5,minWidth:200,marginBottom:2}}>
          <span style={{fontSize:13}}>🤝</span>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,color:'#34d399',minWidth:78}}>Tailed</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',lineHeight:1.4}}>Picked up from someone else's card</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:5,minWidth:200,marginBottom:2}}>
          <span style={{fontSize:13}}>🔥</span>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,color:'#fb923c',minWidth:78}}>Hot Bat</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',lineHeight:1.4}}>On a tear — riding the hot hand</span>
        </div>
      </div>
    </div>
    {pickList.length===0
      ? <div style={{padding:"60px 20px",textAlign:"center",color:"var(--muted)",fontFamily:"'DM Mono',monospace",fontSize:12,lineHeight:2}}>
          No picks yet.<br/>Click the <strong style={{color:"var(--text)"}}>＋</strong> button next to any batter on Pregame or Scouting tabs.
        </div>
      : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
          {Object.entries(grouped).map(([type,players])=>{
            if(players.length===0) return null;
            const cfg=PICK_TYPES[type];
            const cfgColor = cfg.color || '#888';
            const cfgEmoji = cfg.label ? cfg.label.split(" ")[0] : '';
            const cfgName  = cfg.label ? cfg.label.split(" ").slice(1).join(" ").toUpperCase() : type.toUpperCase();
            return <div key={type} style={{background:"var(--surface)",border:"1px solid "+cfgColor+"30",borderRadius:10,overflow:"hidden"}}>
              <div style={{padding:"10px 14px",background:cfgColor+"10",borderBottom:"1px solid "+cfgColor+"20",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>{cfgEmoji}</span>
                <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,color:cfgColor,letterSpacing:1}}>{cfgName}</span>
                <span style={{marginLeft:"auto",fontFamily:"'DM Mono',monospace",fontSize:11,color:"var(--muted)"}}>{players.length} batter{players.length!==1?"s":""}</span>
              </div>
              {players.map(p=><PickRow key={p.pid} p={p} bprops={bprops}/>)}
            </div>;
          })}
        </div>
    }
  </div>;
}

// ── GLOBAL AT-BAT SLIDE-IN ────────────────────────────────────
// Single global state — any page can trigger it
let AB_SLIDE_LISTENER = null;
let PITCHER_SLIDE_LISTENER = null;
function openPitcherSlide(pitcher) { if (PITCHER_SLIDE_LISTENER) PITCHER_SLIDE_LISTENER(pitcher); }

function openAtBatSlide(player) {
  if (AB_SLIDE_LISTENER) AB_SLIDE_LISTENER(player);
}


function MatchupCard({ dp }) {
  const [open, setOpen] = React.useState(false);
  const mono = "'DM Mono',monospace";
  const osw  = "'Oswald',sans-serif";

  // ── pgLabel FIRST — needed by sig formula below ──────────────────────────
  // Uses AM/SLSR computed _pgLabel if available, else derives from engine vuln fields
  const pgLabel = dp._pgLabel || (() => {
    const brl = parseFloat(dp.pitcher_barrel_pct_allowed)||0;
    const hh  = parseFloat(dp.pitcher_hh_pct_allowed)||0;
    const mb  = parseFloat(dp.pitcher_meatball_pct)||0;
    if (brl >= 9  || (hh >= 35 && mb >= 55)) return '🎯 Target';
    if (brl >= 6  || hh >= 30)               return '💥 Hittable';
    if (brl <= 2  && hh <= 22 && mb <= 45)   return '‼️ Elite';
    if (brl <= 3  && hh <= 24)               return '⚠️ Tough';
    return '🤔 Average';
  })();

  // ── Sig: use AM/SLSR computed value if available, else approximate ────────
  const sig = (() => {
    if (dp._trackerSig) return parseFloat(dp._trackerSig);
    let s = 0;
    const tb = parseFloat(dp.sim_tb)||0;
    const ev = parseFloat(dp.recent_avg_ev)||0;
    const brl= parseFloat(dp.recent_barrel_pct)||0;
    const fb = parseFloat(dp.recent_fb_pct)||0;
    const la = parseFloat(dp.recent_avg_la)||0;
    if (tb>=2.5&&tb<3) s+=3; else if(tb>=2.0) s+=2; else if(tb>=1.5) s+=1;
    if (tb>=3.0) s-=1;
    if (pgLabel.includes('Target')) s+=2; else if(pgLabel.includes('Hittable')) s+=1;
    else if(pgLabel.includes('Elite')) s-=1;
    if (ev>=103) s+=2; else if(ev>=97) s+=1;
    if (la>=22&&la<=32) s+=2; else if(la>=18) s+=1;
    if (brl>=10) s+=2; else if(brl>=6) s+=1;
    if (fb>=35) s+=1;
    // Pulled barrel — 3-4x more important than pulled FB
    const pbrl = parseFloat(dp.recent_pulled_barrel_pct||0);
    const pfb  = parseFloat(dp.recent_pulled_fb_pct||0);
    if (pbrl>=12) s+=3; else if(pbrl>=8) s+=2; else if(pbrl>=5) s+=1;
    // Pulled FB — directional signal, smaller weight
    if (pfb>=40) s+=1;
    // Surprise power: HR production outrunning barrel/LA profile
    const hrRate = parseFloat(dp.recent_hr_rate||0);
    if (hrRate>=0.05 && pbrl<8 && (parseFloat(dp.recent_iso||0))<0.200) s+=1;
    return Math.min(14, Math.max(0, s));
  })();

  const boom = parseFloat(dp._boom) || computeBoomScore(sig, parseFloat(dp.zone_fit)||0, parseFloat(dp.recent_iso)||0, parseFloat(dp.sim_tb)||0, parseFloat(dp.weighted_flag_score)||0);
  const iso  = parseFloat(dp.recent_iso) || 0;
  const zf   = parseFloat(dp.zone_fit) || 0;
  const ghr  = parseFloat(dp.gHR) || 0;
  const simTB= parseFloat(dp.sim_tb) || 0;
  const ev   = parseFloat(dp.recent_avg_ev) || 0;
  const brl  = parseFloat(dp.recent_barrel_pct) || 0;
  const fb   = parseFloat(dp.recent_fb_pct) || 0;
  const la   = parseFloat(dp.recent_avg_la) || 0;
  const pgColor = pgLabel.includes('Target')?'#27c97a':pgLabel.includes('Hittable')?'#60d360':pgLabel.includes('Average')?'#f5a623':pgLabel.includes('Tough')||pgLabel.includes('Elite')?'#ff4020':'var(--muted)';
  const formKey = getFormClass(dp);
  const fc = formKey && FORM_CLASSES[formKey];
  const sigColor = sig>=10?'#ff4020':sig>=7?'#f5a623':sig>=4?'#27c97a':'var(--muted)';
  const boomColor = boom>=70?'#ff4020':boom>=50?'#f5a623':boom>=30?'#27c97a':'var(--muted)';
  return (
    <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1}}>
          📊 Today's Matchup
        </div>
        <button onClick={()=>setOpen(o=>!o)}
          style={{fontFamily:mono,fontSize:8,color:'var(--accent2)',background:'none',border:'none',cursor:'pointer',letterSpacing:.5}}>
          {open?'▲ Less':'▼ Deep Dive'}
        </button>
      </div>

      {/* Mini stats row — horizontally scrollable */}
      <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
        <div style={{display:'flex',gap:6,minWidth:'max-content',paddingBottom:4}}>
          {[
            ['🎯 Yard', sig>0||boom>0?(()=>{const ys=computeYardScore(sig,parseFloat(dp.gHR)||0,boom,parseFloat(dp.ps_score)||0);return ys>0?ys:'—';})():'—', (()=>{const ys=computeYardScore(sig,parseFloat(dp.gHR)||0,boom,parseFloat(dp.ps_score)||0);return ys>=75?'#ffd700':ys>=60?'#ff4020':ys>=45?'#f5a623':'var(--muted)';})()],
            ['💥 Boom', boom>0?Math.round(boom):'—', boomColor],
            ['⚡️ PS', (parseFloat(dp.ps_score)||0)>=1?Math.round(parseFloat(dp.ps_score)):'—', (parseFloat(dp.ps_score)||0)>=75?'#a855f7':(parseFloat(dp.ps_score)||0)>=60?'#ff4020':'var(--muted)'],
            ['⚡ Sig',  sig>0?sig:'—',               sigColor],
            ['P.Grade', pgLabel.split(' ')[0],        pgColor],
            ['Form',    fc?fc.short:'—',              fc?fc.color:'var(--muted)'],
            ['Sim TB',  simTB>0?simTB.toFixed(2):'—','var(--text)'],
            ['gHR',     ghr>0?Math.round(ghr):'—',   ghr>=70?'#ff4020':ghr>=50?'#f5a623':'var(--muted)'],
            ['ISO',     iso>0?iso.toFixed(3):'—',     iso>=0.25?'#ff8020':iso>=0.18?'#f5a623':'var(--muted)'],
            ['ZoneFit', zf>0?(zf.toFixed(1)+'%'):'—',zf>=8?'#ff4020':zf>=5?'#f5a623':zf>=2?'#27c97a':'var(--muted)'],
            ['EV',      ev>0?ev.toFixed(1):'—',       ev>=103?'#ff4020':ev>=97?'#f5a623':'var(--muted)'],
            ['Barrel%', brl>0?(brl.toFixed(1)+'%'):'—',brl>=10?'#ff4020':brl>=6?'#f5a623':'var(--muted)'],
            ['FB%',     fb>0?(fb.toFixed(1)+'%'):'—', fb>=35?'#f5a623':'var(--muted)'],
            ['Avg LA',  la>0?(la.toFixed(1)+'°'):'—', la>=22?'#27c97a':'var(--muted)'],
            ['xwOBA',   (parseFloat(dp.season_xwoba)||0)>0?(parseFloat(dp.season_xwoba)).toFixed(3):'—', (parseFloat(dp.season_xwoba)||0)>=0.380?'#ff4020':(parseFloat(dp.season_xwoba)||0)>=0.320?'#f5a623':'var(--muted)'],
            ['wOBA',    (parseFloat(dp.season_woba)||0)>0?(parseFloat(dp.season_woba)).toFixed(3):'—',   (parseFloat(dp.season_woba)||0)>=0.370?'#ff4020':(parseFloat(dp.season_woba)||0)>=0.310?'#f5a623':'var(--muted)'],
            ['SwStr%',  (parseFloat(dp.season_swstr_pct)||0)>0?((parseFloat(dp.season_swstr_pct)).toFixed(1)+'%'):'—', (parseFloat(dp.season_swstr_pct)||0)>=20?'#ff4020':(parseFloat(dp.season_swstr_pct)||0)>=14?'#f5a623':'#27c97a'],
          ].map(([lbl,val,col])=>(
            <div key={lbl} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,
              padding:'5px 8px',textAlign:'center',minWidth:52,flexShrink:0}}>
              <div style={{fontFamily:mono,fontSize:7,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.6,marginBottom:2}}>{lbl}</div>
              <div style={{fontFamily:osw,fontWeight:700,fontSize:12,color:col}}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Deep Dive dropdown ─────────────────────────────────────── */}
      {open && (
        <div style={{marginTop:10,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {/* Recent L7 */}
          <div style={{background:'var(--surface2)',borderRadius:8,border:'1px solid var(--border)',padding:'10px 12px'}}>
            <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8,marginBottom:8}}>📅 Recent Form (L7 At-Bats)</div>
            {[
              ['Avg EV',    dp.recent_avg_ev,      'mph', v=>parseFloat(v)>=103?'#ff4020':parseFloat(v)>=97?'#f5a623':'var(--text)'],
              ['Barrel%',   dp.recent_barrel_pct,  '%',   v=>parseFloat(v)>=10?'#ff4020':parseFloat(v)>=6?'#f5a623':'var(--muted)'],
              ['HH%',       dp.recent_hh_pct,      '%',   v=>parseFloat(v)>=45?'#ff8020':'var(--muted)'],
              ['FB%',       dp.recent_fb_pct,      '%',   v=>parseFloat(v)>=35?'#f5a623':'var(--muted)'],
              ['Avg LA',    dp.recent_avg_la,      '°',   v=>parseFloat(v)>=22?'#27c97a':'var(--muted)'],
              ['HR Count',  dp.recent_hr_count,    '',    v=>parseInt(v)>=2?'#ff4020':parseInt(v)>=1?'#f5a623':'var(--muted)'],


            ].map(([lbl,val,suf,col])=>{
              if (!val && val!==0) return null;
              const v = parseFloat(val);
              if (!v && v!==0) return null;
              return (
                <div key={lbl} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                  <span style={{fontFamily:mono,fontSize:9,color:'var(--muted)'}}>{lbl}</span>
                  <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,color:col(val)}}>
                    {suf==='%'?(v.toFixed(1)+'%'):suf==='mph'?v.toFixed(1):suf==='°'?(v.toFixed(1)+'°'):val}
                  </span>
                </div>
              );
            }).filter(Boolean)}
          </div>

          {/* BvP Quick */}
          <div style={{background:'var(--surface2)',borderRadius:8,border:'1px solid var(--border)',padding:'10px 12px'}}>
            <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8,marginBottom:8}}>⚔️ BvP Splits</div>
            {[
              ['Avg EV',   dp.bvp_avg_ev,      'mph', v=>parseFloat(v)>=103?'#ff4020':parseFloat(v)>=97?'#f5a623':'var(--text)'],
              ['Barrel%',  dp.bvp_barrel_pct,  '%',   ()=>'var(--muted)'],
              ['HH%',      dp.bvp_hh_pct,      '%',   v=>parseFloat(v)>=45?'#ff8020':'var(--muted)'],
              ['FB%',      dp.bvp_fb_pct,      '%',   ()=>'var(--muted)'],
              ['Avg LA',   dp.bvp_avg_la,      '°',   v=>parseFloat(v)>=22?'#27c97a':'var(--muted)'],
              ['PA',       dp.bvp_pa,          '',    ()=>'var(--text)'],
            ].map(([lbl,val,suf,col])=>{
              if (!val && val!==0) return null;
              const v = parseFloat(val);
              if (!v && v!==0) return null;
              return (
                <div key={lbl} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                  <span style={{fontFamily:mono,fontSize:9,color:'var(--muted)'}}>{lbl}</span>
                  <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,color:col(val)}}>
                    {suf==='%'?(v.toFixed(1)+'%'):suf==='mph'?v.toFixed(1):suf==='°'?(v.toFixed(1)+'°'):val}
                  </span>
                </div>
              );
            }).filter(Boolean)}
          </div>

          {/* Season Contact Quality — full season stats, not L7 */}
              {(dp.season_xwoba||dp.season_woba||dp.season_swstr_pct) && (
                <div style={{background:'var(--surface2)',borderRadius:8,border:'1px solid var(--border)',padding:'10px 12px',gridColumn:'1/-1'}}>
                  <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8,marginBottom:8}}>📊 Season Contact Quality</div>
                  <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
                    {[
                      ['xwOBA', dp.season_xwoba,     v=>parseFloat(v)>=0.380?'#ff4020':parseFloat(v)>=0.320?'#f5a623':'var(--muted)', v=>parseFloat(v).toFixed(3)],
                      ['wOBA',  dp.season_woba,      v=>parseFloat(v)>=0.370?'#ff4020':parseFloat(v)>=0.310?'#f5a623':'var(--muted)', v=>parseFloat(v).toFixed(3)],
                      ['SwStr%',dp.season_swstr_pct, v=>parseFloat(v)>=20?'#ff4020':parseFloat(v)>=14?'#f5a623':'#27c97a', v=>parseFloat(v).toFixed(1)+'%'],
                      ['ISO',   dp.recent_iso,       v=>parseFloat(v)>=0.25?'#ff8020':parseFloat(v)>=0.18?'#f5a623':'var(--muted)', v=>parseFloat(v).toFixed(3)],
                    ].map(([lbl,val,col,fmt])=>{
                      if (!val||parseFloat(val)===0) return null;
                      return (<div key={lbl} style={{textAlign:'center'}}>
                        <div style={{fontFamily:mono,fontSize:7,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.5,marginBottom:2}}>{lbl}</div>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:15,color:col(val)}}>{fmt(val)}</div>
                      </div>);
                    }).filter(Boolean)}
                  </div>
                </div>
              )}
              {/* Pitcher Vuln */}
          <div style={{background:'var(--surface2)',borderRadius:8,border:'1px solid var(--border)',padding:'10px 12px',gridColumn:'1/-1'}}>
            <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8,marginBottom:8}}>
              🎯 Pitcher Vuln — {dp.pitcher||'Today\'s Pitcher'}
            </div>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              {[
                ['HH Allowed',    dp.pitcher_hh_pct_allowed,    '%', v=>parseFloat(v)>=40?'#ff8020':'var(--muted)'],
                ['FB Allowed',    dp.pitcher_fb_pct_allowed,    '%', ()=>'var(--muted)'],
                ['Brl Allowed',   dp.pitcher_barrel_pct_allowed,'%', v=>parseFloat(v)>=8?'#ff4020':parseFloat(v)>=5?'#f5a623':'var(--muted)'],
                ['Meatball%',     dp.pitcher_meatball_pct,      '%', v=>parseFloat(v)>=55?'#ff8020':'var(--muted)'],
                ['Zone Fit',      dp.zone_fit,                   '%', v=>parseFloat(v)>=8?'#ff4020':parseFloat(v)>=5?'#f5a623':parseFloat(v)>=2?'#27c97a':'var(--muted)'],
              ].map(([lbl,val,suf,col])=>{
                if (!val && val!==0) return null;
                const v = parseFloat(val);
                if (!v && v!==0) return null;
                return (
                  <div key={lbl} style={{textAlign:'center',minWidth:70}}>
                    <div style={{fontFamily:mono,fontSize:7,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.5,marginBottom:2}}>{lbl}</div>
                    <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,color:col(val)}}>
                      {v.toFixed(1)}{suf}
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AtBatSlideIn() {
  const [player, setPlayer] = useState(null);
  const [atBats, setAtBats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiHr, setApiHr] = useState(null); // correct HR count from MLB Stats API
  const [bvpData, setBvpData] = useState(null);  // BvP vs today's pitcher
  const [bvpLoading, setBvpLoading] = useState(false);

  useEffect(() => {
    AB_SLIDE_LISTENER = setPlayer;
    return () => { AB_SLIDE_LISTENER = null; };
  }, []);

  useEffect(() => {
    if (!player?.pid) return;

    // Enrich pick objects (which only have pid/name/team/type) with
    // full Statcast data from the cache before rendering the stat card
    const cached = getCachedPlayer(player.pid);
    if (cached && !player.avgEV) {
      setPlayer(prev => ({
        ...cached,          // all Statcast fields
        ...prev,            // preserve pick-specific fields (type, ts)
        name:  prev.name  || cached.name,
        team:  prev.team  || cached.team,
      }));
    }

    setAtBats([]);
    setApiHr(null);
    setBvpData(null);
    setLoading(true);
    setAtBats([]);

    const season = new Date().getFullYear();

    // Fetch BvP vs today's probable pitcher
    // First try DAILY_PICKS_CACHE (has pitcher_id for all engine batters)
    // Fall back to schedule API lookup by player's team if not found
    const dp = DAILY_PICKS_CACHE[String(player.pid)];
    let pitcherId   = dp?.pitcher_id ? String(dp.pitcher_id).split('.')[0] : null;
    let pitcherName = dp?.pitcher    || null;

    const doBvpFetch = (pid, pname) => {
      if (!pid || parseInt(pid) <= 0) return;
      setBvpLoading(true);
      fetchBvP(parseInt(player.pid), parseInt(pid))
        .then(d => { setBvpData({ ...d, pitcherName: pname }); setBvpLoading(false); })
        .catch(() => setBvpLoading(false));
    };

    if (pitcherId) {
      doBvpFetch(pitcherId, pitcherName);
    } else if (player.team) {
      // Fall back: look up probable pitcher from MLB schedule API
      setBvpLoading(true);
      const today = new Date().toLocaleDateString('en-US',{timeZone:'America/New_York',
        year:'numeric',month:'2-digit',day:'2-digit'}).replace(/(\d+)\/(\d+)\/(\d+)/,'$3-$1-$2');
      fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=probablePitcher,team&gameType=R`)
        .then(r => r.json())
        .then(d => {
          const games = d.dates?.[0]?.games || [];
          for (const g of games) {
            for (const side of ['away','home']) {
              const abbr = g.teams?.[side]?.team?.abbreviation;
              if (abbr === player.team) {
                const opp  = side === 'away' ? 'home' : 'away';
                const pp   = g.teams?.[opp]?.probablePitcher;
                if (pp?.id) { doBvpFetch(String(pp.id), pp.fullName); return; }
              }
            }
          }
          setBvpLoading(false); // no game found
        })
        .catch(() => setBvpLoading(false));
    }

    // Fetch real season HR from MLB Stats API — ground truth, bypasses pipeline ID issues
    fetch(`https://statsapi.mlb.com/api/v1/people/${player.pid}/stats?stats=season&group=hitting&season=${season}&sportId=1`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const hr = d?.stats?.[0]?.splits?.[0]?.stat?.homeRuns;
        if (hr != null) setApiHr(parseInt(hr));
      })
      .catch(() => {});

    // Fetch real at-bat log from Baseball Savant statcast search
    const today = new Date().toLocaleDateString("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).split("/");
    const dateStr = `${today[2]}-${today[0]}-${today[1]}`;
    // Try 2026 first, fall back to 2025 if empty (early season)
    const fetchGameLog = async (pid, season) => {
      const r = await fetch(`https://statsapi.mlb.com/api/v1/people/${pid}/stats?stats=gameLog&group=hitting&season=${season}&sportId=1&limit=25`);
      const d = await r.json();
      return d.stats?.[0]?.splits || [];
    };
    fetchGameLog(player.pid, 2026)
      .then(async games => {
        if (games.length === 0) games = await fetchGameLog(player.pid, 2025);
        return games;
      })
      .then(games => {
        // MLB Stats API returns oldest→newest — reverse for most recent first
        const sorted = [...games].reverse();
        // ID → abbreviation map so opponent shows NYM not MET, DET not TIG, etc.
        const OPP_ABBR = {133:'ATH',134:'PIT',135:'SD',136:'SEA',137:'SF',138:'STL',139:'TB',140:'TEX',141:'TOR',142:'MIN',143:'PHI',144:'ATL',145:'CWS',146:'MIA',147:'NYY',158:'MIL',108:'LAA',109:'ARI',110:'BAL',111:'BOS',112:'CHC',113:'CIN',114:'CLE',115:'COL',116:'DET',117:'HOU',118:'KC',119:'LAD',120:'WSH',121:'NYM'};
        const rows = sorted.slice(0,20).map(g => ({
          date: g.date?.slice(5) || "—",
          opp:  OPP_ABBR[g.opponent?.id] ||
                g.opponent?.abbreviation || "—",
          ab:   parseInt(g.stat?.atBats||0),
          hits: parseInt(g.stat?.hits||0),
          hr:   parseInt(g.stat?.homeRuns||0),
          rbi:  parseInt(g.stat?.rbi||0),
          bb:   parseInt(g.stat?.baseOnBalls||0),
          k:    parseInt(g.stat?.strikeOuts||0),
          avg:  g.stat?.avg || ".000",
        }));
        setAtBats(rows);
      })
      .catch(()=>setAtBats([]))
      .finally(()=>setLoading(false));
  }, [player?.pid]);

  if (!player) return null;
  const isOpen = !!player;

  return <>
    {/* Backdrop */}
    <div onClick={()=>setPlayer(null)} style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:900,
      opacity:isOpen?1:0,transition:"opacity .25s",pointerEvents:isOpen?"all":"none"
    }}/>
    {/* Panel */}
    <div style={{
      position:"fixed",right:0,top:0,bottom:0,width:"min(540px,100vw)",
      background:"var(--surface)",borderLeft:"1px solid var(--border)",
      zIndex:901,transform:isOpen?"translateX(0)":"translateX(100%)",
      transition:"transform .3s cubic-bezier(.4,0,.2,1)",
      display:"flex",flexDirection:"column",overflowY:"auto"
    }}>
      {/* Header */}
      <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,background:"var(--surface)",zIndex:10}}>
        <PlayerAvatar pid={player?.pid} name={player?.name} size={40} style={{border:"2px solid var(--accent)"}}/>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:18,letterSpacing:1}}>{player.name}</span>
            <SavantLink pid={player?.pid} type="batter"/>
          </div>
          <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>
            {player.team}
            {player.avgEV > 0 && <span> · EV {player.avgEV.toFixed(1)}</span>}
            {(apiHr != null ? apiHr : player.hr) > 0 && <span style={{color:'var(--accent)',fontWeight:700}}> · {apiHr != null ? apiHr : player.hr} HR</span>}
            {player.avg > 0 && <span> · {'.'+String(Math.round(player.avg*1000)).padStart(3,'0')} AVG</span>}
            {player.grade?.grade && <span> · {player.grade.grade} Grade</span>}
          </div>
        </div>
        <PickButton pid={player.pid} name={player.name} team={player.team}/>
        <button onClick={()=>setPlayer(null)} style={{background:"none",border:"1px solid var(--border)",borderRadius:6,color:"var(--muted)",cursor:"pointer",padding:"5px 10px",fontFamily:"'DM Mono',monospace",fontSize:11}}>✕ Close</button>
      </div>

      {/* Injury banner — visible on mobile */}
      {player?.pid && INJURY_MAP[String(player.pid)] && (
        <div style={{padding:'0 20px'}}>
          <InjuryBanner pid={player.pid}/>
        </div>
      )}
      {/* Last 7 Games HR Chart */}
      {player?.pid && (
        <div style={{padding:'0 20px'}}>
          <Last7HRChart batterId={player.pid}/>
        </div>
      )}
      {/* Statcast Profile */}
      <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)"}}>
        <div style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Statcast Profile — 2026 Season</div>
        {!player.avgEV && !player.obp ? (
          <div style={{fontSize:11,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>
            Loading stats… if this persists, visit the Batters tab first to prime the cache.
          </div>
        ) : (
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {[
            {label:"Avg EV",   val:player.avgEV,        suffix:"",   color: player.avgEV>=92?"var(--accent)":player.avgEV>=88?"#ff8020":"var(--text)"},
            {label:"Barrel%",  val:player.barrel,       suffix:"%",  color: player.barrel>=12?"#ff4020":player.barrel>=8?"#ff8020":player.barrel>=5?"#f5a623":"var(--text)"},
            {label:"HardHit%", val:player.hardHit,      suffix:"%",  color: player.hardHit>=50?"#ff4020":player.hardHit>=42?"#ff8020":"var(--text)"},
            {label:"FB%",      val:player.flyBall,      suffix:"%",  color:"var(--text)"},
            {label:"GB%",      val:player.gbPct,        suffix:"%",  color:"var(--muted)"},
            {label:"Launch°",  val:player.launchAngle,  suffix:"°",  color: player.launchAngle>=20&&player.launchAngle<=35?"var(--green)":"var(--text)"},
            {label:"BA",       val:player.avg,          suffix:"",   fmt: v=>v>0?'.'+String(Math.round(v*1000)).padStart(3,'0'):'—', color: player.avg>=0.300?"var(--accent)":player.avg>=0.260?"#ff8020":"var(--text)"},
            {label:"OBP",      val:player.obp,          suffix:"",   fmt: v=>v>0?'.'+String(Math.round(v*1000)).padStart(3,'0'):'—', color: player.obp>=0.370?"var(--accent)":player.obp>=0.330?"#ff8020":"var(--text)"},
            {label:"SLG",      val:player.slg,          suffix:"",   fmt: v=>v>0?'.'+String(Math.round(v*1000)).padStart(3,'0'):'—', color: player.slg>=0.500?"var(--accent)":player.slg>=0.420?"#ff8020":"var(--text)"},
            {label:"xwOBA",    val:player.xwoba,        suffix:"",   fmt: v=>v>0?v.toFixed(3):'—', color: player.xwoba>=0.380?"var(--accent)":player.xwoba>=0.320?"#ff8020":"var(--text)"},
            {label:"Chase%",   val:player.oSwing,       suffix:"%",  color: player.oSwing<=20?"var(--green)":player.oSwing>=30?"#ff8020":"var(--text)"},
            {label:"K%",       val:player.kPct,         suffix:"%",  color: player.kPct>=28?"var(--ice)":"var(--muted)"},
            {label:"BB%",      val:player.bbPct,        suffix:"%",  color: player.bbPct>=12?"#27c97a":"var(--muted)"},
          ].filter(s => s.val != null && s.val > 0).map(s=>(
            <div key={s.label} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",minWidth:64,textAlign:"center"}}>
              <div style={{fontSize:8,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{s.label}</div>
              <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:17,color:s.color}}>
                {s.fmt ? s.fmt(s.val) : (typeof s.val==="number" ? s.val.toFixed(1) : s.val)}{s.fmt ? '' : s.suffix}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>


      {/* ── Today's Matchup Card ────────────────────────────────────────── */}
      {player?.pid && DAILY_PICKS_CACHE[String(player.pid)] && (
        <MatchupCard dp={DAILY_PICKS_CACHE[String(player.pid)]}/>
      )}

      {/* BvP vs Today's Pitcher */}
      {(bvpData || bvpLoading) && (
        <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)"}}>
          <div style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",
            textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>
            BvP vs {bvpData?.pitcherName || "Today's Pitcher"}
          </div>
          {bvpLoading ? (
            <div style={{display:"flex",alignItems:"center",gap:6,color:"var(--muted)",
              fontFamily:"'DM Mono',monospace",fontSize:10}}>
              <div className="sp" style={{width:12,height:12,borderWidth:2}}/> Loading BvP…
            </div>
          ) : bvpData?.pa > 0 ? (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{borderBottom:"2px solid var(--border)"}}>
                    {["PA","AB","H","HR","2B","BB","K","AVG","OBP","SLG"].map(h=>(
                      <th key={h} style={{padding:"4px 8px",fontSize:9,color:"var(--muted)",
                        fontFamily:"'DM Mono',monospace",textTransform:"uppercase",
                        letterSpacing:1,textAlign:"center",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {[
                      [bvpData.pa,  null],
                      [bvpData.ab,  null],
                      [bvpData.h,   bvpData.h>0?"var(--green)":null],
                      [bvpData.hr,  bvpData.hr>0?"var(--accent)":null],
                      [bvpData.b2 ?? bvpData.doubles ?? '—', null],
                      [bvpData.bb,  bvpData.bb>0?"#27c97a":null],
                      [bvpData.k,   bvpData.k>0?"var(--ice)":null],
                      [bvpData.avg, null],
                      [bvpData.obp, null],
                      [bvpData.slg, null],
                    ].map(([v,col],i)=>(
                      <td key={i} style={{padding:"7px 8px",fontFamily:i>=7?"'DM Mono',monospace":"'Oswald',sans-serif",
                        fontWeight:i>=7?400:700,fontSize:i>=7?11:13,textAlign:"center",
                        color:col||(i===3&&bvpData.hr>0?"var(--accent)":"var(--text)")}}>
                        {v ?? '—'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              {bvpData.pa > 0 && (
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"var(--muted)",
                  marginTop:6,textAlign:"center"}}>
                  {bvpData.pa} career plate appearance{bvpData.pa!==1?'s':''} vs this pitcher
                </div>
              )}
            </div>
          ) : (
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--muted)"}}>
              No career history vs this pitcher
            </div>
          )}
        </div>
      )}

      {/* Recent Game Log */}
      <div style={{padding:"14px 20px",flex:1}}>
        <div style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Recent Game Log — 2026</div>
        {loading
          ? <div style={{display:"flex",alignItems:"center",gap:8,color:"var(--muted)",fontFamily:"'DM Mono',monospace",fontSize:11}}><div className="sp" style={{width:14,height:14,borderWidth:2}}/> Loading…</div>
          : atBats.length === 0
            ? <div style={{color:"var(--muted)",fontFamily:"'DM Mono',monospace",fontSize:11}}>No game log available yet this season.</div>
            : <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{borderBottom:"2px solid var(--border)"}}>
                      {["Date","Opp","AB","H","HR","RBI","BB","K","AVG"].map(h=>(
                        <th key={h} style={{padding:"6px 8px",fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,textAlign:h==="Date"||h==="Opp"?"left":"center",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {atBats.map((g,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid rgba(30,45,58,.4)"}}>
                        <td style={{padding:"7px 8px",fontFamily:"'DM Mono',monospace",fontSize:11,color:"var(--muted)"}}>{g.date}</td>
                        <td style={{padding:"7px 8px",fontFamily:"'Oswald',sans-serif",fontWeight:600,fontSize:12}}>{g.opp}</td>
                        <td style={{padding:"7px 8px",fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:"center"}}>{g.ab}</td>
                        <td style={{padding:"7px 8px",fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:"center",color:g.hits>0?"var(--green)":"var(--muted)"}}>{g.hits}</td>
                        <td style={{padding:"7px 8px",fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:"center",color:g.hr>0?"var(--accent)":"var(--muted)",fontWeight:g.hr>0?700:400}}>{g.hr}</td>
                        <td style={{padding:"7px 8px",fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:"center"}}>{g.rbi}</td>
                        <td style={{padding:"7px 8px",fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:"center",color:g.bb>0?"var(--green)":"var(--muted)"}}>{g.bb}</td>
                        <td style={{padding:"7px 8px",fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:"center",color:g.k>=3?"var(--ice)":"var(--muted)"}}>{g.k}</td>
                        <td style={{padding:"7px 8px",fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:"center",color:parseFloat(g.avg)>=0.300?"var(--accent)":parseFloat(g.avg)>=0.250?"#ff8020":"var(--text)"}}>{g.avg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        }
      </div>
    </div>
  </>;
}


// ── PITCHER SLIDE-OUT ──────────────────────────────────────────────────────────
function PitcherSlideIn() {
  const [pitcher, setPitcher] = useState(null);
  const [stats, setStats]     = useState(null);
  const [pitchMix, setPitchMix] = useState([]);
  const [gameLog, setGameLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [battedBall, setBattedBall] = useState(null);

  useEffect(() => {
    PITCHER_SLIDE_LISTENER = setPitcher;
    return () => { PITCHER_SLIDE_LISTENER = null; };
  }, []);

  useEffect(() => {
    if (!pitcher?.pid && !pitcher?.name) return;
    setStats(null); setGameLog([]); setLoading(true); setBattedBall(null); setPitchMix([]);

    // Fetch season stats + pitch mix via existing pitcher API
    const fetchAll = async () => {
      try {
        const url = pitcher.pid
          ? `/api/pitcher?pid=${pitcher.pid}&year=2026`
          : `/api/pitcher?name=${encodeURIComponent(pitcher.name)}&year=2026`;
        const r = await fetch(url);
        const d = await r.json();
        if (d.found) {
          setStats(d.stats || {});
          setPitchMix(d.pitchMix || []);
          if (d.battedBall) setBattedBall(d.battedBall);
        }
      } catch(e) {}

      // Game log via MLB Stats API
      try {
        const pid = pitcher.pid;
        if (!pid) return;
        const r = await fetch(`https://statsapi.mlb.com/api/v1/people/${pid}/stats?stats=gameLog&group=pitching&season=2026&sportId=1&limit=20`);
        const d = await r.json();
        const OPP_ABBR = {133:'ATH',134:'PIT',135:'SD',136:'SEA',137:'SF',138:'STL',139:'TB',140:'TEX',141:'TOR',142:'MIN',143:'PHI',144:'ATL',145:'CWS',146:'MIA',147:'NYY',158:'MIL',108:'LAA',109:'ARI',110:'BAL',111:'BOS',112:'CHC',113:'CIN',114:'CLE',115:'COL',116:'DET',117:'HOU',118:'KC',119:'LAD',120:'WSH',121:'NYM'};
        const rows = (d.stats?.[0]?.splits||[]).reverse().slice(0,20).map(g=>({
          date: g.date?.slice(5)||'—',
          opp:  OPP_ABBR[g.opponent?.id]||g.opponent?.abbreviation||'—',
          ip:   g.stat?.inningsPitched||'0',
          h:    parseInt(g.stat?.hits||0),
          er:   parseInt(g.stat?.earnedRuns||0),
          bb:   parseInt(g.stat?.baseOnBalls||0),
          k:    parseInt(g.stat?.strikeOuts||0),
          hr:   parseInt(g.stat?.homeRuns||0),
          era:  g.stat?.era||'—',
        }));
        setGameLog(rows);
      } catch(e) {}
      setLoading(false);
    };
    fetchAll();
  }, [pitcher?.pid, pitcher?.name]);

  if (!pitcher) return null;
  const activePitchMix = pitchMix.length > 0 ? pitchMix : (pitcher.pitchMix || []);
  const hand = pitcher.hand || stats?.hand || 'R';

  return <>
    <div onClick={()=>setPitcher(null)} style={{
      position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:900,
      transition:'opacity .25s',pointerEvents:'all'
    }}/>
    <div style={{
      position:'fixed',right:0,top:0,bottom:0,width:'min(540px,100vw)',
      background:'var(--surface)',borderLeft:'1px solid var(--border)',
      zIndex:901,transform:'translateX(0)',
      transition:'transform .3s cubic-bezier(.4,0,.2,1)',
      display:'flex',flexDirection:'column',overflowY:'auto'
    }}>
      {/* Header */}
      <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',
        display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,
        background:'var(--surface)',zIndex:10}}>
        <PlayerAvatar pid={pitcher.pid} name={pitcher.name} size={40}/>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:18,letterSpacing:1}}>{pitcher.name}</span>
            <SavantLink pid={pitcher.pid} type="pitcher"/>
          </div>
          <div style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>
            {pitcher.team && <span style={{color:'var(--accent2)',fontWeight:700}}>{pitcher.team}</span>}
            <span style={{marginLeft:6}}>{hand}HP</span>
            {stats?.era && stats.era !== '—' && <span style={{marginLeft:6}}>· ERA {stats.era}</span>}
            {stats?.whip && stats.whip !== '—' && <span style={{marginLeft:6}}>· WHIP {stats.whip}</span>}
          </div>
        </div>
        <button onClick={()=>setPitcher(null)} style={{background:'none',border:'1px solid var(--border)',
          borderRadius:6,color:'var(--muted)',cursor:'pointer',padding:'5px 10px',
          fontFamily:"'DM Mono',monospace",fontSize:11}}>✕ Close</button>
      </div>

      {/* Season Stats */}
      <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)'}}>
        <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
          textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Season Stats — 2026</div>
        {loading && !stats
          ? <div style={{fontSize:11,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>Loading…</div>
          : <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {[
              {label:'ERA',  val:stats?.era,   color: parseFloat(stats?.era)<=3?'#27c97a':parseFloat(stats?.era)>=4.5?'var(--accent)':'var(--text)'},
              {label:'WHIP', val:stats?.whip,  color: parseFloat(stats?.whip)<=1.1?'#27c97a':parseFloat(stats?.whip)>=1.4?'var(--accent)':'var(--text)'},
              {label:'K/9',  val:stats?.k9,    color: parseFloat(stats?.k9)>=10?'#27c97a':'var(--text)'},
              {label:'BB/9', val:stats?.bb9,   color: parseFloat(stats?.bb9)<=2.5?'#27c97a':parseFloat(stats?.bb9)>=4?'var(--accent)':'var(--text)'},
              {label:'HR/9', val:stats?.hr9,   color: parseFloat(stats?.hr9)>=1.5?'var(--accent)':'var(--text)'},
              {label:'HR',   val:stats?.hr>0?stats.hr:null, color: (stats?.hr||0)>=15?'var(--accent)':(stats?.hr||0)>=8?'#ff8020':'var(--text)'},
              {label:'FB Vel', val:(()=>{ const fb = activePitchMix.find(px=>px.code==='FF'||px.code==='SI'||px.name?.includes('Fastball')); return fb?.velo>0?parseFloat(fb.velo).toFixed(1):null; })(), color:'var(--text)'},
            ].filter(s=>s.val&&s.val!=='—'&&s.val!=='0'&&s.val!==0).map(s=>(
              <div key={s.label} style={{background:'var(--surface2)',border:'1px solid var(--border)',
                borderRadius:8,padding:'8px 12px',minWidth:64,textAlign:'center'}}>
                <div style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                  textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>{s.label}</div>
                <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:17,color:s.color}}>
                  {s.val}
                </div>
              </div>
            ))}
          </div>
        }
      </div>

      {/* Batted Ball Stats (opponent) */}
      {battedBall && (battedBall.gbPct || battedBall.fbPct || battedBall.hhPct) && (
        <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
            textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Opponent Batted Ball — Allowed</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {[
              {label:'GB%',   val:battedBall.gbPct,   color: battedBall.gbPct>=50?'#27c97a':battedBall.gbPct>=44?'var(--accent2)':'var(--text)', tip:'Ground ball % allowed — higher is better for pitcher'},
              {label:'FB%',   val:battedBall.fbPct,   color: battedBall.fbPct>=40?'var(--accent)':battedBall.fbPct>=35?'#ff8020':'var(--text)', tip:'Fly ball % allowed — lower is better'},
              {label:'LD%',   val:battedBall.ldPct,   color: battedBall.ldPct>=24?'var(--accent)':'var(--text)', tip:'Line drive % allowed — lower is better'},
              {label:'HH%',   val:battedBall.hhPct,   color: battedBall.hhPct>=42?'var(--accent)':battedBall.hhPct<=36?'#27c97a':'var(--text)', tip:'Hard hit % allowed — lower is better'},
              {label:'Barrel%',val:battedBall.barrelPct, color: battedBall.barrelPct>=9?'var(--accent)':battedBall.barrelPct<=5?'#27c97a':'var(--text)', tip:'Barrel % allowed — lower is better'},
            ].filter(s=>s.val!=null&&s.val>0).map(s=>(
              <div key={s.label} title={s.tip} style={{background:'var(--surface2)',border:'1px solid var(--border)',
                borderRadius:8,padding:'8px 12px',minWidth:64,textAlign:'center'}}>
                <div style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                  textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>{s.label}</div>
                <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:17,color:s.color}}>
                  {s.val.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pitch Mix */}
      {activePitchMix.length > 0 && (
        <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
            textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Pitch Arsenal</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {activePitchMix.map((p,i)=>(
              <div key={i} style={{background:'var(--surface2)',border:'1px solid var(--border)',
                borderRadius:8,padding:'8px 12px',textAlign:'center',minWidth:70}}>
                <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:14,
                  color:'var(--text)'}}>{p.name||p.code}</div>
                <div style={{fontSize:9,color:'var(--accent2)',fontFamily:"'DM Mono',monospace",
                  fontWeight:700,marginTop:2}}>{typeof (p.pct||p.usage)==='number'?(p.pct||p.usage)<1.5?(((p.pct||p.usage)*100).toFixed(1)):(p.pct||p.usage).toFixed(1):p.pct||p.usage}%</div>
                {p.velo>0&&<div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                  marginTop:1}}>{parseFloat(p.velo).toFixed(1)} mph</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Log */}
      <div style={{padding:'14px 20px',flex:1}}>
        <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
          textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Recent Game Log — 2026</div>
        {loading
          ? <div style={{display:'flex',alignItems:'center',gap:8,color:'var(--muted)',
              fontFamily:"'DM Mono',monospace",fontSize:11}}>
              <div className="sp" style={{width:14,height:14,borderWidth:2}}/> Loading…
            </div>
          : gameLog.length === 0
            ? <div style={{color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:11}}>
                No game log available yet this season.
              </div>
            : <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{borderBottom:'2px solid var(--border)'}}>
                      {['Date','Opp','IP','H','ER','BB','K','HR'].map(h=>(
                        <th key={h} style={{padding:'6px 8px',fontSize:9,color:'var(--muted)',
                          fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:1,
                          textAlign:h==='Date'||h==='Opp'?'left':'center',whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gameLog.map((g,i)=>(
                      <tr key={i} style={{borderBottom:'1px solid rgba(30,45,58,.4)'}}>
                        <td style={{padding:'7px 8px',fontFamily:"'DM Mono',monospace",fontSize:11,color:'var(--muted)'}}>{g.date}</td>
                        <td style={{padding:'7px 8px',fontFamily:"'Oswald',sans-serif",fontWeight:600,fontSize:12}}>{g.opp}</td>
                        <td style={{padding:'7px 8px',fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:'center'}}>{g.ip}</td>
                        <td style={{padding:'7px 8px',fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:'center',color:g.h>=5?'var(--accent)':'var(--muted)'}}>{g.h}</td>
                        <td style={{padding:'7px 8px',fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:'center',color:g.er>=4?'var(--accent)':g.er===0?'#27c97a':'var(--text)',fontWeight:g.er===0?700:400}}>{g.er}</td>
                        <td style={{padding:'7px 8px',fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:'center',color:g.bb>=3?'var(--accent)':'var(--muted)'}}>{g.bb}</td>
                        <td style={{padding:'7px 8px',fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:'center',color:g.k>=8?'#27c97a':g.k>=6?'var(--accent2)':'var(--text)',fontWeight:g.k>=8?700:400}}>{g.k}</td>
                        <td style={{padding:'7px 8px',fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:'center',color:g.hr>0?'var(--accent)':'var(--muted)'}}>{g.hr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        }
      </div>
    </div>
  </>;
}

// ── GLOBAL PICKS SLIDEOUT ─────────────────────────────────────
function PicksSlideout({onClose}) {
  const picks = usePicks();
  const pickList = Object.values(picks).sort((a,b)=>a.type.localeCompare(b.type));
  return <>
    <button onClick={()=>{
              const pl=Object.values(picks).sort((a,b)=>a.type.localeCompare(b.type));
              if(!pl.length)return;
              const rows=[["Pick Type","Team","Batter Name"]];
              pl.forEach(p=>{const cfg=PICK_TYPES[p.type];const tn=cfg?.label?.split(" ").slice(1).join(" ")||p.type;const tm=(p.team&&p.team!=='-'&&p.team!=='—')?p.team:(PLAYER_DATA_CACHE[p.pid]?.team||GLOBAL_PLAYER_TEAM_MAP[p.pid]?.team||'-');rows.push([tn,tm,p.name||"-"]);});
              const csv=rows.map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
              const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
              const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="my-picks.csv";a.click();URL.revokeObjectURL(url);
            }} style={{padding:"4px 10px",borderRadius:6,border:"1px solid rgba(56,184,242,.3)",background:"rgba(56,184,242,.1)",color:"var(--ice)",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:10}}>⬇ CSV</button>
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:900}}/>
    <div style={{position:"fixed",right:0,top:0,bottom:0,width:"min(380px,100vw)",
      background:"var(--surface)",borderLeft:"1px solid var(--border)",zIndex:901,
      display:"flex",flexDirection:"column",overflowY:"auto"}}>
      <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,background:"var(--surface)",zIndex:10}}>
        <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:16,letterSpacing:1}}>🎯 My Picks</span>
        <span style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",marginLeft:4}}>{pickList.length} batter{pickList.length!==1?"s":""}</span>
        <button onClick={onClose} style={{marginLeft:"auto",background:"none",border:"1px solid var(--border)",borderRadius:6,color:"var(--muted)",cursor:"pointer",padding:"4px 10px",fontFamily:"'DM Mono',monospace",fontSize:11}}>✕ Close</button>
      </div>
      {pickList.length===0
        ? <div style={{padding:"40px 20px",textAlign:"center",color:"var(--muted)",fontFamily:"'DM Mono',monospace",fontSize:11,lineHeight:2}}>No picks yet.<br/>Use the ＋ button next to any batter.</div>
        : <div style={{flex:1}}>
  {/* Soft signup nudge */}<div style={{margin:"10px 16px 4px",padding:"8px 12px",borderRadius:8,background:"rgba(56,184,242,.06)",border:"1px solid rgba(56,184,242,.12)",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12}}>☁️</span><div style={{flex:1}}><div style={{fontSize:10,color:"var(--ice)",fontFamily:"'DM Mono',monospace",fontWeight:600}}>Picks sync across devices — coming soon</div><div style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",marginTop:1}}>Sign up to save picks to the cloud. Currently stored on this device only.</div></div></div>
            {pickList.map(p=>{
              const cfg=PICK_TYPES[p.type];
              return <div key={p.pid} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:"1px solid rgba(30,45,58,.4)"}}>
                <PlayerAvatar pid={p.pid} name={p.name} size={34} border={"2px solid "+cfg.color}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                  <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",display:"flex",gap:5}}>
                    <span style={{color:"var(--accent2)",fontWeight:700}}>{getTeam(p.pid, p.team)}</span>
                  </div>
                </div>
                {/* Category switcher */}
                <div style={{display:"flex",gap:4}}>
                  {Object.entries(PICK_TYPES).map(([type,c])=>(
                    <button key={type} onClick={()=>setPick(p.pid,p.name,p.team,type)}
                      title={c.label}
                      style={{width:26,height:26,borderRadius:5,cursor:"pointer",fontSize:13,
                        border:`1px solid ${p.type===type?c.color:"var(--border)"}`,
                        background:p.type===type?`${c.color}20`:"var(--surface2)"}}>
                      {c.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
                <button onClick={()=>setPick(p.pid,p.name,p.team,p.type)}
                  style={{background:"none",border:"1px solid var(--border)",borderRadius:5,color:"var(--muted)",cursor:"pointer",padding:"2px 7px",fontSize:10,flexShrink:0}}>✕</button>
              </div>;
            })}
          </div>
      }
    </div>
  </>;
}

// ── WEATHER + PARK FACTOR CACHE ─────────────────────────────
const WEATHER_CACHE = {};

async function fetchWeather(team, gameTime) {
  const cacheKey = gameTime ? `${team}_${gameTime}` : team;
  if (WEATHER_CACHE[cacheKey]) return WEATHER_CACHE[cacheKey];
  try {
    const gt = gameTime ? `&gameTime=${encodeURIComponent(gameTime)}` : '';
    // Cache-bust so Vercel edge cache doesn't serve stale weather
    const cb = `&_t=${Math.floor(Date.now()/300000)}`; // refreshes every 5 min
    const res = await fetch(`/api/weather?team=${team}${gt}${cb}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    WEATHER_CACHE[cacheKey] = data;
    return data;
  } catch(e) {
    console.warn('[Weather] fetch failed:', team, e.message);
    return null;
  }
}

// Weather code → description
function getWeatherDesc(code) {
  if (code === 0) return "☀️ Clear";
  if (code <= 3) return "⛅ Partly cloudy";
  if (code <= 49) return "🌫️ Foggy";
  if (code <= 67) return "🌧️ Rain";
  if (code <= 77) return "❄️ Snow";
  if (code <= 82) return "🌦️ Showers";
  if (code <= 99) return "⛈️ Thunderstorm";
  return "🌤️ Clear";
}

// Wind direction → compass label
function getWindDir(deg) {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
}

// Park factor color
function getPFColor(hr) {
  return hr >= 115 ? "#ff4020" : hr >= 108 ? "#ff8020" : hr >= 103 ? "#ffbe20" :
         hr <= 90  ? "#38b8f2" : hr <= 95  ? "#60a0d0" : hr <= 98  ? "#8899a6" : "var(--muted)";
}

// ── WEATHER BANNER COMPONENT ─────────────────────────────────
function WeatherBanner({ team }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!team || team === "—") { setLoading(false); return; }
    setLoading(true);
    fetchWeather(team).then(d => { setData(d); setLoading(false); });
  }, [team]);

  if (loading) return <div style={{height:44,display:"flex",alignItems:"center",padding:"0 14px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,marginBottom:12}}><div className="sp" style={{width:14,height:14,borderWidth:2}}/></div>;
  if (!data) return null;

  const { parkFactor: pf, weather: w, hrEnvScore } = data;
  const pfColor = getPFColor(pf?.hr || 100);
  const envLabel = hrEnvScore >= 60 ? "🔥 HR-friendly environment" : hrEnvScore >= 52 ? "📈 Slight HR boost" : hrEnvScore >= 46 ? "— Neutral conditions" : hrEnvScore >= 38 ? "📉 Slight suppressor" : "🧊 Pitcher-friendly conditions";
  const envColor = hrEnvScore >= 60 ? "#ff4020" : hrEnvScore >= 52 ? "#ff8020" : hrEnvScore >= 46 ? "var(--muted)" : hrEnvScore >= 38 ? "#38b8f2" : "#38b8f2";

  return <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"10px 14px",marginBottom:12,display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
    {/* Park factor */}
    <div style={{display:"flex",flexDirection:"column",gap:1}}>
      <div style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1}}>Park Factor</div>
      <div style={{display:"flex",alignItems:"center",gap:5}}>
        <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:18,color:pfColor}}>{pf?.hr || 100}</span>
        <span style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>HR</span>
        <span style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>/ {pf?.xbh || 100} XBH</span>
      </div>
      <div style={{fontSize:9,color:pfColor,fontFamily:"'DM Mono',monospace"}}>{pf?.label || ""}</div>
    </div>

    <div style={{width:1,height:36,background:"var(--border)"}}/>

    {/* Weather — skip if dome */}
    {w?.isDome
      ? <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>🏟️ Retractable/dome — weather irrelevant</div>
      : w ? <>
          <div style={{display:"flex",flexDirection:"column",gap:1}}>
            <div style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1}}>Conditions</div>
            <div style={{fontSize:12,fontFamily:"'DM Mono',monospace"}}>{getWeatherDesc(w.weatherCode)}</div>
            <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>{w.temp}°F · {w.humidity}% humidity</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:1}}>
            <div style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1}}>Wind</div>
            <div style={{fontSize:12,fontFamily:"'DM Mono',monospace",color:w.windSpeed>=15?"#ff8020":"var(--text)"}}>{w.windLabel}</div>
            <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>{w.windSpeed} mph {getWindDir(w.windDir)}</div>
          </div>
          {w.precip > 0 && <div style={{padding:"3px 8px",borderRadius:5,background:"rgba(56,184,242,.1)",border:"1px solid rgba(56,184,242,.2)",fontSize:10,color:"var(--ice)",fontFamily:"'DM Mono',monospace"}}>🌧️ {w.precip}" precip</div>}
        </>
      : null
    }

    <div style={{width:1,height:36,background:"var(--border)"}}/>

    {/* HR environment score */}
    <div style={{display:"flex",flexDirection:"column",gap:1}}>
      <div style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1}}>HR Environment</div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{width:60,height:6,borderRadius:3,background:"var(--border)",overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:3,width:`${Math.min(hrEnvScore,100)}%`,background:envColor}}/>
        </div>
        <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:15,color:envColor}}>{hrEnvScore}</span>
      </div>
      <div style={{fontSize:9,color:envColor,fontFamily:"'DM Mono',monospace"}}>{envLabel}</div>
    </div>
  </div>;
}

const WINDOWS = [
  {key:7,  label:"L7D",  tip:"Last 7 days"},
  {key:14, label:"L14D", tip:"Last 14 days"},
  {key:30, label:"L30D", tip:"Last 30 days"},
  {key:60, label:"L60D", tip:"Last 60 days"},
];


// Convert numeric window (7,14,30,60) to players.json key (last7/last14/last30/last60)
function winKey(w) {
  // Handles numeric (7, 14, 30) or string ('last7', 'season', 'season2026', 'last season')
  if (w === 'season' || w === 'season2026') return 'season2026';
  if (w === 'lastseason' || w === 'last season' || w === '2025') return 'season2025';
  const n = parseInt(w);
  if (n <=  7) return 'last7';
  if (n <= 14) return 'last14';
  if (n <= 30) return 'last30';
  return 'last60';
}

function WindowButtons({ window: winVal, setWindow }) {
  return (
    <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
      <span style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginRight:4}}>Window:</span>
      {WINDOWS.map(w => (
        <Tip key={w.key} text={w.tip}>
          <button
            className={`chip ${winVal===w.key?"active":""}`}
            onClick={()=>setWindow(w.key)}
            style={{padding:"4px 10px",fontSize:11,fontFamily:"'Oswald',sans-serif",fontWeight:600}}>
            {w.label}
          </button>
        </Tip>
      ))}
    </div>
  );
}

// ── UNIVERSAL STAT COLUMNS RENDERER ─────────────────────────────────────────
// Returns the windowed stat columns for any batter row
function StatCols({ p, window }) {
  const w = p.windows?.[winKey(window)] ?? {};
  const ev   = w.avgEV ?? p.avgEV ?? 0;
  const bar  = w.barrel ?? p.barrel ?? 0;
  const fb   = w.flyBall ?? p.flyBall ?? 0;
  const la   = w.launchAngle ?? p.launchAngle ?? 0;
  const pull   = w.pullAir ?? p.pullAir ?? 0;
  const pulbrl = w.pulledBarrel ?? p.pulledBarrel ?? 0;
  const chase= w.oSwing ?? p.oSwing ?? 30;
  const hh   = w.hardHit ?? p.hardHit ?? 0;
  const avg  = w.avg ?? p.avg ?? 0;
  const hits = w.hits ?? 0;
  const xbh  = w.xbh ?? 0;
  const hr   = w.hr ?? p.hr ?? 0;
  const bb   = w.bbPct ?? p.bbPct ?? 0;
  const tb   = w.totalBases ?? 0;
  const abhr = w.abPerHR ?? 99;
  const abshr= w.abSinceHR ?? 0;
  const alm  = w.almostPct ?? 0;
  const k    = w.kPct ?? p.kPct ?? 0;

  const evC  = ev>=T.EV_HR?"danger":ev>=T.EV_HH?"hot":ev>=92?"warm":"avg";
  const barC = bar>=T.BAR_EL&&bar<=T.BAR_MAX?"hot":bar>=T.BAR_GD?"warm":bar>T.BAR_MAX?"warm":"avg";
  const fbC  = fb>=T.FB_MIN&&fb<=T.FB_MAX?"hot":fb>=30?"warm":"avg";
  const laC  = la>=T.LA_MIN&&la<=T.LA_MAX?"good":la>=19?"warm":"avg";
  const puC  = pull>=T.PULL_EL?"hot":pull>=T.PULL_GD?"warm":"avg";
  const pbC  = pulbrl>=8?"danger":pulbrl>=5?"hot":pulbrl>=3?"warm":"avg";
  const chC  = chase<=T.CHASE_EL?"good":chase<=T.CHASE_GD?"avg":"cold";
  const hhC  = hh>=T.HH_EL?"hot":hh>=T.HH_GD?"warm":"avg";
  const avgC = avg>=0.300?"danger":avg>=0.270?"hot":avg>=0.240?"warm":"avg";
  const hrC  = hr>=5?"danger":hr>=3?"hot":hr>=1?"warm":"avg";
  const bbC  = bb>=12?"good":bb>=8?"avg":"avg";
  const kC   = k>=28?"cold":k>=22?"avg":"good";
  const almC = alm>=20?"hot":alm>=12?"warm":"avg";
  const abhrC= abhr<=15?"danger":abhr<=22?"hot":abhr<=30?"warm":"avg";

  const mini = (val, label, cls, suffix="") => (
    <td key={label}>
      <span className={`sv ${val===null||val===undefined?"avg":cls}`}>
        {val===null||val===undefined ? "—" : typeof val==="number" ? (suffix ? val.toFixed(1)+suffix : val) : val}
      </span>
    </td>
  );

  return <>
    {mini(ev,  "ev",   evC,  "")}
    {mini(bar, "bar",  barC, "%")}
    {mini(fb,  "fb",   fbC,  "%")}
    {mini(la,  "la",   laC,  "°")}
    {mini(pull,   "pull", puC, "%")}
    {mini(chase,"chase",chC, "%")}
    {mini(hh,  "hh",   hhC,  "%")}
    {mini(pulbrl > 0 ? pulbrl : null, "pulbrl", pbC, "%")}
    {mini(avg, "avg",  avgC, "")}
    {mini(hits,"hits", "avg", "")}
    {mini(xbh, "xbh",  hr>=2?"hot":"avg", "")}
    {mini(hr,  "hr",   hrC,  "")}
    {mini(bb,  "bb",   bbC,  "%")}
    {mini(tb,  "tb",   "avg","")}
    {mini(abhr,"abhr", abhrC,"")}
    {mini(abshr,"abshr","avg","")}
    {mini(alm, "alm",  almC, "%")}
    {mini(k,   "k",    kC,   "%")}
  </>;
}

// Universal column headers for stat cols
const STAT_COL_HEADERS = [
  {key:"avgEV",    label:"EV",         tip:"Avg exit velocity (95+=hard, 103+=HR spike)"},
  {key:"barrel",   label:"Barrel%",    tip:"12–18% = elite. Above 18% = over-swinging."},
  {key:"flyBall",  label:"Fly Ball%",  tip:"35–45% = sweet zone. Above 50% = too many outs."},
  {key:"launchAngle",label:"Launch°",  tip:"25–35° = HR sweet spot"},
  {key:"pullAir",  label:"Pull Air%",  tip:"40–50% = elite HR power zone"},
  {key:"oSwing",   label:"Chase%",     tip:"O-Swing. Below 20% = elite. Below 25% = good."},
  {key:"hardHit",  label:"Hard Hit%",  tip:"EV ≥ 95 mph contact rate"},
  {key:"pulledBarrel", label:"Pull Brl%", tip:"Barrels hit to the pull side — the most dangerous contact"},
  {key:"avg",      label:"AVG",        tip:"Batting average this window"},
  {key:"hits",     label:"H",          tip:"Hits this window"},
  {key:"xbh",      label:"XBH",        tip:"Extra base hits (2B+3B+HR) this window"},
  {key:"hr",       label:"HR",         tip:"Home runs this window"},
  {key:"bbPct",    label:"BB%",        tip:"Walk rate — higher = more patient"},
  {key:"totalBases",label:"TB",        tip:"Total bases this window"},
  {key:"abPerHR",  label:"AB/HR",      tip:"At-bats per home run — lower = better"},
  {key:"abSinceHR",label:"AB Since HR",tip:"At-bats since last home run"},
  {key:"almostPct",label:"Almost%",    tip:"Fly balls hit 350ft+ but not HR — near misses"},
  {key:"kPct",     label:"K%",         tip:"Strikeout rate — lower = better contact"},
];


// DATA FETCHING
// ── GLOBAL PLAYER→TEAM MAP ───────────────────────────────────
let GLOBAL_PLAYER_TEAM_MAP = {};
let GLOBAL_PLAYER_MAP_LOADED = false;
let GLOBAL_PLAYER_MAP_TS = 0;           // timestamp of last successful load
const PLAYER_MAP_TTL = 6 * 60 * 60 * 1000; // 6-hour TTL — picks up mid-season trades

// ── LINEUP STATUS MAP — pid → "confirmed" | "playing_today" ──
// Populated when MLB lineup API returns confirmed starters
const LINEUP_STATUS = {}; // pid → {status:"confirmed"|"today", team}
const TODAY_TEAMS    = new Set(); // teams playing today
const TOMORROW_TEAMS = new Set(); // teams playing tomorrow
let LINEUP_VERSION = 0; // increments each refresh so React components re-render
const LINEUP_LISTENERS = new Set(); // components that want to re-render on lineup refresh
function subscribeLineup(fn) { LINEUP_LISTENERS.add(fn); return () => LINEUP_LISTENERS.delete(fn); }
function notifyLineupListeners() { LINEUP_VERSION++; LINEUP_LISTENERS.forEach(fn => fn(LINEUP_VERSION)); }

async function loadTodayLineups() {
  try {
    const etDate = new Date().toLocaleDateString("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"});
    const [m,d,y] = etDate.split("/");
    const today = `${y}-${m}-${d}`;
    const res = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=lineups,team,probablePitcher`);
    const data = await res.json();
    for (const dateObj of (data.dates || [])) {
      for (const game of (dateObj.games || [])) {
        const awAbbr = game.teams?.away?.team?.abbreviation;
        const hmAbbr = game.teams?.home?.team?.abbreviation;
        if (awAbbr) TODAY_TEAMS.add(awAbbr);
        if (hmAbbr) TODAY_TEAMS.add(hmAbbr);
        // Confirmed starters from lineups
        for (const side of ['away','home']) {
          const players = game.lineups?.[side==='away'?'awayPlayers':'homePlayers'] || [];
          const teamAbbr = game.teams?.[side]?.team?.abbreviation || '';
          players.forEach((p, idx) => {
            if (p.id) {
              // battingOrder from API is 100,200,...900 — divide by 100 for slot 1-9
              // Fallback to array index+1 if battingOrder missing
              const slot = p.battingOrder ? Math.round(p.battingOrder / 100) : (idx + 1);
              LINEUP_STATUS[p.id] = { status: 'confirmed', team: teamAbbr, slot };
            }
          });
        }
      }
    }
    console.log('[Lineups] Today teams:', [...TODAY_TEAMS].join(', '));
    // Also fetch tomorrow's schedule to populate TOMORROW_TEAMS
    try {
      const tmDate = new Date(); tmDate.setDate(tmDate.getDate() + 1);
      const tmStr = tmDate.toLocaleDateString('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
      const [tm,td,ty] = tmStr.split('/');
      const tmFormatted = `${ty}-${tm}-${td}`;
      const tmRes = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${tmFormatted}&hydrate=team`);
      const tmData = await tmRes.json();
      TOMORROW_TEAMS.clear();
      (tmData.dates?.[0]?.games || []).forEach(g => {
        const aw = g.teams?.away?.team?.abbreviation;
        const hm = g.teams?.home?.team?.abbreviation;
        if (aw) TOMORROW_TEAMS.add(aw);
        if (hm) TOMORROW_TEAMS.add(hm);
      });
    } catch(e) {}
    console.log('[Lineups] Confirmed starters:', Object.keys(LINEUP_STATUS).length);
    // Fire lineup confirmation notifications for newly confirmed teams
    const confirmedTeams = {};
    Object.values(LINEUP_STATUS).forEach(v => {
      if (v.team && !LINEUP_NOTIF_SENT.has(v.team)) confirmedTeams[v.team] = true;
    });
    const newTeams = Object.keys(confirmedTeams);
    if (newTeams.length > 0) {
      newTeams.forEach(team => LINEUP_NOTIF_SENT.add(team));
      // Skip notifications on first load — just seed the seen set
      if (LINEUP_NOTIF_FIRST_LOAD) { LINEUP_NOTIF_FIRST_LOAD = false; }
      else {
      const teamsStr = newTeams.join(', ');
      // In-app notification
      if (_setQueue && _setNotifLog) {
        const lnNotif = { id: Date.now()+Math.random(), notifType:'lineup',
          title: newTeams.length === 1 ? `${newTeams[0]} lineup is in` : `${newTeams.length} lineups confirmed`,
          subtitle: teamsStr, time: new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'}) };
        _setQueue(q => [...q.slice(-2), lnNotif]);
        _notifLog = [lnNotif, ..._notifLog].slice(0, 50);
        if (_setNotifLog) _setNotifLog([..._notifLog]);
      }
      // Push notification
      const lineupDedupKey = `lineup-${today}-${[...newTeams].sort().join('-')}`;
      sendLivePush(
        newTeams.length === 1 ? `📋 ${newTeams[0]} Lineup Confirmed` : `📋 ${newTeams.length} Lineups Confirmed`,
        teamsStr,
        lineupDedupKey,
        '/#live/lineups'
      );
      } // end else (not first load)
    }
    notifyLineupListeners();
  } catch(e) {
    console.warn('[Lineups] Load failed:', e.message);
  }
}

async function loadGlobalPlayerMap() {
  const now = Date.now();
  // Re-fetch after TTL expires — catches trades and free agent signings
  if (GLOBAL_PLAYER_MAP_LOADED && (now - GLOBAL_PLAYER_MAP_TS) < PLAYER_MAP_TTL) {
    return GLOBAL_PLAYER_TEAM_MAP;
  }
  try {
    // Step 1: season-level player list (names, positions, bats)
    for (const season of ['2025', '2026']) {
      try {
        const res2 = await fetch(`https://statsapi.mlb.com/api/v1/sports/1/players?season=${season}&sportId=1`);
        const d2 = await res2.json();
        for (const p of (d2.people || [])) {
          if (!p.id || !p.fullName) continue;
          const ex = GLOBAL_PLAYER_TEAM_MAP[p.id] || {};
          GLOBAL_PLAYER_TEAM_MAP[p.id] = {
            team:   normTeam(p.currentTeam?.abbreviation || ex.team || ''),
            teamId: p.currentTeam?.id || ex.teamId || 0,
            name:   p.fullName,
            hand:   p.batSide?.code || ex.hand || 'R',
            pos:    p.primaryPosition?.abbreviation || p.primaryPosition?.code || ex.pos || '',
          };
        }
      } catch(se) {}
    }

    // Step 2: active rosters for all 30 teams — most accurate current team source
    // This is what catches mid-season trades that the season list may lag on
    const TEAM_IDS = [
      108,109,110,111,112,113,114,115,116,117,
      118,119,120,121,133,134,135,136,137,138,
      139,140,141,142,143,144,145,146,147,158
    ];
    await Promise.all(TEAM_IDS.map(async tid => {
      try {
        const r = await fetch(`https://statsapi.mlb.com/api/v1/teams/${tid}/roster?rosterType=active&season=2026`);
        if (!r.ok) return;
        const d = await r.json();
        const abbr = d.roster?.[0]?.parentTeamId ? undefined
          : (d.teamId ? undefined : undefined); // abbr comes from schedule
        for (const entry of (d.roster || [])) {
          const pid = entry.person?.id;
          const fullName = entry.person?.fullName;
          if (!pid) continue;
          const ex = GLOBAL_PLAYER_TEAM_MAP[pid] || {};
          // Roster endpoint gives us the team from the URL — use TEAM_ABBR map
          const ABBR_MAP = {
            108:'LAA',109:'ARI',110:'BAL',111:'BOS',112:'CHC',113:'CIN',
            114:'CLE',115:'COL',116:'DET',117:'HOU',118:'KC', 119:'LAD',
            120:'WSH',121:'NYM',133:'ATH',134:'PIT',135:'SD', 136:'SEA',
            137:'SF', 138:'STL',139:'TB', 140:'TEX',141:'TOR',142:'MIN',
            143:'PHI',144:'ATL',145:'CWS',146:'MIA',147:'NYY',158:'MIL',
          };
          const teamAbbr = normTeam(ABBR_MAP[tid] || ex.team || '');
          GLOBAL_PLAYER_TEAM_MAP[pid] = {
            ...ex,
            team:   teamAbbr,  // active roster = authoritative current team
            teamId: tid,
            name:   fullName || ex.name || '',
            pos:    entry.position?.abbreviation || ex.pos || '',
          };
        }
      } catch(re) {}
    }));

    GLOBAL_PLAYER_MAP_LOADED = true;
    GLOBAL_PLAYER_MAP_TS = now;
    const emptyTeams = Object.values(GLOBAL_PLAYER_TEAM_MAP).filter(p=>!p.team||p.team==="").length;
    if (emptyTeams > 50) console.warn(`[PlayerMap] ${emptyTeams} players missing team abbreviation`);
    console.log('[Going Yard] Player map loaded:', Object.keys(GLOBAL_PLAYER_TEAM_MAP).length, '— active rosters refreshed');
    // Backfill cached players with fresh team data from active rosters
    for (const [pidStr, player] of Object.entries(PLAYER_DATA_CACHE)) {
      const freshTeam = GLOBAL_PLAYER_TEAM_MAP[parseInt(pidStr)]?.team;
      if (freshTeam && freshTeam !== '—' && freshTeam !== '') {
        player.team = freshTeam; // active roster always wins over stale pipeline data
      }
    }
  } catch(e) {
    console.warn('[Going Yard] Player map failed:', e.message);
  }
  return GLOBAL_PLAYER_TEAM_MAP;
}

function getPlayerTeam(pid) {
  return GLOBAL_PLAYER_TEAM_MAP[pid]?.team || null;
}

// Resolve team — MLB API active roster is authoritative (catches trades)
// Priority: global map (live active rosters) > PLAYER_DATA_CACHE (pipeline) > fallback
function getTeam(pid, fallback) {
  const id = parseInt(pid);
  // Global map is refreshed from active rosters — always the most current source
  const mapped = GLOBAL_PLAYER_TEAM_MAP[id]?.team;
  if (mapped && mapped !== '—' && mapped !== '-' && mapped !== '') return mapped;
  // Cache from pipeline/players.json — may lag trades by days
  const cached = PLAYER_DATA_CACHE[id]?.team;
  if (cached && cached !== '—' && cached !== '-') return cached;
  if (fallback && fallback !== '—' && fallback !== '-') return fallback;
  return '—';
}

// Real days since last HR from MLB game log API
const DAYS_SINCE_HR_CACHE = {}; // pid → {days, ts}
async function fetchDaysSinceHR(pid) {
  if (!pid) return null;
  const cached = DAYS_SINCE_HR_CACHE[pid];
  if (cached && Date.now() - cached.ts < 3600000) return cached.days; // 1hr cache
  try {
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${pid}/stats?stats=gameLog&group=hitting&season=2026&sportId=1&limit=50`
    );
    const data = await res.json();
    const games = data.stats?.[0]?.splits || [];
    // Find most recent HR
    let daysSince = 999;
    const today = new Date();
    for (const g of games) {
      if (parseInt(g.stat?.homeRuns || 0) > 0) {
        const gameDate = new Date(g.date + 'T12:00:00');
        const diffDays = Math.floor((today - gameDate) / (1000 * 60 * 60 * 24));
        daysSince = Math.min(daysSince, diffDays);
        break; // game log is sorted newest first
      }
    }
    const result = daysSince === 999 ? null : daysSince;
    DAYS_SINCE_HR_CACHE[pid] = { days: result, ts: Date.now() };
    return result;
  } catch(e) { return null; }
}


// Load daily_picks.csv → DAILY_PICKS_CACHE keyed by batter_id
async function loadDailyPicks() {
  try {
    const res = await fetch('/data/daily_picks.csv');
    if (!res.ok) return;
    const text = await res.text();
    const rows = parseCSVText(text);
    rows.forEach(r => {
      // Build game_id → teams map from ALL rows (before per-batter dedup)
      const rawGid = String(r.game_id || '').trim();
      const gid = rawGid.includes('.') ? String(parseInt(rawGid)) : rawGid;
      const team = String(r.batting_team || '').trim();
      if (gid && gid !== 'NaN' && team) {
        if (!DAILY_GAME_MAP[gid]) DAILY_GAME_MAP[gid] = new Set();
        DAILY_GAME_MAP[gid].add(team);
      }
      // Normalize batter_id: strip pandas float suffix "691016.0" → "691016"
      const rawBid = String(r.batter_id || '').trim();
      const bid = rawBid.includes('.') ? String(parseInt(rawBid)) : rawBid;
      // Only store first row per batter — recent stats are same across all matchup rows
      if (bid && bid !== 'NaN' && !DAILY_PICKS_CACHE[bid]) DAILY_PICKS_CACHE[bid] = { ...r, _gid: gid };

    });
    // Populate key matchup batter set — ONLY batters in daily_summary.csv (Key Matchups tab)
    // daily_picks has ALL batters; daily_summary has only the engine's top picks shown in Key Matchups
    try {
      const summaryRes = await fetch('/data/daily_summary.csv');
      if (summaryRes.ok) {
        const summaryText = await summaryRes.text();
        const summaryRows = parseCSVText(summaryText);
        const todayET = getETDateStr();
        KEY_MATCHUP_DATE = todayET;
        KEY_MATCHUP_BATTER_IDS.clear();
        KEY_MATCHUP_BATTER_NAMES.clear();
        summaryRows.forEach(r => {
          const rawBid = String(r.batter_id || '').trim();
          const bid = rawBid.includes('.') ? String(parseInt(rawBid)) : rawBid;
          if (bid && bid !== 'NaN') KEY_MATCHUP_BATTER_IDS.add(bid);
          const name = String(r.batter || '').trim().toLowerCase();
          if (name) KEY_MATCHUP_BATTER_NAMES.add(name);
        });
        console.log('[KeyMatchups] Orange highlight:', KEY_MATCHUP_BATTER_IDS.size, 'batters for', todayET);
      }
    } catch(e) {
      console.warn('[KeyMatchups] Could not load summary for highlights:', e.message);
    }
    console.log('[DailyPicks] Loaded', Object.keys(DAILY_PICKS_CACHE).length, 'batters |',
      KEY_MATCHUP_BATTER_IDS.size, 'key matchup IDs for', getETDateStr());
  } catch(e) {
    console.warn('[DailyPicks] Failed to load:', e.message);
  }
}

async function fetchPlayers(setL, setP, setE, silent=false) {
  if (!silent) setL(true);
  setE(null);

  // 3-hour TTL — keeps Statcast data fresh throughout the day
  // Savant publishes previous day's at-bat data — pipeline runs 3am/6am/8am ET
  const THREE_HOURS = 3 * 60 * 60 * 1000;
  const now = Date.now();
  if (silent && PLAYER_CACHE_DATE && (now - PLAYER_CACHE_DATE) < THREE_HOURS && Object.keys(PLAYER_DATA_CACHE).length > 50) {
    const cached = Object.values(PLAYER_DATA_CACHE).sort((a,b) => (b.os||0)-(a.os||0));
    console.log("[Players] Cache hit —", Math.round((now - PLAYER_CACHE_DATE)/60000), "min old, next refresh in", Math.round((THREE_HOURS-(now-PLAYER_CACHE_DATE))/60000), "min");
    setP([...cached]);
    setL(false);
    return;
  }

  try {
    // ── STEP 1: Build player→team map from MLB API ──────────
    const pt = {};
    try {
      const gMap = await loadGlobalPlayerMap();
      for (const [pid, info] of Object.entries(gMap)) {
        pt[pid] = info.team;
      }
    } catch(e) { console.warn('[Players] Team map failed:', e.message); }

    // Load today's lineups for confirmed starter status
    loadTodayLineups().catch(() => {});
    // Also get today's lineup teams
    try {
      const etDate = new Date().toLocaleDateString("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"});
      const [m,d,y] = etDate.split("/");
      const today = `${y}-${m}-${d}`;
      const sched = await fetch(`/api/schedule?date=${today}`);
      const sd = await sched.json();
      for (const g of (sd.dates?.[0]?.games || [])) {
        const aT = g.teams?.away?.team?.abbreviation || '';
        const hT = g.teams?.home?.team?.abbreviation || '';
        const aL = g.lineups?.awayPlayers || [];
        const hL = g.lineups?.homePlayers || [];
        [...aL].forEach(p => { if (p?.id && aT) pt[p.id] = aT; });
        [...hL].forEach(p => { if (p?.id && hT) pt[p.id] = hT; });
      }
    } catch(e) { console.warn('[Players] Lineup fetch failed:', e.message); }

    // ── STEP 2: Fetch real Statcast season data ─────────────
    let statcastPlayers = [];
    try {
      const scRes = await fetch('/api/atbats');
      if (!scRes.ok) throw new Error(`atbats API ${scRes.status}`);
      const scData = await scRes.json();
      statcastPlayers = scData.players || [];
      console.log('[Players] atbats players received:', statcastPlayers.length);
    } catch(atbatsErr) {
      console.warn('[Players] /api/atbats failed:', atbatsErr.message, '— trying /api/statcast fallback');
      try {
        const scRes2 = await fetch('/api/statcast?year=2026&minAB=5');
        if (!scRes2.ok) throw new Error(`statcast API ${scRes2.status}`);
        const scJson = await scRes2.json();
        // Map from old statcast format to new format
        statcastPlayers = (scJson.players || []).map(r => ({
          pid:          parseInt(r.player_id || r.pid || 0),
          name:         (() => {
            // Savant returns "last_name, first_name" — parse to "First Last"
            const combined = r['last_name, first_name'] || r['last_name,first_name'] || r.name || '';
            if (combined.includes(',')) {
              const [last, first] = combined.split(',');
              return `${first.trim()} ${last.trim()}`;
            }
            const fn = r.first_name || r.player_first_name || '';
            const ln = r.last_name  || r.player_last_name  || '';
            if (fn || ln) return `${fn} ${ln}`.trim();
            const id = r.player_id || r.pid || '?';
            // Last resort: look up name from MLB Stats API global map
            const fromMap = GLOBAL_PLAYER_TEAM_MAP[id]?.name;
            return fromMap || combined || `Unknown ${id}`;
          })(),
          team:         (() => { const t = r.team || r.team_name_abbrev || GLOBAL_PLAYER_TEAM_MAP[r.pid]?.team || ''; return normTeam((t && t !== '—') ? t : '—'); })(),
          // New atbats.js returns pre-calculated metrics from raw rows
          // Field names are direct — no leaderboard aliases needed
          avgEV:        r.avgEV        || parseFloat(r.exit_velocity_avg || r.avg_hit_speed || 0),
          maxEV:        r.maxEV        || parseFloat(r.max_hit_speed || 0),
          barrelPct:    r.barrel       || parseFloat(r.barrel_batted_rate || r.brl_percent || 0),
          hardHitPct:   r.hardHit      || parseFloat(r.hard_hit_percent || r.ev95percent || 0),
          sweetSpotPct: r.sweetSpot    || parseFloat(r.sweet_spot_percent || r.anglesweetspotpercent || 0),
          launchAngle:  r.launchAngle  || parseFloat(r.launch_angle_avg || r.avg_hit_angle || 0),
          flyBall:      r.flyBall      || parseFloat(r.fb_percent || 0),
          gbPct:        r.gbPct        || parseFloat(r.gb_percent || 0),
          ldPct:        r.ldPct        || 0,
          pullPct:      r.pullAir      || r.pulledAirPct || parseFloat(r.pull_percent || 0),
          pulledBarrelPct: r.pulledBarrel || 0,
          almostHRPct:  r.almostHRPct  || 0,
          xwoba:        r.xwoba        || parseFloat(r.est_woba || 0),
          xba:          r.xba          || parseFloat(r.est_ba || 0),
          xslg:         r.xslg         || parseFloat(r.est_slg || 0),
          avg:          r.avg          || parseFloat(r.ba || 0),
          slg:          r.slg          || parseFloat(r.slg || 0),
          obp:          r.obp          || parseFloat(r.obp || 0),
          pa:           r.pa           || parseInt(r.pa || 0),
          ab:           r.ab           || parseInt(r.abs || 0),
          hits:         r.hits         || 0,
          hr:           r.hr           || 0,
          xbh:          r.xbh          || 0,
          bb:           r.bb           || 0,
          k:            r.k            || 0,
          totalBases:   r.totalBases   || 0,
          abPerHR:      r.abPerHR      || 99,
          bip:          r.bip          || 0,
          chasePct:     r.chasePct     || r.oSwing || parseFloat(r.oz_swing_percent || 0),
          kPct:         r.kPct         || parseFloat(r.strikeout_percent || r.k_percent || 0),
          bbPct:        r.bbPct        || parseFloat(r.walk_percent || r.bb_percent || 0),
          zContactPct:  r.zContact     || parseFloat(r.z_contact_percent || 0),
          hand:         r.hand         || '',
          pos:          r.pos          || '',
        })).filter(r => r.pid && r.name && r.name.trim() && (r.avgEV > 0 || r.xwoba > 0));
        console.log('[Players] Statcast fallback players:', statcastPlayers.length);
      } catch(fallbackErr) {
        console.error('[Players] Both APIs failed:', fallbackErr.message);
        throw new Error('Could not load Statcast data from any source');
      }
    }

    if (statcastPlayers.length === 0) {
      throw new Error('No Statcast players returned');
    }

    // ── STEP 3: Build player objects with REAL metrics only ─
    const mapped = statcastPlayers.map(sc => {
      const pid = sc.pid;
      const team = normTeam(pt[pid] || sc.team || '—');

      // ── Build player object — all fields map directly from /api/atbats ──
      // atbats.js now calculates FB%/Pull% from raw bb_type counts (Power BI method)
      // sc.flyBall, sc.pullPct etc are already correctly calculated
      const name = sc.name && sc.name.trim() && !sc.name.startsWith('P')
        ? sc.name
        : GLOBAL_PLAYER_TEAM_MAP[sc.pid]?.name || sc.name || "";

      const p = {
        pid,
        name,
        team: normTeam(team && team !== '—' ? team : (GLOBAL_PLAYER_TEAM_MAP[pid]?.team || '—')),
        // ── Statcast metrics — read directly from API, no modification ──
        avgEV:        sc.avgEV        || 0,
        maxEV:        sc.maxEV        || 0,
        barrel:       sc.barrelPct    || 0,
        hardHit:      sc.hardHitPct   || 0,
        sweetSpot:    sc.sweetSpotPct || 0,
        launchAngle:  sc.launchAngle  || 0,
        flyBall:      sc.flyBall      || 0,
        gbPct:        sc.gbPct        || 0,
        ldPct:        sc.ldPct        || 0,
        pullAir:      sc.pullPct      || 0,
        pulledBarrel: sc.pulledBarrelPct || 0,
        almostHRPct:  sc.almostHRPct  || 0,
        xwoba:        sc.xwoba        || 0,
        xba:          sc.xba          || 0,
        xslg:         sc.xslg         || 0,
        avg:          sc.avg          || 0,
        slg:          sc.slg          || 0,
        obp:          sc.obp          || 0,
        ops:          (sc.slg || 0) + (sc.obp || 0),
        pa:           sc.pa           || 0,
        ab:           sc.ab           || 0,
        hits:         sc.hits         || 0,
        hr:           sc.hr           || 0,
        xbh:          sc.xbh          || 0,
        bb:           sc.bb           || 0,
        k:            sc.k            || 0,
        totalBases:   sc.totalBases   || 0,
        abPerHR:      sc.abPerHR      || 99,
        bip:          sc.bip          || 0,
        pos:          sc.pos || GLOBAL_PLAYER_TEAM_MAP[sc.pid]?.pos || '',
        hand:         sc.hand || GLOBAL_PLAYER_TEAM_MAP[sc.pid]?.hand || 'R',
        oSwing:       sc.chasePct     || 0,
        kPct:         sc.kPct         || 0,
        bbPct:        sc.bbPct        || 0,
        zContact:     sc.zContactPct  || 0,
        bbkRatio:     sc.bbPct > 0 && sc.kPct > 0 ? sc.bbPct / sc.kPct : 0.4,
        recentAtBats: sc.recentAtBats || [],
      };

      // ── STEP 4: Calculate grades from REAL metrics ─────────
      p.heatScore = getHS(p);
      p.cq  = calcCQ(p);
      p.hri = calcHRI(p);
      p.rd  = calcRD(p);
      p.os  = calcOS(p);
      p.grade = getSG(p.os);
      p.piq = getPIQ(p);

      // ── STEP 5: Windows — prefer real per-window data from players.json ─
      // players.json stores keys: last7, last14, last30, last60, season2026
      // Only fall back to genWindows() if the pipeline didn't supply real ones
      const realWins = sc.windows && typeof sc.windows === 'object' && Object.keys(sc.windows).length > 0;
      p.windows = realWins ? sc.windows : genWindows(p);

      return p;
    }).filter(p => p.pid && p.pid > 0 && (p.avgEV > 0 || p.xwoba > 0));

    // ── STEP 5b: Fix any missing names from global player map ─
    mapped.forEach(p => {
      if (!p.name || p.name.startsWith('Player') || p.name.startsWith('Unknown') || p.name === '') {
        const fromMap = GLOBAL_PLAYER_TEAM_MAP[p.pid]?.name;
        if (fromMap) p.name = fromMap;
      }
      // Normalize legacy team abbreviations (e.g. OAK → ATH)
      p.team = normTeam(p.team);
      // Fix team from global map if missing
      if (!p.team || p.team === '—') {
        const teamFromMap = GLOBAL_PLAYER_TEAM_MAP[p.pid]?.team;
        if (teamFromMap) p.team = normTeam(teamFromMap);
      }
    });

    // ── STEP 6: Pipeline is source of truth for HR counts ─────
    // HR leaders API was removed — it caused mismatches for traded players
    // and players with 0 regular-season HRs (spring training inflated to 0,
    // then API overwrote with a different player's count).
    // The pipeline at-bat log now correctly excludes spring training (season_start 3/25)
    // and deduplicates Play IDs, making it the accurate source.
    console.log('[Players] HR counts from pipeline at-bat log only (no API overwrite)');

    // ── Kick off async real window fetches in background ──────
    // These update the counting stats (H, AB, HR per window) from game logs
    // without blocking the initial render
    const WIN_KEY_MAP = {3:'last7',7:'last7',14:'last14',15:'last14',30:'last30',60:'last60'};
    mapped.slice(0, 50).forEach(p => {
      if (p.pid) {
        fetchRealWindows(p.pid).then(realWin => {
          if (!realWin) return;
          const cached = getCachedPlayer(p.pid);
          if (!cached) return;
          // realWin may have numeric keys (3,7,14,30) — map to string keys
          Object.entries(realWin).forEach(([k, wData]) => {
            const winKey = WIN_KEY_MAP[parseInt(k)] || (isNaN(k) ? k : null);
            if (!winKey || !wData) return;
            if (!cached.windows) cached.windows = {};
            if (cached.windows[winKey]) {
              Object.assign(cached.windows[winKey], {
                hits:      wData.hits,
                hr:        wData.hr,
                atBats:    wData.ab,
                xbh:       wData.xbh,
                tb:        wData.tb,
                avg:       parseFloat(wData.avg),
                bbPct:     wData.bbPct,
                kPct:      wData.kPct,
                abPerHR:   wData.abPerHR,
                abSinceHR: wData.abSinceHR,
                games:     wData.games,
              });
            }
          });
        }).catch(() => {});
      }
    });

    // ── Cache and deliver ─────────────────────────────────────
    const sorted = mapped.sort((a,b) => (b.os||0)-(a.os||0));
    if (sorted.length > 0) {
      PLAYER_CACHE_DATE = Date.now(); // timestamp for 3-hour TTL
      sorted.forEach(p => {
  // Enrich team from global map if still missing
  // Normalize legacy team abbreviations (e.g. OAK → ATH)
  p.team = normTeam(p.team);
  if (!p.team || p.team === '—' || p.team === '-') {
    const mapped = GLOBAL_PLAYER_TEAM_MAP[p.pid]?.team;
    if (mapped && mapped !== '—') p.team = normTeam(mapped);
  }
  cachePlayer(p);
});
      setP(sorted);
      console.log('[Players] Done. Top player:', sorted[0]?.name, 'OS:', sorted[0]?.os, 'EV:', sorted[0]?.avgEV);
    } else {
      throw new Error('No players after mapping');
    }

  } catch(e) {
    console.error('[Players] Fatal:', e.message);
    setE('Could not load player data: ' + e.message);
    setP(SPLAYERS);
  } finally {
    setL(false);
  }
}


async function fetchGames(setL, setG, setE, silent=false) {
  if (!silent) setL(true);
  setE(null);
  try {
    // Use Eastern Time for date — MLB schedule is ET-based
    const etDate = new Date().toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      year: "numeric", month: "2-digit", day: "2-digit"
    });
    const [m,d,y] = etDate.split("/");
    const today = `${y}-${m}-${d}`;

    // After midnight check: if it's before 4 AM ET, also fetch yesterday's schedule
    // to catch games that started the night before and are still live/not final
    const etHour = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York", hour: "numeric", hour12: false
    });
    const isLateNight = parseInt(etHour) < 4; // midnight → 3:59 AM ET — pipeline runs at 3am

    let allGameData = [];

    if (isLateNight) {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yDate = yest.toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        year: "numeric", month: "2-digit", day: "2-digit"
      });
      const [ym,yd,yy] = yDate.split("/");
      const yesterday = `${yy}-${ym}-${yd}`;

      // Fetch yesterday in parallel with today
      const [yRes, tRes] = await Promise.all([
        fetch(`/api/schedule?date=${yesterday}`),
        fetch(`/api/schedule?date=${today}`)
      ]);
      const [yData, tData] = await Promise.all([yRes.json(), tRes.json()]);

      // Only keep yesterday's games that are NOT yet final
      const yGames = (yData.dates?.[0]?.games || []).filter(g => {
        const abs = g.status?.abstractGameState || "";
        const coded = g.status?.codedGameState || "";
        return abs === "Live" || (coded !== "F" && coded !== "O" && abs !== "Final" && abs !== "Game Over");
      });

      allGameData = [...yGames, ...(tData.dates?.[0]?.games || [])];
    } else {
      const res = await fetch(`/api/schedule?date=${today}`);
      const data = await res.json();
      allGameData = data.dates?.[0]?.games || [];
    }

    const games = allGameData.map(g => {
      const aw = g.teams?.away, hm = g.teams?.home, ls = g.linescore || {};
      // Team abbreviation — try every possible path
      const awTeam = aw?.team || {};
      const hmTeam = hm?.team || {};
      const _tAbbr = id => ({133:'ATH',134:'PIT',135:'SD',136:'SEA',137:'SF',138:'STL',139:'TB',140:'TEX',141:'TOR',142:'MIN',143:'PHI',144:'ATL',145:'CWS',146:'MIA',147:'NYY',158:'MIL',108:'LAA',109:'ARI',110:'BAL',111:'BOS',112:'CHC',113:'CIN',114:'CLE',115:'COL',116:'DET',117:'HOU',118:'KC',119:'LAD',120:'WSH',121:'NYM'})[id] || '???';
      const awAbbr = awTeam.abbreviation || awTeam.teamCode?.toUpperCase() ||
                     (awTeam.teamName ? awTeam.teamName.slice(0,3).toUpperCase() : null) ||
                     _tAbbr(awTeam.id);
      const hmAbbr = hmTeam.abbreviation || hmTeam.teamCode?.toUpperCase() ||
                     (hmTeam.teamName ? hmTeam.teamName.slice(0,3).toUpperCase() : null) ||
                     _tAbbr(hmTeam.id);
      // Venue for home/away context
      const venue = g.venue?.name || "";
      // Probable pitchers
      const awPP = aw?.probablePitcher?.fullName || null;
      const hmPP = hm?.probablePitcher?.fullName || null;
      // Pitcher handedness from hydrated data
      const awHand = aw?.probablePitcher?.pitchHand?.code || "R";
      const hmHand = hm?.probablePitcher?.pitchHand?.code || "R";
      return {
        id: g.gamePk, gamePk: g.gamePk,
        status: (() => {
          const abs = g.status?.abstractGameState || "";
          const detailed = g.status?.detailedState || "";
          const coded = g.status?.codedGameState || "";
          // Live: In Progress, Manager Challenge, Delayed, etc.
          if (abs === "Live") return "Live";
          if (abs === "Final" || abs === "Game Over") return "Final";
          // Some games show as "I" (in progress) in codedGameState
          if (coded === "I" || coded === "M" || coded === "N") return "Live";
          if (coded === "F" || coded === "O") return "Final";
          return "Preview";
        })(),
        detailedState: g.status?.detailedState || "",
        inning: ls.currentInning ? `${ls.inningHalf === "Bottom" ? "▼" : "▲"} ${ls.currentInning}` : null,
    currentInning: ls.currentInning || null,
    currentHalf: ls.inningHalf || null,
    innings: (ls.innings||[]).map(inn=>({num:inn.num,away:inn.away?.runs??'',home:inn.home?.runs??''})),
    awayRuns: ls.teams?.away?.runs??aw?.score??'-',
    homeRuns: ls.teams?.home?.runs??hm?.score??'-',
    outs: ls.outs ?? null,
    runners: {
      first:  !!(ls.offense?.first),
      second: !!(ls.offense?.second),
      third:  !!(ls.offense?.third),
      outs:   ls.outs ?? null,
    },
        venue,
        gameTime: (() => {
          // Game start time in ET
          const gt = g.gameDate || g.gameTime || "";
          if (!gt) return null;
          try {
            return new Date(gt).toLocaleTimeString("en-US",{
              timeZone:"America/New_York",
              hour:"numeric",minute:"2-digit",hour12:true
            });
          } catch { return null; }
        })(),
        away: {
          abbr: awAbbr,
          teamId: aw?.team?.id,
          score: aw?.score ?? "-",
          record: `${aw?.leagueRecord?.wins || 0}-${aw?.leagueRecord?.losses || 0}`,
          probablePitcher: awPP,
          probablePitcherId: aw?.probablePitcher?.id || null,
          pitcherHand: awHand,
        },
        home: {
          abbr: hmAbbr,
          teamId: hm?.team?.id,
          score: hm?.score ?? "-",
          record: `${hm?.leagueRecord?.wins || 0}-${hm?.leagueRecord?.losses || 0}`,
          probablePitcher: hmPP,
          probablePitcherId: hm?.probablePitcher?.id || null,
          pitcherHand: hmHand,
        },
      };
    });
    // Update FINAL_GAME_IDS so all 4 tables can filter completed games
    FINAL_GAME_IDS.clear();
    games.forEach(g => { if (g.status === 'Final') FINAL_GAME_IDS.add(String(g.id)); });
    setG(games);
  } catch (e) {
    console.error("fetchGames error:", e.message);
    setE(e.message);
    setG(SGAMES);
  }
  finally { setL(false); }
}

async function fetchLiveBatters(gamePk) {
  try {
    // Single call to our proxy — boxscore.js now fetches live feed server-side
    // This avoids CORS errors from direct browser → statsapi.mlb.com calls
    const boxRes = await fetch(`/api/boxscore?gamePk=${gamePk}`);
    const data = await boxRes.json();

    // Statcast data comes pre-parsed from the server
    // Map: batterId → { evs[], las[], distances[], hardHits, barrels }
  const liveStatcast    = data.statcastByBatter || {};
  const currentBatterId = data.currentBatterId  || null;
  const onDeckId        = data.onDeckId         || null;
  const inTheHoleId     = data.inTheHoleId      || null;
  // Base runners — read from liveLinescore (renamed to avoid collision with boxscore's own linescore key)
  const offense         = data.liveLinescore?.offense || data.linescore?.offense || {};
  const linescoreData   = data.liveLinescore || data.linescore || {};
  const runners = {
    first:  !!(offense.first),
    second: !!(offense.second),
    third:  !!(offense.third),
    outs:   linescoreData.outs ?? null,
  };
  // Last play description from live feed
  const lastPlay = data.lastPlay || null; // { event, description, batterId }

    const avg = (arr) => arr.length > 0 ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length*10)/10 : null;

    const batters = [];
    for (const side of ["away", "home"]) {
      const team = data.teams?.[side], ta = team?.team?.abbreviation || side.toUpperCase();
      // active lineup = players currently IN the game (not subbed out)
      const activeLineup = new Set(team?.lineup || []);
      // Starting batters: clean battingOrder divisible by 100
      const startingBatterIds = new Set(
        (team?.batters || []).filter(bid => {
          const pp = team?.players?.[`ID${bid}`];
          const bo = pp?.battingOrder;
          return bo && bo % 100 === 0;
        })
      );
      for (const bid of (team?.batters || [])) {
        const p = team?.players?.[`ID${bid}`]; if (!p) continue;
        const posCode = p?.position?.code || p?.person?.primaryPosition?.code || '';
        if (posCode === '1' || posCode === 'P') continue;

        const s = p?.stats?.batting || {};
        const ab     = parseInt(s.atBats || 0);
        const hits   = parseInt(s.hits || 0);
        const hr     = parseInt(s.homeRuns || 0);
  const rbi   = parseInt(s.rbi || 0);
        const bb     = parseInt(s.baseOnBalls || 0);
        const so     = parseInt(s.strikeOuts || 0);
        const runs   = parseInt(s.runs || 0);
        const doubles= parseInt(s.doubles || 0);
        const triples= parseInt(s.triples || 0);
        const totalBases = hits + doubles + (triples*2) + (hr*3);

        // ── Real in-game Statcast ──────────────────────────────
        const live = liveStatcast[bid];
        const cachedP = getCachedPlayer(bid);

        // In-game averages from real play-by-play hitData
        const gameAvgEV   = live?.evs.length   > 0 ? avg(live.evs)   : null;
        const gameAvgLA   = live?.las.length   > 0 ? avg(live.las)   : null;
        const gameAvgDist = live?.distances.length > 0 ? avg(live.distances) : null;
        const gameHardHits= live?.hardHits ?? 0;
        const gameBarrels = live?.barrels  ?? 0;

        // Season Statcast from cache (Baseball Savant)
        const seasonEV    = cachedP?.avgEV    || 0;
        const seasonBarrel= cachedP?.barrel   || 0;
        const seasonHH    = cachedP?.hardHit  || 0;

        // Display: use real in-game EV if we have it, season avg as fallback label
        const displayEV  = gameAvgEV  ?? seasonEV;
        const displayLA  = gameAvgLA  ?? cachedP?.launchAngle ?? 0;
        const displayDist= gameAvgDist ?? 0;

        // Heat label uses in-game EV, hard hits, LA
        const heatLabel = (() => {
        // HR today → top grade regardless of EV/LA
        if (hr > 0) return {label:'💥 Gone Yard', cls:'gone_yard'};
        return getLHL(displayEV, displayLA, gameHardHits);
      })();

        batters.push({
          id: bid,
          name: p?.person?.fullName || `Player ${bid}`,
          team: ta,
          pos: p?.position?.abbreviation || cachedP?.pos || '',
          ab, hits, hr, rbi, bb, so, runs, totalBases,

          // In-game Statcast (from live feed play-by-play)
          avgEV:       gameAvgEV   !== null ? gameAvgEV   : seasonEV,
          launchAngle: gameAvgLA   !== null ? gameAvgLA   : (cachedP?.launchAngle ?? 0),
          avgDist:     gameAvgDist !== null ? gameAvgDist : 0,
          hardHits:    gameHardHits, // count of ≥95mph balls in play TODAY

          // Labels for UI
          gameEVLabel: gameAvgEV !== null
            ? `${gameAvgEV} mph avg (${live.evs.length} BIP)`
            : seasonEV > 0 ? `${seasonEV} season avg` : "—",
          gameHHLabel: gameHardHits > 0
            ? `${gameHardHits} hard hit${gameHardHits>1?"s":""} today`
            : seasonHH > 0 ? `${seasonHH}% season` : "—",

          heatLabel,

          // Season baselines (from Savant cache)
          barrel:          seasonBarrel,
          hardHit:         seasonHH,
          seasonAvgEV:     seasonEV,
          recentBarrel:    seasonBarrel,
          recentHardHit:   seasonHH,
          recentAvgEV:     seasonEV,
          pullAirPct:      cachedP?.pullAir  || 0,
          flyBallPct:      cachedP?.flyBall  || 0,
          xwoba:           cachedP?.xwoba    || 0,
          atBats:          live?.atBats      || [],
          isAtBat:         bid === currentBatterId,
          isOnDeck:        bid === onDeckId,
          isInTheHole:     bid === inTheHoleId,
          isPinchHitter:   posCode === 'PH' || posCode === 'PR' || (!startingBatterIds.has(bid) && ab > 0),
          isSubbedOut:     startingBatterIds.has(bid) && activeLineup.size > 0 && !activeLineup.has(bid),
          lineupSlot:      p?.battingOrder ? Math.round(p.battingOrder / 100) : null,
        });
      }
    }

  return {
    batters: batters.sort((a,b) => {
      if (a.isAtBat && !b.isAtBat)        return -1;
      if (b.isAtBat && !a.isAtBat)        return  1;
      if (a.isOnDeck && !b.isOnDeck)      return -1;
      if (b.isOnDeck && !a.isOnDeck)      return  1;
      if (a.isInTheHole && !b.isInTheHole) return -1;
      if (b.isInTheHole && !a.isInTheHole) return  1;
      const o = {gone_yard:5,elite:4,hot:3,warm:2,avg:1,cold:0};
      return (o[b.heatLabel.cls]||0) - (o[a.heatLabel.cls]||0);
    }),
    runners,
    lastPlay,
  };
  } catch(e) {
    console.warn('[LiveBatters]', e.message);
    return { batters: SLB, runners: {first:false,second:false,third:false}, lastPlay: null };
  }
}

// Cache liftoff results so they don't re-randomize on every tap
const LIFTOFF_CACHE = {};

async function fetchLiftoffBatters(game) {
  // Invalidate cache every 5 minutes so engine updates propagate
  const cacheKey = `${game.gamePk}_${Math.floor(Date.now()/300000)}`;
  if (LIFTOFF_CACHE[cacheKey]) return LIFTOFF_CACHE[cacheKey];

  try {
    // ── Source 1: DAILY_PICKS_CACHE (matchup engine output) ──────────────
    // Prefer engine data — same source as Key Matchups and Sim Lab
    // Find all batters in daily_picks.csv for this game
    const gameId = String(game.gamePk);
    const teamsInGame = DAILY_GAME_MAP[gameId] || new Set();

    // Collect engine rows for this game's batting teams
    const engineRows = Object.values(DAILY_PICKS_CACHE).filter(r => {
      const rGid = String(r._gid || r.game_id || '').replace(/\.0$/,'');
      return rGid === gameId;
    });

    if (engineRows.length > 0) {
      // Sort by weighted_flag_score desc, then proj_hr_adj desc
      const sorted = [...engineRows].sort((a,b) =>
        (parseFloat(b.weighted_flag_score)||0) - (parseFloat(a.weighted_flag_score)||0) ||
        (parseFloat(b.proj_hr_adj)||0) - (parseFloat(a.proj_hr_adj)||0)
      ).slice(0, 12);

      const GRADE_CFG_LO = {
        'diamond': {color:'#ffcc00', label:'💎 Diamond'},
        'A+': {color:'#ff3010', label:'🔴 A+'},
        'A':  {color:'#ff7000', label:'🔥 A'},
        'B':  {color:'#f5a623', label:'⚡ B'},
        'C':  {color:'#8bc4e8', label:'👀 C'},
        'D':  {color:'#8a9db0', label:'❄️ D'},
      };

      const result = sorted.map(r => {
        const bid = parseInt(r.batter_id) || 0;
        const cachedP = getCachedPlayer(bid);
        const grade = r.grade || 'D';
        const cfg = GRADE_CFG_LO[grade] || GRADE_CFG_LO['D'];
        const projHR = parseFloat(r.proj_hr_adj) || 0;
        const recentEV = parseFloat(r.recent_avg_ev) || cachedP?.avgEV || 0;
        const recentBrl = parseFloat(r.recent_barrel_pct) || cachedP?.barrel || 0;
        const recentFB  = parseFloat(r.recent_fb_pct)  || cachedP?.flyBall || 0;
        const daysSinceHR = cachedP?.daysSinceHR ?? null;
        const due = isDueFromRow(r, bid);
        const inSlump = r.in_slump === 'True' || r.in_slump === true;
        const isDiamond = r.is_diamond === 'True' || r.is_diamond === true;

        // Build signals from engine flags — same as Key Matchups
        const signals = [];
        if (isDiamond) signals.push({t:'💎 Diamond', c:'fire'});
        if (due) signals.push({t:'⏳ Due', c:'ice'});
        if (r.recent_ev_flag==='True'||r.recent_ev_flag===true) signals.push({t:`${recentEV.toFixed(0)} mph EV`, c:'pos'});
        if (r.recent_barrel_flag==='True'||r.recent_barrel_flag===true) signals.push({t:`${recentBrl.toFixed(0)}% Brl L7`, c:'pos'});
        if (r.bvp_ev_flag==='True'||r.bvp_ev_flag===true) signals.push({t:'Hard BvP contact', c:'pos'});
        if (inSlump) signals.push({t:'📉 Slump', c:'neg'});
        if (daysSinceHR>=4&&daysSinceHR<=10) signals.push({t:`${daysSinceHR}d since HR`, c:'fire'});

        return {
          id: bid, name: r.batter || `Player ${bid}`,
          team: r.batting_team || '',
          isHome: r.batting_team === r.home_team,
          grade, gradeColor: cfg.color, gradeLabel: cfg.label,
          projHR, recentEV, recentBrl, recentFB,
          bvpEV: parseFloat(r.bvp_avg_ev)||0,
          totalFlags: parseInt(r.total_flags)||0,
          weightedScore: parseFloat(r.weighted_flag_score)||0,
          daysSinceHR,
          due, inSlump, isDiamond,
          signals: signals.slice(0,4),
          pitcher: r.pitcher || '',
          pitcherHand: r.pitcher_hand || '',
          hr: cachedP?.hr || 0,
          pos: cachedP?.pos || '',
          // Keep for slide-out compatibility
          barrel: cachedP?.barrel || 0,
          hardHit: cachedP?.hardHit || 0,
          avgEV: cachedP?.avgEV || 0,
          flyBall: cachedP?.flyBall || 0,
          // Legacy liftoff fields (for LRow render)
          liftoffScore: Math.round(parseFloat(r.weighted_flag_score)*20 + projHR*100),
          verdict: {
            label: cfg.label,
            cls: grade==='A+'||grade==='diamond'?'primed': grade==='A'?'hot': grade==='B'?'watch':'cold'
          },
          atBats: [],
        };
      });

      LIFTOFF_CACHE[cacheKey] = result;
      return result;
    }

    // ── Fallback: boxscore + player cache (no engine data yet) ───────────
    const res = await fetch(`/api/boxscore?gamePk=${game.gamePk}`);
    const data = await res.json();
    const batters = [];

    for (const side of ["away", "home"]) {
      const team = data.teams?.[side];
      const ta = team?.team?.abbreviation || game[side]?.abbr || side.toUpperCase();
      const isHome = side === "home";
      const batterIds = team?.batters?.length > 0
        ? team.batters.slice(0, 9)
        : Object.keys(team?.players || {}).slice(0, 9).map(k => parseInt(k.replace("ID","")));
      const pitchSide = side === "away" ? "home" : "away";
      const pitcherHand = game[pitchSide]?.pitcherHand || "R";

      for (const bid of batterIds) {
        const p = team?.players?.[`ID${bid}`]; if (!p) continue;
        const liftPos = p?.position?.code || p?.person?.primaryPosition?.code || '';
        if (liftPos === '1' || liftPos === 'P') continue;
        const name = p?.person?.fullName || `Player ${bid}`;
        const cachedP = getCachedPlayer(bid);
        const avgEV = cachedP?.avgEV || 0;
        const barrel = cachedP?.barrel || 0;
        const hardHit = cachedP?.hardHit || 0;
        const flyBall = cachedP?.flyBall || 0;
        const hr = cachedP?.hr || 0;
        const daysSinceHR = DAYS_SINCE_HR_CACHE[bid]?.days ?? null;
        const due = isDue(bid);

        const signals = [];
        if (due) signals.push({t:'⏳ Due', c:'ice'});
        if (avgEV >= 95) signals.push({t:`${avgEV.toFixed(0)} mph EV`, c:'pos'});
        if (barrel >= 10) signals.push({t:`${barrel.toFixed(0)}% Barrel`, c:'pos'});

        const b = {
          id: bid, name, team: ta, isHome,
          grade: null, gradeColor: 'var(--muted)', gradeLabel: '— No data',
          projHR: 0, recentEV: avgEV, recentBrl: barrel, recentFB: flyBall,
          totalFlags: 0, weightedScore: 0,
          barrel, hardHit, avgEV, flyBall, hr,
          daysSinceHR, due, signals,
          pitcher: game[pitchSide]?.probablePitcher || '',
          pitcherHand,
          pos: p?.position?.abbreviation || cachedP?.pos || '',
          liftoffScore: Math.round(avgEV * 0.3 + barrel * 0.5),
          verdict: {label:'— No grade', cls:'cold'},
          atBats: [],
        };
        batters.push(b);
      }
    }

    if (batters.length === 0) return genSL();
    const result = batters.sort((a,b) => b.liftoffScore - a.liftoffScore).slice(0,12);
    LIFTOFF_CACHE[cacheKey] = result;
    return result;
  } catch(err) {
    console.warn("fetchLiftoffBatters failed:", err.message);
    return genSL();
  }
}

function genSL() {
  // Use top players from real Statcast cache instead of fake names/stats
  const cached = Object.values(PLAYER_DATA_CACHE);
  if (cached.length > 0) {
    return cached
      .filter(p => p.avgEV > 0 && p.name && p.team)
      .sort((a,b) => (b.os||0) - (a.os||0))
      .slice(0, 12)
      .map((p, i) => {
        const b = {
          id: p.pid, name: p.name, team: p.team,
          isHome: i % 2 === 0,
          barrel:        p.barrel      || 0,
          hardHit:       p.hardHit     || 0,
          avgEV:         p.avgEV       || 0,
          sweetSpot:     p.sweetSpot   || 0,
          pullAir:       p.pullAir     || 0,
          flyBall:       p.flyBall     || 0,
          recentBarrel:  p.windows?.last7?.barrel  ?? p.barrel   ?? 0,
          recentHardHit: p.windows?.last7?.hardHit ?? p.hardHit  ?? 0,
          recentAvgEV:   p.windows?.last7?.avgEV   ?? p.avgEV    ?? 0,
          recentPullAir: p.windows?.last7?.pullAir ?? p.pullAir  ?? 0,
          recentFlyBall: p.windows?.last7?.flyBall ?? p.flyBall  ?? 0,
          daysSinceHR:   DAYS_SINCE_HR_CACHE[p.pid]?.days ?? null,
          pitcherFactor: 0,
          homeHR:        p.hr > 0 ? (p.hr / 162) * 1.05 : 0.04,
          awayHR:        p.hr > 0 ? (p.hr / 162) * 0.95 : 0.03,
          hr:            p.hr || 0,
          pos:           p.pos || '',
        };
        b.liftoffScore = calcLS(b); b.verdict = getLV(b.liftoffScore); b.signals = getLSigs(b);
        return b;
      })
      .sort((a,b) => b.liftoffScore - a.liftoffScore);
  }
  // True last resort — only if cache is completely empty (first load)
  return [];
}

// Pitcher API cache — pid → {pitchMix, stats}
const PITCHER_API_CACHE = {};

async function fetchPitcherData(pid, name) {
  if (!pid && !name) return null;
  const key = pid || name;
  if (PITCHER_API_CACHE[key]) return PITCHER_API_CACHE[key];
  try {
    const url = pid ? `/api/pitcher?pid=${pid}&year=2026` : `/api/pitcher?name=${encodeURIComponent(name)}&year=2026`; // Falls back to 2025 in pitcher.js
    const res = await fetch(url);
    const data = await res.json();
    if (data.found) {
      PITCHER_API_CACHE[key] = data;
      return data;
    }
  } catch(e) { console.warn('[PitcherData] failed:', e.message); }
  return null;
}

const PITCHER_CACHE = {};

async function fetchRealPitcher(game, side) {
  const cacheKey = `${game.gamePk}-${side}`;
  if (PITCHER_CACHE[cacheKey]) return PITCHER_CACHE[cacheKey];
  const ta   = game[side]?.abbr || "MLB";
  const name = game[side]?.probablePitcher || null;
  const hand = game[side]?.pitcherHand || "R";
  const base = { name: name || `${ta} Starter`, hand: hand==="L"?"LHP":"RHP", team:ta, era:"—", whip:"—", fbVelo:0, pitchMix:[], loading:false };
  if (!name) return base;
  try {
    const _TIDS = {ARI:109,ATL:144,BAL:110,BOS:111,CHC:112,CWS:145,CIN:113,CLE:114,COL:115,DET:116,HOU:117,KC:118,LAA:108,LAD:119,MIA:146,MIL:158,MIN:142,NYM:121,NYY:147,OAK:133,PHI:143,PIT:134,SD:135,SEA:136,SF:137,STL:138,TB:139,TEX:140,TOR:141,WSH:120};
    const teamId = _TIDS[ta];
    if (!teamId) return base;
    const rRes = await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active&season=2026`);
    const rData = await rRes.json();
    const ln = name.split(" ").pop().toLowerCase();
    const rp = (rData.roster||[]).find(r => r.person?.fullName?.toLowerCase().includes(ln) && r.position?.code==="1");
    if (!rp?.person?.id) return base;
    const pid = rp.person.id;
    const [sRes, pRes] = await Promise.all([
      fetch(`https://statsapi.mlb.com/api/v1/people/${pid}/stats?stats=season&group=pitching&season=2026&sportId=1`),
      fetch(`/api/pitcher?pid=${pid}&year=2026`),
    ]);
    const sData = await sRes.json();
    const s = sData.stats?.[0]?.splits?.[0]?.stat || {};
    const pData = pRes.ok ? await pRes.json() : null;
    const result = { ...base, pid, era:s.era||"—", whip:s.whip||"—", k9:s.strikeoutsPer9Inn||"—", bb9:s.walksPer9Inn||"—", hr9:s.homeRunsPer9||"—", pitchMix:pData?.pitchMix||[] };
    const fb = result.pitchMix.find(px => px.code==="FF" || px.name?.includes("Fastball") || px.name?.includes("FB"));
    if (fb?.velo) result.fbVelo = parseFloat(fb.velo);
    PITCHER_CACHE[cacheKey] = result;
    return result;
  } catch(e) { console.warn('[fetchRealPitcher]', e.message); return base; }
}

function genPitcher(game, side) {
  const ta = game[side]?.abbr || "MLB";
  const name = game[side]?.probablePitcher || `${ta} Starter`;
  const realHand = game[side]?.pitcherHand || "R";
  // Start with placeholder — real data loads async in BvPTab
  return {
    name, hand: realHand === "L" ? "LHP" : "RHP", team: ta,
    era: "—", whip: "—", fbVelo: 0,
    pitchMix: [], // populated async by fetchPitcherData
    loading: true,
  };
}

function genBvPBatters(pitcher) {
  // Use top real players from Statcast cache instead of hardcoded names
  const cached = Object.values(PLAYER_DATA_CACHE);
  if (cached.length === 0) return [];
  return cached
    .filter(p => p.avgEV > 0 && p.name && p.team)
    .sort((a,b) => (b.os||0)-(a.os||0))
    .slice(0, 12)
    .map(p => buildBvPBatter(p.pid, p.name, p.team, null, pitcher))
    .filter(Boolean)
    .sort((a,b) => b.ms - a.ms);
}

// Build a real BvP batter object from Statcast cache — no seededRand
function buildBvPBatter(bid, name, team, handOverride, pitcher) {
  const c = getCachedPlayer(bid) || {};
  const hand = handOverride || GLOBAL_PLAYER_TEAM_MAP[bid]?.hand || 'R';
  const pitcherHand = pitcher?.hand === 'LHP' ? 'L' : 'R';
  const matchup = getHandMatchup(hand, pitcherHand);
  const m = matchup.multiplier;

  // All metrics from real Statcast at-bat data (Baseball Savant leaderboard)
  const barrel    = c.barrel     || 0;
  const hardHit   = c.hardHit    || 0;
  const avgEV     = c.avgEV      || 0;
  const sweetSpot = c.sweetSpot  || 0;
  const pullAir   = c.pullAir    || 0;
  const flyBall   = c.flyBall    || 0;
  const bbPct     = c.bbPct      || 0;
  const kPct      = c.kPct       || 0;
  const oSwing    = c.oSwing     || 0;
  const zContact  = c.zContact   || 0;
  const xwoba     = c.xwoba      || 0;
  const hr        = c.hr         || 0;
  const launchAngle = c.launchAngle || 0;

  // Adjust metrics for platoon matchup (real multiplier from hand matchup)
  // These are real adjustments, not random — platoon advantage is well documented
  const evVsFB        = Math.round((avgEV + matchup.evBonus) * 10) / 10;
  const barrelVsPitch = Math.round(barrel  * m * 10) / 10;
  const flyBallVsPitch= Math.round(flyBall * (m * 0.8 + 0.2) * 10) / 10;
  const laVsPitch     = Math.round((launchAngle + (m > 1 ? 1.5 : -1.5)) * 10) / 10;
  const pullVsPitch   = Math.round(pullAir * (m * 0.7 + 0.3) * 10) / 10;
  const chaseVsPitch  = Math.round(oSwing * (m > 1 ? 0.92 : 1.08) * 10) / 10;
  const bbkRatio      = kPct > 0 ? bbPct / kPct : 0;

  const b = {
    id: bid, name, team, hand, matchup,
    barrel, hardHit, avgEV, sweetSpot, pullAir, flyBall,
    launchAngle, bbPct, kPct, oSwing, zContact, xwoba, hr, bbkRatio,
    // Matchup-adjusted values
    evVsFB, barrelVsPitch, flyBallVsPitch,
    launchAngleVsPitch: laVsPitch,
    pullAirVsPitch: pullVsPitch,
    chaseVsPitch,
    // Season game log stats (real, not fake)
    avg:      c.avg     || 0,
    hits:     c.hits    || 0,
    xbh:      c.xbh     || 0,
    totalBases: c.totalBases || 0,
  };
  b.cq = calcCQ(b); b.hri = calcHRI(b); b.rd = calcRD(b);
  b.os = calcOS(b); b.grade = getSG(b.os);
  // Matchup score: weighted blend of platoon-adjusted metrics
  const evN  = Math.min(Math.max((evVsFB - 86) / 14, 0), 1);
  const barN = Math.min(barrelVsPitch / 14, 1);
  const fbN  = Math.min(flyBallVsPitch / 45, 1);
  const laN  = Math.min(Math.max((laVsPitch - 8) / 24, 0), 1);
  const puN  = Math.min(pullVsPitch / 28, 1);
  const chN  = Math.max(1 - chaseVsPitch / 45, 0);
  const base = evN*28 + barN*24 + fbN*15 + laN*13 + puN*10 + chN*10;
  const handBonus = m > 1.05 ? 8 : m < 0.92 ? -8 : -2;
  b.ms = Math.round(Math.min(Math.max(base + handBonus, 0), 100) * 10) / 10;
  b.mg = getSG(b.ms);
  return b;
}

// SAMPLE DATA
const SPLAYERS = [
  {pid:1,name:"Aaron Judge",team:"NYY",barrel:17.8,sweetSpot:46.1,hardHit:58.3,avgEV:98.2,pullAir:44.1,flyBall:40.2,launchAngle:28.5,hr:18,bbPct:12.1,kPct:26.2,oSwing:18.5,zContact:81.5},
  {pid:2,name:"Shohei Ohtani",team:"LAD",barrel:16.2,sweetSpot:44.2,hardHit:55.1,avgEV:96.8,pullAir:42.5,flyBall:38.8,launchAngle:26.2,hr:20,bbPct:13.5,kPct:23.8,oSwing:21.0,zContact:83.2},
  {pid:3,name:"Yordan Alvarez",team:"HOU",barrel:15.8,sweetSpot:43.8,hardHit:56.2,avgEV:97.4,pullAir:43.5,flyBall:39.2,launchAngle:27.8,hr:14,bbPct:11.8,kPct:21.5,oSwing:22.8,zContact:85.0},
  {pid:4,name:"Pete Alonso",team:"NYM",barrel:15.4,sweetSpot:41.0,hardHit:52.3,avgEV:91.8,pullAir:26.0,hr:16,bbPct:9.2,kPct:28.4,oSwing:31.0,zContact:79.5},
  {pid:5,name:"Bryce Harper",team:"PHI",barrel:14.1,sweetSpot:39.5,hardHit:50.1,avgEV:91.2,pullAir:17.2,hr:11,bbPct:14.2,kPct:18.5,oSwing:24.2,zContact:86.0},
  {pid:6,name:"Gunnar Henderson",team:"BAL",barrel:13.8,sweetSpot:38.2,hardHit:51.0,avgEV:90.5,pullAir:20.4,hr:12,bbPct:10.5,kPct:25.0,oSwing:28.5,zContact:80.2},
  {pid:7,name:"Kyle Tucker",team:"HOU",barrel:13.2,sweetSpot:37.8,hardHit:49.6,avgEV:90.1,pullAir:19.8,hr:10,bbPct:11.0,kPct:22.8,oSwing:26.0,zContact:82.5},
  {pid:8,name:"Freddie Freeman",team:"LAD",barrel:12.8,sweetSpot:40.1,hardHit:51.5,avgEV:90.8,pullAir:16.5,hr:10,bbPct:12.8,kPct:17.2,oSwing:22.8,zContact:87.5},
  {pid:9,name:"Jose Ramirez",team:"CLE",barrel:12.5,sweetSpot:36.2,hardHit:48.0,avgEV:89.8,pullAir:21.3,hr:9,bbPct:10.2,kPct:16.8,oSwing:25.5,zContact:84.0},
  {pid:10,name:"Julio Rodriguez",team:"SEA",barrel:11.8,sweetSpot:35.8,hardHit:47.3,avgEV:89.5,pullAir:18.9,hr:9,bbPct:8.5,kPct:24.5,oSwing:30.0,zContact:78.5},
  {pid:11,name:"Adley Rutschman",team:"BAL",barrel:7.5,sweetSpot:28.3,hardHit:38.0,avgEV:85.1,pullAir:12.0,hr:4,bbPct:14.5,kPct:15.5,oSwing:21.5,zContact:88.5},
  {pid:12,name:"Bo Bichette",team:"TOR",barrel:11.1,sweetSpot:34.5,hardHit:46.2,avgEV:89.0,pullAir:16.1,hr:8,bbPct:7.2,kPct:20.5,oSwing:33.5,zContact:80.0},
].map(r => enrichP(r)).sort((a, b) => b.os - a.os);

const SGAMES = [
  {id:1,gamePk:1,status:"Live",inning:"▼ 5",away:{abbr:"NYY",score:3,record:"14-8",probablePitcher:null},home:{abbr:"BOS",score:2,record:"11-11",probablePitcher:null}},
  {id:2,gamePk:2,status:"Live",inning:"▲ 7",away:{abbr:"LAD",score:5,record:"16-6",probablePitcher:null},home:{abbr:"SD",score:3,record:"12-10",probablePitcher:null}},
  {id:3,gamePk:3,status:"Preview",inning:null,away:{abbr:"HOU",score:"-",record:"13-9",probablePitcher:"Framber Valdez"},home:{abbr:"TEX",score:"-",record:"10-12",probablePitcher:"Nathan Eovaldi"}},
  {id:4,gamePk:4,status:"Preview",inning:null,away:{abbr:"NYM",score:"-",record:"12-10",probablePitcher:"Kodai Senga"},home:{abbr:"PHI",score:"-",record:"14-8",probablePitcher:"Zack Wheeler"}},
  {id:5,gamePk:5,status:"Final",inning:null,away:{abbr:"CHC",score:4,record:"12-10",probablePitcher:null},home:{abbr:"STL",score:1,record:"9-13",probablePitcher:null}},
];

const SLB = [
  {id:1,name:"Aaron Judge",team:"NYY",ab:3,hits:2,hr:1,bb:0,so:1,runs:2,totalBases:5,avgEV:104.2,launchAngle:27.5,hardHits:2,heatLabel:getLHL(104.2,27.5,2),barrel:19.2,hardHit:58.3,seasonAvgEV:95.8,recentBarrel:21.0,recentHardHit:61.0,recentAvgEV:96.5,pullAirPct:22.1,flyBallPct:44.0},
  {id:2,name:"Shohei Ohtani",team:"LAD",ab:2,hits:1,hr:0,bb:1,so:0,runs:1,totalBases:2,avgEV:96.8,launchAngle:18.2,hardHits:1,heatLabel:getLHL(96.8,18.2,1),barrel:17.8,hardHit:55.1,seasonAvgEV:93.4,recentBarrel:16.5,recentHardHit:54.0,recentAvgEV:94.2,pullAirPct:24.5,flyBallPct:40.0},
  {id:3,name:"Manny Machado",team:"SD",ab:2,hits:1,hr:1,bb:0,so:0,runs:1,totalBases:4,avgEV:101.5,launchAngle:28.3,hardHits:2,heatLabel:getLHL(101.5,28.3,2),barrel:10.2,hardHit:44.1,seasonAvgEV:88.2,recentBarrel:13.0,recentHardHit:48.0,recentAvgEV:90.5,pullAirPct:15.8,flyBallPct:36.0},
  {id:4,name:"Rafael Devers",team:"BOS",ab:3,hits:0,hr:0,bb:0,so:2,avgEV:82.1,launchAngle:-4.2,hardHits:0,heatLabel:getLHL(82.1,-4.2,0),barrel:9.5,hardHit:43.0,seasonAvgEV:87.5,recentBarrel:7.0,recentHardHit:38.0,recentAvgEV:85.0,pullAirPct:18.0,flyBallPct:30.0},
];

// UI COMPONENTS
function Tip({text, children}) {
  return <div className="tw2">{children}<div className="tb">{text}</div></div>;
}

function HBar({score}) {
  const c = getHC(score);
  return <div className="hbc"><div className="hbb"><div className="hbf" style={{width:`${score}%`,background:c}}/></div><span className="hbn" style={{color:c}}>{score}</span></div>;
}


// Savant/Statcast deep link — opens batter or pitcher page on Baseball Savant
// pid = MLB player ID, type = 'batter' | 'pitcher'
function SavantLink({ pid, type='batter', size=9 }) {
  if (!pid || parseInt(pid) <= 0) return null;
  const url = `https://baseballsavant.mlb.com/savant-player/${pid}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      title="View on Baseball Savant"
      style={{display:'inline-flex',alignItems:'center',
        fontSize:10,textDecoration:'none',flexShrink:0,
        opacity:.5,transition:'opacity .12s'}}
      onMouseEnter={e=>e.currentTarget.style.opacity='1'}
      onMouseLeave={e=>e.currentTarget.style.opacity='.5'}>
      🔗
    </a>
  );
}

function SRing({score, color}) {
  const r = 16, ci = 2 * Math.PI * r, fill = (score / 100) * ci;
  return <div className="sr"><svg width="42" height="42" viewBox="0 0 42 42"><circle cx="21" cy="21" r={r} fill="none" stroke="var(--border)" strokeWidth="4"/><circle cx="21" cy="21" r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={`${fill} ${ci}`} strokeLinecap="round"/></svg><div className="srv" style={{color}}>{score}</div></div>;
}

function GBadge({g}) {
  return <div className={`gb ${g.cls}`}>{g.grade}</div>;
}

function SSBar({pct}) {
  const f = Math.round((pct / 55) * 8);
  return <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{display:"flex",gap:2}}>{Array.from({length:8}, (_, i) => <div key={i} style={{width:6,height:12,borderRadius:2,background:i<f ? pct>=38 ? "var(--fire2)" : "var(--green)" : "var(--border)"}}/>)}</div><span className="sv" style={{fontSize:10}}>{pct.toFixed(1)}%</span></div>;
}

function CBar({label, tv, l7, max, col}) {
  return <div className="cbr"><div className="cbl">{label}</div><div className="cbg"><div className="cbw"><div className="cbwl">TODAY</div><div className="cbb"><div className="cbbf" style={{width:`${Math.min((tv/max)*100,100)}%`,background:col}}/></div></div><div className="cbv" style={{color:col}}>{typeof tv==='number'?tv.toFixed(1):tv}</div><div className="cbw"><div className="cbwl">L7 AVG</div><div className="cbb"><div className="cbbf" style={{width:`${Math.min((l7/max)*100,100)}%`,background:"#4a6070"}}/></div></div><div className="cbv" style={{color:"#4a6070"}}>{typeof l7==='number'?l7.toFixed(1):l7}</div></div></div>;
}

function XRow({b}) {
  const inZ = inHRZ(b.launchAngle), zl = getLAZ(b.launchAngle);
  const evUp = b.avgEV >= (b.recentAvgEV ?? 88);
  const ec = b.avgEV >= T.EV_EL ? "#ff4020" : b.avgEV >= T.EV_HH ? "#ff8020" : "#8899a6";
  const vrd = b.avgEV >= T.EV_EL && inZ && b.hardHits >= 2 ? {t:"🔥 Everything working — prime HR condition", c:"#ff4020"} : b.avgEV >= T.EV_HH && inZ ? {t:"⚡ Hard contact in HR zone — heating up", c:"#ff8020"} : inZ ? {t:"🎯 Good angle — needs more exit velo", c:"#ffc840"} : b.avgEV >= T.EV_HH ? {t:"💪 Big velo, wrong angle — not lifting", c:"#38b8f2"} : {t:"❄️ Soft contact, bad angle — cold", c:"#38b8f2"};
  return <div className="xd">
    <div style={{marginBottom:9,padding:"7px 11px",background:"rgba(255,255,255,.03)",borderRadius:6,borderLeft:`3px solid ${vrd.c}`,fontSize:11,color:vrd.c,fontFamily:"DM Mono,monospace"}}>{vrd.t}</div>
    <div className="xg">
      <div className="xb"><div className="xbl">Avg EV <span style={{fontSize:8,opacity:.6}}>Today</span></div><div className="xbv" style={{color:ec}}>{b.avgEV.toFixed(1)}</div><div className="xbs" style={{color:evUp?"var(--green)":"var(--ice)"}}>{evUp?"▲":"▼"} vs L7 ({(b.recentAvgEV??88).toFixed(1)})</div></div>
      <div className="xb"><div className="xbl">Launch Angle</div><div className="xbv" style={{color:inZ?"var(--green)":"var(--muted)"}}>{b.launchAngle.toFixed(1)}°</div><div className="xbs" style={{color:inZ?"var(--green)":"var(--muted)"}}>{zl??"Outside HR zone"}</div></div>
      <div className="xb"><div className="xbl">Hard Hits 95+</div><div className="xbv" style={{color:b.hardHits>=2?"#ff8020":b.hardHits===1?"#ffc840":"var(--muted)"}}>{b.hardHits}</div><div className="xbs" style={{color:"var(--muted)"}}>this game</div></div>
      <div className="xb"><div className="xbl">Barrel% <span style={{fontSize:8,opacity:.6}}>L7</span></div><div className="xbv" style={{color:(b.recentBarrel!=null?b.recentBarrel:b.barrel??0)>=T.BAR_EL?"#ff4020":(b.recentBarrel!=null?b.recentBarrel:b.barrel??0)>=8?"#ff8020":"var(--text)"}}>{(b.recentBarrel!=null?b.recentBarrel:(b.barrel??0)).toFixed(1)}%</div><div className="xbs" style={{color:"var(--muted)"}}>L7</div></div>
      <div className="xb"><div className="xbl">HH% <span style={{fontSize:8,opacity:.6}}>L7</span></div><div className="xbv" style={{color:(b.recentHardHit!=null?b.recentHardHit:b.hardHit??0)>=50?"#ff4020":(b.recentHardHit!=null?b.recentHardHit:b.hardHit??0)>=40?"#ff8020":"var(--text)"}}>{(b.recentHardHit!=null?b.recentHardHit:(b.hardHit??0)).toFixed(1)}%</div><div className="xbs" style={{color:"var(--muted)"}}>L7</div></div>
      <div className="xb"><div className="xbl">FB% <span style={{fontSize:8,opacity:.6}}>L7</span></div><div className="xbv" style={{color:(b.recentFlyBall!=null?b.recentFlyBall:b.flyBall??0)>=35&&(b.recentFlyBall!=null?b.recentFlyBall:b.flyBall??0)<=45?"#ff8020":"var(--text)"}}>{(b.recentFlyBall!=null?b.recentFlyBall:(b.flyBall??0)).toFixed(1)}%</div><div className="xbs" style={{color:"var(--muted)"}}>L7</div></div>
    </div>
    <div style={{marginBottom:4,fontSize:9,color:"var(--muted)",fontFamily:"DM Mono,monospace",textTransform:"uppercase",letterSpacing:1}}>Today vs L7</div>
    <CBar label="Exit Velo" tv={b.avgEV} l7={b.recentAvgEV??88} max={112} col={ec}/>
    <CBar label="Hard Hit%" tv={(b.recentHardHit??0)>0?(b.recentHardHit??0):(b.hardHit??0)} l7={(b.recentHardHit??0)>0?(b.recentHardHit??0):(b.hardHit??0)} max={80} col="#ff8020"/>
    <div className="stags">
      {inZ && <span className="stag pos">✓ HR Zone</span>}
      {b.avgEV >= T.EV_HH && <span className="stag fire">⚡ 95+ MPH</span>}
      {(b.recentFlyBall??b.flyBall??0) >= 40 && <span className="stag pos">🚀 High FB%</span>}
      {b.avgEV < T.EV_HH && <span className="stag neg">⬇ Low EV</span>}
      {!inZ && <span className="stag neg">✗ Wrong Angle</span>}
    </div>

    {/* Box score summary */}
    {(b.ab > 0) && <div style={{
      display:'flex',gap:0,marginTop:10,marginBottom:8,
      border:'1px solid var(--border)',borderRadius:8,overflow:'hidden'
    }}>
      {[
        {label:'AB', val:b.ab,         color:'var(--text)'},
        {label:'H',  val:b.hits,       color:(b.hits||0)>0?'#27c97a':'var(--text)'},
        {label:'HR', val:b.hr,         color:(b.hr||0)>0?'var(--accent)':'var(--text)'},
        {label:'R',  val:b.runs??0,    color:(b.runs||0)>0?'#27c97a':'var(--text)'},
        {label:'TB', val:b.totalBases??0,color:(b.totalBases||0)>=4?'var(--accent)':(b.totalBases||0)>=2?'#ff8020':'var(--text)'},
        {label:'RBI',val:b.rbi??0,     color:(b.rbi||0)>0?'#ffc840':'var(--text)'},
        {label:'BB', val:b.bb??0,      color:(b.bb||0)>0?'#38b8f2':'var(--text)'},
        {label:'K',  val:b.so??0,      color:(b.so||0)>=2?'#38b8f2':'var(--text)'},
      ].map((s,i,arr) => (
        <div key={s.label} style={{
          flex:1,textAlign:'center',padding:'6px 4px',
          background:'rgba(255,255,255,.02)',
          borderRight:i<arr.length-1?'1px solid var(--border)':'none',
        }}>
          <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
            fontSize:15,color:s.color,lineHeight:1}}>
            {s.val}
          </div>
          <div style={{fontSize:8,color:'var(--muted)',
            fontFamily:"'DM Mono',monospace",
            textTransform:'uppercase',letterSpacing:.5,marginTop:2}}>
            {s.label}
          </div>
        </div>
      ))}
    </div>}

        {/* At-bat log table */}
    {(b.atBats||[]).length > 0 && <div style={{marginTop:10}}>
      <div style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",
        textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>
        Today's At-Bats
      </div>
      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <table style={{width:"100%",minWidth:420,borderCollapse:"collapse",fontSize:11}}>
          <thead>
            <tr style={{borderBottom:"1px solid var(--border)"}}>
              {["Inn","Result","EV","Angle","Dist","Pitch","Pitcher"].map(h=>(
                <th key={h} style={{padding:"4px 8px",textAlign:"left",fontSize:9,
                  color:"var(--muted)",fontFamily:"'DM Mono',monospace",
                  textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
              ))}
            <th style={{padding:"4px 8px",textAlign:"right",whiteSpace:"nowrap",fontFamily:"'DM Mono',monospace",fontSize:9,color:"var(--muted)",cursor:"default"}}>HR Odds</th></tr>
          </thead>
          <tbody>
            {(b.atBats||[]).map((ab,i)=>{
              const evColor = (ab.ev||0)>=103?"#ff4020":(ab.ev||0)>=95?"#ff8020":(ab.ev||0)>=90?"#ffc840":"var(--text)";
              const distColor = (ab.dist||0)>=400?"#ff4020":(ab.dist||0)>=350?"#ff8020":(ab.dist||0)>=300?"#ffc840":"var(--text)";
              const isGoodResult = /home_run|double|triple|single/i.test(ab.result||"");
              const isOut = /out|grounded|fly|lined|popped|struck/i.test(ab.result||"");
              return <tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,.04)",
                background:i%2===0?"rgba(255,255,255,.01)":"transparent"}}>
                <td style={{padding:"5px 8px",fontFamily:"'DM Mono',monospace",
                  color:"var(--muted)",whiteSpace:"nowrap",fontSize:10}}>
                  {ab.halfInning==="top"?"▲":"▼"}{ab.inning||"—"}
                </td>
                <td style={{padding:"5px 8px",fontFamily:"'DM Mono',monospace",
                  color:isGoodResult?"#27c97a":isOut?"var(--muted)":"var(--text)",
                  fontWeight:isGoodResult?700:400,maxWidth:140,overflow:"hidden",
                  textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {ab.result||"—"}
                </td>
                <td style={{padding:"5px 8px",fontFamily:"'Oswald',sans-serif",
                  fontWeight:700,fontSize:13,color:evColor,whiteSpace:"nowrap"}}>
                  {ab.ev ? `${ab.ev}` : "—"}
                  {ab.ev && <span style={{fontSize:9,color:"var(--muted)",fontWeight:400}}> mph</span>}
                </td>
                <td style={{padding:"5px 8px",fontFamily:"'DM Mono',monospace",
                  color:ab.la>=25&&ab.la<=35?"#27c97a":"var(--text)",whiteSpace:"nowrap"}}>
                  {ab.la!=null && ab.ev ? `${ab.la}°` : "—"}
                </td>
                <td style={{padding:"5px 8px",fontFamily:"'Oswald',sans-serif",
                  fontWeight:700,fontSize:13,color:distColor,whiteSpace:"nowrap"}}>
                  {ab.dist ? `${ab.dist}ft` : "—"}
                  {(ab.dist||0)>=300 && <span style={{marginLeft:3}}>🔥</span>}
                </td>
                <td style={{padding:"5px 8px",fontFamily:"'DM Mono',monospace",
                  color:"var(--muted)",whiteSpace:"nowrap",fontSize:10}}>
                  {ab.pitchType||"—"}
                </td>
                <td style={{padding:"5px 8px",fontFamily:"'DM Mono',monospace",
                  color:"var(--muted)",whiteSpace:"nowrap",fontSize:10,
                  maxWidth:120,overflow:"hidden",textOverflow:"ellipsis"}}>
                  {ab.pitcherName||"—"}
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>}
  </div>;
}

function LRow({b, rank}) {
  const vc = b.gradeColor || (b.grade === null ? 'var(--muted)' : b.verdict?.cls==="primed"?"#ff4020":b.verdict?.cls==="hot"?"#ff8020":b.verdict?.cls==="watch"?"#ffc840":"#38b8f2");
  const handleClick = () => {
    const cached = getCachedPlayer(b.id);
    openAtBatSlide(cached
      ? {...cached, name: b.name, team: b.team}
      : {pid: b.id, name: b.name, team: b.team, avgEV: b.avgEV||b.recentEV||0, barrel: b.barrel||b.recentBrl||0, hardHit: b.hardHit||0, flyBall: b.flyBall||0, hr: b.hr||0}
    );
  };
  const recentBrl = b.recentBrl ?? b.recentBarrel ?? b.barrel ?? 0;
  const recentEV  = b.recentEV  ?? b.recentAvgEV  ?? b.avgEV  ?? 0;
  const projHR    = b.projHR ?? 0;
  return <div className="lr" style={{cursor:'pointer'}} onClick={handleClick}>
    {/* Row 1: rank + avatar + name/badges/signals */}
    <div className="lr-top">
      <div className="lrk" style={{color:rank<=3?vc:"var(--muted)"}}>{rank}</div>
      <PlayerAvatar pid={b.id} name={b.name} size={30} border={"1.5px solid "+vc+"60"}/>
      <div className="li">
        <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap'}}>
          {b.grade && isKeyMatchup(b.id) && <span style={{padding:'1px 6px',borderRadius:4,fontSize:9,fontWeight:800,
            fontFamily:"'Oswald',sans-serif",letterSpacing:.5,
            background:vc+'18',border:'1px solid '+vc+'40',color:vc,flexShrink:0}}>
            {b.grade}
          </span>}
          {LINEUP_STATUS[b.id]?.status === 'confirmed' && (
            <span style={{fontSize:10,flexShrink:0}} title="Confirmed in lineup">✅</span>
          )}
          {b.due && DUE_BADGE}
          {b.isDiamond && <span style={{padding:'1px 4px',borderRadius:4,fontSize:9,fontWeight:700,
            background:'rgba(255,204,0,.15)',color:'#ffcc00',border:'1px solid rgba(255,204,0,.3)',flexShrink:0}}>💎</span>}
          {isHotBatPlayer(getCachedPlayer(b.id)) && <span style={{fontSize:10,flexShrink:0,lineHeight:1}}
            title='🔥 Hot Bat — 3+ HRs in last 7 days'>🔥</span>}
          <InjuryBadge pid={b.id} name={b.name}/>
          <div style={{minWidth:0,flex:1}}>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,
            color:isKeyMatchup(b.id)?'#ff8020':'var(--text)',
            whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',display:'block',maxWidth:140}}>{b.name}</span>
        </div>
        </div>
        {/* Signals — only if there's something meaningful */}
        {(projHR>0 || (b.signals||[]).filter(s=>s.t!=='⏳ Due'&&s.t!=='💎 Diamond').length>0) && (
          <div className="ls">
            {projHR > 0 && <span className="stag pos">{(projHR*100).toFixed(1)}% proj</span>}
            {(b.signals||[]).filter(s=>s.t!=='⏳ Due'&&s.t!=='💎 Diamond').slice(0,2).map((s,i)=>(
              <span key={i} className={`stag ${s.c}`}>{s.t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
    {/* Row 2: 5-stat strip — full width, always visible */}
    {(()=>{
      const cp = getCachedPlayer(b.id);
      const brl     = b.recentBrl ?? b.barrel  ?? 0;
      const fb      = b.recentFB  ?? b.flyBall ?? 0;
      const ev      = b.recentEV  ?? b.avgEV   ?? 0;
      // abPerHR — use pipeline value directly (ab/hr_count from players.json)
      // fallback: compute from pa/hr if abPerHR not stored
      const abPerHR  = cp?.abPerHR && cp.abPerHR < 99
        ? Math.round(cp.abPerHR)
        : (cp?.hr > 0 ? Math.round((cp.pa || cp.ab || 1) / cp.hr) : null);
      // abSinceHR — from real window data, then daysSinceHR * 3.8 estimate
      const abSinceHR = cp?.windows?.last7?.abSinceHR != null
        ? cp.windows.last7.abSinceHR
        : cp?.daysSinceHR != null
          ? Math.round(cp.daysSinceHR * 3.8)
          : null;
      const due = abSinceHR!=null && abPerHR!=null && abSinceHR > abPerHR*1.15;
      return <div className="lmini">
        <div className="lms"><div className="lmsv" style={{color:brl>=10?'#ff8020':brl>=6?'var(--accent2)':'var(--text)'}}>{brl>0?brl.toFixed(0)+'%':'—'}</div><div className="lmsl">Brl</div></div>
        <div className="lms"><div className="lmsv" style={{color:fb>=30?'#ff8020':fb>=22?'var(--accent2)':'var(--text)'}}>{fb>0?fb.toFixed(0)+'%':'—'}</div><div className="lmsl">FB%</div></div>
        <div className="lms"><div className="lmsv" style={{color:ev>=T.EV_HH?'#ff8020':'var(--text)'}}>{ev>0?ev.toFixed(0):'—'}</div><div className="lmsl">EV</div></div>
        <div className="lms"><div className="lmsv" style={{color:abPerHR&&abPerHR<=18?'#ff8020':abPerHR&&abPerHR<=25?'#ffc840':'var(--text)'}}>{abPerHR||'—'}</div><div className="lmsl">AB/HR</div></div>
        <div className="lms" style={{background:due?'rgba(56,184,242,.1)':undefined}}><div className="lmsv" style={{color:due?'var(--ice)':abSinceHR!=null&&abSinceHR>=5?'#ffc840':'var(--text)'}}>{abSinceHR!=null?abSinceHR:'—'}</div><div className="lmsl">Since HR</div></div>
      </div>;
    })()}
  </div>;
}

function GPanel({game, isLive, isFinal=false}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expId, setExpId] = useState(null);
  useEffect(() => {
    setLoading(true);
    (async () => {
      const d = (isLive || isFinal) ? await fetchLiveBatters(game.gamePk) : await fetchLiftoffBatters(game);
      setData(d); setLoading(false);
    })();
  }, [game.gamePk, isLive]);

  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(async () => {
      const d = await fetchLiveBatters(game.gamePk);
      setData(d);
    }, 60000);
    return () => clearInterval(id);
  }, [game.gamePk, isLive]);

  // Destructure batters + runners + lastPlay for live/final; liftoff returns plain array
  const batters   = (isLive || isFinal) ? (data?.batters  || []) : (data || []);
  const runners   = (isLive || isFinal) ? (data?.runners  || {first:false,second:false,third:false}) : null;
  const lastPlay  = isLive              ? (data?.lastPlay || null) : null;

  // Event → badge color
  const eventColor = (evt) => {
    if (!evt) return 'var(--muted)';
    const e = evt.toLowerCase();
    if (e.includes('home run'))  return '#ff4020';
    if (e.includes('triple'))    return '#f5a623';
    if (e.includes('double'))    return '#f5a623';
    if (e.includes('single'))    return '#27c97a';
    if (e.includes('walk') || e.includes('hit by pitch')) return '#38b8f2';
    if (e.includes('strikeout') || e.includes('struck out')) return '#5a7080';
    return 'var(--muted)';
  };

  // Baseball diamond component (SVG, top-down view)
  const BaseDiamond = ({r}) => {
    if (!r) return null;
    const Base = ({filled, cx, cy}) => (
      <rect x={cx-4} y={cy-4} width={8} height={8} rx={0.5}
        fill={filled ? '#f5a623' : 'transparent'}
        stroke={filled ? '#f5a623' : 'rgba(255,255,255,.3)'}
        strokeWidth={1.5}
        transform={"rotate(45 " + cx + " " + cy + ")"}/>
    );
    // Outs dots: 0=none, 1=one filled, 2=two filled
    const outs = r.outs ?? null;
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,flexShrink:0}}>
        <svg width={28} height={28} viewBox="0 0 28 28">
          <Base filled={r.second} cx={14} cy={4}/>
          <Base filled={r.third}  cx={4}  cy={14}/>
          <Base filled={r.first}  cx={24} cy={14}/>
          <polygon points="14,26 11,23 11,20 17,20 17,23"
            fill="rgba(255,255,255,.2)" stroke="rgba(255,255,255,.35)" strokeWidth={1}/>
        </svg>
        {outs !== null && (
          <div style={{display:'flex',gap:3,alignItems:'center'}}>
            {[0,1].map(i=>(
              <div key={i} style={{
                width:6,height:6,borderRadius:'50%',
                background: i < outs ? '#ff8020' : 'transparent',
                border:'1px solid ' + (i < outs ? '#ff8020' : 'rgba(255,255,255,.25)'),
              }}/>
            ))}
          </div>
        )}
      </div>
    );
  };

  return <div className="gp">
    <div className="gph" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div>
        <div className="gpt">{isLive ? "🔥 Live Heat — Who's Going Yard?" : isFinal ? "📋 Final Box Score" : "🚀 Ready for Liftoff"}</div>
        <div className="gps">{isLive ? "Click any batter → today vs L7 comparison" : isFinal ? "Final game stats · click any batter for detail" : "Ranked: streak 40% · due factor 25% · vs pitcher 15% · home/away 10%"}</div>
      </div>
      {runners && <BaseDiamond r={runners}/>}
    </div>
    {loading ? <div style={{padding:"20px 15px",display:"flex",alignItems:"center",gap:8}}><div className="sp" style={{width:18,height:18,borderWidth:2}}/><span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"var(--muted)"}}>Loading…</span></div>
: (isLive || isFinal) ? <div>
          {/* Last play banner */}
          {lastPlay && lastPlay.description && (
            <div style={{display:'flex',alignItems:'center',gap:10,
              padding:'8px 12px',background:'var(--surface2)',
              borderBottom:'1px solid var(--border)'}}>
              {lastPlay.batterId && (
                <PlayerAvatar pid={lastPlay.batterId} name={lastPlay.batterName||''} size={34}
                  border={"1.5px solid "+eventColor(lastPlay.event)+"60"}/>
              )}
              <div style={{flex:1,minWidth:0}}>
                {lastPlay.event && (
                  <span style={{
                    display:'inline-block',padding:'1px 8px',borderRadius:20,
                    fontSize:10,fontWeight:700,fontFamily:"'DM Mono',monospace",
                    background:eventColor(lastPlay.event)+'22',
                    border:'1px solid '+eventColor(lastPlay.event)+'50',
                    color:eventColor(lastPlay.event),marginBottom:3}}>
                    {lastPlay.event}
                  </span>
                )}
                <div style={{fontSize:11,color:'var(--text)',fontFamily:"'DM Mono',monospace",
                  lineHeight:1.4,overflow:'hidden',display:'-webkit-box',
                  WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                  {lastPlay.description}
                </div>
              </div>
            </div>
          )}
          {/* Legend */}
          {isLive && <div style={{
            display:'flex',gap:10,padding:'5px 12px',
            background:'var(--surface)',borderBottom:'1px solid var(--border)',
            flexWrap:'wrap',alignItems:'center'}}>
            <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>Key:</span>
            {[['⚡','At Bat'],['👀','On Deck'],['⛳','In Hole'],['🙋‍♂️','PH'],['✌️','Subbed Out']].map(([e,l])=>(
              <span key={e} style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",display:'flex',alignItems:'center',gap:3}}>
                <span style={{fontSize:12}}>{e}</span>{l}
              </span>
            ))}
          </div>}
          {batters.map(b => {
            const isE = expId === b.id;
            const ec  = b.avgEV>=T.EV_EL?"hot":b.avgEV>=T.EV_HH?"warm":"avg";
            const zl  = getLAZ(b.launchAngle);
            const distC = (b.avgDist||0)>=400?"hot":(b.avgDist||0)>=350?"warm":(b.avgDist||0)>=300?"avg2":"avg";
            return [
              <div key={b.id}
                className={`dr ${isE?"ex":""}`}
                onClick={() => setExpId(p => p===b.id ? null : b.id)}
                style={{padding:"8px 12px",borderBottom:"1px solid rgba(30,45,58,.5)",
                  cursor:"pointer",background:isE?"rgba(255,255,255,.10)":"transparent",borderLeft:isE?"3px solid var(--accent)":"3px solid transparent"}}>

                {/* Row 1: ▾ · # · avatar · name+team · emoji badges · heat · + · stats */}
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span className={`cv2 ${isE?"op":""}`}
                    style={{fontSize:11,color:"var(--muted)",flexShrink:0}}>▾</span>
                  {b.lineupSlot && <span style={{
                    fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,
                    color:'var(--muted)',flexShrink:0,minWidth:10,textAlign:'center'}}>
                    {b.lineupSlot}
                  </span>}
                  <div className="pc" style={{flex:1,minWidth:0}}>
                    <PlayerAvatar pid={b.id} name={b.name} size={26}/>
                    <div style={{minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:3}}>
                        <div className="pn" style={{fontSize:12,...(isKeyMatchup(b.id)?{color:'#ff8020',fontWeight:700}:{})}}>{b.name}</div>
                        {isHotBatPlayer(b) && <span style={{fontSize:10,flexShrink:0,lineHeight:1}}
                          title='🔥 Hot Bat — 3+ HRs in last 7 days'>🔥</span>}
                        <InjuryBadge pid={parseInt(b.batter_id||b.id)||0} name={b.name||b.batter}/>
                      </div>
                      <div style={{fontSize:9,color:"var(--accent2)",fontFamily:"'DM Mono',monospace",fontWeight:700}}>
                        {getTeam(b.id,b.team)}
                      </div>
                    </div>
                  </div>
                  {/* Compact emoji status indicators — no text labels */}
                  <div style={{display:'flex',gap:2,flexShrink:0,alignItems:'center'}}>
                    {b.isAtBat      && <span title="At Bat"     style={{fontSize:14,animation:"pulse 1.2s ease-in-out infinite"}}>⚡</span>}
                    {b.isOnDeck     && !b.isAtBat && <span title="On Deck"    style={{fontSize:14}}>👀</span>}
                    {b.isInTheHole  && !b.isOnDeck && !b.isAtBat && <span title="In the Hole" style={{fontSize:14}}>⛳</span>}
                    {b.isPinchHitter && <span title="Pinch Hitter" style={{fontSize:13}}>🙋‍♂️</span>}
                    {b.isSubbedOut  && <span title="Subbed Out"  style={{fontSize:13}}>✌️</span>}
                  </div>
                  <span className={`hl ${b.heatLabel.cls}`}
                    style={{flexShrink:0,fontSize:9}}>{b.heatLabel.label}</span>
                  <div onClick={e=>e.stopPropagation()} style={{flexShrink:0}}>
                    <PickButton pid={b.id} name={b.name} team={b.team}/>
                  </div>
                  {/* Today's line: H/AB HR */}
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,
                      color:b.hr>0?"var(--accent)":"var(--text)"}}>
                      {b.hits}/{b.ab}
                      {b.hr>0&&<span style={{marginLeft:4,color:"var(--accent)"}}>{b.hr}HR</span>}
                    </div>
                    <div style={{fontSize:8,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>
                      {(b.runs??0)>0&&<span style={{color:"var(--green)",marginRight:4}}>{b.runs}R</span>}
                      {(b.totalBases??0)>0&&<span style={{marginRight:4}}>{b.totalBases}TB</span>}
                      {(b.bb??0)>0&&<span style={{color:"var(--green)",marginRight:4}}>{b.bb}BB</span>}
                      {(b.so??0)>0&&<span style={{color:"var(--cold)"}}>{b.so}K</span>}
                    </div>
                  </div>
                </div>

                {/* Row 2: Statcast metrics pill row */}
                <div style={{display:"flex",gap:6,marginTop:5,marginLeft:20,flexWrap:"wrap"}}>
                  {b.avgEV > 0 && <div style={{
                    padding:"2px 7px",borderRadius:5,
                    background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",
                    fontFamily:"'DM Mono',monospace",fontSize:10}}>
                    <span style={{color:"var(--muted)",fontSize:8}}>EV </span>
                    <span className={`sv ${ec}`} style={{fontSize:11,fontFamily:"'Oswald',sans-serif",fontWeight:700}}>
                      {b.avgEV.toFixed(1)}
                    </span>
                  </div>}
                  {b.launchAngle > 0 && <div style={{
                    padding:"2px 7px",borderRadius:5,
                    background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",
                    fontFamily:"'DM Mono',monospace",fontSize:10}}>
                    <span style={{color:"var(--muted)",fontSize:8}}>LA </span>
                    <span className={`sv ${inHRZ(b.launchAngle)?"good":"avg"}`}
                      style={{fontSize:11,fontFamily:"'Oswald',sans-serif",fontWeight:700}}>
                      {b.launchAngle.toFixed(0)}°
                    </span>
                    {zl&&<span style={{fontSize:8,color:"var(--green)",marginLeft:3}}>{zl}</span>}
                  </div>}
                  {(b.avgDist||0) > 0 && <div style={{
                    padding:"2px 7px",borderRadius:5,
                    background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",
                    fontFamily:"'DM Mono',monospace",fontSize:10}}>
                    <span style={{color:"var(--muted)",fontSize:8}}>Dist </span>
                    <span className={`sv ${distC}`}
                      style={{fontSize:11,fontFamily:"'Oswald',sans-serif",fontWeight:700}}>
                      {Math.round(b.avgDist)}ft
                    </span>
                    {(b.avgDist||0)>=350&&<span style={{marginLeft:2,fontSize:10}}>🔥</span>}
                  </div>}
                  {b.hardHits > 0 && <div style={{
                    padding:"2px 7px",borderRadius:5,
                    background:"rgba(255,128,32,.08)",border:"1px solid rgba(255,128,32,.2)",
                    fontFamily:"'DM Mono',monospace",fontSize:10}}>
                    <span style={{color:"var(--muted)",fontSize:8}}>HH </span>
                    <span className="sv hot"
                      style={{fontSize:11,fontFamily:"'Oswald',sans-serif",fontWeight:700}}>
                      {b.hardHits}🔥
                    </span>
                  </div>}
                </div>
              </div>,
              isE && <div key={`${b.id}-x`} style={{background:"rgba(232,65,26,.03)",
                borderBottom:"1px solid rgba(30,45,58,.5)"}}>
                {isLive && <LiveBatterBox batterId={b.id} gamePk={game.gamePk}/>}
                <XRow b={b}/>
              </div>
            ];
          })}
        </div>
    : <div>
      {(data||[]).length === 0
        ? <div style={{padding:"16px 15px",color:"var(--muted)",fontFamily:"DM Mono,monospace",fontSize:11}}>Lineup not confirmed.</div>
        : (() => {
            const GRADE_ORDER = {'diamond':0,'A+':1,'A':2,'B':3,'C':4,'D':5};
            const sorted = [...(data||[])].sort((a,b) => {
              const aKM = isKeyMatchup(a.id), bKM = isKeyMatchup(b.id);
              // Key matchup batters always first
              if (aKM !== bKM) return aKM ? -1 : 1;
              // Within key matchup batters: grade → due → projHR
              if (aKM && bKM) {
                const ga = a.grade ? (GRADE_ORDER[a.grade] ?? 5) : 99;
                const gb = b.grade ? (GRADE_ORDER[b.grade] ?? 5) : 99;
                if (ga !== gb) return ga - gb;
                if (a.due !== b.due) return a.due ? -1 : 1;
              }
              // All others: due first, then projHR
              if (a.due !== b.due) return a.due ? -1 : 1;
              // 3. Hot bat: proj HR% descending
              return (b.projHR||0) - (a.projHR||0);
            });
            return sorted.map((b, i) => <LRow key={b.id} b={b} rank={i+1}/>);
          })()
      }
    </div>}
  </div>;
}

function GCard({game}) {
  const [exp, setExp] = useState(false);
  const isLive = game.status === "Live", isFin = game.status === "Final", isPre = !isLive && !isFin;
  const aw = game.away.score > game.home.score, hw = game.home.score > game.away.score;
  const mono = "'DM Mono',monospace", osw = "'Oswald',sans-serif";
  const statusColor = isLive ? '#ff4020' : isFin ? 'var(--muted)' : 'var(--green)';

  return <div className="gpw">
    <div className={`gc ${exp?"exp":""}`} onClick={() => setExp(e => !e)}
      style={{padding:0,overflow:'hidden'}}>

      {/* Status bar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'5px 12px',borderBottom:'1px solid rgba(255,255,255,.05)',
        background:'rgba(0,0,0,.2)'}}>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          {isLive && <span style={{width:6,height:6,borderRadius:'50%',background:'#ff4020',
            display:'inline-block',animation:'pulse 1.2s ease-in-out infinite',flexShrink:0}}/>}
          <span style={{fontFamily:mono,fontSize:9,fontWeight:600,color:statusColor,
            textTransform:'uppercase',letterSpacing:.8}}>
            {isLive ? (game.inning||'Live') : isFin ? 'Final' : (game.gameTime ? game.gameTime+' ET' : 'Upcoming')}
          </span>
        </div>
        <span style={{fontFamily:mono,fontSize:10,color:'rgba(255,255,255,.25)'}}>
          {exp ? '▴' : '▾'}
        </span>
      </div>

      {/* Main score row — horizontal like Image 2 */}
      <div style={{display:'flex',alignItems:'center',padding:'10px 12px',gap:8}}>
        {/* Away team */}
        <div style={{flex:1,display:'flex',alignItems:'center',gap:8,minWidth:0}}>
          <img src={`https://www.mlbstatic.com/team-logos/${game.away?.teamId||0}.svg`}
            style={{width:28,height:28,flexShrink:0,objectFit:'contain'}}
            onError={e=>{e.target.style.display='none';}}/>
          <div style={{minWidth:0}}>
            <div style={{fontFamily:osw,fontWeight:800,fontSize:16,
              color:aw?'var(--text)':'var(--muted)',lineHeight:1}}>{game.away.abbr}</div>
            <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)',marginTop:1}}>
              {game.away.record||''}
            </div>
          </div>
          <div style={{fontFamily:osw,fontWeight:800,fontSize:26,
            color:aw?'var(--text)':'var(--muted)',marginLeft:'auto',
            minWidth:24,textAlign:'center'}}>
            {(isLive||isFin) ? (game.away.score??'-') : '-'}
          </div>
        </div>

        {/* Center divider — inning + bases + outs when live */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',
          gap:2,flexShrink:0,width:44}}>
          {isLive ? <>
            {/* Inning indicator */}
            <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)',
              letterSpacing:.5,textAlign:'center',lineHeight:1}}>
              {game.inning||''}
            </div>
            {/* Base diamond */}
            {game.runners && (() => {
              const r = game.runners;
              const outs = r.outs ?? game.outs ?? null;
              const Base = ({filled,cx,cy}) => (
                <rect x={cx-4} y={cy-4} width={8} height={8} rx={0.5}
                  fill={filled?'#f5a623':'transparent'}
                  stroke={filled?'#f5a623':'rgba(255,255,255,.3)'}
                  strokeWidth={1.5}
                  transform={`rotate(45 ${cx} ${cy})`}/>
              );
              return <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                <svg width={24} height={24} viewBox="0 0 28 28">
                  <Base filled={r.second} cx={14} cy={4}/>
                  <Base filled={r.third}  cx={4}  cy={14}/>
                  <Base filled={r.first}  cx={24} cy={14}/>
                  <polygon points="14,26 11,23 11,20 17,20 17,23"
                    fill="rgba(255,255,255,.2)" stroke="rgba(255,255,255,.35)" strokeWidth={1}/>
                </svg>
                {outs !== null && (
                  <div style={{display:'flex',gap:3,alignItems:'center'}}>
                    {[0,1].map(i=>(
                      <div key={i} style={{width:5,height:5,borderRadius:'50%',
                        background:i<outs?'#ff8020':'transparent',
                        border:'1px solid '+(i<outs?'#ff8020':'rgba(255,255,255,.25)')}}/>
                    ))}
                  </div>
                )}
              </div>;
            })()}
          </> : isFin ? (
            <div style={{fontFamily:mono,fontSize:9,color:'var(--muted)',letterSpacing:.5}}>F</div>
          ) : (
            <div style={{fontFamily:mono,fontSize:10,color:'rgba(255,255,255,.2)'}}>VS</div>
          )}
        </div>

        {/* Home team */}
        <div style={{flex:1,display:'flex',alignItems:'center',gap:8,
          flexDirection:'row-reverse',minWidth:0}}>
          <img src={`https://www.mlbstatic.com/team-logos/${game.home?.teamId||0}.svg`}
            style={{width:28,height:28,flexShrink:0,objectFit:'contain'}}
            onError={e=>{e.target.style.display='none';}}/>
          <div style={{minWidth:0,textAlign:'right'}}>
            <div style={{fontFamily:osw,fontWeight:800,fontSize:16,
              color:hw?'var(--text)':'var(--muted)',lineHeight:1}}>{game.home.abbr}</div>
            <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)',marginTop:1}}>
              {game.home.record||''}
            </div>
          </div>
          <div style={{fontFamily:osw,fontWeight:800,fontSize:26,
            color:hw?'var(--text)':'var(--muted)',marginRight:'auto',
            minWidth:24,textAlign:'center'}}>
            {(isLive||isFin) ? (game.home.score??'-') : '-'}
          </div>
        </div>
      </div>

      {/* Tap hint */}
      {!exp && <div style={{textAlign:'center',padding:'4px 12px 8px',
        fontFamily:mono,fontSize:9,color:statusColor,opacity:.7}}>
        {isLive ? '▾ tap for live heat' : isFin ? '▾ tap for box score' : '▾ tap for 🚀 liftoff list'}
      </div>}
    </div>
  {exp && <>
    {(game.innings||[]).length > 0 && <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",
      borderTop:"1px solid var(--border)",padding:"6px 10px",background:"rgba(0,0,0,.2)"}}>
      <table style={{borderCollapse:"collapse",width:"100%",fontSize:10,fontFamily:"'DM Mono',monospace"}}>
        <thead><tr>
          <th style={{padding:"2px 5px",color:"var(--muted)",textAlign:"left",width:30}}>INN</th>
          {(game.innings||[]).map(inn=>(
            <th key={inn.num} style={{padding:"2px 4px",textAlign:"center",minWidth:18,
              color:(game.currentInning===inn.num)?(game.currentHalf==="Bottom"?"var(--accent2)":"var(--accent)"):"var(--muted)",
              fontWeight:(game.currentInning===inn.num)?700:400}}>{inn.num}</th>
          ))}
          <th style={{padding:"2px 6px",textAlign:"center",color:"var(--text)",fontWeight:700}}>R</th>
        </tr></thead>
        <tbody>
          {["away","home"].map(side=>(
            <tr key={side} style={{borderTop:"1px solid rgba(255,255,255,.04)"}}>
              <td style={{padding:"2px 5px",color:"var(--accent2)",fontWeight:700,fontFamily:"'Oswald',sans-serif",fontSize:11}}>{game[side]?.abbr}</td>
              {(game.innings||[]).map(inn=>(
                <td key={inn.num} style={{padding:"2px 4px",textAlign:"center",
                  color:inn[side]===""?"var(--muted)":parseInt(inn[side])>0?"var(--text)":"var(--muted)",
                  background:(game.currentInning===inn.num&&((side==="home"&&game.currentHalf==="Bottom")||(side==="away"&&game.currentHalf!=="Bottom")))?"rgba(232,65,26,.08)":"transparent"}}>
                  {inn[side]===""?"·":inn[side]}
                </td>
              ))}
              <td style={{padding:"2px 6px",textAlign:"center",fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,
                color:side==="away"?(game.away?.score>game.home?.score?"var(--accent)":"var(--text)"):(game.home?.score>game.away?.score?"var(--accent)":"var(--text)")}}>{side==="away"?game.awayRuns:game.homeRuns}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>}
    <GPanel game={game} isLive={isLive} isFinal={isFin}/>
  </>}
  </div>;
}

// Shows weather for all today's home parks
function ScoutingWeather() {
  return <PregameWeatherRow/>;
}

function PregameWeatherRow() {
  const [games, setGames] = useState([]);
  const [selTeam, setSelTeam] = useState(null);
  const [weatherData, setWeatherData] = useState({});

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/schedule?date=${today}`)
      .then(r => r.json())
      .then(data => {
        const g = (data.dates?.[0]?.games || []).map(g => ({
          gamePk: g.gamePk,
          away: g.teams?.away?.team?.abbreviation || "???",
          home: g.teams?.home?.team?.abbreviation || "???",
        }));
        setGames(g);
        if (g.length > 0 && !selTeam) setSelTeam(g[0].home);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selTeam || weatherData[selTeam]) return;
    fetchWeather(selTeam).then(d => {
      if (d) setWeatherData(prev => ({...prev, [selTeam]: d}));
    });
  }, [selTeam]);

  if (games.length === 0) return null;

  return <div style={{marginBottom:12}}>
    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:7,alignItems:"center"}}>
      <span style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginRight:4}}>Park + Weather:</span>
      {games.filter(g => g.home && g.home !== "???").map(g => (
        <button key={g.gamePk}
          className={`chip ${selTeam===g.home?"active":""}`}
          onClick={() => setSelTeam(g.home)}
          style={{fontSize:10,fontFamily:"'Oswald',sans-serif",fontWeight:600}}>
          {g.away} @ {g.home}
        </button>
      ))}
      {games.every(g => !g.home || g.home === "???") && (
        <span style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>Loading game schedule…</span>
      )}
    </div>
    {selTeam && <WeatherBanner team={selTeam}/>}
  </div>;
}

function RefBtn({refreshing, onClick}) {
  return <button className={`rb ${refreshing?"sp2":""}`} onClick={onClick}>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
    Refresh
  </button>;
}

// TAB 1: PREGAME

// ── TOP 20 GOING YARD — MAIN PAGE ────────────────────────────
// Composite HR probability score built from:
//   Contact Quality 30% — barrel%, EV, hard hit%, flyball%, pulled air%
//   Power Intent    25% — pulled barrel%, almostHR%, xwOBA, HR rate
//   Recent Form     20% — L3/L7 at-bat log splits (barrel, EV, HH%)
//   Matchup         15% — platoon split, pitcher HR/9, pitch mix vs batter
//   Park + Weather  10% — park HR factor, wind, temp



// ── HEATING UP SLIDEOUT ────────────────────────────────────────
// Reads live Statcast data from all live games and surfaces
// top hard-hit / high exit velocity batters in a slideout panel

function HeatingUpSlideout({ games, onClose }) {
  const [batters, setBatters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  // Only live games — "heating up" means RIGHT NOW, not season potential
  const liveGames = (games||[]).filter(g => g.status==='Live');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const all = [];

      if (liveGames.length === 0) {
        setBatters([]);
        setLoading(false);
        return;
      }

      // Live games only — real in-game Statcast data
      await Promise.all(liveGames.map(async (game) => {
        try {
          const result = await fetchLiveBatters(game.gamePk);
          const liveBatters = result?.batters || result || [];
          liveBatters.forEach(b => {
            // REQUIRE at least 1 real AB in this game — no pre-AB ghost appearances
            if ((b.ab || 0) < 1) return;
            all.push({...b, gameStatus:'Live', gamePk:game.gamePk});
          });
        } catch(e) {}
      }));

      // Filter: only "Heating Up" or hotter — based on in-game heatLabel only
      // heatLabel.cls: 'elite' | 'hot' | 'avg' | 'cold'
      const hot = all.filter(b =>
        b.heatLabel && (b.heatLabel.cls === 'gone_yard' || b.heatLabel.cls === 'elite' || b.heatLabel.cls === 'hot')
      );

      // Sort: elite first, then by in-game EV descending
      hot.sort((a,b) => {
        const order = {gone_yard:4, elite:3, hot:2};
        const diff = (order[b.heatLabel?.cls]||0) - (order[a.heatLabel?.cls]||0);
        if (diff !== 0) return diff;
        return (b.avgEV||0) - (a.avgEV||0);
      });

      setBatters(hot);
      setLoading(false);
    })();
  }, [liveGames.length]);

  const evColor = (ev) => (ev||0)>=103?'#ff4020':(ev||0)>=95?'#ff8020':(ev||0)>=90?'#ffc840':'var(--muted)';
  const laColor = (la) => (la||0)>=25&&(la||0)<=35?'#27c97a':(la||0)>=18?'var(--accent2)':'var(--muted)';

  return <>
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:900}}/>
    <div style={{position:'fixed',right:0,top:0,bottom:0,width:'min(420px,100vw)',
      background:'var(--surface)',borderLeft:'1px solid var(--border)',
      zIndex:901,display:'flex',flexDirection:'column'}}>

      {/* Header */}
      <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',
        display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <div>
          <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:900,fontSize:20,
            letterSpacing:1,color:'var(--accent)'}}>🔥 Heating Up</div>
          <div style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace",marginTop:2}}>
            {loading ? 'Scanning live at-bats…'
              : liveGames.length === 0
                ? 'No live games right now'
                : batters.length > 0
                  ? `${batters.length} batter${batters.length!==1?'s':''} heating up across ${liveGames.length} live game${liveGames.length!==1?'s':''}`
                  : `Watching ${liveGames.length} live game${liveGames.length!==1?'s':''} — nobody heating up yet`}
          </div>
        </div>
        <button onClick={onClose} style={{marginLeft:'auto',background:'none',
          border:'1px solid var(--border)',borderRadius:6,padding:'4px 10px',
          color:'var(--muted)',cursor:'pointer',fontFamily:"'DM Mono',monospace",fontSize:11}}>✕</button>
      </div>

      {/* Body */}
      <div style={{flex:1,overflowY:'auto',padding:'10px 0'}}>
        {loading
          ? <div className="lw" style={{padding:'40px 0'}}>
              <div className="sp"/>
              <div className="lt">Scanning live lineups…</div>
            </div>
          : liveGames.length === 0
            ? <div style={{padding:'50px 20px',textAlign:'center',
                color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:12,lineHeight:2}}>
                No live games right now.<br/>
                Check back once tonight's games start.
              </div>
            : batters.length === 0
              ? <div style={{padding:'50px 20px',textAlign:'center',
                  color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:12,lineHeight:2}}>
                  Nobody heating up yet.<br/>
                  <span style={{fontSize:10}}>Batters need at least 1 AB before qualifying.</span>
                </div>
          : batters.map((b, idx) => (<div key={`hu-${b.id}-${idx}`}>
          <div
            onClick={()=>setExpandedId(id => id===b.id ? null : b.id)}
            style={{display:'flex',alignItems:'center',gap:8,
              padding:'8px 14px',borderBottom:'1px solid rgba(255,255,255,.04)',
              cursor:'pointer',transition:'background .1s'}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.04)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>

            {/* Rank */}
            <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:900,fontSize:13,
              color:idx===0?'#ffd700':idx===1?'#c0c0c0':idx===2?'#cd7f32':'var(--muted)',
              minWidth:16,textAlign:'center',flexShrink:0}}>
              {idx+1}
            </div>

            {/* Name + team + badge — all on one compact block */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,
                whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.2}}>
                {b.name}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2,flexWrap:'nowrap'}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,
                  color:'var(--accent2)',fontWeight:700,flexShrink:0}}>{getTeam(b.id, b.team)}</span>
                <span style={{fontSize:8,padding:'1px 5px',borderRadius:4,flexShrink:0,
                  background:b.heatLabel?.cls==='gone_yard'?'rgba(255,20,0,.25)':b.heatLabel?.cls==='elite'?'rgba(232,65,26,.15)':'rgba(255,128,32,.12)',
                  color:b.heatLabel?.cls==='gone_yard'?'#fff':b.heatLabel?.cls==='elite'?'#ff4020':'#ff8020',
                  fontFamily:"'DM Mono',monospace",fontWeight:b.heatLabel?.cls==='gone_yard'?800:600,
                  border:`1px solid ${b.heatLabel?.cls==='gone_yard'?'rgba(255,20,0,.5)':b.heatLabel?.cls==='elite'?'rgba(232,65,26,.3)':'rgba(255,128,32,.25)'}`}}>
                  {b.heatLabel?.label||'—'}
                </span>
                <span style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",flexShrink:0}}>
                  {b.hits||0}/{b.ab||0}{(b.hr||0)>0&&<span style={{color:'var(--accent)',marginLeft:3}}>{b.hr}HR</span>}
                </span>
              </div>
            </div>

            {/* Stats — compact inline, all on one row */}
            <div style={{display:'flex',gap:6,flexShrink:0,alignItems:'center'}}>
              {/* EV */}
              <div style={{textAlign:'center',minWidth:34}}>
                <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,
                  color:evColor(b.avgEV),lineHeight:1}}>
                  {b.avgEV>0?b.avgEV.toFixed(1):'—'}
                </div>
                <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                  textTransform:'uppercase',letterSpacing:.4,marginTop:1}}>EV</div>
              </div>
              {/* LA */}
              <div style={{textAlign:'center',minWidth:26}}>
                <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,
                  color:laColor(b.launchAngle),lineHeight:1}}>
                  {b.launchAngle>0?`${b.launchAngle.toFixed(0)}°`:'—'}
                </div>
                <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                  textTransform:'uppercase',letterSpacing:.4,marginTop:1}}>LA</div>
              </div>
              {/* Dist */}
              <div style={{textAlign:'center',minWidth:34}}>
                <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,
                  color:(b.avgDist||0)>=350?'#ff8020':(b.avgDist||0)>=300?'#ffc840':'var(--text)',lineHeight:1}}>
                  {b.avgDist>0?`${Math.round(b.avgDist)}ft`:'—'}
                </div>
                <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                  textTransform:'uppercase',letterSpacing:.4,marginTop:1}}>Dist</div>
              </div>
              {/* HH */}
              {b.hardHits>0&&<div style={{textAlign:'center',minWidth:22}}>
                <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,
                  color:'#ff8020',lineHeight:1}}>
                  {b.hardHits}🔥
                </div>
                <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                  textTransform:'uppercase',letterSpacing:.4,marginTop:1}}>HH</div>
              </div>}
            </div>
          </div>
          {expandedId === b.id && <div style={{
            background:'rgba(20,30,40,1)',borderBottom:'1px solid var(--border)',
            borderLeft:'3px solid var(--accent)'
          }}>
            {(b.ab > 0) && <div style={{display:'flex',gap:0,margin:'8px 12px 4px',border:'1px solid var(--border)',borderRadius:8,overflow:'hidden'}}>
              {[
                {label:'AB', val:b.ab,           color:'var(--text)'},
                {label:'H',  val:b.hits||0,      color:(b.hits||0)>0?'#27c97a':'var(--text)'},
                {label:'HR', val:b.hr||0,        color:(b.hr||0)>0?'var(--accent)':'var(--text)'},
                {label:'R',  val:b.runs??0,      color:(b.runs||0)>0?'#27c97a':'var(--text)'},
                {label:'TB', val:b.totalBases??0,color:(b.totalBases||0)>=4?'var(--accent)':(b.totalBases||0)>=2?'#ff8020':'var(--text)'},
                {label:'RBI',val:b.rbi??0,       color:(b.rbi||0)>0?'#ffc840':'var(--text)'},
                {label:'BB', val:b.bb??0,        color:(b.bb||0)>0?'#38b8f2':'var(--text)'},
                {label:'K',  val:b.so??0,        color:(b.so||0)>=2?'#38b8f2':'var(--text)'},
              ].map((s,si,arr)=>(
                <div key={s.label} style={{flex:1,textAlign:'center',padding:'5px 3px',
                  background:'rgba(255,255,255,.02)',borderRight:si<arr.length-1?'1px solid var(--border)':'none'}}>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,color:s.color,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:.5,marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>}
            {(b.atBats||[]).length > 0 && <div style={{padding:'0 12px 10px'}}>
              <div style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:1,marginBottom:5,marginTop:6}}>Today's At-Bats</div>
              <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                    {['Inn','Result','EV','Angle','Dist','Pitch','Pitcher'].map(h=>(
                      <th key={h} style={{padding:'3px 6px',textAlign:'left',fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:.5,whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(b.atBats||[]).map((ab,ai)=>{
                      const evc=(ab.ev||0)>=103?'#ff4020':(ab.ev||0)>=95?'#ff8020':(ab.ev||0)>=90?'#ffc840':'var(--text)';
                      const dc=(ab.dist||0)>=400?'#ff4020':(ab.dist||0)>=350?'#ff8020':(ab.dist||0)>=300?'#ffc840':'var(--text)';
                      const good=/home_run|double|triple|single/i.test(ab.result||'');
                      return <tr key={ai} style={{borderBottom:'1px solid rgba(255,255,255,.04)',background:ai%2===0?'rgba(255,255,255,.01)':'transparent'}}>
                        <td style={{padding:'3px 5px',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:9,whiteSpace:'nowrap'}}>{ab.halfInning==='top'?'▲':'▼'}{ab.inning||'—'}</td>
                        <td style={{padding:'3px 5px',color:good?'#27c97a':'var(--muted)',fontWeight:good?700:400,maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'DM Mono',monospace",fontSize:9}}>{ab.result||'—'}</td>
                        <td style={{padding:'3px 5px',color:evc,fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,whiteSpace:'nowrap'}}>{ab.ev>0?ab.ev.toFixed(1):'—'}</td>
                        <td style={{padding:'3px 5px',color:'var(--text)',fontFamily:"'DM Mono',monospace",fontSize:9,whiteSpace:'nowrap'}}>{(ab.la||ab.launchAngle||0)>0?(ab.la||ab.launchAngle).toFixed(0)+'°':'—'}</td>
                        <td style={{padding:'3px 5px',color:dc,fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,whiteSpace:'nowrap'}}>{ab.dist>0?ab.dist+'ft':'—'}</td>
                        <td style={{padding:'3px 5px',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:9,whiteSpace:'nowrap'}}>{ab.pitchType||'—'}</td>
                        <td style={{padding:'3px 5px',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:9,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ab.pitcherName||'—'}</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </div>}
            {(b.atBats||[]).length===0&&<div style={{padding:'8px 12px 10px',fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>No at-bats recorded yet.</div>}
          </div>}
        </div>))
      }
      </div>
    </div>
  </>;
}


// ── LINEUPS VIEW ──────────────────────────────────────────────
// Compact pitcher card for Lineups — grade badge inline, stats drop down on click
function InlinePitcherCard({ pitcherId, pitcherName }) {
  const [stats, setStats]   = useState(null);
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cleanId = pitcherId ? String(parseInt(pitcherId) || pitcherId) : null;
    if (!cleanId || cleanId === '0' || isNaN(parseInt(cleanId))) return;
    setLoading(true);
    fetchPitcherData(cleanId, pitcherName)
      .then(d => { if (d?.stats) setStats(d.stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pitcherId, pitcherName]);

  const grade = stats ? gradePitcher(
    stats.era,
    stats.k9 && stats.k9 !== '—' ? stats.k9
      : (parseFloat(stats.ip) > 0 && parseInt(stats.so||0) > 0
          ? ((parseInt(stats.so) / parseFloat(stats.ip)) * 9).toFixed(2) : '0'),
    stats.whip, stats.bb9, stats.hr9, stats.avg, stats.obp
  ) : null;

  const eraC  = v => { const n=parseFloat(v); return n<2.5?'#ff4020':n<3.5?'#ff8020':n<4.5?'var(--text)':'#27c97a'; };
  const whipC = v => { const n=parseFloat(v); return n<1.0?'#ff4020':n<1.22?'#ff8020':'var(--text)'; };
  const k9C   = v => { const n=parseFloat(v); return n>11?'#ff4020':n>9?'#ff8020':'var(--text)'; };
  const hr9C  = v => { const n=parseFloat(v); return n>1.5?'#27c97a':n>1.0?'#ffc840':'var(--text)'; };

  const MiniStat = ({label, val, color}) => (
    <div style={{textAlign:'center',padding:'4px 6px',borderRadius:6,flex:1,
      background:'rgba(255,255,255,.04)',border:'1px solid var(--border)',minWidth:0}}>
      <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,
        color:color||'var(--text)',lineHeight:1}}>{val||'--'}</div>
      <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
        textTransform:'uppercase',letterSpacing:.4,marginTop:1}}>{label}</div>
    </div>
  );

  return (
    <div>
      {/* SP row */}
      <div style={{marginBottom: open ? 4 : 8, padding:'5px 8px',
        borderRadius: open ? '6px 6px 0 0' : 6,
        background:'rgba(56,184,242,.07)',border:'1px solid rgba(56,184,242,.18)',
        borderBottom: open ? '1px solid rgba(56,184,242,.1)' : '1px solid rgba(56,184,242,.18)'}}>
        {/* Row 1: SP label + name + LHP/RHP */}
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{fontSize:9,color:'var(--ice)',fontFamily:"'DM Mono',monospace",
            fontWeight:700,flexShrink:0,letterSpacing:.5}}>SP</span>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:600,fontSize:12,
            color:'var(--text)',flex:1,minWidth:0,whiteSpace:'normal',wordBreak:'break-word',lineHeight:1.2}}>
            {pitcherName || 'TBD'}
          </span>
          {stats?.hand && (
            <span style={{fontSize:8,fontFamily:"'DM Mono',monospace",fontWeight:700,padding:'1px 4px',
              borderRadius:3,flexShrink:0,
              background:stats.hand==='L'?'rgba(56,184,242,.12)':'rgba(255,128,32,.10)',
              color:stats.hand==='L'?'#38b8f2':'#ff8020'}}>
              {stats.hand==='L'?'LHP':'RHP'}
            </span>
          )}
          {loading && <span style={{fontSize:9,color:'var(--muted)',flexShrink:0}}>…</span>}
        </div>
        {/* Row 2: grade badge (only when loaded) */}
        {grade && (
          <div style={{marginTop:4}}>
            <button onClick={() => setOpen(o => !o)}
              style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 7px',
                borderRadius:4,cursor:'pointer',border:`1px solid ${grade.color}40`,
                background:grade.bg}}>
              <span style={{fontSize:9,fontFamily:"'DM Mono',monospace",fontWeight:700,
                color:grade.color,whiteSpace:'nowrap'}}>{grade.label}</span>
              <span style={{fontSize:8,color:grade.color,opacity:.7}}>{open?'▲':'▼'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Dropdown stats */}
      {open && stats && (
        <div style={{marginBottom:8,padding:'8px',borderRadius:'0 0 6px 6px',
          background:grade?.bg||'rgba(255,255,255,.04)',
          border:'1px solid rgba(56,184,242,.18)',borderTop:'none'}}>
          <div style={{fontSize:8,color:grade?.color||'var(--muted)',fontFamily:"'DM Mono',monospace",
            marginBottom:6,fontWeight:700,letterSpacing:.3}}>{grade?.desc}</div>
          <div style={{display:'flex',gap:4,marginBottom:5}}>
            <MiniStat label="ERA"  val={stats.era}  color={eraC(stats.era)}/>
            <MiniStat label="WHIP" val={stats.whip} color={whipC(stats.whip)}/>
            <MiniStat label="K/9"  val={stats.k9}   color={k9C(stats.k9)}/>
            <MiniStat label="HR/9" val={stats.hr9}  color={hr9C(stats.hr9)}/>
          </div>
          <div style={{display:'flex',gap:4}}>
            <MiniStat label="BB/9" val={stats.bb9}  color="var(--text)"/>
            <MiniStat label="IP"   val={stats.ip}   color="var(--muted)"/>
            {stats.wins!=null && <MiniStat label="W-L" val={`${stats.wins}-${stats.losses||0}`} color="var(--muted)"/>}
            {stats.avg && stats.avg!=='--' && <MiniStat label="AVG" val={stats.avg} color="var(--muted)"/>}
          </div>
        </div>
      )}
    </div>
  );
}


function LineupsView({ date }) {
  const [lineupGames, setLineupGames] = useState([]);
  const [lineupGameFilter, setLineupGameFilter] = useState('all'); // gamePk or 'all'
  const [loading, setLoading]         = useState(true);
  const [lastUpdate, setLastUpdate]   = useState(null);
  const [refreshing, setRefreshing]   = useState(false);
  const [selBatterInfo, setSelBatterInfo]   = useState(null);

  const todayET = new Date().toLocaleDateString("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"});
  const [lm,ld,ly] = todayET.split("/");
  const todayStr = `${ly}-${lm}-${ld}`;
  const fetchDate = date || todayStr;

  const fetchLineups = async (silent=false) => {
    if (!silent) setLoading(true);
    try {
      const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${fetchDate}` +
                  `&hydrate=lineups,probablePitcher(note),team&fields=dates,games,gamePk,gameDate,status,` +
                  `abstractGameState,teams,away,home,team,id,abbreviation,name,probablePitcher,` +
                  `fullName,primaryPosition,abbreviation,lineups,awayPlayers,homePlayers,` +
                  `battingOrder,jerseyNumber`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${r.status}`);
      const data = await r.json();
      const games = (data.dates?.[0]?.games || []).map(g => {
        const away = g.teams?.away, home = g.teams?.home;
        const awayLineup = g.lineups?.awayPlayers || [];
        const homeLineup = g.lineups?.homePlayers || [];
        const awayConfirmed = awayLineup.length >= 8;
        const homeConfirmed = homeLineup.length >= 8;
        const sort = arr => [...arr].sort((a,b) => (a.battingOrder||999) - (b.battingOrder||999));
        const gameTime = (() => {
          try { return new Date(g.gameDate).toLocaleTimeString("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit",hour12:true}); }
          catch { return ''; }
        })();
        return {
          gamePk: g.gamePk,
          gameTime,
          status: g.status?.abstractGameState || 'Preview',
          away: { abbr: away?.team?.abbreviation||'???', name: away?.team?.name||'', sp: away?.probablePitcher?.fullName||null, spId: away?.probablePitcher?.id||null, spNote: away?.probablePitcher?.note||null, lineup: sort(awayLineup), confirmed: awayConfirmed },
          home: { abbr: home?.team?.abbreviation||'???', name: home?.team?.name||'', sp: home?.probablePitcher?.fullName||null, spId: home?.probablePitcher?.id||null, spNote: home?.probablePitcher?.note||null, lineup: sort(homeLineup), confirmed: homeConfirmed },
        };
      });
      setLineupGames(games);
      setLastUpdate(new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));
    } catch(e) {
      console.warn('[Lineups] fetch failed:', e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLineups(); }, [fetchDate]);
  useEffect(() => {
    const id = setInterval(() => fetchLineups(true), 120000);
    return () => clearInterval(id);
  }, [fetchDate]);

  const PosChip = ({pos}) => (
    <span style={{fontSize:8,padding:'1px 4px',borderRadius:3,
      background:'var(--surface2)',border:'1px solid var(--border)',
      color:'var(--muted)',fontFamily:"'DM Mono',monospace",flexShrink:0}}>{pos||'?'}</span>
  );

  const StatusBadge = ({confirmed}) => confirmed
    ? <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,padding:'2px 7px',borderRadius:10,fontFamily:"'DM Mono',monospace",fontWeight:700,background:'rgba(39,201,122,.12)',border:'1px solid rgba(39,201,122,.3)',color:'#27c97a',letterSpacing:.3}}>🟢 CONFIRMED</span>
    : <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,padding:'2px 7px',borderRadius:10,fontFamily:"'DM Mono',monospace",fontWeight:700,background:'rgba(245,166,35,.10)',border:'1px solid rgba(245,166,35,.28)',color:'var(--accent2)',letterSpacing:.3}}>🟡 PROJECTED</span>;

  // ── Inline batter panel (stat card + recent games + pick button) ──────────
  const BatterPanel = ({ player, teamAbbr }) => {
    const [recentGames, setRecentGames] = useState(null);
    const pid = player?.id;
    const cached = pid ? getCachedPlayer(pid) : null;

    useEffect(() => {
      if (!pid) return;
      fetch(`https://statsapi.mlb.com/api/v1/people/${pid}/stats?stats=gameLog&group=hitting&season=2026&sportId=1&gameType=R&limit=5`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          const splits = d?.stats?.[0]?.splits || [];
          setRecentGames(splits.slice(0, 5));
        })
        .catch(() => setRecentGames([]));
    }, [pid]);

    const ev  = cached?.recentAvgEV ?? cached?.avgEV ?? null;
    const brl = cached?.recentBarrel ?? cached?.barrel ?? null;
    const hh  = cached?.recentHardHit ?? cached?.hardHit ?? null;
    const fb  = cached?.recentFlyBall ?? cached?.flyBall ?? null;
    const hasStats = ev || brl != null || hh != null;

    return (
      <div style={{background:'rgba(0,0,0,.3)',borderTop:'1px solid rgba(255,255,255,.05)',
        padding:'10px 12px',borderLeft:'3px solid var(--accent2)'}}>

        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          {/* Stat card */}
          {hasStats && (
            <div style={{display:'flex',gap:0,border:'1px solid var(--border)',borderRadius:7,overflow:'hidden',flexShrink:0}}>
              {[
                {label:'EV L7',   val:ev   != null ? ev.toFixed(1)   : null, color: ev>=95?'#ff4020':ev>=90?'#ff8020':'var(--text)'},
                {label:'HH%',     val:hh   != null ? hh.toFixed(1)+'%' : null, color: hh>=50?'#ff8020':'var(--text)'},
                {label:'Brl%',    val:brl  != null ? brl.toFixed(1)+'%' : null, color: brl>=8?'var(--accent)':brl>=5?'#ff8020':'var(--text)'},
                {label:'FB%',     val:fb   != null ? fb.toFixed(1)+'%'  : null, color: fb>=25?'#27c97a':'var(--text)'},
              ].filter(s=>s.val!=null).map((s,i,arr) => (
                <div key={s.label} style={{
                  padding:'5px 9px',textAlign:'center',
                  background:'rgba(255,255,255,.02)',
                  borderRight:i<arr.length-1?'1px solid var(--border)':'none'}}>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,color:s.color,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:.4,marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Pick button */}
          {pid > 0 && <PickButton pid={pid} name={player.fullName} team={teamAbbr}/>}

          {!hasStats && !pid && (
            <span style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontStyle:'italic'}}>
              No stat data — run pipeline to populate
            </span>
          )}
        </div>

        {/* Recent 5 games */}
        <div style={{marginTop:8}}>
          <div style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>
            Recent Games
          </div>
          {recentGames === null ? (
            <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontStyle:'italic'}}>Loading…</div>
          ) : recentGames.length === 0 ? (
            <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontStyle:'italic'}}>No recent game data</div>
          ) : (
            <div style={{display:'flex',gap:0,border:'1px solid var(--border)',borderRadius:7,overflow:'hidden',fontSize:9}}>
              {/* Header */}
              <div style={{display:'flex',flexDirection:'column',borderRight:'1px solid var(--border)',background:'rgba(255,255,255,.03)'}}>
                {['DATE','AB','H','HR','RBI','BB','K','AVG'].map(h => (
                  <div key={h} style={{padding:'3px 7px',color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                    fontWeight:700,fontSize:8,borderBottom:'1px solid rgba(255,255,255,.04)',textAlign:'right',
                    letterSpacing:.3}}>{h}</div>
                ))}
              </div>
              {recentGames.map((g,i) => {
                const s = g.stat || {};
                const d = g.date || '';
                const mmdd = d.slice(5,10);
                const avg = parseFloat(s.avg)||0;
                const hasHit = (parseInt(s.hits)||0) > 0;
                const hasHR  = (parseInt(s.homeRuns)||0) > 0;
                return (
                  <div key={i} style={{display:'flex',flexDirection:'column',flex:1,minWidth:0,
                    borderRight:i<recentGames.length-1?'1px solid rgba(255,255,255,.06)':'none'}}>
                    {[
                      {val:mmdd,     color:'var(--muted)'},
                      {val:s.atBats||0, color:'var(--text)'},
                      {val:s.hits||0,   color:hasHit?'#27c97a':'var(--text)'},
                      {val:s.homeRuns||0, color:hasHR?'var(--accent)':'var(--text)',bold:hasHR},
                      {val:s.rbi||0,    color:'var(--text)'},
                      {val:s.baseOnBalls||0, color:'var(--text)'},
                      {val:s.strikeOuts||0,  color:(parseInt(s.strikeOuts)||0)>=3?'#ff4020':'var(--text)'},
                      {val:avg>0?avg.toFixed(3).replace('0.','.'): '.000', color:avg>=.300?'#27c97a':avg>=.250?'var(--text)':'var(--muted)'},
                    ].map((cell,ci) => (
                      <div key={ci} style={{padding:'3px 5px',textAlign:'center',
                        fontFamily:"'DM Mono',monospace",fontSize:9,color:cell.color,
                        fontWeight:cell.bold?700:400,
                        borderBottom:'1px solid rgba(255,255,255,.04)',
                        background:hasHR&&ci===3?'rgba(232,65,26,.07)':hasHit&&ci===2?'rgba(39,201,122,.05)':'transparent'}}>
                        {cell.val}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const TeamLineup = ({side, gamePk, onBatterClick}) => (
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:7,flexWrap:'wrap'}}>
        <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,letterSpacing:1,color:'var(--text)'}}>{side.abbr}</span>
        <StatusBadge confirmed={side.confirmed}/>
      </div>
      <InlinePitcherCard pitcherId={side.spId} pitcherName={side.sp || 'TBD'}/>
      {side.lineup.length > 0 ? (
        <div style={{display:'flex',flexDirection:'column',gap:1}}>
          {side.lineup.map((p,i) => {
            const pos   = p.primaryPosition?.abbreviation || '';
            const name  = p.fullName || `Player ${p.id}`;
            const order = Math.round((p.battingOrder||((i+1)*100)) / 100);
            const cached = p.id ? getCachedPlayer(p.id) : null;
            const ev    = cached?.recentAvgEV ?? cached?.avgEV ?? 0;
            return (
              <div key={p.id||i}
                onClick={() => onBatterClick({player: p, teamAbbr: side.abbr})}
                style={{display:'flex',alignItems:'center',gap:4,
                  padding:'4px 3px',borderRadius:4,cursor:'pointer',
                  background: i%2===0?'rgba(255,255,255,.02)':'transparent',
                  borderLeft:'2px solid transparent',
                  transition:'background .12s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.06)';e.currentTarget.style.borderLeftColor='var(--accent2)';}}
                onMouseLeave={e=>{e.currentTarget.style.background=i%2===0?'rgba(255,255,255,.02)':'transparent';e.currentTarget.style.borderLeftColor='transparent';}}>
                <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:10,
                  color:order<=3?'var(--accent2)':'var(--muted)',minWidth:12,textAlign:'right',flexShrink:0}}>
                  {order}
                </span>
                <PosChip pos={pos}/>
                <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:600,fontSize:11,
                  color:isKeyMatchup(p.id)?'#ff8020':'var(--text)',flex:1,minWidth:0,
                  whiteSpace:'normal',wordBreak:'break-word',lineHeight:1.2}}>
                  {name}
                </span>
                {ev >= 90 && <span style={{fontSize:8,color:ev>=95?'#ff8020':'var(--muted)',
                  fontFamily:"'DM Mono',monospace",flexShrink:0}}>{ev.toFixed(0)}</span>}
                <span style={{fontSize:8,color:'rgba(255,255,255,.2)',flexShrink:0}}>›</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{padding:'12px 4px',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:10,fontStyle:'italic'}}>
          Lineup not yet posted
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <div style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>
          🟡 Projected = probable pitcher only &nbsp;·&nbsp; 🟢 Confirmed = batting order locked in
          &nbsp;·&nbsp; Click any batter for stats + picks &nbsp;·&nbsp; auto-refreshes every 2 min
          {lastUpdate && <span style={{marginLeft:6}}>· Updated {lastUpdate}</span>}
        </div>
        <button onClick={async()=>{setRefreshing(true);await fetchLineups(true);setRefreshing(false);}}
          style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:6,cursor:'pointer',border:'1px solid var(--border)',background:'var(--surface2)',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:11}}>
          <span style={{display:'inline-block',animation:refreshing?'spin .8s linear infinite':'none'}}>↻</span>
          Refresh
        </button>
      </div>

      {!loading && lineupGames.length > 0 && (
        <div style={{marginBottom:12,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:1}}>Jump to game:</span>
          <select value={lineupGameFilter} onChange={e=>setLineupGameFilter(e.target.value)}
            style={{padding:'5px 10px',borderRadius:7,background:'var(--surface2)',
              border:'1px solid var(--border)',color:'var(--text)',
              fontFamily:"'DM Mono',monospace",fontSize:11,cursor:'pointer'}}>
            <option value='all'>All Games</option>
            {lineupGames.map(g=>(
              <option key={g.gamePk} value={String(g.gamePk)}>
                {g.away.abbr} @ {g.home.abbr}{g.gameTime ? ' · '+g.gameTime : ''}{g.status==='Live'?' 🔴':g.status==='Final'?' ✓':''}
              </option>
            ))}
          </select>
          {lineupGameFilter!=='all' && <button onClick={()=>setLineupGameFilter('all')}
            style={{padding:'4px 10px',borderRadius:6,border:'1px solid rgba(255,64,32,.3)',
              background:'rgba(255,64,32,.08)',color:'var(--accent)',
              fontFamily:"'DM Mono',monospace",fontSize:10,cursor:'pointer',fontWeight:700}}>✕ All</button>}
        </div>
      )}
      {loading ? (
        <div className="lw"><div className="sp"/><div className="lt">Fetching lineups…</div></div>
      ) : lineupGames.length === 0 ? (
        <div style={{padding:'40px 20px',textAlign:'center',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:11}}>
          No games found for this date.
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {lineupGames.filter(g=>lineupGameFilter==='all'||String(g.gamePk)===lineupGameFilter).map(game => {
            const eitherConfirmed = game.away.confirmed || game.home.confirmed;
            const confirmed = game.away.confirmed && game.home.confirmed;
            const statusColor = game.status==='Live'?'var(--accent)':game.status==='Final'?'var(--muted)':'#27c97a';
            return (
              <div key={game.gamePk} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden',borderTop:`2px solid ${confirmed?'#27c97a':eitherConfirmed?'var(--accent2)':'var(--border)'}`}}>
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'var(--surface2)',borderBottom:'1px solid var(--border)'}}>
                  <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,letterSpacing:.5,color:'var(--text)'}}>
                    {game.away.abbr} <span style={{color:'var(--muted)',fontWeight:400}}>@</span> {game.home.abbr}
                  </span>
                  {game.gameTime && <span style={{fontSize:10,color:'var(--accent2)',fontFamily:"'DM Mono',monospace",fontWeight:600}}>{game.gameTime}</span>}
                  <span style={{fontSize:9,color:statusColor,fontFamily:"'DM Mono',monospace",fontWeight:700,marginLeft:'auto',letterSpacing:.5,textTransform:'uppercase'}}>
                    {game.status==='Live'?'🔴 LIVE':game.status==='Final'?'✓ FINAL':'⏳ '+game.gameTime}
                  </span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1px 1fr',gap:0,padding:'12px 0'}}>
                  <div style={{padding:'0 12px'}}><TeamLineup side={game.away} gamePk={game.gamePk} onBatterClick={({player,teamAbbr})=>openAtBatSlide({pid:player.id||0,name:player.fullName||'',team:teamAbbr})}/></div>
                  <div style={{background:'var(--border)'}}/>
                  <div style={{padding:'0 12px'}}><TeamLineup side={game.home} gamePk={game.gamePk} onBatterClick={({player,teamAbbr})=>openAtBatSlide({pid:player.id||0,name:player.fullName||'',team:teamAbbr})}/></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Batter slideout ─────────────────────────────────── */}
      {selBatterInfo && (() => {
        const { player, teamAbbr } = selBatterInfo;
        const name  = player.fullName || `Player ${player.id}`;
        const pos   = player.primaryPosition?.abbreviation || '';
        const order = player.battingOrder ? Math.round(player.battingOrder / 100) : null;
        return <>
          <div onClick={() => setSelBatterInfo(null)}
            style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:900}}/>
          <div style={{position:'fixed',right:0,top:0,bottom:0,width:'min(400px,100vw)',
            background:'var(--surface)',borderLeft:'1px solid var(--border)',
            zIndex:901,display:'flex',flexDirection:'column'}}>

            {/* Header */}
            <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',
              display:'flex',alignItems:'flex-start',gap:10,flexShrink:0}}>
              <div style={{display:'flex',gap:10,alignItems:'flex-start',flex:1,minWidth:0}}>
                <PlayerAvatar pid={player?.id} name={name} size={44}/>
                <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap',marginBottom:3}}>
                  {order && <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,
                    color:order<=3?'var(--accent2)':'var(--muted)'}}>{order}</span>}
                  <PosChip pos={pos}/>
                  <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:18,color:'var(--text)'}}>{name}</span>
                </div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'var(--muted)'}}>
                  <span style={{color:'var(--accent2)',fontWeight:700}}>{teamAbbr}</span>
                  {player.jerseyNumber && <span style={{marginLeft:6}}>#{player.jerseyNumber}</span>}

                </div>
              </div>
              </div>
              <button onClick={() => setSelBatterInfo(null)}
                style={{background:'none',border:'1px solid var(--border)',borderRadius:6,
                  padding:'4px 10px',color:'var(--muted)',cursor:'pointer',
                  fontFamily:"'DM Mono',monospace",fontSize:11,flexShrink:0}}>✕</button>
            </div>

            {/* Body */}
            <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>
              <BatterPanel player={player} teamAbbr={teamAbbr}/>
            </div>
          </div>
        </>;
      })()}
    </div>
  );
}


function LiveTab() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showHeatingUp, setShowHeatingUp] = useState(false);
  const [liveView, setLiveView] = useState('gameday'); // 'gameday' | 'games' | 'lineups'

  // Expose setLiveView so notifications can route into live sub-views
  useEffect(() => {
    if (_GLOBAL_NAV) _GLOBAL_NAV.setLiveView = setLiveView;
    return () => { if (_GLOBAL_NAV) _GLOBAL_NAV.setLiveView = null; };
  }, [setLiveView]);
  const [liveGameFilter, setLiveGameFilter] = useState('all');
  const todayET2 = new Date().toLocaleDateString("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"});
  const [lm2,ld2,ly2] = todayET2.split("/");
  const liveTodayStr = `${ly2}-${lm2}-${ld2}`;
  const LIVE_SEASON_START = "2026-03-20";
  const [liveDate, setLiveDate] = useState(liveTodayStr);
  const [todayHRCount, setTodayHRCount] = useState(null);

  const load = useCallback((silent=false, dateOverride=null) => {
    const d = dateOverride || liveDate;
    const isToday2 = d === liveTodayStr;
    if (isToday2) {
      fetchGames(setLoading, setGames, setError, silent);
    } else {
      if (!silent) setLoading(true);
      setError(null);
      fetch(`/api/schedule?date=${d}`)
        .then(r=>r.json())
        .then(data=>{
          const allGames = (data.dates?.[0]?.games||[]).map(g=>{
            const aw=g.teams?.away,hm=g.teams?.home,ls=g.linescore||{};
            const awAbbr=aw?.team?.abbreviation||"???";
            const hmAbbr=hm?.team?.abbreviation||"???";
            return {
              id:g.gamePk,gamePk:g.gamePk,
              status:(()=>{const abs=g.status?.abstractGameState||"";const coded=g.status?.codedGameState||"";if(abs==="Live")return"Live";if(abs==="Final"||abs==="Game Over")return"Final";if(coded==="I")return"Live";if(coded==="F"||coded==="O")return"Final";return"Preview";})(),
              inning:ls.currentInning?`${ls.inningHalf==="Bottom"?"▼":"▲"} ${ls.currentInning}`:null,
              venue:g.venue?.name||"",
              gameTime:(()=>{const gt=g.gameDate||"";if(!gt)return null;try{return new Date(gt).toLocaleTimeString("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit",hour12:true});}catch{return null;}})(),
              away:{abbr:awAbbr,teamId:aw?.team?.id,score:aw?.score??"-",record:`${aw?.leagueRecord?.wins||0}-${aw?.leagueRecord?.losses||0}`,probablePitcher:aw?.probablePitcher?.fullName||null,pitcherHand:aw?.probablePitcher?.pitchHand?.code||"R"},
              home:{abbr:hmAbbr,teamId:hm?.team?.id,score:hm?.score??"-",record:`${hm?.leagueRecord?.wins||0}-${hm?.leagueRecord?.losses||0}`,probablePitcher:hm?.probablePitcher?.fullName||null,pitcherHand:hm?.probablePitcher?.pitchHand?.code||"R"},
            };
          });
          setGames(allGames);
          setLoading(false);
        })
        .catch(e=>{setError(e.message);setLoading(false);});
    }
    setLastUpdate(new Date().toLocaleTimeString());
  }, [liveDate]);

  // Fetch today's HR count for the stat card
  useEffect(()=>{
    fetch('/api/homeruns').then(r=>r.json())
      .then(d=>setTodayHRCount(d.homeruns?.length||0))
      .catch(()=>{});
  },[]);

  useEffect(() => { load(false); }, []); // initial — show spinner
  // Background refresh every 30s — silent so open game panels stay open
  useEffect(() => {
    const id = setInterval(() => load(true, liveDate), 60000);
    return () => clearInterval(id);
  }, [load]);
  const live = games.filter(g=>g.status==="Live");
  const pre  = games.filter(g=>g.status==="Preview");
  const fin  = games.filter(g=>g.status==="Final");
  // Debug: log what statuses we got
  if (games.length > 0) console.log("[Live] Game statuses:", games.map(g=>`${g.away?.abbr}@${g.home?.abbr}:${g.status}`).join(", "));
  return <div>
    <div className="hrow">
      {lastUpdate && <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",marginBottom:6,textAlign:'right'}}>Updated: {lastUpdate}</div>}
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button onClick={()=>setShowHeatingUp(true)}
          style={{padding:"6px 14px",borderRadius:8,cursor:"pointer",
            background:"rgba(232,65,26,.12)",border:"1px solid rgba(232,65,26,.35)",
            color:"var(--accent)",fontFamily:"'Oswald',sans-serif",fontWeight:700,
            fontSize:12,letterSpacing:.5,display:"flex",alignItems:"center",gap:5}}>
          🔥 Heating Up
        </button>
        <RefBtn refreshing={refreshing} onClick={async()=>{setRefreshing(true);await fetchGames(setLoading,setGames,setError,true);setLastUpdate(new Date().toLocaleTimeString());setRefreshing(false);}}/>
      </div>
    </div>

    {/* Sub-view toggle */}
    <div style={{display:'flex',gap:5,marginBottom:12,padding:'3px',background:'var(--surface)',borderRadius:8,border:'1px solid var(--border)',width:'fit-content'}}>
      {[['gameday','📺 Gameday'],['games','🎮 Live Games'],['lineups','📋 Lineups']].map(([key,label])=>(
        <button key={key} onClick={()=>setLiveView(key)}
          style={{padding:'6px 14px',borderRadius:6,cursor:'pointer',border:'none',
            fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,letterSpacing:.8,
            textTransform:'uppercase',transition:'all .15s',
            background:liveView===key?'var(--accent)':'transparent',
            color:liveView===key?'white':'var(--muted)'}}>
          {label}
        </button>
      ))}
    </div>

  {liveView==='lineups' && <LineupsView date={liveDate}/>}
  {liveView==='gameday' && <GamedayTab/>}

  {liveView==='games' && <>
  {/* Date picker */}
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
    <span style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1}}>Date</span>
    <button onClick={()=>{const d=new Date(liveDate+"T12:00:00");d.setDate(d.getDate()-1);const s=d.toISOString().slice(0,10);setLiveDate(s);load(false,s);}}
      disabled={liveDate<=LIVE_SEASON_START}
      style={{padding:"3px 10px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12}}>←</button>
    <input type="date" value={liveDate} min={LIVE_SEASON_START}
      onChange={e=>{setLiveDate(e.target.value);load(false,e.target.value);}}
      style={{padding:"3px 10px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text)",fontFamily:"'DM Mono',monospace",fontSize:11,cursor:"pointer"}}/>
    <button onClick={()=>{const d=new Date(liveDate+"T12:00:00");d.setDate(d.getDate()+1);const s=d.toISOString().slice(0,10);setLiveDate(s);load(false,s);}}
      style={{padding:"3px 10px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12}}>→</button>
    {liveDate!==liveTodayStr&&<button onClick={()=>{setLiveDate(liveTodayStr);load(false,liveTodayStr);}}
      style={{padding:"3px 10px",borderRadius:6,border:"1px solid var(--accent)",background:"rgba(232,65,26,.1)",color:"var(--accent)",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700}}>Today</button>}
    <span style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>
      {liveDate===liveTodayStr?"🔴 Live":"📅 "+new Date(liveDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
    </span>
  </div>

    <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",
        borderRadius:8,background:"rgba(245,166,35,.06)",border:"1px solid rgba(245,166,35,.15)",
        marginBottom:10,fontSize:10,color:"var(--accent2)",fontFamily:"'DM Mono',monospace"}}
        className="landscape-hint">
        <span style={{fontSize:16}}>📱↔️</span>
        <span>Rotate phone to landscape for best experience</span>
      </div>
      <div className="note">ℹ️ <strong>Live</strong>: tap → hard contact in HR zones now vs L7. <strong>Upcoming</strong>: tap → 🚀 Liftoff list ranked by HR probability.</div>
    <div className="cards" style={{marginBottom:14}}>
<div className="card"><div className="cl">💥 HRs Today</div><div className="cv" style={{color:"var(--accent)"}}>{todayHRCount??"—"}</div><div className="cs">total homers</div></div>
      <div className="card"><div className="cl">Live Games</div><div className="cv" style={{color:"#e8411a"}}>{live.length}</div><div className="cs">in progress</div></div>
      <div className="card"><div className="cl">Scheduled</div><div className="cv" style={{color:"#27c97a"}}>{pre.length}</div><div className="cs">today</div></div>
      <div className="card"><div className="cl">Total</div><div className="cv">{games.length}</div><div className="cs">on slate</div></div>
    </div>
    {loading ? <div className="lw"><div className="sp"/><div className="lt">Fetching schedule…</div></div> : <>
      {error && <div className="warn">⚠️ {error} — Showing sample.</div>}
      {/* Game filter dropdown — only shows when there are multiple games */}
      {games.length > 1 && (
        <div style={{display:'flex',gap:8,marginBottom:10,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:1,flexShrink:0}}>Game:</span>
          <select value={liveGameFilter} onChange={e=>setLiveGameFilter(e.target.value)}
            style={{padding:'5px 10px',borderRadius:7,background:'var(--surface2)',
              border:`1px solid ${liveGameFilter==='all'?'var(--border)':'rgba(56,184,242,.4)'}`,
              color:liveGameFilter==='all'?'var(--muted)':'var(--ice)',
              fontFamily:"'DM Mono',monospace",fontSize:11,cursor:'pointer',fontWeight:600}}>
            <option value="all">All Games</option>
            {games.map(g=>(
              <option key={g.id} value={String(g.id)}>
                {g.away?.abbr||'?'} @ {g.home?.abbr||'?'}{g.status==='Live'?' 🔴':g.status==='Final'?' ✓':''}
              </option>
            ))}
          </select>
          {liveGameFilter!=='all'&&<button onClick={()=>setLiveGameFilter('all')}
            style={{padding:'3px 9px',borderRadius:5,border:'1px solid rgba(255,64,32,.3)',
              background:'rgba(255,64,32,.08)',color:'var(--accent)',
              fontFamily:"'DM Mono',monospace",fontSize:9,cursor:'pointer',fontWeight:700}}>✕</button>}
        </div>
      )}
      {live.length>0&&<><div className="div" style={{marginTop:8}}>🔴 Live Now</div><div className="gg">{live.filter(g=>liveGameFilter==='all'||String(g.id)===liveGameFilter).map(g=><GCard key={g.id} game={g}/>)}</div></>}
      {pre.length>0&&<><div className="div" style={{marginTop:12}}>🟢 Upcoming — Tap for 🚀 Liftoff List</div><div className="gg">{pre.filter(g=>liveGameFilter==='all'||String(g.id)===liveGameFilter).map(g=><GCard key={g.id} game={g}/>)}</div></>}
      {fin.length>0&&<><div className="div" style={{marginTop:12}}>✓ Final</div><div className="gg">{fin.filter(g=>liveGameFilter==='all'||String(g.id)===liveGameFilter).map(g=><GCard key={g.id} game={g}/>)}</div></>}
    </>}
  </>}
    {showHeatingUp && <HeatingUpSlideout games={games} onClose={()=>setShowHeatingUp(false)}/>}
</div>;
}


// TAB 3: SCOUTING BOARD
function ScoutingTab() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState("os");
  const [sortDir, setSortDir] = useState(1);
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [win, setWin] = useState(7);
  const [selMatchup, setSelMatchup] = useState(null);
  const [selTeam, setSelTeam] = useState(null);
  const [games, setGames] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [handFilter, setHandFilter] = useState('all');
  const [pitchTypes, setPitchTypes] = useState(new Set());
  // Per-player filtered metrics cache
  const [filteredMetrics, setFilteredMetrics] = useState({}); // pid → metrics
  const [fetchingFilters, setFetchingFilters] = useState(false);

  const load = useCallback((silent=false) => {
    fetchPlayers(setLoading, setPlayers, setError, silent);
  }, []);
  useEffect(() => { load(false); }, []);
  useEffect(() => {
    const id = setInterval(() => load(true), 300000);
    return () => clearInterval(id);
  }, [load]);
  useEffect(() => { fetchGames(()=>{}, setGames, ()=>{}); }, []);

  const hs = (k) => { if (sortKey===k) setSortDir(d=>-d); else { setSortKey(k); setSortDir(k==="timeET"||k==="chronoIndex"||k==="distance"||k==="exitVelo"?-1:1); } };

  // ── When filters change, fetch real filtered metrics from /api/statcast_raw ──
  // NOTE: pitch type + handedness filters require players.json (from mlbdata_aggregate.py)
  // Until that file is committed, these filters return no data from the API
  // Window buttons (L3/L7/L15/L30) work once players.json has window data
  useEffect(() => {
    if (handFilter === 'all' && pitchTypes.size === 0) {
      setFilteredMetrics({});
      return;
    }
    if (players.length === 0) return;

    const fetchFilteredMetrics = async () => {
      setFetchingFilters(true);
      const pitchParam = [...pitchTypes].join(',');
      // Map pitch names to Savant codes
      const pitchCodeMap = {
        '4-Seam FB':'FF', 'Sinker':'SI', 'Cutter':'FC',
        'Slider':'SL', 'Changeup':'CH', 'Curveball':'CU',
        'Sweeper':'ST', 'Splitter':'FS',
      };
      const pitchCodes = [...pitchTypes].map(p => pitchCodeMap[p]||p).join(',');

      // Fetch for top 50 visible players
      const toFetch = players.slice(0, 50);
      const results = await Promise.allSettled(
        toFetch.map(p =>
          fetch(`/api/statcast_raw?batter_id=${p.pid}&days=${win}&pitch_types=${pitchCodes}&pitcher_throws=${handFilter === 'all' ? '' : handFilter}`)
            .then(r => r.json())
            .then(d => ({ pid: p.pid, metrics: d.metrics }))
            .catch(() => ({ pid: p.pid, metrics: null }))
        )
      );

      const newMetrics = {};
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value.metrics) {
          newMetrics[r.value.pid] = r.value.metrics;
        }
      });
      setFilteredMetrics(newMetrics);
      setFetchingFilters(false);
    };

    const debounce = setTimeout(fetchFilteredMetrics, 500);
    return () => clearTimeout(debounce);
  }, [handFilter, pitchTypes, win, players.length]);

  // Get display metrics for a player — filtered if available, season baseline otherwise
  const getMetrics = (p) => {
    const fm = filteredMetrics[p.pid];
    if (fm) return {
      avgEV:        fm.avgEV        || p.avgEV,
      barrel:       fm.barrelPct    || p.barrel,
      hardHit:      fm.hardHitPct   || p.hardHit,
      flyBall:      fm.flyBallPct   || p.flyBall,
      launchAngle:  fm.launchAngle  || p.launchAngle,
      pullAir:      fm.pulledAirPct || p.pullAir,
      oSwing:       fm.chasePct     || p.oSwing,
      zContact:     fm.zContactPct  || p.zContact,
      avg:          parseFloat(fm.avg) || p.avg,
      bbPct:        fm.bbPct        || p.bbPct,
      kPct:         fm.kPct         || p.kPct,
      xwoba:        fm.xwoba        || p.xwoba,
      hr:           fm.hr           || p.hr,
      pulledBarrel: fm.pulledBarrelPct || p.pulledBarrel,
      almostHRPct:  fm.almostHRPct  || 0,
      isFiltered: true,
    };
    const w = p.windows?.[winKey(win)] ?? {};
    return { ...p, ...w, isFiltered: false };
  };

  // Teams playing today
  const todayTeamsS = new Set(games.flatMap(g=>[g.away.abbr,g.home.abbr]).filter(t=>t&&t!=="???"));
  const matchupTeamsS = selMatchup
    ? new Set([selMatchup.away.abbr, selMatchup.home.abbr].filter(t=>t&&t!=="???"))
    : null;

  const filtered = players.filter(p => {
    // Matchup/team filter takes priority over broad today filter
    if (matchupTeamsS && matchupTeamsS.size > 0) {
      // Show only batters in this matchup
      if (p.team && p.team !== "—" && !matchupTeamsS.has(p.team)) return false;
    } else if (selTeam) {
      if (p.team !== selTeam) return false;
    } else if (todayTeamsS.size > 0) {
      // No specific selection — show today's teams only
      if (p.team && p.team !== "—" && p.team !== "???" && !todayTeamsS.has(p.team)) return false;
    }
    if (searchQ && !p.name.toLowerCase().includes(searchQ.toLowerCase())) return false;
    const wg = (p.windows?.[winKey(win)]?.grade || p.grade)?.grade;
    if (filter==="aplus") return wg==="A+";
    if (filter==="a") return wg==="A+"||wg==="A";
    if (filter==="b") return wg==="A+"||wg==="A"||wg==="B";
    if (filter==="chasers") return (p.oSwing??30)>=33;
    return true;
  });

  const sortValS = (p, k) => {
    const m = getMetrics(p);
    if (k === "os") return m?.os ?? p.os ?? 0;
    if (m && k in m) return m[k] ?? 0;
    const w = p.windows?.[winKey(win)];
    if (w && k in w) return w[k];
    return p[k] ?? 0;
  };
  const sorted = [...filtered].sort((a,b) => sortDir*(sortValS(b,sortKey)-sortValS(a,sortKey)));
  // ── Data availability notice ──────────────────────────────
  const dataNotice = !hasRealFilterData && filtersActive
    ? "⚠️ Pitch type / handedness filters need at-bat log data. Run mlbdata_aggregate.py and commit players.json to enable."
    : !hasRealWindowData && win !== 7
    ? "ℹ️ Date windows will show different data once the at-bat log (players.json) is committed."
    : null;

  const apC=players.filter(p=>p.grade?.grade==="A+").length, aC=players.filter(p=>p.grade?.grade==="A").length, bC=players.filter(p=>p.grade?.grade==="B").length, chC=players.filter(p=>(p.oSwing??30)>=33).length;

  const filtersActive = handFilter !== 'all' || pitchTypes.size > 0;
  const hasRealWindowData = players.some(p => p.windows?.last7 && p.windows.last7.avgEV > 0);
  const hasRealFilterData = players.some(p => p.pitchSplits && Object.keys(p.pitchSplits).length > 0);

  return <div>
    <div className="hrow">
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <SearchBar value={searchQ} onChange={setSearchQ} placeholder="Search any batter…"/>
        <WindowButtons window={win} setWindow={setWin}/>
        <RefBtn refreshing={refreshing} onClick={async()=>{setRefreshing(true);await fetchPlayers(setLoading,setPlayers,setError,true);setRefreshing(false);}}/>
      </div>
    </div>

    {/* ── UNIFIED FILTER PANEL ── */}
    <div style={{marginBottom:12,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px"}}>

      {/* Row 1: Matchup + Team + Park/Weather */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginRight:4}}>📅 Game:</span>
        <button className={`chip ${!selMatchup&&!selTeam?"active":""}`}
          onClick={()=>{setSelMatchup(null);setSelTeam(null);}}
          style={{fontSize:10,fontFamily:"'Oswald',sans-serif",fontWeight:600}}>All Batters</button>
        {games.filter(g=>g.away.abbr!=="???"&&g.home.abbr!=="???").map(g=>(
          <button key={g.id}
            className={`chip ${selMatchup?.id===g.id?"active":""}`}
            onClick={()=>{setSelMatchup(selMatchup?.id===g.id?null:g);setSelTeam(null);}}
            style={{fontSize:10,fontFamily:"'Oswald',sans-serif",fontWeight:600}}>
            {g.away.abbr} @ {g.home.abbr}
            {g.gameTime&&<span style={{fontSize:8,color:"var(--muted)",marginLeft:3}}>{g.gameTime}</span>}
          </button>
        ))}
        {[...new Set(games.flatMap(g=>[g.away.abbr,g.home.abbr]).filter(t=>t&&t!=="???"))].sort().map(t=>(
          <button key={t}
            className={`chip ${selTeam===t?"active":""}`}
            onClick={()=>{setSelTeam(selTeam===t?null:t);setSelMatchup(null);}}
            style={{fontSize:9,fontFamily:"'Oswald',sans-serif",fontWeight:600,padding:"2px 7px"}}>{t}</button>
        ))}
      </div>

      {/* Row 2: vs Pitcher handedness */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginRight:4}}>⚾ vs Pitcher:</span>
        {[{k:"all",l:"All"},{k:"R",l:"RHP"},{k:"L",l:"LHP"}].map(f=>(
          <button key={f.k} className={`chip ${handFilter===f.k?"active":""}`}
            onClick={()=>setHandFilter(f.k)}
            style={{fontFamily:"'DM Mono',monospace",fontSize:10}}>{f.l}</button>
        ))}
        <span style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",marginLeft:8,textTransform:"uppercase",letterSpacing:1}}>Pitch Type:</span>
        <button className={`chip ${pitchTypes.size===0?"active":""}`} onClick={()=>setPitchTypes(new Set())}
          style={{fontFamily:"'DM Mono',monospace",fontSize:10}}>All</button>
        {["4-Seam FB","Sinker","Cutter","Slider","Changeup","Curveball"].map(pt=>(
          <button key={pt} className={`chip ${pitchTypes.has(pt)?"active":""}`}
            onClick={()=>setPitchTypes(prev=>{const n=new Set(prev);n.has(pt)?n.delete(pt):n.add(pt);return n;})}
            style={{fontFamily:"'DM Mono',monospace",fontSize:10}}>{pt}</button>
        ))}
        {pitchTypes.size>0&&<span style={{fontSize:9,color:"var(--accent)",fontFamily:"'DM Mono',monospace"}}>
          {pitchTypes.size} type{pitchTypes.size>1?"s":""} · recalculating from at-bat logs
        </span>}
      </div>

      {/* Row 3: Active filters summary + park/weather */}
      {selMatchup && <ScoutingWeather matchup={selMatchup} games={games}/>}
      {(selMatchup||selTeam) && <div style={{fontSize:9,color:"var(--accent)",fontFamily:"'DM Mono',monospace",marginTop:6}}>
        {selMatchup?`${selMatchup.away.abbr} @ ${selMatchup.home.abbr} batters`:selTeam?`${selTeam} batters`:""}
        {" · "}<span style={{cursor:"pointer",textDecoration:"underline"}} onClick={()=>{setSelMatchup(null);setSelTeam(null);}}>Clear</span>
      </div>}
    </div>

    <div className="cards">
      <div className="card"><div className="cl">🔴 A+ Threats</div><div className="cv" style={{color:"var(--aplus)"}}>{apC}</div><div className="cs">Red-hot</div></div>
      <div className="card"><div className="cl">🔥 Grade A</div><div className="cv" style={{color:"var(--a)"}}>{aC}</div><div className="cs">Impact bats</div></div>
      <div className="card"><div className="cl">⚡ Grade B</div><div className="cv" style={{color:"var(--b)"}}>{bC}</div><div className="cs">Heating up</div></div>
      <div className="card"><div className="cl">🚫 Chasers</div><div className="cv" style={{color:"#ff3010"}}>{chC}</div><div className="cs">O-Swing ≥33%</div></div>
    </div>

    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:8,alignItems:"center"}}>
      <div className="filters" style={{marginBottom:0}}><span className="fl">Grade:</span>
        {[{key:"all",label:"All"},{key:"aplus",label:"🔴 A+"},{key:"a",label:"A+ & A"},{key:"b",label:"B+"},{key:"chasers",label:"🚫 Chasers"}]
          .map(f=><button key={f.key} className={`chip ${filter===f.key?"active":""}`} onClick={()=>setFilter(f.key)}>{f.label}</button>)}
      </div>
    </div>

    {loading ? <div className="lw"><div className="sp"/><div className="lt">Loading Scouting Board…</div></div> : <>
      {error && <div className="warn">⚠️ {error}</div>}
      {fetchingFilters && <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",color:"var(--muted)",fontFamily:"'DM Mono',monospace",fontSize:11}}>
        <div className="sp" style={{width:14,height:14,borderWidth:2}}/> Fetching filtered at-bat data from Baseball Savant…
      </div>}
      <div className="tw-scroll"><div className="tw-scroll-inner"><table><thead><tr>
        <th>#</th><th>Player</th><th style={{width:36}}>Pick</th>
        <th className={sortKey==="os"?"sk":""} onClick={()=>hs("os")} style={{cursor:"pointer"}}>
          Grade{sortKey==="os"&&<span style={{color:"var(--accent)",marginLeft:3}}>{sortDir<0?"↓":"↑"}</span>}
        </th>
        <th className={sortKey==="os"?"sk":""}>
          <Tip text="Unified score: CQ 50% + HRI 30% + RDY 20%. Recalculates from raw at-bat data when filters active.">
            <span>Score</span>
          </Tip>
        </th>
        {STAT_COL_HEADERS.map(c=>
          <th key={c.key} className={sortKey===c.key?"sk":""} onClick={()=>hs(c.key)}>
            <div style={{display:"flex",alignItems:"center",gap:2}}>
              <Tip text={c.tip}><span>{c.label}</span></Tip>
              {sortKey===c.key&&<span style={{color:"var(--accent)"}}>{sortDir<0?"↓":"↑"}</span>}
            </div>
          </th>
        )}
      </tr></thead>
      <tbody>{sorted.map((p,i)=>{
        const m = getMetrics(p);
        const displayP = filtersActive && m.isFiltered ? {...p, ...m} : p;
        const w = p.windows?.[winKey(win)] ?? {};
        const wg = w.grade||p.grade||{grade:"X",cls:"x",color:"#2a3a48"};
        const wOS = m.os ?? w.os ?? p.os ?? 0;

        // Plate IQ from real metrics
        const bb = m.bbPct || p.bbPct || 0;
        const k = m.kPct || p.kPct || 22;
        const chase = m.oSwing ?? m.chasePct ?? p.oSwing ?? 30;
        const zc = m.zContact ?? m.zContactPct ?? p.zContact ?? 80;
        const iqScore = Math.min(
          (bb>=12?32:bb>=9?26:bb>=7?18:bb>=5?10:3) +
          (k<=14?28:k<=18?22:k<=22?15:k<=27?9:k<=32?4:1) +
          (chase<=20?28:chase<=25?22:chase<=30?15:chase<=35?8:chase<=40?3:1) +
          (zc>=88?12:zc>=83?9:zc>=78?6:zc>=72?3:1),
          100
        );
        const iqLabel = iqScore>=82?"🎯 Elite":iqScore>=68?"✅ Patient":iqScore>=52?"📊 Average":iqScore>=38?"⚠️ Chaser":"🚫 Free Swing";
        const iqColor = iqScore>=82?"var(--green)":iqScore>=68?"var(--green)":iqScore>=52?"var(--muted)":iqScore>=38?"var(--fire3)":"#ff3010";

        return <tr key={p.pid}>
          <td><span className="sv avg" style={{fontSize:10}}>{i+1}</span></td>
          <td><div className="pc" style={{cursor:"pointer"}} onClick={()=>openAtBatSlide(p)}>
            <PlayerAvatar pid={p.pid||p.id} name={p.name} size={30}/>
            <div>
              <div className="pn">{p.name}</div>
              <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",display:"flex",gap:4,alignItems:"center",marginTop:1}}>
                <span style={{color:"var(--accent2)",fontWeight:700,fontSize:11}}>{getTeam(p.pid, p.team)}</span>
                {p.lineupStatus==="confirmed"&&<span style={{fontSize:9,color:"var(--green)"}}>✅</span>}
                {(!p.lineupStatus||p.lineupStatus==="today")&&p.team&&p.team!=="—"&&<span style={{fontSize:9,color:"var(--muted)"}}>❓</span>}
              </div>
            </div>
          </div></td>
          <td onClick={e=>e.stopPropagation()}><PickButton pid={p.pid} name={p.name} team={p.team}/></td>
          <td><div style={{display:"flex",alignItems:"center",gap:5}}><GBadge g={wg}/><span style={{fontSize:9,color:wg.color,fontFamily:"DM Mono,monospace",lineHeight:1.3}}>{wg.label}</span></div></td>
          <td>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:42,height:4,borderRadius:2,background:"var(--border)",overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:2,width:`${Math.min(wOS,100)}%`,background:wg.color}}/>
              </div>
              <span style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:700,color:wg.color,minWidth:28}}>
                {typeof wOS==="number"?wOS.toFixed(0):wOS}
              </span>
            </div>
            <div style={{fontSize:9,color:iqColor,fontFamily:"'DM Mono',monospace",marginTop:2}}>{iqLabel}</div>
            {m.isFiltered && <div style={{fontSize:8,color:"var(--accent)",fontFamily:"'DM Mono',monospace"}}>filtered</div>}
          </td>
          <StatCols p={displayP} window={win}/>
        </tr>;
      })}</tbody></table></div></div>
    </>}
  </div>;
}


function BvPTab() {
  const [games, setGames] = useState([]);
  const [loadingG, setLoadingG] = useState(true);
  const [selGame, setSelGame] = useState(null);
  const [selSide, setSelSide] = useState("away");
  const [pitcher, setPitcher] = useState(null);
  const [batters, setBatters] = useState([]);

  useEffect(() => { fetchGames(setLoadingG, setGames, () => {}); }, []);
  useEffect(() => {
    if (games.length > 0 && !selGame) {
      const first = games.find(g => g.status === "Preview") || games[0];
      setSelGame(first);
    }
  }, [games, selGame]);
  useEffect(() => {
    if (!selGame) return;
    const pitchSide  = selSide === "away" ? "home" : "away";
    const batterSide = selSide;
    const p = genPitcher(selGame, pitchSide);
    setPitcher(p);
    setBatters([]);

    // Load pitcher data
    fetchRealPitcher(selGame, pitchSide).then(realP => setPitcher(realP)).catch(() => {});
    if (p.name && !p.name.includes('Starter')) {
      fetchPitcherData(null, p.name).then(data => {
        if (data?.found) {
          setPitcher(prev => ({
            ...prev,
            pitchMix: data.pitchMix?.length > 0 ? data.pitchMix : prev.pitchMix,
            era:      data.stats?.era  || prev.era,
            whip:     data.stats?.whip || prev.whip,
            fbVelo:   data.pitchMix?.[0]?.velo || prev.fbVelo,
            loading:  false,
          }));
        } else {
          setPitcher(prev => ({...prev, loading: false}));
        }
      }).catch(() => setPitcher(prev => ({...prev, loading: false})));
    }

    // Load batters — try live boxscore first, then fall back to cache
    (async () => {
      // Wait up to 5s for player cache to be ready
      let waited = 0;
      while (Object.keys(PLAYER_DATA_CACHE).length < 5 && waited < 5000) {
        await new Promise(r => setTimeout(r, 500));
        waited += 500;
      }

      try {
        const res  = await fetch(`/api/boxscore?gamePk=${selGame.gamePk}`);
        const data = await res.json();
        const team = data.teams?.[batterSide];
        const ta   = team?.team?.abbreviation || selGame[batterSide]?.abbr || batterSide.toUpperCase();
        const batterIds = team?.batters?.length > 0
          ? team.batters.slice(0, 9)
          : Object.keys(team?.players || {}).slice(0, 9).map(k => parseInt(k.replace("ID","")));
        const liveBatters = batterIds.map((bid, i) => {
          const pl = team?.players?.[`ID${bid}`];
          if (!pl) return null;
          if (pl.position?.abbreviation === "P") return null;
          const name  = pl.person?.fullName || `Player ${bid}`;
          const hand  = pl.person?.batSide?.code || getBatterHand(name);
          return buildBvPBatter(bid, name, ta, hand, p);
        }).filter(Boolean).sort((a,b) => b.ms - a.ms);

        if (liveBatters.length > 0) { setBatters(liveBatters); return; }
      } catch(e) { console.warn("Live lineup fetch failed:", e.message); }

      // Fallback: top players from cache ranked by score
      const fallback = genBvPBatters(p);
      setBatters(fallback.length > 0 ? fallback : []);
    })();
  }, [selGame, selSide]);

  const PCOLS = PITCH_COLORS;
  const abCls = r => r==="HR"?"hr":r==="H"?"hit":r==="K"?"k":"out";

  // Handedness badge
  const HandBadge = ({hand, matchup}) => {
    const col = matchup?.cls==="pos"?"var(--green)":matchup?.cls==="neg"?"var(--ice)":"var(--muted)";
    return <div style={{display:"flex",flexDirection:"column",gap:2,alignItems:"flex-start"}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 7px",borderRadius:5,background:"var(--surface2)",border:"1px solid var(--border)"}}>
        <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,color:"var(--text)"}}>{hand==="S"?"S-Hits":hand==="L"?"LHB":"RHB"}</span>
      </div>
      {matchup && <span style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:col,fontWeight:600}}>{matchup.label}</span>}
    </div>;
  };

  return <div>

    <div className="note">
      ℹ️ Pitcher handedness vs batter handedness is factored into every metric and the matchup grade.
      <strong> ⚡ Platoon Adv</strong> = LHB vs RHP or RHB vs LHP (batter-favored).
      <strong> ⚠️ Same Side</strong> = pitcher advantage — all metrics adjust accordingly.
      Switch hitters always get the favorable side.
    </div>

    {loadingG ? <div style={{padding:"14px 0",fontFamily:"'DM Mono',monospace",fontSize:11,color:"var(--muted)"}}>Loading games…</div>
    : <div className="bgs">{games.filter(g=>g.status!=="Final").map(g=>
        <div key={g.id} className={`bgb ${selGame?.id===g.id?"active":""}`} onClick={()=>{setSelGame(g);setSelSide("away");}}>
          <div className="bgbt">{g.away.abbr!=="???"?g.away.abbr:"TBD"} @ {g.home.abbr!=="???"?g.home.abbr:"TBD"}</div>
          <div className="bgbs">{g.status==="Live"?`● Live ${g.inning||""}`:"Scheduled"}</div>
        </div>
      )}</div>
    }

    {selGame && pitcher && <>
      <div style={{display:"flex",gap:7,marginBottom:12,alignItems:"center"}}>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1}}>Facing pitcher from:</span>
        {["away","home"].map(s=>
          <button key={s} className={`chip ${selSide===s?"active":""}`} onClick={()=>setSelSide(s)}>
            {selGame[s].abbr!=="???"?selGame[s].abbr:s==="away"?"Away Team":"Home Team"} ({s==="away"?"Away":"Home"})
          </button>
        )}
      </div>

      <div className="pc2">
        <div className="ph">
          <div className="pa">{ini(pitcher.name)}</div>
          <div>
            <div className="pnam">{pitcher.name}<span className="hnd">{pitcher.hand}</span></div>
            <div className="psub">{pitcher.team && pitcher.team!=="???"?pitcher.team:selGame?.away?.abbr||selGame?.home?.abbr||"—"} · ERA {pitcher.era} · WHIP {pitcher.whip} · FB {pitcher.fbVelo} mph</div>
          </div>
        </div>
        <div style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",marginBottom:7,textTransform:"uppercase",letterSpacing:1}}>Pitch Arsenal</div>
        {pitcher?.loading && <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",padding:"8px 0"}}>⟳ Loading pitch data…</div>}
        <div className="pmg">{(pitcher.pitchMix||[]).map(pitch=>{
          const col=PCOLS[pitch.name]||"#8899a6";
          return <div key={pitch.name} className="pmc">
            <div className="pmh"><div className="pmn" style={{color:col}}>{pitch.name}</div><div className="pmp" style={{color:col}}>{pitch.pct}%</div></div>
            <div className="pub"><div className="puf" style={{width:`${pitch.pct}%`,background:col}}/></div>
            <div className="psr">{pitch.velo&&<span>Velo: <span className="psv2 nu">{pitch.velo}</span></span>}{pitch.spin&&<span>Spin: <span className="psv2 nu">{pitch.spin}</span></span>}</div>
            {pitch.isPutaway&&<div className="pta">☠️ Put-Away</div>}
          </div>;
        })}</div>
      </div>

      <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>
        Batters vs {pitcher.name} ({pitcher.hand}) — ranked by matchup grade
      </div>
      <div className="tw"><table style={{width:"100%"}}>
        <thead><tr>
          <th>#</th><th>Batter</th><th>Hand / Matchup</th><th>Grade</th>
          <th><Tip text="Exit velocity vs this pitcher's mix, adjusted for handedness"><span>Avg EV</span></Tip></th>
          <th><Tip text="Barrel% vs this pitch mix, adjusted for handedness"><span>Barrel%</span></Tip></th>
          <th><Tip text="Fly ball% — elevated = HR hunting mode"><span>Fly Ball%</span></Tip></th>
          <th><Tip text="Chase rate vs this pitcher. Lower = more disciplined."><span>Chase Rate</span></Tip></th>
          <th><Tip text="Pull Air% — high = power zone HR intent"><span>Pull Air%</span></Tip></th>
          <th><Tip text="Avg launch angle vs this mix. 15–35° = HR zone."><span>Launch °</span></Tip></th>
          <th>Career vs P</th><th>Last 3 AB</th>
        </tr></thead>
        <tbody>{batters.map((b,i)=>{
          const mg=b.mg||{grade:"C",cls:"c",color:"var(--c)"};
          const evC=b.evVsFB>=T.EV_EL?"dng":b.evVsFB>=T.EV_HH?"hot":b.evVsFB>=90?"warm":"avg";
          const barC=(b.barrelVsPitch??b.barrel)>=T.BAR_EL?"hot":(b.barrelVsPitch??b.barrel)>=T.BAR_GD?"warm":"avg";
          const fbC=(b.flyBallVsPitch??35)>=42?"hot":(b.flyBallVsPitch??35)>=34?"warm":"avg";
          const chC=(b.chaseVsPitch??30)<=T.CHASE_EL?"good":(b.chaseVsPitch??30)<=T.CHASE_GD?"avg":"cold";
          const puC=(b.pullAirVsPitch??18)>=T.PULL_EL?"hot":(b.pullAirVsPitch??18)>=T.PULL_GD?"warm":"avg";
          const laC=inHRZ(b.launchAngleVsPitch??18)?"good":"avg";
          const abCl=r=>r==="HR"?"hr":r==="H"?"hit":r==="K"?"k":"out";
          const matchupHighlight = b.matchup?.cls==="pos"?"rgba(39,201,122,.05)":b.matchup?.cls==="neg"?"rgba(56,184,242,.04)":"";
          return <tr key={b.id} style={{background:matchupHighlight}}>
            <td><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:15,color:i<3?"var(--accent2)":"var(--muted)"}}>{i+1}</span></td>
            <td><div className="pc"><PlayerAvatar pid={b.id} name={b.name} size={30}/><div><div className="pn">{b.name}</div><div className="pt">{b.team} · {b.hr} HR</div></div></div></td>
            <td>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:5,background:"var(--surface2)",border:"1px solid var(--border)",width:"fit-content"}}>
                  <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12}}>{b.hand==="S"?"S-Hits":b.hand==="L"?"LHB":"RHB"}</span>
                  <span style={{color:"var(--muted)",fontSize:10}}>vs {pitcher.hand}</span>
                </div>
                {b.matchup && <span style={{fontSize:9,fontFamily:"'DM Mono',monospace",fontWeight:600,color:b.matchup.cls==="pos"?"var(--green)":b.matchup.cls==="neg"?"var(--ice)":"var(--muted)"}}>{b.matchup.label}</span>}
                {b.matchup && <span style={{fontSize:8,fontFamily:"'DM Mono',monospace",color:"var(--muted)",lineHeight:1.3}}>{b.matchup.detail}</span>}
              </div>
            </td>
            <td><div style={{display:"flex",alignItems:"center",gap:6}}><GBadge g={mg}/><span style={{fontSize:9,color:mg.color,fontFamily:"'DM Mono',monospace"}}>{mg.label}</span></div></td>
            <td>
              <span className={`sv ${evC}`}>{(b.evVsFB??88).toFixed(1)}</span>
              <div style={{width:46,height:3,borderRadius:2,background:"var(--border)",overflow:"hidden",marginTop:2}}>
                <div style={{height:"100%",borderRadius:2,width:`${Math.min(((b.evVsFB??88)/112)*100,100)}%`,background:(b.evVsFB??88)>=T.EV_EL?"#ff3010":(b.evVsFB??88)>=T.EV_HH?"#ff8020":"#5a7080"}}/>
              </div>
            </td>
            <td>
              <span className={`sv ${barC}`}>{(b.barrelVsPitch??b.barrel).toFixed(1)}%</span>
              <div style={{width:46,height:3,borderRadius:2,background:"var(--border)",overflow:"hidden",marginTop:2}}>
                <div style={{height:"100%",borderRadius:2,width:`${Math.min((b.barrelVsPitch??b.barrel)/25*100,100)}%`,background:(b.barrelVsPitch??b.barrel)>=T.BAR_EL?"#ff8020":"#5a7080"}}/>
              </div>
            </td>
            <td>
              <span className={`sv ${fbC}`}>{(b.flyBallVsPitch??35).toFixed(1)}%</span>
              <div style={{width:46,height:3,borderRadius:2,background:"var(--border)",overflow:"hidden",marginTop:2}}>
                <div style={{height:"100%",borderRadius:2,width:`${Math.min((b.flyBallVsPitch??35)/50*100,100)}%`,background:(b.flyBallVsPitch??35)>=40?"#ff8020":"#5a7080"}}/>
              </div>
            </td>
            <td>
              <span className={`sv ${chC}`}>{(b.chaseVsPitch??30).toFixed(1)}%</span>
              <div style={{width:46,height:3,borderRadius:2,background:"var(--border)",overflow:"hidden",marginTop:2}}>
                <div style={{height:"100%",borderRadius:2,width:`${Math.min((b.chaseVsPitch??30)/50*100,100)}%`,background:(b.chaseVsPitch??30)>=35?"#38b8f2":(b.chaseVsPitch??30)>=27?"#5a7080":"#27c97a"}}/>
              </div>
            </td>
            <td>
              <span className={`sv ${puC}`}>{(b.pullAirVsPitch??18).toFixed(1)}%</span>
              <div style={{width:46,height:3,borderRadius:2,background:"var(--border)",overflow:"hidden",marginTop:2}}>
                <div style={{height:"100%",borderRadius:2,width:`${Math.min((b.pullAirVsPitch??18)/32*100,100)}%`,background:(b.pullAirVsPitch??18)>=22?"#ff8020":"#5a7080"}}/>
              </div>
            </td>
            <td>
              <span className={`sv ${laC}`}>{(b.launchAngleVsPitch??18).toFixed(1)}°</span>
              {inHRZ(b.launchAngleVsPitch??18)&&<div style={{fontSize:8,color:"var(--green)",fontFamily:"'DM Mono',monospace",marginTop:1}}>{getLAZ(b.launchAngleVsPitch??18)}</div>}
            </td>
            <td>
              <div className="h2h">
                <div className="h2hs"><div className="h2hv" style={{color:(b.careerBA??0.25)>=0.28?"#ff8020":"var(--text)"}}>{(b.careerBA??0.25).toFixed(3)}</div><div className="h2hl">AVG</div></div>
                <div className="h2hs"><div className="h2hv" style={{color:(b.careerHR??0)>=2?"#ff4020":(b.careerHR??0)>=1?"#ff8020":"var(--muted)"}}>{b.careerHR??0}</div><div className="h2hl">HR</div></div>
                <div className="h2hs"><div className="h2hv" style={{color:"var(--muted)"}}>{b.careerAB??0}</div><div className="h2hl">AB</div></div>
              </div>
            </td>
            <td>
              <div className="rab">{(b.last3||[]).map((r,j)=><div key={j} className={`abr ${abCl(r)}`}>{r}</div>)}</div>
              <div style={{fontSize:8,color:"var(--muted)",fontFamily:"'DM Mono',monospace",marginTop:2}}>last 3 vs P</div>
            </td>
          </tr>;
        })}</tbody>
      </table></div>
    </>}
  </div>;
}


// TAB 5: PITCH TYPE MATCHUP BUILDER
// All pitch types grouped by family
const PITCH_FAMILIES = {
  Fastballs:  ["4-Seam FB","2-Seam FB","Sinker","Cutter"],
  Breaking:   ["Curveball","Knuckle Curve","Slider","Sweeper","Slurve"],
  Offspeed:   ["Changeup","Splitter","Forkball","Circle Changeup"],
  Specialty:  ["Knuckleball","Screwball"],
};
const PITCH_TYPES = Object.values(PITCH_FAMILIES).flat();
const PITCH_COLORS = {
  // Fastballs — reds/oranges
  "4-Seam FB":"#ff4020","2-Seam FB":"#ff6030","Sinker":"#ff8040","Cutter":"#ffaa60",
  // Breaking — blues
  "Curveball":"#f5a623","Knuckle Curve":"#e8c020","Slider":"#38b8f2","Sweeper":"#60d0ff","Slurve":"#80b8e8",
  // Offspeed — greens
  "Changeup":"#27c97a","Splitter":"#40e090","Forkball":"#20a860","Circle Changeup":"#60d8a0",
  // Specialty — purples
  "Knuckleball":"#b088e8","Screwball":"#d080c8",
};

// ── BLEND MULTIPLE PITCH PROFILES ────────────────────────
function blendProfiles(pitchProfile, selectedPitches, matchup) {
  if (!selectedPitches || selectedPitches.size === 0) return null;
  const keys = ["ev","barrel","flyBall","la","pullAir","chase","score"];
  const blend = {};
  keys.forEach(k => {
    const vals = [...selectedPitches].map(pt => pitchProfile?.[pt]?.[k] ?? 0).filter(v => v > 0);
    blend[k] = vals.length > 0 ? Math.round((vals.reduce((a,b)=>a+b,0)/vals.length)*10)/10 : 0;
  });
  // Apply handedness to blended result
  if (matchup) {
    const adjusted = applyHandedness(blend, matchup);
    Object.assign(blend, adjusted);
  }
  blend.grade = getSG(blend.score);
  return blend;
}

function PitchBuilderTab() {
  const [selTeam, setSelTeam] = useState("NYY");
  const [roster, setRoster] = useState([]);
  const [selBatters, setSelBatters] = useState(new Set());
  const [selPitches, setSelPitches] = useState(new Set(["4-Seam FB"]));
  const [pitcherHand, setPitcherHand] = useState("R");
  const [sortKey, setSortKey] = useState("score");
  const [sortDir, setSortDir] = useState(-1);

  useEffect(() => {
    setRoster([]);
    setSelBatters(new Set());
    genTeamRoster(selTeam).then(r => {
      setRoster(r);
      setSelBatters(new Set(r.map(p => p.id)));
    });
  }, [selTeam]);

  const toggleBatter = (id) => {
    setSelBatters(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePitch = (pt) => {
    setSelPitches(prev => {
      const next = new Set(prev);
      if (next.has(pt)) { if (next.size===1) return next; next.delete(pt); }
      else { next.add(pt); }
      return next;
    });
    setSortKey("score"); setSortDir(-1);
  };

  const selectAll = () => setSelBatters(new Set(roster.map(p => p.id)));
  const clearAll = () => setSelBatters(new Set());

  const activeBatters = roster.filter(p => selBatters.has(p.id));

  // Blend + apply handedness per batter
  const blendsMap = {};
  activeBatters.forEach(p => {
    const matchup = getHandMatchup(p.hand, pitcherHand);
    blendsMap[p.id] = { blend: blendProfiles(p.pitchProfile, selPitches, matchup), matchup };
  });

  const sorted = [...activeBatters].sort((a, b) => {
    const pA = blendsMap[a.id]?.blend;
    const pB = blendsMap[b.id]?.blend;
    if (!pA || !pB) return 0;
    return sortDir * ((pB[sortKey] ?? 0) - (pA[sortKey] ?? 0));
  });

  const selPitchArr = [...selPitches];
  const isMulti = selPitches.size > 1;
  const pitchCol = isMulti ? "var(--accent2)" : (PITCH_COLORS[selPitchArr[0]] || "#8899a6");

  const hs = (k) => { if (sortKey===k) setSortDir(d=>-d); else { setSortKey(k); setSortDir(k==="timeET"||k==="chronoIndex"||k==="distance"||k==="exitVelo"?-1:1); } };

  const metricClass = (key, val) => {
    if (key==="ev") return val>=T.EV_EL?"dng":val>=T.EV_HH?"hot":val>=90?"warm":"avg";
    if (key==="barrel") return val>=T.BAR_EL?"hot":val>=T.BAR_GD?"warm":"avg";
    if (key==="flyBall") return val>=42?"hot":val>=34?"warm":"avg";
    if (key==="la") return inHRZ(val)?"good":"avg";
    if (key==="pullAir") return val>=22?"hot":val>=16?"warm":"avg";
    if (key==="chase") return val<=22?"good":val<=32?"avg":"cold";
    return "avg";
  };

  const cols = [
    {key:"score",label:"Grade vs Mix",tip:isMulti?"Blended + handedness-adjusted grade":"Grade vs this pitch, adjusted for handedness"},
    {key:"ev",label:"EV",tip:"Exit velo vs selected pitch(es), handedness-adjusted"},
    {key:"barrel",label:"Barrel%",tip:"Barrel rate, adjusted for handedness matchup"},
    {key:"flyBall",label:"Fly Ball%",tip:"Fly ball% vs selected pitch(es)"},
    {key:"la",label:"Launch °",tip:"Avg launch angle. 15–35° = HR zone."},
    {key:"pullAir",label:"Pull Air%",tip:"Pull air% vs selected pitch(es)"},
    {key:"chase",label:"Chase Rate",tip:"Chase rate. Adjusted for handedness — opposite-side batters chase less."},
  ];

  const rgbMap = {
    "#ff4020":"255,64,32","#ff6030":"255,96,48","#ff8040":"255,128,64","#ffaa60":"255,170,96",
    "#f5a623":"245,166,35","#e8c020":"232,192,32","#38b8f2":"56,184,242","#60d0ff":"96,208,255","#80b8e8":"128,184,232",
    "#27c97a":"39,201,122","#40e090":"64,224,144","#20a860":"32,168,96","#60d8a0":"96,216,160",
    "#b088e8":"176,136,232","#d080c8":"208,128,200",
  };

  return <div>

    <div className="note">
      ℹ️ Pitcher handedness adjusts every batter's score — LHB vs RHP gets a platoon boost, same-side matchups see a penalty.
      Select multiple pitch types to blend them. Switch hitters automatically get the favorable side.
    </div>

    {/* Team selector */}
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>Select Team</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {MLB_TEAMS.map(t=>
          <button key={t} className={`chip ${selTeam===t?"active":""}`} onClick={()=>setSelTeam(t)}
            style={{fontFamily:"'Oswald',sans-serif",fontWeight:600,letterSpacing:1}}>{t}</button>
        )}
      </div>
    </div>

    {/* Pitcher handedness selector */}
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>
        Pitcher Handedness
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        {["R","L"].map(h => {
          const isActive = pitcherHand === h;
          const col = h==="R" ? "#ff4020" : "#38b8f2";
          return <button key={h} onClick={()=>setPitcherHand(h)}
            style={{padding:"6px 14px",borderRadius:7,fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,letterSpacing:1.5,cursor:"pointer",border:`2px solid ${isActive?col:"var(--border)"}`,background:isActive?`rgba(${h==="R"?"255,64,32":"56,184,242"},.15)`:"var(--surface2)",color:isActive?col:"var(--muted)",transition:"all .15s"}}>
            {h==="R"?"RHP":"LHP"}
          </button>;
        })}
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--muted)",marginLeft:4}}>
          — affects all batter scores via platoon splits
        </span>
      </div>
      {/* Matchup breakdown preview */}
      <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
        {[["L","LHB",pitcherHand],["R","RHB",pitcherHand],["S","Switch",pitcherHand]].map(([hand,label,ph])=>{
          const m=getHandMatchup(hand,ph);
          return <div key={hand} style={{padding:"4px 10px",borderRadius:6,background:"var(--surface2)",border:"1px solid var(--border)",display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:600,fontSize:12,color:"var(--text)"}}>{label}</span>
            <span style={{fontSize:9,fontFamily:"'DM Mono',monospace",fontWeight:600,color:m.cls==="pos"?"var(--green)":m.cls==="neg"?"var(--ice)":"var(--muted)"}}>{m.label}</span>
          </div>;
        })}
      </div>
    </div>

    {/* Pitch type multi-selector */}
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>
        Select Pitch Types — <span style={{color:"var(--accent2)"}}>pick multiple to blend</span>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {Object.entries(PITCH_FAMILIES).map(([family, pitches]) => (
          <div key={family} style={{marginBottom:10}}>
            <div style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1.5,marginBottom:5,paddingLeft:2}}>{family}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {pitches.map(pt => {
                const col=PITCH_COLORS[pt]||"#8899a6", isActive=selPitches.has(pt), rgb=rgbMap[col]||"139,196,232";
                return <button key={pt} onClick={()=>togglePitch(pt)}
                  style={{padding:"5px 12px",borderRadius:7,fontFamily:"'Oswald',sans-serif",fontWeight:600,fontSize:12,letterSpacing:.8,cursor:"pointer",border:`2px solid ${isActive?col:"var(--border)"}`,background:isActive?`rgba(${rgb},.18)`:"var(--surface2)",color:isActive?col:"var(--muted)",transition:"all .15s",position:"relative",whiteSpace:"nowrap"}}>
                  {pt}
                  {isActive&&<span style={{position:"absolute",top:-5,right:-5,width:11,height:11,borderRadius:"50%",background:col,border:"2px solid var(--bg)",fontSize:7,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:900}}>✓</span>}
                </button>;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Active mix context bar */}
    <div style={{background:isMulti?"rgba(245,166,35,.08)":"rgba(56,56,56,.08)",border:`1px solid ${pitchCol}40`,borderRadius:8,padding:"9px 13px",marginBottom:12,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      {selPitchArr.map(pt=>(
        <div key={pt} style={{display:"flex",alignItems:"center",gap:4}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:PITCH_COLORS[pt]||"#8899a6"}}/>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:600,fontSize:12,color:PITCH_COLORS[pt]||"#8899a6",letterSpacing:1}}>{pt}</span>
        </div>
      ))}
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--muted)",marginLeft:4}}>
        {isMulti?`blended avg · `:""}vs <strong style={{color:pitcherHand==="R"?"#ff4020":"#38b8f2"}}>{pitcherHand}HP</strong> · handedness applied · click columns to sort
      </span>
    </div>

    {/* Batter selector */}
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1}}>{selBatters.size} of {roster.length} batters</div>
        <div style={{display:"flex",gap:6}}>
          <button className="chip" onClick={selectAll}>Select All</button>
          <button className="chip" onClick={clearAll}>Clear</button>
        </div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
        {roster.map(p=>{
          const isSel=selBatters.has(p.id);
          const m=getHandMatchup(p.hand,pitcherHand);
          const handCol=m.cls==="pos"?"var(--green)":m.cls==="neg"?"var(--ice)":"var(--muted)";
          return <button key={p.id} onClick={()=>toggleBatter(p.id)}
            style={{padding:"4px 10px",borderRadius:6,fontFamily:"'Oswald',sans-serif",fontWeight:500,fontSize:11,cursor:"pointer",border:`1px solid ${isSel?"var(--accent)":"var(--border)"}`,background:isSel?"rgba(232,65,26,.1)":"var(--surface2)",color:isSel?p.injured?"rgba(232,65,26,.5)":"var(--accent)":p.injured?"var(--muted)":"var(--muted)",transition:"all .15s",display:"flex",alignItems:"center",gap:5,opacity:p.injured?0.5:1}}>
            {p.injured && <span title="On Injured List">🤕</span>}
            {p.name}
            <span style={{fontSize:8,color:handCol,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{p.hand}</span>
          </button>;
        })}
      </div>
    </div>

    {/* Rankings table */}
    {sorted.length===0
      ? <div style={{padding:"28px",textAlign:"center",color:"var(--muted)",fontFamily:"'DM Mono',monospace",fontSize:12}}>Select at least one batter above.</div>
      : <div className="tw"><table style={{width:"100%"}}>
          <thead><tr>
            <th style={{width:26}}>#</th>
            <th>Batter</th>
            <th>Hand / Matchup</th>
            <th>Overall</th>
            {cols.map(c=>
              <th key={c.key} className={sortKey===c.key?"sk":""} onClick={()=>hs(c.key)}>
                <div style={{display:"flex",alignItems:"center",gap:3}}>
                  <Tip text={c.tip}><span style={{color:sortKey===c.key?pitchCol:undefined}}>{c.label}</span></Tip>
                  {sortKey===c.key&&<span style={{color:pitchCol}}>{sortDir<0?"↓":"↑"}</span>}
                </div>
              </th>
            )}
          </tr></thead>
          <tbody>
            {sorted.map((p,i)=>{
              const entry=blendsMap[p.id];
              const pp=entry?.blend, matchup=entry?.matchup;
              if (!pp) return null;
              const pg=pp.grade||{grade:"C",cls:"c",color:"var(--c)"};
              const og=p.grade||{grade:"C",cls:"c",color:"var(--c)"};
              const top3=i<3;
              const rowBg=matchup?.cls==="pos"?"rgba(39,201,122,.04)":matchup?.cls==="neg"?"rgba(56,184,242,.03)":"";
              return <tr key={p.id} style={{background:rowBg}}>
                <td><div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:15,color:top3?pitchCol:"var(--muted)"}}>{i+1}</div></td>
                <td><div className="pc"><PlayerAvatar pid={p.id} name={p.name} size={30} style={{border:"1px solid "+(top3?pitchCol+"50":"var(--border)")}}/><div><div style={{display:"flex",alignItems:"center",gap:3}}><div className="pn">{p.name}</div><InjuryBadge pid={p.pid} name={p.name}/></div><div className="pt">{p.team} · {p.hr} HR</div></div></div></td>
                <td>
                  <div style={{display:"flex",flexDirection:"column",gap:2}}>
                    <div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 7px",borderRadius:5,background:"var(--surface2)",border:"1px solid var(--border)",width:"fit-content"}}>
                      <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11}}>{p.hand==="S"?"S-Hits":p.hand==="L"?"LHB":"RHB"}</span>
                      <span style={{color:"var(--muted)",fontSize:9}}>vs {pitcherHand}HP</span>
                    </div>
                    {matchup&&<span style={{fontSize:9,fontFamily:"'DM Mono',monospace",fontWeight:600,color:matchup.cls==="pos"?"var(--green)":matchup.cls==="neg"?"var(--ice)":"var(--muted)"}}>{matchup.label}</span>}
                  </div>
                </td>
                <td><div style={{display:"flex",alignItems:"center",gap:5}}><GBadge g={og}/><span style={{fontSize:9,color:og.color,fontFamily:"'DM Mono',monospace"}}>{og.label}</span></div></td>
                {/* Grade vs mix */}
                <td><div style={{display:"flex",alignItems:"center",gap:5}}><GBadge g={pg}/><div style={{flex:1,minWidth:44}}><div style={{height:4,borderRadius:2,background:"var(--border)",overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,width:`${pp.score}%`,background:pitchCol}}/></div><div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:pitchCol,marginTop:1}}>{pp.score}</div></div></div></td>
                <td><span className={`sv ${metricClass("ev",pp.ev)}`}>{pp.ev.toFixed(1)}</span><div style={{width:40,height:3,borderRadius:2,background:"var(--border)",overflow:"hidden",marginTop:2}}><div style={{height:"100%",borderRadius:2,width:`${Math.min((pp.ev/112)*100,100)}%`,background:pp.ev>=T.EV_EL?"#ff3010":pp.ev>=T.EV_HH?"#ff8020":"#5a7080"}}/></div></td>
                <td><span className={`sv ${metricClass("barrel",pp.barrel)}`}>{pp.barrel.toFixed(1)}%</span><div style={{width:40,height:3,borderRadius:2,background:"var(--border)",overflow:"hidden",marginTop:2}}><div style={{height:"100%",borderRadius:2,width:`${Math.min(pp.barrel/25*100,100)}%`,background:pp.barrel>=T.BAR_EL?"#ff8020":"#5a7080"}}/></div></td>
                <td><span className={`sv ${metricClass("flyBall",pp.flyBall)}`}>{pp.flyBall.toFixed(1)}%</span><div style={{width:40,height:3,borderRadius:2,background:"var(--border)",overflow:"hidden",marginTop:2}}><div style={{height:"100%",borderRadius:2,width:`${Math.min(pp.flyBall/50*100,100)}%`,background:pp.flyBall>=42?"#ff8020":"#5a7080"}}/></div></td>
                <td><span className={`sv ${metricClass("la",pp.la)}`}>{pp.la.toFixed(1)}°</span>{inHRZ(pp.la)&&<div style={{fontSize:8,color:"var(--green)",fontFamily:"'DM Mono',monospace",marginTop:1}}>✓ HR Zone</div>}</td>
                <td><span className={`sv ${metricClass("pullAir",pp.pullAir)}`}>{pp.pullAir.toFixed(1)}%</span><div style={{width:40,height:3,borderRadius:2,background:"var(--border)",overflow:"hidden",marginTop:2}}><div style={{height:"100%",borderRadius:2,width:`${Math.min(pp.pullAir/32*100,100)}%`,background:pp.pullAir>=22?"#ff8020":"#5a7080"}}/></div></td>
                <td><span className={`sv ${metricClass("chase",pp.chase)}`}>{pp.chase.toFixed(1)}%</span><div style={{width:40,height:3,borderRadius:2,background:"var(--border)",overflow:"hidden",marginTop:2}}><div style={{height:"100%",borderRadius:2,width:`${Math.min(pp.chase/50*100,100)}%`,background:pp.chase>=35?"#38b8f2":pp.chase>=27?"#5a7080":"#27c97a"}}/></div></td>
              </tr>;
            })}
          </tbody>
        </table></div>
    }
  </div>;
}

// APP ROOT
// ── HR TICKER + TRACKER ──────────────────────────────────────
// Global HR data — shared between ticker and tracker tab
let HR_DATA = [];
const VIDEO_LINK_CACHE = {}; // gamePk_atBatIndex → savant video URL


// ── GAMEDAY TAB ──────────────────────────────────────────────────────────────
function GamedayTab() {
  const etToday = () => {
    const s = new Date().toLocaleDateString('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
    const [m,d,y] = s.split('/');
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  };
  const [selDate,   setSelDate]   = useState(etToday);
  const [games,     setGames]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selGamePk, setSelGamePk] = useState(null);
  const [liveDataMap, setLiveDataMap] = useState({});   // gamePk → boxscore data
  const [liveLoad,  setLiveLoad]  = useState(false);
  const live = liveDataMap[selGamePk] || null;              // derived — detail panel
  const [boxTab,    setBoxTab]    = useState('batting'); // 'batting'|'pitching'|'plays'
  const [plays,     setPlays]     = useState([]);
  const [playsLoad, setPlaysLoad] = useState(false);
  const [expandedPlayIdx, setExpandedPlayIdx] = useState(null);
  const [expandedBatterId, setExpandedBatterId] = useState(null);
  const [notes,     setNotes]     = useState({});    // {away:[...], home:[...]} batting/baserunning info
  const pollRef  = useRef(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // ── Fetch schedule ──────────────────────────────────────────────────────────
  const loadSchedule = useCallback(async (date) => {
    setLoading(true); setGames([]);
    try {
      const r = await fetch(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}` +
        `&hydrate=probablePitcher,linescore,decisions,team&gameType=R`
      );
      const d = await r.json();
      setGames(d.dates?.[0]?.games || []);
    } catch(e) { setGames([]); }
    setLoading(false);
  }, []);

  useEffect(() => { loadSchedule(selDate); }, [selDate]);

  // Auto-fetch live data for all live games when schedule loads
  useEffect(() => { if (games.length) loadAllLive(games); }, [games]);

  // ── Fetch box score for one game → writes to liveDataMap ──────────────────
  const loadLive = useCallback(async (pk, showSpinner=true) => {
    if (!pk) return;
    if (showSpinner) setLiveLoad(true);
    try {
      const r = await fetch(`/api/boxscore?gamePk=${pk}`);
      const d = await r.json();
      setLiveDataMap(prev => ({...prev, [pk]: d}));
    } catch(e) {}
    if (showSpinner) setLiveLoad(false);
  }, []);

  // ── Batch-fetch all currently-live games (silently) ─────────────────────────
  const loadAllLive = useCallback(async (gameList) => {
    const liveGames = (gameList || []).filter(g => g.status?.abstractGameState === 'Live');
    if (!liveGames.length) return;
    await Promise.allSettled(liveGames.map(async g => {
      try {
        const r = await fetch(`/api/boxscore?gamePk=${g.gamePk}`);
        const d = await r.json();
        setLiveDataMap(prev => ({...prev, [g.gamePk]: d}));
      } catch(e) {}
    }));
  }, []);

  // ── Fetch play-by-play from live feed ───────────────────────────────────────
  const loadPlays = useCallback(async (pk) => {
    if (!pk) return;
    setPlaysLoad(true);
    try {
      // playByPlay endpoint reliably returns playEvents with full pitch data
      const r = await fetch(`https://statsapi.mlb.com/api/v1/game/${pk}/playByPlay`);
      const d = await r.json();
      const all = d.allPlays || [];
      setPlays([...all].filter(p => p.about?.isComplete).reverse());
    } catch(e) { setPlays([]); }
    setPlaysLoad(false);
  }, []);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!selGamePk) { setPlays([]); setNotes({}); return; }
    loadLive(selGamePk, true);
    loadPlays(selGamePk);
    loadNotes(selGamePk);
    const g = games.find(x => x.gamePk === selGamePk);
    if (g?.status?.abstractGameState === 'Live') {
      pollRef.current = setInterval(() => {
        loadAllLive(games);   // refresh all live cards
        loadPlays(selGamePk);
        loadNotes(selGamePk);
      }, 20000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selGamePk]);

  // Switch to plays tab fetches fresh
  useEffect(() => {
    if (boxTab === 'plays' && selGamePk && plays.length === 0) loadPlays(selGamePk);
  }, [boxTab]);

  // ── Fetch batting notes (2B/3B/HR/SB/LOB etc.) from boxscore info array ──────
  const loadNotes = useCallback(async (pk) => {
    if (!pk) return;
    try {
      const r = await fetch(`https://statsapi.mlb.com/api/v1/game/${pk}/boxscore`);
      const d = await r.json();
      setNotes({
        away: d.teams?.away?.info || [],
        home: d.teams?.home?.info || [],
      });
    } catch(e) { setNotes({}); }
  }, []);

  // ── Date strip ──────────────────────────────────────────────────────────────
  const dateStrip = useMemo(() => {
    const arr = [];
    for (let i = -3; i <= 3; i++) {
      const dt = new Date(selDate + 'T12:00:00Z');
      dt.setUTCDate(dt.getUTCDate() + i);
      const iso  = dt.toISOString().slice(0,10);
      const dow  = dt.toLocaleDateString('en-US',{weekday:'short',timeZone:'UTC'}).toUpperCase();
      const mday = dt.toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).toUpperCase();
      arr.push({ iso, dow, mday, isSelected: i === 0, isToday: iso === etToday() });
    }
    return arr;
  }, [selDate]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const gameStatus = (g, lsOverride) => {
    const abs = g.status?.abstractGameState || '';
    const det = g.status?.detailedState     || '';
    const ls  = lsOverride || g.linescore || {};
    if (abs === 'Final') {
      const extra = ls.currentInning > 9 ? `/F${ls.currentInning}` : '';
      return { label: `FINAL${extra}`, color: 'var(--muted)', dot: false };
    }
    if (abs === 'Live') {
      const half = ls.inningHalf === 'Top' ? '▲' : '▼';
      return { label: `${half}${ls.currentInning || ''}`, color: '#27c97a', dot: true };
    }
    if (det === 'Warmup' || det === 'Pre-Game') return { label: 'WARMUP', color: '#f5a623', dot: true };
    if (det === 'Postponed')  return { label: 'PPD',  color: 'var(--muted)', dot: false };
    if (det === 'Cancelled')  return { label: 'CNCL', color: 'var(--muted)', dot: false };
    const gt = g.gameDate
      ? new Date(g.gameDate).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'})
      : '—';
    return { label: gt, color: 'var(--muted)', dot: false };
  };

  const rhe = (g, side) => {
    const ls  = g.linescore?.teams?.[side];
    const abs = g.status?.abstractGameState;
    if (!ls || abs === 'Preview') return { r:'—', h:'—', e:'—' };
    return { r: ls.runs ?? '—', h: ls.hits ?? '—', e: ls.errors ?? '—' };
  };

  const selGame = games.find(g => g.gamePk === selGamePk) || null;
  const isLive  = selGame?.status?.abstractGameState === 'Live';

  const innings = live?.linescore?.innings || selGame?.linescore?.innings || [];
  const lsTeams = live?.linescore?.teams   || selGame?.linescore?.teams   || {};
  const lsOuts  = live?.linescore?.outs    ?? live?.liveLinescore?.outs   ?? null;
  const offense = live?.liveLinescore?.offense || live?.linescore?.offense || {};
  const curBatId  = live?.currentBatterId || null;
  const onDeckId  = live?.onDeckId        || null;
  const inHoleId  = live?.inTheHoleId     || null;
  const runners   = { first: !!offense.first, second: !!offense.second, third: !!offense.third };
  const lastPlay  = live?.lastPlay        || null;

  const pname = (id) => {
    if (!id || !live?.teams) return '—';
    for (const s of ['away','home']) {
      const p = live.teams[s]?.players?.[`ID${id}`];
      if (p) return p.person?.fullName || '—';
    }
    return '—';
  };

  const boxRows = (side) => {
    const team = live?.teams?.[side];
    if (!team) return [];
    return (team.batters || []).map(bid => {
      const p = team.players?.[`ID${bid}`]; if (!p) return null;
      const bo = p.battingOrder; const s = p.stats?.batting || {};
      return { id:bid, name:p.person?.fullName||'—', pos:p.position?.abbreviation||'',
        slot: bo && bo%100===0 ? Math.floor(bo/100) : null, sub: bo && bo%100!==0,
        ab:s.atBats??'—',r:s.runs??'—',h:s.hits??'—',rbi:s.rbi??'—',
        bb:s.baseOnBalls??'—',k:s.strikeOuts??'—',
        avg:p.seasonStats?.batting?.avg||'—', ops:p.seasonStats?.batting?.ops||'—' };
    }).filter(Boolean);
  };

  const pitchRows = (side) => {
    const team = live?.teams?.[side];
    if (!team) return [];
    return (team.pitchers || []).map(pid => {
      const p = team.players?.[`ID${pid}`]; if (!p) return null;
      const s = p.stats?.pitching || {};
      return { id:pid, name:p.person?.fullName||'—',
        ip:s.inningsPitched??'—',h:s.hits??'—',r:s.runs??'—',er:s.earnedRuns??'—',
        bb:s.baseOnBalls??'—',k:s.strikeOuts??'—',hr:s.homeRuns??'—',
        era:p.seasonStats?.pitching?.era||'—' };
    }).filter(Boolean);
  };

  // Play event color
  const evColor = (ev='') => {
    const e = ev.toLowerCase();
    if (e.includes('home run'))  return '#f5a623';
    if (e.includes('single') || e.includes('double') || e.includes('triple')) return '#27c97a';
    if (e.includes('strikeout')) return 'var(--accent)';
    if (e.includes('walk') || e.includes('hit by')) return 'var(--ice)';
    return 'var(--muted)';
  };

  // ── Shared styles ────────────────────────────────────────────────────────────
  const mono = "'DM Mono',monospace";
  const osw  = "'Oswald',sans-serif";
  const cell = { padding:'5px 8px', fontFamily:mono, fontSize:11, borderBottom:'1px solid rgba(30,45,58,.5)', verticalAlign:'middle' };
  const thSt = { padding:'5px 8px', fontFamily:mono, fontSize:9, fontWeight:600, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)', borderBottom:'2px solid var(--border)', background:'var(--surface2)', whiteSpace:'nowrap' };

  // ── Date strip (shared for both mobile views) ────────────────────────────────
  const DateStrip = () => (
    <div style={{display:'flex',alignItems:'center',gap:0,overflowX:'auto',
      borderBottom:'2px solid var(--border)',background:'var(--surface)',
      position:'sticky',top:0,zIndex:10}}>
      <button onClick={() => { setSelDate(d => { const dt=new Date(d+'T12:00:00Z'); dt.setUTCDate(dt.getUTCDate()-1); return dt.toISOString().slice(0,10); }); setSelGamePk(null); }}
        style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',padding:'10px 8px',fontSize:16,flexShrink:0}}>‹</button>
      {dateStrip.map(d => (
        <button key={d.iso} onClick={() => { setSelDate(d.iso); setSelGamePk(null); }}
          style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 10px',
            border:'none',background:'none',cursor:'pointer',
            borderBottom:`2px solid ${d.isSelected?'var(--accent)':'transparent'}`,
            color: d.isSelected ? 'var(--text)' : 'var(--muted)', minWidth:50, flexShrink:0, gap:1}}>
          <span style={{fontFamily:mono,fontSize:9,fontWeight:600,letterSpacing:.5}}>{d.dow}</span>
          <span style={{fontFamily:osw,fontSize:11,fontWeight:d.isToday?700:400,color:d.isToday&&!d.isSelected?'var(--accent2)':undefined}}>{d.mday}</span>
        </button>
      ))}
      <button onClick={() => { setSelDate(d => { const dt=new Date(d+'T12:00:00Z'); dt.setUTCDate(dt.getUTCDate()+1); return dt.toISOString().slice(0,10); }); setSelGamePk(null); }}
        style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',padding:'10px 8px',fontSize:16,flexShrink:0}}>›</button>
      <button onClick={() => { setSelDate(etToday()); setSelGamePk(null); }}
        style={{marginLeft:'auto',padding:'4px 9px',borderRadius:5,border:'1px solid var(--border)',
          background:'var(--surface2)',color:'var(--muted)',fontFamily:mono,fontSize:9,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,marginRight:6}}>
        Today
      </button>
    </div>
  );

  // ── Game detail panel (shared between mobile full-screen and desktop split) ──
  const DetailPanel = () => (
    <div style={{padding: isMobile ? '12px 14px' : '16px 20px', overflowY: isMobile ? undefined : 'auto', flex:1, minWidth:0}}>
      {/* Mobile back button */}
      {isMobile && (
        <button onClick={() => setSelGamePk(null)}
          style={{display:'flex',alignItems:'center',gap:6,marginBottom:12,padding:'6px 12px',
            borderRadius:7,border:'1px solid var(--border)',background:'var(--surface2)',
            color:'var(--muted)',fontFamily:mono,fontSize:10,cursor:'pointer'}}>
          ← Back to Games
        </button>
      )}

      {liveLoad && !live ? (
        <div style={{display:'flex',alignItems:'center',gap:8,padding:24,color:'var(--muted)',fontFamily:mono,fontSize:11}}>
          <div className="sp"/>Loading game data…
        </div>
      ) : live ? <>

        {/* Game header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontFamily:osw,fontWeight:700,fontSize:20}}>{selGame.teams?.away?.team?.abbreviation}</span>
            <span style={{fontFamily:osw,fontWeight:800,fontSize:26}}>{selGame.teams?.away?.score ?? '—'}</span>
            <span style={{fontFamily:mono,fontSize:10,color:'var(--muted)'}}>—</span>
            <span style={{fontFamily:osw,fontWeight:800,fontSize:26}}>{selGame.teams?.home?.score ?? '—'}</span>
            <span style={{fontFamily:osw,fontWeight:700,fontSize:20}}>{selGame.teams?.home?.team?.abbreviation}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {(() => { const st=gameStatus(selGame, live?.linescore || live?.liveLinescore); return <>
              {st.dot && <div style={{width:7,height:7,borderRadius:'50%',background:st.color,animation:'pulse 1s infinite'}}/>}
              <span style={{fontFamily:mono,fontSize:10,fontWeight:700,color:st.color}}>{st.label}</span>
            </>; })()}
            {liveLoad && <div className="sp" style={{width:14,height:14,borderWidth:2}}/>}
          </div>
        </div>

        {/* Linescore */}
        {innings.length > 0 && (
          <div style={{overflowX:'auto',marginBottom:14}}>
            <table style={{borderCollapse:'separate',borderSpacing:0,border:'1px solid var(--border)',borderRadius:8,overflow:'hidden',width:'100%'}}>
              <thead><tr>
                <th style={{...thSt,textAlign:'left',minWidth:36}}>Team</th>
                {innings.map((_,i) => <th key={i} style={{...thSt,textAlign:'center',minWidth:22}}>{i+1}</th>)}
                {innings.length < 9 && Array.from({length:9-innings.length},(_,i) =>
                  <th key={`e${i}`} style={{...thSt,textAlign:'center',minWidth:22,opacity:.3}}>{innings.length+i+1}</th>
                )}
                <th style={{...thSt,textAlign:'center',minWidth:26,borderLeft:'2px solid var(--border)'}}>R</th>
                <th style={{...thSt,textAlign:'center',minWidth:22}}>H</th>
                <th style={{...thSt,textAlign:'center',minWidth:22}}>E</th>
              </tr></thead>
              <tbody>
                {['away','home'].map(side => (
                  <tr key={side}>
                    <td style={{...cell,fontFamily:osw,fontWeight:700,fontSize:12}}>{selGame.teams?.[side]?.team?.abbreviation}</td>
                    {innings.map((inn,i) => {
                      const v = inn[side]?.runs;
                      return <td key={i} style={{...cell,textAlign:'center',color:v>0?'var(--text)':'var(--muted)',fontSize:11}}>{v ?? (isLive && i===innings.length-1 ? '—' : '—')}</td>;
                    })}
                    {innings.length < 9 && Array.from({length:9-innings.length},(_,i) =>
                      <td key={`e${i}`} style={{...cell,textAlign:'center',color:'rgba(255,255,255,.12)'}}>—</td>
                    )}
                    <td style={{...cell,textAlign:'center',fontFamily:osw,fontWeight:700,fontSize:13,borderLeft:'2px solid var(--border)'}}>{lsTeams?.[side]?.runs ?? '—'}</td>
                    <td style={{...cell,textAlign:'center'}}>{lsTeams?.[side]?.hits ?? '—'}</td>
                    <td style={{...cell,textAlign:'center',color:(lsTeams?.[side]?.errors??0)>0?'var(--accent)':undefined}}>{lsTeams?.[side]?.errors ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Live at-bat panel */}
        {isLive && (curBatId || onDeckId) && (
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:9,padding:'12px 14px',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:14,flexWrap:'wrap'}}>
              {/* Bases + Outs */}
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                <div style={{position:'relative',width:50,height:50}}>
                  {[
                    {key:'second',top:0,     left:'50%', transform:'translate(-50%,0) rotate(45deg)'},
                    {key:'third', top:'50%', left:0,     transform:'translate(0,-50%) rotate(45deg)'},
                    {key:'first', top:'50%', right:0,    transform:'translate(0,-50%) rotate(45deg)'},
                  ].map(b => (
                    <div key={b.key} style={{position:'absolute',width:13,height:13,borderRadius:2,
                      background: runners[b.key] ? '#f5a623' : 'var(--surface2)',
                      border:`1.5px solid ${runners[b.key] ? '#f5a623' : 'var(--border)'}`,
                      top:b.top,left:b.left,right:b.right,transform:b.transform}}/>
                  ))}
                </div>
                <div style={{display:'flex',gap:4}}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{width:8,height:8,borderRadius:'50%',
                      background: i<(lsOuts??0)?'#f5a623':'var(--surface2)',
                      border:`1.5px solid ${i<(lsOuts??0)?'#f5a623':'var(--border)'}`}}/>
                  ))}
                </div>
                <span style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>{lsOuts??0} out{(lsOuts??0)!==1?'s':''}</span>
              </div>
              {/* Batter / On Deck / In Hole */}
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:5}}>
                {curBatId && <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontFamily:mono,fontSize:8,color:'var(--accent)',fontWeight:700,minWidth:46,textTransform:'uppercase'}}>At Bat</span>
                  <span style={{fontFamily:osw,fontWeight:700,fontSize:14}}>{pname(curBatId)}</span>
                </div>}
                {onDeckId && <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontFamily:mono,fontSize:8,color:'var(--muted)',minWidth:46,textTransform:'uppercase'}}>On Deck</span>
                  <span style={{fontFamily:osw,fontSize:12,color:'var(--muted)'}}>{pname(onDeckId)}</span>
                </div>}
                {inHoleId && <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontFamily:mono,fontSize:8,color:'rgba(255,255,255,.25)',minWidth:46,textTransform:'uppercase'}}>In Hole</span>
                  <span style={{fontFamily:osw,fontSize:11,color:'rgba(255,255,255,.3)'}}>{pname(inHoleId)}</span>
                </div>}
                {lastPlay?.description && (
                  <div style={{marginTop:4,paddingTop:6,borderTop:'1px solid rgba(255,255,255,.06)'}}>
                    <span style={{fontFamily:mono,fontSize:9,color:'var(--muted)'}}>{lastPlay.description}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Box score / Plays tabs */}
        <div style={{display:'flex',gap:4,marginBottom:10}}>
          {[['batting','🧢 Batting'],['pitching','⚾ Pitching'],['plays','📋 Plays']].map(([k,l]) => (
            <button key={k} onClick={() => setBoxTab(k)}
              style={{padding:'4px 11px',borderRadius:6,border:'none',cursor:'pointer',
                fontFamily:mono,fontSize:10,fontWeight:boxTab===k?700:400,
                background: boxTab===k?'var(--accent)':'var(--surface2)',
                color: boxTab===k?'white':'var(--muted)'}}>
              {l}
            </button>
          ))}
        </div>

        {/* Plays tab */}
        {boxTab === 'plays' && (() => {
          // ── PitchZone SVG (defined once, used in detail panel) ──────────────
          const pitchCol = code => {
            if (!code) return 'var(--muted)';
            if ('BI*V'.includes(code)) return '#27c97a';
            if (code === 'X')          return '#38b8f2';
            if ('CF'.includes(code))   return '#f5a623';
            return '#ff4020';
          };
          const PitchZone = ({ pitches, szTop=3.5, szBot=1.5 }) => {
            const W=100, H=120;
            const mx = px => ((px+1.6)/3.2)*W;
            const my = pz => ((5.0-pz)/4.5)*H;
            const [szL,szR,szT,szB] = [mx(-0.83),mx(0.83),my(szTop),my(szBot)];
            const [szW,szH] = [szR-szL, szB-szT];
            return (
              <svg viewBox={`0 0 ${W} ${H}`} width={100} height={120}
                style={{background:'#101820',borderRadius:5,border:'1px solid var(--border)',flexShrink:0}}>
                <rect x={szL} y={szT} width={szW} height={szH} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={1.5}/>
                {[1,2].flatMap(n=>[
                  <line key={`v${n}`} x1={szL+szW*n/3} y1={szT} x2={szL+szW*n/3} y2={szB} stroke="rgba(255,255,255,.15)" strokeWidth={.5}/>,
                  <line key={`h${n}`} x1={szL} y1={szT+szH*n/3} x2={szR} y2={szT+szH*n/3} stroke="rgba(255,255,255,.15)" strokeWidth={.5}/>
                ])}
                {pitches.map((p,i) => p.pX==null||p.pZ==null ? null : (
                  <g key={i}>
                    <circle cx={mx(p.pX)} cy={my(p.pZ)} r={9} fill={pitchCol(p.code)} opacity={.9}/>
                    <text x={mx(p.pX)} y={my(p.pZ)+3.5} textAnchor="middle"
                      fontSize={8} fill="white" fontWeight="bold" fontFamily="monospace">{p.num}</text>
                  </g>
                ))}
              </svg>
            );
          };

          const selPl = expandedPlayIdx !== null ? plays[expandedPlayIdx] : null;
          const selPitches = selPl
            ? (selPl.playEvents||[]).filter(e=>e.isPitch||e.type==='pitch').map((e,j)=>({
                num:  e.pitchNumber||j+1,
                code: e.details?.code||'',
                pX:   e.pitchData?.coordinates?.pX??null,
                pZ:   e.pitchData?.coordinates?.pZ??null,
                desc: e.details?.description||'',
                type: e.details?.type?.description||'',
                velo: e.pitchData?.startSpeed??null,
                szTop:e.pitchData?.strikeZoneTop??3.5,
                szBot:e.pitchData?.strikeZoneBottom??1.5,
              }))
            : [];
          const selHit = selPl
            ? (selPl.playEvents||[]).slice().reverse().find(e=>e.hitData?.launchSpeed)?.hitData
            : null;

          return (
            <div>
              {playsLoad ? (
                <div style={{display:'flex',alignItems:'center',gap:8,padding:16,color:'var(--muted)',fontFamily:mono,fontSize:11}}>
                  <div className="sp"/>Loading plays…
                </div>
              ) : plays.length === 0 ? (
                <div style={{padding:16,color:'var(--muted)',fontFamily:mono,fontSize:10}}>No plays yet</div>
              ) : (
                <div>
                  {/* ── Compact scrollable play list ── */}
                  <div style={{maxHeight:'38vh',overflowY:'auto',display:'flex',flexDirection:'column',gap:3,marginBottom:10}}>
                    {plays.map((pl, i) => {
                      const ev   = pl.result?.event || '';
                      const inn  = pl.about?.inning || '';
                      const half = pl.about?.halfInning === 'top' ? '▲' : '▼';
                      const batter = pl.matchup?.batter?.fullName || '';
                      const rbi  = pl.result?.rbi || 0;
                      const col  = evColor(ev);
                      const nPitches = (pl.playEvents||[]).filter(e=>e.isPitch||e.type==='pitch').length;
                      const isSel = expandedPlayIdx === i;
                      return (
                        <div key={i}
                          onClick={() => setExpandedPlayIdx(isSel ? null : i)}
                          style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',
                            borderRadius:6,cursor:'pointer',
                            background: isSel ? 'rgba(255,255,255,.05)' : 'var(--surface)',
                            border:`1px solid ${isSel ? col+'70' : 'var(--border)'}`,
                            borderLeft:`3px solid ${col}`}}>
                          <span style={{fontFamily:mono,fontSize:8,color:'var(--muted)',minWidth:24,flexShrink:0}}>{half}{inn}</span>
                          <span style={{fontFamily:mono,fontSize:9,fontWeight:700,color:col,
                            padding:'0 5px',borderRadius:3,background:`${col}15`,border:`1px solid ${col}35`,flexShrink:0}}>
                            {ev||'—'}
                          </span>
                          <span style={{fontFamily:osw,fontSize:11,fontWeight:600,flex:1,
                            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{batter}</span>
                          {rbi>0 && <span style={{fontFamily:mono,fontSize:8,color:'var(--accent2)',flexShrink:0}}>{rbi}R</span>}
                          {nPitches>0 && <span style={{fontFamily:mono,fontSize:7,color:'rgba(255,255,255,.2)',flexShrink:0}}>{nPitches}p</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Selected play detail panel ── */}
                  {selPl && (
                    <div style={{background:'var(--surface)',border:'1px solid var(--border)',
                      borderRadius:9,padding:'12px 14px'}}>
                      {/* Header */}
                      <div style={{marginBottom:10}}>
                        <div style={{fontFamily:osw,fontWeight:700,fontSize:14,marginBottom:2}}>
                          {selPl.matchup?.batter?.fullName||'—'}
                        </div>
                        <div style={{fontFamily:mono,fontSize:9,color:'var(--muted)'}}>
                          {selPl.result?.description||''}
                        </div>
                        {selPl.matchup?.pitcher?.fullName &&
                          <div style={{fontFamily:mono,fontSize:8,color:'rgba(255,255,255,.3)',marginTop:2}}>
                            vs {selPl.matchup.pitcher.fullName}
                          </div>}
                      </div>

                      {/* Pitch zone + sequence */}
                      {selPitches.length > 0 && (
                        <div style={{display:'flex',gap:12,alignItems:'flex-start',flexWrap:'wrap',marginBottom:10}}>
                          <PitchZone pitches={selPitches}
                            szTop={selPitches[0]?.szTop} szBot={selPitches[0]?.szBot}/>
                          <div style={{flex:1,minWidth:130,display:'flex',flexDirection:'column',gap:5}}>
                            {[...selPitches].reverse().map((p,j) => (
                              <div key={j} style={{display:'flex',alignItems:'center',gap:8}}>
                                <div style={{width:18,height:18,borderRadius:'50%',
                                  background:pitchCol(p.code),flexShrink:0,
                                  display:'flex',alignItems:'center',justifyContent:'center',
                                  fontSize:9,fontWeight:700,fontFamily:mono,color:'white'}}>
                                  {p.num}
                                </div>
                                <div>
                                  <div style={{fontFamily:osw,fontSize:11,fontWeight:600}}>{p.desc}</div>
                                  <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>
                                    {p.type}{p.type&&p.velo?' · ':''}{p.velo?`${p.velo.toFixed(1)} mph`:''}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hit data */}
                      {selHit && (selHit.launchSpeed||selHit.launchAngle||selHit.totalDistance) && (
                        <div style={{display:'flex',gap:16,paddingTop:8,
                          borderTop:'1px solid rgba(255,255,255,.06)',flexWrap:'wrap'}}>
                          {selHit.launchSpeed    && <div><div style={{fontFamily:osw,fontWeight:700,fontSize:13}}>{selHit.launchSpeed.toFixed(1)} mph</div><div style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>Exit Velo</div></div>}
                          {selHit.launchAngle!=null && <div><div style={{fontFamily:osw,fontWeight:700,fontSize:13}}>{selHit.launchAngle.toFixed(0)}°</div><div style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>Launch Angle</div></div>}
                          {selHit.totalDistance  && <div><div style={{fontFamily:osw,fontWeight:700,fontSize:13}}>{selHit.totalDistance} ft</div><div style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>Distance</div></div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Batting / Pitching box score */}
        {/* Batting / Pitching box score */}
        {(boxTab === 'batting' || boxTab === 'pitching') && ['away','home'].map(side => {
          const teamAbbr = selGame?.teams?.[side]?.team?.abbreviation || side.toUpperCase();
          const rows = boxTab === 'batting' ? boxRows(side) : pitchRows(side);
          if (!rows.length) return null;
          return (
            <div key={side} style={{marginBottom:18}}>
              <div style={{fontFamily:osw,fontWeight:700,fontSize:13,color:'var(--accent2)',marginBottom:6}}>{teamAbbr}</div>
              <div style={{overflowX:'auto',border:'1px solid var(--border)',borderRadius:8}}>
                <table style={{borderCollapse:'separate',borderSpacing:0,width:'100%'}}>
                  <thead>
                    {boxTab === 'batting'
                      ? <tr><th style={{...thSt,textAlign:'left',minWidth:130}}>Batter</th><th style={thSt}>AB</th><th style={thSt}>R</th><th style={thSt}>H</th><th style={thSt}>RBI</th><th style={thSt}>BB</th><th style={thSt}>K</th><th style={thSt}>AVG</th><th style={thSt}>OPS</th></tr>
                      : <tr><th style={{...thSt,textAlign:'left',minWidth:130}}>Pitcher</th><th style={thSt}>IP</th><th style={thSt}>H</th><th style={thSt}>R</th><th style={thSt}>ER</th><th style={thSt}>BB</th><th style={thSt}>K</th><th style={thSt}>HR</th><th style={thSt}>ERA</th></tr>}
                  </thead>
                  <tbody>
                    {boxTab === 'batting'
                      ? rows.map(r => {
                        // Enrich from DAILY_PICKS_CACHE + HR_DATA
                        const dp        = DAILY_PICKS_CACHE[String(r.id)] || null;
                        const gc        = dp?.grade ? (GRADE_CFG[dp.grade] || null) : null;
                        const goneYard  = HR_DATA.some(h => h.batterId === r.id ||
                          (r.name && h.batterName && h.batterName.toLowerCase() === r.name.toLowerCase()));
                        const isDiamond = dp?.is_diamond === 'True' || dp?.is_diamond === true;
                        const isDue     = dp ? isDueFromRow(dp, r.id) : false;
                        const isHot     = isHotBatPlayer(dp || getCachedPlayer(r.id));
                        const cp        = getCachedPlayer(r.id) || {};
                        const nameColor = r.id===curBatId ? 'var(--accent)' : gc?.color || (r.sub?'var(--muted)':undefined);
                        const isBatExp = expandedBatterId === r.id;
                        return (
                          <React.Fragment key={r.id}>
                          <tr onClick={(e)=>{if(!e.defaultPrevented)setExpandedBatterId(v=>v===r.id?null:r.id);}}
                            style={{background: isBatExp?'rgba(255,255,255,.05)': r.id===curBatId ? 'rgba(232,65,26,.08)' : undefined,
                              cursor:'pointer', borderLeft:isBatExp?'3px solid var(--accent)':'3px solid transparent'}}>
                            <td style={{...cell,textAlign:'left',minWidth:140}}>
                              <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                                {/* Slot # */}
                                {r.slot && <span style={{fontFamily:mono,fontSize:9,color:'rgba(255,255,255,.3)',flexShrink:0,minWidth:10}}>{r.slot}</span>}
                                {/* Name — grade-colored, clickable opens AtBat slideout */}
                                <span style={{fontFamily:osw,fontSize:11,fontWeight:r.id===curBatId?700:600,
                                  color:nameColor,cursor:'pointer',flex:1}}
                                  onClick={e=>{e.preventDefault();e.stopPropagation();openAtBatSlide({pid:r.id,name:r.name,team:teamAbbr,
                                    avgEV:cp.avgEV,barrel:cp.barrel,hardHit:cp.hardHit,flyBall:cp.flyBall,
                                    hr:cp.hr,avg:cp.avg,obp:cp.obp,slg:cp.slg,xwoba:cp.xwoba,
                                    kPct:cp.kPct,bbPct:cp.bbPct,launchAngle:cp.launchAngle});}}>
                                  {r.name}
                                </span>
                                {/* Pos */}
                                <span style={{fontFamily:mono,fontSize:8,color:'rgba(255,255,255,.25)',flexShrink:0}}>{r.pos}</span>
                                {/* Grade badge */}
                                {gc && <span style={{padding:'0px 5px',borderRadius:4,fontSize:8,fontWeight:800,
                                  background:gc.bg,color:gc.color,border:`1px solid ${gc.border}`,flexShrink:0}}>
                                  {dp.grade}
                                </span>}
                                {/* Stickers */}
                                {goneYard  && <span title="Gone Yard today" style={{fontSize:10,flexShrink:0}}>💥</span>}
                                {isDiamond && <span title="Diamond — Tier 1 Lock" style={{fontSize:10,flexShrink:0}}>💎</span>}
                                {isDue     && <span title="Due — AB since last HR exceeds normal rate" style={{fontSize:10,flexShrink:0}}>⏳</span>}
                                {isHot     && <span title="Hot Bat — 3+ HRs in last 7 days" style={{fontSize:10,flexShrink:0}}>🔥</span>}
                                <InjuryBadge pid={r.id} name={r.name}/>
                                {/* Arrow — opens AtBat slideout */}
                                <span style={{fontSize:9,color:'var(--ice)',opacity:.5,cursor:'pointer',flexShrink:0}}
                                  onClick={e=>{e.stopPropagation();openAtBatSlide({pid:r.id,name:r.name,team:teamAbbr,
                                    avgEV:cp.avgEV,barrel:cp.barrel,hardHit:cp.hardHit,flyBall:cp.flyBall,
                                    hr:cp.hr,avg:cp.avg,obp:cp.obp,slg:cp.slg,xwoba:cp.xwoba,
                                    kPct:cp.kPct,bbPct:cp.bbPct,launchAngle:cp.launchAngle});}}>›</span>
                              </div>
                            </td>
                            {[r.ab,r.r,r.h,r.rbi,r.bb,r.k,r.avg,r.ops].map((v,j) => (
                              <td key={j} style={{...cell,textAlign:'center',
                                color:j===2&&v>0?'#27c97a':j===3&&v>0?'var(--accent2)':undefined}}>{v}</td>
                            ))}
                          </tr>
                          {isBatExp && (
                            <tr><td colSpan={9} style={{padding:0,background:'rgba(232,65,26,.03)',borderBottom:'1px solid var(--border)'}}>
                              <div style={{padding:'4px 12px 12px'}}>
                                <LiveBatterBox batterId={r.id} gamePk={selGamePk}/>
                              </div>
                            </td></tr>
                          )}
                          </React.Fragment>
                        );
                      })
                      : rows.map(r => (
                        <tr key={r.id}>
                          <td style={{...cell,textAlign:'left'}}>
                            <div style={{display:'flex',alignItems:'center',gap:5}}>
                              <span style={{fontFamily:osw,fontSize:11,cursor:'pointer',flex:1}}
                                onClick={e=>{e.stopPropagation();openPitcherSlide({pid:r.id,name:r.name,team:teamAbbr,hand:'',pitchMix:[]});}}>{r.name}</span>
                              <InjuryBadge pid={r.id} name={r.name}/>
                              <span style={{fontSize:9,color:'var(--ice)',opacity:.5,cursor:'pointer',flexShrink:0}}
                                onClick={e=>{e.stopPropagation();openPitcherSlide({pid:r.id,name:r.name,team:teamAbbr,hand:'',pitchMix:[]});}}>›</span>
                            </div>
                          </td>
                          {[r.ip,r.h,r.r,r.er,r.bb,r.k,r.hr,r.era].map((v,j) => (
                            <td key={j} style={{...cell,textAlign:'center',color:j===6&&v>0?'var(--accent)':undefined}}>{v}</td>
                          ))}
                        </tr>
                      ))
                    }
                    {boxTab === 'batting' && (() => {
                      const t = live?.teams?.[side]?.teamStats?.batting;
                      if (!t) return null;
                      return <tr style={{background:'var(--surface2)'}}>
                        <td style={{...cell,textAlign:'left',fontFamily:osw,fontWeight:700,fontSize:10,color:'var(--muted)'}}>TOTALS</td>
                        {[t.atBats,t.runs,t.hits,t.rbi,t.baseOnBalls,t.strikeOuts,'',''].map((v,j) => (
                          <td key={j} style={{...cell,textAlign:'center',fontFamily:osw,fontWeight:700,fontSize:11}}>{v??'—'}</td>
                        ))}
                      </tr>;
                    })()}
                  </tbody>
                </table>
              </div>
              {/* Batting/Baserunning notes (2B, 3B, HR, SB, LOB etc.) */}
              {boxTab === 'batting' && (() => {
                const sideNotes = notes[side] || [];
                if (!sideNotes.length) return null;
                return (
                  <div style={{marginTop:10,padding:'10px 12px',background:'var(--surface)',
                    border:'1px solid var(--border)',borderRadius:8,fontSize:10,
                    fontFamily:mono,lineHeight:1.7,color:'var(--muted)'}}>
                    {sideNotes.map((section, si) => (
                      <div key={si} style={{marginBottom: si < sideNotes.length-1 ? 8 : 0}}>
                        {section.title && section.title !== 'Batting' && (
                          <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
                            fontSize:11,color:'var(--text)',marginBottom:4,letterSpacing:.5}}>
                            {section.title}
                          </div>
                        )}
                        {(section.fieldList || []).filter(f => !f.label?.toLowerCase().startsWith('runners left')).map((f, fi) => (
                          <div key={fi} style={{marginBottom:3,textAlign:'left'}}>
                            <span style={{fontWeight:700,color:'var(--text)'}}>{f.label} </span>
                            <span style={{color:'var(--muted)'}}>{f.value}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </> : (
        <div style={{padding:24,color:'var(--muted)',fontFamily:mono,fontSize:11}}>
          {liveLoad ? 'Loading…' : 'Click a game to see the box score.'}
        </div>
      )}
    </div>
  );

  // ── Games list ───────────────────────────────────────────────────────────────
  const GamesList = () => (
    <div style={{
      display: !isMobile && selGamePk ? 'flex' : 'grid', flexDirection:'column',
      gridTemplateColumns: !isMobile && selGamePk ? undefined : 'repeat(auto-fill,minmax(240px,1fr))',
      gap: !isMobile && selGamePk ? 0 : 10,
      padding: !isMobile && selGamePk ? 0 : 12}}>
      {[...games].sort((a, b) => {
        // Sort order: Live → Preview (by time) → Final (by time)
        const order = s => s?.abstractGameState === 'Live' ? 0 : s?.abstractGameState === 'Final' ? 2 : 1;
        const oa = order(a.status), ob = order(b.status);
        if (oa !== ob) return oa - ob;
        // Within same group, sort by game start time
        const ta = a.gameDate ? new Date(a.gameDate).getTime() : 0;
        const tb = b.gameDate ? new Date(b.gameDate).getTime() : 0;
        return ta - tb;
      }).map(g => {
        const st  = gameStatus(g, liveDataMap[g.gamePk]?.linescore || liveDataMap[g.gamePk]?.liveLinescore);
        const aw  = g.teams?.away; const hm = g.teams?.home;
        const awR = rhe(g,'away'); const hmR = rhe(g,'home');
        const abs = g.status?.abstractGameState;
        const sel = g.gamePk === selGamePk;
        const awWin = abs==='Final' && (aw?.score??0) > (hm?.score??0);
        const hmWin = abs==='Final' && (hm?.score??0) > (aw?.score??0);
        return (
          <div key={g.gamePk} onClick={() => { setSelGamePk(sel && !isMobile ? null : g.gamePk); setBoxTab('batting'); }}
            style={{background: sel ? 'var(--surface2)' : 'var(--surface)',
              border:`1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: !isMobile && selGamePk ? 0 : 9, cursor:'pointer', padding:'10px 14px',
              borderLeft: !isMobile && selGamePk ? `3px solid ${sel?'var(--accent)':'transparent'}` : undefined,
              transition:'all .15s'}}>
            {/* Status row — no gamePk */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
              <div style={{display:'flex',alignItems:'center',gap:5}}>
                {st.dot && <div style={{width:6,height:6,borderRadius:'50%',background:st.color,animation:'pulse 1s infinite'}}/>}
                <span style={{fontFamily:mono,fontSize:9,fontWeight:700,color:st.color,letterSpacing:.8}}>{st.label}</span>
              </div>
              {isLive && sel && lsOuts !== null &&
                <span style={{fontFamily:mono,fontSize:9,color:'var(--muted)'}}>{lsOuts} out{lsOuts!==1?'s':''}</span>}
            </div>
            {/* Teams + score */}
            {[[aw, awR, awWin],[hm, hmR, hmWin]].map(([team, rhe, win], ti) => (
              <div key={ti} style={{display:'flex',alignItems:'center',gap:8,marginBottom:ti===0?3:0}}>
                <span style={{fontFamily:osw,fontWeight:700,fontSize:13,
                  color:win?'var(--text)':abs==='Final'?'var(--muted)':'var(--text)',minWidth:32}}>
                  {team?.team?.abbreviation||'—'}
                </span>
                <span style={{fontFamily:mono,fontSize:9,color:'var(--muted)',flex:1}}>
                  {team?.team?.record?`${team.team.record.wins}-${team.team.record.losses}`:''}
                </span>
                {abs !== 'Preview' && <>
                  <span style={{fontFamily:osw,fontWeight:win?800:400,fontSize:16,minWidth:20,textAlign:'right',color:win?'var(--text)':'var(--muted)'}}>{team?.score??'—'}</span>
                  <span style={{fontFamily:mono,fontSize:9,color:'rgba(255,255,255,.25)',minWidth:12,textAlign:'right'}}>{rhe.h}</span>
                  <span style={{fontFamily:mono,fontSize:9,color:rhe.e>0?'var(--accent)':'rgba(255,255,255,.2)',minWidth:12,textAlign:'right'}}>{rhe.e}</span>
                </>}
                {abs === 'Preview' && <span style={{fontFamily:mono,fontSize:9,color:'var(--muted)'}}>{team?.probablePitcher?.fullName?.split(' ').pop()||'TBD'}</span>}
              </div>
            ))}
            {/* Decisions */}
            {abs==='Final' && g.decisions && (
              <div style={{marginTop:6,paddingTop:6,borderTop:'1px solid rgba(255,255,255,.05)',display:'flex',gap:10}}>
                {g.decisions.winner && <span style={{fontFamily:mono,fontSize:8,color:'#27c97a'}}>W: {g.decisions.winner.fullName?.split(' ').pop()}</span>}
                {g.decisions.loser  && <span style={{fontFamily:mono,fontSize:8,color:'var(--accent)'}}>L: {g.decisions.loser.fullName?.split(' ').pop()}</span>}
                {g.decisions.save   && <span style={{fontFamily:mono,fontSize:8,color:'var(--accent2)'}}>S: {g.decisions.save.fullName?.split(' ').pop()}</span>}
              </div>
            )}
            {abs==='Preview' && (aw?.probablePitcher||hm?.probablePitcher) && (
              <div style={{marginTop:5,paddingTop:5,borderTop:'1px solid rgba(255,255,255,.05)',display:'flex',justifyContent:'space-between'}}>
                <span style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>{aw?.probablePitcher?.fullName?.split(' ').pop()||'TBD'}</span>
                <span style={{fontFamily:mono,fontSize:8,color:'rgba(255,255,255,.2)'}}>vs</span>
                <span style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>{hm?.probablePitcher?.fullName?.split(' ').pop()||'TBD'}</span>
              </div>
            )}

            {/* ── Live game detail: pitcher+batter (active) or due up (end of half) ── */}
            {abs==='Live' && (() => {
              const gLive        = liveDataMap[g.gamePk];
              if (!gLive) return null;
              const ls           = gLive.liveLinescore || gLive.linescore || {};
              const half         = ls.inningHalf || g.linescore?.inningHalf || '';
              const battingSide  = half === 'Bottom' ? 'home' : 'away';
              const pitchingSide = half === 'Bottom' ? 'away' : 'home';
              const battingAbbr  = g.teams?.[battingSide]?.team?.abbreviation  || '';
              const pitchingAbbr = g.teams?.[pitchingSide]?.team?.abbreviation || '';

              // Current pitcher = last in pitching team's pitchers list
              const pitcherIds = gLive.teams?.[pitchingSide]?.pitchers || [];
              const curPitchId = pitcherIds[pitcherIds.length - 1];
              const pitcherPl  = curPitchId ? gLive.teams?.[pitchingSide]?.players?.[`ID${curPitchId}`] : null;
              const pitcherName= (pitcherPl?.person?.fullName || '—').split(' ').pop();
              const pitcherIP  = pitcherPl?.stats?.pitching?.inningsPitched ?? '—';
              const pitcherERA = pitcherPl?.seasonStats?.pitching?.era ?? '—';

              // Current batter
              const gCurBat = gLive.currentBatterId || null;
              const gOnDeck = gLive.onDeckId        || null;
              const gInHole = gLive.inTheHoleId     || null;
              const gOuts   = ls.outs ?? null;
              const batPl   = gCurBat ? gLive.teams?.[battingSide]?.players?.[`ID${gCurBat}`] : null;
              const batName = (batPl?.person?.fullName || '—').split(' ').pop();
              const batSt   = batPl?.stats?.batting || {};
              const batOPS  = batPl?.seasonStats?.batting?.ops ?? '—';

              const inningOver = (gOuts ?? 0) >= 3;
              const hasDueUp   = gCurBat || gOnDeck;

              if (!curPitchId && !gCurBat && !hasDueUp) return null;

              return (
                <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid rgba(255,255,255,.06)'}}>
                  {!inningOver && (curPitchId || gCurBat) ? (
                    /* Active inning — pitcher + batter side by side */
                    <div style={{display:'flex',gap:8}}>
                      {curPitchId && (
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:mono,fontSize:7,color:'var(--muted)',
                            textTransform:'uppercase',letterSpacing:.8,marginBottom:2}}>
                            Pitching {pitchingAbbr}
                          </div>
                          <div style={{fontFamily:osw,fontWeight:700,fontSize:11,
                            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {pitcherName}
                          </div>
                          <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>
                            {pitcherIP} IP · {pitcherERA} ERA
                          </div>
                        </div>
                      )}
                      {gCurBat && (
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:mono,fontSize:7,color:'var(--accent)',
                            textTransform:'uppercase',letterSpacing:.8,marginBottom:2}}>
                            At Bat {battingAbbr}
                          </div>
                          <div style={{fontFamily:osw,fontWeight:700,fontSize:11,
                            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {batName}
                          </div>
                          <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>
                            {batSt.hits??0}-{batSt.atBats??0} · {batOPS} OPS
                          </div>
                        </div>
                      )}
                    </div>
                  ) : hasDueUp ? (
                    /* End of half-inning — due up next */
                    <div>
                      <div style={{fontFamily:mono,fontSize:7,color:'var(--muted)',
                        textTransform:'uppercase',letterSpacing:.8,marginBottom:6}}>
                        Due Up {battingAbbr}
                      </div>
                      <div style={{display:'flex',gap:4}}>
                        {[gCurBat, gOnDeck, gInHole].filter(Boolean).slice(0,3).map(id => {
                          // Search both sides — battingSide can be wrong at end-of-half
                          let fullName = '';
                          for (const s of ['away','home']) {
                            const p = gLive.teams?.[s]?.players?.[`ID${id}`];
                            if (p?.person?.fullName) { fullName = p.person.fullName; break; }
                          }
                          const lastName = fullName ? fullName.split(' ').pop() : '—';
                          return (
                            <div key={id} style={{flex:1,textAlign:'center',minWidth:0}}>
                              <PlayerAvatar pid={id} name={fullName} size={26}/>
                              <div style={{fontFamily:osw,fontSize:9,fontWeight:600,marginTop:2,
                                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                {lastName}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{margin:'-4px 0', minHeight:'70vh'}}>
      <DateStrip/>

      {loading ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:48,color:'var(--muted)',fontFamily:mono,fontSize:11}}>
          <div className="sp" style={{marginRight:12}}/> Loading games…
        </div>
      ) : games.length === 0 ? (
        <div style={{padding:48,textAlign:'center',color:'var(--muted)',fontFamily:mono,fontSize:11}}>No games scheduled</div>
      ) : isMobile ? (
        /* ── MOBILE: full-screen list OR full-screen detail ── */
        selGamePk && selGame
          ? DetailPanel()
          : <div style={{padding:10}}>{GamesList()}</div>
      ) : (
        /* ── DESKTOP: side-by-side split ── */
        <div style={{display:'flex', minHeight:'65vh'}}>
          <div style={{width: selGamePk ? '300px' : '100%', flexShrink:0,
            overflowY:'auto', borderRight: selGamePk ? '1px solid var(--border)' : 'none',
            transition:'width .2s', padding: selGamePk ? 0 : 0}}>
            {GamesList()}
          </div>
          {selGame && DetailPanel()}
        </div>
      )}
    </div>
  );
}



// ── HR Odds — from /api/odds (odds.js), refreshes every 65 min ──────────────────
// odds.js already handles fetching, caching, and serving player props
const HR_ODDS_MAP = {};  // pid → { odds, implied, book }
const HR_ODDS_LISTENERS = new Set();
let HR_ODDS_TS = 0;
const HR_ODDS_TTL = 65 * 60 * 1000; // match odds.js TTL

function subscribeHROdds(fn) { HR_ODDS_LISTENERS.add(fn); return () => HR_ODDS_LISTENERS.delete(fn); }
function notifyHROddsListeners() { HR_ODDS_LISTENERS.forEach(fn => fn(Date.now())); }

async function fetchHROdds(force = false) {
  if (!force && Date.now() - HR_ODDS_TS < HR_ODDS_TTL) return;
  try {
    const r = await fetch('/api/odds?type=props', { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return;
    const d = await r.json();
    if (d.status !== 'ok' || !d.props?.length) return;

    // Build name→pid lookup from PLAYER_DATA_CACHE for matching
    const nameMap = {};
    Object.values(PLAYER_DATA_CACHE).forEach(p => {
      if (p?.name && p?.pid) nameMap[p.name.toLowerCase().trim()] = String(p.pid);
    });

    // Clear and rebuild HR_ODDS_MAP
    Object.keys(HR_ODDS_MAP).forEach(k => delete HR_ODDS_MAP[k]);

    for (const game of d.props) {
      for (const player of (game.players || [])) {
        // Only HR props, point 0.5 = anytime HR market
        if (player.market !== 'batter_home_runs') continue;
        if (player.point !== null && player.point !== 0.5) continue;
        const overOdds = player.bestOver?.price;
        if (!overOdds) continue;

        // Match player name to pid
        const norm = (player.playerName || '').toLowerCase().trim();
        let pid = nameMap[norm];

        // Fuzzy fallback — last name match
        if (!pid) {
          const last = norm.split(' ').pop();
          pid = Object.entries(nameMap).find(([n]) => n.split(' ').pop() === last &&
            norm.split(' ')[0]?.[0] === n.split(' ')[0]?.[0])?.[1];
        }

        if (!pid) continue;

        const implied = overOdds > 0
          ? 100 / (overOdds + 100)
          : Math.abs(overOdds) / (Math.abs(overOdds) + 100);

        HR_ODDS_MAP[pid] = {
          odds    : overOdds,
          implied : Math.round(implied * 1000) / 1000,
          book    : player.bestOver?.book || '',
          name    : player.playerName,
        };
      }
    }

    HR_ODDS_TS = Date.now();
    notifyHROddsListeners();
    console.log(`[HROdds] ${Object.keys(HR_ODDS_MAP).length} players mapped from odds.js`);
  } catch(e) { console.warn('[HROdds]', e.message); }
}

function useHROdds() {
  const [v, setV] = useState(0);
  useEffect(() => {
    fetchHROdds();
    const unsub = subscribeHROdds(() => setV(n => n+1));
    const id = setInterval(() => fetchHROdds(true), HR_ODDS_TTL);
    return () => { unsub(); clearInterval(id); };
  }, []);
  return v;
}

function HROddsCell({ pid }) {
  const d = HR_ODDS_MAP[String(pid||'')];
  if (!d?.odds) return (
    <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'var(--border)'}}>—</span>
  );
  const o   = d.odds;
  const pct = (d.implied * 100).toFixed(0) + '%';
  const col = o >= 500 ? '#f5a623' : o >= 300 ? 'var(--ice)' : o >= 150 ? 'var(--text)' : '#27c97a';
  const tip = `HR Odds: ${o>0?'+':''}${o} · ${pct} implied · ${d.book}`;
  return (
    <span title={tip}
      style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,
        color:col,cursor:'help',whiteSpace:'nowrap'}}>
      {o > 0 ? '+' : ''}{o}
    </span>
  );
}

// ── Injury Report — MLB Stats API SC transactions ────────────────────────────
const INJURY_MAP = {};  // pid → { emoji, label, shortDesc, fullDesc, date, team }
const INJURY_LISTENERS = new Set();
let   INJURY_LOADED = 0; // timestamp — refreshes every 4hrs (DTD status changes during day)
let   INJURY_MODAL_CB = null; // set by InjuryModal component

function subscribeInjuries(fn) { INJURY_LISTENERS.add(fn); return () => INJURY_LISTENERS.delete(fn); }
function notifyInjuryListeners() { INJURY_LISTENERS.forEach(fn => fn(Date.now())); }
function openInjuryModal(pid, name) { if (INJURY_MODAL_CB) INJURY_MODAL_CB({ pid: String(pid||''), name: name||'' }); }

function extractInjuryDetail(desc) {
  // Pull the injury description after 'injured list.'
  const m = desc.match(/injured list[^.]*\.\s*(.+)/i);
  return m ? m[1].replace(/\.$/, '').trim() : '';
}

async function fetchInjuries() {
  const INJURY_TTL = 4 * 60 * 60 * 1000;
  if (INJURY_LOADED && Date.now() - INJURY_LOADED < INJURY_TTL) return;
  Object.keys(INJURY_MAP).forEach(k => delete INJURY_MAP[k]);

  // ── Transaction log — the only reliable source ─────────────────────────────
  // Key fix: MLB uses "Placed on the 10-Day Injured List" for placements
  // but "Activated from the 10-Day IL" (abbreviation!) for activations.
  // Previous versions checked desc.includes('injured list') for BOTH which meant
  // activations were silently dropped (they use 'IL' not 'injured list').
  try {
    const today = new Date().toISOString().slice(0,10);
    const ago60 = new Date(Date.now()-60*864e5).toISOString().slice(0,10);
    const r = await fetch(
      `https://statsapi.mlb.com/api/v1/transactions?sportId=1&startDate=${ago60}&endDate=${today}`,
      { signal: AbortSignal.timeout(9000) }
    );
    if (!r.ok) return;
    const d = await r.json();
    const placements  = {};
    const activations = {};

    for (const t of (d.transactions || [])) {
      if (t.typeCode !== 'SC') continue;
      const pid  = String(t.person?.id || '');
      const desc = (t.description || '').toLowerCase();
      if (!pid) continue;

      // PLACEMENT: "Placed on the 10-Day Injured List" — always uses full words
      const isPlacement = (desc.includes('injured list') || desc.includes(' il ') || desc.endsWith(' il'))
        && (desc.includes('placed') || desc.includes('transferred'));

      // ACTIVATION: MLB uses several patterns — catch all of them:
      // "Activated from the 10-Day IL" / "Activated from the 10-Day Injured List"
      // "Reinstated from the 15-Day IL"
      // "Recalled from Rehabilitation Assignment" (player returns from rehab to active roster)
      // "Selected from" (minor league callup that effectively ends IL stint)
      const isActivation =
        // Explicit IL activation/reinstatement
        ((desc.includes('activated') || desc.includes('reinstated')) &&
          (desc.includes('injured list') || desc.includes(' il') ||
           desc.includes('10-day') || desc.includes('15-day') || desc.includes('60-day')))
        ||
        // Rehab recall (player returning from rehab assignment to active roster)
        (desc.includes('recalled') && desc.includes('rehabilitation'))
        ||
        // Outrighted or transferred off IL entirely
        (desc.includes('outrighted') && (desc.includes(' il') || desc.includes('injured')));

      if (isPlacement) {
        if (!placements[pid] || t.date > placements[pid].date) {
          const full = t.description || '';
          const lo   = full.toLowerCase();
          placements[pid] = {
            date: t.date,
            emoji: lo.includes('60') ? '🚫' : '🤕',
            label: lo.includes('60') ? '60-Day IL' : lo.includes('15') ? '15-Day IL' : '10-Day IL',
            fullDesc: full,
            shortDesc: extractInjuryDetail(full),
            team: t.toTeam?.abbreviation || t.fromTeam?.abbreviation || '',
          };
        }
      } else if (isActivation) {
        if (!activations[pid] || t.date > activations[pid]) activations[pid] = t.date;
      }
    }

    // Only keep players whose latest placement was NOT followed by an activation
    let ilCount = 0;
    Object.entries(placements).forEach(([pid, info]) => {
      if (!(activations[pid] && activations[pid] >= info.date)) {
        INJURY_MAP[pid] = info;
        ilCount++;
      }
    });

    // ── Cross-check against mlb_injury_report.csv from the pipeline ────────────
    // This file is generated nightly and is the most accurate status source.
    // If a player is listed as 'Active' there but still in our INJURY_MAP, remove them.
    try {
      const cr = await fetch('/data/mlb_injury_report.csv');
      if (cr.ok) {
        const text = await cr.text();
        const lines = text.replace(/^\uFEFF/, '').trim().split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
        const bidIdx = headers.findIndex(h => h.toLowerCase().includes('batter id') || h.toLowerCase().includes('playerid') || h === 'Batter ID');
        const descIdx = headers.findIndex(h => h.toLowerCase().includes('injury description') || h.toLowerCase().includes('description'));
        if (bidIdx >= 0 && descIdx >= 0) {
          let cleared = 0;
          for (const line of lines.slice(1)) {
            if (!line.trim()) continue;
            const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
            const bid  = cols[bidIdx];
            const desc = (cols[descIdx] || '').toLowerCase();
            // If pipeline says Active but we have them as injured → remove
            if (bid && desc === 'active' && INJURY_MAP[bid]) {
              delete INJURY_MAP[bid];
              cleared++;
            }
          }
          if (cleared > 0) console.log(`[Injuries] ${cleared} player(s) cleared by mlb_injury_report.csv (pipeline says Active)`);
        }
      }
    } catch(e2) { /* pipeline CSV not available — skip cross-check */ }

    INJURY_LOADED = Date.now();
    notifyInjuryListeners();
    console.log(`[Injuries] ${ilCount} IL players (${Object.keys(placements).length} placed, ${Object.keys(activations).length} activated)`);
  } catch(e) { console.warn('[Injuries] fetch failed:', e.message); }
}

function useInjuries() {
  const [v, setV] = useState(0);
  useEffect(() => {
    fetchInjuries();
    const unsub = subscribeInjuries(() => setV(n => n+1));
    return unsub;
  }, []);
  return v;
}
async function fetchVideoLinks(hrs) {
  // playId UUID not available for completed games in live feed or playByPlay.
  // Use game content/highlights endpoint — same source as MLB.com video player.
  // Each highlight item has keywords (player IDs) and playbacks (real mp4 URLs).
  const games = [...new Set((hrs||[]).map(h => String(h.gamePk||'')).filter(Boolean))];
  if (!games.length) return;

  // Index HRs by batterId — use array to handle multiple HRs per batter per game
  // Headlines appear in chronological order so we pop the earliest unmatched HR first
  const hrByBatter = {};   // batterId → [hr, hr, ...] sorted by atBatIndex ascending
  (hrs||[]).forEach(h => {
    const bid = String(h.batterId||'');
    if (!bid) return;
    if (!hrByBatter[bid]) hrByBatter[bid] = [];
    hrByBatter[bid].push(h);
  });
  // Sort each batter's HRs by atBatIndex so we match in play order
  Object.values(hrByBatter).forEach(arr => arr.sort((a,b) => (a.atBatIndex||0)-(b.atBatIndex||0)));

  let totalFound = 0;
  for (const gamePk of games) {
    try {
      const r = await fetch(
        `https://statsapi.mlb.com/api/v1/game/${gamePk}/content?language=en`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!r.ok) continue;
      const d = await r.json();
      const items = d?.highlights?.highlights?.items || [];

      // DEBUG: log item structure for first game only
      if (gamePk === games[0] && items.length > 0) {
        const sample = items.slice(0,3).map(it => ({
          headline: (it.headline||'').slice(0,60),
          urls: (it.playbacks||[]).map(p => (p.url||'').replace('https://','').split('/')[0] + '/' + (p.name||'')),
          keywords: (it.keywordsAll||[]).slice(0,5).map(k => `${k.type||''}:${k.value||''}`)
        }));
        console.log('[Video] content sample:', JSON.stringify(sample, null, 1));
      }

      // Helper: match item keywords to a batter, return batter HR object or null
      const matchBatter = (item) => {
        // Only match HR-related clips — skip recaps, interviews, condensed games etc.
        const hl = (item.headline || '').toLowerCase();
        const isHR = hl.includes('home run') || hl.includes('homer')
                  || hl.includes('grand slam') || hl.includes('solo shot');
        if (!isHR) return null;
        const keywords = item.keywordsAll || item.keywordsDisplay || [];
        for (const kw of keywords) {
          const val = String(kw.value || kw || '');
          if (hrByBatter[val]?.length > 0) {
            // Shift = consume the earliest unmatched HR (chronological headline order)
            return hrByBatter[val].shift();
          }
        }
        return null;
      };

      // PASS 1: broadcast clips only — prefer direct MP4 over HLS playlist
      // HTTP_CLOUD_WIRED / HTTP_CLOUD_WIRED_60 = _1280x720_59_4000K.mp4 (what realapp.com uses)
      // hlsCloud = .m3u8 HLS playlist (doesn't play natively in Chrome/Edge)
      const MP4_NAMES = ['HTTP_CLOUD_WIRED_60','HTTP_CLOUD_WIRED','mp4Avc','highBit'];
      const getBroadcastUrl = (playbacks) => {
        // Try preferred MP4 names first
        for (const name of MP4_NAMES) {
          const p = playbacks.find(pb => pb.name === name && (pb.url||'').includes('mlb-cuts-diamond'));
          if (p?.url) return p.url;
        }
        // Any mlb-cuts-diamond URL that's not HLS
        const nonHls = playbacks.find(p => (p.url||'').includes('mlb-cuts-diamond') && !(p.url||'').endsWith('.m3u8'));
        if (nonHls?.url) return nonHls.url;
        // Last resort: any mlb-cuts-diamond (may be .m3u8)
        return playbacks.find(p => (p.url||'').includes('mlb-cuts-diamond'))?.url || null;
      };

      const matched = new Set();
      items.forEach(item => {
        const playbacks = item.playbacks || [];
        const broadcastUrl = getBroadcastUrl(playbacks);
        if (!broadcastUrl) return;
        const h = matchBatter(item);
        if (!h) return;
        const gk = String(h.gamePk||''), idx = h.atBatIndex??h.playIndex, bid = String(h.batterId||'');
        if (idx != null) VIDEO_LINK_CACHE[`${gk}_${idx}`] = broadcastUrl;
        if (bid)         VIDEO_LINK_CACHE[`${gk}_${bid}`] = broadcastUrl;
        matched.add(bid);
      });

      // PASS 2: fallback to any clip for unmatched batters — still prefer MP4 over .m3u8
      items.forEach(item => {
        const playbacks = item.playbacks || [];
        const anyUrl = getBroadcastUrl(playbacks)
                    || playbacks.find(p => (p.url||'').endsWith('.mp4'))?.url
                    || playbacks[0]?.url;
        if (!anyUrl) return;
        const h = matchBatter(item);
        if (!h || matched.has(String(h.batterId||''))) return;
        const gk = String(h.gamePk||''), idx = h.atBatIndex??h.playIndex, bid = String(h.batterId||'');
        if (idx != null) VIDEO_LINK_CACHE[`${gk}_${idx}`] = anyUrl;
        if (bid)         VIDEO_LINK_CACHE[`${gk}_${bid}`] = anyUrl;
        matched.add(bid);
      });

      const found = matched.size;

      console.log(`[Video] game ${gamePk}: ${items.length} highlights, ${found} HR videos matched`);
      totalFound += found;
    } catch(e) { console.warn(`[Video] game ${gamePk}:`, e.message); }
  }
  console.log(`[Video] Total: ${totalFound} HR video links built`);
}

let HR_DATA_DATE = '';
let HR_LAST_FETCH = 0;
const SEEN_HR_IDS = new Set();
const DAILY_PICKS_CACHE = {}; // keyed by batter_id string
// Key matchup batter IDs for today — orange highlight across all tabs
// Keyed to ET date so it auto-resets each day
const KEY_MATCHUP_BATTER_IDS   = new Set();
const KEY_MATCHUP_BATTER_NAMES = new Set(); // lowercase name fallback
let   KEY_MATCHUP_DATE = '';
const getETDateStr = () => {
  // Slate day runs 4am ET → 3:59am ET next day.
  // Before 3am ET = still "yesterday's" slate — subtract one day.
  const etHour = parseInt(new Date().toLocaleString('en-US',{timeZone:'America/New_York',hour:'numeric',hour12:false}));
  const d = new Date();
  if (etHour < 3) d.setDate(d.getDate() - 1); // rewind to previous calendar day
  const s = d.toLocaleDateString('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
  const [m,dy,y] = s.split('/'); return `${y}-${m}-${dy}`;
};
function hrYesterday(bid) {
  // Returns count of HRs batter hit yesterday (0 if none), from engine daily_picks field
  const row = DAILY_PICKS_CACHE[String(bid||'').split('.')[0]];
  return parseInt(row?.hr_yesterday || 0);
}
const isKeyMatchup = (pid, name) => {
  // Only valid for today — stale data from a previous day is ignored
  if (KEY_MATCHUP_DATE !== getETDateStr()) return false;
  if (pid && KEY_MATCHUP_BATTER_IDS.has(String(parseInt(pid)||pid))) return true;
  if (name && KEY_MATCHUP_BATTER_NAMES.has(String(name).toLowerCase().trim())) return true;
  return false;
};
const KEY_MATCHUP_STYLE = {color:'#ff8020',fontWeight:700}; // orange like "Heating Up"

// Due sticker — batter's AB since last HR exceeds their season AB/HR rate
// Uses PLAYER_DATA_CACHE (from players.json) for abPerHR and abSinceHR
// Falls back to daysSinceHR * 3.8 AB/game if abSinceHR not in cache
const isDue = (pid) => {
  const p = getCachedPlayer(pid);
  if (!p) return false;
  // abPerHR: season AB / season HR (how often they homer on average)
  const seasonHR = p.hr || 0;
  const seasonPA = p.pa || p.ab || 0;
  if (seasonHR < 3 || seasonPA < 20) return false; // need real sample
  const abPerHR = seasonPA / seasonHR; // e.g. 18 AB per HR
  // abSinceHR: from real window data or estimate from days since HR
  const w7 = p.windows?.last7;
  const abSinceHR = w7?.abSinceHR != null ? w7.abSinceHR
    : p.daysSinceHR != null ? Math.round(p.daysSinceHR * 3.8)
    : null;
  if (abSinceHR == null) return false;
  // "Due" = has gone more than 1.15x their normal AB/HR rate without a HR
  return abSinceHR > abPerHR * 1.15;
};
// For daily_picks.csv rows (has season_pa and recent_hr_count)
const isDueFromRow = (row, pid) => {
  // Try player cache first (most accurate)
  if (pid && isDue(pid)) return true;
  // Fallback: use season_pa from engine row + hr from player cache
  const seasonPA = parseFloat(row?.season_pa || 0);
  const seasonHR = getCachedPlayer(pid)?.hr || 0;
  const recentHRCount = parseInt(row?.recent_hr_count || 0);
  if (seasonHR < 3 || seasonPA < 20) return false;
  const abPerHR = seasonPA / seasonHR;
  // If no HRs in the recent window and season rate suggests they should have
  const recentPA = parseFloat(row?.recent_pa || 0);
  return recentHRCount === 0 && recentPA > abPerHR * 1.0;
};
const DUE_BADGE = (
  <span style={{padding:'2px 6px',borderRadius:4,fontSize:9,fontWeight:700,
    background:'rgba(56,184,242,.15)',border:'1px solid rgba(56,184,242,.35)',
    color:'var(--ice)',fontFamily:"'DM Mono',monospace",letterSpacing:.3,flexShrink:0}}
    title="Due — AB since last HR exceeds their normal AB/HR rate">⏳ Due</span>
);
const WEATHER_ALERT_GAME_IDS = new Set(); // game_ids with weather concerns at game time
const DAILY_GAME_MAP    = {}; // keyed by normalized game_id → Set of batting_teams
const FINAL_GAME_IDS    = new Set(); // game_ids whose status is "Final" — updated by fetchGames
let _notifyNewHR = null; // callback set by useHRNotifications hook

// Global navigation — lets notifications route to tabs/views without prop drilling
let _GLOBAL_NAV = null; // { setTab, setLiveView } — set by App on mount
function navTo(tab, liveView) {
  if (!_GLOBAL_NAV) return;
  _GLOBAL_NAV.setTab(tab);
  if (liveView) _GLOBAL_NAV.setLiveView(liveView);
}

// ── Generic notification system ─────────────────────────────────────────────
const NOTIF_TYPES = {
  hr:       { icon:'💥', label:'GONE YARD',         color:'#ff4020', bg:'rgba(255,64,32,.18)' },
  onFire:   { icon:'🔥', label:'ON FIRE',           color:'#fb923c', bg:'rgba(251,146,60,.18)' },
  lineup:   { icon:'📋', label:'LINEUP CONFIRMED',  color:'#38b8f2', bg:'rgba(56,184,242,.15)' },
};
let _notifyNew = null; // set by useNotifications
let _notifLog  = [];   // all notification history
let _setNotifLog = null;

// Track multi-HR games for On Fire detection
const GAME_HR_MAP = {}; // 'gamePk_batterId' → count

// Track which teams have already fired lineup notifications
const LINEUP_NOTIF_SENT = new Set();
let LINEUP_NOTIF_FIRST_LOAD = true; // skip notifications on first load

// Push helper — calls /api/notify from browser for live events
async function sendLivePush(title, body, dedupKey = '', url = '/#live/gameday') {
  try {
    const secret = window.__NOTIFY_SECRET__ || '';
    if (!secret) return;
    await fetch('/api/notify', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({secret, title, body, url, dedupKey}),
    });
  } catch {}
}
const HR_CACHE_MS = 18000; // match to poll interval — real fetch every 18s during games

async function fetchHRs(force=false) {
  const now = Date.now();
  if (!force && now - HR_LAST_FETCH < HR_CACHE_MS && HR_LAST_FETCH > 0) {
    return HR_DATA;
  }
  try {
    const res = await fetch("/api/homeruns");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const newHRs = data.homeruns || [];
    // Keep yesterday's HRs in ticker until today's games produce at least 3 HRs
    // This way the ticker stays alive past midnight until next day's games start
    if (newHRs.length > 0) {
      HR_DATA = newHRs; HR_DATA_DATE = data.date || '';
      // Seed on first load; fire banners on subsequent fetches only
      const isFirst = HR_LAST_FETCH === 0;
      newHRs.forEach(h => {
        const id = `${h.gamePk}-${h.batterId}-${h.atBatIndex}`;
        if (!SEEN_HR_IDS.has(id)) {
          SEEN_HR_IDS.add(id);
          if (!isFirst && _notifyNewHR) _notifyNewHR(h); // skip on first load
        }
      });
    } else if (HR_DATA.length === 0) {
      // Truly no data yet — try fetching yesterday
      try {
        const etDate = new Date().toLocaleDateString("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"});
        const [m,d,y] = etDate.split("/");
        const yesterday = new Date(Date.UTC(parseInt(y),parseInt(m)-1,parseInt(d)-1));
        const yd = yesterday.toISOString().slice(0,10);
        const yRes = await fetch(`/api/homeruns?date=${yd}`);
        if (yRes.ok) {
          const yData = await yRes.json();
          const yHRs = yData.homeruns || [];
          if (yHRs.length > 0) {
            HR_DATA = yHRs;
            console.log("[HRs] Using yesterday's", yHRs.length, "HRs until today's games start");
          }
        }
      } catch(e) { console.warn("[HRs] Yesterday fetch failed:", e.message); }
    }
    // else: HR_DATA already has yesterday's data — keep showing it
    HR_LAST_FETCH = now;
    console.log("[HRs] Fetched:", newHRs.length, "HRs today, showing:", HR_DATA.length);
    // Fire-and-forget: fetch play-by-play for video UUIDs
    if (HR_DATA.length > 0) fetchVideoLinks(HR_DATA).catch(() => {});
    return HR_DATA;
  } catch(e) {
    console.warn("[HRs] Fetch failed:", e.message);
    return HR_DATA;
  }
}


function HRTicker({ onHRClick }) {
  const [hrs, setHrs] = useState([]);
  const [tickerReady, setTickerReady] = useState(false);
  useEffect(() => {
    fetchHRs(true).then(d => { setHrs(d); setTickerReady(true); });
    const id = setInterval(() => fetchHRs(false).then(setHrs), 20000);
    return () => clearInterval(id);
  }, []);

  // Always render — show placeholder until data arrives
  const items = hrs.length > 0 ? [...hrs, ...hrs] : [];
  const speed = Math.max(hrs.length * 8, 40);

  return (
    <div className="ticker-wrap" style={{cursor:"pointer"}} onClick={onHRClick}>
      <div className="ticker-label">💥 HR</div>
      <div style={{overflow:"hidden",flex:1,display:"flex",alignItems:"center"}}>
        {!tickerReady && (
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"var(--muted)",padding:"0 14px"}}>
            Loading today's home runs…
          </span>
        )}
        {tickerReady && hrs.length === 0 && (
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"var(--muted)",padding:"0 14px"}}>
            No home runs yet today · updates every 60s · click for HR Tracker ⚾
          </span>
        )}
        {tickerReady && hrs.length > 0 && (
          <div className="ticker-track" style={{animationDuration:`${speed}s`}}>
            {items.map((hr, i) => (
              <div key={i} className="ticker-item">
                <span style={{color:"var(--accent)",fontWeight:700}}>💥</span>
                <span style={{color:isKeyMatchup(hr.batterId, hr.batterName)?"#ff8020":"var(--accent2)",fontWeight:700}}>{hr.batterName}</span>
                <span style={{color:"var(--muted)"}}>({hr.batterTeam})</span>
                <span style={{color:"var(--text)"}}>{hr.hrType}</span>
                {hr.distance && <span style={{color:"var(--green)",fontWeight:600}}>{hr.distance}ft</span>}
                {hr.exitVelo && <span style={{color:hr.exitVelo>=103?"var(--accent)":hr.exitVelo>=95?"var(--fire3)":"var(--muted)"}}>{hr.exitVelo}mph</span>}
                {hr.launchAngle && <span style={{color:"var(--muted)",fontSize:10}}>{hr.launchAngle}°</span>}
                {hr.pitchType && <span style={{color:"var(--muted)",fontSize:10}}>{hr.pitchType}</span>}
                <span style={{color:"var(--muted)",fontSize:10}}>vs {hr.pitcherName}</span>
                <span style={{color:"var(--muted)",fontSize:10}}>Inn.{hr.inning}</span>
                <span className="ticker-sep">·</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


function HRTrackerTab() {
  const [hrTab, setHrTab] = useState('tracker');
  const [hrs, setHrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("chronoIndex");
  const [sortDir, setSortDir] = useState(-1); // -1 = newest (highest chronoIndex) first
  const [filterTeam, setFilterTeam] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [hrSearch, setHrSearch] = useState("");

  // Date picker — defaults to today, min = season start
  const todayET = new Date().toLocaleDateString("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"});
  const [mp,dp,yp] = todayET.split("/");
  const todayStr = `${yp}-${mp}-${dp}`;
  // After midnight: if before 4 AM ET, default to yesterday so late-night HRs still show
  const etHourNow = parseInt(new Date().toLocaleString('en-US',{timeZone:'America/New_York',hour:'numeric',hour12:false}));
  const defaultDate = (() => {
    if (etHourNow < 4) {
      const y = new Date(); y.setDate(y.getDate()-1);
      const yd = y.toLocaleDateString('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
      const [ym2,yd2,yy2] = yd.split('/');
      return `${yy2}-${ym2}-${yd2}`;
    }
    return todayStr;
  })();
  const [selDate, setSelDate] = useState(defaultDate);
  const SEASON_START = "2026-03-20";

  const load = async (date) => {
    setLoading(true);
    try {
    // When after midnight, /api/homeruns uses explicit date to stay on the right day
    const url = date ? `/api/homeruns?date=${date}` : "/api/homeruns";

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const loaded = data.homeruns || [];
      setHrs(loaded);
      if (loaded.length > 0) fetchVideoLinks(loaded).catch(() => {});
    } catch(e) {
      console.warn("[HRTracker] Load failed:", e.message);
      if (date === todayStr) {
        const cached = await fetchHRs(true);
        setHrs(cached);
        if (cached.length > 0) fetchVideoLinks(cached).catch(() => {});
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(selDate); }, [selDate]);

  const hs = (k) => { if (sortKey===k) setSortDir(d=>-d); else { setSortKey(k); setSortDir(k==="timeET"||k==="chronoIndex"||k==="distance"||k==="exitVelo"?-1:1); } };
  const isToday = selDate === todayStr;
  const displayDate = new Date(selDate + "T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});

  const teams = [...new Set(hrs.map(h => h.batterTeam))].filter(Boolean).sort();

  const filtered = hrs.filter(h => {
    if (filterTeam !== "all" && h.batterTeam !== filterTeam) return false;
    if (hrSearch.trim()) {
      const q = hrSearch.toLowerCase();
      return (h.batterName||"").toLowerCase().includes(q) ||
             (h.pitcherName||"").toLowerCase().includes(q) ||
             (h.batterTeam||"").toLowerCase().includes(q);
    }
    return true;
  });
  const sorted = [...filtered].sort((a,b) => {
    // Convert "9:45 PM" → minutes since midnight for reliable numeric sort
    const toMins = (hr) => {
      const t = hr.timeET || '';
      const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!m) {
        // Fall back to inning + plate appearance for in-game ordering
        return (hr.inning || 0) * 100 + (hr.plateAppearance || hr.playIndex || 0);
      }
      let h = parseInt(m[1]), mins = parseInt(m[2]);
      const ap = m[3].toUpperCase();
      if (ap === 'PM' && h !== 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      return h * 60 + mins;
    };

    if (sortKey === "timeET" || sortKey === "chronoIndex") {
      // Newest (latest time) first — descending
      return toMins(b) - toMins(a);
    }
    // Secondary: sort by chosen column, break ties by latest time
    const av = a[sortKey], bv = b[sortKey];
    if (av == null && bv == null) return toMins(b) - toMins(a);
    if (av == null) return 1;
    if (bv == null) return -1;
    const primary = typeof av === "string"
      ? sortDir * av.localeCompare(bv)
      : sortDir * (bv - av);
    if (primary !== 0) return primary;
    return toMins(b) - toMins(a);
  });

  const totalHRs = hrs.length;

  // Pre-compute chronological rank per batter (oldest HR = rank 1)
  const hrRankMap = (() => {
    const chrono = [...hrs].sort((a,b) =>
      ((a.inning||0)*10000+(a.plateAppearance||a.playIndex||a.atBatIndex||0)) -
      ((b.inning||0)*10000+(b.plateAppearance||b.playIndex||b.atBatIndex||0))
    );
    const counts = {};
    const map = {};
    chrono.forEach(h => {
      const bid = String(h.batterId);
      counts[bid] = (counts[bid]||0) + 1;
      map[`${h.batterId}_${h.gamePk}_${h.atBatIndex||h.playIndex||h.plateAppearance||0}`] = counts[bid];
    });
    return map;
  })();
  const slamCount = hrs.filter(h => h.rbi === 4).length;
  const avgDist = hrs.filter(h=>h.distance).length
    ? Math.round(hrs.filter(h=>h.distance).reduce((s,h)=>s+h.distance,0)/hrs.filter(h=>h.distance).length)
    : null;
  const avgEV = hrs.filter(h=>h.exitVelo).length
    ? (hrs.filter(h=>h.exitVelo).reduce((s,h)=>s+h.exitVelo,0)/hrs.filter(h=>h.exitVelo).length).toFixed(1)
    : null;
  const topShot = hrs.filter(h=>h.distance).sort((a,b)=>b.distance-a.distance)[0];
  const hardest = hrs.filter(h=>h.exitVelo).sort((a,b)=>b.exitVelo-a.exitVelo)[0];

  const exportHRCsv = () => {
    const dq = String.fromCharCode(34);
    const esc = v => dq + String(v==null?'':v).replace(new RegExp(dq,'g'), dq+dq) + dq;
    const headers = ['Time','Team','Batter','HR#','Type','RBI','Inn','Angle','EV','Dist','Pitch','Pitcher','Game'];
    const rows = sorted.map(h=>[
      h.timeET||'', h.batterTeam||'', h.batterName||'',
      hrRankMap[h.batterId+'_'+h.gamePk+'_'+(h.atBatIndex||h.playIndex||h.plateAppearance||0)]||'',
      h.hrType||'', h.rbi||0,
      (h.halfInning==='top'?'T':'B')+(h.inning||''),
      h.launchAngle||'', h.exitVelo||'', h.distance||'',
      h.pitchType||'', h.pitcherName||'',
      (h.awayAbbr||'')+' @ '+(h.homeAbbr||'')
    ].map(esc).join(","));
    const csv = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    a.download = "hr-tracker-"+selDate+".csv";
    a.click();
  };

  const HRNav = () => (
    <div style={{display:'flex',gap:6,marginBottom:14}}>
      {[['tracker','💥 HR Tracker'],['leaderboard','🏆 HR Leaders'],['hotbats','🔥 Hot Bats'],['heatingup','📈 Heating Up']].map(([key,label]) => (
        <button key={key} onClick={() => setHrTab(key)}
          style={{padding:'5px 12px',borderRadius:7,cursor:'pointer',
            fontFamily:"'DM Mono',monospace",fontWeight:hrTab===key?700:400,fontSize:10,
            border:`1px solid ${hrTab===key?'var(--accent)':'var(--border)'}`,
            background:hrTab===key?'rgba(232,65,26,.15)':'var(--surface2)',
            color:hrTab===key?'var(--accent)':'var(--muted)'}}>
          {label}
        </button>
      ))}
    </div>
  );
  if (hrTab === 'hotbats')     return <div><HRNav/><HotBatsTab/></div>;
  if (hrTab === 'heatingup')   return <div><HRNav/><HeatingUpTab/></div>;
  if (hrTab === 'leaderboard') return <div><HRNav/><HRLeaderboardTab/></div>;
  return <div>
    <HRNav/>
    <div className="hrow">
      <button onClick={exportHRCsv}
        style={{padding:"4px 12px",borderRadius:6,border:"1px solid var(--border)",
          background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",
          fontFamily:"'DM Mono',monospace",fontSize:11,display:"flex",alignItems:"center",gap:5}}>
        ⬇ CSV
      </button>
      <RefBtn refreshing={refreshing} onClick={async()=>{setRefreshing(true);await load(selDate);setRefreshing(false);}}/>
    </div>

    {/* Date Picker */}
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
      <span style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1}}>Date:</span>
      <button onClick={()=>{const d=new Date(selDate+"T12:00:00");d.setDate(d.getDate()-1);const s=d.toISOString().slice(0,10);if(s>=SEASON_START)setSelDate(s);}}
        disabled={selDate<=SEASON_START}
        style={{padding:"4px 10px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text)",cursor:selDate<=SEASON_START?"not-allowed":"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,opacity:selDate<=SEASON_START?0.4:1}}>◀</button>
      <input type="date" value={selDate} min={SEASON_START} max={todayStr}
        onChange={e=>setSelDate(e.target.value)}
        style={{padding:"4px 10px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text)",fontFamily:"'DM Mono',monospace",fontSize:12,cursor:"pointer"}}
      />
      <button onClick={()=>{const d=new Date(selDate+"T12:00:00");d.setDate(d.getDate()+1);const s=d.toISOString().slice(0,10);if(s<=todayStr)setSelDate(s);}}
        disabled={selDate>=todayStr}
        style={{padding:"4px 10px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text)",cursor:selDate>=todayStr?"not-allowed":"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,opacity:selDate>=todayStr?0.4:1}}>▶</button>
      {!isToday && <button onClick={()=>setSelDate(todayStr)}
        style={{padding:"4px 10px",borderRadius:6,border:"1px solid var(--accent)",background:"rgba(232,65,26,.1)",color:"var(--accent)",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:11}}>↩ Today</button>}
      <span style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>{isToday?"🔴 Live":"📅 " + displayDate}</span>
    </div>

    {/* Stats + top shots — compact single row */}
    <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
      {/* Stat mini-cards */}
      {[
        {icon:'💥',label:'HRs',        val:totalHRs,                  col:'var(--accent)'},
        {icon:'🎉',label:'Grand Slams', val:slamCount,                 col:'var(--accent2)'},
        {icon:'📏',label:'Avg Dist',    val:avgDist?`${avgDist}ft`:null,col:'var(--text)'},
        {icon:'⚡',label:'Avg EV',      val:avgEV?`${avgEV}mph`:null,  col:'var(--text)'},
      ].filter(c=>c.val!=null).map(c=>(
        <div key={c.label} style={{flex:'0 0 auto',background:'var(--surface)',border:'1px solid var(--border)',
          borderRadius:7,padding:'5px 8px',textAlign:'center'}}>
          <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:.6,whiteSpace:'nowrap'}}>{c.icon} {c.label}</div>
          <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:16,color:c.col,lineHeight:1.1}}>{c.val}</div>
        </div>
      ))}
      {/* Longest + Hardest — compact */}
      {topShot && <div style={{flex:1,minWidth:120,background:'var(--surface)',border:'1px solid rgba(232,65,26,.25)',borderRadius:7,padding:'5px 8px'}}>
        <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:.8,marginBottom:2}}>🚀 Longest</div>
        <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,color:'var(--accent)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{topShot.batterName}</div>
        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,fontWeight:800,lineHeight:1}}>{topShot.distance}<span style={{fontSize:10,color:'var(--muted)',marginLeft:2}}>ft</span></div>
        <div style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>{topShot.batterTeam} · {topShot.exitVelo}mph · {topShot.launchAngle}°</div>
      </div>}
      {hardest && <div style={{flex:1,minWidth:120,background:'var(--surface)',border:'1px solid rgba(245,166,35,.25)',borderRadius:7,padding:'5px 8px'}}>
        <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:.8,marginBottom:2}}>⚡ Hardest Hit</div>
        <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,color:'var(--accent2)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{hardest.batterName}</div>
        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,fontWeight:800,lineHeight:1}}>{hardest.exitVelo}<span style={{fontSize:10,color:'var(--muted)',marginLeft:2}}>mph</span></div>
        <div style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>{hardest.batterTeam} · {hardest.distance}ft · {hardest.launchAngle}°</div>
      </div>}
    </div>

    {/* Search + Team filter */}
    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
      <SearchBar value={hrSearch} onChange={setHrSearch} placeholder="Search batter or pitcher…"/>
      {teams.length > 0 && <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1}}>Team:</span>
        <button className={`chip ${filterTeam==="all"?"active":""}`} onClick={()=>setFilterTeam("all")}>All</button>
        {teams.map(t => <button key={t} className={`chip ${filterTeam===t?"active":""}`} onClick={()=>setFilterTeam(t)}>{t}</button>)}
      </div>}
    </div>

    {loading
      ? <div className="lw"><div className="sp"/><div className="lt">Loading today's home runs…</div></div>
      : sorted.length === 0
        ? <div style={{padding:"40px",textAlign:"center",color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>
            {totalHRs === 0 ? `No home runs ${isToday?"yet today — check back once games start":"for "+displayDate}. ⚾` : "No HRs match the current filter."}
          </div>
        : <div className="tw"><table style={{width:"100%"}}>
            <colgroup>
              <col style={{width:24}}/>  {/* # */}
              <col style={{width:80}}/>  {/* Time */}
              <col style={{width:40}}/>  {/* Team */}
              <col style={{width:130}}/> {/* Batter */}
              <col style={{width:38}}/>  {/* HR# */}
              <col style={{width:90}}/>  {/* Type/RBI */}
              <col style={{width:50}}/>  {/* Inning */}
              <col style={{width:46}}/>  {/* Angle */}
              <col style={{width:58}}/>  {/* Exit Velo */}
              <col style={{width:68}}/>  {/* Distance */}
              <col style={{width:52}}/>  {/* Pitch */}
              <col style={{width:110}}/> {/* vs Pitcher */}
              <col style={{width:80}}/>  {/* Game */}
              <col style={{width:32}}/>  {/* 📹 */}
            </colgroup>
            <thead><tr style={{position:"sticky",top:0,zIndex:20,background:"var(--surface2)"}}>
              <th style={{width:24,cursor:"default",background:"var(--surface2)"}}>#</th>
              {[
                {key:"chronoIndex",label:"Time"},
                {key:"batterTeam", label:"Tm"},
                {key:"batterName", label:"Batter"},
                {key:"seasonHRs",  label:"HR#"},
                {key:"rbi",        label:"Type"},
                {key:"inning",     label:"Inn"},
                {key:"launchAngle",label:"Ang"},
                {key:"exitVelo",   label:"EV"},
                {key:"distance",   label:"Dist"},
                {key:"pitchType",  label:"Pitch"},
                {key:"pitcherName",label:"Pitcher"},
                {key:"gameId",     label:"Game"},
                {key:"video",      label:"📹"},
              ].map(c => (
                <th key={c.key} className={sortKey===c.key?"sk":""} onClick={()=>hs(c.key)}
                  style={{cursor:"pointer",whiteSpace:"normal",wordBreak:"break-word",
                    fontSize:9,lineHeight:1.2,padding:"5px 5px",textAlign:"center",verticalAlign:"bottom"}}>
                  {c.label}{sortKey===c.key && <span style={{color:"var(--accent)"}}>{sortDir<0?"↓":"↑"}</span>}
                </th>
              ))}
            </tr></thead>
            <tbody>
              {sorted.map((hr, i) => {
                const badgeCls = hr.rbi===4?"slam":hr.rbi>=2?"multi":"solo";
                const evC = (hr.exitVelo||0)>=103?"dng":(hr.exitVelo||0)>=95?"hot":(hr.exitVelo||0)>=90?"warm":"avg";
                const distC = (hr.distance||0)>=440?"dng":(hr.distance||0)>=420?"hot":(hr.distance||0)>=400?"warm":"avg";
                const cachedHR = getCachedPlayer(hr.batterId)?.hr || 0;
                const todayNum = hrRankMap[`${hr.batterId}_${hr.gamePk}_${hr.atBatIndex||hr.playIndex||hr.plateAppearance||0}`] || 1;
                const seasonNum = cachedHR > 0 ? cachedHR + todayNum : todayNum;
                const videoUrl = VIDEO_LINK_CACHE[`${hr.gamePk}_${hr.atBatIndex}`]
                  || VIDEO_LINK_CACHE[`${hr.gamePk}_${hr.batterId}`]
                  || VIDEO_LINK_CACHE[hr.playId]
                  || VIDEO_LINK_CACHE[hr.uuid];
                return <tr key={i} style={{height:26}}>
                <td style={{padding:"1px 3px"}}><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:10,color:i<3?"var(--accent)":"var(--muted)"}}>{sorted.length - i}</span></td>
                <td style={{padding:"1px 3px",whiteSpace:"nowrap"}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"var(--text)",whiteSpace:"nowrap"}}>{hr.timeET&&hr.timeET!==""?hr.timeET:`I${hr.inning}`}</span></td>
                <td style={{padding:"1px 3px"}}><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:10,color:"var(--text)"}}>{hr.batterTeam}</span></td>
                <td style={{padding:"1px 3px",whiteSpace:"nowrap"}}><div style={{display:"flex",alignItems:"center",gap:3}}><PlayerAvatar pid={hr.batterId} name={hr.batterName} size={18}/><span className="pn" style={{fontSize:10,whiteSpace:"nowrap",...(isKeyMatchup(hr.batterId,hr.batterName)?{color:"#ff8020",fontWeight:700}:{})}}>{hr.batterName}</span><InjuryBadge pid={hr.batterId} name={hr.batterName}/></div></td>
                <td style={{padding:"1px 3px"}}><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:10,color:"var(--accent)"}}>{seasonNum}</span></td>
                <td style={{padding:"1px 3px",whiteSpace:"nowrap"}}><span className={`hr-badge ${badgeCls}`} style={{fontSize:8,padding:"1px 4px",whiteSpace:"nowrap"}}>{hr.hrType}</span></td>
                <td style={{padding:"1px 3px"}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:9}}>{hr.halfInning==="top"?"▲":"▼"}{hr.inning}</span></td>
                <td style={{padding:"1px 3px"}}><span className={`sv ${hr.launchAngle>=25&&hr.launchAngle<=35?"good":"avg"}`} style={{fontSize:9}}>{hr.launchAngle!=null?`${hr.launchAngle}°`:"—"}</span></td>
                <td style={{padding:"1px 3px"}}><span className={`sv ${evC}`} style={{fontSize:9}}>{hr.exitVelo!=null?`${hr.exitVelo}`:"—"}</span></td>
                <td style={{padding:"1px 3px"}}><span className={`sv ${distC}`} style={{fontSize:9}}>{hr.distance!=null?`${hr.distance}ft`:"—"}</span></td>
                <td style={{padding:"1px 3px"}}>{hr.pitchType?<span style={{fontSize:8,fontFamily:"'DM Mono',monospace",padding:"1px 4px",borderRadius:3,background:"var(--surface2)",border:"1px solid var(--border)",whiteSpace:"nowrap"}}>{hr.pitchType}</span>:"—"}</td>
                <td style={{padding:"1px 3px",whiteSpace:"nowrap"}}><span style={{fontSize:9}}>{hr.pitcherName}</span></td>
                <td style={{padding:"1px 3px",whiteSpace:"nowrap"}}><span style={{fontSize:8,fontFamily:"'DM Mono',monospace",color:"var(--muted)",whiteSpace:"nowrap"}}>{hr.awayAbbr&&hr.homeAbbr?`${hr.awayAbbr}@${hr.homeAbbr}`:hr.gameId}</span></td>
                <td style={{textAlign:"center",padding:"1px 2px"}}>
                  {videoUrl ? <a href={videoUrl} target="_blank" rel="noopener noreferrer"
                    onClick={e=>e.stopPropagation()} title="Watch HR video"
                    style={{fontSize:12,textDecoration:"none",display:"block",textAlign:"center"}}>📹</a> : null}
                </td>
                </tr>;
              })}
            </tbody>
          </table></div>
    }
  </div>;
}



// Batters who made HR-quality contact in last 7 days but got nothing — reads from mlb_atbat_log_last7.csv
// ── HR Season Leaderboard ─────────────────────────────────────────────────────
function HRLeaderboardTab() {
  const [rows,    setRows]    = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error,   setError]   = React.useState(null);
  const [sort,    setSortCol] = React.useState('hrs');
  const [sortDir, setSortDir] = React.useState(1);
  const [search,  setSearch]  = React.useState('');
  const [teamFilter, setTeamFilter] = React.useState('ALL');
  const [expPid,  setExpPid]  = React.useState(null);
  const [statCards, setStatCards] = React.useState({ total:0, longDist:null, longEV:null });
  const mono = "'DM Mono',monospace", osw = "'Oswald',sans-serif";
  const SEASON_START = '2026-03-25';
  const ABBR = {108:'LAA',109:'AZ',110:'BAL',111:'BOS',112:'CHC',113:'CIN',114:'CLE',115:'COL',116:'DET',117:'HOU',118:'KC',119:'LAD',120:'WSH',121:'NYM',133:'ATH',134:'PIT',135:'SD',136:'SEA',137:'SF',138:'STL',139:'TB',140:'TEX',141:'TOR',142:'MIN',143:'PHI',144:'ATL',145:'CWS',146:'MIA',147:'NYY',158:'MIL'};

  React.useEffect(() => {
    const season = new Date().getFullYear();
    const today  = new Date().toISOString().slice(0,10);

    // ── ALL batters season hitting stats — paginated, no cap ────────────────
    // Uses /api/v1/stats with playerPool=ALL which supports real offset pagination.
    // Each page = 500 players. Stops when page returns fewer than 500.
    // Filters to only batters with HR > 0 for the leaderboard rows,
    // but sums ALL HRs across every batter for the true league total.
    const leadersPromise = (async () => {
      const map = {};
      let offset = 0; let leagueTotalHRs = 0;
      while (true) {
        const url = `https://statsapi.mlb.com/api/v1/stats?stats=season&group=hitting&gameType=R&season=${season}&sportId=1&playerPool=ALL&startDate=${season}-03-25&endDate=${today}&limit=500&offset=${offset}&hydrate=person,team`;
        const d = await fetch(url).then(r=>r.json()).catch(()=>null);
        const splits = d?.stats?.[0]?.splits || [];
        splits.forEach(s => {
          const hrs = parseInt(s.stat?.homeRuns || 0);
          leagueTotalHRs += hrs;
          if (hrs < 1) return;   // skip 0-HR batters from leaderboard rows
          const pid = s.player?.id; if (!pid) return;
          const teamAbbr = ABBR[s.team?.id] || s.team?.abbreviation || '';
          map[pid] = { pid, name: s.player?.fullName||'', team: teamAbbr,
            hrs, laser105:0, laser110:0, hh105:0, hh110:0 };
        });
        if (splits.length < 500) break;   // last page
        offset += 500;
      }
      map._leagueTotalHRs = leagueTotalHRs;
      return map;
    })();
    const logPromise = fetch('/data/mlb_atbat_log_full.csv')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then(text => {
        const evMap = {};
        const parsed = parseCSVText(text);
        parsed.forEach(r => {
          let cmp = r['Date'] || '';
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cmp)) {
            const [m,d,y] = cmp.split('/');
            cmp = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
          }
          if (cmp < SEASON_START) return;
          const pid = parseInt(r['Batter'] || 0); if (!pid) return;
          const ev   = parseFloat(r['Exit Velocity']) || 0;
          const isHR = parseInt(r['Is Home Run'] || 0) === 1;
          if (!evMap[pid]) evMap[pid] = { laser105:0, laser110:0, hh105:0, hh110:0 };
          const m = evMap[pid];
          if (isHR) {
            if (ev>=105) m.laser105++; if (ev>=110) m.laser110++;
            const dist = parseFloat(r['Hit Distance']) || 0;
            if (dist > 0 && (!evMap._longDist || dist > evMap._longDist.dist))
              evMap._longDist = { pid, dist, ev };
            if (ev > 0 && (!evMap._longEV || ev > evMap._longEV.ev))
              evMap._longEV = { pid, ev, dist: parseFloat(r['Hit Distance'])||0 };
          }
          if (ev>=105) m.hh105++; if (ev>=110) m.hh110++;
        });
        return evMap;
      });
    Promise.all([leadersPromise, logPromise])
      .then(([leaderMap, evMap]) => {
        const out = Object.values(leaderMap).filter(r => r.hrs >= 1)
          .map(r => { const ev = evMap[r.pid] || {}; return { ...r, laser105:ev.laser105||0, laser110:ev.laser110||0, hh105:ev.hh105||0, hh110:ev.hh110||0 }; })
          .sort((a,b) => b.hrs - a.hrs).map((r,i) => ({ ...r, rank: i+1 }));
        // Stat cards
        const total = leaderMap._leagueTotalHRs || out.reduce((s,r)=>s+r.hrs,0);
        const longDistPid = evMap._longDist?.pid;
        const longEVPid   = evMap._longEV?.pid;
        const findName = pid => out.find(r=>r.pid===pid)?.name || `#${pid}`;
        const findTeam = pid => out.find(r=>r.pid===pid)?.team || '';
        setStatCards({
          total,
          longDist: evMap._longDist ? { name: findName(longDistPid), team: findTeam(longDistPid), dist: evMap._longDist.dist } : null,
          longEV:   evMap._longEV   ? { name: findName(longEVPid),   team: findTeam(longEVPid),   ev:   evMap._longEV.ev   } : null,
        });
        setRows(out); setLoading(false);
      }).catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const hs = col => { if (sort===col) setSortDir(d=>-d); else { setSortCol(col); setSortDir(1); } };
  const teams = ['ALL', ...Array.from(new Set(rows.map(r=>r.team).filter(Boolean))).sort()];
  const sorted = [...rows]
    .filter(r => {
      if (teamFilter !== 'ALL' && r.team !== teamFilter) return false;
      if (search) { const q=search.toLowerCase(); if (!r.name.toLowerCase().includes(q) && !r.team.toLowerCase().includes(q)) return false; }
      return true;
    })
    .sort((a,b) => sortDir * ((b[sort]||0)-(a[sort]||0)));

  const Th = ({col, label, tip}) => (
    <th title={tip} onClick={() => hs(col)}
      style={{padding:'5px 6px',fontSize:7,fontFamily:mono,textTransform:'uppercase',letterSpacing:.6,
        whiteSpace:'nowrap',cursor:'pointer',textAlign:'right',
        color:sort===col?'var(--accent2)':'var(--muted)',borderBottom:'1px solid var(--border)',
        background:'var(--surface2)',position:'sticky',top:0,zIndex:10}}>
      {label}{sort===col?(sortDir===1?' ▼':' ▲'):''}
    </th>
  );

  if (loading) return <div style={{display:'flex',alignItems:'center',gap:8,padding:20,color:'var(--muted)',fontFamily:mono,fontSize:11}}><div className="sp"/> Loading season HR leaderboard…</div>;
  if (error)   return <div style={{padding:20,color:'var(--accent)',fontFamily:mono,fontSize:11}}>⚠ {error}</div>;

  return (
    <div>
      {/* ── Stat Cards ── */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        {/* Total HRs */}
        <div style={{flex:'1 1 100px',minWidth:100,background:'var(--surface2)',borderRadius:8,
          border:'1px solid var(--border)',padding:'10px 14px',display:'flex',
          flexDirection:'column',gap:2}}>
          <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)',textTransform:'uppercase',
            letterSpacing:.8}}>2026 Total HRs</div>
          <div style={{fontFamily:osw,fontWeight:800,fontSize:28,color:'var(--accent)',
            lineHeight:1}}>{statCards.total.toLocaleString()}</div>
          <div style={{fontFamily:mono,fontSize:8,color:'rgba(255,255,255,.25)'}}>season to date</div>
        </div>
        {/* Longest Distance */}
        <div style={{flex:'2 1 160px',minWidth:160,background:'var(--surface2)',borderRadius:8,
          border:'1px solid var(--border)',padding:'10px 14px',display:'flex',
          flexDirection:'column',gap:2}}>
          <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)',textTransform:'uppercase',
            letterSpacing:.8}}>📏 Longest HR</div>
          {statCards.longDist ? <>
            <div style={{fontFamily:osw,fontWeight:800,fontSize:22,color:'#f5a623',lineHeight:1}}>
              {statCards.longDist.dist.toFixed(0)} ft
            </div>
            <div style={{fontFamily:mono,fontSize:9,color:'var(--text)',marginTop:1}}>
              {statCards.longDist.name}
              {statCards.longDist.team ? <span style={{color:'var(--muted)',marginLeft:4,fontSize:8}}>{statCards.longDist.team}</span> : null}
            </div>
          </> : <div style={{fontFamily:mono,fontSize:10,color:'var(--muted)'}}>Loading…</div>}
        </div>
        {/* Highest EV */}
        <div style={{flex:'2 1 160px',minWidth:160,background:'var(--surface2)',borderRadius:8,
          border:'1px solid var(--border)',padding:'10px 14px',display:'flex',
          flexDirection:'column',gap:2}}>
          <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)',textTransform:'uppercase',
            letterSpacing:.8}}>⚡ Hardest Hit HR</div>
          {statCards.longEV ? <>
            <div style={{fontFamily:osw,fontWeight:800,fontSize:22,color:'#ff4020',lineHeight:1}}>
              {statCards.longEV.ev.toFixed(1)} mph
            </div>
            <div style={{fontFamily:mono,fontSize:9,color:'var(--text)',marginTop:1}}>
              {statCards.longEV.name}
              {statCards.longEV.team ? <span style={{color:'var(--muted)',marginLeft:4,fontSize:8}}>{statCards.longEV.team}</span> : null}
            </div>
          </> : <div style={{fontFamily:mono,fontSize:10,color:'var(--muted)'}}>Loading…</div>}
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,flexWrap:'wrap'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search batter or team…"
          style={{padding:'3px 10px',borderRadius:6,border:'1px solid var(--border)',background:'var(--surface2)',
            color:'var(--text)',fontFamily:mono,fontSize:10,outline:'none',minWidth:160}}/>
        <select value={teamFilter} onChange={e=>setTeamFilter(e.target.value)}
          style={{padding:'3px 8px',borderRadius:6,border:'1px solid var(--border)',background:'var(--surface2)',
            color:'var(--text)',fontFamily:mono,fontSize:10,cursor:'pointer'}}>
          {teams.map(t=><option key={t} value={t}>{t==='ALL'?'All Teams':t}</option>)}
        </select>
        <div style={{fontFamily:mono,fontSize:9,color:'var(--muted)',marginLeft:'auto'}}>
          {sorted.length} batters · 2026 season · tap row to expand
        </div>
      </div>
      <div className="tw">
        <table style={{width:'100%'}}>
          <thead><tr>
            <th onClick={()=>hs('rank')} style={{padding:'5px 6px',fontSize:7,fontFamily:mono,textTransform:'uppercase',letterSpacing:.6,
              color:sort==='rank'?'var(--accent2)':'var(--muted)',cursor:'pointer',textAlign:'left',whiteSpace:'nowrap',
              borderBottom:'1px solid var(--border)',background:'var(--surface2)',position:'sticky',top:0,zIndex:10}}>
              #{sort==='rank'?(sortDir===1?' ▼':' ▲'):''}
            </th>
            <th style={{padding:'5px 6px',fontSize:7,fontFamily:mono,textTransform:'uppercase',letterSpacing:.6,
              color:'var(--muted)',textAlign:'left',whiteSpace:'nowrap',borderBottom:'1px solid var(--border)',
              background:'var(--surface2)',position:'sticky',top:0,zIndex:10}}>Batter</th>
            <Th col="hrs"      label="💥 HR"    tip="Total home runs this season"/>
            <Th col="laser105" label="💣 105+"  tip="HRs hit at 105+ mph exit velocity"/>
            <Th col="laser110" label="🔥 110+"  tip="HRs hit at 110+ mph exit velocity"/>
            <Th col="hh105"    label="💪 HH 105" tip="All batted balls 105+ mph"/>
            <Th col="hh110"    label="⚡ HH 110" tip="All batted balls 110+ mph"/>
          </tr></thead>
          <tbody>
            {sorted.map((r,i) => [
              (<tr key={r.pid} onClick={()=>setExpPid(v=>v===r.pid?null:r.pid)}
                style={{cursor:'pointer',height:28,borderBottom:'1px solid rgba(255,255,255,.04)',
                  background:expPid===r.pid?'rgba(255,255,255,.04)':isKeyMatchup(r.pid,r.name)?'rgba(255,130,32,.05)':'transparent'}}>
                <td style={{padding:'2px 6px',fontFamily:osw,fontWeight:700,fontSize:10,
                  color:r.rank<=3?'var(--accent2)':'var(--muted)',whiteSpace:'nowrap'}}>
                  {r.rank<=3?['🥇','🥈','🥉'][r.rank-1]:r.rank}
                </td>
                <td onClick={e=>{e.stopPropagation();openAtBatSlide({pid:r.pid,name:r.name,team:r.team});}} style={{padding:'2px 5px',maxWidth:170,cursor:'pointer'}}>
                  <div style={{display:'flex',alignItems:'center',gap:4,overflow:'hidden'}}>
                    <PlayerAvatar pid={r.pid} name={r.name} size={16}/>
                    <span style={{fontFamily:mono,fontSize:8,fontWeight:700,color:'var(--accent2)',whiteSpace:'nowrap',flexShrink:0}}>{r.team}</span>
                    <span style={{fontFamily:osw,fontWeight:700,fontSize:10,color:isKeyMatchup(r.pid,r.name)?'#ff8020':'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.name}</span>
                    <span onClick={e=>e.stopPropagation()} style={{flexShrink:0}}><PickButton pid={r.pid} name={r.name} team={r.team}/></span>
                  <FormBadge formKey={r._formClass}/>
                  </div>
                </td>
                <td style={{padding:'2px 6px',textAlign:'right'}}>
                  <span style={{fontFamily:osw,fontWeight:800,fontSize:13,color:r.hrs>=20?'var(--accent)':r.hrs>=12?'#f5a623':'var(--text)'}}>{r.hrs}</span>
                </td>
                <td style={{padding:'2px 6px',textAlign:'right'}}>
                  <span style={{fontFamily:osw,fontWeight:700,fontSize:11,color:r.laser105>0?'#ff8020':'var(--muted)'}}>{r.laser105||'—'}</span>
                </td>
                <td style={{padding:'2px 6px',textAlign:'right'}}>
                  <span style={{fontFamily:osw,fontWeight:700,fontSize:11,color:r.laser110>0?'#ff3010':'var(--muted)'}}>{r.laser110||'—'}</span>
                </td>
                <td style={{padding:'2px 6px',textAlign:'right'}}>
                  <span style={{fontFamily:osw,fontWeight:700,fontSize:11,color:r.hh105>=40?'#38b8f2':r.hh105>=20?'#27c97a':'var(--text)'}}>{r.hh105||'—'}</span>
                </td>
                <td style={{padding:'2px 6px',textAlign:'right'}}>
                  <span style={{fontFamily:osw,fontWeight:700,fontSize:11,color:r.hh110>=8?'#27c97a':'var(--text)'}}>{r.hh110||'—'}</span>
                </td>
              </tr>),
              expPid===r.pid && (
                <tr key={r.pid+'x'}><td colSpan={7} style={{padding:'0 10px 10px',background:'rgba(255,255,255,.02)'}}>
                  <Last7HRChart batterId={r.pid}/><RecentGameLog batterId={r.pid}/>
                </td></tr>
              )
            ])}
          </tbody>
        </table>
      </div>
      <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)',marginTop:8,lineHeight:1.6}}>
        HR = MLB official season total · 💣🔥 Laser = HR at EV threshold · 💪⚡ HH = any batted ball at EV threshold
      </div>
    </div>
  );
}

function HotBatsTab() {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [expPid, setExpPid]  = useState(null);
  const [sort, setSort]      = useState('l7hr');
  const [sortDir, setSortDir] = useState(1);
  const [teamFilter, setTeamFilter] = useState('ALL');
  const mono = "'DM Mono',monospace", osw = "'Oswald',sans-serif";

  useEffect(() => {
    const ABBR={108:'LAA',109:'AZ',110:'BAL',111:'BOS',112:'CHC',113:'CIN',114:'CLE',115:'COL',116:'DET',117:'HOU',118:'KC',119:'LAD',120:'WSH',121:'NYM',133:'ATH',134:'PIT',135:'SD',136:'SEA',137:'SF',138:'STL',139:'TB',140:'TEX',141:'TOR',142:'MIN',143:'PHI',144:'ATL',145:'CWS',146:'MIA',147:'NYY',158:'MIL'};
    const season = new Date().getFullYear();
    fetch(`https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=homeRuns&season=${season}&sportId=1&limit=150`)
      .then(r => r.json())
      .then(async d => {
        const leaders = d.leagueLeaders?.[0]?.leaders || [];
        const out = await Promise.all(leaders.slice(0, 80).map(async l => {
          const pid = l.person?.id; if (!pid) return null;
          try {
            const games = await fetchGameLog(pid);
            const l7 = games.slice(-7);
            const l7hr = l7.reduce((s,g) => s+(g.hrs||0), 0);
            let abSince = 0;
            for (let i=games.length-1;i>=0;i--) { if(games[i].hrs>0) break; abSince+=games[i].ab||0; }
            const totAB = games.reduce((s,g)=>s+(g.ab||0),0);
            const totHR = games.reduce((s,g)=>s+(g.hrs||0),0);
            return { pid, name:l.person?.fullName||'', team:ABBR[l.team?.id]||l.team?.abbreviation||l.team?.name?.replace(/^.* /,'')||'',
              seasonHR:parseInt(l.value||0), l7hr, abhr:totHR>0?(totAB/totHR).toFixed(1):null, abSince };
          } catch { return null; }
        }));
        setRows(out.filter(r => r && r.l7hr > 0));
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const teams_hb = ['ALL', ...Array.from(new Set(rows.map(p=>p.team).filter(Boolean))).sort()];
  const sorted = [...rows].filter(p => teamFilter==='ALL' || p.team===teamFilter).sort((a,b) => sortDir * ((parseFloat(b[sort])||0)-(parseFloat(a[sort])||0)));
  const Th = ({k,l,wrap}) => (<th onClick={()=>{ if(sort===k) setSortDir(d=>-d); else { setSort(k); setSortDir(-1); } }}
    style={{padding:'5px 8px',fontSize:8,fontFamily:mono,textTransform:'uppercase',letterSpacing:.8,
      color:sort===k?'var(--accent2)':'var(--muted)',cursor:'pointer',textAlign:'right',
      whiteSpace:wrap?'normal':'nowrap',lineHeight:1.3,maxWidth:wrap?36:undefined,
      borderBottom:'1px solid var(--border)'}}>{l}{sort===k?(sortDir===-1?' ▼':' ▲'):''}</th>);

  if (loading) return (<div style={{display:'flex',alignItems:'center',gap:8,padding:20,color:'var(--muted)',fontFamily:mono,fontSize:11}}><div className="sp"/>Loading…</div>);
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,flexWrap:'wrap'}}>
        <div style={{fontFamily:mono,fontSize:9,color:'var(--muted)'}}>{sorted.length} batters · tap row to expand</div>
        <select value={teamFilter} onChange={e=>setTeamFilter(e.target.value)}
          style={{marginLeft:'auto',padding:'3px 8px',borderRadius:6,fontSize:10,fontFamily:mono,
            border:'1px solid var(--border)',background:'var(--surface2)',color:'var(--text)',cursor:'pointer'}}>
          {teams_hb.map(t=><option key={t} value={t}>{t==='ALL'?'All Teams':t}</option>)}
        </select>
      </div>
      <div className="tw">
        <table style={{width:'100%'}}>
          <thead><tr>
            <th style={{padding:'5px 8px',fontSize:8,fontFamily:mono,textTransform:'uppercase',letterSpacing:.8,color:'var(--muted)',textAlign:'left'}}>TM</th>
            <th style={{padding:'5px 8px',fontSize:8,fontFamily:mono,textTransform:'uppercase',letterSpacing:.8,color:'var(--muted)',textAlign:'left'}}>Batter</th>
            <Th k="l7hr"     l="💥 L7"/>
            <Th k="seasonHR" l="Season"/>
            <Th k="abhr"     l="AB/HR"/>
            <Th k="abSince" l="AB Since" wrap/>
          </tr></thead>
          <tbody>
            {sorted.map(p => [
              (<tr key={p.pid} onClick={()=>setExpPid(v=>v===p.pid?null:p.pid)}
                style={{cursor:'pointer',height:28,borderBottom:'1px solid rgba(255,255,255,.04)',
                  background:expPid===p.pid?'rgba(255,255,255,.04)':'transparent'}}>
                <td style={{padding:'2px 6px',fontFamily:osw,fontWeight:700,fontSize:9,color:'var(--accent2)',whiteSpace:'nowrap'}}>{p.team}</td>
                <td onClick={e=>{e.stopPropagation();openAtBatSlide({pid:p.pid,name:p.name,team:p.team});}} style={{padding:'2px 6px',maxWidth:160,cursor:'pointer'}}>
                  <div style={{display:'flex',alignItems:'center',gap:4,overflow:'hidden'}}>
                    <PlayerAvatar pid={p.pid} name={p.name} size={16}/>
                    <span style={{fontFamily:osw,fontWeight:700,fontSize:10,color:isKeyMatchup(p.pid,p.name)?'#ff8020':'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</span>
                    <span onClick={e=>e.stopPropagation()} style={{flexShrink:0}}><PickButton pid={p.pid} name={p.name} team={p.team}/></span>
                  </div>
                </td>
                <td style={{padding:'2px 6px',textAlign:'right'}}><span style={{fontFamily:osw,fontWeight:800,fontSize:12,color:p.l7hr>=3?'#ff4020':p.l7hr>=2?'#f5a623':'#27c97a'}}>{p.l7hr}</span></td>
                <td style={{padding:'2px 6px',textAlign:'right',fontFamily:mono,fontSize:9}}>{p.seasonHR}</td>
                <td style={{padding:'2px 6px',textAlign:'right',fontFamily:mono,fontSize:9,color:'var(--muted)'}}>{p.abhr||'—'}</td>
                <td style={{padding:'2px 6px',textAlign:'right',fontFamily:mono,fontSize:9,color:p.abSince>20?'var(--ice)':p.abSince>10?'var(--muted)':'#27c97a'}}>{p.abSince}</td>
              </tr>),
              expPid===p.pid && (<tr key={p.pid+'x'}><td colSpan={6} style={{padding:'0 10px 10px',background:'rgba(255,255,255,.02)'}}>
                <Last7HRChart batterId={p.pid}/>
                <RecentGameLog batterId={p.pid}/>
              </td></tr>)
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Heating Up Tab ────────────────────────────────────────────────────────────
function HeatingUpTab() {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [expPid, setExpPid]  = useState(null);
  const [sort, setSort]      = useState('avgEV');
  const [sortDir, setSortDir] = useState(1);
  const [teamFilter, setTeamFilter] = useState('ALL');
  const mono = "'DM Mono',monospace", osw = "'Oswald',sans-serif";

  useEffect(() => {
    const all = Object.values(PLAYER_DATA_CACHE).filter(p => {
      const w = p.windows?.last7;
      return w && (w.pa||0) >= 10 && (w.avgEV||0) >= 85;
    });
    const built = all.map(p => {
      const w = p.windows?.last7 || {};
      const avgEV=w.avgEV||0, hh=w.hardHit||0, fb=w.flyBall||0, barrel=w.barrel||0;
      // Use GAME_LOG_CACHE for L7 HR — same source as HotBatsTab (players.json window is stale)
      const gl7 = GAME_LOG_CACHE[String(p.pid)]?.games;
      const l7hr = gl7 ? gl7.slice(-7).reduce((s,g)=>s+(g.hrs||0),0) : (w.hr||0);
      const heatScore = avgEV*0.35 + hh*0.25 + fb*0.20 + barrel*0.20;
      const seasonHR = p.windows?.season2026?.hr || 0;
      const totAB = p.windows?.season2026?.ab || 0;
      const abhr = seasonHR>0 ? (totAB/seasonHR).toFixed(1) : null;
      const gl = GAME_LOG_CACHE[String(p.pid)];
      const glGames = gl?.games;
      let abSince = null;
      if (glGames) { abSince=0; for(let i=glGames.length-1;i>=0;i--){if(glGames[i].hrs>0)break;abSince+=glGames[i].ab||0;} }
      return { pid:p.pid, name:p.name, team:p.team||'', avgEV, hh, fb, barrel, l7hr, seasonHR, abhr, abSince, heatScore };
    }).filter(r => r.avgEV >= 88);
    setRows(built);
    setLoading(false);
  }, []);

  const teams_hu = ['ALL', ...Array.from(new Set(rows.map(p=>p.team).filter(Boolean))).sort()];
  const sorted = [...rows].filter(p => teamFilter==='ALL' || p.team===teamFilter).sort((a,b) => sortDir * ((parseFloat(b[sort])||0)-(parseFloat(a[sort])||0)));
  const evCol = v => v>=103?'#ff4020':v>=98?'#ff8020':v>=95?'#f5a623':v>=90?'var(--text)':'var(--muted)';
  const Th = ({k,l}) => (<th onClick={()=>{ if(sort===k) setSortDir(d=>-d); else { setSort(k); setSortDir(-1); } }}
    style={{padding:'5px 6px',fontSize:7,fontFamily:mono,textTransform:'uppercase',letterSpacing:.6,
      color:sort===k?'var(--accent2)':'var(--muted)',cursor:'pointer',textAlign:'right',
      whiteSpace:'nowrap',borderBottom:'1px solid var(--border)',background:'var(--surface2)',position:'sticky',top:0,zIndex:10}}>{l}{sort===k?(sortDir===-1?' ▼':' ▲'):''}</th>);

  if (loading) return (<div style={{display:'flex',alignItems:'center',gap:8,padding:20,color:'var(--muted)',fontFamily:mono,fontSize:11}}><div className="sp"/>Computing…</div>);
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,flexWrap:'wrap'}}>
        <div style={{fontFamily:mono,fontSize:9,color:'var(--muted)'}}>{sorted.length} batters · last 7 games · tap row to expand</div>
        <select value={teamFilter} onChange={e=>setTeamFilter(e.target.value)}
          style={{marginLeft:'auto',padding:'3px 8px',borderRadius:6,fontSize:10,fontFamily:mono,
            border:'1px solid var(--border)',background:'var(--surface2)',color:'var(--text)',cursor:'pointer'}}>
          {teams_hu.map(t=><option key={t} value={t}>{t==='ALL'?'All Teams':t}</option>)}
        </select>
      </div>
      <div className="tw">
        <table style={{width:'100%'}}>
          <thead><tr>
            <th style={{padding:'5px 6px',fontSize:7,fontFamily:mono,textTransform:'uppercase',letterSpacing:.6,color:'var(--muted)',textAlign:'left'}}>TM</th>
            <th style={{padding:'5px 6px',fontSize:7,fontFamily:mono,textTransform:'uppercase',letterSpacing:.6,color:'var(--muted)',textAlign:'left'}}>Batter</th>
            <Th k="avgEV"    l="Avg EV"/>
            <Th k="hh"       l="HH%"/>
            <Th k="fb"       l="FB%"/>
            <Th k="barrel"   l="Brl%"/>
            <Th k="l7hr"     l="💥 L7"/>
            <Th k="seasonHR" l="HR"/>
            <Th k="abhr"     l="AB/HR"/>
            <Th k="abSince"  l="AB Since"/>
          </tr></thead>
          <tbody>
            {sorted.map(p => [
              (<tr key={p.pid} onClick={()=>setExpPid(v=>v===p.pid?null:p.pid)}
                style={{cursor:'pointer',height:28,borderBottom:'1px solid rgba(255,255,255,.04)',
                  background:expPid===p.pid?'rgba(255,255,255,.04)':'transparent'}}>
                <td style={{padding:'2px 5px',fontFamily:osw,fontWeight:700,fontSize:9,color:'var(--accent2)',whiteSpace:'nowrap'}}>{p.team}</td>
                <td onClick={e=>{e.stopPropagation();openAtBatSlide({pid:p.pid,name:p.name,team:p.team});}} style={{padding:'2px 5px',maxWidth:150,cursor:'pointer'}}>
                  <div style={{display:'flex',alignItems:'center',gap:4,overflow:'hidden'}}>
                    <PlayerAvatar pid={p.pid} name={p.name} size={16}/>
                    <span style={{fontFamily:osw,fontWeight:700,fontSize:10,color:isKeyMatchup(p.pid,p.name)?'#ff8020':'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</span>
                    <span onClick={e=>e.stopPropagation()} style={{flexShrink:0}}><PickButton pid={p.pid} name={p.name} team={p.team}/></span>
                  </div>
                </td>
                <td style={{padding:'2px 5px',textAlign:'right',fontFamily:osw,fontWeight:700,fontSize:11,color:evCol(p.avgEV)}}>{p.avgEV.toFixed(1)}</td>
                <td style={{padding:'2px 5px',textAlign:'right',fontFamily:mono,fontSize:9}}>{p.hh.toFixed(1)}%</td>
                <td style={{padding:'2px 5px',textAlign:'right',fontFamily:mono,fontSize:9}}>{p.fb.toFixed(1)}%</td>
                <td style={{padding:'2px 5px',textAlign:'right',fontFamily:mono,fontSize:9}}>{p.barrel.toFixed(1)}%</td>
                <td style={{padding:'2px 5px',textAlign:'right'}}><span style={{fontFamily:osw,fontWeight:700,fontSize:11,color:p.l7hr>=3?'#ff4020':p.l7hr>=1?'#f5a623':'rgba(255,255,255,.2)'}}>{p.l7hr||'—'}</span></td>
                <td style={{padding:'2px 5px',textAlign:'right',fontFamily:mono,fontSize:9}}>{p.seasonHR||'—'}</td>
                <td style={{padding:'2px 5px',textAlign:'right',fontFamily:mono,fontSize:9,color:'var(--muted)'}}>{p.abhr||'—'}</td>
                <td style={{padding:'2px 5px',textAlign:'right',fontFamily:mono,fontSize:9,color:p.abSince!=null?(p.abSince>20?'var(--ice)':p.abSince>10?'var(--muted)':'#27c97a'):'rgba(255,255,255,.2)'}}>{p.abSince!=null?p.abSince:'—'}</td>
              </tr>),
              expPid===p.pid && (<tr key={p.pid+'x'}><td colSpan={10} style={{padding:'0 10px 10px',background:'rgba(255,255,255,.02)'}}>
                <Last7HRChart batterId={p.pid}/>
                <RecentGameLog batterId={p.pid}/>
              </td></tr>)
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MLBScoresTab() {
  return <div style={{margin:"-16px"}}>
    <iframe
      title="MLB Scores"
      src="https://www.mlb.com/scores"
      frameBorder="0"
      allowFullScreen
      style={{width:"125%",height:"calc((100vh - 48px) * 1.25)",border:"none",display:"block",
        transform:"scale(0.8)",transformOrigin:"top left"}}
    />
    <div style={{padding:"8px 14px",borderTop:"1px solid var(--border)",
      display:"flex",justifyContent:"flex-end",background:"var(--surface)"}}>
      <a href="https://www.mlb.com/scores" target="_blank" rel="noopener noreferrer"
        style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:6,
          background:"var(--accent)",color:"white",fontFamily:"'Oswald',sans-serif",
          fontWeight:700,fontSize:12,letterSpacing:1,textDecoration:"none"}}>
        ↗ Open in New Tab
      </a>
    </div>
  </div>;
}

function OnlyHomersTab() {
  return <div style={{margin:"-16px"}}>
    {/* iframe — scaled 80% like Doink, full height */}
    <iframe
      title="Only Homers"
      src="https://www.onlyhomers.com/"
      frameBorder="0"
      allowFullScreen
      style={{width:"125%",height:"calc((100vh - 48px) * 1.25)",border:"none",display:"block",
        transform:"scale(0.8)",transformOrigin:"top left"}}
    />
    {/* Open in new tab below frame */}
    <div style={{padding:"8px 14px",borderTop:"1px solid var(--border)",
      display:"flex",justifyContent:"flex-end",background:"var(--surface)"}}>
      <a href="https://www.onlyhomers.com/" target="_blank" rel="noopener noreferrer"
        style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:6,
          background:"var(--accent)",color:"white",fontFamily:"'Oswald',sans-serif",
          fontWeight:700,fontSize:12,letterSpacing:1,textDecoration:"none"}}>
        ↗ Open in New Tab
      </a>
    </div>
  </div>;
}

function LiveSportsTab() {
  const [tried, setTried] = useState(false);
  return <div>

    {/* Primary: try embedding with all bypass attributes */}
    <div style={{borderRadius:10,overflow:"hidden",border:"1px solid var(--border)",
      background:"var(--surface)",position:"relative",paddingBottom:"78%",height:0,marginBottom:12}}>
      <iframe
        title="Live Sports"
        src="https://thetvapp.to"
        frameBorder="0"
        allowFullScreen
        scrolling="yes"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
        referrerPolicy="no-referrer"
        style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
        onLoad={()=>setTried(true)}
        onError={()=>setTried(true)}
      />
      {/* Overlay that shows if iframe is blocked */}
      {tried && <div style={{
        position:"absolute",inset:0,display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",
        background:"var(--surface)",pointerEvents:"none",
        opacity:0 // hidden by default — only shows if iframe renders blank
      }}>
        <span style={{fontSize:40,marginBottom:12}}>📺</span>
        <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:18,marginBottom:8}}>Site blocked embed</div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"var(--muted)",textAlign:"center",maxWidth:280}}>
          Use the button below to open in a new tab
        </div>
      </div>}
    </div>

    {/* Always-visible launch button */}
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
      <a href="https://thetvapp.to" target="_blank" rel="noopener noreferrer"
        style={{display:"inline-flex",alignItems:"center",gap:8,
          padding:"12px 28px",borderRadius:10,
          background:"var(--accent)",color:"white",
          fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:16,
          letterSpacing:1,textDecoration:"none",
          boxShadow:"0 4px 20px rgba(232,65,26,.3)"}}>
        📺 Open Live Sports
      </a>
      <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textAlign:"center"}}>
        Opens thetvapp.to · If the frame above is blank, the site blocks embeds — use this button instead
      </div>
    </div>
  </div>;
}


function LinemateTab() {
  return <div>
    {/* Affiliate disclosure */}
    <div style={{background:"rgba(245,166,35,.06)",border:"1px solid rgba(245,166,35,.2)",borderRadius:8,padding:"8px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:10,color:"var(--accent2)",fontFamily:"'DM Mono',monospace"}}>🤝 Affiliate Partner</span>
      <span style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>— Going Yard may earn a commission when you sign up via this link.</span>
      <a href="http://linemate.io/mlb" target="_blank" rel="noopener noreferrer"
        style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:6,background:"var(--accent)",color:"white",fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,letterSpacing:1,textDecoration:"none",flexShrink:0}}>
        ↗ Open in New Tab
      </a>
    </div>
    {/* Embedded iframe */}
    <div style={{borderRadius:10,overflow:"hidden",border:"1px solid var(--border)",background:"var(--surface)",position:"relative",paddingBottom:"75%",height:0}}>
      <iframe
        title="Linemate MLB"
        src="http://linemate.io/mlb"
        frameBorder="0"
        allowFullScreen
        style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
      />
    </div>
    <div style={{marginTop:8,fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textAlign:"center"}}>
      If the embed is blocked by the site, use the ↗ Open in New Tab button above.
    </div>
  </div>;
}


// ── GRADE CONFIG ─────────────────────────────────────────────────
const GRADE_CFG = {
  "A+": {color:"#ffcc00",bg:"rgba(255,204,0,.18)", border:"rgba(255,204,0,.5)",  label:"A+"},
  "A":  {color:"#ff4020",bg:"rgba(255,64,32,.18)", border:"rgba(255,64,32,.4)",  label:"A"},
  "B":  {color:"#ff8020",bg:"rgba(255,128,32,.14)",border:"rgba(255,128,32,.3)", label:"B"},
  "C":  {color:"#ffc840",bg:"rgba(255,200,64,.10)",border:"rgba(255,200,64,.25)",label:"C"},
  "D":  {color:"#8899a6",bg:"rgba(136,153,166,.08)",border:"rgba(136,153,166,.2)",label:"D"},
};

function parseCSVText(text) {
  if (!text || text.trim().length < 10) return [];
  const rows = text.trim().split('\n');
  const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
  return rows.slice(1).filter(r => r.trim()).map(row => {
    const vals = []; let cur = '', inQ = false;
    for (const ch of row) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    vals.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i]||'').replace(/^"|"$/g,'').trim(); });
    return obj;
  });
}

// Fetches live box score for a single batter from an active/final game
function LiveBatterBox({ batterId, gamePk, onData }) {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | live | final | preview | error

  useEffect(() => {
    if (!gamePk || !batterId) { setStatus('error'); return; }
    (async () => {
      try {
        const result  = await fetchLiveBatters(gamePk);
        const allBatters = Array.isArray(result) ? result : (result?.batters || []);
        const bid = parseInt(batterId);
        const found = allBatters.find(b => b.id === bid || String(b.id) === String(batterId));
        if (found) {
          setStats(found);
          setStatus('live');
          if (onData) onData(String(batterId), found);
        } else {
          setStatus('preview');
        }
      } catch(e) {
        setStatus('error');
      }
    })();
  }, [gamePk, batterId]);

  if (status === 'loading') return (
    <div style={{padding:'8px 0',display:'flex',alignItems:'center',gap:8,
      fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>
      <div className="sp" style={{width:14,height:14,borderWidth:2}}/> Loading live data…
    </div>
  );

  if (status === 'preview') return (
    <div style={{padding:'6px 0',fontSize:10,color:'var(--muted)',
      fontFamily:"'DM Mono',monospace"}}>
      🕐 Game hasn't started yet — no live stats available
    </div>
  );

  if (status === 'error' || !stats) return null;

  const heatCfg = {
    gone_yard: {color:'#fff',   bg:'rgba(255,20,0,.25)',  border:'rgba(255,20,0,.5)'},
    elite:     {color:'#ff4020',bg:'rgba(255,45,0,.15)',  border:'rgba(255,45,0,.3)'},
    hot:       {color:'#ff8020',bg:'rgba(255,128,32,.12)',border:'rgba(255,128,32,.25)'},
    warm:      {color:'#ffc840',bg:'rgba(255,183,0,.10)', border:'rgba(255,183,0,.2)'},
    avg:       {color:'var(--muted)',bg:'transparent',    border:'var(--border)'},
  };
  const hc = heatCfg[stats.heatLabel?.cls] || heatCfg.avg;

  return (
    <div style={{marginTop:10,marginBottom:4}}>
      {/* Live header */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
        <div style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
          textTransform:'uppercase',letterSpacing:1}}>
          📡 Live Today
        </div>
        {stats.heatLabel && <span style={{
          fontSize:8,padding:'1px 6px',borderRadius:4,
          background:hc.bg,color:hc.color,
          fontFamily:"'DM Mono',monospace",fontWeight:700,
          border:`1px solid ${hc.border}`}}>
          {stats.heatLabel.label}
        </span>}
        {stats.isAtBat && <span style={{
          fontSize:8,padding:'1px 6px',borderRadius:4,
          background:'rgba(39,201,122,.2)',color:'#27c97a',
          fontFamily:"'DM Mono',monospace",fontWeight:700,
          border:'1px solid rgba(39,201,122,.4)',
          animation:'pulse 1.2s ease-in-out infinite'}}>⚡ AT BAT</span>}
        {stats.isOnDeck && !stats.isAtBat && <span style={{
          fontSize:8,padding:'1px 6px',borderRadius:4,
          background:'rgba(245,166,35,.12)',color:'var(--accent2)',
          fontFamily:"'DM Mono',monospace",fontWeight:600,
          border:'1px solid rgba(245,166,35,.25)'}}>👀 ON DECK</span>}
        {stats.isInTheHole && !stats.isOnDeck && !stats.isAtBat && <span style={{
          fontSize:8,padding:'1px 6px',borderRadius:4,
          background:'rgba(56,184,242,.08)',color:'var(--ice)',
          fontFamily:"'DM Mono',monospace",fontWeight:600,
          border:'1px solid rgba(56,184,242,.2)'}}>⛳ IN THE HOLE</span>}
        {stats.isPinchHitter && <span style={{
          fontSize:8,padding:'1px 6px',borderRadius:4,
          background:'rgba(168,85,247,.12)',color:'#a855f7',
          fontFamily:"'DM Mono',monospace",fontWeight:600,
          border:'1px solid rgba(168,85,247,.25)'}}>🙋‍♂️ PH</span>}
        {stats.isSubbedOut && <span style={{
          fontSize:8,padding:'1px 6px',borderRadius:4,
          background:'rgba(90,112,128,.12)',color:'var(--muted)',
          fontFamily:"'DM Mono',monospace",fontWeight:600,
          border:'1px solid rgba(90,112,128,.25)'}}>✌️ OUT</span>}
      </div>

      {/* Box score strip */}
      <div style={{display:'flex',gap:0,border:'1px solid var(--border)',
        borderRadius:8,overflow:'hidden',marginBottom:8}}>
        {[
          {label:'AB',  val:stats.ab||0,          color:'var(--text)'},
          {label:'H',   val:stats.hits||0,         color:(stats.hits||0)>0?'#27c97a':'var(--text)'},
          {label:'HR',  val:stats.hr||0,           color:(stats.hr||0)>0?'var(--accent)':'var(--text)'},
          {label:'R',   val:stats.runs??0,         color:(stats.runs||0)>0?'#27c97a':'var(--text)'},
          {label:'TB',  val:stats.totalBases??0,   color:(stats.totalBases||0)>=4?'var(--accent)':(stats.totalBases||0)>=2?'#ff8020':'var(--text)'},
          {label:'RBI', val:stats.rbi??0,          color:(stats.rbi||0)>0?'#ffc840':'var(--text)'},
          {label:'BB',  val:stats.bb??0,           color:(stats.bb||0)>0?'#38b8f2':'var(--text)'},
          {label:'K',   val:stats.so??0,           color:(stats.so||0)>=2?'#38b8f2':'var(--text)'},
        ].map((s,i,arr) => (
          <div key={s.label} style={{flex:1,textAlign:'center',padding:'5px 3px',
            background:'rgba(255,255,255,.02)',
            borderRight:i<arr.length-1?'1px solid var(--border)':'none'}}>
            <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
              fontSize:13,color:s.color,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
              textTransform:'uppercase',letterSpacing:.4,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Statcast pills */}
      {(stats.avgEV > 0 || (stats.hardHits||0) > 0) && (
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {stats.avgEV > 0 && <div style={{
            padding:'2px 8px',borderRadius:5,fontSize:10,
            background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',
            fontFamily:"'DM Mono',monospace"}}>
            <span style={{color:'var(--muted)',fontSize:8}}>EV </span>
            <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
              color:stats.avgEV>=103?'#ff4020':stats.avgEV>=95?'#ff8020':'var(--text)'}}>
              {stats.avgEV.toFixed(1)}
            </span>
          </div>}
          {stats.launchAngle > 0 && <div style={{
            padding:'2px 8px',borderRadius:5,fontSize:10,
            background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',
            fontFamily:"'DM Mono',monospace"}}>
            <span style={{color:'var(--muted)',fontSize:8}}>LA </span>
            <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
              color:stats.launchAngle>=25&&stats.launchAngle<=35?'#27c97a':'var(--text)'}}>
              {stats.launchAngle.toFixed(0)}°
            </span>
          </div>}
          {(stats.avgDist||0) > 0 && <div style={{
            padding:'2px 8px',borderRadius:5,fontSize:10,
            background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',
            fontFamily:"'DM Mono',monospace"}}>
            <span style={{color:'var(--muted)',fontSize:8}}>Dist </span>
            <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
              color:(stats.avgDist||0)>=350?'#ff8020':'var(--text)'}}>
              {Math.round(stats.avgDist)}ft
            </span>
          </div>}
          {(stats.hardHits||0) > 0 && <div style={{
            padding:'2px 8px',borderRadius:5,fontSize:10,
            background:'rgba(255,128,32,.08)',border:'1px solid rgba(255,128,32,.2)',
            fontFamily:"'DM Mono',monospace"}}>
            <span style={{color:'var(--muted)',fontSize:8}}>HH </span>
            <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,color:'#ff8020'}}>
              {stats.hardHits}🔥
            </span>
          </div>}
        </div>
      )}

      {/* At-bat log */}
      {(stats.atBats||[]).length > 0 && <div style={{marginTop:8}}>
        <div style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
          textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Today's At-Bats</div>
        <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
              {['Inn','Result','EV','LA','Dist','Pitch','Pitcher'].map(h=>(
                <th key={h} style={{padding:'3px 6px',textAlign:'left',fontSize:8,
                  color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                  textTransform:'uppercase',letterSpacing:.5,whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {stats.atBats.map((ab,ai) => {
                const evc=(ab.ev||0)>=103?'#ff4020':(ab.ev||0)>=95?'#ff8020':(ab.ev||0)>=90?'#ffc840':'var(--text)';
                const dc=(ab.dist||0)>=400?'#ff4020':(ab.dist||0)>=350?'#ff8020':(ab.dist||0)>=300?'#ffc840':'var(--text)';
                const good=/home_run|double|triple|single/i.test(ab.result||'');
                return <tr key={ai} style={{borderBottom:'1px solid rgba(255,255,255,.04)',
                  background:ai%2===0?'rgba(255,255,255,.01)':'transparent'}}>
                  <td style={{padding:'3px 6px',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:9,whiteSpace:'nowrap'}}>{ab.halfInning==='top'?'▲':'▼'}{ab.inning||'—'}</td>
                  <td style={{padding:'3px 6px',color:good?'#27c97a':'var(--muted)',fontWeight:good?700:400,maxWidth:110,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'DM Mono',monospace",fontSize:9}}>{ab.result||'—'}</td>
                  <td style={{padding:'3px 6px',color:evc,fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,whiteSpace:'nowrap'}}>{ab.ev>0?ab.ev.toFixed(1):'—'}</td>
                  <td style={{padding:'3px 6px',color:'var(--text)',fontFamily:"'DM Mono',monospace",fontSize:9,whiteSpace:'nowrap'}}>{(ab.la||ab.launchAngle||0)>0?(ab.la||ab.launchAngle).toFixed(0)+'°':'—'}</td>
                  <td style={{padding:'3px 6px',color:dc,fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,whiteSpace:'nowrap'}}>{ab.dist>0?ab.dist+'ft':'—'}</td>
                  <td style={{padding:'3px 6px',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:9,whiteSpace:'nowrap'}}>{ab.pitchType||'—'}</td>
                  <td style={{padding:'3px 6px',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:9,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ab.pitcherName||'—'}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>}
    </div>
  );
}


// Graded pitcher stats fetched from existing pitcher API
function gradePitcher(era, k9, whip, bb9, hr9, avg, obp) {
  const e  = parseFloat(era)  || 99;
  const k  = parseFloat(k9)   || 0;
  const w  = parseFloat(whip) || 99;
  const b  = parseFloat(bb9)  || 99;
  const h  = parseFloat(hr9)  || 99;
  const av = parseFloat(avg)  || .999;
  const ob = parseFloat(obp)  || .999;
  let s = 0;
  if (e <= 2.80) s += 3; else if (e <= 3.50) s += 2; else if (e <= 4.20) s += 1;
  if (k >= 10.0) s += 3; else if (k >= 8.5)  s += 2; else if (k >= 7.0)  s += 1;
  if (w <= 1.05) s += 3; else if (w <= 1.22)  s += 2; else if (w <= 1.35) s += 1;
  if (b <= 2.0)  s += 2; else if (b <= 2.8)   s += 1;
  if (h <= 0.8)  s += 2; else if (h <= 1.1)   s += 1;
  if (av <= .210) s += 2; else if (av <= .240) s += 1;
  if (ob <= .275) s += 2; else if (ob <= .320) s += 1;
  if (s >= 13) return { label:'‼️ Elite',   color:'#ff4020', bg:'rgba(255,64,32,.10)',    desc:'Elite ERA/K-rate/WHIP' };
  if (s >= 9)  return { label:'⚠️ Tough',   color:'#ff8020', bg:'rgba(255,128,32,.08)',   desc:'Above-average pitcher' };
  if (s >= 5)  return { label:'🤔 Average', color:'var(--muted)', bg:'rgba(255,255,255,.04)', desc:'League-average matchup' };
  if (s >= 2)  return { label:'💥 Hittable',color:'#27c97a', bg:'rgba(39,201,122,.08)',   desc:'Elevated ERA/HR-rate' };
  return              { label:'🎯 Target',  color:'#38b8f2', bg:'rgba(56,184,242,.08)',   desc:'ERA > 5.00 / WHIP > 1.45' };
}

function PitcherCard({ pitcherId, pitcherName, onGrade }) {
  const [stats, setStats]     = useState(null);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);

  const gradeStats = (era, k9, whip, bb9, hr9, avg, obp) =>
    gradePitcher(era, k9, whip, bb9, hr9, avg, obp);

  // Auto-fetch on mount so grade shows immediately without clicking
  useEffect(() => {
    if (!pitcherId && !pitcherName) return;
    const cleanId = pitcherId ? String(parseInt(pitcherId) || pitcherId) : null;
    if (!cleanId || cleanId === '0' || isNaN(parseInt(cleanId))) return;
    setLoading(true);
    fetchPitcherData(cleanId, pitcherName)
      .then(d => {
        if (d?.stats) {
          setStats(d.stats);
        }
      })
      .catch(() => {})
      .then(() => setLoading(false));
  }, [pitcherId, pitcherName]);

  const handleOpen = () => {
    setOpen(o => !o);
  };

  const grade = stats ? gradeStats(
    stats.era,
    // K/9: use rate stat if available, otherwise calculate from SO + IP
    (stats.k9 && stats.k9 !== '—' ? stats.k9 :
      (parseFloat(stats.ip) > 0 && parseInt(stats.so||0) > 0
        ? ((parseInt(stats.so) / parseFloat(stats.ip)) * 9).toFixed(2)
        : '0')),
    stats.whip, stats.bb9, stats.hr9, stats.avg, stats.obp
  ) : null;
  useEffect(() => {
    if (grade && pitcherId && onGrade) {
      const cleanId = String(parseInt(pitcherId) || pitcherId);
      onGrade(cleanId, grade.label);
    }
  }, [grade?.label]);

  const eraColor  = (v) => { const n=parseFloat(v); if(n<2.50) return '#ff4020'; if(n<3.50) return '#ff8020'; if(n<4.50) return 'var(--text)'; return '#27c97a'; };
  const whipColor = (v) => { const n=parseFloat(v); if(n<1.00) return '#ff4020'; if(n<1.20) return '#ff8020'; return 'var(--text)'; };
  const k9Color   = (v) => { const n=parseFloat(v); if(n>11)   return '#ff4020'; if(n>9)    return '#ff8020'; return 'var(--text)'; };
  const hr9Color  = (v) => { const n=parseFloat(v); if(n>1.5)  return '#27c97a'; if(n>1.0)  return '#ffc840'; return 'var(--text)'; };

  const Stat = ({label, val, color}) => (
    <div style={{textAlign:'center',padding:'6px 10px',borderRadius:8,
      background:'rgba(255,255,255,.04)',border:'1px solid var(--border)',minWidth:52}}>
      <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:15,
        color:color||'var(--text)',lineHeight:1}}>{val||'--'}</div>
      <div style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
        textTransform:'uppercase',letterSpacing:.5,marginTop:2}}>{label}</div>
    </div>
  );

  return (
    <div style={{marginTop:6}}>
  <button onClick={handleOpen}
    style={{display:'inline-flex',alignItems:'center',gap:6,padding:'3px 10px',
      borderRadius:6,cursor:'pointer',
      background:grade?grade.bg:'rgba(255,255,255,.04)',
      border:`1px solid ${grade?grade.color+'40':'var(--border)'}`,
      fontFamily:"'DM Mono',monospace",fontSize:11,marginTop:4}}>
    {loading
      ? <span style={{color:'var(--muted)',fontSize:9}}>...</span>
      : grade
        ? <><span style={{color:grade.color,fontWeight:700,letterSpacing:.3}}>{grade.label}</span>
            {stats?.hand && <span style={{
              marginLeft:5,fontFamily:"'DM Mono',monospace",fontSize:9,fontWeight:700,
              padding:'1px 5px',borderRadius:4,
              background:stats.hand==='L'?'rgba(56,184,242,.12)':'rgba(255,128,32,.10)',
              color:stats.hand==='L'?'#38b8f2':'#ff8020',
            }}>{stats.hand==='L'?'LHP':'RHP'}</span>}</>
        : <span style={{color:'var(--muted)'}}>--</span>}
    <span style={{opacity:.4,marginLeft:3,fontSize:9}}>{open?'^':'v'}</span>
  </button>

      {open && (
        <div style={{marginTop:6,padding:'10px 12px',borderRadius:8,
          background:grade?grade.bg:'rgba(255,255,255,.04)',
          border:'1px solid var(--border)'}}>
          {!stats && !loading && (
            <div style={{fontSize:11,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>
              No stats available yet this season
            </div>
          )}
          {stats && (
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
                <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,
                  fontSize:13,color:grade?grade.color:'var(--text)'}}>
                  {grade?grade.label:''}
                </span>
                {stats.hand && <span style={{
                  fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:700,
                  padding:'1px 6px',borderRadius:4,
                  background:stats.hand==='L'?'rgba(56,184,242,.12)':'rgba(255,128,32,.10)',
                  color:stats.hand==='L'?'#38b8f2':'#ff8020',
                  border:`1px solid ${stats.hand==='L'?'rgba(56,184,242,.3)':'rgba(255,128,32,.3)'}`,
                }}>{stats.hand==='L'?'LHP':'RHP'}</span>}
                <span style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>
                  {grade?grade.desc:''}
                </span>
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
                <Stat label="ERA"  val={stats.era}  color={eraColor(stats.era)}/>
                <Stat label="WHIP" val={stats.whip} color={whipColor(stats.whip)}/>
                <Stat label="K/9"  val={stats.k9}   color={k9Color(stats.k9)}/>
                <Stat label="BB/9" val={stats.bb9}  color="var(--text)"/>
                <Stat label="HR/9" val={stats.hr9}  color={hr9Color(stats.hr9)}/>
                <Stat label="IP"   val={stats.ip}   color="var(--muted)"/>
              </div>
              <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                display:'flex',gap:12,flexWrap:'wrap'}}>
                {stats.wins!=null && <span>{stats.wins}-{stats.losses} W-L</span>}
                {stats.avg && stats.avg!=='--' && <span>AVG {stats.avg}</span>}
                {stats.obp && stats.obp!=='--' && <span>OBP {stats.obp}</span>}
                {stats.hr > 0 && <span>{stats.hr} HR allowed</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ── BATTER LEADERBOARD ─────────────────────────────────────────
// ── SIM LAB ────────────────────────────────────────────────────
// ── Long Shot View ────────────────────────────────────────────────────────────
// ── Reusable handedness filter — batter or pitcher ───────────────────────────
// mode: 'batter' | 'pitcher'
// value: 'ALL' | 'R' | 'L' | 'S'  (S = switch; switch batters appear under both R and L)
// Switch hitters (S) appear when R or L is selected (in addition to pure R/L batters)
function HandFilter({ mode, value, onChange }) {
  const mono = "'DM Mono',monospace";
  const label = mode === 'batter' ? 'Batter' : 'Pitcher';
  const opts = mode === 'batter'
    ? [['ALL','All'],['R','RHB'],['L','LHB']]
    : [['ALL','All'],['R','RHP'],['L','LHP']];
  return (
    <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
      <span style={{fontFamily:mono,fontSize:8,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.6}}>{label}</span>
      {opts.map(([key,lbl]) => (
        <button key={key} onClick={()=>onChange(key)}
          style={{padding:'2px 7px',borderRadius:5,border:`1px solid ${value===key?'var(--accent2)':'var(--border)'}`,
            background:value===key?'rgba(56,184,242,.15)':'transparent',
            color:value===key?'var(--accent2)':'var(--muted)',
            fontFamily:mono,fontSize:9,fontWeight:value===key?700:400,cursor:'pointer',
            transition:'all .15s'}}>
          {lbl}
        </button>
      ))}
    </div>
  );
}

// Helper: does a row match the handedness filter?
// Switch hitters (hand==='S') match both R and L selections
function matchesHandFilter(hand, filter) {
  if (!filter || filter === 'ALL') return true;
  if (!hand) return true;
  // Normalize 'Right'→'R', 'Left'→'L', 'Switch'→'S' (engine uses full words for pitcher_hand)
  let h = hand.toUpperCase();
  if (h === 'RIGHT') h = 'R';
  else if (h === 'LEFT') h = 'L';
  else if (h === 'SWITCH') h = 'S';
  if (h === 'S') return true; // switch hitters appear under both
  return h === filter;
}

// ── Recent Form Class — automatic category tagging from L7 stats ─────────────
// Priority order: Moonshot > Cold > Whiff > Worm > Gap > Contact > null
// A batter gets exactly ONE class (highest priority trigger wins)
const FORM_CLASSES = {
  'moonshot': { label:'🌙 Moonshot Mafia', short:'🌙 Moonshot', color:'#ff8020', bg:'rgba(255,128,32,.15)', border:'rgba(255,128,32,.35)', desc:'Multiple HRs + elevated angle in L7' },
  'cold':     { label:'🥶 Cold Bat',       short:'🥶 Cold',     color:'#38b8f2', bg:'rgba(56,184,242,.12)', border:'rgba(56,184,242,.3)',  desc:'Weak contact, low EV or bat speed in L7' },
  'whiff':    { label:'💨 Whiff King',     short:'💨 Whiff',    color:'#f5a623', bg:'rgba(245,166,35,.12)', border:'rgba(245,166,35,.3)',  desc:'High strikeout rate in L7' },
  'worm':     { label:'🪱 Worm Burner',    short:'🪱 Worm',     color:'#a78bfa', bg:'rgba(167,139,250,.12)',border:'rgba(167,139,250,.3)', desc:'Heavy ground-ball pattern in L7' },
  'gap':      { label:'🎯 Gap Sniper',     short:'🎯 Gap',      color:'#27c97a', bg:'rgba(39,201,122,.12)', border:'rgba(39,201,122,.3)',  desc:'High XBH/doubles rate in L7' },
  'contact':  { label:'🎩 Contact King',   short:'🎩 Contact',  color:'#e2e8f0', bg:'rgba(226,232,240,.08)',border:'rgba(226,232,240,.2)', desc:'High avg, low K%, solid hard contact in L7' },
};

function getFormClass(b) {
  const hr    = parseInt(b.recent_hr_count)    || 0;
  const la    = parseFloat(b.recent_avg_la)    || 0;
  const ev    = parseFloat(b.recent_avg_ev)    || 0;
  const hh    = parseFloat(b.recent_hh_pct)    || 0;
  const bs    = parseFloat(b.recent_avg_bat_speed) || 0;
  const gb    = parseFloat(b.recent_gb_pct)    || 0;
  const fb    = parseFloat(b.recent_fb_pct)    || 0;
  const kpct  = parseFloat(b.recent_k_pct)     || 0;
  const xbh   = parseFloat(b.recent_xbh_rate)  || 0;
  const brl   = parseFloat(b.recent_barrel_pct)|| 0;
  const pbrl  = parseFloat(b.recent_pulled_barrel_pct) || 0;
  const hit   = parseFloat(b.recent_hit_rate)  || 0;
  const popup = parseFloat(b.recent_popup_pct) || 0;
  const pa    = parseInt(b.recent_pa)          || 0;
  if (pa < 3) return null; // not enough L7 data

  // 1. Moonshot Mafia — hitting HRs with elevation
  if (hr >= 2 && (la >= 18 || fb >= 30 || brl >= 5)) return 'moonshot';
  // Single HR but elite angle + pull power
  if (hr >= 1 && la >= 22 && ev >= 97 && pbrl >= 3) return 'moonshot';

  // 2. Cold Bat — multiple weakness signals
  const coldSignals = [ev > 0 && ev < 87, hh > 0 && hh < 27, bs > 0 && bs < 69].filter(Boolean).length;
  if (coldSignals >= 2) return 'cold';
  if (ev > 0 && ev < 84) return 'cold'; // extreme EV weakness alone

  // 3. Whiff King — high strikeout rate
  if (kpct >= 33) return 'whiff';
  if (kpct >= 27 && hh < 32) return 'whiff'; // high K + weak contact

  // 4. Worm Burner — heavy grounder pattern
  if (gb >= 55) return 'worm';
  if (gb >= 48 && la < 8) return 'worm'; // groundball + flat angle confirmation

  // 5. Gap Sniper — extra-base hit machine without HR spike
  if (xbh >= 0.08 && la >= 10 && la < 22) return 'gap'; // gap angle
  if (xbh >= 0.10 && hr < 2) return 'gap'; // high XBH regardless

  // 6. Contact King — quality contact, low K
  if (kpct <= 14 && hh >= 36 && ev >= 92) return 'contact';
  if (hit >= 0.32 && kpct <= 18 && gb < 45) return 'contact';

  return null;
}

// Multi-select form class filter hook
function FormClassFilter({ selected, onChange }) {
  const mono = "'DM Mono',monospace";
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  const toggle = key => {
    const next = new Set(selected);
    if (key === 'ALL') { onChange(new Set()); return; }
    if (next.has(key)) next.delete(key); else next.add(key);
    onChange(next);
  };

  const label = selected.size === 0 ? '🏷️ Form Class' : `🏷️ ${selected.size} selected`;
  return (
    <div ref={ref} style={{position:'relative',flexShrink:0}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{padding:'3px 9px',borderRadius:6,border:`1px solid ${selected.size>0?'var(--accent2)':'var(--border)'}`,
          background:selected.size>0?'rgba(56,184,242,.12)':'var(--surface2)',
          color:selected.size>0?'var(--accent2)':'var(--muted)',
          fontFamily:mono,fontSize:9,cursor:'pointer',whiteSpace:'nowrap',
          display:'flex',alignItems:'center',gap:4}}>
        {label} <span style={{opacity:.6,fontSize:8}}>{open?'▲':'▼'}</span>
      </button>
      {open && (
        <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,zIndex:200,
          background:'var(--surface)',border:'1px solid var(--border)',
          borderRadius:8,padding:8,minWidth:190,boxShadow:'0 4px 16px rgba(0,0,0,.4)'}}>
          <button onClick={()=>toggle('ALL')}
            style={{width:'100%',textAlign:'left',padding:'4px 8px',borderRadius:5,
              border:'none',background:selected.size===0?'rgba(56,184,242,.15)':'transparent',
              color:selected.size===0?'var(--accent2)':'var(--muted)',
              fontFamily:mono,fontSize:9,cursor:'pointer',marginBottom:4}}>
            All batters
          </button>
          {Object.entries(FORM_CLASSES).map(([key, fc]) => (
            <button key={key} onClick={()=>toggle(key)}
              style={{width:'100%',textAlign:'left',padding:'4px 8px',borderRadius:5,
                border:'none',background:selected.has(key)?fc.bg:'transparent',
                color:selected.has(key)?fc.color:'var(--muted)',
                fontFamily:mono,fontSize:9,cursor:'pointer',marginBottom:2,
                display:'flex',alignItems:'center',gap:6}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:selected.has(key)?fc.color:'rgba(255,255,255,.15)',flexShrink:0}}/>
              {fc.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Badge component for inline display
function FormBadge({ formKey }) {
  if (!formKey || !FORM_CLASSES[formKey]) return null;
  const fc = FORM_CLASSES[formKey];
  return (
    <span title={fc.desc}
      style={{display:'inline-block',padding:'1px 5px',borderRadius:4,
        fontFamily:"'DM Mono',monospace",fontSize:7,fontWeight:700,letterSpacing:.3,
        background:fc.bg,color:fc.color,border:`1px solid ${fc.border}`,
        whiteSpace:'nowrap',cursor:'default',flexShrink:0}}>
      {fc.short}
    </span>
  );
}

// ── Boom Score — final composite HR probability (0–99) ───────────────────────
// Combines 5 independent signal axes. Each measures something different:
//   Sig(0-14)    → calibrated HR signal stack (EV/LA/barrel/pitcher/park/etc)
//   ZoneFit(%)   → spatial pitcher/batter zone overlap
//   ISO(0-0.4+)  → raw isolated power profile
//   SimTB(0-3.5) → full-game simulation output
//   Score(0-3)   → 5-window flag-based engine grade
// Higher = more signals aligned. 70+ = all systems go.
function computeBoomScore(sig, zoneFit, iso, simTB, engineScore) {
  const s  = Math.min(35, (parseFloat(sig)         || 0) / 14   * 35);
  const zf = Math.min(20, (parseFloat(zoneFit)      || 0) / 20  * 20);
  const is = Math.min(20, (parseFloat(iso)          || 0) / 0.40 * 20);
  const tb = Math.min(15, (parseFloat(simTB)        || 0) / 3.5 * 15);
  const es = Math.min(10, (parseFloat(engineScore)  || 0) / 3.0 * 10);
  return Math.min(99, Math.round(s + zf + is + tb + es));
}


function computeYardScore(sig, ghr, boom, ps) {
  // Yard Score: weighted composite — batter-centric rebalance
  // gHR 30% | PS 30% | Boom 30% | Sig 10%
  // gHR raised (pure batter quality, pitcher-independent)
  // Boom lowered (was double-counting pitcher penalty via Sig feed)
  const sigN = (Math.min(14, Math.max(0, parseFloat(sig)||0)) / 14) * 100;
  const raw  = (parseFloat(boom)||0) * 0.30
             + (parseFloat(ps)  ||0) * 0.30
             + (parseFloat(ghr) ||0) * 0.30
             + sigN                  * 0.10;
  return Math.min(99, Math.max(0, Math.round(raw)));
}

function YardBadge({ score }) {
  if (!score || score < 1) return null;
  const bg  = score>=75?'rgba(255,215,0,.22)':score>=60?'rgba(255,64,32,.18)':score>=45?'rgba(245,166,35,.15)':score>=20?'rgba(210,180,140,.15)':'rgba(255,255,255,.04)';
  const col = score>=75?'#ffd700':score>=60?'#ff4020':score>=45?'#f5a623':score>=20?'#c4a882':'var(--muted)';
  return (
    <span title={`Yard Score: ${score} — Boom(35%) + PS(30%) + gHR(25%) + Sig(10%)`}
      style={{display:'inline-block',padding:'1px 5px',borderRadius:4,
        fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:10,
        background:bg,color:col,whiteSpace:'nowrap',cursor:'default'}}>
      {score}
    </span>
  );
}

function SplashScreen({ onDone }) {
  const [fading, setFading] = React.useState(false);
  useEffect(() => {
    // Minimum display time: 2s, then fade out
    const t = setTimeout(() => setFading(true), 2000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (fading) {
      // After fade transition completes, tell parent we're done
      const t = setTimeout(onDone, 650);
      return () => clearTimeout(t);
    }
  }, [fading, onDone]);
  return (
    <div className={`splash-overlay${fading ? ' fade-out' : ''}`}>
      <div className="splash-logo-wrap">
        <div className="splash-ball-wrap">
          <img src="/icon-192.png" alt="Going Yard" className="splash-ball"/>
        </div>
        <div className="splash-title">GOING YARD</div>
        <div className="splash-sub">MLB Home Run Intelligence</div>
        <div className="splash-bar-wrap"><div className="splash-bar"/></div>
      </div>
    </div>
  );
}

function PSBadge({ score }) {
  if (!score || score < 1) return null;
  const bg  = score>=75?'rgba(147,51,234,.2)':score>=60?'rgba(255,64,32,.18)':score>=45?'rgba(245,166,35,.15)':'rgba(255,255,255,.06)';
  const col = score>=75?'#a855f7':score>=60?'#ff4020':score>=45?'#f5a623':'var(--muted)';
  return (
    <span title={`PS: ${score} — Perfect Storm Score (90+=beyond reasonable doubt)`}
      style={{display:'inline-block',padding:'1px 5px',borderRadius:4,
        fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:10,
        background:bg,color:col,whiteSpace:'nowrap',cursor:'default'}}>
      {score}
    </span>
  );
}
function BoomBadge({ score }) {
  if (!score || score < 10) return null;
  const bg  = score>=70?'rgba(255,64,32,.2)':score>=50?'rgba(245,166,35,.18)':score>=30?'rgba(39,201,122,.15)':'rgba(255,255,255,.06)';
  const col = score>=70?'#ff4020':score>=50?'#f5a623':score>=30?'#27c97a':'var(--muted)';
  return (
    <span title={`Boom: ${score} — Sig + ZoneFit + ISO + SimTB + Engine`}
      style={{display:'inline-block',padding:'1px 5px',borderRadius:4,
        fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:10,
        background:bg,color:col,whiteSpace:'nowrap',cursor:'default'}}>
      {score}
    </span>
  );
}

function LongShotView({ data }) {
  const [lineupVer, setLineupVer] = useState(LINEUP_VERSION);
  useEffect(() => { const unsub = subscribeLineup(v => setLineupVer(v)); return unsub; }, []);
  const mono = "'DM Mono',monospace", osw = "'Oswald',sans-serif";
  const [sort, setSort]       = useState('_yard');
  const [sortDir, setSortDir] = useState(1); // 1 = desc (bv-av = higher first)
  const [search, setSearch]   = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [pgFilter, setPgFilter]     = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [lineupOnly, setLineupOnly]   = useState(false);
  const [goneYard,   setGoneYard]     = useState(false);
  const [dueOnly,    setDueOnly]      = useState(false);
  const [activeOnly, setActiveOnly]   = useState(false);
  const [injuredOnly,setInjuredOnly]  = useState(false);
  const [hotOnly,    setHotOnly]      = useState(false);
  const [picksOnly,  setPicksOnly]    = useState(false);
  const [diamondOnly,setDiamondOnly]  = useState(false);
  const [hideFinal, setHideFinal]       = useState(false);
  
  const [batterHand, setBatterHand]     = useState('ALL');
  const [pitcherHand, setPitcherHand]   = useState('ALL');
  const [formFilter, setFormFilter]     = useState(new Set());
  const picks = usePicks();
  const pitcherGradeCache = useRef({});
  const [cacheVersion, setCacheVersion] = useState(0);
  const SOFT_GRADES = new Set(['🎯 Target','💥 Hittable','🤔 Average']);
  const SOFT_LABEL_LIST = ['ALL','🤔 Average','💥 Hittable','🎯 Target'];
  const pgColor = pg => ({'💥 Hittable':'#27c97a','🎯 Target':'#38b8f2','🤔 Average':'var(--muted)'}[pg]||'var(--muted)');
  const tbColor = v => v>=2.0?'#27c97a':v>=1.5?'var(--accent2)':v>=1.0?'var(--text)':'var(--muted)';

  const rows = React.useMemo(() => {
    const out = [];
    for (const b of (data||[])) {
      const grade = (b.grade||'').trim();
      if (!['C','D'].includes(grade)) continue;
      // Use pitcher_hh_pct_allowed (hard hit % allowed) as vulnerability proxy
      // Above median (27.3%) = soft/hittable pitcher — same logic as tracker "Target/Hittable"
      const pid2 = String(parseInt(b.pitcher_id)||0);
      // pitcherGradeCache populated by AM/SLSR render — fall back to engine grade field
      const pgLabel = pitcherGradeCache.current[pid2] || '';
      // Write pgLabel to DAILY_PICKS_CACHE for ALL batters (before soft filter)
      // so the slideout always shows P.Grade regardless of pitcher grade
      if (pgLabel) b._pgLabel = pgLabel;
      if (!pgLabel || !SOFT_GRADES.has(pgLabel)) continue;
      const _simHR = parseFloat(b.sim_hr_adj)||0;
      // ⚡ Sig — v5 calibrated (241k PAs · atbat log validated)
      let _sig = 0;
      const _simTB  = parseFloat(b.sim_tb)||0;
      const _bvpFB  = parseFloat(b.bvp_fb_pct)||0;
      const _recEV  = parseFloat(b.recent_avg_ev)||0;
      const _recLA  = parseFloat(b.recent_avg_la)||0;
      const _recFB  = parseFloat(b.recent_fb_pct)||0;
      const _bvpLA  = parseFloat(b.bvp_avg_la)||0;
      const _flags  = parseInt(b.total_flags)||0;
      const _temp   = parseFloat(b.temp)||0;
      const _bspd   = parseFloat(b.recent_avg_bat_speed)||0;
      const _consHR = parseInt(b.recent_consec_hr_games)||0;
      const _abSince= parseInt(b.ab_since_hr)||0;
      const _topP   = (b.top_pitches||'').toUpperCase();
      // SimTB: 2.5-3.0 peak; 3.0+ dead zone
      if (_simTB >= 2.5 && _simTB < 3.0) _sig += 3;
      else if (_simTB >= 2.0)            _sig += 2;
      else if (_simTB >= 1.5)            _sig += 1;
      if (_simTB >= 3.0)                 _sig -= 1;
      // Pitcher grade
      if (pgLabel === '🎯 Target')       _sig += 2; else if (pgLabel === '💥 Hittable') _sig += 1;
      // Temp 70-75°F peak
      if (_temp >= 70 && _temp <= 75)    _sig += 2;
      // EV: corrected thresholds (103 = real cliff in data)
      if (_recEV >= 103)                 _sig += 2;  // recalibrated
      else if (_recEV >= 100)            _sig += 2;
      else if (_recEV >= 97)             _sig += 1;
      // Recent LA: real HR peak 25-30°, corridor 22-32° (atbat log N=241k)
      if (_recLA >= 22 && _recLA <= 32)  _sig += 2;
      else if (_recLA >= 18 && _recLA < 22) _sig += 1;
      // BvP LA: same corridor confirmed
      if (_bvpLA >= 22 && _bvpLA <= 32) _sig += 1;
      // BvP FB%: 20-34% sweet spot; 42+ dead zone (0% HR in data)
      if (_bvpFB >= 20 && _bvpFB <= 34) _sig += 2;
      if (_bvpFB >= 42)                  _sig -= 2;
      else if (_bvpFB >= 36)             _sig -= 1;
      // Recent FB%: monotonic — more elevation = more HRs
      if (_recFB >= 35)                  _sig += 1;  // recalibrated
      else if (_recFB < 15)              _sig -= 1;
      // Bat speed (needs engine field; safe fallback = 0)
      if (_bspd >= 77)                   _sig += 1;  // recalibrated
      // Consecutive HR momentum
      if (_consHR >= 2)                  _sig += 1;  // recalibrated
      // Due factor: more ABs since HR = colder, not hotter
      if (_abSince > 30)                 _sig -= 1;
      // Sinker-heavy pitcher: lowest HR rate of any pitch type
      if (_topP.startsWith('SI'))        _sig -= 1;
      // Barrel quality tier (EV-weighted, 430k data: 107+=96.4% HR, 103-107=75.9%, 98-103=37.5%)
      const _brlQ = parseInt(b.barrel_quality_score)||0;
      const _barrelv = parseFloat(b.recent_barrel_pct)||0;
      if (_brlQ >= 3)                    _sig += 2;  // recalibrated max
      else if (_brlQ >= 2)               _sig += 1;
      else if (_brlQ >= 1)               _sig += 1;
      else if (_barrelv >= 3 && _barrelv <= 6) _sig += 1;
      // ── Park HR Factor ─────────────────────────────────────────────────
      const _hf     = parseFloat(b.hr_factor)||1.0;
      const _hfNorm = _hf > 10 ? _hf/100 : _hf;
      if (_hfNorm >= 1.15)      _sig += 1;  // recalibrated
      else if (_hfNorm <= 0.88) _sig -= 1;
      // ── Pulled Barrel Rate ───────────────────────────────────────────────
      const _pbrlPct = parseFloat(b.recent_pulled_barrel_pct)||0;
      if (_pbrlPct >= 3.0)      _sig += 1;  // recalibrated
      // ── Batter-Ahead Count % ─────────────────────────────────────────────
      const _baAhead = parseFloat(b.recent_batter_ahead_pct)||0;
      if (_baAhead >= 32)       _sig += 1;  // recalibrated
      // Flags
      if (_flags === 7)                  _sig -= 2;
      else if (_flags === 1)             _sig -= 1;
      // Lineup slot: prefer live confirmed slot, fall back to engine data
      const _lsStatus = LINEUP_STATUS[parseInt(b.batter_id)||0];
      const _lsSlot = (_lsStatus?.slot) || parseInt(b.lineup_slot)||0;
      if (_lsSlot > 0) {
        // ── Pitcher handedness weakness vs this batter's hand ───────────
        const _bhLS   = (b.batter_hand||'').toUpperCase();
        const _pBrlLS = parseFloat(_bhLS==='L' ? b.pitcher_barrel_pct_vs_L : b.pitcher_barrel_pct_vs_R)||0;
        const _pHHLS  = parseFloat(_bhLS==='L' ? b.pitcher_hh_pct_vs_L    : b.pitcher_hh_pct_vs_R)||0;
        const _pFBLS  = parseFloat(_bhLS==='L' ? b.pitcher_fb_pct_vs_L    : b.pitcher_fb_pct_vs_R)||0;
        const _pHRLS  = parseFloat(_bhLS==='L' ? b.pitcher_hr_pct_vs_L    : b.pitcher_hr_pct_vs_R)||0;
        if (_pBrlLS >= 12)     _sig += 2; else if (_pBrlLS >= 8) _sig += 1;
        if (_pHHLS >= 45)      _sig += 1;
        if (_pFBLS >= 38)      _sig += 1;
        if (_pHRLS >= 5)       _sig += 1;
        const _ph = (b.pitcher_hand||'').toLowerCase();
        const _bh = (b.batter_hand||'').toUpperCase();
        const _hasPlatoon = (_ph.startsWith('r') && (_bh==='L'||_bh==='S')) ||
                            (_ph.startsWith('l') && (_bh==='R'||_bh==='S'));
        // Platoon cap at +1 (430k data: 0.23% raw edge)
        if (_hasPlatoon && _lsSlot >= 2 && _lsSlot <= 5) _sig += 1;
        else if (_hasPlatoon)                              _sig += 1;
        else if (_lsSlot >= 3 && _lsSlot <= 5)           _sig += 1;
      }
      _sig = Math.min(14, Math.max(0, _sig)); // cap at 14
      const _formClass = getFormClass(b);
      const _kHR  = parseFloat(b.gHR)  || 0;  // renamed kHR→gHR in engine
      const _iso  = parseFloat(b.recent_iso) || 0;
      const _zf   = parseFloat(b.zone_fit)   || 0;
      // Live lineup slot — same pattern as Sig formula
      const _lsStatusPS = LINEUP_STATUS[parseInt(b.batter_id)||0];
      const _liveSlot   = (_lsStatusPS?.slot) || parseInt(b.lineup_slot)||0;
      // Adjust PS gate for live confirmed slot (engine used static slot at run time)
      let _ps = parseFloat(b.ps_score)||0;
      if (_ps > 0 && _liveSlot > 0) {
        // Reapply walk gate delta if slot changed since engine run
        const engineSlot = parseInt(b.lineup_slot)||0;
        if (_liveSlot !== engineSlot) {
          const oldGate = engineSlot>=3&&engineSlot<=5?1.0:engineSlot===0?0.90:engineSlot===2||engineSlot===6?0.85:0.70;
          const newGate = _liveSlot>=3&&_liveSlot<=5?1.0:_liveSlot===2||_liveSlot===6?0.85:0.70;
          if (oldGate > 0) _ps = Math.min(99, Math.round(_ps / oldGate * newGate));
        }
      }
      const _boom  = computeBoomScore(_sig, b.zone_fit, b.recent_iso, _simTB, b.weighted_flag_score);
      const _ps_v  = b._ps ?? (parseFloat(b.ps_score)||0);
      const _yard  = computeYardScore(_sig, b._kHR||parseFloat(b.gHR)||0, _boom, _ps_v);
      // Write to DAILY_PICKS_CACHE directly (b is a CSV copy, not the cache object)
      const _lsCache = DAILY_PICKS_CACHE[String(b.batter_id)];
      if (_lsCache && !_lsCache._trackerSig) _lsCache._trackerSig = _sig;
      if (_lsCache && !_lsCache._boom)       _lsCache._boom       = _boom;
      if (_lsCache && !_lsCache._pgLabel)    _lsCache._pgLabel    = pgLabel;
      out.push({ ...b, _pgLabel:pgLabel, _simHR, _simTB, _bvpFB, _recEV,
        _bvpLA, _recLA, _recFB, _flags, _temp, _sig, _formClass, _kHR, _iso, _zf, _boom, _ps, _yard,
        _bsD: parseFloat(b.bat_speed_vs_baseline)||null,
        _hrPct:parseFloat(b.proj_hr_adj)||parseFloat(b.sim_hr)||0 });
    }
    return out;
  }, [data, cacheVersion, lineupVer]);

  const teams = React.useMemo(() => ['ALL',...Array.from(new Set(rows.map(r=>r.batting_team||'').filter(Boolean))).sort()], [rows]);

  const filtered = React.useMemo(() => {
    let r = rows.filter(b => b._simTB >= 0.01)
      .filter(b => matchesHandFilter(b.batter_hand, batterHand))
      .filter(b => matchesHandFilter(b.pitcher_hand, pitcherHand))
      .filter(b => formFilter.size === 0 || formFilter.has(b._formClass))
      .filter(b => !hideFinal   || !FINAL_GAME_IDS.has(String(b.game_id)))
    if (teamFilter!=='ALL') r = r.filter(b=>b.batting_team===teamFilter);
    if (pgFilter!=='ALL')   r = r.filter(b=>b._pgLabel===pgFilter);
    if (search)      { const q=search.toLowerCase(); r=r.filter(b=>(b.batter||'').toLowerCase().includes(q)); }
    if (lineupOnly)  r = r.filter(b=>parseInt(b.batter_id||0)>0 && LINEUP_STATUS[parseInt(b.batter_id||0)]?.status==='confirmed');
    if (goneYard)    r = r.filter(b=>{ const pid=parseInt(b.batter_id||0); const nm=(b.batter||'').toLowerCase(); return pid>0 && Array.isArray(HR_DATA) && HR_DATA.some(h=>h.batterId===pid||(h.batterName&&h.batterName.toLowerCase()===nm)); });
    if (dueOnly)     r = r.filter(b=>{ const dp=DAILY_PICKS_CACHE[String(b.batter_id||'')]; return dp&&isDue(dp); });
    if (activeOnly)  r = r.filter(b=>!INJURY_MAP[String(b.batter_id||'')]);
    if (injuredOnly) r = r.filter(b=>!!INJURY_MAP[String(b.batter_id||'')]);
    if (hotOnly)     r = r.filter(b=>{ const dp=DAILY_PICKS_CACHE[String(b.batter_id||'')]; return dp&&isHotBatPlayer(dp); });
    if (picksOnly)   r = r.filter(b=>picks[String(b.batter_id||'')]);
    if (diamondOnly) r = r.filter(b=>{ const dp=DAILY_PICKS_CACHE[String(b.batter_id||'')]; return dp?.is_diamond==='1'||dp?.is_diamond===true; });
    return [...r].sort((a,b2)=>{ const av=a[sort]||0; const bv=b2[sort]||0; return sortDir*(bv-av); });
  }, [rows,teamFilter,pgFilter,search,sort,sortDir,lineupOnly,goneYard,dueOnly,activeOnly,injuredOnly,hotOnly,picksOnly,diamondOnly,batterHand,pitcherHand,formFilter,hideFinal,]);

  const Th = ({k,label}) => (
    <th onClick={()=>{ if(sort===k) setSortDir(d=>-d); else{setSort(k);setSortDir(-1);} }}
      style={{padding:'5px 6px',fontSize:8,fontFamily:mono,textTransform:'uppercase',letterSpacing:.7,
        color:sort===k?'var(--accent2)':'var(--muted)',cursor:'pointer',textAlign:'right',
        whiteSpace:'nowrap',borderBottom:'1px solid var(--border)'}}>
      {label}{sort===k?(sortDir===1?' ▼':' ▲'):''}
    </th>
  );

  return (
    <div>
      <div style={{background:'rgba(232,65,26,.06)',border:'1px solid rgba(232,65,26,.18)',borderRadius:8,padding:'8px 12px',marginBottom:12}}>
        <div style={{fontFamily:osw,fontWeight:800,fontSize:13,color:'var(--accent)',marginBottom:2}}>🎲 Long Shot Board</div>
        <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)',lineHeight:1.5}}>
          C/D grade batters vs pitchers allowing above-median hard contact (HH%≥27%) · sorted by HR Probability<br/>
          <span style={{color:'#f5a623'}}>Best combos: Tue/Wed/Fri × Hittable/Target → 35–50% HR rate in tracker</span>
          <div style={{marginTop:3,fontSize:7,color:'rgba(255,255,255,.3)',lineHeight:1.6}}>
            ⚡ Sig: <span style={{color:'#ff4020'}}>8+ elite lock</span> · <span style={{color:'#f5a623'}}>6-7 strong</span> · <span style={{color:'#27c97a'}}>4-5 solid</span> · &lt;4 monitor only &nbsp;|&nbsp;
            SimTB≥2(+2) · BvP FB% 20-36%(+2) · 🎯Target(+2) · 💥Hit(+1) · 65-78°F(+1) · BvP LA 20-28°(+1) · BvP EV≥92(+1) · Flags 2-6(+1)
          </div>
        </div>
      </div>
      <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search batter…"
          style={{padding:'4px 10px',borderRadius:6,fontSize:10,fontFamily:mono,width:130,outline:'none',
            border:`1px solid ${search?'var(--accent2)':'var(--border)'}`,background:'var(--surface2)',color:'var(--text)'}}/>
        <select value={teamFilter} onChange={e=>setTeamFilter(e.target.value)}
          style={{padding:'3px 8px',borderRadius:6,fontSize:10,fontFamily:mono,border:'1px solid var(--border)',background:'var(--surface2)',color:'var(--text)',cursor:'pointer'}}>
          {teams.map(t=><option key={t} value={t}>{t==='ALL'?'All Teams':t}</option>)}
        </select>
        <HandFilter mode="batter" value={batterHand} onChange={setBatterHand}/>
      <HandFilter mode="pitcher" value={pitcherHand} onChange={setPitcherHand}/>
      <FormClassFilter selected={formFilter} onChange={setFormFilter}/>
      
            <button onClick={()=>setHideFinal(v=>!v)} style={{padding:'3px 9px',borderRadius:6,
        border:`1px solid ${hideFinal?'#ff4020':'var(--border)'}`,
        background:hideFinal?'rgba(255,64,32,.12)':'transparent',
        color:hideFinal?'#ff4020':'var(--muted)',fontFamily:"'DM Mono',monospace",
        fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}}>
        {hideFinal?'✓ Hiding Final':'Hide Final'}
      </button>
      <select value={pgFilter} onChange={e=>setPgFilter(e.target.value)}
          style={{padding:'3px 8px',borderRadius:6,fontSize:10,fontFamily:mono,border:'1px solid var(--border)',background:'var(--surface2)',color:'var(--text)',cursor:'pointer'}}>
          {SOFT_LABEL_LIST.map(g=><option key={g} value={g}>{g==='ALL'?'All Pitchers':g}</option>)}
        </select>
        <button onClick={()=>{
          const hdr = ['Grade','Team','Batter','Pitcher','P.Grade','Sim TB','BvP FB%','BvP EV','HR%'];
          const csvRows = [hdr, ...filtered.map(b=>[
            b.grade||'', b.batting_team||'', b.batter||'', b.pitcher||'', b._pgLabel||'',
            b._simTB.toFixed(2), b._bvpFB>0?b._bvpFB.toFixed(1):'', b._recEV>0?b._recEV.toFixed(1):'',
            b._simHR>0?(b._simHR*100).toFixed(1):''
          ])];
          const csv = csvRows.map(r=>r.join(',')).join('\n');
          const a = Object.assign(document.createElement('a'), {href:'data:text/csv;charset=utf-8,'+encodeURIComponent(csv), download:`LongShots-${new Date().toISOString().slice(0,10)}.csv`});
          a.click();
        }} style={{padding:'4px 10px',borderRadius:6,cursor:'pointer',fontSize:10,fontFamily:mono,
          border:'1px solid var(--border)',background:'var(--surface2)',color:'var(--muted)'}}>
          ⬇ CSV
        </button>
        <span style={{fontFamily:mono,fontSize:9,color:'var(--muted)'}}>{filtered.length} long shots</span>
      </div>
      {/* Hidden PitcherCards — populate grade cache with real ERA/K9/WHIP grades */}
      <div style={{display:'none'}}>
        {[...new Set((data||[]).map(r=>r.pitcher_id).filter(Boolean))].map(pid=>(
          <PitcherCard key={pid} pitcherId={pid} pitcherName=""
            onGrade={(id,g)=>{ pitcherGradeCache.current[id]=g; setCacheVersion(v=>v+1); }}/>
        ))}
      </div>

      {/* Sticker filters */}
      <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
        {[
          [()=>setLineupOnly(v=>!v), lineupOnly,  'rgba(39,201,122,.12)', '#27c97a',        '✅'],
          [()=>setGoneYard(v=>!v),   goneYard,    'rgba(255,64,32,.15)',  'var(--accent)',   '💥'],
          [()=>setDueOnly(v=>!v),    dueOnly,     'rgba(56,184,242,.18)', 'var(--ice)',      '⏳'],
          [()=>{setActiveOnly(v=>!v);if(!activeOnly)setInjuredOnly(false);}, activeOnly,  'rgba(52,211,153,.12)', '#34d399', '☑️'],
          [()=>{setInjuredOnly(v=>!v);if(!injuredOnly)setActiveOnly(false);},injuredOnly,'rgba(251,146,60,.12)', '#fb923c', '🤕'],
          [()=>setHotOnly(v=>!v),    hotOnly,     'rgba(251,146,60,.12)', '#fb923c',        '🔥'],
          [()=>setPicksOnly(v=>!v),  picksOnly,   'rgba(245,166,35,.12)', 'var(--accent2)', '🎯'],
          [()=>setDiamondOnly(v=>!v),diamondOnly, 'rgba(255,204,0,.18)',  '#ffcc00',        '💎'],
        ].map(([fn,active,bg,col,emoji])=>(
          <button key={emoji} onClick={fn}
            style={{padding:'4px 9px',borderRadius:7,cursor:'pointer',flexShrink:0,fontSize:14,
              border:`1px solid ${active?col:'var(--border)'}`,
              background:active?bg:'transparent',color:active?col:'var(--muted)'}}>
            {emoji}
          </button>
        ))}
      </div>
      <div className="tw">
        <table style={{width:'100%'}}>
          <thead><tr>
            <th className="sticky-batter" style={{padding:'5px 6px',fontSize:8,fontFamily:mono,textTransform:'uppercase',letterSpacing:.7,color:'var(--muted)',textAlign:'left',borderBottom:'1px solid var(--border)'}}>Batter</th>
            <Th k="_yard"   label={<img src="/icon-192.png" alt="Yard" style={{width:14,height:14,borderRadius:2,objectFit:'cover',verticalAlign:'middle'}}/>}/>
            <th style={{padding:'5px 6px',fontSize:8,fontFamily:mono,textTransform:'uppercase',letterSpacing:.7,color:'var(--muted)',textAlign:'center',borderBottom:'1px solid var(--border)'}}>Form</th>
            <th style={{padding:'5px 6px',fontSize:8,fontFamily:mono,textTransform:'uppercase',letterSpacing:.7,color:'var(--muted)',textAlign:'center',borderBottom:'1px solid var(--border)'}}>Gr</th>
            <th style={{padding:'5px 6px',fontSize:8,fontFamily:mono,textTransform:'uppercase',letterSpacing:.7,color:'var(--muted)',textAlign:'left',borderBottom:'1px solid var(--border)'}}>Pitcher</th>
            <Th k="_simTB"  label="Sim TB"/>
            <Th k="_iso"    label="ISO"/>
            <Th k="_zf"     label="ZoneFit"/>
            <Th k="_bvpFB"  label="BvP FB%"/>
            <Th k="_recEV"  label="EV"/>
            <Th k="_bsD"    label="BS Δ"/>
                        <Th k="_pgLabel" label="P Grade"/>
          </tr></thead>
          <tbody>
            {filtered.map(b => {
              const pid  = parseInt(b.batter_id||b.player_id||0);
              const name = b.batter||'';
              const uid  = b.batter_id||b.player_id||name;
              const isExp = expandedId === uid;
              return (
                <React.Fragment key={uid}>
                  <tr onClick={()=>setExpandedId(v=>v===uid?null:uid)}
                    style={{cursor:'pointer',height:26,borderBottom:'1px solid rgba(255,255,255,.04)',
                      background:isExp?'rgba(255,255,255,.04)':'transparent',
                      borderLeft:`2px solid ${isExp?'var(--accent)':'transparent'}`}}>
                    <td className="sticky-batter" style={{padding:'2px 6px',maxWidth:170}} title={b._boom>=50&&b._ps>=40?'🔥 Convergence Zone — Boom+PS both signal':''}>
                      <div style={{display:'flex',alignItems:'center',gap:4,overflow:'hidden'}}>
                        <PlayerAvatar pid={pid} name={name} size={16}/>
                        <span style={{fontFamily:mono,fontSize:8,fontWeight:700,color:'var(--accent2)',whiteSpace:'nowrap',flexShrink:0}}>{b.batting_team||''}</span>
                        <span style={{fontFamily:osw,fontWeight:700,fontSize:10,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',color:isKeyMatchup(pid,name)?'#ff8020':(b._boom>=50&&b._ps>=40)?'#a855f7':'var(--text)'}}>{name}</span>
                        <span onClick={e=>e.stopPropagation()} style={{flexShrink:0}}><PickButton pid={pid} name={name} team={b.batting_team||''}/></span>
                      </div>
                    </td>
                    <td style={{padding:'2px 4px',textAlign:'center'}}>
                      <YardBadge score={b._yard}/>
                    </td>
                    <td style={{padding:'2px 4px',textAlign:'center',verticalAlign:'middle'}}>
                      <FormBadge formKey={b._formClass}/>
                    </td>
                    <td style={{padding:'2px 6px',textAlign:'center',fontFamily:osw,fontWeight:800,fontSize:10,color:b.grade==='C'?'var(--muted)':'rgba(232,65,26,.8)'}}>{b.grade}</td>
                    <td style={{padding:'2px 6px',fontFamily:mono,fontSize:9,color:'var(--muted)',whiteSpace:'nowrap',maxWidth:100,overflow:'hidden',textOverflow:'ellipsis'}}>{b.pitcher||'—'}</td>
                    <td style={{padding:'2px 6px',textAlign:'right'}}>
                      <span style={{fontFamily:osw,fontWeight:800,fontSize:11,color:tbColor(b._simTB)}}>{b._simTB.toFixed(2)}</span>
                    </td>
                    <td style={{padding:'2px 6px',textAlign:'right',fontFamily:mono,fontSize:9,
                      color:b._iso>=0.25?'#ff8020':b._iso>=0.18?'#f5a623':'var(--muted)'}}>
                      {b._iso>0?b._iso.toFixed(3):'—'}
                    </td>
                    <td style={{padding:'2px 6px',textAlign:'right',fontFamily:mono,fontSize:9,
                      color:b._zf>=8?'#ff4020':b._zf>=5?'#f5a623':b._zf>=2?'#27c97a':'var(--muted)'}}>
                      {b._zf>0?b._zf.toFixed(1)+'%':'—'}
                    </td>
                    <td style={{padding:'2px 6px',textAlign:'right',fontFamily:mono,fontSize:9,color:b._bvpFB>=20&&b._bvpFB<36?'#27c97a':b._bvpFB>=36&&b._bvpFB<42?'#f5a623':'var(--muted)'}}>{b._bvpFB>0?`${b._bvpFB.toFixed(0)}%`:'—'}</td>
                    <td style={{padding:'2px 6px',textAlign:'right',fontFamily:osw,fontWeight:700,fontSize:10,color:b._recEV>=97?'#ff8020':b._recEV>=93?'var(--text)':'var(--muted)'}}>{b._recEV>0?b._recEV.toFixed(1):'—'}</td>
                    <td style={{padding:'2px 5px',textAlign:'right',fontFamily:mono,fontSize:9}}>
                      {(()=>{
                        const d=b._bsD;
                        if(d==null||isNaN(d)) return <span style={{color:'var(--muted)'}}>—</span>;
                        const arrow=d>=0.5?'↑':d<=-0.5?'↓':'→';
                        const col=d>=1.5?'#27c97a':d>=0.5?'#a8d8a8':d<=-1.5?'#ff4020':d<=-0.5?'#f5a623':'var(--muted)';
                        return <span style={{color:col,fontWeight:700}}>{arrow}{d>=0?'+':''}{d.toFixed(1)}</span>;
                      })()}
                    </td>
                                        <td style={{padding:'2px 6px',textAlign:'right'}}><span style={{fontFamily:mono,fontSize:9,color:pgColor(b._pgLabel),fontWeight:700}}>{b._pgLabel.split(' ')[0]}</span></td>
                  </tr>
                  {isExp && (
                    <tr><td colSpan={10} style={{padding:'0 10px 10px',background:'rgba(255,255,255,.02)'}}>
                      <Last7HRChart batterId={pid}/>
                      <RecentGameLog batterId={pid}/>
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
            {filtered.length===0 && (
              <tr><td colSpan={10} style={{padding:'30px',textAlign:'center',fontFamily:mono,fontSize:10,color:'var(--muted)'}}>
                No long shots match current filters.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SimLabView({ data }) {
  useHROdds();
  const picks = usePicks();
  const [lineupVer, setLineupVer] = useState(LINEUP_VERSION);
  useEffect(() => { const unsub = subscribeLineup(v => setLineupVer(v)); return unsub; }, []);
  const [view, setView]             = useState('slate');    // 'slate' | 'deepdive' | 'props'
  const [selBatter, setSelBatter]   = useState(null);
  const [sortBy, setSortBy]         = useState('_yard');
  const [sortDir, setSortDir]       = useState('desc');
  const [selMatchups, setSelMatchups] = useState(new Set()); // empty = all matchups
  const [showMatchupDrop, setShowMatchupDrop] = useState(false);
  const matchupDropRef = useRef(null);
  // Close matchup dropdown on outside click
  useEffect(() => {
    if (!showMatchupDrop) return;
    const handler = e => {
      if (matchupDropRef.current && !matchupDropRef.current.contains(e.target))
        setShowMatchupDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMatchupDrop]);
  const [sortProp, setSortProp]     = useState('_trackerSig');
  const [sortPropDir, setSortPropDir] = useState('desc');
  const [lineupOnly, setLineupOnly]   = useState(false);
  const [slBatterHand, setSlBatterHand]   = useState('ALL');
  const sigCache       = useRef({}); // caches _trackerSig per batter_id after first render
  const boomCache      = useRef({}); // caches _boom per batter_id after first render
  const userSorted     = useRef(false); // true once user manually changes sort
  const boomCacheReady = useRef(false); // true after first render populates boomCache
  const [slHideFinal, setSlHideFinal]     = useState(false);
  const [slPitcherHand, setSlPitcherHand] = useState('ALL');
  const [slFormFilter, setSlFormFilter]   = useState(new Set());
  const [filterGoneYardSim, setFilterGoneYardSim] = useState(false);
  const [filterDueSim, setFilterDueSim] = useState(false);
  const [filterDiamondSim, setFilterDiamondSim] = useState(false);
  const [simPicksOnly, setSimPicksOnly]           = useState(false);
  const [simActiveOnly, setSimActiveOnly]         = useState(false);
  const [simInjuredOnly, setSimInjuredOnly]       = useState(false);
  const [simHotOnly, setSimHotOnly]               = useState(false);
  const [minYard,    setMinYard]     = useState('');
  const [maxYard,    setMaxYard]     = useState('');

  const [minSimTB,   setMinSimTB]    = useState('');
  const [minOdds,    setMinOdds]     = useState('');
  const [simSearch,   setSimSearch]    = useState('');  // batter name search
  const [selPitcherGradesSim, setSelPitcherGradesSim] = useState(new Set()); // empty = All
  const [selBatterGradesSim,  setSelBatterGradesSim]  = useState(new Set()); // empty = All grades
  const simPitcherGrades = useRef({}); // pitcher_id → grade label

  const pf = (v, d=1) => v != null && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(d) : null;
  // toDecimal: normalizes prob values regardless of how they're stored in the CSV.
  // Engine bug stored proj_hr_adj as proj_hr_prob * hr_factor where hr_factor was 106
  // instead of 1.06 — resulting in values like 7.18 instead of 0.0718.
  // Rule: if n > 1, it's been multiplied by 100 (or worse) → divide back down.
  const toDecimal = v => { const n = parseFloat(v); if (isNaN(n)) return 0; return n > 1 ? n / 100 : n; };
  const pctRaw = v => toDecimal(v) * 100;  // always returns 0-100 percentage
  const pct = v => { const n = pctRaw(v); return n === 0 ? null : n.toFixed(1) + '%'; };
  const num = (v, d=2) => { const n = parseFloat(v); return isNaN(n) || n === 0 ? '—' : n.toFixed(d); };

  // Column sort handler: same column toggles direction, new column defaults to desc
  const handleSort = key => {
    if (!key) return;
    userSorted.current = true; // user took control — don't auto-re-sort
    if (key === sortBy) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  // Build matchup list from data sorted by start time
  const matchupList = useMemo(() => {
    const seen = new Set();
    const list = [];
    data.forEach(r => {
      if (!r.game_id || !r.home_team || !r.away_team) return;
      const key = String(r.game_id);
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ id: key, home: r.home_team, away: r.away_team, time: r.game_time || '' });
      }
    });
    // Sort by game_time (12-hr format e.g. "01:10 PM")
    list.sort((a, b) => {
      const parseT = t => {
        if (!t) return 9999;
        const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!m) return 9999;
        let h = parseInt(m[1]), min = parseInt(m[2]), ap = m[3].toUpperCase();
        if (ap === 'PM' && h !== 12) h += 12;
        if (ap === 'AM' && h === 12) h = 0;
        return h * 60 + min;
      };
      return parseT(a.time) - parseT(b.time);
    });
    return list;
  }, [data]);

  // Sort and filter the slate
  const SORT_OPTS = [
    { key: 'proj_hr_adj',  label: 'HR Prob%' },
    { key: 'proj_hit_prob',label: 'Hit Prob%' },
    { key: 'proj_xbh_prob',label: 'XBH Prob%' },
    { key: 'sim_tb',       label: 'Sim TB' },
    { key: 'weighted_flag_score', label: 'Engine Score' },
    { key: 'hr_intent_score',     label: 'HR Intent' },
  ];

  // Confirmed in lineup check — reads same LINEUP_STATUS as matchup tab
  const isConfirmed = b => {
    const pid = parseInt(b.batter_id) || 0;
    return pid > 0 && LINEUP_STATUS[pid]?.status === 'confirmed';
  };

  // Gone Yard check — same HR_DATA + date guard as rest of app (resets 4am ET)
  const etTodaySim = (() => { const s = new Date().toLocaleDateString('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}); const [m,d,y]=s.split('/'); return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`; })();
  const hrDataIsTodaySim = HR_DATA_DATE === etTodaySim;
  const isGoneYardSim = b => {
    if (!hrDataIsTodaySim) return false;
    const pid = parseInt(b.batter_id) || 0;
    const name = (b.batter || '').toLowerCase();
    return HR_DATA.some(h => h.batterId === pid || (h.batterName && h.batterName.toLowerCase() === name));
  };

  const slate = useMemo(() => {
    const filtered = data.filter(r => r.batter && r.batting_team)
      .filter(r => matchesHandFilter(r.batter_hand, slBatterHand))
      .filter(r => matchesHandFilter(r.pitcher_hand, slPitcherHand))
      .filter(r => slFormFilter.size === 0 || slFormFilter.has(getFormClass(r)))
      .filter(r => !slHideFinal || !FINAL_GAME_IDS.has(String(r.game_id)))
      .filter(r => selMatchups.size === 0 || selMatchups.has(String(r.game_id)))
      .filter(r => selBatterGradesSim.size === 0 || selBatterGradesSim.has(r.grade))
      .filter(r => !lineupOnly || isConfirmed(r))
      .filter(r => !filterGoneYardSim || isGoneYardSim(r))
      .filter(r => !filterDueSim || isDueFromRow(r, parseInt(r.batter_id)||0))
      .filter(r => !simPicksOnly || picks[String(parseInt(r.batter_id)||0)])
      .filter(r => !simActiveOnly || !INJURY_MAP[String(parseInt(r.batter_id)||0)])
      .filter(r => !simInjuredOnly || !!INJURY_MAP[String(parseInt(r.batter_id)||0)])
      .filter(r => !simHotOnly || isHotBatPlayer(r))
      .filter(r => {
        if (!filterDiamondSim) return true;
        const stb = parseFloat(r.sim_tb)||0;
        const spg = simPitcherGrades.current[String(parseInt(r.pitcher_id)||0)];
        return r.grade==='A+' && stb>=2.0 && (spg==='💥 Hittable'||spg==='🎯 Target');
      })
      .filter(r => {
        if (selPitcherGradesSim.size === 0) return true;
        const pid = r.pitcher_id ? String(parseInt(r.pitcher_id) || r.pitcher_id) : null;
        return pid && selPitcherGradesSim.has(simPitcherGrades.current[pid]);
      })
      .filter(r => !minYard   || (parseFloat(r._yard)||computeYardScore(parseFloat(r.weighted_flag_score)*4.6, parseFloat(r.gHR)||0, parseFloat(r._boom)||0, parseFloat(r.ps_score)||0)) >= parseFloat(minYard))
      .filter(r => !maxYard   || (parseFloat(r._yard)||computeYardScore(parseFloat(r.weighted_flag_score)*4.6, parseFloat(r.gHR)||0, parseFloat(r._boom)||0, parseFloat(r.ps_score)||0)) <= parseFloat(maxYard))

      .filter(r => !minSimTB  || (parseFloat(r.sim_tb)||0)   >= parseFloat(minSimTB))
      .filter(r => !minOdds   || (() => { const d = HR_ODDS_MAP[String(parseInt(r.batter_id)||0)]; return d?.implied && (d.implied * 100) >= parseFloat(minOdds); })())
      .filter(r => !simSearch || (r.batter||'').toLowerCase().includes(simSearch.toLowerCase()));
    const mul = sortDir === 'desc' ? -1 : 1;
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === '_boom') {
        const aB = boomCache.current[String(a.batter_id)] ?? computeBoomScore((parseFloat(a.weighted_flag_score)||0)*4.6, a.zone_fit, a.recent_iso, a.sim_tb, a.weighted_flag_score);
        const bB = boomCache.current[String(b.batter_id)] ?? computeBoomScore((parseFloat(b.weighted_flag_score)||0)*4.6, b.zone_fit, b.recent_iso, b.sim_tb, b.weighted_flag_score);
        return mul * (aB - bB);
      }
      if (sortBy === 'ps_score') {
        return mul * ((parseFloat(a.ps_score)||0) - (parseFloat(b.ps_score)||0));
      }
      if (sortBy === 'hr_odds_implied') {
        const aO = HR_ODDS_MAP[String(parseInt(a.batter_id)||0)]?.implied || 0;
        const bO = HR_ODDS_MAP[String(parseInt(b.batter_id)||0)]?.implied || 0;
        return mul * (aO - bO);
      }
      if (sortBy === '_trackerSig') {
        // Read from ref cache — populated after first render, accurate on all subsequent sorts
        const aS = sigCache.current[String(a.batter_id)] ?? (parseFloat(a.weighted_flag_score)||0)*4.6;
        const bS = sigCache.current[String(b.batter_id)] ?? (parseFloat(b.weighted_flag_score)||0)*4.6;
        return mul * (aS - bS);
      }
      return mul * ((parseFloat(a[sortBy]) || 0) - (parseFloat(b[sortBy]) || 0));
    });
    return sorted;
  }, [data, sortBy, sortDir, selMatchups, lineupOnly, filterGoneYardSim, filterDueSim, filterDiamondSim, simPicksOnly, simActiveOnly, simInjuredOnly, simHotOnly, selPitcherGradesSim, selBatterGradesSim, minYard, maxYard, minSimTB, minOdds, simSearch, lineupVer, slBatterHand, slPitcherHand, slFormFilter, slHideFinal]);

  // Auto-select top batter when data loads
  useEffect(() => {
    if (slate.length > 0 && !selBatter) setSelBatter(slate[0]);
  }, [data]);

  // Probability bar component
  const ProbBar = ({ value, max = 25, color = 'var(--accent)' }) => {
    const n = parseFloat(value) || 0;
    const pctVal = n > 1 ? n : n * 100; // handle both 0.08 and 8.0
    const pctClamped = Math.min(100, (pctVal / max) * 100);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pctClamped}%`, background: color, borderRadius: 3, transition: 'width .4s ease' }} />
        </div>
        <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 13, color, minWidth: 40, textAlign: 'right' }}>
          {pctVal.toFixed(1)}%
        </span>
      </div>
    );
  };

  const vBtn = (key, label) => ({
    padding: '5px 13px', borderRadius: 6, cursor: 'pointer', border: 'none',
    fontFamily: "'DM Mono',monospace", fontWeight: view === key ? 700 : 400, fontSize: 10,
    letterSpacing: .5, textTransform: 'uppercase', transition: 'all .15s',
    background: view === key ? 'var(--accent)' : 'transparent',
    color: view === key ? 'white' : 'var(--muted)',
  });

  if (data.length === 0) return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontFamily: "'DM Mono',monospace", fontSize: 11 }}>
      <div style={{ fontSize: 24, marginBottom: 10 }}>🧠</div>
      <div>No matchup data loaded.</div>
      <div style={{ fontSize: 9, marginTop: 6 }}>Run the engine and commit daily_summary.csv first.</div>
    </div>
  );

  return (
    <div>
      {/* Inner view toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: '3px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', width: 'fit-content' }}>
        <button style={vBtn('slate', '📊 Slate')} onClick={() => setView('slate')}>📊 Slate Rankings</button>
        <button style={vBtn('deepdive', '🔬')} onClick={() => setView('deepdive')}>🔬 Deep Dive</button>
        {/* Prop Match hidden — too bulky, not required */}
      </div>

      {/* ── SLATE RANKINGS ── */}
      {view === 'slate' && (
        <div>
          {/* ── Row 1: Matchup dropdown + Search ── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Matchup dropdown */}
            <div ref={matchupDropRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowMatchupDrop(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                  border: `1px solid ${selMatchups.size > 0 ? 'var(--accent)' : 'var(--border)'}`,
                  background: selMatchups.size > 0 ? 'rgba(232,65,26,.10)' : 'var(--surface2)',
                  color: selMatchups.size > 0 ? 'var(--accent)' : 'var(--muted)',
                  fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: selMatchups.size > 0 ? 700 : 400, whiteSpace: 'nowrap' }}>
                🗓 {selMatchups.size === 0 ? 'All Games' : `${selMatchups.size} Game${selMatchups.size > 1 ? 's' : ''} ✓`}
                <span style={{ fontSize: 9, opacity: .6, marginLeft: 2 }}>{showMatchupDrop ? '▲' : '▼'}</span>
              </button>
              {showMatchupDrop && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200,
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                  padding: '8px 6px', minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                  display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 260, overflowY: 'auto' }}>
                  <button onClick={() => { setSelMatchups(new Set()); setShowMatchupDrop(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 5, cursor: 'pointer', border: 'none', textAlign: 'left',
                      background: selMatchups.size === 0 ? 'rgba(232,65,26,.12)' : 'transparent',
                      color: selMatchups.size === 0 ? 'var(--accent)' : 'var(--muted)',
                      fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: selMatchups.size === 0 ? 700 : 400, width: '100%' }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                      border: `1.5px solid ${selMatchups.size === 0 ? 'var(--accent)' : 'var(--muted)'}`,
                      background: selMatchups.size === 0 ? 'var(--accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'white' }}>
                      {selMatchups.size === 0 ? '✓' : ''}
                    </span>
                    All Games
                  </button>
                  <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }}/>
                  {matchupList.map(g => {
                    const isChecked = selMatchups.has(g.id);
                    const toggle = () => setSelMatchups(prev => { const next = new Set(prev); isChecked ? next.delete(g.id) : next.add(g.id); return next; });
                    return (
                      <button key={g.id} onClick={toggle}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 5, cursor: 'pointer', border: 'none', textAlign: 'left',
                          background: isChecked ? 'rgba(232,65,26,.10)' : 'transparent', color: isChecked ? 'var(--accent)' : 'var(--text)',
                          fontFamily: "'Oswald',sans-serif", fontSize: 12, fontWeight: isChecked ? 700 : 500, width: '100%', whiteSpace: 'nowrap' }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                          border: `1.5px solid ${isChecked ? 'var(--accent)' : 'var(--muted)'}`,
                          background: isChecked ? 'var(--accent)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'white' }}>
                          {isChecked ? '✓' : ''}
                        </span>
                        <span style={{ flex: 1 }}>{g.away} @ {g.home}</span>
                        {g.time && <span style={{ fontSize: 9, color: 'var(--muted)', marginLeft: 4 }}>{g.time}</span>}
                      </button>
                    );
                  })}
                  {selMatchups.size > 0 && (
                    <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                      <span onClick={() => { setSelMatchups(new Set()); setShowMatchupDrop(false); }}
                        style={{ fontSize: 9, color: 'var(--accent)', fontFamily: "'DM Mono',monospace", cursor: 'pointer', textDecoration: 'underline' }}>clear all</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Search batter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
              <input type="text" value={simSearch} onChange={e => setSimSearch(e.target.value)} placeholder="Search batter…"
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontFamily: "'DM Mono',monospace",
                  border: `1px solid ${simSearch ? 'var(--accent2)' : 'var(--border)'}`,
                  background: 'var(--surface2)', color: 'var(--text)', width: 140, outline: 'none' }}/>
              {simSearch && <button onClick={() => setSimSearch('')}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 10, padding: '0 2px' }}>✕</button>}
            </div>
          </div>

          {/* ── Row 2: Batter filter emoji stickers ── */}
            <div style={{display:"flex",gap:6,marginBottom:4,flexWrap:"wrap",alignItems:"center"}}>
              <HandFilter mode="batter" value={slBatterHand} onChange={setSlBatterHand}/>
              <HandFilter mode="pitcher" value={slPitcherHand} onChange={setSlPitcherHand}/>
              <FormClassFilter selected={slFormFilter} onChange={setSlFormFilter}/>
              <button onClick={()=>setSlHideFinal(v=>!v)} style={{padding:'3px 9px',borderRadius:6,
                border:`1px solid ${slHideFinal?'#ff4020':'var(--border)'}`,
                background:slHideFinal?'rgba(255,64,32,.12)':'transparent',
                color:slHideFinal?'#ff4020':'var(--muted)',fontFamily:"'DM Mono',monospace",
                fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}}>
                {slHideFinal?'✓ Hiding Final':'Hide Final'}
              </button>
            </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              [() => setLineupOnly(v=>!v),        lineupOnly,        'rgba(39,201,122,.12)', '#27c97a',       '✅'],
              [() => setFilterGoneYardSim(v=>!v), filterGoneYardSim, 'rgba(255,64,32,.15)',  'var(--accent)', '💥'],
              [() => setFilterDueSim(v=>!v),      filterDueSim,      'rgba(56,184,242,.18)', 'var(--ice)',    '⏳'],
              [()=>{setSimActiveOnly(s=>!s);if(!simActiveOnly)setSimInjuredOnly(false);}, simActiveOnly,  'rgba(52,211,153,.12)', '#34d399', '☑️'],
              [()=>{setSimInjuredOnly(s=>!s);if(!simInjuredOnly)setSimActiveOnly(false);}, simInjuredOnly, 'rgba(251,146,60,.12)', '#fb923c', '🤕'],
              [() => setSimHotOnly(s=>!s),        simHotOnly,        'rgba(251,146,60,.12)', '#fb923c',       '🔥'],
              [() => setSimPicksOnly(s=>!s),       simPicksOnly,      'rgba(245,166,35,.12)', 'var(--accent2)','🎯'],
              [() => setFilterDiamondSim(v=>!v),  filterDiamondSim,  'rgba(255,204,0,.18)',  '#ffcc00',       '💎'],
            ].map(([fn, active, bg, col, emoji]) => (
              <button key={emoji} onClick={fn}
                style={{ padding: '4px 9px', borderRadius: 7, cursor: 'pointer', flexShrink: 0, fontSize: 14,
                  border: `1px solid ${active ? col : 'var(--border)'}`,
                  background: active ? bg : 'transparent', color: active ? col : 'var(--muted)' }}>
                {emoji}
              </button>
            ))}
            <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", marginLeft: 'auto', whiteSpace: 'nowrap' }}>
              {slate.length} batters
            </span>
          </div>

          {/* ── Row 3: Batter grades ── */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: 1 }}>Grade:</span>
            {['A+','A','B','C','D'].map(g => {
              const active = selBatterGradesSim.has(g);
              const col = {'A+':'#f5a623','A':'#e8411a','B':'#38b8f2','C':'var(--muted)','D':'var(--muted)'}[g]||'var(--muted)';
              return (<button key={g} onClick={() => setSelBatterGradesSim(prev => { const next=new Set(prev); active?next.delete(g):next.add(g); return next; })}
                style={{ padding:'3px 10px', borderRadius:5, cursor:'pointer', fontWeight:active?800:500,
                  border:`1px solid ${active?col:'var(--border)'}`, background:active?`${col}20`:'transparent',
                  color:active?col:'var(--muted)', fontFamily:"'DM Mono',monospace", fontSize:11 }}>{g}</button>);
            })}
            {selBatterGradesSim.size > 0 && <span onClick={() => setSelBatterGradesSim(new Set())}
              style={{ fontSize:9, color:'var(--muted)', fontFamily:"'DM Mono',monospace", cursor:'pointer', textDecoration:'underline' }}>clear</span>}
          </div>

          {/* ── Row 4: Pitcher grades ── */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: 1 }}>Pitcher:</span>
            <button onClick={() => setSelPitcherGradesSim(new Set())}
              style={{ padding:'3px 9px', borderRadius:6, cursor:'pointer',
                background:selPitcherGradesSim.size===0?'rgba(255,255,255,.08)':'transparent',
                color:selPitcherGradesSim.size===0?'var(--text)':'var(--muted)',
                border:`1px solid ${selPitcherGradesSim.size===0?'var(--text)':'var(--border)'}`,
                fontFamily:"'DM Mono',monospace", fontWeight:selPitcherGradesSim.size===0?700:400, fontSize:10 }}>All</button>
            {['‼️ Elite','⚠️ Tough','🤔 Average','💥 Hittable','🎯 Target'].map(g => {
              const active = selPitcherGradesSim.has(g);
              const col = {'‼️ Elite':'#ff4020','⚠️ Tough':'#ff8020','🤔 Average':'var(--muted)','💥 Hittable':'#27c97a','🎯 Target':'#38b8f2'}[g];
              return (<button key={g} onClick={() => setSelPitcherGradesSim(prev => { const next=new Set(prev); next.has(g)?next.delete(g):next.add(g); return next; })}
                style={{ padding:'3px 9px', borderRadius:6, cursor:'pointer',
                  background:active?'rgba(255,255,255,.08)':'transparent', color:active?col:'var(--muted)',
                  border:`1px solid ${active?col:'var(--border)'}`,
                  fontFamily:"'DM Mono',monospace", fontWeight:active?700:400, fontSize:14 }}>
                {g.split(' ')[0]}
              </button>);
            })}
          </div>

          {/* Hidden PitcherCard renders to populate simPitcherGrades cache */}
          <div style={{ display: 'none' }}>
            {[...new Set(data.map(r => r.pitcher_id).filter(Boolean))].map(pid => (
              <PitcherCard key={pid} pitcherId={pid} pitcherName=""
                onGrade={(id, g) => { simPitcherGrades.current[id] = g; }}/>
            ))}
          </div>

          {/* Min-value filter bar */}
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:8}}>
            {/* Min+Max filters */}
            {[
              { label:'🎯 Yard', minV:minYard, setMin:setMinYard, maxV:maxYard, setMax:setMaxYard, hasMax:true,  ph:'30' },

              { label:'Sim TB',  minV:minSimTB,setMin:setMinSimTB,maxV:'',      setMax:null,        hasMax:false, ph:'1.5'},
              { label:'Odds %',  minV:minOdds, setMin:setMinOdds, maxV:'',      setMax:null,        hasMax:false, ph:'8'  },
            ].map(({ label, minV, setMin, maxV, setMax, hasMax, ph }) => (
              <div key={label} style={{display:'flex',alignItems:'center',gap:3,background:'var(--surface2)',
                border:`1px solid ${minV||maxV?'var(--accent2)':'var(--border)'}`,
                borderRadius:6,padding:'3px 7px'}}>
                <span style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",flexShrink:0,marginRight:2}}>{label}</span>
                <input type="number" value={minV} onChange={e=>setMin(e.target.value)} placeholder={ph}
                  style={{width:42,padding:'1px 4px',borderRadius:4,
                    border:`1px solid ${minV?'var(--accent2)':'var(--border)'}`,
                    background:'var(--surface)',color:'var(--text)',
                    fontFamily:"'DM Mono',monospace",fontSize:9}}/>
                {hasMax && <>
                  <span style={{fontSize:8,color:'rgba(255,255,255,.2)',margin:'0 1px'}}>–</span>
                  <input type="number" value={maxV} onChange={e=>setMax(e.target.value)} placeholder="max"
                    style={{width:42,padding:'1px 4px',borderRadius:4,
                      border:`1px solid ${maxV?'var(--accent2)':'var(--border)'}`,
                      background:'var(--surface)',color:'var(--text)',
                      fontFamily:"'DM Mono',monospace",fontSize:9}}/>
                </>}
              </div>
            ))}
            {(minYard||maxYard||minSimTB||minOdds) && (
              <button onClick={()=>{setMinYard('');setMaxYard('');setMinSimTB('');setMinOdds('');}}
                style={{padding:'3px 9px',borderRadius:5,border:'1px solid rgba(255,64,32,.3)',
                  background:'rgba(255,64,32,.08)',color:'var(--accent)',
                  fontFamily:"'DM Mono',monospace",fontSize:9,cursor:'pointer',fontWeight:700}}>
                ✕ Clear
              </button>
            )}
          </div>

          {/* Export current filtered slate — same format as Key Matchups CSV */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button onClick={async () => {
              // Fetch live box scores for all games in current slate
              const slateGameIds = [...new Set(slate.map(r => r.game_id).filter(Boolean))];
              const slateLiveCache = {};
              await Promise.all(slateGameIds.map(async gid => {
                try {
                  const result = await fetchLiveBatters(gid);
                  const batters = result?.batters || result || [];
                  batters.forEach(bt => { if (bt.id) slateLiveCache[String(bt.id)] = bt; });
                } catch(e) {}
              }));
              const bom = '\uFEFF';
              const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
              const headers = ['Grade','Pitcher Grade','Gone Yard','Is Key Matchup','Team','Batter','Hand','P.Hand','vs Pitcher',
                'Top Pitches','Game Time',
                'Yard Score','⚡ Sig','💥 Boom','Form Class','gHR','ISO','Zone Fit','xwOBA','wOBA','SwStr%',
                'Flags','Recent EV','Recent Barrel%',
                'Recent FB%','Recent LA','BvP EV','BvP Barrel%','BvP FB%','BvP LA',
                'Sim H','Sim 2B','Sim BB','Sim K','Sim TB','Sim RBI',
                'Wind','Temp','Condition',
                'AB','H','HR','R','TB','RBI','BB','K','Avg EV','Launch Angle'];
              const rows = slate.map(b => {
                const bid = parseInt(b.batter_id) || 0;
                const gy  = HR_DATA.some(h => h.batterId === bid ||
                  (b.batter && h.batterName && h.batterName?.toLowerCase() === b.batter?.toLowerCase()));
                const lv  = slateGameIds.length > 0 ? (slateLiveCache[String(bid)] || null) : null;
                const pitchCleanId = b.pitcher_id ? String(parseInt(b.pitcher_id)||b.pitcher_id) : '';
                const pitcherGrade = simPitcherGrades.current[pitchCleanId] || '';
                const isKM = isKeyMatchup(parseInt(b.batter_id)||0, b.batter) ? 'YES' : '';
                return [b.grade, pitcherGrade, gy?'YES':'', isKM, b.batting_team, b.batter, b.batter_hand,
                  b.pitcher_hand||'', b.pitcher, b.top_pitches, b.game_time,
                  // Computed columns — between Game Time and Flags
                  (b._yard ?? computeYardScore(sigCache.current[String(bid)]||0, parseFloat(b.gHR)||0, boomCache.current[String(bid)]||0, b._ps||(parseFloat(b.ps_score)||0))),
                  sigCache.current[String(bid)] ?? '',
                  boomCache.current[String(bid)] ?? '',
                  (() => { const fc = getFormClass(b); return fc && FORM_CLASSES[fc] ? FORM_CLASSES[fc].short.replace(/[💥🥶💨🪱🎯🎩🌙]/gu,'').trim() : ''; })(),
                  b.gHR ?? '',
                  b.recent_iso ? parseFloat(b.recent_iso).toFixed(3) : '',
                  b.zone_fit        ? parseFloat(b.zone_fit).toFixed(1)        : '',
                  b.season_xwoba    ? parseFloat(b.season_xwoba).toFixed(3)    : '',
                  b.season_woba     ? parseFloat(b.season_woba).toFixed(3)     : '',
                  b.season_swstr_pct? parseFloat(b.season_swstr_pct).toFixed(1): '',
                  b.total_flags,
                  b.recent_avg_ev, b.recent_barrel_pct, b.recent_fb_pct, b.recent_avg_la,
                  b.bvp_avg_ev, b.bvp_barrel_pct, b.bvp_fb_pct, b.bvp_avg_la,
                  b.sim_h, b.sim_2b, b.sim_bb, b.sim_k, b.sim_tb, b.sim_rbi,
                  b.wind_effect, b.temp_f, b.condition,
                  lv?.ab??'', lv?.hits??'', lv?.hr??'', lv?.runs??'',
                  lv?.totalBases??'', lv?.rbi??'', lv?.bb??'', lv?.so??'',
                  lv?.avgEV>0?lv.avgEV.toFixed(1):'',
                  lv?.launchAngle>0?lv.launchAngle.toFixed(1):'',
                ].map(esc).join(',');
              });
              const csv = bom + headers.map(esc).join(',') + '\n' + rows.join('\n');
              const a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
              // ET date — same as Key Matchups export
              // ET date with 3am cutoff — before 3am ET still counts as "yesterday's" slate
              const _etRaw  = new Date().toLocaleString('en-US', {timeZone:'America/New_York',hour:'numeric',hour12:false});
              const _etH    = parseInt(_etRaw);
              const _etBase = new Date();
              if (_etH < 3) _etBase.setDate(_etBase.getDate() - 1);
              const _etNow  = new Date(_etBase.toLocaleString('en-US', {timeZone:'America/New_York'}));
              const _etDate = _etNow.getFullYear()+'-'+String(_etNow.getMonth()+1).padStart(2,'0')+'-'+String(_etNow.getDate()).padStart(2,'0');
              a.download = 'all-matchups-' + _etDate + '.csv';
              a.click();
            }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
              borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)',
              background: 'var(--surface2)', color: 'var(--muted)',
              fontFamily: "'DM Mono',monospace", fontSize: 11 }}>
              ⬇ Export CSV ({slate.length})
            </button>
          </div>

          <div className="tw">
            <table>
              <thead>
                <tr>
                  {[
                    { label: '+',        key: null },
                    { label: 'Batter',   key: null },
                    { label: (<img src="/icon-192.png" alt="Yard" style={{width:15,height:15,borderRadius:2,objectFit:'cover',verticalAlign:'middle',display:'inline-block'}}/>), key: '_yard', colKey: '_yard' },
                    { label: 'Form',     key: null },
                    { label: 'P.Grade',  key: null },
                    { label: 'vs Pitcher',key: null },
                    /* HR% (proj_hr_adj) removed — inflated by small BvP samples */
                    { label: 'Hit%',     key: 'proj_hit_prob' },
                    { label: 'XBH%',     key: 'proj_xbh_prob' },
                    { label: 'Sim TB',   key: 'sim_tb' },
                    { label: 'L7 EV',    key: 'recent_avg_ev' },
                    { label: 'BS Δ',     key: 'bat_speed_vs_baseline' },
                    { label: 'HH%',      key: 'recent_hh_pct' },
                    { label: 'FB%',      key: 'recent_fb_pct' },

                    { label: 'ISO',      key: 'recent_iso' },
                    { label: 'L7💥',     key: 'recent_hr_count' },
                    { label: 'ZoneFit',  key: 'zone_fit' },
                    { label: 'Grade',    key: null },
                    { label: '💣',       key: 'meatball_matchup_score' },
                    { label: 'HR Odds',  key: 'hr_odds_implied' },
                  ].map(col => (
                    <th key={col.colKey||col.key||String(col.label)}
                      onClick={() => handleSort(col.key)}
                      style={{
                        textAlign: col.colKey==='_yard'?'center': col.label === 'Batter' || col.label === 'vs Pitcher' ? 'left' : 'center',
                        whiteSpace: 'normal', wordBreak: 'break-word',
                        fontSize: 9, lineHeight: 1.2, padding: '5px 5px', verticalAlign: 'bottom',
                        cursor: col.key ? 'pointer' : 'default',
                        color: sortBy === col.key ? 'var(--accent)' : 'var(--muted)',
                        userSelect: 'none',
                      }}>
                      {col.label}{sortBy === col.key ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slate.map((b, i) => {
                  const hitP = pctRaw(b.proj_hit_prob);
                  const xbhP = pctRaw(b.proj_xbh_prob);
                  const tb = parseFloat(b.sim_tb) || 0;  // sim_tb = rate × proj PA (can exceed 1.5)
                  const rbi = parseFloat(b.proj_avg_rbi) || 0;

                  const hitColor = hitP >= 35 ? '#27c97a' : hitP >= 28 ? '#f5a623' : 'var(--text)';
                  const gc = GRADE_CFG[b.grade] || GRADE_CFG['D'];
                  // ── Tracker ⚡ Sig — v5 calibrated (241k PAs · 7,322 HRs) ──
                  const _simTBv  = parseFloat(b.sim_tb)||0;
                  const _bvpFBv  = parseFloat(b.bvp_fb_pct)||0;
                  const _bvpLAv  = parseFloat(b.bvp_avg_la)||0;
                  const _recEVv  = parseFloat(b.recent_avg_ev)||0;
                  const _recLAv  = parseFloat(b.recent_avg_la)||0;
                  const _recFBv  = parseFloat(b.recent_fb_pct)||0;
                  const _barrelv = parseFloat(b.recent_barrel_pct)||0;
                  const _tempv   = parseFloat(b.temp)||0;
                  const _flagsv  = parseInt(b.total_flags)||0;
                  const _bspdv   = parseFloat(b.recent_avg_bat_speed)||0;       // bat speed — needs engine field
                  const _consHRv = parseInt(b.recent_consec_hr_games)||0;   // consec HR games — needs engine field
                  const _abSince = parseInt(b.ab_since_hr)||0;              // ABs since last HR — needs engine field
                  const _topPitches = (b.top_pitches||'').toUpperCase();
                  const _pgLabelv= (() => { const pid=b.pitcher_id?String(parseInt(b.pitcher_id)||b.pitcher_id):null; return pid?simPitcherGrades.current[pid]||'':''; })();
                  let _trackerSig = 0;
                  // SimTB: 2.5-3.0 peak (+3); 2.0-2.5 solid (+2); 1.5-2.0 ok (+1); 3.0+ dead zone (-1)
                  if (_simTBv >= 2.5 && _simTBv < 3.0)  _trackerSig += 3;
                  else if (_simTBv >= 2.0)               _trackerSig += 2;
                  else if (_simTBv >= 1.5)               _trackerSig += 1;
                  if (_simTBv >= 3.0)                    _trackerSig -= 1;
                  // Pitcher grade
                  if (_pgLabelv === '🎯 Target')         _trackerSig += 2;
                  else if (_pgLabelv === '💥 Hittable')  _trackerSig += 1;
                  else if (_pgLabelv === '‼️ Elite')     _trackerSig -= 2;
                  // Temp: 70-75°F confirmed peak
                  if (_tempv >= 70 && _tempv <= 75)      _trackerSig += 2;
                  // EV: real cliff at 103; 97+ real signal start
                  if (_recEVv >= 103)                    _trackerSig += 2;  // was +3, recalibrated
                  else if (_recEVv >= 100)               _trackerSig += 2;
                  else if (_recEVv >= 97)                _trackerSig += 1;
                  // Recent LA: real HR peak 25-30°, full corridor 22-32° (atbat log confirmed)
                  if (_recLAv >= 22 && _recLAv <= 32)   _trackerSig += 2;
                  else if (_recLAv >= 18 && _recLAv < 22) _trackerSig += 1; // borderline credit
                  // BvP LA: confirm same approach angle corridor
                  if (_bvpLAv >= 22 && _bvpLAv <= 32)  _trackerSig += 1;
                  // Barrel quality tier (recalibrated: max +2)
                  const _brlQv = parseInt(b.barrel_quality_score)||0;
                  if (_brlQv >= 3)                       _trackerSig += 2;  // 107+ barrel (96.4% HR)
                  else if (_brlQv >= 2)                  _trackerSig += 1;  // 103-107 barrel (76% HR)
                  else if (_brlQv >= 1)                  _trackerSig += 1;  // 98-103 barrel (37% HR)
                  else if (_barrelv >= 3 && _barrelv <= 6) _trackerSig += 1; // fallback
                  // Recent FB%: 35%+ meaningful lift; single tier to reduce inflation
                  if (_recFBv >= 35)                     _trackerSig += 1;  // was +2
                  else if (_recFBv < 15)                 _trackerSig -= 1;  // groundball penalty kept
                  // Bat speed: 77+ = real edge; single tier
                  if (_bspdv >= 77)                      _trackerSig += 1;  // was +2
                  // Momentum: consecutive HR games; single tier
                  if (_consHRv >= 2)                     _trackerSig += 1;  // was +2
                  // Due factor INVERTED: 51+ AB since HR = cold (7.76%), not hot
                  if (_abSince > 30)                     _trackerSig -= 1;
                  // BvP FB%: 42-50% = 0% HR dead zone; 36-42% = weak
                  if (_bvpFBv >= 42)                     _trackerSig -= 2;
                  else if (_bvpFBv >= 36)                _trackerSig -= 1;
                  // Sinker-heavy pitcher: lowest HR pitch type (2.28%, avgLA 4.6°)
                  if (_topPitches.startsWith('SI'))      _trackerSig -= 1;
                  // ── Park HR Factor (single tier, recalibrated)
                  const _hfv = parseFloat(b.hr_factor)||1.0;
                  const _hfNorm = _hfv > 10 ? _hfv/100 : _hfv;
                  if (_hfNorm >= 1.15)      _trackerSig += 1;   // meaningful hitter's park (was +2 at 1.20)
                  else if (_hfNorm <= 0.88) _trackerSig -= 1;   // pitcher's park penalty
                  // ── Pulled Barrel Rate (single tier, recalibrated)
                  const _pbrlPctv = parseFloat(b.recent_pulled_barrel_pct)||0;
                  if (_pbrlPctv >= 3.0)     _trackerSig += 1;   // any meaningful pulled barrel rate
                  // ── Batter-Ahead Count % (single tier, recalibrated)
                  const _baAheadv = parseFloat(b.recent_batter_ahead_pct)||0;
                  if (_baAheadv >= 32)      _trackerSig += 1;   // above-average count discipline
                  // Flags: 7=dead zone, 1=noise (weakest single-signal bin)
                  if (_flagsv === 7)                      _trackerSig -= 2;
                  else if (_flagsv === 1)                 _trackerSig -= 1;
                  // ── Pitcher handedness weakness vs this batter's hand
          const _bhsl   = (b.batter_hand||'').toUpperCase();
          const _pBrlSL = parseFloat(_bhsl==='R'||_bhsl==='S' ? b.pitcher_barrel_pct_vs_R : b.pitcher_barrel_pct_vs_L)||0;
          const _pHHSL  = parseFloat(_bhsl==='R'||_bhsl==='S' ? b.pitcher_hh_pct_vs_R    : b.pitcher_hh_pct_vs_L)||0;
          const _pFBSL  = parseFloat(_bhsl==='R'||_bhsl==='S' ? b.pitcher_fb_pct_vs_R    : b.pitcher_fb_pct_vs_L)||0;
          const _pHRSL  = parseFloat(_bhsl==='R'||_bhsl==='S' ? b.pitcher_hr_pct_vs_R    : b.pitcher_hr_pct_vs_L)||0;
          if (_pBrlSL>=12) s+=2; else if (_pBrlSL>=8) s+=1;
          if (_pHHSL>=45)  s+=1;
          if (_pFBSL>=38)  s+=1;
          if (_pHRSL>=5)   s+=1;
          // Platoon + lineup slot (capped at +1 — 430k data: 0.23% raw edge)
                  // ── Pitcher handedness weakness vs this batter's hand ──────────
                  const _bhv2    = (b.batter_hand||'').toUpperCase();
                  const _pBrlVsH = parseFloat(_bhv2==='L' ? b.pitcher_barrel_pct_vs_L : b.pitcher_barrel_pct_vs_R)||0;
                  const _pHHVsH  = parseFloat(_bhv2==='L' ? b.pitcher_hh_pct_vs_L    : b.pitcher_hh_pct_vs_R)||0;
                  const _pFBVsH  = parseFloat(_bhv2==='L' ? b.pitcher_fb_pct_vs_L    : b.pitcher_fb_pct_vs_R)||0;
                  const _pHRVsH  = parseFloat(_bhv2==='L' ? b.pitcher_hr_pct_vs_L    : b.pitcher_hr_pct_vs_R)||0;
                  if (_pBrlVsH >= 12)      _trackerSig += 2;
                  else if (_pBrlVsH >= 8)  _trackerSig += 1;
                  if (_pHHVsH >= 45)       _trackerSig += 1;
                  if (_pFBVsH >= 38)       _trackerSig += 1;
                  if (_pHRVsH >= 5)        _trackerSig += 1;
                  // Prefer live confirmed batting order slot over stale engine value
                  const _liveStatus = LINEUP_STATUS[parseInt(b.batter_id)||0];
                  const _slotv = (_liveStatus?.slot) || parseInt(b.lineup_slot)||0;
                  const _phv     = (b.pitcher_hand||'').toLowerCase();
                  const _bhv     = (b.batter_hand||'').toUpperCase();
                  const _platoonv= (_phv.startsWith('r')&&(_bhv==='L'||_bhv==='S'))||
                                   (_phv.startsWith('l')&&(_bhv==='R'||_bhv==='S'));
                  if (_platoonv || (_slotv >= 3 && _slotv <= 5)) _trackerSig += 1;
                  b._trackerSig = Math.min(14, Math.max(0, _trackerSig)); // cap at 14
                  b._pgLabel     = _pgLabelv;
                  b._formClass   = getFormClass(b);
                  b._boom        = computeBoomScore(b._trackerSig, b.zone_fit, b.recent_iso, b.sim_tb, b.weighted_flag_score);
                  sigCache.current[String(b.batter_id)]  = b._trackerSig;
                  boomCache.current[String(b.batter_id)] = b._boom;
                  // Write to DAILY_PICKS_CACHE directly — allPicksData rows are CSV copies,
                  // not the same objects, so b.x = y never reaches the cache the slideout reads
                  // Adjust PS Score live using confirmed lineup slot
                  let _livePS = parseFloat(b.ps_score)||0;
                  if (_livePS > 0 && _slotv > 0) {
                    const _engSlot = parseInt(b.lineup_slot)||0;
                    if (_slotv !== _engSlot && _engSlot > 0) {
                      const _og = _engSlot>=3&&_engSlot<=5?1.0:_engSlot===2||_engSlot===6?0.85:0.70;
                      const _ng = _slotv>=3&&_slotv<=5?1.0:_slotv===2||_slotv===6?0.85:0.70;
                      if (_og > 0) _livePS = Math.min(99, Math.round(_livePS / _og * _ng));
                    }
                  }
                  b._ps  = _livePS;
                  b._yard = computeYardScore(b._trackerSig||0, parseFloat(b.gHR)||0, b._boom||0, b._ps);
                  const _cacheEntry = DAILY_PICKS_CACHE[String(b.batter_id)];
                  if (_cacheEntry) {
                    _cacheEntry._trackerSig = b._trackerSig;
                    _cacheEntry._pgLabel    = b._pgLabel;
                    _cacheEntry._boom       = b._boom;
                    _cacheEntry._formClass  = b._formClass;
                    _cacheEntry._ps         = _livePS;
                    _cacheEntry._yard       = b._yard;
                  }
                  // On first render: if user hasn't sorted manually and we're sorting by boom,
                  // nudge sortDir to force useMemo re-run with now-populated cache
                  if (!boomCacheReady.current && !userSorted.current && sortBy === '_boom') {
                    boomCacheReady.current = true;
                    setTimeout(() => setSortDir(d => { const v = d; return v; }), 0);
                  }
                  return (
                    <tr key={`${b.batter_id}-${i}`} className="dr"
                      onClick={() => { setSelBatter(b); setView('deepdive'); }}
                      style={{ cursor: 'pointer' }}>
                      <td style={{ textAlign: 'center', padding: '3px 4px' }}>
                        <PickButton pid={parseInt(b.batter_id)||0} name={b.batter} team={b.batting_team}/>
                      </td>
                      {/* ── Batter name — single-line, no wrap ── */}
                      <td className="sticky-batter" style={{ textAlign: 'left', maxWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
                          <PlayerAvatar pid={parseInt(b.batter_id)||0} name={b.batter} size={22}/>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,fontWeight:700,color:'var(--accent2)',whiteSpace:'nowrap',flexShrink:0}}>{b.batting_team}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden', cursor:'pointer', minWidth:0 }}
                            onClick={e=>{e.stopPropagation();const cp=getCachedPlayer(parseInt(b.batter_id)||0)||{};openAtBatSlide({pid:parseInt(b.batter_id)||0,name:b.batter,team:b.batting_team,avgEV:cp.avgEV,barrel:cp.barrel,hardHit:cp.hardHit,flyBall:cp.flyBall,hr:cp.hr,avg:cp.avg,obp:cp.obp,slg:cp.slg,xwoba:cp.xwoba,kPct:cp.kPct,bbPct:cp.bbPct,launchAngle:cp.launchAngle});}}>
                            <span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:11, whiteSpace:'nowrap',
                              overflow:'hidden', textOverflow:'ellipsis',
                              color: isKeyMatchup(parseInt(b.batter_id)||0, b.batter) ? '#ff8020' : (b._boom>=50&&(parseFloat(b.ps_score)||0)>=40)?'#a855f7':'var(--text)' }}>{b.batter}</span>
                            <span style={{fontSize:9,color:'var(--muted)',opacity:.4,flexShrink:0}}>›</span>
                            {/* Stickers — inline, no wrap */}
                            <InjuryBadge pid={parseInt(b.batter_id)||0} name={b.batter}/>
                            {isHotBatPlayer(b)     && <span style={{fontSize:9,flexShrink:0}} title="🔥 Hot Bat">🔥</span>}
                            {isConfirmed(b)         && <span style={{fontSize:9,flexShrink:0,color:'#27c97a'}}>✅</span>}
                            {isGoneYardSim(b)       && <span style={{fontSize:9,flexShrink:0}}>💥</span>}
                            {isDueFromRow(b,parseInt(b.batter_id)||0) && <span style={{fontSize:9,flexShrink:0}} title="Due">⏳</span>}
                            {(b.is_diamond==='True'||b.is_diamond===true) && <span style={{fontSize:9,flexShrink:0}}>💎</span>}
                            {(b.in_slump==='True'||b.in_slump===true) && <span style={{fontSize:9,flexShrink:0}} title="Slump">📉</span>}
                            {WEATHER_ALERT_GAME_IDS.has(String(b.game_id)) && <span style={{fontSize:9,flexShrink:0}} title="Weather alert">⚠️</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{textAlign:'center',padding:'2px 4px',verticalAlign:'middle'}}>
                        <YardBadge score={b._yard ?? computeYardScore(b._trackerSig||0, parseFloat(b.gHR)||0, b._boom||0, b._ps||(parseFloat(b.ps_score)||0))}/>
                      </td>
                      <td style={{textAlign:'center',padding:'2px 4px',verticalAlign:'middle'}}>
                        <FormBadge formKey={getFormClass(b)}/>
                      </td>
                      {/* P.Grade + weak spot inline */}
                      <td style={{ textAlign: 'center', padding:'3px 4px' }}>
                        {(() => {
                          const pid = b.pitcher_id ? String(parseInt(b.pitcher_id)||b.pitcher_id) : null;
                          const g   = pid ? simPitcherGrades.current[pid] : null;
                          const ws  = b.pitcher_lineup_weak_spot ? parseInt(b.pitcher_lineup_weak_spot) : null;
                          if (!g) return <span style={{color:'rgba(255,255,255,.15)',fontSize:9}}>—</span>;
                          const col = g==='‼️ Elite'?'#ff4020':g==='⚠️ Tough'?'#ff8020':g==='🤔 Average'?'var(--muted)':g==='💥 Hittable'?'#27c97a':g==='🎯 Target'?'#38b8f2':'var(--muted)';
                          return <span style={{display:'flex',alignItems:'center',gap:3,justifyContent:'center'}}>
                            <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:col,fontWeight:700,whiteSpace:'nowrap'}}>{g}</span>
                            {ws && <span title={`Weak vs #${ws}`} style={{fontFamily:"'DM Mono',monospace",fontSize:7,fontWeight:700,
                              color:'#f5a623',background:'rgba(245,166,35,.12)',
                              border:'1px solid rgba(245,166,35,.3)',borderRadius:3,padding:'0 3px'}}>#{ws}</span>}
                          </span>;
                        })()}
                      </td>
                      <td style={{ textAlign: 'right', padding:'3px 6px' }}>
                        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'var(--muted)', cursor:'pointer', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:90, display:'inline-block' }}
                          onClick={e=>{e.stopPropagation();if(b.pitcher_id)openPitcherSlide({pid:parseInt(b.pitcher_id)||0,name:b.pitcher,team:'',hand:b.pitcher_hand,pitchMix:[]});}}>
                          {b.pitcher}<span style={{fontSize:8,opacity:.4,marginLeft:1}}>›</span>
                        </span>
                      </td>

                      <td style={{ textAlign: 'right', padding:'3px 6px' }}><span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:hitColor }}>{hitP > 0 ? hitP.toFixed(1)+'%' : '—'}</span></td>
                      <td style={{ textAlign: 'right', padding:'3px 6px' }}><span style={{ fontFamily:"'DM Mono',monospace", fontSize:10 }}>{xbhP > 0 ? xbhP.toFixed(1)+'%' : '—'}</span></td>
                      <td style={{ textAlign: 'right', padding:'3px 6px' }}><span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:11, color:tb>=1.5?'#ff8020':tb>=1.0?'#f5a623':'var(--text)' }}>{tb > 0 ? tb.toFixed(2) : '—'}</span></td>
                      <td style={{textAlign:'right',padding:'3px 6px',fontFamily:"'DM Mono',monospace",fontSize:10,
                        color:(parseFloat(b.recent_avg_ev)||0)>=103?'#ff4020':(parseFloat(b.recent_avg_ev)||0)>=97?'#f5a623':'var(--muted)'}}>
                        {(parseFloat(b.recent_avg_ev)||0)>0?(parseFloat(b.recent_avg_ev)||0).toFixed(1):'—'}
                      </td>
                      <td style={{textAlign:'right',padding:'3px 6px',fontFamily:"'DM Mono',monospace",fontSize:10}}>
                        {(()=>{
                          const d=parseFloat(b.bat_speed_vs_baseline);
                          if(isNaN(d)||b.bat_speed_vs_baseline===''||b.bat_speed_vs_baseline==null) return <span style={{color:'var(--muted)'}}>—</span>;
                          const arrow=d>=0.5?'↑':d<=-0.5?'↓':'→';
                          const col=d>=1.5?'#27c97a':d>=0.5?'#a8d8a8':d<=-1.5?'#ff4020':d<=-0.5?'#f5a623':'var(--muted)';
                          return <span style={{color:col,fontWeight:700}}>{arrow}{d>=0?'+':''}{d.toFixed(1)}</span>;
                        })()}
                      </td>
                      <td style={{textAlign:'right',padding:'3px 6px',fontFamily:"'DM Mono',monospace",fontSize:10,
                        color:(parseFloat(b.recent_hh_pct)||0)>=40?'#ff4020':(parseFloat(b.recent_hh_pct)||0)>=30?'#f5a623':'var(--muted)'}}>
                        {(parseFloat(b.recent_hh_pct)||0)>0?((parseFloat(b.recent_hh_pct)||0).toFixed(1)+'%'):'—'}
                      </td>
                      <td style={{textAlign:'right',padding:'3px 6px',fontFamily:"'DM Mono',monospace",fontSize:10,
                        color:(parseFloat(b.recent_fb_pct)||0)>=35?'#27c97a':'var(--muted)'}}>
                        {(parseFloat(b.recent_fb_pct)||0)>0?((parseFloat(b.recent_fb_pct)||0).toFixed(1)+'%'):'—'}
                      </td>
                      <td style={{textAlign:'right',padding:'3px 6px',fontFamily:"'DM Mono',monospace",fontSize:10,
                        color:(parseFloat(b.recent_iso)||0)>=0.25?'#ff8020':(parseFloat(b.recent_iso)||0)>=0.18?'#f5a623':'var(--muted)'}}>
                        {(parseFloat(b.recent_iso)||0)>0?(parseFloat(b.recent_iso)||0).toFixed(3):'—'}
                      </td>
                      <td style={{textAlign:'center',padding:'3px 4px'}}>
                        {(() => {
                          const n = parseInt(b.recent_hr_count||0);
                          const col = n>=3?'#ff4020':n>=1?'#f5a623':'rgba(255,255,255,.2)';
                          return <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:10,color:col}}>{n>0?n:'—'}</span>;
                        })()}
                      </td>

                      <td style={{textAlign:'right',padding:'3px 6px',fontFamily:"'DM Mono',monospace",fontSize:10,
                        color:(parseFloat(b.zone_fit)||0)>=8?'#ff4020':(parseFloat(b.zone_fit)||0)>=5?'#f5a623':(parseFloat(b.zone_fit)||0)>=2?'#27c97a':'var(--muted)'}}>
                        {(parseFloat(b.zone_fit)||0)>0?((parseFloat(b.zone_fit)||0).toFixed(1)+'%'):'—'}
                      </td>
                      <td style={{ textAlign: 'right', padding:'3px 4px' }}>
                        {!INJURY_MAP[String(parseInt(b.batter_id)||0)] && <span style={{ padding:'1px 6px', borderRadius:4, fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(255,255,255,.25)', border:'1px solid rgba(255,255,255,.1)' }}>{b.grade||'—'}</span>}
                      </td>
                      <td style={{ textAlign: 'right', padding:'3px 6px' }}>
                        {parseFloat(b.meatball_matchup_score) > 0 ? (() => {
                          const ms = parseFloat(b.meatball_matchup_score);
                          const col = ms >= 0.15 ? '#ff4020' : ms >= 0.08 ? '#f5a623' : '#27c97a';
                          return <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:col, fontWeight:700 }}>{(ms*100).toFixed(1)}%</span>;
                        })() : <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'rgba(255,255,255,.2)' }}>—</span>}
                      </td>
                      <td style={{textAlign:'center',padding:'3px 4px'}}>
                        <HROddsCell pid={parseInt(b.batter_id)||0}/>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DEEP DIVE ── */}
      {view === 'deepdive' && (
        <div>
          {/* Batter selector */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={selBatter ? `${selBatter.batter_id}|${selBatter.game_id}` : ''}
              onChange={e => {
                const [bid, gid] = e.target.value.split('|');
                const found = data.find(r => String(r.batter_id) === bid && String(r.game_id) === gid);
                if (found) setSelBatter(found);
              }}
              style={{ flex: '1 1 220px', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: "'DM Mono',monospace", fontSize: 12, cursor: 'pointer' }}>
              {[...data].sort((a, b) => (parseFloat(b.proj_hr_adj) || 0) - (parseFloat(a.proj_hr_adj) || 0))
                .map(b => (
                  <option key={`${b.batter_id}|${b.game_id}`} value={`${b.batter_id}|${b.game_id}`}>
                    {b.batter} ({b.batting_team}) vs {b.pitcher} · {pctRaw(b.proj_hr_adj).toFixed(1)}% HR
                  </option>
                ))}
            </select>
          </div>

          {selBatter && (() => {
            const b = selBatter;
            const hrP = pctRaw(b.proj_hr_adj);
            const hitP = pctRaw(b.proj_hit_prob);
            const xbhP = pctRaw(b.proj_xbh_prob);
            const tb = parseFloat(b.sim_tb) || 0;
            const gc = GRADE_CFG[b.grade] || GRADE_CFG['D'];
            const inSlump = b.in_slump === 'True' || b.in_slump === true;
            const isDiamond = b.is_diamond === 'True' || b.is_diamond === true;
            const hf = parseFloat(b.hr_factor) || 1.0;

            return (
              <div>
                {/* Header card */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 14, borderLeft: `3px solid ${gc.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <PlayerAvatar pid={parseInt(b.batter_id)||0} name={b.batter} size={40}/>
                        <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 22, color: 'var(--text)' }}>{b.batter}</span>
                        <SavantLink pid={parseInt(b.batter_id)||0} type="batter"/>
                        {!INJURY_MAP[String(parseInt(b.batter_id)||0)] && <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontFamily: "'Oswald',sans-serif", fontWeight: 800, background: gc.bg, color: gc.color, border: `1px solid ${gc.border}` }}>{b.grade}</span>}
                        <InjuryBadge pid={parseInt(b.batter_id)||0} name={b.batter}/>
                        <PickButton pid={parseInt(b.batter_id)||0} name={b.batter} team={b.batting_team}/>
                        {isDiamond && <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: 'rgba(255,204,0,.15)', color: '#ffcc00', border: '1px solid rgba(255,204,0,.35)' }}>💎 Diamond Pick</span>}
                        {inSlump && <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 9, fontFamily: "'DM Mono',monospace", background: 'rgba(56,184,242,.1)', border: '1px solid rgba(56,184,242,.3)', color: 'var(--ice)' }}>📉 SLUMP</span>}
                      </div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                        <span style={{ color: 'var(--accent2)', fontWeight: 700 }}>{b.batting_team}</span> · {b.batter_hand}HB
                        <span style={{ marginLeft: 10 }}>vs <strong style={{ color: 'var(--text)' }}>{b.pitcher}</strong> ({b.pitcher_hand}HP)</span>
                        <span style={{ marginLeft: 10, color: 'var(--accent2)' }}>{b.away_team || ''} @ {b.home_team || ''}</span>
                        <span style={{ marginLeft: 10 }}>{b.game_time}</span>
                      </div>
                      {/* Injury banner — always visible, key for mobile */}
                      <InjuryBanner pid={parseInt(b.batter_id)||0} style={{marginTop:8,marginBottom:0}}/>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>
                        {b.top_pitches && <span>Arsenal: <strong style={{ color: 'var(--text)' }}>{b.top_pitches}</strong> · </span>}
                        {b.wind_effect && <span>{b.wind_effect} · </span>}
                        {b.temp_f && <span>{parseFloat(b.temp_f).toFixed(0)}°F · </span>}
                        {b.condition && <span>{b.condition} · </span>}
                        <span style={{ color: hf > 1.05 ? '#ff8020' : hf < 0.95 ? 'var(--ice)' : 'var(--muted)' }}>
                          Park: {hf > 1.05 ? '📈 HR-friendly' : hf < 0.95 ? '📉 HR-suppressor' : '— Neutral'}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 36, color: hrP >= 10 ? '#ff4020' : hrP >= 6 ? '#ff8020' : 'var(--text)', lineHeight: 1 }}>
                        {hrP.toFixed(1)}%
                      </div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>HR PROB</div>
                    </div>
                  </div>
                </div>

                {/* Outcome probabilities */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Outcome Probabilities</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Home Run', value: b.proj_hr_adj, max: 20, color: '#ff4020' },
                      { label: 'Hit (any)',  value: b.proj_hit_prob, max: 50, color: '#27c97a' },
                      { label: 'XBH (2B/3B/HR)', value: b.proj_xbh_prob, max: 30, color: '#f5a623' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--muted)', minWidth: 100 }}>{row.label}</span>
                        <ProbBar value={row.value} max={row.max} color={row.color} />
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Exp. TB',  val: tb.toFixed(2), color: tb >= 1.5 ? '#ff8020' : 'var(--text)' },
                        { label: 'Exp. RBI', val: parseFloat(b.proj_avg_rbi)>0 ? parseFloat(b.proj_avg_rbi).toFixed(2) : '—', color: 'var(--text)' },
                        { label: 'Sim H',    val: num(b.sim_h),   color: 'var(--text)' },
                        { label: 'Sim HR',   val: num(b.sim_hr_adj || b.sim_hr), color: parseFloat(b.sim_hr_adj||0) >= 0.15 ? 'var(--accent)' : 'var(--text)' },
                        { label: 'Sim BB',   val: num(b.sim_bb),  color: 'var(--text)' },
                        { label: 'Sim K',    val: num(b.sim_k),   color: 'var(--text)' },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px' }}>
                          <div style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 15, color: s.color, lineHeight: 1 }}>{s.val}</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, marginTop: 3 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Three signal cards + pitcher grade */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10, marginBottom: 14 }}>
                  {/* Recent form */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>📅 Recent Form (L7)</div>
                    {[
                      ['Avg EV', b.recent_avg_ev, ' mph', parseFloat(b.recent_avg_ev) >= 95 ? '#ff4020' : parseFloat(b.recent_avg_ev) >= 90 ? '#f5a623' : 'var(--text)'],
                      ['Barrel%', b.recent_barrel_pct, '%', parseFloat(b.recent_barrel_pct) >= 10 ? '#ff4020' : parseFloat(b.recent_barrel_pct) >= 5 ? '#f5a623' : 'var(--text)'],
                      ['HH%',    b.recent_hh_pct,    '%', 'var(--text)'],
                      ['FB%',    b.recent_fb_pct,    '%', 'var(--text)'],
                      ['Avg LA', b.recent_avg_la,    '°', 'var(--text)'],
                    ].map(([lbl, val, unit, col]) => val && parseFloat(val) > 0 ? (
                      <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>{lbl}</span>
                        <span style={{ fontSize: 11, fontFamily: "'Oswald',sans-serif", fontWeight: 700, color: col }}>{parseFloat(val).toFixed(1)}{unit}</span>
                      </div>
                    ) : null)}
                    <div style={{ marginTop: 5, fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>
                      {b.recent_pa} PA · {b.recent_hr_count || 0} HR · {parseInt(b.recent_flag_count) || 0} flags
                    </div>
                  </div>

                  {/* BvP */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>⚔️ BvP ({b.bvp_pa} PA)</div>
                    {[
                      ['Avg EV', b.bvp_avg_ev, ' mph', parseFloat(b.bvp_avg_ev) >= 95 ? '#ff4020' : parseFloat(b.bvp_avg_ev) >= 90 ? '#f5a623' : 'var(--text)'],
                      ['Barrel%', b.bvp_barrel_pct, '%', parseFloat(b.bvp_barrel_pct) >= 10 ? '#ff4020' : parseFloat(b.bvp_barrel_pct) >= 5 ? '#f5a623' : 'var(--text)'],
                      ['HH%',    b.bvp_hh_pct,    '%', 'var(--text)'],
                      ['FB%',    b.bvp_fb_pct,    '%', 'var(--text)'],
                      ['Avg LA', b.bvp_avg_la,    '°', 'var(--text)'],
                    ].map(([lbl, val, unit, col]) => val && parseFloat(val) > 0 ? (
                      <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>{lbl}</span>
                        <span style={{ fontSize: 11, fontFamily: "'Oswald',sans-serif", fontWeight: 700, color: col }}>{parseFloat(val).toFixed(1)}{unit}</span>
                      </div>
                    ) : null)}
                    <div style={{ marginTop: 5, fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>
                      {b.bvp_hr_count || 0} HR in sample · {parseInt(b.bvp_flag_count) || 0} flags
                    </div>
                  </div>

                  {/* Pitcher vulnerability */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>🎯 Pitcher Vuln.</div>
                    {[
                      ['Barrel Allowed', b.pitcher_barrel_pct_allowed, '%', parseFloat(b.pitcher_barrel_pct_allowed) >= 10 ? '#ff4020' : parseFloat(b.pitcher_barrel_pct_allowed) >= 6 ? '#f5a623' : 'var(--text)'],
                      ['HH Allowed',     b.pitcher_hh_pct_allowed,    '%', parseFloat(b.pitcher_hh_pct_allowed) >= 45 ? '#ff4020' : 'var(--text)'],
                      ['FB Allowed',     b.pitcher_fb_pct_allowed,    '%', 'var(--text)'],
                      ['💣 Zone%',       b.pitcher_meatball_pct,      '%', parseFloat(b.pitcher_meatball_pct) >= 60 ? '#ff4020' : parseFloat(b.pitcher_meatball_pct) >= 55 ? '#f5a623' : 'var(--muted)'],
                    ].map(([lbl, val, unit, col]) => val && parseFloat(val) > 0 ? (
                      <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>{lbl}</span>
                        <span style={{ fontSize: 11, fontFamily: "'Oswald',sans-serif", fontWeight: 700, color: col }}>{parseFloat(val).toFixed(1)}{unit}</span>
                      </div>
                    ) : null)}
                    {/* Meatball matchup score */}
                    {b.meatball_matchup_score && parseFloat(b.meatball_matchup_score) > 0 && (() => {
                      const ms = parseFloat(b.meatball_matchup_score);
                      const display = (ms * 100).toFixed(1);
                      // Higher = better matchup. Color scale: green=weak, orange=solid, red=elite
                      const col = ms >= 0.15 ? '#ff4020' : ms >= 0.08 ? '#f5a623' : '#27c97a';
                      const label = ms >= 0.15 ? '🔥 Elite' : ms >= 0.08 ? '⚡ Solid' : '✓ Mild';
                      return (
                        <div style={{ marginTop: 5, paddingTop: 5, borderTop: '1px solid rgba(255,255,255,.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>💣 Meatball Matchup</span>
                            <span style={{ fontSize: 11, fontFamily: "'Oswald',sans-serif", fontWeight: 700, color: col }}>{display} <span style={{ fontSize: 8 }}>{label}</span></span>
                          </div>
                          <div style={{ fontSize: 8, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", marginTop: 2 }}>
                            0–7 mild · 8–14 solid · 15–25 elite
                          </div>
                        </div>
                      );
                    })()}
                    {b.pitcher_pa_faced && <div style={{ marginTop: 5, fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>{b.pitcher_pa_faced} PA faced this season</div>}
                    {/* Bullpen HR Rank */}
                    {b.bullpen_hr_rank && parseInt(b.bullpen_hr_rank) > 0 && (() => {
                      const rank = parseInt(b.bullpen_hr_rank);
                      const col = rank <= 10 ? '#27c97a' : rank <= 20 ? '#f5a623' : '#ff4020';
                      const label = rank <= 10 ? '💥 Soft Pen' : rank <= 20 ? '— Avg Pen' : '🔒 Tough Pen';
                      return (
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>Opp. Bullpen HR Rank</span>
                          <span style={{ fontSize: 11, fontFamily: "'Oswald',sans-serif", fontWeight: 700, color: col }}>#{rank}/30 <span style={{ fontSize: 8 }}>{label}</span></span>
                        </div>
                      );
                    })()}
                    {/* Discipline flag */}
                    {b.discipline_flag && b.discipline_flag.trim() && (() => {
                      const flag  = String(b.discipline_flag);
                      const score = b.discipline_score ? parseFloat(b.discipline_score).toFixed(0) : null;
                      const chase = b.recent_chase_k_pct || b.season_chase_k_pct;
                      const bb    = b.recent_bb_pct || b.season_bb_pct;
                      const col   = flag.includes('Chase Risk') ? '#ff4020'
                                  : flag.includes('Watch')       ? '#f5a623'
                                  : flag.includes('Disciplined') ? '#27c97a'
                                  : 'var(--muted)';
                      return (
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>Plate Discipline</span>
                            <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", fontWeight: 700, color: col,
                              padding: '1px 6px', borderRadius: 4, background: `${col}18`, border: `1px solid ${col}40` }}>
                              {flag}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            {chase != null && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--muted)' }}>
                              Chase K: <span style={{ color: parseFloat(chase) > 15 ? '#ff4020' : 'var(--text)' }}>{parseFloat(chase).toFixed(1)}%</span>
                            </span>}
                            {bb != null && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--muted)' }}>
                              BB%: <span style={{ color: parseFloat(bb) > 8 ? '#27c97a' : 'var(--text)' }}>{parseFloat(bb).toFixed(1)}%</span>
                            </span>}
                            {score && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--muted)' }}>
                              Score: <span style={{ color: 'var(--text)' }}>{score}/100</span>
                            </span>}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Pitcher grade card — same card as shown in Lineups tab */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>⚾ Pitcher Grade</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', marginBottom:4 }}
                      onClick={e=>{ e.stopPropagation(); openPitcherSlide({pid:parseInt(b.pitcher_id)||0, name:b.pitcher, team:b.pitcher_team||'', hand:b.pitcher_hand, pitchMix:[]}); }}>
                      <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{b.pitcher}</span>
                      <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", fontWeight: 400 }}>{b.pitcher_hand}HP</span>
                      <span style={{ fontSize: 11, color: 'var(--ice)', fontFamily:"'DM Mono',monospace", fontWeight:700, marginLeft:'auto' }}>› Stats</span>
                    </div>

                    <PitcherCard pitcherId={b.pitcher_id} pitcherName={b.pitcher} onGrade={()=>{}}/>
                  </div>
                </div>



                {/* Recent At-Bats */}
                {b.batter_id && <><Last7HRChart batterId={parseInt(b.batter_id)}/><RecentGameLog batterId={parseInt(b.batter_id)}/></>}

              </div>
            );
          })()}
        </div>
      )}

      {/* ── PROP MATCH ── */}
      {false && view === 'props' && (
        <div>
          <div style={{ marginBottom: 12, fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>
            Engine projections vs common prop market lines · green = proj above line · blue = proj below line · click column to sort
          </div>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  {[
                    { label: '+',        key: null,             align: 'center' },
                    { label: 'Batter',    key: null,             align: 'left'   },
                    { label: 'vs',        key: null,             align: 'left'   },
                    { label: '⚡️ PS',    key: 'ps_score',       align: 'center' },
                    { label: '💥 Boom',   key: '_boom',          align: 'center' },
                    { label: '⚡ Sig',    key: '_trackerSig',    align: 'center' },
                    { label: 'HR >0.5',   key: 'proj_hr_adj',    align: 'center' },
                    { label: 'H >0.5',    key: 'proj_hit_prob',  align: 'center' },
                    { label: 'H >1.5',    key: 'proj_hit_prob',  align: 'center' },
                    { label: 'TB >0.5',   key: 'proj_avg_tb',    align: 'center' },
                    { label: 'TB >1.5',   key: 'proj_avg_tb',    align: 'center' },
                    { label: 'TB >2.5',   key: 'proj_avg_tb',    align: 'center' },
                    { label: 'Grade',     key: null,             align: 'center' },
                  ].map((col, ci) => {
                    const active = sortProp === col.key && col.key;
                    return (
                      <th key={ci}
                        onClick={() => {
                          if (!col.key) return;
                          if (col.key === sortProp) setSortPropDir(d => d === 'desc' ? 'asc' : 'desc');
                          else { setSortProp(col.key); setSortPropDir('desc'); }
                        }}
                        style={{ textAlign: col.align, whiteSpace: 'nowrap', cursor: col.key ? 'pointer' : 'default',
                          color: active ? 'var(--accent)' : 'var(--muted)', userSelect: 'none' }}>
                        {col.label}{active ? (sortPropDir === 'desc' ? ' ▼' : ' ▲') : ''}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[...data]
                  .filter(r => r.batter)
                  .sort((a, b) => {
                    const va = parseFloat(a[sortProp]) || 0;
                    const vb = parseFloat(b[sortProp]) || 0;
                    return sortPropDir === 'desc' ? vb - va : va - vb;
                  })
                  .map((b, i) => {
                    const hrP  = toDecimal(b.proj_hr_adj);
                    const hitP = toDecimal(b.proj_hit_prob);
                    const tb   = parseFloat(b.proj_avg_tb) || 0;
                    const gc   = GRADE_CFG[b.grade] || GRADE_CFG['D'];

                    const Cell = ({ pass, val }) => {
                      const col = pass ? '#27c97a' : '#38b8f2';
                      const bg = pass ? 'rgba(39,201,122,.1)' : 'rgba(56,184,242,.08)';
                      const bdr = pass ? 'rgba(39,201,122,.3)' : 'rgba(56,184,242,.2)';
                      return (
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                            padding: '2px 6px', borderRadius: 5, background: bg, border: `1px solid ${bdr}`, minWidth: 44 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: col }}>{pass ? '✓' : '✗'}</span>
                            <span style={{ fontSize: 8, color: col, fontFamily: "'DM Mono',monospace" }}>{val}</span>
                          </span>
                        </td>
                      );
                    };

                    return (
                      <tr key={`${b.batter_id}-${i}`} className="dr" onClick={() => { setSelBatter(b); setView('deepdive'); }} style={{ cursor: 'pointer' }}>
                        <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <PickButton pid={parseInt(b.batter_id)||0} name={b.batter} team={b.batting_team}/>
                        </td>
                        <td className="sticky-batter" style={{ textAlign: 'left', maxWidth: 180 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
                            <PlayerAvatar pid={parseInt(b.batter_id)||0} name={b.batter} size={24}/>
                            <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,fontWeight:700,color:'var(--accent2)',whiteSpace:'nowrap',flexShrink:0}}>{b.batting_team}</span>
                            <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.batter}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'left' }}><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--muted)' }}>{b.pitcher}</span></td>
                        <td style={{textAlign:'center',padding:'2px 4px'}}>
                          <PSBadge score={b._ps ?? (parseFloat(b.ps_score)||0)}/>
                        </td>
                        <td style={{textAlign:'center',padding:'2px 4px'}}>
                          <BoomBadge score={b._boom}/>
                        </td>
                        <td style={{textAlign:'center'}}>
                          <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',
                            width:22,height:18,borderRadius:4,fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:11,
                            background:b._trackerSig>=10?'rgba(255,64,32,.25)':b._trackerSig>=7?'rgba(245,166,35,.2)':b._trackerSig>=4?'rgba(39,201,122,.15)':'rgba(255,255,255,.05)',
                            color:b._trackerSig>=10?'#ff4020':b._trackerSig>=7?'#f5a623':b._trackerSig>=4?'#27c97a':'var(--muted)'}}>
                            {b._trackerSig||'—'}
                          </span>
                        </td>
                        <Cell pass={hrP  >= 0.05}  val={`${(hrP*100).toFixed(1)}%`} />
                        <Cell pass={hitP >= 0.28}  val={`${(hitP*100).toFixed(1)}%`} />
                        <Cell pass={hitP >= 0.55}  val={`${(hitP*100).toFixed(1)}%`} />
                        <Cell pass={tb >= 0.6}    val={tb.toFixed(2)} />
                        <Cell pass={tb >= 1.0}    val={tb.toFixed(2)} />
                        <Cell pass={tb >= 1.5}    val={tb.toFixed(2)} />
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontFamily: "'Oswald',sans-serif", fontWeight: 800, background: gc.bg, color: gc.color, border: `1px solid ${gc.border}` }}>{b.grade}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 📜 BvP HISTORY TAB — Career batter vs scheduled pitcher stats
// Data: MLB Stats API vsPlayer endpoint (career, all-time)
// Columns: Tm, Batter, Opp, Pitcher, PA, AB, H, HR, 1B, 2B, 3B, BB, K, SB, AVG, OBP, SLG

const BVP_CACHE = {}; // module-level cache: "batterId_pitcherId" → {data, ts}
const BVP_TTL   = 4 * 60 * 60 * 1000;

async function fetchBvP(batterId, pitcherId) {
  const k = `${batterId}_${pitcherId}`;
  const cached = BVP_CACHE[k];
  if (cached && (Date.now() - cached.ts) < BVP_TTL) return cached.data;
  try {
    const r = await fetch(
      `/api/bvp?batter=${batterId}&pitcher=${pitcherId}`
    );
    const d = await r.json();
    // Only cache if we got real data — don't lock in zero-PA responses
    if ((d.pa||0) > 0) BVP_CACHE[k] = { data: d, ts: Date.now() };
    return d;
  } catch(e) {
    // Don't cache errors — allow retry on next load
    return { pa:0, ab:0, h:0, hr:0, b1:0, b2:0, b3:0, bb:0, k:0, sb:0, avg:'—', obp:'—', slg:'—' };
  }
}

// ── CHEAT CODE SLIDEOUT ──────────────────────────────────────────────────────
// ── NOTIFICATION BELL ────────────────────────────────────────────────────────
// ── INJURY BADGE + MODAL ─────────────────────────────────────────────────────
function InjuryBadge({ pid, name }) {
  const inj = INJURY_MAP[String(pid || '')];
  if (!inj) return null;
  const tip = `${inj.label}${inj.shortDesc ? ' · '+inj.shortDesc : ''}`;
  return (
    <span title={tip} aria-label={tip}
      onClick={e => { e.stopPropagation(); openInjuryModal(pid, name); }}
      style={{cursor:'pointer',fontSize:11,flexShrink:0,lineHeight:1,
        display:'inline-flex',alignItems:'center'}}>
      {inj.emoji}
    </span>
  );
}

// Inline injury banner — used inside slideouts/dropdowns for mobile
function InjuryBanner({ pid, style = {} }) {
  const inj = INJURY_MAP[String(pid || '')];
  if (!inj) return null;
  const col = inj.emoji==='🚫'?'#ff4020':inj.emoji==='🤕'?'#ff8020':'#38b8f2';
  return (
    <div style={{
      display:'flex',alignItems:'flex-start',gap:10,
      padding:'10px 14px',borderRadius:8,margin:'10px 0',
      background:`${col}12`,border:`1px solid ${col}40`,
      ...style
    }}>
      <span style={{fontSize:18,lineHeight:1,flexShrink:0}}>{inj.emoji}</span>
      <div style={{minWidth:0}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,
          color:col,marginBottom:2}}>{inj.label}</div>
        {inj.shortDesc && (
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,
            color:'var(--text)',lineHeight:1.5}}>{inj.shortDesc}</div>
        )}
        {inj.date && (
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,
            color:'var(--muted)',marginTop:3}}>Since {inj.date}</div>
        )}
      </div>
    </div>
  );
}

function InjuryModal() {
  const [data, setData] = useState(null);
  useEffect(() => { INJURY_MODAL_CB = setData; return () => { INJURY_MODAL_CB = null; }; }, []);
  if (!data) return null;
  const inj = INJURY_MAP[data.pid];
  if (!inj) return null;
  const col = inj.emoji==='🚫'?'#ff4020':inj.emoji==='🤕'?'#ff8020':'#38b8f2';
  return (
    <div onClick={() => setData(null)}
      style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.72)',
        display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e => e.stopPropagation()}
        style={{background:'var(--surface)',border:`1px solid ${col}55`,borderRadius:14,
          padding:'22px 24px',maxWidth:360,width:'100%',
          boxShadow:`0 0 40px ${col}22`}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
          <span style={{fontSize:32,lineHeight:1}}>{inj.emoji}</span>
          <div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:17,letterSpacing:.3}}>{data.name}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'var(--muted)',marginTop:2}}>{inj.team}</div>
          </div>
        </div>
        {/* IL badge */}
        <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 10px',
          borderRadius:6,background:`${col}18`,border:`1px solid ${col}55`,marginBottom:14}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,color:col}}>{inj.label}</span>
        </div>
        {/* Injury description */}
        {inj.shortDesc && (
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:'var(--text)',
            lineHeight:1.6,marginBottom:12,padding:'10px 14px',
            background:'var(--surface2)',borderRadius:8}}>
            {inj.shortDesc}
          </div>
        )}
        {/* Date */}
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'var(--muted)',marginBottom:16}}>
          Placed: {inj.date}
        </div>
        <button onClick={() => setData(null)}
          style={{width:'100%',padding:'9px',borderRadius:8,cursor:'pointer',
            background:'var(--surface2)',border:'1px solid var(--border)',
            color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:11}}>
          Close
        </button>
      </div>
    </div>
  );
}

function NotifyBell() {
  const [state, setState] = useState('loading'); // loading|unsupported|default|subscribed|denied|error
  const [busy, setBusy]   = useState(false);

  useEffect(() => {
    getPushState().then(setState);
  }, []);

  if (state === 'unsupported' || state === 'loading') return null;

  const label = state === 'subscribed' ? '🔔' : state === 'denied' ? '🔕' : '🔔';
  const tip   = state === 'subscribed' ? 'Notifications on'
              : state === 'denied'     ? 'Notifications blocked — enable in browser settings'
              : 'Tap to get daily pick alerts';
  const active = state === 'subscribed';

  const handleClick = async () => {
    if (state === 'denied' || state === 'subscribed' || busy) return;
    setBusy(true);
    const result = await subscribeToPush();
    setState(result);
    setBusy(false);
  };

  return (
    <button onClick={handleClick} title={tip}
      style={{background:'none',border:'none',cursor: state==='subscribed'||state==='denied'?'default':'pointer',
        padding:'2px 3px',fontSize:12,opacity:active?1:0.45,
        transition:'opacity .2s',flexShrink:0,lineHeight:1}}>
      {busy ? '⏳' : label}
    </button>
  );
}

function CheatCodeButton() {
  const [open, setOpen] = useState(false);

  const Section = ({emoji, title, color, children}) => (
    <div style={{marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8,
        borderBottom:'1px solid var(--border)',paddingBottom:6}}>
        <span style={{fontSize:13}}>{emoji}</span>
        <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,
          letterSpacing:.8,color:color||'var(--text)',textTransform:'uppercase'}}>{title}</span>
      </div>
      {children}
    </div>
  );

  const Row = ({label, value, color, sub}) => (
    <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:5}}>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'var(--muted)',
        flexShrink:0,width:14}}>›</span>
      <div>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'var(--text)'}}>{label}</span>
        {value && <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,
          color:color||'var(--accent2)',marginLeft:6}}>{value}</span>}
        {sub && <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',
          marginTop:1,lineHeight:1.3}}>{sub}</div>}
      </div>
    </div>
  );

  const Fade = ({label, sub}) => (
    <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:5}}>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'var(--accent)',flexShrink:0}}>✕</span>
      <div>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'var(--text)'}}>{label}</span>
        {sub && <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',marginTop:1,lineHeight:1.3}}>{sub}</div>}
      </div>
    </div>
  );

  return <>
    {/* Subtle trigger — looks like part of the UI */}
    <button onClick={()=>setOpen(true)}
      title="The Sauce"
      style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',
        padding:'2px 6px',borderRadius:4,opacity:.35,
        fontSize:11,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
        transition:'opacity .2s'}}
      onMouseEnter={e=>e.currentTarget.style.opacity='.9'}
      onMouseLeave={e=>e.currentTarget.style.opacity='.35'}>
      ⚡
    </button>

    {open && <>
      {/* Backdrop */}
      <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,
        background:'rgba(0,0,0,.6)',zIndex:900}}/>

      {/* Panel */}
      <div style={{position:'fixed',right:0,top:0,bottom:0,width:'min(480px,100vw)',
        background:'var(--surface)',borderLeft:'2px solid var(--border)',
        zIndex:901,overflowY:'auto',display:'flex',flexDirection:'column'}}>

        {/* Header */}
        <div style={{padding:'16px 20px 12px',borderBottom:'1px solid var(--border)',
          position:'sticky',top:0,background:'var(--surface)',zIndex:10,
          display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
          <div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:20,
              letterSpacing:1.5,color:'var(--accent)',textTransform:'uppercase'}}>
              The Sauce
            </div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',
              marginTop:2,letterSpacing:.5}}>
              Derived from 2024–26 at-bat log · 12,965 HRs · 430,587 PAs · base rate 3.0% ✱
            </div>
          </div>
          <button onClick={()=>setOpen(false)}
            style={{background:'none',border:'1px solid var(--border)',borderRadius:6,
              color:'var(--muted)',cursor:'pointer',padding:'4px 10px',
              fontFamily:"'DM Mono',monospace",fontSize:10,marginLeft:12,flexShrink:0}}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{padding:'20px',flex:1}}>

          <Section emoji="🔒" title="Tier 1 Lock — All 3 = strongest play" color="var(--accent)">
            <div style={{background:'rgba(255,64,32,.06)',border:'1px solid rgba(255,64,32,.2)',
              borderRadius:8,padding:'10px 14px',marginBottom:8}}>
              <Row label="Grade A+" value="46.7% HR rate when stacked" color="var(--accent)"/>
              <Row label="Sim TB ≥ 2.0" value="+5.2% lift" color="#f5a623"
                sub="→ Filter this in Sim Lab using the Sim TB box"/>
              <Row label="Pitcher 💥 Hittable or 🎯 Target" value="+2.0% lift" color="#27c97a"
                sub="A+ vs Target alone = 50% HR rate in tracker"/>
            </div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',
              lineHeight:1.4}}>All three together → 46.7% HR rate vs 17.1% base. That's your lock. ✱</div>
          </Section>

          <Section emoji="🔥" title="Tier 2 — Any 2 = solid play" color="var(--accent2)">
            <Row label="Recent EV > 98 mph" value="23.5% HR rate" color="var(--accent)"
              sub="Hot bat signal — biggest non-grade individual predictor"/>
            <Row label="Temp 70–75°F" value="22.3% HR rate" color="#f5a623"
              sub="Strongest environmental signal in the dataset (+9.2% lift)"/>
            <Row label="BvP FB% 28–36%" value="22.2% HR rate" color="#27c97a"
              sub="Above 36% = popup territory, actually reverses below base"/>
            <Row label="BvP EV 92–98 mph" value="16–17% HR rate" color="var(--accent2)"
              sub="Above 98 shows diminishing returns — sweet spot is 92-98"/>
            <Row label="Sim TB > 2.5" value="21.6% HR rate" color="var(--accent)"
              sub="Elite zone — filter to ≥2.5 for highest confidence plays"/>
            <Row label="D/C Grade + 🎯 Target ✱" value="22.6% HR rate" color="#fb923c"
              sub="New v2 finding: pitcher vulnerability overrides batter grade. Mid-week especially."/>
          </Section>

          <Section emoji="📐" title="The Narrowest Sweet Spots" color="var(--ice)">
            <Row label="BvP Launch Angle 20–24°" value="+4.1% lift" color="var(--ice)"
              sub="HR corridor. Below 16° = groundball. Above 24° = popup."/>
            <Row label="Recent Barrel% 3–6%" value="18.6% HR rate" color="var(--ice)"
              sub="0-3% is the WORST zone (7.1%). Extreme barrel rates also fade."/>
            <Row label="Signal Flags 4–6" value="14–15% HR rate" color="var(--ice)"
              sub="Sweet spot. Flags 7 = 8.5% — looks great, underperforms."/>
          </Section>

          <Section emoji="❌" title="Dead Zones — Fade These" color="var(--accent)">
            <Fade label="Sim TB 1.6–2.0" sub="Worse than 1.3-1.6. The mystery dip — real, not noise."/>
            <Fade label="Recent EV 92–94 mph" sub="Dead zone, -3% vs base. Skip this band entirely."/>
            <Fade label="BvP EV 90–92 mph" sub="Worst BvP EV range in the data (-3.5% lift)."/>
            <Fade label="Temp below 65°F" sub="HR rate drops to 8.1-8.9%. Hard avoid."/>
            <Fade label="Grade B vs Target/Hittable" sub="9.3% HR rate — below base! Only trust pitcher targeting for A/A+."/>
            <Fade label="Flags = 7" sub="Grade A concentration problem. 10.5% HR rate ✱ — Sim TB looks high but consistently underdelivers."/>
          </Section>

          <Section emoji="🗺️" title="Daily Scan Order" color="#27c97a">
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,lineHeight:1.8,color:'var(--text)'}}>
              <div><span style={{color:'var(--accent2)',fontWeight:700}}>1.</span> Set Sim TB filter ≥ 1.5 in Sim Lab</div>
              <div><span style={{color:'var(--accent2)',fontWeight:700}}>2.</span> Look for Grade A+ in that list first</div>
              <div><span style={{color:'var(--accent2)',fontWeight:700}}>3.</span> Check pitcher: Hittable or Target = green light</div>
              <div><span style={{color:'var(--accent2)',fontWeight:700}}>4.</span> Confirm HR% ≥ 8% and flags 4–6</div>
              <div><span style={{color:'var(--accent2)',fontWeight:700}}>5.</span> Weather tab: 70–75°F games get a bump</div>
              <div><span style={{color:'var(--accent2)',fontWeight:700}}>✱</span> <span style={{color:'#f5a623'}}>Tue/Wed slate? Boost confidence on all A+ plays.</span></div>
              <div><span style={{color:'var(--accent2)',fontWeight:700}}>6.</span> Cross-check BvP FB% — is it 28–36%?</div>
            </div>
          </Section>

          <Section emoji="👤" title="Composite HR Hitter Profile" color="var(--muted)">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 12px'}}>
              {[['Grade','A+ (highest rate)'],['Pitcher','💥 Hittable'],['Flags avg','4.7'],
                ['Sim TB median','1.54'],['Recent EV','93.1 mph'],['BvP EV','92.8 mph'],
                ['BvP FB%','23.4%'],['BvP LA','17.7°'],['Temp','70.9°F'],['Handedness','65% LHB']
              ].map(([k,v])=>(
                <div key={k} style={{padding:'4px 0',borderBottom:'1px solid rgba(30,45,58,.3)'}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.6}}>{k}</div>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,color:'var(--text)'}}>{v}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section emoji="📅" title="Day of Week — Target Profiles" color="#f5a623">
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              {[
                ['Tuesday','✅ Best Day ✱','25.8%','Biggest upgrade from v2. Stack A+ vs Target/Hittable. Boost confidence on all plays.'],
                ['Wednesday','✅ Best Day ✱','25.8%','Tied with Tuesday — 2x the base rate. Best mid-week slate. Play your full card.'],
                ['Friday','✅ Strong ✱','19.2%','Was flagged as a trap in v1. v2 flips it — above average. Standard filters apply.'],
                ['Saturday','~ Solid ✱','15.9%','Slightly downgraded from v1. Hittable pitchers still = 20%+. A/A+ stack holds.'],
                ['Sunday','~ Neutral','13.2%','Target pitchers = 22.2%. Otherwise play standard Sauce. No special unlock.'],
                ['Monday','~ Neutral','13.1%','No specific signal. Standard Sauce filters apply. Nothing special either way.'],
                ['Thursday','⚠️ Weakest ✱','12.5%','Was "Best Day" in v1 — now near-bottom. Big slate dilutes quality. Dampen confidence.'],
              ].map(([day, badge, rate, tip]) => {
                const col = badge.includes('✅') ? '#27c97a' : badge.includes('⚠️') ? 'var(--accent)' : 'var(--muted)';
                return (
                  <div key={day} style={{display:'flex',alignItems:'flex-start',gap:8,
                    padding:'6px 8px',borderRadius:6,background:'rgba(255,255,255,.03)',
                    border:`1px solid rgba(255,255,255,.06)`}}>
                    <div style={{flexShrink:0,minWidth:80}}>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11}}>{day}</div>
                      <div style={{display:'flex',alignItems:'center',gap:4,marginTop:1}}>
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:col,fontWeight:700}}>{badge}</span>
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)'}}>{rate}</span>
                      </div>
                    </div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',
                      lineHeight:1.4,flex:1}}>{tip}</div>
                  </div>
                );
              })}
            </div>
          </Section>

          <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--muted)',
            textAlign:'center',marginTop:8,lineHeight:1.6,borderTop:'1px solid var(--border)',paddingTop:12}}>
            ⚠️ The Sauce is a living model — signals, thresholds and weights are updated<br/>
            periodically as the season sample grows. Treat it as directional, not prescriptive.<br/>
            <span style={{color:'rgba(255,255,255,.25)',fontSize:7,marginTop:4,display:'block'}}>
              ✱ v5 analysis · 12,965 HRs · 430,587 PAs · Last updated: May 13, 2026
            </span>
          </div>
        </div>
      </div>
    </>}
  </>;
}

function BvPHistoryTab({ data }) {
  useHROdds();
  const picks = usePicks();
  const [rows, setRows]           = useState([]); // [{...batter, ...bvpStats}]
  const [loading, setLoading]     = useState(false);
  const [loaded, setLoaded]       = useState(false);
  const [sortCol, setSortCol]     = useState('hr');
  const [sortDir, setSortDir]     = useState(1);  // 1 with (bn-an) = descending
  const [bvpPicksOnly, setBvpPicksOnly]     = useState(false);
  const [bvpBatterHand, setBvpBatterHand]   = useState('ALL');
  const [bvpPitcherHand, setBvpPitcherHand] = useState('ALL');
  const [bvpLineupOnly, setBvpLineupOnly]   = useState(false);
  const [bvpActiveOnly, setBvpActiveOnly]   = useState(false);
  const [bvpInjuredOnly, setBvpInjuredOnly] = useState(false);
  const [minPA, setMinPA]         = useState(1);
  const [search, setSearch]       = useState('');

  // Build unique batter+pitcher pairs from engine data
  const pairs = useMemo(() => {
    if (!data?.length) return [];
    const seen = new Set();
    const out = [];
    data.forEach(r => {
      const bid = parseInt(r.batter_id)||0;
      const pid = parseInt(r.pitcher_id)||0;
      if (!bid || !pid) return;
      const k = `${bid}_${pid}`;
      if (seen.has(k)) return;
      seen.add(k);
      const battingTeam = r.batting_team || '—';
      const rawGid = String(r.game_id||'').trim();
      const gid = rawGid.includes('.')?String(parseInt(rawGid)):rawGid;
      const gameTeams = gid ? [...(DAILY_GAME_MAP[gid]||[])] : [];
      const pitcherTeam = gameTeams.find(t => t !== battingTeam) || r.pitcher_team || '—';
      out.push({
        batterId:    bid,
        pitcherId:   pid,
        batter:      r.batter      || '—',
        team:        battingTeam,
        opp:         pitcherTeam,
        pitcher:     r.pitcher     || '—',
        pitcherHand: r.pitcher_hand || '?',
        batterHand:  r.batter_hand  || '',
        grade:       r.grade       || '—',
      });
    });
    return out;
  }, [data]);

  // Load BvP data when tab first shown
  useEffect(() => {
    if (loaded || !pairs.length) return;
    setLoading(true);
    setLoaded(true);

    // Fetch in batches of 8 to avoid hammering the API
    // NOTE: rows only set AFTER all batches complete to avoid partial display bug
    const fetchAll = async () => {
      const results = [];
      const BATCH = 8;
      for (let i = 0; i < pairs.length; i += BATCH) {
        const batch = pairs.slice(i, i + BATCH);
        const batchResults = await Promise.all(
          batch.map(async p => {
            const { batter: _bid, pitcher: _pid, ...statFields } = await fetchBvP(p.batterId, p.pitcherId);
            return { ...p, ...statFields };
          })
        );
        results.push(...batchResults);
        if (i + BATCH < pairs.length) await new Promise(r => setTimeout(r, 120));
      }
      setRows([...results]); // set ALL at once — no partial display
      setLoading(false);
    };
    fetchAll();
  }, [pairs, loaded]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => -d);
    else { setSortCol(col); setSortDir(1); } // 1 = desc with bn-an formula
  };

  const filtered = useMemo(() => {
    let r = rows;
    r = r.filter(x => matchesHandFilter(x.batter_hand||x.batterHand||'', bvpBatterHand));
    r = r.filter(x => matchesHandFilter(x.pitcher_hand||x.pitcherHand||'', bvpPitcherHand));
    if (bvpPicksOnly)  r = r.filter(x => picks[String(x.batterId)]);
    if (bvpLineupOnly) r = r.filter(x => parseInt(x.batterId||0) > 0 && LINEUP_STATUS[parseInt(x.batterId||0)]?.status === 'confirmed');
    if (bvpActiveOnly) r = r.filter(x => !INJURY_MAP[String(x.batterId)]);
    if (bvpInjuredOnly) r = r.filter(x => !!INJURY_MAP[String(x.batterId)]);
    if (minPA > 0) r = r.filter(x => (x.pa||0) >= minPA);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(x => x.batter?.toLowerCase().includes(q) || x.pitcher?.toLowerCase().includes(q) || x.team?.toLowerCase().includes(q));
    }
    return [...r].sort((a,b) => {
      const av = a[sortCol] ?? (sortCol==='avg'||sortCol==='obp'||sortCol==='slg' ? '0' : 0);
      const bv = b[sortCol] ?? (sortCol==='avg'||sortCol==='obp'||sortCol==='slg' ? '0' : 0);
      const an = typeof av === 'string' ? parseFloat(av)||0 : av;
      const bn = typeof bv === 'string' ? parseFloat(bv)||0 : bv;
      return sortDir * (bn - an);
    });
  }, [rows, sortCol, sortDir, minPA, search, bvpPicksOnly, bvpLineupOnly, bvpActiveOnly, bvpInjuredOnly, bvpBatterHand, bvpPitcherHand]);

  const SortIcon = ({col}) => sortCol===col
    ? <span style={{marginLeft:3,fontSize:8}}>{sortDir===-1?'▼':'▲'}</span>
    : null;

  const COLS = [
    {key:'team',    label:'Tm',      align:'left',  render:r=><span style={{color:'var(--accent2)',fontWeight:700,fontFamily:"'Oswald',sans-serif",fontSize:11}}>{r.team}</span>},
    {key:'batter',  label:'Batter',  align:'left',  render:r=>(
      <div style={{display:'flex',alignItems:'center',gap:5}}>
        <PickButton pid={r.batterId} name={r.batter} team={r.team}/>
        <PlayerAvatar pid={r.batterId} name={r.batter} size={20}/>
        <div style={{cursor:'pointer',display:'flex',alignItems:'center',gap:3}}
          onClick={()=>{const cp=getCachedPlayer(r.batterId)||{};openAtBatSlide({pid:r.batterId,name:r.batter,team:r.team,avgEV:cp.avgEV,barrel:cp.barrel,hr:cp.hr,avg:cp.avg,obp:cp.obp,slg:cp.slg});}}>
          {(() => {
            const dp = DAILY_PICKS_CACHE[String(r.batterId)] || null;
            const gc = dp?.grade ? (GRADE_CFG[dp.grade] || null) : (r.grade && GRADE_CFG[r.grade] ? GRADE_CFG[r.grade] : null);
            return <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,
              color: gc ? gc.color : 'var(--text)'}}>{r.batter}</span>;
          })()}
          <InjuryBadge pid={r.batterId} name={r.batter}/>
          <span style={{fontSize:9,opacity:.4}}>›</span>
        </div>
      </div>
    )},
    {key:'opp',     label:'Opp',     align:'left',  render:r=><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'var(--muted)'}}>{r.opp}</span>},
    {key:'pitcher', label:'Pitcher', align:'left',  render:r=>(
      <div style={{cursor:'pointer',display:'flex',alignItems:'center',gap:4}}
        onClick={()=>openPitcherSlide({pid:r.pitcherId,name:r.pitcher,team:r.opp,hand:r.pitcherHand,pitchMix:[]})}>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:10}}>{r.pitcher}</span>
          <InjuryBadge pid={r.pitcherId} name={r.pitcher}/>
        <span style={{fontSize:8,color:'var(--muted)',opacity:.4}}>({r.pitcherHand}HP)</span>
        <span style={{fontSize:9,opacity:.4}}>›</span>
      </div>
    )},
    {key:'pa',   label:'PA',  align:'right', render:r=>r.pa||'—'},
    {key:'ab',   label:'AB',  align:'right', render:r=>r.pa>0?r.ab:'—'},
    {key:'h',    label:'H',   align:'right', render:r=>r.pa>0?r.h:'—'},
    {key:'hr',   label:'HR',  align:'right', render:r=>r.pa>0?<span style={{color:r.hr>0?'var(--accent)':'inherit',fontWeight:r.hr>0?700:400}}>{r.hr}</span>:'—'},
    {key:'b1',   label:'1B',  align:'right', render:r=>r.pa>0?r.b1:'—'},
    {key:'b2',   label:'2B',  align:'right', render:r=>r.pa>0?r.b2:'—'},
    {key:'b3',   label:'3B',  align:'right', render:r=>r.pa>0?r.b3:'—'},
    {key:'bb',   label:'BB',  align:'right', render:r=>r.pa>0?r.bb:'—'},
    {key:'k',    label:'K',   align:'right', render:r=>r.pa>0?r.k:'—'},
    {key:'sb',   label:'SB',  align:'right', render:r=>r.pa>0?r.sb:'—'},
    {key:'avg',  label:'AVG', align:'right', render:r=>r.pa>0?<span style={{color:parseFloat(r.avg)>=.300?'#27c97a':parseFloat(r.avg)<=.200?'var(--accent)':'var(--text)',fontWeight:600}}>{r.avg}</span>:'—'},
    {key:'obp',  label:'OBP', align:'right', render:r=>r.pa>0?<span style={{color:parseFloat(r.obp)>=.370?'#27c97a':'var(--text)'}}>{r.obp}</span>:'—'},
    {key:'slg',  label:'SLG', align:'right', render:r=>r.pa>0?<span style={{color:parseFloat(r.slg)>=.500?'#27c97a':'var(--text)'}}>{r.slg}</span>:'—'},
    {key:'hrOdds',label:'HR Odds',align:'right',render:r=><HROddsCell pid={r.batterId}/>},
  ];

  const noPA = filtered.filter(r => (r.pa||0) === 0).length;
  const withPA = filtered.filter(r => (r.pa||0) > 0).length;

  return (
    <div>
      {/* Controls */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <HandFilter mode="batter" value={bvpBatterHand} onChange={setBvpBatterHand}/>
        <HandFilter mode="pitcher" value={bvpPitcherHand} onChange={setBvpPitcherHand}/>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search batter or pitcher…"
          style={{padding:'6px 11px',borderRadius:7,border:`1px solid ${search?'var(--accent2)':'var(--border)'}`,
            background:'var(--surface2)',color:'var(--text)',fontFamily:"'DM Mono',monospace",
            fontSize:11,flex:'1 1 180px',minWidth:120}}/>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:.8}}>Min PA:</span>
          {[0,1,3,5,10].map(n=>(
            <button key={n} onClick={()=>setMinPA(n)}
              style={{padding:'3px 9px',borderRadius:5,cursor:'pointer',fontSize:10,
                fontFamily:"'DM Mono',monospace",fontWeight:minPA===n?700:400,
                background:minPA===n?'rgba(56,184,242,.18)':'transparent',
                color:minPA===n?'var(--ice)':'var(--muted)',
                border:`1px solid ${minPA===n?'rgba(56,184,242,.4)':'var(--border)'}`}}>
              {n===0?'All':n+'+'}
            </button>
          ))}
        </div>
        <button onClick={()=>setBvpLineupOnly(s=>!s)}
          style={{padding:'3px 10px',borderRadius:6,cursor:'pointer',flexShrink:0,
            border:`1px solid ${bvpLineupOnly?'#27c97a':'var(--border)'}`,
            background:bvpLineupOnly?'rgba(39,201,122,.12)':'transparent',
            color:bvpLineupOnly?'#27c97a':'var(--muted)',
            fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:bvpLineupOnly?700:400}}>
          ✅
        </button>
        <button onClick={()=>{setBvpActiveOnly(s=>!s);if(!bvpActiveOnly)setBvpInjuredOnly(false);}}
          style={{padding:'3px 10px',borderRadius:6,cursor:'pointer',
            border:`1px solid ${bvpActiveOnly?'#34d399':'var(--border)'}`,
            background:bvpActiveOnly?'rgba(52,211,153,.12)':'transparent',
            color:bvpActiveOnly?'#34d399':'var(--muted)',
            fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:bvpActiveOnly?700:400,
            whiteSpace:'nowrap',flexShrink:0}}>
          ☑️
        </button>
        <button onClick={()=>{setBvpInjuredOnly(s=>!s);if(!bvpInjuredOnly)setBvpActiveOnly(false);}}
          style={{padding:'3px 10px',borderRadius:6,cursor:'pointer',
            border:`1px solid ${bvpInjuredOnly?'#fb923c':'var(--border)'}`,
            background:bvpInjuredOnly?'rgba(251,146,60,.12)':'transparent',
            color:bvpInjuredOnly?'#fb923c':'var(--muted)',
            fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:bvpInjuredOnly?700:400,
            whiteSpace:'nowrap',flexShrink:0}}>
          🤕
        </button>

        <button onClick={()=>setBvpPicksOnly(s=>!s)}
          style={{padding:'3px 10px',borderRadius:6,cursor:'pointer',
            border:`1px solid ${bvpPicksOnly?'var(--accent2)':'var(--border)'}`,
            background:bvpPicksOnly?'rgba(245,166,35,.12)':'transparent',
            color:bvpPicksOnly?'var(--accent2)':'var(--muted)',
            fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:bvpPicksOnly?700:400,
            whiteSpace:'nowrap',flexShrink:0}}>
          🎯 {bvpPicksOnly ? 'My Picks ✓' : 'My Picks'}
        </button>
        {loading && (
          <div style={{display:'flex',alignItems:'center',gap:6,color:'var(--muted)',
            fontFamily:"'DM Mono',monospace",fontSize:10}}>
            <div className="sp" style={{width:12,height:12,borderWidth:2}}/> Loading {rows.length}/{pairs.length}…
          </div>
        )}
        {!loading && rows.length > 0 && (
          <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",marginLeft:'auto'}}>
            {withPA} with history · {noPA} no PA (hidden at Min PA 1+)
          </span>
        )}
      </div>

      {/* CSV Export */}
      {filtered.length > 0 && (
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:8}}>
          <button onClick={()=>{
            const dq = String.fromCharCode(34);
            const esc = v => dq+String(v==null?'':v).replace(new RegExp(dq,'g'),dq+dq)+dq;
            const headers = ['Tm','Batter','Opp','Pitcher','Hand','PA','AB','H','HR','1B','2B','3B','BB','K','SB','AVG','OBP','SLG'];
            const rows2 = filtered.map(r=>[
              r.team, r.batter, r.opp, r.pitcher, r.pitcherHand+'HP',
              r.pa, r.ab, r.h, r.hr, r.b1, r.b2, r.b3, r.bb, r.k, r.sb,
              r.avg, r.obp, r.slg
            ].map(esc).join(','));
            const csv = '\uFEFF' + headers.join(',') + '\n' + rows2.join('\n');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
            a.download = 'bvp-history.csv';
            a.click();
          }}
          style={{padding:'4px 12px',borderRadius:6,cursor:'pointer',
            background:'var(--surface2)',border:'1px solid var(--border)',
            color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:10,
            display:'flex',alignItems:'center',gap:5}}>
            ⬇ CSV
          </button>
        </div>
      )}

      {/* Table */}
      {rows.length === 0 && !loading
        ? <div style={{padding:'40px',textAlign:'center',color:'var(--muted)',
            fontFamily:"'DM Mono',monospace",fontSize:11}}>
            {pairs.length===0?'No engine data loaded':'Loading career head-to-head stats…'}
          </div>
        : <div className="tw" style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'var(--surface2)',position:'sticky',top:0,zIndex:2}}>
                  {COLS.map(c=>(
                    <th key={c.key} onClick={()=>handleSort(c.key)}
                      style={{padding:'6px 8px',textAlign:c.align||'right',cursor:'pointer',
                        fontSize:9,color:sortCol===c.key?'var(--ice)':'var(--muted)',
                        fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:.8,
                        whiteSpace:'nowrap',borderBottom:'1px solid var(--border)',
                        background:sortCol===c.key?'rgba(56,184,242,.08)':'transparent'}}>
                      {c.label}<SortIcon col={c.key}/>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r,i)=>(
                  <tr key={`${r.batterId}_${r.pitcherId}`}
                    className="dr"
                    style={{opacity:r.pa===0?0.45:1}}>
                    {COLS.map(c=>(
                      <td key={c.key}
                        style={{padding:'5px 8px',textAlign:c.align||'right',
                          fontFamily:"'DM Mono',monospace",fontSize:11,
                          borderBottom:'1px solid rgba(30,45,58,.4)'}}>
                        {c.render(r)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }
    </div>
  );
}

function BatterLeaderboard() {
  useInjuries();
  useHROdds();
  const [activeOnly, setActiveOnly]           = useState(false);
  const [battersLineupOnly, setBattersLineupOnly] = useState(false);
  const [injuredOnly, setInjuredOnly]         = useState(false);
  const [hotBatOnly, setHotBatOnly]           = useState(false);
  const [slateFilter, setSlateFilter]     = useState('all');
  const [expandedBatter, setExpandedBatter] = useState(null);
  const [sortCol, setSortCol] = useState('avgEV');
  const [sortDir, setSortDir] = useState('desc');
  const [teamFilter, setTeamFilter] = useState('all');
  const [searchQ, setSearchQ] = useState('');
  const [minPA, setMinPA] = useState(10);
  const [selectedWin, setSelectedWin] = useState('last7');
  const [players, setPlayers] = useState([]);
  const [showPicksOnly, setShowPicksOnly] = useState(false);
  const [filterGoneYard, setFilterGoneYard] = useState(false);
  const [filterDue, setFilterDue] = useState(false);
  const [blBatterHand, setBlBatterHand] = useState('ALL');
  const picks = usePicks();
  const bprops = useBatterProps();
  // L7 HR fallback for batters not in daily_picks (not scheduled today)
  // Uses same fetchGameLog/GAME_LOG_CACHE as the Gone Yard chart
  const [l7FallbackCache, setL7FallbackCache] = useState({});

  // PLAYER_DATA_CACHE is a module-level object (not React state) so we
  // need to poll until fetchPlayers() has populated it at startup
  useEffect(() => {
    const load = () => {
      const cached = Object.values(PLAYER_DATA_CACHE).filter(p => p.pid && p.name);
      if (cached.length > 0) setPlayers(cached);
    };
    load();
    if (Object.keys(PLAYER_DATA_CACHE).length < 5) {
      const id = setInterval(() => {
        const cached = Object.values(PLAYER_DATA_CACHE).filter(p => p.pid && p.name);
        if (cached.length > 5) { setPlayers(cached); clearInterval(id); }
      }, 400);
      return () => clearInterval(id);
    }
  }, []);

  // Batch-fetch L7 HR data for batters not in daily_picks (not scheduled today)
  // Uses GAME_LOG_CACHE — same cache as Gone Yard chart — max 40 fetches to avoid spam
  useEffect(() => {
    if (players.length === 0) return;
    const toFetch = players
      .filter(p => {
        const pid = String(p.pid||p.id||'');
        return pid && !DAILY_PICKS_CACHE[pid] && !l7FallbackCache[pid];
      })
      .slice(0, 40); // cap at 40 per load
    if (toFetch.length === 0) return;
    let cancelled = false;
    (async () => {
      const updates = {};
      for (const p of toFetch) {
        if (cancelled) break;
        const pid = p.pid || p.id;
        try {
          const games = await fetchGameLog(pid);
          const last7 = games.slice(-7);
          updates[String(pid)] = last7.reduce((s, g) => s + (g.hrs||0), 0);
        } catch {}
      }
      if (!cancelled && Object.keys(updates).length > 0)
        setL7FallbackCache(prev => ({...prev, ...updates}));
    })();
    return () => { cancelled = true; };
  }, [players.length]);

  // Window buttons config
  const WIN_BTNS = [
    { key:'last7',     label:'L7',         tip:'Last 7 days' },
    { key:'last14',    label:'L14',        tip:'Last 14 days' },
    { key:'last30',    label:'L30',        tip:'Last 30 days' },
    { key:'last60',    label:'L60',        tip:'Last 60 days' },
    { key:'season2026',label:'2026',       tip:'2026 season' },
    { key:'season2025',label:'2025',       tip:'2025 season' },
  ];

  // All columns the pipeline computes per-window (Statcast + counting stats)
  const SC_WIN_KEYS = new Set([
    'avgEV','barrel','hardHit','flyBall','gbPct','launchAngle', // Statcast
    'pa','ab','hr','avg','obp','slg','kPct','bbPct',            // pipeline counting stats
    'hits','xbh',                                               // counting stats also windowed
  ]);
  // Full-season windows pull ALL stats from the window
  const SEASON_WINS = new Set(['season2025','season2026']);

  // Resolve a stat from the selected window.
  // Guard: use w.pa > 0 (window has real plate appearances) rather than
  // w[key] !== 0 — otherwise "0 HRs this week" falls back to season total.
  const ws = (p, key) => {
    const w = p.windows?.[selectedWin];
    const wHasData = (w?.pa || w?.atBats) > 0;
    if (SEASON_WINS.has(selectedWin)) {
      if (wHasData && w[key] != null) return w[key];
      if (selectedWin === 'season2026') return p[key] ?? 0;
      return 0; // season2025 with no data → blank
    }
    // Rolling window: use pipeline value if the window has PA data
    if (!SC_WIN_KEYS.has(key)) return p[key] ?? 0;
    if (wHasData && w[key] != null) return w[key];
    return p[key] ?? 0; // fall back to season
  };

  // Detect whether real window data is available in the cache
  const hasRealWindows = players.some(p =>
    p.windows?.last7?.avgEV > 0 || p.windows?.last14?.avgEV > 0
  );
  const hasSeason2025 = players.some(p => p.windows?.season2025?.avgEV > 0);

  const allPlayers = players;
  const teams = [...new Set(allPlayers.map(p => p.team).filter(t => t && t !== '—'))].sort();

  const handleSort = col => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  // Gone Yard check — did this batter hit a HR *today* (resets at 4am ET with pipeline)
  const etToday = (() => { const s=new Date().toLocaleDateString('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}); const [m,d,y]=s.split('/'); return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`; })();
  const hrDataIsToday = HR_DATA_DATE === etToday;
  const isGoneYard = p => hrDataIsToday && HR_DATA.some(h =>
    h.batterId === p.pid ||
    (h.batterName && p.name && h.batterName.toLowerCase() === p.name.toLowerCase())
  );

  const filtered = allPlayers
    .filter(p => {
      if (selectedWin === 'season2025') {
        const w25 = p.windows?.season2025;
        if (!w25 || !w25.pa) return false;
        return w25.pa >= Math.max(minPA, 1);
      }
      return (ws(p,'pa') || 0) >= minPA;
    })
    .filter(p => teamFilter === 'all' || p.team === teamFilter)
    .filter(p => {

      if (!matchesHandFilter(p.batSide||p.hand||'', blBatterHand)) return false;      if (slateFilter === 'all') return true;
      if (slateFilter === 'today') return TODAY_TEAMS.has(p.team);
      if (slateFilter === 'tomorrow') return TOMORROW_TEAMS.has(p.team);
      return true;
    })
    .filter(p => !searchQ || p.name?.toLowerCase().includes(searchQ.toLowerCase()))
    .filter(p => !showPicksOnly || picks[String(p.pid)])
    .filter(p => !battersLineupOnly || (parseInt(p.pid||p.id||0) > 0 && LINEUP_STATUS[parseInt(p.pid||p.id||0)]?.status === 'confirmed'))
    .filter(p => !activeOnly || !INJURY_MAP[String(p.pid||p.id)])
    .filter(p => !injuredOnly || !!INJURY_MAP[String(p.pid||p.id)])
    .filter(p => !hotBatOnly || isHotBatPlayer(p))
    .filter(p => !filterGoneYard || isGoneYard(p))
    .filter(p => !filterDue || isDue(p.pid||p.id))
    .sort((a, b) => {
      const evCount = (p, thresh) => {
        const hh = ws(p,'hardHit') || 0;
        const pa = ws(p,'pa') || ws(p,'ab') || 0;
        if (pa > 0) {
          const ratio = thresh >= 100 ? 0.40 : 1.0;
          return Math.round(hh / 100 * pa * ratio);
        }
        return (p.recentAtBats||[]).filter(ab=>(ab.ev||0)>=thresh).length;
      };
      const av = sortCol === 'name' ? (a.name||'')
               : sortCol === 'ev95'  ? evCount(a, 95)
               : sortCol === 'ev100' ? evCount(a, 100)
               : ws(a, sortCol) ?? (a[sortCol] ?? 0);
      const bv = sortCol === 'name' ? (b.name||'')
               : sortCol === 'ev95'  ? evCount(b, 95)
               : sortCol === 'ev100' ? evCount(b, 100)
               : ws(b, sortCol) ?? (b[sortCol] ?? 0);
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'desc' ? bv - av : av - bv;
    });

  // fmtPct: show '—' only for null/undefined, show '0.0%' for actual zero
  const fmtStat = v => (v != null && v > 0) ? '.' + String(Math.round(v * 1000)).padStart(3, '0') : '—';
  const fmtEV   = v => (v != null && v > 0) ? v.toFixed(1) : '—';
  const fmtPct  = v => v != null ? v.toFixed(1) + '%' : '—';
  const fmtLA   = v => v != null ? v.toFixed(1) + '°' : '—';

  const evCol  = v => v >= 92 ? '#ff4020' : v >= 90 ? '#ff8020' : v >= 88 ? '#f5a623' : v >= 85 ? 'var(--text)' : 'var(--muted)';
  const brlCol = v => v >= 12 ? '#ff4020' : v >= 8 ? '#ff8020' : v >= 5 ? '#f5a623' : 'var(--muted)';
  const hhCol  = v => v >= 50 ? '#ff4020' : v >= 42 ? '#ff8020' : v >= 35 ? '#f5a623' : 'var(--muted)';
  const opsCol = v => v >= 1.0 ? '#ff4020' : v >= .900 ? '#ff8020' : v >= .800 ? '#f5a623' : 'var(--text)';
  const hrCol  = v => v >= 15 ? '#ff4020' : v >= 10 ? '#f5a623' : 'var(--text)';

  // Statcast cols use ws() for window-aware values; traditional stats always season
  const STAT_COLS = [
    { key:'team',       label:'Team',   render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:'var(--accent2)',fontWeight:700}}>{p.team||'—'}</span> },
    { key:'pa',         label:'PA',     render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{ws(p,'pa')||0}</span> },
    { key:'avgEV',      label:'Avg EV', render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,color:evCol(ws(p,'avgEV'))}}>{fmtEV(ws(p,'avgEV'))}</span> },
    { key:'ev95', label:'95+ EV', render: p => {
        const hh = ws(p,'hardHit') || 0;
        const pa = ws(p,'pa') || ws(p,'ab') || 0;
        const v = pa > 0 ? Math.round(hh / 100 * pa) : (p.recentAtBats||[]).filter(a=>(a.ev||0)>=95).length;
        return <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:v>=10?'#ff4020':v>=6?'#ff8020':v>=3?'#f5a623':'var(--text)'}}>{v||0}</span>;
      }},
    { key:'ev100',label:'100+ EV',render: p => {
        const hh = ws(p,'hardHit') || 0;
        const pa = ws(p,'pa') || ws(p,'ab') || 0;
        const v = pa > 0 ? Math.round(hh / 100 * pa * 0.40) : (p.recentAtBats||[]).filter(a=>(a.ev||0)>=100).length;
        return <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:v>=5?'#ff4020':v>=3?'#ff8020':v>=1?'#f5a623':'var(--text)'}}>{v||0}</span>;
      }},
    { key:'barrel',     label:'Brl%',   render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:brlCol(ws(p,'barrel'))}}>{fmtPct(ws(p,'barrel'))}</span> },
    { key:'hardHit',    label:'HH%',    render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:hhCol(ws(p,'hardHit'))}}>{fmtPct(ws(p,'hardHit'))}</span> },
    { key:'flyBall',    label:'FB%',    render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{fmtPct(ws(p,'flyBall'))}</span> },
    { key:'gbPct',      label:'GB%',    render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:'var(--muted)'}}>{fmtPct(ws(p,'gbPct'))}</span> },
    { key:'launchAngle',label:'Avg LA', render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{fmtLA(ws(p,'launchAngle'))}</span> },
    // Traditional stats — windowed for season views, full-season for rolling windows
    { key:'avg',  label:'BA',  render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{fmtStat(ws(p,'avg'))}</span> },
    { key:'obp',  label:'OBP', render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{fmtStat(ws(p,'obp'))}</span> },
    { key:'slg',  label:'SLG', render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{fmtStat(ws(p,'slg'))}</span> },
    { key:'ops',  label:'OPS', render: p => { const v=(ws(p,'slg')||0)+(ws(p,'obp')||0); return <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,color:opsCol(v)}}>{fmtStat(v||ws(p,'ops'))}</span>; }},
    { key:'hr',   label:'HR',  render: p => { const v=ws(p,'hr'); return <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:v>=10?700:400,color:hrCol(v)}}>{v||0}</span>; }},
    { key:'l7hr', label:'💥 L7', render: p => {
        // daily_picks.csv for scheduled batters; game log API fallback for the rest
        const pid = String(p.pid||p.id||'');
        const fromPicks = DAILY_PICKS_CACHE[pid]?.recent_hr_count;
        const n = parseInt(fromPicks != null ? fromPicks : (l7FallbackCache[pid] ?? 0));
        const col = n>=3?'#ff4020':n>=1?'#f5a623':'rgba(255,255,255,.2)';
        return <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,color:col}}>{n>0?n:'—'}</span>;
      }},
    { key:'hits', label:'H',   render: p => { const v=ws(p,'hits'); return <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:v>=30?'#27c97a':v>=20?'#f5a623':'var(--text)'}}>{v||0}</span>; }},
    { key:'xbh',  label:'XBH', render: p => { const v=ws(p,'xbh');  return <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:v>=12?'#ff8020':v>=7?'#f5a623':'var(--text)'}}>{v||0}</span>; }},
    { key:'kPct', label:'K%',  render: p => { const v=ws(p,'kPct'); return <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:v>=28?'var(--ice)':'var(--muted)'}}>{fmtPct(v)}</span>; }},
    { key:'bbPct',label:'BB%', render: p => { const v=ws(p,'bbPct'); return <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:v>=12?'#27c97a':'var(--muted)'}}>{fmtPct(v)}</span>; }},
    { key:'hrOdds',label:'HR Odds', render: p => <HROddsCell pid={p.pid||p.id}/> },
  ];

  const SortIcon = ({col}) => sortCol===col
    ? <span style={{marginLeft:3,fontSize:9,opacity:.8}}>{sortDir==='desc'?'▼':'▲'}</span>
    : null;

  return (
    <div>      {/* Controls row */}
      <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flex:'1 1 200px',minWidth:160}}>
          <input type="text" value={searchQ} onChange={e=>setSearchQ(e.target.value)}
            placeholder="Search batter…"
            style={{width:'100%',padding:'7px 28px 7px 28px',background:'var(--surface2)',
              border:'1px solid var(--border)',borderRadius:7,color:'var(--text)',
              fontFamily:"'DM Mono',monospace",fontSize:11,outline:'none',boxSizing:'border-box'}}/>
      <HandFilter mode="batter" value={blBatterHand} onChange={setBlBatterHand}/>
          <span style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',pointerEvents:'none'}}>🔍</span>
          {searchQ && <button onClick={()=>setSearchQ('')}
            style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',
              background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:11}}>✕</button>}
        </div>
        <select value={teamFilter} onChange={e=>setTeamFilter(e.target.value)}
          style={{padding:'7px 10px',background:'var(--surface2)',border:'1px solid var(--border)',
            borderRadius:7,color:'var(--text)',fontFamily:"'DM Mono',monospace",fontSize:11,cursor:'pointer'}}>
          <option value="all">All Teams</option>
          {teams.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        {/* Slate filter — today/tomorrow */}
        {[['all','All'],['today',`📅 Today (${TODAY_TEAMS.size})`],['tomorrow',`📅 Tomorrow (${TOMORROW_TEAMS.size})`]].map(([k,l])=>(
          <button key={k} onClick={()=>setSlateFilter(k)}
            style={{padding:'6px 10px',borderRadius:7,cursor:'pointer',whiteSpace:'nowrap',
              border:`1px solid ${slateFilter===k?'var(--ice)':'var(--border)'}`,
              background:slateFilter===k?'rgba(56,184,242,.12)':'var(--surface2)',
              color:slateFilter===k?'var(--ice)':'var(--muted)',
              fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:slateFilter===k?700:400}}>
            {l}
          </button>
        ))}
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace",whiteSpace:'nowrap'}}>Min PA:</span>
          <input type="number" min={0} max={600} value={minPA}
            onChange={e=>setMinPA(Math.max(0,parseInt(e.target.value)||0))}
            style={{width:54,padding:'6px 8px',background:'var(--surface2)',
              border:'1px solid var(--border)',borderRadius:7,color:'var(--text)',
              fontFamily:"'DM Mono',monospace",fontSize:11,outline:'none',textAlign:'center'}}/>
        </div>
        <button onClick={()=>setBattersLineupOnly(s=>!s)}
          style={{padding:'6px 12px',borderRadius:7,cursor:'pointer',
            border:`1px solid ${battersLineupOnly?'#27c97a':'var(--border)'}`,
            background:battersLineupOnly?'rgba(39,201,122,.12)':'var(--surface2)',
            color:battersLineupOnly?'#27c97a':'var(--muted)',
            fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:battersLineupOnly?700:400,
            whiteSpace:'nowrap'}}>
          ✅
        </button>
        <button onClick={()=>setShowPicksOnly(s=>!s)}
          style={{padding:'6px 12px',borderRadius:7,cursor:'pointer',
            border:`1px solid ${showPicksOnly?'var(--accent2)':'var(--border)'}`,
            background:showPicksOnly?'rgba(245,166,35,.12)':'var(--surface2)',
            color:showPicksOnly?'var(--accent2)':'var(--muted)',
            fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:showPicksOnly?700:400,
            whiteSpace:'nowrap',transition:'all .15s'}}>
          🎯
        </button>
        <button onClick={()=>{setActiveOnly(s=>!s);if(!activeOnly)setInjuredOnly(false);}}
          style={{padding:'6px 12px',borderRadius:7,cursor:'pointer',
            border:`1px solid ${activeOnly?'#34d399':'var(--border)'}`,
            background:activeOnly?'rgba(52,211,153,.12)':'var(--surface2)',
            color:activeOnly?'#34d399':'var(--muted)',
            fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:activeOnly?700:400,
            whiteSpace:'nowrap'}}>
          ☑️
        </button>
        <button onClick={()=>{setInjuredOnly(s=>!s);if(!injuredOnly)setActiveOnly(false);}}
          style={{padding:'6px 12px',borderRadius:7,cursor:'pointer',
            border:`1px solid ${injuredOnly?'#fb923c':'var(--border)'}`,
            background:injuredOnly?'rgba(251,146,60,.12)':'var(--surface2)',
            color:injuredOnly?'#fb923c':'var(--muted)',
            fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:injuredOnly?700:400,
            whiteSpace:'nowrap'}}>
          🤕
        </button>
        <button onClick={()=>setHotBatOnly(s=>!s)}
          style={{padding:'6px 12px',borderRadius:7,cursor:'pointer',
            border:`1px solid ${hotBatOnly?'#fb923c':'var(--border)'}`,
            background:hotBatOnly?'rgba(251,146,60,.12)':'var(--surface2)',
            color:hotBatOnly?'#fb923c':'var(--muted)',
            fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:hotBatOnly?700:400,
            whiteSpace:'nowrap'}}>
          🔥
        </button>
        <button onClick={()=>setFilterGoneYard(s=>!s)}
          style={{padding:'6px 12px',borderRadius:7,cursor:'pointer',
            border:`1px solid ${filterGoneYard?'rgba(255,20,0,.5)':'var(--border)'}`,
            background:filterGoneYard?'rgba(255,20,0,.18)':'var(--surface2)',
            color:filterGoneYard?'#ff4020':'var(--muted)',
            fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:filterGoneYard?700:400,
            whiteSpace:'nowrap',transition:'all .15s'}}>
          💥
        </button>
        <button onClick={()=>setFilterDue(v=>!v)}
          style={{padding:'4px 10px',borderRadius:6,cursor:'pointer',
            background:filterDue?'rgba(56,184,242,.18)':'transparent',
            color:filterDue?'var(--ice)':'var(--muted)',
            border:`1px solid ${filterDue?'rgba(56,184,242,.5)':'var(--border)'}`,
            fontFamily:"'DM Mono',monospace",fontWeight:filterDue?700:400,fontSize:11}}>
          ⏳
        </button>
        <button onClick={()=>{
          const esc = v => `"${String(v??'').replace(/"/g,'""')}"`;
          const winLabel = selectedWin === 'season2026' ? 'Season2026'
            : selectedWin === 'season2025' ? 'Season2025'
            : selectedWin === 'last7' ? 'L7'
            : selectedWin === 'last14' ? 'L14'
            : selectedWin === 'last30' ? 'L30' : selectedWin;
          const teamLabel = teamFilter !== 'all' ? `-${teamFilter}` : '';
          const f3 = v => (v != null && v > 0) ? '.' + String(Math.round(v * 1000)).padStart(3, '0') : '';
          const f1 = v => (v != null && v > 0) ? v.toFixed(1) : '';
          const hdrs = ['Batter','Team','PA','Avg EV','Brl%','HH%','FB%','GB%','Avg LA','BA','OBP','SLG','OPS','HR','K%','BB%'];
          const rows = [hdrs.map(esc).join(',')];
          // Export the current filtered+sorted view — ws() gives window-aware values
          filtered.forEach(p => {
            const ops = (ws(p,'slg')||0) + (ws(p,'obp')||0);
            rows.push([
              esc(p.name),
              esc(p.team||''),
              esc(ws(p,'pa')||0),
              esc(f1(ws(p,'avgEV'))),
              esc(f1(ws(p,'barrel'))),
              esc(f1(ws(p,'hardHit'))),
              esc(f1(ws(p,'flyBall'))),
              esc(f1(ws(p,'gbPct'))),
              esc(f1(ws(p,'launchAngle'))),
              esc(f3(ws(p,'avg'))),
              esc(f3(ws(p,'obp'))),
              esc(f3(ws(p,'slg'))),
              esc(f3(ops || ws(p,'ops'))),
              esc(ws(p,'hr')||0),
              esc(f1(ws(p,'kPct'))),
              esc(f1(ws(p,'bbPct'))),
            ].join(','));
          });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(new Blob(['\uFEFF'+rows.join('\n')],{type:'text/csv;charset=utf-8;'}));
          a.download = `batters-${winLabel}${teamLabel}-${new Date().toISOString().slice(0,10)}.csv`;
          a.click();
        }} style={{padding:'6px 11px',borderRadius:7,cursor:'pointer',
          border:'1px solid var(--border)',background:'var(--surface2)',
          color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:11,
          whiteSpace:'nowrap',transition:'all .15s'}} title="Export current filtered view to CSV">
          ⬇ CSV
        </button>
        <span style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace",whiteSpace:'nowrap'}}>
          {filtered.length} batters
        </span>
      </div>

      {/* Window selector row */}
      <div style={{display:'flex',gap:5,marginBottom:10,alignItems:'center',flexWrap:'wrap'}}>
        <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
          textTransform:'uppercase',letterSpacing:1,marginRight:2,whiteSpace:'nowrap'}}>
          Statcast window:
        </span>
        {WIN_BTNS.map(b => (
          <button key={b.key} title={b.tip} onClick={()=>setSelectedWin(b.key)}
            style={{padding:'4px 11px',borderRadius:6,cursor:'pointer',transition:'all .15s',
              border:`1px solid ${selectedWin===b.key?'var(--accent2)':'var(--border)'}`,
              background:selectedWin===b.key?'rgba(245,166,35,.14)':'var(--surface2)',
              color:selectedWin===b.key?'var(--accent2)':'var(--muted)',
              fontFamily:"'DM Mono',monospace",fontSize:10,
              fontWeight:selectedWin===b.key?700:400}}>
            {b.label}
          </button>
        ))}
        {/* Data source indicator */}
        <span style={{
          marginLeft:6,fontSize:9,fontFamily:"'DM Mono',monospace",
          color: (selectedWin==='season2025' ? hasSeason2025 : hasRealWindows) ? '#27c97a' : '#f5a623',
          padding:'2px 8px',borderRadius:5,
          background: (selectedWin==='season2025' ? hasSeason2025 : hasRealWindows) ? 'rgba(39,201,122,.1)' : 'rgba(245,166,35,.1)',
          border:`1px solid ${(selectedWin==='season2025' ? hasSeason2025 : hasRealWindows)?'rgba(39,201,122,.25)':'rgba(245,166,35,.25)'}`,
        }}>
          {selectedWin === 'season2025'
            ? (hasSeason2025 ? '✓ 2025 season · all stats from pipeline' : '⚠ no 2025 data · re-run mlbdata_aggregate.py')
            : (hasRealWindows ? '✓ pipeline · EV/Brl/HH windowed' : '⚠ run mlbdata_aggregate.py for real windows · showing season avg')}
        </span>
      </div>

      {players.length === 0 ? (
        <div style={{padding:'40px 20px',textAlign:'center',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:11}}>
          <div className="sp" style={{margin:'0 auto 12px'}}/>
          Loading Statcast data… loads at app startup
        </div>
      ) : selectedWin === 'season2025' && !hasSeason2025 ? (
        <div style={{padding:'32px 20px',textAlign:'center',background:'rgba(245,166,35,.06)',
          border:'1px solid rgba(245,166,35,.2)',borderRadius:9,
          fontFamily:"'DM Mono',monospace",fontSize:11,color:'#f5a623',lineHeight:1.8}}>
          ⚠ No 2025 season data in cache<br/>
          <span style={{color:'var(--muted)',fontSize:10}}>
            Re-run mlbdata_aggregate.py to populate season2025 window data, then commit players.json
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{padding:'24px 20px',textAlign:'center',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:11}}>
          No batters match current filters
        </div>
      ) : (
        <div className="tw">
          <table>
            <thead>
              <tr style={{lineHeight:1.2}}>
                <th style={{width:28,textAlign:'center'}}></th>
                <th style={{textAlign:'left',cursor:'pointer',whiteSpace:'nowrap',minWidth:90}} className={sortCol==='name'?'sk':''} onClick={()=>handleSort('name')}>
                  Batter<SortIcon col="name"/>
                </th>
                {STAT_COLS.map(c=>(
                  <th key={c.key} className={sortCol===c.key?'sk':''} style={{textAlign:'right',cursor:'pointer',whiteSpace:'normal',wordBreak:'break-word',maxWidth:36,fontSize:8,lineHeight:1.2,padding:'4px 4px'}}
                    onClick={()=>handleSort(c.key)}>
                    {c.label}<SortIcon col={c.key}/>
                  </th>
                ))}
                <th style={{textAlign:'center',width:20}}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,300).flatMap(p=>{
                const isExpanded = expandedBatter === (p.pid||p.id);
                const mainRow = (<tr key={p.pid} className="dr"
                    onClick={e=>{
                      if (e.target.closest('.batter-name-cell')) return;
                      setExpandedBatter(isExpanded ? null : (p.pid||p.id));
                    }}
                    style={{cursor:'pointer',
                      background:isExpanded?'rgba(56,184,242,.07)':'',
                      outline:isExpanded?'1px solid rgba(56,184,242,.25)':''}}>
                    {/* Pick button — first */}
                    <td style={{textAlign:'center',paddingRight:2}}>
                      <PickButton pid={p.pid} name={p.name} team={p.team}/>
                    </td>
                    {/* Batter name — single line, click opens slideout */}
                    <td className="batter-name-cell" style={{textAlign:'left',whiteSpace:'nowrap'}}>
                      <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <PlayerAvatar pid={p.pid||p.id} name={p.name} size={20}/>
                        <div style={{cursor:'pointer',display:'flex',alignItems:'center',gap:3}} onClick={()=>{const cp=getCachedPlayer(p.pid||p.id)||{};openAtBatSlide({pid:p.pid||p.id,name:p.name,team:p.team,avgEV:cp.avgEV||p.avgEV,barrel:cp.barrel,hardHit:cp.hardHit,flyBall:cp.flyBall,hr:cp.hr,avg:cp.avg,obp:cp.obp,slg:cp.slg,xwoba:cp.xwoba,oSwing:cp.oSwing,kPct:cp.kPct,bbPct:cp.bbPct,launchAngle:cp.launchAngle});}}>
                          {(() => {
                            const dp = DAILY_PICKS_CACHE[String(p.pid||p.id)] || null;
                            const gc = dp?.grade ? (GRADE_CFG[dp.grade] || null) : null;
                            const isInj = !!INJURY_MAP[String(p.pid||p.id||'')];
                            return <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,letterSpacing:.2,
                              color: gc && !isInj ? gc.color : 'var(--text)'}}>{p.name}</span>;
                          })()}
                          <span style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",opacity:.7}}>({p.hand==='L'?'L':p.hand==='S'?'S':'R'})</span>
                          <span style={{fontSize:9,color:'var(--muted)',opacity:.4}}>›</span>
                        </div>
                        {isGoneYard(p) && <span style={{fontSize:7,padding:'1px 4px',borderRadius:3,
                          background:'rgba(255,20,0,.25)',border:'1px solid rgba(255,20,0,.5)',
                          color:'#fff',fontFamily:"'DM Mono',monospace",fontWeight:800,flexShrink:0}}>GY</span>}
                        {isHotBatPlayer(p) && <span style={{fontSize:10,flexShrink:0,lineHeight:1}}
                          title={`🔥 Hot Bat — ${parseFloat(p.windows?.last7?.hr??0).toFixed(0)} HR in last 7 days`}>🔥</span>}
                        <InjuryBadge pid={p.pid||p.id} name={p.name}/>
                      </div>
                    </td>
                    {/* Stat columns */}
                    {STAT_COLS.map(c=>(
                      <td key={c.key} style={{textAlign:'right',padding:'5px 4px'}}>
                        {c.render(p)}
                      </td>
                    ))}
                    <td style={{textAlign:'center'}}>
                      <SavantLink pid={p.pid||p.id} type="batter"/>
                    </td>
                  </tr>
                );
                const logRow = isExpanded ? (
                  <tr key={String(p.pid)+'ab'}>
                    <td colSpan={STAT_COLS.length+3}
                      style={{padding:'0 12px 12px 12px',
                        background:'rgba(56,184,242,.04)',
                        borderBottom:'2px solid rgba(56,184,242,.2)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,
                        padding:'8px 0 4px',borderBottom:'1px solid var(--border)',marginBottom:4}}>
                        <PlayerAvatar pid={p.pid||p.id} name={p.name} size={24}/>
                        <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
                          fontSize:13,letterSpacing:.5}}>{p.name}</span>
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,
                          color:'var(--accent2)'}}>{p.team}</span>
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,
                          color:'var(--muted)',marginLeft:'auto'}}>Recent ABs</span>
                      </div>
                      <InjuryBanner pid={p.pid||p.id} style={{margin:'6px 0 4px'}}/>
                      <Last7HRChart batterId={p.pid||p.id}/>
                      <RecentGameLog batterId={p.pid||p.id}/>
                    </td>
                  </tr>
                ) : null;
                return [mainRow, logRow].filter(Boolean);
              })}
            </tbody>
          </table>
          {filtered.length > 300 && (
            <div style={{padding:'8px 14px',fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textAlign:'center'}}>
              Showing top 300 · refine search to see more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── PITCHER LEADERBOARD ────────────────────────────────────────
function PitcherLeaderboard() {
  useInjuries();
  const [activeOnly, setActiveOnly]   = useState(false);
  const [injuredOnly, setInjuredOnly] = useState(false);
  const [pitchers, setPitchers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [sortCol, setSortCol]       = useState('era');
  const [sortDir, setSortDir]       = useState('asc');
  const [teamFilter, setTeamFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('SP'); // all | SP | RP
  const [searchQ, setSearchQ]       = useState('');
  const [minIP, setMinIP]           = useState(5);
  const [gradeFilter, setGradeFilter]     = useState('all');
  const [plPitcherHand, setPlPitcherHand] = useState('ALL');
  // Static MLB team ID → abbreviation map (IDs are stable across seasons)
  const TEAM_ABBR = {
    133:'ATH',134:'PIT',135:'SD',136:'SEA',137:'SF',138:'STL',
    139:'TB',140:'TEX',141:'TOR',142:'MIN',143:'PHI',144:'ATL',
    145:'CWS',146:'MIA',147:'NYY',158:'MIL',108:'LAA',109:'ARI',
    110:'BAL',111:'BOS',112:'CHC',113:'CIN',114:'CLE',115:'COL',
    116:'DET',117:'HOU',118:'KC',119:'LAD',120:'WSH',121:'NYM',
  };

  useEffect(()=>{
    const season = new Date().getFullYear();
    fetch(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&gameType=R&season=${season}&sportId=1&limit=2000&playerPool=ALL&hydrate=person`)
      .then(r=>{ if(!r.ok) throw new Error(`MLB API ${r.status}`); return r.json(); })
      .then(d=>{
        const splits = d.stats?.[0]?.splits || [];
        const mapped = splits.map(s=>{
          const teamId = s.team?.id;
          const abbr   = TEAM_ABBR[teamId] || '—';
          const ipRaw  = String(s.stat?.inningsPitched ?? '0');
          const ipParts= ipRaw.split('.');
          const ipVal  = parseFloat(ipParts[0]||0) + (parseFloat(ipParts[1]||0)/3);
          return {
            pid:      s.player?.id,
            name:     s.player?.fullName || '—',
            hand:     s.player?.pitchHand?.code || '—',
            team:     abbr,
            wins:     s.stat?.wins      ?? 0,
            losses:   s.stat?.losses    ?? 0,
            era:      parseFloat(s.stat?.era              ?? 99),
            whip:     parseFloat(s.stat?.whip             ?? 0),
            k9:       parseFloat(s.stat?.strikeoutsPer9Inn?? 0),
            bb9:      parseFloat(s.stat?.walksPer9Inn     ?? 0),
            hr9:      parseFloat(s.stat?.homeRunsPer9     ?? 0),
            ip:       ipVal,
            ipDisplay:ipRaw,
            gs:       s.stat?.gamesStarted ?? 0,
            gp:       s.stat?.gamesPlayed  ?? 0,
            so:       s.stat?.strikeOuts   ?? 0,
            bb:       s.stat?.baseOnBalls  ?? 0,
            hr:       s.stat?.homeRuns     ?? 0,
            avg:      parseFloat(s.stat?.avg ?? 0),
            obp:      parseFloat(s.stat?.obp ?? 0),
            slg:      parseFloat(s.stat?.slg ?? 0),
            ops:      parseFloat(s.stat?.ops ?? 0),
          };
        }).filter(p => p.pid && (p.ip > 0 || p.gp > 0));
        setPitchers(mapped);
        setLoading(false);
      })
      .catch(e=>{ setError(e.message); setLoading(false); });
  },[]);

  const handleSort = col => {
    if (sortCol === col) setSortDir(d=>d==='asc'?'desc':'asc');
    else {
      setSortCol(col);
      // ERA/WHIP/BB9/HR9 — lower is better → default asc; K9 → higher is better → desc
      setSortDir(['era','whip','bb9','hr9','avg','obp','ops'].includes(col)?'asc':'desc');
    }
  };

  const teams = [...new Set(pitchers.map(p=>p.team).filter(Boolean))].sort();

  // Pre-compute grade for every pitcher so we can filter + display it
  const withGrades = pitchers.map(p => ({
    ...p,
    _grade: gradePitcher(p.era, p.k9, p.whip, p.bb9, p.hr9, p.avg, p.obp),
  }));

  const filtered = withGrades
    .filter(p => p.ip >= minIP)
    .filter(p => matchesHandFilter(p.hand||'', plPitcherHand))
    .filter(p => teamFilter === 'all' || p.team === teamFilter)
    .filter(p => roleFilter === 'all' || (roleFilter==='SP' ? p.gs > 0 : p.gs === 0))
    .filter(p => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()))
    .filter(p => gradeFilter === 'all' || p._grade.label === gradeFilter)
    .filter(p => !activeOnly || !INJURY_MAP[String(p.pid)])
    .filter(p => !injuredOnly || !!INJURY_MAP[String(p.pid)])
    .sort((a,b)=>{
      const av = sortCol==='name'?(a.name||''):(a[sortCol]??99);
      const bv = sortCol==='name'?(b.name||''):(b[sortCol]??99);
      if(typeof av==='string') return sortDir==='asc'?av.localeCompare(bv):bv.localeCompare(av);
      return sortDir==='asc'?av-bv:bv-av;
    });

  const fmtStat = v => v > 0 ? '.'+String(Math.round(v*1000)).padStart(3,'0') : '—';
  const fmtDec  = (v,d=2) => v!=null&&!isNaN(v)&&v<99 ? v.toFixed(d) : '—';

  const eraCol  = v => v < 3.0 ? '#27c97a' : v < 3.75 ? '#f5a623' : v < 4.50 ? 'var(--text)' : v < 5.50 ? 'var(--ice)' : '#ff4020';
  const whipCol = v => v < 1.10 ? '#27c97a' : v < 1.25 ? '#f5a623' : v < 1.40 ? 'var(--text)' : '#ff4020';
  const k9Col   = v => v >= 11 ? '#ff4020' : v >= 9.5 ? '#ff8020' : v >= 8 ? '#f5a623' : 'var(--muted)';
  const bb9Col  = v => v < 2.0 ? '#27c97a' : v < 3.0 ? '#f5a623' : v < 4.0 ? 'var(--text)' : '#38b8f2';
  const hr9Col  = v => v < 0.8 ? '#27c97a' : v < 1.2 ? '#f5a623' : v < 1.6 ? 'var(--text)' : '#ff4020';

  const COLS = [
    { key:'name',   label:'Pitcher',   align:'left',
      render: p => <div style={{cursor:'pointer',whiteSpace:'nowrap'}}
        onClick={e=>{e.stopPropagation();openPitcherSlide({pid:p.pid,name:p.name,team:p.team,hand:p.hand,pitchMix:[]});}}>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,letterSpacing:.2}}>{p.name}</span>
          <span style={{fontSize:9,color:'var(--muted)',opacity:.4}}>›</span>
        </div>
      </div>
    },
    { key:'team',   label:'Team',   render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:'var(--accent2)',fontWeight:700}}>{p.team}</span> },
    { key:'hand',   label:'Hand',   align:'center',
      render: p => <span style={{
        fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:700,
        padding:'1px 6px',borderRadius:4,
        background: p.hand==='L'?'rgba(56,184,242,.12)':'rgba(255,128,32,.10)',
        color: p.hand==='L'?'#38b8f2':'#ff8020',
        border:`1px solid ${p.hand==='L'?'rgba(56,184,242,.3)':'rgba(255,128,32,.3)'}`,
      }}>{p.hand==='L'?'LHP':p.hand==='R'?'RHP':'—'}</span>
    },
    { key:'_grade', label:'Grade',  align:'center',
      render: p => <span style={{
        padding:'2px 8px',borderRadius:5,fontSize:10,fontWeight:700,
        fontFamily:"'DM Mono',monospace",whiteSpace:'nowrap',
        background:p._grade.bg, border:`1px solid ${p._grade.color}40`,
        color:p._grade.color,
      }}>{p._grade.label}</span>
    },
    { key:'wins',   label:'W-L',    align:'center',
      render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700}}>
        <span style={{color:'#27c97a'}}>{p.wins}</span>
        <span style={{color:'var(--muted)'}}>-</span>
        <span style={{color:'var(--ice)'}}>{p.losses}</span>
      </span>
    },
    { key:'era',    label:'ERA',    render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,color:eraCol(p.era)}}>{fmtDec(p.era)}</span> },
    { key:'whip',   label:'WHIP',   render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:whipCol(p.whip)}}>{fmtDec(p.whip)}</span> },
    { key:'k9',     label:'K/9',    render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:k9Col(p.k9)}}>{fmtDec(p.k9)}</span> },
    { key:'bb9',    label:'BB/9',   render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:bb9Col(p.bb9)}}>{fmtDec(p.bb9)}</span> },
    { key:'hr9',    label:'HR/9',   render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:hr9Col(p.hr9)}}>{fmtDec(p.hr9)}</span> },
    { key:'ip',     label:'IP',     render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{p.ipDisplay||fmtDec(p.ip,1)}</span> },
    { key:'so',     label:'K',      render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{p.so}</span> },
    { key:'hr',     label:'HR',     render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:p.hr>=15?'#ff4020':p.hr>=10?'#f5a623':'var(--text)',fontWeight:p.hr>=10?700:400}}>{p.hr}</span> },
    { key:'avg',    label:'BAA',    render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{fmtStat(p.avg)}</span> },
    { key:'obp',    label:'OBP',    render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{fmtStat(p.obp)}</span> },
    { key:'ops',    label:'OPS',    render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{fmtStat(p.ops)}</span> },
  ];


  const SortIcon = ({col}) => sortCol===col
    ? <span style={{marginLeft:3,fontSize:9,opacity:.8}}>{sortDir==='asc'?'▲':'▼'}</span>
    : null;

  return (
    <div>      {/* Controls */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flex:'1 1 180px',minWidth:150}}>
          <input type="text" value={searchQ} onChange={e=>setSearchQ(e.target.value)}
            placeholder="Search pitcher…"
            style={{width:'100%',padding:'7px 28px 7px 28px',background:'var(--surface2)',
              border:'1px solid var(--border)',borderRadius:7,color:'var(--text)',
              fontFamily:"'DM Mono',monospace",fontSize:11,outline:'none',boxSizing:'border-box'}}/>
      <HandFilter mode="pitcher" value={plPitcherHand} onChange={setPlPitcherHand}/>
          <span style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',pointerEvents:'none'}}>🔍</span>
          {searchQ && <button onClick={()=>setSearchQ('')}
            style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',
              background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:11}}>✕</button>}
        </div>
        <select value={teamFilter} onChange={e=>setTeamFilter(e.target.value)}
          style={{padding:'7px 10px',background:'var(--surface2)',border:'1px solid var(--border)',
            borderRadius:7,color:'var(--text)',fontFamily:"'DM Mono',monospace",fontSize:11,cursor:'pointer'}}>
          <option value="all">All Teams</option>
          {teams.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}
          style={{padding:'7px 10px',background:'var(--surface2)',border:'1px solid var(--border)',
            borderRadius:7,color:'var(--text)',fontFamily:"'DM Mono',monospace",fontSize:11,cursor:'pointer'}}>
          <option value="all">SP + RP</option>
          <option value="SP">Starters</option>
          <option value="RP">Relievers</option>
        </select>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace",whiteSpace:'nowrap'}}>Min IP:</span>
          <select value={minIP} onChange={e=>setMinIP(Number(e.target.value))}
            style={{padding:'7px 8px',background:'var(--surface2)',border:'1px solid var(--border)',
              borderRadius:7,color:'var(--text)',fontFamily:"'DM Mono',monospace",fontSize:11,cursor:'pointer'}}>
            {[0,5,10,20,30,50,75].map(v=><option key={v} value={v}>{v===0?'No min':v+'+'}</option>)}
          </select>
        </div>
        <button onClick={()=>{
          const esc = v => `"${String(v??'').replace(/"/g,'""')}"`;
          const role = roleFilter==='SP'?'SP':roleFilter==='RP'?'RP':'SP+RP';
          const teamLabel = teamFilter !== 'all' ? `-${teamFilter}` : '';
          const ipLabel = minIP > 0 ? `-min${minIP}IP` : '';
          const rows = [['Pitcher','Team','Hand','Role','Grade','W','L','ERA','WHIP','K/9','BB/9','HR/9','IP','K','HR','BAA','OBP','OPS'].map(esc).join(',')];
          // Export the current filtered view — team, role, minIP, search all applied
          filtered.forEach(p => {
            const f2 = v => (v!=null&&!isNaN(v)&&v<99)?v.toFixed(2):'';
            const f3 = v => v>0?'.'+String(Math.round(v*1000)).padStart(3,'0'):'';
            rows.push([
              esc(p.name), esc(p.team), esc(p.hand==='L'?'LHP':p.hand==='R'?'RHP':'—'), esc(p.gs>0?'SP':'RP'),
              esc(p._grade?.label||''),
              esc(p.wins), esc(p.losses),
              esc(f2(p.era)), esc(f2(p.whip)),
              esc(f2(p.k9)), esc(f2(p.bb9)), esc(f2(p.hr9)),
              esc(p.ipDisplay||f2(p.ip)),
              esc(p.so), esc(p.hr),
              esc(f3(p.avg)), esc(f3(p.obp)), esc(f3(p.ops)),
            ].join(','));
          });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(new Blob(['\uFEFF'+rows.join('\n')],{type:'text/csv;charset=utf-8;'}));
          a.download = `pitchers-${role}${teamLabel}${ipLabel}-${new Date().toISOString().slice(0,10)}.csv`;
          a.click();
        }} style={{padding:'6px 11px',borderRadius:7,cursor:'pointer',
          border:'1px solid var(--border)',background:'var(--surface2)',
          color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:11,
          whiteSpace:'nowrap',transition:'all .15s'}} title="Export current filtered view to CSV">
          ⬇ CSV
        </button>
        <span style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace",whiteSpace:'nowrap'}}>
          {filtered.length} pitchers
        </span>
      </div>

      {/* Grade filter chips */}
      {!loading && !error && pitchers.length > 0 && (
        <div style={{display:'flex',gap:5,marginBottom:10,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
            textTransform:'uppercase',letterSpacing:1,marginRight:2,whiteSpace:'nowrap'}}>
            Grade:
          </span>
          {['all','‼️ Elite','⚠️ Tough','🤔 Average','💥 Hittable','🎯 Target'].map(g => {
            const cfg = g==='all' ? null : {
              '‼️ Elite':   {color:'#ff4020'}, '⚠️ Tough':   {color:'#ff8020'},
              '🤔 Average': {color:'var(--muted)'}, '💥 Hittable': {color:'#27c97a'},
              '🎯 Target':  {color:'#38b8f2'},
            }[g];
            const active = gradeFilter === g;
            const col = cfg?.color || 'var(--accent2)';
            return (
              <button key={g} onClick={()=>setGradeFilter(g)}
                style={{padding:'4px 11px',borderRadius:6,cursor:'pointer',transition:'all .15s',
                  border:`1px solid ${active ? col : 'var(--border)'}`,
                  background: active ? `${col}18` : 'var(--surface2)',
                  color: active ? col : 'var(--muted)',
                  fontFamily:"'DM Mono',monospace",fontSize:10,
                  fontWeight: active ? 700 : 400}}>
                {g === 'all' ? 'All' : g.split(' ')[0]}
              </button>
            );
          })}
        </div>
      )}

      {loading && (
        <div style={{padding:'40px 20px',textAlign:'center',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:11,display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
          <div className="sp"/>
          Fetching pitcher stats from MLB API…
        </div>
      )}
      {error && (
        <div className="warn">⚠ Could not load pitcher stats: {error}</div>
      )}
      {!loading && !error && (
        <div className="tw">
          <table>
            <thead>
              <tr>
                {COLS.map(c=>(
                  <th key={c.key} className={sortCol===c.key?'sk':''} style={{textAlign:c.align||'center',cursor:'pointer',
                    whiteSpace:'normal',wordBreak:'break-word',fontSize:9,lineHeight:1.2,
                    padding:'5px 5px',verticalAlign:'bottom'}}
                    onClick={()=>handleSort(c.key)}>
                    {c.label}<SortIcon col={c.key}/>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,300).map(p=>(
                <tr key={p.pid} className="dr">
                  {COLS.map(c=>(
                    <td key={c.key} style={{textAlign:c.align||'right'}}>
                      {c.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 300 && (
            <div style={{padding:'8px 14px',fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textAlign:'center'}}>
              Showing top 300 · refine filters to see more
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// Shows last 5 at-bats from the pipeline at-bat log — stored in players.json recentAtBats

// ── LAST 7 GAMES HR CHART — fetches from MLB Stats API game log ──────────────
const GAME_LOG_CACHE = {}; // pid → { games, ts }

async function fetchGameLog(pid) {
  if (!pid) return [];
  const key = String(pid);
  const cached = GAME_LOG_CACHE[key];
  if (cached && Date.now() - cached.ts < 3600000) return cached.games; // 1hr cache
  try {
    const season = new Date().getFullYear();
    const r = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${pid}/stats?stats=gameLog&group=hitting&season=${season}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return [];
    const d = await r.json();
    const splits = d?.stats?.[0]?.splits || [];
    const ABBR = {133:'ATH',134:'PIT',135:'SD',136:'SEA',137:'SF',138:'STL',139:'TB',140:'TEX',141:'TOR',142:'MIN',143:'PHI',144:'ATL',145:'CWS',146:'MIA',147:'NYY',158:'MIL',108:'LAA',109:'ARI',110:'BAL',111:'BOS',112:'CHC',113:'CIN',114:'CLE',115:'COL',116:'DET',117:'HOU',118:'KC',119:'LAD',120:'WSH',121:'NYM'};
    const games = splits.map(s => ({
      date: s.date || '',
      opp:  ABBR[s.opponent?.id] || s.opponent?.abbreviation || s.opponent?.name?.replace(/^.* /,'') || '?',
      loc:  s.isHome ? 'home' : 'away',
      hrs:  parseInt(s.stat?.homeRuns ?? 0),
      ab:   parseInt(s.stat?.atBats   ?? 0),
      h:    parseInt(s.stat?.hits     ?? 0),
    })).sort((a,b) => a.date > b.date ? 1 : -1);
    GAME_LOG_CACHE[key] = { games, ts: Date.now() };
    return games;
  } catch { return []; }
}

function Last7HRChart({ batterId }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!batterId) return;
    setLoading(true);
    fetchGameLog(batterId).then(g => {
      setGames(g.slice(-7)); // last 7 games
      setLoading(false);
    });
  }, [batterId]);

  if (loading) return (
    <div style={{padding:'12px 0',textAlign:'center',fontFamily:"'DM Mono',monospace",
      fontSize:9,color:'var(--muted)'}}>Loading game log…</div>
  );
  if (games.length === 0) return null;

  const hitGames = games.filter(g => g.hrs > 0).length;
  const pct      = Math.round((hitGames / games.length) * 100);
  const maxHR    = Math.max(1, ...games.map(g => g.hrs));
  const BAR_H    = 120;
  const pctColor = pct >= 57 ? '#27c97a' : pct >= 43 ? '#ffc840' : 'var(--muted)';
  const label    = games.length < 7 ? `LAST ${games.length}` : 'LAST 7';

  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',
      borderRadius:12,padding:'14px 16px',marginTop:12}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:12}}>
        <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:12,
          letterSpacing:.5,color:'var(--text)'}}>💥 Gone Yard</span>
        <div style={{display:'flex',alignItems:'baseline',gap:8}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:'var(--muted)'}}>
            {hitGames} of {games.length}
          </span>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:22,
            color:pctColor}}>{pct}%</span>
        </div>
      </div>

      {/* Bars */}
      <div style={{display:'flex',alignItems:'flex-end',gap:4,height:BAR_H,
        position:'relative',paddingLeft:14,paddingRight:14}}>
        <span style={{position:'absolute',left:0,top:0,fontFamily:"'DM Mono',monospace",
          fontSize:8,color:'var(--muted)',lineHeight:1}}>1</span>
        <span style={{position:'absolute',left:0,bottom:0,fontFamily:"'DM Mono',monospace",
          fontSize:8,color:'var(--muted)',lineHeight:1}}>0</span>
        <div style={{position:'absolute',left:10,right:10,top:BAR_H/2,
          borderTop:'1px solid rgba(255,255,255,.12)',zIndex:0,pointerEvents:'none'}}/>
        <span style={{position:'absolute',right:0,top:BAR_H/2-12,fontFamily:"'DM Mono',monospace",
          fontSize:8,color:'rgba(255,255,255,.3)'}}>0.5</span>
        {games.map((g, i) => {
          const isHR = g.hrs > 0;
          const barH = isHR
            ? Math.max(Math.round(BAR_H * (g.hrs / maxHR)), Math.round(BAR_H * 0.5))
            : 0;
          return (
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'flex-end',height:'100%',gap:2,zIndex:1}}>
              <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:10,
                lineHeight:1,color:isHR?'#27c97a':'#ff4020'}}>{g.hrs}</span>
              <div style={{width:'100%',borderRadius:'4px 4px 0 0',
                height:isHR ? barH : 2,
                background:isHR?'linear-gradient(180deg,#27c97a,#1aa862)':'rgba(255,64,32,.15)',
                minHeight:2}}/>
            </div>
          );
        })}
      </div>

      {/* Date + opp labels */}
      <div style={{display:'flex',gap:4,marginTop:6,paddingLeft:14,paddingRight:14}}>
        {games.map((g,i) => (
          <div key={i} style={{flex:1,textAlign:'center'}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:7.5,
              color:'var(--muted)',lineHeight:1.4}}>
              {(g.date||'').slice(5).replace('-','/')}
            </div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:7.5,
              color:'var(--muted)',lineHeight:1.3,opacity:.6}}>
              {(g.loc==='away'?'@':'vs')} {g.opp}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentGameLog({ batterId }) {
  const abs = getCachedPlayer(batterId)?.recentAtBats;
  if (!abs || abs.length === 0) return null;

  const RESULT_LABEL = {
    home_run:'💥 HR', single:'1B', double:'2B', triple:'3B',
    strikeout:'K', walk:'BB', hit_by_pitch:'HBP',
    field_out:'Out', force_out:'FO', grounded_into_double_play:'DP',
    double_play:'DP', sac_fly:'SF', sac_bunt:'SH',
    intent_walk:'IBB', field_error:'E', fielders_choice:'FC',
    strikeout_double_play:'KDP', catcher_interf:'CI',
  };
  const resultColor = r => {
    if (r === 'home_run') return 'var(--accent)';
    if (['single','double','triple'].includes(r)) return '#27c97a';
    if (r === 'walk' || r === 'intent_walk' || r === 'hit_by_pitch') return '#38b8f2';
    if (r === 'strikeout' || r === 'strikeout_double_play') return 'var(--ice)';
    return 'var(--muted)';
  };

  return (
    <div style={{marginTop:10}}>
      <div style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
        textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>
        📋 Recent At-Bats
      </div>
      <div style={{border:'1px solid var(--border)',borderRadius:7,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'var(--surface2)'}}>
              {['Date','Opp','Result','EV','LA','Dist','Pitch'].map(h => (
                <th key={h} style={{padding:'4px 7px',
                  textAlign:h==='Result'?'left':'center',
                  fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                  textTransform:'uppercase',letterSpacing:.5,whiteSpace:'nowrap',
                  borderBottom:'1px solid var(--border)'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {abs.map((a, i) => (
              <tr key={i} style={{
                borderBottom:i<abs.length-1?'1px solid rgba(255,255,255,.04)':'none',
                background:i%2===0?'rgba(255,255,255,.01)':'transparent'}}>
                <td style={{padding:'4px 7px',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:9,whiteSpace:'nowrap'}}>{a.date?.slice(5)||'—'}</td>
                <td style={{padding:'4px 7px',textAlign:'center',fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,color:'var(--accent2)'}}>{a.opp||'—'}</td>
                <td style={{padding:'4px 7px',fontFamily:"'DM Mono',monospace",fontSize:9,whiteSpace:'nowrap',
                  color:resultColor(a.result),fontWeight:['home_run','single','double','triple'].includes(a.result)?700:400}}>
                  {RESULT_LABEL[a.result] || a.result || '—'}</td>
                <td style={{padding:'4px 7px',textAlign:'center',fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,
                  color:a.ev>=103?'#ff4020':a.ev>=95?'#ff8020':a.ev>=90?'#ffc840':a.ev>0?'var(--text)':'var(--muted)'}}>
                  {a.ev != null ? a.ev.toFixed(1) : '—'}</td>
                <td style={{padding:'4px 7px',textAlign:'center',fontFamily:"'DM Mono',monospace",fontSize:9,
                  color:a.la!=null&&a.la>=20&&a.la<=35?'#27c97a':'var(--muted)'}}>
                  {a.la != null ? a.la.toFixed(0)+'°' : '—'}</td>
                <td style={{padding:'4px 7px',textAlign:'center',fontFamily:"'DM Mono',monospace",fontSize:9,
                  color:a.dist>=400?'#ff4020':a.dist>=350?'#ff8020':a.dist>0?'var(--text)':'var(--muted)'}}>
                  {a.dist > 0 ? a.dist+'ft' : '—'}</td>
                <td style={{padding:'4px 7px',textAlign:'center',fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)'}}>{a.pitch||'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}




// ══════════════════════════════════════════════════════════════════════════════
// CLOSE CALLS TAB
// Batters with ≥2 near-HR events yesterday (deep fly outs, hard XBH, rockets)
// Excludes batters who went yard (unless 3+ close calls = on a tear)
// ══════════════════════════════════════════════════════════════════════════════

function SoCloseTab({ data }) {
  const mono = "'DM Mono',monospace";
  const osw  = "'Oswald',sans-serif";
  const [sortBy,  setSortBy]  = useState('so_close_max_dist');
  const [sortDir, setSortDir] = useState(-1);  // -1=desc 1=asc
  const [search,  setSearch]  = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [expandedBid, setExpandedBid] = useState(null);

  // ── Pull batters with so_close events from DAILY_PICKS_CACHE ──────────────
  const rows = React.useMemo(() => {
    const seen = new Set();
    return Object.values(DAILY_PICKS_CACHE)
      .filter(b => {
        const bid = String(b.batter_id||'').split('.')[0];
        if (!bid || seen.has(bid) || !b.batter || !b.game_id) return false;
        seen.add(bid);
        const closeCount = parseInt(b.so_close_count||0);
        const wentYard   = parseInt(b._hrYest||b.hr_yesterday||0) > 0;
        if (closeCount < 2) return false;
        if (wentYard && closeCount < 3) return false;
        return true;
      })
      .map(b => {
        const bid = String(b.batter_id||'').split('.')[0];
        const pid = parseInt(bid)||0;
        const ls  = LINEUP_STATUS[pid] || {};
        const dp  = DAILY_PICKS_CACHE[bid] || b;
        const wentYard = parseInt(b._hrYest||b.hr_yesterday||0) > 0;
        const closeCount = parseInt(b.so_close_count||0);
        return {
          bid, pid,
          name:      b.batter || '',
          team:      b.batting_team || '',
          pitcher:   b.pitcher || '',
          grade:     b.grade || '',
          pgLabel:   dp._pgLabel || '',
          _yard:     parseFloat(b._yard||0),
          confirmed: ls.status === 'confirmed',
          projected: ls.status === 'projected',
          isDiamond: b.is_diamond === 'True' || b.is_diamond === true,
          isDue:     isDueFromCache ? isDueFromCache(bid) : false,
          isHot:     isHotBatPlayer ? isHotBatPlayer({pid,windows:b.windows}) : false,
          on_tear:   wentYard && closeCount >= 3,
          count:     closeCount,
          max_dist:  parseFloat(b.so_close_max_dist||0),
          max_ev:    parseFloat(b.so_close_max_ev||0),
          reasons:   b.so_close_reasons || '',
          rec_ev:    parseFloat(b.recent_avg_ev||0),
          sim_tb:    parseFloat(b.sim_tb||0),
          ps_score:  parseFloat(b.ps_score||0),
          iso:       parseFloat(b.recent_iso||0),
        };
      })
      .filter(r => {
        if (teamFilter !== 'ALL' && r.team !== teamFilter) return false;
        if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.team.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const av = a[sortBy] ?? -999, bv = b[sortBy] ?? -999;
        return sortDir * (typeof av === 'string' ? av.localeCompare(bv) : bv - av) * -1;
      });
  }, [sortBy, sortDir, teamFilter, search]);

  // ── Teams on today's slate ─────────────────────────────────────────────────
  const teams = React.useMemo(() => {
    const t = new Set(Object.values(DAILY_PICKS_CACHE).map(b => b.batting_team||'').filter(Boolean));
    return ['ALL', ...Array.from(t).sort()];
  }, []);

  // ── Sortable column header ─────────────────────────────────────────────────
  const Th = ({col, label, title, align='right'}) => (
    <th onClick={()=>{ if(sortBy===col) setSortDir(d=>d*-1); else{setSortBy(col);setSortDir(-1);} }}
      style={{padding:'5px 8px',fontSize:8,fontFamily:mono,textTransform:'uppercase',
        letterSpacing:.6,whiteSpace:'nowrap',cursor:'pointer',textAlign:align,
        borderBottom:'1px solid var(--border)',background:'var(--surface2)',
        color:sortBy===col?'var(--accent2)':'var(--muted)'}}
      title={title}>
      {label}{sortBy===col?(sortDir===1?' ▲':' ▼'):''}
    </th>
  );

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const headers = ['Batter','Team','Pitcher','P.Grade','Yard','Close Calls','Max Dist(ft)','Max EV','L7 EV','Sim TB','ISO','On Tear','Near-Misses'];
    const csvRows = rows.map(r => [
      r.name, r.team, r.pitcher, r.pgLabel, r._yard, r.count,
      r.max_dist, r.max_ev, r.rec_ev, r.sim_tb, r.iso,
      r.on_tear?'YES':'', `"${r.reasons}"`
    ].join(','));
    const blob = new Blob([headers.join(',')+'
'+csvRows.join('
')], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='close-calls.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const distCol = d => d>=390?'#ff4020':d>=370?'#f5a623':d>=350?'#fbbf24':'var(--muted)';
  const evCol   = e => e>=105?'#ff4020':e>=100?'#f5a623':e>=95?'#27c97a':'var(--muted)';
  const pgCol   = g => !g?'var(--muted)':g.includes('Target')?'#27c97a':g.includes('Hittable')?'#60d360':g.includes('Elite')?'#ff4020':g.includes('Tough')?'#f5a623':'var(--muted)';

  return (
    <div style={{padding:'0 4px'}}>

      {/* ── Header + controls ────────────────────────────────────────────── */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginBottom:10}}>
        <div style={{flex:1,minWidth:160}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search batter or team..."
            style={{width:'100%',padding:'5px 10px',borderRadius:6,border:'1px solid var(--border)',
              background:'var(--surface2)',color:'var(--text)',fontFamily:mono,fontSize:9,
              outline:'none',boxSizing:'border-box'}}/>
        </div>
        <select value={teamFilter} onChange={e=>setTeamFilter(e.target.value)}
          style={{fontFamily:mono,fontSize:8,background:'var(--surface2)',color:'var(--text)',
            border:'1px solid var(--border)',borderRadius:4,padding:'5px 8px',cursor:'pointer'}}>
          {teams.map(t=><option key={t} value={t}>{t==='ALL'?'All Teams':t}</option>)}
        </select>
        <button onClick={handleExport}
          style={{padding:'5px 10px',borderRadius:6,background:'rgba(56,184,242,.1)',
            border:'1px solid rgba(56,184,242,.3)',color:'var(--ice)',cursor:'pointer',
            fontFamily:mono,fontSize:9,whiteSpace:'nowrap'}}>
          ⬇ Export CSV
        </button>
      </div>

      {/* ── Info bar ─────────────────────────────────────────────────────── */}
      <div style={{marginBottom:10,background:'rgba(251,191,36,.06)',borderRadius:6,
        border:'1px solid rgba(251,191,36,.2)',padding:'7px 12px',
        fontFamily:mono,fontSize:8,color:'var(--muted)',lineHeight:1.7}}>
        <span style={{color:'#fbbf24',fontWeight:700}}>{rows.length} batters</span> had ≥2 near-HR events yesterday and are playing today ·
        Excludes yesterday HRs unless 3+ close calls (<span style={{color:'#ff8020'}}>🔥 on a tear</span>) ·
        Click any row to expand recent ABs
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <div style={{textAlign:'center',padding:40,color:'var(--muted)',fontFamily:mono,fontSize:11}}>
          No Close Calls data yet — run the engine with yesterday's at-bat log
        </div>
      ) : (
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead>
              <tr>
                <th style={{padding:'5px 8px',fontSize:8,fontFamily:mono,textTransform:'uppercase',
                  letterSpacing:.6,color:'var(--muted)',textAlign:'left',position:'sticky',left:0,
                  borderBottom:'1px solid var(--border)',background:'var(--surface2)',zIndex:5,
                  whiteSpace:'nowrap'}}>Batter</th>
                <Th col="_yard"           label="🎯"         title="Yard Score"             align="center"/>
                <Th col="grade"           label="Gr"         title="Matchup Grade"          align="center"/>
                <Th col="pgLabel"         label="P.Grade"    title="Pitcher Grade"          align="center"/>
                <Th col="count"           label="Calls"      title="Close Call event count" align="center"/>
                <Th col="max_dist"        label="Max Dist"   title="Deepest near-miss (ft)" align="right"/>
                <Th col="max_ev"          label="Max EV"     title="Hardest hit EV (mph)"   align="right"/>
                <Th col="rec_ev"          label="L7 EV"      title="L7 avg exit velocity"   align="right"/>
                <Th col="sim_tb"          label="Sim TB"     title="Simulated total bases"  align="right"/>
                <Th col="iso"             label="ISO"        title="Recent isolated power"  align="right"/>
                <th style={{padding:'5px 8px',fontSize:8,fontFamily:mono,textTransform:'uppercase',
                  letterSpacing:.6,color:'var(--muted)',borderBottom:'1px solid var(--border)',
                  background:'var(--surface2)',whiteSpace:'nowrap'}}>Near-Misses</th>
              </tr>
            </thead>
            <tbody>
              {rows.flatMap(r => {
                const isExp = expandedBid === r.bid;
                const mainRow = (
                  <tr key={r.bid}
                    onClick={()=>setExpandedBid(isExp?null:r.bid)}
                    style={{cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,.04)',
                      background:isExp?'rgba(56,184,242,.06)':'transparent',
                      outline:isExp?'1px solid rgba(56,184,242,.2)':'none'}}>

                    {/* Batter cell — sticky */}
                    <td style={{padding:'4px 8px',position:'sticky',left:0,zIndex:4,
                      background:isExp?'rgba(56,184,242,.06)':'var(--surface)',
                      minWidth:200,whiteSpace:'nowrap'}}>
                      <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <PlayerAvatar pid={r.pid} name={r.name} size={20}/>
                        {/* Sticker badges */}
                        {r.confirmed && <span title="Confirmed in lineup" style={{fontSize:9,flexShrink:0}}>✅</span>}
                        {r.projected  && <span title="Projected in lineup" style={{fontSize:9,flexShrink:0,opacity:.7}}>📋</span>}
                        {r.isDiamond  && <span style={{padding:'1px 4px',borderRadius:3,fontSize:8,fontWeight:700,
                          background:'rgba(255,204,0,.15)',color:'#ffcc00',border:'1px solid rgba(255,204,0,.3)',flexShrink:0}}>💎</span>}
                        {r.on_tear    && <span title="On a tear — went yard + 3+ close calls" style={{fontSize:10,flexShrink:0}}>🔥</span>}
                        {r.isHot      && !r.on_tear && <span title="Hot bat" style={{fontSize:10,flexShrink:0}}>🌶️</span>}
                        {/* Name */}
                        <span onClick={e=>{e.stopPropagation();const cp=getCachedPlayer(r.pid)||{};
                          openAtBatSlide({pid:r.pid,name:r.name,team:r.team,
                            avgEV:cp.avgEV,barrel:cp.barrel,hardHit:cp.hardHit,flyBall:cp.flyBall,
                            hr:cp.hr,avg:cp.avg,obp:cp.obp,slg:cp.slg,xwoba:cp.xwoba,
                            kPct:cp.kPct,bbPct:cp.bbPct,launchAngle:cp.launchAngle});}}
                          style={{fontFamily:osw,fontWeight:700,fontSize:11,color:'var(--text)',
                            cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis'}}>
                          {r.name}
                        </span>
                        <span style={{fontFamily:mono,fontSize:7,color:'var(--muted)',fontWeight:700}}>{r.team}</span>
                        <PickButton pid={r.pid} name={r.name} team={r.team}/>
                      </div>
                    </td>

                    {/* Yard Score */}
                    <td style={{textAlign:'center',padding:'3px 6px'}}>
                      {r._yard > 0 && <YardBadge score={r._yard}/>}
                    </td>
                    {/* Grade */}
                    <td style={{textAlign:'center',padding:'3px 4px',fontFamily:mono,fontSize:9,fontWeight:700,
                      color:r.grade==='A+'?'#ffd700':r.grade==='A'?'#27c97a':r.grade==='B'?'#f5a623':'var(--muted)'}}>
                      {r.grade||'—'}
                    </td>
                    {/* Pitcher Grade */}
                    <td style={{textAlign:'center',padding:'3px 6px',fontFamily:mono,fontSize:8,
                      fontWeight:700,color:pgCol(r.pgLabel)}}>
                      {r.pgLabel?r.pgLabel.split(' ')[0]:'—'}
                    </td>
                    {/* Close Call count */}
                    <td style={{textAlign:'center',padding:'3px 8px',fontFamily:osw,fontWeight:800,
                      fontSize:14,color:r.count>=4?'#ff4020':r.count>=3?'#f5a623':'#fbbf24'}}>
                      {r.count}
                    </td>
                    {/* Max Distance */}
                    <td style={{textAlign:'right',padding:'3px 8px',fontFamily:mono,fontSize:10,
                      fontWeight:700,color:distCol(r.max_dist)}}>
                      {r.max_dist>0?`${r.max_dist.toFixed(0)}ft`:'—'}
                    </td>
                    {/* Max EV */}
                    <td style={{textAlign:'right',padding:'3px 8px',fontFamily:mono,fontSize:10,
                      color:evCol(r.max_ev)}}>
                      {r.max_ev>0?r.max_ev.toFixed(1):'—'}
                    </td>
                    {/* L7 EV */}
                    <td style={{textAlign:'right',padding:'3px 8px',fontFamily:mono,fontSize:9,
                      color:r.rec_ev>=95?'#ff4020':r.rec_ev>=90?'#f5a623':r.rec_ev>=85?'#27c97a':'var(--muted)'}}>
                      {r.rec_ev>0?r.rec_ev.toFixed(1):'—'}
                    </td>
                    {/* Sim TB */}
                    <td style={{textAlign:'right',padding:'3px 8px',fontFamily:mono,fontSize:9,
                      color:r.sim_tb>=1.4?'#ff4020':r.sim_tb>=1.1?'#f5a623':'var(--muted)'}}>
                      {r.sim_tb>0?r.sim_tb.toFixed(2):'—'}
                    </td>
                    {/* ISO */}
                    <td style={{textAlign:'right',padding:'3px 8px',fontFamily:mono,fontSize:9,
                      color:r.iso>=0.250?'#ff8020':r.iso>=0.180?'#f5a623':'var(--muted)'}}>
                      {r.iso>0?r.iso.toFixed(3):'—'}
                    </td>
                    {/* Reasons */}
                    <td style={{padding:'3px 10px',fontFamily:mono,fontSize:8,color:'var(--muted)',
                      maxWidth:260,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {r.reasons||'—'}
                    </td>
                  </tr>
                );

                const expandRow = isExp ? (
                  <tr key={r.bid+'_exp'}>
                    <td colSpan={11}
                      style={{padding:'0 12px 14px',background:'rgba(56,184,242,.04)',
                        borderBottom:'2px solid rgba(56,184,242,.2)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,
                        padding:'8px 0 6px',borderBottom:'1px solid var(--border)',marginBottom:6}}>
                        <PlayerAvatar pid={r.pid} name={r.name} size={26}/>
                        <span style={{fontFamily:osw,fontWeight:700,fontSize:13}}>{r.name}</span>
                        <span style={{fontFamily:mono,fontSize:10,color:'var(--accent2)'}}>{r.team}</span>
                        <span style={{fontFamily:mono,fontSize:8,color:'var(--muted)',marginLeft:'auto'}}>
                          Recent At-Bats · {r.count} close call{r.count!==1?'s':''} yesterday
                        </span>
                      </div>
                      <InjuryBanner pid={r.pid} style={{margin:'6px 0 4px'}}/>
                      <Last7HRChart batterId={r.pid}/>
                      <RecentGameLog batterId={r.pid}/>
                    </td>
                  </tr>
                ) : null;

                return [mainRow, expandRow].filter(Boolean);
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{textAlign:'center',fontFamily:mono,fontSize:7,color:'var(--muted)',marginTop:10}}>
        Criteria: ≥2 events · fly ball/line drive ≥330ft at 88mph+ EV · XBH · Rockets (EV 100+mph) · 🔥 = went yard + 3+ close calls
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAIRS TAB
// Surfaces correlated batter pairs from shared underlying conditions.
// Gates: Yard Score ≥20, pitcher not Elite or Tough.
// All computation in-browser from DAILY_PICKS_CACHE — no extra data needed.
// ══════════════════════════════════════════════════════════════════════════════

const PAIR_TYPES = [
  {
    id: 'speed_surge',
    label: '⚡ Speed Surge',
    color: '#60d360', bg: 'rgba(39,201,122,.08)', border: 'rgba(39,201,122,.25)',
    desc: 'Bat speed trending 1.5mph+ above own season baseline — swing is physically peaking right now',
    qualify: b => parseFloat(b.bat_speed_vs_baseline||0) >= 1.5,
    sameGame: false,
  },
  {
    id: 'due_factor',
    label: '⏳ Due Factor',
    color: '#f5a623', bg: 'rgba(245,166,35,.08)', border: 'rgba(245,166,35,.25)',
    desc: 'ISO ≥.200 + zero HRs last 7 days — power profile strong, results lagging contact quality',
    qualify: b => parseFloat(b.recent_iso||0) >= 0.200 && parseInt(b.recent_hr_count||0) === 0,
    sameGame: false,
  },
  {
    id: 'same_game_heat',
    label: '🔥 Same Game Heat',
    color: '#ff8020', bg: 'rgba(255,128,32,.08)', border: 'rgba(255,128,32,.25)',
    desc: 'Same park + conditions, both HH% ≥32% and FB% ≥28% — hot bats sharing the same environment',
    qualify: b => parseFloat(b.recent_hh_pct||0) >= 32 && parseFloat(b.recent_fb_pct||0) >= 28,
    sameGame: true,
  },
  {
    id: 'ps_duo',
    label: '🌩️ PS Duo',
    color: '#a855f7', bg: 'rgba(168,85,247,.08)', border: 'rgba(168,85,247,.25)',
    desc: 'Both PS Score ≥35 — mechanical and situational factors independently aligned for each',
    qualify: b => parseFloat(b.ps_score||0) >= 35,
    sameGame: false,
  },
  {
    id: 'moonshot_tandem',
    label: '🌙 Moonshot Tandem',
    color: '#38b8f2', bg: 'rgba(56,184,242,.08)', border: 'rgba(56,184,242,.25)',
    desc: 'Same game, FB% ≥30% + ISO ≥.160 — matching power profiles in identical park and weather',
    qualify: b => parseFloat(b.recent_fb_pct||0) >= 30 && parseFloat(b.recent_iso||0) >= 0.160,
    sameGame: true,
  },
  {
    id: 'la_locked',
    label: '📐 LA Locked',
    color: '#ffd700', bg: 'rgba(255,215,0,.08)', border: 'rgba(255,215,0,.25)',
    desc: 'Launch angle mean 18-30° + stddev <14° — swing plane consistently in the HR corridor',
    qualify: b => {
      const m = parseFloat(b.la_mean_l15||0), s = parseFloat(b.la_stddev||99);
      return m >= 18 && m <= 30 && s > 0 && s < 14;
    },
    sameGame: false,
  },
];

function pitcherTier(b) {
  const hh = parseFloat(b.pitcher_hh_pct_allowed||0);
  const mb = parseFloat(b.pitcher_meatball_pct||0);
  if (!hh && !mb) return 'unknown';
  if (hh < 28 && mb < 50) return 'elite';
  if (hh < 32 && mb < 55) return 'tough';
  if (hh < 36)            return 'average';
  if (hh < 40)            return 'hittable';
  return 'target';
}

function pairScore(a, b) {
  const yA = parseFloat(a._yard||0), yB = parseFloat(b._yard||0);
  const psA = parseFloat(a.ps_score||0), psB = parseFloat(b.ps_score||0);
  const bsA = parseFloat(a.bat_speed_vs_baseline||0), bsB = parseFloat(b.bat_speed_vs_baseline||0);
  return (yA + yB) * 0.5 + (psA + psB) * 0.25 + Math.max(bsA,0) * 3 + Math.max(bsB,0) * 3;
}

function PairsTab({ data }) {
  const mono = "'DM Mono',monospace";
  const osw  = "'Oswald',sans-serif";
  const [activeType, setActiveType] = useState('all');
  const [expanded, setExpanded]     = useState(null);

  // ── Build deduplicated batter list from DAILY_PICKS_CACHE ─────────────────
  const batters = React.useMemo(() => {
    const seen = new Set();
    return Object.values(DAILY_PICKS_CACHE).filter(b => {
      const key = String(b.batter_id||b.batter||'');
      if (!key || seen.has(key) || !b.batter || !b.game_id) return false;
      seen.add(key);
      // Must be in confirmed or projected lineup today
      const bid = parseInt(b.batter_id||0);
      const ls  = bid ? LINEUP_STATUS[bid] : null;
      if (!ls || (ls.status !== 'confirmed' && ls.status !== 'projected')) return false;
      // Must have recent contact/sim data (not inactive)
      return parseFloat(b.recent_avg_ev||0) > 0 || parseFloat(b.sim_tb||0) > 0;
    });
  }, []);

  // ── Apply global gates ─────────────────────────────────────────────────────
  const eligible = React.useMemo(() => batters.filter(b => {
    // Gate 0: must be on today's slate (has a game_id)
    if (!b.game_id) return false;
    // Gate 0b: must have recent data (recent_avg_ev or bat_speed populated)
    const hasRecent = parseFloat(b.recent_avg_ev||0) > 0 || parseFloat(b.recent_hh_pct||0) > 0 || parseFloat(b.recent_iso||0) > 0;
    if (!hasRecent) return false;
    // Gate 1: Yard Score ≥20
    const yard = parseFloat(b._yard||0);
    if (yard < 20) return false;
    // Gate 2: no Elite/Tough pitchers
    const tier = pitcherTier(b);
    if (tier === 'elite' || tier === 'tough') return false;
    return true;
  }), [batters]);

  // ── Generate pairs ─────────────────────────────────────────────────────────
  const pairs = React.useMemo(() => {
    const types = activeType === 'all' ? PAIR_TYPES : PAIR_TYPES.filter(t => t.id === activeType);
    const result = [];

    for (const pt of types) {
      const cands = eligible.filter(b => pt.qualify(b));
      for (let i = 0; i < cands.length; i++) {
        for (let j = i + 1; j < cands.length; j++) {
          const a = cands[i], b = cands[j];
          if (a.batter_id === b.batter_id) continue;
          const sameGame = String(a.game_id) === String(b.game_id);
          if (pt.sameGame && !sameGame) continue;
          result.push({ type: pt, a, b, sameGame, score: pairScore(a, b) });
        }
      }
    }
    // Dedupe: one pair per batter combo (keep highest score)
    const seen = new Map();
    for (const p of result) {
      const key = [String(p.a.batter_id||p.a.batter), String(p.b.batter_id||p.b.batter)].sort().join('|');
      if (!seen.has(key) || seen.get(key).score < p.score) seen.set(key, p);
    }
    return [...seen.values()].sort((x,y) => y.score - x.score).slice(0, 50);
  }, [eligible, activeType]);

  const ydCol = v => !v?'var(--muted)':v>=75?'#ffd700':v>=60?'#ff4020':v>=45?'#f5a623':v>=20?'#c4a882':'var(--muted)';

  function BatterCard({ b, type }) {
    const yard = parseFloat(b._yard||0);
    const bs   = parseFloat(b.bat_speed_vs_baseline||0);
    const ps   = parseFloat(b.ps_score||0);
    const iso  = parseFloat(b.recent_iso||0);
    const hh   = parseFloat(b.recent_hh_pct||0);
    const fb   = parseFloat(b.recent_fb_pct||0);
    const la_m = parseFloat(b.la_mean_l15||0);
    const la_s = parseFloat(b.la_stddev||0);
    const dp   = DAILY_PICKS_CACHE[String(b.batter_id||'').split('.')[0]];

    return (
      <div style={{flex:1,minWidth:0,background:'var(--surface)',borderRadius:8,
        border:'1px solid var(--border)',padding:'10px 12px'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
          <PlayerAvatar pid={parseInt(b.batter_id)||0} name={b.batter} size={22}/>
          <div style={{minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <span
                onClick={()=>openAtBatSlide({pid:parseInt(b.batter_id)||0,name:b.batter,team:b.batting_team||''})}
                style={{fontFamily:osw,fontWeight:800,fontSize:12,color:'var(--text)',
                  cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {b.batter}
              </span>
              <PickButton pid={parseInt(b.batter_id)||0} name={b.batter} team={b.batting_team||''}/>
            </div>
            <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)',marginTop:1}}>
              {b.batting_team} · vs {b.pitcher}
            </div>
          </div>
          <div style={{marginLeft:'auto',flexShrink:0}}>
            <YardBadge score={yard}/>
          </div>
        </div>
        {/* Key stats grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 12px'}}>
          {bs !== 0 && (
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>BS Δ</span>
              <span style={{fontFamily:mono,fontSize:9,fontWeight:700,
                color:bs>=1.5?'#27c97a':bs>=0.5?'#a8d8a8':bs<=-0.5?'#f5a623':'var(--muted)'}}>
                {bs>=0?'+':''}{bs.toFixed(1)} mph
              </span>
            </div>
          )}
          {ps > 0 && (
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>PS</span>
              <PSBadge score={ps}/>
            </div>
          )}
          {iso > 0 && (
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>ISO</span>
              <span style={{fontFamily:mono,fontSize:9,
                color:iso>=0.250?'#ff8020':iso>=0.180?'#f5a623':'var(--muted)'}}>
                {iso.toFixed(3)}
              </span>
            </div>
          )}
          {hh > 0 && (
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>HH%</span>
              <span style={{fontFamily:mono,fontSize:9,
                color:hh>=40?'#ff4020':hh>=30?'#f5a623':'var(--muted)'}}>
                {hh.toFixed(1)}%
              </span>
            </div>
          )}
          {fb > 0 && (
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>FB%</span>
              <span style={{fontFamily:mono,fontSize:9,
                color:fb>=35?'#27c97a':'var(--muted)'}}>{fb.toFixed(1)}%
              </span>
            </div>
          )}
          {la_m > 0 && la_s > 0 && (
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>LA</span>
              <span style={{fontFamily:mono,fontSize:9,color:'var(--muted)'}}>
                {la_m.toFixed(0)}° ±{la_s.toFixed(0)}°
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:'0 4px'}}>

      {/* ── Header + gates reminder ───────────────────────────────────────── */}
      <div style={{marginBottom:12,background:'var(--surface2)',borderRadius:8,
        border:'1px solid var(--border)',padding:'10px 14px'}}>
        <div style={{fontFamily:osw,fontWeight:800,fontSize:13,color:'var(--text)',marginBottom:4}}>
          🔗 Correlation Pairs
        </div>
        <div style={{fontFamily:mono,fontSize:8,color:'var(--muted)',lineHeight:1.7}}>
          Batters sharing underlying conditions that make them statistically correlated.
          Gates: <span style={{color:'var(--text)'}}>Yard Score ≥20</span> · <span style={{color:'var(--text)'}}>No Elite or Tough pitchers</span> · {eligible.length} eligible batters today
        </div>
      </div>

      {/* ── Pair type filter ──────────────────────────────────────────────── */}
      <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:14,justifyContent:'center'}}>
        <button onClick={()=>setActiveType('all')}
          style={{padding:'4px 10px',borderRadius:5,fontSize:9,fontFamily:mono,cursor:'pointer',
            border:`1px solid ${activeType==='all'?'var(--accent2)':'var(--border)'}`,
            background:activeType==='all'?'rgba(232,65,26,.1)':'var(--surface2)',
            color:activeType==='all'?'var(--accent2)':'var(--muted)',fontWeight:activeType==='all'?700:400}}>
          All Pairs
        </button>
        {PAIR_TYPES.map(pt => (
          <button key={pt.id} onClick={()=>setActiveType(pt.id)}
            style={{padding:'4px 10px',borderRadius:5,fontSize:9,fontFamily:mono,cursor:'pointer',
              border:`1px solid ${activeType===pt.id?pt.color:'var(--border)'}`,
              background:activeType===pt.id?pt.bg:'var(--surface2)',
              color:activeType===pt.id?pt.color:'var(--muted)',fontWeight:activeType===pt.id?700:400}}>
            {pt.label}
          </button>
        ))}
      </div>

      {/* ── Pair cards ────────────────────────────────────────────────────── */}
      {pairs.length === 0 ? (
        <div style={{textAlign:'center',padding:40,color:'var(--muted)',fontFamily:mono,fontSize:11}}>
          No pairs found for current filters · Try "All Pairs" or check back after lineups post
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {pairs.map((pair, idx) => {
            const isExp = expanded === idx;
            const pt    = pair.type;
            return (
              <div key={idx} onClick={()=>setExpanded(isExp?null:idx)}
                style={{background:'var(--surface2)',borderRadius:10,
                  border:`1px solid ${isExp?pt.color:'var(--border)'}`,
                  overflow:'hidden',cursor:'pointer',
                  transition:'border-color .15s'}}>
                {/* Pair header */}
                <div style={{padding:'8px 14px',display:'flex',alignItems:'center',gap:8,
                  background:isExp?pt.bg:'transparent'}}>
                  {/* Type badge */}
                  <span style={{padding:'2px 8px',borderRadius:12,fontSize:8,fontFamily:mono,
                    fontWeight:700,color:pt.color,background:pt.bg,border:`1px solid ${pt.border}`,
                    flexShrink:0,whiteSpace:'nowrap'}}>
                    {pt.label}
                  </span>
                  {pair.sameGame && (
                    <span style={{padding:'2px 6px',borderRadius:4,fontSize:7,fontFamily:mono,
                      color:'var(--muted)',border:'1px solid var(--border)',flexShrink:0}}>
                      Same Game
                    </span>
                  )}
                  {/* Batter names */}
                  <div style={{flex:1,minWidth:0,display:'flex',alignItems:'center',gap:4,overflow:'hidden'}}>
                    <span style={{fontFamily:osw,fontWeight:700,fontSize:11,
                      color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {pair.a.batter}
                    </span>
                    <span style={{color:'var(--muted)',fontSize:10,flexShrink:0}}>+</span>
                    <span style={{fontFamily:osw,fontWeight:700,fontSize:11,
                      color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {pair.b.batter}
                    </span>
                  </div>
                  {/* Yard scores */}
                  <div style={{display:'flex',gap:4,flexShrink:0}}>
                    <YardBadge score={parseFloat(pair.a._yard||0)}/>
                    <YardBadge score={parseFloat(pair.b._yard||0)}/>
                  </div>
                  <span style={{color:'var(--muted)',fontSize:10,flexShrink:0}}>{isExp?'▲':'▼'}</span>
                </div>
                {/* Expanded detail */}
                {isExp && (
                  <div style={{padding:'10px 14px',borderTop:`1px solid ${pt.border}`}}>
                    <div style={{fontFamily:mono,fontSize:8,color:pt.color,marginBottom:10,lineHeight:1.5}}>
                      {pt.desc}
                    </div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      <BatterCard b={pair.a} type={pt}/>
                      <BatterCard b={pair.b} type={pt}/>
                    </div>
                    {pair.sameGame && (
                      <div style={{marginTop:8,fontFamily:mono,fontSize:8,color:'var(--muted)',textAlign:'center'}}>
                        Both playing at {pair.a.batting_team===pair.b.batting_team?'home':'the same venue'} — shared park factor and weather
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pairs.length > 0 && (
        <div style={{textAlign:'center',fontFamily:mono,fontSize:8,color:'var(--muted)',marginTop:12}}>
          Showing top {pairs.length} pairs · Sorted by combined Yard Score + PS Score
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// BVP DEEP DIVE PAGE
// All data pre-computed in bvp_matrix.json by mlbdata_aggregate.py
// App does zero computation — pure lookups from the loaded JSON
// ══════════════════════════════════════════════════════════════════════════════

const BVP_MATRIX_CACHE = { data: null };

function ZoneGrid({ grid, title, color }) {
  // 3×3 strike zone grid — zones 1-9 (top-left to bottom-right)
  // zone layout: 1(TL) 2(TC) 3(TR) / 4(ML) 5(MC) 6(MR) / 7(BL) 8(BC) 9(BR)
  const ZONES = [[1,2,3],[4,5,6],[7,8,9]];
  const vals  = ZONES.flat().map(z => parseFloat(grid?.[String(z)])||0);
  const maxV  = Math.max(...vals, 1);
  return (
    <div>
      {title && <div style={{fontSize:8,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.7,marginBottom:4,fontFamily:"'DM Mono',monospace"}}>{title}</div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:2,width:96}}>
        {ZONES.flat().map(z => {
          const v = parseFloat(grid?.[String(z)])||0;
          const intensity = maxV > 0 ? v / maxV : 0;
          const bg = color === 'red'
            ? `rgba(255,64,32,${(intensity*0.6+0.05).toFixed(2)})`
            : `rgba(39,201,122,${(intensity*0.6+0.05).toFixed(2)})`;
          return (
            <div key={z} style={{height:28,display:'flex',alignItems:'center',justifyContent:'center',
              background:bg,borderRadius:3,border:'1px solid rgba(255,255,255,.08)'}}>
              <span style={{fontSize:8,fontWeight:700,color:'rgba(255,255,255,.85)',fontFamily:"'DM Mono',monospace"}}>
                {v>0?v.toFixed(0)+'%':''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BvPDeepDiveTab() {
  const mono = "'DM Mono',monospace";
  const osw  = "'Oswald',sans-serif";

  const [matrix,      setMatrix]       = useState(null);
  const [loading,     setLoading]      = useState(true);
  const [selPitcher,  setSelPitcher]   = useState(null);   // pitcher_id string
  const [selPitches,  setSelPitches]   = useState(new Set()); // multi-select pitch types
  const [dateWin,     setDateWin]      = useState('A');    // A=season 30/15/7=last N days
  const [location,    setLocation]     = useState('A');    // A=all H=home Away=away
  const [selGame,     setSelGame]      = useState(null);
  const [dayNight,    setDayNight]     = useState('D');    // D/N only — aggregate has no A key
  const [batterHand,  setBatterHand]   = useState('ALL');
  const [pitcherHand, setPitcherHand]  = useState('ALL'); // RHP / LHP / ALL
  const [sortBy,      setSortBy]       = useState('avg_ev');
  const [sortDir,     setSortDir]      = useState('desc');
  const [selBatter,   setSelBatter]    = useState(null);   // bid for zone overlay
  const [dateSlot,    setDateSlot]     = useState('today');

  // ── Load bvp_matrix.json once ──────────────────────────────────────────────
  useEffect(() => {
    if (BVP_MATRIX_CACHE.data) { setMatrix(BVP_MATRIX_CACHE.data); setLoading(false); return; }
    fetch('/data/bvp_matrix.json')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.matrix && typeof d.matrix === 'object') { BVP_MATRIX_CACHE.data = d.matrix; setMatrix(d.matrix); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);






  // ── Toggle pitch selection ─────────────────────────────────────────────────
  const togglePitch = pt => {
    setSelPitches(prev => {
      const next = new Set(prev);
      next.has(pt) ? next.delete(pt) : next.add(pt);
      return next;
    });
    setSelBatter(null);
  };

  // ── Build batter rows from selected pitcher + pitches + day/night ──────────
  // pitcher must be declared before useMemo (can't be after guard)
  const pitcher = (matrix && selPitcher) ? (matrix[selPitcher] || null) : null;

  const batterRows = React.useMemo(() => {
    if (!pitcher) return [];
    try {
      const matchup  = pitcher.matchup || '';
      const parts    = matchup.split(' @ ');
      const awayTeam = parts[0]?.trim() || '';
      const homeTeam = parts[1]?.trim() || '';
      const opposingTeam = pitcher.team === homeTeam ? awayTeam
                         : pitcher.team === awayTeam ? homeTeam : '';

      const seen = new Set();
      return Object.values(DAILY_PICKS_CACHE).filter(b => {
        const bid  = String(b.batter_id||'').split('.')[0];
        const team = b.batting_team || b.team || '';
        if (!bid || seen.has(bid)) return false;
        if (opposingTeam && team !== opposingTeam) return false;
        const ls = LINEUP_STATUS[parseInt(bid)||0];
        if (!ls) return false;
        seen.add(bid);
        // Hand filter: does batter hand match selected filter?
        if (batterHand !== 'ALL') {
          const bh = (b.batter_hand||'').charAt(0).toUpperCase();
          if (bh && bh !== batterHand.charAt(0)) return false;
        }
        return true;
      }).map(dp => {
        const bid  = String(dp.batter_id||'').split('.')[0];
        const ls   = LINEUP_STATUS[parseInt(bid)||0];
        const hand = (dp.batter_hand||dp.hand||'').charAt(0).toUpperCase();

        // Platoon advantage
        const ph = (pitcher.hand||'').charAt(0).toUpperCase();
        const platoon = (ph==='R'&&(hand==='L'||hand==='S'))||(ph==='L'&&hand==='R');

        // PS convergence pitch matches selected pitch type?
        const convPitch = dp.ps_conv_pitch || '';
        const pitchMatch = selPitches.size > 0 && selPitches.has(convPitch);

        return {
          bid,
          name:        dp.batter || bid,
          hand,
          team:        dp.batting_team || '',
          platoon,
          pitchMatch,
          convPitch,
          lineup_slot: ls?.slot || ls?.lineup_slot || 9,
          // ── Yard / Grade ───────────────────────────────────────────────
          _yard:       parseFloat(dp._yard||0),
          grade:       dp.grade || '',
          // ── BvP: how batter did vs THIS pitcher (from matchup engine) ──
          bvp_ev:      parseFloat(dp.bvp_avg_ev||0),
          bvp_hh:      parseFloat(dp.bvp_hh_pct||0),
          bvp_fb:      parseFloat(dp.bvp_fb_pct||0),
          bvp_gb:      parseFloat(dp.bvp_gb_pct||0),
          bvp_brl:     parseFloat(dp.bvp_barrel_pct||0),
          bvp_la:      parseFloat(dp.bvp_avg_la||0),
          bvp_bs:      parseFloat(dp.bvp_avg_bat_speed||0),
          bvp_iso:     parseFloat(dp.bvp_iso||0),
          bvp_pfb:     parseFloat(dp.bvp_pulled_fb_pct||0),
          // ── Recent form: last ~15 days from matchup engine ─────────────
          rec_ev:      parseFloat(dp.recent_avg_ev||0),
          rec_hh:      parseFloat(dp.recent_hh_pct||0),
          rec_fb:      parseFloat(dp.recent_fb_pct||0),
          rec_gb:      parseFloat(dp.recent_gb_pct||0),
          rec_iso:     parseFloat(dp.recent_iso||0),
          rec_k:       parseFloat(dp.recent_k_pct||0),
          rec_bs:      parseFloat(dp.recent_avg_bat_speed||0),
          // ── PS / sim ───────────────────────────────────────────────────
          ps_score:    parseFloat(dp.ps_score||0),
          sim_tb:      parseFloat(dp.sim_tb||0),
          zone_fit:    parseFloat(dp.zone_fit||0),
          bat_speed_delta: parseFloat(dp.bat_speed_vs_baseline||0),
          la_mean:     parseFloat(dp.la_mean_l15||0),
          la_std:      parseFloat(dp.la_stddev||0),
          season_woba: parseFloat(dp.season_woba||0),
          season_xwoba:parseFloat(dp.season_xwoba||0),
        };
      }).sort((a,b) => (a.lineup_slot||9) - (b.lineup_slot||9));
    } catch(e) {
      console.error('BvP batterRows error:', e);
      return [];
    }
  }, [pitcher, selPitches, batterHand]);


  // ── Sort batter rows ───────────────────────────────────────────────────────
  const sortedRows = React.useMemo(() => {
    const dir = sortDir === 'desc' ? -1 : 1;
    return [...batterRows].sort((a,b) => {
      const av = a[sortBy] ?? -999, bv = b[sortBy] ?? -999;
      return dir * (bv - av);
    });
  }, [batterRows, sortBy, sortDir]);

  const handleSort = col => {
    if (col === sortBy) setSortDir(d => d==='desc'?'asc':'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const sortArrow = col => col===sortBy?(sortDir==='desc'?'▼':'▲'):'';

  // ── Colors ─────────────────────────────────────────────────────────────────
  const evCol  = v => !v?'var(--muted)':v>=103?'#ff4020':v>=97?'#f5a623':'var(--muted)';
  const hhCol  = v => !v?'var(--muted)':v>=40?'#ff4020':v>=30?'#f5a623':'var(--muted)';
  const brlCol = v => !v?'var(--muted)':v>=10?'#ff4020':v>=6?'#f5a623':'var(--muted)';
  const avCol  = v => !v?'var(--muted)':v>=0.280?'#27c97a':v>=0.240?'#f5a623':'var(--muted)';
  const wCol   = v => !v?'var(--muted)':v>=0.370?'#ff4020':v>=0.310?'#f5a623':'var(--muted)';
  const xwCol  = v => !v?'var(--muted)':v>=0.380?'#ff4020':v>=0.320?'#f5a623':'var(--muted)';
  const isoCol = v => !v?'var(--muted)':v>=0.250?'#ff8020':v>=0.180?'#f5a623':'var(--muted)';
  const ydCol  = v => !v?'var(--muted)':v>=75?'#ffd700':v>=60?'#ff4020':v>=45?'#f5a623':v>=20?'#c4a882':'var(--muted)';
  const pgCol  = g => !g?'var(--muted)':g.includes('Target')?'#27c97a':g.includes('Hittable')?'#60d360':g.includes('Elite')?'#ff4020':g.includes('Tough')?'#f5a623':'var(--muted)';

  const TH = ({ col, label, title }) => (
    <th onClick={()=>handleSort(col)} title={title}
      style={{padding:'5px 6px',fontSize:8,fontFamily:mono,textTransform:'uppercase',
        letterSpacing:.6,color:sortBy===col?'var(--accent2)':'var(--muted)',
        cursor:'pointer',whiteSpace:'nowrap',borderBottom:'1px solid var(--border)',
        background:'var(--surface2)',position:'sticky',top:0,zIndex:10,textAlign:'right'}}>
      {label}{sortArrow(col)}
    </th>
  );

  const selBatterData = selBatter ? pitcher?.vs_batter?.[selBatter] : null;
  const _selPitchArr  = [...selPitches];
  const selZoneGrid   = selBatterData
    ? (selPitches.size===1
        ? selBatterData.by_pitch?.[_selPitchArr[0]]?.[dayNight]?.zone_grid
        : selBatterData.overall?.[dayNight]?.zone_grid)
    : null;

  // Guard after all hooks — no early returns before hooks (fixes React #310)
  if (loading || !matrix) return (
    <div style={{padding:40,color:loading?'var(--muted)':'var(--accent)',
      fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:'center'}}>
      {loading ? 'Loading BvP matrix…' : '⚠ bvp_matrix.json not found. Run mlbdata_aggregate.py to generate it.'}
    </div>
  );

  // ── Pitcher list (after guard — matrix is guaranteed non-null here) ────────
  const pitchers = Object.entries(matrix).map(([pid, p]) => ({ pid, ...p }))
    .sort((a,b) => (a.name||'').localeCompare(b.name||''));

  // Opposing team for the selected pitcher
  const opposingTeam = (() => {
    if (!pitcher) return '';
    const parts = (pitcher.matchup||'').split(' @ ');
    return pitcher.team === parts[1]?.trim() ? parts[0]?.trim()
         : pitcher.team === parts[0]?.trim() ? parts[1]?.trim()
         : '';
  })();

  return (
    <div style={{padding:'0 4px'}}>

      {/* ── Game selector strip ─────────────────────────────────────────── */}
      {(()=>{
        // Build unique games from pitchers, sorted by game time
        const games = [];
        const seen = new Set();
        pitchers.forEach(p => {
          const key = p.matchup || p.team || '';
          if (key && !seen.has(key)) {
            seen.add(key);
            // Find game time from SCHEDULE_CACHE or daily_picks via matchup string
            const dp = Object.values(DAILY_PICKS_CACHE).find(b =>
              b.batting_team && p.matchup && p.matchup.includes(b.batting_team)
            );
            games.push({ key, label: key, time: dp?.game_time || '' });
          }
        });
        // Sort by time
        games.sort((a,b) => (a.time||'').localeCompare(b.time||''));
        if (!games.length) return null;
        return (
          <div style={{marginBottom:14}}>
            <div style={{fontSize:8,color:'var(--muted)',fontFamily:mono,textTransform:'uppercase',
              letterSpacing:.7,marginBottom:6}}>Select Matchup</div>
            <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,
              WebkitOverflowScrolling:'touch',scrollbarWidth:'none'}}>
              <button onClick={()=>{setSelGame(null);setSelPitcher(null);setSelBatter(null);}}
                style={{flexShrink:0,padding:'6px 10px',borderRadius:8,fontSize:9,fontFamily:mono,
                  cursor:'pointer',border:`1px solid ${selGame===null?'var(--accent2)':'var(--border)'}`,
                  background:selGame===null?'rgba(232,65,26,.12)':'var(--surface2)',
                  color:selGame===null?'var(--accent2)':'var(--muted)',whiteSpace:'nowrap'}}>
                All Games
              </button>
              {games.map(g => {
                const active = selGame === g.key;
                // Parse teams from matchup string "AWAY @ HOME"
                const [away='', home=''] = g.key.split(' @ ');
                return (
                  <button key={g.key}
                    onClick={()=>{setSelGame(g.key);setSelPitcher(null);setSelBatter(null);}}
                    style={{flexShrink:0,padding:'6px 10px',borderRadius:8,cursor:'pointer',
                      border:`1px solid ${active?'var(--accent2)':'var(--border)'}`,
                      background:active?'rgba(232,65,26,.08)':'var(--surface2)',
                      display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,
                        color:active?'var(--text)':'var(--muted)'}}>{away}</span>
                      <span style={{fontFamily:mono,fontSize:8,color:'var(--muted)'}}>@</span>
                      <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,
                        color:active?'var(--text)':'var(--muted)'}}>{home}</span>
                    </div>
                    {g.time && <div style={{fontFamily:mono,fontSize:7,color:active?'var(--accent2)':'var(--muted)'}}>{g.time}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Pitcher selector — grouped by game, filtered by hand ────────── */}
      <div style={{marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
          <span style={{fontSize:9,color:'var(--muted)',fontFamily:mono,textTransform:'uppercase',letterSpacing:.7}}>
            Select Pitcher
          </span>
          {/* Hand filter */}
          {[['ALL','All'],['R','RHP'],['L','LHP']].map(([v,l])=>(
            <button key={v} onClick={()=>setPitcherHand(v)}
              style={{padding:'2px 8px',borderRadius:4,fontSize:8,fontFamily:mono,cursor:'pointer',
                border:`1px solid ${pitcherHand===v?'var(--accent2)':'var(--border)'}`,
                background:pitcherHand===v?'rgba(232,65,26,.1)':'transparent',
                color:pitcherHand===v?'var(--accent2)':'var(--muted)',fontWeight:pitcherHand===v?700:400}}>
              {l}
            </button>
          ))}
        </div>
        {/* Group pitchers by matchup */}
        {(()=>{
          const filtered = pitchers.filter(p =>
            (!selGame || p.matchup === selGame) &&
            (pitcherHand==='ALL' || p.hand===pitcherHand || p.hand===(pitcherHand==='R'?'Right':'Left'))
          );
          const byGame = {};
          filtered.forEach(p => {
            const key = p.matchup || p.team || 'Other';
            if (!byGame[key]) byGame[key] = [];
            byGame[key].push(p);
          });
          return Object.entries(byGame).sort(([a],[b])=>a.localeCompare(b)).map(([game, gPitchers]) => (
            <div key={game} style={{marginBottom:10}}>
              <div style={{fontSize:8,color:'var(--muted)',fontFamily:mono,letterSpacing:.5,
                marginBottom:5,paddingBottom:3,borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                {game}
              </div>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {gPitchers.sort((a,b)=>(b.is_starter?1:0)-(a.is_starter?1:0)||(a.name||'').localeCompare(b.name||'')).map(p => (
                  <button key={p.pid}
                    onClick={()=>{setSelPitcher(p.pid);setSelPitches(new Set());setSelBatter(null);}}
                    style={{padding:'3px 8px',borderRadius:5,fontSize:9,fontFamily:mono,cursor:'pointer',
                      border:`1px solid ${selPitcher===p.pid?'var(--accent2)':p.is_starter?'rgba(255,255,255,.2)':'var(--border)'}`,
                      background:selPitcher===p.pid?'rgba(232,65,26,.12)':'var(--surface2)',
                      color:selPitcher===p.pid?'var(--accent2)':p.is_starter?'var(--text)':'var(--muted)',
                      fontWeight:selPitcher===p.pid?700:p.is_starter?600:400}}>
                    {p.is_starter && <span style={{marginRight:3,fontSize:7,opacity:.7}}>★</span>}
                    {p.name||'Unknown'}
                    {p.hand && <span style={{marginLeft:4,fontSize:7,opacity:.6}}>{p.hand==='R'||p.hand==='Right'?'R':'L'}</span>}
                    {p.grade && !p.is_starter && <span style={{marginLeft:4,fontSize:7,color:pgCol(p.grade||'')}}>{(p.grade||'').split(' ')[0]}</span>}
                  </button>
                ))}
              </div>
            </div>
          ));
        })()}
      </div>

      {pitcher && (<>

        {/* ── Pitcher summary card ─────────────────────────────────────────── */}
        <div style={{background:'var(--surface2)',borderRadius:8,border:'1px solid var(--border)',
          padding:'10px 14px',marginBottom:12,display:'flex',gap:24,alignItems:'center',flexWrap:'wrap'}}>
          <div>
            <div style={{fontFamily:osw,fontWeight:800,fontSize:16,color:'var(--text)'}}>{pitcher.name}</div>
            <div style={{fontFamily:mono,fontSize:9,color:'var(--muted)',marginTop:2}}>
              {pitcher.hand && `${pitcher.hand}HP`} · {pitcher.pa} PA faced (2026)
            </div>
          </div>
          {(()=>{
            // Build split key from active filters: "{dateWin}_{dayNight}_{batterHand[0]}"
            const hKey = batterHand==='ALL'?'A':batterHand.charAt(0);
            const pLocKey = location==='A'?'A':location==='H'?'H':'A_loc';
            const splitKey = `${dateWin}_${dayNight}_${hKey}_${pLocKey}`;
            const split = (pitcher.stats_by_split||{})[splitKey] || (pitcher.stats_by_split||{})['A_A_A'] || {};
            const pa  = split.pa  ?? pitcher.pa;
            const hh  = split.hh_pct  ?? pitcher.hh_pct_allowed;
            const brl = split.brl_pct ?? pitcher.brl_pct_allowed;
            const mb  = split.mb_pct  ?? pitcher.mb_pct;
            const hr  = split.hr      ?? pitcher.hr_allowed;
            const fb  = split.fb_pct;
            const kk  = split.k_pct;
            const bb  = split.bb_pct;
            return [
              ['HH% Allowed', hh,  v=>v>=35?'#ff4020':v>=28?'#f5a623':'var(--muted)', v=>v?.toFixed(1)+'%'],
              ['Brl% Allowed', brl, v=>v>=9?'#ff4020':v>=6?'#f5a623':'var(--muted)',  v=>v?.toFixed(1)+'%'],
              ['Meatball%',   mb,  v=>v>=60?'#ff4020':v>=50?'#f5a623':'var(--muted)', v=>v?.toFixed(1)+'%'],
              ['HR Allowed',  hr,  v=>v>=20?'#ff4020':v>=12?'#f5a623':'var(--muted)', v=>String(v)],
              ...(fb!=null?[['FB% Allowed', fb, v=>v>=38?'#ff4020':v>=30?'#f5a623':'var(--muted)', v=>v?.toFixed(1)+'%']]:[]),
              ...(kk!=null?[['K%',          kk, v=>v>=28?'#27c97a':v>=22?'#60d360':'var(--muted)',  v=>v?.toFixed(1)+'%']]:[]),
              ...(bb!=null?[['BB%',         bb, v=>v>=12?'#f5a623':'var(--muted)',                  v=>v?.toFixed(1)+'%']]:[]),
              ['PA (split)',  pa,  ()=>'var(--muted)', v=>String(v)],
            ].filter(([,val])=>val!=null);
          })().map(([lbl,val,col,fmt])=>(
            <div key={lbl} style={{textAlign:'center'}}>
              <div style={{fontFamily:mono,fontSize:7,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.5,marginBottom:2}}>{lbl}</div>
              <div style={{fontFamily:osw,fontWeight:800,fontSize:15,color:col(val)}}>{val!=null?fmt(val):'—'}</div>
            </div>
          ))}
          <div style={{marginLeft:'auto',display:'flex',gap:4,alignItems:'center'}}>
            <span style={{fontSize:8,color:'var(--muted)',fontFamily:mono}}>Grade:</span>
            <span style={{fontFamily:osw,fontWeight:700,fontSize:13,color:pgCol(pitcher.grade)}}>{pitcher.grade||'—'}</span>
          </div>
        </div>

        {/* ── Pitch mix selector ───────────────────────────────────────────── */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:9,color:'var(--muted)',fontFamily:mono,textTransform:'uppercase',letterSpacing:.7,marginBottom:6}}>
            Select Pitches <span style={{opacity:.5}}>(multi-select · empty = all)</span>
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'flex-start'}}>
            {Object.entries(pitcher.pitch_mix||{})
              .sort((a,b)=>b[1]-a[1])
              .map(([pt, pct]) => {
                const isOn = selPitches.has(pt);
                return (
                  <button key={pt} onClick={()=>togglePitch(pt)}
                    style={{padding:'5px 10px',borderRadius:6,fontSize:9,fontFamily:mono,cursor:'pointer',
                      border:`1px solid ${isOn?'#60d360':'var(--border)'}`,
                      background:isOn?'rgba(39,201,122,.12)':'var(--surface2)',
                      color:isOn?'#60d360':'var(--text)',fontWeight:isOn?700:400}}>
                    {pitcher.pitch_names?.[pt]||pt}
                    <span style={{marginLeft:4,opacity:.7}}>{pct.toFixed(0)}%</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* ── Zone grid for selected pitch ─────────────────────────────────── */}
        {selPitches.size === 1 && pitcher.zone_by_pitch && [...selPitches][0] && pitcher.zone_by_pitch[[...selPitches][0]] && (
          <div style={{display:'flex',gap:20,marginBottom:14,alignItems:'flex-start',flexWrap:'wrap'}}>
            {['D','N'].map(dn => {
              const _pt0 = [...selPitches][0];
              const _locK = location==='A'?'A':location==='H'?'H':'A_loc';
              const zg = pitcher.zone_by_pitch?.[_pt0]?.[`${dateWin}_${dn}_${_locK}`];
              if (!zg) return null;
              return <ZoneGrid key={dn} grid={zg} title={`${dn==='D'?'Day':'Night'} — Pitcher Locations`} color="red"/>;
            })}
            {selZoneGrid && (
              <ZoneGrid grid={selZoneGrid}
                title={`${selBatter ? (pitcher.vs_batter?.[selBatter]?.name||'Batter') : 'Select batter'} — Contact Zones`}
                color="green"/>
            )}
          </div>
        )}

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div style={{display:'flex',gap:8,marginBottom:10,alignItems:'center',flexWrap:'wrap'}}>
          {/* Date Window */}
          {[['A','All Season'],['30','L30'],['15','L15'],['7','L7']].map(([v,l])=>(
            <button key={v} onClick={()=>setDateWin(v)}
              style={{padding:'3px 9px',borderRadius:5,fontSize:9,fontFamily:mono,cursor:'pointer',
                border:`1px solid ${dateWin===v?'#ffd700':'var(--border)'}`,
                background:dateWin===v?'rgba(255,215,0,.1)':'transparent',
                color:dateWin===v?'#ffd700':'var(--muted)',fontWeight:dateWin===v?700:400}}>
              {l}
            </button>
          ))}
          <div style={{width:1,height:16,background:'var(--border)',margin:'0 4px'}}/>
          {/* Day/Night */}
          {[['A','All'],['D','☀️ Day'],['N','🌙 Night']].map(([v,l])=>(
            <button key={v} onClick={()=>setDayNight(v)}
              style={{padding:'3px 9px',borderRadius:5,fontSize:9,fontFamily:mono,cursor:'pointer',
                border:`1px solid ${dayNight===v?'var(--accent2)':'var(--border)'}`,
                background:dayNight===v?'rgba(232,65,26,.1)':'transparent',
                color:dayNight===v?'var(--accent2)':'var(--muted)',fontWeight:dayNight===v?700:400}}>
              {l}
            </button>
          ))}
          <div style={{width:1,height:16,background:'var(--border)',margin:'0 4px'}}/>
          {/* Home / Away */}
          {[['A','All'],['H','🏠 Home'],['Away','✈️ Away']].map(([v,l])=>(
            <button key={v} onClick={()=>setLocation(v)}
              style={{padding:'3px 9px',borderRadius:5,fontSize:9,fontFamily:mono,cursor:'pointer',
                border:`1px solid ${location===v?'#38b8f2':'var(--border)'}`,
                background:location===v?'rgba(56,184,242,.1)':'transparent',
                color:location===v?'#38b8f2':'var(--muted)',fontWeight:location===v?700:400}}>
              {l}
            </button>
          ))}
          <div style={{width:1,height:16,background:'var(--border)',margin:'0 4px'}}/>
          {/* Batter hand */}
          {[['ALL','All'],['R','RHB'],['L','LHB']].map(([v,l])=>(
            <button key={v} onClick={()=>setBatterHand(v)}
              style={{padding:'3px 9px',borderRadius:5,fontSize:9,fontFamily:mono,cursor:'pointer',
                border:`1px solid ${batterHand===v?'var(--accent2)':'var(--border)'}`,
                background:batterHand===v?'rgba(232,65,26,.1)':'transparent',
                color:batterHand===v?'var(--accent2)':'var(--muted)',fontWeight:batterHand===v?700:400}}>
              {l}
            </button>
          ))}
          <div style={{marginLeft:'auto',fontFamily:mono,fontSize:9,color:'var(--muted)'}}>
            {sortedRows.length} {opposingTeam||'opposing'} batters in lineup · {selPitches.size>0?[...selPitches].join('+'):'All pitches'} · {dateWin==='A'?'Full Season':`Last ${dateWin} days`} · {dayNight==='D'?'Day':'Night'} · {location==='A'?'All venues':location==='H'?'Home':'Away'}
          </div>
        </div>

        {/* ── Batter table ─────────────────────────────────────────────────── */}
        <div style={{overflowX:'auto'}}>
          <table className="tw" style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
              <thead>
              <tr>
                <th className="sticky-batter" style={{padding:'5px 8px',fontSize:8,fontFamily:mono,
                  textTransform:'uppercase',letterSpacing:.6,color:'var(--muted)',textAlign:'left',
                  borderBottom:'1px solid var(--border)',background:'var(--surface2)',
                  position:'sticky',left:0,top:0,zIndex:20,whiteSpace:'nowrap'}}>
                  Batter {pitcher && <span style={{fontSize:7,opacity:.5,fontWeight:400}}>✓ = platoon · ⚡ = PS pitch match</span>}
                </th>
                <TH col="yard"     label="🎯"     title="Yard Score (daily)"/>
                <TH col="grade"    label="Gr"     title="Matchup Grade"/>
                <TH col="ps_score" label="PS"     title="PS Score (always available)"/>
                <TH col="la_mean"  label="LA°"    title="Launch Angle Mean L15 (44% of batters)"/>
                <TH col="sim_tb"   label="SimTB"  title="Simulated Total Bases (key matchup batters only)"/>
                <TH col="rec_ev"   label="EV"     title="Recent Exit Velocity (key matchup batters)"/>
                <TH col="rec_hh"   label="HH%"    title="Recent Hard Hit Rate (key matchup batters)"/>
                <TH col="rec_iso"  label="ISO"    title="Recent ISO (key matchup batters)"/>
                {/* BvP: populated only when batter has prior history vs this pitcher */}
                <th style={{padding:'4px 8px',fontSize:7,fontFamily:mono,color:'rgba(255,215,0,.6)',
                  background:'rgba(255,215,0,.04)',borderBottom:'1px solid var(--border)',
                  borderLeft:'1px solid rgba(255,215,0,.15)',textAlign:'center',whiteSpace:'nowrap'}}
                  colSpan={4}>
                  ↓ vs {pitcher?.name?.split(' ').pop()||'pitcher'} (direct history)
                </th>
              </tr>
              <tr>
                <th className="sticky-batter" style={{background:'var(--surface2)',position:'sticky',left:0,zIndex:20,borderBottom:'1px solid var(--border)'}}/>
                <th colSpan={8} style={{borderBottom:'1px solid var(--border)',background:'var(--surface2)'}}/>
                <TH col="bvp_ev"  label="EV"   title="Exit Velocity vs this pitcher specifically"/>
                <TH col="bvp_hh"  label="HH%"  title="Hard Hit Rate vs this pitcher"/>
                <TH col="bvp_iso" label="ISO"  title="ISO vs this pitcher"/>
                <TH col="bvp_fb"  label="FB%"  title="Fly Ball Rate vs this pitcher"/>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(r => {
                const isSelected = selBatter === r.bid;
                const dp = DAILY_PICKS_CACHE[r.bid];
                return (
                  <tr key={r.bid}
                    onClick={()=>setSelBatter(isSelected?null:r.bid)}
                    style={{cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,.04)',
                      background:isSelected?'rgba(232,65,26,.08)':'transparent',
                      height:28}}>
                    {/* Sticky batter cell */}
                    <td className="sticky-batter" style={{padding:'2px 8px',
                      background:isSelected?'rgba(232,65,26,.08)':'var(--surface)',
                      position:'sticky',left:0,zIndex:5,whiteSpace:'nowrap',minWidth:160}}>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <PlayerAvatar pid={parseInt(r.bid)||0} name={r.name} size={16}/>
                        <span style={{fontFamily:mono,fontSize:8,fontWeight:700,color:'var(--accent2)',flexShrink:0}}>
                          {r.team||''}
                        </span>
                        <span onClick={e=>{e.stopPropagation();openAtBatSlide({pid:parseInt(r.bid)||0,name:r.name,team:r.team||''});}}
                          style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:10,
                            color:isKeyMatchup(parseInt(r.bid)||0,r.name)?'#ff8020':'var(--text)',
                            cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {r.name}
                        </span>
                        {(()=>{
                          const ph = pitcher?.hand?.charAt(0).toUpperCase();
                          const bh = r.hand?.charAt(0).toUpperCase();
                          const platoon = (ph==='R'&&(bh==='L'||bh==='S'))||(ph==='L'&&bh==='R');
                          return platoon ? <span title="Platoon advantage" style={{fontSize:9,color:'#27c97a',marginLeft:2,flexShrink:0}}>✓</span> : null;
                        })()}
                        <span style={{flexShrink:0}}>
                          <PickButton pid={parseInt(r.bid)||0} name={r.name} team={r.team||''}/>
                        </span>
                      </div>
                    </td>
                    {/* Yard Score — static from daily picks */}
                    <td style={{textAlign:'right',padding:'2px 6px'}}>
                      {r._yard > 0 && <YardBadge score={r._yard}/>}
                    </td>
                    {/* Grade */}
                    <td style={{textAlign:'center',padding:'2px 4px',fontFamily:mono,fontSize:9,
                      color:r.grade==='A+'?'#ffd700':r.grade==='A'?'#27c97a':r.grade==='B'?'#f5a623':'var(--muted)',fontWeight:700}}>
                      {r.grade||'—'}
                    </td>
                    {/* BvP stats — adjust to pitch/day/night selection */}
                    <td style={{textAlign:'right',padding:'2px 6px',fontFamily:mono,fontSize:9,color:r.pa>=10?'var(--text)':'var(--muted)'}}>{r.pa}</td>
                    <td style={{textAlign:'right',padding:'2px 6px',fontFamily:mono,fontSize:9,color:avCol(r.avg)}}>{r.avg?.toFixed(3)||'—'}</td>
                    <td style={{textAlign:'right',padding:'2px 6px',fontFamily:osw,fontWeight:700,fontSize:10,color:r.hr>=2?'#ff4020':r.hr>=1?'#f5a623':'var(--muted)'}}>{r.hr||'—'}</td>
                    <td style={{textAlign:'right',padding:'2px 6px',fontFamily:mono,fontSize:9,color:'var(--muted)'}}>{r.bb||'—'}</td>
                    <td style={{textAlign:'right',padding:'2px 6px',fontFamily:mono,fontSize:9,color:r.k>=4?'#ff4020':'var(--muted)'}}>{r.k||'—'}</td>
                    <td style={{textAlign:'right',padding:'2px 6px',fontFamily:mono,fontSize:9,color:evCol(r.avg_ev)}}>{r.avg_ev?.toFixed(1)||'—'}</td>
                    <td style={{textAlign:'right',padding:'2px 6px',fontFamily:mono,fontSize:9,color:hhCol(r.hh_pct)}}>{r.hh_pct!=null?r.hh_pct.toFixed(1)+'%':'—'}</td>
                    <td style={{textAlign:'right',padding:'2px 6px',fontFamily:mono,fontSize:9,color:brlCol(r.brl_pct)}}>{r.brl_pct!=null?r.brl_pct.toFixed(1)+'%':'—'}</td>
                    <td style={{textAlign:'right',padding:'2px 6px',fontFamily:mono,fontSize:9,color:r.pbrl_pct>=5?'#ff4020':'var(--muted)'}}>{r.pbrl_pct!=null?r.pbrl_pct.toFixed(1)+'%':'—'}</td>
                    <td style={{textAlign:'right',padding:'2px 6px',fontFamily:mono,fontSize:9,color:r.fb_pct>=35?'#27c97a':'var(--muted)'}}>{r.fb_pct!=null?r.fb_pct.toFixed(1)+'%':'—'}</td>
                    <td style={{textAlign:'right',padding:'2px 6px',fontFamily:mono,fontSize:9,color:r.gb_pct>=55?'#ff4020':'var(--muted)'}}>{r.gb_pct!=null?r.gb_pct.toFixed(1)+'%':'—'}</td>
                    <td style={{textAlign:'right',padding:'2px 6px',fontFamily:mono,fontSize:9,color:'var(--muted)'}}>{r.pfb_pct!=null?r.pfb_pct.toFixed(1)+'%':'—'}</td>
                    <td style={{textAlign:'right',padding:'2px 6px',fontFamily:mono,fontSize:9,color:isoCol(r.iso)}}>{r.iso?.toFixed(3)||'—'}</td>
                    <td style={{textAlign:'right',padding:'2px 6px',fontFamily:mono,fontSize:9,color:wCol(r.woba)}}>{r.woba?.toFixed(3)||'—'}</td>
                    <td style={{textAlign:'right',padding:'2px 6px',fontFamily:mono,fontSize:9,color:xwCol(r.xwoba)}}>{r.xwoba?.toFixed(3)||'—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Selected batter zone overlay ──────────────────────────────────── */}
        {selBatter && selZoneGrid && (
          <div style={{marginTop:12,background:'var(--surface2)',borderRadius:8,
            border:'1px solid var(--border)',padding:'12px 14px'}}>
            <div style={{fontSize:9,color:'var(--muted)',fontFamily:mono,textTransform:'uppercase',
              letterSpacing:.7,marginBottom:8}}>
              {pitcher.vs_batter?.[selBatter]?.name} — Contact Zone vs {[...selPitches].join('+')||'All Pitches'}
            </div>
            <div style={{display:'flex',gap:20,alignItems:'flex-start'}}>
              <ZoneGrid grid={selZoneGrid} title="Batter Contact Zones" color="green"/>
              {selPitches.size===1 && (
                <ZoneGrid
                  grid={pitcher.zone_by_pitch?.[[...selPitches][0]]?.[`${dateWin}_${dayNight}_${location==='A'?'A':location==='H'?'H':'A_loc'}`]}
                  title="Pitcher Location" color="red"/>
              )}
              <div style={{fontSize:9,fontFamily:mono,color:'var(--muted)',lineHeight:1.8}}>
                <div>Green = batter contact frequency</div>
                <div>Red = where pitcher leaves the {[...selPitches][0]||'pitch'}</div>
                <div style={{marginTop:8,color:'var(--text)'}}>Overlap = damage zone</div>
              </div>
            </div>
          </div>
        )}

      </>)}
    </div>
  );
}

function MatchupEngineTab() {
  const [subTab, setSubTab]        = useState('matchups');
  const [data, setData]           = useState([]);
  const [tomorrowData, setTomorrowData] = useState([]);
  // Full engine output (all batters) for the All Matchups tab
  const [allPicksData, setAllPicksData]           = useState([]);
  const [allPicksTomorrowData, setAllPicksTomorrowData] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selGame, setSelGame]     = useState('all');
  const [selGrade, setSelGrade]    = useState('all');
  const [expandedId, setExpanded] = useState(null);
  const [generated, setGenerated] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQ, setSearchQ]     = useState('');
  const [scheduleMap, setScheduleMap] = useState({}); // game_id → {away, home}
  const liveCache = useRef({});
  const pitcherGradeCache = useRef({});
  const [selPitcherGrade, setSelPitcherGrade] = useState('all');
  useInjuries();
  const [kmActiveOnly, setKmActiveOnly]         = useState(false);
  const [kmBatterHand, setKmBatterHand]           = useState('ALL');
  const [kmHideFinal, setKmHideFinal]             = useState(false);
  const [kmPitcherHand, setKmPitcherHand]         = useState('ALL');
  const [kmFormFilter, setKmFormFilter]           = useState(new Set());
  const [kmInjuredOnly, setKmInjuredOnly]       = useState(false);
  const [kmHotOnly, setKmHotOnly]               = useState(false);
  const [filterGoneYard, setFilterGoneYard]   = useState(false);
  const [filterDue, setFilterDue]             = useState(false);
  const [filterDiamond, setFilterDiamond]     = useState(false);
  const [kmPicksOnly, setKmPicksOnly]         = useState(false);
  // Date slot — 'today' or 'tomorrow'. Respects 4am ET cutoff same as HR tracker.
  const [dateSlot, setDateSlot] = useState('today');
  const picks = usePicks();
  const kmPlayers = useMemo(() => Object.values(DAILY_PICKS_CACHE).map(p => ({pid:parseInt(p.batter_id)||0,name:p.batter,team:p.batting_team,pos:''})).filter(p=>p.pid>0), [data?.length]);
  // Re-render when confirmed lineups update (same 2-min cycle as Lineups tab)
  const [lineupVer, setLineupVer] = useState(LINEUP_VERSION);
  useEffect(() => {
    const unsub = subscribeLineup(v => setLineupVer(v));
    // Refresh lineup confirmation every 2 minutes
    const id = setInterval(() => loadTodayLineups().catch(() => {}), 120000);
    return () => { unsub(); clearInterval(id); };
  }, []);

  useEffect(() => {
    fetch('/data/daily_summary.csv')
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.text(); })
      .then(text => {
        const rows = parseCSVText(text);
        setData(rows);
        if (rows.length > 0 && rows[0].data_anchor) setGenerated(rows[0].data_anchor);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
    // Load full batter slate (daily_picks.csv = all batters, not just top 3/team)
    fetch('/data/daily_picks.csv')
      .then(r => r.ok ? r.text() : Promise.reject('no picks'))
      .then(text => { setAllPicksData(parseCSVText(text)); })
      .catch(() => {});
    // Also fetch tomorrow's engine output (silently — may not exist yet)
    fetch('/data/daily_summary_tomorrow.csv')
      .then(r => r.ok ? r.text() : Promise.reject('no tomorrow data'))
      .then(text => { const rows = parseCSVText(text); setTomorrowData(rows); })
      .catch(() => {}); // silent — tomorrow file only exists after pipeline runs for that date
    fetch('/data/daily_picks_tomorrow.csv')
      .then(r => r.ok ? r.text() : Promise.reject('no tomorrow picks'))
      .then(text => { setAllPicksTomorrowData(parseCSVText(text)); })
      .catch(() => {});
  }, []);

  // Derive ET date labels for the buttons (respects 4am ET day cutoff)
  const etDateLabel = (offsetDays) => {
    const now = new Date();
    const etStr = now.toLocaleDateString('en-US', { timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit' });
    const [m, d, y] = etStr.split('/');
    const base = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d)));
    // Before 4am ET = still "yesterday" in app terms
    const etHour = parseInt(now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }));
    // Extend "today" until 3am ET — games often run past midnight
    const dayOffset = etHour < 3 ? offsetDays - 1 : offsetDays;
    base.setUTCDate(base.getUTCDate() + dayOffset);
    return base.toISOString().slice(0, 10); // YYYY-MM-DD
  };
  const todayLabel    = etDateLabel(0);
  const tomorrowLabel = etDateLabel(1);

  // Active dataset — switches with dateSlot
  const activeData = dateSlot === 'tomorrow' && tomorrowData.length > 0 ? tomorrowData : data;

  // Fetch schedule CSV for reliable AWAY @ HOME labels
  // Schedule has columns: Game ID, Away Team, Home Team
  useEffect(() => {
    fetch('/data/mlb_schedule.csv')
      .then(r => r.ok ? r.text() : Promise.reject('no schedule'))
      .then(text => {
        const rows = parseCSVText(text);
        const map = {};
        rows.forEach(r => {
          const gid = String(r['Game ID'] || r['game_id'] || '').trim();
          const away = String(r['Away Team'] || r['away_team'] || '').trim();
          const home = String(r['Home Team'] || r['home_team'] || '').trim();
          if (gid && away && home) map[gid] = { away, home };
        });
        setScheduleMap(map);
      })
      .catch(() => {}); // silent fail — labels fall back gracefully
  }, []);

  // Build unique game list
  // Parse "7:05 PM" → minutes since midnight for sorting
  const timeToMins = (t) => {
    if (!t) return 9999;
    try {
      const parts = String(t).trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!parts) return 9999;
      let h = parseInt(parts[1]), m = parseInt(parts[2]);
      const ap = parts[3].toUpperCase();
      if (ap === 'PM' && h !== 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    } catch { return 9999; }
  };

  const games = [];
  const seen = new Set();
  activeData.forEach(r => {
    if (r.game_id && !seen.has(r.game_id)) {
      seen.add(r.game_id);
      games.push({ id: r.game_id, time: r.game_time || '', label: `${r.batting_team} game` });
    }
  });
  // Sort games earliest → latest
  games.sort((a, b) => timeToMins(a.time) - timeToMins(b.time));

  // Group by game_id, then by batting_team
  const grouped = {};
  (selGame === 'all' ? activeData : activeData.filter(r => String(r.game_id) === String(selGame)))
    .filter(r => selGrade === 'all' || r.grade === selGrade)
    .filter(r => !kmPicksOnly || picks[String(parseInt(r.batter_id)||0)])
    .filter(r => matchesHandFilter(r.batter_hand, kmBatterHand))
    .filter(r => matchesHandFilter(r.pitcher_hand, kmPitcherHand))
    .filter(r => kmFormFilter.size === 0 || kmFormFilter.has(getFormClass(r)))
    .filter(r => !kmHideFinal || !FINAL_GAME_IDS.has(String(r.game_id)))
    .filter(r => !kmActiveOnly || !INJURY_MAP[String(parseInt(r.batter_id)||0)])
    .filter(r => !kmInjuredOnly || !!INJURY_MAP[String(parseInt(r.batter_id)||0)])
    .filter(r => !kmHotOnly || isHotBatPlayer(r))
    .filter(r => {
      if (filterDiamond) {
        const simTB = parseFloat(r.sim_tb)||0;
        const pg = pitcherGradeCache.current[String(parseInt(r.pitcher_id)||0)];
        if (!(r.grade==='A+' && simTB>=2.0 && (pg==='💥 Hittable'||pg==='🎯 Target'))) return false;
      }
      if (filterDue) {
        const bid = parseInt(r.batter_id)||0;
        if (!isDueFromRow(r, bid)) return false;
      }
      if (!filterGoneYard) return true;
      const bid = parseInt(r.batter_id) || 0;
      return HR_DATA.some(h => h.batterId === bid ||
        (r.batter && h.batterName && h.batterName.toLowerCase() === r.batter.toLowerCase()));
    })
    .forEach(r => {
    const key = r.game_id;
    if (!grouped[key]) grouped[key] = { gameId: key, gameTime: r.game_time, teams: {} };
    const team = r.batting_team;
    if (!grouped[key].teams[team]) grouped[key].teams[team] = { team, pitcher: r.pitcher, pitcherId: r.pitcher_id, pitcher_hand: r.batter_hand, pitchMix: r.top_pitches, batters: [] };
    grouped[key].teams[team].batters.push(r);
    grouped[key].teams[team].pitcher = r.pitcher;
    grouped[key].teams[team].pitchMix = r.top_pitches;
  });

  const exportCSV = async () => {
    const bom = String.fromCharCode(65279);
    const uniqueGames = [...new Set(activeData.map(b => b.game_id).filter(Boolean))];
    await Promise.all(uniqueGames.map(async gameId => {
      try {
        const result = await fetchLiveBatters(gameId);
        const batters = result?.batters || result || [];
        if (!batters.length) return;
        batters.forEach(bt => {
          const key = String(bt.id);
          if (key && key !== '0') liveCache.current[key] = bt;
        });
      } catch(e) {}
    }));
    const headers = ['Grade','Pitcher Grade','Gone Yard','Team','Batter','Hand','vs Pitcher',
      'Top Pitches','Game Time','Flags','Recent EV','Recent Barrel%',
      'Recent FB%','Recent LA','BvP EV','BvP Barrel%','BvP FB%','BvP LA',
      'Sim H','Sim 2B','Sim BB','Sim K','Sim TB','Sim RBI',
      'Wind','Temp','Condition',
      'AB','H','HR','R','TB','RBI','BB','K','Avg EV','Launch Angle'];
    const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const rows = activeData.map(b => {
      const bid = parseInt(b.batter_id) || 0;
      const gy = HR_DATA.some(h => h.batterId === bid ||
        (b.batter && h.batterName && h.batterName.toLowerCase() === b.batter.toLowerCase()));
      const live = liveCache.current[String(bid)] || null;
      const pitchCleanId = b.pitcher_id ? String(parseInt(b.pitcher_id)||b.pitcher_id) : '';
      const pitcherGrade = simPitcherGrades.current[pitchCleanId] || '';
      return [b.grade, pitcherGrade, gy?'YES':'', b.batting_team, b.batter, b.batter_hand,
        b.pitcher, b.top_pitches, b.game_time, b.total_flags,
        b.recent_avg_ev, b.recent_barrel_pct, b.recent_fb_pct, b.recent_avg_la,
        b.bvp_avg_ev, b.bvp_barrel_pct, b.bvp_fb_pct, b.bvp_avg_la,
        b.sim_h, b.sim_2b, b.sim_bb, b.sim_k, b.sim_tb, b.sim_rbi,
        b.wind_effect, b.temp_f, b.condition,
        live?.ab??'', live?.hits??'', live?.hr??'', live?.runs??'',
        live?.totalBases??'', live?.rbi??'', live?.bb??'', live?.so??'',
        live?.avgEV>0?live.avgEV.toFixed(1):'',
        live?.launchAngle>0?live.launchAngle.toFixed(1):'',
        (() => {
          const _st  = parseFloat(b.sim_tb)||0;
          const _ev  = parseFloat(b.recent_avg_ev)||0;
          const _rla = parseFloat(b.recent_avg_la)||0;
          const _rfb = parseFloat(b.recent_fb_pct)||0;
          const _bla = parseFloat(b.bvp_avg_la)||0;
          const _bfb = parseFloat(b.bvp_fb_pct)||0;
          const _br  = parseFloat(b.recent_barrel_pct)||0;
          const _tmp = parseFloat(b.temp_f)||0;
          const _flg = parseInt(b.total_flags)||0;
          const _bs  = parseFloat(b.recent_avg_bat_speed)||0;
          const _chr = parseInt(b.recent_consec_hr_games)||0;
          const _abs = parseInt(b.ab_since_hr)||0;
          const _tp  = (b.top_pitches||'').toUpperCase();
          const _pid = b.pitcher_id?String(parseInt(b.pitcher_id)||b.pitcher_id):'';
          const _pg  = simPitcherGrades.current[_pid]||'';
          let s = 0;
          // SimTB
          if (_st>=2.5&&_st<3.0) s+=3; else if (_st>=2.0) s+=2; else if (_st>=1.5) s+=1;
          if (_st>=3.0) s-=1;
          // Pitcher grade
          if (_pg==='🎯 Target') s+=2; else if (_pg==='💥 Hittable') s+=1; else if (_pg==='‼️ Elite') s-=2;
          // Temp
          if (_tmp>=70&&_tmp<=75) s+=2;
          // EV: corrected cliff at 103
          if (_ev>=103) s+=2; else if (_ev>=100) s+=2; else if (_ev>=97) s+=1; // recalibrated
          // Recent LA: 22-32° corridor (peak 25-30°)
          if (_rla>=22&&_rla<=32) s+=2; else if (_rla>=18&&_rla<22) s+=1;
          // BvP LA: same corridor
          if (_bla>=22&&_bla<=32) s+=1;
          // Barrel quality tier (EV-weighted, 430k data: 107+ = 96.4% HR)
          const _bq = parseInt(b.barrel_quality_score)||0;
          if (_bq>=3) s+=2; else if (_bq>=2) s+=1; else if (_bq>=1) s+=1; // recalibrated
          else if (_br>=3&&_br<=6) s+=1;  // fallback
          // Recent FB%
          if (_rfb>=35) s+=1; else if (_rfb<15) s-=1; // recalibrated
          // Bat speed
          if (_bs>=77) s+=1; // recalibrated
          // Momentum
          if (_chr>=2) s+=1; // recalibrated
          // Due factor
          if (_abs>30) s-=1;
          // BvP FB%
          if (_bfb>=42) s-=2; else if (_bfb>=36) s-=1;
          // Sinker penalty
          if (_tp.startsWith('SI')) s-=1;
          // Park HR Factor
          const _hfc = parseFloat(b.hr_factor)||1.0;
          const _hfn = _hfc > 10 ? _hfc/100 : _hfc;
          if (_hfn>=1.15) s+=1; else if (_hfn<=0.88) s-=1; // recalibrated
          // Pulled Barrel Rate
          const _pbc = parseFloat(b.recent_pulled_barrel_pct)||0;
          if (_pbc>=3.0) s+=1; // recalibrated
          // Batter-Ahead Count %
          const _bac = parseFloat(b.recent_batter_ahead_pct)||0;
          if (_bac>=32) s+=1; // recalibrated
          // Flags
          if (_flg===7) s-=2; else if (_flg===1) s-=1;
          return Math.min(14, Math.max(0,s)); // cap at 14
        })(),
      ].map(esc).join(',');
    });
    const csv = bom + headers.map(esc).join(',') + String.fromCharCode(10) + rows.join(String.fromCharCode(10));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
    // ET date with 3am cutoff — before 3am ET still counts as "yesterday's" slate
    const _etRaw  = new Date().toLocaleString('en-US', {timeZone:'America/New_York',hour:'numeric',hour12:false});
    const _etH    = parseInt(_etRaw);
    const _etBase = new Date();
    if (_etH < 3) _etBase.setDate(_etBase.getDate() - 1);
    const _etNow  = new Date(_etBase.toLocaleString('en-US', {timeZone:'America/New_York'}));
    const _etDate = _etNow.getFullYear()+'-'+String(_etNow.getMonth()+1).padStart(2,'0')+'-'+String(_etNow.getDate()).padStart(2,'0');
    a.download = 'key-matchups-' + _etDate + '.csv';
    a.click();
  };

  const gc = (g) => GRADE_CFG[g] || GRADE_CFG['D'];
  const pct = (v) => v && parseFloat(v) > 0 ? `${parseFloat(v).toFixed(1)}%` : '—';
  const num = (v, d=1) => v && parseFloat(v) > 0 ? parseFloat(v).toFixed(d) : '—';
  const flag = (v) => v === 'TRUE' || v === true || v === 1 || v === '1';

  // Sub-tab styles
  const stBtn = (key) => ({
    padding:'4px 10px', borderRadius:6, cursor:'pointer', border:'none',
    fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:10, letterSpacing:.5,
    textTransform:'uppercase',
    background: subTab===key ? 'var(--accent)' : 'var(--surface2)',
    color: subTab===key ? 'white' : 'var(--muted)',
    borderBottom: subTab===key ? '2px solid var(--accent)' : '2px solid transparent',
    transition:'all .15s', flexShrink:0,
  });

  return <div>
    {/* CSV export button */}
    {subTab==='matchups' && (
      <div style={{marginBottom:8,display:'flex',justifyContent:'flex-end'}}>
        <button onClick={()=>exportCSV()}
          style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",
            background:"var(--surface2)",border:"1px solid var(--border)",
            color:"var(--muted)",fontFamily:"'DM Mono',monospace",
            fontSize:10,display:"flex",alignItems:"center",gap:5}}>
          ⬇ CSV
        </button>
      </div>
    )}

    {/* Sub-tab navigation */}
    <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:14}}>
      {/* Row 1 */}
      <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'center'}}>
        <button style={stBtn('matchups')}   onClick={()=>setSubTab('matchups')}>⚡ Matchups</button>
        <button style={stBtn('simlab')}     onClick={()=>setSubTab('simlab')}>🧠 Sim Lab</button>
        <button style={stBtn('allmatches')} onClick={()=>setSubTab('allmatches')}>📋 All Matchups</button>
        <button style={stBtn('longshot')}   onClick={()=>setSubTab('longshot')}>🎲 Long Shot</button>
      </div>
      {/* Row 2 */}
      <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'center'}}>
        <button style={stBtn('batters')}   onClick={()=>setSubTab('batters')}>🧢 Batters</button>
        <button style={stBtn('pitchers')}  onClick={()=>setSubTab('pitchers')}>⚾ Pitchers</button>
        {/* 🆚 BvP Deep Dive — hidden until data pipeline rebuilt */}
        <button style={stBtn('history')}   onClick={()=>setSubTab('history')}>📜 BvP History</button>
        <button style={stBtn('soclose')}   onClick={()=>setSubTab('soclose')}>🤏 Close Calls</button>
        <button style={stBtn('pairs')}     onClick={()=>setSubTab('pairs')}>🔗 Pairs</button>
      </div>
    </div>

    {/* Date slot toggle — only shown for matchups and simlab */}
    {(subTab === 'matchups' || subTab === 'simlab' || subTab === 'allmatches' || subTab === 'longshot') && (
      <div style={{display:'flex',gap:6,marginBottom:14,alignItems:'center'}}>
        {[
          { slot: 'today',    label: todayLabel },
          { slot: 'tomorrow', label: tomorrowLabel },
        ].map(({slot, label}) => {
          const isActive = dateSlot === slot;
          const hasTmrw  = slot === 'tomorrow' && tomorrowData.length === 0;
          return (
            <button key={slot} onClick={() => { setDateSlot(slot); setSelGame('all'); setExpanded(null); }}
              disabled={hasTmrw}
              style={{
                padding:'4px 10px', borderRadius:6, cursor: hasTmrw ? 'not-allowed' : 'pointer',
                border:`1px solid ${isActive ? 'var(--accent2)' : 'var(--border)'}`,
                background: isActive ? 'rgba(245,166,35,.12)' : 'var(--surface)',
                color: hasTmrw ? 'rgba(255,255,255,.15)' : isActive ? 'var(--accent2)' : 'var(--muted)',
                fontFamily:"'DM Mono',monospace", fontSize:10,
                fontWeight: isActive ? 700 : 400,
                whiteSpace:'nowrap', opacity: hasTmrw ? 0.5 : 1,
              }}>
              {label}
            </button>
          );
        })}
      </div>
    )}

    {/* All Matchups — full slate from daily_picks.csv (all batters, not just top 3/team) */}
    <div style={{display: subTab==='allmatches' ? 'block' : 'none'}}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)'}}>
          All graded batters vs today's probable pitchers · {(dateSlot==='tomorrow'&&allPicksTomorrowData.length>0?allPicksTomorrowData:allPicksData).length} batters
        </span>
      </div>
      <SimLabView key={`allmatches-${dateSlot}`} data={dateSlot==='tomorrow'&&allPicksTomorrowData.length>0 ? allPicksTomorrowData : allPicksData}/>
    </div>

    {/* Long Shot — C/D grade batters with soft pitcher or good day conditions */}
    {subTab === 'bvp'      && <BvPDeepDiveTab/>}
    {subTab === 'pairs'    && <PairsTab data={data}/>}
    {subTab === 'soclose'  && <SoCloseTab data={data}/>}
    {subTab === 'longshot' && (
      <LongShotView data={dateSlot==='tomorrow'&&allPicksTomorrowData.length>0 ? allPicksTomorrowData : allPicksData}/>
    )}

    {/* Sim Lab — display:none keeps component mounted so filters/sort persist across sub-tab switches */}
    <div style={{display: subTab==='simlab' ? 'block' : 'none'}}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
        <span style={{fontSize:10,color:'var(--accent)',fontFamily:"'DM Mono',monospace",fontWeight:700,opacity:.6}}>🧠</span>
        <CheatCodeButton/>
      </div>
      <SimLabView data={activeData}/>
    </div>

    {/* Batter Leaderboard */}
    {subTab==='barrel' && <DailyBarrelTab/>}

    {subTab==='history' && <BvPHistoryTab data={activeData}/>}

    {subTab==='batters' && (
      <div>
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:9,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:10,color:'var(--accent2)',fontFamily:"'DM Mono',monospace",fontWeight:700}}>📊 DATA SOURCE</span>
          <span style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>Statcast season metrics · loaded at app startup via Baseball Savant · sorted by Avg EV by default</span>
        </div>
        <BatterLeaderboard/>
      </div>
    )}

    {/* Pitcher Leaderboard */}
    {subTab==='pitchers' && (
      <div>
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:9,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:10,color:'var(--ice)',fontFamily:"'DM Mono',monospace",fontWeight:700}}>📡 DATA SOURCE</span>
          <span style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>MLB Stats API · 2026 season · sorted by ERA by default · SP/RP filter available</span>
        </div>
        <PitcherLeaderboard/>
      </div>
    )}

    {/* Matchups content (hidden when on other tabs) */}
    {subTab==='matchups' && <>

    {/* Add to My Picks — manual search */}
    {!loading && !error && activeData.length > 0 && (() => {
      const allPlayers = Object.values(PLAYER_DATA_CACHE);
      const ini = n => n ? n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : '?';
      const filtered = searchQ.trim().length > 1
        ? allPlayers.filter(p => {
            const q = searchQ.toLowerCase();
            return (p.name||'').toLowerCase().includes(q) ||
                   (getTeam(p.pid,p.team)||'').toLowerCase().includes(q);
          }).slice(0,12)
        : [];
      return (
        <div style={{marginBottom:14,background:'var(--surface)',
          border:'1px solid var(--border)',borderRadius:10,padding:'10px 14px'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,
            marginBottom:showPicker?10:0}}>
            <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
              fontSize:13,letterSpacing:.5}}>🎯 Add to My Picks</span>
            <span style={{fontSize:10,color:'var(--muted)',
              fontFamily:"'DM Mono',monospace"}}>Search any batter</span>
            <button onClick={()=>{setShowPicker(s=>!s);setSearchQ('');}}
              style={{marginLeft:'auto',padding:'4px 12px',borderRadius:6,
                border:'1px solid var(--border)',
                background:showPicker?'var(--accent)':'var(--surface2)',
                color:showPicker?'white':'var(--muted)',cursor:'pointer',
                fontFamily:"'DM Mono',monospace",fontSize:11}}>
              {showPicker?'✕ Close':'＋ Open'}
            </button>
          </div>
          {showPicker && <>
            <div style={{position:'relative',marginBottom:8}}>
              <input autoFocus type="text" value={searchQ}
                onChange={e=>setSearchQ(e.target.value)}
                placeholder="Search player or team…"
                style={{width:'100%',padding:'8px 12px 8px 30px',
                  background:'var(--surface2)',border:'1px solid var(--border)',
                  borderRadius:8,color:'var(--text)',
                  fontFamily:"'DM Mono',monospace",fontSize:12,
                  outline:'none',boxSizing:'border-box'}}/>
              <span style={{position:'absolute',left:9,top:'50%',
                transform:'translateY(-50%)',fontSize:12,color:'var(--muted)'}}>
                🔍
              </span>
              {searchQ && <button onClick={()=>setSearchQ('')}
                style={{position:'absolute',right:8,top:'50%',
                  transform:'translateY(-50%)',background:'none',border:'none',
                  color:'var(--muted)',cursor:'pointer',fontSize:13}}>✕</button>}
            </div>
            {searchQ.trim().length>1 && filtered.length===0 &&
              <div style={{fontSize:11,color:'var(--muted)',
                fontFamily:"'DM Mono',monospace",padding:'6px 0'}}>
                No players found
              </div>}
            {filtered.length>0 &&
              <div style={{display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:7}}>
                {filtered.map(p=>{
                  const cur=picks[String(p.pid)]?.type;
                  return (
                    <div key={p.pid} style={{display:'flex',alignItems:'center',
                      gap:8,padding:'7px 10px',borderRadius:8,
                      background:'var(--surface2)',
                      border:`1px solid ${cur?PICK_TYPES[cur].color:'var(--border)'}`}}>
                      <PlayerAvatar pid={p.pid} name={p.name} size={28}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:12,
                          whiteSpace:'nowrap',overflow:'hidden',
                          textOverflow:'ellipsis'}}>{p.name}</div>
                        <div style={{fontSize:9,color:'var(--muted)',
                          fontFamily:"'DM Mono',monospace"}}>
                          {getTeam(p.pid,p.team)}
                        </div>
                      </div>
                      <PickButton pid={p.pid} name={p.name} team={p.team}/>
                    </div>
                  );
                })}
              </div>}
          </>}
        </div>
      );
    })()}





    {/* Game filter — dropdown */}
    {games.length > 1 && <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
      <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:1,flexShrink:0}}>Game:</span>
      <select value={String(selGame)} onChange={e=>setSelGame(e.target.value==='all'?'all':parseInt(e.target.value)||e.target.value)}
        style={{padding:'5px 10px',borderRadius:7,background:'var(--surface2)',
          border:`1px solid ${selGame==='all'?'var(--border)':'rgba(232,65,26,.4)'}`,
          color:selGame==='all'?'var(--muted)':'var(--accent)',
          fontFamily:"'DM Mono',monospace",fontSize:11,cursor:'pointer',fontWeight:600}}>
        <option value="all">All Games</option>
        {games.map(g => {
          const gid = String(g.id);
          const rows = activeData.filter(r => String(r.game_id) === gid);
          const sample = rows.find(r => r.home_team && r.away_team);
          let label;
          if (sample?.home_team && sample?.away_team) label = `${sample.away_team} @ ${sample.home_team}`;
          else if (scheduleMap[gid]) label = `${scheduleMap[gid].away} @ ${scheduleMap[gid].home}`;
          else { const teams=[...new Set(rows.map(r=>r.batting_team).filter(Boolean))]; label=teams.length>=2?`${teams[0]} vs ${teams[1]}`:(teams[0]||gid); }
          return <option key={g.id} value={String(g.id)}>{label}{WEATHER_ALERT_GAME_IDS.has(gid)?' ⚠️':''}</option>;
        })}
      </select>
      {selGame!=='all'&&<button onClick={()=>setSelGame('all')}
        style={{padding:'3px 9px',borderRadius:5,border:'1px solid rgba(255,64,32,.3)',
          background:'rgba(255,64,32,.08)',color:'var(--accent)',
          fontFamily:"'DM Mono',monospace",fontSize:9,cursor:'pointer',fontWeight:700}}>✕</button>}
    </div>}

    {/* Grade filter */}
    {!loading && !error && activeData.length > 0 && <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
      <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:1}}>Grade</span>
      <button onClick={()=>setSelGrade('all')}
        style={{padding:'3px 12px',borderRadius:6,cursor:'pointer',
          background:selGrade==='all'?'var(--surface2)':'transparent',
          color:selGrade==='all'?'var(--text)':'var(--muted)',
          border:`1px solid ${selGrade==='all'?'var(--accent)':'var(--border)'}`,
          fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:selGrade==='all'?700:400}}>
        All
      </button>
      {Object.keys(GRADE_CFG).map(g => {
        const c = GRADE_CFG[g];
        const active = selGrade === g;
        return <button key={g} onClick={()=>setSelGrade(s=>s===g?'all':g)}
          style={{padding:'3px 12px',borderRadius:6,cursor:'pointer',
            background:active?c.bg:'transparent',
            color:active?c.color:'var(--muted)',
            border:`1px solid ${active?c.border:'var(--border)'}`,
            fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:11,letterSpacing:.5}}>
          {g}
        </button>;
      })}
            <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap",alignItems:"center"}}>
        <HandFilter mode="batter" value={kmBatterHand} onChange={setKmBatterHand}/>
        <HandFilter mode="pitcher" value={kmPitcherHand} onChange={setKmPitcherHand}/>
        <FormClassFilter selected={kmFormFilter} onChange={setKmFormFilter}/>
        <button onClick={()=>setKmHideFinal(v=>!v)} style={{padding:'3px 9px',borderRadius:6,
          border:`1px solid ${kmHideFinal?'#ff4020':'var(--border)'}`,
          background:kmHideFinal?'rgba(255,64,32,.12)':'transparent',
          color:kmHideFinal?'#ff4020':'var(--muted)',fontFamily:"'DM Mono',monospace",
          fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}}>
          {kmHideFinal?'✓ Hiding Final':'Hide Final'}
        </button>
      </div>
{/* Gone Yard filter — show only batters who have already hit a HR today */}
      <button onClick={()=>setFilterGoneYard(s=>!s)}
        style={{padding:'3px 12px',borderRadius:6,cursor:'pointer',marginLeft:4,
          background:filterGoneYard?'rgba(255,20,0,.18)':'transparent',
          color:filterGoneYard?'#ff4020':'var(--muted)',
          border:`1px solid ${filterGoneYard?'rgba(255,20,0,.5)':'var(--border)'}`,
          fontFamily:"'DM Mono',monospace",fontWeight:filterGoneYard?700:400,fontSize:11}}>
        💥
      </button>
      <button onClick={()=>setFilterDue(v=>!v)}
        style={{padding:'3px 12px',borderRadius:6,cursor:'pointer',marginLeft:4,
          background:filterDue?'rgba(56,184,242,.18)':'transparent',
          color:filterDue?'var(--ice)':'var(--muted)',
          border:`1px solid ${filterDue?'rgba(56,184,242,.5)':'var(--border)'}`,
          fontFamily:"'DM Mono',monospace",fontWeight:filterDue?700:400,fontSize:11}}>
        ⏳
      </button>
      <button onClick={()=>{setKmActiveOnly(s=>!s);if(!kmActiveOnly)setKmInjuredOnly(false);}}
        style={{padding:'3px 12px',borderRadius:6,cursor:'pointer',
          border:`1px solid ${kmActiveOnly?'#34d399':'var(--border)'}`,
          background:kmActiveOnly?'rgba(52,211,153,.12)':'transparent',
          color:kmActiveOnly?'#34d399':'var(--muted)',
          fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:kmActiveOnly?700:400,
          whiteSpace:'nowrap',marginLeft:4}}>
        ☑️
      </button>
      <button onClick={()=>{setKmInjuredOnly(s=>!s);if(!kmInjuredOnly)setKmActiveOnly(false);}}
        style={{padding:'3px 12px',borderRadius:6,cursor:'pointer',
          border:`1px solid ${kmInjuredOnly?'#fb923c':'var(--border)'}`,
          background:kmInjuredOnly?'rgba(251,146,60,.12)':'transparent',
          color:kmInjuredOnly?'#fb923c':'var(--muted)',
          fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:kmInjuredOnly?700:400,
          whiteSpace:'nowrap',marginLeft:4}}>
        🤕
      </button>
      <button onClick={()=>setKmHotOnly(s=>!s)}
        style={{padding:'3px 12px',borderRadius:6,cursor:'pointer',
          border:`1px solid ${kmHotOnly?'#fb923c':'var(--border)'}`,
          background:kmHotOnly?'rgba(251,146,60,.12)':'transparent',
          color:kmHotOnly?'#fb923c':'var(--muted)',
          fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:kmHotOnly?700:400,
          whiteSpace:'nowrap',marginLeft:4}}>
        🔥
      </button>
      <button onClick={()=>setKmPicksOnly(s=>!s)}
        style={{padding:'3px 12px',borderRadius:6,cursor:'pointer',
          border:`1px solid ${kmPicksOnly?'var(--accent2)':'var(--border)'}`,
          background:kmPicksOnly?'rgba(245,166,35,.12)':'transparent',
          color:kmPicksOnly?'var(--accent2)':'var(--muted)',
          fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:kmPicksOnly?700:400,
          whiteSpace:'nowrap',marginLeft:4}}>
        🎯 {kmPicksOnly ? 'My Picks ✓' : 'My Picks'}
      </button>
      <button onClick={()=>setFilterDiamond(v=>!v)}
        style={{padding:'3px 12px',borderRadius:6,cursor:'pointer',marginLeft:4,
          background:filterDiamond?'rgba(255,204,0,.18)':'transparent',
          color:filterDiamond?'#ffcc00':'var(--muted)',
          border:`1px solid ${filterDiamond?'rgba(255,204,0,.5)':'var(--border)'}`,
          fontFamily:"'DM Mono',monospace",fontWeight:filterDiamond?700:400,fontSize:11}}
        title="Tier 1 Locks: A+ grade + Sim TB≥2.0 + Hittable/Target pitcher">
        💎 {filterDiamond ? 'Diamond ✓' : 'Diamond'}
      </button>
    </div>}
    {loading && <div className="lw"><div className="sp"/><div className="lt">Loading matchup data…</div></div>}
    {/* Pitcher grade filter */}
    {!loading && !error && activeData.length > 0 && <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
      <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:1}}>Pitcher:</span>
      {['all','‼️ Elite','⚠️ Tough','🤔 Average','💥 Hittable','🎯 Target'].map(g => {
        const active = selPitcherGrade === g;
        const col = g==='‼️ Elite'?'#ff4020':g==='⚠️ Tough'?'#ff8020':g==='🤔 Average'?'var(--muted)':g==='💥 Hittable'?'#27c97a':g==='🎯 Target'?'#38b8f2':'var(--text)';
        return <button key={g} onClick={()=>setSelPitcherGrade(s=>s===g?'all':g)}
          style={{padding:'3px 12px',borderRadius:6,cursor:'pointer',
            background:active?'rgba(255,255,255,.08)':'transparent',
            color:active?col:'var(--muted)',
            border:`1px solid ${active?col:'var(--border)'}`,
            fontFamily:"'DM Mono',monospace",fontWeight:active?700:400,fontSize:11}}>
          {g==='all'?'All':g.split(' ')[0]}
        </button>;
      })}
    </div>}
    {error && <div style={{padding:'30px 20px',textAlign:'center',color:'var(--muted)',
      fontFamily:"'DM Mono',monospace",fontSize:12,lineHeight:1.8}}>
      <div style={{fontSize:20,marginBottom:8}}>📭</div>
      <div>No matchup data found.</div>
      <div style={{fontSize:10,marginTop:6}}>Run the engine and commit <code>daily_summary.csv</code> to <code>public/data/</code></div>

    </div>}

    {!loading && !error && Object.values(grouped).sort((a,b)=>timeToMins(a.gameTime)-timeToMins(b.gameTime)).map(game => {
      const teamPairs = Object.values(game.teams).filter(team => {
        if (selPitcherGrade === 'all') return true;
        const cleanId = team.pitcherId ? String(parseInt(team.pitcherId) || team.pitcherId) : null;
        return cleanId && pitcherGradeCache.current[cleanId] === selPitcherGrade;
      });
      if (teamPairs.length === 0) return null;
      // Format game time
      // game_time comes directly from daily_summary.csv — use as-is
      const displayTime = game.gameTime ? String(game.gameTime).trim() : '';
      return <div key={game.gameId} style={{marginBottom:20}}>
        {/* Game header */}
        <div style={{display:'flex',alignItems:'center',gap:10,
          padding:'8px 14px',borderRadius:'10px 10px 0 0',
          background:'var(--surface2)',border:'1px solid var(--border)',
          borderBottom:'none'}}>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:15,
            color:'var(--text)',letterSpacing:.5}}>
            {(() => {
              const gid = String(game.gameId);
              // Use engine-provided home/away (most reliable)
              const teamList = Object.values(game.teams);
              const anyRow = activeData.find(r => String(r.game_id) === gid && r.home_team && r.away_team);
              if (anyRow) return `${anyRow.away_team} @ ${anyRow.home_team}`;
              if (scheduleMap[gid]) return `${scheduleMap[gid].away} @ ${scheduleMap[gid].home}`;
              // Fallback: batting teams
              return teamList.length >= 2 ? `${teamList[0].team} vs ${teamList[1].team}` : (teamList[0]?.team || gid);
            })()}
          </span>
          {WEATHER_ALERT_GAME_IDS.has(String(game.gameId)) && (
            <span title="Weather may impact this game — use caution" style={{fontSize:13}}>⚠️</span>
          )}
          {displayTime && <span style={{fontSize:10,color:'var(--accent2)',
            fontFamily:"'DM Mono',monospace",fontWeight:600}}>
            {displayTime}
          </span>}
          <span style={{marginLeft:'auto',fontSize:9,color:'var(--muted)',
            fontFamily:"'DM Mono',monospace"}}>
            {teamPairs.reduce((s,t)=>s+t.batters.length,0)} batters
          </span>
        </div>

        {/* Team sections */}
        {teamPairs.map((team,ti) => <div key={team.team}
          style={{border:'1px solid var(--border)',
            borderTop: ti===0 ? '1px solid var(--border)' : 'none',
            borderRadius: ti===teamPairs.length-1 ? '0 0 10px 10px' : 0,
            background:'var(--surface)',overflow:'hidden'}}>

          {/* Pitcher matchup header */}
          <div style={{padding:'8px 14px',background:'rgba(255,255,255,.03)',
            borderBottom:'1px solid rgba(255,255,255,.05)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
                fontSize:12,color:'var(--accent2)',letterSpacing:.5}}>
                {team.team}
              </span>
              <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>
                vs
              </span>
              <span style={{fontSize:11,fontFamily:"'Oswald',sans-serif",fontWeight:700,
                color:'var(--text)',cursor:'pointer',display:'flex',alignItems:'center',gap:4}}
                onClick={e=>{e.stopPropagation();openPitcherSlide({pid:parseInt(team.pitcherId)||0,name:team.pitcher,team:team.team,hand:'',pitchMix:[]});}}>
                {team.pitcher}
                <span style={{fontSize:10,color:'var(--ice)',fontFamily:"'DM Mono',monospace",fontWeight:700}}>› Stats</span>
              </span>
              <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>
                · {team.pitchMix}
              </span>
            </div>
            <PitcherCard pitcherId={team.pitcherId} pitcherName={team.pitcher} onGrade={(id,g)=>{pitcherGradeCache.current[id]=g;}}/>
          </div>

          {/* Batters */}
          {team.batters.map(b => {
            const uid = `${b.game_id}-${b.batter_id||b.batter}`;
            const isExp = expandedId === uid;
            const cfg = gc(b.grade);
            const pid = parseInt(b.batter_id) || 0;
            const curPick = picks[String(pid)]?.type;
            const totalFlags = parseInt(b.total_flags)||0;
            const recentEV = parseFloat(b.recent_avg_ev)||0;
            const bvpEV    = parseFloat(b.bvp_avg_ev)||0;
            const simHR    = parseFloat(b.sim_hr)||0;
            // Only show Gone Yard if the HR happened today (not yesterday's leftover data)
            const todayETStr = new Date().toLocaleDateString('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).split('/').reverse().join('-').replace(/-(\d{2})-(\d{2})$/,(_,m,d)=>'-'+m+'-'+d).replace(/(\d{4})-(\d{2})-(\d{2})/,(_,y,m,d)=>y+'-'+m+'-'+d);
            const etToday = (() => { const d=new Date(); const s=d.toLocaleDateString('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}); const [m,dy,y]=s.split('/'); return `${y}-${m.padStart(2,'0')}-${dy.padStart(2,'0')}`; })();
            const hrIsToday = HR_DATA_DATE === etToday;
            const goneYard = hrIsToday && HR_DATA.some(h => h.batterId === pid || (b.batter && h.batterName && h.batterName.toLowerCase() === b.batter.toLowerCase()));
            const projHR   = parseFloat(b.proj_hr_adj)||0;

            return <div key={uid}>
              {/* Batter row */}
              <div onClick={()=>setExpanded(id=>id===uid?null:uid)}
                style={{padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,.04)',
                  cursor:'pointer',transition:'background .1s',
                  background:isExp?'rgba(255,255,255,.06)':'transparent',
                  borderLeft:isExp?`3px solid ${cfg.color}`:'3px solid transparent'}}
                onMouseEnter={e=>{if(!isExp)e.currentTarget.style.background='rgba(255,255,255,.03)';}}
                onMouseLeave={e=>{if(!isExp)e.currentTarget.style.background='transparent';}}>

                <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                  {/* Grade badge */}
                  <div style={{padding:'2px 8px',borderRadius:5,minWidth:28,textAlign:'center',
                    background:cfg.bg,border:`1px solid ${cfg.border}`,
                    color:cfg.color,fontFamily:"'Oswald',sans-serif",
                    fontWeight:800,fontSize:12,letterSpacing:.5,flexShrink:0}}>
                    {b.grade}
                  </div>
                  {goneYard && <div style={{padding:'2px 8px',borderRadius:5,flexShrink:0,
                    background:'rgba(255,20,0,.25)',border:'1px solid rgba(255,20,0,.5)',
                    color:'#fff',fontFamily:"'DM Mono',monospace",
                    fontWeight:800,fontSize:10,letterSpacing:.5}}>
                    💥</div>}
                  {(b.is_hit_specialist==='True'||b.is_hit_specialist===true) && (
                    <div style={{padding:'2px 7px',borderRadius:5,flexShrink:0,
                      background:'rgba(39,201,122,.15)',border:'1px solid rgba(39,201,122,.35)',
                      color:'#27c97a',fontFamily:"'DM Mono',monospace",fontWeight:800,fontSize:9,letterSpacing:.5}}
                      title="Hit Specialist — strong proj hit rate vs this pitch mix">
                      📈 H
                    </div>
                  )}
                  {(b.is_xbh_specialist==='True'||b.is_xbh_specialist===true) && (
                    <div style={{padding:'2px 7px',borderRadius:5,flexShrink:0,
                      background:'rgba(245,166,35,.15)',border:'1px solid rgba(245,166,35,.35)',
                      color:'var(--accent2)',fontFamily:"'DM Mono',monospace",fontWeight:800,fontSize:9,letterSpacing:.5}}
                      title="XBH Specialist — strong projected extra-base hit rate">
                      🔥 XBH
                    </div>
                  )}
                  {isDueFromRow(b, pid) && DUE_BADGE}
                  {(()=>{
                    const kmTB = parseFloat(b.sim_tb)||0;
                    const kmPG = pitcherGradeCache.current[String(parseInt(b.pitcher_id)||0)];
                    const isDmd = b.grade==='A+' && kmTB>=2.0 && (kmPG==='💥 Hittable'||kmPG==='🎯 Target');
                    return isDmd && <span style={{padding:'1px 5px',borderRadius:4,fontSize:9,fontWeight:700,
                      background:'rgba(255,204,0,.15)',color:'#ffcc00',
                      border:'1px solid rgba(255,204,0,.4)',flexShrink:0,marginLeft:2}}
                      title="💎 Tier 1 Lock: A+ + Sim TB≥2.0 + Hittable/Target pitcher">💎</span>;
                  })()}

                  {/* Avatar + Batter name + hand — click opens season stats slideout */}
                  <div style={{display:'flex',alignItems:'center',gap:7,flex:1,minWidth:0}}>
                    <PlayerAvatar pid={pid} name={b.batter} size={28}/>
                    <div style={{minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer'}}
                        onClick={e=>{e.stopPropagation();const cp=getCachedPlayer(pid)||{};openAtBatSlide({pid:pid||parseInt(b.batter_id)||0,name:b.batter,team:b.batting_team,avgEV:cp.avgEV,barrel:cp.barrel,hardHit:cp.hardHit,flyBall:cp.flyBall,hr:cp.hr,avg:cp.avg,obp:cp.obp,slg:cp.slg,xwoba:cp.xwoba,oSwing:cp.oSwing,kPct:cp.kPct,bbPct:cp.bbPct,gbPct:cp.gbPct,launchAngle:cp.launchAngle,sweetSpot:cp.sweetSpot});}}> 
                        <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,
                          whiteSpace:'normal',wordBreak:'break-word',lineHeight:1.2,
                          color:'var(--text)'}}>
                          {b.batter}
                        </span>
                        <InjuryBadge pid={pid} name={b.batter}/>
                        {isHotBatPlayer(b) && <span style={{fontSize:10,flexShrink:0,lineHeight:1}}
                          title="🔥 Hot Bat — 3+ HRs in last 7 days">🔥</span>}
                        <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                          marginLeft:2}}>{b.batter_hand}HB</span>
                        <span style={{fontSize:10,color:'var(--muted)',opacity:.5}}>›</span>
                      </div>
                    {/* Flag pills */}
                    <div style={{display:'flex',gap:4,marginTop:3,flexWrap:'wrap'}}>
                      {flag(b.recent_ev_flag) &&
                        <span style={{fontSize:8,padding:'1px 5px',borderRadius:4,
                          background:'rgba(255,64,32,.12)',color:'#ff4020',
                          fontFamily:"'DM Mono',monospace",border:'1px solid rgba(255,64,32,.25)'}}>
                          ⚡ EV
                        </span>}
                      {flag(b.recent_barrel_flag) &&
                        <span style={{fontSize:8,padding:'1px 5px',borderRadius:4,
                          background:'rgba(255,128,32,.12)',color:'#ff8020',
                          fontFamily:"'DM Mono',monospace",border:'1px solid rgba(255,128,32,.25)'}}>
                          🛢 Brl
                        </span>}
                      {flag(b.recent_fb_flag) &&
                        <span style={{fontSize:8,padding:'1px 5px',borderRadius:4,
                          background:'rgba(245,166,35,.10)',color:'var(--accent2)',
                          fontFamily:"'DM Mono',monospace",border:'1px solid rgba(245,166,35,.22)'}}>
                          🚀 FB
                        </span>}
                      {flag(b.recent_la_flag) &&
                        <span style={{fontSize:8,padding:'1px 5px',borderRadius:4,
                          background:'rgba(39,201,122,.10)',color:'#27c97a',
                          fontFamily:"'DM Mono',monospace",border:'1px solid rgba(39,201,122,.22)'}}>
                          ✓ LA
                        </span>}
                      {flag(b.bvp_ev_flag) &&
                        <span style={{fontSize:8,padding:'1px 5px',borderRadius:4,
                          background:'rgba(56,184,242,.10)',color:'var(--ice)',
                          fontFamily:"'DM Mono',monospace",border:'1px solid rgba(56,184,242,.22)'}}>
                          BvP⚡
                        </span>}
                      {flag(b.bvp_barrel_flag) &&
                        <span style={{fontSize:8,padding:'1px 5px',borderRadius:4,
                          background:'rgba(56,184,242,.10)',color:'var(--ice)',
                          fontFamily:"'DM Mono',monospace",border:'1px solid rgba(56,184,242,.22)'}}>
                          BvP🛢
                        </span>}
                    </div>
                  </div>
                  </div>

                  {/* Key stats */}
                  <div style={{display:'flex',gap:8,flexShrink:0,alignItems:'center'}}>
          {LINEUP_STATUS[pid]?.status === 'confirmed' && (
            <span style={{fontSize:9,fontFamily:"'DM Mono',monospace",fontWeight:700,
              padding:'1px 5px',borderRadius:4,flexShrink:0,
              background:'rgba(39,201,122,.12)',border:'1px solid rgba(39,201,122,.35)',
              color:'#27c97a',letterSpacing:.3}}>✅</span>
          )}
                    {recentEV > 0 && <div style={{textAlign:'center'}}>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
                        fontSize:14,color:recentEV>=95?'#ff8020':recentEV>=90?'#ffc840':'var(--text)',lineHeight:1}}>
                        {recentEV.toFixed(1)}
                      </div>
                      <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                        textTransform:'uppercase',letterSpacing:.4,marginTop:1}}>EV L7</div>
                    </div>}
                    {/* Add to Picks */}
                    {pid > 0 && <PickButton pid={pid} name={b.batter} team={b.batting_team}/>}
                  </div>
                </div>
              </div>

              {/* Expanded panel */}
              {isExp && <div style={{background:'rgba(0,0,0,.25)',
                borderBottom:'1px solid rgba(255,255,255,.06)',
                borderLeft:`3px solid ${cfg.color}`,padding:'12px 16px'}}>

                {/* Sim line */}
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                    textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>
                    Simulated Game Line
                  </div>
                  <div style={{display:'flex',gap:0,border:'1px solid var(--border)',
                    borderRadius:8,overflow:'hidden'}}>
                    {[
                      {label:'PA',   val:num(b.sim_pa,1),   raw:parseFloat(b.sim_pa)||0},
                      {label:'H',    val:num(b.sim_h,2),    raw:parseFloat(b.sim_h)||0},
                      {label:'HR',   val:num(b.sim_hr,2), raw:simHR, color:simHR>=0.15?'var(--accent)':undefined},
                      {label:'2B',   val:num(b.sim_2b,2),   raw:parseFloat(b.sim_2b)||0},
                      {label:'BB',   val:num(b.sim_bb,2),   raw:parseFloat(b.sim_bb)||0},
                      {label:'K',    val:num(b.sim_k,2),    raw:parseFloat(b.sim_k)||0},
                      {label:'TB',   val:num(b.sim_tb,2),   raw:parseFloat(b.sim_tb)||0},
                      {label:'RBI',  val:num(b.sim_rbi,2),  raw:parseFloat(b.sim_rbi)||0},
                    ].filter(s=>s.raw>0).map((s,i,arr)=>(
                      <div key={s.label} style={{flex:1,textAlign:'center',padding:'5px 3px',
                        background:'rgba(255,255,255,.02)',
                        borderRight:i<arr.length-1?'1px solid var(--border)':'none'}}>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
                          fontSize:13,color:s.color||'var(--text)',lineHeight:1}}>{s.val}</div>
                        <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                          textTransform:'uppercase',letterSpacing:.4,marginTop:2}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Two-column: Recent L7 vs BvP */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                  {[
                    {title:'📅 Recent L7',pa:b.recent_pa,ev:b.recent_avg_ev,brl:b.recent_barrel_pct,hh:b.recent_hh_pct,fb:b.recent_fb_pct,la:b.recent_avg_la,
                      flags:[flag(b.recent_ev_flag),flag(b.recent_barrel_flag),flag(b.recent_fb_flag),flag(b.recent_la_flag)]},
                    {title:'🆚 BvP Pitch Mix',pa:b.bvp_pa,ev:b.bvp_avg_ev,brl:b.bvp_barrel_pct,hh:b.bvp_hh_pct,fb:b.bvp_fb_pct,la:b.bvp_avg_la,
                      flags:[flag(b.bvp_ev_flag),flag(b.bvp_barrel_flag),flag(b.bvp_fb_flag),flag(b.bvp_la_flag)]},
                  ].map(s=>(
                    <div key={s.title} style={{background:'rgba(255,255,255,.03)',
                      border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px'}}>
                      <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                        marginBottom:6,fontWeight:600}}>{s.title} ({s.pa} PA)</div>
                      {[
                        {label:'Avg EV', val:num(s.ev,1), flag:s.flags[0], hi:95},
                        {label:'Barrel%',val:pct(s.brl),   flag:s.flags[1]},
                        {label:'HH%',    val:(s.hh!=null&&s.hh!==''&&!isNaN(parseFloat(s.hh))?parseFloat(s.hh).toFixed(1)+'%':'--'), flag:false},
                        {label:'FB%',    val:(s.fb!==undefined&&s.fb!==''&&s.fb!==null&&!isNaN(parseFloat(s.fb))?parseFloat(s.fb).toFixed(1)+'%':'—'),    flag:s.flags[2]},
                        {label:'Avg LA', val:s.la&&parseFloat(s.la)!==0?`${parseFloat(s.la).toFixed(1)}°`:'—', flag:s.flags[3]},
                      ].map(m=>(
                        <div key={m.label} style={{display:'flex',alignItems:'center',
                          justifyContent:'space-between',marginBottom:3}}>
                          <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>
                            {m.label}
                          </span>
                          <div style={{display:'flex',alignItems:'center',gap:4}}>
                            <span style={{fontSize:11,fontFamily:"'Oswald',sans-serif",fontWeight:700,
                              color:m.flag?'#27c97a':'var(--text)'}}>{m.val}</span>
                            {m.flag && <span style={{fontSize:9}}>✓</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* AB/HR data card — from player cache */}
                {(() => {
                  const cp = getCachedPlayer(pid);
                  const seasonHR = cp?.hr || 0;
                  const seasonPA = cp?.pa || cp?.ab || 0;
                  if (seasonHR < 2 || seasonPA < 10) return null;
                  const abPerHR   = Math.round(seasonPA / seasonHR);
                  const abSinceHR = cp?.windows?.last7?.abSinceHR
                    ?? (cp?.daysSinceHR != null ? Math.round(cp.daysSinceHR * 3.8) : null);
                  const due = isDue(pid);
                  const abPHRColor = abPerHR<=15?'#ff4020':abPerHR<=22?'#ff8020':abPerHR<=30?'var(--accent2)':'var(--text)';
                  const abSHRColor = abSinceHR!=null&&abSinceHR>abPerHR*1.15?'var(--ice)':'var(--muted)';
                  return (
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12,
                      padding:'8px 12px',borderRadius:8,
                      background:due?'rgba(56,184,242,.06)':'rgba(255,255,255,.03)',
                      border:due?'1px solid rgba(56,184,242,.25)':'1px solid var(--border)'}}>
                      <div style={{textAlign:'center',minWidth:44}}>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:18,
                          color:abPHRColor,lineHeight:1}}>{abPerHR}</div>
                        <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                          textTransform:'uppercase',letterSpacing:.5,marginTop:1}}>AB / HR</div>
                      </div>
                      <div style={{width:1,height:28,background:'var(--border)'}}/>
                      <div style={{textAlign:'center',minWidth:44}}>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:18,
                          color:abSHRColor,lineHeight:1}}>{abSinceHR!=null?abSinceHR:'—'}</div>
                        <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                          textTransform:'uppercase',letterSpacing:.5,marginTop:1}}>AB Since HR</div>
                      </div>
                      <div style={{width:1,height:28,background:'var(--border)'}}/>
                      <div style={{textAlign:'center',minWidth:44}}>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:18,
                          color:'var(--text)',lineHeight:1}}>{seasonHR}</div>
                        <div style={{fontSize:7,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                          textTransform:'uppercase',letterSpacing:.5,marginTop:1}}>Season HR</div>
                      </div>
                      {due && <div style={{marginLeft:'auto'}}>{DUE_BADGE}</div>}
                      {!due && abSinceHR!=null && <div style={{marginLeft:'auto',
                        fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>
                        {Math.round(abSinceHR/abPerHR*100)}% of rate
                      </div>}
                    </div>
                  );
                })()}

                {/* Environment */}
                <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                  {/* Statcast link pill — left of wind */}
                  <a href={`https://baseballsavant.mlb.com/savant-player/${pid}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={e=>e.stopPropagation()}
                    style={{padding:'3px 10px',borderRadius:6,fontSize:10,
                      background:'rgba(56,184,242,.08)',border:'1px solid rgba(56,184,242,.25)',
                      fontFamily:"'DM Mono',monospace",color:'var(--ice)',
                      textDecoration:'none',display:'flex',alignItems:'center',gap:4}}>
                    ⚡ Statcast
                  </a>
                  {b.wind_effect && b.wind_effect !== 'N/A' && <div style={{
                    padding:'3px 10px',borderRadius:6,fontSize:10,
                    background:'rgba(255,255,255,.04)',border:'1px solid var(--border)',
                    fontFamily:"'DM Mono',monospace",color:'var(--text)'}}>
                    {b.wind_effect}
                  </div>}
                  {b.temp_f && parseFloat(b.temp_f) > 0 && <div style={{
                    padding:'3px 10px',borderRadius:6,fontSize:10,
                    background:'rgba(255,255,255,.04)',border:'1px solid var(--border)',
                    fontFamily:"'DM Mono',monospace",color:'var(--muted)'}}>
                    {parseFloat(b.temp_f).toFixed(0)}°F
                  </div>}
                  {b.condition && b.condition !== 'N/A' && <div style={{
                    padding:'3px 10px',borderRadius:6,fontSize:10,
                    background:'rgba(255,255,255,.04)',border:'1px solid var(--border)',
                    fontFamily:"'DM Mono',monospace",color:'var(--muted)'}}>
                    {b.condition}
                  </div>}
                  {/* Pitcher barrel allowed */}
                  {b.pitcher_barrel_pct_allowed && parseFloat(b.pitcher_barrel_pct_allowed) > 0 && (() => {
                    const v = parseFloat(b.pitcher_barrel_pct_allowed);
                    const col = v >= 10 ? '#ff4020' : v >= 6 ? '#f5a623' : 'var(--muted)';
                    return <div style={{padding:'3px 10px',borderRadius:6,fontSize:10,
                      background:'rgba(255,255,255,.04)',border:`1px solid ${v>=6?'rgba(255,128,32,.3)':'var(--border)'}`,
                      fontFamily:"'DM Mono',monospace",color:col}}>
                      🎯 {v.toFixed(1)}% Brl allowed
                    </div>;
                  })()}
                  {/* Bullpen HR Rank */}
                  {b.bullpen_hr_rank && parseInt(b.bullpen_hr_rank) > 0 && (() => {
                    const rank = parseInt(b.bullpen_hr_rank);
                    const col = rank <= 10 ? '#27c97a' : rank <= 20 ? '#f5a623' : '#ff4020';
                    const label = rank <= 10 ? '💥 Soft Pen' : rank <= 20 ? '⚾ Avg Pen' : '🔒 Tough Pen';
                    const borderCol = rank <= 10 ? 'rgba(39,201,122,.3)' : rank <= 20 ? 'rgba(245,166,35,.3)' : 'rgba(255,64,32,.3)';
                    return <div style={{padding:'3px 10px',borderRadius:6,fontSize:10,
                      background:'rgba(255,255,255,.04)',border:`1px solid ${borderCol}`,
                      fontFamily:"'DM Mono',monospace",color:col}}>
                      {label} #{rank}/30
                    </div>;
                  })()}
                  {/* Lineup weak spot */}
                  {b.pitcher_lineup_weak_spot && parseInt(b.pitcher_lineup_weak_spot) > 0 && (() => {
                    const ws = parseInt(b.pitcher_lineup_weak_spot);
                    return <div style={{padding:'3px 10px',borderRadius:6,fontSize:10,
                      background:'rgba(245,166,35,.08)',border:'1px solid rgba(245,166,35,.3)',
                      fontFamily:"'DM Mono',monospace",color:'#f5a623',fontWeight:700}}
                      title={`This pitcher gives up the most HRs to the #${ws} lineup spot`}>
                      ⚠️ Weak vs #{ws}
                    </div>;
                  })()}
                  {/* Meatball matchup */}
                  {b.meatball_matchup_score && parseFloat(b.meatball_matchup_score) > 0 && (() => {
                    const ms = parseFloat(b.meatball_matchup_score);
                    const display = (ms * 100).toFixed(0);
                    const col = ms >= 0.15 ? '#ff4020' : ms >= 0.08 ? '#f5a623' : '#27c97a';
                    const label = ms >= 0.15 ? '🔥 Elite' : ms >= 0.08 ? '⚡ Solid' : '✓ Mild';
                    return <div style={{padding:'3px 10px',borderRadius:6,fontSize:10,
                      background:'rgba(255,64,32,.08)',border:'1px solid rgba(255,64,32,.25)',
                      fontFamily:"'DM Mono',monospace",color:col,fontWeight:700}}>
                      💣 {display} {label}
                    </div>;
                  })()}
                </div>
                {/* Live box score — fetches real game data */}
                <LiveBatterBox batterId={b.batter_id} gamePk={b.game_id} onData={(id,d)=>{liveCache.current[id]=d;}}/>

                {/* Recent Game Log — pregame only, fetched from MLB Stats API */}
                <Last7HRChart batterId={b.batter_id}/>
                <RecentGameLog batterId={b.batter_id}/>
              </div>}
            </div>;
          })}
        </div>)}
      </div>;
    })}
    </>}
  </div>;
}


// ─────────────────────────────────────────────────────────────────────────────
// DAILY BARREL v2 — Pitcher-first at-bat log explorer
// Flow: Pick pitcher from today's schedule → pitch mix filters → batter table
//       adjusts per pitcher hand + selected pitches → click batter for slide-out log
// ─────────────────────────────────────────────────────────────────────────────
function DailyBarrelTab() {
  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [games,       setGames]       = useState([]);  // today's schedule
  const [selPitcher,  setSelPitcher]  = useState(null); // { id, name, hand, team, oppTeam, oppAbbr }
  const [fPitches,    setFPitches]    = useState(new Set()); // empty = all
  const [fBatHand,    setFBatHand]    = useState('all');
  const [fMinEV,      setFMinEV]      = useState(0);
  const [fBarrel,     setFBarrel]     = useState(false);
  const [fDays,       setFDays]       = useState('season');
  const [selBatter,   setSelBatter]   = useState(null); // batter id for slideout
  const [sortCol,     setSortCol]     = useState({col:'avgEV',dir:'desc'});
  const SEASON_START_DB = '2026-03-25';

  // Load at-bat log
  useEffect(() => {
    fetch('/data/mlb_atbat_log_full.csv')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status} — make sure mlb_atbat_log_full.csv is in public/data/`); return r.text(); })
      .then(text => { setRows(parseCSVText(text).filter(r=>(r['Date']||'')>=SEASON_START_DB)); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  // Load today's schedule for pitcher picker
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).split('/').reduce((a,p,i)=>i===2?p+'-'+a.split('-')[0]+'-'+a.split('-')[1]:a.includes('-')?a:p,[]).replace(/(\d+)\/(\d+)\/(\d+)/,'$3-$1-$2');
    const d = new Date(); const s = d.toLocaleDateString('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}); const [m,dy,y]=s.split('/'); const todayStr=`${y}-${m.padStart(2,'0')}-${dy.padStart(2,'0')}`;
    fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${todayStr}&hydrate=probablePitcher(note),team&fields=dates,games,gamePk,teams,away,home,team,abbreviation,probablePitcher,fullName,pitchHand,id`)
      .then(r=>r.json())
      .then(data=>{
        const gs = data.dates?.[0]?.games || [];
        const pitchers = [];
        gs.forEach(g=>{
          const aw = g.teams?.away, hm = g.teams?.home;
          if (aw?.probablePitcher?.id) pitchers.push({
            id: String(aw.probablePitcher.id), name: aw.probablePitcher.fullName,
            hand: aw.probablePitcher.pitchHand?.code||'R',
            team: aw.team?.abbreviation||'', oppTeam: hm.team?.abbreviation||'',
            gamePk: g.gamePk, label: `${aw.team?.abbreviation||'?'} @ ${hm.team?.abbreviation||'?'}`
          });
          if (hm?.probablePitcher?.id) pitchers.push({
            id: String(hm.probablePitcher.id), name: hm.probablePitcher.fullName,
            hand: hm.probablePitcher.pitchHand?.code||'R',
            team: hm.team?.abbreviation||'', oppTeam: aw.team?.abbreviation||'',
            gamePk: g.gamePk, label: `${aw.team?.abbreviation||'?'} @ ${hm.team?.abbreviation||'?'}`
          });
        });
        setGames(pitchers);
        if (pitchers.length > 0) setSelPitcher(pitchers[0]);
      }).catch(()=>{});
  }, []);

  // Resolve name from cache
  const rn = id => getCachedPlayer(id)?.name || `#${id}`;

  // Date cutoff
  const cutoff = useMemo(()=>{
    if (fDays==='season') return SEASON_START_DB;
    const d=new Date(); d.setDate(d.getDate()-parseInt(fDays)); return d.toISOString().slice(0,10);
  },[fDays]);

  // Rows for selected pitcher's opponents — filtered by pitch mix + batter hand + date
  const pitcherRows = useMemo(()=>{
    if (!selPitcher || rows.length===0) return [];
    return rows.filter(r=>{
      if ((r['Date']||'')<cutoff) return false;
      // Filter to at-bats AGAINST this pitcher by name (most reliable since IDs vary)
      const pitId = String(r['Pitcher']||'');
      const nameMatch = selPitcher.name && (rn(pitId).toLowerCase()===selPitcher.name.toLowerCase() || pitId===selPitcher.id);
      if (!nameMatch && pitId!==selPitcher.id) return false;
      if (fBatHand!=='all' && r['Batter Hand']!==fBatHand) return false;
      if (fPitches.size>0 && !fPitches.has(r['Pitch Type'])) return false;
      if (fMinEV>0 && (parseFloat(r['Exit Velocity'])||0)<fMinEV) return false;
      if (fBarrel && parseInt(r['Is Barrel']||0)!==1) return false;
      return true;
    });
  },[rows, selPitcher, cutoff, fBatHand, fPitches, fMinEV, fBarrel]);

  // Pitch mix for selected pitcher from full season data
  const pitcherMix = useMemo(()=>{
    if (!selPitcher || rows.length===0) return [];
    const pitRows = rows.filter(r=>{
      const pid=String(r['Pitcher']||'');
      return pid===selPitcher.id || rn(pid).toLowerCase()===selPitcher.name?.toLowerCase();
    });
    const counts={};
    pitRows.forEach(r=>{ const pt=r['Pitch Type']; if(pt) counts[pt]=(counts[pt]||0)+1; });
    const total=Object.values(counts).reduce((a,b)=>a+b,0);
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([pt,n])=>({ pt, pct:total>0?Math.round(n/total*100):0, n }));
  },[rows, selPitcher]);

  // Batter aggregates
  const batterStats = useMemo(()=>{
    const map={};
    pitcherRows.forEach(r=>{
      const id=String(r['Batter']||''); if(!id||id==='nan') return;
      if (!map[id]) map[id]={id,hand:r['Batter Hand']||'',pa:0,evs:[],barrels:0,hh:0,hrs:0,fbs:[],las:[],hits:0,pas:0};
      const m=map[id]; m.pa++;
      const ev=parseFloat(r['Exit Velocity']); if(!isNaN(ev)&&ev>0) m.evs.push(ev);
      if(parseInt(r['Is Barrel']||0)===1) m.barrels++;
      if(parseInt(r['Is Hard Hit']||0)===1) m.hh++;
      if(parseInt(r['Is Home Run']||0)===1) m.hrs++;
      const bbt=(r['Batted Ball Type']||'').toLowerCase();
      if(bbt==='fly_ball'||bbt==='line_drive') m.fbs.push(1);
      const la=parseFloat(r['Launch Angle']); if(!isNaN(la)) m.las.push(la);
      const res=(r['At-Bat Result']||'').toLowerCase();
      if(['single','double','triple','home_run'].some(h=>res.includes(h))) m.hits++;
    });
    return Object.values(map).filter(m=>m.pa>=3).map(m=>({
      id:m.id, name:rn(m.id), hand:m.hand, pa:m.pa,
      avgEV: m.evs.length ? +(m.evs.reduce((a,b)=>a+b,0)/m.evs.length).toFixed(1) : null,
      barrelPct: +(m.barrels/m.pa*100).toFixed(1),
      hhPct: +(m.hh/m.pa*100).toFixed(1),
      hrCount: m.hrs,
      fbPct: +(m.fbs.length/m.pa*100).toFixed(1),
      avgLA: m.las.length ? +(m.las.reduce((a,b)=>a+b,0)/m.las.length).toFixed(1) : null,
      hitRate: +(m.hits/m.pa*100).toFixed(1),
    }));
  },[pitcherRows]);

  // Per-batter at-bat log for slideout
  const batterLog = useMemo(()=>{
    if (!selBatter) return [];
    return pitcherRows.filter(r=>String(r['Batter'])===String(selBatter))
      .map(r=>({
        date: r['Date']||'', pitch: r['Pitch Type']||'',
        ev: parseFloat(r['Exit Velocity'])||null,
        la: parseFloat(r['Launch Angle'])||null,
        dist: parseFloat(r['Hit Distance'])||null,
        result: (r['At-Bat Result']||'').replace(/_/g,' '),
        barrel: parseInt(r['Is Barrel']||0),
        hh: parseInt(r['Is Hard Hit']||0),
        hr: parseInt(r['Is Home Run']||0),
        bbt: r['Batted Ball Type']||'',
        count: r['Pitch Count']||'',
      })).sort((a,b)=>b.date.localeCompare(a.date));
  },[pitcherRows, selBatter]);

  const togglePitch = pt => { setFPitches(p=>{ const n=new Set(p); n.has(pt)?n.delete(pt):n.add(pt); return n; }); };
  const sortArr = (arr,col,dir) => [...arr].sort((a,b)=>{ const av=a[col]??-Infinity,bv=b[col]??-Infinity; return dir==='desc'?bv-av:av-bv; });
  const thClick = col => () => setSortCol(s=>({col,dir:s.col===col&&s.dir==='desc'?'asc':'desc'}));
  const thArrow = col => sortCol.col===col?(sortCol.dir==='desc'?' ▼':' ▲'):'';
  const evCol = v => v==null?'var(--muted)':v>=95?'#ff4020':v>=92?'#ff8020':v>=90?'var(--accent2)':'var(--text)';
  const brlCol = v => v>=10?'#ff4020':v>=6?'#ff8020':v>=3?'var(--accent2)':'var(--text)';
  const pillStyle = (active,col='var(--accent2)')=>({ padding:'3px 9px',borderRadius:20,cursor:'pointer',fontSize:10,fontWeight:active?700:400,fontFamily:"'DM Mono',monospace",border:`1px solid ${active?col:'var(--border)'}`,background:active?col+'20':'transparent',color:active?col:'var(--muted)',transition:'all .12s',whiteSpace:'nowrap' });

  if (loading) return <div style={{padding:'40px',textAlign:'center'}}><div className="sp" style={{margin:'0 auto 12px',width:24,height:24,borderWidth:2}}/><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:'var(--muted)'}}>Loading at-bat log…</div></div>;
  if (error) return <div style={{padding:'16px',background:'rgba(255,64,32,.08)',borderRadius:8,border:'1px solid rgba(255,64,32,.25)',fontFamily:"'DM Mono',monospace",fontSize:11,color:'var(--accent)'}}>✗ {error}</div>;

  return <div>

    {/* ── Step 1: Pitcher Picker ─────────────────────────────────── */}
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px',marginBottom:12}}>
      <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>
        Step 1 — Select Today's Pitcher
      </div>
      {games.length === 0
        ? <div style={{fontSize:11,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>No probable pitchers found for today</div>
        : <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {games.map(p=>{
            const active = selPitcher?.id===p.id;
            return <button key={p.id+p.gamePk} onClick={()=>{ setSelPitcher(p); setFPitches(new Set()); }}
              style={{...pillStyle(active,'var(--ice)'),padding:'5px 12px',borderRadius:8}}>
              <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12}}>{p.name}</span>
              <span style={{marginLeft:5,fontSize:9,opacity:.7}}>{p.hand}HP · {p.label}</span>
            </button>;
          })}
        </div>
      }
    </div>

    {selPitcher && <>

    {/* ── Step 2: Pitch Mix + Filters ───────────────────────────── */}
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px',marginBottom:12}}>
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:8,flexWrap:'wrap'}}>
        <div>
          <PlayerAvatar pid={selPitcher.id} name={selPitcher.name} size={32}/>
        </div>
        <div>
          <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:15}}>{selPitcher.name}</div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)'}}>
            {selPitcher.hand}HP · {selPitcher.team} · vs {selPitcher.oppTeam}
          </div>
        </div>
        <div style={{marginLeft:'auto',fontFamily:"'DM Mono',monospace",fontSize:10,color:'var(--muted)'}}>
          {pitcherRows.length.toLocaleString()} at-bats
        </div>
      </div>

      {/* Pitch mix pills — built from actual data */}
      <div style={{marginBottom:8}}>
        <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>
          Step 2 — Filter Pitch Mix
        </div>
        <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
          <button onClick={()=>setFPitches(new Set())} style={pillStyle(fPitches.size===0,'var(--text)')}>All Pitches</button>
          {pitcherMix.map(({pt,pct})=>(
            <button key={pt} onClick={()=>togglePitch(pt)} style={pillStyle(fPitches.has(pt),'var(--accent2)')}>
              {pt} <span style={{opacity:.6,fontSize:9}}>{pct}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* Secondary filters */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:1}}>Batter:</span>
        {['all','L','R','S'].map(h=>(
          <button key={h} onClick={()=>setFBatHand(h)} style={pillStyle(fBatHand===h,'#27c97a')}>
            {h==='all'?'Both Hands':h+'HB'}
          </button>
        ))}
        <span style={{width:1,height:16,background:'var(--border)'}}/>
        {[['season','Season'],['30','L30'],['14','L14'],['7','L7']].map(([v,l])=>(
          <button key={v} onClick={()=>setFDays(v)} style={pillStyle(fDays===v,'var(--accent2)')}>{l}</button>
        ))}
        <span style={{width:1,height:16,background:'var(--border)'}}/>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>Min EV:</span>
          <input type="range" min={0} max={115} step={1} value={fMinEV} onChange={e=>setFMinEV(parseInt(e.target.value))}
            style={{width:70,accentColor:'var(--accent2)'}}/>
          <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:fMinEV>0?'var(--accent2)':'var(--muted)',minWidth:28,fontWeight:fMinEV>0?700:400}}>
            {fMinEV>0?`${fMinEV}+`:'Any'}
          </span>
        </div>
        <button onClick={()=>setFBarrel(v=>!v)} style={{...pillStyle(fBarrel,'#ff8020')}}>🛢 Barrel</button>
      </div>
    </div>

    {/* ── Step 3: Opposing Batters Table ────────────────────────── */}
    <div style={{marginBottom:8,fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:1}}>
      Step 3 — {selPitcher.oppTeam} Batters vs {selPitcher.name}{fPitches.size>0?` · ${[...fPitches].join('/')}`:''}
      {fBatHand!=='all'?` · ${fBatHand}HB`:''}
    </div>

    {batterStats.length === 0
      ? <div style={{padding:'24px',textAlign:'center',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:11,background:'var(--surface)',borderRadius:8,border:'1px solid var(--border)'}}>
          No at-bat data found for this pitcher vs current filters.<br/>
          <span style={{fontSize:9,opacity:.6}}>Try expanding the date window or removing pitch filters</span>
        </div>
      : <div className="tw"><table>
          <thead><tr style={{background:'var(--surface2)'}}>
            {[['name','Batter',false,'left'],['hand','Hand',false,'center'],['pa','PA',true,'right'],
              ['avgEV','Avg EV',true,'right'],['barrelPct','Brl%',true,'right'],
              ['hhPct','HH%',true,'right'],['hrCount','HR',true,'right'],
              ['fbPct','FB%',true,'right'],['avgLA','Avg LA',true,'right'],
              ['hitRate','Hit%',true,'right'],
            ].map(([col,label,sortable,align])=>(
              <th key={col} onClick={sortable?thClick(col):undefined} style={{
                padding:'6px 8px',textAlign:align,cursor:sortable?'pointer':'default',userSelect:'none',
                fontFamily:"'DM Mono',monospace",fontSize:9,fontWeight:700,
                color:sortCol.col===col?'var(--accent2)':'var(--muted)',
                textTransform:'uppercase',letterSpacing:.8,whiteSpace:'nowrap'}}>
                {label}{sortable?thArrow(col):''}
              </th>
            ))}
            <th style={{padding:'6px 8px',fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8}}>Log</th>
          </tr></thead>
          <tbody>
            {sortArr(batterStats,sortCol.col,sortCol.dir).map(m=>(
              <tr key={m.id} className="dr" style={{background:selBatter===m.id?'rgba(255,255,255,.06)':'transparent'}}>
                <td><div style={{display:'flex',alignItems:'center',gap:6}}>
                  <PlayerAvatar pid={m.id} name={m.name} size={22}/>
                  <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,
                    color:isKeyMatchup(m.id)?'#ff8020':'var(--text)'}}>{m.name}</span>
                </div></td>
                <td style={{textAlign:'center'}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)'}}>{m.hand}HB</span></td>
                <td style={{textAlign:'right'}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{m.pa}</span></td>
                <td style={{textAlign:'right'}}><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,color:evCol(m.avgEV)}}>{m.avgEV??'—'}</span></td>
                <td style={{textAlign:'right'}}><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,color:brlCol(m.barrelPct)}}>{m.barrelPct}%</span></td>
                <td style={{textAlign:'right'}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:m.hhPct>=40?'var(--accent2)':'var(--text)'}}>{m.hhPct}%</span></td>
                <td style={{textAlign:'right'}}><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,color:m.hrCount>0?'var(--accent)':'var(--text)'}}>{m.hrCount}</span></td>
                <td style={{textAlign:'right'}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{m.fbPct}%</span></td>
                <td style={{textAlign:'right'}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:m.avgLA>=18&&m.avgLA<=35?'#27c97a':'var(--text)'}}>{m.avgLA!=null?`${m.avgLA}°`:'—'}</span></td>
                <td style={{textAlign:'right'}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:m.hitRate>=30?'#27c97a':'var(--text)'}}>{m.hitRate}%</span></td>
                <td style={{textAlign:'center'}}>
                  <button onClick={()=>setSelBatter(s=>s===m.id?null:m.id)}
                    style={{padding:'2px 8px',borderRadius:5,cursor:'pointer',fontSize:9,
                      fontFamily:"'DM Mono',monospace",fontWeight:700,
                      border:`1px solid ${selBatter===m.id?'var(--accent)':'var(--border)'}`,
                      background:selBatter===m.id?'rgba(232,65,26,.15)':'transparent',
                      color:selBatter===m.id?'var(--accent)':'var(--muted)'}}>
                    {selBatter===m.id?'▲ Hide':'▼ Log'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
    }

    {/* ── Batter At-Bat Log Slide-out ────────────────────────────── */}
    {selBatter && batterLog.length > 0 && (()=>{
      const bm = batterStats.find(b=>b.id===String(selBatter));
      return <div style={{marginTop:8,background:'rgba(0,0,0,.3)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
        <div style={{padding:'8px 14px',background:'var(--surface2)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
          <PlayerAvatar pid={selBatter} name={bm?.name||''} size={26}/>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13}}>{bm?.name||''}</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)'}}>
            vs {selPitcher.name}{fPitches.size>0?` · ${[...fPitches].join('/')}`:''} · {batterLog.length} AB
          </span>
          <button onClick={()=>setSelBatter(null)}
            style={{marginLeft:'auto',background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:16,padding:'0 4px'}}>✕</button>
        </div>
        <div className="tw"><table>
          <thead><tr>
            {['Date','Pitch','EV','LA','Dist','Result','Flags'].map(l=>(
              <th key={l} style={{padding:'5px 8px',textAlign:l==='EV'||l==='LA'||l==='Dist'?'right':'left',fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8}}>{l}</th>
            ))}
          </tr></thead>
          <tbody>
            {batterLog.map((r,i)=>(
              <tr key={i} className="dr" style={{opacity:r.barrel||r.hh||r.hr?1:.65}}>
                <td><span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)'}}>{r.date}</span></td>
                <td><span style={{padding:'1px 5px',borderRadius:4,fontFamily:"'DM Mono',monospace",fontSize:9,fontWeight:700,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',color:'var(--text)'}}>{r.pitch}</span></td>
                <td style={{textAlign:'right'}}><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,color:evCol(r.ev)}}>{r.ev??'—'}</span></td>
                <td style={{textAlign:'right'}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:r.la>=18&&r.la<=35?'#27c97a':'var(--text)'}}>{r.la!=null?`${r.la}°`:'—'}</span></td>
                <td style={{textAlign:'right'}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'var(--text)'}}>{r.dist??'—'}</span></td>
                <td><span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)'}}>{r.result}</span></td>
                <td><div style={{display:'flex',gap:2}}>
                  {r.hr===1&&<span style={{fontSize:11}}>💥</span>}
                  {r.barrel===1&&<span style={{fontSize:11}}>🛢</span>}
                  {r.hh===1&&!r.barrel&&<span style={{fontSize:11}}>⚡</span>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>;
    })()}

    </>}
  </div>;
}


// ─────────────────────────────────────────────────────────────────────────────
// 🔒 LOCK IN TAB
// Sub-pages: Discover (top plays today), Props (hit rates), Odds, Bet Slip
// Sportsbook deep links: affiliate URLs that pre-populate bet slips
// Odds data: The Odds API (free tier 500 req/mo → swap in key when ready)
// ─────────────────────────────────────────────────────────────────────────────
function GetAppTab() {
  const url = "https://goingyard.app";
  const Step = ({n, text}) => (
    <div style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
      <div style={{width:22,height:22,borderRadius:"50%",background:"var(--accent)",
        color:"white",fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,
        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
        {n}
      </div>
      <div style={{fontSize:12,color:"var(--text)",fontFamily:"'DM Mono',monospace",lineHeight:1.6}}>
        {text}
      </div>
    </div>
  );

  const Card = ({icon, title, subtitle, children}) => (
    <div style={{background:"var(--surface)",border:"1px solid var(--border)",
      borderRadius:12,padding:"18px 20px",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{fontSize:28,lineHeight:1}}>{icon}</div>
        <div>
          <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:16,
            letterSpacing:.5,color:"var(--text)"}}>{title}</div>
          <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",
            marginTop:2}}>{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );

  return <div style={{maxWidth:600,margin:"0 auto"}}>
    {/* Header */}
    <div className="section-header" style={{marginBottom:20}}>
      <div>
        <div className="section-title">📲 Get the App</div>
        <div className="section-sub">Add Going Yard to your home screen or desktop — no app store needed</div>
      </div>
    </div>

    {/* App icon preview */}
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:8}}>
        <img src="/icon-192.png" alt="Going Yard" style={{width:80,height:80,
          borderRadius:18,border:"2px solid rgba(232,65,26,.4)",
          boxShadow:"0 8px 32px rgba(232,65,26,.25)",objectFit:"cover"}}/>
        <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,
          color:"var(--text)",letterSpacing:.5}}>Going Yard</div>
        <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>
          {url}
        </div>
      </div>
    </div>

    {/* iOS */}
    <Card icon="🍎" title="iPhone / iPad" subtitle="iOS Safari · 30 seconds">
      <Step n="1" text={<>Open <strong style={{color:"var(--accent2)"}}>goingyard.app</strong> in Safari (must be Safari, not Chrome)</>}/>
      <Step n="2" text={<>Tap the <strong>Share</strong> button <span style={{fontSize:16}}>⎙</span> at the bottom of the screen</>}/>
      <Step n="3" text={<>Scroll down and tap <strong>"Add to Home Screen"</strong></>}/>
      <Step n="4" text={<>Tap <strong>"Add"</strong> in the top right — the Going Yard icon appears on your home screen</>}/>
      <div style={{marginTop:10,padding:"8px 12px",borderRadius:8,
        background:"rgba(39,201,122,.06)",border:"1px solid rgba(39,201,122,.15)",
        fontSize:10,color:"#27c97a",fontFamily:"'DM Mono',monospace"}}>
        ✓ Launches full screen with no browser bar — just like a native app
      </div>
    </Card>

    {/* Android */}
    <Card icon="🤖" title="Android" subtitle="Chrome · 30 seconds">
      <Step n="1" text={<>Open <strong style={{color:"var(--accent2)"}}>goingyard.app</strong> in Chrome</>}/>
      <Step n="2" text={<>Tap the <strong>⋮</strong> menu (three dots) in the top right</>}/>
      <Step n="3" text={<>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></>}/>
      <Step n="4" text={<>Tap <strong>"Add"</strong> — the icon appears on your home screen and app drawer</>}/>
      <div style={{marginTop:10,padding:"8px 12px",borderRadius:8,
        background:"rgba(39,201,122,.06)",border:"1px solid rgba(39,201,122,.15)",
        fontSize:10,color:"#27c97a",fontFamily:"'DM Mono',monospace"}}>
        ✓ Chrome may show an automatic "Install" banner at the bottom — tap that too
      </div>
    </Card>

    {/* Mac */}
    <Card icon="🖥️" title="Mac" subtitle="Safari or Chrome · desktop shortcut">
      <div style={{marginBottom:10,fontSize:11,color:"var(--muted)",fontFamily:"'Oswald',sans-serif",
        fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>Safari</div>
      <Step n="1" text={<>Open <strong style={{color:"var(--accent2)"}}>goingyard.app</strong> in Safari</>}/>
      <Step n="2" text={<>Go to <strong>File → Add to Dock</strong> (macOS Sonoma+) or <strong>File → Share → Add to Home Screen</strong></>}/>
      <Step n="3" text={<>Click <strong>Add</strong> — appears in your Dock and Launchpad</>}/>
      <div style={{marginBottom:10,marginTop:14,fontSize:11,color:"var(--muted)",fontFamily:"'Oswald',sans-serif",
        fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>Chrome</div>
      <Step n="1" text={<>Open <strong style={{color:"var(--accent2)"}}>goingyard.app</strong> in Chrome</>}/>
      <Step n="2" text={<>Click the <strong>⊕</strong> install icon in the address bar (right side)</>}/>
      <Step n="3" text={<>Click <strong>"Install"</strong> — opens as a standalone window</>}/>
    </Card>

    {/* Windows */}
    <Card icon="🪟" title="Windows" subtitle="Chrome or Edge · desktop shortcut">
      <div style={{marginBottom:10,fontSize:11,color:"var(--muted)",fontFamily:"'Oswald',sans-serif",
        fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>Chrome</div>
      <Step n="1" text={<>Open <strong style={{color:"var(--accent2)"}}>goingyard.app</strong> in Chrome</>}/>
      <Step n="2" text={<>Click the <strong>⋮</strong> menu → <strong>Save and share → Create shortcut</strong></>}/>
      <Step n="3" text={<>Check <strong>"Open as window"</strong> and click <strong>Create</strong></>}/>
      <div style={{marginBottom:10,marginTop:14,fontSize:11,color:"var(--muted)",fontFamily:"'Oswald',sans-serif",
        fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>Edge</div>
      <Step n="1" text={<>Open <strong style={{color:"var(--accent2)"}}>goingyard.app</strong> in Edge</>}/>
      <Step n="2" text={<>Click <strong>⋯</strong> menu → <strong>Apps → Install this site as an app</strong></>}/>
      <Step n="3" text={<>Click <strong>Install</strong> — pinned to taskbar and Start menu</>}/>
    </Card>

    {/* Direct link */}
    <div style={{textAlign:"center",marginBottom:24}}>
      <a href={url} target="_blank" rel="noopener noreferrer"
        style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 24px",
          borderRadius:10,background:"var(--accent)",color:"white",
          fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,
          letterSpacing:.5,textDecoration:"none",
          boxShadow:"0 4px 16px rgba(232,65,26,.35)"}}>
        ↗ Open Going Yard
      </a>
      <div style={{marginTop:8,fontSize:10,color:"var(--muted)",
        fontFamily:"'DM Mono',monospace"}}>{url}</div>
    </div>
  </div>;
}


function PowerBITab() {
  const picks = usePicks();
  // Merge Statcast cache with full MLB roster so new/low-AB players are findable
  const players = (() => {
    const cached = Object.values(PLAYER_DATA_CACHE);
    const cachedIds = new Set(cached.map(p => p.pid));
    // Add anyone in the MLB player map who isn't in the Statcast cache
    const rosterOnly = Object.entries(GLOBAL_PLAYER_TEAM_MAP)
      .filter(([id]) => !cachedIds.has(parseInt(id)))
      .map(([id, info]) => ({
        pid:  parseInt(id),
        name: info.name,
        team: info.team || '—',
        hand: info.hand || 'R',
        pos:  info.pos  || '',
        // No Statcast data yet — zeros
        avgEV: 0, barrel: 0, hardHit: 0, hr: 0, grade: null,
      }));
    return [...cached, ...rosterOnly];
  })();
  const [searchQ, setSearchQ] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const filtered = searchQ.trim()
    ? players.filter(p => p.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
                          p.team?.toLowerCase().includes(searchQ.toLowerCase()))
        .slice(0, 12)
    : [];

  return <div style={{margin:"-16px"}}>
    {/* Add to My Picks — above frame */}
    <div style={{padding:"8px 14px",borderBottom:"1px solid var(--border)",background:"var(--surface)"}}>
    <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:showPicker?10:0}}>
        <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,letterSpacing:1}}>🎯 Add to My Picks</span>
        <span style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>Search any batter while browsing the dashboard</span>
        <button onClick={()=>setShowPicker(s=>!s)}
          style={{marginLeft:"auto",padding:"4px 12px",borderRadius:6,border:"1px solid var(--border)",
            background:showPicker?"var(--accent)":"var(--surface2)",
            color:showPicker?"white":"var(--muted)",cursor:"pointer",
            fontFamily:"'DM Mono',monospace",fontSize:11}}>
          {showPicker?"✕ Close":"＋ Open Picker"}
        </button>
      </div>
      {showPicker && <>
        <div style={{position:"relative",marginBottom:8}}>
          <input
            autoFocus type="text" value={searchQ}
            onChange={e=>setSearchQ(e.target.value)}
            placeholder="Search player or team… (e.g. DeLauter, CLE)"
            style={{width:"100%",padding:"8px 12px 8px 32px",background:"var(--surface2)",
              border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",
              fontFamily:"'DM Mono',monospace",fontSize:12,outline:"none",boxSizing:"border-box"}}
          />
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--muted)",fontSize:13}}>🔍</span>
          {searchQ && <button onClick={()=>setSearchQ("")}
            style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",
              background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:13}}>✕</button>}
        </div>
        {searchQ && filtered.length === 0 && <div style={{fontSize:11,color:"var(--muted)",fontFamily:"'DM Mono',monospace",padding:"8px 0"}}>No players found.</div>}
        {filtered.length > 0 && <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
          {filtered.map(p => {
            const key = String(p.pid);
            const current = picks[key]?.type;
            return <div key={p.pid} style={{display:"flex",alignItems:"center",gap:8,
              padding:"8px 10px",borderRadius:8,background:"var(--surface2)",
              border:`1px solid ${current?PICK_TYPES[current].color:"var(--border)"}`,
              transition:"all .15s"}}>
              <PlayerAvatar pid={p.pid} name={p.name} size={30}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}> {p.name}</div>
                <div style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}> {getTeam(p.pid,p.team)} · {p.grade?.grade||"—"}</div>
              </div>
              <PickButton pid={p.pid} name={p.name} team={p.team}/>
            </div>;
          })}
        </div>}
        {!searchQ && <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",padding:"4px 0"}}>
          Start typing to search {players.length} batters
        </div>}
      </>}
    </div></div>
    {/* iframe — full height, no scale needed for PowerBI */}
    <iframe
      title="Going Yard Analytics"
      src="https://app.powerbi.com/view?r=eyJrIjoiMTdmYTZiZDktOTA5ZC00OTFmLWE1NTktZDgwYmNhZDAwYTkwIiwidCI6IjgzOGY2MGI3LTc4NzYtNGEwZC1iM2MxLTg1Y2VlZWE1YmJhYiIsImMiOjF9"
      frameBorder="0"
      allowFullScreen
      style={{width:"100%",height:"calc(100vh - 130px)",border:"none",display:"block"}}
    />
    {/* Open in new tab below frame */}
    <div style={{padding:"8px 14px",borderTop:"1px solid var(--border)",
      display:"flex",justifyContent:"flex-end",background:"var(--surface)"}}>
      <a href="https://app.powerbi.com/view?r=eyJrIjoiMTdmYTZiZDktOTA5ZC00OTFmLWE1NTktZDgwYmNhZDAwYTkwIiwidCI6IjgzOGY2MGI3LTc4NzYtNGEwZC1iM2MxLTg1Y2VlZWE1YmJhYiIsImMiOjF9" target="_blank" rel="noopener noreferrer"
        style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:6,
          background:"var(--surface2)",border:"1px solid var(--border)",
          color:"var(--muted)",fontFamily:"'DM Mono',monospace",fontSize:11,textDecoration:"none"}}>
        ↗ Open in Power BI
      </a>
    </div>
  </div>;
}

function DataStatusBadge() {
  const [status, setStatus] = useState("checking"); // checking | live | delayed | offline
  const [lastOk, setLastOk] = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        const etDate = new Date().toLocaleDateString("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"});
        const [m,d,y] = etDate.split("/");
        const today = `${y}-${m}-${d}`;
        const res = await fetch(`/api/schedule?date=${today}`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        const games = data.dates?.[0]?.games || [];
        const liveGames = games.filter(g =>
          g.status?.abstractGameState === "Live" ||
          g.status?.codedGameState === "I"
        ).length;
        if (liveGames > 0) setStatus("live");
        else if (games.length > 0) setStatus("ok");
        else setStatus("idle");
        setLastOk(new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}));
      } catch {
        setStatus("offline");
      }
    };
    check();
    const id = setInterval(check, 120000);
    return () => clearInterval(id);
  }, []);

  const cfg = {
    live:     {dot:"#27c97a", text:"Live",     tip:"Games in progress · data updating"},
    ok:       {dot:"#38b8f2", text:"Scheduled", tip:"Data connected · games scheduled"},
    idle:     {dot:"#5a7080", text:"Off Day",   tip:"No games today"},
    checking: {dot:"#5a7080", text:"...",        tip:"Checking data connection"},
    offline:  {dot:"#ff4020", text:"Offline",   tip:"Data connection issue · retrying"},
  }[status] || {dot:"#5a7080",text:"—",tip:""};

  return (
    <div title={cfg.tip + (lastOk ? ` · ${lastOk}` : "")} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 7px",borderRadius:20,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",cursor:"default"}}>
      <div style={{width:6,height:6,borderRadius:"50%",background:cfg.dot,boxShadow:status==="live"?`0 0 6px ${cfg.dot}`:"none",animation:status==="live"?"pulse 1.5s ease-in-out infinite":"none"}}/>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:cfg.dot,letterSpacing:.3,textTransform:"uppercase"}}>{cfg.text}</span>
    </div>
  );
}


function StatcastTab() {
  const picks = usePicks();
  // Merge Statcast cache with full MLB roster so new/low-AB players are findable
  const players = (() => {
    const cached = Object.values(PLAYER_DATA_CACHE);
    const cachedIds = new Set(cached.map(p => p.pid));
    // Add anyone in the MLB player map who isn't in the Statcast cache
    const rosterOnly = Object.entries(GLOBAL_PLAYER_TEAM_MAP)
      .filter(([id]) => !cachedIds.has(parseInt(id)))
      .map(([id, info]) => ({
        pid:  parseInt(id),
        name: info.name,
        team: info.team || '—',
        hand: info.hand || 'R',
        pos:  info.pos  || '',
        // No Statcast data yet — zeros
        avgEV: 0, barrel: 0, hardHit: 0, hr: 0, grade: null,
      }));
    return [...cached, ...rosterOnly];
  })();
  const [searchQ, setSearchQ] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const filtered = searchQ.trim()
    ? players.filter(p => p.name?.toLowerCase().includes(searchQ.toLowerCase()) || p.team?.toLowerCase().includes(searchQ.toLowerCase())).slice(0,12)
    : [];
  return <div style={{margin:"-16px"}}>
    {/* Add to My Picks — above frame */}
    <div style={{padding:"8px 14px",borderBottom:"1px solid var(--border)",background:"var(--surface)"}}>
    <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:showPicker?10:0}}>
        <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,letterSpacing:1}}>🎯 Add to My Picks</span>
        <span style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>Add players while browsing Statcast</span>
        <button onClick={()=>setShowPicker(s=>!s)}
          style={{marginLeft:"auto",padding:"4px 12px",borderRadius:6,border:"1px solid var(--border)",
            background:showPicker?"var(--accent)":"var(--surface2)",color:showPicker?"white":"var(--muted)",
            cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:11}}>
          {showPicker?"✕ Close":"＋ Open Picker"}
        </button>
      </div>
      {showPicker && <>
        <div style={{position:"relative",marginBottom:8}}>
          <input autoFocus type="text" value={searchQ} onChange={e=>setSearchQ(e.target.value)}
            placeholder="Search player or team…"
            style={{width:"100%",padding:"8px 12px 8px 32px",background:"var(--surface2)",
              border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",
              fontFamily:"'DM Mono',monospace",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--muted)",fontSize:13}}>🔍</span>
          {searchQ&&<button onClick={()=>setSearchQ("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:13}}>✕</button>}
        </div>
        {searchQ&&filtered.length===0&&<div style={{fontSize:11,color:"var(--muted)",fontFamily:"'DM Mono',monospace",padding:"8px 0"}}>No players found.</div>}
        {filtered.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
          {filtered.map(p=>{
            const key=String(p.pid),current=picks[key]?.type;
            return <div key={p.pid} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:"var(--surface2)",border:`1px solid ${current?PICK_TYPES[current].color:"var(--border)"}`}}>
              <PlayerAvatar pid={p.pid||p.id} name={p.name} size={30}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",display:"flex",gap:5}}>
                  <span style={{color:"var(--accent2)",fontWeight:700}}>{getTeam(p.pid, p.team)}</span>
                  <span style={{color:"var(--muted)"}}>· {p.grade?.grade||"—"}</span>
                </div>
              </div>
              <PickButton pid={p.pid} name={p.name} team={p.team}/>
            </div>;
          })}
        </div>}
        {!searchQ&&<div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",padding:"4px 0"}}>Start typing to search {players.length} batters</div>}
      </>}
    </div></div>
    {/* iframe — scaled 80% like Doink */}
    <iframe
      title="Baseball Savant"
      src="https://baseballsavant.mlb.com/"
      frameBorder="0"
      allowFullScreen
      style={{width:"125%",height:"calc((100vh - 130px) * 1.25)",border:"none",display:"block",
        transform:"scale(0.8)",transformOrigin:"top left"}}
    />
    {/* Open in new tab below frame */}
    <div style={{padding:"8px 14px",borderTop:"1px solid var(--border)",
      display:"flex",justifyContent:"flex-end",background:"var(--surface)"}}>
      <a href="https://baseballsavant.mlb.com/" target="_blank" rel="noopener noreferrer"
        style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:6,
          background:"rgba(56,184,242,.15)",border:"1px solid rgba(56,184,242,.3)",
          color:"var(--ice)",fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,
          letterSpacing:1,textDecoration:"none"}}>
        ↗ Open in New Tab
      </a>
    </div>
  </div>;
}


// ── WEATHER TAB ───────────────────────────────────────────────

// ── WEATHER HELPERS ────────────────────────────────────────────
function parseGameHour(gameTime) {
  if (!gameTime) return null;
  try {
    const m = String(gameTime).trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return null;
    let h = parseInt(m[1],10);
    if (m[3].toUpperCase()==='PM' && h!==12) h+=12;
    if (m[3].toUpperCase()==='AM' && h===12) h=0;
    return h;
  } catch { return null; }
}

function fmtHour12(h) {
  const ap = h>=12?'PM':'AM';
  return `${h%12||12}${ap}`;
}

const WD_EMOJI = {'out-strong':'💨','out':'🌬️','in-strong':'❄️','in':'🧊','cross':'↔️','calm':'🌤️'};
const WD_COLOR = {'out-strong':'#ff4020','out':'#ff8020','in-strong':'#38b8f2','in':'#60a0d0','cross':'#f5a623','calm':'var(--muted)'};

function windBadge(dir, label) {
  const col = WD_COLOR[dir]||'var(--muted)';
  const bg  = col==='var(--muted)'?'rgba(255,255,255,.06)':`${col}18`;
  return (
    <span style={{padding:'2px 9px',borderRadius:5,fontSize:11,fontWeight:700,
      fontFamily:"'DM Mono',monospace",background:bg,
      border:`1px solid ${col}40`,color:col}}>
      {WD_EMOJI[dir]||'🌤️'} {label}
    </span>
  );
}

function envScore(s) {
  return s>=65?{c:'#ff4020',l:'🔥 HR Friendly'}:
         s>=55?{c:'#ff8020',l:'📈 Slight Boost'}:
         s>=45?{c:'var(--text)',l:'— Neutral'}:
               {c:'#38b8f2',l:'📉 Suppressor'};
}

// Stadium wind diagram: top-down field with wind arrow
// cfDir = bearing from home plate toward CF
// windDeg = meteorological FROM direction
function StadiumWindDiagram({ cfDir, windDeg, windDir, size=72 }) {
  const cx=size/2, cy=size/2;

  // Field shape: rotate entire field so CF points in cfDir direction
  const fieldRot = cfDir - 90; // rotate so "up" = cfDir
  const toRad = d => (d-90)*Math.PI/180;

  // Outfield arc (CF = up in local coords, then rotated)
  const arcR = size*0.42;
  const lfAngle = fieldRot - 45;
  const rfAngle = fieldRot + 45;
  const lf = {x: cx+arcR*Math.cos(toRad(lfAngle)), y: cy+arcR*Math.sin(toRad(lfAngle))};
  const rf = {x: cx+arcR*Math.cos(toRad(rfAngle)), y: cy+arcR*Math.sin(toRad(rfAngle))};
  const cf = {x: cx+arcR*Math.cos(toRad(fieldRot)), y: cy+arcR*Math.sin(toRad(fieldRot))};

  // Home plate (opposite of CF)
  const hpR = size*0.3;
  const hp = {x: cx+hpR*Math.cos(toRad(fieldRot+180)), y: cy+hpR*Math.sin(toRad(fieldRot+180))};

  // Diamond points
  const dR = size*0.18;
  const d1b = {x: cx+dR*Math.cos(toRad(fieldRot+135)), y: cy+dR*Math.sin(toRad(fieldRot+135))};
  const d3b = {x: cx+dR*Math.cos(toRad(fieldRot+225)), y: cy+dR*Math.sin(toRad(fieldRot+225))};
  const d2b = {x: cx+dR*Math.cos(toRad(fieldRot)),     y: cy+dR*Math.sin(toRad(fieldRot))};

  // Wind arrow (FROM direction = where wind comes from, arrow shows where it goes TO)
  const windToward = (windDeg + 180) % 360;
  const wRad = toRad(windToward);
  const wLen = size*0.34;
  const wx2 = cx + wLen*Math.cos(wRad);
  const wy2 = cy + wLen*Math.sin(wRad);
  const wx1 = cx - wLen*0.5*Math.cos(wRad);
  const wy1 = cy - wLen*0.5*Math.sin(wRad);

  const wCol = {'out-strong':'#ff4020','out':'#ff8020','in-strong':'#38b8f2','in':'#60a0d0','cross':'#f5a623','calm':'#888'}[windDir]||'#888';
  const uid = `wd${Math.abs(windDeg)}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{display:'block',flexShrink:0}}>
      {/* Background */}
      <circle cx={cx} cy={cy} r={size/2-1} fill="rgba(10,15,20,.8)" stroke="rgba(255,255,255,.1)" strokeWidth="1"/>

      {/* Outfield grass arc */}
      <path d={`M ${lf.x} ${lf.y} A ${arcR} ${arcR} 0 0 1 ${rf.x} ${rf.y} L ${hp.x} ${hp.y} Z`}
        fill="rgba(39,80,39,.5)" stroke="rgba(255,255,255,.15)" strokeWidth="0.5"/>

      {/* Infield diamond */}
      <polygon points={`${hp.x},${hp.y} ${d1b.x},${d1b.y} ${d2b.x},${d2b.y} ${d3b.x},${d3b.y}`}
        fill="rgba(180,140,80,.25)" stroke="rgba(255,255,255,.2)" strokeWidth="0.5"/>

      {/* CF label */}
      <text x={cf.x} y={cf.y} textAnchor="middle" dominantBaseline="central"
        fontSize="7" fill="rgba(255,255,255,.5)" fontFamily="monospace">CF</text>

      {/* Wind arrow */}
      <defs>
        <marker id={`${uid}h`} markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z" fill={wCol}/>
        </marker>
      </defs>
      <line x1={wx1} y1={wy1} x2={wx2} y2={wy2}
        stroke={wCol} strokeWidth="2.5" strokeLinecap="round"
        markerEnd={`url(#${uid}h)`}/>

      {/* Home plate dot */}
      <circle cx={hp.x} cy={hp.y} r="3" fill="rgba(255,255,255,.6)"/>
    </svg>
  );
}

// Simple arrow for hourly strip (smaller, no field)
function WindArrow({ deg, size=36 }) {
  const cx=size/2, cy=size/2, r=size/2-3;
  const toward = (deg+180)%360;
  const rad = (toward-90)*Math.PI/180;
  const x2=cx+r*0.8*Math.cos(rad), y2=cy+r*0.8*Math.sin(rad);
  const x1=cx-r*0.4*Math.cos(rad), y1=cy-r*0.4*Math.sin(rad);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{display:'block',margin:'0 auto'}}>
      <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.1)" strokeWidth="1"/>
      <defs>
        <marker id={`ah${deg}`} markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="rgba(245,166,35,.8)"/>
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="rgba(245,166,35,.8)" strokeWidth="1.5"
        markerEnd={`url(#ah${deg})`}/>
    </svg>
  );
}

// Park factor HR color
function pfColor(hr) {
  return hr>=115?'#ff4020':hr>=108?'#ff8020':hr>=103?'#ffc840':hr>=97?'var(--text)':'#38b8f2';
}

function WeatherGameCard({ g, wd }) {
  const [open, setOpen] = useState(false);
  if (!wd) return null;

  const gameHour = parseGameHour(g.gameTime);

  // Pick game-time hourly slot — FRONTEND does this, no UTC issues
  const gtSlot  = gameHour!==null ? (wd.hourly||[]).find(h=>h.hour===gameHour) : null;
  const display = gtSlot || wd.current;

  if (!display && !wd.isDome) return null;

  // Build 5-hour strip from game time
  const strip = gameHour!==null
    ? (wd.hourly||[]).filter(h=>h.hour>=gameHour).slice(0,5)
    : (wd.hourly||[]).slice(0,5);

  const pfHR  = wd.parkFactorHR||100;
  const env   = display ? envScore(display.hrEnvScore||50) : null;

  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',
      borderRadius:12,overflow:'hidden',marginBottom:10}}>

      {/* Header row */}
      <div style={{padding:'12px 16px',display:'flex',alignItems:'center',
        gap:14,flexWrap:'wrap',cursor:wd.isDome?'default':'pointer',
        borderBottom:open?'1px solid var(--border)':'none'}}
        onClick={()=>!wd.isDome&&setOpen(o=>!o)}>

        {/* Matchup + time */}
        <div style={{minWidth:140,flexShrink:0}}>
          <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,
            fontSize:17,letterSpacing:.5,lineHeight:1}}>
            {g.away?.abbr||'?'}&nbsp;
            <span style={{color:'var(--muted)',fontSize:12,fontWeight:400}}>@</span>
            &nbsp;{g.home?.abbr||'?'}
          </div>
          <div style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace",marginTop:3}}>
            {normVenue(wd.stadium)}
          </div>
          <div style={{fontSize:10,color:'var(--accent2)',fontFamily:"'DM Mono',monospace",marginTop:1}}>
            {g.gameTime||'TBD'} ET
            {gtSlot
              ? <span style={{marginLeft:6,color:'#27c97a',fontWeight:700}}>⚾ game forecast</span>
              : display && !wd.isDome && <span style={{marginLeft:6,color:'#ff8020'}}>⚡ current</span>}
          </div>
        </div>

        {wd.isDome ? (
          <div style={{flex:1,display:'flex',alignItems:'center',gap:8,
            color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:12}}>
            🏟️ Retractable/Dome — weather N/A
          </div>
        ) : display && (<>

          {/* Temp */}
          <div style={{textAlign:'center',minWidth:54,flexShrink:0}}>
            <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:24,lineHeight:1,
              color:display.temp>=85?'#ff4020':display.temp>=75?'#ff8020':display.temp>=60?'var(--text)':'#38b8f2'}}>
              {display.temp}°
            </div>
            <div style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
              textTransform:'uppercase',letterSpacing:.5,marginTop:1}}>
              Feels {display.feelsLike}°
            </div>
          </div>

          {/* Stadium diagram + wind label */}
          <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0,flexWrap:'wrap'}}>
            <StadiumWindDiagram cfDir={wd.cfDir||0} windDeg={display.windDeg} windDir={display.windDir} size={68}/>
            <div>
              <div style={{marginBottom:5}}>
                {windBadge(display.windDir, display.windLabel)}
              </div>
              <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",lineHeight:1.6}}>
                from {display.windDirRaw} ({display.windDeg}°)<br/>
                <span style={{opacity:.6}}>CF faces {wd.cfDir}°</span>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div style={{textAlign:'center',minWidth:80,flexShrink:0}}>
            <div style={{fontSize:11,color:'var(--text)',fontFamily:"'DM Mono',monospace",marginBottom:3}}>
              {display.condition}
            </div>
            <div style={{fontSize:10,color:'#38b8f2',fontFamily:"'DM Mono',monospace"}}>
              {(display.rainChance||0)>0 ? `🌧 ${display.rainChance}%` : ''}
            </div>
            <div style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>
              💧{display.humidity}%
            </div>
          </div>

          {/* HR Env */}
          <div style={{textAlign:'center',minWidth:60,flexShrink:0}}>
            <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,
              fontSize:22,color:env?.c,lineHeight:1}}>
              {display.hrEnvScore}
            </div>
            <div style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
              textTransform:'uppercase',letterSpacing:.5,marginTop:1}}>HR Env</div>
          </div>

          {/* Park factor */}
          <div style={{textAlign:'center',minWidth:44,flexShrink:0}}>
            <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,
              fontSize:22,color:pfColor(pfHR),lineHeight:1}}>
              {pfHR}
            </div>
            <div style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
              textTransform:'uppercase',letterSpacing:.5,marginTop:1}}>Park</div>
          </div>

          {/* Expand chevron */}
          {strip.length>0 && <div style={{
            fontSize:14,color:'var(--muted)',flexShrink:0,
            transform:open?'rotate(180deg)':'none',transition:'transform .2s'}}>▾</div>}
        </>)}
      </div>

      {/* Hourly strip */}
      {open && strip.length>0 && (
        <div style={{padding:'12px 16px',background:'rgba(0,0,0,.2)'}}>
          <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
            textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>
            Hourly Forecast — {gameHour!==null?`From ${fmtHour12(gameHour)} game time`:'Next 5 Hours'}
          </div>
          <div style={{display:'flex',gap:8,overflowX:'auto',
            WebkitOverflowScrolling:'touch',paddingBottom:6}}>
            {strip.map((h,hi)=>{
              const isGame = hi===0 && gameHour!==null;
              const bc = isGame?'rgba(232,65,26,.1)':'rgba(255,255,255,.03)';
              const brd= isGame?'rgba(232,65,26,.3)':'var(--border)';
              const ev = envScore(h.hrEnvScore||50);
              return (
                <div key={hi} style={{flexShrink:0,minWidth:86,borderRadius:10,
                  background:bc,border:`1px solid ${brd}`,padding:'10px 8px',textAlign:'center'}}>
                  <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",
                    color:isGame?'var(--accent)':'var(--muted)',
                    fontWeight:isGame?700:400,marginBottom:5}}>
                    {isGame?'⚾ Gametime':fmtHour12(h.hour)}
                  </div>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:20,
                    lineHeight:1,marginBottom:2,
                    color:h.temp>=85?'#ff4020':h.temp>=75?'#ff8020':h.temp>=60?'var(--text)':'#38b8f2'}}>
                    {h.temp}°
                  </div>
                  <div style={{marginBottom:4}}>
                    <WindArrow deg={h.windDeg} size={28}/>
                  </div>
                  <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",
                    color:WD_COLOR[h.windDir]||'var(--muted)',lineHeight:1.4,marginBottom:3}}>
                    {WD_EMOJI[h.windDir]||'🌤️'} {h.windLabel}
                  </div>
                  <div style={{fontSize:8,color:'var(--muted)',fontFamily:"'DM Mono',monospace",marginBottom:4}}>
                    from {h.windDirRaw}
                  </div>
                  {(h.rainChance||0)>0&&<div style={{fontSize:9,color:'#38b8f2',
                    fontFamily:"'DM Mono',monospace",marginBottom:3}}>
                    🌧 {h.rainChance}%
                  </div>}
                  <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",
                    color:ev.c,fontWeight:700}}>HR {h.hrEnvScore}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function WeatherTab() {
  const [games,   setGames]   = useState([]);
  const [weather, setWeather] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshed, setRefreshed] = useState(null);
  const [subTab, setSubTab]   = useState('weather');
  const [parksView, setParksView] = useState('today'); // 'today' | 'all'
  const [parkSort, setParkSort]   = useState({ col: 'hr', dir: 'desc' });
  const [todaySort, setTodaySort] = useState({ col: 'hrPct', dir: 'desc' });

  // Park factors: 3-year blend (2022-2024). Base 100 = neutral.
  // hr=HR factor, xbh=2B/3B factor, single=1B factor, runs=Runs factor
  // Note: HR and XBH are often inversely correlated (e.g. Fenway low HR, high 2B)
  const PARK_DATA = [
    { abbr:'AZ',  venue:'Chase Field',                hr:103, xbh:100, single:100, runs:101, cf:80,  notes:'Retractable roof · neutral dimensions' },
    { abbr:'ATL', venue:'Truist Park',                hr:102, xbh:101, single:100, runs:101, cf:120, notes:'Moderate hitter park' },
    { abbr:'BAL', venue:'Oriole Park at Camden Yards',hr:106, xbh:101, single:101, runs:103, cf:115, notes:'Short RF · slightly hitter-friendly' },
    { abbr:'BOS', venue:'Fenway Park',                hr:91,  xbh:121, single:106, runs:104, cf:115, notes:'Green Monster: low HR, very high 2B' },
    { abbr:'CHC', venue:'Wrigley Field',              hr:104, xbh:104, single:101, runs:102, cf:75,  notes:'Wind-dependent · elevated 2B in gaps' },
    { abbr:'CIN', venue:'Great American Ball Park',   hr:127, xbh:104, single:102, runs:110, cf:110, notes:'Most HR-friendly · warm humid air' },
    { abbr:'CLE', venue:'Progressive Field',          hr:85,  xbh:97,  single:97,  runs:94,  cf:120, notes:'Large outfield · pitcher-friendly all stats' },
    { abbr:'COL', venue:'Coors Field',                hr:125, xbh:114, single:113, runs:118, cf:105, notes:'Altitude boosts all hit types equally' },
    { abbr:'CWS', venue:'Guaranteed Rate Field',      hr:97,  xbh:100, single:99,  runs:98,  cf:115, notes:'Slightly pitcher-friendly' },
    { abbr:'DET', venue:'Comerica Park',              hr:92,  xbh:96,  single:97,  runs:95,  cf:115, notes:'Large CF gap · suppresses HRs and XBH' },
    { abbr:'HOU', venue:'Daikin Park',                hr:104, xbh:100, single:100, runs:101, cf:135, notes:'Retractable roof · neutral' },
    { abbr:'KC',  venue:'Kauffman Stadium',           hr:82,  xbh:96,  single:97,  runs:93,  cf:115, notes:'Large outfield · pitcher-friendly' },
    { abbr:'LAA', venue:'Angel Stadium',              hr:113, xbh:102, single:101, runs:105, cf:120, notes:'Hitter-friendly · marine layer variable' },
    { abbr:'LAD', venue:'Dodger Stadium',             hr:128, xbh:97,  single:98,  runs:108, cf:135, notes:'High HR · short fence = fewer doubles' },
    { abbr:'MIA', venue:'loanDepot park',             hr:90,  xbh:99,  single:99,  runs:95,  cf:100, notes:'Retractable roof · neutral to slight pitcher' },
    { abbr:'MIL', venue:'American Family Field',      hr:106, xbh:101, single:100, runs:102, cf:125, notes:'Retractable roof · hitter-friendly' },
    { abbr:'MIN', venue:'Target Field',               hr:106, xbh:101, single:101, runs:103, cf:115, notes:'Hitter-friendly · cold air early season' },
    { abbr:'NYM', venue:'Citi Field',                 hr:88,  xbh:101, single:101, runs:97,  cf:118, notes:'Spacious park · suppresses HRs' },
    { abbr:'NYY', venue:'Yankee Stadium',             hr:121, xbh:94,  single:98,  runs:107, cf:122, notes:'Short RF porch = HRs not doubles' },
    { abbr:'ATH', venue:'Sutter Health Park',         hr:95,  xbh:99,  single:100, runs:97,  cf:115, notes:'Temporary home 2025' },
    { abbr:'PHI', venue:'Citizens Bank Park',         hr:113, xbh:103, single:101, runs:106, cf:115, notes:'Hitter-friendly · humid summers' },
    { abbr:'PIT', venue:'PNC Park',                   hr:78,  xbh:95,  single:96,  runs:91,  cf:120, notes:'Most pitcher-friendly · large gaps' },
    { abbr:'SD',  venue:'Petco Park',                 hr:104, xbh:101, single:100, runs:101, cf:115, notes:'Marine layer · neutral to slight hitter' },
    { abbr:'SEA', venue:'T-Mobile Park',              hr:100, xbh:98,  single:99,  runs:98,  cf:120, notes:'Retractable roof · neutral' },
    { abbr:'SF',  venue:'Oracle Park',                hr:90,  xbh:97,  single:98,  runs:94,  cf:108, notes:'Bay winds + marine layer suppress all' },
    { abbr:'STL', venue:'Busch Stadium',              hr:89,  xbh:100, single:100, runs:96,  cf:115, notes:'Open air · slight pitcher-friendly' },
    { abbr:'TB',  venue:'Steinbrenner Field',         hr:98,  xbh:100, single:100, runs:99,  cf:115, notes:'Temporary home 2025' },
    { abbr:'TEX', venue:'Globe Life Field',           hr:102, xbh:100, single:100, runs:101, cf:115, notes:'Retractable roof · neutral' },
    { abbr:'TOR', venue:'Rogers Centre',              hr:103, xbh:101, single:100, runs:101, cf:105, notes:'Artificial turf · domed' },
    { abbr:'WSH', venue:'Nationals Park',             hr:95,  xbh:99,  single:100, runs:97,  cf:115, notes:'River winds variable · slight pitcher' },
  ];

  const sortedParks = [...PARK_DATA].sort((a,b) => {
    const av = a[parkSort.col], bv = b[parkSort.col];
    if (typeof av === 'number') return parkSort.dir==='desc' ? bv-av : av-bv;
    return parkSort.dir==='desc' ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
  });

  const handleParkSort = col => setParkSort(s =>
    s.col===col ? {col, dir: s.dir==='desc'?'asc':'desc'} : {col, dir: col==='abbr'||col==='venue'?'asc':'desc'}
  );

  const hrColor = v => v>=120?'#ff4020':v>=110?'#ff8020':v>=105?'#f5a623':v>=98?'var(--text)':v>=90?'var(--muted)':'#38b8f2';
  const hrLabel = v => v>=120?'🔥 Very Hot':v>=110?'🔶 Hot':v>=105?'🟡 Warm':v>=98?'⚪ Neutral':v>=90?'🔵 Cool':'❄️ Cold';

  const loadWeather = async (gamesList) => {
    if (!gamesList || gamesList.length===0) return;
    const wMap = {};
    await Promise.all(gamesList.map(async (g) => {
      const team = g.home?.abbr;
      if (!team || team==='???') return;
      try {
        const w = await fetchWeather(team);
        if (w) { wMap[team]=w; if(g.away?.abbr&&g.away.abbr!=='???') wMap[g.away.abbr]=w; }
      } catch(e) {}
    }));
    setWeather(wMap);
    setRefreshed(new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'}));
    setLoading(false);
  };

  const load = () => {
    setLoading(true); setGames([]); setWeather({});
    Object.keys(WEATHER_CACHE).forEach(k=>delete WEATHER_CACHE[k]);
    fetchGames(()=>{}, (gl)=>{
      const v=(gl||[]).filter(g=>g.home?.abbr&&g.home.abbr!=='???');
      setGames(v); loadWeather(v);
    }, ()=>{setLoading(false);});
  };

  useEffect(()=>{ load(); },[]);

  const out   = games.filter(g=>{const w=weather[g.home?.abbr]; return w&&!w.isDome&&(w.hourly||[]).find(h=>h.hour===parseGameHour(g.gameTime))?.windDir?.includes('out');}).length;
  const inp   = games.filter(g=>{const w=weather[g.home?.abbr]; return w&&!w.isDome&&(w.hourly||[]).find(h=>h.hour===parseGameHour(g.gameTime))?.windDir?.includes('in');}).length;
  const domes = games.filter(g=>weather[g.home?.abbr]?.isDome).length;
  const rain  = games.filter(g=>{const w=weather[g.home?.abbr]; const s=(w?.hourly||[]).find(h=>h.hour===parseGameHour(g.gameTime)); return (s?.rainChance||0)>=30;}).length;

  const stBtn = key => ({
    padding:'6px 14px', borderRadius:7, cursor:'pointer', border:'none',
    fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:12, letterSpacing:.8,
    textTransform:'uppercase',
    background: subTab===key ? 'var(--accent)' : 'var(--surface2)',
    color: subTab===key ? 'white' : 'var(--muted)',
    transition:'all .15s',
  });

  const SortTri = ({col}) => parkSort.col===col
    ? <span style={{marginLeft:3,fontSize:9}}>{parkSort.dir==='desc'?'▼':'▲'}</span> : null;

  return (
    <div>
      <div className="hrow" style={{marginBottom:12}}>
        {subTab==='weather' && <button onClick={load}
          style={{padding:'6px 14px',borderRadius:6,border:'1px solid var(--border)',
            background:'var(--surface2)',color:'var(--text)',cursor:'pointer',
            fontFamily:"'DM Mono',monospace",fontSize:11,flexShrink:0}}>
          ↻ Refresh
        </button>}
      </div>

      <div style={{display:'flex',gap:6,marginBottom:16,padding:'4px',background:'var(--surface)',borderRadius:9,border:'1px solid var(--border)',width:'fit-content'}}>
        <button style={stBtn('weather')} onClick={()=>setSubTab('weather')}>🌤️ Game Day</button>
        <button style={stBtn('parks')}   onClick={()=>setSubTab('parks')}>🏟️ Park Factors</button>
      </div>

      {subTab==='weather' && (loading
        ? <div className="lw"><div className="sp"/><div className="lt">Loading weather…</div></div>
        : games.length===0
        ? <div style={{padding:'60px 20px',textAlign:'center',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:13}}>No games today.</div>
        : <>
          <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
            {[
              {label:'💨 Blowing Out',count:out,  color:'#ff8020'},
              {label:'❄️ Blowing In', count:inp,  color:'#38b8f2'},
              {label:'🏟️ Domes',      count:domes,color:'var(--muted)'},
              {label:'🌧️ Rain Risk',  count:rain, color:'#60a0d0'},
            ].filter(s=>s.count>0).map(s=>(
              <div key={s.label} style={{padding:'5px 12px',borderRadius:8,background:'var(--surface)',border:`1px solid ${s.color}30`,fontFamily:"'DM Mono',monospace",fontSize:11,display:'flex',alignItems:'center',gap:6}}>
                <span style={{color:s.color,fontWeight:700,fontFamily:"'Oswald',sans-serif",fontSize:15}}>{s.count}</span>
                <span style={{color:'var(--muted)'}}>{s.label}</span>
              </div>
            ))}
          </div>
          <div style={{marginBottom:14,padding:'8px 14px',borderRadius:8,background:'rgba(56,184,242,.05)',border:'1px solid rgba(56,184,242,.15)',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>ℹ️ Game-time hourly forecast · tap any game to expand · wind direction relative to field</span>
            <a href="https://rotogrinders.com/weather/mlb" target="_blank" rel="noopener noreferrer"
              style={{fontSize:10,color:'var(--ice)',fontFamily:"'DM Mono',monospace",fontWeight:600,textDecoration:'none',flexShrink:0}}>RotoGrinders ↗</a>
            <a href="https://www.ballparkpal.com/Park-Factors.php" target="_blank" rel="noopener noreferrer"
              style={{fontSize:10,color:'#27c97a',fontFamily:"'DM Mono',monospace",fontWeight:600,textDecoration:'none',flexShrink:0}}>BallparkPal ↗</a>
          </div>
          {games.map(g=>(
            <WeatherGameCard key={g.gamePk||g.id} g={g} wd={weather[g.home?.abbr]}/>
          ))}
        </>)}

      {subTab==='parks' && (
        <div>
          {/* Parks sub-nav: Today's Impact | All Parks */}
          <div style={{display:'flex',gap:6,marginBottom:14}}>
            {[{key:'today',label:"📅 Today's Impact"},{key:'all',label:'🏟️ All Parks'}].map(({key,label})=>(
              <button key={key} onClick={()=>setParksView(key)}
                style={{padding:'5px 14px',borderRadius:7,cursor:'pointer',border:'none',
                  fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:parksView===key?700:400,
                  background:parksView===key?'rgba(245,166,35,.15)':'var(--surface2)',
                  color:parksView===key?'var(--accent2)':'var(--muted)'}}>
                {label}
              </button>
            ))}
            <a href="https://www.ballparkpal.com/Park-Factors.php" target="_blank" rel="noopener noreferrer"
              style={{marginLeft:'auto',fontSize:10,color:'#27c97a',fontFamily:"'DM Mono',monospace",
                fontWeight:600,textDecoration:'none',alignSelf:'center',flexShrink:0}}>
              Full BallparkPal Data ↗
            </a>
          </div>

          {/* ── TODAY'S IMPACT ── */}
          {parksView==='today' && (loading
            ? <div className="lw"><div className="sp"/><div className="lt">Loading game data…</div></div>
            : games.length===0
            ? <div style={{padding:'40px 20px',textAlign:'center',color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:12}}>No games today.</div>
            : (() => {
                // Weather alert: outdoor + game-time rain chance >= 40% + rain keyword in condition
                const RAIN_WORDS = /rain|drizzle|shower|storm|thunder|precipitation/i;
                const isWeatherAlert = (slot, isDome) => {
                  if (isDome) return false;
                  const rc = slot?.rainChance || 0;
                  const cond = slot?.condition || '';
                  return rc >= 40 && RAIN_WORDS.test(cond);
                };

                const todayRows = games.map(g => {
                  const wd = weather[g.home?.abbr];
                  if (!wd) return null;
                  const gameHour = parseGameHour(g.gameTime);
                  const slot = gameHour!=null ? (wd.hourly||[]).find(h=>h.hour===gameHour) : null;
                  const cur  = slot || wd.current;
                  const park = PARK_DATA.find(p=>p.abbr===g.home?.abbr);
                  const basePF = park?.hr || 100;
                  const combinedHR = wd.parkFactorHR || basePF;
                  const hrPct   = Math.round(combinedHR - 100);
                  // Wind-only component (weather adjustment above base park)
                  const windAdj = combinedHR - basePF;
                  // Temperature: neutral at 72°F, ±1% per 5°F
                  const temp    = cur?.temp || 72;
                  const tempAdj = (temp - 72) / 5 * 0.8;

                  // Real park baselines for XBH, 1B, Runs — then add wind/temp on top
                  // Wind moves XBH at ~50% the rate of HRs; barely moves singles
                  const xbhPct  = Math.round((park?.xbh  ||100) - 100 + windAdj * 0.50 + tempAdj * 0.4);
                  const singPct = Math.round((park?.single||100) - 100 + windAdj * 0.15 + tempAdj * 0.6);
                  const runPct  = Math.round((park?.runs  ||100) - 100 + windAdj * 0.30 + tempAdj * 0.5);
                  const windDir   = cur?.windDir   || (wd.isDome ? 'calm' : 'calm');
                  const windLabel = cur?.windLabel || (wd.isDome ? 'Dome' : '—');
                  const weatherAlert = isWeatherAlert(cur, wd.isDome);
                  // Populate global set for use across all tabs
                  const gid = String(g.gamePk||g.id);
                  if (weatherAlert) WEATHER_ALERT_GAME_IDS.add(gid);
                  else WEATHER_ALERT_GAME_IDS.delete(gid);
                  return {
                    gameId: gid,
                    away: g.away?.abbr||'', home: g.home?.abbr||'',
                    venue: normVenue(wd.stadium||park?.venue||g.home?.abbr),
                    gameTime: g.gameTime,
                    isDome: wd.isDome,
                    hrPct, xbhPct, singPct, runPct,
                    windDir, windLabel, temp,
                    rainChance: cur?.rainChance||0,
                    weatherAlert,
                    condition: cur?.condition||'',
                  };
                }).filter(Boolean);

                // Sort today rows
                const tSorted = [...todayRows].sort((a,b) => {
                  const v = todaySort.col;
                  const av = a[v]??0, bv = b[v]??0;
                  return todaySort.dir==='desc' ? bv-av : av-bv;
                });

                const pctCell = (v) => {
                  const col = v>12?'#ff4020':v>5?'#ff8020':v>0?'#f5a623':v<-12?'#38b8f2':v<-5?'#60a0d0':v<0?'var(--muted)':'var(--muted)';
                  return <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,color:col}}>
                    {v>0?'+':''}{v}%
                  </span>;
                };

                const TH = ({col,label,color}) => {
                  const active = todaySort.col===col;
                  return <th onClick={()=>setTodaySort(s=>s.col===col?{col,dir:s.dir==='desc'?'asc':'desc'}:{col,dir:'desc'})}
                    style={{textAlign:'center',cursor:'pointer',userSelect:'none',whiteSpace:'nowrap',
                      color:active?'var(--accent)':(color||'var(--muted)')}}>
                    {label}{active?<span style={{marginLeft:3,fontSize:9}}>{todaySort.dir==='desc'?'▼':'▲'}</span>:null}
                  </th>;
                };

                return (
                  <div>
                    <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",marginBottom:8}}>
                      Combined park + weather · vs average park/conditions · ⚠️ = weather may impact game · click stat headers to sort
                    </div>
                    <div className="tw">
                      <table>
                        <thead>
                          <tr>
                            <th style={{textAlign:'left'}}>Game</th>
                            <th style={{textAlign:'center',cursor:'default',color:'var(--muted)'}}>Wind</th>
                            <th style={{textAlign:'center',cursor:'default',color:'var(--muted)'}}>Temp</th>
                            <TH col="hrPct"   label="HR"   color="#ff8020"/>
                            <TH col="xbhPct"  label="2B/3B" color="#f5a623"/>
                            <TH col="singPct" label="1B"   color="var(--text)"/>
                            <TH col="runPct"  label="Runs" color="#27c97a"/>
                          </tr>
                        </thead>
                        <tbody>
                          {tSorted.map(r=>(
                            <tr key={r.gameId}
                              style={{
                                background: r.weatherAlert ? 'rgba(168,85,247,.12)' : undefined,
                                borderLeft: r.weatherAlert ? '3px solid #a855f7' : '3px solid transparent',
                              }}>
                              <td style={{textAlign:'left',minWidth:0}}>
                                <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,color:'var(--text)',display:'flex',alignItems:'center',gap:5}}>
                                  {r.away} @ {r.home}
                                  {r.weatherAlert && <span title="Weather may impact game — use caution" style={{fontSize:11}}>⚠️</span>}
                                </div>
                                <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",marginTop:1}}>
                                  {r.venue}{r.gameTime ? ` · ${r.gameTime}` : ''}
                                </div>
                              </td>
                              <td style={{textAlign:'center'}}>
                                {r.isDome
                                  ? <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>🏟️ Dome</span>
                                  : <span style={{fontSize:10,color:WD_COLOR[r.windDir]||'var(--muted)',fontFamily:"'DM Mono',monospace",fontWeight:700}}>
                                      {WD_EMOJI[r.windDir]||'—'} {r.windLabel}
                                    </span>}
                              </td>
                              <td style={{textAlign:'center'}}>
                                <span style={{fontSize:11,fontFamily:"'DM Mono',monospace",
                                  color:r.temp>=85?'#ff4020':r.temp>=75?'#ff8020':r.temp>=60?'var(--text)':'#38b8f2'}}>
                                  {Math.round(r.temp)}°
                                </span>
                              </td>
                              <td style={{textAlign:'center'}}>{pctCell(r.hrPct)}</td>
                              <td style={{textAlign:'center'}}>{pctCell(r.xbhPct)}</td>
                              <td style={{textAlign:'center'}}>{pctCell(r.singPct)}</td>
                              <td style={{textAlign:'center'}}>{pctCell(r.runPct)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()
          )}

          {/* ── ALL PARKS (static table) ── */}
          {parksView==='all' && (
            <>
              <div style={{marginBottom:10,padding:'6px 12px',borderRadius:7,background:'rgba(255,128,32,.05)',border:'1px solid rgba(255,128,32,.15)',fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>
                ℹ️ Season base HR factors · 100 = neutral · click headers to sort
              </div>
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      {[{l:'Team',col:'abbr'},{l:'Venue',col:'venue'},{l:'HR',col:'hr'},{l:'2B/3B',col:'xbh'},{l:'1B',col:'single'},{l:'Runs',col:'runs'},{l:'CF°',col:'cf'},{l:'Notes',col:null}].map(({l,col})=>(
                        <th key={l} onClick={()=>col&&handleParkSort(col)}
                          style={{textAlign:l==='Venue'||l==='Notes'?'left':'center',cursor:col?'pointer':'default',
                            color:parkSort.col===col?'var(--accent)':'var(--muted)',whiteSpace:'nowrap',userSelect:'none'}}>
                          {l}<SortTri col={col}/>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedParks.map(p=>(
                      <tr key={p.abbr} className="dr">
                        <td style={{textAlign:'center'}}><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,color:'var(--accent2)'}}>{p.abbr}</span></td>
                        <td style={{textAlign:'left'}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{p.venue}</span></td>
                        <td style={{textAlign:'center'}}><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,color:hrColor(p.hr)}}>{p.hr}</span></td>
                        <td style={{textAlign:'center'}}><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,color:hrColor(p.xbh)}}>{p.xbh}</span></td>
                        <td style={{textAlign:'center'}}><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,color:hrColor(p.single)}}>{p.single}</span></td>
                        <td style={{textAlign:'center'}}><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,color:hrColor(p.runs)}}>{p.runs}</span></td>
                        <td style={{textAlign:'center'}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'var(--muted)'}}>{p.cf}°</span></td>
                        <td style={{textAlign:'left'}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)'}}>{p.notes}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{marginTop:14,display:'flex',gap:8,flexWrap:'wrap'}}>
                {[{l:'🔥 Very Hot',r:'≥120',c:'#ff4020'},{l:'🔶 Hot',r:'110–119',c:'#ff8020'},{l:'🟡 Warm',r:'105–109',c:'#f5a623'},{l:'⚪ Neutral',r:'98–104',c:'var(--text)'},{l:'🔵 Cool',r:'90–97',c:'var(--muted)'},{l:'❄️ Cold',r:'<90',c:'#38b8f2'}].map(x=>(
                  <div key={x.l} style={{padding:'3px 10px',borderRadius:6,fontSize:9,background:'var(--surface)',border:`1px solid ${x.c}30`,fontFamily:"'DM Mono',monospace",color:x.c,whiteSpace:'nowrap'}}>
                    {x.l} <span style={{color:'rgba(255,255,255,.55)'}}>{x.r}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}


let _hrLog = [];
let _setHrLog = null;   // bell log setter — owned exclusively by useHRLog
let _setQueue = null;   // banner queue setter — owned exclusively by useHRNotifications

// Shared AudioContext — created once, resumed on first user gesture
let _audioCtx = null;
const getAudioCtx = () => {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return _audioCtx;
};
// Prime the audio context on any user interaction so autoplay policy is satisfied
if (typeof window !== 'undefined') {
  const primeAudio = () => { const ctx = getAudioCtx(); if (ctx?.state === 'suspended') ctx.resume(); };
  ['click','touchstart','keydown'].forEach(e => window.addEventListener(e, primeAudio, {once:false, passive:true}));
}
function playHRSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const play = () => {
      const now = ctx.currentTime;
      // Bat crack — sharp sawtooth transient
      const crack = ctx.createOscillator();
      const crackGain = ctx.createGain();
      crack.connect(crackGain); crackGain.connect(ctx.destination);
      crack.type = 'sawtooth';
      crack.frequency.setValueAtTime(900, now);
      crack.frequency.exponentialRampToValueAtTime(80, now + 0.09);
      crackGain.gain.setValueAtTime(0.4, now);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      crack.start(now); crack.stop(now + 0.13);
      // Crowd roar — bandpass noise swell
      const bufSize = ctx.sampleRate * 1.5;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let k = 0; k < bufSize; k++) data[k] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 450; filter.Q.value = 0.6;
      const noiseGain = ctx.createGain();
      noise.connect(filter); filter.connect(noiseGain); noiseGain.connect(ctx.destination);
      noiseGain.gain.setValueAtTime(0, now + 0.06);
      noiseGain.gain.linearRampToValueAtTime(0.20, now + 0.35);
      noiseGain.gain.linearRampToValueAtTime(0.25, now + 0.7);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      noise.start(now + 0.06); noise.stop(now + 1.5);
    };
    if (ctx.state === 'suspended') ctx.resume().then(play);
    else play();
  } catch(e) { /* silent fallback */ }
}

function useHRNotifications() {
  const [queue, setQueue] = useState([]);
  useEffect(() => {
    _setQueue = setQueue;
    _setNotifLog = (log) => { _notifLog = log; if (_setHrLog) _setHrLog(log); };
    // Wire up the global notifier — persist across remounts, only replace not null
    _notifyNewHR = (hr) => {
      const notif = {
        id: Date.now() + Math.random(),
        notifType:  'hr',
        batterName: hr.batterName || 'Unknown',
        batterTeam: hr.batterTeam || '',
        batterId:   hr.batterId   || null,
        type:       hr.hrType     || 'Solo',
        rbi:        hr.rbi        || 0,
        exitVelo:   hr.exitVelo   || 0,
        distance:   hr.distance   || 0,
        inning:     hr.inning     || '',
        halfInning: hr.halfInning || 'top',
        time: new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'}),
      };
      if (_setQueue) _setQueue(q => [...q.slice(-2), notif]);
      _notifLog = [notif, ..._notifLog].slice(0, 50);
      if (_setNotifLog) _setNotifLog([..._notifLog]);
      playHRSound();
      // Send live push — dedup key = gamePk+batterId+atBatIndex, unique per HR event
      const hrDedupKey = `hr-${hr.gamePk}-${hr.batterId}-${hr.atBatIndex}`;
      const hrLabel = notif.type === 'Grand Slam' ? 'GRAND SLAM' : notif.type + ' HR';
      sendLivePush(`💥 ${hrLabel} — ${notif.batterName}`,
        `${notif.batterTeam} · ${notif.exitVelo > 0 ? notif.exitVelo.toFixed(0)+'mph' : ''} ${notif.distance > 0 ? notif.distance+'ft' : ''}`.trim(),
        hrDedupKey);
      // On Fire detection — same batter hits 2nd HR in same game
      if (hr.gamePk && hr.batterId) {
        const key = `${hr.gamePk}_${hr.batterId}`;
        GAME_HR_MAP[key] = (GAME_HR_MAP[key] || 0) + 1;
        if (GAME_HR_MAP[key] === 2 && _setQueue) {
          const fireNotif = { id: Date.now()+Math.random(), notifType:'onFire',
            batterName: hr.batterName||'Unknown', batterTeam: hr.batterTeam||'',
            batterId: hr.batterId, subtitle: `${GAME_HR_MAP[key]} HRs this game!`,
            time: notif.time };
          _setQueue(q => [...q.slice(-2), fireNotif]);
          _notifLog = [fireNotif, ..._notifLog].slice(0, 50);
          if (_setNotifLog) _setNotifLog([..._notifLog]);
          sendLivePush(`🔥 ON FIRE — ${hr.batterName}`,
            `${GAME_HR_MAP[key]} home runs this game! ${hr.batterTeam}`);
        }
      }
    };
    return () => { _setQueue = null; }; // keep _notifyNewHR alive — avoids missed HRs during remounts
  }, []);
  const dismiss = (id) => setQueue(q => q.filter(n => n.id !== id));
  return { queue, dismiss };
}

// Bell-only hook — reads log, never touches _notifyNewHR or queue
function useHRLog() {
  const [log, setLog] = useState(_hrLog);
  useEffect(() => {
    _setHrLog = setLog;
    return () => { _setHrLog = null; };
  }, []);
  const clearLog = () => { _hrLog = []; setLog([]); };
  return { log, clearLog };
}

function HRNotificationBanner({ notif, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [touching, setTouching] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);

  // ALL hooks must be before any early returns (React rules)
  useEffect(() => {
    const tin  = setTimeout(() => setVisible(true), 10);
    const tout = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 400); }, 30000);
    return () => { clearTimeout(tin); clearTimeout(tout); };
  }, []);

  const handleTouchStart = (e) => { startY.current = e.touches[0].clientY; setTouching(true); };
  const handleTouchMove  = (e) => { const dy = e.touches[0].clientY - startY.current; if (dy < 0) setDragY(dy); };
  const handleTouchEnd   = () => { setTouching(false); if (dragY < -40) { setVisible(false); setTimeout(onDismiss, 300); } else setDragY(0); };

  const wrapStyle = {
    position:'fixed', top:0, left:0, right:0, zIndex:9999,
    display:'flex', justifyContent:'center', pointerEvents:'auto',
    transform: visible ? `translateY(${dragY}px)` : 'translateY(-110%)',
    transition: touching ? 'none' : 'transform 0.35s cubic-bezier(.34,1.56,.64,1)',
  };
  const handleClick = (targetTab, targetLiveView) => {
    setVisible(false);
    setTimeout(onDismiss, 300);
    if (targetTab) navTo(targetTab, targetLiveView);
  };
  const touchProps = { onTouchStart:handleTouchStart, onTouchMove:handleTouchMove, onTouchEnd:handleTouchEnd,
    onClick:() => handleClick() }; // default: just dismiss

  // ── Non-HR types ────────────────────────────────────────────────────────
  if (notif.notifType === 'onFire') {
    const t = { icon:'🔥', color:'#fb923c', bg:'rgba(251,146,60,.18)', label:'ON FIRE' };
    const tp = {...touchProps, onClick:()=>handleClick('live','gameday')};
    return (
      <div {...tp} style={{...wrapStyle,cursor:'pointer'}}>
        <div style={{margin:'12px 16px 0',maxWidth:480,width:'100%',background:'rgba(10,15,20,.96)',
          border:`1px solid ${t.color}44`,borderRadius:14,padding:'12px 16px',
          display:'flex',alignItems:'center',gap:12,backdropFilter:'blur(16px)'}}>
          <div style={{width:44,height:44,borderRadius:10,flexShrink:0,background:t.bg,
            border:`1px solid ${t.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{t.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:11,
              color:t.color,letterSpacing:1,textTransform:'uppercase',marginBottom:2}}>{t.label}</div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:15,color:'var(--text)'}}>{notif.batterName}</div>
            <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",marginTop:2}}>{notif.batterTeam} · {notif.subtitle}</div>
          </div>
          <div style={{fontSize:16,color:'var(--muted)',flexShrink:0,padding:'4px 8px',cursor:'pointer'}}>×</div>
        </div>
      </div>
    );
  }

  if (notif.notifType === 'lineup') {
    const t = { icon:'📋', color:'#38b8f2', bg:'rgba(56,184,242,.15)', label:'LINEUPS' };
    const tp = {...touchProps, onClick:()=>handleClick('live','lineups')};
    return (
      <div {...tp} style={{...wrapStyle,cursor:'pointer'}}>
        <div style={{margin:'12px 16px 0',maxWidth:480,width:'100%',background:'rgba(10,15,20,.96)',
          border:`1px solid ${t.color}44`,borderRadius:14,padding:'12px 16px',
          display:'flex',alignItems:'center',gap:12,backdropFilter:'blur(16px)'}}>
          <div style={{width:44,height:44,borderRadius:10,flexShrink:0,background:t.bg,
            border:`1px solid ${t.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{t.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:11,
              color:t.color,letterSpacing:1,textTransform:'uppercase',marginBottom:2}}>{t.label}</div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,color:'var(--text)'}}>{notif.title}</div>
            <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",marginTop:2}}>{notif.subtitle}</div>
          </div>
          <div style={{fontSize:16,color:'var(--muted)',flexShrink:0,padding:'4px 8px',cursor:'pointer'}}>×</div>
        </div>
      </div>
    );
  }

  // Default: HR notification
  const typeMap = {
    'Grand Slam': { icon:'💥', label:'GRAND SLAM', color:'#ff4020', bg:'rgba(232,65,26,.22)' },
    '3-Run':      { icon:'💥', label:'3-RUN HR',   color:'#ff4020', bg:'rgba(232,65,26,.18)' },
    '2-Run':      { icon:'💥', label:'2-RUN HR',   color:'#ff8020', bg:'rgba(255,128,32,.16)' },
    'Solo':       { icon:'💥', label:'SOLO HR',    color:'#ffc840', bg:'rgba(255,200,64,.14)' },
  };
  const t = typeMap[notif.type] || typeMap['Solo'];

  const hrTouchProps = {...touchProps, onClick:()=>handleClick('live','gameday')};
  return (
    <div {...hrTouchProps} style={{...wrapStyle,cursor:'pointer'}}>
      <div style={{
        margin:'12px 16px 0',
        maxWidth:480, width:'100%',
        background:'rgba(10,15,20,.96)',
        border:`1px solid ${t.color}44`,
        borderRadius:14,
        boxShadow:`0 8px 32px rgba(0,0,0,.6), 0 0 0 1px ${t.color}22`,
        padding:'12px 16px',
        display:'flex', alignItems:'center', gap:12,
        backdropFilter:'blur(16px)',
        WebkitBackdropFilter:'blur(16px)',
      }}>
        {/* Icon */}
        <div style={{
          width:44, height:44, borderRadius:10, flexShrink:0,
          background:t.bg, border:`1px solid ${t.color}44`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:22,
        }}>{t.icon}</div>

        {/* Content */}
        <div style={{flex:1, minWidth:0}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:2}}>
            <span style={{
              fontFamily:"'Oswald',sans-serif", fontWeight:800, fontSize:11,
              color:t.color, letterSpacing:1, textTransform:'uppercase',
            }}>{t.label}</span>
            {notif.rbi > 0 && <span style={{
              fontSize:9, padding:'1px 5px', borderRadius:4,
              background:'rgba(255,255,255,.08)',
              fontFamily:"'DM Mono',monospace", color:'var(--muted)',
            }}>{notif.rbi} RBI</span>}
            <span style={{
              marginLeft:'auto', fontSize:9,
              fontFamily:"'DM Mono',monospace", color:'var(--muted)',
            }}>{notif.halfInning==='top'?'▲':'▼'}{notif.inning}</span>
          </div>
          <div style={{
            fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:15,
            color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>{notif.batterName}</div>
          <div style={{display:'flex', gap:8, marginTop:3, flexWrap:'wrap'}}>
            <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>
              {notif.batterTeam} · {notif.gameId}
            </span>
            {notif.exitVelo > 0 && <span style={{
              fontSize:9, fontFamily:"'DM Mono',monospace",
              color:notif.exitVelo>=103?'#ff4020':notif.exitVelo>=95?'#ff8020':'var(--muted)',
            }}>⚡{notif.exitVelo.toFixed(1)} mph</span>}
            {notif.distance > 0 && <span style={{
              fontSize:9, fontFamily:"'DM Mono',monospace", color:'var(--muted)',
            }}>📏{notif.distance}ft</span>}
          </div>
        </div>

        {/* Dismiss */}
        <div style={{
          display:'flex',flexDirection:'column',alignItems:'center',gap:2,
          fontSize:16, color:'var(--muted)', flexShrink:0,
          padding:'4px 8px', cursor:'pointer',
        }}>
          <span>×</span>
          <span style={{fontSize:7,fontFamily:"'DM Mono',monospace",color:'var(--muted)',letterSpacing:.5}}>SWIPE</span>
        </div>
      </div>
    </div>
  );
}

function HRNotifications() {
  const { queue, dismiss } = useHRNotifications();
  if (queue.length === 0) return null;
  return (
    <div style={{position:'fixed',top:0,left:0,right:0,zIndex:9999,pointerEvents:'none'}}>
      {queue.map((n,i) => (
        <div key={n.id} style={{
          transform:`translateY(${i*8}px) scale(${1-i*0.03})`,
          pointerEvents:'auto',
          zIndex:9999-i,
          position: i===0?'relative':'absolute',
          top:0,left:0,right:0,
        }}>
          <HRNotificationBanner notif={n} onDismiss={()=>dismiss(n.id)}/>
        </div>
      ))}
    </div>
  );
}


function NotificationBell() {
  const { log, clearLog } = useHRLog(); // now includes all notif types
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = log.length;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const typeMap = {
    'Grand Slam': { icon:'💥', label:'GRAND SLAM', color:'#ff4020' },
    '3-Run':      { icon:'💥', label:'3-Run HR',   color:'#ff4020' },
    '2-Run':      { icon:'💥', label:'2-Run HR',   color:'#ff8020' },
    'Solo':       { icon:'💥', label:'Solo HR',    color:'#ffc840' },
  };
  const notifTypeMap = {
    onFire:  { icon:'🔥', label:'On Fire',           color:'#fb923c' },
    lineup:  { icon:'📋', label:'Lineup Confirmed',  color:'#38b8f2' },
    hr:      { icon:'💥', label:'Gone Yard',         color:'#ff4020' },
  };

  return (
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{position:'relative',padding:'5px 10px',borderRadius:6,
          border:'1px solid var(--border)',background:'var(--surface2)',
          cursor:'pointer',display:'flex',alignItems:'center',gap:5,
          color:unread>0?'var(--accent2)':'var(--muted)'}}>
        <span style={{fontSize:12}}>🚨</span>
        {unread > 0 && (
          <span style={{position:'absolute',top:-4,right:-4,
            background:'#ff4020',color:'white',borderRadius:'50%',
            width:15,height:15,fontSize:9,fontWeight:700,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontFamily:"'DM Mono',monospace"}}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{position:'fixed',top:52,right:8,width:300,zIndex:9998,
          background:'#0d1318',border:'1px solid var(--border)',borderRadius:10,
          boxShadow:'0 8px 32px rgba(0,0,0,.8)',overflow:'hidden'}}>
          <div style={{padding:'8px 12px',borderBottom:'1px solid var(--border)',
            display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
              fontSize:12,letterSpacing:.5,color:'var(--text)'}}>
              LIVE ALERTS
            </span>
            {log.length > 0 && (
              <button onClick={clearLog}
                style={{fontSize:9,color:'var(--muted)',background:'none',
                  border:'none',cursor:'pointer',fontFamily:"'DM Mono',monospace"}}>
                Clear
              </button>
            )}
          </div>
          {log.length === 0 ? (
            <div style={{padding:'20px 12px',textAlign:'center',
              color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:11}}>
              No alerts yet today
            </div>
          ) : (
            <div style={{maxHeight:320,overflowY:'auto'}}>
              {log.map((n,i) => {
                const t = n.notifType && n.notifType !== 'hr'
                  ? (notifTypeMap[n.notifType] || { icon:'🔔', label:'Alert', color:'var(--muted)' })
                  : (typeMap[n.type] || typeMap['Solo']);
                return (
                  <div key={n.id} style={{padding:'8px 12px',
                    borderBottom:'1px solid rgba(255,255,255,.05)',
                    display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:16,flexShrink:0}}>{t.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
                        fontSize:12,color:'var(--text)',
                        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        {n.notifType==='lineup' ? n.title : n.notifType==='onFire' ? n.batterName+' 🔥' : n.batterName}
                        <span style={{color:t.color,marginLeft:5,fontSize:10}}>{t.label}</span>
                      </div>
                      <div style={{fontSize:9,color:'var(--muted)',
                        fontFamily:"'DM Mono',monospace",marginTop:1}}>
                        {n.batterTeam} · Inn {n.inning} · {n.time}
                        {n.exitVelo > 0 && <span> · {n.exitVelo}mph</span>}
                        {n.distance > 0 && <span> · {n.distance}ft</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function LegendButton() {
  const [open, setOpen] = useState(false);
  const tabs = [
    { tab:'📡 Live',          items:['⚡ At Bat — current batter','👀 On Deck','⛳ In the Hole','✅ Lineup confirmed','💫 Liftoff — high HR probability','📋 Lineups sub-tab','📺 Gameday sub-tab'] },
    { tab:'⚡ Key Matchups',  items:['💥 Gone Yard today','💎 Diamond — Tier 1 Lock pick','⏳ Due — AB count since last HR exceeds normal rate','🔥 Hot Bat — 3+ HRs last 7 days','🤕 Injured / IL','🟢 Disciplined — low chase rate, high BB%','🔴 Chase Risk — chasing pitches, fade signal'] },
    { tab:'🧠 Sim Lab',       items:['⚡ The Sauce — tap for the full HR model cheat sheet','💥 Gone Yard filter','💎 Diamond filter','⏳ Due filter','🔥 Hot Bat filter','🤕 Injured filter','📊 Grade filters A+/A/B/C/D'] },
    { tab:'Grades',           items:['A+ = 6–8 flags · highest HR rate','A  = 4–5 flags','B  = 2–3 flags','C  = 1 flag','D  = 0 flags','🔒 Tier 1: A+ + Target/Hittable + SimTB ≥ 2.0','Grade hidden for injured/IL players'] },
    { tab:'Pitcher Grades',   items:['🎯 Target — softest matchup, highest batter HR rate','💥 Hittable — green light','🤔 Average — play carefully','⚠️ Tough — fade unless A+ batter','‼️ Elite — avoid, especially on Fridays'] },
    { tab:'Weather',          items:['✅ Wind Out — boosts HR','⚠️ Wind In — suppresses HR','🌡️ 70–75°F = peak HR temp (+9.2% lift)','❄️ Below 65°F = hard fade','☀️ Sunny/Clear = favorable','🌧️ Rain Risk = watch for postponements'] },
    { tab:'Discipline',       items:['🟢 Disciplined: Chase K% < 8%, BB% > 8%','🟡 Watch: Chase K% 12–20% or behind in counts > 50%','🔴 Chase Risk: Chase K% > 20% — engine fades this batter −0.20','Score: 0–100, higher = more patient plate approach'] },
    { tab:'🏷️ Form Class',    items:[
      '🌙 Moonshot Mafia — 2+ HRs in L7 with elevation (FB%≥30, LA≥18°, or Barrel≥5%). Also fires on 1 HR + LA≥22° + EV≥97 + pull power. Best HR target.',
      '🥶 Cold Bat — Weak contact pattern: 2+ of EV<87, HH%<27, bat speed<69. Or EV<84 alone. Fade regardless of Sig score.',
      '💨 Whiff King — K%≥33%, or K%≥27 with weak hard-hit rate. High strikeout risk suppresses expected bases.',
      '🪱 Worm Burner — GB%≥55%, or GB%≥48 with flat angle (LA<8°). Ball stays on the ground — not going yard.',
      '🎯 Gap Sniper — XBH rate≥8% at gap angle (LA 10–22°), or XBH≥10% overall. Great for total bases, not HRs.',
      '🎩 Contact King — K%≤14 + HH%≥36 + EV≥92, or hit rate≥.32 + low K + not groundball-heavy. Consistent contact, low HR ceiling.',
      'No badge — insufficient L7 data (<3 PA) or no category triggered.',
      'Visible as own column in: All Matchups · Sim Lab Slate · Long Shot tables.'
    ] },
    { tab:'📐 Contact Quality', items:[
      'xwOBA (Expected Weighted On-Base Average) — luck-neutral contact quality. Built from our EV×LA matrix calibrated on 430k PAs. Red ≥.380 · Orange ≥.320.',
      'wOBA — actual weighted on-base average using linear weights. Red ≥.370 · Orange ≥.310. Higher than xwOBA = getting lucky. Lower = getting unlucky.',
      'SwStr% — swinging strike rate. Red ≥20% (fade, contact risk) · Orange 14–20% (watch) · Green <14% (disciplined hitter). Feeds the Whiff King Form Class.',
      'ISO (Isolated Power) — (Total Bases − Hits) / AB. Season-long power profile from MLB Stats API. Red ≥.300 · Orange ≥.250 · Amber ≥.180.',
      'Zone Fit — pitcher meatball rate × batter HR rate in meatball zone. Measures spatial pitch-location matchup. Red ≥8% · Orange ≥5% · Green ≥2%.',
      'All five feed into 💥 Boom Score alongside Sig, Sim TB, and Engine Score.',
    ] },
    { tab:'🎯 Scores',          items:[
      '⚡ Sig Score (0–14) — HR signal stack. Every flag adds points: exit velocity, launch angle, barrel quality, pitcher grade, park, weather, platoon, lineup slot. Most directly validated score — built from 430k PAs. Red ≥10 · Orange ≥7 · Green ≥4.',
      '💥 Boom Score (0–99) — weighted composite of five independent axes: Sig + Zone Fit + ISO + Sim TB + Engine Score. No single axis dominates. Tells you when multiple systems agree. Red ≥70 · Orange ≥50 · Green ≥30.',
      'gHR (0–99) — HR probability index. Combines Sig, Zone Fit, ISO, HR Intent, and xwOBA contact quality into a single number. xwOBA above .320 adds bonus points — rewards elite, luck-neutral contact. Red ≥70 · Orange ≥50.',
      '⚡️ PS Score (0–99) — Perfect Storm Score. A gated multiplier system (not linear). Bad gates crush the whole score. Lineup slot gates apply first, then scores three independent phases: Batter Mechanics (25pts) + Pitcher Vulnerability (15pts) + Pitch Convergence (25pts, the core: does the pitcher\'s vulnerable pitch match this batter\'s damage zone?) + Environment (25pts) + Game Theory (5pts). Purple ≥90 (beyond reasonable doubt) · Red ≥75 · Orange ≥60.',
      'Sig and Boom update live when lineups confirm. PS Score gate recalculates live using confirmed batting order slot.',
      '🔥 Convergence Zone: when Boom ≥50 AND PS ≥40 simultaneously, both scoring systems agree — the batter has a strong HR profile AND favorable situational factors. This overlap is rare and the highest-confidence signal in the app.',
    ] },
    { tab:'⚡ Sig Score',      items:[
      'Scale: 0–14 (hard cap). Red ≥10 = Elite · Orange ≥7 = Strong · Green ≥4 = Watch.',
      '─── BOOSTS ───',
      'Sim TB 2.5–3.0 → +3 · 2.0–2.5 → +2 · 1.5–2.0 → +1 (3.0+ dead zone → −1)',
      'Pitcher: 🎯 Target → +2 · 💥 Hittable → +1 · ‼️ Elite → −2',
      'Temp 70–75°F → +2 (peak HR carry window, 430k PA confirmed)',
      'EV ≥103 → +2 · EV 97–103 → +2/+1 (103+ is the real carry cliff)',
      'Recent LA 22–32° → +2 · 18–22° → +1 (HR peak corridor)',
      'BvP LA 22–32° → +1 (confirms approach angle in this matchup)',
      'BvP FB% 20–34% → +2 (dead zones: 42%+ → −2 · 36–42% → −1)',
      'Barrel quality: 107+ EV barrel → +2 (96% HR rate!) · 103–107 → +1 · 98–103 → +1',
      'Recent FB% ≥35% → +1',
      'Bat speed ≥77 mph → +1',
      'Consecutive HR games (2+) → +1',
      'Park HR factor ≥1.15 → +1 (Coors etc.) · ≤0.88 → −1',
      'Pulled barrel rate ≥3% → +1',
      'Batter-ahead count ≥32% → +1',
      'Pitcher hand weakness vs batter side: barrel ≥12% → +2 · ≥8% → +1 · HH≥45% → +1 · FB≥38% → +1 · HR≥5% → +1',
      'Platoon advantage or lineup spot 3–5 → +1',
      '─── FADES ───',
      'Sinker-heavy pitcher (SI first) → −1 · ABs since HR >30 → −1',
      'Flags = 7 (dead zone) → −2 · Flags = 1 (noise) → −1',
      'Pitcher park ≤0.88 → −1 · Recent FB% <15% → −1',
      'xwOBA ≥.380 → +up to 8pts (EV×LA expected value, luck-neutral contact quality)',
      'wOBA ≥.370 = elite actual production · SwStr% ≥20% = contact risk signal',
      'Data: 2024–26 at-bat log · 12,965 HRs · 430,587 PAs · base rate 3.0%'
    ] },
  ];
  return <>
    <button onClick={()=>setOpen(true)}
      title="App Legend"
      style={{padding:'3px 8px',borderRadius:6,border:'1px solid var(--border)',
        background:'var(--surface2)',color:'var(--muted)',cursor:'pointer',
        fontFamily:"'DM Mono',monospace",fontSize:11,flexShrink:0,
        transition:'all .15s',lineHeight:1}}
      onMouseEnter={e=>{e.currentTarget.style.color='var(--text)';e.currentTarget.style.borderColor='rgba(255,255,255,.3)';}}
      onMouseLeave={e=>{e.currentTarget.style.color='var(--muted)';e.currentTarget.style.borderColor='var(--border)';}}>
      🗺️
    </button>
    {open && <>
      <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:900}}/>
      <div style={{position:'fixed',right:0,top:0,bottom:0,width:'min(440px,100vw)',
        background:'var(--surface)',borderLeft:'2px solid var(--border)',
        zIndex:901,overflowY:'auto',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'16px 20px 12px',borderBottom:'1px solid var(--border)',
          position:'sticky',top:0,background:'var(--surface)',zIndex:10,
          display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:18,
              letterSpacing:1,color:'var(--text)',textTransform:'uppercase'}}>🗺️ Legend</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)',marginTop:2}}>
              Emoji guide · tab descriptions · signal reference
            </div>
          </div>
          <button onClick={()=>setOpen(false)}
            style={{background:'none',border:'1px solid var(--border)',borderRadius:6,
              color:'var(--muted)',cursor:'pointer',padding:'4px 10px',
              fontFamily:"'DM Mono',monospace",fontSize:10,flexShrink:0}}>✕</button>
        </div>
        <div style={{padding:20,flex:1,display:'flex',flexDirection:'column',gap:16}}>
          {tabs.map(({tab, items}) => (
            <div key={tab}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,
                color:'var(--accent2)',textTransform:'uppercase',letterSpacing:.8,
                marginBottom:6,paddingBottom:4,borderBottom:'1px solid var(--border)'}}>
                {tab}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:3}}>
                {items.map((item,i) => {
                  const isSep = item.startsWith('───');
                  const isScale = item.startsWith('Scale:');
                  const isData = item.startsWith('Data:');
                  const isVisible = item.startsWith('Visible');
                  if (isSep) return (
                    <div key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:9,
                      color:'var(--accent2)',letterSpacing:.8,marginTop:4,marginBottom:1,
                      borderTop:'1px solid rgba(255,255,255,.06)',paddingTop:4}}>
                      {item}
                    </div>
                  );
                  if (isScale) return (
                    <div key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:10,
                      color:'var(--text)',lineHeight:1.5,paddingLeft:4,fontWeight:700,
                      marginBottom:2}}>
                      {item}
                    </div>
                  );
                  if (isData || isVisible) return (
                    <div key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:8,
                      color:'rgba(255,255,255,.3)',lineHeight:1.4,paddingLeft:4,
                      marginTop:4,fontStyle:'italic'}}>
                      {item}
                    </div>
                  );
                  return (
                    <div key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:10,
                      color:'var(--muted)',lineHeight:1.4,paddingLeft:4}}>
                      {item}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(255,255,255,.2)',
            textAlign:'center',paddingTop:8,borderTop:'1px solid var(--border)'}}>
            Going Yard · goingyard.app
          </div>
        </div>
      </div>
    </>}
  </>;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [tab, setTab] = useState("homeruns");
  const [showPicksSlideout, setShowPicksSlideout] = useState(false);

  // Wire global nav on mount so notifications can route to tabs
  useEffect(() => {
    _GLOBAL_NAV = { setTab };
    return () => { _GLOBAL_NAV = null; };
  }, [setTab]);

  // Load player data at startup
  useEffect(() => {
    loadGlobalPlayerMap();
    loadDailyPicks();
    const noop = () => {};
    fetchPlayers(noop, noop, noop, false);
  }, []);

  const NAV = [
    {key:"homeruns",  label:"💥 HR Tracker"},
    {key:"_sep1",     label:"|", sep:true},
    {key:"live",      label:"📡 Live"},
    {key:"matchup",   label:"⚡ Key Matchups"},
    {key:"_sep2",     label:"|", sep:true},
    {key:"weather",   label:"🌤️ Weather"},
    {key:"powerbi",   label:"📊 Data"},
    {key:"picks",     label:"🎯 My Picks"},
    {key:"livesports",label:"📺 Live Sports",external:"https://thetvapp.to"},
    {key:"_sep3",     label:"|", sep:true},
    {key:"statcast",  label:"📡 Statcast"},
    {key:"mlbscores",  label:"⚾ MLB"},
    {key:"onlyhomers",label:"⚾ Only Homers"},
    {key:"doink",     label:"👾 DOINK"},
    {key:"_sep4",     label:"|", sep:true},
    {key:"linemate",  label:"📊 Linemate",  external:"https://linemate.io/mlb"},
    {key:"gambly",    label:"🤖 Gambly Bot", external:"https://gambly.com"},
    {key:"_sep5",     label:"|", sep:true},
    {key:"getapp",    label:"📲 Get App"},
  ];

  return <>
    {showSplash && <SplashScreen onDone={() => setShowSplash(false)}/>}
    <style>{styles}</style>
    <div className="app">
      <div className="app-inner">
      <HRNotifications/>
      <header className="header">
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div className="logo" style={{fontSize:14}}><div className="logo-dot"/><img src="/icon-192.png" alt="Going Yard" style={{width:16,height:16,borderRadius:3,objectFit:"cover",flexShrink:0,verticalAlign:"middle"}}/> <span>GOING</span> YARD</div>
            <NotifyBell/>
          </div>
          <div className="landscape-hint" style={{fontSize:8,color:"var(--muted)",fontFamily:"'DM Mono',monospace",letterSpacing:.3,paddingLeft:2,lineHeight:1}}>📱↔️ Rotate to landscape</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5}}> 
          <DataStatusBadge/>
          <NotificationBell/>
          <LegendButton/>
          <button onClick={()=>setShowPicksSlideout(s=>!s)}
            style={{padding:"3px 7px",borderRadius:6,border:"1px solid var(--border)",
              background:"var(--surface2)",color:"var(--accent2)",cursor:"pointer",
              fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:9,letterSpacing:.6,
              display:"flex",alignItems:"center",gap:3,flexShrink:0,whiteSpace:'nowrap'}}>
            🎯 Picks
          </button>
            </div>
      </header>
      <HRTicker onHRClick={()=>setTab("homeruns")}/>
      <nav className="tabs">
        {NAV.flatMap((n, i) => {
          const el = n.sep
            ? <span key={n.key} style={{color:'rgba(255,255,255,.12)',fontSize:14,
                alignSelf:'center',flexShrink:0,padding:'0 2px',userSelect:'none'}}>|</span>
            : n.external
              ? <button key={n.key} className="tab"
                  onClick={()=>window.open(n.external,"_blank","noopener,noreferrer")}
                  style={{color:"var(--muted)",fontWeight:400,display:"flex",alignItems:"center",gap:4}}>
                  {n.label} <span style={{fontSize:9,opacity:.6}}>↗</span>
                </button>
              : <button key={n.key} className={`tab ${tab===n.key?"active":""}`}
                  onClick={()=>setTab(n.key)}
                  style={{color:tab===n.key?"var(--accent)":undefined,fontWeight:tab===n.key?700:400}}>
                  {n.label}
                </button>;
          // Add a thin divider after every non-sep tab (except before/after group seps)
          const next = NAV[i+1];
          const addDiv = !n.sep && next && !next.sep;
          return addDiv
            ? [el, <span key={n.key+'_d'} style={{color:'rgba(255,255,255,.07)',fontSize:12,
                alignSelf:'center',flexShrink:0,userSelect:'none'}}>|</span>]
            : [el];
        })}
      </nav>
      <main className="content">
        <div style={{display:tab==="weather"?"block":"none"}}><WeatherTab/></div>
        {tab==="live"     && <LiveTab/>}
        {tab==="picks"    && <MyPicksTab/>}
        <div style={{display:tab==="powerbi"?"block":"none"}}><PowerBITab/></div>
        <div style={{display:tab==="statcast"?"block":"none"}}><StatcastTab/></div>
        <div style={{display:tab==="homeruns"?"block":"none"}}><HRTrackerTab/></div>
        <div style={{display:tab==="mlbscores"?"block":"none"}}><MLBScoresTab/></div>
        <div style={{display:tab==="onlyhomers"?"block":"none"}}><OnlyHomersTab/></div>
        <div style={{display:tab==="doink"?'block':'none'}}>
          <div style={{padding:"8px 14px",background:"rgba(245,166,35,.1)",
            borderBottom:"1px solid rgba(245,166,35,.25)",
            display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:12}}>👾</span>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--text)"}}>New users — sign up with code</span>
            <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:13,
              color:"var(--accent2)",letterSpacing:.5,padding:"1px 8px",borderRadius:4,
              background:"rgba(245,166,35,.15)",border:"1px solid rgba(245,166,35,.3)"}}>
              SHARP9346
            </span>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--muted)"}}>for 25% off —</span>
            <a href="https://doinksports.com/research/mlb/weather-man" target="_blank" rel="noopener noreferrer"
              style={{fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:700,
                color:"var(--ice)",textDecoration:"underline",textUnderlineOffset:3}}>
              Sign Up / Log In ↗
            </a>
          </div>
          <iframe src="https://doinksports.com/research/mlb/weather-man"
            style={{width:'125%',height:'calc((100vh - 80px) * 1.25)',border:'none',display:'block',
              transform:'scale(0.8)',transformOrigin:'top left'}}
            title="Doink Sports MLB Research"/>
        </div>
        <div style={{display:tab==="getapp"?"block":"none"}}><GetAppTab/></div>
        <div style={{display:tab==="matchup"?"block":"none"}}><MatchupEngineTab/></div>
      </main>
      <div style={{textAlign:"center",padding:"12px 0 8px",borderTop:"1px solid var(--border)",marginTop:24}}>
        <span style={{fontSize:10,color:"#2a3a48",fontFamily:"'DM Mono',monospace",letterSpacing:1}}>
          Going Yard v3 · Build {BUILD_TIMESTAMP} · prsm-labs
        </span>
      </div>
    </div>
    </div>{/* end app-inner */}
    <AtBatSlideIn/>
    <PitcherSlideIn/>
    {showPicksSlideout && <PicksSlideout onClose={()=>setShowPicksSlideout(false)}/>}
    <InjuryModal/>
  </>;

}
import React, { useState, useEffect, useCallback, useRef } from "react";

const BUILD_TIMESTAMP = "2026-04-11 07:32 ET";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@300;400;500;600;700&family=DM+Mono:ital,wght@0,400;0,500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#080c10;--surface:#0d1318;--surface2:#131b22;--border:#1e2d3a;
    --accent:#e8411a;--accent2:#f5a623;--ice:#38b8f2;--green:#27c97a;
    --text:#e8edf2;--muted:#5a7080;--fire2:#ff7a00;--fire3:#ffb700;
    --aplus:#ff3010;--a:#ff7000;--b:#f5a623;--c:#8bc4e8;--d:#5a7080;--f:#38b8f2;
  }
  html,body{background:var(--bg);color:var(--text);font-family:'Oswald',sans-serif;min-height:100vh;overflow-x:clip;max-width:100%;width:100%;}
  .app{min-height:100vh;display:flex;flex-direction:column;overflow-x:clip;max-width:100%;width:100%;}
  .header{padding:16px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:linear-gradient(180deg,#0a1520 0%,var(--bg) 100%);}
  .logo{font-family:'Oswald',sans-serif;font-weight:700;font-size:26px;text-transform:uppercase;letter-spacing:3px;color:var(--text);display:flex;align-items:center;gap:10px;}
  .logo span{color:var(--accent);}
  .logo-dot{width:9px;height:9px;background:var(--accent);border-radius:50%;animation:pulse 1.8s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}
  .live-badge{display:flex;align-items:center;gap:6px;background:rgba(232,65,26,.15);border:1px solid rgba(232,65,26,.3);padding:4px 11px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:1.5px;color:var(--accent);text-transform:uppercase;}
  .live-dot{width:6px;height:6px;background:var(--accent);border-radius:50%;animation:pulse 1s infinite;}
  .tabs{display:flex;padding:0 16px;background:var(--surface);border-bottom:1px solid var(--border);overflow-x:auto;}
  .tab{padding:12px 14px;font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;border:none;background:none;color:var(--muted);border-bottom:2px solid transparent;transition:all .2s;font-family:'Oswald',sans-serif;font-weight:500;white-space:nowrap;}
  .tab:hover{color:var(--text);}
  .tab.active{color:var(--text);border-bottom-color:var(--accent);}
  .content{flex:1;padding:22px;max-width:1440px;margin:0 auto;width:100%;}
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
  .tw{overflow-x:auto;border-radius:10px;border:1px solid var(--border);}
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
  .lr{padding:10px 15px;border-bottom:1px solid rgba(30,45,58,.4);display:flex;align-items:center;gap:10px;transition:background .15s;}
  .lr:last-child{border-bottom:none;}
  .lr:hover{background:rgba(255,255,255,.02);}
  .lrk{font-family:'Oswald',sans-serif;font-size:17px;color:var(--muted);min-width:17px;}
  .li{flex:1;min-width:0;}
  .ln{font-weight:600;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .lm{font-size:10px;color:var(--muted);font-family:'DM Mono',monospace;margin-top:1px;}
  .ls{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;}
  .lv{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:9px;font-size:9px;font-weight:700;letter-spacing:.8px;font-family:'DM Mono',monospace;white-space:nowrap;}
  .lv.primed{background:rgba(255,45,0,.2);color:#ff5030;border:1px solid rgba(255,45,0,.35);}
  .lv.hot{background:rgba(255,122,0,.15);color:#ff9a30;border:1px solid rgba(255,122,0,.3);}
  .lv.watch{background:rgba(255,183,0,.12);color:#ffc840;border:1px solid rgba(255,183,0,.22);}
  .lv.cold{background:rgba(56,184,242,.1);color:var(--ice);border:1px solid rgba(56,184,242,.2);}
  .lmini{display:flex;gap:8px;align-items:center;flex-shrink:0;}
  .lms{text-align:center;}
  .lmsv{font-family:'DM Mono',monospace;font-size:11px;font-weight:600;}
  .lmsl{font-size:8px;color:var(--muted);font-family:'DM Mono',monospace;text-transform:uppercase;}
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
    .xg{grid-template-columns:repeat(2,1fr);}.lmini{display:none;}
    .bvr{grid-template-columns:auto 1fr;}.h2h{display:none;}.pmg{grid-template-columns:repeat(2,1fr);}
    .tabs{overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap;padding:0 8px;}
    @media(orientation:landscape){.landscape-hint{display:none!important;}}
    .tab{white-space:nowrap;flex-shrink:0;padding:10px 9px;font-size:10px;}
    '    .gc{overflow:visible;}'
    .tw{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    }
`;

// THRESHOLDS
// ── PLAYER DATA CACHE (module-level, persists across renders) ────
const PLAYER_DATA_CACHE = {};
let PLAYER_CACHE_DATE = null; // timestamp (ms) — refreshes every 3 hours
function cachePlayer(p) { if (p.pid) PLAYER_DATA_CACHE[String(p.pid)] = p; }
function getCachedPlayer(pid) { return PLAYER_DATA_CACHE[String(pid)] || PLAYER_DATA_CACHE[parseInt(pid)] || null; }

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
  { value:'HRR', label:'HRR',     color:'var(--accent)' },
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
      // Open left-aligned to button right edge so it doesn't overflow
      const menuWidth = 140;
      const left = Math.max(4, r.right - menuWidth);
      setPos({ top: r.bottom + 4, left });
    }
    setOpen(o=>!o);
  };
  return (
    <div style={{position:'relative',display:'inline-block'}}>
      <button ref={btnRef} onClick={handleOpen}
        style={{padding:'2px 7px',borderRadius:5,fontSize:10,fontFamily:"'DM Mono',monospace",
        cursor:'pointer',border:`1px solid ${current?PICK_TYPES[current].color:'var(--border)'}`,
        background:current?`${PICK_TYPES[current].color}20`:'var(--surface2)',
        color:current?PICK_TYPES[current].color:'var(--muted)'}}>
        {current?PICK_TYPES[current].label.split(' ')[0]:'＋'}
      </button>
      {open && <div style={{position:'fixed',top:pos.top,left:pos.left,zIndex:9999,
        background:'#0d1318',border:'1px solid var(--border)',borderRadius:8,padding:5,
        display:'flex',flexDirection:'column',gap:3,minWidth:130,
        boxShadow:'0 8px 24px rgba(0,0,0,.7)'}}
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
      </div>}
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
      <div className="section-header">
        <div className="section-title">⚾ Pitcher Stats</div>
        <div className="section-sub">Starting pitchers · sorted by HR/9 (highest = most hittable) · click to expand pitch mix</div>
      </div>
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
                    <td><div className="pn" style={{fontSize:13}}>{p.name}</div></td>
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
                                  <div key={pitch.name} style={{background:'var(--surface)',border:`1px solid ${pitch.color||'var(--border)'}40`,borderRadius:8,padding:'10px 14px',minWidth:120}}>
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
  };
  const PickRow = ({p})=>{
    const cfg = PICK_TYPES[p.type];
    const propVal = bprops[String(p.pid)];
    const propOpt = propVal ? BATTER_PROP_OPTS.find(o=>o.value===propVal) : null;
    return <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderBottom:"1px solid rgba(30,45,58,.4)"}}>
      {/* Avatar */}
      <div style={{width:32,height:32,borderRadius:"50%",background:"var(--surface2)",
        border:`2px solid ${cfg.color}`,display:"flex",alignItems:"center",justifyContent:"center",
        fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,color:cfg.color,cursor:"pointer",flexShrink:0}}
        onClick={()=>openAtBatSlide(p)}>{ini(p.name)}</div>

      {/* Name + team — clickable */}
      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>openAtBatSlide(p)}>
        <div style={{fontWeight:600,fontSize:11,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",letterSpacing:.2}}>{p.name}</div>
        <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",display:"flex",gap:5,alignItems:"center",marginTop:1}}>
          <span style={{color:"var(--accent2)",fontWeight:700}}>{getTeam(p.pid, p.team)}</span>
          {p.grade?.grade && <span style={{color:"var(--muted)"}}>· {p.grade.grade}</span>}
        </div>
      </div>

      {/* Prop dropdown */}
      <select
        value={propVal}
        onChange={e=>{e.stopPropagation();setBatterProp(p.pid,e.target.value);}}
        onClick={e=>e.stopPropagation()}
        style={{
          padding:'3px 5px',flexShrink:0,
          background: propVal ? 'rgba(0,0,0,.35)' : 'var(--surface2)',
          border:`1px solid ${propVal ? (propOpt?.color||'var(--border)') : 'var(--border)'}`,
          borderRadius:6,
          color: propVal ? (propOpt?.color||'var(--text)') : 'var(--muted)',
          fontFamily:"'DM Mono',monospace",fontSize:10,
          fontWeight:propVal?700:400,cursor:'pointer',outline:'none',minWidth:60,
        }}>
        {BATTER_PROP_OPTS.map(o=>(
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Pick type switcher */}
      <div style={{display:"flex",gap:3,flexShrink:0}}>
        {Object.entries(PICK_TYPES).map(([type,c])=>(
          <button key={type} onClick={()=>setPick(p.pid,p.name,p.team,type)} title={c.label}
            style={{width:26,height:26,borderRadius:5,cursor:"pointer",fontSize:12,
              border:`1px solid ${p.type===type?c.color:"var(--border)"}`,
              background:p.type===type?`${c.color}20`:"var(--surface2)"}}>
            {c.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Remove */}
      <button onClick={()=>setPick(p.pid,p.name,p.team,p.type)}
        style={{background:"none",border:"1px solid var(--border)",borderRadius:5,
          color:"var(--muted)",cursor:"pointer",padding:"2px 7px",fontSize:10,flexShrink:0}}>✕</button>
    </div>;
  };
  return <div>
    <div className="section-header" style={{marginBottom:16}}>
      <div className="section-title">🎯 My Picks</div>
      <div className="section-sub">Your saved batters · 💣 Favorites · ⭐ Dark Horses · 🎯 Longshots · 📆 Day Late</div>
    </div>
    {pickList.length>0&&<div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:12}}>
      <button onClick={()=>{
        // Export picks to CSV — Pick Type, Team, Batter Name, Prop
        const rows = [["Pick Type","Team","Batter Name","Prop"]];
        pickList.forEach(p=>{
          const cfg = PICK_TYPES[p.type];
          const typeName = cfg?.label?.split(" ").slice(1).join(" ") || p.type;
          const propVal = GLOBAL_BPROPS[String(p.pid)] || "";
          const propOpt = propVal ? BATTER_PROP_OPTS.find(o=>o.value===propVal) : null;
          rows.push([typeName, p.team||"-", p.name||"-", propOpt?.label||""]);
        });
        const csv = rows.map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
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
    {pickList.length===0
      ? <div style={{padding:"60px 20px",textAlign:"center",color:"var(--muted)",fontFamily:"'DM Mono',monospace",fontSize:12,lineHeight:2}}>
          No picks yet.<br/>Click the <strong style={{color:"var(--text)"}}>＋</strong> button next to any batter on Pregame or Scouting tabs.
        </div>
      : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
          {Object.entries(grouped).map(([type,players])=>{
            if(players.length===0) return null;
            const cfg=PICK_TYPES[type];
            return <div key={type} style={{background:"var(--surface)",border:`1px solid ${cfg.color}30`,borderRadius:10,overflow:"hidden"}}>
              <div style={{padding:"10px 14px",background:`${cfg.color}10`,borderBottom:`1px solid ${cfg.color}20`,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>{cfg.label.split(" ")[0]}</span>
                <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,color:cfg.color,letterSpacing:1}}>{cfg.label.split(" ").slice(1).join(" ").toUpperCase()}</span>
                <span style={{marginLeft:"auto",fontFamily:"'DM Mono',monospace",fontSize:11,color:"var(--muted)"}}>{players.length} batter{players.length!==1?"s":""}</span>
              </div>
              {players.map(p=><PickRow key={p.pid} p={p}/>)}
            </div>;
          })}
        </div>
    }
  </div>;
}

// ── GLOBAL AT-BAT SLIDE-IN ────────────────────────────────────
// Single global state — any page can trigger it
let AB_SLIDE_LISTENER = null;
function openAtBatSlide(player) {
  if (AB_SLIDE_LISTENER) AB_SLIDE_LISTENER(player);
}

function AtBatSlideIn() {
  const [player, setPlayer] = useState(null);
  const [atBats, setAtBats] = useState([]);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    setLoading(true);
    setAtBats([]);
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
        const OPP_ABBR = {133:'OAK',134:'PIT',135:'SD',136:'SEA',137:'SF',138:'STL',139:'TB',140:'TEX',141:'TOR',142:'MIN',143:'PHI',144:'ATL',145:'CWS',146:'MIA',147:'NYY',158:'MIL',108:'LAA',109:'ARI',110:'BAL',111:'BOS',112:'CHC',113:'CIN',114:'CLE',115:'COL',116:'DET',117:'HOU',118:'KC',119:'LAD',120:'WSH',121:'NYM'};
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
        <PosAvatar player={player} size={40} style={{border:"2px solid var(--accent)"}}/>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:18,letterSpacing:1}}>{player.name}</div>
          <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>
            {player.team}
            {player.avgEV > 0 && <span> · EV {player.avgEV.toFixed(1)}</span>}
            {player.hr > 0  && <span style={{color:'var(--accent)',fontWeight:700}}> · {player.hr} HR</span>}
            {player.avg > 0 && <span> · {'.'+String(Math.round(player.avg*1000)).padStart(3,'0')} AVG</span>}
            {player.grade?.grade && <span> · {player.grade.grade} Grade</span>}
          </div>
        </div>
        <PickButton pid={player.pid} name={player.name} team={player.team}/>
        <button onClick={()=>setPlayer(null)} style={{background:"none",border:"1px solid var(--border)",borderRadius:6,color:"var(--muted)",cursor:"pointer",padding:"5px 10px",fontFamily:"'DM Mono',monospace",fontSize:11}}>✕ Close</button>
      </div>

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
                <div style={{width:34,height:34,borderRadius:"50%",background:"var(--surface2)",border:`2px solid ${cfg.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,color:cfg.color,flexShrink:0}}>{ini(p.name)}</div>
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

// ── LINEUP STATUS MAP — pid → "confirmed" | "playing_today" ──
// Populated when MLB lineup API returns confirmed starters
const LINEUP_STATUS = {}; // pid → {status:"confirmed"|"today", team}
const TODAY_TEAMS = new Set(); // teams playing today

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
          players.forEach(p => {
            if (p.id) {
              LINEUP_STATUS[p.id] = { status: 'confirmed', team: teamAbbr };
            }
          });
        }
      }
    }
    console.log('[Lineups] Today teams:', [...TODAY_TEAMS].join(', '));
    console.log('[Lineups] Confirmed starters:', Object.keys(LINEUP_STATUS).length);
  } catch(e) {
    console.warn('[Lineups] Load failed:', e.message);
  }
}

async function loadGlobalPlayerMap() {
  if (GLOBAL_PLAYER_MAP_LOADED) return GLOBAL_PLAYER_TEAM_MAP;
  try {
    for (const season of ['2025', '2026']) {
      try {
        const res2 = await fetch(`https://statsapi.mlb.com/api/v1/sports/1/players?season=${season}&sportId=1`);
        const d2 = await res2.json();
        for (const p of (d2.people || [])) {
          if (!p.id || !p.fullName) continue;
          const ex = GLOBAL_PLAYER_TEAM_MAP[p.id] || {};
          GLOBAL_PLAYER_TEAM_MAP[p.id] = {
            team:   p.currentTeam?.abbreviation || ex.team || '',
            teamId: p.currentTeam?.id || ex.teamId || 0,
            name:   p.fullName,
            hand:   p.batSide?.code || ex.hand || 'R',
            pos:    p.primaryPosition?.abbreviation || p.primaryPosition?.code || ex.pos || '',
          };
        }
      } catch(se) {}
    }
    GLOBAL_PLAYER_MAP_LOADED = true;
    // Check if any known players still have no team — if so mark for re-fetch later
    const emptyTeams = Object.values(GLOBAL_PLAYER_TEAM_MAP).filter(p=>!p.team||p.team==="").length;
    if (emptyTeams > 50) console.warn(`[PlayerMap] ${emptyTeams} players missing team abbreviation`);
    console.log('[Going Yard] Player map loaded:', Object.keys(GLOBAL_PLAYER_TEAM_MAP).length);
    // Backfill cached players missing team
    for (const [pidStr, player] of Object.entries(PLAYER_DATA_CACHE)) {
      if (!player.team || player.team === '—' || player.team === '-' || player.team === '') {
        const m = GLOBAL_PLAYER_TEAM_MAP[parseInt(pidStr)]?.team;
        if (m && m !== '—' && m !== '') player.team = m;
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

// Resolve team name from all available sources — use everywhere instead of p.team directly
function getTeam(pid, fallback) {
  const id = parseInt(pid);
  // Check cache first (fastest)
  const cached = PLAYER_DATA_CACHE[id]?.team;
  if (cached && cached !== '—' && cached !== '-') return cached;
  // Check global map (loaded from MLB API)
  const mapped = GLOBAL_PLAYER_TEAM_MAP[id]?.team;
  if (mapped && mapped !== '—' && mapped !== '-') return mapped;
  // Use whatever was passed as fallback
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
      // Normalize id: strip pandas float suffix "691016.0" → "691016"
      const rawBid = String(r.batter_id || '').trim();
      const bid = rawBid.includes('.') ? String(parseInt(rawBid)) : rawBid;
      // Only store first row per batter — recent stats are same across all matchup rows
      if (bid && bid !== 'NaN' && !DAILY_PICKS_CACHE[bid]) DAILY_PICKS_CACHE[bid] = r;
    });
    console.log('[DailyPicks] Loaded', Object.keys(DAILY_PICKS_CACHE).length, 'batters');
  } catch(e) {
    console.warn('[DailyPicks] Failed to load:', e.message);
  }
}

async function fetchPlayers(setL, setP, setE, silent=false) {
  if (!silent) setL(true);
  setE(null);

  // 3-hour TTL — keeps Statcast data fresh throughout the day
  // Savant publishes previous day's at-bat data 6-10 AM ET daily
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
          team:         (() => { const t = r.team || r.team_name_abbrev || GLOBAL_PLAYER_TEAM_MAP[r.pid]?.team || ''; return (t && t !== '—') ? t : '—'; })(),
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
      const team = pt[pid] || sc.team || '—';

      // ── Build player object — all fields map directly from /api/atbats ──
      // atbats.js now calculates FB%/Pull% from raw bb_type counts (Power BI method)
      // sc.flyBall, sc.pullPct etc are already correctly calculated
      const name = sc.name && sc.name.trim() && !sc.name.startsWith('P')
        ? sc.name
        : GLOBAL_PLAYER_TEAM_MAP[sc.pid]?.name || sc.name || "";

      const p = {
        pid,
        name,
        team: team && team !== '—' ? team : (GLOBAL_PLAYER_TEAM_MAP[pid]?.team || '—'),
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
      // Fix team from global map if missing
      if (!p.team || p.team === '—') {
        const teamFromMap = GLOBAL_PLAYER_TEAM_MAP[p.pid]?.team;
        if (teamFromMap) p.team = teamFromMap;
      }
    });

    // ── STEP 6: Enrich HR counts from MLB Stats API only for players
    // where the pipeline didn't provide a value (Savant fallback path)
    try {
      const hrRes = await fetch(
        'https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=homeRuns&season=2026&sportId=1&limit=500&statType=season'
      );
      const hrData = await hrRes.json();
      const hrMap = {};
      for (const cat of (hrData.leagueLeaders || [])) {
        for (const entry of (cat.leaders || [])) {
          if (entry.person?.id) hrMap[entry.person.id] = parseInt(entry.value || 0);
        }
      }
      mapped.forEach(p => {
        // Only overwrite if pipeline gave us 0 — pipeline value is more accurate
        // (pipeline counts from the actual at-bat log, API is leaders-only and may lag)
        if (hrMap[p.pid] && (!p.hr || p.hr === 0)) {
          p.hr = hrMap[p.pid];
          p.hri = calcHRI(p);
          p.os  = calcOS(p);
          p.grade = getSG(p.os);
        }
      });
      console.log('[Players] HR enrichment done. HR leaders mapped:', Object.keys(hrMap).length);
    } catch(e) { console.warn('[Players] HR enrichment failed:', e.message); }

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
  if (!p.team || p.team === '—' || p.team === '-') {
    const mapped = GLOBAL_PLAYER_TEAM_MAP[p.pid]?.team;
    if (mapped && mapped !== '—') p.team = mapped;
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

    // After midnight check: if it's before 6 AM ET, also fetch yesterday's schedule
    // to catch games that started the night before and are still live/not final
    const etHour = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York", hour: "numeric", hour12: false
    });
    const isLateNight = parseInt(etHour) < 6; // midnight → 5:59 AM ET

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
      const _tAbbr = id => ({133:'OAK',134:'PIT',135:'SD',136:'SEA',137:'SF',138:'STL',139:'TB',140:'TEX',141:'TOR',142:'MIN',143:'PHI',144:'ATL',145:'CWS',146:'MIA',147:'NYY',158:'MIL',108:'LAA',109:'ARI',110:'BAL',111:'BOS',112:'CHC',113:'CIN',114:'CLE',115:'COL',116:'DET',117:'HOU',118:'KC',119:'LAD',120:'WSH',121:'NYM'})[id] || '???';
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

    const avg = (arr) => arr.length > 0 ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length*10)/10 : null;

    const batters = [];
    for (const side of ["away", "home"]) {
      const team = data.teams?.[side], ta = team?.team?.abbreviation || side.toUpperCase();
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
        });
      }
    }

  return batters.sort((a,b) => {
    if (a.isAtBat && !b.isAtBat)  return -1;
    if (b.isAtBat && !a.isAtBat)  return  1;
    if (a.isOnDeck && !b.isOnDeck) return -1;
    if (b.isOnDeck && !a.isOnDeck) return  1;
    const o = {gone_yard:5,elite:4,hot:3,warm:2,avg:1,cold:0};
    return (o[b.heatLabel.cls]||0) - (o[a.heatLabel.cls]||0);
  });
  } catch(e) {
    console.warn('[LiveBatters]', e.message);
    return SLB;
  }
}

// Cache liftoff results so they don't re-randomize on every tap
const LIFTOFF_CACHE = {};

async function fetchLiftoffBatters(game) {
  if (LIFTOFF_CACHE[game.gamePk]) return LIFTOFF_CACHE[game.gamePk];
  // Ensure player cache is populated before computing stats
  if (Object.keys(PLAYER_DATA_CACHE).length < 5) {
    await new Promise(res => fetchPlayers(()=>{}, ()=>{}, ()=>{}, true));
    await new Promise(r => setTimeout(r, 800));
  }
  try {
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

      // Determine pitcher handedness for matchup factor
      const pitchSide = side === "away" ? "home" : "away";
      const pitcherHand = game[pitchSide]?.pitcherHand || "R";

      for (const bid of batterIds) {
        const p = team?.players?.[`ID${bid}`]; if (!p) continue;
        const liftPos = p?.position?.code || p?.position?.abbreviation || p?.person?.primaryPosition?.code || '';
        if (liftPos === '1' || liftPos === 'P') continue;

        const name = p?.person?.fullName || `Player ${bid}`;

        // ── Use REAL Statcast data from player cache ───────────
        const cachedP = getCachedPlayer(bid);

        // Season metrics from Baseball Savant (via /api/atbats or players.json)
        const barrel    = cachedP?.barrel      || 0;
        const hardHit   = cachedP?.hardHit     || 0;
        const avgEV     = cachedP?.avgEV       || 0;
        const sweetSpot = cachedP?.sweetSpot   || 0;
        const pullAir   = cachedP?.pullAir     || 0;
        const flyBall   = cachedP?.flyBall     || 0;
        const xwoba     = cachedP?.xwoba       || 0;
        const xslg      = cachedP?.xslg        || 0;
        const hr        = cachedP?.hr          || 0;
        const bbPct     = cachedP?.bbPct       || 0;
        const kPct      = cachedP?.kPct        || 0;
        const oSwing    = cachedP?.oSwing      || 0;
        // L7 window — prefer daily_picks.csv, fall back to players.json windows
        const w7        = cachedP?.windows?.last7;
        const bidKey = String(bid);
        const dp = DAILY_PICKS_CACHE[bidKey] ||
          // fallback: match by name (handles any remaining ID format mismatches)
          Object.values(DAILY_PICKS_CACHE).find(r => r.batter && r.batter.toLowerCase() === (name||'').toLowerCase()) || null;
        const recentBrl = (dp?.recent_barrel_pct != null && dp.recent_barrel_pct !== '' ? parseFloat(dp.recent_barrel_pct) : null) ?? w7?.barrel  ?? barrel;
        const recentHH  = (dp?.recent_hh_pct != null && dp.recent_hh_pct !== '' ? parseFloat(dp.recent_hh_pct) : null) ?? w7?.hardHit ?? hardHit;
        const recentEV  = (dp?.recent_avg_ev     != null && dp.recent_avg_ev     !== '' ? parseFloat(dp.recent_avg_ev)     : null) ?? w7?.avgEV   ?? avgEV;
        const recentFB  = (dp?.recent_fb_pct     != null && dp.recent_fb_pct     !== '' ? parseFloat(dp.recent_fb_pct)     : null) ?? w7?.flyBall ?? flyBall;
        const recentPull= w7?.pullAir ?? pullAir;
        const recentHRct= dp?.recent_hr_count != null ? parseInt(dp.recent_hr_count) || 0 : null;
        const recentLA  = dp?.recent_avg_la != null && dp.recent_avg_la !== '' ? parseFloat(dp.recent_avg_la) : null;

        // ── Real days since last HR from game log ──────────────
        // Check today's HR ticker first (fastest)
        const todayHR = HR_DATA.find(h => h.batterId === bid || h.batterName === name);
        let daysSinceHR = todayHR ? 0 : null;

        // Async fetch real days since HR (doesn't block render)
        if (daysSinceHR === null) {
          fetchDaysSinceHR(bid).then(days => {
            if (days !== null && LIFTOFF_CACHE[game.gamePk]) {
              const b = LIFTOFF_CACHE[game.gamePk].find(b => b.id === bid);
              if (b) {
                b.daysSinceHR = days;
                b.liftoffScore = calcLS(b);
                b.verdict = getLV(b.liftoffScore);
                b.signals = getLSigs(b);
              }
            }
          }).catch(() => {});
          // Use cached value while async runs
          daysSinceHR = DAYS_SINCE_HR_CACHE[bid]?.days ?? null;
        }

        // ── Pitcher matchup factor ─────────────────────────────
        const batterHand = p?.person?.batSide?.code || GLOBAL_PLAYER_TEAM_MAP[bid]?.hand || 'R';
        const hasMatchupAdv = (batterHand === 'L' && pitcherHand === 'R') ||
                              (batterHand === 'R' && pitcherHand === 'L');
        const pitcherFactor = hasMatchupAdv ? 1 : 0;

        const b = {
          id: bid, name, team: ta, isHome,
          // ── REAL Statcast season metrics ──
          barrel, hardHit, avgEV, sweetSpot, pullAir, flyBall,
          xwoba, xslg, hr, bbPct, kPct, oSwing,
          // For calcLS compatibility
          recentBarrel:   recentBrl,
          recentHardHit:  recentHH,
          recentAvgEV:    recentEV,
          recentPullAir:  recentPull,
          recentFlyBall:  recentFB,
          daysSinceHR,
          pitcherFactor,
          homeHR: hr > 0 ? (hr / 162) * 1.05 : 0.04,
          awayHR: hr > 0 ? (hr / 162) * 0.95 : 0.03,
          pos: p?.position?.abbreviation || cachedP?.pos || '',
          avgDist: cachedP?.avgDist || 0,
          atBats: [],
        };
        b.liftoffScore = calcLS(b);
        b.verdict = getLV(b.liftoffScore);
        b.signals = getLSigs(b);
        batters.push(b);
      }
    }

    if (batters.length === 0) return genSL();
    const result = batters.sort((a, b) => b.liftoffScore - a.liftoffScore).slice(0, 12);
    LIFTOFF_CACHE[game.gamePk] = result;
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
            </tr>
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
  const vc = b.verdict.cls==="primed"?"#ff4020":b.verdict.cls==="hot"?"#ff8020":b.verdict.cls==="watch"?"#ffc840":"#38b8f2";
  const handleClick = () => {
    const cached = getCachedPlayer(b.id);
    openAtBatSlide(cached
      ? {...cached, name: b.name, team: b.team}
      : {pid: b.id, name: b.name, team: b.team, avgEV: b.avgEV, barrel: b.barrel, hardHit: b.hardHit, flyBall: b.flyBall, hr: b.hr}
    );
  };
  return <div className="lr" style={{cursor:'pointer'}} onClick={handleClick}>
    <div className="lrk" style={{color:rank<=3?vc:"var(--muted)"}}>{rank}</div>
    <SRing score={b.liftoffScore} color={vc}/>
    <div className="li">
      <div className="ln">{b.name}</div>
      <div className="lm">{getTeam(b.id, b.team)} · {b.isHome?"Home":"Away"} · {b.hr} HR</div>
      <div className="ls">
        <span className={`lv ${b.verdict.cls}`}>{b.verdict.label}</span>
        {b.signals.map((s, i) => <span key={i} className={`stag ${s.c}`}>{s.t}</span>)}
      </div>
    </div>
    <div className="lmini">
      <div className="lms"><div className="lmsv" style={{color:((b.recentBarrel??0)>0?(b.recentBarrel??0):(b.barrel??0))>=12?"#ff8020":"var(--text)"}}>{((b.recentBarrel??0)>0?(b.recentBarrel??0):(b.barrel??0)).toFixed(0)}%</div><div className="lmsl">Barrel L7</div></div>
      <div className="lms"><div className="lmsv" style={{color:(b.recentAvgEV??0)>=T.EV_HH?"#ff8020":"var(--text)"}}>{(b.recentAvgEV??0).toFixed(0)}</div><div className="lmsl">EV L7</div></div>
      <div className="lms"><div className="lmsv" style={{color:b.daysSinceHR>=4&&b.daysSinceHR<=10?"#ffc840":"var(--text)"}}>{b.daysSinceHR!=null?`${b.daysSinceHR != null ? `${b.daysSinceHR}d` : "—"}`:"—"}</div><div className="lmsl">Since HR</div></div>
    </div>
  </div>;
}

function GPanel({game, isLive, isFinal=false}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expId, setExpId] = useState(null);
  useEffect(() => {
    // Initial load only — don't reset expId or clear data on background updates
    setLoading(true);
    (async () => {
      // Final games show the full box score (same as live batters — it has final stats)
      const d = (isLive || isFinal) ? await fetchLiveBatters(game.gamePk) : await fetchLiftoffBatters(game);
      setData(d); setLoading(false);
    })();
  }, [game.gamePk, isLive]);

  // Background refresh for live games — silent, preserves expanded rows
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(async () => {
      const d = await fetchLiveBatters(game.gamePk);
      setData(d); // update data without resetting expId or scroll
    }, 60000);
    return () => clearInterval(id);
  }, [game.gamePk, isLive]);
  return <div className="gp">
    <div className="gph">
      <div className="gpt">{isLive ? "🔥 Live Heat — Who's Going Yard?" : isFinal ? "📋 Final Box Score" : "🚀 Ready for Liftoff"}</div>
      <div className="gps">{isLive ? "Click any batter → today vs L7 comparison" : isFinal ? "Final game stats · click any batter for detail" : "Ranked: streak 40% · due factor 25% · vs pitcher 15% · home/away 10%"}</div>
    </div>
    {loading ? <div style={{padding:"20px 15px",display:"flex",alignItems:"center",gap:8}}><div className="sp" style={{width:18,height:18,borderWidth:2}}/><span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"var(--muted)"}}>Loading…</span></div>
: (isLive || isFinal) ? <div>
          {(data||[]).map(b => {
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

                {/* Row 1: expand + avatar/name + heat badge + today line */}
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span className={`cv2 ${isE?"op":""}`}
                    style={{fontSize:11,color:"var(--muted)",flexShrink:0}}>▾</span>
                  <div className="pc" style={{flex:1,minWidth:0}}>
                    <PosAvatar player={b} size={26}/>
                    <div style={{minWidth:0}}>
                      <div className="pn" style={{fontSize:12}}>{b.name}</div>
                      <div style={{fontSize:9,color:"var(--accent2)",fontFamily:"'DM Mono',monospace",fontWeight:700}}>
                        {getTeam(b.id,b.team)}
                      </div>
                    </div>
                  </div>
                  {b.isAtBat && <span style={{
                    padding:"1px 6px",borderRadius:4,fontSize:9,fontWeight:800,
                    background:"rgba(39,201,122,.2)",color:"#27c97a",
                    border:"1px solid rgba(39,201,122,.4)",flexShrink:0,
                    fontFamily:"'DM Mono',monospace",letterSpacing:.5,
                    animation:"pulse 1.2s ease-in-out infinite"}}>⚡ AT BAT</span>}
                  {b.isOnDeck && !b.isAtBat && <span style={{
                    padding:"1px 6px",borderRadius:4,fontSize:9,fontWeight:600,
                    background:"rgba(245,166,35,.12)",color:"var(--accent2)",
                    border:"1px solid rgba(245,166,35,.25)",flexShrink:0,
                    fontFamily:"'DM Mono',monospace"}}>👀 ON DECK</span>}
                  <span className={`hl ${b.heatLabel.cls}`}
                    style={{flexShrink:0,fontSize:9}}>{b.heatLabel.label}</span>
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
                borderBottom:"1px solid rgba(30,45,58,.5)"}}><XRow b={b}/></div>
            ];
          })}
        </div>
    : <div>
      {(data||[]).length === 0
        ? <div style={{padding:"16px 15px",color:"var(--muted)",fontFamily:"DM Mono,monospace",fontSize:11}}>Lineup not confirmed.</div>
        : (data||[]).map((b, i) => <LRow key={b.id} b={b} rank={i+1}/>)
      }
    </div>}
  </div>;
}

function GCard({game}) {
  const [exp, setExp] = useState(false);
  const isLive = game.status === "Live", isFin = game.status === "Final";
  const aw = game.away.score > game.home.score, hw = game.home.score > game.away.score;
  return <div className="gpw">
    <div className={`gc ${exp?"exp":""}`} onClick={() => setExp(e => !e)}>
      <div className="gh">
        <div className={`gs ${isFin?"fin":!isLive?"pre":""}`}>
        {isLive&&<span style={{marginRight:3}}>●</span>}
        {isLive?"Live":isFin?"Final":
          game.gameTime ? <span>{game.gameTime} ET</span> : "Upcoming"}
      </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>{game.inning&&<div style={{fontSize:9,color:"var(--muted)",fontFamily:"DM Mono,monospace"}}>{game.inning}</div>}<span className={`cv2 ${exp?"op":""}`} style={{fontSize:11}}>▾</span></div>
      </div>
      <div className="gm">
        <div className="gt"><div className="ta">{game.away.abbr}</div><div style={{fontSize:9,color:"var(--muted)",fontFamily:"DM Mono,monospace"}}>{game.away.record}</div><div className={`tsc ${aw?"win":""}`}>{game.away.score}</div></div>
        <div className="gd">VS</div>
        <div className="gt"><div className="ta">{game.home.abbr}</div><div style={{fontSize:9,color:"var(--muted)",fontFamily:"DM Mono,monospace"}}>{game.home.record}</div><div className={`tsc ${hw?"win":""}`}>{game.home.score}</div></div>
      </div>
      {!exp && <div className="gi" style={{color:isLive?"var(--fire2)":isFin?"var(--muted)":"var(--green)"}}>{isLive?"▾ Tap for live heat":isFin?"▾ Tap for final box score":"▾ Tap for 🚀 Liftoff list"}</div>}
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
          const liveBatters = await fetchLiveBatters(game.gamePk);
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


function LiveTab() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showHeatingUp, setShowHeatingUp] = useState(false);
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
      <div className="section-header"><div className="section-title">📡 Live Yard Watch</div><div className="section-sub">Tap any game · Live=heat · Upcoming=🚀Liftoff · auto-refreshes every 60s{lastUpdate&&<span style={{marginLeft:8}}>Last: {lastUpdate}</span>}</div></div>
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
      {live.length>0&&<><div className="div" style={{marginTop:8}}>🔴 Live Now</div><div className="gg">{live.map(g=><GCard key={g.id} game={g}/>)}</div></>}
      {pre.length>0&&<><div className="div" style={{marginTop:12}}>🟢 Upcoming — Tap for 🚀 Liftoff List</div><div className="gg">{pre.map(g=><GCard key={g.id} game={g}/>)}</div></>}
      {fin.length>0&&<><div className="div" style={{marginTop:12}}>✓ Final</div><div className="gg">{fin.map(g=><GCard key={g.id} game={g}/>)}</div></>}
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
      <div className="section-header">
        <div className="section-title">🎯 Scouting Board</div>
        <div className="section-sub">
          Contact Quality (50%) + HR Intent (30%) + Readiness (20%)
          {filtersActive && <span style={{color:"var(--accent)",marginLeft:8}}>
            {fetchingFilters ? "⟳ Recalculating from at-bat logs…" : "✓ Filtered from real at-bat data"}
          </span>}
        </div>
      </div>
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
            <PosAvatar player={p} size={30}/>
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
    <div className="section-header">
      <div className="section-title">⚔️ Batter vs Pitcher</div>
      <div className="section-sub">EV · Barrel% · Fly Ball% · Chase Rate · Pull Air% · Launch Angle · Handedness matchup · A+→X grade</div>
    </div>
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
            <td><div className="pc"><PosAvatar player={b} size={30}/><div><div className="pn">{b.name}</div><div className="pt">{b.team} · {b.hr} HR</div></div></div></td>
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
    <div className="section-header">
      <div className="section-title">🔬 Pitch Type Matchup Builder</div>
      <div className="section-sub">Pick a team · set pitcher handedness · select pitch types · table re-ranks with handedness adjustment</div>
    </div>
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
                <td><div className="pc"><PosAvatar player={p} size={30} style={{border:`1px solid ${top3?pitchCol+"50":"var(--border)"}`}}/><div><div className="pn">{p.name}</div><div className="pt">{p.team} · {p.hr} HR</div></div></div></td>
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
let HR_DATA_DATE = '';
let HR_LAST_FETCH = 0;
const SEEN_HR_IDS = new Set();
const DAILY_PICKS_CACHE = {}; // keyed by batter_id string
let _notifyNewHR = null; // callback set by useHRNotifications hook
const HR_CACHE_MS = 60000;

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
    if (newHRs.length >= 3) {
      HR_DATA = newHRs; HR_DATA_DATE = data.date || ''; // today has real data — use it
      // Seed on first load; fire banners on subsequent fetches only
      const isFirst = HR_LAST_FETCH === 0;
      newHRs.forEach(h => {
        const id = `${h.gamePk}-${h.batterId}-${h.atBatIndex}`;
        if (!SEEN_HR_IDS.has(id)) {
          SEEN_HR_IDS.add(id);
          if (!isFirst && _notifyNewHR) _notifyNewHR(h); // skip on first load
        }
      });
    } else if (newHRs.length > 0) {
      HR_DATA = newHRs; HR_DATA_DATE = data.date || ''; // small amount — still show it
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
    const id = setInterval(() => fetchHRs(false).then(setHrs), 45000);
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
                <span style={{color:"var(--accent2)",fontWeight:700}}>{hr.batterName}</span>
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
  // After midnight: if before 6 AM ET, default to yesterday so late-night HRs still show
  const etHourNow = parseInt(new Date().toLocaleString('en-US',{timeZone:'America/New_York',hour:'numeric',hour12:false}));
  const defaultDate = (() => {
    if (etHourNow < 6) {
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
      setHrs(data.homeruns || []);
    } catch(e) {
      console.warn("[HRTracker] Load failed:", e.message);
      if (date === todayStr) {
        const cached = await fetchHRs(true);
        setHrs(cached);
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
    // chronoIndex is always the PRIMARY sort — newest HR first
    // Other columns are secondary sort only
    if (sortKey === "timeET" || sortKey === "chronoIndex") {
      // Primary: chronoIndex descending (newest first)
      return (b.chronoIndex ?? 0) - (a.chronoIndex ?? 0);
    }
    // Secondary: sort by chosen column, then break ties with chronoIndex
    const av = a[sortKey], bv = b[sortKey];
    if (av == null && bv == null) return (b.chronoIndex??0)-(a.chronoIndex??0);
    if (av == null) return 1;
    if (bv == null) return -1;
    const primary = typeof av === "string"
      ? sortDir * av.localeCompare(bv)
      : sortDir * (bv - av);
    if (primary !== 0) return primary;
    // Tie-break: newest first
    return (b.chronoIndex ?? 0) - (a.chronoIndex ?? 0);
  });

  const totalHRs = hrs.length;
  const slamCount = hrs.filter(h => h.rbi === 4).length;
  const avgDist = hrs.filter(h=>h.distance).length
    ? Math.round(hrs.filter(h=>h.distance).reduce((s,h)=>s+h.distance,0)/hrs.filter(h=>h.distance).length)
    : null;
  const avgEV = hrs.filter(h=>h.exitVelo).length
    ? (hrs.filter(h=>h.exitVelo).reduce((s,h)=>s+h.exitVelo,0)/hrs.filter(h=>h.exitVelo).length).toFixed(1)
    : null;
  const topShot = hrs.filter(h=>h.distance).sort((a,b)=>b.distance-a.distance)[0];
  const hardest = hrs.filter(h=>h.exitVelo).sort((a,b)=>b.exitVelo-a.exitVelo)[0];

  return <div>
    <div className="hrow">
      <div className="section-header">
        <div className="section-title">💥 Home Run Tracker</div>
        <div className="section-sub">{isToday ? "Today's homers · live · auto-refreshes" : `HRs from ${displayDate}`} · exit velo · distance · pitch type</div>
      </div>
      <button onClick={()=>{
          const bom = "﻿";
          const headers = ["Time","Team","Batter","Type","RBI","Inn","Outs","Angle","EV","Dist","Pitch","Pitcher","Game"];
          const rows = sorted.map(h=>[
            h.timeET||"",h.batterTeam||"",h.batterName||"",h.hrType||"",h.rbi||0,
            `${h.halfInning==="top"?"▲":"▼"}${h.inning}`,h.outs||0,
            h.launchAngle>0?h.launchAngle.toFixed(1):"",
            h.exitVelo>0?h.exitVelo.toFixed(1):"",
            h.distance||"",h.pitchType||"",h.pitcherName||"",
            `${h.awayAbbr} @ ${h.homeAbbr}`
          ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(","));
          const csv = bom + headers.join(",") + "\n" + rows.join("\n");
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
          a.download = `hr-tracker-${selDate}.csv`;
          a.click();
        }}
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

    {/* Stats summary cards */}
    <div className="cards" style={{marginBottom:14}}>
      <div className="card"><div className="cl">💥 Total HRs</div><div className="cv" style={{color:"var(--accent)"}}>{totalHRs}</div><div className="cs">{isToday?"today":displayDate}</div></div>
      <div className="card"><div className="cl">🎉 Grand Slams</div><div className="cv" style={{color:"var(--accent2)"}}>{slamCount}</div><div className="cs">{isToday?"today":displayDate}</div></div>
      {avgDist && <div className="card"><div className="cl">📏 Avg Distance</div><div className="cv">{avgDist}</div><div className="cs">feet</div></div>}
      {avgEV && <div className="card"><div className="cl">⚡ Avg Exit Velo</div><div className="cv">{avgEV}</div><div className="cs">mph</div></div>}
    </div>

    {/* Top shots */}
    {(topShot || hardest) && <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
      {topShot && <div style={{flex:1,minWidth:200,background:"var(--surface)",border:"1px solid rgba(232,65,26,.3)",borderRadius:8,padding:"10px 14px"}}>
        <div style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>🚀 Longest Today</div>
        <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:16,color:"var(--accent)"}}>{topShot.batterName}</div>
        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:28,color:"var(--text)",fontWeight:700,lineHeight:1}}>{topShot.distance}<span style={{fontSize:14,color:"var(--muted)",marginLeft:3}}>ft</span></div>
        <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",marginTop:2}}>{topShot.batterTeam} · {topShot.exitVelo}mph · {topShot.launchAngle}°</div>
      </div>}
      {hardest && <div style={{flex:1,minWidth:200,background:"var(--surface)",border:"1px solid rgba(245,166,35,.3)",borderRadius:8,padding:"10px 14px"}}>
        <div style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>⚡ Hardest Hit Today</div>
        <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:16,color:"var(--accent2)"}}>{hardest.batterName}</div>
        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:28,color:"var(--text)",fontWeight:700,lineHeight:1}}>{hardest.exitVelo}<span style={{fontSize:14,color:"var(--muted)",marginLeft:3}}>mph</span></div>
        <div style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",marginTop:2}}>{hardest.batterTeam} · {hardest.distance}ft · {hardest.launchAngle}°</div>
      </div>}
    </div>}

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
            <thead><tr style={{position:"sticky",top:0,zIndex:20,background:"var(--surface2)"}}>
              <th style={{width:24,cursor:"default",background:"var(--surface2)"}}>#</th>
              {[
                {key:"chronoIndex",label:"Time (ET)", tip:"Sorted newest HR first by inning/at-bat"},
                {key:"batterTeam", label:"Team",     tip:"Batter's team"},
                {key:"batterName", label:"Batter",   tip:"Batter name"},
                {key:"rbi",        label:"Type / RBI",tip:"HR type and RBIs"},
                {key:"inning",     label:"Inning",   tip:"Inning hit"},
                                {key:"launchAngle",label:"Angle",    tip:"Launch angle °. 25–35° = HR sweet spot"},
                {key:"exitVelo",   label:"Exit Velo",tip:"Exit velocity mph. 95+ = hard hit, 103+ = elite"},
                {key:"distance",   label:"Distance", tip:"Estimated distance in feet"},
                {key:"pitchType",  label:"Pitch",    tip:"Pitch type thrown"},
                {key:"pitcherName",label:"vs Pitcher",tip:"Pitcher who gave it up"},
                {key:"gameId",     label:"Game",     tip:"Matchup"},
              ].map(c => (
                <th key={c.key} className={sortKey===c.key?"sk":""} onClick={()=>hs(c.key)} style={{cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:2}}>
                    <Tip text={c.tip}><span>{c.label}</span></Tip>
                    {sortKey===c.key && <span style={{color:"var(--accent)"}}>{sortDir<0?"↓":"↑"}</span>}
                  </div>
                </th>
              ))}
            </tr></thead>
            <tbody>
              {sorted.map((hr, i) => {
                const badgeCls = hr.rbi===4?"slam":hr.rbi>=2?"multi":"solo";
                const evC = (hr.exitVelo||0)>=103?"dng":(hr.exitVelo||0)>=95?"hot":(hr.exitVelo||0)>=90?"warm":"avg";
                const distC = (hr.distance||0)>=440?"dng":(hr.distance||0)>=420?"hot":(hr.distance||0)>=400?"warm":"avg";
                return <tr key={i}>
                <td><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,color:i<3?"var(--accent)":"var(--muted)"}}>{i+1}</span></td>
                <td><span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,color:"var(--text)"}}>{hr.timeET&&hr.timeET!==""?hr.timeET:`Inn. ${hr.inning}`}</span></td>
                <td><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,color:"var(--text)"}}>{hr.batterTeam}</span></td>
                <td><div className="pn">{hr.batterName}</div></td>
                <td>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span className={`hr-badge ${badgeCls}`}>{hr.hrType}</span>
                <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:16,color:hr.rbi>=2?"var(--accent)":"var(--text)"}}>{hr.rbi} RBI</span>
                </div>
                </td>
                <td><span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{hr.halfInning==="top"?"▲":"▼"} {hr.inning}</span></td>
                          <td><span className={`sv ${hr.launchAngle>=25&&hr.launchAngle<=35?"good":"avg"}`}>{hr.launchAngle!=null?`${hr.launchAngle}°`:"—"}</span></td>
                <td><span className={`sv ${evC}`}>{hr.exitVelo!=null?`${hr.exitVelo}`:"—"}</span></td>
                <td><span className={`sv ${distC}`}>{hr.distance!=null?`${hr.distance}ft`:"—"}</span></td>
                <td>{hr.pitchType?<span style={{fontSize:10,fontFamily:"'DM Mono',monospace",padding:"2px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{hr.pitchType}</span>:"—"}</td>
                <td><div style={{fontSize:11,fontWeight:500}}>{hr.pitcherName}</div><div style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>{hr.pitcherTeam}</div></td>
                <td><span style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:"var(--muted)"}}>{hr.gameId}</span></td>
                </tr>;
              })}
            </tbody>
          </table></div>
    }
  </div>;
}


function OnlyHomersTab() {
  return <div>
    <div className="section-header" style={{marginBottom:16}}>
      <div className="section-title">⚾ Only Homers</div>
      <div className="section-sub">Affiliate partner · the #1 home run community</div>
    </div>
    {/* Affiliate disclosure */}
    <div style={{background:"rgba(245,166,35,.06)",border:"1px solid rgba(245,166,35,.2)",borderRadius:8,padding:"8px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:10,color:"var(--accent2)",fontFamily:"'DM Mono',monospace"}}>🤝 Affiliate Partner</span>
      <span style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>— Going Yard may earn a commission when you sign up via this link.</span>
      <a href="https://www.onlyhomers.com/" target="_blank" rel="noopener noreferrer"
        style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:6,background:"var(--accent)",color:"white",fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,letterSpacing:1,textDecoration:"none",flexShrink:0}}>
        ↗ Open in New Tab
      </a>
    </div>
    {/* Embedded iframe */}
    <div style={{borderRadius:10,overflow:"hidden",border:"1px solid var(--border)",background:"var(--surface)",position:"relative",paddingBottom:"75%",height:0}}>
      <iframe
        title="Only Homers"
        src="https://www.onlyhomers.com/"
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

function LiveSportsTab() {
  const [tried, setTried] = useState(false);
  return <div>
    <div className="section-header" style={{marginBottom:16}}>
      <div className="section-title">📺 Live Sports</div>
      <div className="section-sub">Live streams · sports broadcasts via thetvapp.to</div>
    </div>

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
    <div className="section-header" style={{marginBottom:16}}>
      <div className="section-title">📊 Linemate</div>
      <div className="section-sub">Affiliate partner · MLB player props & lineup tool</div>
    </div>
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
  "A+": {color:"#ff4020",bg:"rgba(255,64,32,.18)",border:"rgba(255,64,32,.4)",  label:"A+"},
  "A":  {color:"#ff6535",bg:"rgba(255,101,53,.14)",border:"rgba(255,101,53,.35)",label:"A"},
  "B+": {color:"#ff8020",bg:"rgba(255,128,32,.14)",border:"rgba(255,128,32,.3)", label:"B+"},
  "B":  {color:"#ffa030",bg:"rgba(255,160,48,.12)",border:"rgba(255,160,48,.28)",label:"B"},
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
        const batters = await fetchLiveBatters(gamePk);
        const bid = parseInt(batterId);
        const found = batters.find(b => b.id === bid || String(b.id) === String(batterId));
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
  if (w <= 1.05) s += 3; else if (w <= 1.20)  s += 2; else if (w <= 1.32) s += 1;
  if (b <= 2.0)  s += 2; else if (b <= 2.8)   s += 1;
  if (h <= 0.8)  s += 2; else if (h <= 1.1)   s += 1;
  if (av <= .210) s += 2; else if (av <= .235) s += 1;
  if (ob <= .270) s += 2; else if (ob <= .310) s += 1;
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

  const grade = stats ? gradeStats(stats.era, stats.k9, stats.whip, stats.bb9, stats.hr9, stats.avg, stats.obp) : null;
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
        ? <span style={{color:grade.color,fontWeight:700,letterSpacing:.3}}>{grade.label}</span>
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
function BatterLeaderboard() {
  const [sortCol, setSortCol] = useState('avgEV');
  const [sortDir, setSortDir] = useState('desc');
  const [teamFilter, setTeamFilter] = useState('all');
  const [searchQ, setSearchQ] = useState('');
  const [minPA, setMinPA] = useState(10);
  const [selectedWin, setSelectedWin] = useState('last7');
  const [players, setPlayers] = useState([]);
  const [showPicksOnly, setShowPicksOnly] = useState(false);
  const picks = usePicks();
  const bprops = useBatterProps();

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

  // Window buttons config
  const WIN_BTNS = [
    { key:'last7',     label:'L7',         tip:'Last 7 days' },
    { key:'last14',    label:'L14',        tip:'Last 14 days' },
    { key:'last30',    label:'L30',        tip:'Last 30 days' },
    { key:'last60',    label:'L60',        tip:'Last 60 days' },
    { key:'season2026',label:'2026',       tip:'2026 season' },
    { key:'season2025',label:'2025',       tip:'2025 season' },
  ];

  // Statcast cols that support windowing from at-bat log
  // Statcast-only columns — windowed for both rolling and season windows
  const SC_WIN_KEYS = new Set(['avgEV','barrel','hardHit','flyBall','gbPct','launchAngle','pa','ab']);
  // Full-season windows pull ALL stats from the window (not just Statcast)
  const SEASON_WINS = new Set(['season2025','season2026']);

  // Resolve a stat from the selected window with correct fallback logic:
  // - Rolling windows (L7/L14/L30/L60): only Statcast cols are windowed;
  //   traditional stats (BA/OBP/HR etc.) always show 2026 season from Savant
  // - Season windows (season2025/season2026): ALL stats come from that season's window
  const ws = (p, key) => {
    const w = p.windows?.[selectedWin];
    if (SEASON_WINS.has(selectedWin)) {
      // For a full season window, use the pipeline value if it exists
      if (w && w[key] != null && w[key] !== 0) return w[key];
      // season2026 can fall back to top-level Savant fields (same season)
      if (selectedWin === 'season2026') return p[key] ?? 0;
      // season2025 with no data — show blank (0) rather than wrong 2026 data
      return 0;
    }
    // Rolling window — only window Statcast cols, rest always from season top-level
    if (!SC_WIN_KEYS.has(key)) return p[key] ?? 0;
    if (w && w[key] != null && w[key] !== 0) return w[key];
    return p[key] ?? 0;
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

  const filtered = allPlayers
    .filter(p => {
      // For season2025: player must have actual 2025 pipeline data — no fallback
      // This eliminates 2026 rookies, minPA=0 edge case, and unpopulated pipeline data
      if (selectedWin === 'season2025') {
        const w25 = p.windows?.season2025;
        if (!w25 || !w25.pa) return false;
        return w25.pa >= Math.max(minPA, 1);
      }
      return (ws(p,'pa') || 0) >= minPA;
    })
    .filter(p => teamFilter === 'all' || p.team === teamFilter)
    .filter(p => !searchQ || p.name?.toLowerCase().includes(searchQ.toLowerCase()))
    .filter(p => !showPicksOnly || picks[String(p.pid)])
    .sort((a, b) => {
      const av = sortCol === 'name' ? (a.name||'') : ws(a, sortCol) ?? (a[sortCol] ?? 0);
      const bv = sortCol === 'name' ? (b.name||'') : ws(b, sortCol) ?? (b[sortCol] ?? 0);
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
    { key:'kPct', label:'K%',  render: p => { const v=ws(p,'kPct'); return <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:v>=28?'var(--ice)':'var(--muted)'}}>{fmtPct(v)}</span>; }},
    { key:'bbPct',label:'BB%', render: p => { const v=ws(p,'bbPct'); return <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:v>=12?'#27c97a':'var(--muted)'}}>{fmtPct(v)}</span>; }},
  ];

  const SortIcon = ({col}) => sortCol===col
    ? <span style={{marginLeft:3,fontSize:9,opacity:.8}}>{sortDir==='desc'?'▼':'▲'}</span>
    : null;

  return (
    <div>
      {/* Controls row */}
      <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flex:'1 1 200px',minWidth:160}}>
          <input type="text" value={searchQ} onChange={e=>setSearchQ(e.target.value)}
            placeholder="Search batter…"
            style={{width:'100%',padding:'7px 28px 7px 28px',background:'var(--surface2)',
              border:'1px solid var(--border)',borderRadius:7,color:'var(--text)',
              fontFamily:"'DM Mono',monospace",fontSize:11,outline:'none',boxSizing:'border-box'}}/>
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
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace",whiteSpace:'nowrap'}}>Min PA:</span>
          <input type="number" min={0} max={600} value={minPA}
            onChange={e=>setMinPA(Math.max(0,parseInt(e.target.value)||0))}
            style={{width:54,padding:'6px 8px',background:'var(--surface2)',
              border:'1px solid var(--border)',borderRadius:7,color:'var(--text)',
              fontFamily:"'DM Mono',monospace",fontSize:11,outline:'none',textAlign:'center'}}/>
        </div>
        <button onClick={()=>setShowPicksOnly(s=>!s)}
          style={{padding:'6px 12px',borderRadius:7,cursor:'pointer',
            border:`1px solid ${showPicksOnly?'var(--accent2)':'var(--border)'}`,
            background:showPicksOnly?'rgba(245,166,35,.12)':'var(--surface2)',
            color:showPicksOnly?'var(--accent2)':'var(--muted)',
            fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:showPicksOnly?700:400,
            whiteSpace:'nowrap',transition:'all .15s'}}>
          🎯 {showPicksOnly ? 'My Picks ✓' : 'My Picks'}
        </button>
        <button onClick={()=>{
          const esc = v => `"${String(v??'').replace(/"/g,'""')}"`;
          const hdrs = ['Team','PA','Avg EV','Brl%','HH%','FB%','GB%','Avg LA','BA','OBP','SLG','OPS','HR','K%','BB%'];
          const rows = [['Batter','Prop',...hdrs].map(esc).join(',')];
          filtered.forEach(p => {
            const propVal = bprops[String(p.pid)]||'';
            const propOpt = propVal ? BATTER_PROP_OPTS.find(o=>o.value===propVal) : null;
            const f3 = v => v>0?'.'+String(Math.round(v*1000)).padStart(3,'0'):'';
            const f1 = v => v>0?v.toFixed(1):'';
            rows.push([
              esc(p.name), esc(propOpt?.label||''),
              esc(p.team||''), esc(p.pa||0),
              esc(f1(p.avgEV)), esc(f1(p.barrel)), esc(f1(p.hardHit)),
              esc(f1(p.flyBall)), esc(f1(p.gbPct)), esc(f1(p.launchAngle)),
              esc(f3(p.avg)), esc(f3(p.obp)), esc(f3(p.slg)), esc(f3(p.ops)),
              esc(p.hr||0), esc(f1(p.kPct)), esc(f1(p.bbPct)),
            ].join(','));
          });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(new Blob(['\uFEFF'+rows.join('\n')],{type:'text/csv;charset=utf-8;'}));
          a.download = `batters-${selectedWin}-${new Date().toISOString().slice(0,10)}.csv`;
          a.click();
        }} style={{padding:'6px 11px',borderRadius:7,cursor:'pointer',
          border:'1px solid var(--border)',background:'var(--surface2)',
          color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:11,
          whiteSpace:'nowrap',transition:'all .15s'}} title="Export current view to CSV">
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
              <tr>
                <th style={{width:36,textAlign:'center'}}></th>
                <th style={{textAlign:'left',cursor:'pointer',whiteSpace:'nowrap'}} className={sortCol==='name'?'sk':''} onClick={()=>handleSort('name')}>
                  Batter<SortIcon col="name"/>
                </th>
                <th style={{textAlign:'center',whiteSpace:'nowrap'}}>PROP</th>
                {STAT_COLS.map(c=>(
                  <th key={c.key} className={sortCol===c.key?'sk':''} style={{textAlign:'right',cursor:'pointer',whiteSpace:'nowrap'}}
                    onClick={()=>handleSort(c.key)}>
                    {c.label}<SortIcon col={c.key}/>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,300).map(p=>{
                const propVal = bprops[String(p.pid)] || '';
                const propOpt = BATTER_PROP_OPTS.find(o=>o.value===propVal) || BATTER_PROP_OPTS[0];
                return (
                  <tr key={p.pid} className="dr">
                    {/* Pick button — first */}
                    <td style={{textAlign:'center',paddingRight:2}}>
                      <PickButton pid={p.pid} name={p.name} team={p.team}/>
                    </td>
                    {/* Batter name */}
                    <td style={{textAlign:'left'}}>
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        <PosAvatar player={p} size={24}/>
                        <div>
                          <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,letterSpacing:.3}}>{p.name}</div>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)'}}>{p.hand}HB · {p.pos||'—'}</div>
                        </div>
                      </div>
                    </td>
                    {/* Prop dropdown — right after name */}
                    <td style={{textAlign:'center',paddingLeft:4,paddingRight:4}}>
                      <select
                        value={propVal}
                        onChange={e => setBatterProp(p.pid, e.target.value)}
                        style={{
                          padding:'3px 5px',
                          background: propVal ? 'rgba(0,0,0,.35)' : 'var(--surface2)',
                          border:`1px solid ${propVal ? propOpt.color : 'var(--border)'}`,
                          borderRadius:6,
                          color: propVal ? propOpt.color : 'var(--muted)',
                          fontFamily:"'DM Mono',monospace",
                          fontSize:10,fontWeight:propVal?700:400,
                          cursor:'pointer',outline:'none',minWidth:62,
                        }}>
                        {BATTER_PROP_OPTS.map(o=>(
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                    {/* Stat columns */}
                    {STAT_COLS.map(c=>(
                      <td key={c.key} style={{textAlign:'right'}}>
                        {c.render(p)}
                      </td>
                    ))}
                  </tr>
                );
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
  const [pitchers, setPitchers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [sortCol, setSortCol]       = useState('era');
  const [sortDir, setSortDir]       = useState('asc');
  const [teamFilter, setTeamFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('SP'); // all | SP | RP
  const [searchQ, setSearchQ]       = useState('');
  const [minIP, setMinIP]           = useState(5);
  const [gradeFilter, setGradeFilter] = useState('all');

  // Static MLB team ID → abbreviation map (IDs are stable across seasons)
  const TEAM_ABBR = {
    133:'OAK',134:'PIT',135:'SD',136:'SEA',137:'SF',138:'STL',
    139:'TB',140:'TEX',141:'TOR',142:'MIN',143:'PHI',144:'ATL',
    145:'CWS',146:'MIA',147:'NYY',158:'MIL',108:'LAA',109:'ARI',
    110:'BAL',111:'BOS',112:'CHC',113:'CIN',114:'CLE',115:'COL',
    116:'DET',117:'HOU',118:'KC',119:'LAD',120:'WSH',121:'NYM',
  };

  useEffect(()=>{
    const season = new Date().getFullYear();
    fetch(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&gameType=R&season=${season}&sportId=1&limit=2000&playerPool=ALL`)
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
    .filter(p => teamFilter === 'all' || p.team === teamFilter)
    .filter(p => roleFilter === 'all' || (roleFilter==='SP' ? p.gs > 0 : p.gs === 0))
    .filter(p => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()))
    .filter(p => gradeFilter === 'all' || p._grade.label === gradeFilter)
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
      render: p => <div>
        <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,letterSpacing:.3}}>{p.name}</div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--muted)'}}>{p.gs>0?'SP':'RP'} · {p.gp}G{p.gs>0?` · ${p.gs}GS`:''}</div>
      </div>
    },
    { key:'team',   label:'Team',   render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:'var(--accent2)',fontWeight:700}}>{p.team}</span> },
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
    { key:'era',    label:'ERA',    render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,color:eraCol(p.era)}}>{fmtDec(p.era)}</span> },
    { key:'whip',   label:'WHIP',   render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:whipCol(p.whip)}}>{fmtDec(p.whip)}</span> },
    { key:'k9',     label:'K/9',    render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:k9Col(p.k9)}}>{fmtDec(p.k9)}</span> },
    { key:'bb9',    label:'BB/9',   render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:bb9Col(p.bb9)}}>{fmtDec(p.bb9)}</span> },
    { key:'hr9',    label:'HR/9',   render: p => <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:hr9Col(p.hr9)}}>{fmtDec(p.hr9)}</span> },
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
    <div>
      {/* Controls */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flex:'1 1 180px',minWidth:150}}>
          <input type="text" value={searchQ} onChange={e=>setSearchQ(e.target.value)}
            placeholder="Search pitcher…"
            style={{width:'100%',padding:'7px 28px 7px 28px',background:'var(--surface2)',
              border:'1px solid var(--border)',borderRadius:7,color:'var(--text)',
              fontFamily:"'DM Mono',monospace",fontSize:11,outline:'none',boxSizing:'border-box'}}/>
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
          const rows = [['Pitcher','Team','Role','Grade','W','L','ERA','WHIP','K/9','BB/9','HR/9','IP','K','HR','BAA','OBP','OPS'].map(esc).join(',')];
          filtered.forEach(p => {
            const f2 = v => (v!=null&&!isNaN(v)&&v<99)?v.toFixed(2):'';
            const f3 = v => v>0?'.'+String(Math.round(v*1000)).padStart(3,'0'):'';
            rows.push([
              esc(p.name), esc(p.team), esc(p.gs>0?'SP':'RP'),
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
          a.download = `pitchers-${role}-${new Date().toISOString().slice(0,10)}.csv`;
          a.click();
        }} style={{padding:'6px 11px',borderRadius:7,cursor:'pointer',
          border:'1px solid var(--border)',background:'var(--surface2)',
          color:'var(--muted)',fontFamily:"'DM Mono',monospace",fontSize:11,
          whiteSpace:'nowrap',transition:'all .15s'}} title="Export current view to CSV">
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
                {g === 'all' ? 'All Grades' : g}
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
                  <th key={c.key} className={sortCol===c.key?'sk':''} style={{textAlign:c.align||'right',cursor:'pointer',whiteSpace:'nowrap'}}
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


function MatchupEngineTab() {
  const [subTab, setSubTab]        = useState('matchups');
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selGame, setSelGame]     = useState('all');
  const [selGrade, setSelGrade]    = useState('all');
  const [expandedId, setExpanded] = useState(null);
  const [generated, setGenerated] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQ, setSearchQ]     = useState('');
  const liveCache = useRef({});
  const pitcherGradeCache = useRef({});
  const [selPitcherGrade, setSelPitcherGrade] = useState('all');
  const picks = usePicks();

  useEffect(() => {
    fetch('/data/daily_summary.csv')
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.text(); })
      .then(text => {
        const rows = parseCSVText(text);
        setData(rows);
        // Extract generated date from first row if available
        if (rows.length > 0 && rows[0].data_anchor) setGenerated(rows[0].data_anchor);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
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
  data.forEach(r => {
    if (r.game_id && !seen.has(r.game_id)) {
      seen.add(r.game_id);
      games.push({ id: r.game_id, time: r.game_time || '', label: `${r.batting_team} game` });
    }
  });
  // Sort games earliest → latest
  games.sort((a, b) => timeToMins(a.time) - timeToMins(b.time));

  // Group by game_id, then by batting_team
  const grouped = {};
  (selGame === 'all' ? data : data.filter(r => r.game_id === selGame))
    .filter(r => selGrade === 'all' || r.grade === selGrade)
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
    // Fetch final/live box score for ALL batters grouped by game_id
    // Works for live games, final games, and anything in between
    const uniqueGames = [...new Set(data.map(b => b.game_id).filter(Boolean))];
    await Promise.all(uniqueGames.map(async gameId => {
      try {
        const batters = await fetchLiveBatters(gameId);
        if (!batters || batters.length === 0) return;
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
    const rows = data.map(b => {
      const bid = parseInt(b.batter_id) || 0;
      const gy = HR_DATA.some(h => h.batterId === bid ||
        (b.batter && h.batterName && h.batterName.toLowerCase() === b.batter.toLowerCase()));
      const live = liveCache.current[String(bid)] || null;
      const pitchCleanId = b.pitcher_id ? String(parseInt(b.pitcher_id)||b.pitcher_id) : '';
      const pitcherGrade = pitcherGradeCache.current[pitchCleanId] || '';
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
      ].map(esc).join(',');
    });
    const csv = bom + headers.map(esc).join(',') + String.fromCharCode(10) + rows.join(String.fromCharCode(10));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
    a.download = 'key-matchups-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
  };

  const gc = (g) => GRADE_CFG[g] || GRADE_CFG['D'];
  const pct = (v) => v && parseFloat(v) > 0 ? `${parseFloat(v).toFixed(1)}%` : '—';
  const num = (v, d=1) => v && parseFloat(v) > 0 ? parseFloat(v).toFixed(d) : '—';
  const flag = (v) => v === 'TRUE' || v === true || v === 1 || v === '1';

  // Sub-tab styles
  const stBtn = (key) => ({
    padding:'7px 16px', borderRadius:7, cursor:'pointer', border:'none',
    fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:12, letterSpacing:.8,
    textTransform:'uppercase',
    background: subTab===key ? 'var(--accent)' : 'var(--surface2)',
    color: subTab===key ? 'white' : 'var(--muted)',
    borderBottom: subTab===key ? '2px solid var(--accent)' : '2px solid transparent',
    transition:'all .15s',
  });

  return <div>
    {/* Header */}
    <div className="hrow" style={{marginBottom:12}}>
      <div>
        <div className="section-title">⚡ Matchup Engine</div>
        <div className="section-sub">
          {subTab==='matchups' && <>Daily HR projections · flags · sim stats{generated && <span style={{marginLeft:8,fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>anchored {generated}</span>}</>}
          {subTab==='batters'  && 'Season Statcast · sorted by Avg EV · Statcast-powered'}
          {subTab==='pitchers' && 'Season pitching stats · live from MLB Stats API'}
        </div>
      </div>
      {subTab==='matchups' && (
        <button onClick={()=>exportCSV()}
          style={{padding:"5px 12px",borderRadius:6,cursor:"pointer",
            background:"var(--surface2)",border:"1px solid var(--border)",
            color:"var(--muted)",fontFamily:"'DM Mono',monospace",
            fontSize:11,display:"flex",alignItems:"center",gap:5}}>
          ⬇ CSV
        </button>
      )}
    </div>

    {/* Sub-tab navigation */}
    <div style={{display:'flex',gap:6,marginBottom:18,padding:'4px',background:'var(--surface)',borderRadius:9,border:'1px solid var(--border)',width:'fit-content'}}>
      <button style={stBtn('matchups')} onClick={()=>setSubTab('matchups')}>⚡ Matchups</button>
      <button style={stBtn('batters')}  onClick={()=>setSubTab('batters')}>🧢 Batters</button>
      <button style={stBtn('pitchers')} onClick={()=>setSubTab('pitchers')}>⚾ Pitchers</button>
    </div>

    {/* Batter Leaderboard */}
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
    {!loading && !error && data.length > 0 && (() => {
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
                      <div style={{width:28,height:28,borderRadius:'50%',
                        background:'var(--surface)',border:'1px solid var(--border)',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontFamily:"'Oswald',sans-serif",fontWeight:700,
                        fontSize:10,flexShrink:0}}>
                        {ini(p.name)}
                      </div>
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

    {/* Grade legend */}
    <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
      {Object.entries(GRADE_CFG).map(([g,c])=>(
        <div key={g} style={{padding:'2px 10px',borderRadius:6,background:c.bg,
          border:`1px solid ${c.border}`,color:c.color,
          fontFamily:"'Oswald',sans-serif",fontWeight:800,fontSize:11,letterSpacing:.5}}>
          {g}
        </div>
      ))}
      <div style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
        alignSelf:'center',marginLeft:4}}>
        A+(6-8 flags) A(4-5) B+(3) B(2) C(1) D(0)
      </div>
    </div>

    {/* Game filter */}
    {games.length > 1 && <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
      <button onClick={()=>setSelGame('all')}
        style={{padding:'4px 14px',borderRadius:6,cursor:'pointer',
          background:selGame==='all'?'var(--accent)':'var(--surface2)',
          color:selGame==='all'?'white':'var(--muted)',
          border:`1px solid ${selGame==='all'?'var(--accent)':'var(--border)'}`,
          fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:selGame==='all'?700:400}}>
        All Games
      </button>
      {games.map(g => {
        // Build a nicer label by finding the two teams for this game
        const teamsInGame = [...new Set(data.filter(r=>r.game_id===g.id).map(r=>r.batting_team))];
        const label = teamsInGame.length === 2 ? `${teamsInGame[0]} vs ${teamsInGame[1]}` : g.id;
        const active = selGame === g.id;
        return <button key={g.id} onClick={()=>setSelGame(g.id)}
          style={{padding:'4px 14px',borderRadius:6,cursor:'pointer',
            background:active?'rgba(232,65,26,.15)':'var(--surface2)',
            color:active?'var(--accent)':'var(--muted)',
            border:`1px solid ${active?'rgba(232,65,26,.35)':'var(--border)'}`,
            fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:active?700:400}}>
          {label}
        </button>;
      })}
    </div>}

    {/* Grade filter */}
    {!loading && !error && data.length > 0 && <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
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
    </div>}
    {loading && <div className="lw"><div className="sp"/><div className="lt">Loading matchup data…</div></div>}
    {/* Pitcher grade filter */}
    {!loading && !error && data.length > 0 && <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
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
          {g==='all'?'All':g}
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
            {teamPairs.map(t=>t.team).join(' vs ')}
          </span>
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
                vs {team.pitcher} · {team.pitchMix}
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
                    💥 Gone Yard
                  </div>}

                  {/* Batter name + hand */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:14,
                      whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
                      color:'var(--text)'}}>
                      {b.batter}
                      <span style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono',monospace",
                        marginLeft:6}}>{b.batter_hand}HB</span>
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

                  {/* Key stats */}
                  <div style={{display:'flex',gap:8,flexShrink:0,alignItems:'center'}}>
          {totalFlags > 0 && <div style={{textAlign:'center',flexShrink:0}}>
            <div style={{letterSpacing:1,lineHeight:1,fontSize:11}}>
              {Array.from({length:Math.min(totalFlags,8)}).map((_,si)=><span key={si}>⭐</span>)}
            </div>
          </div>}
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
                    {title:'📅 Recent L7',pa:b.recent_pa,ev:b.recent_avg_ev,brl:b.recent_barrel_pct,fb:b.recent_fb_pct,la:b.recent_avg_la,
                      flags:[flag(b.recent_ev_flag),flag(b.recent_barrel_flag),flag(b.recent_fb_flag),flag(b.recent_la_flag)]},
                    {title:'🆚 BvP Pitch Mix',pa:b.bvp_pa,ev:b.bvp_avg_ev,brl:b.bvp_barrel_pct,fb:b.bvp_fb_pct,la:b.bvp_avg_la,
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

                {/* Environment */}
                <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
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
                  
                </div>
                {/* Live box score — fetches real game data */}
                <LiveBatterBox batterId={b.batter_id} gamePk={b.game_id} onData={(id,d)=>{liveCache.current[id]=d;}}/>
              </div>}
            </div>;
          })}
        </div>)}
      </div>;
    })}
    </>}
  </div>;
}


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
        <div style={{width:80,height:80,borderRadius:18,background:"linear-gradient(135deg,#0d1a28,#1a2a38)",
          border:"2px solid rgba(232,65,26,.4)",display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:42,boxShadow:"0 8px 32px rgba(232,65,26,.25)"}}>
          💥
        </div>
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
      <Step n="4" text={<>Tap <strong>"Add"</strong> in the top right — the 💥 icon appears on your home screen</>}/>
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

  return <div>
    {/* Header */}
    <div className="section-header" style={{marginBottom:16}}>
      <div className="section-title">📊 Data</div>
      <div className="section-sub">Power BI · interactive analytics · full screen available</div>
    </div>

    {/* Add to My Picks — now at top */}
    {/* Add to My Picks */}
    <div style={{marginTop:14,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px"}}>
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
              <div style={{width:30,height:30,borderRadius:"50%",background:"var(--surface)",
                border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,flexShrink:0}}>
                {ini(p.name)}
              </div>
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
    </div>

    {/* Power BI iframe */}
    <div style={{
      borderRadius:10, overflow:"hidden",
      border:"1px solid var(--border)", background:"var(--surface)",
      position:"relative", paddingBottom:"56.25%", height:0,
    }}>
      <iframe
        title="Going Yard Analytics"
        src="https://app.powerbi.com/view?r=eyJrIjoiYTQzOGZmMWMtOWZmMy00Y2NhLWE1NWUtZDljZmFkYWFhODg0IiwidCI6IjgzOGY2MGI3LTc4NzYtNGEwZC1iM2MxLTg1Y2VlZWE1YmJhYiIsImMiOjF9"
        frameBorder="0"
        allowFullScreen
        style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
      />
    </div>

    {/* Open in Power BI button */}
    <div style={{marginTop:10,display:"flex",gap:8,justifyContent:"flex-end"}}>
      <a href="https://app.powerbi.com/view?r=eyJrIjoiYTQzOGZmMWMtOWZmMy00Y2NhLWE1NWUtZDljZmFkYWFhODg0IiwidCI6IjgzOGY2MGI3LTc4NzYtNGEwZC1iM2MxLTg1Y2VlZWE1YmJhYiIsImMiOjF9" target="_blank" rel="noopener noreferrer"
        style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:6,
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
    <div title={cfg.tip + (lastOk ? ` · ${lastOk}` : "")} style={{display:"flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:20,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",cursor:"default"}}>
      <div style={{width:6,height:6,borderRadius:"50%",background:cfg.dot,boxShadow:status==="live"?`0 0 6px ${cfg.dot}`:"none",animation:status==="live"?"pulse 1.5s ease-in-out infinite":"none"}}/>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:cfg.dot,letterSpacing:.5,textTransform:"uppercase"}}>{cfg.text}</span>
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
  return <div>
    <div className="section-header" style={{marginBottom:16}}>
      <div className="section-title">📊 Baseball Savant</div>
      <div className="section-sub">Affiliate partner · Statcast data, spray charts, leaderboards</div>
    </div>

    {/* Player Picker */}
    <div style={{marginBottom:14,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px"}}>
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
              <PosAvatar player={p} size={30}/>
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
    </div>

    <div style={{background:"rgba(56,184,242,.06)",border:"1px solid rgba(56,184,242,.2)",borderRadius:8,padding:"8px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:10,color:"var(--ice)",fontFamily:"'DM Mono',monospace"}}>🤝 Affiliate Partner</span>
      <span style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>— Going Yard uses Baseball Savant data to power its Statcast metrics.</span>
      <a href="https://baseballsavant.mlb.com/" target="_blank" rel="noopener noreferrer"
        style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:6,background:"var(--ice)",color:"#0a1218",fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:12,letterSpacing:1,textDecoration:"none",flexShrink:0}}>
        ↗ Open in New Tab
      </a>
    </div>
    <div style={{borderRadius:10,overflow:"hidden",border:"1px solid var(--border)",background:"var(--surface)",position:"relative",paddingBottom:"75%",height:0}}>
      <iframe
        title="Baseball Savant"
        src="https://baseballsavant.mlb.com/"
        frameBorder="0"
        allowFullScreen
        style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
      />
    </div>
    <div style={{marginTop:8,fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textAlign:"center"}}>
      If the embed is blocked, use the ↗ Open in New Tab button above.
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
            {wd.stadium}
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
    setRefreshed(new Date().toLocaleTimeString('en-US',{
      hour:'numeric',minute:'2-digit',timeZone:'America/New_York'
    }));
    setLoading(false);
  };

  const load = () => {
    setLoading(true); setGames([]); setWeather({});
    // Clear cache for fresh data
    Object.keys(WEATHER_CACHE).forEach(k=>delete WEATHER_CACHE[k]);
    fetchGames(()=>{}, (gl)=>{
      const v=(gl||[]).filter(g=>g.home?.abbr&&g.home.abbr!=='???');
      setGames(v); loadWeather(v);
    }, ()=>{setLoading(false);});
  };

  useEffect(()=>{ load(); },[]);

  // Summary stats
  const out   = games.filter(g=>{const w=weather[g.home?.abbr]; return w&&!w.isDome&&(w.hourly||[]).find(h=>h.hour===parseGameHour(g.gameTime))?.windDir?.includes('out');}).length;
  const inp   = games.filter(g=>{const w=weather[g.home?.abbr]; return w&&!w.isDome&&(w.hourly||[]).find(h=>h.hour===parseGameHour(g.gameTime))?.windDir?.includes('in');}).length;
  const domes = games.filter(g=>weather[g.home?.abbr]?.isDome).length;
  const rain  = games.filter(g=>{const w=weather[g.home?.abbr]; const s=(w?.hourly||[]).find(h=>h.hour===parseGameHour(g.gameTime)); return (s?.rainChance||0)>=30;}).length;

  return (
    <div>
      {/* Header */}
      <div className="hrow" style={{marginBottom:16}}>
        <div className="section-header">
          <div className="section-title">🌤️ Game Day Weather</div>
          <div className="section-sub">
            Game-time forecast · field-relative wind · HR environment
            {refreshed&&<span style={{color:'var(--muted)',marginLeft:8}}>· Updated {refreshed}</span>}
          </div>
        </div>
        <button onClick={load}
          style={{padding:'6px 14px',borderRadius:6,border:'1px solid var(--border)',
            background:'var(--surface2)',color:'var(--text)',cursor:'pointer',
            fontFamily:"'DM Mono',monospace",fontSize:11,flexShrink:0}}>
          ↻ Refresh
        </button>
      </div>

      {loading
        ? <div className="lw"><div className="sp"/><div className="lt">Loading weather…</div></div>
        : games.length===0
        ? <div style={{padding:'60px 20px',textAlign:'center',color:'var(--muted)',
            fontFamily:"'DM Mono',monospace",fontSize:13}}>No games today.</div>
        : <>
          {/* Summary chips */}
          <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
            {[
              {label:'💨 Blowing Out', count:out,  color:'#ff8020'},
              {label:'❄️ Blowing In',  count:inp,  color:'#38b8f2'},
              {label:'🏟️ Domes',       count:domes,color:'var(--muted)'},
              {label:'🌧️ Rain Risk',   count:rain, color:'#60a0d0'},
            ].filter(s=>s.count>0).map(s=>(
              <div key={s.label} style={{padding:'5px 12px',borderRadius:8,
                background:'var(--surface)',border:`1px solid ${s.color}30`,
                fontFamily:"'DM Mono',monospace",fontSize:11,
                display:'flex',alignItems:'center',gap:6}}>
                <span style={{color:s.color,fontWeight:700,fontFamily:"'Oswald',sans-serif",fontSize:15}}>{s.count}</span>
                <span style={{color:'var(--muted)'}}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div style={{marginBottom:14,padding:'8px 14px',borderRadius:8,
            background:'rgba(56,184,242,.05)',border:'1px solid rgba(56,184,242,.15)',
            display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono',monospace"}}>
              ℹ️ Game-time hourly forecast · tap any game to expand hour-by-hour · wind direction relative to field
            </span>
            <a href="https://rotogrinders.com/weather/mlb" target="_blank" rel="noopener noreferrer"
              style={{fontSize:10,color:'var(--ice)',fontFamily:"'DM Mono',monospace",
                fontWeight:600,textDecoration:'none',flexShrink:0}}>
              RotoGrinders ↗
            </a>
          </div>

          {/* Game cards */}
          {games.map(g=>(
            <WeatherGameCard key={g.gamePk||g.id} g={g} wd={weather[g.home?.abbr]}/>
          ))}
        </>}
    </div>
  );
}


let _hrLog = [];
let _setHrLog = null;

function useHRNotifications() {
  const [queue, setQueue] = useState([]);
  const [log, setLog] = useState(_hrLog);

  useEffect(() => {
    _setHrLog = setLog;
    _notifyNewHR = (hr) => {
      // hrType = "Solo","2-Run","3-Run","Grand Slam" — all are HRs from this feed
      const notif = {
        id: Date.now() + Math.random(),
        batterName: hr.batterName || 'Unknown',
        batterTeam: hr.batterTeam || '',
        type: hr.hrType || 'Solo',
        rbi: hr.rbi || 0,
        exitVelo: hr.exitVelo || 0,
        distance: hr.distance || 0,
        inning: hr.inning || '',
        halfInning: hr.halfInning || 'top',
        time: new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'}),
      };
      setQueue(q => [...q.slice(-2), notif]);
      _hrLog = [notif, ..._hrLog].slice(0, 20);
      if (_setHrLog) _setHrLog([..._hrLog]);
    };
    return () => { _notifyNewHR = null; _setHrLog = null; };
  }, []);

  const dismiss = (id) => setQueue(q => q.filter(n => n.id !== id));
  const clearLog = () => { _hrLog = []; setLog([]); };
  return { queue, dismiss, log, clearLog };
}

function HRNotificationBanner({ notif, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [touching, setTouching] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);

  const typeMap = {
    'Grand Slam': { icon:'💥', label:'GRAND SLAM', color:'#ff4020', bg:'rgba(232,65,26,.22)' },
    '3-Run':      { icon:'💥', label:'3-RUN HR',   color:'#ff4020', bg:'rgba(232,65,26,.18)' },
    '2-Run':      { icon:'💥', label:'2-RUN HR',   color:'#ff8020', bg:'rgba(255,128,32,.16)' },
    'Solo':       { icon:'💥', label:'SOLO HR',    color:'#ffc840', bg:'rgba(255,200,64,.14)' },
  };
  const t = typeMap[notif.type] || typeMap['Solo'];

  useEffect(() => {
    const tin = setTimeout(() => setVisible(true), 50);
    const tout = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 400); }, 6000);
    return () => { clearTimeout(tin); clearTimeout(tout); };
  }, []);

  const handleTouchStart = (e) => { startY.current = e.touches[0].clientY; setTouching(true); };
  const handleTouchMove = (e) => {
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) setDragY(dy);
  };
  const handleTouchEnd = () => {
    setTouching(false);
    if (dragY < -40) { setVisible(false); setTimeout(onDismiss, 300); }
    else setDragY(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
      style={{
        position:'fixed', top:0, left:0, right:0, zIndex:9999,
        display:'flex', justifyContent:'center',
        pointerEvents:'auto',
        transform: visible ? `translateY(${dragY}px)` : 'translateY(-110%)',
        transition: touching ? 'none' : 'transform 0.35s cubic-bezier(.34,1.56,.64,1)',
      }}>
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
          fontSize:16, color:'var(--muted)', flexShrink:0,
          padding:'4px 8px', cursor:'pointer',
        }}>×</div>
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
  const { log, clearLog } = useHRNotifications();
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

  return (
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{position:'relative',padding:'5px 10px',borderRadius:6,
          border:'1px solid var(--border)',background:'var(--surface2)',
          cursor:'pointer',display:'flex',alignItems:'center',gap:5,
          color:unread>0?'var(--accent2)':'var(--muted)'}}>
        <span style={{fontSize:14}}>🔔</span>
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
                const t = typeMap[n.type] || typeMap['Solo'];
                return (
                  <div key={n.id} style={{padding:'8px 12px',
                    borderBottom:'1px solid rgba(255,255,255,.05)',
                    display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:16,flexShrink:0}}>{t.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
                        fontSize:12,color:'var(--text)',
                        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        {n.batterName}
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


export default function App() {
  const [tab, setTab] = useState("homeruns");
  const [showPicksSlideout, setShowPicksSlideout] = useState(false);

  // Load player data at startup
  useEffect(() => {
    loadGlobalPlayerMap();
    loadDailyPicks();
    const noop = () => {};
    fetchPlayers(noop, noop, noop, false);
  }, []);

  const NAV = [
    {key:"homeruns",  label:"💥 HR Tracker"},
    {key:"live",      label:"📡 Live"},
    {key:"matchup",   label:"⚡ Key Matchups"},
    {key:"weather",   label:"🌤️ Weather"},
    {key:"powerbi",   label:"📊 Data"},
    {key:"picks",     label:"🎯 My Picks"},
    {key:"statcast",  label:"📡 Statcast"},
    {key:"onlyhomers",label:"⚾ Only Homers"},
    {key:"linemate",  label:"📊 Linemate",  external:"https://linemate.io/mlb"},
    {key:"livesports",label:"📺 Live Sports",external:"https://thetvapp.to"},
    {key:"gambly",    label:"🤖 Gambly Bot", external:"https://gambly.com"},
    {key:"getapp",    label:"📲 Get App"},
  ];

  return <>
    <style>{styles}</style>
    <div className="app">
      <HRNotifications/>
      <header className="header">
        <div className="logo"><div className="logo-dot"/>⚾ <span>GOING</span> YARD</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}> 
          <DataStatusBadge/>
          <NotificationBell/>
          <button onClick={()=>setShowPicksSlideout(s=>!s)}
            style={{padding:"5px 12px",borderRadius:6,border:"1px solid var(--border)",
              background:"var(--surface2)",color:"var(--accent2)",cursor:"pointer",
              fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:11,letterSpacing:1,
              display:"flex",alignItems:"center",gap:5}}>
            🎯 Picks
          </button>
            </div>
      </header>
      <HRTicker onHRClick={()=>setTab("homeruns")}/>
      <nav className="tabs">
        {NAV.map(n=>(
          n.external
            ? <button key={n.key} className="tab"
                onClick={()=>window.open(n.external,"_blank","noopener,noreferrer")}
                style={{color:"var(--muted)",fontWeight:400,display:"flex",alignItems:"center",gap:4}}>
                {n.label} <span style={{fontSize:9,opacity:.6}}>↗</span>
              </button>
            : <button key={n.key} className={`tab ${tab===n.key?"active":""}`}
                onClick={()=>setTab(n.key)}
                style={{color:tab===n.key?"var(--accent)":undefined,fontWeight:tab===n.key?700:400}}>
                {n.label}
              </button>
        ))}
      </nav>
      <main className="content">
        <div style={{display:tab==="weather"?"block":"none"}}><WeatherTab/></div>
        {tab==="live"     && <LiveTab/>}
        {tab==="picks"    && <MyPicksTab/>}
        <div style={{display:tab==="powerbi"?"block":"none"}}><PowerBITab/></div>
        <div style={{display:tab==="statcast"?"block":"none"}}><StatcastTab/></div>
        <div style={{display:tab==="homeruns"?"block":"none"}}><HRTrackerTab/></div>
        <div style={{display:tab==="onlyhomers"?"block":"none"}}><OnlyHomersTab/></div>
        <div style={{display:tab==="getapp"?"block":"none"}}><GetAppTab/></div>
        <div style={{display:tab==="matchup"?"block":"none"}}><MatchupEngineTab/></div>
      </main>
      <div style={{textAlign:"center",padding:"12px 0 8px",borderTop:"1px solid var(--border)",marginTop:24}}>
        <span style={{fontSize:10,color:"#2a3a48",fontFamily:"'DM Mono',monospace",letterSpacing:1}}>
          Going Yard v3 · Build {BUILD_TIMESTAMP} · prsm-labs
        </span>
      </div>
    </div>
    <AtBatSlideIn/>
    {showPicksSlideout && <PicksSlideout onClose={()=>setShowPicksSlideout(false)}/>}
  </>;

}
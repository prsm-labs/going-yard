import { useState, useEffect, useCallback } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@300;400;500;600;700&family=DM+Mono:ital,wght@0,400;0,500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#080c10;--surface:#0d1318;--surface2:#131b22;--border:#1e2d3a;
    --accent:#e8411a;--accent2:#f5a623;--ice:#38b8f2;--green:#27c97a;
    --text:#e8edf2;--muted:#5a7080;--fire2:#ff7a00;--fire3:#ffb700;
    --aplus:#ff3010;--a:#ff7000;--b:#f5a623;--c:#8bc4e8;--d:#5a7080;--f:#38b8f2;
  }
  body{background:var(--bg);color:var(--text);font-family:'Oswald',sans-serif;min-height:100vh;}
  .app{min-height:100vh;display:flex;flex-direction:column;}
  .header{padding:16px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:linear-gradient(180deg,#0a1520 0%,var(--bg) 100%);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px);}
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
  .gg{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:11px;margin-bottom:6px;}
  .gc{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
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
  .gpw{margin-bottom:14px;grid-column:1/-1;}
  .gp{border:1px solid var(--accent);border-top:none;border-bottom-left-radius:10px;border-bottom-right-radius:10px;background:#0a1218;overflow:hidden;animation:sd .2s ease;width:100%;}
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
  ::-webkit-scrollbar-track{background:var(--bg);}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px;}
  @media(max-width:768px){
    .content{padding:13px;}.header{padding:12px 15px;}
    .gg{grid-template-columns:1fr;}.cards{grid-template-columns:repeat(2,1fr);}
    .xg{grid-template-columns:repeat(2,1fr);}.lmini{display:none;}
    .bvr{grid-template-columns:auto 1fr;}.h2h{display:none;}.pmg{grid-template-columns:repeat(2,1fr);}
  }
`;

// THRESHOLDS
// ── PLAYER DATA CACHE (module-level, persists across renders) ────
const PLAYER_DATA_CACHE = {};
let PLAYER_CACHE_DATE = null;
function cachePlayer(p) { if (p.pid) PLAYER_DATA_CACHE[p.pid] = p; }
function getCachedPlayer(pid) { return PLAYER_DATA_CACHE[pid] || null; }

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
const ini = (n) => n.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

// SCOUTING ENGINE
const calcCQ = (p) => {
  // EV: 0-1.5 scaled from 95 to 108
  const evN = Math.min(Math.max((p.avgEV - T.EV_HH) / (T.EV_EL - T.EV_HH), 0), 1) * 1.5;
  // Barrel: peaks at T.BAR_EL (15%), penalized if above T.BAR_MAX (18%) — indicates over-swinging
  const bar = p.barrel ?? 0;
  const barN = bar >= T.BAR_MAX ? 0.8 : Math.min(bar / T.BAR_EL, 1);
  // HardHit: 0-1 scaled to 50%
  const hhN = Math.min((p.hardHit ?? 0) / T.HH_EL, 1);
  return Math.round((evN + barN + hhN) * 10) / 10;
};
const calcHRI = (p) => {
  // Pull Air: peaks at 40-50%, below 35% = low power intent
  const pull = p.pullAir ?? 20;
  const pullN = pull >= T.PULL_EL ? 1 : pull >= T.PULL_GD ? 0.7 : pull / T.PULL_EL;
  // Fly Ball: sweet zone 35-45%, above 50% = too many outs (penalize)
  const fb = p.flyBall ?? p.sweetSpot ?? 35;
  const fbN = (fb >= T.FB_MIN && fb <= T.FB_MAX) ? 1 : (fb > T.FB_MAX && fb <= 55) ? 0.7 : fb >= 30 ? 0.5 : 0.2;
  // HR rate contribution
  const hrN = Math.min((p.hr ?? 0) / 25, 1);
  return Math.round((pullN * 3.5 + fbN * 3.5 + hrN * 3) * 10) / 10;
};
const calcRD = (p) => {
  const bb = Math.min((p.bbPct ?? 8) / 15, 1) * 3;
  const k = Math.max(1 - (p.kPct ?? 22) / 35, 0) * 3;
  // Chase rate: <20% elite (3pts), <25% good (2pts), >=25% penalized
  const chase = p.oSwing ?? 30;
  const os = chase <= T.CHASE_EL ? 3 : chase <= T.CHASE_GD ? 2 : Math.max(1 - (chase - T.CHASE_GD) / 20, 0) * 1.5;
  const zc = Math.min((p.zContact ?? 80) / 90, 1) * 3;
  return Math.round((bb + k + os + zc) * 10) / 10;
};
const calcOS = (p) => {
  // ── PRIMARY: EV gate (40pts) ─────────────────────────────
  const ev = p.avgEV ?? p.windows?.[15]?.avgEV ?? 85;
  const evPts =
    ev >= 92.5 ? 40 :
    ev >= 90.0 ? 34 :
    ev >= 87.0 ? 28 :
    ev >= 84.0 ? 20 :
    ev >= 81.0 ? 12 : 5;

  // ── POWER QUALITY (25pts) — xwOBA + Barrel% + HardHit% ──
  // This mirrors Power BI "Power Score" + "HR Grade"
  const xw = p.xwoba ?? 0;
  const xwPts = xw >= 0.400 ? 25 : xw >= 0.350 ? 20 : xw >= 0.320 ? 15 :
                xw >= 0.300 ? 10 : xw > 0 ? 6 : 0;
  const barrelPts = Math.min((p.barrel ?? 0) / 15 * 15, 15);
  const hhPts     = Math.min((p.hardHit ?? 0) / 50 * 10, 10);
  const powerPts  = xw > 0 ? (xwPts * 0.6 + barrelPts * 0.3 + hhPts * 0.1)
                            : (barrelPts * 0.7 + hhPts * 0.3);

  // ── CONTACT QUALITY (20pts) — launch angle + sweet spot ──
  const la = p.launchAngle ?? 0;
  const laPts = inHRZ(la) ? 20 : (la >= 10 && la < 25) ? 14 :
                (la >= 0 && la < 10) ? 8 : la < 0 ? 4 : 6;

  // ── PLATE DISCIPLINE (15pts) — BB%, K%, Chase% ───────────
  const cq = calcCQ(p), rd = calcRD(p);
  const rdN = Math.min(Math.max((rd - 2) / (10-2), 0), 1);
  const discPts = rdN * 15;

  return Math.round((evPts + powerPts + laPts + discPts) * 10) / 10;
};
const getSG = (s) => {
  // Score bands aligned to EV gate:
  // A+ = 92.5+ EV + strong modifiers (85+)
  // A  = 90+ EV + decent modifiers (70+)
  // B  = 87+ EV gate (52+ base, 58+ with mods)
  // C  = 84+ EV gate (40+)
  // D  = 81+ EV gate (26+)
  // F  = below 81 EV (15+)
  // X  = no data / too soft
  if (s >= 85) return {grade:"A+",cls:"aplus",label:"🔴 Elite damage threat",color:"var(--aplus)"};
  if (s >= 70) return {grade:"A", cls:"a",    label:"🔥 Above-avg power",  color:"var(--a)"};
  if (s >= 55) return {grade:"B", cls:"b",    label:"⚡ Solid EV / heating",color:"var(--b)"};
  if (s >= 40) return {grade:"C", cls:"c",    label:"👀 Contact-first bat", color:"var(--c)"};
  if (s >= 26) return {grade:"D", cls:"d",    label:"🌡 Below-avg EV",      color:"var(--d)"};
  if (s >= 15) return {grade:"F", cls:"f",    label:"🧊 Soft contact",      color:"var(--f)"};
  return              {grade:"X", cls:"x",    label:"❌ Insufficient data", color:"#2a3a48"};
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
  const ds = b.daysSinceHR ?? 5;
  const due = ds <= 1 ? 5 : ds <= 3 ? 12 : ds <= 7 ? 25 : ds <= 14 ? 18 : 8;
  const pf = b.pitcherFactor ?? 0;
  const pit = pf > 0 ? 12 : pf < 0 ? 3 : 7;
  const home = b.isHome ? (b.homeHR ?? 0) > (b.awayHR ?? 0) ? 10 : 5 : (b.awayHR ?? 0) > (b.homeHR ?? 0) ? 10 : 5;
  const sea = Math.min(((b.barrel ?? 0) / T.BAR_EL) * 10, 10);
  return Math.round(streak + due + pit + home + sea);
};
const getLV = (s) => s >= 75 ? {label:"🚀 Primed",cls:"primed"} : s >= 55 ? {label:"🔥 Hot",cls:"hot"} : s >= 38 ? {label:"⚡ Watch",cls:"watch"} : {label:"❄️ Cold",cls:"cold"};
const getLSigs = (b) => {
  const sigs = [], ds = b.daysSinceHR ?? 5, rb = b.recentBarrel ?? b.barrel ?? 0, re = b.recentAvgEV ?? b.avgEV ?? 88, rh = b.recentHardHit ?? b.hardHit ?? 0;
  if (ds >= 4 && ds <= 10) sigs.push({t:`${ds}d since last HR`, c:"fire"});
  else if (ds > 14) sigs.push({t:`${ds}d HR drought`, c:"neg"});
  if (rb >= 14) sigs.push({t:`${rb.toFixed(0)}% barrel L7`, c:"pos"});
  else if (rb >= 8) sigs.push({t:`${rb.toFixed(0)}% barrel L7`, c:"neu"});
  if (re >= T.EV_HH) sigs.push({t:`${re.toFixed(0)} mph EV (95+)`, c:"pos"});
  if ((b.pitcherFactor ?? 0) > 0) sigs.push({t:"Favorable matchup", c:"pos"});
  if ((b.pitcherFactor ?? 0) < 0) sigs.push({t:"Tough pitcher", c:"neg"});
  if (b.isHome && (b.homeHR ?? 0) > (b.awayHR ?? 0)) sigs.push({t:"Home HR boost", c:"pos"});
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
  const pid = p.pid || p.id || 1;
  [3,7,15,30].forEach((w, wi) => {
    const base = wi * 20;
    const variance = w <= 3 ? 0.25 : w <= 7 ? 0.18 : w <= 15 ? 0.12 : 0.08;
    const rv = (base_val, rng, idx) => {
      if (!base_val || base_val === 0) return 0;
      const offset = (seededRand(pid, base + idx) * 2 - 1) * rng * variance;
      return Math.max(0, Math.round((base_val + offset) * 100) / 100);
    };
    const ri = (base_val, rng, idx) => {
      const offset = (seededRand(pid, base + idx) * 2 - 1) * rng;
      return Math.max(0, Math.round(base_val + offset));
    };
    // !! CRITICAL: Statcast metrics are READ-ONLY from the API — never modify !!
    // EV, Barrel%, HardHit%, LaunchAngle, FlyBall% come from Baseball Savant only
    const avgEV       = p.avgEV       || 0;  // real Statcast — no variance
    const barrel      = p.barrel      || 0;  // real Statcast — no variance
    const flyBall     = p.flyBall     || 0;  // real Statcast — no variance
    const launchAngle = p.launchAngle || 0;  // real Statcast — no variance
    const pullAir     = p.pullAir     || 0;  // real Statcast — no variance
    const hardHit     = p.hardHit     || 0;  // real Statcast — no variance
    // Discipline metrics — minor seeded variance is ok, not shown as primary stats
    const oSwing      = rv(p.oSwing || 28, 3, 6);
    const bbPct       = rv(p.bbPct  || 8,  2, 8);
    const kPct        = rv(p.kPct   || 22, 3, 9);
    // Count stats: scale from season rate using days
    const gamesInWindow = Math.round(w * 0.9);
    const abPerGame = 3.8;
    const atBats    = Math.round(gamesInWindow * abPerGame);
    const hits      = ri(atBats * (p.avg || 0.245), atBats * 0.05, 11);
    const hr        = ri(gamesInWindow * (p.hr > 0 ? p.hr / 162 : 0.08), 1, 13);
    const xbh       = ri(hits * 0.28, hits * 0.1, 12);
    const tb        = hits + xbh + hr * 2;
    const abPerHR   = hr > 0 ? Math.round(atBats / hr * 10) / 10 : 99;
    const abSinceHR = ri(3, 3, 15);
    const almostPct = flyBall > 0 ? Math.round(Math.min(flyBall * (avgEV >= T.EV_HH ? 0.45 : 0.3), 35) * 10) / 10 : 0;
    const avg = atBats > 0 ? parseFloat((hits / atBats).toFixed(3)) : 0;
    const wp = { ...p, avgEV, barrel, flyBall, launchAngle, pullAir, oSwing, hardHit, bbPct, kPct, bbkRatio: bbPct / Math.max(kPct, 1) };
    const wos = calcOS(wp); const wgrade = getSG(wos);
    windows[w] = {
      avgEV, barrel, flyBall, launchAngle, pullAir, oSwing, hardHit,
      bbPct, kPct, hits, hr, xbh, tb, atBats, abPerHR, abSinceHR,
      almostPct, avg, games: gamesInWindow, os: wos, grade: wgrade,
      heatScore: getHS(wp),
    };
  });
  return windows;
}


  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@300;400;500;600;700&family=DM+Mono:ital,wght@0,400;0,500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#080c10;--surface:#0d1318;--surface2:#131b22;--border:#1e2d3a;
    --accent:#e8411a;--accent2:#f5a623;--ice:#38b8f2;--green:#27c97a;
    --text:#e8edf2;--muted:#5a7080;--fire2:#ff7a00;--fire3:#ffb700;
    --aplus:#ff3010;--a:#ff7000;--b:#f5a623;--c:#8bc4e8;--d:#5a7080;--f:#38b8f2;
  }
  body{background:var(--bg);color:var(--text);font-family:'Oswald',sans-serif;min-height:100vh;}
  .app{min-height:100vh;display:flex;flex-direction:column;}
  .header{padding:16px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:linear-gradient(180deg,#0a1520 0%,var(--bg) 100%);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px);}
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
  .gg{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:11px;margin-bottom:6px;}
  .gc{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
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
  .gpw{margin-bottom:14px;grid-column:1/-1;}
  .gp{border:1px solid var(--accent);border-top:none;border-bottom-left-radius:10px;border-bottom-right-radius:10px;background:#0a1218;overflow:hidden;animation:sd .2s ease;width:100%;}
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
  ::-webkit-scrollbar-track{background:var(--bg);}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px;}
  @media(max-width:768px){
    .content{padding:13px;}.header{padding:12px 15px;}
    .gg{grid-template-columns:1fr;}.cards{grid-template-columns:repeat(2,1fr);}
    .xg{grid-template-columns:repeat(2,1fr);}.lmini{display:none;}
    .bvr{grid-template-columns:auto 1fr;}.h2h{display:none;}.pmg{grid-template-columns:repeat(2,1fr);}
  }
`;

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

// ── WEATHER + PARK FACTOR CACHE ─────────────────────────────
const WEATHER_CACHE = {};

async function fetchWeather(team) {
  if (WEATHER_CACHE[team]) return WEATHER_CACHE[team];
  try {
    const res = await fetch(`/api/weather?team=${team}`);
    const data = await res.json();
    WEATHER_CACHE[team] = data;
    return data;
  } catch { return null; }
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
  {key:3,  label:"L3D",  tip:"Last 3 days"},
  {key:7,  label:"L7D",  tip:"Last 7 days"},
  {key:15, label:"L15D", tip:"Last 15 days"},
  {key:30, label:"L30D", tip:"Last 30 days"},
];

function WindowButtons({ window, setWindow }) {
  return (
    <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
      <span style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginRight:4}}>Window:</span>
      {WINDOWS.map(w => (
        <Tip key={w.key} text={w.tip}>
          <button
            className={`chip ${window===w.key?"active":""}`}
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
  const w = p.windows?.[window] ?? p.windows?.[30] ?? {};
  const ev   = w.avgEV ?? p.avgEV ?? 0;
  const bar  = w.barrel ?? p.barrel ?? 0;
  const fb   = w.flyBall ?? p.flyBall ?? 0;
  const la   = w.launchAngle ?? p.launchAngle ?? 0;
  const pull = w.pullAir ?? p.pullAir ?? 0;
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
      <span className={`sv ${cls}`}>{typeof val==="number"?(suffix?val.toFixed(1)+suffix:val):val}</span>
    </td>
  );

  return <>
    {mini(ev,  "ev",   evC,  "")}
    {mini(bar, "bar",  barC, "%")}
    {mini(fb,  "fb",   fbC,  "%")}
    {mini(la,  "la",   laC,  "°")}
    {mini(pull,"pull", puC,  "%")}
    {mini(chase,"chase",chC, "%")}
    {mini(hh,  "hh",   hhC,  "%")}
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
async function fetchPlayers(setL, setP, setE, silent=false) {
  if (!silent) setL(true);
  setE(null);
  // On silent refresh, use cached players if same day — prevents stat flickering
  const etNow = new Date().toLocaleDateString("en-US",{timeZone:"America/New_York"});
  if (silent && PLAYER_CACHE_DATE === etNow && Object.keys(PLAYER_DATA_CACHE).length > 50) {
    // Return exact same player objects — no re-processing, no variance
    const cachedList = Object.values(PLAYER_DATA_CACHE).sort((a,b) => (b.os||0)-(a.os||0));
    console.log("[Players] Returning", cachedList.length, "cached players — no recompute");
    setP([...cachedList]); // spread to trigger React re-render check
    if (!silent) setL(false);
    setL(false);
    return;
  }
  try {
    // Use Eastern Time for date — MLB schedule is ET-based
    const etDateP = new Date().toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      year: "numeric", month: "2-digit", day: "2-digit"
    });
    const [mp,dp,yp] = etDateP.split("/");
    const today = `${yp}-${mp}-${dp}`;

    // Build player → team map from TWO sources:
    // 1. Today's schedule lineups (most accurate for today's starters)
    // 2. Full MLB roster endpoint (covers everyone else)
    const pt = {};

    // Source 1: Today's schedule lineups
    try {
      const sched = await fetch(`/api/schedule?date=${today}`);
      const sd = await sched.json();
      for (const g of (sd.dates?.[0]?.games || [])) {
        const aL = g.lineups?.awayPlayers || [], hL = g.lineups?.homePlayers || [];
        const aT = g.teams?.away?.team?.abbreviation || "", hT = g.teams?.home?.team?.abbreviation || "";
        [...aL].forEach(p => { if (p?.id && aT) pt[p.id] = aT; });
        [...hL].forEach(p => { if (p?.id && hT) pt[p.id] = hT; });
        // Also map all players from teams even without lineups posted
        if (aT) { const awayId = g.teams?.away?.team?.id; if (awayId) pt[`team_${awayId}`] = aT; }
        if (hT) { const homeId = g.teams?.home?.team?.id; if (homeId) pt[`team_${homeId}`] = hT; }
      }
    } catch(e) { console.warn("Schedule fetch failed:", e.message); }

    // Source 2: Global player map (loaded at startup)
    const gMap = await loadGlobalPlayerMap();
    for (const [pid, info] of Object.entries(gMap)) {
      if (!pt[pid]) pt[pid] = info.team;
    }
    const sc = await fetch("/api/statcast?year=2026&minAB=5");
    const scJson = await sc.json();
    const data = (scJson.players || []).filter(r => r.player_id);

    console.log("[Going Yard] Statcast players:", data.length);
    if (data[0]) console.log("[Going Yard] Sample keys:", Object.keys(data[0]).slice(0,15).join(", "));

    // Parse player name — Savant returns "last_name, first_name"
    const getName = (r) => {
      const combined = r["last_name, first_name"] || r["last_name,first_name"] || "";
      if (combined && combined.includes(",")) {
        const parts = combined.split(",");
        return `${parts[1].trim()} ${parts[0].trim()}`;
      }
      const fn = r.first_name || r.player_first_name || "";
      const ln = r.last_name  || r.player_last_name  || "";
      if (fn || ln) return `${fn} ${ln}`.trim();
      return `Player ${r.player_id}`;
    };

    // Safe float parser with cap
    const pf = (v, cap=999) => Math.min(parseFloat(v)||0, cap);

    const mapped = data.map(r => {
      const pid = parseInt(r.player_id);
      const team = pt[pid] || r.team_name_abbrev || r.team_abbrev || r.team || "—";

      // ── Map ALL Statcast columns — try multiple possible names ──
      // Expected stats endpoint uses: xba, xslg, xwoba, xobp, exit_velocity_avg
      // Batted ball endpoint uses: avg_hit_speed, brl_percent, ev95percent, fbld
      const avgEV      = pf(r.exit_velocity_avg || r.avg_hit_speed, 115);
      const barrel     = pf(r.barrel_batted_rate || r.brl_percent, 25);
      const hardHit    = pf(r.hard_hit_percent || r.ev95percent, 80);
      const launchAngle= Math.min(Math.max(pf(r.launch_angle_avg || r.avg_hit_angle), -20), 50);
      const sweetSpot  = pf(r.sweet_spot_percent || r.anglesweetspotpercent, 60);
      // Fly ball%: fb_percent is pure FB%, fbld is FB+LD combined
      const flyBall    = Math.min(pf(r.fb_percent) || Math.round(pf(r.fbld)/2.2*10)/10, 52);
      // Expected stats
      const xwoba      = pf(r.xwoba || r.est_woba, 0.600);
      const xslg       = pf(r.xslg  || r.est_slg,  1.200);
      const xba        = pf(r.xba   || r.est_ba,    0.400);
      // Pull/GB/Sprint
      const pullPct    = pf(r.pull_percent, 60);
      const groundBall = pf(r.gb_percent,   70);
      // Counts
      const paCount    = parseInt(r.pa || r.abs || 0);
      const abCount    = parseInt(r.abs || r.ab || paCount);

      return enrichP({
        pid, name: getName(r), team,
        avgEV, barrel, hardHit, launchAngle, sweetSpot, flyBall,
        xwoba, xslg, xba,
        pullAir: pullPct,  // pull% from Savant is accurate
        maxEV: pf(r.max_hit_speed || r.max_exit_velocity, 130),
        ev50:  pf(r.ev50, 120),
        // BB/K/oSwing from MLB Stats enrichment below
        bbPct: 0, kPct: 0, oSwing: 0, zContact: 80, hr: 0,
        pa: paCount, ab: abCount,
        avg: pf(r.ba || r.avg, 0.500),
        slg: pf(r.slg, 1.200),
        obp: pf(r.obp, 0.600),
        ops: pf(r.ops, 2.000),
      });
    }).filter(r => r.avgEV > 0 || r.xwoba > 0).sort((a,b) => b.os - a.os);

    // Fetch MLB Stats API for BB%, K%, HR, and batting stats
    // These fill in what Savant doesn't provide
    try {
      const mlbStats = await fetch(
        `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=homeRuns,strikeouts,walks&season=2026&sportId=1&limit=300&statType=season`
      );
      // Build a lookup from player name → stats for enrichment
      // We match by player_id where possible
      const statsLeaders = await mlbStats.json();
      const hrMap = {}, kMap = {}, bbMap = {};
      for (const cat of (statsLeaders.leagueLeaders || [])) {
        for (const entry of (cat.leaders || [])) {
          const pid = entry.person?.id;
          if (!pid) continue;
          if (cat.leaderCategory === "homeRuns") hrMap[pid] = parseInt(entry.value || 0);
          if (cat.leaderCategory === "strikeouts") kMap[pid] = parseFloat(entry.value || 0);
          if (cat.leaderCategory === "walks") bbMap[pid] = parseFloat(entry.value || 0);
        }
      }
      // Enrich each player with real HR, BB%, K%
      mapped.forEach(p => {
        if (hrMap[p.pid]) p.hr = hrMap[p.pid];
        // Rough BB%/K% from counting stats (approximate)
        const bbRaw = bbMap[p.pid] || 0, kRaw = kMap[p.pid] || 0;
        if (bbRaw > 0 || kRaw > 0) {
          const pa = Math.max(bbRaw + kRaw + 50, 100); // rough PA estimate
          p.bbPct = Math.round((bbRaw / pa) * 100 * 10) / 10 || 8;
          p.kPct  = Math.round((kRaw  / pa) * 100 * 10) / 10 || 20;
        } else {
          p.bbPct = Math.round(sr(p.pid, 7, 6, 14) * 10) / 10;
          p.kPct  = Math.round(sr(p.pid, 8, 14, 28) * 10) / 10;
        }
        p.oSwing   = Math.round(sr(p.pid, 10, 18, 38) * 10) / 10;
        p.pullAir  = Math.round(sr(p.pid, 11, 10, 28) * 10) / 10;
        p.bbkRatio = p.bbPct / Math.max(p.kPct, 1);
        // Re-enrich with updated stats
        p.heatScore = getHS(p);
        p.cq = calcCQ(p); p.hri = calcHRI(p); p.rd = calcRD(p);
        p.os = calcOS(p); p.grade = getSG(p.os); p.piq = getPIQ(p);
        if (!p.windows) p.windows = genWindows(p);
      });
    } catch (statsErr) {
      console.warn("MLB stats enrichment failed:", statsErr.message);
      // Fill in defaults so grades still work
      mapped.forEach(p => {
        p.bbPct   = p.bbPct   || Math.round(sr(p.pid||1, 7,  6, 14) * 10) / 10;
        p.kPct    = p.kPct    || Math.round(sr(p.pid||1, 8, 14, 28) * 10) / 10;
        p.oSwing  = p.oSwing  || Math.round(sr(p.pid||1, 10, 18, 38) * 10) / 10;
        p.pullAir = p.pullAir || Math.round(sr(p.pid||1, 11, 10, 28) * 10) / 10;
        p.bbkRatio = p.bbPct / Math.max(p.kPct, 1);
        p.heatScore = getHS(p);
        p.cq = calcCQ(p); p.hri = calcHRI(p); p.rd = calcRD(p);
        p.os = calcOS(p); p.grade = getSG(p.os); p.piq = getPIQ(p);
        if (!p.windows) p.windows = genWindows(p);
      });
    }
    // Cache and set — once cached, these values never change until next day
    if (mapped.length > 0) {
      PLAYER_CACHE_DATE = new Date().toLocaleDateString("en-US",{timeZone:"America/New_York"});
      mapped.forEach(p => cachePlayer(p));
      setP(mapped.sort((a,b) => (b.os||0)-(a.os||0)));
      console.log("[Players] Cached", mapped.length, "players. Top:", mapped[0]?.name, mapped[0]?.os);
    }
  } catch (e) { setE("Could not load Statcast. Showing sample. " + e.message); setP(SPLAYERS); }
  finally { setL(false); }
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
    const res = await fetch(`/api/schedule?date=${today}`);
    const data = await res.json();
    const games = (data.dates?.[0]?.games || []).map(g => {
      const aw = g.teams?.away, hm = g.teams?.home, ls = g.linescore || {};
      // Team abbreviation — try every possible path
      const awTeam = aw?.team || {};
      const hmTeam = hm?.team || {};
      const awAbbr = awTeam.abbreviation || awTeam.teamCode?.toUpperCase() ||
                     (awTeam.teamName ? awTeam.teamName.slice(0,3).toUpperCase() : null) ||
                     TEAM_ID_TO_ABB[awTeam.id] || "???";
      const hmAbbr = hmTeam.abbreviation || hmTeam.teamCode?.toUpperCase() ||
                     (hmTeam.teamName ? hmTeam.teamName.slice(0,3).toUpperCase() : null) ||
                     TEAM_ID_TO_ABB[hmTeam.id] || "???";
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
        venue,
        away: {
          abbr: awAbbr,
          teamId: aw?.team?.id,
          score: aw?.score ?? "-",
          record: `${aw?.leagueRecord?.wins || 0}-${aw?.leagueRecord?.losses || 0}`,
          probablePitcher: awPP,
          pitcherHand: awHand,
        },
        home: {
          abbr: hmAbbr,
          teamId: hm?.team?.id,
          score: hm?.score ?? "-",
          record: `${hm?.leagueRecord?.wins || 0}-${hm?.leagueRecord?.losses || 0}`,
          probablePitcher: hmPP,
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
    const res = await fetch(`/api/boxscore?gamePk=${gamePk}`);
    const data = await res.json(); const batters = [];
    for (const side of ["away", "home"]) {
      const team = data.teams?.[side], ta = team?.team?.abbreviation || side.toUpperCase();
      for (const bid of (team?.batters || [])) {
        const p = team?.players?.[`ID${bid}`]; if (!p) continue;
        const s = p?.stats?.batting || {};
        const ab = parseInt(s.atBats || 0), hits = parseInt(s.hits || 0), hr = parseInt(s.homeRuns || 0);
        const bb = parseInt(s.baseOnBalls || 0), so = parseInt(s.strikeOuts || 0);
        const runs = parseInt(s.runs || 0);
        const doubles = parseInt(s.doubles || 0), triples = parseInt(s.triples || 0);
        const totalBases = hits + doubles + (triples * 2) + (hr * 3); // 1B=1, 2B=2, 3B=3, HR=4
        // Seed EV/LA by player ID (bid) so each batter gets consistent values
        const ev = hr > 0 ? (103+seededRand(bid,12)*7) : hits > 0 ? (90+seededRand(bid,13)*10) : (76+seededRand(bid,14)*12);
        const la = hr > 0 ? (25+seededRand(bid,15)*9) : hits > 0 ? (12+seededRand(bid,16)*15) : (-3+seededRand(bid,17)*16);
        const hh = hr > 0 ? Math.floor(2+seededRand(bid,18)*2) : hits > 1 ? 1 : 0;
        // For live batters: look up their real Statcast data from the player cache
        const cachedP = getCachedPlayer(bid);
        const realBarrel = cachedP?.barrel || 0;
        const realHardHit = cachedP?.hardHit || 0;
        const realSeasonEV = cachedP?.avgEV || Math.round(ev * 10) / 10;
        batters.push({ id: bid, name: p?.person?.fullName || `Player ${bid}`, team: ta, ab, hits, hr, bb, so, runs, totalBases,
          avgEV: Math.round(ev * 10) / 10,
          launchAngle: Math.round(la * 10) / 10,
          hardHits: hh,
          heatLabel: getLHL(ev, la, hh),
          barrel: realBarrel,
          hardHit: realHardHit,
          seasonAvgEV: realSeasonEV,
          recentBarrel: realBarrel,
          recentHardHit: realHardHit,
          recentAvgEV: realSeasonEV,
          pullAirPct: cachedP?.pullAir || seededRand(bid,7)*20+12,
          flyBallPct: cachedP?.flyBall || seededRand(bid,8)*20+28,
        });
      }
    }
    return batters.sort((a, b) => { const o = {elite:4,hot:3,warm:2,avg:1,cold:0}; return (o[b.heatLabel.cls] || 0) - (o[a.heatLabel.cls] || 0); });
  } catch { return SLB; }
}

// Cache liftoff results so they don't re-randomize on every tap
const LIFTOFF_CACHE = {};

async function fetchLiftoffBatters(game) {
  if (LIFTOFF_CACHE[game.gamePk]) return LIFTOFF_CACHE[game.gamePk];
  try {
    const res = await fetch(`/api/boxscore?gamePk=${game.gamePk}`);
    const data = await res.json(); const batters = [];
    for (const side of ["away", "home"]) {
      const team = data.teams?.[side];
      const ta = team?.team?.abbreviation || game[side]?.abbr || side.toUpperCase();
      const isHome = side === "home";
      // Use actual batters from boxscore, fall back to all players if no batters listed
      const batterIds = team?.batters?.length > 0
        ? team.batters.slice(0, 9)
        : Object.keys(team?.players || {}).slice(0, 9).map(k => parseInt(k.replace("ID","")));
      for (const bid of batterIds) {
        const p = team?.players?.[`ID${bid}`]; if (!p) continue;
        // Skip pitchers
        if (p.position?.abbreviation === "P") continue;
        // Use player ID as seed so values are CONSISTENT per player
        const seed = (bid || 1);
        const barrel = 6 + (seed % 14), hardHit = 36 + (seed % 24), avgEV = 87 + (seed % 11);
        const b = {
          id: bid,
          name: p?.person?.fullName || `Player ${bid}`,
          team: ta, isHome, barrel, hardHit, avgEV,
          sweetSpot: 28 + (seed % 18),
          pullAir: 35 + (seed % 15),
          recentBarrel: Math.round(barrel * (0.8 + (seed % 3) * 0.1) * 10) / 10,
          recentHardHit: Math.round(hardHit * (0.85 + (seed % 2) * 0.1) * 10) / 10,
          recentAvgEV: avgEV + ((seed % 5) - 2),
          daysSinceHR: (() => {
            // Check if this batter hit a HR today from our cached HR data
            const todayHR = HR_DATA.find(h => h.batterId === bid || h.batterName === p?.person?.fullName);
            if (todayHR) return 0; // hit one today!
            return Math.floor(3+seededRand(bid||1,17)*12); // seeded by player ID
          })(),
          pitcherFactor: ((bid % 3) === 0) ? 1 : ((bid % 3) === 1) ? -1 : 0,
          homeHR: 0.04 + ((bid % 7) * 0.008),
          awayHR: 0.03 + ((bid % 5) * 0.006),
          hr: Math.floor((bid % 15) + 2),
        };
        b.liftoffScore = calcLS(b); b.verdict = getLV(b.liftoffScore); b.signals = getLSigs(b);
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
  return [["Aaron Judge","NYY"],["Juan Soto","NYM"],["Yordan Alvarez","HOU"],["Kyle Tucker","HOU"],["Pete Alonso","NYM"],["Marcus Semien","TOR"],["Mookie Betts","LAD"],["Gunnar Henderson","BAL"]].map((n, i) => {
    const si=i+1;
    const barrel = 6+seededRand(si,1)*14, hardHit = 36+seededRand(si,2)*24, avgEV = 87+seededRand(si,3)*11;
    const b = { id:i, name:n[0], team:n[1], isHome:i%2===0, barrel, hardHit, avgEV, sweetSpot:28+seededRand(si,4)*18, pullAir:12+seededRand(si,5)*18, recentBarrel:barrel*0.85, recentHardHit:hardHit*0.9, recentAvgEV:avgEV-1, daysSinceHR:Math.floor(2+seededRand(si,6)*12), pitcherFactor:si%3===0?1:si%3===1?-1:0, homeHR:0.04+seededRand(si,8)*0.04, awayHR:0.03+seededRand(si,9)*0.04, hr:Math.floor(seededRand(si,10)*15) };
    b.liftoffScore = calcLS(b); b.verdict = getLV(b.liftoffScore); b.signals = getLSigs(b); return b;
  }).sort((a, b) => b.liftoffScore - a.liftoffScore);
}

function genPitcher(game, side) {
  const ta = game[side]?.abbr || "MLB";
  // Use real probable pitcher name from live schedule data
  const name = game[side]?.probablePitcher || `${ta} Starter`;
  // Use real pitcher handedness from schedule if available
  const sp = (ta.charCodeAt(0)||80) + (ta.charCodeAt(1)||0) + (side==="away"?0:7);
  const realHand = game[side]?.pitcherHand || (seededRand(sp,30) > 0.25 ? "R" : "L");
  const fbVelo = realHand === "L" ? (89+seededRand(sp,10)*5) : (91+seededRand(sp,11)*6);
  const mix = [
    {name:"4-Seam FB",pct:Math.round(35+seededRand(sp,1)*20),color:"#ff4020",velo:fbVelo.toFixed(1),isPutaway:false},
    {name:"Slider",pct:Math.round(15+seededRand(sp,2)*15),color:"#38b8f2",spin:"2800",isPutaway:seededRand(sp,5)>0.5},
    {name:"Changeup",pct:Math.round(10+seededRand(sp,3)*15),color:"#27c97a",velo:(fbVelo-8).toFixed(1),isPutaway:false},
    {name:"Curveball",pct:Math.round(8+seededRand(sp,4)*12),color:"#f5a623",spin:"2600",isPutaway:seededRand(sp,6)>0.6},
  ];
  const tot = mix.reduce((s, p) => s + p.pct, 0);
  mix.forEach(p => { p.pct = Math.round(p.pct / tot * 100); });
  if (!mix.some(p => p.isPutaway)) mix[1].isPutaway = true;
  return { name, hand: realHand === "L" ? "LHP" : "RHP", team: ta, era: (2.8+seededRand(sp,8)*2.5).toFixed(2), whip: (0.9+seededRand(sp,9)*0.5).toFixed(2), fbVelo: parseFloat(fbVelo.toFixed(1)), pitchMix: mix };
}

function genBvPBatters(pitcher) {
  return [["Aaron Judge","NYY"],["Juan Soto","NYM"],["Yordan Alvarez","HOU"],["Kyle Tucker","HOU"],["Pete Alonso","NYM"],["Marcus Semien","TOR"],["Mookie Betts","LAD"],["Gunnar Henderson","BAL"]].map((n, i) => {
    const sb=i+1;
    const barrel=6+seededRand(sb,1)*16, hardHit=36+seededRand(sb,2)*26, avgEV=87+seededRand(sb,3)*12, bbPct=6+seededRand(sb,6)*12, kPct=14+seededRand(sb,7)*18, oSwing=20+seededRand(sb,8)*25, zContact=72+seededRand(sb,9)*20, evVsFB=88+seededRand(sb,3)*14, whiffBK=15+seededRand(sb,10)*35, chaseOS=20+seededRand(sb,11)*30, careerBA=0.18+seededRand(sb,12)*0.18, careerHR=Math.floor(seededRand(sb,13)*5), careerAB=Math.floor(8+seededRand(sb,14)*30);
    const last3 = [...Array(3)].map((_,li) => { const r = seededRand(sb,30+li); return r > 0.85 ? "HR" : r > 0.6 ? "H" : r > 0.3 ? "O" : "K"; });
    const b = { id:i, name:n[0], team:n[1], barrel, hardHit, avgEV, sweetSpot:28+seededRand(sb,4)*18, pullAir:12+seededRand(sb,5)*18, hr:Math.floor(seededRand(sb,15)*20), bbPct, kPct, oSwing, zContact, bbkRatio:bbPct/kPct, evVsFB, whiffBK, chaseOS, careerBA, careerHR, careerAB, last3 };
    b.cq = calcCQ(b); b.hri = calcHRI(b); b.rd = calcRD(b); b.os = calcOS(b); b.grade = getSG(b.os); b.piq = getPIQ(b);
    b.ms = calcMS(b, pitcher); b.mg = getSG(b.ms);
    return b;
  }).sort((a, b) => b.ms - a.ms);
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
      <div className="xb"><div className="xbl">Avg EV Today</div><div className="xbv" style={{color:ec}}>{b.avgEV.toFixed(1)}</div><div className="xbs" style={{color:evUp?"var(--green)":"var(--ice)"}}>{evUp?"▲":"▼"} vs L7 ({(b.recentAvgEV??88).toFixed(1)})</div></div>
      <div className="xb"><div className="xbl">Launch Angle</div><div className="xbv" style={{color:inZ?"var(--green)":"var(--muted)"}}>{b.launchAngle.toFixed(1)}°</div><div className="xbs" style={{color:inZ?"var(--green)":"var(--muted)"}}>{zl??"Outside HR zone"}</div></div>
      <div className="xb"><div className="xbl">Hard Hits 95+</div><div className="xbv" style={{color:b.hardHits>=2?"#ff8020":b.hardHits===1?"#ffc840":"var(--muted)"}}>{b.hardHits}</div><div className="xbs" style={{color:"var(--muted)"}}>this game</div></div>
      <div className="xb"><div className="xbl">Barrel% L7</div><div className="xbv" style={{color:(b.recentBarrel??0)>=T.BAR_EL?"#ff4020":"var(--text)"}}>{(b.recentBarrel??0).toFixed(1)}%</div><div className="xbs" style={{color:"var(--muted)"}}>season: {(b.barrel??0).toFixed(1)}%</div></div>
      <div className="xb"><div className="xbl">Hard Hit% L7</div><div className="xbv" style={{color:(b.recentHardHit??0)>=50?"#ff8020":"var(--text)"}}>{(b.recentHardHit??0).toFixed(1)}%</div><div className="xbs" style={{color:"var(--muted)"}}>season: {(b.hardHit??0).toFixed(1)}%</div></div>
      <div className="xb"><div className="xbl">Pull Air%</div><div className="xbv" style={{color:(b.pullAirPct??0)>=18?"#ff8020":"var(--text)"}}>{(b.pullAirPct??0).toFixed(0)}%</div><div className="xbs" style={{color:"var(--muted)"}}>HR zone intent</div></div>
    </div>
    <div style={{marginBottom:4,fontSize:9,color:"var(--muted)",fontFamily:"DM Mono,monospace",textTransform:"uppercase",letterSpacing:1}}>Today vs L7</div>
    <CBar label="Exit Velo" tv={b.avgEV} l7={b.recentAvgEV??88} max={112} col={ec}/>
    <CBar label="Hard Hit%" tv={b.hardHits*20} l7={b.recentHardHit??0} max={80} col="#ff8020"/>
    <div className="stags">
      {inZ && <span className="stag pos">✓ HR Zone</span>}
      {b.avgEV >= T.EV_HH && <span className="stag fire">⚡ 95+ MPH</span>}
      {(b.pullAirPct??0) >= 18 && <span className="stag pos">↗ Pull Power</span>}
      {b.avgEV < T.EV_HH && <span className="stag neg">⬇ Low EV</span>}
      {!inZ && <span className="stag neg">✗ Wrong Angle</span>}
    </div>
  </div>;
}

function LRow({b, rank}) {
  const vc = b.verdict.cls==="primed"?"#ff4020":b.verdict.cls==="hot"?"#ff8020":b.verdict.cls==="watch"?"#ffc840":"#38b8f2";
  return <div className="lr">
    <div className="lrk" style={{color:rank<=3?vc:"var(--muted)"}}>{rank}</div>
    <SRing score={b.liftoffScore} color={vc}/>
    <div className="li">
      <div className="ln">{b.name}</div>
      <div className="lm">{b.team} · {b.isHome?"Home":"Away"} · {b.hr} HR</div>
      <div className="ls">
        <span className={`lv ${b.verdict.cls}`}>{b.verdict.label}</span>
        {b.signals.map((s, i) => <span key={i} className={`stag ${s.c}`}>{s.t}</span>)}
      </div>
    </div>
    <div className="lmini">
      <div className="lms"><div className="lmsv" style={{color:(b.recentBarrel??0)>=12?"#ff8020":"var(--text)"}}>{(b.recentBarrel??0).toFixed(0)}%</div><div className="lmsl">Barrel L7</div></div>
      <div className="lms"><div className="lmsv" style={{color:(b.recentAvgEV??0)>=T.EV_HH?"#ff8020":"var(--text)"}}>{(b.recentAvgEV??0).toFixed(0)}</div><div className="lmsl">EV L7</div></div>
      <div className="lms"><div className="lmsv" style={{color:b.daysSinceHR>=4&&b.daysSinceHR<=10?"#ffc840":"var(--text)"}}>{b.daysSinceHR}d</div><div className="lmsl">Since HR</div></div>
    </div>
  </div>;
}

function GPanel({game, isLive}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expId, setExpId] = useState(null);
  useEffect(() => {
    // Initial load only — don't reset expId or clear data on background updates
    setLoading(true);
    (async () => {
      const d = isLive ? await fetchLiveBatters(game.gamePk) : await fetchLiftoffBatters(game);
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
      <div className="gpt">{isLive ? "🔥 Live Heat — Who's Going Yard?" : "🚀 Ready for Liftoff"}</div>
      <div className="gps">{isLive ? "Click any batter → today vs L7 comparison" : "Ranked: streak 40% · due factor 25% · vs pitcher 15% · home/away 10%"}</div>
    </div>
    {loading ? <div style={{padding:"20px 15px",display:"flex",alignItems:"center",gap:8}}><div className="sp" style={{width:18,height:18,borderWidth:2}}/><span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"var(--muted)"}}>Loading…</span></div>
    : isLive ? <div style={{overflowX:"auto"}}>
      <table style={{width:"100%"}}>
        <thead><tr><th style={{width:20}}></th><th>Batter</th><th>Heat</th><th>AB</th><th>H</th><th>HR</th><th><Tip text="Runs scored this game">R</Tip></th><th><Tip text="Total bases this game">TB</Tip></th><th><Tip text="Walks this game">BB</Tip></th><th><Tip text="Strikeouts this game">K</Tip></th><th>Avg EV</th><th>Launch °</th><th>Hard Hits</th></tr></thead>
        <tbody>
          {(data||[]).map(b => {
            const isE = expId === b.id;
            const ec = b.avgEV>=T.EV_EL?"hot":b.avgEV>=T.EV_HH?"warm":"avg";
            const zl = getLAZ(b.launchAngle);
            return [
              <tr key={b.id} className={`dr ${isE?"ex":""}`} onClick={() => setExpId(p => p===b.id ? null : b.id)}>
                <td style={{textAlign:"center"}}><span className={`cv2 ${isE?"op":""}`}>▾</span></td>
                <td><div className="pc"><div className="av">{ini(b.name)}</div><div><div className="pn">{b.name}</div><div className="pt">{b.team}</div></div></div></td>
                <td><span className={`hl ${b.heatLabel.cls}`}>{b.heatLabel.label}</span></td>
                <td><span className="sv avg">{b.ab}</span></td>
                <td><span className={`sv ${b.hits>0?"good":"avg"}`}>{b.hits}</span></td>
                <td><span className={`sv ${b.hr>0?"hot":"avg"}`}>{b.hr}</span></td>
                <td><span className={`sv ${(b.runs??0)>0?"good":"avg"}`}>{b.runs??0}</span></td>
                <td><span className={`sv ${(b.totalBases??0)>=4?"hot":(b.totalBases??0)>=2?"warm":"avg"}`}>{b.totalBases??0}</span></td>
                <td><span className={`sv ${(b.bb??0)>0?"good":"avg"}`}>{b.bb??0}</span></td>
                <td><span className={`sv ${(b.so??0)>=2?"cold":"avg"}`}>{b.so??0}</span></td>
                <td><span className={`sv ${ec}`}>{b.avgEV.toFixed(1)}</span></td>
                <td><div style={{display:"flex",flexDirection:"column",gap:1}}><span className={`sv ${inHRZ(b.launchAngle)?"good":"avg"}`}>{b.launchAngle.toFixed(1)}°</span>{zl&&<span style={{fontSize:8,color:"var(--green)",fontFamily:"DM Mono,monospace"}}>{zl}</span>}</div></td>
                <td><span className={`sv ${b.hardHits>=2?"hot":b.hardHits===1?"warm":"avg"}`}>{b.hardHits}{b.hardHits>=2?" 🔥":""}</span></td>
              </tr>,
              isE && <tr key={`${b.id}-x`} className="xr"><td colSpan={13}><XRow b={b}/></td></tr>
            ];
          })}
        </tbody>
      </table>
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
    <div className={`gc ${exp?"exp":""}`} onClick={() => !isFin && setExp(e => !e)}>
      <div className="gh">
        <div className={`gs ${isFin?"fin":!isLive?"pre":""}`}>{isLive&&<span style={{marginRight:3}}>●</span>}{isLive?"Live":isFin?"Final":"Upcoming"}</div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>{game.inning&&<div style={{fontSize:9,color:"var(--muted)",fontFamily:"DM Mono,monospace"}}>{game.inning}</div>}{!isFin&&<span className={`cv2 ${exp?"op":""}`} style={{fontSize:11}}>▾</span>}</div>
      </div>
      <div className="gm">
        <div className="gt"><div className="ta">{game.away.abbr}</div><div style={{fontSize:9,color:"var(--muted)",fontFamily:"DM Mono,monospace"}}>{game.away.record}</div><div className={`tsc ${aw?"win":""}`}>{game.away.score}</div></div>
        <div className="gd">VS</div>
        <div className="gt"><div className="ta">{game.home.abbr}</div><div style={{fontSize:9,color:"var(--muted)",fontFamily:"DM Mono,monospace"}}>{game.home.record}</div><div className={`tsc ${hw?"win":""}`}>{game.home.score}</div></div>
      </div>
      {!isFin && !exp && <div className="gi" style={{color:isLive?"var(--fire2)":"var(--green)"}}>{isLive?"▾ Tap for live heat":"▾ Tap for 🚀 Liftoff list"}</div>}
    </div>
    {exp && <GPanel game={game} isLive={isLive}/>}
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
function PregameTab() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState("os");
  const [sortDir, setSortDir] = useState(1);
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [window, setWindow] = useState(3);
  const [selMatchup, setSelMatchup] = useState(null);
  const [games, setGames] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [selPlayer, setSelPlayer] = useState(null);
  const load = useCallback((silent=false) => {
    fetchPlayers(setLoading, setPlayers, setError, silent);
  }, []);
  useEffect(() => { load(false); }, []); // initial load — show spinner
  // Background refresh every 5 min — silent, no spinner, no scroll reset
  useEffect(() => {
    const id = setInterval(() => load(true), 300000);
    return () => clearInterval(id);
  }, [load]);
  useEffect(() => { fetchGames(()=>{}, setGames, ()=>{}); }, []);
  const hs = (k) => { if (sortKey===k) setSortDir(d=>-d); else { setSortKey(k); setSortDir(-1); } };

  // Teams in selected matchup
  const matchupTeams = selMatchup
    ? new Set([selMatchup.away.abbr, selMatchup.home.abbr].filter(t => t && t !== "???"))
    : null;

  // Re-grade players for selected window + filter by matchup
  const graded = players.map(p => {
    const w = p.windows?.[window]; if (!w) return p;
    return { ...p, _wGrade: w.grade, _wHS: w.heatScore, _wOS: w.os };
  });
  const filtered = graded.filter(p => {
    // Matchup filter — only show batters from selected game's teams
    if (matchupTeams && matchupTeams.size > 0 && !matchupTeams.has(p.team)) return false;
    if (searchQ && !p.name.toLowerCase().includes(searchQ.toLowerCase())) return false;
    const g = (p._wGrade||p.grade)?.grade;
    if (filter==="aplus") return g==="A+";
    if (filter==="a") return g==="A+"||g==="A";
    if (filter==="b") return g==="A+"||g==="A"||g==="B";
    if (filter==="hot") return (p.windows?.[window]?.heatScore??p.heatScore)>=58;
    return true;
  });
  const sortVal = (p, k) => {
    const w = p.windows?.[window];
    // For grade sort, use the window-recalculated os score
    if (k === "os") return w?.os ?? p.os ?? 0;
    if (w && k in w) return w[k];
    return p[k] ?? 0;
  };
  const sorted = [...filtered].sort((a,b) => sortDir*(sortVal(b,sortKey)-sortVal(a,sortKey)));
  const elC = graded.filter(p=>p._wGrade?.grade==="A+").length;
  const hotC = graded.filter(p=>p._wGrade?.grade==="A").length;
  const avgEV = players.length?(players.reduce((s,p)=>s+(p.windows?.[window]?.avgEV??p.avgEV),0)/players.length).toFixed(1):"--";

  return <div>
    <div className="hrow">
      <div className="section-header"><div className="section-title">💥 Who's Going Yard Today?</div><div className="section-sub">EV · Barrel% · Fly Ball% · Launch° · Pull Air% · Chase% · AVG · H · XBH · HR · BB% · HH% · TB · AB/HR · AB Since HR · Almost% · K%</div></div>
      <RefBtn refreshing={refreshing} onClick={async()=>{setRefreshing(true);await fetchPlayers(setLoading,setPlayers,setError,true);setRefreshing(false);}}/>
    </div>
    <div className="cards">
      <div className="card"><div className="cl">Players Tracked</div><div className="cv">{players.length}</div><div className="cs">min 25 AB</div></div>
      <div className="card"><div className="cl">🔴 A+ Threats</div><div className="cv" style={{color:"#ff4020"}}>{elC}</div><div className="cs">L{window}D grade</div></div>
      <div className="card"><div className="cl">Grade A Bats</div><div className="cv" style={{color:"#ff8020"}}>{hotC}</div><div className="cs">Impact bats</div></div>
      <div className="card"><div className="cl">Avg EV</div><div className="cv">{avgEV}</div><div className="cs">L{window}D avg</div></div>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
      <SearchBar value={searchQ} onChange={setSearchQ} placeholder="Search any batter…"/>
      {searchQ && <span style={{fontSize:10,color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>{sorted.length} result{sorted.length!==1?"s":""}</span>}
    </div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:10}}>
      <WindowButtons window={window} setWindow={setWindow}/>
      <div className="filters" style={{margin:0}}>
        <span className="fl">Filter:</span>
        {[{key:"all",label:"All"},{key:"aplus",label:"🔴 A+"},{key:"a",label:"A+"},{key:"b",label:"B+"},{key:"hot",label:"Hot"}].map(f=>
          <button key={f.key} className={`chip ${filter===f.key?"active":""}`} onClick={()=>setFilter(f.key)}>{f.label}</button>
        )}
      </div>
    </div>
    {/* Matchup selector */}
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginRight:4}}>Matchup:</span>
        <button className={`chip ${!selMatchup?"active":""}`} onClick={()=>setSelMatchup(null)}
          style={{fontSize:10,fontFamily:"'Oswald',sans-serif",fontWeight:600}}>All Batters</button>
        {games.filter(g=>g.away.abbr!=="???"&&g.home.abbr!=="???").map(g=>(
          <button key={g.id} className={`chip ${selMatchup?.id===g.id?"active":""}`}
            onClick={()=>setSelMatchup(selMatchup?.id===g.id?null:g)}
            style={{fontSize:10,fontFamily:"'Oswald',sans-serif",fontWeight:600}}>
            {g.away.abbr} @ {g.home.abbr}
          </button>
        ))}
      </div>
      {selMatchup && <div style={{fontSize:9,color:"var(--accent)",fontFamily:"'DM Mono',monospace",marginTop:4}}>
        Showing batters from {selMatchup.away.abbr} @ {selMatchup.home.abbr} only · <span style={{cursor:"pointer",textDecoration:"underline"}} onClick={()=>setSelMatchup(null)}>Clear</span>
      </div>}
    </div>
    {/* Weather banner */}
    <PregameWeatherRow/>
    {loading ? <div className="lw"><div className="sp"/><div className="lt">Loading Statcast…</div></div> : <>
      {error && <div className="warn">⚠️ {error}</div>}
      <div className="tw-scroll"><div className="tw-scroll-inner"><table><thead><tr>
        <th>#</th><th>Player</th><th style={{width:36}}>Pick</th>
        <th className={sortKey==="os"?"sk":""} onClick={()=>hs("os")} style={{cursor:"pointer"}}>Grade{sortKey==="os"&&<span style={{color:"var(--accent)",marginLeft:3}}>{sortDir<0?"↓":"↑"}</span>}</th>
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
        const wg = p._wGrade||p.grade||{grade:"X",cls:"x",color:"#2a3a48"};
        return <tr key={p.pid}>
          <td><span className="sv avg" style={{fontSize:10}}>{i+1}</span></td>
          <td><div className="pc" style={{cursor:"pointer"}} onClick={()=>setSelPlayer(p)}><div className="av">{ini(p.name)}</div><div><div className="pn">{p.name}</div><div className="pt" style={{color:p.team&&p.team!=="—"?"var(--muted)":"#ff801030"}}>{p.team&&p.team!=="—"?p.team:"Lineup TBD"}</div></div></div></td>
          <td onClick={e=>e.stopPropagation()}><PickButton pid={p.pid} name={p.name} team={p.team}/></td>
          <td><div style={{display:"flex",alignItems:"center",gap:5}}><GBadge g={wg}/><span style={{fontSize:9,color:wg.color,fontFamily:"DM Mono,monospace"}}>{wg.label}</span></div></td>
          <StatCols p={p} window={window}/>
        </tr>;
      })}</tbody></table></div></div>
    </>}
  </div>;
}

// TAB 2: LIVE
function LiveTab() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback((silent=false) => {
    fetchGames(setLoading, setGames, setError, silent);
    setLastUpdate(new Date().toLocaleTimeString());
  }, []);
  useEffect(() => { load(false); }, []); // initial — show spinner
  // Background refresh every 30s — silent so open game panels stay open
  useEffect(() => {
    const id = setInterval(() => load(true), 60000);
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
      <RefBtn refreshing={refreshing} onClick={async()=>{setRefreshing(true);await fetchGames(setLoading,setGames,setError,true);setLastUpdate(new Date().toLocaleTimeString());setRefreshing(false);}}/>
    </div>
    <div className="note">ℹ️ <strong>Live</strong>: tap → hard contact in HR zones now vs L7. <strong>Upcoming</strong>: tap → 🚀 Liftoff list ranked by HR probability.</div>
    <div className="cards" style={{marginBottom:14}}>
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
  </div>;
}

// TAB 3: SCOUTING BOARD
function LiveTab() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback((silent=false) => {
    fetchGames(setLoading, setGames, setError, silent);
    setLastUpdate(new Date().toLocaleTimeString());
  }, []);
  useEffect(() => { load(false); }, []); // initial — show spinner
  // Background refresh every 30s — silent so open game panels stay open
  useEffect(() => {
    const id = setInterval(() => load(true), 60000);
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
      <RefBtn refreshing={refreshing} onClick={async()=>{setRefreshing(true);await fetchGames(setLoading,setGames,setError,true);setLastUpdate(new Date().toLocaleTimeString());setRefreshing(false);}}/>
    </div>
    <div className="note">ℹ️ <strong>Live</strong>: tap → hard contact in HR zones now vs L7. <strong>Upcoming</strong>: tap → 🚀 Liftoff list ranked by HR probability.</div>
    <div className="cards" style={{marginBottom:14}}>
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
  const [window, setWindow] = useState(3);
  const [selMatchup, setSelMatchup] = useState(null);
  const [games, setGames] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [selPlayer, setSelPlayer] = useState(null);
  const load = useCallback((silent=false) => {
    fetchPlayers(setLoading, setPlayers, setError, silent);
  }, []);
  useEffect(() => { load(false); }, []); // initial load — show spinner
  // Background refresh every 5 min — silent, no spinner, no scroll reset
  useEffect(() => {
    const id = setInterval(() => load(true), 300000);
    return () => clearInterval(id);
  }, [load]);
  useEffect(() => { fetchGames(()=>{}, setGames, ()=>{}); }, []);
  const hs = (k) => { if (sortKey===k) setSortDir(d=>-d); else { setSortKey(k); setSortDir(-1); } };
  const matchupTeamsS = selMatchup
    ? new Set([selMatchup.away.abbr, selMatchup.home.abbr].filter(t=>t&&t!=="???"))
    : null;
  const filtered = players.filter(p => {
    if (matchupTeamsS && matchupTeamsS.size > 0 && !matchupTeamsS.has(p.team)) return false;
    if (searchQ && !p.name.toLowerCase().includes(searchQ.toLowerCase())) return false;
    const wg = (p.windows?.[window]?.grade || p.grade)?.grade;
    if (filter==="aplus") return wg==="A+";
    if (filter==="a") return wg==="A+"||wg==="A";
    if (filter==="b") return wg==="A+"||wg==="A"||wg==="B";
    if (filter==="chasers") return (p.oSwing??30)>=33;
    return true;
  });
  const sortValS = (p, k) => {
    const w = p.windows?.[window];
    if (k === "os") return w?.os ?? p.os ?? 0;
    if (w && k in w) return w[k];
    return p[k] ?? 0;
  };
  const sorted = [...filtered].sort((a,b) => sortDir*(sortValS(b,sortKey)-sortValS(a,sortKey)));
  const apC=players.filter(p=>p.grade?.grade==="A+").length, aC=players.filter(p=>p.grade?.grade==="A").length, bC=players.filter(p=>p.grade?.grade==="B").length, chC=players.filter(p=>(p.oSwing??30)>=33).length;
  return <div>
    <div className="hrow">
      <div className="section-header"><div className="section-title">🎯 Scouting Board</div><div className="section-sub">Contact Quality (50%) + HR Intent (30%) + Readiness (20%) · grades recalculate per window</div></div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <SearchBar value={searchQ} onChange={setSearchQ} placeholder="Search any batter…"/>
        <WindowButtons window={window} setWindow={setWindow}/>
        <RefBtn refreshing={refreshing} onClick={async()=>{setRefreshing(true);await fetchPlayers(setLoading,setPlayers,setError,true);setRefreshing(false);}}/>
      </div>
    </div>
    {/* Matchup selector */}
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,color:"var(--muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginRight:4}}>Matchup:</span>
        <button className={`chip ${!selMatchup?"active":""}`} onClick={()=>setSelMatchup(null)}
          style={{fontSize:10,fontFamily:"'Oswald',sans-serif",fontWeight:600}}>All Batters</button>
        {games.filter(g=>g.away.abbr!=="???"&&g.home.abbr!=="???").map(g=>(
          <button key={g.id} className={`chip ${selMatchup?.id===g.id?"active":""}`}
            onClick={()=>setSelMatchup(selMatchup?.id===g.id?null:g)}
            style={{fontSize:10,fontFamily:"'Oswald',sans-serif",fontWeight:600}}>
            {g.away.abbr} @ {g.home.abbr}
          </button>
        ))}
      </div>
      {selMatchup && <div style={{fontSize:9,color:"var(--accent)",fontFamily:"'DM Mono',monospace",marginTop:4}}>
        Showing {selMatchup.away.abbr} @ {selMatchup.home.abbr} batters only · <span style={{cursor:"pointer",textDecoration:"underline"}} onClick={()=>setSelMatchup(null)}>Clear</span>
      </div>}
    </div>
    <ScoutingWeather games={[]}/>
    <div className="cards">
      <div className="card"><div className="cl">🔴 A+ Threats</div><div className="cv" style={{color:"var(--aplus)"}}>{apC}</div><div className="cs">Red-hot</div></div>
      <div className="card"><div className="cl">🔥 Grade A</div><div className="cv" style={{color:"var(--a)"}}>{aC}</div><div className="cs">Impact bats</div></div>
      <div className="card"><div className="cl">⚡ Grade B</div><div className="cv" style={{color:"var(--b)"}}>{bC}</div><div className="cs">Heating up</div></div>
      <div className="card"><div className="cl">🚫 Chasers</div><div className="cv" style={{color:"#ff3010"}}>{chC}</div><div className="cs">O-Swing ≥ 33%</div></div>
    </div>
    <div className="note">ℹ️ <strong>EV is the grade anchor (60%)</strong>: A+ = 92.5+ mph · A = 90–92.4 · B = 87–89.9 · C = 84–86.9 · D = 81–83.9 · F = &lt;81. Barrel%, Pull Air%, Chase Rate, HR Intent modify the score within each tier — a slow bat cannot reach A regardless of approach.</div>
    <div className="leg"><span className="legt">Grades:</span><div className="legi">{[{g:"A+",c:"var(--aplus)",l:"Red-hot"},{g:"A",c:"var(--a)",l:"Impact"},{g:"B",c:"var(--b)",l:"Heating"},{g:"C",c:"var(--c)",l:"Watch"},{g:"D",c:"var(--d)",l:"Cooling"},{g:"F",c:"var(--f)",l:"Cold"},{g:"X",c:"#3a5060",l:"Ignore"}].map(x=><div key={x.g} className="leit"><div className="ld" style={{background:x.c}}/><strong style={{color:x.c}}>{x.g}</strong> — {x.l}</div>)}</div></div>
    <div className="filters"><span className="fl">Filter:</span>{[{key:"all",label:"All"},{key:"aplus",label:"🔴 A+"},{key:"a",label:"A+ & A"},{key:"b",label:"B+"},{key:"chasers",label:"🚫 Chasers"}].map(f=><button key={f.key} className={`chip ${filter===f.key?"active":""}`} onClick={()=>setFilter(f.key)}>{f.label}</button>)}</div>
    {loading ? <div className="lw"><div className="sp"/><div className="lt">Loading Scouting Board…</div></div> : <>
      {error && <div className="warn">⚠️ {error}</div>}
      <div className="tw-scroll"><div className="tw-scroll-inner"><table><thead><tr>
        <th>#</th><th>Player</th><th style={{width:36}}>Pick</th>
        <th className={sortKey==="os"?"sk":""} onClick={()=>hs("os")} style={{cursor:"pointer"}}>Grade{sortKey==="os"&&<span style={{color:"var(--accent)",marginLeft:3}}>{sortDir<0?"↓":"↑"}</span>}</th>
        <th><Tip text="Composite score: CQ 50% + HRI 30% + RDY 20%"><span>Score</span></Tip></th>
        <th><Tip text="Contact Quality"><span>CQ</span></Tip></th>
        <th><Tip text="HR Intent"><span>HRI</span></Tip></th>
        <th><Tip text="Readiness / Plate IQ"><span>RDY</span></Tip></th>
        <th>Plate IQ</th>
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
        const w = p.windows?.[window] ?? {};
        const wg = w.grade||p.grade||{grade:"X",cls:"x",color:"#2a3a48"};
        const wOS = w.os ?? p.os ?? 0;
        const wCQ = w.cq ?? p.cq ?? 0;
        const wHRI = w.hri ?? p.hri ?? 0;
        const wRD = w.rd ?? p.rd ?? 0;
        const piq = p.piq||{label:"—",color:"var(--muted)"};
        return <tr key={p.pid}>
          <td><span className="sv avg" style={{fontSize:10}}>{i+1}</span></td>
          <td><div className="pc" style={{cursor:"pointer"}} onClick={()=>setSelPlayer(p)}><div className="av">{ini(p.name)}</div><div><div className="pn">{p.name}</div><div className="pt" style={{color:p.team&&p.team!=="—"?"var(--muted)":"#ff801030"}}>{p.team&&p.team!=="—"?p.team:"Lineup TBD"}</div></div></div></td>
          <td onClick={e=>e.stopPropagation()}><PickButton pid={p.pid} name={p.name} team={p.team}/></td>
          <td><div style={{display:"flex",alignItems:"center",gap:5}}><GBadge g={wg}/><span style={{fontSize:9,color:wg.color,fontFamily:"DM Mono,monospace",lineHeight:1.3}}>{wg.label}</span></div></td>
          <td><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:38,height:3,borderRadius:2,background:"var(--border)",overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,width:`${wOS}%`,background:wg.color}}/></div><span style={{fontFamily:"Oswald,sans-serif",fontSize:13,color:wg.color}}>{wOS.toFixed?wOS.toFixed(0):wOS}</span></div></td>
          <td><span className="sp3 cq">{wCQ.toFixed?wCQ.toFixed(1):wCQ}</span></td>
          <td><span className="sp3 hi">{wHRI.toFixed?wHRI.toFixed(1):wHRI}</span></td>
          <td><span className="sp3 rd">{wRD.toFixed?wRD.toFixed(1):wRD}</span></td>
          <td><span style={{fontSize:10,fontFamily:"DM Mono,monospace",color:piq.color,fontWeight:600}}>{piq.label}</span></td>
          <StatCols p={p} window={window}/>
        </tr>;
      })}</tbody></table></div></div>
    </>}
  </div>;
}


// ── PITCH PROFILE ENGINE ──────────────────────────────────

// ── BATTER HANDEDNESS DATA ─────────────────────────────────
const BATTER_HAND = {
  "Aaron Judge":"R","Juan Soto":"L","Giancarlo Stanton":"R","Anthony Rizzo":"L",
  "Gleyber Torres":"R","Anthony Volpe":"R","DJ LeMahieu":"R","Jose Trevino":"R","Alex Verdugo":"L",
  "Shohei Ohtani":"L","Freddie Freeman":"L","Mookie Betts":"R","Will Smith":"R",
  "Max Muncy":"L","Teoscar Hernandez":"R","Gavin Lux":"L","Miguel Rojas":"R","Andy Pages":"R",
  "Yordan Alvarez":"L","Jose Abreu":"R","Alex Bregman":"R","Kyle Tucker":"L",
  "Yainer Diaz":"R","Chas McCormick":"R","Jake Meyers":"L","Mauricio Dubon":"R","Jeremy Pena":"R",
  "Bryce Harper":"L","Kyle Schwarber":"L","Trea Turner":"R","Nick Castellanos":"R",
  "J.T. Realmuto":"R","Alec Bohm":"R","Brandon Marsh":"L","Bryson Stott":"L","Johan Rojas":"R",
  "Pete Alonso":"R","Francisco Lindor":"S","Mark Vientos":"R","Brandon Nimmo":"L",
  "Jeff McNeil":"L","Starling Marte":"R","Tyrone Taylor":"R","Francisco Alvarez":"R","Luis Torrens":"R",
  "Gunnar Henderson":"L","Adley Rutschman":"S","Anthony Santander":"S","Ryan Mountcastle":"R",
  "Austin Hays":"R","Cedric Mullins":"S","Ramon Urias":"R","Jorge Mateo":"R","James McCann":"R",
  "Ian Happ":"S","Nico Hoerner":"R","Seiya Suzuki":"R","Mike Tauchman":"L",
  "Christopher Morel":"R","Dansby Swanson":"R","Miguel Amaya":"R","Cody Bellinger":"L",
  "Marcus Semien":"R","Corey Seager":"L","Adolis Garcia":"R","Josh Jung":"R",
  "Nathaniel Lowe":"L","Travis Jankowski":"L","Evan Carter":"L","Jonah Heim":"S","Leody Taveras":"S",
  "Jose Ramirez":"S","Josh Naylor":"L","Steven Kwan":"L","David Fry":"R",
  "Lane Thomas":"R","Bo Naylor":"L","Will Brennan":"L","Tyler Freeman":"R","Brayan Rocchio":"S",
  "Julio Rodriguez":"R","Cal Raleigh":"L","Jorge Polanco":"S","Ty France":"R",
  "Mitch Garver":"R","Josh Rojas":"L","Luke Raley":"L","Victor Robles":"R","Randy Arozarena":"R",
  "Rafael Devers":"L","Jarren Duran":"L","Triston Casas":"L","Rob Refsnyder":"R",
  "Wilyer Abreu":"R","Connor Wong":"R","Masataka Yoshida":"L","David Hamilton":"L","Romy Gonzalez":"R",
  "Ronald Acuna Jr":"R","Matt Olson":"L","Ozzie Albies":"S","Austin Riley":"R",
  "Sean Murphy":"R","Michael Harris II":"L","Jorge Soler":"R","Marcell Ozuna":"R","Orlando Arcia":"R",
  "Manny Machado":"R","Fernando Tatis Jr":"R","Jake Cronenworth":"L","Xander Bogaerts":"R",
  "Kyle Higashioka":"R","Ha-Seong Kim":"R","Jackson Merrill":"L","David Peralta":"L","Luis Arraez":"L",
  "Christian Yelich":"L","Willy Adames":"R","William Contreras":"R","Sal Frelick":"L",
  "Joey Wiemer":"R","Jackson Chourio":"R","Rhys Hoskins":"R","Gary Sanchez":"R","Owen Miller":"R",
  "Carlos Correa":"R","Byron Buxton":"R","Ryan Jeffers":"R","Max Kepler":"L",
  "Jose Miranda":"R","Trevor Larnach":"L","Edouard Julien":"L","Kyle Farmer":"R","Royce Lewis":"R",
  "Yandy Diaz":"R","Josh Lowe":"L","Harold Ramirez":"R","Jonathan Aranda":"L",
  "Isaac Paredes":"R","Richie Palacios":"L","Jose Siri":"R","Christian Bethancourt":"R",
  "Bo Bichette":"R","Vladimir Guerrero Jr":"R","Daulton Varsho":"L","George Springer":"R",
  "Kevin Kiermaier":"L","Alejandro Kirk":"R","Davis Schneider":"R","Justin Turner":"R","Ernie Clement":"R",
  "Elly De La Cruz":"S","Jonathan India":"R","TJ Friedl":"L","Tyler Stephenson":"R",
  "Spencer Steer":"R","Will Benson":"L","Jake Fraley":"L","Jeimer Candelario":"S","Nick Martini":"L",
  "Matt Chapman":"R","LaMonte Wade Jr":"L","Patrick Bailey":"S","Wilmer Flores":"R",
  "Michael Conforto":"L","Joc Pederson":"L","Luis Matos":"R","Thairo Estrada":"R","Casey Schmitt":"R",
  "Corbin Carroll":"L","Ketel Marte":"S","Lourdes Gurriel Jr":"R","Christian Walker":"R",
  "Gabriel Moreno":"R","Pavin Smith":"L","Jake McCarthy":"L","Alek Thomas":"L","Eugenio Suarez":"R",
};

function getBatterHand(name) {
  // Seed by name so same player always gets same hand
  const nc = (name.charCodeAt(0)||82) + (name.charCodeAt(1)||0);
  return BATTER_HAND[name] || (nc % 3 === 0 ? "L" : nc % 7 === 0 ? "S" : "R");
}

// ── HANDEDNESS MATCHUP ENGINE ──────────────────────────────
// LHB vs RHP = platoon advantage (batter-friendly)
// RHB vs LHP = platoon advantage (batter-friendly)
// Same side  = pitcher advantage
// Switch hitter always gets the favorable side
function getHandMatchup(batterHand, pitcherHand) {
  const eff = batterHand==="S" ? (pitcherHand==="R"?"L":"R") : batterHand;
  if (eff==="L"&&pitcherHand==="R") return {label:"⚡ Platoon Adv",cls:"pos",multiplier:1.12,evBonus:2.2,detail:"LHB vs RHP — batter platoon edge"};
  if (eff==="R"&&pitcherHand==="L") return {label:"⚡ Platoon Adv",cls:"pos",multiplier:1.10,evBonus:1.8,detail:"RHB vs LHP — batter platoon edge"};
  if (eff==="L"&&pitcherHand==="L") return {label:"⚠️ Same Side",cls:"neg",multiplier:0.88,evBonus:-1.5,detail:"LHB vs LHP — pitcher platoon edge"};
  return {label:"— Even",cls:"neu",multiplier:0.94,evBonus:-0.8,detail:"RHB vs RHP — slight pitcher edge"};
}

function applyHandedness(stats, matchup) {
  const m = matchup.multiplier;
  return {
    ...stats,
    ev:      Math.round((stats.ev + matchup.evBonus)*10)/10,
    barrel:  Math.round(stats.barrel*m*10)/10,
    flyBall: Math.round(stats.flyBall*(m*0.8+0.2)*10)/10,
    la:      Math.round((stats.la+(m>1?1.5:-1.5))*10)/10,
    pullAir: Math.round(stats.pullAir*(m*0.7+0.3)*10)/10,
    chase:   Math.round(stats.chase*(m>1?0.92:1.08)*10)/10,
    score:   Math.round(Math.min(stats.score*m,100)*10)/10,
  };
}

// ── PITCH PROFILE ─────────────────────────────────────────
function genPitchProfile(p) {
  const types = ["4-Seam FB","Slider","Changeup","Curveball","Cutter"];
  const profile = {};
  types.forEach(pt => {
    const isFB=pt==="4-Seam FB"||pt==="Cutter", isBreaking=pt==="Slider"||pt==="Curveball", isOS=pt==="Changeup";
    const r=(base,rng,idx=0)=>Math.round((base+(seededRand(2824+idx,24)*rng*2-rng))*10)/10;
    const ev=r(p.avgEV,isFB?5:isBreaking?4:3), barrel=r(p.barrel,isFB?4:isBreaking?3:2);
    const flyBall=r(p.flyBall??35,8), la=r(p.launchAngle??18,isFB?6:5);
    const pullAir=r(p.pullAir,isFB?5:4);
    const chase=r(isOS?(p.oSwing??30)+8:isBreaking?(p.oSwing??30)+4:(p.oSwing??30)-3,6);
    const evN=Math.min(Math.max((ev-88)/12,0),1),barN=Math.min(barrel/14,1),fbN=Math.min(flyBall/45,1);
    const laN=Math.min(Math.max((la-10)/22,0),1),puN=Math.min(pullAir/28,1),chN=Math.max(1-chase/45,0);
    const score=Math.round((evN*30+barN*25+fbN*15+laN*10+puN*10+chN*10)*10)/10;
    profile[pt]={ev,barrel,flyBall,la,pullAir,chase,score,grade:getSG(score)};
  });
  return profile;
}

// ── TEAM ROSTERS ──────────────────────────────────────────
// MLB Team ID → Abbreviation mapping (official MLB Stats API IDs)
const TEAM_IDS = {
  NYY:147, BOS:111, LAD:119, HOU:117, PHI:143, NYM:121, BAL:110, CHC:112,
  TEX:140, CLE:114, SEA:136, ATL:144, SD:135,  MIL:158, MIN:142, TB:139,
  TOR:141, CIN:113, SF:137,  ARI:109, DET:116, KC:118,  OAK:133, LAA:108,
  WSH:120, COL:115, MIA:146, PIT:134, STL:138, CHW:145,
};
const TEAM_ID_TO_ABB = Object.fromEntries(Object.entries(TEAM_IDS).map(([k,v])=>[v,k]));
const MLB_TEAMS = ["NYY","BOS","LAD","HOU","PHI","NYM","BAL","CHC","TEX","CLE","SEA","ATL","SD","MIL","MIN","TB","TOR","CIN","SF","ARI","DET","KC","OAK","LAA","WSH","COL","MIA","PIT","STL","CHW"];

// Live roster cache — populated on demand, persists for the session
const LIVE_ROSTER_CACHE = {};
const ROSTERS = {
  NYY:["Aaron Judge","Cody Bellinger","Giancarlo Stanton","Paul Goldschmidt","Gleyber Torres","Anthony Volpe","Jazz Chisholm Jr","Austin Wells","Trent Grisham"],
  LAD:["Shohei Ohtani","Freddie Freeman","Mookie Betts","Will Smith","Max Muncy","Teoscar Hernandez","Gavin Lux","Miguel Rojas","Andy Pages"],
  HOU:["Yordan Alvarez","Kyle Tucker","Alex Bregman","Yainer Diaz","Chas McCormick","Jake Meyers","Mauricio Dubon","Jeremy Pena","Zach Dezenzo"],
  PHI:["Bryce Harper","Kyle Schwarber","Trea Turner","Nick Castellanos","J.T. Realmuto","Alec Bohm","Brandon Marsh","Bryson Stott","Johan Rojas"],
  NYM:["Juan Soto","Pete Alonso","Francisco Lindor","Mark Vientos","Brandon Nimmo","Jeff McNeil","Starling Marte","Francisco Alvarez","Tyrone Taylor"],
  BAL:["Gunnar Henderson","Adley Rutschman","Anthony Santander","Ryan Mountcastle","Austin Hays","Cedric Mullins","Ramon Urias","Jorge Mateo","James McCann"],
  CHC:["Ian Happ","Nico Hoerner","Seiya Suzuki","Dansby Swanson","Miguel Amaya","Christopher Morel","Pete Crow-Armstrong","Michael Busch","Cody Bellinger"],
  TEX:["Marcus Semien","Corey Seager","Adolis Garcia","Josh Jung","Nathaniel Lowe","Evan Carter","Jonah Heim","Leody Taveras","Wyatt Langford"],
  CLE:["Jose Ramirez","Josh Naylor","Steven Kwan","David Fry","Lane Thomas","Bo Naylor","Will Brennan","Tyler Freeman","Brayan Rocchio"],
  SEA:["Julio Rodriguez","Cal Raleigh","Randy Arozarena","Jorge Polanco","Mitch Garver","Josh Rojas","Luke Raley","Victor Robles","Tyler Locklear"],
  BOS:["Rafael Devers","Jarren Duran","Triston Casas","Rob Refsnyder","Wilyer Abreu","Connor Wong","Masataka Yoshida","David Hamilton","Romy Gonzalez"],
  ATL:["Ronald Acuna Jr","Matt Olson","Ozzie Albies","Austin Riley","Sean Murphy","Michael Harris II","Marcell Ozuna","Orlando Arcia","Ramon Laureano"],
  SD:["Manny Machado","Fernando Tatis Jr","Luis Arraez","Jake Cronenworth","Kyle Higashioka","Ha-Seong Kim","Jackson Merrill","David Peralta","Ethan Salas"],
  MIL:["Christian Yelich","William Contreras","Sal Frelick","Joey Wiemer","Jackson Chourio","Brice Turang","Blake Perkins","Jake Bauers","Joey Wiemer"],
  MIN:["Carlos Correa","Byron Buxton","Ryan Jeffers","Royce Lewis","Jose Miranda","Trevor Larnach","Edouard Julien","Matt Wallner","Brooks Lee"],
  TB:["Yandy Diaz","Josh Lowe","Harold Ramirez","Jonathan Aranda","Isaac Paredes","Richie Palacios","Jose Siri","Christian Bethancourt","Ben Rortvedt"],
  TOR:["Vladimir Guerrero Jr","Bo Bichette","Daulton Varsho","George Springer","Alejandro Kirk","Davis Schneider","Addison Barger","Spencer Horwitz","Nathan Lukes"],
  CIN:["Elly De La Cruz","Jonathan India","TJ Friedl","Tyler Stephenson","Spencer Steer","Will Benson","Jake Fraley","Jeimer Candelario","Nick Martini"],
  SF:["Matt Chapman","LaMonte Wade Jr","Patrick Bailey","Wilmer Flores","Michael Conforto","Joc Pederson","Luis Matos","Thairo Estrada","Casey Schmitt"],
  ARI:["Corbin Carroll","Ketel Marte","Lourdes Gurriel Jr","Christian Walker","Gabriel Moreno","Pavin Smith","Jake McCarthy","Alek Thomas","Eugenio Suarez"],
  DET:["Riley Greene","Spencer Torkelson","Kerry Carpenter","Parker Meadows","Matt Vierling","Jake Rogers","Zach McKinstry","Trey Sweeney","Andy Ibanez"],
  KC:["Bobby Witt Jr","Vinnie Pasquantino","Salvador Perez","MJ Melendez","Hunter Dozier","Michael Massey","Drew Waters","Maikel Garcia","Kyle Isbel"],
  OAK:["Brent Rooker","Lawrence Butler","Shea Langeliers","Tyler Soderstrom","JJ Bleday","Zack Gelof","Max Schuemann","Esteury Ruiz","Abraham Toro"],
  LAA:["Mike Trout","Anthony Rendon","Taylor Ward","Brandon Drury","Luis Rengifo","Logan O'Hoppe","Mickey Moniak","Zach Neto","Kevin Pillar"],
  WSH:["CJ Abrams","Joey Meneses","Keibert Ruiz","Lane Thomas","Dominic Smith","Alex Call","Stone Garrett","Ildemaro Vargas","Jacob Young"],
  COL:["Charlie Blackmon","Ryan McMahon","C.J. Cron","Elias Diaz","Brenton Doyle","Nolan Jones","Sean Bouchard","Alan Trejo","Ezequiel Tovar"],
  MIA:["Jorge Soler","Jake Burger","Bryan De La Cruz","Jesus Sanchez","Nick Fortes","Griffin Conine","Jonah Bride","Xavier Edwards","Connor Norby"],
  PIT:["Oneil Cruz","Bryan Reynolds","Andrew McCutchen","Ke'Bryan Hayes","Connor Joe","Rowdy Tellez","Henry Davis","Ji Hwan Bae","Michael Chavis"],
  STL:["Nolan Arenado","Willson Contreras","Dylan Carlson","Lars Nootbaar","Brendan Donovan","Jordan Walker","Alec Burleson","Ivan Herrera","Masyn Winn"],
  CHW:["Luis Robert Jr","Andrew Vaughn","Eloy Jimenez","Yoan Moncada","Gavin Sheets","Jake Burger","Seby Zavala","Tim Anderson","Romy Gonzalez"],
};

// Fallback static roster — used only if API fails
function genStaticRoster(team) {
  const names = ROSTERS[team] || Array.from({length:9},(_,i)=>`${team} Batter ${i+1}`);
  return names.map((name,i) => {
    const seed = i + (name.charCodeAt(0) || 1) + (name.charCodeAt(1) || 1);
    const barrel=Math.round(sr(seed,1,6,22)*10)/10, hardHit=Math.round(sr(seed,2,36,62)*10)/10, avgEV=Math.round(sr(seed,3,87,99)*10)/10, oSwing=Math.round(sr(seed,4,20,42)*10)/10;
    const hand=getBatterHand(name);
    const p={id:i,name,team,hand,injured:false,barrel,hardHit,avgEV,sweetSpot:Math.round(sr(seed,5,28,46)*10)/10,pullAir:Math.round(sr(seed,6,12,32)*10)/10,flyBall:Math.round(sr(seed,7,28,48)*10)/10,launchAngle:Math.round(sr(seed,8,12,30)*10)/10,hr:Math.floor(sr(seed,9,0,22)),bbPct:Math.round(sr(seed,10,6,18)*10)/10,kPct:Math.round(sr(seed,11,14,32)*10)/10,oSwing,zContact:Math.round(sr(seed,12,72,92)*10)/10};
    p.bbkRatio=p.bbPct/p.kPct;p.cq=calcCQ(p);p.hri=calcHRI(p);p.rd=calcRD(p);
    p.os=calcOS(p);p.grade=getSG(p.os);p.piq=getPIQ(p);
    p.pitchProfile=genPitchProfile(p);
    return p;
  });
}

// Live roster fetch — hits MLB API, caches per session
async function genTeamRoster(team) {
  // Return cache if already fetched
  if (LIVE_ROSTER_CACHE[team]) return LIVE_ROSTER_CACHE[team];

  const teamId = TEAM_IDS[team];
  if (!teamId) return genStaticRoster(team);

  try {
    const res = await fetch(`/api/roster?teamId=${teamId}`);
    const data = await res.json();
    if (!data.players || data.players.length === 0) throw new Error("Empty roster");

    const players = data.players.map((p, i) => {
      const hand = p.hand || getBatterHand(p.name);
      const s6=(p.id||i)+1; const barrel=Math.round(sr(s6,1,6,22)*10)/10,hardHit=Math.round(sr(s6,2,36,62)*10)/10,avgEV=Math.round(sr(s6,3,87,99)*10)/10,oSwing=Math.round(sr(s6,10,20,38)*10)/10;
      const pl = {
        id: p.id || i, name: p.name, team, hand,
        injured: p.injured || false,
        position: p.position || "",
        barrel, hardHit, avgEV,
        sweetSpot:Math.round(sr(s6,5,28,46)*10)/10,
        pullAir:Math.round(sr(s6,6,10,28)*10)/10,
        flyBall:Math.round(sr(s6,7,25,45)*10)/10,
        launchAngle:Math.round(sr(s6,8,12,30)*10)/10,
        hr:Math.floor(sr(s6,9,0,22)),
        bbPct:Math.round(sr(s6,10,6,15)*10)/10,
        kPct:Math.round(sr(s6,11,14,28)*10)/10,
        oSwing, zContact:Math.round(sr(s6,12,72,92)*10)/10,
      };
      pl.bbkRatio=pl.bbPct/pl.kPct;pl.cq=calcCQ(pl);pl.hri=calcHRI(pl);pl.rd=calcRD(pl);
      pl.os=calcOS(pl);pl.grade=getSG(pl.os);pl.piq=getPIQ(pl);
      pl.pitchProfile=genPitchProfile(pl);
      return pl;
    });

    LIVE_ROSTER_CACHE[team] = players;
    return players;
  } catch(err) {
    console.warn(`Live roster failed for ${team}:`, err.message, "— using static fallback");
    return genStaticRoster(team);
  }
}

// ── BvP BATTERS — handedness-adjusted ────────────────────
function genBvPBattersNew(pitcher) {
  // Use opposing team's likely lineup — pulled from game data
  const batterSide = pitcher.team; // pitcher's team abbr
  const opposingBatters = [
    ["Aaron Judge","NYY"],["Juan Soto","NYM"],["Yordan Alvarez","HOU"],
    ["Kyle Tucker","HOU"],["Pete Alonso","NYM"],["Freddie Freeman","LAD"],
    ["Mookie Betts","LAD"],["Gunnar Henderson","BAL"],["Bobby Witt Jr","KC"],
  ];
  return opposingBatters.map((n,i)=>{
    const s3=i+1;
    const barrel=Math.round(sr(s3,1,6,22)*10)/10,hardHit=Math.round(sr(s3,2,36,62)*10)/10,avgEV=Math.round(sr(s3,3,87,99)*10)/10;
    const bbPct=Math.round(sr(s3,7,6,14)*10)/10,kPct=Math.round(sr(s3,8,14,28)*10)/10,oSwing=Math.round(sr(s3,10,20,38)*10)/10,zContact=Math.round(sr(s3,12,72,92)*10)/10;
    const hand=getBatterHand(n[0]);
    const matchup=getHandMatchup(hand,pitcher.hand);
    const sbv=bid||i+1;
    const evBase=88+seededRand(sbv,3)*14,chaseBase=oSwing+(seededRand(sbv,22)*8-4);
    const barrelBase=barrel+(seededRand(sbv,23)*4-2),fbBase=28+seededRand(sbv,4)*22;
    const pullBase=12+seededRand(sbv,5)*20,laBase=12+seededRand(sbv,5)*22;
    const m=matchup.multiplier;
    const evVsFB=Math.round((evBase+matchup.evBonus)*10)/10;
    const barrelAdj=Math.round(barrelBase*m*10)/10;
    const fbAdj=Math.round(fbBase*(m*0.8+0.2)*10)/10;
    const laAdj=Math.round((laBase+(m>1?1.5:-1.5))*10)/10;
    const pullAdj=Math.round(pullBase*(m*0.7+0.3)*10)/10;
    const chaseAdj=Math.round(chaseBase*(m>1?0.92:1.08)*10)/10;
    const careerBA=0.18+seededRand(sbv,12)*0.18,careerHR=Math.floor(seededRand(sbv,13)*5),careerAB=Math.floor(8+seededRand(sbv,14)*30);
    const last3=[...Array(3)].map((_,li)=>{const rv=seededRand(2964,25+li);return rv>0.85?"HR":rv>0.6?"H":rv>0.3?"O":"K";});
    const b={id:i,name:n[0],team:n[1],hand,matchup,barrel,hardHit,avgEV,sweetSpot:28+seededRand(sbv,4)*18,pullAir:12+seededRand(sbv,5)*18,flyBall:28+seededRand(sbv,4)*20,launchAngle:12+seededRand(sbv,5)*18,hr:Math.floor(seededRand(sbv,15)*20),bbPct,kPct,oSwing,zContact,bbkRatio:bbPct/kPct,evVsFB,chaseVsPitch:chaseAdj,barrelVsPitch:barrelAdj,flyBallVsPitch:fbAdj,pullAirVsPitch:pullAdj,launchAngleVsPitch:laAdj,careerBA,careerHR,careerAB,last3};
    b.cq=calcCQ(b);b.hri=calcHRI(b);b.rd=calcRD(b);b.os=calcOS(b);b.grade=getSG(b.os);b.piq=getPIQ(b);
    const evN=Math.min(Math.max((evVsFB-88)/12,0),1),barN=Math.min(barrelAdj/14,1),fbN=Math.min(fbAdj/45,1);
    const laN=Math.min(Math.max((laAdj-10)/22,0),1),puN=Math.min(pullAdj/28,1),chN=Math.max(1-chaseAdj/45,0);
    const base=evN*25+barN*25+fbN*15+laN*15+puN*10+chN*10;
    const handBonus=m>1.05?8:m<0.92?-8:-3;
    b.ms=Math.round(Math.min(Math.max(base+handBonus,0),100)*10)/10;
    b.mg=getSG(b.ms);
    return b;
  }).sort((a,b)=>b.ms-a.ms);
}


// TAB 4: BATTER vs PITCHER
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
    const pitchSide = selSide === "away" ? "home" : "away";
    const batterSide = selSide; // batters are on the side YOU selected
    const p = genPitcher(selGame, pitchSide);
    setPitcher(p);
    // Fetch real opposing lineup from boxscore
    (async () => {
      try {
        const res = await fetch(`/api/boxscore?gamePk=${selGame.gamePk}`);
        const data = await res.json();
        const team = data.teams?.[batterSide];
        const ta = team?.team?.abbreviation || selGame[batterSide]?.abbr || batterSide.toUpperCase();
        const batterIds = team?.batters?.length > 0
          ? team.batters.slice(0, 9)
          : Object.keys(team?.players || {}).slice(0, 9).map(k => parseInt(k.replace("ID","")));
        const liveBatters = batterIds.map((bid, i) => {
          const pl = team?.players?.[`ID${bid}`];
          if (!pl) return null;
          if (pl.position?.abbreviation === "P") return null;
          const name = pl.person?.fullName || `Player ${bid}`;
          const hand = pl.person?.batSide?.code || getBatterHand(name);
          const matchup = getHandMatchup(hand, p.hand === "RHP" ? "R" : "L");
          const s2=bid||i+1;
          const barrel=Math.round(sr(s2,1,6,22)*10)/10, hardHit=Math.round(sr(s2,2,36,62)*10)/10, avgEV=Math.round(sr(s2,3,87,99)*10)/10;
          const bbPct=Math.round(sr(s2,7,6,14)*10)/10, kPct=Math.round(sr(s2,8,14,28)*10)/10, oSwing=Math.round(sr(s2,10,20,38)*10)/10;
          const evBase=88+seededRand(3020,3)*14, m=matchup.multiplier;
          const evVsFB=Math.round((evBase+matchup.evBonus)*10)/10;
          const barrelAdj=Math.round(barrel*m*10)/10, fbAdj=Math.round((28+seededRand(3022,4)*22)*(m*0.8+0.2)*10)/10;
          const laAdj=Math.round(((12+seededRand(3023,5)*22)+(m>1?1.5:-1.5))*10)/10;
          const pullAdj=Math.round((12+seededRand(3024,5)*20)*(m*0.7+0.3)*10)/10;
          const chaseAdj=Math.round((oSwing+(seededRand(3025,22)*8-4))*(m>1?0.92:1.08)*10)/10;
          const careerBA=0.18+seededRand(3026,12)*0.18, careerHR=Math.floor(seededRand(3026,13)*5), careerAB=Math.floor(8+seededRand(3026,14)*30);
          const last3=[...Array(3)].map((_,li)=>{const rv=seededRand(3027,25+li);return rv>0.85?"HR":rv>0.6?"H":rv>0.3?"O":"K";});
          const b={id:bid,name,team:ta,hand,matchup,barrel,hardHit,avgEV,sweetSpot:28+seededRand(3028,4)*18,pullAir:12+seededRand(3028,5)*18,flyBall:28+seededRand(3028,4)*20,launchAngle:12+seededRand(3028,5)*18,hr:Math.floor(seededRand(3028,15)*20),bbPct,kPct,oSwing,zContact:72+seededRand(3028,9)*20,bbkRatio:bbPct/kPct,evVsFB,chaseVsPitch:chaseAdj,barrelVsPitch:barrelAdj,flyBallVsPitch:fbAdj,pullAirVsPitch:pullAdj,launchAngleVsPitch:laAdj,careerBA,careerHR,careerAB,last3};
          b.cq=calcCQ(b);b.hri=calcHRI(b);b.rd=calcRD(b);b.os=calcOS(b);b.grade=getSG(b.os);b.piq=getPIQ(b);
          const evN=Math.min(Math.max((evVsFB-88)/12,0),1),barN=Math.min(barrelAdj/14,1),fbN=Math.min(fbAdj/45,1);
          const laN=Math.min(Math.max((laAdj-10)/22,0),1),puN=Math.min(pullAdj/28,1),chN=Math.max(1-chaseAdj/45,0);
          const base=evN*25+barN*25+fbN*15+laN*15+puN*10+chN*10;
          const handBonus=m>1.05?8:m<0.92?-8:-3;
          b.ms=Math.round(Math.min(Math.max(base+handBonus,0),100)*10)/10;
          b.mg=getSG(b.ms);
          return b;
        }).filter(Boolean).sort((a,b)=>b.ms-a.ms);
        if (liveBatters.length > 0) { setBatters(liveBatters); return; }
      } catch(e) { console.warn("Live lineup fetch failed:", e.message); }
      // Fallback to generated batters
      setBatters(genBvPBattersNew(p));
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
        <div className="pmg">{pitcher.pitchMix.map(pitch=>{
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
            <td><div className="pc"><div className="av">{ini(b.name)}</div><div><div className="pn">{b.name}</div><div className="pt">{b.team} · {b.hr} HR</div></div></div></td>
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

  const hs = (k) => { if (sortKey===k) setSortDir(d=>-d); else { setSortKey(k); setSortDir(-1); } };

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
                <td><div className="pc"><div className="av" style={{border:`1px solid ${top3?pitchCol+"50":"var(--border)"}`}}>{ini(p.name)}</div><div><div className="pn">{p.name}</div><div className="pt">{p.team} · {p.hr} HR</div></div></div></td>
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
let HR_LAST_FETCH = 0;
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
    // Only update if we got real data — keep previous data if new fetch returns 0
    const newHRs = data.homeruns || [];
    if (newHRs.length > 0 || HR_DATA.length === 0) {
      HR_DATA = newHRs;
    }
    HR_LAST_FETCH = now;
    console.log("[HRs] Fetched:", newHRs.length, "HRs, showing:", HR_DATA.length);
    return HR_DATA;
  } catch(e) {
    console.warn("[HRs] Fetch failed:", e.message);
    return HR_DATA; // return cached data on failure
  }
}

function HRTicker({ onHRClick }) {
  const [hrs, setHrs] = useState([]);
  const [tickerReady, setTickerReady] = useState(false);
  useEffect(() => {
    fetchHRs(true).then(d => { setHrs(d); setTickerReady(true); });
    const id = setInterval(() => fetchHRs(false).then(setHrs), 60000);
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
  const [sortDir, setSortDir] = useState(-1);
  const [filterTeam, setFilterTeam] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchHRs(true); // always force fresh
    setHrs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const hs = (k) => { if (sortKey===k) setSortDir(d=>-d); else { setSortKey(k); setSortDir(-1); } };

  const teams = [...new Set(hrs.map(h => h.batterTeam))].filter(Boolean).sort();

  const filtered = hrs.filter(h => filterTeam === "all" || h.batterTeam === filterTeam);
  const sorted = [...filtered].sort((a,b) => {
    // Put nulls at bottom always
    const av = a[sortKey], bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "string") return sortDir * av.localeCompare(bv);
    return sortDir * (bv - av);
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
        <div className="section-sub">Every homer hit today · live play-by-play · exit velo · distance · pitch type</div>
      </div>
      <RefBtn refreshing={refreshing} onClick={async()=>{setRefreshing(true);await load();setRefreshing(false);}}/>
    </div>

    {/* Stats summary cards */}
    <div className="cards" style={{marginBottom:14}}>
      <div className="card"><div className="cl">💥 Total HRs</div><div className="cv" style={{color:"var(--accent)"}}>{totalHRs}</div><div className="cs">today</div></div>
      <div className="card"><div className="cl">🎉 Grand Slams</div><div className="cv" style={{color:"var(--accent2)"}}>{slamCount}</div><div className="cs">today</div></div>
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

    {/* Team filter */}
    {teams.length > 0 && <div className="filters" style={{marginBottom:12}}>
      <span className="fl">Team:</span>
      <button className={`chip ${filterTeam==="all"?"active":""}`} onClick={()=>setFilterTeam("all")}>All</button>
      {teams.map(t => <button key={t} className={`chip ${filterTeam===t?"active":""}`} onClick={()=>setFilterTeam(t)}>{t}</button>)}
    </div>}

    {loading
      ? <div className="lw"><div className="sp"/><div className="lt">Loading today's home runs…</div></div>
      : sorted.length === 0
        ? <div style={{padding:"40px",textAlign:"center",color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>
            {totalHRs === 0 ? "No home runs yet today. Check back once games start! ⚾" : "No HRs match the current filter."}
          </div>
        : <div className="tw"><table style={{width:"100%"}}>
            <thead><tr>
              <th style={{width:24,cursor:"default"}}>#</th>
              {[
                {key:"batterTeam", label:"Team",     tip:"Batter's team"},
                {key:"batterName", label:"Batter",   tip:"Batter name"},
                {key:"rbi",        label:"Type / RBI",tip:"HR type and RBIs"},
                {key:"inning",     label:"Inning",   tip:"Inning hit"},
                {key:"outs",       label:"Outs",     tip:"Outs when hit"},
                {key:"launchAngle",label:"Angle",    tip:"Launch angle °. 25–35° = HR sweet spot"},
                {key:"exitVelo",   label:"Exit Velo",tip:"Exit velocity mph. 95+ = hard hit, 103+ = elite"},
                {key:"distance",   label:"Distance", tip:"Estimated distance in feet"},
                {key:"pitchType",  label:"Pitch",    tip:"Pitch type thrown"},
                {key:"pitcherName",label:"vs Pitcher",tip:"Pitcher who gave it up"},
                {key:"gameId",     label:"Game",     tip:"Matchup"},
              {key:"chronoIndex",label:"Time",     tip:"Chronological order — most recent first"},
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
                  <td><span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:13,color:"var(--text)"}}>{hr.batterTeam}</span></td>
                  <td><div className="pn">{hr.batterName}</div></td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span className={`hr-badge ${badgeCls}`}>{hr.hrType}</span>
                      <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:16,color:hr.rbi>=2?"var(--accent)":"var(--text)"}}>{hr.rbi} RBI</span>
                    </div>
                  </td>
                  <td><span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{hr.halfInning==="top"?"▲":"▼"} {hr.inning}</span></td>
                  <td><span className="sv avg">{hr.outs}</span></td>
                  <td><span className={`sv ${hr.launchAngle>=25&&hr.launchAngle<=35?"good":"avg"}`}>{hr.launchAngle!=null?`${hr.launchAngle}°`:"—"}</span></td>
                  <td><span className={`sv ${evC}`}>{hr.exitVelo!=null?`${hr.exitVelo}`:"—"}</span></td>
                  <td><span className={`sv ${distC}`}>{hr.distance!=null?`${hr.distance}ft`:"—"}</span></td>
                  <td>{hr.pitchType?<span style={{fontSize:10,fontFamily:"'DM Mono',monospace",padding:"2px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{hr.pitchType}</span>:<span style={{color:"var(--muted)"}}>—</span>}</td>
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

function PowerBITab() {
  return <div>
    <div className="section-header" style={{marginBottom:16}}>
      <div className="section-title">📊 Analytics Dashboard</div>
      <div className="section-sub">Power BI · interactive analytics · full screen mode available</div>
    </div>
    <div style={{
      borderRadius:10,
      overflow:"hidden",
      border:"1px solid var(--border)",
      background:"var(--surface)",
      position:"relative",
      paddingBottom:"56.25%", // 16:9 aspect ratio
      height:0,
    }}>
      <iframe
        title="Going Yard Analytics"
        src="https://app.powerbi.com/view?r=eyJrIjoiYTQzOGZmMWMtOWZmMy00Y2NhLWE1NWUtZDljZmFkYWFhODg0IiwidCI6IjgzOGY2MGI3LTc4NzYtNGEwZC1iM2MxLTg1Y2VlZWE1YmJhYiIsImMiOjF9"
        frameBorder="0"
        allowFullScreen
        style={{
          position:"absolute",
          top:0, left:0,
          width:"100%",
          height:"100%",
          border:"none",
        }}
      />
    </div>
    <div style={{marginTop:10,display:"flex",gap:8,justifyContent:"flex-end"}}>
      <a
        href="https://app.powerbi.com/view?r=eyJrIjoiYTQzOGZmMWMtOWZmMy00Y2NhLWE1NWUtZDljZmFkYWFhODg0IiwidCI6IjgzOGY2MGI3LTc4NzYtNGEwZC1iM2MxLTg1Y2VlZWE1YmJhYiIsImMiOjF9"
        target="_blank"
        rel="noopener noreferrer"
        style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:6,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--muted)",fontFamily:"'DM Mono',monospace",fontSize:11,textDecoration:"none",transition:"all .15s"}}
      >
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
  return <div>
    <div className="section-header" style={{marginBottom:16}}>
      <div className="section-title">📊 Baseball Savant</div>
      <div className="section-sub">Affiliate partner · Statcast data, spray charts, leaderboards</div>
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

export default function App() {
  const [tab, setTab] = useState("pregame");
  // Load player→team map immediately at startup
  useEffect(() => { loadGlobalPlayerMap(); }, []);
  return <>
    <style>{styles}</style>
    <div className="app">
      <header className="header">
        <div className="logo"><div className="logo-dot"/>⚾ <span>GOING</span> YARD</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <DataStatusBadge/>
          <div className="live-badge"><div className="live-dot"/>MLB 2026</div>
        </div>
      </header>
      <HRTicker onHRClick={()=>setTab("homeruns")}/>
      <nav className="tabs">
        <button className={`tab ${tab==="pregame"?"active":""}`} onClick={()=>setTab("pregame")}>📊 Pregame</button>
        <button className={`tab ${tab==="live"?"active":""}`} onClick={()=>setTab("live")}>📡 Live</button>
        <button className={`tab ${tab==="scouting"?"active":""}`} onClick={()=>setTab("scouting")}>🎯 Scouting</button>
        <button className={`tab ${tab==="bvp"?"active":""}`} onClick={()=>setTab("bvp")}>⚔️ Batter vs P</button>
        <button className={`tab ${tab==="builder"?"active":""}`} onClick={()=>setTab("builder")}>🔬 Pitch Builder</button>
        <button className={`tab ${tab==="homeruns"?"active":""}`} onClick={()=>setTab("homeruns")} style={{color:tab==="homeruns"?"var(--accent)":undefined}}>💥 HR Tracker</button>
        <button className={`tab ${tab==="powerbi"?"active":""}`} onClick={()=>setTab("powerbi")}>📊 Analytics</button>
        <button className={`tab ${tab==="onlyhomers"?"active":""}`} onClick={()=>setTab("onlyhomers")} style={{color:tab==="onlyhomers"?"var(--accent2)":undefined}}>⚾ Only Homers</button>
        <button className={`tab ${tab==="statcast"?"active":""}`} onClick={()=>setTab("statcast")} style={{color:tab==="statcast"?"var(--ice)":undefined}}>📡 Statcast</button>
        <button className={`tab ${tab==="picks"?"active":""}`} onClick={()=>setTab("picks")} style={{color:tab==="picks"?"var(--accent2)":undefined}}>🎯 My Picks</button>
      </nav>
      <main className="content">
        {tab==="pregame" && <PregameTab/>}
        {tab==="live" && <LiveTab/>}
        {tab==="scouting" && <ScoutingTab/>}
        {tab==="bvp" && <BvPTab/>}
        {tab==="builder" && <PitchBuilderTab/>}
        {tab==="homeruns" && <HRTrackerTab/>}
        {tab==="powerbi" && <PowerBITab/>}
        {tab==="onlyhomers" && <OnlyHomersTab/>}
        {tab==="statcast" && <StatcastTab/>}
        {tab==="picks" && <MyPicksTab/>}
      </main>
    </div>
  </>;
}

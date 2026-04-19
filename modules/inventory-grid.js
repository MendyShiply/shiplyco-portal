PE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>ShiplyCo Fulfillment — Portal</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@600;700;800&display=swap" rel="stylesheet"/>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
img,input,select,textarea,button{max-width:100%}
.stats{overflow:hidden}
[style*='display:grid'],[style*='display: grid']{min-width:0}
:root{
  /* ── BRAND ── */
  --red:#e8241a;--red2:#c01e15;--red-light:#fff0ef;
  /* ── NEUTRALS — true black/white, no warm bias ── */
  --ink:#0d0d0d;--ink2:#404040;--ink3:#888;--ink4:#bbb;
  --bg:#f4f4f4;--surface:#ffffff;--surface2:#f9f9f9;
  --border:#e8e8e8;--border2:#d4d4d4;
  /* ── SEMANTIC ── */
  --gold:#a07828;--gold-light:#faf3e0;
  --green:#166e3e;--green-bg:#e8f5ee;
  --blue:#1547b0;--blue-bg:#e8eef9;
  --orange:#b86010;--orange-bg:#fef3e8;
  /* ── SHADOWS — crisper, less diffuse ── */
  --shadow:0 1px 4px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.04);
  --shadow-lg:0 8px 28px rgba(0,0,0,0.14);
  --r:8px;--r-sm:6px;
}
body{font-family:'Barlow',sans-serif;background:var(--bg);color:var(--ink);font-size:14px;line-height:1.5;min-height:100vh;-webkit-font-smoothing:antialiased}

/* ── LOGIN ── */
#loginScreen{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--ink);position:relative;overflow:hidden}
.lg-bg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 20% 50%,#1e1e1e,transparent 70%)}
.lg-hex{position:absolute;right:-60px;top:50%;transform:translateY(-50%);width:500px;height:500px;opacity:0.04}
.lg-hex svg{width:100%;height:100%}
.lg-box{position:relative;z-index:2;width:420px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:48px 44px;animation:fadeUp 0.5s ease both}
.lg-brand{display:flex;align-items:center;gap:14px;margin-bottom:36px;justify-content:center}
.lg-hexicon{width:52px;height:52px}
.lg-wordmark{display:flex;flex-direction:column}
.lg-name{font-family:'Barlow Condensed',sans-serif;font-size:32px;font-weight:800;letter-spacing:1px;color:#fff;line-height:1}
.lg-name span{color:var(--red)}
.lg-sub{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.3);font-weight:500;margin-top:2px}
.lg-field{margin-bottom:14px}
.lg-field label{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:rgba(255,255,255,0.35);margin-bottom:6px}
.lg-field input{width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px 14px;font-family:'Barlow',sans-serif;font-size:14px;color:#fff;outline:none;transition:border 0.2s}
.lg-field input:focus{border-color:var(--red)}
.lg-field input::placeholder{color:rgba(255,255,255,0.2)}
.lg-btn{width:100%;margin-top:20px;padding:13px;background:var(--red);border:none;border-radius:8px;font-family:'Barlow',sans-serif;font-size:14px;font-weight:700;color:#fff;cursor:pointer;letter-spacing:0.3px;transition:all 0.2s}
.lg-btn:hover{background:var(--red2);transform:translateY(-1px)}
.lg-divider{text-align:center;font-size:11px;color:rgba(255,255,255,0.2);margin:16px 0}
.demo-row{display:flex;gap:8px}
.demo-btn{flex:1;padding:9px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:7px;font-family:'Barlow',sans-serif;font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);cursor:pointer;transition:all 0.15s;letter-spacing:0.3px}
.demo-btn:hover{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);border-color:rgba(255,255,255,0.2)}

/* ── APP ── */
#app{display:none;min-height:100vh;flex-direction:column}
header{background:var(--ink);height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;position:sticky;top:0;z-index:100}
.h-brand{display:flex;align-items:center;gap:10px}
.h-hexicon{width:32px;height:32px}
.h-wordmark{display:flex;flex-direction:column}
.h-name{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;letter-spacing:1px;color:#fff;line-height:1}
.h-name span{color:var(--red)}
.h-sub{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.3);font-weight:500}
.h-right{display:flex;align-items:center;gap:14px}
.h-cust{background:rgba(232,36,26,0.15);border:1px solid rgba(232,36,26,0.3);border-radius:20px;padding:4px 14px;font-size:12px;font-weight:600;color:#ff7a74}
.h-role{font-size:11px;color:rgba(255,255,255,0.35)}
.h-out{font-size:11px;color:rgba(255,255,255,0.35);cursor:pointer;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:4px 12px;background:none;font-family:'Barlow',sans-serif;transition:all 0.15s}
.h-out:hover{background:rgba(255,255,255,0.08);color:#fff}

/* ── LAYOUT ── */
.shell{display:flex;flex:1}
nav{width:216px;background:var(--surface);border-right:1px solid var(--border);padding:16px 0;flex-shrink:0;position:sticky;top:58px;height:calc(100vh - 58px);overflow-y:auto;display:flex;flex-direction:column;transition:width 0.22s ease,padding 0.22s ease;overflow-x:hidden}
nav.collapsed{width:44px;padding:8px 0}
nav.collapsed .nav-sec{display:none}
nav.collapsed .nv span{display:none}
nav.collapsed .nv{padding:10px;justify-content:center}
nav.collapsed .nv svg{width:18px;height:18px;opacity:0.7}
.nav-collapse-btn{display:flex;align-items:center;justify-content:flex-end;padding:0 10px 10px;cursor:pointer;color:var(--ink3);background:none;border:none;font-size:18px;align-self:flex-end;transition:transform 0.22s}
nav.collapsed .nav-collapse-btn{justify-content:center;padding:0 0 10px;transform:rotate(180deg)}
.nav-sec{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink4);font-weight:700;padding:14px 16px 5px;margin-top:4px}
.nav-sec:first-child{margin-top:0}
.nv{display:flex;align-items:center;gap:9px;padding:8px 16px;font-size:13px;font-weight:500;color:var(--ink2);cursor:pointer;transition:all 0.1s;border-left:3px solid transparent}
.nv:hover{background:var(--bg);color:var(--ink)}
.nv.on{background:var(--red-light);color:var(--red);border-left-color:var(--red);font-weight:700}
.nv svg{width:14px;height:14px;opacity:0.5;flex-shrink:0}
.nv.on svg{opacity:1}
.nv span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}

main{flex:1;padding:24px 28px 60px;min-width:0;max-width:100%;overflow:hidden}
.page{animation:fadeUp 0.25s ease both;max-width:100%;overflow:hidden}

/* ── COMMON ── */
.pg-head{margin-bottom:24px}
.pg-title{font-family:'Barlow Condensed',sans-serif;font-size:30px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;line-height:1}
.pg-sub{color:var(--ink3);font-size:13px;margin-top:3px;font-weight:400}

.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:16px 18px;box-shadow:var(--shadow);animation:fadeUp 0.4s ease both;transition:transform 0.15s,box-shadow 0.15s;overflow:hidden;min-width:0}
.stat:hover{transform:translateY(-2px);box-shadow:var(--shadow-lg)}
.stat:nth-child(1){animation-delay:.04s}.stat:nth-child(2){animation-delay:.08s}.stat:nth-child(3){animation-delay:.12s}.stat:nth-child(4){animation-delay:.16s}
.stat-lbl{font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:var(--ink3);font-weight:700;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stat-val{font-family:'Barlow Condensed',sans-serif;font-size:34px;font-weight:800;line-height:1;margin-bottom:6px;letter-spacing:-0.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tag{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:0.2px;white-space:nowrap;overflow:hidden;max-width:100%;text-overflow:ellipsis;vertical-align:middle}
.tg{background:var(--green-bg);color:var(--green)}
.tr{background:var(--red-light);color:var(--red)}
.tb{background:var(--blue-bg);color:var(--blue)}
.to{background:var(--orange-bg);color:var(--orange)}
.tgd{background:var(--gold-light);color:var(--gold)}
.dot{width:6px;height:6px;border-radius:50%;display:inline-block;flex-shrink:0}

.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px;min-width:0;overflow:hidden}
.card-head{padding:12px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:8px;min-width:0}
.card-body{padding:16px 18px}
.card-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.btn{font-size:12px;color:var(--ink2);border:1px solid var(--border2);border-radius:5px;padding:5px 12px;background:none;font-family:'Barlow',sans-serif;font-weight:600;cursor:pointer;transition:all 0.1s;white-space:nowrap}
.btn:hover:not(.on){background:var(--bg)}
.btn.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.btn-red{background:var(--red);color:#fff;border-color:var(--red)}
.btn-red:hover{background:var(--red2)}

.tbar{padding:10px 16px;background:var(--surface2);border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.sw{position:relative;flex:1;min-width:140px}
.sw svg{position:absolute;left:9px;top:50%;transform:translateY(-50%);width:13px;height:13px;stroke:var(--ink3);fill:none;stroke-width:2}
.si{width:100%;padding:7px 10px 7px 28px;border:1px solid var(--border);border-radius:6px;font-family:'Barlow',sans-serif;font-size:13px;background:var(--surface);color:var(--ink);outline:none;transition:border 0.1s}
.si:focus{border-color:var(--red)}

table{width:100%;border-collapse:collapse}
thead th{padding:9px 14px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:var(--ink3);font-weight:700;background:var(--surface2);border-bottom:1px solid var(--border);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
tbody tr{border-bottom:1px solid var(--border);transition:background 0.1s}
tbody tr:last-child{border-bottom:none}
tbody tr:hover{background:var(--surface2)}
td{padding:10px 14px;vertical-align:middle;font-size:13px;max-width:280px;overflow:hidden;text-overflow:ellipsis}
td.wrap{white-space:normal;max-width:none}
.tfoot{padding:10px 16px;background:var(--surface2);border-top:1px solid var(--border);font-size:12px;color:var(--ink3);display:flex;align-items:center;justify-content:space-between}
.mono{font-family:monospace;font-size:11px;color:var(--ink3);font-weight:600}

/* ── TRUCK ── */
.tg-wrap{padding:0}
.tg{margin-bottom:20px}
.tg-head{background:var(--ink);color:#fff;border-radius:var(--r) var(--r) 0 0;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.tg-name{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;letter-spacing:0.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tg-meta{font-size:11px;color:rgba(255,255,255,0.45);margin-top:1px}
.tg-body{border:1px solid var(--border);border-top:none;border-radius:0 0 var(--r) var(--r);overflow:hidden}
.plt{border-bottom:1px solid var(--border)}
.plt:last-child{border-bottom:none}
.plt-head{padding:9px 16px;background:var(--surface2);display:flex;align-items:center;gap:10px;cursor:pointer;transition:background 0.1s;flex-wrap:wrap}
.plt-head:hover{background:var(--border)}
.plt-num{font-size:10px;font-weight:800;color:var(--ink);background:var(--border2);border-radius:4px;padding:2px 8px;letter-spacing:0.3px;white-space:nowrap}
.plt-loc{font-size:12px;font-weight:700;color:var(--red);white-space:nowrap}
.plt-cnt{font-size:11px;color:var(--ink3);margin-left:auto;white-space:nowrap}
.plt-chev{width:14px;height:14px;fill:none;stroke:var(--ink3);stroke-width:2.5;transition:transform 0.2s;flex-shrink:0}
.plt-chev.open{transform:rotate(180deg)}
.plt-body{display:none;overflow-x:auto}
.plt-body.open{display:block}
.orig-tx{background:#fff3e8;color:#b05a0a;border-radius:4px;padding:2px 9px;font-size:10px;font-weight:700;white-space:nowrap}
.orig-ar{background:var(--blue-bg);color:var(--blue);border-radius:4px;padding:2px 9px;font-size:10px;font-weight:700;white-space:nowrap}

/* ── UPC ── */
.qb-wrap{display:flex;align-items:center;gap:8px}
.qb-n{font-weight:700;min-width:44px}
.qb{flex:1;height:3px;background:var(--border);border-radius:3px;overflow:hidden;min-width:50px}
.qb-fill{height:100%;border-radius:3px;background:var(--red)}

/* ── CONTAINERS ── */
.cnt-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--shadow);margin-bottom:12px;overflow:hidden;transition:transform 0.15s}
.cnt-card:hover{transform:translateY(-1px)}
.cnt-top{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:8px}
.cnt-id{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;letter-spacing:0.3px}
.cnt-date{font-size:11px;color:var(--ink3);margin-top:1px}
.cnt-body{padding:14px 20px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.cs-lbl{font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:var(--ink3);font-weight:700;margin-bottom:2px}
.cs-val{font-size:17px;font-weight:700}
.cnt-items{padding:10px 20px;font-size:12px;color:var(--ink2);border-top:1px solid var(--border)}

/* ── DOCS ── */
.doc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;padding:18px}
.doc-card{border:1px solid var(--border);border-radius:var(--r-sm);overflow:hidden;cursor:pointer;transition:all 0.15s;background:var(--surface)}
.doc-card:hover{border-color:var(--red);box-shadow:var(--shadow)}
.doc-thumb{height:100px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:30px;border-bottom:1px solid var(--border)}
.doc-info{padding:9px 11px}
.doc-name{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.doc-meta{font-size:10px;color:var(--ink3);margin-top:2px}
.doc-badge{display:inline-block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;padding:2px 7px;border-radius:3px;margin-top:4px}
.db-bol{background:var(--blue-bg);color:var(--blue)}
.db-receipt{background:var(--green-bg);color:var(--green)}
.db-photo{background:var(--orange-bg);color:var(--orange)}

/* ── BILLING ── */
.billing-grid{display:grid;grid-template-columns:1fr 320px;gap:18px;align-items:start}
.rate-table{}
.rate-cat{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--ink3);padding:10px 16px;background:var(--bg);border-bottom:1px solid var(--border)}
.rate-row{display:flex;align-items:center;justify-content:space-between;padding:9px 16px;border-bottom:1px solid var(--border)}
.rate-row:last-child{border-bottom:none}
.rate-name{font-size:13px;font-weight:500}
.rate-desc{font-size:11px;color:var(--ink3);margin-top:1px}
.rate-price{font-size:14px;font-weight:800;color:var(--red);white-space:nowrap}

/* ── INVOICE ── */
.inv-list .inv-row{display:flex;align-items:center;justify-content:space-between;padding:11px 18px;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.1s;flex-wrap:wrap;gap:8px}
.inv-list .inv-row:hover{background:var(--bg)}
.inv-list .inv-row:last-child{border-bottom:none}
.inv-num{font-weight:700;font-size:13px}
.inv-period{font-size:12px;color:var(--ink3)}
.inv-amount{font-size:15px;font-weight:800;color:var(--ink)}
.inv-status{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;padding:3px 9px;border-radius:4px}
.is-paid{background:var(--green-bg);color:var(--green)}
.is-due{background:var(--red-light);color:var(--red)}
.is-draft{background:var(--surface2);color:var(--ink3)}

/* INVOICE MODAL */
.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;align-items:center;justify-content:center;padding:20px}
.modal-bg.open{display:flex}
.modal{background:#fff;border-radius:var(--r);width:100%;max-width:720px;max-height:90vh;overflow-y:auto;box-shadow:var(--shadow-lg);display:flex;flex-direction:column}
.modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid var(--border);flex-shrink:0}
.modal-title{font-size:15px;font-weight:800;color:var(--ink)}
.modal-close{background:none;border:none;font-size:20px;cursor:pointer;color:var(--ink3);padding:0;line-height:1}
.modal-body{padding:20px;overflow-y:auto;flex:1}
.modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);flex-shrink:0}
.inv-doc{padding:40px 48px;font-family:'Barlow',sans-serif}
.inv-doc-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:24px;border-bottom:3px solid var(--ink)}
.inv-logo-area{display:flex;align-items:center;gap:12px}
.inv-logo-hex{width:44px;height:44px}
.inv-logo-text{}
.inv-logo-name{font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:800;letter-spacing:1px;color:var(--ink);line-height:1}
.inv-logo-name span{color:var(--red)}
.inv-logo-sub{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--ink3);font-weight:600}
.inv-meta-right{text-align:right}
.inv-label{font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--red);margin-bottom:6px}
.inv-num-big{font-size:13px;font-weight:700;color:var(--ink3)}
.inv-addresses{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px}
.inv-addr-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--ink3);margin-bottom:5px}
.inv-addr-name{font-size:14px;font-weight:700;margin-bottom:3px}
.inv-addr-detail{font-size:12px;color:var(--ink2);line-height:1.6}
.inv-table{width:100%;border-collapse:collapse;margin-bottom:24px}
.inv-table thead th{padding:9px 12px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;background:var(--ink);color:#fff}
.inv-table thead th:last-child{text-align:right}
.inv-table tbody td{padding:9px 12px;border-bottom:1px solid var(--border);font-size:13px}
.inv-table tbody td:last-child{text-align:right;font-weight:700}
.inv-table tbody tr:last-child td{border-bottom:none}
.inv-totals{margin-left:auto;width:260px}
.inv-total-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}
.inv-total-row.big{border-top:2px solid var(--ink);padding-top:10px;margin-top:4px;font-size:16px;font-weight:800}
.inv-footer{margin-top:32px;padding-top:18px;border-top:1px solid var(--border);font-size:11px;color:var(--ink3);text-align:center;line-height:1.8}
.modal-actions{padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px;background:var(--bg)}

/* ── EMPLOYEE FORM ── */
.fsec{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:20px;box-shadow:var(--shadow);margin-bottom:14px}
.fsec-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--ink2);margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border)}
.fg3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px 18px}
.fg2{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:16px 18px}
.fg4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.field{display:flex;flex-direction:column;gap:4px;min-width:0}
.field.full{grid-column:1/-1}
.field label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.field input,.field select,.field textarea{padding:7px 10px;border:1px solid var(--border2);border-radius:5px;font-family:'Barlow',sans-serif;font-size:13px;color:var(--ink);background:var(--surface);outline:none;transition:border 0.1s;min-width:0;width:100%}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--red);box-shadow:0 0 0 3px rgba(232,36,26,0.08)}
.field textarea{resize:vertical;min-height:60px}
.prow{background:var(--surface2);border:1px solid var(--border);border-radius:7px;padding:12px;margin-bottom:10px}
.irow{background:var(--surface);border:1px solid var(--border2);border-radius:6px;padding:12px;margin-bottom:8px;position:relative}
.irow-n{position:absolute;top:7px;right:10px;font-size:10px;font-weight:800;color:var(--ink3);background:var(--border);border-radius:3px;padding:1px 6px;text-transform:uppercase;letter-spacing:0.5px}
.add-btn{width:100%;padding:9px;border:2px dashed var(--border2);border-radius:6px;background:none;font-family:'Barlow',sans-serif;font-size:12px;font-weight:700;color:var(--ink3);cursor:pointer;transition:all 0.1s;display:flex;align-items:center;justify-content:center;gap:6px;margin-top:5px;text-transform:uppercase;letter-spacing:0.3px}
.add-btn:hover{border-color:var(--red);color:var(--red)}
.submit-btn{padding:11px 26px;background:var(--red);color:#fff;border:none;border-radius:6px;font-family:'Barlow',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:background 0.15s;text-transform:uppercase;letter-spacing:0.5px}
.submit-btn:hover{background:var(--red2)}
.upzone{border:2px dashed var(--border2);border-radius:6px;padding:14px;text-align:center;cursor:pointer;transition:all 0.1s;background:var(--surface2)}
.upzone:hover{border-color:var(--red);background:var(--red-light)}
.upzone input{display:none}
.upzone-txt{font-size:12px;color:var(--ink3);margin-top:4px;font-weight:500}
.up-files{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
.up-file{background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:3px 8px;font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px}
.up-rm{cursor:pointer;color:var(--red)}

/* ── ADMIN ── */
.cust-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:14px 18px;box-shadow:var(--shadow);display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;transition:all 0.15s;cursor:pointer;flex-wrap:wrap;gap:10px}
.cust-card:hover{border-color:var(--red);transform:translateY(-1px)}
.cust-left{display:flex;align-items:center;gap:12px;min-width:0}
.cust-av{width:38px;height:38px;border-radius:7px;background:var(--ink);display:flex;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-size:15px;color:#fff;font-weight:800;flex-shrink:0}
.cust-name{font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cust-meta{font-size:11px;color:var(--ink3);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cust-stats{display:flex;gap:16px;flex-wrap:wrap}
.cv{text-align:right}
.cv-val{font-size:15px;font-weight:800;white-space:nowrap}
.cv-lbl{font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:0.5px;font-weight:700;white-space:nowrap}

.two-col{display:grid;grid-template-columns:1fr 310px;gap:18px;align-items:start}

/* ── ORDERS ── */
.order-type-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:24px}
.ot-card{background:var(--surface);border:2px solid var(--border);border-radius:var(--r);padding:22px 20px;cursor:pointer;transition:all 0.18s;text-align:center}
.ot-card:hover,.ot-card.sel{border-color:var(--red);background:var(--red-light)}
.ot-icon{font-size:32px;margin-bottom:10px}
.ot-name{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px}
.ot-desc{font-size:12px;color:var(--ink3);margin-top:4px}
.order-form{display:none}.order-form.open{display:block}
.pallet-sel-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;max-height:280px;overflow-y:auto;padding:4px}
.psel{border:2px solid var(--border);border-radius:8px;padding:12px;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:10px}
.psel:hover{border-color:var(--red)}
.psel.sel{border-color:var(--red);background:var(--red-light)}
.psel-check{width:18px;height:18px;border:2px solid var(--border2);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
.psel.sel .psel-check{background:var(--red);border-color:var(--red);color:#fff}
.psel-info{}
.psel-loc{font-size:11px;font-weight:800;color:var(--red);letter-spacing:0.5px}
.psel-desc{font-size:12px;font-weight:600;line-height:1.3}
.psel-units{font-size:11px;color:var(--ink3)}
.time-slots{display:flex;gap:10px;flex-wrap:wrap}
.tslot{padding:10px 20px;border:2px solid var(--border);border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;transition:all 0.15s}
.tslot:hover{border-color:var(--red)}
.tslot.sel{border-color:var(--red);background:var(--red);color:#fff}
.channel-btns{display:flex;gap:8px;flex-wrap:wrap}
.ch-btn{padding:8px 16px;border:2px solid var(--border);border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;transition:all 0.15s;background:var(--surface)}
.ch-btn:hover{border-color:var(--red)}
.ch-btn.sel{border-color:var(--red);background:var(--red);color:#fff}
.cost-preview{background:var(--red-light);border:1px solid #f5c5c2;border-radius:8px;padding:14px 16px;margin-top:14px}
.cp-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--red);margin-bottom:8px}
.cp-row{display:flex;justify-content:space-between;font-size:13px;padding:3px 0}
.cp-total{display:flex;justify-content:space-between;font-size:15px;font-weight:800;padding-top:8px;border-top:1px solid #f0b0ac;margin-top:4px}

/* ── ORDER STATUS TRACKER ── */
.order-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--shadow);margin-bottom:12px;overflow:hidden;transition:transform 0.15s}
.order-card:hover{transform:translateY(-1px)}
.order-card-head{padding:13px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:8px}
.order-id{font-size:14px;font-weight:800;letter-spacing:0.3px}
.order-meta{font-size:11px;color:var(--ink3);margin-top:1px}
.order-body{padding:13px 18px;display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center}
.order-detail{font-size:13px;color:var(--ink2)}
.order-actions{display:flex;gap:8px;flex-wrap:wrap}
.status-track{display:flex;align-items:center;gap:0;margin-top:10px}
.st-step{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:var(--ink3)}
.st-step.done{color:var(--green)}
.st-step.active{color:var(--red)}
.st-dot{width:20px;height:20px;border-radius:50%;border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0}
.st-step.done .st-dot{background:var(--green);border-color:var(--green);color:#fff}
.st-step.active .st-dot{background:var(--red);border-color:var(--red);color:#fff}
.st-line{flex:1;height:2px;background:var(--border);min-width:20px}
.st-line.done{background:var(--green)}

/* ── DISPATCH ── */
.dispatch-date-tabs{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.dtab{padding:7px 16px;border:2px solid var(--border);border-radius:6px;cursor:pointer;font-size:13px;font-weight:700;transition:all 0.1s;background:var(--surface);white-space:nowrap}
.dtab:hover{border-color:var(--red)}
.dtab.on{border-color:var(--red);background:var(--red);color:#fff}
.slot-group{margin-bottom:20px}
.slot-head{background:var(--ink);color:#fff;border-radius:7px 7px 0 0;padding:10px 16px;font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:800;letter-spacing:0.5px;display:flex;align-items:center;justify-content:space-between}
.slot-body{border:1px solid var(--border);border-top:none;border-radius:0 0 7px 7px;overflow:hidden}
.dispatch-row{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-wrap:wrap;transition:background 0.1s}
.dispatch-row:last-child{border-bottom:none}
.dispatch-row:hover{background:var(--surface2)}
.dr-customer{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--red);white-space:nowrap}
.dr-id{font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dr-desc{font-size:12px;color:var(--ink2);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dr-actions{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.act-btn{padding:6px 12px;border:none;border-radius:5px;font-family:'Barlow',sans-serif;font-size:11px;font-weight:800;cursor:pointer;transition:all 0.1s;text-transform:uppercase;letter-spacing:0.3px;white-space:nowrap}
.act-process{background:var(--blue-bg);color:var(--blue)}
.act-process:hover{background:var(--blue);color:#fff}
.act-pickup{background:var(--green-bg);color:var(--green)}
.act-pickup:hover{background:var(--green);color:#fff}
.act-done{background:var(--surface2);color:var(--ink3);cursor:default}

/* ── NOTIFICATION BELL ── */
.notif-bell{position:relative;cursor:pointer;padding:6px;border-radius:8px;transition:background 0.15s;display:flex;align-items:center}
.notif-bell:hover{background:rgba(255,255,255,0.1)}
.notif-bell svg{stroke:rgba(255,255,255,0.6);width:18px;height:18px}
.notif-badge{position:absolute;top:2px;right:2px;width:14px;height:14px;background:var(--red);border-radius:50%;font-size:11px;font-weight:800;color:#fff;display:flex;align-items:center;justify-content:center;border:2px solid var(--ink)}
.notif-panel{position:absolute;top:58px;right:16px;width:340px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--shadow-lg);z-index:200;display:none}
.notif-panel.open{display:block}
.notif-head{padding:12px 16px;border-bottom:1px solid var(--border);font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;display:flex;justify-content:space-between;align-items:center}
.notif-item{padding:12px 16px;border-bottom:1px solid var(--border);font-size:13px;cursor:pointer;transition:background 0.1s}
.notif-item:last-child{border-bottom:none}
.notif-item:hover{background:var(--bg)}
.notif-item.unread{background:var(--red-light)}
.notif-time{font-size:11px;color:var(--ink3);margin-top:3px}
.notif-empty{padding:24px;text-align:center;color:var(--ink3);font-size:13px}


@media(max-width:900px){
  .stats{grid-template-columns:repeat(2,1fr)}
  .two-col,.billing-grid{grid-template-columns:1fr}
  main{padding:14px 12px 40px}
  .fg4{grid-template-columns:repeat(2,1fr)}
  .fg3{grid-template-columns:repeat(2,1fr)}
  .inv-doc{padding:20px 16px}
  .inv-addresses{grid-template-columns:1fr}
}

/* ── INVENTORY & SCAN ── */
.inv-row-tr td{vertical-align:middle}
.inv-row-tr:hover{background:var(--bg)}

/* ── LABEL PRINTER ── */
.label-card{border:2px solid var(--ink);border-radius:8px;padding:16px;width:300px;background:#fff}

/* ── PRICING ── */
#pricingEditor input[type=number]:focus{outline:2px solid var(--gold);border-color:var(--gold)}

/* ── PICK LIST ── */
.pick-loc{font-family:monospace;font-size:16px;font-weight:900;color:var(--red)}


/* ── BUTTON UTILITIES ── */
.btn-blue{background:var(--blue-bg);color:var(--blue);border-color:var(--blue)}
.btn-green{background:var(--green-bg);color:var(--green);border-color:var(--green)}
.btn-gold{background:var(--gold-light);color:#92700a;border-color:var(--gold)}
.act-btn.sync{background:var(--green-bg);color:var(--green)}
.act-btn.danger{background:var(--red-light);color:var(--red)}
.act-btn.info{background:var(--blue-bg);color:var(--blue)}


/* ── AI ANIMATIONS ── */
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
.ai-loading{animation:pulse 1.5s ease infinite}

/* ── TABLE RESPONSIVE ── */
.card table, .page > table { width:100%; }
.tbl-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }


/* ── MOBILE RESPONSIVE ── */
@media (max-width:900px){
  nav{
    position:fixed;top:58px;left:0;bottom:0;z-index:500;
    transform:translateX(-100%);transition:transform 0.25s ease;
    width:260px;box-shadow:0 8px 32px rgba(0,0,0,0.2);
    display:flex !important;overflow-y:auto;
  }
  nav.open{transform:translateX(0)}
  .shell{display:block}
  #mainContent{padding:16px 12px;margin-left:0 !important;width:100% !important;overflow:hidden;max-width:100vw}
  .nav-item{white-space:nowrap;overflow:visible;min-width:0}
  .nav-item span{display:inline !important;opacity:1 !important;width:auto !important}
  .hamburger{display:flex !important}
  .stats{grid-template-columns:repeat(2,1fr) !important}
  .nav-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:499}
  .nav-overlay.open{display:block}
}
@media (max-width:600px){
  .fg2,.fg3,.fg4{grid-template-columns:1fr !important}
  .stats{grid-template-columns:1fr 1fr !important}
  header{padding:0 14px}
  .h-brand span{display:none}
  .page{padding:0}
}
@media (min-width:901px){
  .hamburger{display:none !important}
}
@media (max-width:900px){
  .hamburger{display:flex !important}
}

</style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js"></script>
</head>
<body>

<!-- ── LOGIN ── -->
<div id="loginScreen">
  <div class="lg-bg"></div>
  <div class="lg-hex">
    <svg viewBox="0 0 100 100"><polygon points="50,2 93,26 93,74 50,98 7,74 7,26" fill="none" stroke="white" stroke-width="1"/></svg>
  </div>
  <div class="lg-box">
    <div class="lg-brand">
      <svg class="lg-hexicon" viewBox="0 0 60 60">
        <polygon points="30,3 55,17 55,43 30,57 5,43 5,17" fill="#e8241a"/>
        <rect x="22" y="20" width="16" height="3" rx="1.5" fill="white"/>
        <rect x="22" y="28.5" width="16" height="3" rx="1.5" fill="white"/>
        <rect x="22" y="37" width="16" height="3" rx="1.5" fill="white"/>
      </svg>
      <div class="lg-wordmark">
        <div class="lg-name">SHIPLY<span>CO</span></div>
        <div class="lg-sub">fulfillment</div>
      </div>
    </div>
    <div class="lg-field"><label>Email Address</label><input type="email" id="lgEmail" placeholder="you@example.com" autocomplete="email"/></div>
    <div class="lg-field">
      <label>Password</label>
      <input type="password" id="lgPass" placeholder="••••••••" autocomplete="current-password"
        onkeydown="if(event.key==='Enter')doLogin()"/>
    </div>
    <div id="lgErr" style="display:none;background:rgba(232,36,26,0.15);border:1px solid rgba(232,36,26,0.3);border-radius:8px;padding:10px 14px;font-size:13px;color:#ff8a80;margin-top:8px"></div>
    <button class="lg-btn" id="lgBtn" onclick="doLogin()">SIGN IN</button>
    <div style="text-align:center;margin-top:16px">
      <span style="font-size:12px;color:rgba(255,255,255,0.25);cursor:pointer" onclick="doForgotPassword()">Forgot password?</span>
    </div>
  </div>
</div>

<!-- ── APP ── -->
<div id="app">
  <header>
    <div style="display:flex;align-items:center;gap:8px">
      <button class="hamburger" onclick="toggleMobileNav()" aria-label="Toggle navigation" style="background:none;border:none;cursor:pointer;padding:6px;flex-direction:column;gap:4px;align-items:center;justify-content:center">
        <span style="display:block;width:22px;height:2.5px;background:#fff;border-radius:2px"></span>
        <span style="display:block;width:22px;height:2.5px;background:#fff;border-radius:2px"></span>
        <span style="display:block;width:22px;height:2.5px;background:#fff;border-radius:2px"></span>
      </button>
    <div class="h-brand">
      <svg class="h-hexicon" viewBox="0 0 60 60">
        <polygon points="30,3 55,17 55,43 30,57 5,43 5,17" fill="#e8241a"/>
        <rect x="22" y="20" width="16" height="3" rx="1.5" fill="white"/>
        <rect x="22" y="28.5" width="16" height="3" rx="1.5" fill="white"/>
        <rect x="22" y="37" width="16" height="3" rx="1.5" fill="white"/>
      </svg>
      <div class="h-wordmark">
        <div class="h-name">SHIPLY<span>CO</span></div>
        <div class="h-sub">fulfillment</div>
      </div>
    </div>
    </div>
    <div class="h-right">
      <span class="h-cust" id="hCust"></span>
      <span class="h-role" id="hRole">Customer Portal</span>
      <div class="notif-bell" onclick="toggleNotif()" id="notifBell">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <div class="notif-badge" id="notifBadge">2</div>
      </div>
      <div class="notif-panel" id="notifPanel">
        <div class="notif-head"><span>Notifications</span><span style="font-size:11px;color:var(--red);cursor:pointer" onclick="markAllRead()">Mark all read</span></div>
        <div id="notifList"></div>
      </div>
      <button class="h-out" onclick="doLogout()">Sign Out</button>
    </div>
  </header>
  <div class="nav-overlay" id="navOverlay" onclick="toggleMobileNav()"></div>
<div class="shell">
    <nav id="sideNav"></nav>
    <main id="mainContent" role="main"></main>
  </div>
</div>

<!-- Notify Modal -->
<div class="modal-bg" id="notifyModal" role="dialog" aria-modal="true" aria-labelledby="notifyModal-title">
  <div class="modal" style="max-width:480px">
    <div style="padding:24px 28px;border-bottom:1px solid var(--border)">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;text-transform:uppercase">Send Notification</div>
      <div style="font-size:11px;color:var(--ink3);margin-top:2px" id="notifySubtitle"></div>
    </div>
    <div style="padding:22px 28px">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--ink3);margin-bottom:10px">Channels</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">
        <div class="ch-btn sel" id="nch-portal" onclick="toggleNotifCh('portal',this)">🔔 In-Portal</div>
        <div class="ch-btn sel" id="nch-email" onclick="toggleNotifCh('email',this)">📧 Email</div>
        <div class="ch-btn sel" id="nch-sms" onclick="toggleNotifCh('sms',this)">💬 SMS</div>
        <div class="ch-btn sel" id="nch-whatsapp" onclick="toggleNotifCh('whatsapp',this)">💚 WhatsApp</div>
      </div>
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--ink3);margin-bottom:8px">Message</div>
      <textarea id="notifyMessage" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-family:'Barlow',sans-serif;font-size:13px;color:var(--ink);outline:none;resize:vertical;min-height:90px;line-height:1.5" placeholder="Message to customer…"></textarea>
      <div style="margin-top:10px;background:var(--bg);border-radius:7px;padding:10px 14px;font-size:12px;color:var(--ink3)">
        <strong>Contact on file:</strong> <span id="notifyContact">No contact on file</span>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn" onclick="closeNotifyModal()">Cancel</button>
      <button class="btn btn-red" onclick="sendNotification()">Send Now</button>
    </div>
  </div>
</div>

<!-- Invoice Modal -->
<div class="modal-bg" id="invModal" role="dialog" aria-modal="true" aria-labelledby="invModal-title">
  <div class="modal">
    <div id="invDocContent"></div>
    <div class="modal-actions">
      <button class="btn" onclick="closeInv()">Close</button>
      <button class="btn btn-red" onclick="window.print()">Print / Save PDF</button>
    </div>
  </div>
</div>

<!-- Dispose Modal -->
<div class="modal-bg" id="disposeModal" style="display:none" onclick="if(event.target===this)this.style.display='none'">
  <div class="modal" style="max-width:640px;width:96vw;max-height:90vh;overflow-y:auto">
    <div class="modal-head">
      <span class="modal-title">Request Disposal</span>
      <button class="modal-close" onclick="document.getElementById('disposeModal').style.display='none'">&#215;</button>
    </div>
    <div class="modal-body" id="disposeBody"></div>
    <div class="modal-body" style="padding-top:0">
      <label style="font-weight:700;font-size:12px;text-transform:uppercase">Notes for ShiplyCo</label>
      <textarea id="disposeNotes" placeholder="Any special instructions..." style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;font-size:13px;min-height:60px;margin-top:4px;box-sizing:border-box"></textarea>
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="document.getElementById('disposeModal').style.display='none'">Cancel</button>
      <button class="btn btn-red" onclick="submitDispose()">Submit Disposal Request</button>
    </div>
  </div>
</div>

<!-- ASN Modals -->
<div class="modal-bg" id="asnModal" style="display:none" onclick="if(event.target===this)this.style.display='none'">
  <div class="modal" style="max-width:720px;width:96vw;max-height:90vh;overflow-y:auto">
    <div class="modal-head"><span class="modal-title">New Inbound Shipment</span>
      <button class="modal-close" onclick="document.getElementById('asnModal').style.display='none'">&#215;</button></div>
    <div class="modal-body" id="asnModalBody"></div>
    <div class="modal-foot" id="asnModalFoot"></div>
  </div>
</div>
<div class="modal-bg" id="asnDetailModal" style="display:none" onclick="if(event.target===this)this.style.display='none'">
  <div class="modal" style="max-width:720px;width:96vw;max-height:90vh;overflow-y:auto">
    <div class="modal-head"><span class="modal-title" id="asnDetailTitle">Shipment Detail</span>
      <button class="modal-close" onclick="document.getElementById('asnDetailModal').style.display='none'">&#215;</button></div>
    <div class="modal-body" id="asnDetailBody"></div>
    <div class="modal-foot" id="asnDetailFoot"></div>
  </div>
</div>

<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>

<script>
// ── INVENTORY DATA GRID ──
let _invFilters = {search:'', cust:'', truck:''};
let _invColFilters = {};
let _invSort = 'pallet_num';
let _invSortDir = 1;

// Column definitions — defaults
const _invColDefaults = [
  {key:'aging',       label:'Aging',        visible:true},
  {key:'pallet_num',  label:'Pallet #',    visible:true},
  {key:'location',    label:'Location',     visible:true},
  {key:'customer',    label:'Customer',     visible:true},
  {key:'truck',       label:'Truck',        visible:true},
  {key:'received_date',label:'Received',   visible:true},
  {key:'upc',         label:'UPC',          visible:true},
  {key:'sku',         label:'SKU / Item #', visible:true},
  {key:'cartonDesc',  label:'Carton Desc',  visible:true},
  {key:'desc',        label:'Item Desc',    visible:true},
  {key:'color',       label:'Color',        visible:true},
  {key:'size',        label:'Size',         visible:true},
  {key:'caseCount',   label:'Cases',        visible:true},
  {key:'casepack',    label:'Casepack',     visible:true},
  {key:'totalUnits',  label:'Total Units',  visible:true},
  {key:'looseQty',    label:'Loose Qty',    visible:true},
  {key:'retail',      label:'Retail Price', visible:true},
  {key:'notes',       label:'Notes',        visible:true},
];

function _invLoadLayout(){
  try{
    const saved = localStorage.getItem('shiplyco_inv_layout');
    if(saved){
      const {cols, widths} = JSON.parse(saved);
      // Merge saved order/visibility into defaults (handles new columns added later)
      const merged = [];
      cols.forEach(s=>{ const d=_invColDefaults.find(x=>x.key===s.key); if(d) merged.push({...d, visible:s.visible}); });
      // Add any new columns not in saved layout
      _invColDefaults.forEach(d=>{ if(!merged.find(m=>m.key===d.key)) merged.push(d); });
      if(widths) Object.assign(_invColWidths, widths);
      return merged;
    }
  }catch(e){}
  return _invColDefaults.map(c=>({...c}));
}

function _invSaveLayout(){
  try{
    localStorage.setItem('shiplyco_inv_layout', JSON.stringify({
      cols: _invCols.map(c=>({key:c.key, visible:c.visible})),
      widths: _invColWidths
    }));
  }catch(e){}
}

let _invCols = _invLoadLayout();

function toggleColPicker(){
  const el = document.getElementById('colPicker');
  if(el) el.style.display = el.style.display==='none'?'flex':'none';
}

function toggleCol(key, visible){
  const col = _invCols.find(c=>c.key===key);
  if(col) col.visible = visible;
  _invSaveLayout();
  renderInvTable();
}

// ── Default column widths (px) ──
let _invColWidths = {
  pallet_num:80, location:90, customer:140, truck:100, received_date:95,
  upc:120, sku:120, cartonDesc:180, desc:200, color:100, size:80,
  caseCount:70, casepack:80, totalUnits:90, looseQty:80, retail:90, notes:160
};

function getCellValue(p, item, colKey, truck, custName){
  switch(colKey){
    case 'aging': {
      const rd = p.received_date || p.created_at;
      if(!rd) return '?';
      const days = Math.floor((Date.now()-new Date(rd).getTime())/(1000*60*60*24));
      return String(days);
    }
    case 'pallet_num':    return String(p.pallet_num||'');
    case 'location':      return p.location||'';
    case 'customer':      return custName;
    case 'truck':         return truck?.name||p.truck_id||'';
    case 'received_date': return p.received_date||'';
    case 'upc':           return item.upc||'';
    case 'sku':           return item.sku||item.itemNum||'';
    case 'cartonDesc':    return item.cartonDesc||'';
    case 'desc':          return item.desc||'';
    case 'color':         return item.color||'';
    case 'size':          return item.size||'';
    case 'caseCount':     return String(parseInt(item.caseCount)||0);
    case 'casepack':      return String(item.casepack||'');
    case 'totalUnits':    return String(parseInt(item.totalUnits)||0);
    case 'looseQty':      return String(parseInt(item.looseQty)||0);
    case 'retail':        return item.retail||'';
    case 'notes':         return item.notes||'';
    default:              return '';
  }
}

function renderInvTable(){
  const visibleCols = _invCols.filter(c=>c.visible && !(role==='customer' && c.key==='customer'));
  const tbody = document.getElementById('invTable');
  const footer = document.getElementById('invTableFooter');
  const subtitle = document.getElementById('invSubtitle');
  if(!tbody) return;

  // Build flat rows — ONE ROW PER ITEM
  let rows = [];
  _sbPallets.forEach(p=>{
    const truck = _sbTrucks.find(t=>t.id===p.truck_id);
    const cust = CUSTOMERS.find(c=>c.id===p.cust_id);
    const custName = cust?.name||p.cust_id||'';
    const items = (p.items&&p.items.length) ? p.items : [{}];
    items.forEach((item, itemIdx)=>{
      const vals = {};
      visibleCols.forEach(col=>{
        vals[col.key] = getCellValue(p, item, col.key, truck, custName);
      });
      rows.push({p, item, itemIdx, isFirst: itemIdx===0, totalItems: items.length, vals, custName});
    });
  });

  // Apply column filters
  Object.entries(_invColFilters).forEach(([key, val])=>{
    if(!val) return;
    const q = val.toLowerCase();
    rows = rows.filter(r=>(r.vals[key]||'').toLowerCase().includes(q));
  });

  // Sort
  rows.sort((a,b)=>{
    let av = a.vals[_invSort]||'';
    let bv = b.vals[_invSort]||'';
    if(['pallet_num','totalUnits','caseCount','looseQty'].includes(_invSort)){
      av = parseFloat(av)||0; bv = parseFloat(bv)||0;
    }
    if(av===bv && _invSort!=='pallet_num') {
      // secondary sort by pallet num
      return (parseFloat(a.vals['pallet_num'])||0) - (parseFloat(b.vals['pallet_num'])||0);
    }
    return av > bv ? _invSortDir : av < bv ? -_invSortDir : 0;
  });

  // Stats
  const totalUnits = rows.reduce((s,{item})=>s+(parseInt(item.totalUnits)||0),0);
  const palletCount = new Set(rows.map(r=>r.p.id)).size;
  if(subtitle) subtitle.textContent = palletCount+' pallets · '+rows.length+' items · '+totalUnits.toLocaleString()+' units';

  // SKU summary
  const skuFilter = _invColFilters['upc']||_invColFilters['sku']||_invColFilters['desc']||'';
  const skuSummary = document.getElementById('invSkuSummary');
  if(skuFilter && skuSummary){
    const skuTotals = {};
    rows.forEach(({item})=>{
      const key = item.sku||item.upc||item.desc||'Unknown';
      const label = item.desc||item.cartonDesc||key;
      if(!skuTotals[key]) skuTotals[key]={label, units:0, rows:0};
      skuTotals[key].units += parseInt(item.totalUnits)||0;
      skuTotals[key].rows++;
    });
    const entries = Object.entries(skuTotals).sort((a,b)=>b[1].units-a[1].units);
    if(entries.length){
      let skuHtml = '<div class="card" style="margin-bottom:12px">';
      skuHtml += '<div class="card-head"><span class="card-title">SKU Summary for current filter</span></div>';
      skuHtml += '<div style="overflow-x:auto"><table>';
      skuHtml += '<thead><tr><th>Item</th><th>Rows</th><th>Total Units</th></tr></thead><tbody>';
      entries.forEach(([k,v])=>{
        skuHtml += '<tr><td><div style="font-weight:600;font-size:13px">'+v.label+'</div><div style="font-size:11px;color:var(--ink3)">'+k+'</div></td>';
        skuHtml += '<td>'+v.rows+'</td><td style="font-weight:800;color:var(--red)">'+v.units.toLocaleString()+'</td></tr>';
      });
      skuHtml += '</tbody></table></div></div>';
      skuSummary.innerHTML = skuHtml;
    } else { skuSummary.innerHTML=''; }
  } else if(skuSummary){ skuSummary.innerHTML=''; }

  // Render rows
  if(!rows.length){
    tbody.innerHTML='<tr><td colspan="'+visibleCols.length+'" style="text-align:center;padding:40px;color:var(--ink3)">No results</td></tr>';
  } else {
    let prevPalletId = null;
    let rowsHtml = '';
    rows.forEach(({p, item, itemIdx, isFirst, totalItems, vals})=>{
      const isNewPallet = p.id !== prevPalletId;
      prevPalletId = p.id;
      // Alternate shading per pallet group
      const bg = isNewPallet && itemIdx===0 ? '' : 'background:rgba(0,0,0,0.015)';
      const borderTop = isNewPallet && itemIdx===0 && rows.indexOf(rows.find(r=>r.p.id===p.id)) > 0
        ? 'border-top:2px solid var(--border2)' : '';
      rowsHtml += '<tr style="border-bottom:1px solid var(--border);'+bg+'">';
      visibleCols.forEach(col=>{
        const v = vals[col.key]||'—';
        const w = _invColWidths[col.key]||120;
        if(col.key==='location'){
          rowsHtml += '<td style="width:'+w+'px;min-width:'+w+'px;max-width:'+w+'px"><span style="font-family:monospace;font-weight:800;font-size:13px;color:var(--red)">'+v+'</span></td>';
        } else if(col.key==='pallet_num'){
          rowsHtml += '<td style="width:'+w+'px;min-width:'+w+'px;max-width:'+w+'px;font-family:monospace;font-size:12px;color:var(--ink3)">PLT-'+String(p.pallet_num).padStart(3,'0')+'</td>';
        } else if(col.key==='totalUnits'){
          rowsHtml += '<td style="width:'+w+'px;min-width:'+w+'px;font-weight:700">'+(parseInt(v)||0).toLocaleString()+'</td>';
        } else if(col.key==='desc'||col.key==='cartonDesc'){
          rowsHtml += '<td style="width:'+w+'px;min-width:'+w+'px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:'+w+'px">'+v+'</td>';
        } else {
          rowsHtml += '<td style="width:'+w+'px;min-width:'+w+'px;max-width:'+w+'px;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+v+'</td>';
        }
      });
      rowsHtml += '</tr>';
    });
    tbody.innerHTML = rowsHtml;
  }

  if(footer) footer.innerHTML='<span>'+palletCount+' pallets · '+rows.length+' items</span><span>'+totalUnits.toLocaleString()+' total units</span>';

  // Rebuild headers (sort + filter rows)
  _renderInvHeaders(visibleCols);
  // Sync filter input values without losing focus
  visibleCols.forEach(col=>{
    const inp = document.querySelector('#invFilterRow input[data-col="'+col.key+'"]');
    if(inp && inp !== document.activeElement) inp.value = _invColFilters[col.key]||'';
  });
}

// ── Column drag-to-reorder state ──
let _dragCol = null, _dragOverCol = null;
let _invFilterTimer = null;

function _renderInvHeaders(visibleCols){
  if(!visibleCols) visibleCols = _invCols.filter(c=>c.visible);
  const sortRow = document.getElementById('invSortRow');
  if(sortRow){
    sortRow.innerHTML = visibleCols.map(col=>{
      const arrow = _invSort===col.key ? (_invSortDir===1?'↑':'↓') : '↕';
      const w = _invColWidths[col.key]||120;
      return '<th draggable="true" data-colkey="'+col.key+'"'
        +' ondragstart="invColDragStart(event,\''+col.key+'\')"'
        +' ondragover="invColDragOver(event,\''+col.key+'\')"'
        +' ondragleave="invColDragLeave(event,\''+col.key+'\')"'
        +' ondrop="invColDrop(event,\''+col.key+'\')"'
        +' ondragend="invColDragEnd()"'
        +' style="position:relative;width:'+w+'px;min-width:'+w+'px;cursor:grab;user-select:none;'
        +'white-space:nowrap;padding:10px 22px 10px 10px;font-size:11px;text-transform:uppercase;'
        +'letter-spacing:0.5px;background:var(--surface2);border-right:3px solid var(--border2)">'
        +'<span onclick="if(!_dragCol){_invSort=\''+col.key+'\';_invSortDir*=-1;renderInvTable();}" style="cursor:pointer">'+col.label+' '+arrow+'</span>'
        +'<div onmousedown="startColResize(event,\''+col.key+'\')" onclick="event.stopPropagation()" draggable="false"'
        +' title="Drag edge to resize"'
        +' style="position:absolute;right:0;top:0;bottom:0;width:8px;cursor:col-resize;z-index:2;'
        +'background:repeating-linear-gradient(to bottom,var(--border2) 0px,var(--border2) 2px,transparent 2px,transparent 5px)"></div>'
        +'</th>';
    }).join('');
  }
  const filterRow = document.getElementById('invFilterRow');
  if(filterRow){
    filterRow.innerHTML = visibleCols.map(col=>{
      const val = _invColFilters[col.key]||'';
      const w = _invColWidths[col.key]||120;
      return '<th style="padding:4px 6px;width:'+w+'px;min-width:'+w+'px;background:var(--bg);border-right:3px solid var(--border2)">'
        +'<input type="text" data-col="'+col.key+'" placeholder="Filter…" value="'+val+'"'
        +' oninput="_invColFilters[\''+col.key+'\']=this.value;clearTimeout(_invFilterTimer);_invFilterTimer=setTimeout(_renderInvBody,250)"'
        +' onkeydown="if(event.key===\'Enter\'){clearTimeout(_invFilterTimer);_renderInvBody();}"'
        +' style="width:100%;padding:4px 8px;border:1px solid var(--border);border-radius:4px;font-size:12px;font-family:Barlow,sans-serif"/>'
        +'</th>';
    }).join('');
  }
}

// ── Drag-to-reorder column handlers ──
function invColDragStart(e, colKey){
  _dragCol = colKey;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(()=>{ const el=document.querySelector('[data-colkey="'+colKey+'"]'); if(el) el.style.opacity='0.4'; },0);
}
function invColDragOver(e, colKey){
  if(!_dragCol || colKey===_dragCol) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  _dragOverCol = colKey;
  document.querySelectorAll('#invSortRow th').forEach(th=>{
    th.style.outline = th.dataset.colkey===colKey ? '2px solid var(--red)' : '';
  });
}
function invColDragLeave(e, colKey){
  if(!e.currentTarget.contains(e.relatedTarget)){
    e.currentTarget.style.outline='';
    if(_dragOverCol===colKey) _dragOverCol=null;
  }
}
function invColDrop(e, targetKey){
  e.preventDefault();
  if(!_dragCol||_dragCol===targetKey) return;
  const fromIdx = _invCols.findIndex(c=>c.key===_dragCol);
  const toIdx   = _invCols.findIndex(c=>c.key===targetKey);
  if(fromIdx<0||toIdx<0) return;
  const moved = _invCols.splice(fromIdx,1)[0];
  _invCols.splice(toIdx,0,moved);
  _invSaveLayout();
  _dragCol=null; _dragOverCol=null;
  renderInvTable();
}
function invColDragEnd(){
  document.querySelectorAll('#invSortRow th').forEach(th=>{ th.style.opacity=''; th.style.outline=''; });
  _dragCol=null; _dragOverCol=null;
}

// Only re-render tbody — called by filter inputs so headers stay intact
function _renderInvBody(){
  const visibleCols = _invCols.filter(c=>c.visible && !(role==='customer' && c.key==='customer'));
  const tbody = document.getElementById('invTable');
  const footer = document.getElementById('invTableFooter');
  const subtitle = document.getElementById('invSubtitle');
  if(!tbody) return;

  let rows = [];
  _sbPallets.forEach(p=>{
    const truck = _sbTrucks.find(t=>t.id===p.truck_id);
    const cust = CUSTOMERS.find(c=>c.id===p.cust_id);
    const custName = cust?.name||p.cust_id||'';
    const items = (p.items&&p.items.length) ? p.items : [{}];
    items.forEach((item)=>{
      const vals = {};
      visibleCols.forEach(col=>{ vals[col.key] = getCellValue(p, item, col.key, truck, custName); });
      rows.push({p, item, vals});
    });
  });

  Object.entries(_invColFilters).forEach(([key, val])=>{
    if(!val) return;
    const q = val.toLowerCase();
    rows = rows.filter(r=>(r.vals[key]||'').toLowerCase().includes(q));
  });

  rows.sort((a,b)=>{
    let av = a.vals[_invSort]||'', bv = b.vals[_invSort]||'';
    if(['pallet_num','totalUnits','caseCount','looseQty'].includes(_invSort)){
      av = parseFloat(av)||0; bv = parseFloat(bv)||0;
    }
    return av > bv ? _invSortDir : av < bv ? -_invSortDir : 0;
  });

  const totalUnits = rows.reduce((s,{item})=>s+(parseInt(item.totalUnits)||0),0);
  const palletCount = new Set(rows.map(r=>r.p.id)).size;
  if(subtitle) subtitle.textContent = palletCount+' pallets · '+rows.length+' items · '+totalUnits.toLocaleString()+' units';

  // SKU summary
  const skuFilter = _invColFilters['upc']||_invColFilters['sku']||_invColFilters['desc']||'';
  const skuSummary = document.getElementById('invSkuSummary');
  if(skuFilter && skuSummary){
    const skuTotals = {};
    rows.forEach(({item})=>{
      const key = item.sku||item.upc||item.desc||'Unknown';
      const label = item.desc||item.cartonDesc||key;
      if(!skuTotals[key]) skuTotals[key]={label,units:0,rows:0};
      skuTotals[key].units += parseInt(item.totalUnits)||0;
      skuTotals[key].rows++;
    });
    const entries = Object.entries(skuTotals).sort((a,b)=>b[1].units-a[1].units);
    if(entries.length){
      let h='<div class="card" style="margin-bottom:12px"><div class="card-head"><span class="card-title">SKU Summary</span></div><div style="overflow-x:auto"><table><thead><tr><th>Item</th><th>Rows</th><th>Total Units</th></tr></thead><tbody>';
      entries.forEach(([k,v])=>{ h+='<tr><td><div style="font-weight:600;font-size:13px">'+v.label+'</div><div style="font-size:11px;color:var(--ink3)">'+k+'</div></td><td>'+v.rows+'</td><td style="font-weight:800;color:var(--red)">'+v.units.toLocaleString()+'</td></tr>'; });
      h+='</tbody></table></div></div>';
      skuSummary.innerHTML=h;
    } else { skuSummary.innerHTML=''; }
  } else if(skuSummary){ skuSummary.innerHTML=''; }

  if(!rows.length){
    tbody.innerHTML='<tr><td colspan="'+visibleCols.length+'" style="text-align:center;padding:40px;color:var(--ink3)">No results — clear filters to see all inventory</td></tr>';
  } else {
    let prevPalletId=null, html='';
    rows.forEach(({p, item, vals})=>{
      const isNewPallet = p.id!==prevPalletId;
      prevPalletId = p.id;
      html += '<tr style="border-bottom:1px solid var(--border)'+(isNewPallet?';border-top:2px solid var(--border2)':'')+'">';
      visibleCols.forEach(col=>{
        const v = vals[col.key]||'—';
        const w = _invColWidths[col.key]||120;
        const ws = 'width:'+w+'px;min-width:'+w+'px;max-width:'+w+'px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        if(col.key==='aging'){
          const days = parseInt(v)||0;
          const bg = days<=90?'var(--green-bg)':days<=180?'var(--orange-bg)':'var(--red-light)';
          const fc = days<=90?'var(--green)':days<=180?'var(--orange)':'var(--red)';
          html+='<td style="'+ws+'background:'+bg+';text-align:center"><span style="color:'+fc+';font-weight:800;font-size:12px">'+days+'d</span></td>';
        } else if(col.key==='location') html+='<td style="'+ws+'"><span style="font-family:monospace;font-weight:800;font-size:13px;color:var(--red)">'+v+'</span></td>';
        else if(col.key==='pallet_num') html+='<td style="'+ws+'font-family:monospace;font-size:12px;color:var(--ink3)">PLT-'+String(p.pallet_num).padStart(3,'0')+'</td>';
        else if(col.key==='totalUnits') html+='<td style="'+ws+'font-weight:700">'+(parseInt(v)||0).toLocaleString()+'</td>';
        else html+='<td style="'+ws+'font-size:13px" title="'+v+'">'+v+'</td>';
      });
      html+='</tr>';
    });
    tbody.innerHTML=html;
  }
  if(footer) footer.innerHTML='<span>'+palletCount+' pallets · '+rows.length+' items</span><span>'+totalUnits.toLocaleString()+' total units</span>';
}


// ── Column resize drag ──
let _resizeCol = null, _resizeStartX = 0, _resizeStartW = 0;
function startColResize(e, colKey){
  e.preventDefault();
  _resizeCol = colKey;
  _resizeStartX = e.clientX;
  _resizeStartW = _invColWidths[colKey]||120;
  document.addEventListener('mousemove', _onColResize);
  document.addEventListener('mouseup', _stopColResize);
}
function _onColResize(e){
  if(!_resizeCol) return;
  const delta = e.clientX - _resizeStartX;
  _invColWidths[_resizeCol] = Math.max(50, _resizeStartW + delta);
  // Update column widths live without full re-render
  renderInvTable();
}
function _stopColResize(){
  if(_resizeCol) _invSaveLayout();
  _resizeCol = null;
  document.removeEventListener('mousemove', _onColResize);
  document.removeEventListener('mouseup', _stopColResize);
}

// Call renderInvTable after inventory loads
async function loadInventoryAndRender(){
  await loadInventory();
  setTimeout(renderInvTable, 100);
}

// ── NOTIFICATION SYSTEM (lives here so it loads before all modules that reference it) ──
function toggleNotif(){
  const p=document.getElementById('notifPanel');
  p.classList.toggle('open');
  renderNotifs();
}
function renderNotifs(){
  const list=document.getElementById('notifList');
  const myNotifs=NOTIFICATIONS.filter(n=>role==='customer'||role==='admin');
  if(!myNotifs.length){list.innerHTML='<div class="notif-empty">No notifications</div>';return;}
  list.innerHTML=myNotifs.map(n=>`
    <div class="notif-item ${n.read?'':'unread'}" onclick="readNotif('${n.id}')">
      <div>${n.text}</div>
      <div class="notif-time">${n.time}</div>
    </div>`).join('');
}
function readNotif(id){
  const n=NOTIFICATIONS.find(x=>x.id===id);
  if(n)n.read=true;
  updateBadge();
  renderNotifs();
}
function markAllRead(){NOTIFICATIONS.forEach(n=>n.read=true);updateBadge();renderNotifs()}
function updateBadge(){
  const unread=NOTIFICATIONS.filter(n=>!n.read).length;
  const badge=document.getElementById('notifBadge');
  badge.textContent=unread;
  badge.style.display=unread?'flex':'none';
}
function pushNotif(text){
  NOTIFICATIONS.unshift({id:'N'+Date.now(),text,time:'Just now',read:false});
  updateBadge();
}
function toggleNotifCh(ch,el){
  if(_notifyChannels.has(ch)){_notifyChannels.delete(ch);el.classList.remove('sel');}
  else{_notifyChannels.add(ch);el.classList.add('sel');}
}
document.addEventListener('click',e=>{
  if(!e.target.closest('#notifBell')&&!e.target.closest('#notifPanel')){
    const p=document.getElementById('notifPanel');
    if(p)p.classList.remove('open');
  }
});

const SUPABASE_URL='https://xyemghdkehsfgeyidmie.supabase.co';
const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZW1naGRrZWhzZmdleWlkbWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjE3NTIsImV4cCI6MjA4ODMzNzc1Mn0.4pIvrbdbMrPIrByY9GRnDiyw15BJobPxllr8mQ0c1OA';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

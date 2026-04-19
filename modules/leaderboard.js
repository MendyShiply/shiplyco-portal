// ── ORDER COMPLEXITY & BENCHMARKS ──
const ORDER_COMPLEXITY={
  pallet_out:{pts:3,label:'Pallet Pull',color:'#1a4fc0',benchmark:15}, // mins
  pickpack:{pts:1,label:'Pick & Pack',color:'#1e7a4f',benchmark:8},
  fbm:{pts:1,label:'Pick & Pack',color:'#1e7a4f',benchmark:8},
  fba:{pts:4,label:'FBA Prep',color:'#b8913a',benchmark:25},
  marketplace:{pts:1,label:'Pick & Pack',color:'#1e7a4f',benchmark:8},
};
function orderPts(o){
  const base=(ORDER_COMPLEXITY[o.type]?.pts||1);
  const unitBonus=Math.floor((o.pallets?.reduce((s,p)=>s+p.units,0)||0)*0.1+(o.items?.reduce((s,i)=>s+i.qty,0)||0)*0.05);
  return base+unitBonus;
}

// ── ACTIVE TIMERS ── {orderId: {startMs, empId}}
let ACTIVE_TIMERS={};
let _timerInterval=null;

// ── PERFORMANCE LOG ── completed orders with timing
let PERF_LOG=[];

function startTimer(orderId){
  if(ACTIVE_TIMERS[orderId])return;
  ACTIVE_TIMERS[orderId]={startMs:Date.now(),empId:currentEmployee.id};
  if(!_timerInterval) _timerInterval=setInterval(tickTimers,1000);
}
function stopTimer(orderId){
  const t=ACTIVE_TIMERS[orderId];
  if(!t)return null;
  const mins=Math.round((Date.now()-t.startMs)/60000);
  delete ACTIVE_TIMERS[orderId];
  if(!Object.keys(ACTIVE_TIMERS).length){clearInterval(_timerInterval);_timerInterval=null;}
  return mins;
}
function tickTimers(){
  Object.keys(ACTIVE_TIMERS).forEach(oid=>{
    const el=document.getElementById('timer-'+oid);
    if(!el)return;
    const secs=Math.floor((Date.now()-ACTIVE_TIMERS[oid].startMs)/1000);
    const m=Math.floor(secs/60),s=secs%60;
    const o=ORDERS.find(x=>x.id===oid);
    const bench=(ORDER_COMPLEXITY[o?.type]?.benchmark||10)*60;
    const over=secs>bench;
    el.innerHTML=`<span style="font-weight:800;color:${over?'var(--red)':'var(--green)'};font-family:monospace;font-size:15px">${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}</span> <span style="font-size:10px;color:${over?'var(--red)':'var(--green)'}">${over?'⚠ OVER BENCHMARK':'● On pace'}</span>`;
  });
}

// ── LEADERBOARD PAGE ──
function pgLeaderboard(){
  const today='2026-03-07';
  const todayLog=PERF_LOG.filter(p=>p.date===today);

  // Build per-employee stats
  const stats=EMPLOYEES.map(e=>{
    const myLog=todayLog.filter(p=>p.empId===e.id);
    const totalOrders=myLog.length;
    const totalPts=myLog.reduce((s,p)=>s+p.pts,0);
    const onTime=myLog.filter(p=>p.actualMins<=p.benchmarkMins).length;
    const avgMins=totalOrders?Math.round(myLog.reduce((s,p)=>s+p.actualMins,0)/totalOrders):0;
    const byType={};
    myLog.forEach(p=>{byType[p.type]=(byType[p.type]||0)+1;});
    // Active timers
    const active=Object.entries(ACTIVE_TIMERS).filter(([,t])=>t.empId===e.id).length;
    return {emp:e,totalOrders,totalPts,onTime,avgMins,byType,active,
      onTimePct:totalOrders?Math.round(onTime/totalOrders*100):0};
  }).sort((a,b)=>b.totalPts-a.totalPts);

  const maxPts=Math.max(...stats.map(s=>s.totalPts),1);

  const medals=['🥇','🥈','🥉','4️⃣'];

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div class="pg-title">Daily Leaderboard</div>
      <div class="pg-sub">Today · March 7, 2026 — resets at midnight · weighted by order complexity</div>
    </div>
    <div style="background:var(--ink);color:#fff;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700">
      🔴 LIVE &nbsp;·&nbsp; Resets in <span id="leaderResetTimer">--:--:--</span>
    </div>
  </div>

  <!-- Complexity legend -->
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
    ${Object.entries(ORDER_COMPLEXITY).filter(([k])=>k!=='fbm'&&k!=='marketplace').map(([k,v])=>`
    <div style="display:flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px 12px">
      <div style="width:10px;height:10px;border-radius:2px;background:${v.color}"></div>
      <span style="font-size:12px;font-weight:600">${v.label}</span>
      <span style="font-size:11px;color:var(--ink3)">${v.pts} pt${v.pts!==1?'s':''} · ${v.benchmark}min benchmark</span>
    </div>`).join('')}
    <div style="display:flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px 12px">
      <span style="font-size:11px;color:var(--ink3)">+0.1 pts per unit</span>
    </div>
  </div>

  <!-- Podium cards -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-bottom:28px">
    ${stats.map((s,i)=>`
    <div style="background:${s.emp.colorBg};border:2px solid ${i===0?s.emp.color:'var(--border)'};border-radius:12px;padding:18px 20px;position:relative;${i===0?'box-shadow:0 4px 20px rgba(0,0,0,0.12)':''}">
      <div style="position:absolute;top:14px;right:16px;font-size:22px">${medals[i]||''}</div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        ${empAvatar(s.emp,44)}
        <div>
          <div style="font-size:15px;font-weight:800;color:${s.emp.color}">${s.emp.name}</div>
          <div style="font-size:24px;font-weight:900;color:${s.emp.color};line-height:1">${s.totalPts} <span style="font-size:13px;font-weight:600">pts</span></div>
        </div>
      </div>
      <!-- Score bar -->
      <div style="background:rgba(0,0,0,0.08);border-radius:4px;height:6px;margin-bottom:14px">
        <div style="background:${s.emp.color};height:6px;border-radius:4px;width:${Math.round(s.totalPts/maxPts*100)}%;transition:width 0.6s ease"></div>
      </div>
      <!-- Stats row -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
        <div style="text-align:center">
          <div style="font-size:20px;font-weight:800;color:${s.emp.color}">${s.totalOrders}</div>
          <div style="font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:0.5px">Orders</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:20px;font-weight:800;color:${s.onTimePct>=80?'var(--green)':s.onTimePct>=60?'var(--orange)':'var(--red)'}">${s.onTimePct}%</div>
          <div style="font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:0.5px">On Time</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:20px;font-weight:800">${s.avgMins?s.avgMins+'m':'—'}</div>
          <div style="font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:0.5px">Avg Time</div>
        </div>
      </div>
      <!-- Order type breakdown -->
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        ${Object.entries(s.byType).map(([type,count])=>{
          const c=ORDER_COMPLEXITY[type];
          return `<span style="background:${c?.color||'#888'};color:#fff;border-radius:4px;padding:3px 8px;font-size:11px;font-weight:700">${count}× ${c?.label||type}</span>`;
        }).join('')}
        ${s.active?`<span style="background:var(--ink);color:#fff;border-radius:4px;padding:3px 8px;font-size:11px;font-weight:700;animation:pulse 1.5s infinite">⏱ ${s.active} active</span>`:''}
        ${s.totalOrders===0?`<span style="font-size:11px;color:var(--ink3)">No orders yet today</span>`:''}
      </div>
    </div>`).join('')}
  </div>

  <!-- Detailed table -->
  <div class="card">
    <div class="card-head"><span class="card-title">Today's Order Detail</span></div>
    <div style="overflow-x:auto"><table>
      <thead><tr><th>Employee</th><th>Order</th><th>Type</th><th>Pts</th><th>Time</th><th>Benchmark</th><th>Status</th><th>Customer</th></tr></thead>
      <tbody>
        ${todayLog.map(p=>{
          const emp=empById(p.empId);
          const c=ORDER_COMPLEXITY[p.type];
          const onTime=p.actualMins<=p.benchmarkMins;
          return `<tr>
            <td><div style="display:flex;align-items:center;gap:8px">${empAvatar(emp,22)}<span style="font-size:12px;font-weight:600">${emp?.name||'—'}</span></div></td>
            <td class="mono" style="font-size:12px">${p.orderId}</td>
            <td><span style="background:${c?.color||'#888'};color:#fff;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700">${c?.label||p.type}</span></td>
            <td style="font-weight:700;color:${emp?.color||'var(--ink)'}">${p.pts}</td>
            <td style="font-weight:700;color:${onTime?'var(--green)':'var(--red)'}">${p.actualMins}m</td>
            <td style="color:var(--ink3)">${p.benchmarkMins}m</td>
            <td><span class="tag ${onTime?'tg':'tr'}">${onTime?'On Time':'Over'} ${onTime?'✓':'⚠'}</span></td>
            <td style="font-size:12px;color:var(--ink2)">${p.customer}</td>
          </tr>`;}).join('')}
        ${ORDERS.filter(o=>o.assignedTo&&o.status!=='picked_up'&&ACTIVE_TIMERS[o.id]).map(o=>{
          const emp=empById(o.assignedTo);
          const c=ORDER_COMPLEXITY[o.type];
          const secs=Math.floor((Date.now()-(ACTIVE_TIMERS[o.id]?.startMs||Date.now()))/1000);
          const mins=Math.floor(secs/60);
          const over=secs>(c?.benchmark||10)*60;
          return `<tr style="background:var(--orange-bg)">
            <td><div style="display:flex;align-items:center;gap:8px">${empAvatar(emp,22)}<span style="font-size:12px;font-weight:600">${emp?.name||'—'}</span></div></td>
            <td class="mono" style="font-size:12px">${o.id}</td>
            <td><span style="background:${c?.color||'#888'};color:#fff;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700">${c?.label||o.type}</span></td>
            <td style="font-weight:700">${orderPts(o)}</td>
            <td id="timer-${o.id}" style="font-weight:700;color:${over?'var(--red)':'var(--green)'}"><span style="font-family:monospace">${String(mins).padStart(2,'0')}:00</span></td>
            <td style="color:var(--ink3)">${c?.benchmark||10}m</td>
            <td><span class="tag to">⏱ In Progress</span></td>
            <td style="font-size:12px;color:var(--ink2)">${o.customer}</td>
          </tr>`;}).join('')}
      </tbody>
    </table></div>
  </div>`;
}

// Leaderboard reset countdown
setInterval(()=>{
  const el=document.getElementById('leaderResetTimer');
  if(!el)return;
  const now=new Date();
  const midnight=new Date(now);midnight.setHours(24,0,0,0);
  const diff=midnight-now;
  const h=Math.floor(diff/3600000),m=Math.floor(diff%3600000/60000),s=Math.floor(diff%60000/1000);
  el.textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
},1000);

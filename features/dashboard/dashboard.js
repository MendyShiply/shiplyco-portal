function pgDash(){
  const tu=PALLETS.reduce((s,p)=>s+p.items.reduce((a,i)=>a+i.units,0),0);
  const openInv=INVOICES.find(i=>i.status==='due');
  const openAmt=openInv?openInv.lines.reduce((s,l)=>s+l.amt,0):0;
  return `
  <div class="pg-head"><div class="pg-title">Dashboard</div><div class="pg-sub" id="dashSub">Inventory &amp; billing snapshot</div></div>
  <div class="stats">
    <div class="stat"><div class="stat-lbl">Total Pallets</div><div class="stat-val">${PALLETS.length}</div><span class="tag tb">Across ${TRUCKS.length} trucks</span></div>
    <div class="stat"><div class="stat-lbl">Total Units</div><div class="stat-val">${tu.toLocaleString()}</div><span class="tag tg"><span class="dot" style="background:var(--green)"></span>In warehouse</span></div>
    <div class="stat"><div class="stat-lbl">Containers Shipped</div><div class="stat-val">${CONTAINERS.length}</div></div>
    <div class="stat"><div class="stat-lbl">Balance Due</div><div class="stat-val" style="color:var(--red)">${fmt(openAmt)}</div><span class="tag tr" style="cursor:pointer" onclick="showPage('invoices')">View Invoice →</span></div>
  </div>
  <div class="two-col">
    <div>
      <div class="card">
        <div class="card-head"><span class="card-title">Recent Trucks</span><button class="btn" onclick="showPage('trucks')">View All</button></div>
        <table><thead><tr><th>Truck</th><th>Origin</th><th>Date</th><th>Pallets</th><th>Units</th></tr></thead>
        <tbody>${TRUCKS.map(t=>`<tr>
          <td><strong>${t.name}</strong></td>
          <td><span class="${t.origin==='TX'?'orig-tx':'orig-ar'}">${t.origin}</span></td>
          <td style="font-size:12px;color:var(--ink3)">${t.date}</td>
          <td>${t.pallets}</td>
          <td>${t.units.toLocaleString()}</td>
        </tr>`).join('')}</tbody></table>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">Recent Containers</span><button class="btn" onclick="showPage('containers')">View All</button></div>
        <table><thead><tr><th>Container</th><th>Date</th><th>Pallets</th><th>Status</th></tr></thead>
        <tbody>${CONTAINERS.slice(-4).reverse().map(c=>`<tr>
          <td><strong>${c.id}</strong></td>
          <td style="font-size:12px">${c.date}</td>
          <td>${c.pallets}</td>
          <td><span class="tag ${c.status==='Delivered'?'tg':'to'}">${c.status}</span></td>
        </tr>`).join('')}</tbody></table>
      </div>
    </div>
    <div>
      ${openInv?`<div class="card" style="border-color:var(--red)">
        <div class="card-head" style="background:var(--red-light)"><span class="card-title" style="color:var(--red)">Invoice Due</span><button class="btn btn-red" onclick="showInv('${openInv.id}')">View Invoice</button></div>
        <div style="padding:16px 18px">
          <div style="font-size:22px;font-weight:800;margin-bottom:4px">${fmt(openAmt)}</div>
          <div style="font-size:12px;color:var(--ink3)">${openInv.period} · Due ${openInv.due}</div>
          <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px">
            ${openInv.lines.slice(0,4).map(l=>`<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0"><span>${l.desc}</span><strong>${fmt(l.amt)}</strong></div>`).join('')}
            ${openInv.lines.length>4?`<div style="font-size:11px;color:var(--ink3);margin-top:4px">+ ${openInv.lines.length-4} more items</div>`:''}
          </div>
        </div>
      </div>`:''}
      <div class="card">
        <div class="card-head"><span class="card-title">Top Items</span></div>
        ${UPCS.sort((a,b)=>b.units-a.units).slice(0,6).map(u=>{
          const pct=Math.round(u.units/2304*100);
          return `<div style="padding:10px 16px;border-bottom:1px solid var(--border)">
            <div style="font-size:12px;font-weight:600;margin-bottom:5px">${u.desc}</div>
            <div class="qb-wrap"><span class="qb-n">${u.units.toLocaleString()}</span><div class="qb"><div class="qb-fill" style="width:${pct}%"></div></div></div>
          </div>`;}).join('')}
      </div>
    </div>
  </div>`;
}

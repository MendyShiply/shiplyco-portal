// ── DISPATCH PAGE — Admin/Employee operations board ──
function pgDispatch(){
  setTimeout(async()=>{
    const wrap = document.getElementById('dispatchWrap');
    if(!wrap) return;
    wrap.innerHTML = `<div style="padding:40px;text-align:center;color:var(--ink3)"><span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Loading orders…</div>`;
    _dispatchOrders = await loadDispatchOrders();
    renderDispatchBoard(_dispatchOrders);
  }, 100);

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div class="pg-title">Dispatch Board</div>
      <div class="pg-sub">All active orders — assign, track, and fulfill in real time</div>
    </div>
    <button class="btn" onclick="refreshDispatch()">↻ Refresh</button>
  </div>

  <!-- Stats -->
  <div class="stats" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat"><div class="stat-lbl">Open Orders</div><div class="stat-val" id="dStatOpen">—</div><span class="tag to">Active</span></div>
    <div class="stat"><div class="stat-lbl">Unassigned</div><div class="stat-val" id="dStatUnassigned">—</div><span class="tag tr">Needs someone</span></div>
    <div class="stat"><div class="stat-lbl">In Progress</div><div class="stat-val" id="dStatInProgress">—</div><span class="tag tb">Being worked</span></div>
    <div class="stat"><div class="stat-lbl">Processed</div><div class="stat-val" id="dStatProcessed">—</div><span class="tag tg">Ready for pickup</span></div>
  </div>

  <div id="dispatchWrap"></div>`;
}

function renderDispatchBoard(orders){
  const wrap = document.getElementById('dispatchWrap');
  if(!wrap) return;

  // Update stats
  const unassigned = orders.filter(o=>!o.assigned_to);
  const inProgress = orders.filter(o=>o.assigned_to && o.status==='pending');
  const processed  = orders.filter(o=>o.status==='processed');
  document.getElementById('dStatOpen').textContent        = orders.length;
  document.getElementById('dStatUnassigned').textContent  = unassigned.length;
  document.getElementById('dStatInProgress').textContent  = inProgress.length;
  document.getElementById('dStatProcessed').textContent   = processed.length;

  if(!orders.length){
    wrap.innerHTML=`<div style="text-align:center;padding:60px;color:var(--ink3)"><div style="font-size:40px;margin-bottom:12px">✅</div><div style="font-weight:700;font-size:16px">No open orders right now</div></div>`;
    return;
  }

  const typeIcons  = {pallet_out:'🚚',pickpack:'📦',fbm:'📦',fba:'🏭',marketplace:'📦'};
  const typeLabels = {pallet_out:'Pallet Outbound',pickpack:'Pick & Pack',fbm:'Pick & Pack',fba:'FBA Prep',marketplace:'Pick & Pack'};

  // Group: Unassigned first, then by assignee
  const groups = {};
  orders.forEach(o=>{
    const key = o.assigned_to||'__unassigned__';
    if(!groups[key]) groups[key]=[];
    groups[key].push(o);
  });

  let html = '';

  // Unassigned section
  if(groups['__unassigned__']?.length){
    html += `
    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--orange);margin-bottom:10px">
      ⚠ Unassigned — ${groups['__unassigned__'].length} order${groups['__unassigned__'].length>1?'s':''} need someone
    </div>`;
    groups['__unassigned__'].forEach(o=>{
      const cust = CUSTOMERS.find(c=>c.id===o.cust_id);
      html += `
      <div class="card" style="margin-bottom:10px;border-left:4px solid var(--orange)">
        <div style="padding:14px 18px;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
              <span style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800">${typeIcons[o.type]||'📦'} ${o.id}</span>
              <span class="tag to">${(o.status||'pending').replace('_',' ')}</span>
              <span style="font-size:11px;color:var(--orange);font-weight:700;background:var(--orange-bg);padding:2px 8px;border-radius:4px">⚠ Unassigned</span>
            </div>
            <div style="font-size:13px;font-weight:600;color:var(--ink2)">${cust?.name||o.cust_id} · ${typeLabels[o.type]||o.type}</div>
            <div style="font-size:12px;color:var(--ink3);margin-top:2px">${o.date||'—'} ${o.time?'· '+o.time+' slot':''} ${o.channel?'· '+o.channel:''}</div>
            ${o.notes?`<div style="font-size:12px;color:var(--ink3);margin-top:2px">📝 ${o.notes}</div>`:''}
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
            ${role==='employee'
              ? `<button class="btn btn-red" style="font-size:12px;padding:7px 16px" onclick="sbClaimOrder('${o.id}')">＋ Claim</button>`
              : `<select onchange="sbAssignOrder('${o.id}',this.value);this.value=''"
                  style="padding:6px 10px;border:1px solid var(--border);border-radius:7px;font-family:Barlow,sans-serif;font-size:12px;font-weight:600">
                  <option value="">Assign to…</option>
                  ${EMPLOYEES.map(e=>`<option value="${e.name}">${e.name}</option>`).join('')}
                </select>`
            }
          </div>
        </div>
      </div>`;
    });
    delete groups['__unassigned__'];
  }

  // Assigned sections
  Object.entries(groups).forEach(([empName, empOrders])=>{
    html += `
    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--blue);margin-top:18px;margin-bottom:10px">
      👷 ${empName} — ${empOrders.length} order${empOrders.length>1?'s':''}
    </div>`;
    empOrders.forEach(o=>{
      const cust = CUSTOMERS.find(c=>c.id===o.cust_id);
      const items = Array.isArray(o.items)?o.items:(typeof o.items==='string'?JSON.parse(o.items||'[]'):[]);
      html += `
      <div class="card" style="margin-bottom:10px;border-left:4px solid var(--blue)">
        <div style="padding:14px 18px;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
              <span style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800">${typeIcons[o.type]||'📦'} ${o.id}</span>
              <span class="tag ${o.status==='processed'?'tb':'to'}">${(o.status||'pending').replace('_',' ')}</span>
            </div>
            <div style="font-size:13px;font-weight:600;color:var(--ink2)">${cust?.name||o.cust_id} · ${typeLabels[o.type]||o.type}</div>
            <div style="font-size:12px;color:var(--ink3);margin-top:2px">${o.date||'—'} ${o.time?'· '+o.time+' slot':''} ${o.channel?'· '+o.channel:''}</div>
            ${items.length?`<div style="font-size:12px;color:var(--ink2);margin-top:4px">${items.map(i=>`${i.desc||i.sku} × ${i.qty}`).join(', ')}</div>`:''}
            ${o.pallets?`<div style="font-size:12px;color:var(--ink2);margin-top:2px">${o.pallets} pallet${o.pallets>1?'s':''}</div>`:''}
            ${o.notes?`<div style="font-size:12px;color:var(--ink3);margin-top:2px">📝 ${o.notes}</div>`:''}
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
            ${o.status==='pending'?`<button class="act-btn act-process" onclick="sbMarkOrderStatus('${o.id}','processed')">✓ Mark Processed</button>`:''}
            ${o.status==='processed'?`<button class="act-btn act-pickup" onclick="sbMarkOrderStatus('${o.id}','picked_up')">🚚 Mark Picked Up</button>`:''}
            ${role==='admin'
              ? `<select onchange="sbAssignOrder('${o.id}',this.value)"
                  style="padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;font-size:11px">
                  <option value="${o.assigned_to||''}">${o.assigned_to||'Reassign…'}</option>
                  <option value="">— Unassign —</option>
                  ${EMPLOYEES.map(e=>`<option value="${e.name}">${e.name}</option>`).join('')}
                </select>`
              : `<button class="act-btn" style="font-size:11px" onclick="sbReleaseOrder('${o.id}')">↩ Release</button>`
            }
          </div>
        </div>
      </div>`;
    });
  });

  wrap.innerHTML = html;
}

async function refreshDispatch(){
  const wrap = document.getElementById('dispatchWrap');
  if(wrap) wrap.innerHTML=`<div style="padding:40px;text-align:center;color:var(--ink3)"><span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Refreshing…</div>`;
  _dispatchOrders = await loadDispatchOrders();
  renderDispatchBoard(_dispatchOrders);
}

// ── MY TASKS PAGE — tap to expand, fulfillment + pick directions inline ──
let _expandedOrder = null;

function pgMyTasks(){
  if(!currentEmployee){
    return `<div class="pg-head"><div class="pg-title">My Tasks</div></div>
    <div class="card" style="padding:40px;text-align:center;color:var(--ink3)">Log in as an employee to see your tasks.</div>`;
  }
  setTimeout(async()=>{
    const wrap = document.getElementById('myTasksWrap');
    if(!wrap) return;
    wrap.innerHTML=`<div style="padding:40px;text-align:center;color:var(--ink3)"><span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Loading…</div>`;
    await refreshMyTasks();
  }, 100);
  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div class="pg-title">My Tasks</div>
      <div class="pg-sub" id="myTaskSubtitle">Loading…</div>
    </div>
    <button class="btn" onclick="refreshMyTasks()">↻ Refresh</button>
  </div>
  <div id="myTasksWrap"></div>`;
}

async function refreshMyTasks(){
  const wrap = document.getElementById('myTasksWrap');
  if(!wrap) return;
  const [{data:mine},{data:unassigned}] = await Promise.all([
    sb.from('orders').select('*').eq('assigned_to',currentEmployee.name).not('status','eq','picked_up').order('date',{ascending:true}),
    sb.from('orders').select('*').is('assigned_to',null).not('status','eq','picked_up').order('date',{ascending:true})
  ]);
  const sub = document.getElementById('myTaskSubtitle');
  if(sub) sub.textContent=`${(mine||[]).length} active · ${(unassigned||[]).length} available to claim`;
  buildMyTasksHtml(mine||[], unassigned||[]);
}

function buildMyTasksHtml(mine, unassigned){
  const wrap = document.getElementById('myTasksWrap');
  if(!wrap) return;
  const typeIcons  = {pallet_out:'🚚',pickpack:'📦',fbm:'📦',fba:'🏭',marketplace:'📦'};
  const typeLabels = {pallet_out:'Pallet Outbound',pickpack:'Pick & Pack',fbm:'Pick & Pack',fba:'FBA Prep',marketplace:'Pick & Pack'};
  const STEPS = {
    pallet_out: ['Locate pallet in warehouse','Wrap & secure pallet','Apply outbound label','Stage at dock','Mark picked up'],
    pickpack:   ['Review pick list below','Pick all items by location','Pack into box','Apply shipping label','Mark complete'],
    fbm:        ['Review pick list below','Pick all items by location','Pack into box','Apply shipping label','Mark complete'],
    fba:        ['Review pick list below','Pick all items','Label each unit','Kit & box','Palletize for FBA','Mark complete'],
    marketplace:['Review pick list below','Pick items','Pack & label','Mark complete'],
  };
  let html = '';

  // ── MY CLAIMED ORDERS ──
  if(mine.length){
    html+=`<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--red);margin-bottom:10px">My Orders (${mine.length})</div>`;
    mine.forEach(o=>{
      const cust   = CUSTOMERS.find(c=>c.id===o.cust_id);
      const steps  = STEPS[o.type]||STEPS.pickpack;
      const items  = Array.isArray(o.items)?o.items:(typeof o.items==='string'?JSON.parse(o.items||'[]'):[]);
      const isOpen = _expandedOrder===o.id;
      const stepDone = o.status==='processed'?steps.length-1:0;
      const pickLines = items.map(item=>{
        const inv = INVENTORY.find(l=>l.sku===item.sku||l.desc?.includes((item.desc||'').split(' ')[0]||'x'));
        return {loc:inv?.id||'—', desc:item.desc||item.sku||'', units:item.qty, sku:item.sku, openCase:inv?.openCase||false};
      });
      html+=`
      <div class="card" style="margin-bottom:10px;border-left:4px solid var(--red);overflow:hidden">
        <!-- Tap header to expand/collapse -->
        <div onclick="toggleTaskExpand('${o.id}')" style="padding:14px 18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;gap:12px;background:${isOpen?'var(--red-light)':'var(--surface)'}">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px">
              <span style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800">${typeIcons[o.type]||'📦'} ${o.id}</span>
              <span class="tag ${o.status==='processed'?'tb':'to'}" style="font-size:11px">${(o.status||'').replace('_',' ')}</span>
              ${stepDone>0?`<span style="font-size:11px;color:var(--green);font-weight:700">Step ${stepDone}/${steps.length-1} done</span>`:''}
            </div>
            <div style="font-size:13px;font-weight:600;color:var(--ink2)">${cust?.name||o.cust_id} · ${typeLabels[o.type]||o.type} ${o.date?'· '+o.date:''} ${o.time?'· '+o.time+' slot':''}</div>
          </div>
          <span style="font-size:20px;color:var(--ink3);${isOpen?'transform:rotate(180deg)':''}">⌄</span>
        </div>
        ${isOpen?`
        <div style="border-top:1px solid var(--border);padding:16px 18px;background:var(--bg)">
          ${items.length?`<div style="font-size:12px;color:var(--ink2);margin-bottom:14px;padding:10px 12px;background:var(--surface);border-radius:7px;border:1px solid var(--border)"><strong>Items:</strong> ${items.map(i=>`${i.desc||i.sku} × ${i.qty}`).join(', ')}</div>`:''}
          ${o.notes?`<div style="font-size:12px;color:var(--ink3);margin-bottom:12px">📝 ${o.notes}</div>`:''}
          <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);margin-bottom:10px">Fulfillment Steps</div>
          ${steps.map((step,i)=>{
            const done=i<stepDone, active=i===stepDone, isLast=i===steps.length-1;
            // Determine what action this step needs
            const isScanStep   = step.toLowerCase().includes('locate') || step.toLowerCase().includes('find');
            const isPickStep   = step.toLowerCase().includes('pick');
            const isCompleteStep = isLast;
            return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:8px;margin-bottom:6px;
                        background:${done?'var(--green-bg)':active?'var(--red-light)':'var(--surface)'};
                        border:1px solid ${done?'var(--green)':active?'var(--red)':'var(--border)'}">
              <div style="width:24px;height:24px;border-radius:50%;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;
                          background:${done?'var(--green)':active?'var(--red)':'var(--border)'};color:${done||active?'#fff':'var(--ink3)'}">
                ${done?'✓':i+1}
              </div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:${active?'700':'500'};color:${done?'var(--green)':active?'var(--ink)':'var(--ink3)'};${done?'text-decoration:line-through':''}">
                  ${step}
                </div>
                ${active && isScanStep ? `
                <div style="margin-top:10px">
                  <div style="font-size:11px;color:var(--ink3);margin-bottom:6px">Scan pallet barcode — or type it manually if no scanner connected</div>
                  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                    <input type="text" id="scanInput_${o.id}_${i}"
                      placeholder="Scan or type barcode…"
                      autofocus
                      style="flex:1;min-width:160px;padding:9px 12px;border:2px solid var(--red);border-radius:8px;font-family:monospace;font-size:14px;font-weight:700;outline:none"
                      onkeydown="if(event.key==='Enter')confirmScan('${o.id}',${i},${steps.length},this.value)"
                    />
                    <button class="btn btn-red" style="font-size:12px;padding:9px 16px;flex-shrink:0"
                      onclick="confirmScan('${o.id}',${i},${steps.length},document.getElementById('scanInput_${o.id}_${i}').value)">
                      ✓ Confirm
                    </button>
                    ${('BarcodeDetector' in window)?`
                    <button class="btn" style="font-size:12px;padding:9px 14px;flex-shrink:0" onclick="openCameraScanner('${o.id}',${i},${steps.length})" title="Use camera">
                      📷 Camera
                    </button>`:''}
                  </div>
                  <div id="scanResult_${o.id}_${i}" style="margin-top:6px;font-size:12px;display:none"></div>
                </div>`
                : active && isCompleteStep ? `
                <div style="margin-top:8px">
                  <button class="btn btn-red" style="font-size:12px;padding:8px 18px" onclick="sbMarkOrderStatus('${o.id}','picked_up');_expandedOrder=null">✅ Mark Complete</button>
                </div>`
                : active ? `
                <div style="margin-top:8px">
                  <button class="act-btn act-process" style="font-size:12px" onclick="markStepDone(event,'${o.id}',${i},${steps.length})">✓ Done</button>
                </div>` : done ? `<div style="font-size:11px;color:var(--green);margin-top:2px">✓ Completed</div>` : ''}
              </div>
            </div>`;
          }).join('')}
          ${pickLines.length?`
          <div style="margin-top:16px">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);margin-bottom:10px">📍 Pick Directions</div>
            ${pickLines.map((d,i)=>`
            <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid ${d.openCase?'var(--orange)':i===0?'var(--red)':'var(--border)'};border-radius:8px;margin-bottom:6px;background:${d.openCase?'var(--orange-bg)':i===0?'var(--red-light)':'var(--surface)'}">
              <span style="font-family:monospace;font-size:14px;font-weight:900;color:var(--red);min-width:70px">${d.loc}</span>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:600">${d.desc}</div>
                <div style="font-size:11px;color:var(--ink3)">Pick ${d.units} unit${d.units!==1?'s':''}${d.sku?' · '+d.sku:''}</div>
                ${d.openCase?`<div style="font-size:11px;color:var(--orange);font-weight:700">⚠ Open case — pick loose units first</div>`:''}
              </div>
              <button class="act-btn" style="font-size:11px" onclick="confirmPickLine(this,'${o.id}')">✓ Picked</button>
            </div>`).join('')}
          </div>`:''}
          <div style="margin-top:14px;text-align:right">
            <button class="btn" style="font-size:11px" onclick="sbReleaseOrder('${o.id}')">↩ Release Order</button>
          </div>
        </div>`:''}
      </div>`;
    });
  } else {
    html+=`<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:28px;text-align:center;color:var(--ink3);margin-bottom:18px">
      <div style="font-size:28px;margin-bottom:8px">✅</div>
      <div style="font-weight:600">No tasks claimed yet</div>
      <div style="font-size:12px;margin-top:4px">Claim an order below to get started</div>
    </div>`;
  }

  // ── AVAILABLE TO CLAIM ──
  if(unassigned.length){
    html+=`<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--orange);margin-top:20px;margin-bottom:10px">Available to Claim (${unassigned.length})</div>`;
    unassigned.forEach(o=>{
      const cust  = CUSTOMERS.find(c=>c.id===o.cust_id);
      const items = Array.isArray(o.items)?o.items:(typeof o.items==='string'?JSON.parse(o.items||'[]'):[]);
      const isOpen = _expandedOrder===('u_'+o.id);
      html+=`
      <div class="card" style="margin-bottom:8px;border-left:4px solid var(--orange);overflow:hidden">
        <!-- Tap to preview -->
        <div onclick="toggleUnassignedExpand('${o.id}')"
          style="padding:12px 18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;gap:10px;background:${isOpen?'var(--orange-bg)':'var(--surface)'}">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px">
              <span style="font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:800">${typeIcons[o.type]||'📦'} ${o.id}</span>
              <span class="tag to" style="font-size:11px">${(o.status||'').replace('_',' ')}</span>
            </div>
            <div style="font-size:12px;font-weight:600;color:var(--ink2)">${cust?.name||o.cust_id} · ${typeLabels[o.type]||o.type}</div>
            <div style="font-size:11px;color:var(--ink3)">${o.date||'—'} ${o.time?'· '+o.time+' slot':''} ${o.channel?'· '+o.channel:''}</div>
          </div>
          <span style="font-size:18px;color:var(--ink3);flex-shrink:0;${isOpen?'transform:rotate(180deg)':''}">⌄</span>
        </div>
        <!-- Expanded preview -->
        ${isOpen?`
        <div style="border-top:1px solid var(--border);padding:14px 18px;background:var(--bg)">

          <!-- Meta row -->
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;padding:10px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font-size:12px">
            <div><span style="color:var(--ink3)">Type</span> &nbsp;<strong>${typeLabels[o.type]||o.type}</strong></div>
            ${o.channel?`<div><span style="color:var(--ink3)">Channel</span> &nbsp;<strong>${o.channel}</strong></div>`:''}
            ${o.date?`<div><span style="color:var(--ink3)">Date</span> &nbsp;<strong>${o.date}</strong></div>`:''}
            ${o.time?`<div><span style="color:var(--ink3)">Slot</span> &nbsp;<strong>${o.time}</strong></div>`:''}
            ${o.pallets?`<div><span style="color:var(--ink3)">Pallets</span> &nbsp;<strong>${o.pallets}</strong></div>`:''}
          </div>

          <!-- Items -->
          ${items.length?`
          <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);margin-bottom:8px">What's in this order</div>
          ${items.map(i=>{
            const inv = SKU_CATALOG.find(s=>s.sku===i.sku||s.id===i.sku);
            return `<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;margin-bottom:6px">
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700;color:var(--ink)">${i.desc||inv?.name||i.sku||'Unknown item'}</div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:3px;font-size:11px;color:var(--ink3)">
                  ${i.sku?`<span>SKU: ${i.sku}</span>`:''}
                  ${inv?.brand?`<span>Brand: ${inv.brand}</span>`:''}
                  ${inv?.category?`<span>${inv.category}</span>`:''}
                  ${i.color||inv?.color?`<span>🎨 ${i.color||inv?.color}</span>`:''}
                  ${i.size||inv?.size?`<span>📐 ${i.size||inv?.size}</span>`:''}
                  ${inv?.condition?`<span>Cond: ${inv.condition}</span>`:''}
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:18px;font-weight:800;color:var(--ink)">${i.qty}</div>
                <div style="font-size:10px;color:var(--ink3)">units</div>
              </div>
            </div>`;
          }).join('')}`:''}

          <!-- Pallets with location if pallet order -->
          ${o.type==='pallet_out'&&o.pallets?`
          <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);margin-bottom:8px;margin-top:${items.length?'12px':'0'}">Pallets to Pull</div>
          <div style="padding:10px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font-size:13px">
            📦 <strong>${o.pallets}</strong> pallet${o.pallets>1?'s':''} — locations assigned at fulfillment
          </div>`:''}

          ${o.notes?`<div style="font-size:12px;color:var(--ink3);margin-top:10px;padding:8px 12px;background:var(--orange-bg);border:1px solid var(--orange);border-radius:7px">📝 ${o.notes}</div>`:''}

          <div style="margin-top:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
            <div style="font-size:11px;color:var(--ink3)">Tap Claim to add this to your task list</div>
            <button class="btn btn-red" style="font-size:13px;padding:9px 22px;font-weight:800" onclick="claimAndExpand('${o.id}')">＋ Claim This Order</button>
          </div>
        </div>`:''}
      </div>`;
    });
  }
  wrap.innerHTML = html;
}

function toggleTaskExpand(orderId){
  _expandedOrder = _expandedOrder===orderId?null:orderId;
  refreshMyTasks();
}

function toggleUnassignedExpand(orderId){
  const key = 'u_'+orderId;
  _expandedOrder = _expandedOrder===key?null:key;
  refreshMyTasks();
}

async function claimAndExpand(orderId){
  if(!currentEmployee) return;
  const {error} = await sb.from('orders').update({assigned_to:currentEmployee.name, updated_at:new Date().toISOString()}).eq('id',orderId);
  if(error){showToast('⚠ '+error.message);return;}
  _expandedOrder = orderId;
  showToast(`✓ ${orderId} claimed`);
  startTimer(orderId);
  refreshMyTasks();
}

function markStepDone(e, orderId, stepIndex, totalSteps){
  e.stopPropagation();
  if(stepIndex>=totalSteps-2){sbMarkOrderStatus(orderId,'processed');}
  else{showToast(`✓ Step ${stepIndex+1} complete`);refreshMyTasks();}
}

// ── BARCODE SCAN CONFIRMATION ──
function confirmScan(orderId, stepIndex, totalSteps, value){
  const v = (value||'').trim();
  const resultEl = document.getElementById('scanResult_'+orderId+'_'+stepIndex);

  if(!v){
    if(resultEl){
      resultEl.innerHTML='<div style="color:var(--orange);font-weight:600">⚠ Please scan or enter a barcode first.</div>';
      resultEl.style.display='block';
    }
    return;
  }

  // Get the expected SKUs for this order
  const order = (_dispatchOrders||[]).find(o=>o.id===orderId)
             || (_myTaskOrders||[]).find(o=>o.id===orderId);
  const expectedItems = order?.items
    ? (Array.isArray(order.items)?order.items:JSON.parse(order.items||'[]'))
    : [];
  const expectedSkus = expectedItems.map(i=>(i.sku||'').toLowerCase()).filter(Boolean);

  // Look up what was scanned
  const palletMatch = PALLETS.find(p=>p.items?.some(i=>i.upc===v||i.sku===v));
  const skuMatch    = SKU_CATALOG.find(s=>s.upc===v||s.sku===v||s.id===v);
  const invMatch    = INVENTORY.find(l=>l.id===v||l.sku===v);
  const scannedName = skuMatch?.name||skuMatch?.desc||palletMatch?.items?.[0]?.desc||invMatch?.desc||v;
  const scannedSku  = (skuMatch?.sku||skuMatch?.id||invMatch?.sku||'').toLowerCase();
  const inSystem    = !!(palletMatch||skuMatch||invMatch);

  // Check if it matches something expected on this order
  const matchesOrder = expectedSkus.length===0 // no SKUs on order — just check it's in system
    || expectedSkus.includes(scannedSku)
    || expectedSkus.some(s=>v.toLowerCase()===s);

  if(!inSystem){
    // Hard stop — not in system at all — offer to report to admin via TARA
    resultEl.innerHTML=`
      <div style="background:var(--red-light);border:1.5px solid var(--red);border-radius:8px;padding:12px 14px">
        <div style="color:var(--red);font-weight:800;font-size:13px;margin-bottom:6px">&#10060; Barcode not recognized</div>
        <div style="color:var(--ink2);font-size:12px;margin-bottom:4px">This barcode isn't in our system. It could be:</div>
        <div style="color:var(--ink2);font-size:12px;margin-bottom:10px;padding-left:8px">
          · A pallet that was received but never entered into SKU Master<br>
          · A mislabeled item<br>
          · The wrong pallet entirely
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <div style="font-size:12px;color:var(--ink2)">Is this pallet in our warehouse?</div>
          <button onclick="reportUnknownBarcode('${v}','${orderId}')"
            style="background:var(--red);color:#fff;border:none;border-radius:7px;padding:8px 16px;font-family:Barlow,sans-serif;font-size:12px;font-weight:700;cursor:pointer">
            📣 Report to Admin
          </button>
        </div>
      </div>`;
  } else if(!matchesOrder){
    // In system but wrong item for this order
    const expectedDesc = expectedItems.map(i=>i.desc||i.sku).filter(Boolean).join(', ');
    resultEl.innerHTML=`
      <div style="background:var(--red-light);border:1.5px solid var(--red);border-radius:8px;padding:12px 14px">
        <div style="color:var(--red);font-weight:800;font-size:13px;margin-bottom:4px">&#10060; Wrong item scanned</div>
        <div style="color:var(--ink2);font-size:12px;margin-bottom:6px">
          You scanned: <strong>${scannedName}</strong>
        </div>
        ${expectedDesc?`<div style="color:var(--ink2);font-size:12px;margin-bottom:4px">
          This order needs: <strong>${expectedDesc}</strong>
        </div>`:''}
        <div style="color:var(--ink2);font-size:12px">You have the wrong pallet. Put it back and find the correct one.</div>
      </div>`;
  } else {
    // Correct — green and advance
    const loc = palletMatch?.loc||invMatch?.id||'';
    resultEl.innerHTML=`
      <div style="background:var(--green-bg);border:1.5px solid var(--green);border-radius:8px;padding:10px 14px">
        <div style="color:var(--green);font-weight:800;font-size:13px">&#10003; Confirmed — ${scannedName}${loc?' · '+loc:''}</div>
      </div>`;
    resultEl.style.display='block';
    setTimeout(()=>{
      markStepDone({stopPropagation:()=>{}}, orderId, stepIndex, totalSteps);
    }, 800);
    return;
  }

  // For both error cases — show message, clear input, refocus
  resultEl.style.display='block';
  const input = document.getElementById('scanInput_'+orderId+'_'+stepIndex);
  if(input){ input.value=''; input.focus(); }
}

// ── REPORT UNKNOWN BARCODE TO ADMIN VIA TARA ──
function reportUnknownBarcode(barcode, orderId){
  const emp  = currentEmployee?.name || currentUser?.name || 'An employee';
  const time = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const msg  = `${emp} scanned an unrecognized barcode while fulfilling order ${orderId}.

Barcode scanned: ${barcode}
Time: ${time}

This item is not in the SKU Master or inventory. Please investigate — it may be a received pallet that was never logged, a mislabeled item, or something that doesn't belong in the warehouse.`;

  // Fire to TARA
  injectTara();
  setTimeout(()=>{
    const panel = document.getElementById('taraPanel');
    if(panel && panel.style.display==='none') toggleTara();
    // Add alert to TARA's feed
    const feed = document.getElementById('taraFeed');
    if(feed){
      const alertEl = document.createElement('div');
      alertEl.style.cssText='background:var(--red-light);border:1.5px solid var(--red);border-radius:8px;padding:12px 14px;margin-bottom:10px';
      alertEl.innerHTML=`
        <div style="color:var(--red);font-weight:800;font-size:12px;margin-bottom:4px">🔍 Unknown Barcode Reported</div>
        <div style="font-size:12px;color:var(--ink2);margin-bottom:6px"><strong>Barcode:</strong> ${barcode}<br><strong>Order:</strong> ${orderId}<br><strong>Reported by:</strong> ${emp}<br><strong>Time:</strong> ${time}</div>
        <div style="font-size:11px;color:var(--ink3)">Item not found in SKU Master. May be unreceived, mislabeled, or wrong warehouse.</div>`;
      feed.prepend(alertEl);
    }
    // Also send as a TARA message so AI can respond
    sendToTara(msg);
  }, 600);

  showToast('📣 Reported to admin — TARA will investigate');
}

// ── CAMERA BARCODE SCANNER (phones/tablets with BarcodeDetector API) ──
let _cameraStream = null;
function openCameraScanner(orderId, stepIndex, totalSteps){
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'cameraOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.95);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px';
  overlay.innerHTML = `
    <div style="color:#fff;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Point camera at barcode</div>
    <video id="scannerVideo" autoplay playsinline style="width:min(90vw,400px);border-radius:12px;border:3px solid var(--red)"></video>
    <div style="width:min(90vw,400px);height:3px;background:var(--red);border-radius:2px;animation:scan 1.5s ease-in-out infinite"></div>
    <div id="cameraStatus" style="color:rgba(255,255,255,0.6);font-size:13px">Initializing camera…</div>
    <button onclick="closeCameraScanner()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:10px 24px;color:#fff;font-family:Barlow,sans-serif;font-size:13px;cursor:pointer">Cancel</button>`;
  document.body.appendChild(overlay);

  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(stream=>{
    _cameraStream = stream;
    const video = document.getElementById('scannerVideo');
    video.srcObject = stream;
    document.getElementById('cameraStatus').textContent = 'Scanning — hold steady over barcode';

    const detector = new BarcodeDetector({formats:['code_128','code_39','ean_13','ean_8','qr_code','data_matrix','upc_a','upc_e']});
    let scanning = true;

    const scan = async()=>{
      if(!scanning||!document.getElementById('cameraOverlay')) return;
      try {
        const barcodes = await detector.detect(video);
        if(barcodes.length>0){
          scanning = false;
          const code = barcodes[0].rawValue;
          closeCameraScanner();
          // Fill the input and confirm
          const input = document.getElementById(`scanInput_${orderId}_${stepIndex}`);
          if(input) input.value = code;
          confirmScan(orderId, stepIndex, totalSteps, code);
          return;
        }
      } catch(e){}
      requestAnimationFrame(scan);
    };
    requestAnimationFrame(scan);
  }).catch(err=>{
    const status = document.getElementById('cameraStatus');
    if(status) status.textContent = '⚠ Camera access denied — use manual entry';
  });
}

function closeCameraScanner(){
  if(_cameraStream){ _cameraStream.getTracks().forEach(t=>t.stop()); _cameraStream=null; }
  document.getElementById('cameraOverlay')?.remove();
}


function renderMyTasks(mine, unassigned){
  const wrap = document.getElementById('myTasksWrap');
  if(!wrap) return;
  if(document.getElementById('myTaskCount'))
    document.getElementById('myTaskCount').textContent = `${mine.length} active task${mine.length!==1?'s':''}`;

  const typeIcons  = {pallet_out:'🚚',pickpack:'📦',fbm:'📦',fba:'🏭',marketplace:'📦'};
  const typeLabels = {pallet_out:'Pallet Outbound',pickpack:'Pick & Pack',fbm:'Pick & Pack',fba:'FBA Prep',marketplace:'Pick & Pack'};

  // Fulfillment steps per order type
  const STEPS = {
    pallet_out: ['Locate pallet in warehouse','Wrap pallet','Apply label','Stage for pickup','Mark picked up'],
    pickpack:   ['Pull pick list','Pick all items by location','Pack into box','Apply shipping label','Mark picked up'],
    fbm:        ['Pull pick list','Pick all items by location','Pack into box','Apply shipping label','Mark picked up'],
    fba:        ['Pull pick list','Pick items','Label each unit','Kit & box','Palletize','Mark picked up'],
    marketplace:['Pull pick list','Pick items','Pack','Label','Mark picked up'],
  };

  let html = '';

  // ── My assigned orders ──
  html += `<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--red);margin-bottom:10px">
    ● My Orders (${mine.length})
  </div>`;

  if(!mine.length){
    html += `<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:28px;text-align:center;color:var(--ink3);margin-bottom:18px">
      <div style="font-size:28px;margin-bottom:8px">✅</div>
      <div style="font-weight:600">No tasks assigned to you right now</div>
      <div style="font-size:12px;margin-top:4px">Claim an order below</div>
    </div>`;
  } else {
    mine.forEach(o=>{
      const cust  = CUSTOMERS.find(c=>c.id===o.cust_id);
      const steps = STEPS[o.type]||STEPS.pickpack;
      const items = Array.isArray(o.items)?o.items:(typeof o.items==='string'?JSON.parse(o.items||'[]'):[]);
      // Determine current step from status
      const stepDone = o.status==='processed' ? steps.length-1 : 0;

      html += `
      <div class="card" style="margin-bottom:16px;border-left:4px solid var(--red)">
        <!-- Order Header -->
        <div style="padding:14px 18px;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;border-bottom:1px solid var(--border)">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
              <span style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800">${typeIcons[o.type]||'📦'} ${o.id}</span>
              <span class="tag ${o.status==='processed'?'tb':'to'}">${(o.status||'').replace('_',' ')}</span>
            </div>
            <div style="font-size:13px;font-weight:600">${cust?.name||o.cust_id} · ${typeLabels[o.type]||o.type}</div>
            <div style="font-size:12px;color:var(--ink3);margin-top:2px">${o.date||'—'} ${o.time?'· '+o.time+' slot':''} ${o.channel?'· '+o.channel:''}</div>
            ${items.length?`<div style="font-size:12px;color:var(--ink2);margin-top:4px">Items: ${items.map(i=>`${i.desc||i.sku} × ${i.qty}`).join(', ')}</div>`:''}
            ${o.pallets?`<div style="font-size:12px;color:var(--ink2);margin-top:2px">${o.pallets} pallet${o.pallets>1?'s':''}</div>`:''}
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button class="btn" style="font-size:11px;padding:6px 12px" onclick="sbReleaseOrder('${o.id}')">↩ Release</button>
          </div>
        </div>

        <!-- Fulfillment Steps -->
        <div style="padding:14px 18px">
          <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);margin-bottom:12px">Fulfillment Checklist</div>
          ${steps.map((step,i)=>{
            const done = i < stepDone;
            const active = i === stepDone;
            const last = i === steps.length-1;
            return `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:8px;margin-bottom:6px;
                        background:${done?'var(--green-bg)':active?'var(--red-light)':'var(--bg)'};
                        border:1px solid ${done?'var(--green)':active?'var(--red)':'var(--border)'}">
              <div style="width:26px;height:26px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;
                          font-size:12px;font-weight:800;
                          background:${done?'var(--green)':active?'var(--red)':'var(--border)'};
                          color:${done||active?'#fff':'var(--ink3)'}">
                ${done?'✓':i+1}
              </div>
              <span style="flex:1;font-size:13px;font-weight:${active?'700':'500'};color:${done?'var(--green)':active?'var(--ink)':'var(--ink3)'};${done?'text-decoration:line-through':''}">
                ${step}
              </span>
              ${active && last
                ? `<button class="btn btn-red" style="font-size:11px;padding:6px 14px" onclick="sbMarkOrderStatus('${o.id}','picked_up')">🚚 Complete</button>`
                : active && !last
                ? `<button class="act-btn act-process" style="font-size:11px" onclick="advanceOrderStep('${o.id}',${i+1},${steps.length})">✓ Done</button>`
                : done?`<span style="font-size:12px;color:var(--green)">✓</span>`:''
              }
            </div>`;
          }).join('')}
        </div>
      </div>`;
    });
  }

  // ── Unassigned pool ──
  if(unassigned.length){
    html += `
    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--orange);margin-top:24px;margin-bottom:10px">
      ○ Available to Claim (${unassigned.length})
    </div>`;
    unassigned.forEach(o=>{
      const cust = CUSTOMERS.find(c=>c.id===o.cust_id);
      const items = Array.isArray(o.items)?o.items:(typeof o.items==='string'?JSON.parse(o.items||'[]'):[]);
      html += `
      <div class="card" style="margin-bottom:10px;border-left:4px solid var(--orange)">
        <div style="padding:14px 18px;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800">${typeIcons[o.type]||'📦'} ${o.id}</span>
              <span class="tag to">${(o.status||'').replace('_',' ')}</span>
            </div>
            <div style="font-size:13px;font-weight:600">${cust?.name||o.cust_id} · ${typeLabels[o.type]||o.type}</div>
            <div style="font-size:12px;color:var(--ink3);margin-top:2px">${o.date||'—'} ${o.time?'· '+o.time+' slot':''} ${o.channel?'· '+o.channel:''}</div>
            ${items.length?`<div style="font-size:12px;color:var(--ink2);margin-top:4px">${items.map(i=>`${i.desc||i.sku} × ${i.qty}`).join(', ')}</div>`:''}
            ${o.pallets?`<div style="font-size:12px;color:var(--ink2);margin-top:2px">${o.pallets} pallet${o.pallets>1?'s':''}</div>`:''}
          </div>
          <button class="btn btn-red" style="font-size:12px;padding:8px 18px" onclick="sbClaimOrder('${o.id}')">＋ Claim</button>
        </div>
      </div>`;
    });
  }

  wrap.innerHTML = html;
}

// Advance order through fulfillment steps
async function advanceOrderStep(orderId, nextStep, totalSteps){
  // If it's the second-to-last step, mark as processed
  if(nextStep >= totalSteps-1){
    await sbMarkOrderStatus(orderId, 'processed');
  } else {
    showToast(`✓ Step ${nextStep} complete`);
    // Reload tasks to reflect progress
    const {data:mine} = await sb.from('orders').select('*').eq('assigned_to',currentEmployee.name).not('status','eq','picked_up');
    const {data:unassigned} = await sb.from('orders').select('*').is('assigned_to',null).not('status','eq','picked_up');
    renderMyTasks(mine||[], unassigned||[]);
  }
}

// ── PICK LIST PAGE — Location-directed picking ──
function pgPickList(){
  setTimeout(async()=>{
    const wrap = document.getElementById('pickListWrap');
    if(!wrap) return;
    wrap.innerHTML=`<div style="padding:40px;text-align:center;color:var(--ink3)"><span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Loading pick tasks…</div>`;

    // Load orders that need picking - either assigned to me or unassigned
    let query = sb.from('orders').select('*').not('status','eq','picked_up').order('date',{ascending:true});
    if(role==='employee') query = query.eq('assigned_to', currentEmployee.name);
    const {data, error} = await query;
    if(error){ wrap.innerHTML=`<div style="padding:20px;color:var(--red)">Error: ${error.message}</div>`; return; }
    renderPickList(data||[]);
  }, 100);

  return `
  <div class="pg-head">
    <div class="pg-title">Pick List</div>
    <div class="pg-sub">Location-directed picking — system tells you exactly where to go</div>
  </div>

  <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:8px;padding:12px 16px;margin-bottom:18px;font-size:12px;color:var(--gold);font-weight:600">
    📋 <strong>Pick Priority:</strong> &nbsp;① Open case first → ② Lowest qty pallet → ③ Oldest received (FIFO)
  </div>

  <div id="pickListWrap"></div>`;
}

function renderPickList(orders){
  const wrap = document.getElementById('pickListWrap');
  if(!wrap) return;
  const typeLabels={pallet_out:'🚚 Pallet Outbound',pickpack:'📦 Pick & Pack',fbm:'📦 Pick & Pack',fba:'🏭 FBA Prep',marketplace:'📦 Pick & Pack'};

  const pickOrders = orders.filter(o=>o.type!=='pallet_out'||o.status!=='picked_up');

  if(!pickOrders.length){
    wrap.innerHTML=`<div style="text-align:center;padding:60px;color:var(--ink3)"><div style="font-size:40px;margin-bottom:12px">✅</div><div style="font-weight:700">No pick tasks right now</div></div>`;
    return;
  }

  wrap.innerHTML = pickOrders.map(o=>{
    const cust  = CUSTOMERS.find(c=>c.id===o.cust_id);
    const items = Array.isArray(o.items)?o.items:(typeof o.items==='string'?JSON.parse(o.items||'[]'):[]);

    // For pallet orders show pallet locations, for item orders show pick directions
    let pickLines = [];
    if(o.type==='pallet_out'){
      pickLines = [{loc:'Assigned pallet location', desc:'Pull full pallet', units:o.pallets||1, type:'full_pallet'}];
    } else {
      pickLines = items.map(item=>{
        const inv = INVENTORY.find(l=>l.sku===item.sku||l.desc?.includes(item.desc?.split(' ')[0]||''));
        return {loc:inv?.id||'Check SKU Master', desc:item.desc||item.sku, units:item.qty, type:'each', sku:item.sku, openCase:inv?.openCase||false};
      });
    }

    return `
    <div class="card" style="margin-bottom:16px">
      <div class="card-head" style="background:${!o.assigned_to?'var(--orange-bg)':o.status==='processed'?'var(--blue-bg)':'var(--surface)'}">
        <div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800">${o.id} · ${typeLabels[o.type]||o.type}</div>
          <div style="font-size:12px;color:var(--ink3)">${cust?.name||o.cust_id} · ${o.date||'—'} ${o.time?'· '+o.time+' slot':''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="tag ${o.status==='processed'?'tb':'to'}">${(o.status||'').replace('_',' ')}</span>
          ${!o.assigned_to
            ? `<button class="btn btn-red" style="font-size:11px;padding:6px 12px" onclick="sbClaimOrder('${o.id}')">＋ Claim</button>`
            : `<button class="act-btn act-process" onclick="sbMarkOrderStatus('${o.id}','processed')">✓ Mark Processed</button>`
          }
        </div>
      </div>
      <div style="padding:16px 20px">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);margin-bottom:12px">📍 Pick Directions</div>
        ${pickLines.map((d,i)=>`
        <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;
                    border:2px solid ${d.openCase?'var(--orange)':i===0?'var(--red)':'var(--border)'};
                    border-radius:8px;margin-bottom:8px;
                    background:${d.openCase?'var(--orange-bg)':i===0?'var(--red-light)':'var(--bg)'}">
          <div style="width:28px;height:28px;background:${d.openCase?'var(--orange)':i===0?'var(--red)':'var(--ink3)'};
                      border-radius:6px;display:flex;align-items:center;justify-content:center;
                      color:#fff;font-size:13px;font-weight:800;flex-shrink:0">${i+1}</div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
              <span style="font-family:monospace;font-size:16px;font-weight:900;color:var(--red)">${d.loc}</span>
              ${d.openCase?`<span class="tag to" style="font-size:11px">⚠ Open case — pick loose units first</span>`:''}
            </div>
            <div style="font-size:13px;font-weight:600">${d.desc}</div>
            <div style="font-size:12px;color:var(--ink3);margin-top:2px">
              ${d.type==='full_pallet'?`Pull entire pallet`:`Pick ${d.units} unit${d.units!==1?'s':''}`}
              ${d.sku?` · SKU: ${d.sku}`:''}
            </div>
          </div>
          <button class="act-btn act-process" onclick="confirmPickLine(this,'${o.id}')" style="font-size:11px;white-space:nowrap">
            ${d.type==='full_pallet'?'🚚 Pull':'✓ Picked'}
          </button>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function confirmPickLine(btn, orderId){
  btn.textContent='✓ Done';
  btn.style.background='var(--green-bg)';
  btn.style.color='var(--green)';
  btn.style.borderColor='var(--green)';
  btn.disabled=true;
  showToast(`✓ Pick confirmed for ${orderId}`);
}

// ── MY TASKS PAGE (Employee / Admin) — legacy shim kept for nav ──
// Now replaced above — keeping function name for router compatibility
function pgMyTasks_OLD(){
  const myOrders=ORDERS.filter(o=>o.assignedTo===currentEmployee.id&&o.status!=='picked_up');
  const unassigned=ORDERS.filter(o=>!o.assignedTo&&o.status!=='picked_up');
  const typeIcons={pallet_out:'🚚',pickpack:'📦',fbm:'📦',fba:'🏭',marketplace:'📦'};
  const typeLabels={pallet_out:'Pallet Outbound',pickpack:'Pick & Pack',fbm:'Pick & Pack',fba:'FBA Prep',marketplace:'Pick & Pack'};

  function taskCard(o, mine){
    const emp=empById(o.assignedTo);
    return `
    <div style="border:2px solid ${orderCardBorder(o)};border-radius:10px;background:${orderCardBg(o)};padding:0;margin-bottom:12px;overflow:hidden;box-shadow:var(--shadow)">
      <div style="padding:14px 18px;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800">${typeIcons[o.type]||'📦'} ${o.id}</span>
            <span class="tag ${o.status==='processed'?'tb':'to'}" style="font-size:11px">${o.status.replace('_',' ')}</span>
            ${emp?empAvatar(emp,24):''}
          </div>
          <div style="font-size:13px;font-weight:600;color:var(--ink2)">${o.customer} · ${typeLabels[o.type]||o.type}</div>
          <div style="font-size:12px;color:var(--ink3);margin-top:2px">${o.date} · ${o.time} slot · ${o.channel||'—'}</div>
          ${o.pallets.length?`<div style="font-size:12px;margin-top:4px">${o.pallets.map(p=>`📍 ${p.loc} — ${p.desc}`).join(' &nbsp;|&nbsp; ')}</div>`:''}
          ${o.items?`<div style="font-size:12px;margin-top:4px">${o.items.map(i=>`${i.desc} × ${i.qty}`).join(', ')}</div>`:''}
          <div style="display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap">
            ${(()=>{const c=ORDER_COMPLEXITY[o.type];return c?`<span style="background:${c.color};color:#fff;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700">${c.label} · ${orderPts(o)} pts · ${c.benchmark}m benchmark</span>`:''})()}
            ${ACTIVE_TIMERS[o.id]?`<span id="timer-${o.id}" style="font-family:monospace;font-size:15px;font-weight:800">00:00</span>`:''}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          ${mine
            ? `<button class="btn btn-red" style="font-size:12px;padding:7px 14px" onclick="startTimer('${o.id}');openPickSession('${o.pallets[0]?.loc||''}',null,'${o.id}')">▶ Start Fulfilling</button>
               <button class="btn" style="font-size:11px" onclick="unassignOrder('${o.id}')">↩ Release Task</button>`
            : `<button class="btn btn-red" style="font-size:12px;padding:7px 14px" onclick="claimOrder('${o.id}')">＋ Claim This Order</button>`}
          ${role==='admin'?assignDropdown(o.id,o.assignedTo):''}
        </div>
      </div>
      <div style="padding:8px 18px 12px;border-top:1px solid rgba(0,0,0,0.06);display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        ${o.status==='pending'?`<button class="act-btn act-process" onclick="markProcessed('${o.id}')" style="font-size:11px">✓ Mark Processed</button>`:''}
        ${o.status==='processed'?`<button class="act-btn act-pickup" onclick="markPickedUp('${o.id}')" style="font-size:11px">🚚 Mark Picked Up</button>`:''}
        
        <span style="font-size:11px;color:var(--red);font-weight:700;margin-left:auto">💰 ${fmt(o.autoCharge.amt)}</span>
      </div>
    </div>`;
  }

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div class="pg-title">My Tasks</div>
      <div class="pg-sub">Orders assigned to ${currentEmployee.name} — claim new tasks or start fulfilling</div>
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      ${empAvatar(currentEmployee,40)}
      <div>
        <div style="font-size:14px;font-weight:700">${currentEmployee.name}</div>
        <div style="font-size:11px;color:var(--ink3)">${myOrders.length} active task${myOrders.length!==1?'s':''}</div>
      </div>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat" style="border-left:4px solid ${currentEmployee.color}">
      <div class="stat-lbl">My Active Tasks</div>
      <div class="stat-val" style="color:${currentEmployee.color}">${myOrders.length}</div>
      <span class="tag" style="background:${currentEmployee.colorBg};color:${currentEmployee.color}">Assigned to me</span>
    </div>
    <div class="stat">
      <div class="stat-lbl">Unassigned Orders</div>
      <div class="stat-val" style="${unassigned.length?'color:var(--orange)':''}">${unassigned.length}</div>
      <span class="tag ${unassigned.length?'to':'tg'}">${unassigned.length?'Needs someone':'All covered'}</span>
    </div>
    <div class="stat">
      <div class="stat-lbl">Completed Today</div>
      <div class="stat-val">${ORDERS.filter(o=>o.assignedTo===currentEmployee.id&&o.status==='picked_up').length}</div>
      <span class="tag tg">Done</span>
    </div>
  </div>

  <!-- My Assigned Orders -->
  <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:${currentEmployee.color};margin-bottom:10px;margin-top:4px">
    ● My Assigned Orders (${myOrders.length})
  </div>
  ${myOrders.length
    ? myOrders.map(o=>taskCard(o,true)).join('')
    : `<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:28px;text-align:center;color:var(--ink3);margin-bottom:18px">
        <div style="font-size:28px;margin-bottom:8px">✅</div>
        <div style="font-weight:600">No tasks assigned to you right now</div>
        <div style="font-size:12px;margin-top:4px">Claim an unassigned order below</div>
      </div>`}

  <!-- Unassigned Pool -->
  ${unassigned.length?`
  <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--orange);margin-bottom:10px;margin-top:18px">
    ○ Unassigned — Available to Claim (${unassigned.length})
  </div>
  ${unassigned.map(o=>taskCard(o,false)).join('')}`:''}

  <!-- All employees summary (admin only) -->
  ${role==='admin'?`
  <div style="margin-top:24px">
    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--ink3);margin-bottom:12px">All Staff — Task Load</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">
      ${EMPLOYEES.map(e=>{
        const tasks=ORDERS.filter(o=>o.assignedTo===e.id&&o.status!=='picked_up').length;
        return `<div style="background:${e.colorBg};border:2px solid ${e.color};border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:10px">
          ${empAvatar(e,36)}
          <div>
            <div style="font-size:13px;font-weight:700;color:${e.color}">${e.name}</div>
            <div style="font-size:22px;font-weight:800;color:${e.color};line-height:1">${tasks}</div>
            <div style="font-size:10px;color:${e.color};opacity:0.7">active task${tasks!==1?'s':''}</div>
          </div>
        </div>`;}).join('')}
    </div>
  </div>`:''}`;
}

// ── DISPATCH PAGE — now handled by pgDispatch above ──
function pgDispatch_OLD(){
  const today=new Date().toISOString().split('T')[0];
  const tomorrow=new Date(Date.now()+86400000).toISOString().split('T')[0];
  const dates=[{label:"Today · Mar 6",val:today},{label:"Tomorrow · Mar 7",val:tomorrow}];
  let selDate=today;
  const slots=['9am','11am','1pm','3pm'];

  function renderDispatch(dateVal){
    const dayOrders=ORDERS.filter(o=>o.date===dateVal||(!o.date&&dateVal===today));
    return slots.map(slot=>{
      const slotOrders=dayOrders.filter(o=>o.time===slot);
      if(!slotOrders.length)return '';
      return `<div class="slot-group">
        <div class="slot-head">
          <span>🕐 ${slot}</span>
          <span style="font-size:13px;opacity:0.6">${slotOrders.length} order${slotOrders.length>1?'s':''}</span>
        </div>
        <div class="slot-body">
          ${slotOrders.map(o=>{
            const typeLabels={pallet_out:'🚚 Pallet Pickup',pickpack:'📦 Pick & Pack',fbm:'📦 Pick & Pack',fba:'🏭 FBA Prep',marketplace:'📦 Pick & Pack'};
            const emp=empById(o.assignedTo);
            const cust=CUSTOMERS.find(c=>c.id===o.custId)||CUSTOMERS[0];
            return `<div class="dispatch-row" id="dr-${o.id}" style="border-left:4px solid ${emp?emp.color:'var(--border2)'};background:${emp?emp.colorBg:'var(--surface)'}">
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px">
                  <div class="dr-customer">${o.customer}</div>
                  ${emp?empAvatar(emp,22):`<span style="font-size:10px;color:var(--orange);font-weight:700;background:var(--orange-bg);padding:2px 7px;border-radius:4px">⚠ Unassigned</span>`}
                  <span style="font-size:10px;color:var(--ink3)">📧 ${cust.email} · 📞 ${cust.phone}</span>
                </div>
                <div class="dr-id">${o.id} · ${typeLabels[o.type]||o.type}</div>
                <div class="dr-desc">
                  ${o.pallets.length?o.pallets.map(p=>`Pallet ${p.num} · ${p.loc}`).join(', '):''}
                  ${o.channel?` · ${o.channel}`:''}
                  ${o.notes?` · <em>${o.notes}</em>`:''}
                </div>
                <div style="display:flex;align-items:center;gap:12px;margin-top:5px;flex-wrap:wrap">
                  <span style="font-size:11px;color:var(--red);font-weight:700">💰 ${fmt(o.autoCharge.amt)}</span>
                  ${role==='employee'&&!o.assignedTo?`<button class="act-btn act-process" onclick="claimOrder('${o.id}')" style="font-size:10px">＋ Claim</button>`:''}
                  ${role==='admin'?assignDropdown(o.id,o.assignedTo):''}
                  ${emp?`<span style="font-size:11px;color:${emp.color};font-weight:600">● ${emp.name}</span>`:''}
                </div>
              </div>
              <div class="dr-actions">
                ${o.label?`<button class="act-btn" style="background:var(--gold-light);color:var(--gold)" onclick="alert('Opening label: ${o.label}')">🖨 Print Label</button>`:''}
                ${o.status==='pending'?`<button class="act-btn act-process" onclick="markProcessed('${o.id}')">✓ Processed</button>`:''}
                ${o.status==='processed'?`<button class="act-btn act-pickup" onclick="markPickedUp('${o.id}')">🚚 Picked Up</button>`:''}
                ${o.status==='picked_up'?`<button class="act-btn act-done">✓ Done</button>`:''}
                <span class="tag ${o.status==='picked_up'?'tg':o.status==='processed'?'tb':'to'}">${o.status.replace('_',' ')}</span>
              </div>
            </div>`;}).join('')}
        </div>
      </div>`;}).join('');
  }

  return `
  <div class="pg-head"><div class="pg-title">Today's Orders</div><div class="pg-sub">All outbound orders across all customers — manage and notify from here</div></div>
  <div class="stats" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat"><div class="stat-lbl">Total Orders Today</div><div class="stat-val">${ORDERS.filter(o=>o.date===today).length}</div><span class="tag tb">All customers</span></div>
    <div class="stat"><div class="stat-lbl">Pending</div><div class="stat-val">${ORDERS.filter(o=>o.status==='pending').length}</div><span class="tag to">Need action</span></div>
    <div class="stat"><div class="stat-lbl">Processed</div><div class="stat-val">${ORDERS.filter(o=>o.status==='processed').length}</div><span class="tag tb">Ready</span></div>
    <div class="stat"><div class="stat-lbl">Completed</div><div class="stat-val">${ORDERS.filter(o=>o.status==='picked_up').length}</div><span class="tag tg">Done</span></div>
  </div>
  <div class="dispatch-date-tabs">
    ${dates.map(d=>`<div class="dtab ${d.val===today?'on':''}" onclick="switchDispatchDate('${d.val}',this)">${d.label}</div>`).join('')}
  </div>
  <div id="dispatchContent">${renderDispatch(today)}</div>
  ${!ORDERS.filter(o=>o.date===today).length?'<div style="text-align:center;padding:48px;color:var(--ink3)"><div style="font-size:36px;margin-bottom:12px">📭</div><div style="font-weight:600">No orders scheduled for today</div></div>':''}`;
}

function switchDispatchDate(dateVal,btn){
  document.querySelectorAll('.dtab').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  const today=new Date().toISOString().split('T')[0];
  const slots=['9am','11am','1pm','3pm'];
  const dayOrders=ORDERS.filter(o=>o.date===dateVal||(dateVal===today&&!o.date));
  const content=document.getElementById('dispatchContent');
  const typeLabels={pallet_out:'🚚 Pallet Pickup',pickpack:'📦 Pick & Pack',fbm:'📦 Pick & Pack',fba:'🏭 FBA Prep',marketplace:'📦 Pick & Pack'};
  content.innerHTML=slots.map(slot=>{
    const slotOrders=dayOrders.filter(o=>o.time===slot);
    if(!slotOrders.length)return '';
    return `<div class="slot-group">
      <div class="slot-head"><span>🕐 ${slot}</span><span style="font-size:13px;opacity:0.6">${slotOrders.length} order${slotOrders.length>1?'s':''}</span></div>
      <div class="slot-body">
        ${slotOrders.map(o=>{
          const emp=empById(o.assignedTo);
          const cust=CUSTOMERS.find(c=>c.id===o.custId)||CUSTOMERS[0];
          return `<div class="dispatch-row" id="dr-${o.id}" style="border-left:4px solid ${emp?emp.color:'var(--border2)'};background:${emp?emp.colorBg:'var(--surface)'}">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px">
                <div class="dr-customer">${o.customer}</div>
                ${emp?empAvatar(emp,22):`<span style="font-size:10px;color:var(--orange);font-weight:700;background:var(--orange-bg);padding:2px 7px;border-radius:4px">⚠ Unassigned</span>`}
              </div>
              <div class="dr-id">${o.id} · ${typeLabels[o.type]||o.type}</div>
              <div class="dr-desc">${o.pallets.length?o.pallets.map(p=>`Pallet ${p.num} · ${p.loc}`).join(', '):''}${o.channel?' · '+o.channel:''}${o.notes?' · '+o.notes:''}</div>
              <div style="display:flex;align-items:center;gap:10px;margin-top:5px;flex-wrap:wrap">
                <span style="font-size:11px;color:var(--red);font-weight:700">💰 ${fmt(o.autoCharge.amt)}</span>
                ${role==='employee'&&!o.assignedTo?`<button class="act-btn act-process" onclick="claimOrder('${o.id}')" style="font-size:10px">＋ Claim</button>`:''}
                ${role==='admin'?assignDropdown(o.id,o.assignedTo):''}
                ${emp?`<span style="font-size:11px;color:${emp.color};font-weight:600">● ${emp.name}</span>`:''}
              </div>
            </div>
            <div class="dr-actions">
              ${o.label?`<button class="act-btn" style="background:var(--gold-light);color:var(--gold)">🖨 Print Label</button>`:''}
              ${o.status==='pending'?`<button class="act-btn act-process" onclick="markProcessed('${o.id}')">✓ Processed</button>`:''}
              ${o.status==='processed'?`<button class="act-btn act-pickup" onclick="markPickedUp('${o.id}')">🚚 Picked Up</button>`:''}
              ${o.status==='picked_up'?`<button class="act-btn act-done">✓ Done</button>`:''}
              <span class="tag ${o.status==='picked_up'?'tg':o.status==='processed'?'tb':'to'}">${o.status.replace('_',' ')}</span>
            </div>
          </div>`;}).join('')}
      </div>
    </div>`;}).join('')||'<div style="padding:32px;text-align:center;color:var(--ink3)">No orders for this date</div>';
}

function markProcessed(orderId){
  const o=ORDERS.find(x=>x.id===orderId);
  if(!o)return;
  o.status='processed';
  openNotifyModal(orderId,'processed');
}
function markPickedUp(orderId){
  const o=ORDERS.find(x=>x.id===orderId);
  if(!o)return;
  o.status='picked_up';
  // Stop timer and log performance
  const mins=stopTimer(orderId);
  if(o.assignedTo){
    const c=ORDER_COMPLEXITY[o.type]||{pts:1,benchmark:10,label:'Order'};
    const actualMins=mins||Math.round(c.benchmark*0.9); // fallback if timer not running
    PERF_LOG.push({
      orderId,empId:o.assignedTo,type:o.type,
      pts:orderPts(o),benchmarkMins:c.benchmark,actualMins,
      date:new Date().toISOString().split('T')[0],customer:o.customer
    });
    const emp=empById(o.assignedTo);
    const onTime=actualMins<=c.benchmark;
    showToast(`${onTime?'✅':'⚠'} ${o.id} done in ${actualMins}m — ${onTime?'On time!':'Over the '+c.benchmark+'m benchmark'}`);
  }
  // Auto-add charge to invoice
  const inv=INVOICES.find(i=>i.status==='due');
  if(inv)inv.lines.push({desc:o.autoCharge.desc,qty:o.autoCharge.qty,rate:o.autoCharge.rate,amt:o.autoCharge.amt});
  openNotifyModal(orderId,'picked_up');
}

// ── NOTIFY MODAL ──
let _notifyOrderId=null;
let _notifyChannels=new Set(['portal','email','sms','whatsapp']);

function openNotifyModal(orderId, eventType){
  _notifyOrderId=orderId;
  const o=ORDERS.find(x=>x.id===orderId);
  const c=CUSTOMERS.find(x=>x.id===o?.custId)||CUSTOMERS[0];
  const msgs={
    processed:`Hi ${c.contact.split(' ')[0]}, your order ${orderId} has been processed and is ready for pickup at your ${o.time} slot on ${o.date}. — ShiplyCo Fulfillment`,
    picked_up:`Hi ${c.contact.split(' ')[0]}, your order ${orderId} has been picked up by the carrier and is on its way! — ShiplyCo Fulfillment`,
  };
  document.getElementById('notifySubtitle').textContent=`${orderId} · ${eventType==='processed'?'Order Processed':'Picked Up by Carrier'}`;
  document.getElementById('notifyMessage').value=msgs[eventType]||'';
  document.getElementById('notifyContact').textContent=`${c.email} · ${c.phone}${c.whatsapp?' · WhatsApp: '+c.whatsapp:''}`;
  // Reset channel buttons
  _notifyChannels=new Set(['portal','email','sms','whatsapp']);
  ['portal','email','sms','whatsapp'].forEach(ch=>{
    const el=document.getElementById('nch-'+ch);
    if(el){el.classList.add('sel');}
  });
  document.getElementById('notifyModal').classList.add('open');
}
function closeNotifyModal(){document.getElementById('notifyModal').classList.remove('open');showPage('dispatch');}
function sendNotification(){
  const o=ORDERS.find(x=>x.id===_notifyOrderId);
  const channels=[..._notifyChannels];
  const chLabels={portal:'🔔 portal',email:'📧 email',sms:'💬 SMS',whatsapp:'💚 WhatsApp'};
  const chStr=channels.map(c=>chLabels[c]).join(', ');
  if(channels.includes('portal')){
    pushNotif(document.getElementById('notifyMessage').value);
  }
  document.getElementById('notifyModal').classList.remove('open');
  showToast(`✓ ${_notifyOrderId} — Customer notified via ${chStr}${o&&o.status==='picked_up'?' · charge auto-added to invoice':''}`);
  showPage('dispatch');
}


// ── INLINE CONFIRM (replaces browser confirm()) ──
let _pendingConfirm=null;
function confirmAction(msg, onConfirm){
  // Remove existing confirm toast if any
  const existing=document.getElementById('confirmToast');
  if(existing)existing.remove();
  const el=document.createElement('div');
  el.id='confirmToast';
  el.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;padding:14px 20px;border-radius:10px;font-size:13px;font-weight:600;z-index:99999;display:flex;align-items:center;gap:12px;box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:slideUp 0.2s ease';
  el.innerHTML=`<span>${msg}</span><button onclick="document.getElementById('confirmToast').remove();_pendingConfirm&&_pendingConfirm();" style="background:var(--red);color:#fff;border:none;border-radius:6px;padding:6px 14px;font-family:Barlow,sans-serif;font-size:12px;font-weight:800;cursor:pointer">Confirm</button><button onclick="document.getElementById('confirmToast').remove();" style="background:rgba(255,255,255,0.15);color:#fff;border:none;border-radius:6px;padding:6px 14px;font-family:Barlow,sans-serif;font-size:12px;font-weight:600;cursor:pointer">Cancel</button>`;
  _pendingConfirm=onConfirm;
  document.body.appendChild(el);
  setTimeout(()=>{const e=document.getElementById('confirmToast');if(e)e.remove();},8000);
}

function showToast(msg){
  let t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');t.setAttribute('aria-atomic','true');t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600;z-index:999;box-shadow:0 8px 32px rgba(0,0,0,0.3)';document.body.appendChild(t)}
  t.textContent=msg;t.style.opacity='1';
  setTimeout(()=>{t.style.opacity='0'},3500);
}

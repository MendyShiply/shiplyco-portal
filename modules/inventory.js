// ── INVENTORY & SCAN PAGE ──
// ── INVENTORY DATA ──
let INVENTORY=[]; // loaded from Supabase
let _sbPallets=[]; // pallets from Supabase
let _sbTrucks=[]; // trucks from Supabase
let _invLoaded=false;

// ── INVENTORY HELPERS ──
function invUnits(loc){
  const looseFull = loc.cp - loc.loosePicked; // units remaining in open case
  const closedUnits = loc.fullCases * loc.cp;
  return loc.openCase ? closedUnits + looseFull : closedUnits;
}
function invDisplay(loc){
  if(!loc.openCase) return `${loc.fullCases} cases × ${loc.cp} = <strong>${invUnits(loc).toLocaleString()} units</strong>`;
  const looseLeft = loc.cp - loc.loosePicked;
  return `${loc.fullCases} full cases + <span class="tag to" style="font-size:11px">${looseLeft} loose</span> = <strong>${invUnits(loc).toLocaleString()} units</strong>`;
}

// ── PICK PRIORITY ENGINE ──
// Priority: 1) open case first, 2) lowest total units, 3) oldest received (FIFO)
function getPickPriority(skuOrDesc, custId){
  const matches = INVENTORY.filter(l => (l.sku === skuOrDesc || l.desc.includes(skuOrDesc)) && l.custId === custId && invUnits(l) > 0);
  if(!matches.length) return null;
  matches.sort((a,b)=>{
    // Open case always first
    if(a.openCase && !b.openCase) return -1;
    if(!a.openCase && b.openCase) return 1;
    // Then lowest qty
    const diff = invUnits(a) - invUnits(b);
    if(diff !== 0) return diff;
    // Then oldest received
    return new Date(a.receivedDate) - new Date(b.receivedDate);
  });
  return matches[0];
}

// ── ACTIVE PICK SESSION ──
let activePick = null; // {locId, orderId, unitsPicked, targetQty}

function pgInventory(){
  if(!_invLoaded){
    loadInventory().then(()=>showPage('inventory'));
    return '<div style="padding:40px;text-align:center;color:var(--ink3)">Loading inventory…</div>';
  }

  const totalPallets = _sbPallets.length;
  const totalUnits = _sbPallets.reduce((s,p)=>{
    return s + (p.items||[]).reduce((is,it)=>is+(parseInt(it.totalUnits)||0)+(parseInt(it.looseQty)||0),0);
  },0);

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div class="pg-title">Inventory</div>
      <div class="pg-sub" id="invSubtitle">${totalPallets} pallets · ${totalUnits.toLocaleString()} units</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="loadInventory().then(()=>showPage('inventory'))">↻ Refresh</button>
      <button class="btn" onclick="toggleColPicker()">⚙ Columns</button>
      <button class="btn btn-red" onclick="exportInvCSV()">⬇ Export CSV</button>
    </div>
  </div>

  <div class="stats" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">
    <div class="stat"><div class="stat-lbl">Pallets</div><div class="stat-val">${totalPallets}</div></div>
    <div class="stat"><div class="stat-lbl">Total Units</div><div class="stat-val">${totalUnits.toLocaleString()}</div><span class="tag tg">In stock</span></div>
    ${role!=='customer'?'<div class="stat"><div class="stat-lbl">Customers</div><div class="stat-val">'+CUSTOMERS.length+'</div></div>':''}

  </div>

  <!-- Column picker — slide-down panel -->
  <div id="colPicker" style="display:none;margin-bottom:12px">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:18px 20px;box-shadow:var(--shadow)">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--ink3);margin-bottom:12px">Show / Hide Columns</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">
        ${_invCols.map(c=>`
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:7px 10px;border:1px solid ${c.visible?'var(--red)':'var(--border)'};border-radius:7px;background:${c.visible?'var(--red-light)':'var(--surface2)'};transition:all 0.15s">
            <input type="checkbox" ${c.visible?'checked':''} onchange="toggleCol('${c.key}',this.checked)" style="accent-color:var(--red);width:14px;height:14px"/>
            <span style="font-size:12px;font-weight:600;color:${c.visible?'var(--red)':'var(--ink3)'}">${c.label}</span>
          </label>
        `).join('')}
      </div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button class="btn" onclick="_invCols.forEach(c=>c.visible=true);renderInvTable();toggleColPicker()" style="font-size:12px">Show All</button>
        <button class="btn" onclick="_invCols.forEach(c=>c.visible=false);_invCols[0].visible=true;_invCols[1].visible=true;renderInvTable();toggleColPicker()" style="font-size:12px">Reset</button>
      </div>
    </div>
  </div>

  <!-- SKU Summary -->
  <div id="invSkuSummary"></div>

  <!-- Main table — sticky header via wrapper height + overflow -->
  <div class="card" style="overflow:hidden;padding:0">
    <div style="overflow-x:auto;overflow-y:auto;max-height:68vh;position:relative" id="invTableWrap">
      <table id="invMainTable" style="min-width:800px;border-collapse:collapse;width:100%">
        <thead style="position:sticky;top:0;z-index:10">
          <tr id="invSortRow" style="background:var(--surface2)"></tr>
          <tr id="invFilterRow" style="background:var(--bg)"></tr>
        </thead>
        <tbody id="invTable">
          <tr><td colspan="${_invCols.filter(c=>c.visible).length}" style="text-align:center;padding:40px;color:var(--ink3)">Loading…</td></tr>
        </tbody>
      </table>
    </div>
    <div id="invTableFooter" style="padding:10px 16px;border-top:1px solid var(--border);font-size:12px;color:var(--ink3);display:flex;justify-content:space-between;background:var(--surface2)"></div>
  </div>

  ${role==='customer'?`
  <!-- Floating disposal action bar -->
  <div id="disposeBar" style="display:none;position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:13px 20px;border-radius:12px;box-shadow:0 6px 28px rgba(0,0,0,0.35);z-index:500;align-items:center;gap:16px;white-space:nowrap">
    <span id="disposeBarCount" style="font-weight:700;font-size:13px"></span>
    <button onclick="openDisposeModal()" style="background:var(--red);color:#fff;border:none;padding:8px 18px;border-radius:8px;cursor:pointer;font-family:Barlow,sans-serif;font-weight:700;font-size:13px">🗑 Request Disposal</button>
    <button onclick="_disposeSelected.clear();updateDisposeBar();renderInvTable()" style="background:transparent;color:#aaa;border:1px solid #444;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:Barlow,sans-serif;font-size:12px">Cancel</button>
  </div>`:''}`;
}


function renderInvRows(pallets){
  if(!pallets.length) return '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--ink3)">No inventory found</td></tr>';
  return pallets.map(p=>{
    const items = p.items||[];
    const totalUnits = items.reduce((s,it)=>s+(parseInt(it.totalUnits)||0)+(parseInt(it.looseQty)||0),0);
    const firstItem = items[0]||{};
    const desc = firstItem.desc || firstItem.cartonDesc || '—';
    const sku = firstItem.sku || firstItem.upc || '—';
    const multiItem = items.length > 1 ? ` <span style="font-size:10px;color:var(--ink3)">(+${items.length-1} more)</span>` : '';
    // Find customer via truck
    const truck = _sbTrucks.find(t=>t.id===p.truck_id);
    const custId = p.cust_id || truck?.cust_id;
    const cust = CUSTOMERS.find(c=>c.id===custId);
    const custName = cust?.name || custId || '—';
    const truckName = truck?.name || p.truck_id || '—';
    const receivedDate = p.received_date ? new Date(p.received_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';

    return `<tr style="cursor:pointer" onclick="showPalletDetail('${p.id}')">
      <td><span style="font-family:monospace;font-weight:800;font-size:13px;color:var(--red)">${p.location||'—'}</span></td>
      <td><span style="font-family:monospace;font-size:12px">PLT-${String(p.pallet_num).padStart(3,'0')}</span></td>
      ${role!=='customer'?`<td style="font-size:12px;font-weight:600">${custName}</td>`:''}
      <td>
        <div style="font-size:13px;font-weight:600;max-width:260px;line-height:1.3">${desc}${multiItem}</div>
        <div style="font-size:11px;color:var(--ink3);margin-top:2px">SKU: ${sku}</div>
      </td>
      <td style="font-weight:700">${totalUnits.toLocaleString()}</td>
      <td style="font-size:12px;color:var(--ink3)">${receivedDate}</td>
      <td style="font-size:12px;color:var(--ink3)">${truckName}</td>
      ${role!=='customer'?`<td><button class="btn" onclick="event.stopPropagation();showPalletDetail('${p.id}')">View</button></td>`:''}
    </tr>`;
  }).join('');
}

function filterInvTable(q){
  q = q.toLowerCase();
  const rows = document.querySelectorAll('#invTable tr');
  rows.forEach(row=>{
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

async function loadInventory(){
  try{
    let palletsQ = sb.from('pallets').select('*').order('pallet_num').range(0, 4999);
    if(role==='customer' && currentCustId) palletsQ = palletsQ.eq('cust_id', currentCustId);
    const [palletsRes, trucksRes] = await Promise.all([
      palletsQ,
      sb.from('trucks').select('*').order('date')
    ]);
    if(palletsRes.error) throw palletsRes.error;
    _sbPallets = palletsRes.data||[];
    _sbTrucks = trucksRes.data||[];
    _invLoaded = true;
    setTimeout(renderInvTable, 50);
  }catch(e){
    showToast('Error loading inventory: '+e.message);
    _invLoaded = true;
  }
}

function showPalletDetail(palletId){
  const p = _sbPallets.find(x=>String(x.id)===String(palletId));
  if(!p){ showToast('Pallet not found'); return; }
  const items = p.items||[];
  const cust = CUSTOMERS.find(c=>c.id===p.cust_id);
  const modal = document.getElementById('palletDetailModal');
  const body = document.getElementById('palletDetailBody');
  if(!modal||!body) return;
  document.getElementById('palletDetailTitle').textContent = 'Pallet '+p.pallet_num+' — '+p.location;
  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
      <div><div style="font-size:10px;color:var(--ink3);text-transform:uppercase;font-weight:700">Customer</div><div style="font-weight:700">${cust?.name||p.cust_id||'—'}</div></div>
      <div><div style="font-size:10px;color:var(--ink3);text-transform:uppercase;font-weight:700">Location</div><div style="font-weight:700;color:var(--red)">${p.location}</div></div>
      <div><div style="font-size:10px;color:var(--ink3);text-transform:uppercase;font-weight:700">Received</div><div style="font-weight:700">${p.received_date||'—'}</div></div>
    </div>
    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);margin-bottom:8px">${items.length} Item${items.length!==1?'s':''}</div>
    ${items.map((it,i)=>`
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px">
        <div style="font-weight:700;margin-bottom:4px">${it.desc||it.cartonDesc||'Unknown item'}</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:12px;color:var(--ink3)">
          ${it.upc?`<span>UPC: ${it.upc}</span>`:''}
          ${it.sku?`<span>SKU: ${it.sku}</span>`:''}
          ${it.color?`<span>Color: ${it.color}</span>`:''}
          ${it.size?`<span>Size: ${it.size}</span>`:''}
          ${it.caseCount?`<span>Cases: ${it.caseCount}</span>`:''}
          ${it.casepack?`<span>Casepack: ${it.casepack}</span>`:''}
          ${it.totalUnits?`<span style="font-weight:700;color:var(--ink)">Units: ${it.totalUnits}</span>`:''}
          ${it.looseQty&&it.looseQty!=='0'?`<span style="color:var(--orange);font-weight:700">+${it.looseQty} loose</span>`:''}
          ${it.retail?`<span style="color:var(--green);font-weight:700">Retail: ${it.retail}</span>`:''}
        </div>
        ${it.notes?`<div style="font-size:11px;color:var(--ink3);margin-top:6px;font-style:italic">${it.notes}</div>`:''}
      </div>
    `).join('')}
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);margin-bottom:8px">Documents & Photos</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" onclick="uploadPalletFile('${p.id}','bol')">📄 Upload BOL</button>
        <button class="btn" onclick="uploadPalletFile('${p.id}','receipt')">🧾 Upload Receipt</button>
        <button class="btn" onclick="uploadPalletFile('${p.id}','photo')">📷 Add Photo</button>
      </div>
      ${p.bol_url?`<div style="margin-top:8px"><a href="${p.bol_url}" target="_blank" style="color:var(--blue);font-size:13px">📄 View BOL</a></div>`:''}
      ${p.receipt_url?`<div style="margin-top:4px"><a href="${p.receipt_url}" target="_blank" style="color:var(--blue);font-size:13px">🧾 View Receipt</a></div>`:''}
    </div>`;
  modal.style.display='flex';
}

function uploadPalletFile(palletId, type){
  const input = document.createElement('input');
  input.type='file';
  input.accept = type==='photo' ? 'image/*' : '.pdf,image/*';
  input.onchange = async()=>{
    const file = input.files[0];
    if(!file) return;
    showToast('Uploading…');
    try{
      const path = palletId+'/'+type+'_'+Date.now()+'_'+file.name;
      const {data, error} = await sb.storage.from('pallet-files').upload(path, file, {upsert:true});
      if(error) throw error;
      const {data:urlData} = sb.storage.from('pallet-files').getPublicUrl(path);
      const url = urlData.publicUrl;
      const update = type==='bol' ? {bol_url:url} : type==='receipt' ? {receipt_url:url} : null;
      if(update){
        await sb.from('pallets').update(update).eq('id',palletId);
        const p = _sbPallets.find(x=>x.id===palletId);
        if(p) Object.assign(p, update);
      }
      showToast('Uploaded successfully');
      showPalletDetail(palletId);
    }catch(e){ showToast('Upload error: '+e.message); }
  };
  input.click();
}


function filterInv(q){
  document.querySelectorAll('.inv-row-tr').forEach(r=>{r.style.display=q&&!r.textContent.toLowerCase().includes(q.toLowerCase())?'none':''});
}

function scanLocation(loc){
  if(!loc.trim())return;
  const found=INVENTORY.find(l=>l.id.toLowerCase()===loc.trim().toLowerCase());
  const el=document.getElementById('scanResult');
  if(!el)return;
  if(!found){
    el.innerHTML=`<div style="background:var(--red-light);border:1px solid #f5c5c2;border-radius:8px;padding:14px 16px;color:var(--red);font-weight:600">❌ Location "${loc}" not found in system</div>`;
    return;
  }
  const units=invUnits(found);
  const looseLeft = found.openCase ? found.cp - found.loosePicked : 0;
  el.innerHTML=`
  <div style="background:var(--surface);border:2px solid ${found.openCase?'var(--orange)':'var(--green)'};border-radius:10px;padding:16px 20px;box-shadow:var(--shadow)">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:800;color:var(--red);letter-spacing:1px">${found.id}</div>
        <div style="font-size:12px;color:var(--ink3)">PLT-${String(found.palletNum).padStart(3,'0')} · ${found.customer}</div>
      </div>
      <span class="tag ${found.openCase?'to':'tg'}" style="font-size:13px;padding:5px 12px">${found.openCase?'⚠ Open Case':'✓ Closed Pallet'}</span>
    </div>
    <div style="font-size:15px;font-weight:700;margin-bottom:4px">${found.desc}</div>
    <div style="font-size:13px;color:var(--ink2);margin-bottom:8px">SKU: ${found.sku||'—'} · Received ${found.received}</div>
    <div style="background:var(--bg);border-radius:7px;padding:10px 14px;margin-bottom:14px;font-size:13px">
      <div style="display:flex;gap:24px;flex-wrap:wrap">
        <div><span style="color:var(--ink3);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;display:block">Full Cases</span><strong style="font-size:18px">${found.fullCases}</strong> <span style="color:var(--ink3)">× ${found.cp}/cs</span></div>
        ${found.openCase?`<div><span style="color:var(--orange);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;display:block">Open Case — Loose Units</span><strong style="font-size:18px;color:var(--orange)">${looseLeft}</strong> <span style="color:var(--ink3)">of ${found.cp} remaining</span></div>`:''}
        <div><span style="color:var(--ink3);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;display:block">Total Units</span><strong style="font-size:18px;color:var(--green)">${units.toLocaleString()}</strong></div>
      </div>
    </div>
    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);margin-bottom:10px">What do you want to do?</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="scanAction('view','${found.id}')">👁 View / Verify</button>
      <button class="btn btn-red" onclick="openPickSession('${found.id}',1,null)">📤 Pick from Here</button>
      <button class="btn" style="background:var(--blue-bg);color:var(--blue);border-color:var(--blue)" onclick="scanAction('receive','${found.id}')">📥 Receive Into Here</button>
      ${!found.openCase?`<button class="btn" style="background:var(--orange-bg);color:var(--orange);border-color:var(--orange)" onclick="markCaseOpen('${found.id}')">📂 Mark Case Open</button>`:`<button class="btn" style="background:var(--orange-bg);color:var(--orange);border-color:var(--orange)" onclick="closeCaseAction('${found.id}')">📦 Close Case</button>`}
    </div>
    <div id="scanActionResult" style="margin-top:14px"></div>
  </div>`;
}

function scanAction(action,locId){
  const el=document.getElementById('scanActionResult');
  if(!el)return;
  const loc=INVENTORY.find(l=>l.id===locId);
  if(action==='view'){
    el.innerHTML=`<div style="background:var(--green-bg);border-radius:7px;padding:12px 14px;font-size:13px;color:var(--green);font-weight:600">✓ Contents verified — ${loc?loc.desc:locId} at ${new Date().toLocaleTimeString()}</div>`;
  } else if(action==='receive'){
    el.innerHTML=`<div style="background:var(--blue-bg);border-radius:7px;padding:14px 16px">
      <div style="font-weight:700;color:var(--blue);margin-bottom:8px">📥 Receiving into ${locId}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input type="text" placeholder="Pallet # or scan pallet barcode" style="padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;flex:1;min-width:160px"/>
        <button class="btn" style="background:var(--blue);color:#fff;border-color:var(--blue)" onclick="showToast('📥 Pallet assigned to ${locId} — inventory updated')">Confirm Receive</button>
      </div>
    </div>`;
  }
}

function markCaseOpen(locId){
  const loc=INVENTORY.find(l=>l.id===locId);
  if(!loc)return;
  loc.openCase=true;loc.loosePicked=0;
  showToast(`📂 Case marked open at ${locId} — tracking ${loc.cp} loose units`);
  scanLocation(locId);
}
function closeCaseAction(locId){
  const loc=INVENTORY.find(l=>l.id===locId);
  if(!loc)return;
  if(loc.loosePicked>0){
    const looseLeft=loc.cp-loc.loosePicked;
    if(looseLeft<=0){loc.openCase=false;loc.fullCases=Math.max(0,loc.fullCases);loc.loosePicked=0;showToast(`✓ Open case fully depleted at ${locId}`);}
    else{loc.openCase=false;loc.loosePicked=0;showToast(`📦 Open case closed at ${locId} — ${looseLeft} remaining units added to closed count`);}
  } else {loc.openCase=false;loc.loosePicked=0;showToast(`📦 Case closed at ${locId}`);}
  scanLocation(locId);
}

// ── PER-EACH PICK SESSION ──
function openPickSession(locId, targetQty, orderId){
  const loc=INVENTORY.find(l=>l.id===locId);
  if(!loc)return;
  activePick={locId,targetQty:targetQty||1,orderId,unitsPicked:0};
  const units=invUnits(loc);
  const looseLeft=loc.openCase?loc.cp-loc.loosePicked:null;
  const el=document.getElementById('scanActionResult');
  const elInv=document.getElementById('scanResult');
  const target=el||elInv;
  if(!target)return;
  target.innerHTML=`
  <div style="background:var(--surface);border:2px solid var(--red);border-radius:10px;padding:16px 20px;margin-top:8px">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;text-transform:uppercase;margin-bottom:4px">📤 Pick Session — ${locId}</div>
    <div style="font-size:13px;color:var(--ink2);margin-bottom:12px">${loc.desc}${orderId?' · Order '+orderId:''}</div>
    ${loc.openCase?`<div style="background:var(--orange-bg);border-radius:7px;padding:10px 14px;font-size:13px;margin-bottom:12px">⚠ Open Case Active — <strong>${looseLeft} loose units remaining</strong> · Scan each unit individually</div>`:''}
    <div style="background:var(--bg);border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
        <div style="text-align:center">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3)">Available</div>
          <div style="font-size:32px;font-weight:800">${units}</div>
        </div>
        <div style="font-size:28px;color:var(--ink3)">→</div>
        <div style="text-align:center">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3)">Units Picked</div>
          <div style="font-size:32px;font-weight:800;color:var(--green)" id="pickCount">0</div>
        </div>
        ${targetQty?`<div style="font-size:28px;color:var(--ink3)">/</div>
        <div style="text-align:center">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3)">Target</div>
          <div style="font-size:32px;font-weight:800;color:var(--blue)">${targetQty}</div>
        </div>`:''}
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-red" style="padding:14px 28px;font-size:15px;font-weight:800" onclick="scanEach('${locId}')">📷 SCAN EACH UNIT</button>
      <button class="btn" onclick="finishPick('${locId}')">✓ Done Picking</button>
      <button class="btn" onclick="activePick=null;showPage('inventory')">Cancel</button>
    </div>
    <div id="pickLog" style="margin-top:12px;font-size:12px;color:var(--ink3)"></div>
  </div>`;
}

function scanEach(locId){
  if(!activePick)return;
  const loc=INVENTORY.find(l=>l.id===locId);
  if(!loc)return;
  const available=invUnits(loc);
  if(available<=0){showToast('⚠ No units left at this location');return;}
  // Decrement: open case loose units first, then full cases
  if(loc.openCase){
    const looseLeft=loc.cp-loc.loosePicked;
    if(looseLeft>0){
      loc.loosePicked++;
      if(loc.loosePicked>=loc.cp){loc.openCase=false;loc.loosePicked=0;} // case exhausted
    }
  } else {
    // Breaking into a new case
    if(loc.fullCases>0){loc.fullCases--;loc.openCase=true;loc.loosePicked=1;}
  }
  activePick.unitsPicked++;
  const countEl=document.getElementById('pickCount');
  if(countEl)countEl.textContent=activePick.unitsPicked;
  const log=document.getElementById('pickLog');
  if(log)log.innerHTML=`<span style="color:var(--green);font-weight:600">✓ ${activePick.unitsPicked} unit${activePick.unitsPicked!==1?'s':''} scanned out</span> — ${invUnits(loc)} units remaining at ${locId}`;
  if(activePick.targetQty&&activePick.unitsPicked>=activePick.targetQty){
    showToast(`✓ Target reached — ${activePick.unitsPicked} units picked from ${locId}`);
    finishPick(locId);
  }
}

function finishPick(locId){
  const n=activePick?.unitsPicked||0;
  const loc=INVENTORY.find(l=>l.id===locId);
  if(n>0&&loc)showToast(`✓ Pick complete — ${n} unit${n!==1?'s':''} removed from ${locId} · ${invUnits(loc)} remaining`);
  activePick=null;
  showPage('inventory');
}

// ── DISPOSAL REQUEST SYSTEM ──

function toggleDisposeRow(palletId){
  const pid=String(palletId);
  if(_disposeSelected.has(pid)) _disposeSelected.delete(pid);
  else _disposeSelected.add(pid);
  updateDisposeBar();
  // Refresh just the tbody so filters/headers stay intact
  if(typeof _renderInvBody==='function') _renderInvBody();
  else renderInvTable();
}

function toggleDisposeAll(checked){
  if(checked){
    _sbPallets
      .filter(p=>!currentCustId||String(p.cust_id)===String(currentCustId))
      .forEach(p=>_disposeSelected.add(String(p.id)));
  } else {
    _disposeSelected.clear();
  }
  updateDisposeBar();
  if(typeof _renderInvBody==='function') _renderInvBody();
  else renderInvTable();
}

function updateDisposeBar(){
  const bar=document.getElementById('disposeBar');
  if(!bar) return;
  const n=_disposeSelected.size;
  if(n===0){ bar.style.display='none'; return; }
  bar.style.display='flex';
  document.getElementById('disposeBarCount').textContent=n+' pallet'+(n!==1?'s':'')+' selected';
  // Sync select-all checkbox
  const allBox=document.getElementById('invDisposeAll');
  if(allBox){
    const customerPallets=_sbPallets.filter(p=>!currentCustId||String(p.cust_id)===String(currentCustId));
    allBox.checked=customerPallets.length>0&&customerPallets.every(p=>_disposeSelected.has(String(p.id)));
    allBox.indeterminate=n>0&&!allBox.checked;
  }
}

function openDisposeModal(){
  if(!_disposeSelected.size){ showToast('Select at least one pallet first'); return; }
  const pallets=_sbPallets.filter(p=>_disposeSelected.has(String(p.id)));
  const n=pallets.length;
  const total=n*RATES.disposal_pallet;

  const listHtml=pallets.map(p=>{
    const items=p.items||[];
    const fi=items[0]||{};
    const desc=fi.desc||fi.cartonDesc||'—';
    const units=items.reduce((s,i)=>s+(parseInt(i.totalUnits)||0),0);
    return `<div style="padding:9px 0;border-bottom:1px solid var(--border2)">
      <span style="font-family:monospace;font-weight:800;color:var(--red)">PLT-${String(p.pallet_num).padStart(3,'0')}</span>
      <span style="color:var(--ink3);font-size:12px"> · ${p.location||'—'}</span>
      <div style="font-size:12px;color:var(--ink2);margin-top:2px">${desc}${items.length>1?' <span style="color:var(--ink3)">(+'+( items.length-1)+' more)</span>':''} · ${units.toLocaleString()} units</div>
    </div>`;
  }).join('');

  document.getElementById('disposePalletList').innerHTML=listHtml;
  document.getElementById('disposeConsentCheck').checked=false;
  document.getElementById('disposeModal').style.display='flex';
}

function closeDisposeModal(){
  document.getElementById('disposeModal').style.display='none';
}

async function submitDisposalRequest(){
  if(!document.getElementById('disposeConsentCheck').checked){
    showToast('You must agree to the terms before submitting'); return;
  }
  const btn=document.getElementById('disposeSubmitBtn');
  btn.disabled=true; btn.textContent='Submitting…';

  const pallets=_sbPallets.filter(p=>_disposeSelected.has(String(p.id)));
  const n=pallets.length;
  const total=n*RATES.disposal_pallet;
  const chargeLines=[{desc:`Disposal — ${n} pallet${n!==1?'s':''}`,qty:n,rate:RATES.disposal_pallet,amt:total}];

  const order={
    cust_id: currentCustId||(pallets[0]?.cust_id)||null,
    type: 'disposal',
    status: 'disposal_pending',
    pallets: pallets.map(p=>p.id),
    items: pallets.map(p=>({
      palletId:p.id,
      pallet_num:p.pallet_num,
      location:p.location,
      desc:(p.items||[])[0]?.desc||(p.items||[])[0]?.cartonDesc||'—'
    })),
    charge_lines: chargeLines,
    charge_total: total,
    consent_at: new Date().toISOString(),
    notes: `Customer-authorized disposal of ${n} pallet${n!==1?'s':''}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const {data,error}=await sb.from('orders').insert([order]).select().single();
  if(error){
    showToast('⚠ '+error.message);
    btn.disabled=false; btn.textContent='I Agree & Submit Disposal Request';
    return;
  }

  _disposeSelected.clear();
  updateDisposeBar();
  closeDisposeModal();
  showToast('✓ Disposal request submitted — ShiplyCo will confirm within 24 hours');
  setTimeout(()=>showPage('myorders'),1500);
}


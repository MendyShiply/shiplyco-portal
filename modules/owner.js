// ── OWNER PORTAL ──
// ShiplyCo's internal inventory — purchased goods, disposed items, items for sale
// Future SaaS note: OWNER_CUST_ID and portal entry become per-tenant config when sold to other 3PLs

let _ownerMode = false;
let _ownerPallets = [];
let _ownerTrucks  = [];
let _ownerOrders  = [];

function enterOwnerMode(){
  if(_ownerMode) return;
  _ownerMode = true;
  buildNav();
  document.getElementById('hRole').textContent = 'Owner Portal';
}

function exitOwnerMode(){
  _ownerMode = false;
  _invLoaded = false; // force admin inventory to reload fresh customer data
  buildNav();
  document.getElementById('hRole').textContent = 'Admin Portal';
  showPage('dashboard');
}

// ══════════════════════════════════════════════════════
// ── DASHBOARD ──
// ══════════════════════════════════════════════════════
function pgOwnerDash(){
  enterOwnerMode();

  setTimeout(async()=>{
    const wrap = document.getElementById('ownerDashWrap');
    if(!wrap) return;
    try{
      const [palletsRes, ordersRes, trucksRes] = await Promise.all([
        sb.from('pallets').select('*').eq('cust_id', OWNER_CUST_ID),
        sb.from('orders').select('*').eq('cust_id', OWNER_CUST_ID).order('created_at',{ascending:false}).limit(5),
        sb.from('trucks').select('*').eq('cust_id', OWNER_CUST_ID).order('date',{ascending:false}).limit(8)
      ]);
      _ownerPallets = palletsRes.data||[];
      _ownerOrders  = ordersRes.data||[];
      _ownerTrucks  = trucksRes.data||[];

      const totalUnits = _ownerPallets.reduce((s,p)=>
        s+(p.items||[]).reduce((is,it)=>is+(parseInt(it.totalUnits)||0),0), 0);
      const activeOrders  = _ownerOrders.filter(o=>o.status!=='picked_up'&&o.status!=='disposed');
      const disposedIn    = _ownerPallets.filter(p=>p.disposed_from_cust_id);

      wrap.innerHTML = `
      <div class="stats" style="grid-template-columns:repeat(4,1fr)">
        <div class="stat"><div class="stat-lbl">Owner Pallets</div><div class="stat-val">${_ownerPallets.length}</div><span class="tag tb">In warehouse</span></div>
        <div class="stat"><div class="stat-lbl">Total Units</div><div class="stat-val">${totalUnits.toLocaleString()}</div><span class="tag tg">Available</span></div>
        <div class="stat"><div class="stat-lbl">Active Orders</div><div class="stat-val">${activeOrders.length}</div><span class="tag to">Outbound</span></div>
        <div class="stat"><div class="stat-lbl">Disposed In</div><div class="stat-val">${disposedIn.length}</div><span class="tag tr">From customers</span></div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:4px">
        <div class="card" style="padding:22px;cursor:pointer;border-top:3px solid var(--red)" onclick="showPage('ownerinv')">
          <div style="font-size:26px;margin-bottom:8px">📦</div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;text-transform:uppercase;margin-bottom:4px">Inventory</div>
          <div style="font-size:13px;color:var(--ink3)">${_ownerPallets.length} pallets · ${totalUnits.toLocaleString()} units</div>
        </div>
        <div class="card" style="padding:22px;cursor:pointer;border-top:3px solid var(--blue)" onclick="showPage('ownerentry')">
          <div style="font-size:26px;margin-bottom:8px">🚛</div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;text-transform:uppercase;margin-bottom:4px">Receive Inbound</div>
          <div style="font-size:13px;color:var(--ink3)">Log purchases &amp; incoming shipments</div>
        </div>
        <div class="card" style="padding:22px;cursor:pointer;border-top:3px solid var(--green)" onclick="showPage('ownerorders')">
          <div style="font-size:26px;margin-bottom:8px">🚚</div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;text-transform:uppercase;margin-bottom:4px">Orders</div>
          <div style="font-size:13px;color:var(--ink3)">${activeOrders.length} active · Place new outbound orders</div>
        </div>
      </div>

      ${_ownerOrders.length?`
      <div style="margin-top:24px">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--ink3);margin-bottom:10px">Recent Orders</div>
        ${_ownerOrders.slice(0,4).map(o=>`
        <div class="card" style="padding:12px 18px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-weight:700;font-size:13px">${o.id} · ${(o.type||'').replace(/_/g,' ')}</div>
            <div style="font-size:12px;color:var(--ink3)">${o.date||new Date(o.created_at).toLocaleDateString()} ${o.notes?'· '+o.notes:''}</div>
          </div>
          <span class="tag ${o.status==='picked_up'?'tg':o.status==='processed'?'tb':'to'}">${(o.status||'pending').replace(/_/g,' ').toUpperCase()}</span>
        </div>`).join('')}
      </div>`:''}

      ${disposedIn.length?`
      <div style="margin-top:24px">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--ink3);margin-bottom:10px">Disposed Items Received from Customers</div>
        ${disposedIn.slice(0,5).map(p=>{
          const cust = CUSTOMERS.find(c=>c.id===p.disposed_from_cust_id);
          const fi   = (p.items||[])[0]||{};
          return `<div class="card" style="padding:12px 18px;margin-bottom:8px;display:flex;align-items:center;gap:14px">
            <div style="font-size:20px">🗑</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:13px">PLT-${String(p.pallet_num||'').padStart(3,'0')} · ${fi.desc||fi.cartonDesc||'—'}</div>
              <div style="font-size:12px;color:var(--ink3)">From: ${cust?.name||p.disposed_from_cust_id} · ${p.location||'Unassigned'} · ${p.disposed_at?new Date(p.disposed_at).toLocaleDateString():''}</div>
            </div>
            <span style="font-size:11px;color:var(--orange);font-weight:700;background:var(--orange-bg);padding:3px 8px;border-radius:4px;white-space:nowrap">Disposed In</span>
          </div>`;
        }).join('')}
        ${disposedIn.length>5?`<div style="text-align:center;padding:8px"><button class="btn" onclick="showPage('ownerinv')">View All ${disposedIn.length} →</button></div>`:''}
      </div>`:''}`;
    }catch(e){
      wrap.innerHTML = `<div style="color:var(--red);padding:20px">Error loading owner data: ${e.message}</div>`;
    }
  }, 100);

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--red);margin-bottom:4px">Owner Portal</div>
      <div class="pg-title">ShiplyCo Inventory</div>
      <div class="pg-sub">Company-owned goods — purchases, disposed items, and inventory for sale</div>
    </div>
    <button class="btn" onclick="exitOwnerMode()">← Back to Admin</button>
  </div>
  <div id="ownerDashWrap"><div style="padding:40px;text-align:center;color:var(--ink3)"><span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Loading…</div></div>`;
}


// ══════════════════════════════════════════════════════
// ── INVENTORY ──
// Loads owner pallets into the shared _sbPallets / _sbTrucks arrays
// so the existing renderInvTable grid just works.
// ══════════════════════════════════════════════════════
function pgOwnerInventory(){
  enterOwnerMode();

  setTimeout(async()=>{
    try{
      const [palletsRes, trucksRes] = await Promise.all([
        sb.from('pallets').select('*').eq('cust_id', OWNER_CUST_ID).order('pallet_num'),
        sb.from('trucks').select('*').eq('cust_id', OWNER_CUST_ID).order('date',{ascending:false})
      ]);
      _ownerPallets = palletsRes.data||[];
      _ownerTrucks  = trucksRes.data||[];
      _sbPallets    = _ownerPallets;
      _sbTrucks     = _ownerTrucks;
      _invLoaded    = true;
      renderInvTable();
      const totalUnits = _ownerPallets.reduce((s,p)=>
        s+(p.items||[]).reduce((is,it)=>is+(parseInt(it.totalUnits)||0),0), 0);
      const sub = document.getElementById('invSubtitle');
      if(sub) sub.textContent = _ownerPallets.length+' pallets · '+totalUnits.toLocaleString()+' units — ShiplyCo owner inventory';
    }catch(e){ showToast('Error loading owner inventory: '+e.message); }
  }, 100);

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--red);margin-bottom:4px">Owner Portal</div>
      <div class="pg-title">Owner Inventory</div>
      <div class="pg-sub" id="invSubtitle">Loading…</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="showPage('ownerentry')">+ Receive Inbound</button>
      <button class="btn" onclick="toggleColPicker()">⚙ Columns</button>
      <button class="btn btn-red" onclick="exportInvCSV()">⬇ Export CSV</button>
    </div>
  </div>

  <div id="colPicker" style="display:none;margin-bottom:12px">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:18px 20px;box-shadow:var(--shadow)">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--ink3);margin-bottom:12px">Show / Hide Columns</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">
        ${_invCols.map(c=>`
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:7px 10px;border:1px solid ${c.visible?'var(--red)':'var(--border)'};border-radius:7px;background:${c.visible?'var(--red-light)':'var(--surface2)'}">
            <input type="checkbox" ${c.visible?'checked':''} onchange="toggleCol('${c.key}',this.checked)" style="accent-color:var(--red);width:14px;height:14px"/>
            <span style="font-size:12px;font-weight:600;color:${c.visible?'var(--red)':'var(--ink3)'}">${c.label}</span>
          </label>`).join('')}
      </div>
    </div>
  </div>

  <div id="invSkuSummary"></div>
  <div class="card" style="overflow:hidden;padding:0">
    <div style="overflow-x:auto;overflow-y:auto;max-height:68vh;position:relative" id="invTableWrap">
      <table id="invMainTable" style="min-width:800px;border-collapse:collapse;width:100%">
        <thead style="position:sticky;top:0;z-index:10">
          <tr id="invSortRow" style="background:var(--surface2)"></tr>
          <tr id="invFilterRow" style="background:var(--bg)"></tr>
        </thead>
        <tbody id="invTable">
          <tr><td colspan="8" style="text-align:center;padding:40px;color:var(--ink3)">Loading owner inventory…</td></tr>
        </tbody>
      </table>
    </div>
    <div id="invTableFooter" style="padding:10px 16px;border-top:1px solid var(--border);font-size:12px;color:var(--ink3);display:flex;justify-content:space-between;background:var(--surface2)"></div>
  </div>`;
}


// ══════════════════════════════════════════════════════
// ── RECEIVING (INBOUND) ──
// ══════════════════════════════════════════════════════
function pgOwnerEntry(){
  enterOwnerMode();

  setTimeout(async()=>{
    const {data} = await sb.from('trucks').select('*').eq('cust_id', OWNER_CUST_ID).order('date',{ascending:false}).limit(20);
    _ownerTrucks = data||[];
    renderOwnerTrucks();
  }, 100);

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--red);margin-bottom:4px">Owner Portal</div>
      <div class="pg-title">Receive Inbound</div>
      <div class="pg-sub">Log purchases, transfers, and acquired inventory coming into the warehouse</div>
    </div>
    <button class="btn btn-red" onclick="openOwnerTruckModal()">+ Log Inbound Shipment</button>
  </div>

  <div id="ownerTruckWrap"><div style="padding:40px;text-align:center;color:var(--ink3)"><span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Loading…</div></div>

  <!-- Inbound Shipment Modal -->
  <div id="ownerTruckModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:8000;align-items:center;justify-content:center">
    <div style="background:var(--surface);border-radius:14px;width:90%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.25)">
      <div style="padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;text-transform:uppercase">Log Inbound Shipment</div>
        <button onclick="document.getElementById('ownerTruckModal').style.display='none'" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3)">×</button>
      </div>
      <div style="padding:20px 24px;display:flex;flex-direction:column;gap:12px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="field"><label>Shipment Name / Truck #</label><input type="text" id="ot_name" placeholder="e.g. Purchase #12, Truck #5"/></div>
          <div class="field"><label>Date Arrived</label><input type="date" id="ot_date"/></div>
        </div>
        <div class="field"><label>Source / Vendor</label>
          <input type="text" id="ot_vendor" placeholder="e.g. Walmart Liquidation, Local Auction, Customer Disposal"/>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="field"><label>Shipment Type</label>
            <select id="ot_type">
              <option value="purchase">Purchase / Buy</option>
              <option value="disposal_transfer">Customer Disposal Transfer</option>
              <option value="donation">Donation / Grant</option>
              <option value="return">Return / Exchange</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="field"><label>Est. Pallet Count</label><input type="number" id="ot_pallets" placeholder="0" min="0"/></div>
        </div>
        <div class="field"><label>Notes (optional)</label>
          <input type="text" id="ot_notes" placeholder="Any additional details…"/>
        </div>
      </div>
      <div style="padding:16px 24px;border-top:1px solid var(--border);display:flex;gap:10px;justify-content:flex-end">
        <button class="btn" onclick="document.getElementById('ownerTruckModal').style.display='none'">Cancel</button>
        <button class="btn btn-red" onclick="saveOwnerTruck()">Start Receiving →</button>
      </div>
    </div>
  </div>`;
}

function renderOwnerTrucks(){
  const wrap = document.getElementById('ownerTruckWrap');
  if(!wrap) return;
  if(!_ownerTrucks.length){
    wrap.innerHTML = `<div class="card" style="text-align:center;padding:48px;color:var(--ink3)">
      <div style="font-size:36px;margin-bottom:12px">🚛</div>
      <div style="font-weight:700;margin-bottom:6px">No inbound shipments yet</div>
      <div style="font-size:12px;margin-bottom:16px">Log your first purchase or incoming goods</div>
      <button class="btn btn-red" onclick="openOwnerTruckModal()">+ Log Inbound Shipment</button>
    </div>`;
    return;
  }
  const typeLabels = {purchase:'Purchase',disposal_transfer:'Disposal Transfer',donation:'Donation',return:'Return',other:'Other'};
  const typeIcons  = {purchase:'🛒',disposal_transfer:'🗑',donation:'🎁',return:'↩️',other:'📦'};
  wrap.innerHTML = _ownerTrucks.map(t=>`
    <div class="card" style="padding:14px 18px;margin-bottom:10px;display:flex;align-items:center;gap:14px">
      <div style="font-size:22px">${typeIcons[t.type]||'🚛'}</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:14px">${t.name||t.id}</div>
        <div style="font-size:12px;color:var(--ink3)">${typeLabels[t.type]||t.type||'—'}${t.vendor?' · '+t.vendor:''}${t.date?' · '+t.date:''}</div>
        ${t.notes?`<div style="font-size:11px;color:var(--ink3);margin-top:2px;font-style:italic">${t.notes}</div>`:''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        <span class="tag ${t.status==='received'?'tg':t.status==='receiving'?'tb':'to'}">${(t.status||'arriving').toUpperCase()}</span>
        ${t.status!=='received'
          ?`<button class="btn btn-red" style="font-size:11px" onclick="openOwnerPalletScan('${t.id}','${(t.name||'').replace(/'/g,'\\'')}')">📦 Scan Pallets</button>`
          :`<button class="btn" style="font-size:11px" onclick="showPage('ownerinv')">View Inventory →</button>`}
      </div>
    </div>`).join('');
}

function openOwnerTruckModal(){
  document.getElementById('ownerTruckModal').style.display='flex';
  document.getElementById('ot_date').value = new Date().toISOString().split('T')[0];
  document.getElementById('ot_name').value='';
  document.getElementById('ot_vendor').value='';
  document.getElementById('ot_notes').value='';
  document.getElementById('ot_pallets').value='';
}

async function saveOwnerTruck(){
  const name    = document.getElementById('ot_name').value.trim();
  const date    = document.getElementById('ot_date').value;
  const vendor  = document.getElementById('ot_vendor').value.trim();
  const type    = document.getElementById('ot_type').value;
  const pallets = parseInt(document.getElementById('ot_pallets').value)||0;
  const notes   = document.getElementById('ot_notes').value.trim();
  if(!name){ showToast('Please enter a shipment name'); return; }

  const truck = {
    name, date, cust_id: OWNER_CUST_ID, status: 'arriving',
    type, vendor: vendor||null, total_pallets: pallets,
    notes: notes||null, created_at: new Date().toISOString()
  };
  const {data, error} = await sb.from('trucks').insert([truck]).select().single();
  if(error){ showToast('⚠ '+error.message); return; }

  showToast('✓ Shipment logged — tap "Scan Pallets" to start receiving');
  document.getElementById('ownerTruckModal').style.display='none';
  _ownerTrucks.unshift(data);
  renderOwnerTrucks();
}

function openOwnerPalletScan(truckId, truckName){
  // Inject this truck into TRUCKS_INPROGRESS so the standard pallet scanner works
  if(typeof TRUCKS_INPROGRESS !== 'undefined'){
    const existing = TRUCKS_INPROGRESS.find(t=>String(t.id)===String(truckId));
    if(!existing){
      TRUCKS_INPROGRESS.push({
        id: truckId, name: truckName, custId: OWNER_CUST_ID,
        status: 'receiving', pallets: [], totalPallets: 0, date: new Date().toLocaleDateString()
      });
    }
    if(typeof openScanPalletModalById === 'function'){
      openScanPalletModalById(truckId);
    } else if(typeof openNewPalletScan === 'function'){
      openNewPalletScan(truckId);
    } else {
      showToast('Pallet scanner available from the main Receiving page — use Truck ID: '+truckId);
    }
  } else {
    showToast('Use the main Receiving page to scan pallets for Truck ID: '+truckId);
  }
}


// ══════════════════════════════════════════════════════
// ── ORDERS ──
// ══════════════════════════════════════════════════════
function pgOwnerOrders(){
  enterOwnerMode();

  setTimeout(async()=>{
    const {data} = await sb.from('orders').select('*').eq('cust_id', OWNER_CUST_ID).order('created_at',{ascending:false});
    _ownerOrders = data||[];
    renderOwnerOrders();
  }, 100);

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--red);margin-bottom:4px">Owner Portal</div>
      <div class="pg-title">Owner Orders</div>
      <div class="pg-sub">ShiplyCo outbound — sales, marketplace orders, and transfers</div>
    </div>
    <button class="btn btn-red" onclick="openOwnerOrderModal()">+ Place New Order</button>
  </div>

  <div id="ownerOrdersWrap"><div style="padding:40px;text-align:center;color:var(--ink3)"><span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Loading…</div></div>

  <!-- Place Owner Order Modal -->
  <div id="ownerOrderModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:8000;align-items:center;justify-content:center">
    <div style="background:var(--surface);border-radius:14px;width:90%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.25)">
      <div style="padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;text-transform:uppercase">Place Owner Order</div>
        <button onclick="document.getElementById('ownerOrderModal').style.display='none'" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3)">×</button>
      </div>
      <div style="padding:20px 24px;display:flex;flex-direction:column;gap:12px">
        <div class="field"><label>Order Type</label>
          <select id="oo_type">
            <option value="sale">Sale / Outbound</option>
            <option value="pallet_out">Pallet Outbound</option>
            <option value="pickpack">Pick &amp; Pack</option>
            <option value="marketplace">Marketplace Order</option>
            <option value="transfer">Internal Transfer</option>
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="field"><label>Buyer / Recipient</label><input type="text" id="oo_buyer" placeholder="Who is this going to?"/></div>
          <div class="field"><label>Date Needed</label><input type="date" id="oo_date"/></div>
        </div>
        <div class="field"><label>Carrier / Shipping Method</label>
          <input type="text" id="oo_carrier" placeholder="e.g. FedEx, UPS, local pickup, own truck"/>
        </div>
        <div class="field"><label>Items / Description</label>
          <textarea id="oo_items" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:7px;font-family:Barlow,sans-serif;font-size:13px;resize:vertical;min-height:80px;color:var(--ink)" placeholder="Pallet numbers, SKUs, or description of what's going out…"></textarea>
        </div>
        <div class="field"><label>Notes (optional)</label>
          <input type="text" id="oo_notes" placeholder="Any special instructions…"/>
        </div>
      </div>
      <div style="padding:16px 24px;border-top:1px solid var(--border);display:flex;gap:10px;justify-content:flex-end">
        <button class="btn" onclick="document.getElementById('ownerOrderModal').style.display='none'">Cancel</button>
        <button class="btn btn-red" id="ownerOrderSubmitBtn" onclick="submitOwnerOrder()">Submit Order →</button>
      </div>
    </div>
  </div>`;
}

function renderOwnerOrders(){
  const wrap = document.getElementById('ownerOrdersWrap');
  if(!wrap) return;
  if(!_ownerOrders.length){
    wrap.innerHTML = `<div class="card" style="text-align:center;padding:48px;color:var(--ink3)">
      <div style="font-size:36px;margin-bottom:12px">🚚</div>
      <div style="font-weight:700;margin-bottom:6px">No orders yet</div>
      <div style="font-size:12px;margin-bottom:16px">Place an outbound order for company-owned inventory</div>
      <button class="btn btn-red" onclick="openOwnerOrderModal()">+ Place New Order</button>
    </div>`;
    return;
  }
  const typeLabels = {sale:'Sale',pallet_out:'Pallet Outbound',pickpack:'Pick & Pack',marketplace:'Marketplace',transfer:'Transfer',disposal:'Disposal'};
  wrap.innerHTML = _ownerOrders.map(o=>`
    <div class="order-card" style="margin-bottom:10px">
      <div class="order-card-head">
        <div>
          <div class="order-id">🚚 ${o.id} · ${typeLabels[o.type]||o.type||'Order'}</div>
          <div class="order-meta">${o.channel||'—'} · ${o.date||new Date(o.created_at).toLocaleDateString()} ${o.notes?'· '+o.notes:''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="tag ${o.status==='picked_up'?'tg':o.status==='processed'?'tb':'to'}">${(o.status||'pending').replace(/_/g,' ').toUpperCase()}</span>
          ${o.status==='pending'?`<button class="btn" style="font-size:11px" onclick="sbMarkOrderStatus('${o.id}','processed')">✓ Mark Processed</button>`:''}
          ${o.status==='processed'?`<button class="btn" style="font-size:11px" onclick="sbMarkOrderStatus('${o.id}','picked_up')">🚚 Mark Shipped</button>`:''}
        </div>
      </div>
    </div>`).join('');
}

function openOwnerOrderModal(){
  document.getElementById('ownerOrderModal').style.display='flex';
  document.getElementById('oo_date').value = new Date().toISOString().split('T')[0];
  document.getElementById('oo_buyer').value='';
  document.getElementById('oo_carrier').value='';
  document.getElementById('oo_items').value='';
  document.getElementById('oo_notes').value='';
}

async function submitOwnerOrder(){
  const btn = document.getElementById('ownerOrderSubmitBtn');
  btn.disabled=true; btn.textContent='Submitting…';

  const type    = document.getElementById('oo_type').value;
  const buyer   = document.getElementById('oo_buyer').value.trim();
  const date    = document.getElementById('oo_date').value;
  const carrier = document.getElementById('oo_carrier').value.trim();
  const items   = document.getElementById('oo_items').value.trim();
  const notes   = document.getElementById('oo_notes').value.trim();

  const order = {
    cust_id: OWNER_CUST_ID, type, status: 'pending',
    channel: carrier||null, date,
    notes: [buyer?'To: '+buyer:'', notes].filter(Boolean).join(' · ')||null,
    items: items?[{desc:items}]:null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const {data, error} = await sb.from('orders').insert([order]).select().single();
  btn.disabled=false; btn.textContent='Submit Order →';
  if(error){ showToast('⚠ '+error.message); return; }

  showToast('✓ Order submitted — appears on the dispatch board for fulfillment');
  document.getElementById('ownerOrderModal').style.display='none';
  _ownerOrders.unshift(data);
  renderOwnerOrders();
}

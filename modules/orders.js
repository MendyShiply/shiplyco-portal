// ── PLACE AN ORDER PAGE ──
let selOrderType=null;
let selPallets=[];
let selTime=null;
let selChannel=null;

function pgPlaceOrder(){
  // Ensure inventory and SKU catalog loaded
  if(!_invLoaded) loadInventory();
  if(!SKU_CATALOG.length && typeof loadSkuCatalog==='function') loadSkuCatalog();
  setTimeout(()=>{ initOrderForm(); }, 200);
  return `
  <div class="pg-head">
    <div class="pg-title">Place an Order</div>
    <div class="pg-sub">Submit a fulfillment request — we ship within 24–48 hours (72 hr max)</div>
  </div>

  <!-- ORDER TYPE SELECTOR -->
  <div class="order-type-grid" style="margin-bottom:24px">
    ${[
      {id:'pallet_out', icon:'🚚', name:'Pallet Outbound',    desc:'Ship full pallets out of our warehouse'},
      {id:'pickpack',   icon:'📦', name:'Pick & Pack',         desc:'We pick, pack & ship individual orders'},
      {id:'fba',        icon:'🏭', name:'FBA Shipment',        desc:'Prep & send inventory into Amazon'},
      {id:'marketplace',icon:'🛒', name:'Marketplace Order',   desc:'Walmart, eBay, Shopify & more'},
    ].map(t=>`
    <div class="ot-card" id="ot_${t.id}" onclick="selectOrderType('${t.id}')">
      <div class="ot-icon">${t.icon}</div>
      <div class="ot-name">${t.name}</div>
      <div class="ot-desc">${t.desc}</div>
    </div>`).join('')}
  </div>

  <!-- FORM AREA — shown after type selected -->
  <div id="orderFormArea"></div>`;
}

// ── STATE ──
let _oType=null, _oCarrier=null, _oScheduled=false;

function initOrderForm(){
  if(selOrderType){ selectOrderType(selOrderType); }
}

function selectOrderType(type){
  _oType=type; selOrderType=type;
  // highlight selected card
  document.querySelectorAll('.ot-card').forEach(c=>c.classList.remove('sel'));
  const card=document.getElementById('ot_'+type);
  if(card) card.classList.add('sel');
  renderOrderForm(type);
}

function renderOrderForm(type){
  const wrap=document.getElementById('orderFormArea');
  if(!wrap) return;
  if(type==='marketplace'){
    wrap.innerHTML=`<div class="card" style="padding:32px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">🔌</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;text-transform:uppercase;margin-bottom:8px">Store Integrations Coming Soon</div>
      <div style="font-size:13px;color:var(--ink3);max-width:400px;margin:0 auto 20px">Connect Walmart, eBay, Shopify and more — orders will flow in automatically.</div>
      <button class="btn btn-red" onclick="selectOrderType('pickpack')">📦 Use Pick & Pack Instead</button>
    </div>`;
    return;
  }
  wrap.innerHTML = buildOrderForm(type);
  // reset carrier state
  _oCarrier=null; _oScheduled=false;
}

function buildOrderForm(type){
  const titles={pallet_out:'🚚 Pallet Outbound',pickpack:'📦 Pick & Pack',fba:'🏭 FBA Shipment'};
  return `<div class="card">
    <div class="card-head"><span class="card-title">${titles[type]||type}</span></div>
    <div style="padding:20px" id="innerForm">

      ${type==='pickpack'?pickpackFields():''}
      ${type==='fba'?fbaTopFields():''}
      ${type==='pallet_out'?palletFields():''}

      <!-- SHIPPING METHOD -->
      <div style="margin-top:20px">
        <div class="form-section-label">Shipping Method</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap" id="carrierBtns">
          ${['FedEx','UPS','USPS','Other Carrier / Broker / Freight'].map(c=>`
          <div class="ch-btn" onclick="selectCarrier(this,'${c}')">${c}</div>`).join('')}
        </div>
      </div>

      <!-- SCHEDULED PICKUP — shown only for non-big-three or FBA freight -->
      <div id="scheduledSection" style="display:none;margin-top:16px">
        <div class="form-section-label">Pickup Appointment</div>
        <div class="fg2">
          <div class="field"><label>Date</label><input type="date" id="pickupDate" min="${new Date().toISOString().split('T')[0]}"/></div>
          <div class="field"><label>Time Slot</label>
            <div class="time-slots">
              ${['9am–11am','11am–1pm','1pm–3pm','3pm–5pm'].map(t=>`<div class="tslot" onclick="setTime('${t}',this)">${t}</div>`).join('')}
            </div>
          </div>
        </div>
        <div class="field" style="margin-top:10px"><label>Carrier / Broker Name</label><input type="text" id="carrierName" placeholder="e.g. XPO, Amazon Freight, custom broker…"/></div>
      </div>

      ${type==='fba'?fbaDocUploads():''}
      ${type==='pallet_out'?palletDocUploads():''}

      <!-- NOTES -->
      <div class="field" style="margin-top:16px"><label>Notes for ShiplyCo team (optional)</label>
        <input type="text" id="orderNotes" placeholder="Any special instructions…"/>
      </div>

      <!-- SLA NOTICE -->
      <div style="margin-top:16px;padding:10px 14px;background:var(--blue-bg);border:1px solid var(--blue);border-radius:8px;font-size:12px;color:var(--ink2)">
        ⏱ We fulfill orders within <strong>24–48 hours</strong>. Maximum turnaround is <strong>72 hours</strong>.
      </div>

      <div style="margin-top:20px;display:flex;justify-content:flex-end">
        <button class="submit-btn" onclick="submitOrderToSb('${type}')">Submit Order →</button>
      </div>
    </div>
  </div>`;
}

function pickpackFields(){
  return '<div>'
    +'<div style="background:var(--blue-bg);border:1px solid var(--blue);border-radius:8px;padding:12px 14px;font-size:13px;margin-bottom:16px">'
      +'📦 Upload your order file (CSV, spreadsheet, or shipping labels). ShiplyCo will pick, pack, and ship each order.'
    +'</div>'
    +'<div class="fg2">'
      +'<div class="field" style="grid-column:span 2"><label>Order File Upload *</label>'
        +'<input type="file" id="pp_file" accept=".csv,.xlsx,.xls,image/*,.pdf" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px"/>'
        +'<div style="font-size:11px;color:var(--ink3);margin-top:4px">CSV with columns: name, address, city, state, zip, sku, qty — or upload shipping labels directly</div>'
      +'</div>'
      +'<div class="field"><label>Estimated Orders</label><input type="number" id="pp_count" placeholder="How many orders?" min="1"/></div>'
      +'<div class="field"><label>SKU / Product</label><input type="text" id="pp_sku" placeholder="Main SKU being shipped (optional)"/></div>'
    +'</div>'
    +'</div>';
}
function fbaTopFields(){
  // Pull customer's actual SKUs from sku_catalog
  const mySkus = (SKU_CATALOG||[]).filter(s=>!currentCustId||s.cust_id===currentCustId);

  let skuRows = '';
  if(mySkus.length){
    skuRows = '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);margin-bottom:8px">Select SKUs and Quantities</div>'
      +'<div style="max-height:280px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;margin-bottom:12px">';
    mySkus.forEach((s,i)=>{
      skuRows += '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border2)">'
        +'<div style="flex:1">'
          +'<div style="font-weight:700;font-size:13px">'+(s.description||s.sku||'SKU '+i)+'</div>'
          +'<div style="font-size:11px;color:var(--ink3)">SKU: '+(s.sku||'--')+' · UPC: '+(s.upc||'--')+'</div>'
        +'</div>'
        +'<input type="number" data-sku="'+(s.sku||'')+'" data-desc="'+(s.description||'')+'" class="fba-qty-input" placeholder="Qty" min="0" style="width:80px;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;text-align:center" oninput="updateFbaTotal()"/>'
        +'</div>';
    });
    skuRows += '</div>';
  } else {
    skuRows = '<div style="padding:16px;background:var(--surface2);border-radius:8px;font-size:13px;color:var(--ink3);margin-bottom:12px">No SKUs in catalog yet. Contact ShiplyCo to add products.</div>';
  }

  return '<div>'
    +skuRows
    +'<div class="fg2">'
      +'<div class="field"><label>Amazon FC Destination</label><input type="text" id="fcCode" placeholder="e.g. DFW2, ONT8, LAX9"/></div>'
      +'<div class="field"><label>Amazon Shipment ID (optional)</label><input type="text" id="fbaShipmentId" placeholder="From Seller Central"/></div>'
      +'<div class="field"><label>FBA Labels Upload</label><input type="file" id="fbaLabels" accept=".pdf,image/*" style="font-size:12px"/></div>'
      +'<div class="field"><label style="display:flex;justify-content:space-between">Total Units <span id="fbaTotalUnits" style="color:var(--red);font-weight:800">0</span></label>'
        +'<input type="number" id="fbaUnits" placeholder="Auto-calculated or enter manually" oninput="updateFbaCost()"/>'
      +'</div>'
    +'</div>'
    +'</div>';
}

function updateFbaTotal(){
  let total = 0;
  document.querySelectorAll('.fba-qty-input').forEach(el=>{ total += parseInt(el.value)||0; });
  const el = document.getElementById('fbaTotalUnits');
  if(el) el.textContent = total.toLocaleString();
  const unitsInput = document.getElementById('fbaUnits');
  if(unitsInput && total > 0) unitsInput.value = total;
  updateFbaCost();
}
function fbaDocUploads(){
  const docs = [
    {id:'fba_item_labels',  icon:'🏷',  label:'Item Labels',     hint:'FNSKU / barcode labels — one per unit'},
    {id:'fba_box_labels',   icon:'📦',  label:'Box Labels',      hint:'Amazon box content labels — one per box'},
    {id:'fba_pallet_labels',icon:'🪣',  label:'Pallet Labels',   hint:'Amazon pallet labels — one per pallet'},
    {id:'fba_shipment_plan',icon:'📋',  label:'Shipment Plan',   hint:'PDF export from Amazon Seller Central'},
    {id:'fba_bol',          icon:'📄',  label:'Bill of Lading',  hint:'Required if shipping via freight carrier'},
  ];
  return `<div style="margin-top:20px">
    <div class="form-section-label">FBA Documents <span style="font-weight:400;text-transform:none;letter-spacing:0;font-size:11px;color:var(--ink3)">(all optional — upload what applies to your shipment)</span></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
      ${docs.map(d=>`
      <div style="border:1.5px dashed var(--border2);border-radius:10px;padding:14px;background:var(--surface)" id="docSlot_${d.id}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:20px">${d.icon}</span>
          <div>
            <div style="font-size:13px;font-weight:700">${d.label}</div>
            <div style="font-size:11px;color:var(--ink3)">${d.hint}</div>
          </div>
        </div>
        <div class="upzone" style="padding:12px 10px" onclick="this.querySelector('input').click()">
          <input type="file" accept=".pdf,image/*,.zip" style="display:none" onchange="markDocUploaded('${d.id}',this)"/>
          <div style="font-size:12px;color:var(--ink3);text-align:center">Click to upload · PDF or image</div>
        </div>
        <div id="docFile_${d.id}" style="margin-top:6px;font-size:12px;color:var(--green);display:none"></div>
      </div>`).join('')}
    </div>
  </div>`;
}

function palletFields(){
  // Use real Supabase inventory filtered for this customer
  const myPallets = _sbPallets.filter(p=>!currentCustId||p.cust_id===currentCustId);
  if(!myPallets.length) return '<div style="padding:20px;color:var(--ink3)">No pallets in inventory. Contact ShiplyCo if you believe this is an error.</div>';

  // Build grid showing each pallet with items
  let grid = '';
  myPallets.forEach(p=>{
    const items = p.items||[];
    const totalUnits = items.reduce((s,i)=>s+(i.units||0),0);
    const firstItem = items[0]||{};
    const selected = selPallets.includes(p.id);
    grid += '<div class="psel '+(selected?'sel':'')+'" data-pid="'+p.id+'" onclick="togglePalletSel(this)" style="cursor:pointer;border:2px solid '+(selected?'var(--red)':'var(--border)')+';border-radius:10px;padding:12px;background:'+(selected?'var(--red-light)':'var(--surface)')+';">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
        +'<div style="width:20px;height:20px;border-radius:50%;border:2px solid '+(selected?'var(--red)':'var(--border)')+';background:'+(selected?'var(--red)':'transparent')+';display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;flex-shrink:0">'+(selected?'✓':'')+'</div>'
        +'<span style="font-weight:800;font-size:13px;font-family:monospace">P'+p.pallet_num+'</span>'
        +'<span style="font-size:11px;color:var(--ink3)">📍 '+(p.location||'Unassigned')+'</span>'
      +'</div>'
      +'<div style="font-size:12px;font-weight:600;margin-bottom:2px">'+(firstItem.desc||firstItem.sku||'Mixed items')+(items.length>1?' +'+( items.length-1)+' more':'')+'</div>'
      +'<div style="font-size:11px;color:var(--ink3)">'+(totalUnits.toLocaleString())+' units'+(firstItem.upc?' · '+firstItem.upc:'')+'</div>'
      +'</div>';
  });

  return '<div>'
    +'<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);margin-bottom:10px">Select Pallets to Ship Out</div>'
    +'<div style="font-size:12px;color:var(--ink3);margin-bottom:12px">Click a pallet to select it. You can select multiple.</div>'
    +'<div class="pallet-sel-grid" id="palletSelGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:14px">'+grid+'</div>'
    +'<div id="palletCostPreview" style="margin-top:4px"></div>'
    +'</div>';
}
function palletDocUploads(){
  return `<div style="margin-top:20px">
    <div class="form-section-label">Documents <span style="font-weight:400;text-transform:none;letter-spacing:0;font-size:11px;color:var(--ink3)">(optional)</span></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
      ${[
        {id:'bol',   icon:'📄', label:'Bill of Lading',  hint:'Upload your BOL if provided by carrier/broker'},
        {id:'pallet_docs', icon:'📋', label:'Pallet Docs / Packing List', hint:'Any additional shipping docs'},
      ].map(d=>`
      <div style="border:1.5px dashed var(--border2);border-radius:10px;padding:14px;background:var(--surface)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:20px">${d.icon}</span>
          <div>
            <div style="font-size:13px;font-weight:700">${d.label}</div>
            <div style="font-size:11px;color:var(--ink3)">${d.hint}</div>
          </div>
        </div>
        <div class="upzone" style="padding:12px 10px" onclick="this.querySelector('input').click()">
          <input type="file" accept=".pdf,image/*" style="display:none" onchange="markDocUploaded('${d.id}',this)"/>
          <div style="font-size:12px;color:var(--ink3);text-align:center">Click to upload · PDF or image</div>
        </div>
        <div id="docFile_${d.id}" style="margin-top:6px;font-size:12px;color:var(--green);display:none"></div>
      </div>`).join('')}
    </div>
  </div>`;
}

function uploadZone(id, hint){
  return `<div class="upzone" onclick="this.querySelector('input').click()" style="max-width:400px">
    <input type="file" id="${id}" accept=".pdf,image/*" style="display:none" onchange="showFiles(this,'${id}_list')"/>
    <div class="upzone-txt">${hint}</div>
  </div><div id="${id}_list"></div>`;
}

function markDocUploaded(docId, input){
  const el=document.getElementById('docFile_'+docId);
  const slot=document.getElementById('docSlot_'+docId);
  if(el && input.files[0]){
    el.textContent='✓ '+input.files[0].name;
    el.style.display='block';
    if(slot) slot.style.borderColor='var(--green)';
  }
}

function selectCarrier(el, carrier){
  _oCarrier=carrier;
  document.querySelectorAll('#carrierBtns .ch-btn').forEach(b=>b.classList.remove('sel'));
  el.classList.add('sel');
  const needsSchedule = carrier==='Other Carrier / Broker / Freight' || _oType==='fba';
  const sec=document.getElementById('scheduledSection');
  if(sec) sec.style.display=needsSchedule?'block':'none';
}

function setTime(t, el){
  selTime=t;
  document.querySelectorAll('.tslot').forEach(b=>b.classList.remove('sel'));
  if(el) el.classList.add('sel');
}
function setChannel(ch, el){
  selChannel=ch;
  document.querySelectorAll('#channelBtns .ch-btn').forEach(b=>b.classList.remove('sel'));
  if(el) el.classList.add('sel');
}

let _ppItemCount=1;
function ppItemRow(n){
  return `<div class="irow fg3" style="margin-bottom:8px" id="ppitem-${n}">
    <div class="field"><label>Item / SKU</label><input type="text" placeholder="Description or SKU"/></div>
    <div class="field"><label>Qty</label><input type="number" placeholder="1" min="1"/></div>
  </div>`;
}
function addPpItem(){
  _ppItemCount++;
  const w=document.getElementById('ppItems');
  const d=document.createElement('div');
  d.innerHTML=ppItemRow(_ppItemCount);
  w.appendChild(d.firstElementChild);
}

function updateFbaCost(){
  const el=document.getElementById('fbaCostPreview'); if(!el) return;
  const units=+document.getElementById('fbaUnits')?.value||0;
  const labels=+document.getElementById('fbaLabels')?.value||1;
  const kit=units*RATES.fba_kitting, lbl=units*labels*RATES.fba_label;
  el.innerHTML=units?`<div class="cost-preview">
    <div class="cp-title">Auto-Charge to Invoice</div>
    <div class="cp-row"><span>FBA Kitting (${units} × ${fmt(RATES.fba_kitting)})</span><span style="font-weight:700">${fmt(kit)}</span></div>
    <div class="cp-row"><span>FNSKU Labels (${units*labels} × ${fmt(RATES.fba_label)})</span><span style="font-weight:700">${fmt(lbl)}</span></div>
    <div class="cp-total"><span>Added to Invoice</span><span>${fmt(kit+lbl)}</span></div>
  </div>`:'';
}

function togglePalletSel(el){
  const pid = el.dataset.pid;
  if(!pid) return;
  const idx = selPallets.indexOf(pid);
  if(idx>-1){
    selPallets.splice(idx,1);
    el.style.border='2px solid var(--border)';
    el.style.background='var(--surface)';
    el.querySelector('div>div').style.background='transparent';
    el.querySelector('div>div').style.borderColor='var(--border)';
    el.querySelector('div>div').textContent='';
    el.classList.remove('sel');
  } else {
    selPallets.push(pid);
    el.style.border='2px solid var(--red)';
    el.style.background='var(--red-light)';
    el.querySelector('div>div').style.background='var(--red)';
    el.querySelector('div>div').style.borderColor='var(--red)';
    el.querySelector('div>div').textContent='✓';
    el.classList.add('sel');
  }
  // Update cost preview
  const preview = document.getElementById('palletCostPreview');
  if(preview) preview.innerHTML = selPallets.length
    ? '<div style="padding:10px;background:var(--surface2);border-radius:8px;font-size:13px"><strong>'+selPallets.length+' pallet'+(selPallets.length!==1?'s':'')+' selected</strong> · Est. outbound fee: $'+(selPallets.length*11).toFixed(2)+' + wrapping if needed</div>'
    : '';
}
function updatePalletCost(){
  const el=document.getElementById('palletCostPreview'); if(!el) return;
  const n=selPallets.length;
  const rate=getRate('platinum','outbound_pallet');
  if(!n){el.innerHTML='';return;}
  const wrap=n*RATES.pallet_wrap, out=n*rate;
  el.innerHTML=`<div class="cost-preview">
    <div class="cp-title">Auto-Charge to Invoice</div>
    <div class="cp-row"><span>Outbound — ${n} pallet${n>1?'s':''} × ${fmt(rate)}</span><span style="font-weight:700">${fmt(out)}</span></div>
    <div class="cp-row"><span>Pallet Wrapping — ${n} × ${fmt(RATES.pallet_wrap)}</span><span style="font-weight:700">${fmt(wrap)}</span></div>
    <div class="cp-total"><span>Added to Invoice</span><span>${fmt(out+wrap)}</span></div>
  </div>`;
}

async function submitOrderToSb(type){
  const btn = event.target;
  btn.disabled=true; btn.textContent='Submitting…';

  // Collect items based on type
  let items = [];
  let palletIds = [];

  if(type==='pallet_out'){
    palletIds = [...selPallets];
    if(!palletIds.length){
      showToast('Please select at least one pallet');
      btn.disabled=false; btn.textContent='Submit Order →';
      return;
    }
    // Include pallet details for reference
    palletIds.forEach(pid=>{
      const p = _sbPallets.find(x=>x.id===pid);
      if(p) items.push({palletId:pid, pallet_num:p.pallet_num, location:p.location, units:(p.items||[]).reduce((s,i)=>s+(i.units||0),0)});
    });
  } else if(type==='pickpack'){
    items = [{
      file_name: document.getElementById('pp_file')?.files?.[0]?.name||null,
      count: parseInt(document.getElementById('pp_count')?.value)||null,
      sku: document.getElementById('pp_sku')?.value?.trim()||null
    }];
  } else if(type==='fba'){
    // Collect SKU quantities
    document.querySelectorAll('.fba-qty-input').forEach(el=>{
      const qty = parseInt(el.value)||0;
      if(qty > 0) items.push({sku: el.dataset.sku, desc: el.dataset.desc, qty});
    });
    if(!items.length){
      const manual = parseInt(document.getElementById('fbaUnits')?.value)||0;
      if(manual) items.push({qty: manual, desc: 'FBA shipment'});
    }
  }

  const order = {
    cust_id: currentCustId||(CUSTOMERS[0]?.id),
    type,
    status: 'pending',
    channel: selChannel||_oCarrier||null,
    date: document.getElementById('pickupDate')?.value||null,
    time: selTime||null,
    notes: document.getElementById('orderNotes')?.value?.trim()||null,
    items: items.length ? items : null,
    pallets: palletIds.length ? palletIds : null,
    carrier: _oCarrier||null,
    fc_code: document.getElementById('fcCode')?.value?.trim()||null,
    fba_shipment_id: document.getElementById('fbaShipmentId')?.value?.trim()||null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const {data, error} = await sb.from('orders').insert([order]).select().single();
  if(error){
    showToast('⚠ '+error.message);
    btn.disabled=false; btn.textContent='Submit Order →';
    return;
  }

  btn.textContent='✓ Order Submitted!';
  btn.style.background='var(--green)';
  showToast('Order submitted — ShiplyCo will fulfill within 24-48 hours');
  selOrderType=null; selPallets=[]; selTime=null; selChannel=null; _oCarrier=null;
  setTimeout(()=>showPage('myorders'), 1400);
}

// legacy shim
function submitOrder(type){ submitOrderToSb(type); }
function fbmItemRow(n){ return ppItemRow(n); }
let fbmItemCount=1;
function addFbmItem(){ addPpItem(); }



// ── ORDERS — Supabase wired ──
let _sbOrders = [];

async function loadOrdersFromSb(){
  const isStaff = role==='employee'||role==='admin';
  let query = sb.from('orders').select('*').order('date', {ascending:false});
  if(!isStaff){
    // Customer only sees their own orders
    const {data:prof} = await sb.from('profiles').select('customer_id').eq('id',(await sb.auth.getUser()).data.user?.id).single();
    if(prof?.customer_id) query = query.eq('cust_id', prof.customer_id);
  }
  const {data, error} = await query;
  if(error){ showToast('⚠ Error loading orders: '+error.message); return []; }
  return data||[];
}

function renderOrdersPage(orders){
  const wrap = document.getElementById('ordersPageWrap');
  if(!wrap) return;
  const isStaff = role==='employee'||role==='admin';
  const steps = ['Pending','Processed','Picked Up'];
  const stepKey = ['pending','processed','picked_up'];
  const typeIcons = {pallet_out:'🚚',pickpack:'📦',fbm:'📦',fba:'🏭',marketplace:'📦'};
  const typeLabels = {pallet_out:'Pallet Pickup',pickpack:'Pick & Pack',fbm:'Pick & Pack',fba:'FBA Prep',marketplace:'Pick & Pack'};

  const filterStatus = document.getElementById('ordersStatusFilter')?.value||'all';
  const filterSearch = document.getElementById('ordersSearch')?.value?.toLowerCase()||'';
  let list = orders;
  if(filterStatus!=='all') list = list.filter(o=>o.status===filterStatus);
  if(filterSearch) list = list.filter(o=>o.id?.toLowerCase().includes(filterSearch)||o.channel?.toLowerCase().includes(filterSearch)||o.type?.toLowerCase().includes(filterSearch));

  // Update stat counts
  document.getElementById('oStatPending').textContent  = orders.filter(o=>o.status==='pending').length;
  document.getElementById('oStatProcessed').textContent= orders.filter(o=>o.status==='processed').length;
  document.getElementById('oStatDone').textContent     = orders.filter(o=>o.status==='picked_up').length;

  if(!list.length){
    wrap.innerHTML=`<div style="padding:40px;text-align:center;color:var(--ink3)">No orders found</div>`;
    return;
  }

  wrap.innerHTML = list.map(o=>{
    const curStep = stepKey.indexOf(o.status);
    const items = Array.isArray(o.items)?o.items:(typeof o.items==='string'?JSON.parse(o.items||'[]'):[]);
    const cust = CUSTOMERS.find(c=>c.id===o.cust_id);
    return `<div class="order-card">
      <div class="order-card-head">
        <div>
          <div class="order-id">${typeIcons[o.type]||'📦'} ${o.id} · ${typeLabels[o.type]||o.type}</div>
          <div class="order-meta">${cust?.name||o.cust_id||'—'} · ${o.channel||'—'} · ${o.date||'—'}${o.time?' · '+o.time+' slot':''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="tag ${o.status==='picked_up'?'tg':o.status==='processed'?'tb':'to'}">${(o.status||'').replace('_',' ').toUpperCase()}</span>
        </div>
      </div>
      <div style="padding:13px 18px">
        ${o.notes?`<div style="font-size:12px;color:var(--ink3);margin-bottom:8px">📝 ${o.notes}</div>`:''}
        ${o.pallets?`<div style="font-size:13px;color:var(--ink2);margin-bottom:8px">${o.pallets} pallet${o.pallets>1?'s':''}</div>`:''}
        ${items.length?`<div style="font-size:12px;color:var(--ink2);margin-bottom:8px">${items.map(i=>`${i.desc||i.sku} × ${i.qty}`).join(', ')}</div>`:''}
        <div class="status-track">
          ${steps.map((s,i)=>`
            ${i>0?`<div class="st-line ${i<=curStep?'done':''}"></div>`:''}
            <div class="st-step ${i<curStep?'done':i===curStep?'active':''}">
              <div class="st-dot">${i<curStep?'✓':i+1}</div>
              <span style="white-space:nowrap">${s}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  }).join('');
}

async function sbMarkOrderStatus(orderId, newStatus){
  const {error} = await sb.from('orders').update({status:newStatus, updated_at:new Date().toISOString()}).eq('id',orderId);
  if(error){showToast('⚠ '+error.message);return;}
  showToast(`✓ Order ${orderId} → ${newStatus.replace('_',' ')}`);
  // Update local cache and re-render
  const o = _sbOrders.find(x=>x.id===orderId);
  if(o) o.status=newStatus;
  renderOrdersPage(_sbOrders);
}

function pgMyOrders(){
  const isStaff = role==='employee'||role==='admin';

  // Load from Supabase after render
  setTimeout(async()=>{
    const wrap = document.getElementById('ordersPageWrap');
    if(wrap) wrap.innerHTML=`<div style="padding:40px;text-align:center;color:var(--ink3)"><span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Loading orders…</div>`;
    _sbOrders = await loadOrdersFromSb();
    renderOrdersPage(_sbOrders);
  }, 100);

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div class="pg-title">${isStaff?'All Orders':'My Orders'}</div>
      <div class="pg-sub">${isStaff?'All customer outbound orders — live from Supabase':'Your outbound orders — real-time status'}</div>
    </div>
    <div style="display:flex;gap:8px">
      ${!isStaff?`<button class="btn btn-red" onclick="showPage('placeorder')">${ico('plus',13)} Place New Order</button>`:''}
      <button class="btn" onclick="reloadOrders()">↻ Refresh</button>
    </div>
  </div>
  <div class="stats" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat"><div class="stat-lbl">Pending</div><div class="stat-val" id="oStatPending">—</div><span class="tag to">Awaiting processing</span></div>
    <div class="stat"><div class="stat-lbl">Processed</div><div class="stat-val" id="oStatProcessed">—</div><span class="tag tb">Ready for pickup</span></div>
    <div class="stat"><div class="stat-lbl">Picked Up</div><div class="stat-val" id="oStatDone">—</div><span class="tag tg">Completed</span></div>
  </div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
    <input type="text" id="ordersSearch" placeholder="Search order ID, channel…"
      oninput="renderOrdersPage(_sbOrders)"
      style="flex:1;min-width:160px;padding:8px 12px;border:1px solid var(--border);border-radius:7px;font-family:Barlow,sans-serif;font-size:13px"/>
    <select id="ordersStatusFilter" onchange="renderOrdersPage(_sbOrders)"
      style="padding:8px 12px;border:1px solid var(--border);border-radius:7px;font-family:Barlow,sans-serif;font-size:13px">
      <option value="all">All Statuses</option>
      <option value="pending">Pending</option>
      <option value="processed">Processed</option>
      <option value="picked_up">Picked Up</option>
    </select>
  </div>
  <div id="ordersPageWrap"></div>`;
}

async function reloadOrders(){
  const wrap = document.getElementById('ordersPageWrap');
  if(wrap) wrap.innerHTML=`<div style="padding:40px;text-align:center;color:var(--ink3)"><span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Loading…</div>`;
  _sbOrders = await loadOrdersFromSb();
  renderOrdersPage(_sbOrders);
}

// ── TASK ASSIGNMENT HELPERS ──
function assignOrder(orderId, empId){
  const o=ORDERS.find(x=>x.id===orderId);
  if(!o)return;
  const prev=o.assignedTo;
  o.assignedTo=empId;
  const emp=empById(empId);
  if(emp){
    pushNotif(`📋 You've been assigned order ${orderId} — ${o.type.replace('_',' ')} for ${o.customer}`);
    showToast(`✓ ${orderId} assigned to ${emp.name}`);
  }
  showPage(document.querySelector('.nv.on')?.id?.replace('nv-','')||'dispatch');
}

function claimOrder(orderId){
  assignOrder(orderId, currentEmployee.id);
  startTimer(orderId);
}

function unassignOrder(orderId){
  stopTimer(orderId);
  const o=ORDERS.find(x=>x.id===orderId);
  if(o){o.assignedTo=null;showToast(`${orderId} unassigned`);}
  showPage(document.querySelector('.nv.on')?.id?.replace('nv-','')||'dispatch');
}

function empAvatar(emp, size=28){
  if(!emp)return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--border2);display:inline-flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.4)}px;font-weight:700;color:var(--ink3);flex-shrink:0">?</div>`;
  return `<div title="${emp.name}" style="width:${size}px;height:${size}px;border-radius:50%;background:${emp.color};display:inline-flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.38)}px;font-weight:800;color:#fff;flex-shrink:0;letter-spacing:0.5px">${emp.initials}</div>`;
}

function assignDropdown(orderId, currentEmpId){
  return `<select onchange="assignOrder('${orderId}',this.value);this.blur()"
    style="padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;font-size:12px;font-weight:600;background:var(--surface);cursor:pointer;max-width:140px">
    <option value="">Unassigned…</option>
    ${EMPLOYEES.map(e=>`<option value="${e.id}" ${e.id===currentEmpId?'selected':''}>${e.name}</option>`).join('')}
  </select>`;
}

function orderCardBorder(o){
  if(!o.assignedTo) return 'var(--border)';
  const emp=empById(o.assignedTo);
  return emp?emp.color:'var(--border)';
}
function orderCardBg(o){
  if(!o.assignedTo) return 'var(--surface)';
  const emp=empById(o.assignedTo);
  return emp?emp.colorBg:'var(--surface)';
}

// ══════════════════════════════════════════════════════
// ── ORDERS OPERATIONS — Supabase wired ──
// ══════════════════════════════════════════════════════

let _dispatchOrders = [];
let _myTaskOrders   = [];

// Load all active orders for staff views
async function loadDispatchOrders(){
  const {data, error} = await sb.from('orders')
    .select('*')
    .not('status','eq','picked_up')
    .order('date',{ascending:true});
  if(error){ showToast('⚠ '+error.message); return []; }
  return data||[];
}

// Assign an order to an employee in Supabase
async function sbAssignOrder(orderId, empName){
  const {error} = await sb.from('orders')
    .update({assigned_to: empName||null, updated_at: new Date().toISOString()})
    .eq('id', orderId);
  if(error){ showToast('⚠ '+error.message); return; }
  showToast(empName ? `✓ ${orderId} assigned to ${empName}` : `${orderId} unassigned`);
  // Refresh whichever page is active
  const activePage = document.querySelector('.nv.on')?.id?.replace('nv-','')||'dispatch';
  showPage(activePage);
}

// Claim an order as the current employee
async function sbClaimOrder(orderId){
  if(!currentEmployee){ showToast('⚠ No employee session'); return; }
  await sbAssignOrder(orderId, currentEmployee.name);
  startTimer(orderId);
}

// Release an order back to unassigned
async function sbReleaseOrder(orderId){
  stopTimer(orderId);
  await sbAssignOrder(orderId, null);
}

// ── TWO-STAGE RECEIVING PAGE ──
// ══════════════════════════════════════════════════════════════

function pgEntry(){
  if(!_trucksLoaded){
    loadTrucksFromSB().then(()=>showPage('entry'));
    return `<div style="padding:40px;text-align:center;color:var(--ink3)">Loading receiving data…</div>`;
  }
  const inProgress = TRUCKS_INPROGRESS.filter(t=>t.status==='receiving'||t.status==='arriving');
  const received   = TRUCKS_INPROGRESS.filter(t=>t.status==='received');

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div class="pg-title">Receiving</div>
      <div class="pg-sub">Scan pallets one at a time as they come off the truck</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="openTaraForTruck()" style="display:flex;align-items:center;gap:6px">
        <span style="font-size:14px">T</span> Tell TARA about a truck
      </button>
      <button class="btn btn-red" onclick="openNewTruckModal()">+ Log New Truck</button>
    </div>
  </div>

  <!-- Expected Inbound from Customers (ASNs) -->
  ${(typeof _asnList !== 'undefined' && _asnList.filter(function(a){return a.status==='pending';}).length>0)?
    '<div style="margin-bottom:6px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--orange)">Expected Inbound ('+_asnList.filter(function(a){return a.status==='pending';}).length+' pending)</div>'
    +'<div class="card" style="padding:0;margin-bottom:20px;overflow:hidden">'
    +_asnList.filter(function(a){return a.status==='pending';}).map(function(a){
      var c=CUSTOMERS.find(function(x){return x.id===a.cust_id;});
      return '<div style="display:flex;align-items:center;gap:14px;padding:12px 18px;border-bottom:1px solid var(--border)">'
        +'<div style="font-size:22px">&#128230;</div>'
        +'<div style="flex:1">'
          +'<div style="font-weight:700;font-size:14px">'+(c?c.name:a.cust_id)+'</div>'
          +'<div style="font-size:12px;color:var(--ink3)">'
            +(a.pallet_count?a.pallet_count+' pallets':'')+(a.box_count?' '+a.box_count+' boxes':'')
            +(a.expected_date?' · Expected: '+a.expected_date:'')+(a.bol_number?' · BOL: '+a.bol_number:'')
          +'</div>'
        +'</div>'
        +'<span style="background:var(--orange-bg);color:var(--orange);font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px">Expected</span>'
        +'<button class="btn btn-red" style="font-size:11px" data-aid="'+a.id+'" onclick="event.stopPropagation();openAsnDetail(this.dataset.aid)">View</button>'
        +'<button class="btn" style="font-size:11px" onclick="openNewTruckModal()">Receive</button>'
        +'</div>';
    }).join('')+'</div>'
  :''}

  <!-- In-progress trucks -->
  ${inProgress.length>0?`
  <div style="margin-bottom:6px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--ink3)">
    Receiving In Progress (${inProgress.length})
  </div>
  ${inProgress.map(t=>renderTruckReceivingCard(t)).join('')}
  `:`
  <div class="card" style="text-align:center;padding:40px;color:var(--ink3)">
    <div style="font-size:32px;margin-bottom:12px">🚛</div>
    <div style="font-weight:700;margin-bottom:6px">No trucks currently being received</div>
    <div style="font-size:12px;margin-bottom:16px">Tell TARA a truck arrived or log one manually</div>
    <button class="btn btn-red" onclick="openNewTruckModal()">+ Log New Truck</button>
  </div>`}

  <!-- Recently received -->
  ${received.length>0?`
  <div style="margin-top:20px;margin-bottom:6px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--ink3)">
    Recently Received
  </div>
  ${received.map(t=>{
    const c=CUSTOMERS.find(x=>x.id===t.custId);
    return `<div class="card" style="display:flex;align-items:center;gap:16px;padding:14px 18px">
      <div style="font-size:24px">✅</div>
      <div style="flex:1">
        <div style="font-weight:700">${t.name}</div>
        <div style="font-size:12px;color:var(--ink3)">${c?.name||t.custId} · ${t.totalPallets} pallets · ${t.date}</div>
      </div>
      <span class="tag tg">Received</span>
    </div>`;
  }).join('')}
  `:''}

  <!-- New Truck Modal -->
  <div class="modal-bg" id="newTruckModal" role="dialog" aria-modal="true" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal" style="max-width:600px;width:95vw">
      <div class="modal-head"><span class="modal-title">Log New Truck</span>
        <button class="modal-close" onclick="document.getElementById('newTruckModal').style.display='none'">×</button>
      </div>
      <div class="modal-body">

        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
          <div class="field"><label>Customer</label>
            <select id="nt_cust" onchange="ntToggleWalmartFields(this.value)">${(CUSTOMERS||[]).map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select>
          </div>
          <div class="field"><label>Truck #</label><input type="text" id="nt_name" placeholder="e.g. Truck #4"/></div>
          <div class="field"><label>Date Arrived</label><input type="date" id="nt_date" value="${new Date().toISOString().split('T')[0]}"/></div>
          <div class="field" style="display:none"><input type="number" id="nt_pallets" value="0"/></div>
        </div>
        <div id="nt_walmart_fields" style="display:none">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
            <div class="field"><label>Origin State</label>
              <select id="nt_origin"><option value="TX">Texas (TX)</option><option value="AR">Arkansas (AR)</option><option value="CA">California (CA)</option><option value="Other">Other</option></select>
            </div>
            <div class="field"><label>Walmart Store / DC</label><input type="text" id="nt_store" placeholder="e.g. Walmart DC #6013 — Sanger, TX"/></div>
          </div>
        </div>
        <div class="fg2" style="margin-top:4px">
          <div class="field"><label>BOL Document</label>
            <div class="upzone" style="padding:10px" onclick="this.querySelector('input').click()">
              <input type="file" accept=".pdf,image/*" capture="environment" onchange="showFiles(this,'nt_bol_f')"/>
              <div style="font-size:11px;color:var(--ink3)">📄 Upload BOL</div>
            </div><div class="up-files" id="nt_bol_f"></div>
          </div>
          <div class="field"><label>Walmart Receipt</label>
            <div class="upzone" style="padding:10px" onclick="this.querySelector('input').click()">
              <input type="file" accept=".pdf,image/*" capture="environment" onchange="showFiles(this,'nt_rec_f')"/>
              <div style="font-size:11px;color:var(--ink3)">📄 Upload Receipt</div>
            </div><div class="up-files" id="nt_rec_f"></div>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="document.getElementById('newTruckModal').style.display='none'">Cancel</button>
        <button class="btn btn-red" onclick="saveNewTruck()">Start Receiving →</button>
      </div>
    </div>
  </div>

  <!-- Scan Pallet Modal -->
  <div class="modal-bg" id="scanPalletModal" role="dialog" aria-modal="true" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal" style="max-width:680px;width:95vw;max-height:92vh;display:flex;flex-direction:column">
      <div class="modal-head" style="flex-shrink:0;display:flex;align-items:center;justify-content:space-between">
        <span class="modal-title" id="sp_title">Pallet Scan</span>
        <button onclick="document.getElementById('scanPalletModal').style.display='none';stopCameraScanner()"
          style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);padding:4px 8px;line-height:1">×</button>
      </div>
      <div class="modal-body" style="overflow-y:auto;flex:1;padding:16px">
        <!-- Location -->
        <div class="field" style="margin-bottom:12px">
          <label>Warehouse Location</label>
          <div style="position:relative">
            <input type="text" id="sp_loc_search" autocomplete="off"
              placeholder="Type to search location (e.g. AA05, B12)…"
              oninput="filterLocSearch(this.value)"
              onfocus="filterLocSearch(this.value)"
              onblur="setTimeout(()=>document.getElementById('sp_loc_results').style.display='none',200)"
              style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;
                     font-size:14px;font-weight:700;font-family:Barlow,sans-serif;background:var(--surface)"/>
            <input type="hidden" id="sp_loc" value=""/>
            <div id="sp_loc_results"
              style="display:none;position:absolute;top:100%;left:0;right:0;z-index:9999;
                     background:var(--surface);border:1px solid var(--border);border-radius:8px;
                     box-shadow:0 8px 24px rgba(0,0,0,0.12);max-height:220px;overflow-y:auto;margin-top:4px">
            </div>
          </div>
        </div>

        <!-- Scan input -->
        <div style="background:var(--ink);border-radius:10px;padding:14px 16px;margin-bottom:16px">
          <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.5);margin-bottom:8px">🔍 Scan Box</div>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="text" id="sp_scan_input"
              placeholder="Scan UPC or Item # — press Enter"
              onkeydown="handleScanInput(event)"
              style="flex:1;background:rgba(255,255,255,0.1);border:1.5px solid rgba(255,255,255,0.25);
                     border-radius:8px;padding:12px 14px;color:#fff;font-size:16px;font-family:monospace;
                     outline:none"
              onfocus="this.style.borderColor='rgba(232,36,26,0.8)'"
              onblur="this.style.borderColor='rgba(255,255,255,0.25)'"/>
            <button id="sp_cam_btn" onclick="startCameraScanner()"
              title="Scan with camera"
              style="background:rgba(232,36,26,0.3);border:1.5px solid rgba(232,36,26,0.6);border-radius:8px;
                     padding:12px 14px;color:#fff;font-size:20px;cursor:pointer;flex-shrink:0;line-height:1">
              📷
            </button>
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:6px">
            Bluetooth scanner: just scan · No scanner: tap 📷 to use camera
          </div>
          <!-- Camera viewfinder (hidden until activated) -->
          <div id="sp_cam_wrap" style="display:none;margin-top:10px;position:relative;border-radius:8px;overflow:hidden">
            <video id="sp_cam_video" autoplay playsinline muted
              style="width:100%;max-height:220px;object-fit:cover;border-radius:8px;display:block"></video>
            <div style="position:absolute;inset:0;border:2px solid rgba(232,36,26,0.7);border-radius:8px;pointer-events:none">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                          width:60%;height:2px;background:rgba(232,36,26,0.8);box-shadow:0 0 8px rgba(232,36,26,0.8)"></div>
            </div>
            <button onclick="stopCameraScanner()"
              style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);border:none;
                     color:#fff;border-radius:20px;padding:4px 10px;font-size:12px;cursor:pointer">
              ✕ Close
            </button>
            <div id="sp_cam_status" style="position:absolute;bottom:8px;left:0;right:0;text-align:center;
                 font-size:12px;color:#fff;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,0.8)">
              Point at barcode
            </div>
          </div>
        </div>

        <!-- Add manually button -->
        <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
          <button onclick="spAddManual()" style="background:none;border:1px dashed var(--border);border-radius:6px;padding:6px 14px;font-size:12px;cursor:pointer;color:var(--ink3);font-family:Barlow,sans-serif">+ Add Item Manually</button>
        </div>

        <!-- Scanned SKUs -->
        <div id="sp_skus_wrap"></div>

        <!-- Photo -->
        <div style="margin-top:8px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--ink3);background:var(--bg);border:1px dashed var(--border);border-radius:8px;padding:10px 14px">
            <input type="file" accept="image/*" capture="environment" multiple onchange="showFiles(this,'sp_photos')" style="display:none"/>
            📷 Add pallet photos
          </label>
          <div class="up-files" id="sp_photos" style="margin-top:6px"></div>
        </div>
      </div>
      <div class="modal-foot" style="flex-shrink:0;display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap">
        <button class="btn" onclick="printPalletLabel(_activeTruckId,_activePalletNum)">🖨 Print</button>
        <div style="display:flex;gap:8px">
          <button class="btn" onclick="saveScanPallet('save')">💾 Save</button>
          <button class="btn btn-red" onclick="saveScanPallet('done')">✓ Done with Pallet</button>
        </div>
      </div>
    </div>
  </div>
  `;
}

// ── PALLET LABEL PRINTING ──
function printPalletLabel(truckId, palletNum){
  const truck = TRUCKS_INPROGRESS.find(t=>t.id===truckId);
  const pallet = truck?.pallets.find(p=>p.num===palletNum);
  if(!truck||!pallet) return;

  const cust = CUSTOMERS.find(c=>c.id===truck.custId);
  const items = pallet.items||[];
  const skuSummary = items.map(i=>i.brand||i.desc||i.sku||'—').slice(0,3).join(', ');
  const barcodeVal = truckId+'-P'+String(palletNum).padStart(3,'0');
  const loc = pallet.loc||'—';

  const win = window.open('','_blank','width=420,height=500');
  win.document.write(`<!DOCTYPE html><html><head><title>Pallet Label</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    @page{size:4in 4in;margin:0}
    body{font-family:Arial,sans-serif;background:#fff;width:4in;height:4in;overflow:hidden}
    .label{width:4in;height:4in;padding:10px;display:flex;flex-direction:column;justify-content:space-between}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:7px;margin-bottom:7px}
    .co{font-size:15px;font-weight:900;letter-spacing:1px;line-height:1.1}
    .co span{color:#e8241a}
    .cosub{font-size:8px;color:#666;text-transform:uppercase;letter-spacing:1px}
    .pnum{font-size:42px;font-weight:900;color:#e8241a;line-height:1;text-align:right}
    .pnum-lbl{font-size:9px;color:#666;text-align:right;text-transform:uppercase;letter-spacing:1px}
    .rows{flex:1}
    .row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px}
    .lbl{color:#888;font-size:9px;text-transform:uppercase;letter-spacing:0.5px}
    .val{font-weight:700;font-size:12px;text-align:right;max-width:60%;word-break:break-word}
    .skus{background:#f5f5f5;padding:5px 7px;margin:5px 0;font-size:10px;color:#333;border-left:3px solid #e8241a}
    .barcode-wrap{text-align:center;border-top:1px solid #ddd;padding-top:6px;margin-top:4px}
    .barcode-id{font-size:9px;font-family:monospace;color:#888;margin-top:2px}
    @media screen{
      body{width:auto;height:auto;padding:16px}
      .label{width:384px;height:auto;min-height:384px;border:2px dashed #ccc;border-radius:6px;margin:0 auto}
      .print-btn{display:block;margin:12px auto;background:#e8241a;color:#fff;border:none;border-radius:6px;padding:10px 28px;font-size:14px;font-weight:700;cursor:pointer}
    }
    @media print{
      body{width:4in;height:4in}
      .label{width:4in;height:4in}
      .print-btn{display:none}
    }
  </style></head><body>
  <div class="label">
    <div class="header">
      <div>
        <div class="co">SHIPLY<span>CO</span></div>
        <div class="cosub">Fulfillment</div>
      </div>
      <div>
        <div class="pnum-lbl">Pallet</div>
        <div class="pnum">${palletNum}</div>
      </div>
    </div>
    <div class="rows">
      <div class="row"><span class="lbl">Truck</span><span class="val">${truck.name}</span></div>
      <div class="row"><span class="lbl">Customer</span><span class="val">${cust?.name||truck.custId}</span></div>
      <div class="row"><span class="lbl">Date</span><span class="val">${truck.date}</span></div>
      <div class="row"><span class="lbl">Location</span><span class="val" style="color:#e8241a;font-size:14px">${loc}</span></div>
      ${skuSummary?`<div class="skus">${skuSummary}</div>`:''}
    </div>
    <div class="barcode-wrap">
      <svg id="bc" style="max-width:100%;display:block;margin:0 auto"></svg>
      <div class="barcode-id">${barcodeVal}</div>
    </div>
  </div>
  <button class="print-btn" onclick="window.print()">🖨 Print 4×4 Label</button>
  <scr`+`ipt src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js"></scr`+`ipt>
  <scr`+`ipt>
    window.onload=()=>{
      JsBarcode('#bc','${barcodeVal}',{format:'CODE128',width:1.8,height:55,displayValue:false,margin:4});
    };
  </scr`+`ipt>
  
  <!-- Buy Label Modal -->
  <div id="buyLabelModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:6000;align-items:center;justify-content:center;padding:20px">
    <div style="background:var(--surface);border-radius:12px;width:100%;max-width:440px">
      <div class="modal-head">
        <span class="modal-title">Ship To — Recipient Details</span>
        <button class="modal-close" onclick="document.getElementById('buyLabelModal').style.display='none'">×</button>
      </div>
      <div class="modal-body">
        <div class="field" style="margin-bottom:10px"><label>Recipient Name *</label>
          <input id="bl_name" placeholder="Full name or company" style="width:100%"/>
        </div>
        <div class="field" style="margin-bottom:10px"><label>Street Address *</label>
          <input id="bl_addr" placeholder="123 Main St" style="width:100%"/>
        </div>
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin-bottom:10px">
          <div class="field" style="margin:0"><label>City *</label>
            <input id="bl_city" placeholder="City" style="width:100%"/>
          </div>
          <div class="field" style="margin:0"><label>State *</label>
            <input id="bl_state" placeholder="TX" maxlength="2" style="width:100%"/>
          </div>
          <div class="field" style="margin:0"><label>ZIP *</label>
            <input id="bl_zip" placeholder="77001" maxlength="5" style="width:100%"/>
          </div>
        </div>
        <div class="field" style="margin-bottom:0"><label>Phone</label>
          <input id="bl_phone" placeholder="+1 (713) 555-0000" style="width:100%"/>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="document.getElementById('buyLabelModal').style.display='none'">Cancel</button>
        <button class="btn btn-red" onclick="submitBuyLabel()">Generate Label</button>
      </div>
    </div>
  </div>

  <!-- Pallet Detail Modal -->
  <div id="palletDetailModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:6000;align-items:center;justify-content:center;padding:20px">
    <div style="background:var(--surface);border-radius:12px;width:100%;max-width:600px;max-height:90vh;display:flex;flex-direction:column">
      <div class="modal-head">
        <span class="modal-title" id="palletDetailTitle">Pallet Detail</span>
        <button class="modal-close" onclick="document.getElementById('palletDetailModal').style.display='none'">×</button>
      </div>
      <div class="modal-body" id="palletDetailBody" style="overflow-y:auto;flex:1"></div>
    </div>
  </div>
</body></html>`);
  win.document.close();
}

// ═══════════════════════════════════════════════════════════════
// ── RECEIVING SYSTEM — One pallet at a time, scan-to-populate ──
// ═══════════════════════════════════════════════════════════════

let _activeTruckId = null;   // truck currently being received
let _activePalletNum = 1;    // current pallet in scan flow
let _skuCache = {};          // UPC/SKU → item info from past receives

// Load SKU cache from past pallets
async function loadSkuCache(){
  try{
    const {data} = await sb.from('pallets').select('items').limit(500);
    (data||[]).forEach(p=>{
      (p.items||[]).forEach(item=>{
        if(item.upc)  _skuCache[item.upc]  = item;
        if(item.sku)  _skuCache[item.sku]  = item;
        if(item.itemNum) _skuCache[item.itemNum] = item;
      });
    });
  }catch(e){ console.warn('SKU cache load error:',e); }
}

// ── NEW TRUCK MODAL (just truck info, no pallets yet) ──
function openNewTruckModal(){
  loadSkuCache();
  document.getElementById('newTruckModal').style.display='flex';
  // reset
  document.getElementById('nt_name').value='';
  document.getElementById('nt_pallets').value='';
  if(document.getElementById('nt_store')) document.getElementById('nt_store').value='';
  // Show walmart fields if platinum is default selected
  const custSel = document.getElementById('nt_cust');
  if(custSel) ntToggleWalmartFields(custSel.value);
}

function ntToggleWalmartFields(custId){
  const cust = CUSTOMERS.find(c=>c.id===custId);
  const isWalmart = cust?.rateNote?.toLowerCase().includes('walmart') || custId==='platinum';
  document.getElementById('nt_walmart_fields').style.display = isWalmart ? 'block' : 'none';
}

function openTaraForTruck(){
  if(!TARA_OPEN) toggleTara();
  setTimeout(()=>{
    const input=document.getElementById('taraInput');
    if(input){input.focus();input.placeholder='Tell me about the truck — pallets, origin, what you see on the boxes…';}
  },200);
}

async function saveNewTruck(){
  const name = document.getElementById('nt_name')?.value.trim()||('Truck #'+(TRUCKS_INPROGRESS.length+1));
  const custId = document.getElementById('nt_cust')?.value||'platinum';
  const date = document.getElementById('nt_date')?.value||new Date().toISOString().split('T')[0];
  const origin = document.getElementById('nt_origin')?.value||'TX';
  const store = document.getElementById('nt_store')?.value.trim()||'';
  const totalPallets = parseInt(document.getElementById('nt_pallets')?.value)||1;

  const truckId='TIP-'+(Date.now()%100000).toString().padStart(5,'0');

  try{
    // Save truck — no pallet count needed upfront
    const {error:te} = await sb.from('trucks').insert([{
      id: truckId, name, cust_id: custId,
      date: new Date(date).toISOString().split('T')[0],
      origin, store, total_pallets: 0,
      status: 'receiving', received_by: currentEmployee||'',
      notes:'', bol_url:'', receipt_url:''
    }]);
    if(te) throw te;

    const truck = {id:truckId,name,custId,date:new Date(date).toLocaleDateString(),origin,store,totalPallets:0,bol:'',receipt:'',status:'receiving',receivedBy:currentEmployee||'',notes:'',pallets:[]};
    TRUCKS_INPROGRESS.unshift(truck);

    document.getElementById('newTruckModal').style.display='none';
    showToast('✓ '+name+' started — pull the first pallet!');
    injectTara();

    // Go straight to first pallet
    _activeTruckId = truckId;
    _activePalletNum = 1;
    showPage('entry');
    setTimeout(()=>openScanPallet(truckId, 1), 300);
  }catch(e){
    showToast('Error: '+e.message);
  }
}

// ── SCAN PALLET MODAL — one pallet at a time ──
let _scanSkus = []; // array of {upc, sku, itemNum, brand, category, type, desc, cases, ...}

async function openScanPallet(truckId, palletNum){
  _activeTruckId = truckId;
  _activePalletNum = palletNum;
  _scanSkus = [];
  _expandedSkus = {};

  const truck = TRUCKS_INPROGRESS.find(t=>t.id===truckId);
  if(!truck){ showToast('Truck not found'); return; }

  // Find or create pallet
  let pallet = truck.pallets.find(p=>p.num===palletNum);
  if(!pallet){
    // Create new pallet in Supabase on the fly
    try{
      const {data, error} = await sb.from('pallets').insert([{
        truck_id: truckId, pallet_num: palletNum, stage:1, location:'', items:[]
      }]).select();
      if(error) throw error;
      pallet = {id: data[0].id, num:palletNum, stage:1, loc:'', items:[]};
      truck.pallets.push(pallet);
      // Update truck pallet count in Supabase
      truck.totalPallets = Math.max(truck.totalPallets||0, palletNum);
      sb.from('trucks').update({total_pallets: truck.totalPallets}).eq('id', truckId);
    }catch(e){
      // Offline fallback
      pallet = {id:null, num:palletNum, stage:1, loc:'', items:[]};
      truck.pallets.push(pallet);
    }
  }

  // Pre-load existing items
  if(pallet.items&&pallet.items.length>0){
    _scanSkus = pallet.items.map(item=>({...item}));
  }

  document.getElementById('scanPalletModal').style.display='flex';
  document.getElementById('sp_title').textContent = truck.name+' — Pallet '+palletNum;
  // Set location dropdown with existing value
  // Pre-fill location search
  const locSearch = document.getElementById('sp_loc_search');
  const locHidden = document.getElementById('sp_loc');
  if(locSearch) locSearch.value = pallet.loc||'';
  if(locHidden) locHidden.value = pallet.loc||'';
  renderScanSkus();

  setTimeout(()=>document.getElementById('sp_scan_input')?.focus(), 200);
}

const WAREHOUSE_LOCS_REGULAR = ['A04-A','A04-B','A05-A','A05-B','A06-A','A06-B','A07-A','A07-B','A08-A','A08-B','A09-A','A09-B','A10-A','A10-B','A11-A','A11-B','A12-A','A12-B','A13-A','A13-B','A14-A','A14-B','A15-A','A15-B','A16-A','A16-B','A17-A','A17-B','A18-A','A18-B','A19-A','A19-B','A20-A','A20-B','A21-A','A21-B','A22-A','A22-B','A23-A','A23-B','A24-A','A24-B','A25-A','A25-B','A26-A','A26-B','B01-A','B01-B','B02-A','B02-B','B03-A','B03-B','B04-A','B04-B','B05-A','B05-B','B06-A','B06-B','B07-A','B07-B','B08-A','B08-B','B09-A','B09-B','B10-A','B10-B','B11-A','B11-B','B12-A','B12-B','B13-A','B13-B','B14-A','B14-B','B15-A','B15-B','B16-A','B16-B','B17-A','B17-B','B18-A','B18-B','B01-C','B02-C','B03-C','B04-C','B05-C','B06-C','B07-C','B08-C','B09-C','B10-C','B11-C','B12-C','B13-C','B14-C','B15-C','B16-C','B17-C','B18-C','C01-A','C01-B','C02-A','C02-B','C03-A','C03-B','C04-A','C04-B','C05-A','C05-B','C06-A','C06-B','C07-A','C07-B','C08-A','C08-B','C09-A','C09-B','C10-A','C10-B','C11-A','C11-B','C12-A','C12-B','C13-A','C13-B','C14-A','C14-B','C15-A','C15-B','C16-A','C16-B','C17-A','C17-B','C18-A','C18-B','C19-A','C19-B','C20-A','C20-B','C21-A','C21-B','C22-A','C22-B','C23-A','C23-B','C24-A','C24-B','C25-A','C25-B','C26-A','C26-B','C03-C','C04-C','C05-C','C06-C','C07-C','C08-C','C09-C','C10-C','C11-C','C12-C','C13-C','C14-C','C15-C','C16-C','C17-C','C18-C','C19-C','C20-C','C21-C','C22-C','C23-C','C24-C','C25-C','C26-C','D01-A','D01-B','D02-A','D02-B','D03-A','D03-B','D04-A','D04-B','D05-A','D05-B','D06-A','D06-B','D07-A','D07-B','D08-A','D08-B','D09-A','D09-B','D10-A','D10-B','D11-A','D11-B','D12-A','D12-B','D13-A','D13-B','D14-A','D14-B','D15-A','D15-B','D16-A','D16-B','D17-A','D17-B','D18-A','D18-B','D19-A','D19-B','D20-A','D20-B','D21-A','D21-B','D22-A','D22-B','D23-A','D23-B','D24-A','D24-B','D25-A','D25-B','D26-A','D26-B','E01-A','E01-B','E02-A','E02-B','E03-A','E03-B','E04-A','E04-B','E05-A','E05-B','E06-A','E06-B','E07-A','E07-B','E08-A','E08-B','E09-A','E09-B','E10-A','E10-B','E11-A','E11-B','E12-A','E12-B','E13-A','E13-B','E14-A','E14-B','E15-A','E15-B','E16-A','E16-B','E17-A','E17-B','E18-A','E18-B','E19-A','E19-B','E20-A','E20-B','E21-A','E21-B','E22-A','E22-B','E23-A','E23-B','E24-A','E24-B','E25-A','E25-B','E26-A','E26-B','F01-A','F01-B','F02-A','F02-B','F03-A','F03-B','F04-A','F04-B','F05-A','F05-B','F06-A','F06-B','F07-A','F07-B','F08-A','F08-B','F09-A','F09-B','F10-A','F10-B','F11-A','F11-B','F12-A','F12-B','F13-A','F13-B','F14-A','F14-B','F15-A','F15-B','F16-A','F16-B','F17-A','F17-B','F18-A','F18-B','F19-A','F19-B','F20-A','F20-B','F21-A','F21-B','F22-A','F22-B','F23-A','F23-B','F24-A','F24-B','F25-A','F25-B','F26-A','F26-B','G01-A','G01-B','G02-A','G02-B','G03-A','G03-B','G04-A','G04-B','G05-A','G05-B','G06-A','G06-B','G07-A','G07-B','G08-A','G08-B','G09-A','G09-B','G10-A','G10-B','G11-A','G11-B','G12-A','G12-B','G13-A','G13-B','G14-A','G14-B','G15-A','G15-B','G16-A','G16-B','G17-A','G17-B','G18-A','G18-B','G19-A','G19-B','G20-A','G20-B','G21-A','G21-B','G22-A','G22-B','G23-A','G23-B','G24-A','G24-B','G25-A','G25-B','G26-A','G26-B','H01-A','H01-B','H02-A','H02-B','H03-A','H03-B','H04-A','H04-B','H05-A','H05-B','H06-A','H06-B','H07-A','H07-B','H08-A','H08-B','H09-A','H09-B','H10-A','H10-B','H11-A','H11-B','H12-A','H12-B','H13-A','H13-B','H14-A','H14-B','H15-A','H15-B','H16-A','H16-B','H17-A','H17-B','H18-A','H18-B','H19-A','H19-B','H20-A','H20-B','H21-A','H21-B','H22-A','H22-B','H23-A','H23-B','H24-A','H24-B','H25-A','H25-B','H26-A','H26-B','I01-A','I01-B','I02-A','I02-B','I03-A','I03-B','I04-A','I04-B','I05-A','I05-B','I06-A','I06-B','I07-A','I07-B','I08-A','I08-B','I09-A','I09-B','I10-A','I10-B','I11-A','I11-B','I12-A','I12-B','I13-A','I13-B','I14-A','I14-B','I15-A','I15-B','I16-A','I16-B','I17-A','I17-B','I18-A','I18-B','I19-A','I19-B','I20-A','I20-B','I21-A','I21-B','I22-A','I22-B','I23-A','I23-B','I24-A','I24-B','I25-A','I25-B','I26-A','I26-B','J01-A','J01-B','J02-A','J02-B','J03-A','J03-B','J04-A','J04-B','J05-A','J05-B','J06-A','J06-B','J07-A','J07-B','J08-A','J08-B','J09-A','J09-B','J10-A','J10-B','J11-A','J11-B','J12-A','J12-B','J13-A','J13-B','J14-A','J14-B','J15-A','J15-B','J16-A','J16-B','J17-A','J17-B','J18-A','J18-B','J19-A','J19-B','J20-A','J20-B','J21-A','J21-B','J22-A','J22-B','J23-A','J23-B','J24-A','J24-B','J25-A','J25-B','J26-A','J26-B','K01-A','K01-B','K02-A','K02-B','K03-A','K03-B','K04-A','K04-B','K05-A','K05-B','K06-A','K06-B','K07-A','K07-B','K08-A','K08-B','K09-A','K09-B','K10-A','K10-B','K11-A','K11-B','K12-A','K12-B','K13-A','K13-B','K14-A','K14-B','K15-A','K15-B','K16-A','K16-B','K17-A','K17-B','K18-A','K18-B','K19-A','K19-B','K20-A','K20-B','K21-A','K21-B','K22-A','K22-B','K23-A','K23-B','K24-A','K24-B','K25-A','K25-B','K26-A','K26-B','L01-A','L01-B','L02-A','L02-B','L03-A','L03-B','L04-A','L04-B','L05-A','L05-B','L06-A','L06-B','L07-A','L07-B','L08-A','L08-B','L09-A','L09-B','L10-A','L10-B','L11-A','L11-B','L12-A','L12-B','L13-A','L13-B','L14-A','L14-B','L15-A','L15-B','L16-A','L16-B','L17-A','L17-B','L18-A','L18-B','L19-A','L19-B','L20-A','L20-B','L21-A','L21-B','L22-A','L22-B','L23-A','L23-B','L24-A','L24-B','L25-A','L25-B','L26-A','L26-B','M01-A','M01-B','M02-A','M02-B','M03-A','M03-B','M04-A','M04-B','M05-A','M05-B','M06-A','M06-B','M07-A','M07-B','M08-A','M08-B','M09-A','M09-B','M10-A','M10-B','M11-A','M11-B','M12-A','M12-B','M13-A','M13-B','M14-A','M14-B','M15-A','M15-B','M16-A','M16-B','M17-A','M17-B','M18-A','M18-B','M19-A','M19-B','M20-A','M20-B','M21-A','M21-B','M22-A','M22-B','M23-A','M23-B','M24-A','M24-B','M25-A','M25-B','M26-A','M26-B','N01-A','N01-B','N02-A','N02-B','N03-A','N03-B','N04-A','N04-B','N05-A','N05-B','N06-A','N06-B','N07-A','N07-B','N08-A','N08-B','N09-A','N09-B','N10-A','N10-B','N11-A','N11-B','N12-A','N12-B','N13-A','N13-B','N14-A','N14-B','N15-A','N15-B','N16-A','N16-B','N17-A','N17-B','N18-A','N18-B','N19-A','N19-B','N20-A','N20-B','N21-A','N21-B','N22-A','N22-B','N23-A','N23-B','N24-A','N24-B','N25-A','N25-B','N26-A','N26-B','O01-A','O01-B','O02-A','O02-B','O03-A','O03-B','O04-A','O04-B','O05-A','O05-B','O06-A','O06-B','O07-A','O07-B','O08-A','O08-B','O09-A','O09-B','O10-A','O10-B','O11-A','O11-B','O12-A','O12-B','O13-A','O13-B','O14-A','O14-B','O15-A','O15-B','O16-A','O16-B','O17-A','O17-B','O18-A','O18-B','O19-A','O19-B','O20-A','O20-B','O21-A','O21-B','O22-A','O22-B','O23-A','O23-B','O24-A','O24-B','O25-A','O25-B','O26-A','O26-B','P01-A','P01-B','P02-A','P02-B','P03-A','P03-B','P04-A','P04-B','P05-A','P05-B','P06-A','P06-B','P07-A','P07-B','P08-A','P08-B','P09-A','P09-B','P10-A','P10-B','P11-A','P11-B','P12-A','P12-B','P13-A','P13-B','P14-A','P14-B','P15-A','P15-B','P16-A','P16-B','P17-A','P17-B','P18-A','P18-B','P19-A','P19-B','P20-A','P20-B','P21-A','P21-B','P22-A','P22-B','P23-A','P23-B','P24-A','P24-B','P25-A','P25-B','P26-A','P26-B','Q01-A','Q01-B','Q02-A','Q02-B','Q03-A','Q03-B','Q04-A','Q04-B','Q05-A','Q05-B','Q06-A','Q06-B','Q07-A','Q07-B','Q08-A','Q08-B','Q09-A','Q09-B','Q10-A','Q10-B','Q11-A','Q11-B','Q12-A','Q12-B','Q13-A','Q13-B','Q14-A','Q14-B','Q15-A','Q15-B','Q16-A','Q16-B','Q17-A','Q17-B','Q18-A','Q18-B','Q19-A','Q19-B','Q20-A','Q20-B','Q21-A','Q21-B','Q22-A','Q22-B','Q23-A','Q23-B','Q24-A','Q24-B','Q25-A','Q25-B','Q26-A','Q26-B','R01-A','R01-B','R02-A','R02-B','R03-A','R03-B','R04-A','R04-B','R05-A','R05-B','R06-A','R06-B','R07-A','R07-B','R08-A','R08-B','R09-A','R09-B','R10-A','R10-B','R11-A','R11-B','R12-A','R12-B','R13-A','R13-B','R14-A','R14-B','R15-A','R15-B','R16-A','R16-B','R17-A','R17-B','R18-A','R18-B','R19-A','R19-B','R20-A','R20-B','R21-A','R21-B','R22-A','R22-B','R23-A','R23-B','R24-A','R24-B','R25-A','R25-B','R26-A','R26-B','S01-A','S01-B','S02-A','S02-B','S03-A','S03-B','S04-A','S04-B','S05-A','S05-B','S06-A','S06-B','S07-A','S07-B','S08-A','S08-B','S09-A','S09-B','S10-A','S10-B','S11-A','S11-B','S12-A','S12-B','S13-A','S13-B','S14-A','S14-B','S15-A','S15-B','S16-A','S16-B','S17-A','S17-B','S18-A','S18-B','S19-A','S19-B','S20-A','S20-B','S21-A','S21-B','S22-A','S22-B','S23-A','S23-B','S24-A','S24-B','S25-A','S25-B','S26-A','S26-B','T01-A','T01-B','T02-A','T02-B','T03-A','T03-B','T04-A','T04-B','T05-A','T05-B','T06-A','T06-B','T07-A','T07-B','T08-A','T08-B','T09-A','T09-B','T10-A','T10-B','T11-A','T11-B','T12-A','T12-B','T13-A','T13-B','T14-A','T14-B','T15-A','T15-B','T16-A','T16-B','T17-A','T17-B','T18-A','T18-B','T19-A','T19-B','T20-A','T20-B','T21-A','T21-B','T22-A','T22-B','T23-A','T23-B','T24-A','T24-B','T25-A','T25-B','T26-A','T26-B','U01-A','U01-B','U02-A','U02-B','U03-A','U03-B','U04-A','U04-B','U05-A','U05-B','U06-A','U06-B','U07-A','U07-B','U08-A','U08-B','U09-A','U09-B','U10-A','U10-B','U11-A','U11-B','U12-A','U12-B','U13-A','U13-B','U14-A','U14-B','U15-A','U15-B','U16-A','U16-B','U17-A','U17-B','U18-A','U18-B','U19-A','U19-B','U20-A','U20-B','U21-A','U21-B','U22-A','U22-B','U23-A','U23-B','U24-A','U24-B','U25-A','U25-B','U26-A','U26-B','U27-A','U27-B','U28-A','U28-B','V01-A','V01-B','V02-A','V02-B','V03-A','V03-B','V04-A','V04-B','V05-A','V05-B','V06-A','V06-B','V07-A','V07-B','V08-A','V08-B','V09-A','V09-B','V10-A','V10-B','V11-A','V11-B','V12-A','V12-B','V13-A','V13-B','V14-A','V14-B','V15-A','V15-B','V16-A','V16-B','V17-A','V17-B','V18-A','V18-B','V19-A','V19-B','V20-A','V20-B','V21-A','V21-B','V22-A','V22-B','V23-A','V23-B','V24-A','V24-B','V25-A','V25-B','V26-A','V26-B','W01-A','W01-B','W02-A','W02-B','W03-A','W03-B','W04-A','W04-B','W05-A','W05-B','W06-A','W06-B','W07-A','W07-B','W08-A','W08-B','W09-A','W09-B','W10-A','W10-B','W11-A','W11-B','W12-A','W12-B','W13-A','W13-B','W14-A','W14-B','W15-A','W15-B','W16-A','W16-B','W17-A','W17-B','W18-A','W18-B','W19-A','W19-B','W20-A','W20-B','W21-A','W21-B','W22-A','W22-B','W23-A','W23-B','W24-A','W24-B','W25-A','W25-B','W26-A','W26-B','W27-A','W27-B','W28-A','W28-B','X01-A','X01-B','X02-A','X02-B','X03-A','X03-B','X04-A','X04-B','X05-A','X05-B','X06-A','X06-B','X07-A','X07-B','X08-A','X08-B','X09-A','X09-B','X10-A','X10-B','X11-A','X11-B','X12-A','X12-B','X13-A','X13-B','X14-A','X14-B','X15-A','X15-B','X16-A','X16-B','X17-A','X17-B','X18-A','X18-B','X19-A','X19-B','X20-A','X20-B','X21-A','X21-B','X22-A','X22-B','X23-A','X23-B','X24-A','X24-B','X25-A','X25-B','X26-A','X26-B','X27-A','X27-B','X28-A','X28-B','Y01-A','Y01-B','Y02-A','Y02-B','Y03-A','Y03-B','Y04-A','Y04-B','Y05-A','Y05-B','Y06-A','Y06-B','Y07-A','Y07-B','Y08-A','Y08-B','Y09-A','Y09-B','Y10-A','Y10-B','Y11-A','Y11-B','Y12-A','Y12-B','Y13-A','Y13-B','Y14-A','Y14-B','Y15-A','Y15-B','Y16-A','Y16-B','Y17-A','Y17-B','Y18-A','Y18-B','Y19-A','Y19-B','Y20-A','Y20-B','Y21-A','Y21-B','Y22-A','Y22-B','Y23-A','Y23-B','Y24-A','Y24-B','Y25-A','Y25-B','Y26-A','Y26-B','Y27-A','Y27-B','Y28-A','Y28-B','Z01-A','Z01-B','Z02-A','Z02-B','Z03-A','Z03-B','Z04-A','Z04-B','Z05-A','Z05-B','Z06-A','Z06-B','Z07-A','Z07-B','Z08-A','Z08-B','Z09-A','Z09-B','Z10-A','Z10-B','Z11-A','Z11-B','Z12-A','Z12-B','Z13-A','Z13-B','Z14-A','Z14-B','Z15-A','Z15-B','Z16-A','Z16-B','Z17-A','Z17-B','Z18-A','Z18-B','Z19-A','Z19-B','Z20-A','Z20-B','Z21-A','Z21-B','Z22-A','Z22-B','Z23-A','Z23-B','Z24-A','Z24-B','Z25-A','Z25-B','Z26-A','Z26-B','UU18-A','UU18-B','UU19-A','UU19-B','UU20-A','UU20-B','UU21-A','UU21-B','UU22-A','UU22-B','UU23-A','UU23-B','UU24-A','UU24-B','UU25-A','UU25-B','UU26-A','UU26-B','UU27-A','UU27-B','UU28-A','UU28-B','VV18-A','VV18-B','VV19-A','VV19-B','VV20-A','VV20-B','VV21-A','VV21-B','VV22-A','VV22-B','VV23-A','VV23-B','VV24-A','VV24-B','VV25-A','VV25-B','VV26-A','VV26-B','VV27-A','VV27-B','VV28-A','VV28-B','WW18-A','WW18-B','WW19-A','WW19-B','WW20-A','WW20-B','WW21-A','WW21-B','WW22-A','WW22-B','WW23-A','WW23-B','WW24-A','WW24-B','WW25-A','WW25-B','WW26-A','WW26-B','WW27-A','WW27-B','WW28-A','WW28-B','XX18-A','XX18-B','XX19-A','XX19-B','XX20-A','XX20-B','XX21-A','XX21-B','XX22-A','XX22-B','XX23-A','XX23-B','XX24-A','XX24-B','XX25-A','XX25-B','XX26-A','XX26-B','XX27-A','XX27-B','XX28-A','XX28-B','YY18-A','YY18-B','YY19-A','YY19-B','YY20-A','YY20-B','YY21-A','YY21-B','YY22-A','YY22-B','YY23-A','YY23-B','YY24-A','YY24-B','YY25-A','YY25-B','YY26-A','YY26-B','YY27-A','YY27-B','YY28-A','YY28-B','A01-A','A01-B','A02-A','A02-B','A03-A','A03-B','A01-C','A02-C','A03-C','A04-C'];
const WAREHOUSE_LOCS_STACKED = ['A06-C','A07-C','A08-C','A09-C','A10-C','A11-C','A12-C','A13-C','A14-C','A15-C','A16-C','A17-C','A18-C','A19-C','A20-C','A21-C','A22-C','A23-C','A24-C','A25-C','A26-C'];
const WAREHOUSE_LOCS_OVERFLOW = [];
const WAREHOUSE_LOCS_WALKWAY = ['AA01-A','AA01-B','AA02-A','AA02-B','AA03-A','AA03-B','AA04-A','AA04-B','AA05-A','AA05-B','AA06-A','AA06-B','AA07-A','AA07-B','AA08-A','AA08-B','AA09-A','AA09-B','AA10-A','AA10-B','AA11-A','AA11-B','AA12-A','AA12-B','AA13-A','AA13-B','AA14-A','AA14-B','AA15-A','AA15-B','AA16-A','AA16-B','AA17-A','AA17-B','AA18-A','AA18-B','AA19-A','AA19-B','AA20-A','AA20-B','AA21-A','AA21-B','AA22-A','AA22-B','AA23-A','AA23-B','AA24-A','AA24-B','AA25-A','AA25-B','AA26-A','AA26-B','BB01-A','BB01-B','BB02-A','BB02-B','BB03-A','BB03-B','BB04-A','BB04-B','BB05-A','BB05-B','BB06-A','BB06-B','BB07-A','BB07-B','BB08-A','BB08-B','BB09-A','BB09-B','BB10-A','BB10-B','BB11-A','BB11-B','BB12-A','BB12-B','BB13-A','BB13-B','BB14-A','BB14-B','BB15-A','BB15-B','BB16-A','BB16-B','BB17-A','BB17-B','BB18-A','BB18-B','BB19-A','BB19-B','BB20-A','BB20-B','BB21-A','BB21-B','BB22-A','BB22-B','BB23-A','BB23-B','BB24-A','BB24-B','BB25-A','BB25-B','BB26-A','BB26-B','CC01-A','CC01-B','CC02-A','CC02-B','CC03-A','CC03-B','CC04-A','CC04-B','CC05-A','CC05-B','CC06-A','CC06-B','CC07-A','CC07-B','CC08-A','CC08-B','CC09-A','CC09-B','CC10-A','CC10-B','CC11-A','CC11-B','CC12-A','CC12-B','CC13-A','CC13-B','CC14-A','CC14-B','CC15-A','CC15-B','CC16-A','CC16-B','CC17-A','CC17-B','CC18-A','CC18-B','CC19-A','CC19-B','CC20-A','CC20-B','CC21-A','CC21-B','CC22-A','CC22-B','CC23-A','CC23-B','CC24-A','CC24-B','CC25-A','CC25-B','CC26-A','CC26-B','EE01-A','EE01-B','EE02-A','EE02-B','EE03-A','EE03-B','EE04-A','EE04-B','EE05-A','EE05-B','EE06-A','EE06-B','EE07-A','EE07-B','EE08-A','EE08-B','EE09-A','EE09-B','EE10-A','EE10-B','EE11-A','EE11-B','EE12-A','EE12-B','EE13-A','EE13-B','EE14-A','EE14-B','EE15-A','EE15-B','EE16-A','EE16-B','EE17-A','EE17-B','EE18-A','EE18-B','EE19-A','EE19-B','EE20-A','EE20-B','EE21-A','EE21-B','EE22-A','EE22-B','EE23-A','EE23-B','EE24-A','EE24-B','EE25-A','EE25-B','EE26-A','EE26-B','GG01-A','GG01-B','GG02-A','GG02-B','GG03-A','GG03-B','GG04-A','GG04-B','GG05-A','GG05-B','GG06-A','GG06-B','GG07-A','GG07-B','GG08-A','GG08-B','GG09-A','GG09-B','GG10-A','GG10-B','GG11-A','GG11-B','GG12-A','GG12-B','GG13-A','GG13-B','GG14-A','GG14-B','GG15-A','GG15-B','GG16-A','GG16-B','GG17-A','GG17-B','GG18-A','GG18-B','GG19-A','GG19-B','GG20-A','GG20-B','GG21-A','GG21-B','GG22-A','GG22-B','GG23-A','GG23-B','GG24-A','GG24-B','GG25-A','GG25-B','GG26-A','GG26-B','II01-A','II01-B','II02-A','II02-B','II03-A','II03-B','II04-A','II04-B','II05-A','II05-B','II06-A','II06-B','II07-A','II07-B','II08-A','II08-B','II09-A','II09-B','II10-A','II10-B','II11-A','II11-B','II12-A','II12-B','II13-A','II13-B','II14-A','II14-B','II15-A','II15-B','II16-A','II16-B','II17-A','II17-B','II18-A','II18-B','II19-A','II19-B','II20-A','II20-B','II21-A','II21-B','II22-A','II22-B','II23-A','II23-B','II24-A','II24-B','II25-A','II25-B','II26-A','II26-B','KK01-A','KK01-B','KK02-A','KK02-B','KK03-A','KK03-B','KK04-A','KK04-B','KK05-A','KK05-B','KK06-A','KK06-B','KK07-A','KK07-B','KK08-A','KK08-B','KK09-A','KK09-B','KK10-A','KK10-B','KK11-A','KK11-B','KK12-A','KK12-B','KK13-A','KK13-B','KK14-A','KK14-B','KK15-A','KK15-B','KK16-A','KK16-B','KK17-A','KK17-B','KK18-A','KK18-B','KK19-A','KK19-B','KK20-A','KK20-B','KK21-A','KK21-B','KK22-A','KK22-B','KK23-A','KK23-B','KK24-A','KK24-B','KK25-A','KK25-B','KK26-A','KK26-B','MM01-A','MM01-B','MM02-A','MM02-B','MM03-A','MM03-B','MM04-A','MM04-B','MM05-A','MM05-B','MM06-A','MM06-B','MM07-A','MM07-B','MM08-A','MM08-B','MM09-A','MM09-B','MM10-A','MM10-B','MM11-A','MM11-B','MM12-A','MM12-B','MM13-A','MM13-B','MM14-A','MM14-B','MM15-A','MM15-B','MM16-A','MM16-B','MM17-A','MM17-B','MM18-A','MM18-B','MM19-A','MM19-B','MM20-A','MM20-B','MM21-A','MM21-B','MM22-A','MM22-B','MM23-A','MM23-B','MM24-A','MM24-B','MM25-A','MM25-B','MM26-A','MM26-B','OO01-A','OO01-B','OO02-A','OO02-B','OO03-A','OO03-B','OO04-A','OO04-B','OO05-A','OO05-B','OO06-A','OO06-B','OO07-A','OO07-B','OO08-A','OO08-B','OO09-A','OO09-B','OO10-A','OO10-B','OO11-A','OO11-B','OO12-A','OO12-B','OO13-A','OO13-B','OO14-A','OO14-B','OO15-A','OO15-B','OO16-A','OO16-B','OO17-A','OO17-B','OO18-A','OO18-B','OO19-A','OO19-B','OO20-A','OO20-B','OO21-A','OO21-B','OO22-A','OO22-B','OO23-A','OO23-B','OO24-A','OO24-B','OO25-A','OO25-B','OO26-A','OO26-B','QQ01-A','QQ01-B','QQ02-A','QQ02-B','QQ03-A','QQ03-B','QQ04-A','QQ04-B','QQ05-A','QQ05-B','QQ06-A','QQ06-B','QQ07-A','QQ07-B','QQ08-A','QQ08-B','QQ09-A','QQ09-B','QQ10-A','QQ10-B','QQ11-A','QQ11-B','QQ12-A','QQ12-B','QQ13-A','QQ13-B','QQ14-A','QQ14-B','QQ15-A','QQ15-B','QQ16-A','QQ16-B','QQ17-A','QQ17-B','QQ18-A','QQ18-B','QQ19-A','QQ19-B','QQ20-A','QQ20-B','QQ21-A','QQ21-B','QQ22-A','QQ22-B','QQ23-A','QQ23-B','QQ24-A','QQ24-B','QQ25-A','QQ25-B','QQ26-A','QQ26-B','SS01-A','SS01-B','SS02-A','SS02-B','SS03-A','SS03-B','SS04-A','SS04-B','SS05-A','SS05-B','SS06-A','SS06-B','SS07-A','SS07-B','SS08-A','SS08-B','SS09-A','SS09-B','SS10-A','SS10-B','SS11-A','SS11-B','SS12-A','SS12-B','SS13-A','SS13-B','SS14-A','SS14-B','SS15-A','SS15-B','SS16-A','SS16-B','SS17-A','SS17-B','SS18-A','SS18-B','SS19-A','SS19-B','SS20-A','SS20-B','SS21-A','SS21-B','SS22-A','SS22-B','SS23-A','SS23-B','SS24-A','SS24-B','SS25-A','SS25-B','SS26-A','SS26-B','UU01-A','UU01-B','UU02-A','UU02-B','UU03-A','UU03-B','UU04-A','UU04-B','UU05-A','UU05-B','UU06-A','UU06-B','UU07-A','UU07-B','UU08-A','UU08-B','UU09-A','UU09-B','UU10-A','UU10-B','UU11-A','UU11-B','UU12-A','UU12-B','UU13-A','UU13-B','UU14-A','UU14-B','UU15-A','UU15-B','UU16-A','UU16-B','UU17-A','UU17-B','VV01-A','VV01-B','VV02-A','VV02-B','VV03-A','VV03-B','VV04-A','VV04-B','VV05-A','VV05-B','VV06-A','VV06-B','VV07-A','VV07-B','VV08-A','VV08-B','VV09-A','VV09-B','VV10-A','VV10-B','VV11-A','VV11-B','VV12-A','VV12-B','VV13-A','VV13-B','VV14-A','VV14-B','VV15-A','VV15-B','VV16-A','VV16-B','VV17-A','VV17-B','WW01-A','WW01-B','WW02-A','WW02-B','WW03-A','WW03-B','WW04-A','WW04-B','WW05-A','WW05-B','WW06-A','WW06-B','WW07-A','WW07-B','WW08-A','WW08-B','WW09-A','WW09-B','WW10-A','WW10-B','WW11-A','WW11-B','WW12-A','WW12-B','WW13-A','WW13-B','WW14-A','WW14-B','WW15-A','WW15-B','WW16-A','WW16-B','WW17-A','WW17-B','XX01-A','XX01-B','XX02-A','XX02-B','XX03-A','XX03-B','XX04-A','XX04-B','XX05-A','XX05-B','XX06-A','XX06-B','XX07-A','XX07-B','XX08-A','XX08-B','XX09-A','XX09-B','XX10-A','XX10-B','XX11-A','XX11-B','XX12-A','XX12-B','XX13-A','XX13-B','XX14-A','XX14-B','XX15-A','XX15-B','XX16-A','XX16-B','XX17-A','XX17-B','YY01-A','YY01-B','YY02-A','YY02-B','YY03-A','YY03-B','YY04-A','YY04-B','YY05-A','YY05-B','YY06-A','YY06-B','YY07-A','YY07-B','YY08-A','YY08-B','YY09-A','YY09-B','YY10-A','YY10-B','YY11-A','YY11-B','YY12-A','YY12-B','YY13-A','YY13-B','YY14-A','YY14-B','YY15-A','YY15-B','YY16-A','YY16-B','YY17-A','YY17-B','ZZ01-A','ZZ01-B','ZZ02-A','ZZ02-B','ZZ03-A','ZZ03-B','ZZ04-A','ZZ04-B','ZZ05-A','ZZ05-B','ZZ06-A','ZZ06-B','ZZ07-A','ZZ07-B','ZZ08-A','ZZ08-B','ZZ09-A','ZZ09-B','ZZ10-A','ZZ10-B','ZZ11-A','ZZ11-B','ZZ12-A','ZZ12-B','ZZ13-A','ZZ13-B','ZZ14-A','ZZ14-B','ZZ15-A','ZZ15-B','ZZ16-A','ZZ16-B','ZZ17-A','ZZ17-B','ZZ18-A','ZZ18-B','ZZ19-A','ZZ19-B','ZZ20-A','ZZ20-B','ZZ21-A','ZZ21-B','ZZ22-A','ZZ22-B','ZZ23-A','ZZ23-B','ZZ24-A','ZZ24-B','ZZ25-A','ZZ25-B','ZZ26-A','ZZ26-B'];
// All locations combined for search
function _getAllLocs(){
  return [
    ...WAREHOUSE_LOCS_REGULAR.map(l=>({l,type:''})),
    ...WAREHOUSE_LOCS_STACKED.map(l=>({l,type:' (stacked)'})),
    ...WAREHOUSE_LOCS_OVERFLOW.map(l=>({l,type:' (working lane)'})),
    ...WAREHOUSE_LOCS_WALKWAY.map(l=>({l,type:' (walkway)'})),
  ];
}

function filterLocSearch(q){
  const results = document.getElementById('sp_loc_results');
  const hidden = document.getElementById('sp_loc');
  if(!results) return;
  q = q.trim().toUpperCase();
  if(!q){ results.style.display='none'; return; }

  const all = _getAllLocs();
  const matches = all.filter(({l})=>l.toUpperCase().includes(q)).slice(0,30);

  if(matches.length===0){
    results.innerHTML='<div style="padding:10px 14px;color:var(--ink3);font-size:13px">No locations found</div>';
    results.style.display='block';
    return;
  }

  results.innerHTML = matches.map(({l,type})=>`
    <div onclick="selectLoc('${l}')"
      style="padding:10px 14px;cursor:pointer;font-size:13px;font-weight:600;
             border-bottom:1px solid var(--border);display:flex;justify-content:space-between;
             align-items:center;transition:background 0.1s"
      onmouseover="this.style.background='var(--bg)'"
      onmouseout="this.style.background=''">
      <span>${l}</span>
      ${type?`<span style="font-size:10px;color:var(--ink3);font-weight:400">${type}</span>`:''}
    </div>
  `).join('');
  results.style.display='block';
}

function selectLoc(val){
  const search = document.getElementById('sp_loc_search');
  const hidden = document.getElementById('sp_loc');
  const results = document.getElementById('sp_loc_results');
  if(search) search.value = val;
  if(hidden) hidden.value = val;
  if(results) results.style.display='none';
}

function buildLocOptions(sel){
  const mk=(l,sfx)=>'<option value="'+l+'"'+(sel===l?' selected':'')+'>'+l+(sfx?' ('+sfx+')':'')+'</option>';
  return '<option value="">-- Assign location --</option>'
    +'<optgroup label="Regular Storage">'+WAREHOUSE_LOCS_REGULAR.map(l=>mk(l,'')).join('')+'</optgroup>'
    +'<optgroup label="Stacked / No Racking (C-level)">'+WAREHOUSE_LOCS_STACKED.map(l=>mk(l,'stacked')).join('')+'</optgroup>'
    +'<optgroup label="Working Lanes (A01-A03)">'+WAREHOUSE_LOCS_OVERFLOW.map(l=>mk(l,'working lane')).join('')+'</optgroup>'
    +'<optgroup label="Walkways / Overflow Only">'+WAREHOUSE_LOCS_WALKWAY.map(l=>mk(l,'walkway')).join('')+'</optgroup>';
}

let _expandedSkus = {}; // track which SKU cards are expanded

function toggleSkuExpand(i){
  _expandedSkus[i] = !_expandedSkus[i];
  renderScanSkus();
  // refocus scan input after re-render
  setTimeout(()=>document.getElementById('sp_scan_input')?.focus(), 50);
}

function renderScanSkus(){
  const wrap = document.getElementById('sp_skus_wrap');
  if(!wrap) return;
  if(_scanSkus.length===0){
    wrap.innerHTML='<div style="text-align:center;padding:16px;color:var(--ink3);font-size:13px">📦 Scan a box or tap "+ Add Item Manually" to start</div>';
    return;
  }
  wrap.innerHTML = _scanSkus.map((s,i)=>`
    <div id="sp_sku_${i}" style="background:var(--bg);border:1.5px solid ${s._autoFilled?'var(--green)':'var(--border)'};border-radius:8px;margin-bottom:12px;padding:12px">
      <!-- Item header -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:11px;font-weight:800;color:var(--red)">ITEM ${i+1}</span>
          ${s._autoFilled?'<span style="font-size:10px;background:var(--green-bg);color:var(--green);border-radius:4px;padding:1px 6px;font-weight:700">AUTO-FILLED</span>':''}
        </div>
        <button onclick="_scanSkus.splice(${i},1);renderScanSkus()" style="background:none;border:none;color:var(--ink3);cursor:pointer;font-size:18px;line-height:1;padding:0">×</button>
      </div>

      <!-- IDs row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <div class="field" style="margin:0"><label>UPC</label>
          <input value="${s.upc||''}" onchange="_scanSkus[${i}].upc=this.value" placeholder="Scan or type UPC" style="font-family:monospace;font-size:12px;width:100%"/>
        </div>
        <div class="field" style="margin:0"><label>Item # / SKU</label>
          <input value="${s.sku||s.itemNum||''}" onchange="_scanSkus[${i}].sku=this.value;_scanSkus[${i}].itemNum=this.value" placeholder="Item #" style="font-size:12px;width:100%"/>
        </div>
      </div>

      <!-- Descriptions -->
      <div class="field" style="margin-bottom:8px"><label>Outer Carton Description <span style="font-weight:400;color:var(--ink3)">(what's printed on the box)</span></label>
        <input value="${s.cartonDesc||''}" onchange="_scanSkus[${i}].cartonDesc=this.value" placeholder="e.g. Mainstays Blackout Curtains 84in — Assorted" style="font-size:12px;width:100%"/>
      </div>
      <div class="field" style="margin-bottom:8px"><label>Item Description <span style="font-weight:400;color:var(--ink3)">(individual product)</span></label>
        <input value="${s.desc||''}" onchange="_scanSkus[${i}].desc=this.value" placeholder="e.g. 84in Blackout Panel — Gray Medallion" style="font-size:12px;width:100%"/>
      </div>

      <!-- Color / Size -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <div class="field" style="margin:0"><label>Color</label>
          <input value="${s.color||''}" onchange="_scanSkus[${i}].color=this.value" placeholder="Color / Assorted" style="font-size:12px;width:100%"/>
        </div>
        <div class="field" style="margin:0"><label>Size</label>
          <input value="${s.size||''}" onchange="_scanSkus[${i}].size=this.value" placeholder="Size / Assorted" style="font-size:12px;width:100%"/>
        </div>
      </div>

      <!-- Case counts -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px">
        <div class="field" style="margin:0">
          <label>Case Count <span style="font-weight:400;color:var(--ink3)">(# of outer cartons)</span></label>
          <input type="number" value="${s.caseCount||s.cases||1}" onchange="_scanSkus[${i}].caseCount=+this.value" placeholder="0" style="font-size:15px;font-weight:900;color:var(--red);width:100%;text-align:center"/>
        </div>
        <div class="field" style="margin:0">
          <label>Casepack <span style="font-weight:400;color:var(--ink3)">(units per carton)</span></label>
          <input type="number" value="${s.casepack||''}" onchange="_scanSkus[${i}].casepack=+this.value" placeholder="0" style="font-size:13px;width:100%;text-align:center"/>
        </div>
        <div class="field" style="margin:0">
          <label>Inners <span style="font-weight:400;color:var(--ink3)">(inner packs, if any)</span></label>
          <input type="number" value="${s.inners||''}" onchange="_scanSkus[${i}].inners=+this.value" placeholder="0" style="font-size:13px;width:100%;text-align:center"/>
        </div>
      </div>

      <!-- Retail / Condition -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <div class="field" style="margin:0"><label>Retail Price <span style="font-weight:400;color:var(--ink3)">(if on tag)</span></label>
          <input value="${s.retail||''}" onchange="_scanSkus[${i}].retail=this.value" placeholder="$0.00" style="font-size:12px;width:100%"/>
        </div>
        <div class="field" style="margin:0"><label>Condition</label>
          <select onchange="_scanSkus[${i}].cond=this.value" style="font-size:12px;width:100%">
            <option ${(s.cond||'New')==='New'?'selected':''}>New</option>
            <option ${s.cond==='Like New'?'selected':''}>Like New</option>
            <option ${s.cond==='Good'?'selected':''}>Good</option>
            <option ${s.cond==='Fair'?'selected':''}>Fair</option>
            <option ${s.cond==='Damaged'?'selected':''}>Damaged</option>
          </select>
        </div>
      </div>

      <!-- Notes -->
      <div class="field" style="margin:0"><label>Notes</label>
        <input value="${s.notes||''}" onchange="_scanSkus[${i}].notes=this.value" placeholder="Damage, donate markings, special instructions…" style="font-size:12px;width:100%"/>
      </div>
    </div>
  `).join('');
}

// ── CAMERA BARCODE SCANNER ──
let _camStream = null;
let _camInterval = null;

async function startCameraScanner(){
  const wrap = document.getElementById('sp_cam_wrap');
  const video = document.getElementById('sp_cam_video');
  const status = document.getElementById('sp_cam_status');
  const btn = document.getElementById('sp_cam_btn');

  // Check BarcodeDetector support
  if(!('BarcodeDetector' in window)){
    // Fallback: use input[capture] on mobile
    showToast('Camera scanning not supported on this browser — use Chrome on Android or Safari on iPhone');
    return;
  }

  try{
    _camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width:{ideal:1280}, height:{ideal:720} }
    });
    video.srcObject = _camStream;
    wrap.style.display = 'block';
    btn.style.background = 'rgba(30,122,79,0.4)';
    btn.style.borderColor = 'rgba(30,122,79,0.8)';

    const detector = new BarcodeDetector({formats:['ean_13','ean_8','code_128','code_39','upc_a','upc_e','qr_code','data_matrix']});
    let lastVal = '';
    let lastTime = 0;

    _camInterval = setInterval(async()=>{
      if(video.readyState < 2) return;
      try{
        const barcodes = await detector.detect(video);
        if(barcodes.length > 0){
          const val = barcodes[0].rawValue;
          const now = Date.now();
          // Debounce — same barcode within 2s = ignore
          if(val === lastVal && now - lastTime < 2000) return;
          lastVal = val;
          lastTime = now;
          status.textContent = 'Scanned: ' + val;
          status.style.color = '#4caf87';
          // Process the scan
          const fakeEvent = {key:'Enter', target:{value:val}};
          document.getElementById('sp_scan_input').value = val;
          handleScanInput(fakeEvent);
          document.getElementById('sp_scan_input').value = '';
          // Brief flash then continue scanning
          setTimeout(()=>{ status.textContent='Point at next barcode'; status.style.color='#fff'; }, 1500);
        }
      }catch(e){}
    }, 300);

  }catch(e){
    showToast('Camera error: ' + e.message);
  }
}

function stopCameraScanner(){
  if(_camInterval){ clearInterval(_camInterval); _camInterval=null; }
  if(_camStream){ _camStream.getTracks().forEach(t=>t.stop()); _camStream=null; }
  const wrap = document.getElementById('sp_cam_wrap');
  const btn = document.getElementById('sp_cam_btn');
  if(wrap) wrap.style.display='none';
  if(btn){ btn.style.background='rgba(232,36,26,0.3)'; btn.style.borderColor='rgba(232,36,26,0.6)'; }
}

// Stop camera when modal closes
document.addEventListener('click', e=>{
  if(e.target.id==='scanPalletModal') stopCameraScanner();
});

function spAddManual(){
  const newIdx = _scanSkus.length;
  _scanSkus.push({upc:'',sku:'',itemNum:'',brand:'',category:'',type:'',desc:'',cases:1,cond:'New',notes:'',_isNew:true});
  _expandedSkus[newIdx] = true;
  renderScanSkus();
  // Scroll to new item
  setTimeout(()=>{
    const el = document.getElementById('sp_sku_'+newIdx);
    if(el) el.scrollIntoView({behavior:'smooth',block:'nearest'});
  }, 100);
}

// Called when employee scans or types a UPC/SKU and hits Enter
function handleScanInput(e){
  if(e.key !== 'Enter') return;
  const val = e.target.value.trim();
  if(!val) return;
  e.target.value = '';

  // Check if this UPC/SKU already on this pallet
  const existing = _scanSkus.find(s=>s.upc===val||s.sku===val||s.itemNum===val);
  if(existing){
    // Increment case count
    existing.cases = (existing.cases||1) + 1;
    renderScanSkus();
    showToast('+1 case - '+(existing.brand||existing.desc||val)+' ('+existing.cases+' total)');
    return;
  }

  // Look up in SKU cache (from past receives)
  const cached = _skuCache[val];
  if(cached){
    _scanSkus.push({...cached, upc: cached.upc||val, sku: cached.sku||val, itemNum: cached.itemNum||val, cases:1, cond:'New', notes:'', _autoFilled:true});
    // Keep auto-filled collapsed — just show summary
    renderScanSkus();
    showToast('Auto-filled: '+(cached.brand||cached.desc||val));
  } else {
    // New item — auto-expand so employee fills in details
    const isUPC = /^\d{8,14}$/.test(val);
    const newIdx = _scanSkus.length;
    _scanSkus.push({
      upc: isUPC ? val : '', sku: !isUPC ? val : '', itemNum: !isUPC ? val : '',
      brand:'', category:'', type:'', desc:'', cases:1, cond:'New', notes:'', _isNew:true
    });
    _expandedSkus[newIdx] = true; // auto-expand new items
    renderScanSkus();
    showToast('New item — fill in the details below');
  }
  // Keep focus on scan input
  setTimeout(()=>document.getElementById('sp_scan_input')?.focus(), 50);
}

async function saveScanPallet(action){
  const truck = TRUCKS_INPROGRESS.find(t=>t.id===_activeTruckId);
  const pallet = truck?.pallets.find(p=>p.num===_activePalletNum);
  if(!pallet){ showToast('Pallet not found'); return; }

  const loc = document.getElementById('sp_loc')?.value||'';
  const items = _scanSkus.map(s=>({...s, _isNew:undefined, _autoFilled:undefined}));
  const isDone = action === 'done';

  // If marking done, ask for confirmation
  if(isDone){
    confirmAction('Mark Pallet '+_activePalletNum+' as done? You can still edit it later.', async()=>{
      await _doSavePallet(truck, pallet, loc, items, true);
    });
    return;
  }

  await _doSavePallet(truck, pallet, loc, items, false);
}

async function _doSavePallet(truck, pallet, loc, items, markDone){
  pallet.loc = loc;
  pallet.stage = markDone ? 2 : (pallet.stage||1);
  pallet.items = items;

  try{
    if(pallet.id){
      // Update existing pallet
      const {error} = await sb.from('pallets').update({
        stage: pallet.stage,
        location: loc,
        items: items,
      }).eq('id', pallet.id);
      if(error) throw error;
    } else {
      // Create pallet in Supabase (wasn't created yet)
      const {data, error} = await sb.from('pallets').insert([{
        truck_id: truck.id,
        pallet_num: pallet.num,
        stage: pallet.stage,
        location: loc,
        items: items
      }]).select();
      if(error) throw error;
      if(data?.[0]) pallet.id = data[0].id;
    }

    // Update SKU cache
    items.forEach(item=>{
      if(item.upc)     _skuCache[item.upc]     = item;
      if(item.sku)     _skuCache[item.sku]      = item;
      if(item.itemNum) _skuCache[item.itemNum]  = item;
    });

    // Auto-populate SKU catalog with any new items
    await _autoAddToSkuCatalog(items, truck.custId);

    // Close modal
    const modal = document.getElementById('scanPalletModal');
    if(modal) modal.style.display='none';
    if(typeof stopCameraScanner === 'function') stopCameraScanner();

    if(markDone){
      showToast('Pallet '+pallet.num+' done');
      const nextNum = pallet.num + 1;
      showPage('entry');
      injectTara();
      setTimeout(()=>openScanPallet(truck.id, nextNum), 400);
    } else {
      showToast('Saved');
      showPage('entry');
      injectTara();
    }
  }catch(err){
    showToast('Save error: '+err.message);
  }
}

// ── Auto-populate SKU catalog on receive ──
async function _autoAddToSkuCatalog(items, custId){
  if(!items || !items.length || !custId) return;
  const toInsert = [];
  for(const item of items){
    const sku  = (item.sku||item.itemNum||'').trim();
    const upc  = (item.upc||'').trim();
    const name = (item.desc||item.cartonDesc||'').trim();
    if(!sku && !upc && !name) continue;

    // Check if already in catalog (by sku or upc for this customer)
    const key = sku||upc;
    if(key){
      const {data} = await sb.from('sku_catalog')
        .select('id').eq('customer_id', custId)
        .or(`sku.eq.${key},upc.eq.${key}`)
        .limit(1);
      if(data && data.length > 0) continue; // already exists
    }

    toInsert.push({
      id:         crypto.randomUUID(),
      sku:        sku||null,
      upc:        upc||null,
      name:       name||null,
      cust_id:    custId,
      color:      item.color||null,
      size:       item.size||null,
      created_at: new Date().toISOString(),
    });
  }

  if(toInsert.length){
    const {error} = await sb.from('sku_catalog').insert(toInsert);
    if(error) console.warn('SKU catalog insert error:', error.message);
    else console.log('Auto-added '+toInsert.length+' new SKU(s) to catalog');
  }
}

function renderTruckReceivingCard(t){
  const cust=CUSTOMERS.find(c=>c.id===t.custId);
  const done=t.pallets.filter(p=>p.stage>=2).length;
  const total=t.pallets.length;
  const pct=Math.round(done/total*100);
  const allDone=done===total;

  return `
  <div class="card" style="margin-bottom:16px">
    <div class="card-head">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:24px">🚛</span>
        <div>
          <div style="font-weight:800;font-size:15px">${t.name}</div>
          <div style="font-size:12px;color:var(--ink3)">${cust?.name||t.custId} · ${t.date} · ${t.origin} · ${t.totalPallets} pallets</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <button class="act-btn info" onclick="taraNotifyCustomer('${t.id}');if(!TARA_OPEN)toggleTara()">📧 Notify</button>
        <button class="btn" onclick="openScanPallet('${t.id}',${t.pallets.length+1})">+ Next Pallet</button>
        ${t.pallets.length>0?`<button class="btn btn-red" onclick="markTruckFullyReceived('${t.id}')">✓ Truck Complete</button>`:''}
        ${role==='admin'?`<button class="act-btn danger" onclick="deleteTruck('${t.id}','${t.name}')" style="font-size:11px">🗑 Delete</button>`:''}
      </div>
    </div>
    <div style="padding:12px 18px;border-bottom:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">
        <span style="font-weight:600">${total} pallets logged · ${done} fully scanned</span>
        <span style="color:var(--ink3);font-weight:700">${total-done} pending</span>
      </div>
      <div style="background:var(--border);border-radius:4px;height:6px">
        <div style="background:${done===total&&total>0?'var(--green)':'var(--red)'};height:6px;border-radius:4px;width:${total>0?pct:0}%"></div>
      </div>
    </div>
    <div style="padding:16px 18px">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">
        ${t.pallets.map(p=>{
          const done2=p.stage>=2;
          const item=p.items?.[0]||{};
          const skuCount=p.items?.length||0;
          return `<div onclick="openScanPallet('${t.id}',${p.num})"
            style="border:1.5px solid ${done2?'var(--green)':'var(--border)'};border-radius:8px;
                   padding:10px;cursor:pointer;
                   background:${done2?'var(--green-bg)':'var(--surface)'}">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:10px;font-weight:800;color:${done2?'var(--green)':'var(--red)'}">PALLET ${p.num}</span>
              <span style="font-size:12px">${done2?'✅':'📦'}</span>
            </div>
            ${p.loc?`<div style="font-size:10px;color:var(--ink3)">📍 ${p.loc}</div>`:''}
            ${skuCount>0?`<div style="font-size:10px;font-weight:600;margin-top:4px">${skuCount} SKU${skuCount>1?'s':''}</div>`:''}
            ${item.brand?`<div style="font-size:10px;color:var(--ink3)">${item.brand}</div>`:''}
            <div style="font-size:10px;color:${done2?'var(--green)':'var(--red)'};font-weight:600;margin-top:4px">
              ${done2?'✓ Done · tap to edit':'Tap to add items →'}
            </div>
            <div onclick="event.stopPropagation();printPalletLabel('${t.id}',${p.num})"
              style="font-size:10px;color:var(--ink3);margin-top:4px;cursor:pointer">🖨 Print label</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
}

function markTruckFullyReceived(truckId){
  const truck=TRUCKS_INPROGRESS.find(t=>t.id===truckId);
  if(!truck)return;
  const incomplete=truck.pallets.filter(p=>p.stage<2).length;
  if(incomplete>0){
    confirmAction(`${incomplete} pallet${incomplete>1?'s are':' is'} not fully inspected yet. Mark as received anyway?`,()=>{
      truck.status='received';
      showToast(`✓ ${truck.name} marked fully received`);
      injectTara();
      showPage('entry');
    });
    return;
  }
  truck.status='received';
  // Update Supabase
  sb.from('trucks').update({status:'received'}).eq('id',truckId).then(({error})=>{
    if(error) console.warn('Truck status update error:',error);
  });
  showToast(`✅ ${truck.name} fully received — inventory updated`);
  injectTara();
  showPage('entry');
}

async function deleteTruck(truckId, truckName){
  confirmAction('Delete '+truckName+' and all its pallets? This cannot be undone.', async()=>{
    try{
      // Delete pallets first
      await sb.from('pallets').delete().eq('truck_id', truckId);
      // Delete truck
      await sb.from('trucks').delete().eq('id', truckId);
      // Remove from local array
      const idx = TRUCKS_INPROGRESS.findIndex(t=>t.id===truckId);
      if(idx > -1) TRUCKS_INPROGRESS.splice(idx, 1);
      showToast('Truck deleted');
      injectTara();
      showPage('entry');
    }catch(e){
      showToast('Error deleting: '+e.message);
    }
  });
}

function viewCust(id){const c=CUSTOMERS.find(x=>x.id===id);if(c){document.getElementById('hCust').textContent=c.name;showPage('dashboard')}}

// init estimate on billing page load
document.addEventListener('click',e=>{if(e.target.closest('#nv-billing'))setTimeout(calcEst,100)});


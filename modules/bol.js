// ── BILL OF LADING ──
// ══════════════════════════════════════════════

let BOL_COUNTER=1001;
let BOLS=[];

function pgBol(){
  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div class="pg-title">Bill of Lading</div>
      <div class="pg-sub">Generate, print, and track BOLs for all outbound freight shipments</div>
    </div>
    <button class="btn btn-red" onclick="openBolModal()">${ico('plus',13)} Create BOL</button>
  </div>

  <div class="stats" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat"><div class="stat-lbl">Total BOLs</div><div class="stat-val">${BOLS.length}</div></div>
    <div class="stat"><div class="stat-lbl">Pending Pickup</div><div class="stat-val" style="color:var(--orange)">${BOLS.filter(b=>b.status==='pending').length}</div></div>
    <div class="stat"><div class="stat-lbl">In Transit</div><div class="stat-val" style="color:var(--blue)">${BOLS.filter(b=>b.status==='intransit').length}</div></div>
    <div class="stat"><div class="stat-lbl">Delivered</div><div class="stat-val" style="color:var(--green)">${BOLS.filter(b=>b.status==='delivered').length}</div></div>
  </div>

  ${BOLS.length ? `
  <div class="card">
    <div style="overflow-x:auto"><table>
      <thead><tr><th>BOL #</th><th>Customer</th><th>Carrier</th><th>Origin → Destination</th><th>Pieces</th><th>Weight</th><th>Date</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${BOLS.map(b=>{
          const cust=CUSTOMERS.find(c=>c.id===b.custId);
          return `<tr>
            <td class="mono" style="font-weight:800;color:var(--red)">${b.bolNum}</td>
            <td>${cust?.name||b.custId}</td>
            <td>${b.carrier}</td>
            <td style="font-size:11px">${b.origin} → ${b.dest}</td>
            <td>${b.pieces}</td>
            <td>${b.weight} lbs</td>
            <td style="font-size:11px">${b.date}</td>
            <td><span class="tag ${b.status==='delivered'?'tg':b.status==='intransit'?'tb':'to'}">${b.status==='pending'?'Pending':b.status==='intransit'?'In Transit':'Delivered'}</span></td>
            <td style="display:flex;gap:6px">
              <button class="act-btn act-process" onclick="printBol('${b.id}')" aria-label="Print BOL ${b.bolNum}" style="font-size:10px">🖨 Print</button>
              ${b.status!=='delivered'?`<button class="act-btn" onclick="advanceBolStatus('${b.id}')" style="font-size:10px;background:var(--blue-bg);color:var(--blue)">→ Advance</button>`:''}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>
  </div>` : `
  <div class="card" style="text-align:center;padding:48px">
    <div style="font-size:48px;margin-bottom:12px">📋</div>
    <div style="font-size:18px;font-weight:800;margin-bottom:6px">No BOLs yet</div>
    <div style="color:var(--ink3);margin-bottom:18px">Create your first Bill of Lading for an outbound shipment</div>
    <button class="btn btn-red" onclick="openBolModal()">Create First BOL</button>
  </div>`}

  <!-- Create BOL Modal -->
  <div class="modal-bg" id="bolModal" role="dialog" aria-modal="true" aria-labelledby="bolModal-title">
    <div class="modal" style="max-width:620px;max-height:90vh;overflow-y:auto">
      <div style="padding:16px 24px;border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--surface);z-index:2">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800">Create Bill of Lading</div>
      </div>
      <div style="padding:20px 24px">

        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.7px;color:var(--ink3);margin-bottom:10px">Parties</div>
        <div class="fg2">
          <div class="field"><label>Shipper (From)</label><input type="text" id="bol_shipper" value="ShiplyCo Fulfillment" placeholder="Company name"/></div>
          <div class="field"><label>Consignee (To)</label><input type="text" id="bol_consignee" placeholder="Receiving company name"/></div>
        </div>
        <div class="fg2">
          <div class="field"><label>Customer</label>
            <select id="bol_cust">${CUSTOMERS.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select>
          </div>
          <div class="field"><label>BOL Date</label><input type="date" id="bol_date" value="${new Date().toISOString().slice(0,10)}"/></div>
        </div>

        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.7px;color:var(--ink3);margin:14px 0 10px">Addresses</div>
        <div class="fg2">
          <div class="field"><label>Origin Address</label><input type="text" id="bol_origin" value="ShiplyCo, 1234 Warehouse Blvd, Houston TX 77001" placeholder="Full ship-from address"/></div>
          <div class="field"><label>Destination Address</label><input type="text" id="bol_dest" placeholder="Full ship-to address"/></div>
        </div>

        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.7px;color:var(--ink3);margin:14px 0 10px">Carrier & Service</div>
        <div class="fg3">
          <div class="field"><label>Carrier</label>
            <select id="bol_carrier">
              <option>FedEx Freight</option><option>UPS Freight</option><option>XPO Logistics</option><option>Old Dominion</option><option>Estes Express</option><option>R+L Carriers</option><option>Customer Pickup</option><option>Other</option>
            </select>
          </div>
          <div class="field"><label>Service Type</label>
            <select id="bol_service"><option>LTL</option><option>FTL</option><option>Expedited</option><option>Standard</option></select>
          </div>
          <div class="field"><label>Pro / Tracking #</label><input type="text" id="bol_track" placeholder="Optional"/></div>
        </div>

        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.7px;color:var(--ink3);margin:14px 0 10px">Freight Details</div>
        <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;overflow-x:auto;margin-bottom:10px">
          <table style="width:100%;border-collapse:collapse">
            <thead style="background:var(--bg)">
              <tr><th style="padding:8px 10px;text-align:left;font-size:11px">Pieces</th><th style="padding:8px 10px;text-align:left;font-size:11px">Package Type</th><th style="padding:8px 10px;text-align:left;font-size:11px">Description</th><th style="padding:8px 10px;text-align:left;font-size:11px">Weight (lbs)</th><th style="padding:8px 10px;text-align:left;font-size:11px">Class</th></tr>
            </thead>
            <tbody id="bolLineItems">
              <tr>
                <td style="padding:6px 8px"><input type="number" class="bol-pieces" value="1" min="1" style="width:60px;padding:4px;border:1px solid var(--border);border-radius:4px"/></td>
                <td style="padding:6px 8px"><select class="bol-pkgtype" style="padding:4px;border:1px solid var(--border);border-radius:4px"><option>Pallet</option><option>Carton</option><option>Crate</option><option>Bundle</option><option>Drum</option></select></td>
                <td style="padding:6px 8px"><input type="text" class="bol-desc" placeholder="Contents description" style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px"/></td>
                <td style="padding:6px 8px"><input type="number" class="bol-weight" value="0" min="0" style="width:80px;padding:4px;border:1px solid var(--border);border-radius:4px" oninput="updateBolWeight()"/></td>
                <td style="padding:6px 8px"><select class="bol-class" style="padding:4px;border:1px solid var(--border);border-radius:4px"><option>50</option><option>55</option><option>60</option><option>65</option><option>70</option><option>77.5</option><option>85</option><option>92.5</option><option>100</option><option>110</option><option>125</option><option>150</option><option>175</option><option>200</option><option>250</option><option>300</option><option>400</option><option>500</option></select></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <button class="act-btn" onclick="addBolLine()" style="font-size:11px;background:var(--blue-bg);color:var(--blue)">+ Add Line</button>
          <div style="font-size:13px;font-weight:700">Total Weight: <span id="bolTotalWeight" style="color:var(--red)">0</span> lbs</div>
        </div>

        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.7px;color:var(--ink3);margin:14px 0 10px">Additional</div>
        <div class="fg2">
          <div class="field"><label>Special Instructions</label><input type="text" id="bol_instructions" placeholder="Fragile, liftgate required, appointment, etc."/></div>
          <div class="field"><label>PO / Reference #</label><input type="text" id="bol_ref" placeholder="Customer PO or order number"/></div>
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:4px">
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;cursor:pointer"><input type="checkbox" id="bol_hazmat"/> Contains Hazmat</label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;cursor:pointer"><input type="checkbox" id="bol_cod"/> COD Shipment</label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;cursor:pointer"><input type="checkbox" id="bol_prepaid" checked/> Freight Prepaid</label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;cursor:pointer"><input type="checkbox" id="bol_liftgate"/> Liftgate Required</label>
        </div>
      </div>
      <div class="modal-actions" style="position:sticky;bottom:0;background:var(--surface)">
        <button class="btn" onclick="document.getElementById('bolModal').classList.remove('open')">Cancel</button>
        <button class="btn" onclick="saveBol(false)" style="background:var(--blue-bg);color:var(--blue)">💾 Save Draft</button>
        <button class="btn btn-red" onclick="saveBol(true)">🖨 Save & Print</button>
      </div>
    </div>
  </div>

  <!-- Print BOL Modal -->
  <div class="modal-bg" id="bolPrintModal" role="dialog" aria-modal="true" aria-labelledby="bolPrintModal-title">
    <div class="modal" style="max-width:680px;max-height:90vh;overflow-y:auto">
      <div style="padding:12px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800">Bill of Lading Preview</span>
        <div style="display:flex;gap:8px">
          <button class="btn" onclick="window.print()">🖨 Print</button>
          <button class="btn" onclick="document.getElementById('bolPrintModal').classList.remove('open')">Close</button>
        </div>
      </div>
      <div id="bolPrintContent" style="padding:24px;font-family:'Barlow',sans-serif"></div>
    </div>
  </div>`;
}

function openBolModal(){
  document.getElementById('bolModal').classList.add('open');
  updateBolWeight();
}
function addBolLine(){
  const tbody=document.getElementById('bolLineItems');
  if(!tbody)return;
  const row=document.createElement('tr');
  row.innerHTML=`
    <td style="padding:6px 8px"><input type="number" class="bol-pieces" value="1" min="1" style="width:60px;padding:4px;border:1px solid var(--border);border-radius:4px"/></td>
    <td style="padding:6px 8px"><select class="bol-pkgtype" style="padding:4px;border:1px solid var(--border);border-radius:4px"><option>Pallet</option><option>Carton</option><option>Crate</option><option>Bundle</option><option>Drum</option></select></td>
    <td style="padding:6px 8px"><input type="text" class="bol-desc" placeholder="Contents description" style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px"/></td>
    <td style="padding:6px 8px"><input type="number" class="bol-weight" value="0" min="0" style="width:80px;padding:4px;border:1px solid var(--border);border-radius:4px" oninput="updateBolWeight()"/></td>
    <td style="padding:6px 8px"><select class="bol-class" style="padding:4px;border:1px solid var(--border);border-radius:4px"><option>50</option><option>55</option><option>60</option><option>65</option><option>70</option><option>77.5</option><option>85</option><option>92.5</option><option>100</option><option>110</option><option>125</option><option>150</option><option>175</option><option>200</option><option>250</option><option>300</option><option>400</option><option>500</option></select></td>`;
  tbody.appendChild(row);
}
function updateBolWeight(){
  const weights=[...document.querySelectorAll('.bol-weight')].map(i=>parseFloat(i.value)||0);
  const total=weights.reduce((s,w)=>s+w,0);
  const el=document.getElementById('bolTotalWeight');
  if(el)el.textContent=total.toFixed(0);
}
function saveBol(print){
  const shipper=document.getElementById('bol_shipper')?.value;
  const consignee=document.getElementById('bol_consignee')?.value;
  if(!consignee){showToast('⚠ Consignee is required');return;}
  const lines=[...document.querySelectorAll('#bolLineItems tr')].map(r=>({
    pieces:r.querySelector('.bol-pieces')?.value||'1',
    pkgType:r.querySelector('.bol-pkgtype')?.value||'Pallet',
    desc:r.querySelector('.bol-desc')?.value||'',
    weight:parseFloat(r.querySelector('.bol-weight')?.value)||0,
    freightClass:r.querySelector('.bol-class')?.value||'50',
  }));
  const bol={
    id:'bol_'+Date.now(),
    bolNum:'BOL-'+BOL_COUNTER++,
    custId:document.getElementById('bol_cust')?.value,
    shipper,consignee,
    origin:document.getElementById('bol_origin')?.value,
    dest:document.getElementById('bol_dest')?.value,
    carrier:document.getElementById('bol_carrier')?.value,
    service:document.getElementById('bol_service')?.value,
    track:document.getElementById('bol_track')?.value,
    date:document.getElementById('bol_date')?.value,
    ref:document.getElementById('bol_ref')?.value,
    instructions:document.getElementById('bol_instructions')?.value,
    hazmat:document.getElementById('bol_hazmat')?.checked,
    cod:document.getElementById('bol_cod')?.checked,
    prepaid:document.getElementById('bol_prepaid')?.checked,
    liftgate:document.getElementById('bol_liftgate')?.checked,
    lines,
    pieces:lines.reduce((s,l)=>s+parseInt(l.pieces||1),0),
    weight:lines.reduce((s,l)=>s+l.weight,0),
    status:'pending',
  };
  BOLS.unshift(bol);
  document.getElementById('bolModal').classList.remove('open');
  showToast(`✓ ${bol.bolNum} created`);
  if(print) printBol(bol.id);
  else showPage('bol');
}
function printBol(id){
  const b=BOLS.find(x=>x.id===id);if(!b)return;
  const cust=CUSTOMERS.find(c=>c.id===b.custId);
  document.getElementById('bolPrintContent').innerHTML=`
  <div style="border:2px solid #000;padding:0;font-family:Arial,sans-serif;font-size:11px">
    <!-- Header -->
    <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:2px solid #000">
      <div style="padding:12px;border-right:1px solid #000">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:900;color:#e8241a;letter-spacing:1px">SHIPLYCO</div>
        <div style="font-size:10px;color:#555">ShiplyCo Fulfillment · Houston, TX 77001</div>
      </div>
      <div style="padding:12px">
        <div style="font-size:20px;font-weight:900;text-align:center;margin-bottom:4px">BILL OF LADING</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
          <div><strong>BOL #:</strong> ${b.bolNum}</div>
          <div><strong>Date:</strong> ${b.date}</div>
          <div><strong>PRO #:</strong> ${b.track||'—'}</div>
          <div><strong>Ref:</strong> ${b.ref||'—'}</div>
        </div>
      </div>
    </div>

    <!-- Parties -->
    <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #000">
      <div style="padding:10px;border-right:1px solid #000">
        <div style="font-size:10px;font-weight:900;text-transform:uppercase;margin-bottom:4px">SHIPPER</div>
        <div style="font-weight:700">${b.shipper}</div>
        <div>${b.origin}</div>
      </div>
      <div style="padding:10px">
        <div style="font-size:10px;font-weight:900;text-transform:uppercase;margin-bottom:4px">CONSIGNEE</div>
        <div style="font-weight:700">${b.consignee}</div>
        <div>${b.dest}</div>
      </div>
    </div>

    <!-- Carrier -->
    <div style="padding:8px 10px;border-bottom:1px solid #000;display:flex;gap:24px">
      <div><strong>Carrier:</strong> ${b.carrier}</div>
      <div><strong>Service:</strong> ${b.service}</div>
      <div><strong>Terms:</strong> ${b.prepaid?'Freight Prepaid':'Freight Collect'}</div>
      ${b.hazmat?'<div style="background:#fee;color:#c00;padding:2px 8px;border-radius:3px;font-weight:900">⚠ HAZMAT</div>':''}
      ${b.liftgate?'<div><strong>Liftgate Required</strong></div>':''}
    </div>

    <!-- Line Items -->
    <table style="width:100%;border-collapse:collapse;border-bottom:1px solid #000;min-width:400px">
      <thead>
        <tr style="background:#f5f5f5">
          <th style="border:1px solid #ccc;padding:6px;text-align:left">Pieces</th>
          <th style="border:1px solid #ccc;padding:6px;text-align:left">Package</th>
          <th style="border:1px solid #ccc;padding:6px;text-align:left;width:40%">Description</th>
          <th style="border:1px solid #ccc;padding:6px;text-align:right">Weight (lbs)</th>
          <th style="border:1px solid #ccc;padding:6px;text-align:center">Class</th>
          <th style="border:1px solid #ccc;padding:6px;text-align:center">NMFC #</th>
        </tr>
      </thead>
      <tbody>
        ${b.lines.map(l=>`<tr>
          <td style="border:1px solid #ccc;padding:5px;text-align:center">${l.pieces}</td>
          <td style="border:1px solid #ccc;padding:5px">${l.pkgType}</td>
          <td style="border:1px solid #ccc;padding:5px">${l.desc}</td>
          <td style="border:1px solid #ccc;padding:5px;text-align:right">${l.weight}</td>
          <td style="border:1px solid #ccc;padding:5px;text-align:center">${l.freightClass}</td>
          <td style="border:1px solid #ccc;padding:5px"></td>
        </tr>`).join('')}
        <tr style="background:#f9f9f9;font-weight:700">
          <td style="border:1px solid #ccc;padding:5px;text-align:center">${b.pieces}</td>
          <td style="border:1px solid #ccc;padding:5px" colspan="2">TOTAL</td>
          <td style="border:1px solid #ccc;padding:5px;text-align:right">${b.weight}</td>
          <td colspan="2" style="border:1px solid #ccc"></td>
        </tr>
      </tbody>
    </table>

    ${b.instructions?`<div style="padding:8px 10px;border-bottom:1px solid #000"><strong>Special Instructions:</strong> ${b.instructions}</div>`:''}

    <!-- Signatures -->
    <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #000">
      <div style="padding:14px;border-right:1px solid #000">
        <div style="font-size:10px;font-weight:900;text-transform:uppercase;margin-bottom:18px">SHIPPER SIGNATURE</div>
        <div style="border-bottom:1px solid #000;margin-bottom:4px;height:30px"></div>
        <div style="font-size:10px">Signature / Date</div>
      </div>
      <div style="padding:14px">
        <div style="font-size:10px;font-weight:900;text-transform:uppercase;margin-bottom:18px">CARRIER SIGNATURE / DATE RECEIVED</div>
        <div style="border-bottom:1px solid #000;margin-bottom:4px;height:30px"></div>
        <div style="font-size:10px">Signature / Date</div>
      </div>
    </div>
    <div style="padding:8px 10px;font-size:10px;color:#666;text-align:center">
      This is to certify that the above-named materials are properly classified, described, packaged, marked and labeled, and are in proper condition for transportation according to the applicable regulations of the DOT.
    </div>
  </div>`;
  document.getElementById('bolPrintModal').classList.add('open');
}
function advanceBolStatus(id){
  const b=BOLS.find(x=>x.id===id);if(!b)return;
  if(b.status==='pending') b.status='intransit';
  else if(b.status==='intransit') b.status='delivered';
  showToast(`✓ ${b.bolNum} → ${b.status}`);
  showPage('bol');
}

// ══════════════════════════════════════════════
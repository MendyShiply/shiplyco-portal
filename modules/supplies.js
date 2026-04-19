// ── SUPPLIES INVENTORY ──
let SUPPLIES=[
  {id:'sup_box_s',name:'Cardboard Box — Small',category:'Boxes',variant:'S · 8×6×4"',unitCost:0.48,qty:320,reorderAt:50,unit:'each',color:'#8B5E3C',sku:'BOX-S'},
  {id:'sup_box_m',name:'Cardboard Box — Medium',category:'Boxes',variant:'M · 12×10×8"',unitCost:0.72,qty:280,reorderAt:50,unit:'each',color:'#8B5E3C',sku:'BOX-M'},
  {id:'sup_box_l',name:'Cardboard Box — Large',category:'Boxes',variant:'L · 18×14×12"',unitCost:1.10,qty:18,reorderAt:30,unit:'each',color:'#8B5E3C',sku:'BOX-L'},
  {id:'sup_box_xl',name:'Cardboard Box — XL',category:'Boxes',variant:'XL · 24×18×18"',unitCost:1.65,qty:95,reorderAt:25,unit:'each',color:'#8B5E3C',sku:'BOX-XL'},
  {id:'sup_bubble',name:'Bubble Wrap',category:'Protection',variant:'12" × 50ft roll',unitCost:4.20,qty:22,reorderAt:10,unit:'roll',color:'#4a90d9',sku:'BUBBLE-12'},
  {id:'sup_tape',name:'Packing Tape',category:'Tape',variant:'2" × 55yd clear',unitCost:1.85,qty:48,reorderAt:20,unit:'roll',color:'#e8c32a',sku:'TAPE-2'},
  {id:'sup_poly_s',name:'Poly Mailer — Small',category:'Mailers',variant:'6×9"',unitCost:0.12,qty:500,reorderAt:100,unit:'each',color:'#7a1ea0',sku:'POLY-S'},
  {id:'sup_poly_m',name:'Poly Mailer — Medium',category:'Mailers',variant:'10×13"',unitCost:0.18,qty:7,reorderAt:100,unit:'each',color:'#7a1ea0',sku:'POLY-M'},
  {id:'sup_ship_lbl',name:'Shipping Label — 4×6"',category:'Labels',variant:'4×6" thermal',unitCost:0.05,qty:1200,reorderAt:200,unit:'each',color:'#1a4fc0',sku:'LBL-46'},
  {id:'sup_asin_lbl',name:'ASIN / FNSKU Label',category:'Labels',variant:'1×2" thermal',unitCost:0.04,qty:850,reorderAt:200,unit:'each',color:'#1a4fc0',sku:'LBL-ASIN'},
  {id:'sup_stretch',name:'Stretch Wrap / Pallet Wrap',category:'Wrap',variant:'18" × 1500ft',unitCost:22.00,qty:9,reorderAt:4,unit:'roll',color:'#1e7a4f',sku:'WRAP-18'},
  {id:'sup_peanuts',name:'Packing Peanuts',category:'Fill',variant:'1 cu ft bag',unitCost:3.50,qty:14,reorderAt:8,unit:'bag',color:'#c07020',sku:'FILL-PNT'},
];
const MARKUP=0.15;

function supplyBillable(sup,qty){return +(sup.unitCost*qty*(1+MARKUP)).toFixed(2);}

function pgSupplies(){
  const lowStock=SUPPLIES.filter(s=>s.qty<=s.reorderAt);
  const categories=[...new Set(SUPPLIES.map(s=>s.category))];

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div class="pg-title">Supplies Inventory</div>
      <div class="pg-sub">All packing & shipping supplies — costs tracked with 15% markup billed to customers</div>
    </div>
    ${role==='admin'?`<button class="btn btn-red" onclick="openAddSupply()">${ico('plus',13)} Add Supply Item</button>`:''}
  </div>

  <!-- Stats -->
  <div class="stats" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat"><div class="stat-lbl">Total SKUs</div><div class="stat-val">${SUPPLIES.length}</div><span class="tag tb">Tracked items</span></div>
    <div class="stat"><div class="stat-lbl">Low Stock Alerts</div><div class="stat-val" style="${lowStock.length?'color:var(--red)':''}">${lowStock.length}</div><span class="tag ${lowStock.length?'tr':'tg'}">${lowStock.length?'Needs reorder':'All stocked'}</span></div>
    <div class="stat"><div class="stat-lbl">Markup Rate</div><div class="stat-val">15%</div><span class="tag tgd">Applied to invoices</span></div>
    <div class="stat"><div class="stat-lbl">Categories</div><div class="stat-val">${categories.length}</div><span class="tag tb">Supply types</span></div>
  </div>

  ${lowStock.length?`
  <div style="background:var(--red-light);border:2px solid var(--red);border-radius:10px;padding:14px 18px;margin-bottom:18px">
    <div style="font-weight:800;color:var(--red);margin-bottom:8px">⚠ Low Stock — Reorder Needed (${lowStock.length} item${lowStock.length!==1?'s':''})</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${lowStock.map(s=>`<span style="background:#fff;border:1px solid var(--red);border-radius:6px;padding:4px 10px;font-size:12px;font-weight:700;color:var(--red)">${s.name} — ${s.qty} ${s.unit}${s.qty!==1?'s':''} left</span>`).join('')}
    </div>
  </div>`:''}

  <!-- Supply table by category -->
  ${categories.map(cat=>{
    const catItems=SUPPLIES.filter(s=>s.category===cat);
    return `
    <div class="card" style="margin-bottom:16px">
      <div class="card-head">
        <span class="card-title">${cat} <span style="font-size:11px;font-weight:500;color:var(--ink3)">(${catItems.length} item${catItems.length!==1?'s':''})</span></span>
      </div>
      <div style="overflow-x:auto"><table>
        <thead><tr><th>Item</th><th>SKU</th><th>Variant</th><th>Unit Cost</th><th>+15% Billable</th><th>In Stock</th><th>Reorder At</th><th>Status</th>${role==='admin'?'<th>Actions</th>':''}</tr></thead>
        <tbody>
          ${catItems.map(s=>{
            const low=s.qty<=s.reorderAt;
            const critical=s.qty<=Math.floor(s.reorderAt/2);
            const billable=supplyBillable(s,1);
            return `<tr style="${critical?'background:var(--red-light)':low?'background:var(--orange-bg)':''}">
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="width:10px;height:10px;border-radius:2px;background:${s.color};flex-shrink:0"></div>
                  <span style="font-weight:600;font-size:13px">${s.name}</span>
                </div>
              </td>
              <td class="mono" style="font-size:11px">${s.sku}</td>
              <td style="font-size:12px;color:var(--ink2)">${s.variant}</td>
              <td style="font-weight:600">${fmt(s.unitCost)}</td>
              <td style="font-weight:700;color:var(--green)">${fmt(billable)}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-weight:800;font-size:15px;color:${critical?'var(--red)':low?'var(--orange)':'var(--ink)'}">${s.qty}</span>
                  <span style="font-size:11px;color:var(--ink3)">${s.unit}${s.qty!==1?'s':''}</span>
                </div>
              </td>
              <td style="font-size:12px;color:var(--ink3)">${s.reorderAt} ${s.unit}s</td>
              <td>
                ${critical?'<span class="tag tr">🔴 Critical</span>':low?'<span class="tag to">⚠ Low</span>':'<span class="tag tg">✓ OK</span>'}
              </td>
              ${role==='admin'?`<td>
                <div style="display:flex;gap:5px">
                  <button class="act-btn act-process" onclick="adjustSupplyQty('${s.id}')" style="font-size:10px">+ Restock</button>
                  <button class="act-btn" onclick="editSupply('${s.id}')" style="font-size:10px;background:var(--blue-bg);color:var(--blue)">${ico('edit',10)} Edit</button>
                  <button class="act-btn" onclick="useSupply('${s.id}')" style="font-size:10px;background:var(--orange-bg);color:var(--orange)">− Use</button>
                </div>
              </td>`:''}
            </tr>`;}).join('')}
        </tbody>
      </table></div>
    </div>`;}).join('')}

  <!-- Add/Edit Supply Modal -->
  <div class="modal-bg" id="supplyModal" role="dialog" aria-modal="true" aria-labelledby="supplyModal-title">
    <div class="modal" style="max-width:500px">
      <div style="padding:20px 24px;border-bottom:1px solid var(--border)">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;text-transform:uppercase" id="supplyModalTitle">Add Supply Item</div>
      </div>
      <div style="padding:20px 24px" id="supplyModalBody">
        <div class="fg2">
          <div class="field"><label>Item Name</label><input type="text" id="sup_name" placeholder="e.g. Cardboard Box — Medium"/></div>
          <div class="field"><label>SKU / Code</label><input type="text" id="sup_sku" placeholder="BOX-M"/></div>
        </div>
        <div class="fg2">
          <div class="field"><label>Category</label>
            <select id="sup_cat">
              <option>Boxes</option><option>Protection</option><option>Tape</option><option>Mailers</option><option>Labels</option><option>Wrap</option><option>Fill</option><option>Other</option>
            </select>
          </div>
          <div class="field"><label>Variant / Description</label><input type="text" id="sup_variant" placeholder="e.g. 12×10×8 inches"/></div>
        </div>
        <div class="fg2">
          <div class="field"><label>Unit Cost ($)</label><input type="number" step="0.01" min="0" id="sup_cost" placeholder="0.00"/></div>
          <div class="field"><label>Unit</label><input type="text" id="sup_unit" placeholder="each / roll / bag"/></div>
        </div>
        <div class="fg2">
          <div class="field"><label>Starting Qty</label><input type="number" min="0" id="sup_qty" placeholder="100"/></div>
          <div class="field"><label>Reorder Alert At</label><input type="number" min="0" id="sup_reorder" placeholder="20"/></div>
        </div>
        <div class="field"><label>Color Tag</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px" id="supColorPicker">
            ${['#8B5E3C','#4a90d9','#e8c32a','#7a1ea0','#1a4fc0','#1e7a4f','#c07020','#e8241a'].map(c=>`
            <div onclick="document.getElementById('sup_color').value='${c}';document.querySelectorAll('.sup-color-opt').forEach(e=>e.style.outline='none');this.style.outline='3px solid var(--ink)'"
              class="sup-color-opt" style="width:28px;height:28px;border-radius:6px;background:${c};cursor:pointer"></div>`).join('')}
            <input type="color" id="sup_color" value="#1a4fc0" style="width:28px;height:28px;border-radius:6px;border:1px solid var(--border);cursor:pointer;padding:1px"/>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="document.getElementById('supplyModal').classList.remove('open')">Cancel</button>
        <button class="btn btn-red" onclick="saveSupplyItem()">Save Item</button>
      </div>
    </div>
  </div>`;
}

let _editingSupplyId=null;
function openAddSupply(){
  _editingSupplyId=null;
  document.getElementById('supplyModalTitle').textContent='Add Supply Item';
  ['sup_name','sup_sku','sup_variant','sup_unit'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  ['sup_cost','sup_qty','sup_reorder'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  document.getElementById('supplyModal').classList.add('open');
}
function editSupply(id){
  const s=SUPPLIES.find(x=>x.id===id);if(!s)return;
  _editingSupplyId=id;
  document.getElementById('supplyModalTitle').textContent='Edit Supply Item';
  document.getElementById('sup_name').value=s.name;
  document.getElementById('sup_sku').value=s.sku;
  document.getElementById('sup_variant').value=s.variant;
  document.getElementById('sup_unit').value=s.unit;
  document.getElementById('sup_cost').value=s.unitCost;
  document.getElementById('sup_qty').value=s.qty;
  document.getElementById('sup_reorder').value=s.reorderAt;
  document.getElementById('sup_color').value=s.color;
  document.getElementById('supplyModal').classList.add('open');
}
function saveSupplyItem(){
  const name=document.getElementById('sup_name').value.trim();
  if(!name){showToast('⚠ Item name required');return;}
  const data={
    name,sku:document.getElementById('sup_sku').value||name.replace(/\s+/g,'-').toUpperCase(),
    category:document.getElementById('sup_cat').value,
    variant:document.getElementById('sup_variant').value,
    unitCost:parseFloat(document.getElementById('sup_cost').value)||0,
    unit:document.getElementById('sup_unit').value||'each',
    qty:parseInt(document.getElementById('sup_qty').value)||0,
    reorderAt:parseInt(document.getElementById('sup_reorder').value)||10,
    color:document.getElementById('sup_color').value,
  };
  if(_editingSupplyId){
    const s=SUPPLIES.find(x=>x.id===_editingSupplyId);
    if(s)Object.assign(s,data);
    showToast(`✓ ${name} updated`);
  } else {
    data.id='sup_'+Date.now();
    SUPPLIES.push(data);
    showToast(`✓ ${name} added to supplies`);
  }
  document.getElementById('supplyModal').classList.remove('open');
  showPage('supplies');
}
function adjustSupplyQty(id){
  const s=SUPPLIES.find(x=>x.id===id);if(!s)return;
  const n=prompt(`Restock ${s.name}\nCurrent qty: ${s.qty} ${s.unit}s\nEnter quantity to ADD:`);
  if(n===null)return;
  const add=parseInt(n);
  if(isNaN(add)||add<=0){showToast('⚠ Enter a valid number');return;}
  s.qty+=add;
  showToast(`✓ ${s.name} restocked — now ${s.qty} ${s.unit}s`);
  showPage('supplies');
}
function useSupply(id){
  const s=SUPPLIES.find(x=>x.id===id);if(!s)return;
  const n=prompt(`Use ${s.name}\nIn stock: ${s.qty} ${s.unit}s\nBillable rate: ${fmt(supplyBillable(s,1))}/${s.unit}\n\nHow many used?`);
  if(n===null)return;
  const use=parseInt(n);
  if(isNaN(use)||use<=0){showToast('⚠ Enter a valid number');return;}
  if(use>s.qty){showToast('⚠ Not enough stock');return;}
  s.qty-=use;
  const charge=supplyBillable(s,use);
  showToast(`✓ ${use} ${s.unit}${use!==1?'s':''} of ${s.name} used — ${fmt(charge)} added to invoice`);
  if(s.qty<=s.reorderAt) showToast(`⚠ LOW STOCK: ${s.name} — only ${s.qty} remaining. Reorder soon!`);
  showPage('supplies');
}


// ══════════════════════════════════════════════
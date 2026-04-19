// ── SKU MASTER (Item Catalog) ──
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// ── INBOUND ASN PAGE ──
// ══════════════════════════════════════════════
let _asnList = [];
let _asnLoaded = false;

async function loadAsns(){
  try{
    let q = sb.from('asns').select('*').order('created_at', {ascending:false});
    if(role==='customer' && currentCustId) q = q.eq('cust_id', currentCustId);
    const {data, error} = await q;
    if(error) throw error;
    _asnList = data||[];
    _asnLoaded = true;
  }catch(e){
    console.warn('ASN load error:', e);
    _asnLoaded = true;
  }
}

function pgInbound(){
  if(!_asnLoaded){
    loadAsns().then(()=>{
      const mc=document.getElementById('mainContent');
      if(mc) mc.innerHTML='<div class="page">'+pgInbound()+'</div>';
    });
    return '<div style="padding:40px;text-align:center;color:var(--ink3)">Loading inbound shipments...</div>';
  }
  const pending = _asnList.filter(a=>a.status==='pending').length;
  const received = _asnList.filter(a=>a.status==='received').length;
  const isCustomer = role==='customer';
  const custCol = isCustomer ? '' : '<th style="padding:10px 14px;font-size:11px;text-transform:uppercase">Customer</th>';

  let rows = '';
  if(!_asnList.length){
    rows = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--ink3)">No inbound shipments yet'+(isCustomer?' — click New Inbound to notify us':'')+' </td></tr>';
  } else {
    _asnList.forEach(function(a){
      const cust = CUSTOMERS.find(function(c){return c.id===a.cust_id;});
      const sc = {pending:'var(--orange)',received:'var(--green)',partial:'var(--blue)',cancelled:'var(--ink3)'};
      const sb2 = {pending:'var(--orange-bg)',received:'var(--green-bg)',partial:'var(--blue-bg)',cancelled:'var(--surface2)'};
      rows += '<tr style="border-bottom:1px solid var(--border);cursor:pointer" data-asnid="'+a.id+'" onclick="openAsnDetail(this.dataset.asnid)">'
        +'<td style="padding:10px 14px;font-family:monospace;font-size:12px">'+a.id.slice(0,8).toUpperCase()+'</td>'
        +(isCustomer?'':'<td style="padding:10px 14px;font-size:13px;font-weight:600;color:var(--red)">'+(cust?cust.name:a.cust_id||'--')+'</td>')
        +'<td style="padding:10px 14px;font-size:13px">'+(a.expected_date||'--')+'</td>'
        +'<td style="padding:10px 14px;font-size:13px">'+(a.pallet_count?a.pallet_count+' pallets':a.box_count?a.box_count+' boxes':'--')+'</td>'
        +'<td style="padding:10px 14px;font-size:12px">'+(a.bol_number||a.tracking_number||'--')+'</td>'
        +'<td style="padding:10px 14px">'+(a.is_seasonal?'<span style="background:var(--blue-bg);color:var(--blue);font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px">'+(a.season||'Seasonal')+'</span>':'--')+'</td>'
        +'<td style="padding:10px 14px"><span style="background:'+(sb2[a.status]||'var(--surface2)')+';color:'+(sc[a.status]||'var(--ink3)')+';font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;text-transform:capitalize">'+a.status+'</span></td>'
        +'<td style="padding:10px 14px;font-size:12px">'+(a.items?a.items.length+' item type'+(a.items.length!==1?'s':''):'--')+'</td>'
        +'</tr>';
    });
  }

  return '<div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">'
    +'<div><div class="pg-title">'+(isCustomer?'Inbound Shipments':'Inbound ASNs')+'</div>'
    +'<div class="pg-sub">'+(isCustomer?'Notify us of incoming shipments':'All advance shipment notices')+'</div></div>'
    +(isCustomer?'<button class="btn btn-red" onclick="openNewAsn()">+ New Inbound</button>':'')
    +'</div>'
    +'<div class="stats" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">'
    +'<div class="stat"><div class="stat-lbl">Total</div><div class="stat-val">'+_asnList.length+'</div></div>'
    +'<div class="stat"><div class="stat-lbl">Pending</div><div class="stat-val" style="color:var(--orange)">'+pending+'</div></div>'
    +'<div class="stat"><div class="stat-lbl">Received</div><div class="stat-val" style="color:var(--green)">'+received+'</div></div>'
    +'</div>'
    +'<div class="card" style="overflow:hidden;padding:0">'
    +'<div style="overflow-x:auto;overflow-y:auto;max-height:65vh">'
    +'<table style="width:100%;border-collapse:collapse;min-width:700px">'
    +'<thead style="position:sticky;top:0;z-index:10"><tr style="background:var(--surface2)">'
    +'<th style="padding:10px 14px;font-size:11px;text-transform:uppercase">ASN #</th>'
    +custCol
    +'<th style="padding:10px 14px;font-size:11px;text-transform:uppercase">Expected</th>'
    +'<th style="padding:10px 14px;font-size:11px;text-transform:uppercase">Qty</th>'
    +'<th style="padding:10px 14px;font-size:11px;text-transform:uppercase">BOL / Tracking</th>'
    +'<th style="padding:10px 14px;font-size:11px;text-transform:uppercase">Seasonal</th>'
    +'<th style="padding:10px 14px;font-size:11px;text-transform:uppercase">Status</th>'
    +'<th style="padding:10px 14px;font-size:11px;text-transform:uppercase">Items</th>'
    +'</tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div>'
    +'<div style="padding:10px 16px;border-top:1px solid var(--border);font-size:12px;color:var(--ink3);background:var(--surface2)">'+_asnList.length+' shipments</div>'
    +'</div>';
}

function openAsnDetail(asnId){
  const a = _asnList.find(function(x){return x.id===asnId;});
  if(!a){ showToast('ASN not found'); return; }
  const cust = CUSTOMERS.find(function(c){return c.id===a.cust_id;});
  const isAdmin = role!=='customer';
  const items = a.items||[];
  const sc = {pending:'var(--orange)',received:'var(--green)',partial:'var(--blue)',cancelled:'var(--ink3)'};
  const sbc = {pending:'var(--orange-bg)',received:'var(--green-bg)',partial:'var(--blue-bg)',cancelled:'var(--surface2)'};

  let itemsHtml = items.length ? items.map(function(it,i){
    return '<div style="padding:10px 14px;border-bottom:1px solid var(--border2)">'
      +'<div style="font-weight:700;font-size:13px">'+(it.desc||'Item '+(i+1))+'</div>'
      +'<div style="font-size:12px;color:var(--ink3)">'
      +(it.sku?'SKU: '+it.sku+'  ':'')+(it.upc?'UPC: '+it.upc+'  ':'')
      +(it.color?it.color+'  ':'')+(it.size?it.size+'  ':'')
      +(it.caseCount?it.caseCount+' cases  ':'')+(it.casepack?'('+it.casepack+'/case)  ':'')
      +(it.totalUnits?'= '+it.totalUnits+' units':'')
      +(it.notes?'<br><span style="color:var(--orange)">'+it.notes+'</span>':'')
      +'</div></div>';
  }).join('') : '<div style="padding:14px;color:var(--ink3)">No item details</div>';

  const modal = document.getElementById('asnDetailModal');
  if(!modal){ showToast('Modal not found'); return; }
  document.getElementById('asnDetailTitle').textContent = 'Shipment '+a.id.slice(0,8).toUpperCase();
  document.getElementById('asnDetailBody').innerHTML = '<div class="fg2" style="margin-bottom:12px">'
    +(isAdmin?'<div class="field"><label>Customer</label><div style="font-weight:700;color:var(--red);padding:8px;background:var(--surface2);border-radius:6px">'+(cust?cust.name:a.cust_id)+'</div></div>':'')
    +'<div class="field"><label>Status</label><div><span style="background:'+(sbc[a.status]||'')+';color:'+(sc[a.status]||'')+';font-weight:700;padding:4px 10px;border-radius:6px;text-transform:capitalize">'+a.status+'</span></div></div>'
    +'<div class="field"><label>Expected</label><div style="padding:8px;background:var(--surface2);border-radius:6px">'+(a.expected_date||'--')+'</div></div>'
    +'<div class="field"><label>Pallets</label><div style="padding:8px;background:var(--surface2);border-radius:6px">'+(a.pallet_count||'--')+'</div></div>'
    +'<div class="field"><label>Boxes</label><div style="padding:8px;background:var(--surface2);border-radius:6px">'+(a.box_count||'--')+'</div></div>'
    +'<div class="field"><label>BOL #</label><div style="padding:8px;background:var(--surface2);border-radius:6px">'+(a.bol_number||'--')+'</div></div>'
    +'<div class="field"><label>Tracking</label><div style="padding:8px;background:var(--surface2);border-radius:6px">'+(a.tracking_number||'--')+'</div></div>'
    +'<div class="field"><label>Carrier</label><div style="padding:8px;background:var(--surface2);border-radius:6px">'+(a.carrier||'--')+'</div></div>'
    +'<div class="field"><label>Seasonal</label><div style="padding:8px;background:var(--surface2);border-radius:6px">'+(a.is_seasonal?'Yes - '+(a.season||''):'No')+'</div></div>'
    +(a.notes?'<div class="field" style="grid-column:span 2"><label>Notes</label><div style="padding:8px;background:var(--surface2);border-radius:6px;white-space:pre-wrap">'+a.notes+'</div></div>':'')
    +'</div>'
    +'<div style="font-weight:700;font-size:13px;margin-bottom:6px">Items</div>'
    +'<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:12px">'+itemsHtml+'</div>'
    +(isAdmin?'<div><label style="font-weight:700;font-size:13px">Warehouse Notes</label>'
      +'<textarea id="asn_wh_notes" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;font-size:13px;min-height:60px;margin-top:4px;box-sizing:border-box">'+(a.warehouse_notes||'')+'</textarea></div>':'');

  var foot_html = isAdmin
    ? '<button class="btn" onclick="document.getElementById(\'asnDetailModal\').style.display=\'none\'">Close</button>'
      +'<button class="btn" data-aid="'+a.id+'" onclick="updateAsnStatus(this.dataset.aid,\'partial\')" style="background:var(--blue-bg);color:var(--blue)">Partial</button>'
      +'<button class="btn" data-aid="'+a.id+'" onclick="updateAsnStatus(this.dataset.aid,\'cancelled\')" style="background:var(--surface2);color:var(--ink3)">Cancel</button>'
      +'<button class="btn btn-red" data-aid="'+a.id+'" onclick="updateAsnStatus(this.dataset.aid,\'received\')">Mark Received</button>'
    : '<button class="btn" onclick="document.getElementById(\'asnDetailModal\').style.display=\'none\'">Close</button>'
      +(a.status==='pending'?'<button class="btn" data-aid="'+a.id+'" onclick="updateAsnStatus(this.dataset.aid,\'cancelled\')" style="background:var(--red-light);color:var(--red)">Cancel</button>':'');
  document.getElementById('asnDetailFoot').innerHTML = foot_html;
  document.getElementById('asnDetailModal').style.display='flex';
}

async function updateAsnStatus(asnId, newStatus){
  const notes = document.getElementById('asn_wh_notes')?.value||null;
  const update = {status:newStatus};
  if(notes) update.warehouse_notes = notes;
  if(newStatus==='received') update.received_at = new Date().toISOString();
  try{
    const {error} = await sb.from('asns').update(update).eq('id',asnId);
    if(error) throw error;
    showToast('Status updated: '+newStatus);
    closeModal('asnDetailModal');
    _asnLoaded=false;
    loadAsns().then(function(){showPage(role==='customer'?'inbound':'entry');});
  }catch(e){ showToast('Error: '+e.message); }
}

function openNewAsn(){
  _asnItems=[{upc:'',sku:'',desc:'',color:'',size:'',caseCount:'',casepack:'',notes:''}];
  renderAsnForm();
  document.getElementById('asnModal').style.display='flex';
}

function addAsnItem(){ _asnItems.push({upc:'',sku:'',desc:'',color:'',size:'',caseCount:'',casepack:'',notes:''}); renderAsnForm(); }
function removeAsnItem(idx){ _asnItems.splice(parseInt(idx),1); renderAsnForm(); }
function updateAsnItem(el){ var i=parseInt(el.dataset.idx); _asnItems[i][el.dataset.field]=el.value; }
function autoCalcUnits(i){
  var cases=parseInt(_asnItems[i].caseCount)||0, cp=parseInt(_asnItems[i].casepack)||0;
  var el=document.getElementById('asn_units_'+i);
  if(el&&cases&&cp) el.value=cases*cp;
}

var _asnItems=[{upc:'',sku:'',desc:'',color:'',size:'',caseCount:'',casepack:'',notes:''}];

function renderAsnForm(){
  var body=document.getElementById('asnModalBody');
  var foot=document.getElementById('asnModalFoot');
  if(!body) return;
  var itemRows=_asnItems.map(function(it,i){
    return '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px">'
      +'<div style="display:flex;justify-content:space-between;margin-bottom:8px">'
      +'<span style="font-weight:700;font-size:12px;text-transform:uppercase;color:var(--ink3)">Item '+(i+1)+'</span>'
      +(i>0?'<button class="act-btn" data-idx="'+i+'" onclick="removeAsnItem(this.dataset.idx)" style="background:var(--red-light);color:var(--red)">Remove</button>':'')
      +'</div>'
      +'<div class="fg2" style="gap:8px">'
      +'<div class="field"><label>UPC</label><input data-field="upc" data-idx="'+i+'" value="'+it.upc+'" onchange="updateAsnItem(this)" placeholder="UPC"/></div>'
      +'<div class="field"><label>SKU</label><input data-field="sku" data-idx="'+i+'" value="'+it.sku+'" onchange="updateAsnItem(this)" placeholder="SKU"/></div>'
      +'<div class="field" style="grid-column:span 2"><label>Description *</label><input data-field="desc" data-idx="'+i+'" value="'+it.desc+'" onchange="updateAsnItem(this)" placeholder="Item description"/></div>'
      +'<div class="field"><label>Color</label><input data-field="color" data-idx="'+i+'" value="'+it.color+'" onchange="updateAsnItem(this)"/></div>'
      +'<div class="field"><label>Size</label><input data-field="size" data-idx="'+i+'" value="'+it.size+'" onchange="updateAsnItem(this)"/></div>'
      +'<div class="field"><label>Cases</label><input type="number" data-field="caseCount" data-idx="'+i+'" value="'+it.caseCount+'" onchange="updateAsnItem(this);autoCalcUnits('+i+')" placeholder="0"/></div>'
      +'<div class="field"><label>Units/Case</label><input type="number" data-field="casepack" data-idx="'+i+'" value="'+it.casepack+'" onchange="updateAsnItem(this);autoCalcUnits('+i+')" placeholder="0"/></div>'
      +'<div class="field"><label>Total Units</label><input type="number" id="asn_units_'+i+'" value="'+(it.caseCount&&it.casepack?it.caseCount*it.casepack:'')+'" placeholder="Auto" style="background:var(--surface)"/></div>'
      +'<div class="field"><label>Seasonal</label><select data-field="season" data-idx="'+i+'" onchange="updateAsnItem(this)" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif">'
      +'<option value="">Not seasonal</option>'
      +'<option value="spring">Spring</option><option value="summer">Summer</option>'
      +'<option value="fall">Fall</option><option value="winter">Winter</option>'
      +'</select></div>'
      +'<div class="field"><label>Notes</label><input data-field="notes" data-idx="'+i+'" value="'+it.notes+'" onchange="updateAsnItem(this)"/></div>'
      +'</div></div>';
  }).join('');

  body.innerHTML='<div class="fg2" style="margin-bottom:14px">'
    +'<div class="field"><label>Expected Arrival Date *</label><input type="date" id="asn_date" style="width:100%"/></div>'
    +'<div class="field"><label>Shipment Type</label><select id="asn_type" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif">'
    +'<option value="pallets">Pallets</option><option value="boxes">Boxes</option><option value="mixed">Mixed</option></select></div>'
    +'<div class="field"><label>Pallets</label><input type="number" id="asn_pallets" placeholder="0" min="0"/></div>'
    +'<div class="field"><label>Boxes</label><input type="number" id="asn_boxes" placeholder="0" min="0"/></div>'
    +'<div class="field"><label>BOL Number</label><input id="asn_bol" placeholder="BOL number"/></div>'
    +'<div class="field"><label>Tracking #</label><input id="asn_tracking" placeholder="Tracking number"/></div>'
    +'<div class="field"><label>Carrier</label><input id="asn_carrier" placeholder="UPS, FedEx..."/></div>'
    +'<div class="field"><label>PO Upload</label><input type="file" id="asn_po" accept=".pdf,.xlsx,image/*" style="font-size:12px"/></div>'
    +'<div class="field" style="grid-column:span 2"><label>Notes</label>'
    +'<textarea id="asn_notes" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;font-size:13px;min-height:50px;box-sizing:border-box"></textarea></div>'
    +'</div>'
    +'<div style="font-weight:700;font-size:13px;margin-bottom:8px">Items Coming In</div>'
    +itemRows
    +'<button class="btn" onclick="addAsnItem()" style="font-size:12px;width:100%;margin-top:4px">+ Add Another Item</button>';

  foot.innerHTML='<button class="btn" onclick="document.getElementById(\'asnModal\').style.display=\'none\'">Cancel</button>'
    +'<button class="btn btn-red" onclick="submitAsn()">Submit Inbound Notice</button>';
}

async function submitAsn(){
  var date=document.getElementById('asn_date')?.value;
  if(!date){showToast('Please enter expected arrival date');return;}
  var pallets=parseInt(document.getElementById('asn_pallets')?.value)||0;
  var boxes=parseInt(document.getElementById('asn_boxes')?.value)||0;
  if(!pallets&&!boxes){showToast('Enter number of pallets or boxes');return;}
  var items=_asnItems.filter(function(it){return it.desc||it.upc||it.sku;}).map(function(it,i){
    return Object.assign({},it,{totalUnits:parseInt(document.getElementById('asn_units_'+i)?.value)||((parseInt(it.caseCount)||0)*(parseInt(it.casepack)||0))||0,
      is_seasonal:!!(it.season), season:it.season||null});
  });
  var payload={
    cust_id:currentCustId||(CUSTOMERS[0]?.id),
    expected_date:date,
    shipment_type:document.getElementById('asn_type')?.value||'pallets',
    pallet_count:pallets, box_count:boxes,
    bol_number:document.getElementById('asn_bol')?.value||null,
    tracking_number:document.getElementById('asn_tracking')?.value||null,
    carrier:document.getElementById('asn_carrier')?.value||null,
    notes:document.getElementById('asn_notes')?.value||null,
    is_seasonal:items.some(function(i){return i.is_seasonal;}),
    status:'pending', items:items
  };
  try{
    var {error}=await sb.from('asns').insert([payload]);
    if(error) throw error;
    showToast('Inbound notice submitted!');
    document.getElementById('asnModal').style.display='none';
    _asnLoaded=false;
    loadAsns().then(function(){showPage('inbound');});
  }catch(e){showToast('Error: '+e.message);}
}

function closeModal(id){var el=document.getElementById(id);if(el)el.style.display='none';}


// ── EXPORT INVENTORY CSV ──
function exportInvCSV(){
  const visibleCols = _invCols.filter(c=>c.visible && !(role==='customer' && c.key==='customer'));
  const headers = visibleCols.map(c=>c.label);
  const rows = [];
  _sbPallets.forEach(p=>{
    const truck = _sbTrucks.find(t=>t.id===p.truck_id);
    const cust = CUSTOMERS.find(c=>c.id===p.cust_id);
    const custName = cust?.name||p.cust_id||'';
    const items = (p.items&&p.items.length)?p.items:[{}];
    items.forEach(item=>{
      const row = {};
      visibleCols.forEach(col=>{
        row[col.label] = getCellValue(p, item, col.key, truck, custName)||'';
      });
      rows.push(row);
    });
  });
  const escape = v=>{ const s=String(v||''); return (s.includes(',')||s.includes('"')||s.includes('\n'))?'"'+s.replace(/"/g,'""')+'"':s; };
  const csv = [headers.map(escape).join(','), ...rows.map(r=>headers.map(h=>escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download='shiplyco-inventory-'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('CSV exported');
}

// ── DISPOSE SYSTEM (customer only) ──
let _disposeItems = []; // {palletId, itemIdx, desc, units}

function openDisposeModal(){
  document.getElementById('disposeModal').style.display='flex';
  renderDisposePicker();
}

function renderDisposePicker(){
  const body = document.getElementById('disposeBody');
  if(!body) return;
  const myPallets = _sbPallets.filter(p=>role!=='customer'||p.cust_id===currentCustId);
  if(!myPallets.length){ body.innerHTML='<div style="padding:20px;color:var(--ink3)">No inventory found.</div>'; return; }

  let html = '<div style="font-size:13px;color:var(--ink3);margin-bottom:12px">Select items to dispose. ShiplyCo charges $5 per pallet for disposal.</div>';
  html += '<div style="max-height:50vh;overflow-y:auto">';
  myPallets.forEach(p=>{
    const items = p.items||[];
    items.forEach((item,idx)=>{
      const key = p.id+'_'+idx;
      const checked = _disposeItems.some(d=>d.key===key);
      html += '<label style="display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid var(--border);cursor:pointer">'
        +'<input type="checkbox" data-key="'+key+'" data-pid="'+p.id+'" data-idx="'+idx+'" '+(checked?'checked':'')+' onchange="toggleDisposeItem(this)" style="width:16px;height:16px;accent-color:var(--red)"/>'
        +'<div style="flex:1">'
          +'<div style="font-weight:700;font-size:13px">'+(item.desc||item.sku||'Item')+' — Pallet '+p.pallet_num+'</div>'
          +'<div style="font-size:12px;color:var(--ink3)">'+(item.units||0)+' units'+(item.sku?' · '+item.sku:'')+(p.location?' · '+p.location:'')+'</div>'
        +'</div>'
        +'</label>';
    });
  });
  html += '</div>';
  html += '<div style="margin-top:12px;padding:12px;background:var(--orange-bg);border-radius:8px;font-size:13px">'
    +'<strong id="disposeCount">0 items selected</strong> — disposal requests are reviewed by ShiplyCo before processing.</div>';
  body.innerHTML = html;
}

function toggleDisposeItem(el){
  const key=el.dataset.key, pid=el.dataset.pid, idx=parseInt(el.dataset.idx);
  if(el.checked){
    const p=_sbPallets.find(x=>x.id===pid);
    if(p){ const item=p.items[idx]; _disposeItems.push({key,palletId:pid,itemIdx:idx,desc:item.desc||item.sku||'Item',units:item.units||0,pallet_num:p.pallet_num}); }
  } else {
    _disposeItems = _disposeItems.filter(d=>d.key!==key);
  }
  const cnt=document.getElementById('disposeCount');
  if(cnt) cnt.textContent=_disposeItems.length+' item'+(  _disposeItems.length!==1?'s':'')+' selected';
}

async function submitDispose(){
  if(!_disposeItems.length){ showToast('Select at least one item to dispose'); return; }
  const notes = document.getElementById('disposeNotes')?.value||'';
  const payload = {
    cust_id: currentCustId,
    type: 'dispose',
    status: 'pending',
    notes: notes,
    items: _disposeItems.map(d=>({palletId:d.palletId,itemIdx:d.itemIdx,desc:d.desc,units:d.units,pallet_num:d.pallet_num})),
    created_at: new Date().toISOString(),
    fee: _disposeItems.length * 5
  };
  try{
    const {error} = await sb.from('orders').insert([payload]);
    if(error) throw error;
    showToast('Disposal request submitted. ShiplyCo will process within 2 business days.');
    document.getElementById('disposeModal').style.display='none';
    _disposeItems=[];
  }catch(e){
    showToast('Error: '+e.message);
  }
}


let SKU_CATALOG=[];
let _skuEditId=null;
let _skuLoaded=false;

async function loadSkuCatalog(){
  try{
    const {data,error} = await sb.from('sku_catalog').select('*').order('name').limit(2000);
    if(error) throw error;
    SKU_CATALOG = data||[];
    _skuLoaded = true;
  }catch(e){
    console.warn('SKU catalog load error:',e);
    _skuLoaded = true;
  }
}

function pgSkuMaster(){
  if(!_skuLoaded){
    loadSkuCatalog().then(()=>{
      const mc = document.getElementById('mainContent');
      if(mc){ mc.innerHTML = '<div class="page">'+_buildSkuPage()+'</div>'; filterSkuTable(); }
    });
    return '<div style="padding:40px;text-align:center;color:var(--ink3)"><span style="animation:spin 1s linear infinite;display:inline-block">&#9203;</span> Loading product catalog…</div>';
  }
  setTimeout(filterSkuTable, 50);
  return _buildSkuPage();
}


function _buildSkuPage(){
  const totalSkus = SKU_CATALOG.length;
  const customers = [...new Set(SKU_CATALOG.map(s=>s.cust_id).filter(Boolean))];
  const custOptions = customers.map(cid=>{ const c=CUSTOMERS.find(x=>x.id===cid); return '<option value="'+cid+'">'+(c?c.name:cid)+'</option>'; }).join('');
  const addBtn = role==='admin' ? '<button class="btn btn-red" onclick="openSkuModal()">+ Add SKU</button>' : '';
  const adminTh = role==='admin' ? '<th></th>' : '';

  return '<div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">'
    +'<div><div class="pg-title">SKU Master \u2014 Item Catalog</div>'
    +'<div class="pg-sub" id="skuSubtitle">'+totalSkus+' products</div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
    +'<button class="btn" onclick="_skuLoaded=false;loadSkuCatalog().then(()=>showPage(\'skumaster\'))">&#8635; Refresh</button>'
    +addBtn+'</div></div>'

    +'<div class="stats" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">'
    +'<div class="stat"><div class="stat-lbl">Total SKUs</div><div class="stat-val">'+totalSkus+'</div><span class="tag tb">In catalog</span></div>'
    +'<div class="stat"><div class="stat-lbl">Customers</div><div class="stat-val">'+customers.length+'</div></div>'
    +'<div class="stat"><div class="stat-lbl">Hazmat</div><div class="stat-val">'+SKU_CATALOG.filter(s=>s.hazmat).length+'</div></div>'
    +'</div>'

    +'<div class="card" style="padding:12px 16px;margin-bottom:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">'
    +'<div class="sw" style="flex:2;min-width:200px">'+ico('search')
    +'<input class="si" id="skuSearchInput" placeholder="Search name, SKU, UPC, brand\u2026" oninput="filterSkuTable()"/></div>'
    +'<select id="skuCustFilter" onchange="filterSkuTable()" style="padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;font-size:13px">'
    +'<option value="">All Customers</option>'+custOptions+'</select>'
    +'<select id="skuSortField" onchange="filterSkuTable()" style="padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;font-size:13px">'
    +'<option value="name">Sort: Name</option><option value="sku">Sort: SKU</option>'
    +'<option value="upc">Sort: UPC</option><option value="cust">Sort: Customer</option></select></div>'

    +'<div class="card" style="overflow:hidden;padding:0">'
    +'<div style="overflow-x:auto;overflow-y:auto;max-height:70vh">'
    +'<table style="width:100%;border-collapse:collapse;min-width:700px">'
    +'<thead style="position:sticky;top:0;z-index:10">'
    +'<tr style="background:var(--surface2)">'
    +'<th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Name</th>'
    +'<th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">SKU</th>'
    +'<th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">UPC</th>'
    +'<th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Customer</th>'
    +'<th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Color</th>'
    +'<th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Size</th>'
    +'<th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Brand</th>'
    +adminTh+'</tr></thead>'
    +'<tbody id="skuTableBody"><tr><td colspan="8" style="text-align:center;padding:40px;color:var(--ink3)">Loading\u2026</td></tr></tbody>'
    +'</table></div>'
    +'<div id="skuTableFooter" style="padding:10px 16px;border-top:1px solid var(--border);font-size:12px;color:var(--ink3);background:var(--surface2)"></div>'
    +'</div>'

    +'<div class="modal-bg" id="skuModal" style="display:none" onclick="if(event.target===this)this.style.display=\'none\'">'
    +'<div class="modal" style="max-width:500px;width:95vw">'
    +'<div class="modal-head"><span class="modal-title" id="skuModalTitle">Add SKU</span>'
    +'<button class="modal-close" onclick="document.getElementById(\'skuModal\').style.display=\'none\'">&#215;</button></div>'
    +'<div class="modal-body"><input type="hidden" id="sm_id"/>'
    +'<div class="fg2">'
    +'<div class="field"><label>SKU</label><input id="sm_sku" placeholder="ABC-123"/></div>'
    +'<div class="field"><label>UPC</label><input id="sm_upc" placeholder="012345678901"/></div>'
    +'<div class="field" style="grid-column:span 2"><label>Product Name *</label><input id="sm_name" placeholder="Full product name"/></div>'
    +'<div class="field"><label>Brand</label><input id="sm_brand" placeholder="Brand"/></div>'
    +'<div class="field"><label>Customer</label><select id="sm_cust">'
    +(CUSTOMERS||[]).map(c=>'<option value="'+c.id+'">'+c.name+'</option>').join('')
    +'</select></div>'
    +'<div class="field"><label>Color</label><input id="sm_color" placeholder="Color"/></div>'
    +'<div class="field"><label>Size</label><input id="sm_size" placeholder="Size"/></div>'
    +'<div class="field" style="grid-column:span 2"><label>Notes</label><input id="sm_notes" placeholder="Notes"/></div>'
    +'</div>'
    +'<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;margin-top:8px">'
    +'<input type="checkbox" id="sm_hazmat"/> Hazmat</label></div>'
    +'<div class="modal-foot">'
    +'<button class="btn" onclick="document.getElementById(\'skuModal\').style.display=\'none\'">Cancel</button>'
    +'<button class="btn btn-red" onclick="saveSkuItem()">Save SKU</button>'
    +'</div></div></div>';
}

function filterSkuTable(){
  const q = (document.getElementById('skuSearchInput')?.value||'').toLowerCase();
  const custFilter = document.getElementById('skuCustFilter')?.value||'';
  const sortField = document.getElementById('skuSortField')?.value||'name';
  const tbody = document.getElementById('skuTableBody');
  const footer = document.getElementById('skuTableFooter');
  if(!tbody) return;

  let list = SKU_CATALOG.filter(s=>{
    if(custFilter && s.cust_id !== custFilter) return false;
    if(!q) return true;
    return (s.name||'').toLowerCase().includes(q)
        || (s.sku||'').toLowerCase().includes(q)
        || (s.upc||'').toLowerCase().includes(q)
        || (s.brand||'').toLowerCase().includes(q)
        || (s.color||'').toLowerCase().includes(q);
  });

  list.sort((a,b)=>{
    if(sortField==='sku') return (a.sku||'').localeCompare(b.sku||'');
    if(sortField==='upc') return (a.upc||'').localeCompare(b.upc||'');
    if(sortField==='cust') return (a.cust_id||'').localeCompare(b.cust_id||'');
    return (a.name||'').localeCompare(b.name||'');
  });

  if(!list.length){
    tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--ink3)">No SKUs found</td></tr>';
    if(footer) footer.textContent='0 results';
    return;
  }

  tbody.innerHTML = list.map(s=>{
    const cust = CUSTOMERS.find(c=>c.id===s.cust_id);
    const adminCols = role==='admin'
      ? '<td style="padding:10px 14px"><div style="display:flex;gap:6px">'
        +'<button class="act-btn" data-id="'+s.id+'" onclick="openSkuModal(this.dataset.id)" style="background:var(--blue-bg);color:var(--blue);font-size:10px">Edit</button>'
        +'<button class="act-btn" data-id="'+s.id+'" onclick="deleteSkuItem(this.dataset.id)" style="background:var(--red-light);color:var(--red);font-size:10px">✕</button>'
        +'</div></td>'
      : '';
    return '<tr style="border-bottom:1px solid var(--border)">'
      +'<td style="padding:10px 14px;font-size:13px;font-weight:600;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+(s.name||'')+'">'+(s.name||'<span style="color:var(--ink3)">—</span>')+'</td>'
      +'<td style="padding:10px 14px;font-family:monospace;font-size:12px;color:var(--ink2)">'+(s.sku||'—')+'</td>'
      +'<td style="padding:10px 14px;font-family:monospace;font-size:12px;color:var(--ink3)">'+(s.upc||'—')+'</td>'
      +'<td style="padding:10px 14px;font-size:12px;color:var(--red);font-weight:600">'+(cust?cust.name:s.cust_id||'—')+'</td>'
      +'<td style="padding:10px 14px;font-size:12px">'+(s.color||'—')+'</td>'
      +'<td style="padding:10px 14px;font-size:12px">'+(s.size||'—')+'</td>'
      +'<td style="padding:10px 14px;font-size:12px">'+(s.brand||'—')+'</td>'
      +adminCols
      +'</tr>';
  }).join('');

  if(footer) footer.innerHTML='<span>'+list.length+' of '+SKU_CATALOG.length+' SKUs</span>';
  const sub = document.getElementById('skuSubtitle');
  if(sub) sub.textContent = list.length+' of '+SKU_CATALOG.length+' products';
}


function renderSkuCards(skus){
  if(!skus.length) return '<div style="text-align:center;padding:48px;color:var(--ink3)"><div style="font-size:32px">📋</div><div style="font-weight:600;margin-top:8px">No SKUs found</div></div>';
  return skus.map(s=>{
    const cust = CUSTOMERS.find(c=>c.id===(s.cust_id||s.custId));
    const hasDims = !!(s.outer_l||s.outer_w||s.outer_h);
    return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;margin-bottom:10px;overflow:hidden">'
      +'<div style="padding:14px 18px;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">'
        +'<div style="flex:1;min-width:0">'
          +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">'
            +'<span style="font-size:17px;font-weight:800">'+(s.name||'—')+'</span>'
            +(s.category?'<span class="tag tb" style="font-size:10px">'+s.category+'</span>':'')
            +(s.hazmat?'<span class="tag tr" style="font-size:10px">☢ Hazmat</span>':'')
          +'</div>'
          +'<div style="font-size:12px;color:var(--ink3)">'
            +(s.sku?'SKU: <span style="font-family:monospace;font-weight:600;color:var(--ink2)">'+s.sku+'</span>&nbsp;·&nbsp;':'')
            +(s.upc?'UPC: <span style="font-family:monospace;font-weight:600;color:var(--ink2)">'+s.upc+'</span>&nbsp;·&nbsp;':'')
            +(s.brand?s.brand+'&nbsp;·&nbsp;':'')
            +(s.color?s.color+'&nbsp;·&nbsp;':'')
            +(s.size?s.size+'&nbsp;·&nbsp;':'')
            +(cust?'<span style="color:var(--red)">'+cust.name+'</span>':'')
          +'</div>'
          +(s.notes?'<div style="font-size:11px;color:var(--orange);margin-top:3px">📝 '+s.notes+'</div>':'')
        +'</div>'
        +(role==='admin'
          ?'<div style="display:flex;gap:6px">'
            +'<button class="act-btn" onclick="openSkuModal(\"'+s.id+'\")" style="background:var(--blue-bg);color:var(--blue);font-size:11px">Edit</button>'
            +'<button class="act-btn" onclick="deleteSkuItem(\"'+s.id+'\")" style="background:var(--red-light);color:var(--red);font-size:11px">✕</button>'
          +'</div>'
          :'')
      +'</div>'
      +(hasDims
        ?'<div style="border-top:1px solid var(--border2);padding:10px 18px;font-size:12px;color:var(--ink3);background:var(--surface2)">'
          +'Dims: '+[s.outer_l,s.outer_w,s.outer_h].filter(Boolean).join(' × ')+'"'
          +(s.outer_weight?' · '+s.outer_weight+' lbs':'')
          +(s.outer_units_per_carton?' · '+s.outer_units_per_carton+' units/carton':'')
        +'</div>'
        :'')
    +'</div>';
  }).join('');
}

function filterSkus(){
  const q=document.getElementById('skuSearch')?.value?.toLowerCase()||'';
  const filtered=q?SKU_CATALOG.filter(s=>(s.name+s.sku+s.brand+s.color+s.category).toLowerCase().includes(q)):SKU_CATALOG;
  const grid=document.getElementById('skuGrid');
  if(grid)grid.innerHTML=renderSkuCards(filtered);
}

function openSkuModal(id){
  _skuEditId=id||null;
  document.getElementById('skuModalTitle').textContent=id?'Edit SKU':'Add SKU';
  const s=id?SKU_CATALOG.find(x=>x.id===id):null;
  const setVal=(eid,v)=>{const e=document.getElementById(eid);if(e)e.value=v??'';};
  const setChk=(eid,v)=>{const e=document.getElementById(eid);if(e)e.checked=!!v;};
  setVal('sm_sku',s?.sku);setVal('sm_name',s?.name);setVal('sm_brand',s?.brand);
  setVal('sm_color',s?.color);setVal('sm_size',s?.size);setVal('sm_notes',s?.notes);
  if(s?.category){const e=document.getElementById('sm_cat');if(e)e.value=s.category;}
  if(s?.condition){const e=document.getElementById('sm_cond');if(e)e.value=s.condition;}
  if(s?.custId){const e=document.getElementById('sm_cust');if(e)e.value=s.custId;}
  setChk('sm_hazmat',s?.hazmat);setChk('sm_lot',s?.lotTracking);setChk('sm_serial',s?.serialTracking);
  // Outer
  setVal('sm_ol',s?.outer?.l);setVal('sm_ow',s?.outer?.w);setVal('sm_oh',s?.outer?.h);
  setVal('sm_owt',s?.outer?.weightLb);setVal('sm_oupc',s?.outer?.unitsPerCarton);
  // Inner
  setVal('sm_il',s?.inner?.l);setVal('sm_iw',s?.inner?.w);setVal('sm_ih',s?.inner?.h);
  setVal('sm_iwt',s?.inner?.weightLb);setVal('sm_iupc',s?.inner?.unitsPerCarton);
  // Each
  setVal('sm_el',s?.each?.l);setVal('sm_ew',s?.each?.w);setVal('sm_eh',s?.each?.h);setVal('sm_ewt',s?.each?.weightLb);
  document.getElementById('skuModal').classList.add('open');
}

function saveSkuItem(){
  const name=document.getElementById('sm_name').value.trim();
  if(!name){showToast('⚠ Product name required');return;}
  const getF=(id)=>{const e=document.getElementById(id);return e?parseFloat(e.value)||0:0;};
  const getI=(id)=>{const e=document.getElementById(id);return e?parseInt(e.value)||0:0;};
  const getV=(id)=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  const getC=(id)=>{const e=document.getElementById(id);return e?e.checked:false;};
  const il=getF('sm_il'),iw=getF('sm_iw'),ih=getF('sm_ih');
  const el=getF('sm_el'),ew=getF('sm_ew'),eh=getF('sm_eh');
  const data={
    sku:getV('sm_sku'),name,category:getV('sm_cat'),brand:getV('sm_brand'),
    color:getV('sm_color'),size:getV('sm_size'),condition:getV('sm_cond'),
    custId:getV('sm_cust'),notes:getV('sm_notes'),
    hazmat:getC('sm_hazmat'),lotTracking:getC('sm_lot'),serialTracking:getC('sm_serial'),
    outer:{l:getF('sm_ol'),w:getF('sm_ow'),h:getF('sm_oh'),weightLb:getF('sm_owt'),unitsPerCarton:getI('sm_oupc')},
    inner:(il&&iw&&ih)?{l:il,w:iw,h:ih,weightLb:getF('sm_iwt'),unitsPerCarton:getI('sm_iupc')}:null,
    each:(el&&ew&&eh)?{l:el,w:ew,h:eh,weightLb:getF('sm_ewt')}:null,
  };
}
// old saveSkuItem body removed — new async version handles saves



// ══════════════════════════════════════════════
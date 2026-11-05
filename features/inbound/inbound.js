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

// ── INVENTORY DATA GRID ──
let _invFilters = {search:'', cust:'', truck:''};
let _disposeSelected = new Set();
let _invColFilters = {};
let _invSort = 'pallet_num';
let _invSortDir = 1;

// Column definitions — defaults
const _invColDefaults = [
  {key:'aging',       label:'Aging',        visible:true},
  {key:'pallet_num',  label:'Pallet #',    visible:true},
  {key:'location',    label:'Location',     visible:true},
  {key:'customer',    label:'Customer',     visible:true},
  {key:'truck',       label:'Truck',        visible:true},
  {key:'received_date',label:'Received',   visible:true},
  {key:'upc',         label:'UPC',          visible:true},
  {key:'sku',         label:'SKU / Item #', visible:true},
  {key:'cartonDesc',  label:'Carton Desc',  visible:true},
  {key:'desc',        label:'Item Desc',    visible:true},
  {key:'color',       label:'Color',        visible:true},
  {key:'size',        label:'Size',         visible:true},
  {key:'caseCount',   label:'Cases',        visible:true},
  {key:'casepack',    label:'Casepack',     visible:true},
  {key:'totalUnits',  label:'Total Units',  visible:true},
  {key:'looseQty',    label:'Loose Qty',    visible:true},
  {key:'retail',      label:'Retail Price', visible:true},
  {key:'notes',       label:'Notes',        visible:true},
];

function _invLoadLayout(){
  try{
    const saved = localStorage.getItem('shiplyco_inv_layout');
    if(saved){
      const {cols, widths} = JSON.parse(saved);
      // Merge saved order/visibility into defaults (handles new columns added later)
      const merged = [];
      cols.forEach(s=>{ const d=_invColDefaults.find(x=>x.key===s.key); if(d) merged.push({...d, visible:s.visible}); });
      // Add any new columns not in saved layout
      _invColDefaults.forEach(d=>{ if(!merged.find(m=>m.key===d.key)) merged.push(d); });
      if(widths) Object.assign(_invColWidths, widths);
      return merged;
    }
  }catch(e){}
  return _invColDefaults.map(c=>({...c}));
}

function _invSaveLayout(){
  try{
    localStorage.setItem('shiplyco_inv_layout', JSON.stringify({
      cols: _invCols.map(c=>({key:c.key, visible:c.visible})),
      widths: _invColWidths
    }));
  }catch(e){}
}

let _invCols = _invLoadLayout();

function toggleColPicker(){
  const el = document.getElementById('colPicker');
  if(el) el.style.display = el.style.display==='none'?'flex':'none';
}

function toggleCol(key, visible){
  const col = _invCols.find(c=>c.key===key);
  if(col) col.visible = visible;
  _invSaveLayout();
  renderInvTable();
}

// ── Default column widths (px) ──
let _invColWidths = {
  pallet_num:80, location:90, customer:140, truck:100, received_date:95,
  upc:120, sku:120, cartonDesc:180, desc:200, color:100, size:80,
  caseCount:70, casepack:80, totalUnits:90, looseQty:80, retail:90, notes:160
};

function getCellValue(p, item, colKey, truck, custName){
  switch(colKey){
    case 'aging': {
      const rd = p.received_date || p.created_at;
      if(!rd) return '?';
      const days = Math.floor((Date.now()-new Date(rd).getTime())/(1000*60*60*24));
      return String(days);
    }
    case 'pallet_num':    return String(p.pallet_num||'');
    case 'location':      return p.location||'';
    case 'customer':      return custName;
    case 'truck':         return truck?.name||p.truck_id||'';
    case 'received_date': return p.received_date||'';
    case 'upc':           return item.upc||'';
    case 'sku':           return item.sku||item.itemNum||'';
    case 'cartonDesc':    return item.cartonDesc||'';
    case 'desc':          return item.desc||'';
    case 'color':         return item.color||'';
    case 'size':          return item.size||'';
    case 'caseCount':     return String(parseInt(item.caseCount)||0);
    case 'casepack':      return String(item.casepack||'');
    case 'totalUnits':    return String(parseInt(item.totalUnits)||0);
    case 'looseQty':      return String(parseInt(item.looseQty)||0);
    case 'retail':        return item.retail||'';
    case 'notes':         return item.notes||'';
    default:              return '';
  }
}

function renderInvTable(){
  const visibleCols = _invCols.filter(c=>c.visible && !(role==='customer' && c.key==='customer'));
  const tbody = document.getElementById('invTable');
  const footer = document.getElementById('invTableFooter');
  const subtitle = document.getElementById('invSubtitle');
  if(!tbody) return;

  // Build flat rows — ONE ROW PER ITEM
  let rows = [];
  _sbPallets.forEach(p=>{
    const truck = _sbTrucks.find(t=>t.id===p.truck_id);
    const cust = CUSTOMERS.find(c=>c.id===p.cust_id);
    const custName = cust?.name||p.cust_id||'';
    const items = (p.items&&p.items.length) ? p.items : [{}];
    items.forEach((item, itemIdx)=>{
      const vals = {};
      visibleCols.forEach(col=>{
        vals[col.key] = getCellValue(p, item, col.key, truck, custName);
      });
      rows.push({p, item, itemIdx, isFirst: itemIdx===0, totalItems: items.length, vals, custName});
    });
  });

  // Apply column filters
  Object.entries(_invColFilters).forEach(([key, val])=>{
    if(!val) return;
    const q = val.toLowerCase();
    rows = rows.filter(r=>(r.vals[key]||'').toLowerCase().includes(q));
  });

  // Sort
  rows.sort((a,b)=>{
    let av = a.vals[_invSort]||'';
    let bv = b.vals[_invSort]||'';
    if(['pallet_num','totalUnits','caseCount','looseQty'].includes(_invSort)){
      av = parseFloat(av)||0; bv = parseFloat(bv)||0;
    }
    if(av===bv && _invSort!=='pallet_num') {
      // secondary sort by pallet num
      return (parseFloat(a.vals['pallet_num'])||0) - (parseFloat(b.vals['pallet_num'])||0);
    }
    return av > bv ? _invSortDir : av < bv ? -_invSortDir : 0;
  });

  // Stats
  const totalUnits = rows.reduce((s,{item})=>s+(parseInt(item.totalUnits)||0),0);
  const palletCount = new Set(rows.map(r=>r.p.id)).size;
  if(subtitle) subtitle.textContent = palletCount+' pallets · '+rows.length+' items · '+totalUnits.toLocaleString()+' units';

  // SKU summary
  const skuFilter = _invColFilters['upc']||_invColFilters['sku']||_invColFilters['desc']||'';
  const skuSummary = document.getElementById('invSkuSummary');
  if(skuFilter && skuSummary){
    const skuTotals = {};
    rows.forEach(({item})=>{
      const key = item.sku||item.upc||item.desc||'Unknown';
      const label = item.desc||item.cartonDesc||key;
      if(!skuTotals[key]) skuTotals[key]={label, units:0, rows:0};
      skuTotals[key].units += parseInt(item.totalUnits)||0;
      skuTotals[key].rows++;
    });
    const entries = Object.entries(skuTotals).sort((a,b)=>b[1].units-a[1].units);
    if(entries.length){
      let skuHtml = '<div class="card" style="margin-bottom:12px">';
      skuHtml += '<div class="card-head"><span class="card-title">SKU Summary for current filter</span></div>';
      skuHtml += '<div style="overflow-x:auto"><table>';
      skuHtml += '<thead><tr><th>Item</th><th>Rows</th><th>Total Units</th></tr></thead><tbody>';
      entries.forEach(([k,v])=>{
        skuHtml += '<tr><td><div style="font-weight:600;font-size:13px">'+v.label+'</div><div style="font-size:11px;color:var(--ink3)">'+k+'</div></td>';
        skuHtml += '<td>'+v.rows+'</td><td style="font-weight:800;color:var(--red)">'+v.units.toLocaleString()+'</td></tr>';
      });
      skuHtml += '</tbody></table></div></div>';
      skuSummary.innerHTML = skuHtml;
    } else { skuSummary.innerHTML=''; }
  } else if(skuSummary){ skuSummary.innerHTML=''; }

  // Render rows
  if(!rows.length){
    tbody.innerHTML='<tr><td colspan="'+visibleCols.length+'" style="text-align:center;padding:40px;color:var(--ink3)">No results</td></tr>';
  } else {
    let prevPalletId = null;
    let rowsHtml = '';
    rows.forEach(({p, item, itemIdx, isFirst, totalItems, vals})=>{
      const isNewPallet = p.id !== prevPalletId;
      prevPalletId = p.id;
      // Alternate shading per pallet group
      const bg = isNewPallet && itemIdx===0 ? '' : 'background:rgba(0,0,0,0.015)';
      const borderTop = isNewPallet && itemIdx===0 && rows.indexOf(rows.find(r=>r.p.id===p.id)) > 0
        ? 'border-top:2px solid var(--border2)' : '';
      const dispChecked = role==='customer' && _disposeSelected.has(String(p.id));
      rowsHtml += '<tr style="border-bottom:1px solid var(--border);'+bg+(dispChecked?';background:var(--red-light)':'')+'">';
      if(role==='customer'){
        rowsHtml += '<td style="width:36px;min-width:36px;padding:0;text-align:center;cursor:pointer" onclick="event.stopPropagation();toggleDisposeRow(\''+p.id+'\')">'
          +'<input type="checkbox"'+(dispChecked?' checked':'')
          +' style="width:15px;height:15px;accent-color:var(--red);cursor:pointer;pointer-events:none;margin:0" tabindex="-1"/>'
          +'</td>';
      }
      visibleCols.forEach(col=>{
        const v = vals[col.key]||'—';
        const w = _invColWidths[col.key]||120;
        if(col.key==='location'){
          rowsHtml += '<td style="width:'+w+'px;min-width:'+w+'px;max-width:'+w+'px"><span style="font-family:monospace;font-weight:800;font-size:13px;color:var(--red)">'+v+'</span></td>';
        } else if(col.key==='pallet_num'){
          rowsHtml += '<td style="width:'+w+'px;min-width:'+w+'px;max-width:'+w+'px;font-family:monospace;font-size:12px;color:var(--ink3)">PLT-'+String(p.pallet_num).padStart(3,'0')+'</td>';
        } else if(col.key==='totalUnits'){
          rowsHtml += '<td style="width:'+w+'px;min-width:'+w+'px;font-weight:700">'+(parseInt(v)||0).toLocaleString()+'</td>';
        } else if(col.key==='desc'||col.key==='cartonDesc'){
          rowsHtml += '<td style="width:'+w+'px;min-width:'+w+'px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:'+w+'px">'+v+'</td>';
        } else {
          rowsHtml += '<td style="width:'+w+'px;min-width:'+w+'px;max-width:'+w+'px;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+v+'</td>';
        }
      });
      rowsHtml += '</tr>';
    });
    tbody.innerHTML = rowsHtml;
  }

  if(footer) footer.innerHTML='<span>'+palletCount+' pallets · '+rows.length+' items</span><span>'+totalUnits.toLocaleString()+' total units</span>';

  // Rebuild headers (sort + filter rows)
  _renderInvHeaders(visibleCols);
  // Sync filter input values without losing focus
  visibleCols.forEach(col=>{
    const inp = document.querySelector('#invFilterRow input[data-col="'+col.key+'"]');
    if(inp && inp !== document.activeElement) inp.value = _invColFilters[col.key]||'';
  });
}

// ── Column drag-to-reorder state ──
let _dragCol = null, _dragOverCol = null;
let _invFilterTimer = null;

function _renderInvHeaders(visibleCols){
  if(!visibleCols) visibleCols = _invCols.filter(c=>c.visible);
  const sortRow = document.getElementById('invSortRow');
  if(sortRow){
    const cbTh = role==='customer'
      ? '<th style="width:36px;min-width:36px;padding:8px;text-align:center;background:var(--surface2);border-right:3px solid var(--border2);cursor:default" title="Select all">'
        +'<input type="checkbox" id="invDisposeAll" onchange="toggleDisposeAll(this.checked)" style="width:14px;height:14px;accent-color:var(--red);cursor:pointer"/></th>'
      : '';
    sortRow.innerHTML = cbTh + visibleCols.map(col=>{
      const arrow = _invSort===col.key ? (_invSortDir===1?'↑':'↓') : '↕';
      const w = _invColWidths[col.key]||120;
      return '<th draggable="true" data-colkey="'+col.key+'"'
        +' ondragstart="invColDragStart(event,\''+col.key+'\')"'
        +' ondragover="invColDragOver(event,\''+col.key+'\')"'
        +' ondragleave="invColDragLeave(event,\''+col.key+'\')"'
        +' ondrop="invColDrop(event,\''+col.key+'\')"'
        +' ondragend="invColDragEnd()"'
        +' style="position:relative;width:'+w+'px;min-width:'+w+'px;cursor:grab;user-select:none;'
        +'white-space:nowrap;padding:10px 22px 10px 10px;font-size:11px;text-transform:uppercase;'
        +'letter-spacing:0.5px;background:var(--surface2);border-right:3px solid var(--border2)">'
        +'<span onclick="if(!_dragCol){_invSort=\''+col.key+'\';_invSortDir*=-1;renderInvTable();}" style="cursor:pointer">'+col.label+' '+arrow+'</span>'
        +'<div onmousedown="startColResize(event,\''+col.key+'\')" onclick="event.stopPropagation()" draggable="false"'
        +' title="Drag edge to resize"'
        +' style="position:absolute;right:0;top:0;bottom:0;width:8px;cursor:col-resize;z-index:2;'
        +'background:repeating-linear-gradient(to bottom,var(--border2) 0px,var(--border2) 2px,transparent 2px,transparent 5px)"></div>'
        +'</th>';
    }).join('');
  }
  const filterRow = document.getElementById('invFilterRow');
  if(filterRow){
    const cbFilterTh = role==='customer'
      ? '<th style="width:36px;min-width:36px;background:var(--bg);border-right:3px solid var(--border2)"></th>'
      : '';
    filterRow.innerHTML = cbFilterTh + visibleCols.map(col=>{
      const val = _invColFilters[col.key]||'';
      const w = _invColWidths[col.key]||120;
      return '<th style="padding:4px 6px;width:'+w+'px;min-width:'+w+'px;background:var(--bg);border-right:3px solid var(--border2)">'
        +'<input type="text" data-col="'+col.key+'" placeholder="Filter…" value="'+val+'"'
        +' oninput="_invColFilters[\''+col.key+'\']=this.value;clearTimeout(_invFilterTimer);_invFilterTimer=setTimeout(_renderInvBody,250)"'
        +' onkeydown="if(event.key===\'Enter\'){clearTimeout(_invFilterTimer);_renderInvBody();}"'
        +' style="width:100%;padding:4px 8px;border:1px solid var(--border);border-radius:4px;font-size:12px;font-family:Barlow,sans-serif"/>'
        +'</th>';
    }).join('');
  }
}

// ── Drag-to-reorder column handlers ──
function invColDragStart(e, colKey){
  _dragCol = colKey;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(()=>{ const el=document.querySelector('[data-colkey="'+colKey+'"]'); if(el) el.style.opacity='0.4'; },0);
}
function invColDragOver(e, colKey){
  if(!_dragCol || colKey===_dragCol) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  _dragOverCol = colKey;
  document.querySelectorAll('#invSortRow th').forEach(th=>{
    th.style.outline = th.dataset.colkey===colKey ? '2px solid var(--red)' : '';
  });
}
function invColDragLeave(e, colKey){
  if(!e.currentTarget.contains(e.relatedTarget)){
    e.currentTarget.style.outline='';
    if(_dragOverCol===colKey) _dragOverCol=null;
  }
}
function invColDrop(e, targetKey){
  e.preventDefault();
  if(!_dragCol||_dragCol===targetKey) return;
  const fromIdx = _invCols.findIndex(c=>c.key===_dragCol);
  const toIdx   = _invCols.findIndex(c=>c.key===targetKey);
  if(fromIdx<0||toIdx<0) return;
  const moved = _invCols.splice(fromIdx,1)[0];
  _invCols.splice(toIdx,0,moved);
  _invSaveLayout();
  _dragCol=null; _dragOverCol=null;
  renderInvTable();
}
function invColDragEnd(){
  document.querySelectorAll('#invSortRow th').forEach(th=>{ th.style.opacity=''; th.style.outline=''; });
  _dragCol=null; _dragOverCol=null;
}

// Only re-render tbody — called by filter inputs so headers stay intact
function _renderInvBody(){
  const visibleCols = _invCols.filter(c=>c.visible && !(role==='customer' && c.key==='customer'));
  const tbody = document.getElementById('invTable');
  const footer = document.getElementById('invTableFooter');
  const subtitle = document.getElementById('invSubtitle');
  if(!tbody) return;

  let rows = [];
  _sbPallets.forEach(p=>{
    const truck = _sbTrucks.find(t=>t.id===p.truck_id);
    const cust = CUSTOMERS.find(c=>c.id===p.cust_id);
    const custName = cust?.name||p.cust_id||'';
    const items = (p.items&&p.items.length) ? p.items : [{}];
    items.forEach((item)=>{
      const vals = {};
      visibleCols.forEach(col=>{ vals[col.key] = getCellValue(p, item, col.key, truck, custName); });
      rows.push({p, item, vals});
    });
  });

  Object.entries(_invColFilters).forEach(([key, val])=>{
    if(!val) return;
    const q = val.toLowerCase();
    rows = rows.filter(r=>(r.vals[key]||'').toLowerCase().includes(q));
  });

  rows.sort((a,b)=>{
    let av = a.vals[_invSort]||'', bv = b.vals[_invSort]||'';
    if(['pallet_num','totalUnits','caseCount','looseQty'].includes(_invSort)){
      av = parseFloat(av)||0; bv = parseFloat(bv)||0;
    }
    return av > bv ? _invSortDir : av < bv ? -_invSortDir : 0;
  });

  const totalUnits = rows.reduce((s,{item})=>s+(parseInt(item.totalUnits)||0),0);
  const palletCount = new Set(rows.map(r=>r.p.id)).size;
  if(subtitle) subtitle.textContent = palletCount+' pallets · '+rows.length+' items · '+totalUnits.toLocaleString()+' units';

  // SKU summary
  const skuFilter = _invColFilters['upc']||_invColFilters['sku']||_invColFilters['desc']||'';
  const skuSummary = document.getElementById('invSkuSummary');
  if(skuFilter && skuSummary){
    const skuTotals = {};
    rows.forEach(({item})=>{
      const key = item.sku||item.upc||item.desc||'Unknown';
      const label = item.desc||item.cartonDesc||key;
      if(!skuTotals[key]) skuTotals[key]={label,units:0,rows:0};
      skuTotals[key].units += parseInt(item.totalUnits)||0;
      skuTotals[key].rows++;
    });
    const entries = Object.entries(skuTotals).sort((a,b)=>b[1].units-a[1].units);
    if(entries.length){
      let h='<div class="card" style="margin-bottom:12px"><div class="card-head"><span class="card-title">SKU Summary</span></div><div style="overflow-x:auto"><table><thead><tr><th>Item</th><th>Rows</th><th>Total Units</th></tr></thead><tbody>';
      entries.forEach(([k,v])=>{ h+='<tr><td><div style="font-weight:600;font-size:13px">'+v.label+'</div><div style="font-size:11px;color:var(--ink3)">'+k+'</div></td><td>'+v.rows+'</td><td style="font-weight:800;color:var(--red)">'+v.units.toLocaleString()+'</td></tr>'; });
      h+='</tbody></table></div></div>';
      skuSummary.innerHTML=h;
    } else { skuSummary.innerHTML=''; }
  } else if(skuSummary){ skuSummary.innerHTML=''; }

  if(!rows.length){
    tbody.innerHTML='<tr><td colspan="'+visibleCols.length+'" style="text-align:center;padding:40px;color:var(--ink3)">No results — clear filters to see all inventory</td></tr>';
  } else {
    let prevPalletId=null, html='';
    rows.forEach(({p, item, vals})=>{
      const isNewPallet = p.id!==prevPalletId;
      prevPalletId = p.id;
      const dispChecked2 = role==='customer' && _disposeSelected.has(String(p.id));
      html += '<tr style="border-bottom:1px solid var(--border)'+(isNewPallet?';border-top:2px solid var(--border2)':'')+(dispChecked2?';background:var(--red-light)':'')+'">';
      if(role==='customer'){
        html += '<td style="width:36px;min-width:36px;padding:0;text-align:center;cursor:pointer" onclick="event.stopPropagation();toggleDisposeRow(\''+p.id+'\')">'
          +'<input type="checkbox"'+(dispChecked2?' checked':'')
          +' style="width:15px;height:15px;accent-color:var(--red);cursor:pointer;pointer-events:none;margin:0" tabindex="-1"/>'
          +'</td>';
      }
      visibleCols.forEach(col=>{
        const v = vals[col.key]||'—';
        const w = _invColWidths[col.key]||120;
        const ws = 'width:'+w+'px;min-width:'+w+'px;max-width:'+w+'px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        if(col.key==='aging'){
          const days = parseInt(v)||0;
          const bg = days<=90?'var(--green-bg)':days<=180?'var(--orange-bg)':'var(--red-light)';
          const fc = days<=90?'var(--green)':days<=180?'var(--orange)':'var(--red)';
          html+='<td style="'+ws+'background:'+bg+';text-align:center"><span style="color:'+fc+';font-weight:800;font-size:12px">'+days+'d</span></td>';
        } else if(col.key==='location') html+='<td style="'+ws+'"><span style="font-family:monospace;font-weight:800;font-size:13px;color:var(--red)">'+v+'</span></td>';
        else if(col.key==='pallet_num') html+='<td style="'+ws+'font-family:monospace;font-size:12px;color:var(--ink3)">PLT-'+String(p.pallet_num).padStart(3,'0')+'</td>';
        else if(col.key==='totalUnits') html+='<td style="'+ws+'font-weight:700">'+(parseInt(v)||0).toLocaleString()+'</td>';
        else html+='<td style="'+ws+'font-size:13px" title="'+v+'">'+v+'</td>';
      });
      html+='</tr>';
    });
    tbody.innerHTML=html;
  }
  if(footer) footer.innerHTML='<span>'+palletCount+' pallets · '+rows.length+' items</span><span>'+totalUnits.toLocaleString()+' total units</span>';
}


// ── Column resize drag ──
let _resizeCol = null, _resizeStartX = 0, _resizeStartW = 0;
function startColResize(e, colKey){
  e.preventDefault();
  _resizeCol = colKey;
  _resizeStartX = e.clientX;
  _resizeStartW = _invColWidths[colKey]||120;
  document.addEventListener('mousemove', _onColResize);
  document.addEventListener('mouseup', _stopColResize);
}
function _onColResize(e){
  if(!_resizeCol) return;
  const delta = e.clientX - _resizeStartX;
  _invColWidths[_resizeCol] = Math.max(50, _resizeStartW + delta);
  // Update column widths live without full re-render
  renderInvTable();
}
function _stopColResize(){
  if(_resizeCol) _invSaveLayout();
  _resizeCol = null;
  document.removeEventListener('mousemove', _onColResize);
  document.removeEventListener('mouseup', _stopColResize);
}

// Call renderInvTable after inventory loads
async function loadInventoryAndRender(){
  await loadInventory();
  setTimeout(renderInvTable, 100);
}

// ── NOTIFICATION SYSTEM (lives here so it loads before all modules that reference it) ──
function toggleNotif(){
  const p=document.getElementById('notifPanel');
  p.classList.toggle('open');
  renderNotifs();
}
function renderNotifs(){
  const list=document.getElementById('notifList');
  const myNotifs=NOTIFICATIONS.filter(n=>role==='customer'||role==='admin');
  if(!myNotifs.length){list.innerHTML='<div class="notif-empty">No notifications</div>';return;}
  list.innerHTML=myNotifs.map(n=>`
    <div class="notif-item ${n.read?'':'unread'}" onclick="readNotif('${n.id}')">
      <div>${n.text}</div>
      <div class="notif-time">${n.time}</div>
    </div>`).join('');
}
function readNotif(id){
  const n=NOTIFICATIONS.find(x=>x.id===id);
  if(n)n.read=true;
  updateBadge();
  renderNotifs();
}
function markAllRead(){NOTIFICATIONS.forEach(n=>n.read=true);updateBadge();renderNotifs()}
function updateBadge(){
  const unread=NOTIFICATIONS.filter(n=>!n.read).length;
  const badge=document.getElementById('notifBadge');
  badge.textContent=unread;
  badge.style.display=unread?'flex':'none';
}
function pushNotif(text){
  NOTIFICATIONS.unshift({id:'N'+Date.now(),text,time:'Just now',read:false});
  updateBadge();
}
function toggleNotifCh(ch,el){
  if(_notifyChannels.has(ch)){_notifyChannels.delete(ch);el.classList.remove('sel');}
  else{_notifyChannels.add(ch);el.classList.add('sel');}
}
document.addEventListener('click',e=>{
  if(!e.target.closest('#notifBell')&&!e.target.closest('#notifPanel')){
    const p=document.getElementById('notifPanel');
    if(p)p.classList.remove('open');
  }
});

const SUPABASE_URL='https://xyemghdkehsfgeyidmie.supabase.co';
const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZW1naGRrZWhzZmdleWlkbWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjE3NTIsImV4cCI6MjA4ODMzNzc1Mn0.4pIvrbdbMrPIrByY9GRnDiyw15BJobPxllr8mQ0c1OA';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

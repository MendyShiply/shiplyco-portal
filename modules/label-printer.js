// ── LABEL PRINTER PAGE ──
function pgLabels(){
  const labelTypes=[
    {id:'pallet',name:'Pallet Label',icon:'📦',desc:'Full pallet — location, customer, SKU, date'},
    {id:'location',name:'Location Label',icon:'📍',desc:'Shelf/rack label — aisle, bay, level barcode'},
    {id:'case',name:'Case Label',icon:'🗃',desc:'Open case tracking — pallet, SKU, qty remaining'},
    {id:'product',name:'Product Label',icon:'🏷',desc:'Individual item — UPC, SKU, price, condition'},
  ];

  let palletLabelData=[];

  const locLabelData=['A01-A','A01-B','A02-A','A02-B','A03-A','A03-B','B01-A','B01-B','B02-A','B02-B','C01-A','D01-A','D01-B'];

  return `
  <div class="pg-head"><div class="pg-title">Label Printer</div><div class="pg-sub">Generate barcode & QR labels for pallets, locations, cases, and products — print from browser or export PDF</div></div>

  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
    ${labelTypes.map(lt=>`<div class="stat" style="cursor:pointer;border:2px solid var(--border);text-align:center" onclick="selectLabelType('${lt.id}',this)">
      <div style="font-size:28px;margin-bottom:6px">${lt.icon}</div>
      <div style="font-size:13px;font-weight:700">${lt.name}</div>
      <div style="font-size:11px;color:var(--ink3);margin-top:4px">${lt.desc}</div>
    </div>`).join('')}
  </div>

  <div id="labelConfig">
    <!-- Pallet Labels -->
    <div id="lcfg-pallet" class="card" style="margin-bottom:16px">
      <div class="card-head"><span class="card-title">📦 Pallet Labels</span><div style="display:flex;gap:8px"><button class="btn btn-red" onclick="printLabels('pallet')">🖨 Print All Selected</button><button class="btn" onclick="exportLabelPDF('pallet')">⬇ Export PDF</button></div></div>
      <div style="padding:14px 18px">
        <div style="margin-bottom:12px;font-size:12px;color:var(--ink3)">Select pallets to print labels for:</div>
        ${palletLabelData.map(p=>`
        <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer" onclick="this.classList.toggle('sel');this.style.borderColor=this.classList.contains('sel')?'var(--red)':'var(--border)';this.style.background=this.classList.contains('sel')?'var(--red-light)':''">
          <input type="checkbox" style="width:16px;height:16px;accent-color:var(--red)" onclick="event.stopPropagation();this.closest('div').classList.toggle('sel')"/>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px">${p.desc}</div>
            <div style="font-size:11px;color:var(--ink3)">📍 ${p.loc} · Pallet ${p.pallet} · SKU ${p.sku} · ${p.customer} · Received ${p.received}</div>
          </div>
          <button class="act-btn act-process" onclick="event.stopPropagation();previewLabel('pallet','${p.loc}','${p.desc.replace(/'/g,'').substring(0,30)}','${p.sku}')">Preview</button>
        </div>`).join('')}
      </div>
    </div>

    <!-- Location Labels -->
    <div id="lcfg-location" class="card" style="margin-bottom:16px">
      <div class="card-head"><span class="card-title">📍 Location Labels</span><div style="display:flex;gap:8px"><button class="btn btn-red" onclick="printLabels('location')">🖨 Print All</button><button class="btn" onclick="exportLabelPDF('location')">⬇ Export PDF</button></div></div>
      <div style="padding:14px 18px">
        <div style="margin-bottom:12px">
          <div class="field" style="max-width:300px;margin-bottom:12px">
            <label>Add Custom Location</label>
            <div style="display:flex;gap:8px">
              <input type="text" placeholder="e.g. E01-A" id="customLocInput" style="padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;flex:1"/>
              <button class="btn btn-red" onclick="addCustomLoc()">Add</button>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px" id="locLabelGrid">
          ${locLabelData.map(l=>`<div class="tslot" onclick="this.classList.toggle('sel');this.style.background=this.classList.contains('sel')?'var(--red)':'';this.style.color=this.classList.contains('sel')?'#fff':'';">${l}</div>`).join('')}
        </div>
      </div>
    </div>
  </div>

  <!-- Label Preview Modal -->
  <div class="modal-bg" id="labelPreviewModal" role="dialog" aria-modal="true" aria-labelledby="labelPreviewModal-title">
    <div class="modal" style="max-width:420px">
      <div style="padding:20px 24px;border-bottom:1px solid var(--border)">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;text-transform:uppercase">Label Preview</div>
      </div>
      <div style="padding:24px;display:flex;justify-content:center">
        <div id="labelPreviewContent"></div>
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="document.getElementById('labelPreviewModal').classList.remove('open')">Close</button>
        <button class="btn btn-red" onclick="window.print()">🖨 Print</button>
      </div>
    </div>
  </div>`;
}

function selectLabelType(type,el){
  // Highlight selected card
  document.querySelectorAll('.stat').forEach(s=>s.style.borderColor='var(--border)');
  el.style.borderColor='var(--red)';el.style.background='var(--red-light)';
  // Scroll to config
  const cfg=document.getElementById('lcfg-'+type);
  if(cfg)cfg.scrollIntoView({behavior:'smooth',block:'start'});
}

function previewLabel(type,loc,desc,sku){
  const barSvg=generateBarcode(loc.replace('-',''));
  const qrSvg=generateQRPattern(loc);
  document.getElementById('labelPreviewContent').innerHTML=`
  <div style="border:3px solid var(--ink);border-radius:8px;padding:16px 20px;width:320px;font-family:'Barlow',sans-serif;background:#fff">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
      <div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:800;letter-spacing:2px;color:var(--ink3);text-transform:uppercase">ShiplyCo Fulfillment</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:32px;font-weight:900;color:var(--red);line-height:1;letter-spacing:1px">${loc}</div>
      </div>
      <div style="text-align:right">${qrSvg}</div>
    </div>
    <div style="border-top:2px solid var(--ink);padding-top:10px;margin-bottom:10px">
      <div style="font-size:12px;font-weight:700;margin-bottom:3px">${desc}</div>
      <div style="font-size:10px;color:var(--ink3)">SKU: ${sku} · Pallet Label</div>
    </div>
    <div style="text-align:center">${barSvg}</div>
    <div style="text-align:center;font-size:10px;letter-spacing:3px;color:var(--ink3);margin-top:4px">${loc.replace('-','  ')}</div>
  </div>`;
  document.getElementById('labelPreviewModal').classList.add('open');
}

function generateBarcode(code){
  // Simple visual barcode representation
  let bars='';
  const pattern=[1,1,0,1,0,1,1,0,1,0,0,1,1,0,1,0,1,0,0,1,1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,0,1,1,0,1,0];
  const charBits=code.split('').map(c=>c.charCodeAt(0));
  const allBits=[...pattern,...charBits.flatMap(b=>[b&8?1:0,b&4?1:0,b&2?1:0,b&1?1:0,0]),...pattern];
  allBits.forEach((b,i)=>{bars+=`<rect x="${i*2.5}" y="0" width="${b?2:1.5}" height="${b?48:36}" fill="${b?'#111':'none'}"/>`});
  return `<svg width="${allBits.length*2.5}" height="54" viewBox="0 0 ${allBits.length*2.5} 54">${bars}</svg>`;
}

function generateQRPattern(text){
  // Visual QR-like pattern
  const size=8,cell=5;
  let cells='';
  const seed=text.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  for(let r=0;r<size;r++){for(let c=0;c<size;c++){
    const isCorner=(r<2&&c<2)||(r<2&&c>=size-2)||(r>=size-2&&c<2);
    const fill=isCorner||Math.sin(seed*r*c+r+c)>0.1;
    if(fill)cells+=`<rect x="${c*cell}" y="${r*cell}" width="${cell-0.5}" height="${cell-0.5}" fill="#111" rx="0.5"/>`;
  }}
  return `<svg width="${size*cell}" height="${size*cell}" viewBox="0 0 ${size*cell} ${size*cell}">${cells}</svg>`;
}

function addCustomLoc(){
  const val=document.getElementById('customLocInput')?.value?.trim();
  if(!val)return;
  const grid=document.getElementById('locLabelGrid');
  const d=document.createElement('div');
  d.className='tslot sel';d.style.background='var(--red)';d.style.color='#fff';d.textContent=val;
  d.onclick=function(){this.classList.toggle('sel');this.style.background=this.classList.contains('sel')?'var(--red)':'';this.style.color=this.classList.contains('sel')?'#fff':''};
  grid.appendChild(d);
  document.getElementById('customLocInput').value='';
}

function printLabels(type){
  showToast(`🖨 Sending ${type} labels to printer…`);
}
function exportLabelPDF(type){
  showToast(`⬇ Generating ${type} label PDF…`);
}

// ── PICK LIST PAGE — now handled by pgPickList above ──
function pgPickList_OLD2(){
  const pendingOrders=ORDERS.filter(o=>o.status==='pending'||o.status==='processed');
  const typeLabels={pallet_out:'🚚 Pallet Outbound',pickpack:'📦 Pick & Pack',fba:'🏭 FBA Prep',marketplace:'📦 Pick & Pack',fbm:'📦 Pick & Pack'};

  function getPickDirections(order){
    // For pallet outbound: use assigned pallets with priority note
    if(order.type==='pallet_out'){
      return order.pallets.map(p=>{
        const loc=INVENTORY.find(l=>l.palletNum===p.num||l.id===p.loc);
        return {loc:p.loc,desc:p.desc,units:p.units,type:'full_pallet',openCase:loc?.openCase||false,looseLeft:loc&&loc.openCase?loc.cp-loc.loosePicked:null};
      });
    }
    // For pick & pack / FBA: find best location per item using priority engine
    if(order.items&&order.items.length){
      return order.items.map(item=>{
        const best=getPickPriority(item.sku||item.desc,order.custId);
        return {loc:best?best.id:'—',desc:item.desc,units:item.qty,type:'each',openCase:best?.openCase||false,looseLeft:best&&best.openCase?best.cp-best.loosePicked:null,sku:item.sku};
      });
    }
    return [];
  }

  return `
  <div class="pg-head"><div class="pg-title">Pick Lists</div><div class="pg-sub">Active pick tasks — system directs you to the right location for each order</div></div>
  <div class="stats" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat"><div class="stat-lbl">Open Pick Tasks</div><div class="stat-val">${pendingOrders.length}</div><span class="tag to">Need picking</span></div>
    <div class="stat"><div class="stat-lbl">Pallet Pulls</div><div class="stat-val">${pendingOrders.filter(o=>o.type==='pallet_out').length}</div><span class="tag tb">Full pallets</span></div>
    <div class="stat"><div class="stat-lbl">Each Picks</div><div class="stat-val">${pendingOrders.filter(o=>o.type!=='pallet_out').length}</div><span class="tag tgd">Unit picks</span></div>
  </div>

  <!-- Pick Priority Legend -->
  <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:8px;padding:12px 16px;margin-bottom:18px;font-size:12px;color:var(--gold);font-weight:600">
    📋 <strong>Pick Priority Order:</strong> &nbsp;① Open case first (finish loose units) → ② Lowest qty pallet (deplete before opening new) → ③ Oldest received (FIFO)
  </div>

  ${pendingOrders.length===0
    ?`<div style="text-align:center;padding:60px;color:var(--ink3)"><div style="font-size:40px;margin-bottom:12px">✅</div><div style="font-size:16px;font-weight:700">No open pick tasks</div></div>`
    :pendingOrders.map(o=>{
      const directions=getPickDirections(o);
      return `
  <div class="card" style="margin-bottom:16px">
    <div class="card-head" style="background:${o.status==='pending'?'var(--orange-bg)':'var(--blue-bg)'}">
      <div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800">${o.id} · ${typeLabels[o.type]||o.type}</div>
        <div style="font-size:12px;color:var(--ink3)">Customer: ${o.customer} · ${o.date} · ${o.time} slot</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="tag ${o.status==='pending'?'to':'tb'}">${o.status}</span>
        <button class="act-btn act-process" onclick="markProcessed('${o.id}')" style="font-size:10px">✓ Mark Processed</button>
      </div>
    </div>
    <div style="padding:16px 20px">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);margin-bottom:12px">📍 Pick Directions — System Recommended Locations</div>
      ${directions.map((d,i)=>`
      <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:2px solid ${d.openCase?'var(--orange)':i===0?'var(--red)':'var(--border)'};border-radius:8px;margin-bottom:8px;background:${d.openCase?'var(--orange-bg)':i===0?'var(--red-light)':'var(--bg)'}">
        <div style="width:28px;height:28px;background:${d.openCase?'var(--orange)':i===0?'var(--red)':'var(--ink3)'};border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800;flex-shrink:0">${i+1}</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-family:monospace;font-size:16px;font-weight:900;color:var(--red)">${d.loc}</span>
            ${d.openCase?`<span class="tag to" style="font-size:11px">⚠ Open Case — ${d.looseLeft} loose units here — pick these first</span>`:''}
            ${!d.openCase&&i===0?`<span class="tag tb" style="font-size:11px">← Lowest qty · pick here first</span>`:''}
          </div>
          <div style="font-size:13px;font-weight:600">${d.desc}</div>
          <div style="font-size:12px;color:var(--ink3);margin-top:2px">
            ${d.type==='full_pallet'?`Pull entire pallet · ${d.units.toLocaleString()} units`:`Pick ${d.units} unit${d.units!==1?'s':''} · scan each`}
            ${d.sku?` · SKU: ${d.sku}`:''}
          </div>
        </div>
        <button class="act-btn ${d.openCase?'act-pickup':'act-process'}" onclick="openPickSession('${d.loc}',${d.type==='each'?d.units:null},'${o.id}')" style="font-size:11px;white-space:nowrap">
          ${d.type==='full_pallet'?'🚚 Pull Pallet':'📷 Start Scan'}
        </button>
      </div>`).join('')}
    </div>
  </div>`;}).join('')}`;
}

function confirmPickList(orderId,loc,btn){
  showToast(`✓ Pallet scanned out from ${loc} for ${orderId}`);
  if(btn){btn.textContent='✓ Done';btn.style.background='var(--green-bg)';btn.style.color='var(--green)';}
}



// ── PICK LIST PAGE — Location-directed picking ──
function pgPickList(){
  setTimeout(async()=>{
    const wrap = document.getElementById('pickListWrap');
    if(!wrap) return;
    wrap.innerHTML=`<div style="padding:40px;text-align:center;color:var(--ink3)"><span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Loading pick tasks…</div>`;

    // Load orders that need picking - either assigned to me or unassigned
    let query = sb.from('orders').select('*').not('status','eq','picked_up').order('date',{ascending:true});
    if(role==='employee') query = query.eq('assigned_to', currentEmployee.name);
    const {data, error} = await query;
    if(error){ wrap.innerHTML=`<div style="padding:20px;color:var(--red)">Error: ${error.message}</div>`; return; }
    renderPickList(data||[]);
  }, 100);

  return `
  <div class="pg-head">
    <div class="pg-title">Pick List</div>
    <div class="pg-sub">Location-directed picking — system tells you exactly where to go</div>
  </div>

  <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:8px;padding:12px 16px;margin-bottom:18px;font-size:12px;color:var(--gold);font-weight:600">
    📋 <strong>Pick Priority:</strong> &nbsp;① Open case first → ② Lowest qty pallet → ③ Oldest received (FIFO)
  </div>

  <div id="pickListWrap"></div>`;
}

function renderPickList(orders){
  const wrap = document.getElementById('pickListWrap');
  if(!wrap) return;
  const typeLabels={pallet_out:'🚚 Pallet Outbound',pickpack:'📦 Pick & Pack',fbm:'📦 Pick & Pack',fba:'🏭 FBA Prep',marketplace:'📦 Pick & Pack'};

  const pickOrders = orders.filter(o=>o.type!=='pallet_out'||o.status!=='picked_up');

  if(!pickOrders.length){
    wrap.innerHTML=`<div style="text-align:center;padding:60px;color:var(--ink3)"><div style="font-size:40px;margin-bottom:12px">✅</div><div style="font-weight:700">No pick tasks right now</div></div>`;
    return;
  }

  wrap.innerHTML = pickOrders.map(o=>{
    const cust  = CUSTOMERS.find(c=>c.id===o.cust_id);
    const items = Array.isArray(o.items)?o.items:(typeof o.items==='string'?JSON.parse(o.items||'[]'):[]);

    // For pallet orders show pallet locations, for item orders show pick directions
    let pickLines = [];
    if(o.type==='pallet_out'){
      pickLines = [{loc:'Assigned pallet location', desc:'Pull full pallet', units:o.pallets||1, type:'full_pallet'}];
    } else {
      pickLines = items.map(item=>{
        const inv = INVENTORY.find(l=>l.sku===item.sku||l.desc?.includes(item.desc?.split(' ')[0]||''));
        return {loc:inv?.id||'Check SKU Master', desc:item.desc||item.sku, units:item.qty, type:'each', sku:item.sku, openCase:inv?.openCase||false};
      });
    }

    return `
    <div class="card" style="margin-bottom:16px">
      <div class="card-head" style="background:${!o.assigned_to?'var(--orange-bg)':o.status==='processed'?'var(--blue-bg)':'var(--surface)'}">
        <div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800">${o.id} · ${typeLabels[o.type]||o.type}</div>
          <div style="font-size:12px;color:var(--ink3)">${cust?.name||o.cust_id} · ${o.date||'—'} ${o.time?'· '+o.time+' slot':''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="tag ${o.status==='processed'?'tb':'to'}">${(o.status||'').replace('_',' ')}</span>
          ${!o.assigned_to
            ? `<button class="btn btn-red" style="font-size:11px;padding:6px 12px" onclick="sbClaimOrder('${o.id}')">＋ Claim</button>`
            : `<button class="act-btn act-process" onclick="sbMarkOrderStatus('${o.id}','processed')">✓ Mark Processed</button>`
          }
        </div>
      </div>
      <div style="padding:16px 20px">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);margin-bottom:12px">📍 Pick Directions</div>
        ${pickLines.map((d,i)=>`
        <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;
                    border:2px solid ${d.openCase?'var(--orange)':i===0?'var(--red)':'var(--border)'};
                    border-radius:8px;margin-bottom:8px;
                    background:${d.openCase?'var(--orange-bg)':i===0?'var(--red-light)':'var(--bg)'}">
          <div style="width:28px;height:28px;background:${d.openCase?'var(--orange)':i===0?'var(--red)':'var(--ink3)'};
                      border-radius:6px;display:flex;align-items:center;justify-content:center;
                      color:#fff;font-size:13px;font-weight:800;flex-shrink:0">${i+1}</div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
              <span style="font-family:monospace;font-size:16px;font-weight:900;color:var(--red)">${d.loc}</span>
              ${d.openCase?`<span class="tag to" style="font-size:11px">⚠ Open case — pick loose units first</span>`:''}
            </div>
            <div style="font-size:13px;font-weight:600">${d.desc}</div>
            <div style="font-size:12px;color:var(--ink3);margin-top:2px">
              ${d.type==='full_pallet'?`Pull entire pallet`:`Pick ${d.units} unit${d.units!==1?'s':''}`}
              ${d.sku?` · SKU: ${d.sku}`:''}
            </div>
          </div>
          <button class="act-btn act-process" onclick="confirmPickLine(this,'${o.id}')" style="font-size:11px;white-space:nowrap">
            ${d.type==='full_pallet'?'🚚 Pull':'✓ Picked'}
          </button>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

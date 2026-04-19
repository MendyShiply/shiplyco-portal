// ── CYCLE COUNTS ──
// ══════════════════════════════════════════════

let CYCLE_COUNTS=[];

let _ccLines=[];

function pgCycleCounts(){
  const scheduled=CYCLE_COUNTS.filter(c=>c.status==='scheduled');
  const inprog=CYCLE_COUNTS.filter(c=>c.status==='inprogress');
  const done=CYCLE_COUNTS.filter(c=>c.status==='complete');

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div class="pg-title">Cycle Counts</div>
      <div class="pg-sub">Schedule and run inventory audits · reconcile system quantities against physical counts</div>
    </div>
    ${role==='admin'?`<button class="btn btn-red" onclick="openNewCycleCount()">${ico('plus',13)} Schedule Count</button>`:''}
  </div>

  <div class="stats" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat"><div class="stat-lbl">Scheduled</div><div class="stat-val" style="color:var(--blue)">${scheduled.length}</div></div>
    <div class="stat"><div class="stat-lbl">In Progress</div><div class="stat-val" style="color:var(--orange)">${inprog.length}</div></div>
    <div class="stat"><div class="stat-lbl">Completed</div><div class="stat-val" style="color:var(--green)">${done.length}</div></div>
    <div class="stat"><div class="stat-lbl">Variances Found</div><div class="stat-val" style="color:var(--red)">${CYCLE_COUNTS.reduce((s,c)=>s+(c.variances||0),0)}</div></div>
  </div>

  ${CYCLE_COUNTS.length ? `
  <div class="card">
    <div style="overflow-x:auto"><table>
      <thead><tr><th>Count Name</th><th>Customer</th><th>Zone</th><th>Assigned To</th><th>Date</th><th>Progress</th><th>Variances</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${CYCLE_COUNTS.map(c=>{
          const cust=CUSTOMERS.find(x=>x.id===c.custId);
          const pct=c.skus>0?Math.round(c.counted/c.skus*100):0;
          return `<tr>
            <td style="font-weight:700">${c.name}</td>
            <td>${cust?.name||'—'}</td>
            <td><span class="mono" style="background:var(--bg);padding:2px 6px;border-radius:4px">${c.zone}</span></td>
            <td style="font-size:12px">${c.assignedTo||'Unassigned'}</td>
            <td style="font-size:12px">${c.scheduledDate}</td>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:60px;height:6px;background:var(--border);border-radius:3px">
                  <div style="width:${pct}%;height:100%;background:${c.variances>0?'var(--orange)':'var(--green)'};border-radius:3px"></div>
                </div>
                <span style="font-size:11px">${c.counted}/${c.skus}</span>
              </div>
            </td>
            <td>${c.variances>0?`<span class="tag tr">⚠ ${c.variances}</span>`:'<span class="tag tg">None</span>'}</td>
            <td><span class="tag ${c.status==='complete'?'tg':c.status==='inprogress'?'to':'tb'}">${c.status==='scheduled'?'Scheduled':c.status==='inprogress'?'In Progress':'Complete'}</span></td>
            <td style="display:flex;gap:5px">
              ${c.status!=='complete'?`<button class="act-btn act-process" onclick="openCountSheet('${c.id}')" style="font-size:10px">📋 Count</button>`:''}
              ${c.status==='complete'?`<button class="act-btn" onclick="viewCcReport('${c.id}')" style="font-size:10px;background:var(--blue-bg);color:var(--blue)">View Report</button>`:''}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>
  </div>` : `<div class="card" style="text-align:center;padding:48px"><div style="font-size:42px;margin-bottom:10px">📦</div><div style="font-size:17px;font-weight:800">No cycle counts scheduled</div></div>`}

  <!-- Schedule Modal -->
  <div class="modal-bg" id="ccModal" role="dialog" aria-modal="true" aria-labelledby="ccModal-title">
    <div class="modal" style="max-width:500px">
      <div style="padding:16px 22px;border-bottom:1px solid var(--border)"><div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800">Schedule Cycle Count</div></div>
      <div style="padding:18px 22px">
        <div class="field"><label>Count Name</label><input type="text" id="cc_name" placeholder="e.g. Zone A Full Count, Apparel Spot Check"/></div>
        <div class="fg2">
          <div class="field"><label>Customer</label><select id="cc_cust">${CUSTOMERS.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
          <div class="field"><label>Zone / Location</label><input type="text" id="cc_zone" placeholder="AA, BB, aisle 3…"/></div>
        </div>
        <div class="fg2">
          <div class="field"><label>Scheduled Date</label><input type="date" id="cc_date" value="${new Date().toISOString().slice(0,10)}"/></div>
          <div class="field"><label>Assign To</label>
            <select id="cc_assign">
              <option value="">Unassigned</option>
              ${EMPLOYEES.map(e=>`<option value="${e.name}">${e.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field"><label>Count Type</label>
          <select id="cc_type">
            <option value="full">Full Location Count — every SKU in zone</option>
            <option value="spot">Spot Check — sample of SKUs</option>
            <option value="sku">Specific SKU List</option>
          </select>
        </div>
        <div class="field"><label>Notes</label><input type="text" id="cc_notes" placeholder="Any special instructions for the counter…"/></div>
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="document.getElementById('ccModal').classList.remove('open')">Cancel</button>
        <button class="btn btn-red" onclick="saveCycleCount()">Schedule Count</button>
      </div>
    </div>
  </div>

  <!-- Count Sheet Modal -->
  <div class="modal-bg" id="ccSheetModal" role="dialog" aria-modal="true" aria-labelledby="ccSheetModal-title">
    <div class="modal" style="max-width:560px;max-height:90vh;overflow-y:auto">
      <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800" id="ccSheetTitle">Count Sheet</span>
        <button class="btn" onclick="document.getElementById('ccSheetModal').classList.remove('open')">Done</button>
      </div>
      <div id="ccSheetBody" style="padding:16px 20px"></div>
    </div>
  </div>`;
}

function openNewCycleCount(){document.getElementById('ccModal')?.classList.add('open');}
function saveCycleCount(){
  const name=document.getElementById('cc_name')?.value.trim();
  if(!name){showToast('⚠ Count name required');return;}
  const cc={
    id:'cc_'+Date.now(),
    name,custId:document.getElementById('cc_cust')?.value,
    zone:document.getElementById('cc_zone')?.value||'—',
    scheduledDate:document.getElementById('cc_date')?.value,
    assignedTo:document.getElementById('cc_assign')?.value,
    type:document.getElementById('cc_type')?.value,
    notes:document.getElementById('cc_notes')?.value,
    status:'scheduled',skus:0,counted:0,variances:0,
    createdAt:new Date().toISOString().slice(0,10),
    lines:[],
  };
  // Auto-populate with SKU catalog for this customer if full count
  const custSkus=SKU_CATALOG.filter(s=>s.custId===cc.custId);
  cc.skus=custSkus.length;
  cc.lines=custSkus.map(s=>({skuId:s.id,sku:s.sku,name:s.name,sysQty:Math.floor(Math.random()*50+10),countedQty:null}));
  CYCLE_COUNTS.unshift(cc);
  document.getElementById('ccModal').classList.remove('open');
  showToast(`✓ "${name}" scheduled`);
  showPage('cyclecounts');
}
function openCountSheet(id){
  const cc=CYCLE_COUNTS.find(c=>c.id===id);if(!cc)return;
  if(cc.status==='scheduled') cc.status='inprogress';
  document.getElementById('ccSheetTitle').textContent=cc.name;
  const body=document.getElementById('ccSheetBody');
  if(!body)return;
  if(!cc.lines?.length){
    body.innerHTML=`<div style="text-align:center;padding:32px;color:var(--ink3)">No SKUs in this count — edit the count to add items.</div>`;
    document.getElementById('ccSheetModal').classList.add('open');
    return;
  }
  renderCountSheet(cc);
  document.getElementById('ccSheetModal').classList.add('open');
}
function renderCountSheet(cc){
  const body=document.getElementById('ccSheetBody');if(!body)return;
  body.innerHTML=`
  <div style="font-size:12px;color:var(--ink3);margin-bottom:14px">${cc.counted} of ${cc.skus} counted · ${cc.variances} variances found</div>
  ${cc.lines.map((l,i)=>{
    const variance=l.countedQty!==null?l.countedQty-l.sysQty:null;
    return `<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;${variance!==null&&variance!==0?'border-color:var(--orange);background:var(--gold-light)':''}">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-weight:700;font-size:13px">${l.name}</div>
          <div class="mono" style="font-size:11px;color:var(--ink3)">${l.sku}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="text-align:center">
            <div style="font-size:10px;color:var(--ink3);font-weight:700">SYSTEM</div>
            <div style="font-size:18px;font-weight:900">${l.sysQty}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--ink3);font-weight:700">COUNTED</div>
            <input type="number" min="0" value="${l.countedQty!==null?l.countedQty:''}" placeholder="—"
              onchange="updateCountLine('${cc.id}',${i},this.value)"
              style="width:70px;padding:5px 8px;border:2px solid ${variance!==null&&variance!==0?'var(--orange)':'var(--border)'};border-radius:6px;font-size:16px;font-weight:800;text-align:center"/>
          </div>
          ${variance!==null?`<div style="text-align:center;min-width:50px">
            <div style="font-size:10px;color:var(--ink3);font-weight:700">DIFF</div>
            <div style="font-size:16px;font-weight:900;color:${variance===0?'var(--green)':'var(--orange)'}">${variance>0?'+':''}${variance}</div>
          </div>`:''}
        </div>
      </div>
    </div>`;
  }).join('')}
  <div style="margin-top:14px;display:flex;gap:10px">
    <button class="btn btn-red" onclick="finalizeCycleCount('${cc.id}')">✓ Finalize Count</button>
    <button class="btn" onclick="document.getElementById('ccSheetModal').classList.remove('open')">Save & Close</button>
  </div>`;
}
function updateCountLine(ccId,idx,val){
  const cc=CYCLE_COUNTS.find(c=>c.id===ccId);if(!cc)return;
  const prev=cc.lines[idx].countedQty;
  cc.lines[idx].countedQty=parseInt(val);
  if(prev===null) cc.counted++;
  cc.variances=cc.lines.filter(l=>l.countedQty!==null&&l.countedQty!==l.sysQty).length;
  renderCountSheet(cc);
}
function finalizeCycleCount(id){
  const cc=CYCLE_COUNTS.find(c=>c.id===id);if(!cc)return;
  cc.status='complete';
  // Apply adjustments to inventory
  const hasVar=cc.lines.filter(l=>l.countedQty!==null&&l.countedQty!==l.sysQty);
  cc.lines.forEach(l=>{if(l.countedQty!==null)l.sysQty=l.countedQty;});
  document.getElementById('ccSheetModal').classList.remove('open');
  showToast(`✓ Count finalized · ${hasVar.length} inventory adjustments applied`);
  showPage('cyclecounts');
}
function viewCcReport(id){
  const cc=CYCLE_COUNTS.find(c=>c.id===id);if(!cc)return;
  showToast(`Cycle count report for "${cc.name}" — ${cc.variances} variances`);
}

// ══════════════════════════════════════════════
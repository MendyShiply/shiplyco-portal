// ── INVOICES — Supabase wired ──
let _sbInvoices = [];
let _sbInvoicesLoaded = false;

async function loadInvoicesFromSB(){
  try{
    const {data,error} = await sb.from('invoices').select('*').order('created_at',{ascending:false});
    if(error) throw error;
    _sbInvoices = data || [];
    _sbInvoicesLoaded = true;
  }catch(e){
    console.warn('Invoices load error:',e);
    // Fall back to dummy data
    _sbInvoices = INVOICES.map(inv=>({
      id: inv.id,
      period: inv.period,
      due_date: inv.due,
      status: inv.status,
      customer_id: inv.custId,
      Lines: inv.lines,
      total: inv.lines.reduce((s,l)=>s+l.amt,0),
      created_at: new Date().toISOString()
    }));
    _sbInvoicesLoaded = true;
  }
}

function pgInvoices(){
  // Load from Supabase then re-render
  if(!_sbInvoicesLoaded){
    loadInvoicesFromSB().then(()=>{ showPage('invoices'); });
    return `<div style="padding:40px;text-align:center;color:var(--ink3)">Loading invoices…</div>`;
  }

  const invs = role==='admin' ? _sbInvoices : _sbInvoices.filter(i=>i.customer_id===custId);
  const totalDue = invs.filter(i=>i.status==='due'||i.status==='overdue').reduce((s,i)=>s+(i.total||0),0);
  const totalYTD = invs.filter(i=>new Date(i.created_at).getFullYear()===new Date().getFullYear()).reduce((s,i)=>s+(i.total||0),0);
  const paidCount = invs.filter(i=>i.status==='paid').length;

  return `
  <div class="pg-head">
    <div class="pg-title">Invoices</div>
    <div class="pg-sub">All billing history — click any invoice to view</div>
  </div>
  <div class="stats" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat"><div class="stat-lbl">Balance Due</div><div class="stat-val" style="color:var(--red)">${fmt(totalDue)}</div><span class="tag tr">Due now</span></div>
    <div class="stat"><div class="stat-lbl">Total Billed (YTD)</div><div class="stat-val">${fmt(totalYTD)}</div><span class="tag tb">${new Date().getFullYear()}</span></div>
    <div class="stat"><div class="stat-lbl">Invoices</div><div class="stat-val">${invs.length}</div><span class="tag tg">${paidCount} paid</span></div>
  </div>
  <div class="card">
    <div class="card-head">
      <span class="card-title">Invoice History</span>
      <div style="display:flex;gap:8px">
        <button class="btn" onclick="_sbInvoicesLoaded=false;showPage('invoices')">↻ Refresh</button>
        ${role==='admin'?`<button class="btn btn-red" onclick="showNewInvoiceModal()">+ New Invoice</button>`:''}
      </div>
    </div>
    ${invs.length===0?`<div style="padding:32px;text-align:center;color:var(--ink3)">No invoices yet.</div>`:`
    <div class="inv-list">
      ${invs.map(inv=>{
        const total = inv.total || (inv.lines||[]).reduce((s,l)=>s+(l.amt||0),0);
        const cust = CUSTOMERS.find(c=>c.id===inv.customer_id);
        return `<div class="inv-row" onclick="showInvSB('${inv.id}')">
          <div>
            <div class="inv-num">${inv.id||'—'}</div>
            <div class="inv-period">${inv.period||''} ${role==='admin'&&cust?`· ${cust.name}`:''}</div>
          </div>
          <div style="text-align:center;font-size:12px;color:var(--ink3)">Due ${inv.due_date||'—'}</div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="inv-amount">${fmt(total)}</div>
            <span class="inv-status ${inv.status==='paid'?'is-paid':inv.status==='due'||inv.status==='overdue'?'is-due':'is-draft'}">${(inv.status||'draft').toUpperCase()}</span>
          </div>
        </div>`;}).join('')}
    </div>`}
  </div>

  <!-- New Invoice Modal -->
  <div id="newInvModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:6000;align-items:center;justify-content:center">
    <div style="background:var(--surface);border-radius:12px;width:90%;max-width:600px;max-height:90vh;overflow-y:auto;padding:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div style="font-size:16px;font-weight:800">New Invoice</div>
        <button onclick="document.getElementById('newInvModal').style.display='none'" style="background:none;border:none;font-size:20px;cursor:pointer">×</button>
      </div>
      <div class="field" style="margin-bottom:12px">
        <label>Customer</label>
        <select id="ni-cust" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif">
          ${CUSTOMERS.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="field"><label>Period (e.g. March 2026)</label><input id="ni-period" placeholder="March 2026" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif"/></div>
        <div class="field"><label>Due Date</label><input id="ni-due" type="date" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif"/></div>
      </div>
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Line Items</div>
      <div id="ni-lines"></div>
      <button onclick="addInvLine()" style="background:none;border:1px dashed var(--border);border-radius:6px;padding:8px 16px;width:100%;cursor:pointer;font-family:Barlow,sans-serif;color:var(--ink3);margin-bottom:16px">+ Add Line</button>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:16px;font-weight:800">Total: <span id="ni-total" style="color:var(--red)">$0.00</span></div>
        <div style="display:flex;gap:8px">
          <button class="btn" onclick="document.getElementById('newInvModal').style.display='none'">Cancel</button>
          <button class="btn btn-red" onclick="saveNewInvoice()">Save Invoice</button>
        </div>
      </div>
    </div>
  </div>`;
}

function showNewInvoiceModal(){
  document.getElementById('newInvModal').style.display='flex';
  // Set default due date to end of next month
  const d=new Date(); d.setMonth(d.getMonth()+1); d.setDate(1);
  document.getElementById('ni-due').value=d.toISOString().split('T')[0];
  // Add 3 default lines
  document.getElementById('ni-lines').innerHTML='';
  addInvLine('Monthly Service Fee',1,100);
  addInvLine('Receiving — Standard Pallets',0,11);
  addInvLine('Storage — Standard Pallets',0,15);
  calcInvTotal();
}

let _niLineCount=0;
function addInvLine(desc='',qty=0,rate=0){
  _niLineCount++;
  const id=_niLineCount;
  const div=document.createElement('div');
  div.id='ni-line-'+id;
  div.style.cssText='display:grid;grid-template-columns:2fr 0.7fr 0.7fr 0.8fr auto;gap:6px;margin-bottom:6px;align-items:center';
  div.innerHTML=`
    <input placeholder="Description" value="${desc}" oninput="calcInvTotal()" style="padding:7px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;font-size:12px"/>
    <input type="number" placeholder="Qty" value="${qty}" oninput="calcInvTotal()" style="padding:7px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;font-size:12px"/>
    <input type="number" placeholder="Rate" value="${rate}" step="0.01" oninput="calcInvTotal()" style="padding:7px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;font-size:12px"/>
    <div id="ni-amt-${id}" style="font-size:12px;font-weight:700;text-align:right;padding:7px">${fmt(qty*rate)}</div>
    <button onclick="document.getElementById('ni-line-${id}').remove();calcInvTotal()" style="background:none;border:none;color:var(--ink3);cursor:pointer;font-size:16px">×</button>`;
  document.getElementById('ni-lines').appendChild(div);
}

function calcInvTotal(){
  let total=0;
  document.querySelectorAll('#ni-lines > div').forEach(row=>{
    const inputs=row.querySelectorAll('input');
    const qty=parseFloat(inputs[1]?.value)||0;
    const rate=parseFloat(inputs[2]?.value)||0;
    const amt=qty*rate;
    total+=amt;
    const amtEl=row.querySelector('[id^="ni-amt-"]');
    if(amtEl) amtEl.textContent=fmt(amt);
  });
  const el=document.getElementById('ni-total');
  if(el) el.textContent=fmt(total);
}

async function saveNewInvoice(){
  const custId=document.getElementById('ni-cust').value;
  const period=document.getElementById('ni-period').value.trim();
  const dueDate=document.getElementById('ni-due').value;
  if(!period||!dueDate){showToast('Please fill in period and due date');return;}

  const lines=[];
  let total=0;
  document.querySelectorAll('#ni-lines > div').forEach(row=>{
    const inputs=row.querySelectorAll('input');
    const desc=inputs[0]?.value.trim();
    const qty=parseFloat(inputs[1]?.value)||0;
    const rate=parseFloat(inputs[2]?.value)||0;
    const amt=qty*rate;
    if(desc) lines.push({desc,qty,rate,amt});
    total+=amt;
  });
  if(lines.length===0){showToast('Add at least one line item');return;}

  // Generate invoice ID
  const invNum = 'INV-' + String(Date.now()).slice(-4).padStart(4,'0');
  const invoice = {
    id: invNum,
    customer_id: custId,
    period,
    due_date: dueDate,
    status: 'due',
    Lines: lines,
    total,
    created_at: new Date().toISOString()
  };

  try{
    const {error}=await sb.from('invoices').insert([invoice]);
    if(error) throw error;
    showToast('Invoice '+invNum+' created!');
    document.getElementById('newInvModal').style.display='none';
    _sbInvoicesLoaded=false;
    showPage('invoices');
  }catch(e){
    showToast('Error saving: '+e.message);
  }
}

async function markInvoicePaid(invId){
  try{
    await sb.from('invoices').update({status:'paid'}).eq('id',invId);
    showToast('Invoice marked as paid');
    closeInv();
    _sbInvoicesLoaded=false;
    showPage('invoices');
  }catch(e){
    showToast('Error: '+e.message);
  }
}

function showInvSB(id){
  // Find in SB invoices first, fall back to dummy
  const inv = _sbInvoices.find(i=>i.id===id) || INVOICES.find(i=>i.id===id);
  if(!inv) return;
  const lines = inv.Lines || inv.lines || [];
  const total = inv.total || lines.reduce((s,l)=>s+(l.amt||0),0);
  const cc = total*0.03;
  const cust = CUSTOMERS.find(c=>c.id===(inv.customer_id||inv.custId));
  const isPaid = inv.status==='paid';

  document.getElementById('invDocContent').innerHTML=`
  <div class="inv-doc">
    <div class="inv-doc-head">
      <div class="inv-logo-area">
        <svg class="inv-logo-hex" viewBox="0 0 60 60">
          <polygon points="30,3 55,17 55,43 30,57 5,43 5,17" fill="#e8241a"/>
          <rect x="22" y="20" width="16" height="3" rx="1.5" fill="white"/>
          <rect x="22" y="28.5" width="16" height="3" rx="1.5" fill="white"/>
          <rect x="22" y="37" width="16" height="3" rx="1.5" fill="white"/>
        </svg>
        <div>
          <div class="inv-logo-name">SHIPLY<span>CO</span></div>
          <div class="inv-logo-sub">fulfillment</div>
        </div>
      </div>
      <div class="inv-meta-right">
        <div class="inv-label">Invoice</div>
        <div class="inv-num-big">${inv.id} &nbsp;·&nbsp; ${inv.period||''}</div>
        <div style="font-size:12px;color:var(--ink3);margin-top:4px">Due: ${inv.due_date||inv.due||'—'}</div>
        <div style="margin-top:6px"><span class="inv-status ${isPaid?'is-paid':'is-due'}">${(inv.status||'due').toUpperCase()}</span></div>
      </div>
    </div>
    <div class="inv-addresses">
      <div>
        <div class="inv-addr-label">From</div>
        <div class="inv-addr-name">ShiplyCo Fulfillment</div>
        <div class="inv-addr-detail">6855 Wynnwood Ln<br>Houston, TX 77008<br>832.521.1513<br>www.Shiplyfulfillment.com</div>
      </div>
      <div>
        <div class="inv-addr-label">Bill To</div>
        <div class="inv-addr-name">${cust?.name||'Client'}</div>
        <div class="inv-addr-detail">Billing Period: ${inv.period||''}<br>Invoice Date: ${inv.due_date||inv.due||''}</div>
      </div>
    </div>
    <table class="inv-table">
      <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>
        ${lines.map(l=>`<tr>
          <td>${l.desc}</td>
          <td>${(l.qty||0).toLocaleString()}</td>
          <td>${fmt(l.rate||0)}</td>
          <td>${fmt(l.amt||0)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div class="inv-totals">
      <div class="inv-total-row"><span>Subtotal</span><span>${fmt(total)}</span></div>
      <div class="inv-total-row" style="color:var(--ink3);font-size:12px"><span>Credit Card Fee (3%) if applicable</span><span>${fmt(cc)}</span></div>
      <div class="inv-total-row big"><span>TOTAL DUE</span><span style="color:var(--red)">${fmt(total)}</span></div>
    </div>
    ${role==='admin'&&!isPaid?`
    <div style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-red" onclick="markInvoicePaid('${inv.id}')">✓ Mark as Paid</button>
    </div>`:''}
    <div class="inv-footer">
      <strong>ShiplyCo Fulfillment Company</strong> &nbsp;·&nbsp; 6855 Wynnwood Ln, Houston, TX 77008 &nbsp;·&nbsp; 832.521.1513 &nbsp;·&nbsp; www.Shiplyfulfillment.com<br>
      Payment due by ${inv.due_date||inv.due||'—'}. A 3% processing fee applies to credit card payments. Thank you for your business!
    </div>
  </div>`;
  document.getElementById('invModal').classList.add('open');
}

function showInv(id){
  const inv=INVOICES.find(i=>i.id===id);if(!inv)return;
  const total=inv.lines.reduce((s,l)=>s+l.amt,0);
  const cc=total*0.03;
  document.getElementById('invDocContent').innerHTML=`
  <div class="inv-doc">
    <div class="inv-doc-head">
      <div class="inv-logo-area">
        <svg class="inv-logo-hex" viewBox="0 0 60 60">
          <polygon points="30,3 55,17 55,43 30,57 5,43 5,17" fill="#e8241a"/>
          <rect x="22" y="20" width="16" height="3" rx="1.5" fill="white"/>
          <rect x="22" y="28.5" width="16" height="3" rx="1.5" fill="white"/>
          <rect x="22" y="37" width="16" height="3" rx="1.5" fill="white"/>
        </svg>
        <div>
          <div class="inv-logo-name">SHIPLY<span>CO</span></div>
          <div class="inv-logo-sub">fulfillment</div>
        </div>
      </div>
      <div class="inv-meta-right">
        <div class="inv-label">Invoice</div>
        <div class="inv-num-big">${inv.id} &nbsp;·&nbsp; ${inv.period}</div>
        <div style="font-size:12px;color:var(--ink3);margin-top:4px">Due: ${inv.due}</div>
        <div style="margin-top:6px"><span class="inv-status ${inv.status==='paid'?'is-paid':inv.status==='due'?'is-due':'is-draft'}">${inv.status.toUpperCase()}</span></div>
      </div>
    </div>
    <div class="inv-addresses">
      <div>
        <div class="inv-addr-label">From</div>
        <div class="inv-addr-name">ShiplyCo Fulfillment</div>
        <div class="inv-addr-detail">6855 Wynnwood Ln<br>Houston, TX 77008<br>832.521.1513<br>www.Shiplyfulfillment.com</div>
      </div>
      <div>
        <div class="inv-addr-label">Bill To</div>
        <div class="inv-addr-name">Platinum Financial Group</div>
        <div class="inv-addr-detail">Billing Period: ${inv.period}<br>Invoice Date: ${inv.due}</div>
      </div>
    </div>
    <table class="inv-table">
      <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>
        ${inv.lines.map(l=>`<tr>
          <td>${l.desc}</td>
          <td>${l.qty.toLocaleString()}</td>
          <td>${fmt(l.rate)}</td>
          <td>${fmt(l.amt)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div class="inv-totals">
      <div class="inv-total-row"><span>Subtotal</span><span>${fmt(total)}</span></div>
      <div class="inv-total-row" style="color:var(--ink3);font-size:12px"><span>Credit Card Fee (3%) if applicable</span><span>${fmt(cc)}</span></div>
      <div class="inv-total-row big"><span>TOTAL DUE</span><span style="color:var(--red)">${fmt(total)}</span></div>
    </div>
    <div class="inv-footer">
      <strong>ShiplyCo Fulfillment Company</strong> &nbsp;·&nbsp; 6855 Wynnwood Ln, Houston, TX 77008 &nbsp;·&nbsp; 832.521.1513 &nbsp;·&nbsp; www.Shiplyfulfillment.com<br>
      Payment due by ${inv.due}. A 3% processing fee applies to credit card payments. Thank you for your business!
    </div>
  </div>`;
  document.getElementById('invModal').classList.add('open');
}
function closeInv(){document.getElementById('invModal').classList.remove('open')}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeInv()});

// ══════════════════════════════════════════════════════════════
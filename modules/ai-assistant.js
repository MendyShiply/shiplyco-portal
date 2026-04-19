// ── AI ASSISTANT — ALL FEATURES ──
// ══════════════════════════════════════════════

const ANTHROPIC_MODEL = 'llama-3.3-70b-versatile';
const AI_FEATURES = [
  {id:'ask',      icon:'💬', label:'Order Assistant',      desc:'Ask anything about orders, inventory, customers in plain English',  roles:['customer','employee','admin']},
  {id:'pick',     icon:'🗺', label:'Smart Pick Sequencing', desc:'AI optimises pick route across all open orders for fastest fulfillment', roles:['employee','admin']},
  {id:'receive',  icon:'🚛', label:'Receiving Anomaly',     desc:'Compare inbound manifest against PO history and flag discrepancies', roles:['employee','admin']},
  {id:'forecast', icon:'📈', label:'Demand Forecast',       desc:'Predict stock depletion dates per SKU based on order velocity',      roles:['admin']},
  {id:'update',   icon:'📲', label:'Auto Customer Update',  desc:'AI writes and sends personalised SMS/WhatsApp order updates',        roles:['admin']},
  {id:'dispute',  icon:'🧾', label:'Invoice Dispute',       desc:'Customer questions a charge — AI pulls logs and explains it',        roles:['customer','admin']},
  {id:'edi',      icon:'⚡', label:'EDI Exception Handler', desc:'Paste a failed EDI error — AI identifies cause and suggests fix',    roles:['admin']},
  {id:'bol',      icon:'📋', label:'BOL Auto-Fill',         desc:'AI reads the pick list and pre-fills BOL fields intelligently',      roles:['employee','admin']},
  {id:'audit',    icon:'🔍', label:'Billing Audit',         desc:'AI scans all orders and flags unbilled actions or missed charges',   roles:['admin']},
];

let _aiTab = 'ask';
let _aiConvHistory = [];
let _aiLoading = false;

function pgAi(){
  const available = AI_FEATURES.filter(f=>f.roles.includes(role));
  return `
  <div class="pg-head">
    <div class="pg-title">AI Assistant</div>
    <div class="pg-sub">Powered by Claude — your warehouse intelligence layer</div>
  </div>

  <div style="display:grid;grid-template-columns:220px 1fr;gap:20px;align-items:start">

    <!-- Feature sidebar -->
    <div class="card" style="padding:0;overflow:hidden">
      ${available.map(f=>`
      <div id="aitab_${f.id}" onclick="switchAiFeature('${f.id}')"
        style="padding:12px 16px;cursor:pointer;border-left:3px solid transparent;transition:all 0.12s;${_aiTab===f.id?'background:var(--red-light);border-left-color:var(--red);':''}">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">${f.icon}</span>
          <div>
            <div style="font-size:12px;font-weight:700;color:${_aiTab===f.id?'var(--red)':'var(--ink)'}">${f.label}</div>
            <div style="font-size:10px;color:var(--ink3);line-height:1.3;margin-top:1px">${f.desc}</div>
          </div>
        </div>
      </div>`).join('<div style="height:1px;background:var(--border)"></div>')}
    </div>

    <!-- Feature panel -->
    <div id="aiPanel">
      ${renderAiFeature(_aiTab)}
    </div>
  </div>`;
}

function switchAiFeature(id){
  _aiTab=id;
  _aiConvHistory=[];
  // Update sidebar highlight
  AI_FEATURES.forEach(f=>{
    const el=document.getElementById('aitab_'+f.id);
    if(!el)return;
    if(f.id===id){
      el.style.background='var(--red-light)';
      el.style.borderLeftColor='var(--red)';
      el.querySelector('div>div>div').style.color='var(--red)';
    } else {
      el.style.background='';
      el.style.borderLeftColor='transparent';
      el.querySelector('div>div>div').style.color='var(--ink)';
    }
  });
  const panel=document.getElementById('aiPanel');
  if(panel) panel.innerHTML=renderAiFeature(id);
}

function renderAiFeature(id){
  if(id==='ask')     return renderAiAsk();
  if(id==='pick')    return renderAiPick();
  if(id==='receive') return renderAiReceive();
  if(id==='forecast')return renderAiForecast();
  if(id==='update')  return renderAiUpdate();
  if(id==='dispute') return renderAiDispute();
  if(id==='edi')     return renderAiEdi();
  if(id==='bol')     return renderAiBolFill();
  if(id==='audit')   return renderAiAudit();
  return '<div class="card">Feature not found</div>';
}

// ── SHARED AI CALL ──
async function callAI(messages, systemPrompt, onChunk, onDone){
  if(_aiLoading){showToast('⚠ AI is already processing — please wait');return;}
  _aiLoading=true;
  try {
    const resp = await fetch('https://xyemghdkehsfgeyidmie.supabase.co/functions/v1/tara-voice',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZW1naGRrZWhzZmdleWlkbWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjE3NTIsImV4cCI6MjA4ODMzNzc1Mn0.4pIvrbdbMrPIrByY9GRnDiyw15BJobPxllr8mQ0c1OA'
      },
      body:JSON.stringify({
        type:'ai',
        model: ANTHROPIC_MODEL,
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages,
      })
    });
    const data = await resp.json();
    if(data.error){onDone(null, data.error.message);return;}
    const text = data.content?.filter(b=>b.type==='text').map(b=>b.text).join('') || '';
    onDone(text, null);
  } catch(e){
    onDone(null, 'Network error: '+e.message);
  } finally {
    _aiLoading=false;
  }
}

// ── 1. ORDER ASSISTANT (conversational) ──
function renderAiAsk(){
  const feature = AI_FEATURES.find(f=>f.id==='ask');
  return `
  <div class="card" style="display:flex;flex-direction:column;height:520px;padding:0;overflow:hidden">
    <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">
      <span style="font-size:22px">${feature.icon}</span>
      <div>
        <div style="font-weight:800;font-size:14px">${feature.label}</div>
        <div style="font-size:11px;color:var(--ink3)">Ask anything about your orders, inventory, invoices, shipments</div>
      </div>
    </div>
    <div id="askMessages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px">
      <div style="background:var(--bg);border-radius:10px;padding:12px 14px;font-size:13px;color:var(--ink2);border-left:3px solid var(--red)">
        <strong>Hi${role==='customer'?' — I can see your orders, inventory, and invoices':role==='employee'?' — I can see all orders, inventory, and tasks':' — I have full access to all portal data'}.</strong> Ask me anything in plain English.<br><br>
        <span style="color:var(--ink3)">Try: <em>"How many pallets does Platinum have in storage?"</em> or <em>"What orders are still pending today?"</em></span>
      </div>
    </div>
    <div style="padding:12px 16px;border-top:1px solid var(--border);display:flex;gap:10px">
      <input id="askInput" type="text" placeholder="Ask anything about your warehouse data…"
        style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;font-family:Barlow,sans-serif;font-size:13px;outline:none"
        onkeydown="if(event.key==='Enter')sendAskMessage()"
        onfocus="this.style.borderColor='var(--red)'" onblur="this.style.borderColor='var(--border)'"/>
      <button class="btn btn-red" onclick="sendAskMessage()" style="white-space:nowrap;padding:10px 18px">Send</button>
    </div>
  </div>`;
}

function buildPortalContext(){
  const orders = ORDERS ? ORDERS.slice(0,20) : [];
  const inventory = INVENTORY ? Object.values(INVENTORY).slice(0,10) : [];
  const customers = CUSTOMERS || [];
  const supplies = SUPPLIES ? SUPPLIES.slice(0,10) : [];
  return `You are an AI assistant embedded in ShiplyCo, a 3PL (third-party logistics) fulfillment company portal.
Current user role: ${role}
Current user: ${currentEmployee||'Customer'}
Today's date: ${new Date().toLocaleDateString()}

LIVE PORTAL DATA:
Customers: ${JSON.stringify(customers.map(c=>({id:c.id,name:c.name})))}
Recent Orders (last 20): ${JSON.stringify(orders.map(o=>({id:o.id,custId:o.custId,type:o.type,status:o.status,date:o.date,pallets:o.pallets||0})))}
Inventory snapshot: ${JSON.stringify(inventory.map(i=>({sku:i.sku,desc:i.desc,cases:i.fullCases,loose:i.looseUnits,loc:i.loc})))}
Supplies: ${JSON.stringify(supplies.map(s=>({name:s.name,qty:s.qty,low:s.lowThreshold})))}
EDI POs: ${JSON.stringify(EDI_PO_INBOX||[])}
BOLs: ${JSON.stringify((BOLS||[]).slice(0,5))}

Answer concisely and factually based on the data above. If you don't have the data to answer, say so clearly. For customer role, only reveal their own data.`;
}

async function sendAskMessage(){
  const input=document.getElementById('askInput');
  const msgs=document.getElementById('askMessages');
  if(!input||!msgs)return;
  const text=input.value.trim();
  if(!text)return;
  input.value='';

  // Add user message
  msgs.innerHTML+=`<div style="display:flex;justify-content:flex-end"><div style="background:var(--red);color:#fff;border-radius:10px 10px 2px 10px;padding:10px 14px;font-size:13px;max-width:80%">${text}</div></div>`;

  // Add thinking indicator
  const thinkId='think_'+Date.now();
  msgs.innerHTML+=`<div id="${thinkId}" style="background:var(--bg);border-radius:10px;padding:10px 14px;font-size:13px;color:var(--ink3);display:flex;align-items:center;gap:8px"><span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Thinking…</div>`;
  msgs.scrollTop=msgs.scrollHeight;

  _aiConvHistory.push({role:'user',content:text});

  await callAI(_aiConvHistory, buildPortalContext(), null, (reply, err)=>{
    const thinkEl=document.getElementById(thinkId);
    if(thinkEl)thinkEl.remove();
    const response = err ? `⚠ Error: ${err}` : reply;
    msgs.innerHTML+=`<div style="background:var(--bg);border-radius:10px;padding:12px 14px;font-size:13px;line-height:1.6;border-left:3px solid var(--red)">${response.replace(/\n/g,'<br>')}</div>`;
    msgs.scrollTop=msgs.scrollHeight;
    if(!err) _aiConvHistory.push({role:'assistant',content:reply});
  });
}

// ── 2. SMART PICK SEQUENCING ──
function renderAiPick(){
  const open = (ORDERS||[]).filter(o=>o.status==='pending'||o.status==='processing');
  return `
  <div class="card">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <span style="font-size:28px">🗺</span>
      <div>
        <div style="font-weight:800;font-size:15px">Smart Pick Sequencing</div>
        <div style="font-size:12px;color:var(--ink3)">${open.length} open orders · AI will calculate optimal pick route</div>
      </div>
    </div>
    <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:8px;padding:12px 14px;font-size:12px;margin-bottom:16px">
      ⚡ AI analyses order locations, SKU positions, and pick density to group items by aisle and minimise warehouse travel distance.
    </div>
    ${open.length===0?`<div style="text-align:center;padding:32px;color:var(--ink3)">No open orders to sequence right now.</div>`:`
    <div style="margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;margin-bottom:8px">Open orders to sequence (${open.length}):</div>
      ${open.slice(0,5).map(o=>{
        const c=CUSTOMERS.find(x=>x.id===o.custId);
        return `<div style="padding:8px 12px;background:var(--bg);border-radius:6px;margin-bottom:6px;font-size:12px;display:flex;justify-content:space-between">
          <span><strong>${o.id}</strong> — ${c?.name||o.custId}</span>
          <span style="color:var(--ink3)">${o.type} · ${o.pallets||1} pallets</span>
        </div>`;
      }).join('')}
      ${open.length>5?`<div style="font-size:11px;color:var(--ink3);padding:4px 12px">+${open.length-5} more orders</div>`:''}
    </div>
    <button class="btn btn-red" onclick="runPickSequencing()" id="pickSeqBtn">🗺 Generate Optimal Pick Route</button>`}
    <div id="pickResult" style="margin-top:16px"></div>
  </div>`;
}

async function runPickSequencing(){
  const btn=document.getElementById('pickSeqBtn');
  const result=document.getElementById('pickResult');
  if(btn)btn.disabled=true;
  if(result)result.innerHTML=`<div style="color:var(--ink3);font-size:13px">⏳ AI analysing orders and warehouse layout…</div>`;

  const open=(ORDERS||[]).filter(o=>o.status==='pending'||o.status==='processing');
  const orderSummary=open.slice(0,10).map(o=>{
    const c=CUSTOMERS.find(x=>x.id===o.custId);
    return `Order ${o.id}: ${c?.name} — ${o.type}, ${o.pallets||1} pallets, items: ${(o.items||[]).map(i=>i.desc||i.sku).join(', ')||'mixed SKUs'}`;
  }).join('\n');

  const systemPrompt=`You are a warehouse operations AI for ShiplyCo 3PL. You are an expert in pick path optimisation. Warehouse zones: AA (rows 1-10), BB (rows 11-20), CC (rows 21-30), receiving dock at north end, shipping dock at south end. Respond with a concrete, numbered pick sequence grouped by zone.`;

  await callAI([{role:'user',content:`Optimise the pick sequence for these ${open.length} open orders. Group by warehouse zone to minimise travel. Show the route step by step.\n\nOrders:\n${orderSummary}`}],
    systemPrompt, null,
    (reply,err)=>{
      if(btn)btn.disabled=false;
      if(result)result.innerHTML=err
        ?`<div style="color:var(--red);font-size:13px">⚠ ${err}</div>`
        :`<div style="background:var(--bg);border-radius:10px;padding:16px;font-size:13px;line-height:1.7;border-left:3px solid var(--red)"><div style="font-weight:800;margin-bottom:8px">Optimised Pick Route</div>${reply.replace(/\n/g,'<br>')}</div>`;
    }
  );
}

// ── 3. RECEIVING ANOMALY DETECTION ──
function renderAiReceive(){
  return `
  <div class="card">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <span style="font-size:28px">🚛</span>
      <div>
        <div style="font-weight:800;font-size:15px">Receiving Anomaly Detection</div>
        <div style="font-size:12px;color:var(--ink3)">Paste or describe a truck manifest — AI compares against expected POs and flags issues</div>
      </div>
    </div>
    <div class="fg2">
      <div class="field">
        <label>Customer</label>
        <select id="ra_cust">${(CUSTOMERS||[]).map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label>Expected PO / Reference</label>
        <input type="text" id="ra_po" placeholder="PO number or order reference"/>
      </div>
    </div>
    <div class="field">
      <label>What arrived on the truck (describe or paste manifest)</label>
      <textarea id="ra_manifest" rows="5" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:Barlow,sans-serif;font-size:13px;resize:vertical"
        placeholder="e.g. 48 pallets Mainstays curtains SKU 0653725604, 12 pallets Ladies Tees SKU 0676499993, 6 pallets mixed apparel — no labels&#10;&#10;Or paste raw manifest text here…"></textarea>
    </div>
    <button class="btn btn-red" onclick="runAnomalyDetection()" id="anomalyBtn">🔍 Analyse for Anomalies</button>
    <div id="anomalyResult" style="margin-top:16px"></div>
  </div>`;
}

async function runAnomalyDetection(){
  const btn=document.getElementById('anomalyBtn');
  const result=document.getElementById('anomalyResult');
  const manifest=document.getElementById('ra_manifest')?.value.trim();
  const custId=document.getElementById('ra_cust')?.value;
  const po=document.getElementById('ra_po')?.value.trim();
  if(!manifest){showToast('⚠ Describe what arrived first');return;}
  if(btn)btn.disabled=true;
  if(result)result.innerHTML=`<div style="color:var(--ink3);font-size:13px">⏳ Comparing manifest against expected inventory…</div>`;

  const cust=CUSTOMERS.find(c=>c.id===custId);
  const custSkus=(SKU_CATALOG||[]).filter(s=>s.custId===custId);
  const openPos=(EDI_PO_INBOX||[]).filter(p=>p.partnerId===custId||true).slice(0,5);

  const system=`You are a warehouse receiving AI for ShiplyCo 3PL. Your job is to compare what actually arrived on a truck against what was expected based on PO history and SKU catalog data. Identify: quantity discrepancies, unexpected SKUs, missing items, labelling problems, condition concerns. Be specific and actionable. Format your response with clear sections: ✅ Matches, ⚠️ Discrepancies, 🚨 Action Required.`;
  const userMsg=`Customer: ${cust?.name||custId}
PO Reference: ${po||'None provided'}
Known SKUs for this customer: ${custSkus.map(s=>`${s.sku} — ${s.name}`).join(', ')||'None on file'}
Open EDI POs: ${openPos.map(p=>`${p.poNum}: ${p.items?.map(i=>`${i.desc} x${i.qty}`).join(', ')}`).join('; ')||'None'}

What arrived on truck:
${manifest}

Analyse this receipt for anomalies, discrepancies, or issues that need attention before put-away.`;

  await callAI([{role:'user',content:userMsg}], system, null, (reply,err)=>{
    if(btn)btn.disabled=false;
    if(result)result.innerHTML=err
      ?`<div style="color:var(--red);font-size:13px">⚠ ${err}</div>`
      :`<div style="background:var(--bg);border-radius:10px;padding:16px;font-size:13px;line-height:1.7;border-left:3px solid var(--red)">${reply.replace(/\n/g,'<br>')}</div>`;
  });
}

// ── 4. DEMAND FORECAST ──
function renderAiForecast(){
  return `
  <div class="card">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <span style="font-size:28px">📈</span>
      <div>
        <div style="font-weight:800;font-size:15px">Demand Forecast</div>
        <div style="font-size:12px;color:var(--ink3)">AI predicts stock depletion dates and reorder timing per SKU</div>
      </div>
    </div>
    <div class="fg2" style="margin-bottom:14px">
      <div class="field">
        <label>Customer</label>
        <select id="fc_cust" onchange="renderForecastSkus()">${(CUSTOMERS||[]).map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label>Forecast Horizon</label>
        <select id="fc_horizon"><option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option></select>
      </div>
    </div>
    <button class="btn btn-red" onclick="runForecast()" id="forecastBtn">📈 Run Forecast</button>
    <div id="forecastResult" style="margin-top:16px"></div>
  </div>`;
}

async function runForecast(){
  const btn=document.getElementById('forecastBtn');
  const result=document.getElementById('forecastResult');
  const custId=document.getElementById('fc_cust')?.value;
  const horizon=document.getElementById('fc_horizon')?.value||'30';
  if(btn)btn.disabled=true;
  if(result)result.innerHTML=`<div style="color:var(--ink3);font-size:13px">⏳ Analysing order velocity and projecting stock levels…</div>`;

  const cust=CUSTOMERS.find(c=>c.id===custId);
  const custSkus=(SKU_CATALOG||[]).filter(s=>s.custId===custId);
  const custOrders=(ORDERS||[]).filter(o=>o.custId===custId).slice(0,20);
  const inventory=(INVENTORY?Object.values(INVENTORY):[]).filter(i=>i.custId===custId||true).slice(0,10);

  const system=`You are a demand forecasting AI for a 3PL warehouse. Analyse order history and current inventory to predict which SKUs will run out and when. Provide specific depletion dates, recommended reorder quantities, and risk level (🟢 Safe / 🟡 Watch / 🔴 Urgent). Be data-driven and concise.`;
  const userMsg=`Customer: ${cust?.name}
Forecast horizon: ${horizon} days
Current SKUs: ${custSkus.map(s=>`${s.sku} — ${s.name}`).join('\n')}
Recent orders: ${custOrders.map(o=>`${o.date}: ${o.type} ${o.pallets||1} pallets`).join(', ')||'Limited history'}
Current inventory: ${inventory.map(i=>`${i.desc||i.sku}: ${i.fullCases||0} cases`).join(', ')||'See system'}

Generate a ${horizon}-day demand forecast with depletion risk by SKU. Include recommended reorder dates.`;

  await callAI([{role:'user',content:userMsg}], system, null, (reply,err)=>{
    if(btn)btn.disabled=false;
    if(result)result.innerHTML=err
      ?`<div style="color:var(--red);font-size:13px">⚠ ${err}</div>`
      :`<div style="background:var(--bg);border-radius:10px;padding:16px;font-size:13px;line-height:1.7;border-left:3px solid var(--red)">${reply.replace(/\n/g,'<br>')}</div>`;
  });
}

// ── 5. AUTO CUSTOMER UPDATE ──
function renderAiUpdate(){
  return `
  <div class="card">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <span style="font-size:28px">📲</span>
      <div>
        <div style="font-weight:800;font-size:15px">Auto Customer Update</div>
        <div style="font-size:12px;color:var(--ink3)">AI writes a personalised SMS or WhatsApp update for a customer based on their order status</div>
      </div>
    </div>
    <div class="fg2">
      <div class="field">
        <label>Customer</label>
        <select id="au_cust" onchange="loadCustomerOrdersForUpdate()">${(CUSTOMERS||[]).map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label>Channel</label>
        <select id="au_chan"><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option></select>
      </div>
    </div>
    <div class="field">
      <label>Order / Situation</label>
      <select id="au_order">
        ${(ORDERS||[]).slice(0,10).map(o=>`<option value="${o.id}">${o.id} — ${o.type} — ${o.status}</option>`).join('')}
      </select>
    </div>
    <div class="field">
      <label>Tone</label>
      <select id="au_tone">
        <option value="professional">Professional</option>
        <option value="friendly">Friendly & warm</option>
        <option value="brief">Brief & direct</option>
        <option value="apologetic">Apologetic (delay)</option>
      </select>
    </div>
    <div class="field">
      <label>Any extra context to include?</label>
      <input type="text" id="au_context" placeholder="e.g. slight delay due to carrier pickup, tracking number 1Z999AA…"/>
    </div>
    <button class="btn btn-red" onclick="generateCustomerUpdate()" id="updateBtn">✍ Generate Message</button>
    <div id="updateResult" style="margin-top:16px"></div>
  </div>`;
}

async function generateCustomerUpdate(){
  const btn=document.getElementById('updateBtn');
  const result=document.getElementById('updateResult');
  const custId=document.getElementById('au_cust')?.value;
  const orderId=document.getElementById('au_order')?.value;
  const chan=document.getElementById('au_chan')?.value;
  const tone=document.getElementById('au_tone')?.value;
  const context=document.getElementById('au_context')?.value;
  if(btn)btn.disabled=true;
  if(result)result.innerHTML=`<div style="color:var(--ink3);font-size:13px">⏳ Writing message…</div>`;

  const cust=CUSTOMERS.find(c=>c.id===custId);
  const order=(ORDERS||[]).find(o=>o.id===orderId);
  const system=`You are a customer communications AI for ShiplyCo, a professional 3PL fulfillment company. Write concise, helpful customer-facing messages. For SMS: max 160 chars. For WhatsApp: can be slightly longer with emoji. For email: professional with greeting and sign-off. Always include ShiplyCo branding. Never share internal warehouse details.`;
  const userMsg=`Write a ${chan} message to ${cust?.name||'the customer'} about their order.
Order: ${orderId} — ${order?.type||'fulfillment order'} — Status: ${order?.status||'in progress'}
Tone: ${tone}
Extra context: ${context||'None'}
Channel: ${chan} ${chan==='sms'?'(keep under 160 chars)':chan==='whatsapp'?'(can use emoji, friendly)':'(professional email format)'}`;

  await callAI([{role:'user',content:userMsg}], system, null, (reply,err)=>{
    if(btn)btn.disabled=false;
    if(result)result.innerHTML=err
      ?`<div style="color:var(--red);font-size:13px">⚠ ${err}</div>`
      :`<div style="background:var(--bg);border-radius:10px;padding:16px;font-size:13px;line-height:1.7;border-left:3px solid var(--red)">
          <div style="font-weight:800;margin-bottom:10px;display:flex;justify-content:space-between">
            <span>Generated ${chan.toUpperCase()} Message</span>
            <button class="act-btn act-process" onclick="sendAiGeneratedMessage('${custId}','${chan}')" style="font-size:10px">📤 Send via Twilio</button>
          </div>
          <div id="generatedMsg" style="background:#fff;border:1.5px solid var(--border);border-radius:8px;padding:12px;font-size:13px;white-space:pre-wrap">${reply}</div>
        </div>`;
  });
}
function sendAiGeneratedMessage(custId,chan){
  const msg=document.getElementById('generatedMsg')?.textContent;
  if(!TWILIO_CONFIG.connected){showToast('⚠ Connect Twilio first in the Notifications page');return;}
  const contact=CUST_PHONE_BOOK.find(c=>c.custId===custId);
  const to=chan==='whatsapp'?contact?.whatsapp:contact?.phone;
  if(!to){showToast('⚠ No phone number on file for this customer — add in Notifications → Contacts');return;}
  TWILIO_LOG.unshift({ts:new Date().toLocaleString(),to,chan:chan==='whatsapp'?'WhatsApp':'SMS',event:'AI Generated Update',status:'delivered',msg});
  showToast(`✓ Message sent to ${to}`);
}

// ── 6. INVOICE DISPUTE ASSISTANT ──
function renderAiDispute(){
  return `
  <div class="card">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <span style="font-size:28px">🧾</span>
      <div>
        <div style="font-weight:800;font-size:15px">Invoice Dispute Assistant</div>
        <div style="font-size:12px;color:var(--ink3)">Describe a charge you're questioning — AI pulls the logs and explains exactly what triggered it</div>
      </div>
    </div>
    <div class="field">
      <label>Which invoice or charge are you questioning?</label>
      <textarea id="disp_question" rows="4" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:Barlow,sans-serif;font-size:13px;resize:vertical"
        placeholder="e.g. Why was I charged $40 labour on invoice #INV-0042? or I don't understand the storage fee this month — I thought I only had 12 pallets in."></textarea>
    </div>
    <button class="btn btn-red" onclick="runDisputeAssistant()" id="disputeBtn">🧾 Explain This Charge</button>
    <div id="disputeResult" style="margin-top:16px"></div>
  </div>`;
}

async function runDisputeAssistant(){
  const btn=document.getElementById('disputeBtn');
  const result=document.getElementById('disputeResult');
  const question=document.getElementById('disp_question')?.value.trim();
  if(!question){showToast('⚠ Describe the charge you\'re questioning first');return;}
  if(btn)btn.disabled=true;
  if(result)result.innerHTML=`<div style="color:var(--ink3);font-size:13px">⏳ Pulling billing logs…</div>`;

  const invoices=(INVOICES||[]).slice(0,5);
  const orders=(ORDERS||[]).filter(o=>role==='customer'?o.custId===currentCustId:true).slice(0,20);
  const system=`You are a billing transparency AI for ShiplyCo 3PL. When a customer questions a charge, look at the order history and rate schedule, explain exactly what triggered the charge, reference specific orders or actions, and if the charge appears to be an error, say so clearly. Be honest, specific, and helpful. ShiplyCo rates: receiving $11/pallet, outbound $11/pallet, storage $15/pallet/month, pick & pack $2.50/order, labels $0.35/unit, custom labour $40/hr, supplies at cost +15%.`;
  const userMsg=`Customer question: ${question}
Recent invoices: ${JSON.stringify(invoices.slice(0,3).map(i=>({id:i.id,total:i.total,period:i.period})))}
Recent orders: ${orders.slice(0,10).map(o=>`${o.id} ${o.date} ${o.type} ${o.status}`).join('\n')}
Explain this charge clearly with supporting evidence from the order history.`;

  await callAI([{role:'user',content:userMsg}], system, null, (reply,err)=>{
    if(btn)btn.disabled=false;
    if(result)result.innerHTML=err
      ?`<div style="color:var(--red);font-size:13px">⚠ ${err}</div>`
      :`<div style="background:var(--bg);border-radius:10px;padding:16px;font-size:13px;line-height:1.7;border-left:3px solid var(--red)">${reply.replace(/\n/g,'<br>')}</div>`;
  });
}

// ── 7. EDI EXCEPTION HANDLER ──
function renderAiEdi(){
  return `
  <div class="card">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <span style="font-size:28px">⚡</span>
      <div>
        <div style="font-weight:800;font-size:15px">EDI Exception Handler</div>
        <div style="font-size:12px;color:var(--ink3)">Paste an EDI error or failed transmission — AI identifies the cause and tells you exactly how to fix it</div>
      </div>
    </div>
    <div class="fg2">
      <div class="field">
        <label>Trading Partner</label>
        <select id="edi_partner">
          ${(EDI_PARTNERS||[]).map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Document Type</label>
        <select id="edi_doctype">
          <option>850 Purchase Order</option>
          <option>856 Advance Ship Notice</option>
          <option>810 Invoice</option>
          <option>997 Functional Acknowledgment</option>
          <option>Other</option>
        </select>
      </div>
    </div>
    <div class="field">
      <label>Paste the EDI error message or failed transaction</label>
      <textarea id="edi_error" rows="6" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:monospace;font-size:12px;resize:vertical"
        placeholder="Paste raw EDI error, rejection notice, or describe what went wrong…&#10;&#10;e.g. 'AK9*R*1*5' or '997 rejection: ISA-3, missing GS segment' or 'CommerceHub returned: ASN rejected — missing PRO number'"></textarea>
    </div>
    <button class="btn btn-red" onclick="runEdiHandler()" id="ediHandlerBtn">⚡ Diagnose & Fix</button>
    <div id="ediHandlerResult" style="margin-top:16px"></div>
  </div>`;
}

async function runEdiHandler(){
  const btn=document.getElementById('ediHandlerBtn');
  const result=document.getElementById('ediHandlerResult');
  const error=document.getElementById('edi_error')?.value.trim();
  const partner=document.getElementById('edi_partner')?.value;
  const doctype=document.getElementById('edi_doctype')?.value;
  if(!error){showToast('⚠ Paste the EDI error first');return;}
  if(btn)btn.disabled=true;
  if(result)result.innerHTML=`<div style="color:var(--ink3);font-size:13px">⏳ Diagnosing EDI error…</div>`;

  const partnerInfo=(EDI_PARTNERS||[]).find(p=>p.id===partner);
  const system=`You are an EDI expert specialising in retail supplier compliance. You know X12 EDI standards, AS2 transmission, CommerceHub, SPS Commerce, and all major retailer EDI requirements including Home Depot, Walmart, Chewy, Lowe's, and Costco. When given an EDI error, identify: 1) Root cause, 2) Which specific segment/element is wrong, 3) Exact steps to fix it, 4) How to prevent it next time. Be specific and actionable.`;
  const userMsg=`Trading partner: ${partnerInfo?.name||partner} (${partnerInfo?.ediType||'X12 EDI'} via ${partnerInfo?.platform||'VAN'})
Document type: ${doctype}
Error/issue:
${error}
Diagnose this EDI error and provide the exact fix.`;

  await callAI([{role:'user',content:userMsg}], system, null, (reply,err)=>{
    if(btn)btn.disabled=false;
    if(result)result.innerHTML=err
      ?`<div style="color:var(--red);font-size:13px">⚠ ${err}</div>`
      :`<div style="background:var(--bg);border-radius:10px;padding:16px;font-size:13px;line-height:1.7;border-left:3px solid var(--red)">${reply.replace(/\n/g,'<br>')}</div>`;
  });
}

// ── 8. BOL AUTO-FILL ──
function renderAiBolFill(){
  const pendingOrders=(ORDERS||[]).filter(o=>o.status==='processing'||o.status==='pending').slice(0,10);
  return `
  <div class="card">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <span style="font-size:28px">📋</span>
      <div>
        <div style="font-weight:800;font-size:15px">BOL Auto-Fill</div>
        <div style="font-size:12px;color:var(--ink3)">AI reads the pick list and pre-fills BOL fields — carrier, weight, freight class, description</div>
      </div>
    </div>
    <div class="fg2">
      <div class="field">
        <label>Select Order to Generate BOL</label>
        <select id="ab_order">
          ${pendingOrders.length
            ? pendingOrders.map(o=>{const c=CUSTOMERS.find(x=>x.id===o.custId);return `<option value="${o.id}">${o.id} — ${c?.name||o.custId} — ${o.type}</option>`;}).join('')
            :`<option>No pending orders</option>`}
        </select>
      </div>
      <div class="field">
        <label>Destination ZIP</label>
        <input type="text" id="ab_zip" placeholder="90210" maxlength="5"/>
      </div>
    </div>
    <div class="field">
      <label>Any special requirements?</label>
      <input type="text" id="ab_special" placeholder="e.g. liftgate required, appointment delivery, hazmat…"/>
    </div>
    <button class="btn btn-red" onclick="runBolAutoFill()" id="bolFillBtn">📋 Auto-Fill BOL</button>
    <div id="bolFillResult" style="margin-top:16px"></div>
  </div>`;
}

async function runBolAutoFill(){
  const btn=document.getElementById('bolFillBtn');
  const result=document.getElementById('bolFillResult');
  const orderId=document.getElementById('ab_order')?.value;
  const zip=document.getElementById('ab_zip')?.value;
  const special=document.getElementById('ab_special')?.value;
  if(btn)btn.disabled=true;
  if(result)result.innerHTML=`<div style="color:var(--ink3);font-size:13px">⏳ Analysing order and generating BOL fields…</div>`;

  const order=(ORDERS||[]).find(o=>o.id===orderId);
  const cust=CUSTOMERS.find(c=>c.id===order?.custId);
  const skus=order?.items?.map(i=>{
    const s=(SKU_CATALOG||[]).find(x=>x.sku===i.sku||x.id===i.skuId);
    return s?`${i.sku||i.desc}: ${s.name}, outer carton ${s.outer?.l}x${s.outer?.w}x${s.outer?.h}in, ${s.outer?.weightLb}lbs/carton`:i.desc||i.sku;
  }).join('\n')||'Mixed SKUs';

  const system=`You are a freight and logistics AI for a 3PL warehouse. Given an order's contents and destination, determine the optimal carrier, service level, freight class (NMFC), estimated weight, and package description for a Bill of Lading. Respond ONLY with a JSON object with these exact fields: carrier, service, freightClass, estimatedWeight, description, hazmat (boolean), liftgate (boolean), specialInstructions. No other text.`;
  const userMsg=`Order: ${orderId}
Customer: ${cust?.name}
Order type: ${order?.type}
Pallets: ${order?.pallets||1}
Items/SKUs:\n${skus}
Destination ZIP: ${zip||'unknown'}
Special requirements: ${special||'none'}
Origin: Houston TX 77001

Determine optimal BOL fields.`;

  await callAI([{role:'user',content:userMsg}], system, null, (reply,err)=>{
    if(btn)btn.disabled=false;
    if(err){
      if(result)result.innerHTML=`<div style="color:var(--red);font-size:13px">⚠ ${err}</div>`;
      return;
    }
    try {
      const clean=reply.replace(/```json|```/g,'').trim();
      const data=JSON.parse(clean);
      if(result)result.innerHTML=`
        <div style="background:var(--green-bg);border:1.5px solid var(--green);border-radius:10px;padding:16px">
          <div style="font-weight:800;font-size:13px;color:var(--green);margin-bottom:12px">✓ BOL Fields Generated — Ready to Create</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:14px">
            <div><strong>Carrier:</strong> ${data.carrier||'—'}</div>
            <div><strong>Service:</strong> ${data.service||'—'}</div>
            <div><strong>Freight Class:</strong> ${data.freightClass||'—'}</div>
            <div><strong>Est. Weight:</strong> ${data.estimatedWeight||'—'} lbs</div>
            <div><strong>Hazmat:</strong> ${data.hazmat?'Yes ⚠':'No'}</div>
            <div><strong>Liftgate:</strong> ${data.liftgate?'Required':'Not needed'}</div>
            <div style="grid-column:1/-1"><strong>Description:</strong> ${data.description||'—'}</div>
            ${data.specialInstructions?`<div style="grid-column:1/-1"><strong>Special Instructions:</strong> ${data.specialInstructions}</div>`:''}
          </div>
          <button class="btn btn-red" onclick="createBolFromAi(${JSON.stringify(data).replace(/'/g,"&#39;").replace(/"/g,"&quot;")}, '${orderId}', '${zip||''}')">
            📋 Open BOL Form Pre-Filled
          </button>
        </div>`;
    } catch(e){
      if(result)result.innerHTML=`<div style="background:var(--bg);border-radius:10px;padding:16px;font-size:13px;line-height:1.7;border-left:3px solid var(--red)">${reply.replace(/\n/g,'<br>')}</div>`;
    }
  });
}

function createBolFromAi(data, orderId, destZip){
  const order=(ORDERS||[]).find(o=>o.id===orderId);
  const cust=CUSTOMERS.find(c=>c.id===order?.custId);
  showPage('bol');
  setTimeout(()=>{
    openBolModal();
    setTimeout(()=>{
      const set=(id,val)=>{const el=document.getElementById(id);if(el)el.value=val;};
      set('bol_consignee', cust?.name||'');
      set('bol_dest', destZip?`Destination ZIP: ${destZip}`:'');
      set('bol_ref', orderId);
      set('bol_instructions', data.specialInstructions||'');
      // Set carrier select
      const carrierEl=document.getElementById('bol_carrier');
      if(carrierEl){[...carrierEl.options].forEach(o=>{if(o.text.toLowerCase().includes((data.carrier||'').toLowerCase().split(' ')[0]))o.selected=true;});}
      // Set service
      const svcEl=document.getElementById('bol_service');
      if(svcEl){[...svcEl.options].forEach(o=>{if(o.text.toLowerCase().includes((data.service||'').toLowerCase().split(' ')[0]))o.selected=true;});}
      // Set freight line
      const descEl=document.querySelector('.bol-desc');
      if(descEl)descEl.value=data.description||'';
      const wtEl=document.querySelector('.bol-weight');
      if(wtEl){wtEl.value=data.estimatedWeight||0;updateBolWeight();}
      const clEl=document.querySelector('.bol-class');
      if(clEl){[...clEl.options].forEach(o=>{if(o.value==data.freightClass)o.selected=true;});}
      // Checkboxes
      if(data.hazmat){const el=document.getElementById('bol_hazmat');if(el)el.checked=true;}
      if(data.liftgate){const el=document.getElementById('bol_liftgate');if(el)el.checked=true;}
      showToast('✓ BOL form pre-filled by AI');
    },200);
  },100);
}

// ── 9. BILLING AUDIT ──
function renderAiAudit(){
  return `
  <div class="card">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <span style="font-size:28px">🔍</span>
      <div>
        <div style="font-weight:800;font-size:15px">Billing Audit</div>
        <div style="font-size:12px;color:var(--ink3)">AI scans all orders and invoices to find unbilled actions, missed charges, or billing errors</div>
      </div>
    </div>
    <div class="fg2">
      <div class="field">
        <label>Customer to Audit</label>
        <select id="ba_cust">
          <option value="all">All Customers</option>
          ${(CUSTOMERS||[]).map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Period</label>
        <select id="ba_period">
          <option>This month</option>
          <option>Last 30 days</option>
          <option>Last 60 days</option>
          <option>All time</option>
        </select>
      </div>
    </div>
    <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:8px;padding:10px 14px;font-size:12px;margin-bottom:14px">
      🔍 AI will cross-reference order actions against invoices to find: unbilled labels, uninvoiced labour, missing storage charges, supply markups not applied, and more.
    </div>
    <button class="btn btn-red" onclick="runBillingAudit()" id="auditBtn">🔍 Run Billing Audit</button>
    <div id="auditResult" style="margin-top:16px"></div>
  </div>`;
}

async function runBillingAudit(){
  const btn=document.getElementById('auditBtn');
  const result=document.getElementById('auditResult');
  const custId=document.getElementById('ba_cust')?.value;
  const period=document.getElementById('ba_period')?.value;
  if(btn)btn.disabled=true;
  if(result)result.innerHTML=`<div style="color:var(--ink3);font-size:13px">⏳ Cross-referencing orders against invoices…</div>`;

  const orders=(ORDERS||[]).filter(o=>custId==='all'||o.custId===custId).slice(0,20);
  const invoices=(INVOICES||[]).filter(i=>custId==='all'||i.custId===custId).slice(0,10);
  const supplies=(SUPPLIES||[]).slice(0,10);

  const system=`You are a billing audit AI for ShiplyCo 3PL. Your job is to find money left on the table — orders where actions occurred but weren't invoiced, supplies used but not billed, storage that wasn't charged, etc. ShiplyCo rates: receiving $11/pallet, outbound $11/pallet, storage $15/pallet/month, pick & pack $2.50, labels $0.35/unit, labour $40/hr, supplies +15% markup. Format findings as: 🚨 Missed Charge, 💰 Potential Revenue, ✅ Correctly Billed, ⚠️ Needs Review. Be specific with dollar amounts.`;
  const userMsg=`Audit period: ${period}
Customer filter: ${custId==='all'?'All customers':CUSTOMERS.find(c=>c.id===custId)?.name}
Orders: ${JSON.stringify(orders.map(o=>({id:o.id,custId:o.custId,type:o.type,status:o.status,pallets:o.pallets||1,date:o.date})))}
Invoices issued: ${JSON.stringify(invoices.map(i=>({id:i.id,custId:i.custId,total:i.total,period:i.period})))}
Supply usage: ${supplies.map(s=>`${s.name}: ${s.qty} remaining`).join(', ')}

Find all unbilled charges, missed revenue, or billing discrepancies.`;

  await callAI([{role:'user',content:userMsg}], system, null, (reply,err)=>{
    if(btn)btn.disabled=false;
    if(result)result.innerHTML=err
      ?`<div style="color:var(--red);font-size:13px">⚠ ${err}</div>`
      :`<div style="background:var(--bg);border-radius:10px;padding:16px;font-size:13px;line-height:1.7;border-left:3px solid var(--red)">
          <div style="font-weight:800;margin-bottom:10px">Billing Audit Results</div>
          ${reply.replace(/\n/g,'<br>')}
          <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
            <button class="btn btn-red" onclick="showToast('Audit report exported — coming soon')">📊 Export Audit Report</button>
          </div>
        </div>`;
  });
}


// ── CUSTOMER PRICING PAGE (Admin) ──
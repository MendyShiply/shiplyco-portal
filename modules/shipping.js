// ── SHIPPING & RATES (UNIFIED) ──
// ══════════════════════════════════════════════

const CARRIERS_LIST=[
  {id:'ups',   name:'UPS',  icon:'🟤',color:'#351C15',bg:'#fdf4f0'},
  {id:'fedex', name:'FedEx',icon:'🟣',color:'#4D148C',bg:'#f5eeff'},
  {id:'usps',  name:'USPS', icon:'🔵',color:'#004B87',bg:'#eef4fc'},
  {id:'dhl',   name:'DHL',  icon:'🟡',color:'#D40511',bg:'#fdeeed'},
  {id:'ontrac',name:'OnTrac',icon:'🟠',color:'#E07B00',bg:'#fff3e6'},
];

// ShiplyCo owned carrier accounts
let SLC_CARRIER_ACCTS=[
  // Add your real carrier accounts here
];

// Customer owned carrier accounts
let CUST_CARRIER_ACCTS=[];

// Third-party shipping providers (open-ended slots)
let SHIP_PROVIDERS=[
  {id:'shiphq', name:'ShipperHQ', logo:'🚀', color:'#0070f3', bg:'#e8f2ff',
   description:'Multi-carrier rate engine with 50+ carriers, dimensional packing, and complex shipping rules. GraphQL API.',
   type:'graphql',
   connected:false,
   fields:[
     {id:'shq_apikey',   label:'API Key',          type:'text',    ph:'shq_live_xxxxxxxxxxxxxxxx'},
     {id:'shq_authcode', label:'Authentication Code',type:'password',ph:'Generated from ShipperHQ dashboard'},
     {id:'shq_endpoint', label:'GraphQL Endpoint',  type:'text',    ph:'https://api.shipperhq.com/graphql'},
   ],
   markup:10,
   note:'Find your API Key and Auth Code in ShipperHQ Dashboard → Websites → Basic Settings'},
];

// Custom providers added by admin
let CUSTOM_PROVIDERS=[];

function getCarrier(id){return CARRIERS_LIST.find(c=>c.id===id)||{name:id,icon:'📦',color:'#888',bg:'#eee'};}

function simRates(wt,l,w,h){
  const dim=Math.max(l*w*h/139,wt);
  return [
    {carrierId:'usps', service:'Priority Mail',        transit:'2-3 days', billable:+(dim*1.4+4.5).toFixed(2),  our:+(dim*1.15+3.8).toFixed(2)},
    {carrierId:'ups',  service:'UPS Ground',           transit:'3-5 days', billable:+(dim*1.8+5.2).toFixed(2),  our:+(dim*1.50+4.4).toFixed(2)},
    {carrierId:'fedex',service:'FedEx Ground',         transit:'3-5 days', billable:+(dim*1.85+5.5).toFixed(2), our:+(dim*1.55+4.6).toFixed(2)},
    {carrierId:'ups',  service:'UPS 2nd Day Air',      transit:'2 days',   billable:+(dim*3.2+8.0).toFixed(2),  our:+(dim*2.8+7.0).toFixed(2)},
    {carrierId:'usps', service:'First Class',          transit:'1-3 days', billable:+(dim*0.9+3.5).toFixed(2),  our:+(dim*0.75+3.0).toFixed(2)},
    {carrierId:'fedex',service:'FedEx Overnight',      transit:'Next day',  billable:+(dim*5.5+12).toFixed(2),  our:+(dim*4.9+10).toFixed(2)},
  ].sort((a,b)=>a.billable-b.billable);
}

function pgShipping(){
  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div class="pg-title">Shipping & Rates</div>
      <div class="pg-sub">Rate shop across all connected providers — use ShiplyCo accounts or customer's own</div>
    </div>
  </div>

  <div style="display:flex;gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:22px;flex-wrap:wrap;gap:4px">
    ${[['rates','📦 Rate Calculator'],['slc','🏢 ShiplyCo Accounts'],['cust','👤 Customer Accounts'],['providers','🔌 Providers']].map(([id,lbl],i)=>`
    <div id="stab_${id}" class="dtab${i===0?' on':''}" onclick="switchShipTab('${id}',this)" style="border-radius:6px;white-space:nowrap">${lbl}</div>`).join('')}
  </div>
  <div id="shipContent">${renderShipRatesTab()}</div>`;
}

let _shipState={wt:2.5,l:12,w:10,h:6,from:'77001',to:'90210',sig:false,ins:false};

function saveShipState(){
  _shipState.wt=parseFloat(document.getElementById('sh_wt')?.value)||_shipState.wt;
  _shipState.l=parseFloat(document.getElementById('sh_l')?.value)||_shipState.l;
  _shipState.w=parseFloat(document.getElementById('sh_w')?.value)||_shipState.w;
  _shipState.h=parseFloat(document.getElementById('sh_h')?.value)||_shipState.h;
  _shipState.from=document.getElementById('sh_from')?.value||_shipState.from;
  _shipState.to=document.getElementById('sh_to')?.value||_shipState.to;
  _shipState.sig=document.getElementById('sh_sig')?.checked||false;
  _shipState.ins=document.getElementById('sh_ins')?.checked||false;
}
function switchShipTab(tab,btn){
  saveShipState();
  document.querySelectorAll('[id^="stab_"]').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  const c=document.getElementById('shipContent');
  if(!c)return;
  if(tab==='rates')    c.innerHTML=renderShipRatesTab();
  else if(tab==='slc') c.innerHTML=renderSlcAccounts();
  else if(tab==='cust')c.innerHTML=renderCustAccounts();
  else if(tab==='providers') c.innerHTML=renderProviders();
}

function renderShipRatesTab(){
  const rates=simRates(_shipState.wt,_shipState.l,_shipState.w,_shipState.h);
  return `
  <div style="display:grid;grid-template-columns:minmax(280px,320px) 1fr;gap:20px;align-items:start;flex-wrap:wrap">
    <div class="card">
      <div class="card-head"><span class="card-title">Shipment Details</span></div>
      <div style="padding:16px 18px">
      <div class="fg2" style="padding:0;margin-bottom:12px">
        <div class="field"><label>Weight (lbs)</label><input type="number" step="0.1" id="sh_wt" value="${_shipState.wt}" oninput="recalcRates()"/></div>
        <div class="field"><label>Package</label>
          <select id="sh_pkg" onchange="recalcRates()"><option>Custom Box</option><option>Poly Mailer</option><option>Envelope</option></select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        <div class="field"><label>L (in)</label><input type="number" id="sh_l" value="${_shipState.l}" oninput="recalcRates()"/></div>
        <div class="field"><label>W (in)</label><input type="number" id="sh_w" value="${_shipState.w}" oninput="recalcRates()"/></div>
        <div class="field"><label>H (in)</label><input type="number" id="sh_h" value="${_shipState.h}" oninput="recalcRates()"/></div>
      </div>
      <div class="fg2">
        <div class="field"><label>From ZIP</label><input type="text" id="sh_from" value="${_shipState.from}" maxlength="5"/></div>
        <div class="field"><label>To ZIP</label><input type="text" id="sh_to" value="${_shipState.to}" maxlength="5"/></div>
      </div>
      <div style="display:flex;gap:14px;margin-top:12px">
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;cursor:pointer"><input type="checkbox" id="sh_sig"/> Signature</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;cursor:pointer"><input type="checkbox" id="sh_ins"/> Insurance</label>
      </div>
      </div>
    </div>
    <div class="card">
      <div class="card-head" style="display:flex;align-items:center;justify-content:space-between">
        <span class="card-title">Live Rates</span>
        <span style="font-size:11px;color:var(--ink3)">Sorted cheapest first · includes markup</span>
      </div>
      <div id="rateRows" style="padding:0 8px">${renderRateRows(rates)}</div>
    </div>
  </div>`;
}

function renderRateRows(rates){
  return rates.map((r,i)=>{
    const c=getCarrier(r.carrierId);
    const best=i===0;
    return `<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border);${best?'background:var(--green-bg);border-radius:8px;padding:11px 8px;margin:0 -8px;':''}">
      <span style="font-size:22px">${c.icon}</span>
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px">${r.service} ${best?'<span style="background:var(--green);color:#fff;border-radius:4px;padding:1px 7px;font-size:10px">BEST</span>':''}</div>
        <div style="font-size:11px;color:var(--ink3)">${c.name} · ${r.transit}</div>
      </div>
      <div style="text-align:right;min-width:80px">
        <div style="font-size:17px;font-weight:900;color:${best?'var(--green)':'var(--ink)'}">${fmt(r.billable)}</div>
        <div style="font-size:10px;color:var(--ink3)">cost: ${fmt(r.our)}</div>
      </div>
      <button class="act-btn act-process" style="font-size:10px;white-space:nowrap" onclick="buyLabel('${r.carrierId}','${r.service}',${r.billable})">Buy Label</button>
    </div>`;
  }).join('');
}

function recalcRates(){
  const wt=parseFloat(document.getElementById('sh_wt')?.value)||1;
  const l=parseFloat(document.getElementById('sh_l')?.value)||12;
  const w=parseFloat(document.getElementById('sh_w')?.value)||10;
  const h=parseFloat(document.getElementById('sh_h')?.value)||6;
  const el=document.getElementById('rateRows');
  if(el)el.innerHTML=renderRateRows(simRates(wt,l,w,h));
}
function buyLabel(carrierId,service,rate){
  // Store selection and open address modal
  _labelDraft = {carrierId,service,rate};
  const m = document.getElementById('buyLabelModal');
  if(m){ m.style.display='flex'; document.getElementById('bl_name')?.focus(); }
  else { showToast('Label modal not found'); }
}

let _labelDraft = null;

function submitBuyLabel(){
  if(!_labelDraft) return;
  const name    = document.getElementById('bl_name')?.value.trim();
  const addr    = document.getElementById('bl_addr')?.value.trim();
  const city    = document.getElementById('bl_city')?.value.trim();
  const state   = document.getElementById('bl_state')?.value.trim();
  const zip     = document.getElementById('bl_zip')?.value.trim();
  const phone   = document.getElementById('bl_phone')?.value.trim();
  if(!name||!addr||!city||!state||!zip){ showToast('Please fill in all required fields'); return; }
  document.getElementById('buyLabelModal').style.display='none';
  showToast(`✓ ${_labelDraft.service} label created for ${name} — ${fmt(_labelDraft.rate)} added to invoice`);
  _labelDraft = null;
}

function renderSlcAccounts(){
  return `
  <div class="card">
    <div class="card-head" style="display:flex;align-items:center;justify-content:space-between">
      <span class="card-title">ShiplyCo Carrier Accounts</span>
      ${role==='admin'?`<button class="act-btn act-process" onclick="addSlcAccount()">+ Add Account</button>`:''}
    </div>
    ${SLC_CARRIER_ACCTS.map(a=>{
      const c=getCarrier(a.carrierId);
      return `<div style="display:flex;align-items:center;gap:14px;padding:13px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:24px">${c.icon}</span>
        <div style="flex:1">
          <div style="font-weight:700">${a.nickname}</div>
          <div style="font-size:11px;color:var(--ink3)">Account ${a.accountNum} · ${a.markup}% markup billed to customer</div>
        </div>
        <span class="tag tg">Active</span>
        ${role==='admin'?`<button class="act-btn" onclick="editSlcAccount('${a.id}')" style="font-size:10px;background:var(--blue-bg);color:var(--blue)">${ico('edit',10)}</button>`:''}
      </div>`;}).join('')}
    <div style="padding-top:12px;font-size:12px;color:var(--ink3)">💡 Markup rate is applied on top of our negotiated carrier cost. Configurable per-customer in Customer Pricing.</div>
  </div>`;
}

function renderCustAccounts(){
  return `
  <div class="card">
    <div class="card-head" style="display:flex;align-items:center;justify-content:space-between">
      <span class="card-title">Customer-Owned Carrier Accounts</span>
      <button class="act-btn act-process" onclick="openAddCustAcct()">+ Connect Account</button>
    </div>
    ${CUST_CARRIER_ACCTS.length
      ? CUST_CARRIER_ACCTS.map(a=>{
          const c=getCarrier(a.carrierId);
          const cust=CUSTOMERS.find(x=>x.id===a.custId);
          return `<div style="display:flex;align-items:center;gap:14px;padding:13px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:24px">${c.icon}</span>
            <div style="flex:1">
              <div style="font-weight:700">${cust?.name||a.custId} — ${c.name}</div>
              <div style="font-size:11px;color:var(--ink3)">Account ${a.accountNum} · Labels charged to their carrier invoice</div>
            </div>
            <span class="tag tg">Connected</span>
            <button class="act-btn" onclick="removeCustAcct('${a.id}')" class="act-btn danger">Remove</button>
          </div>`;}).join('')
      : `<div style="padding:28px;text-align:center;color:var(--ink3)"><div style="font-size:32px;margin-bottom:8px">🔗</div><div style="font-weight:600">No customer accounts connected yet</div><div style="font-size:12px;margin-top:4px">Connect a customer's UPS/FedEx/USPS account so labels are charged directly to them</div></div>`}

    <!-- Add modal -->
    <div class="modal-bg" id="custAcctModal" role="dialog" aria-modal="true" aria-labelledby="custAcctModal-title">
      <div class="modal" style="max-width:420px">
        <div style="padding:16px 22px;border-bottom:1px solid var(--border)"><div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800">Connect Customer Carrier Account</div></div>
        <div style="padding:18px 22px">
          <div class="field"><label>Customer</label><select id="cca_cust">${CUSTOMERS.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
          <div class="field"><label>Carrier</label><select id="cca_carrier">${CARRIERS_LIST.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
          <div class="field"><label>Account Number</label><input type="text" id="cca_num" placeholder="1Z999AA1 / 740123456"/></div>
          <div class="field"><label>Nickname</label><input type="text" id="cca_nick" placeholder="Platinum UPS Account"/></div>
          <div style="background:var(--blue-bg);border-radius:7px;padding:10px 14px;font-size:12px;margin-top:6px">🔒 Stored securely. Labels printed on this account will be invoiced directly to the customer by the carrier.</div>
        </div>
        <div class="modal-actions">
          <button class="btn" onclick="document.getElementById('custAcctModal').classList.remove('open')">Cancel</button>
          <button class="btn btn-red" onclick="saveCustAcct()">Connect</button>
        </div>
      </div>
    </div>
  </div>`;
}

function openAddCustAcct(){document.getElementById('custAcctModal')?.classList.add('open');}
function saveCustAcct(){
  const custId=document.getElementById('cca_cust')?.value;
  const carrierId=document.getElementById('cca_carrier')?.value;
  const accountNum=document.getElementById('cca_num')?.value.trim();
  const nickname=document.getElementById('cca_nick')?.value.trim();
  if(!accountNum){showToast('⚠ Account number required');return;}
  CUST_CARRIER_ACCTS.push({id:'cca_'+Date.now(),custId,carrierId,accountNum,nickname:nickname||accountNum,active:true});
  document.getElementById('custAcctModal').classList.remove('open');
  showToast('✓ Carrier account connected');
  switchShipTab('cust',document.getElementById('stab_cust'));
}
function removeCustAcct(id){
  CUST_CARRIER_ACCTS=CUST_CARRIER_ACCTS.filter(a=>a.id!==id);
  switchShipTab('cust',document.getElementById('stab_cust'));
}
function addSlcAccount(){showToast('Contact ShiplyCo admin to add a new carrier account');}
function editSlcAccount(id){showToast('Edit ShiplyCo carrier account — coming soon');}

function renderProviders(){
  const all=[...SHIP_PROVIDERS,...CUSTOM_PROVIDERS];
  return `
  <div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:13px;color:var(--ink2)">Connect third-party shipping platforms to pull live rates and buy labels. Each provider is independent — connect one, several, or build your own.</div>
    ${role==='admin'?`<button class="btn btn-red" onclick="openAddProvider()" style="white-space:nowrap">${ico('plus',13)} Add Provider</button>`:''}
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px">
    ${all.map(p=>providerCard(p)).join('')}
  </div>

  <!-- ShipperHQ credential modal -->
  <div class="modal-bg" id="providerModal" role="dialog" aria-modal="true" aria-labelledby="providerModal-title">
    <div class="modal" style="max-width:500px">
      <div style="padding:16px 22px;border-bottom:1px solid var(--border)" id="provModalHead"></div>
      <div style="padding:18px 22px" id="provModalBody"></div>
      <div class="modal-actions">
        <button class="btn" onclick="document.getElementById('providerModal').classList.remove('open')">Cancel</button>
        <button class="btn btn-red" id="provSaveBtn">Save</button>
      </div>
    </div>
  </div>

  <!-- Add custom provider modal -->
  <div class="modal-bg" id="addProviderModal" role="dialog" aria-modal="true" aria-labelledby="addProviderModal-title">
    <div class="modal" style="max-width:480px">
      <div style="padding:16px 22px;border-bottom:1px solid var(--border)"><div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800">Add Shipping Provider</div></div>
      <div style="padding:18px 22px">
        <div class="fg2">
          <div class="field"><label>Provider Name</label><input type="text" id="np_name" placeholder="e.g. EasyPost, ShipStation"/></div>
          <div class="field"><label>Connection Type</label>
            <select id="np_type"><option value="rest">REST API</option><option value="graphql">GraphQL API</option><option value="webhook">Webhook</option><option value="manual">Manual / CSV</option></select>
          </div>
        </div>
        <div class="field"><label>API Endpoint URL</label><input type="text" id="np_url" placeholder="https://api.provider.com/v1/rates"/></div>
        <div class="fg2">
          <div class="field"><label>API Key / Token</label><input type="password" id="np_key" placeholder="sk_live_xxxxxx"/></div>
          <div class="field"><label>Markup on Rates (%)</label><input type="number" id="np_markup" value="10" min="0" max="100"/></div>
        </div>
        <div class="field"><label>Description / Notes</label><input type="text" id="np_desc" placeholder="What carriers does this connect to?"/></div>
        <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:7px;padding:10px 14px;font-size:12px;margin-top:10px">
          ⚙️ After saving, ShiplyCo engineering will wire the live API calls. The provider will appear in Rate Calculator once activated.
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="document.getElementById('addProviderModal').classList.remove('open')">Cancel</button>
        <button class="btn btn-red" onclick="saveCustomProvider()">Add Provider</button>
      </div>
    </div>
  </div>`;
}

function providerCard(p){
  const isCustom=!!CUSTOM_PROVIDERS.find(x=>x.id===p.id);
  return `
  <div style="background:${p.bg};border:2px solid ${p.connected?p.color:'var(--border)'};border-radius:12px;padding:18px 20px">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:28px">${p.logo}</span>
        <div>
          <div style="font-size:16px;font-weight:800;color:${p.color}">${p.name}</div>
          <span class="tag ${p.connected?'tg':'tb'}" style="font-size:10px">${p.connected?'● Connected':'○ Not connected'}</span>
          ${p.type?`<span style="font-size:10px;color:var(--ink3);margin-left:4px">${p.type.toUpperCase()}</span>`:''}
        </div>
      </div>
      ${isCustom&&role==='admin'?`<button onclick="removeProvider('${p.id}')" style="background:none;border:none;cursor:pointer;color:var(--ink3);font-size:16px">×</button>`:''}
    </div>
    <div style="font-size:12px;color:var(--ink2);margin-bottom:14px;line-height:1.5">${p.description}</div>
    ${p.note?`<div style="font-size:11px;color:var(--ink3);margin-bottom:12px">💡 ${p.note}</div>`:''}
    <div style="display:flex;gap:8px">
      <button class="btn ${p.connected?'':'btn-red'}" style="font-size:12px;flex:1" onclick="openProviderModal('${p.id}')">
        ${p.connected?'⚙ Settings':'＋ Configure'}
      </button>
      ${p.connected?`<button class="act-btn" class="act-btn sync" onclick="showToast('Syncing ${p.name}…')">↻ Sync</button>
      <button class="act-btn" onclick="disconnectProvider('${p.id}')" class="act-btn danger">Disconnect</button>`:''}
    </div>
  </div>`;
}

function openAddProvider(){document.getElementById('addProviderModal')?.classList.add('open');}
function saveCustomProvider(){
  const name=document.getElementById('np_name')?.value.trim();
  if(!name){showToast('⚠ Provider name required');return;}
  CUSTOM_PROVIDERS.push({
    id:'prov_'+Date.now(),name,
    logo:'📦',color:'#555',bg:'#f5f5f5',
    type:document.getElementById('np_type')?.value,
    description:document.getElementById('np_desc')?.value||'Custom shipping provider',
    fields:[{id:'api_key',label:'API Key',type:'password',ph:'xxxxxx'}],
    markup:parseInt(document.getElementById('np_markup')?.value)||10,
    connected:false,
    _url:document.getElementById('np_url')?.value,
    _key:document.getElementById('np_key')?.value,
  });
  document.getElementById('addProviderModal').classList.remove('open');
  showToast(`✓ ${name} added — configure credentials to connect`);
  renderProviders&&switchShipTab('providers',document.getElementById('stab_providers'));
}
function removeProvider(id){
  CUSTOM_PROVIDERS=CUSTOM_PROVIDERS.filter(p=>p.id!==id);
  switchShipTab('providers',document.getElementById('stab_providers'));
}
function disconnectProvider(id){
  const p=SHIP_PROVIDERS.find(x=>x.id===id)||CUSTOM_PROVIDERS.find(x=>x.id===id);
  if(p){p.connected=false;showToast(`${p.name} disconnected`);}
  switchShipTab('providers',document.getElementById('stab_providers'));
}

let _activeProviderId=null;
function openProviderModal(id){
  const p=SHIP_PROVIDERS.find(x=>x.id===id)||CUSTOM_PROVIDERS.find(x=>x.id===id);
  if(!p)return;
  _activeProviderId=id;
  document.getElementById('provModalHead').innerHTML=`
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:24px">${p.logo}</span>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800">${p.connected?'Edit':'Connect'} ${p.name}</div>
    </div>`;
  document.getElementById('provModalBody').innerHTML=`
    <p style="font-size:13px;color:var(--ink2);margin-bottom:14px">${p.description}</p>
    ${(p.fields||[]).map(f=>`
    <div class="field">
      <label>${f.label}</label>
      <input type="${f.type}" id="pf_${f.id}" placeholder="${f.ph}" style="font-family:monospace;font-size:12px"/>
    </div>`).join('')}
    <div class="fg2" style="margin-top:10px">
      <div class="field"><label>Markup on Rates (%)</label><input type="number" id="pf_markup" value="${p.markup||10}" min="0" max="100"/></div>
      <div class="field"><label>Fallback if unavailable</label><select id="pf_fallback"><option value="yes">Yes — use ShiplyCo accounts</option><option value="no">No — show error</option></select></div>
    </div>
    ${p.note?`<div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:7px;padding:10px 14px;font-size:12px;margin-top:10px">💡 ${p.note}</div>`:''}`;
  document.getElementById('provSaveBtn').onclick=()=>saveProvider(id);
  document.getElementById('providerModal').classList.add('open');
}
function saveProvider(id){
  const p=SHIP_PROVIDERS.find(x=>x.id===id)||CUSTOM_PROVIDERS.find(x=>x.id===id);
  if(!p)return;
  p.connected=true;
  p.markup=parseInt(document.getElementById('pf_markup')?.value)||10;
  document.getElementById('providerModal').classList.remove('open');
  showToast(`✓ ${p.name} connected`);
  switchShipTab('providers',document.getElementById('stab_providers'));
}

// ══════════════════════════════════════════════
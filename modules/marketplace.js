// ── MARKETPLACE INTEGRATIONS DATA ──
const MARKETPLACES=[
  {id:'amazon',   name:'Amazon',      icon:'🛒',color:'#FF9900',bg:'#fff8ec', connectionType:'API',
   desc:'Sync FBA inventory, download Seller Central orders, upload tracking.',
   fields:[{id:'seller_id',label:'Seller ID',type:'text',ph:'ATVPDKIKX0DER'},{id:'mws_token',label:'MWS Auth Token',type:'password',ph:'amzn.mws.xxxxxxxx'}],
   connected:false,lastSync:null,orderCount:0},
  {id:'shopify',  name:'Shopify',     icon:'🛍',color:'#96bf48',bg:'#f4f9ee', connectionType:'API',
   desc:'Pull orders automatically, sync inventory levels, push tracking back.',
   fields:[{id:'shop_url',label:'Store URL',type:'text',ph:'yourstore.myshopify.com'},{id:'api_key',label:'API Key',type:'text',ph:'shpat_xxxxxxxx'}],
   connected:true,lastSync:'2 min ago',orderCount:14},
  {id:'ebay',     name:'eBay',        icon:'🏷',color:'#e53238',bg:'#fef0f0', connectionType:'API',
   desc:'Import eBay orders and push tracking updates via eBay Developer API.',
   fields:[{id:'app_id',label:'App ID',type:'text',ph:'YourApp-xxxx'},{id:'cert_id',label:'Cert ID',type:'password',ph:'xxxxxxxx'},{id:'auth_token',label:'Auth Token',type:'password',ph:'AgAAAA...'}],
   connected:true,lastSync:'5 min ago',orderCount:3},
  {id:'walmart',  name:'Walmart',     icon:'🔵',color:'#0071CE',bg:'#eef6ff', connectionType:'EDI+API',
   desc:'Walmart Marketplace orders via API. Supplier/DSV fulfillment uses EDI — manage in the EDI tab.',
   fields:[{id:'client_id',label:'Client ID',type:'text',ph:'xxxxxxxx-xxxx'},{id:'client_secret',label:'Client Secret',type:'password',ph:'xxxxxxxxxxxxxxxx'}],
   connected:false,lastSync:null,orderCount:0,ediPartnerId:'walmart'},
  {id:'homedepot',name:'Home Depot',  icon:'🟠',color:'#F96302',bg:'#fff4ee', connectionType:'EDI',
   desc:'Home Depot requires EDI via CommerceHub — X12 standard, AS2 transport. Manage connection in the EDI tab.',
   fields:[],
   connected:false,lastSync:null,orderCount:0,ediPartnerId:'homedepot'},
  {id:'lowes',    name:"Lowe's",      icon:'🏡',color:'#004990',bg:'#eef2f9', connectionType:'EDI',
   desc:"Lowe's supplier orders use EDI X12 via their vendor portal. Manage in the EDI tab.",
   fields:[],
   connected:false,lastSync:null,orderCount:0,ediPartnerId:'lowes'},
  {id:'costco',   name:'Costco',      icon:'🔴',color:'#005DAA',bg:'#eef3fb', connectionType:'EDI',
   desc:'Costco warehouse and e-commerce supplier orders use EDI X12. Manage in the EDI tab.',
   fields:[],
   connected:false,lastSync:null,orderCount:0,ediPartnerId:'costco'},
  {id:'chewy',    name:'Chewy',       icon:'🐾',color:'#00BFFF',bg:'#ecfaff', connectionType:'EDI',
   desc:'Chewy requires EDI compliance for all suppliers — POs, ASNs, invoices. Manage in the EDI tab.',
   fields:[],
   connected:false,lastSync:null,orderCount:0,ediPartnerId:'chewy'},
];
let CUSTOM_MARKETPLACES=[];
let _mpCredentials={shopify:{shop_url:'platinumfg.myshopify.com',api_key:'shpat_demo123'},ebay:{app_id:'ShiplyCo-Demo-1234',cert_id:''}};

function pgMarketplaces(){
  const allMp=[...MARKETPLACES,...CUSTOM_MARKETPLACES];
  const connected=allMp.filter(m=>m.connected);
  const apiOnes=allMp.filter(m=>!m.connected&&m.connectionType!=='EDI');
  const ediOnes=allMp.filter(m=>!m.connected&&m.connectionType==='EDI');
  const mixedOnes=allMp.filter(m=>!m.connected&&m.connectionType==='EDI+API');

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div class="pg-title">Marketplace Integrations</div>
      <div class="pg-sub">Connect sales channels — API channels sync orders automatically · EDI channels managed in the EDI tab</div>
    </div>
    <button class="btn btn-red" onclick="openAddMarketplace()">${ico('plus',13)} Add Marketplace</button>
  </div>

  <!-- Connection type legend -->
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
    <div style="display:flex;align-items:center;gap:6px;background:var(--blue-bg);border-radius:6px;padding:5px 12px">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--blue)"></div>
      <span style="font-size:12px;font-weight:700;color:var(--blue)">API</span>
      <span style="font-size:11px;color:var(--ink3)">Real-time order sync</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;background:var(--gold-light);border-radius:6px;padding:5px 12px">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--gold)"></div>
      <span style="font-size:12px;font-weight:700;color:var(--gold)">EDI</span>
      <span style="font-size:11px;color:var(--ink3)">X12 document exchange — managed in EDI tab</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;background:var(--green-bg);border-radius:6px;padding:5px 12px">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--green)"></div>
      <span style="font-size:12px;font-weight:700;color:var(--green)">EDI + API</span>
      <span style="font-size:11px;color:var(--ink3)">Both channels available</span>
    </div>
  </div>

  <div class="stats" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat"><div class="stat-lbl">Connected</div><div class="stat-val" style="${connected.length?'color:var(--green)':''}">${connected.length}</div><span class="tag ${connected.length?'tg':'tb'}">Live channels</span></div>
    <div class="stat"><div class="stat-lbl">Orders Today</div><div class="stat-val">${connected.reduce((s,m)=>s+(m.orderCount||0),0)}</div><span class="tag tg">Auto-imported</span></div>
    <div class="stat"><div class="stat-lbl">Available</div><div class="stat-val">${allMp.filter(m=>!m.connected).length}</div><span class="tag tb">Ready to connect</span></div>
  </div>

  ${connected.length?`
  <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--green);margin-bottom:12px">● Active (${connected.length})</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-bottom:24px">
    ${connected.map(m=>mpCard(m)).join('')}
  </div>`:''}

  <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--ink3);margin-bottom:12px">○ API Channels — Available (${apiOnes.length})</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-bottom:24px">
    ${apiOnes.map(m=>mpCard(m)).join('')}
  </div>

  ${ediOnes.length?`
  <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--gold);margin-bottom:12px">○ EDI Channels — Managed in EDI Tab (${ediOnes.length})</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-bottom:24px">
    ${ediOnes.map(m=>mpCard(m)).join('')}
  </div>`:''}

  <!-- Add custom marketplace modal -->
  <div class="modal-bg" id="addMpModal" role="dialog" aria-modal="true" aria-labelledby="addMpModal-title">
    <div class="modal" style="max-width:480px">
      <div style="padding:16px 22px;border-bottom:1px solid var(--border)">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800">Add Marketplace</div>
      </div>
      <div style="padding:18px 22px">
        <div class="fg2">
          <div class="field"><label>Marketplace Name</label><input type="text" id="amp_name" placeholder="e.g. Etsy, TikTok Shop, Wayfair"/></div>
          <div class="field"><label>Connection Type</label>
            <select id="amp_type">
              <option value="API">API — real-time sync</option>
              <option value="EDI">EDI — X12 document exchange</option>
              <option value="EDI+API">EDI + API — both</option>
              <option value="Manual">Manual / CSV upload</option>
            </select>
          </div>
        </div>
        <div class="fg2">
          <div class="field"><label>Icon / Emoji</label><input type="text" id="amp_icon" placeholder="🛒" maxlength="4"/></div>
          <div class="field"><label>Brand Color</label><input type="color" id="amp_color" value="#888888" style="height:38px;width:100%;border-radius:6px;border:1px solid var(--border);cursor:pointer"/></div>
        </div>
        <div class="field"><label>Description</label><input type="text" id="amp_desc" placeholder="What does this marketplace sell? How does it connect?"/></div>
        <div style="background:var(--blue-bg);border-radius:7px;padding:10px 14px;font-size:12px;margin-top:8px">
          💡 After adding, configure API credentials or EDI settings to activate the connection.
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="document.getElementById('addMpModal').classList.remove('open')">Cancel</button>
        <button class="btn btn-red" onclick="saveCustomMarketplace()">Add Marketplace</button>
      </div>
    </div>
  </div>

  <!-- Connect modal -->
  <div class="modal-bg" id="mpModal" role="dialog" aria-modal="true" aria-labelledby="mpModal-title">
    <div class="modal" style="max-width:460px">
      <div style="padding:16px 22px;border-bottom:1px solid var(--border)" id="mpModalHead"></div>
      <div style="padding:18px 22px" id="mpModalBody"></div>
      <div class="modal-actions">
        <button class="btn" onclick="document.getElementById('mpModal').classList.remove('open')">Cancel</button>
        <button class="btn btn-red" id="mpSaveBtn">Connect</button>
      </div>
    </div>
  </div>`;
}

function mpCard(m){
  const isEdi=m.connectionType==='EDI';
  const typeColor=m.connectionType==='EDI'?'var(--gold)':m.connectionType==='EDI+API'?'var(--green)':'var(--blue)';
  const typeBg=m.connectionType==='EDI'?'var(--gold-light)':m.connectionType==='EDI+API'?'var(--green-bg)':'var(--blue-bg)';
  const isCustom=!!CUSTOM_MARKETPLACES.find(x=>x.id===m.id);
  return `
  <div style="background:${m.bg||'var(--surface)'};border:2px solid ${m.connected?m.color:'var(--border)'};border-radius:12px;padding:16px 18px">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:24px">${m.icon||'📦'}</span>
        <div>
          <div style="font-size:14px;font-weight:800;color:${m.color||'var(--ink)'}">${m.name}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
            <span class="tag ${m.connected?'tg':'tb'}" style="font-size:10px">${m.connected?'● Live':'○ Not connected'}</span>
            <span style="background:${typeBg};color:${typeColor};border-radius:4px;padding:1px 6px;font-size:10px;font-weight:800">${m.connectionType}</span>
          </div>
        </div>
      </div>
      ${isCustom?`<button onclick="removeCustomMarketplace('${m.id}')" style="background:none;border:none;cursor:pointer;color:var(--ink3);font-size:18px;line-height:1">×</button>`:''}
    </div>
    <div style="font-size:12px;color:var(--ink2);margin-bottom:12px;line-height:1.4">${m.desc}</div>
    ${m.connected?`<div style="font-size:11px;margin-bottom:10px;color:var(--green)">↻ Last sync: ${m.lastSync} · ${m.orderCount} orders today</div>`:''}
    <div style="display:flex;gap:7px">
      ${isEdi
        ? `<button class="btn" style="font-size:12px;flex:1" onclick="showPage('edi')">→ Go to EDI Tab</button>`
        : m.connected
          ? `<button class="btn" style="font-size:12px" onclick="openMpModal('${m.id}')">⚙ Settings</button>
             <button class="act-btn" class="act-btn sync" onclick="syncMp('${m.id}')">↻ Sync</button>
             <button class="act-btn" onclick="disconnectMp('${m.id}')" class="act-btn danger">Disconnect</button>`
          : `<button class="btn btn-red" style="font-size:12px;flex:1" onclick="openMpModal('${m.id}')">＋ Connect</button>`}
    </div>
  </div>`;
}

function openAddMarketplace(){document.getElementById('addMpModal')?.classList.add('open');}
function saveCustomMarketplace(){
  const name=document.getElementById('amp_name')?.value.trim();
  if(!name){showToast('⚠ Marketplace name required');return;}
  const color=document.getElementById('amp_color')?.value||'#888';
  CUSTOM_MARKETPLACES.push({
    id:'mp_'+Date.now(),name,
    icon:document.getElementById('amp_icon')?.value||'📦',
    color,bg:color+'22',
    connectionType:document.getElementById('amp_type')?.value||'API',
    desc:document.getElementById('amp_desc')?.value||'',
    fields:[{id:'api_key',label:'API Key / Credentials',type:'password',ph:'Enter your API key'}],
    connected:false,lastSync:null,orderCount:0,
  });
  document.getElementById('addMpModal').classList.remove('open');
  showToast(`✓ ${name} added`);
  showPage('marketplaces');
}
function removeCustomMarketplace(id){
  CUSTOM_MARKETPLACES=CUSTOM_MARKETPLACES.filter(m=>m.id!==id);
  showPage('marketplaces');
}

let _activeMpId=null;
function openMpModal(mpId){
  const m=[...MARKETPLACES,...CUSTOM_MARKETPLACES].find(x=>x.id===mpId);
  if(!m||!m.fields?.length){showToast('No API credentials needed — managed via EDI tab');return;}
  _activeMpId=mpId;
  const creds=_mpCredentials[mpId]||{};
  document.getElementById('mpModalHead').innerHTML=`
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:22px">${m.icon}</span>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800">${m.connected?'Edit':'Connect'} ${m.name}</div>
    </div>`;
  document.getElementById('mpModalBody').innerHTML=`
    <p style="font-size:13px;color:var(--ink2);margin-bottom:14px">${m.desc}</p>
    ${m.fields.map(f=>`<div class="field"><label>${f.label}</label><input type="${f.type}" id="mp_${f.id}" placeholder="${f.ph}" value="${creds[f.id]||''}" style="font-family:monospace;font-size:12px"/></div>`).join('')}
    <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:7px;padding:10px 14px;font-size:12px;margin-top:10px">🔒 API credentials stored securely and never shared.</div>`;
  document.getElementById('mpSaveBtn').onclick=()=>saveMpConnection(mpId);
  document.getElementById('mpModal').classList.add('open');
}
function saveMpConnection(mpId){
  const m=[...MARKETPLACES,...CUSTOM_MARKETPLACES].find(x=>x.id===mpId);if(!m)return;
  const creds={};
  m.fields.forEach(f=>{creds[f.id]=document.getElementById('mp_'+f.id)?.value||'';});
  _mpCredentials[mpId]=creds;
  m.connected=true;m.lastSync='just now';m.orderCount=0;
  document.getElementById('mpModal').classList.remove('open');
  showToast(`✓ ${m.name} connected`);
  showPage('marketplaces');
}
function syncMp(mpId){
  const m=[...MARKETPLACES,...CUSTOM_MARKETPLACES].find(x=>x.id===mpId);
  if(m){m.lastSync='just now';showToast(`↻ Syncing ${m.name}…`);}
}
function disconnectMp(mpId){
  const m=[...MARKETPLACES,...CUSTOM_MARKETPLACES].find(x=>x.id===mpId);
  if(!m)return;
  confirmAction(`Disconnect ${m.name}? Order sync will stop.`,()=>{m.connected=false;m.lastSync=null;m.orderCount=0;showToast(`${m.name} disconnected`);showPage('marketplaces');});
}


// ══════════════════════════════════════════════
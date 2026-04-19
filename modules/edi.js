// ── EDI MANAGEMENT ──
// ══════════════════════════════════════════════

const EDI_PARTNERS=[
  {id:'homedepot',name:'Home Depot',icon:'🟠',color:'#F96302',bg:'#fff4ee',
   ediType:'X12 / AS2',platform:'CommerceHub',
   docs:['850 Purchase Order','856 Advance Ship Notice (ASN)','810 Invoice','860 PO Change','997 Functional Acknowledgment'],
   connected:false,testMode:false,middleware:'',fines:{lateAsn:250,missingTmsId:100,badLabel:'$5/carton'},
   note:'Home Depot requires EDI via CommerceHub. Fines apply for late/missing ASNs and non-compliant labels.'},
  {id:'chewy',name:'Chewy',icon:'🐾',color:'#00BFFF',bg:'#ecfaff',
   ediType:'X12 / VAN',platform:'SPS Commerce or direct',
   docs:['850 Purchase Order','856 ASN','810 Invoice','997 Acknowledgment'],
   connected:false,testMode:false,middleware:'',
   note:'Chewy EDI compliance is mandatory for all suppliers. Use SPS Commerce or direct VAN connection.'},
  {id:'walmart',name:'Walmart',icon:'🔵',color:'#0071CE',bg:'#eef6ff',
   ediType:'X12 / AS2',platform:'Walmart Supplier Center',
   docs:['850 PO','856 ASN','810 Invoice','753 Routing Request','754 Routing Instructions'],
   connected:false,testMode:false,middleware:'',
   note:'Walmart uses their own Supplier Center portal for EDI onboarding. Routing confirmation required before shipment.'},
  {id:'lowes',name:"Lowe's",icon:'🏡',color:'#004990',bg:'#eef2f9',
   ediType:'X12 / AS2',platform:"Lowe's Vendor Portal",
   docs:['850 PO','856 ASN','810 Invoice','997 Acknowledgment'],
   connected:false,testMode:false,middleware:'',
   note:"Lowe's EDI is managed through their vendor portal. Contact your Lowe's buyer for onboarding."},
  {id:'costco',name:'Costco',icon:'🔴',color:'#005DAA',bg:'#eef3fb',
   ediType:'X12 / VAN',platform:'Costco Supplier Portal',
   docs:['850 PO','856 ASN','810 Invoice'],
   connected:false,testMode:false,middleware:'',
   note:'Costco supplier EDI is required for all warehouse and e-commerce orders.'},
];

const EDI_MIDDLEWARE=[
  {id:'sps',name:'SPS Commerce',desc:'Largest EDI network, pre-built connections to all major retailers'},
  {id:'truecommerce',name:'TrueCommerce',desc:'Full-service EDI with WMS connectors'},
  {id:'orderful',name:'Orderful',desc:'Modern API-first EDI platform'},
  {id:'kleinschmidt',name:'Kleinschmidt',desc:'Specialist in retail EDI including Home Depot'},
  {id:'custom',name:'Custom / Direct',desc:'Direct AS2 or VAN connection'},
];

// Simulated PO inbox
let EDI_PO_INBOX=[
  {id:'po_001',partnerId:'homedepot',poNum:'HD-4521987',date:'2026-03-07',items:[{sku:'661890608',desc:'Hyper Tough Extension Cord',qty:120,price:12.50}],status:'pending',dueDate:'2026-03-12'},
  {id:'po_002',partnerId:'chewy',poNum:'CHW-88201',date:'2026-03-06',items:[{sku:'PET-SKU-001',desc:'Pet Supply Item',qty:48,price:8.99}],status:'acknowledged',dueDate:'2026-03-11'},
];

let EDI_ASN_LOG=[
  {id:'asn_001',poId:'po_002',partnerId:'chewy',asnNum:'ASN-2026-001',sentAt:'2026-03-06 14:22',status:'accepted',units:48},
];

function pgEdi(){
  const connected=EDI_PARTNERS.filter(p=>p.connected);
  const pending=EDI_PARTNERS.filter(p=>!p.connected);
  const pendingPos=EDI_PO_INBOX.filter(p=>p.status==='pending');

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div class="pg-title">EDI Management</div>
      <div class="pg-sub">Electronic Data Interchange — big-box retailer order compliance</div>
    </div>
  </div>

  <div style="background:var(--gold-light);border:2px solid var(--gold);border-radius:10px;padding:14px 18px;margin-bottom:20px;font-size:13px;line-height:1.6">
    <strong>What is EDI?</strong> Home Depot, Chewy, Walmart, Lowe's and Costco do not use standard APIs — they require
    <strong>EDI (Electronic Data Interchange)</strong>, a structured document exchange in ANSI X12 format transmitted over AS2 or a VAN network.
    As the 3PL, you are responsible for receiving their Purchase Orders (850), sending Advance Ship Notices before the truck leaves (856),
    and submitting Invoices (810). Missing or late documents trigger automatic fines. Connect a middleware provider like
    <strong>SPS Commerce</strong> or <strong>TrueCommerce</strong> to handle the technical transmission — ShiplyCo manages the workflow.
  </div>

  <div class="stats" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat"><div class="stat-lbl">EDI Partners</div><div class="stat-val">${EDI_PARTNERS.length}</div><span class="tag tb">Supported</span></div>
    <div class="stat"><div class="stat-lbl">Connected</div><div class="stat-val" style="${connected.length?'color:var(--green)':'color:var(--ink3)'}">${connected.length}</div><span class="tag ${connected.length?'tg':'to'}">${connected.length?'Live':'None yet'}</span></div>
    <div class="stat"><div class="stat-lbl">POs Waiting</div><div class="stat-val" style="${pendingPos.length?'color:var(--orange)':''}">${pendingPos.length}</div><span class="tag ${pendingPos.length?'to':'tg'}">${pendingPos.length?'Action needed':'All clear'}</span></div>
    <div class="stat"><div class="stat-lbl">ASNs Sent</div><div class="stat-val">${EDI_ASN_LOG.length}</div><span class="tag tg">This week</span></div>
  </div>

  <!-- Tabs -->
  <div style="display:flex;gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:22px;width:fit-content">
    ${[['partners','🔌 Trading Partners'],['po','📥 PO Inbox'],['asn','📤 ASN Builder'],['log','📋 ASN Log']].map(([id,lbl],i)=>`
    <div id="etab_${id}" class="dtab${i===0?' on':''}" onclick="switchEdiTab('${id}',this)" style="border-radius:0">${lbl}</div>`).join('')}
  </div>
  <div id="ediContent">${renderEdiPartners()}</div>`;
}

function switchEdiTab(tab,btn){
  document.querySelectorAll('[id^="etab_"]').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  const c=document.getElementById('ediContent');if(!c)return;
  if(tab==='partners') c.innerHTML=renderEdiPartners();
  else if(tab==='po')  c.innerHTML=renderPoInbox();
  else if(tab==='asn') c.innerHTML=renderAsnBuilder();
  else if(tab==='log') c.innerHTML=renderAsnLog();
}

function renderEdiPartners(){
  return `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px">
    ${EDI_PARTNERS.map(p=>`
    <div style="background:${p.bg};border:2px solid ${p.connected?p.color:'var(--border)'};border-radius:12px;padding:18px 20px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="font-size:26px">${p.icon}</span>
        <div>
          <div style="font-size:15px;font-weight:800;color:${p.color}">${p.name}</div>
          <span class="tag ${p.connected?'tg':'to'}" style="font-size:10px">${p.connected?'● Connected':'○ Not connected'}</span>
          <span style="font-size:10px;color:var(--ink3);margin-left:4px">EDI ${p.ediType}</span>
        </div>
      </div>
      <div style="font-size:11px;color:var(--ink3);margin-bottom:8px">Platform: <strong>${p.platform}</strong></div>
      <div style="margin-bottom:10px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);margin-bottom:4px">Required Documents</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          ${p.docs.map(d=>`<span style="background:#fff;border:1px solid var(--border);border-radius:4px;padding:2px 6px;font-size:10px;font-weight:600">${d}</span>`).join('')}
        </div>
      </div>
      ${p.fines?`<div style="background:var(--red-light);border-radius:6px;padding:7px 10px;font-size:11px;color:var(--red);margin-bottom:10px">
        ⚠ Fine examples: Late ASN = <strong>${p.fines.lateAsn}</strong> · Missing TMS ID = <strong>${p.fines.missingTmsId}</strong>
      </div>`:''}
      <div style="font-size:11px;color:var(--ink2);margin-bottom:12px;line-height:1.4">${p.note}</div>
      <div style="margin-bottom:10px">
        <label style="font-size:11px;font-weight:700">Middleware Provider</label>
        <select onchange="setEdiMiddleware('${p.id}',this.value)" style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;font-size:12px;margin-top:4px">
          <option value="">— Select middleware —</option>
          ${EDI_MIDDLEWARE.map(m=>`<option value="${m.id}" ${p.middleware===m.id?'selected':''}>${m.name}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn ${p.connected?'':'btn-red'}" style="font-size:12px;flex:1" onclick="toggleEdiConnect('${p.id}')">
          ${p.connected?'⚙ Settings':'＋ Set Up EDI'}
        </button>
        ${p.connected?`<span class="tag tg" style="display:flex;align-items:center">Live</span>`:''}
      </div>
    </div>`).join('')}
  </div>`;
}

function setEdiMiddleware(partnerId,val){
  const p=EDI_PARTNERS.find(x=>x.id===partnerId);
  if(p){p.middleware=val;showToast(`✓ ${p.name} middleware set to ${EDI_MIDDLEWARE.find(m=>m.id===val)?.name||val}`);}
}
function toggleEdiConnect(id){
  const p=EDI_PARTNERS.find(x=>x.id===id);if(!p)return;
  if(!p.middleware&&!p.connected){showToast('⚠ Select a middleware provider first');return;}
  p.connected=!p.connected;
  showToast(p.connected?`✓ ${p.name} EDI connected — ready for POs`:`${p.name} disconnected`);
  switchEdiTab('partners',document.getElementById('etab_partners'));
}

function renderPoInbox(){
  return `
  <div class="card">
    <div class="card-head" style="display:flex;align-items:center;justify-content:space-between">
      <span class="card-title">Purchase Order Inbox (${EDI_PO_INBOX.length})</span>
      <button class="act-btn act-process" onclick="showToast('↻ Checking for new POs…')">↻ Check Now</button>
    </div>
    ${EDI_PO_INBOX.length?EDI_PO_INBOX.map(po=>{
      const partner=EDI_PARTNERS.find(p=>p.id===po.partnerId);
      const units=po.items.reduce((s,i)=>s+i.qty,0);
      const isLate=new Date(po.dueDate)<new Date();
      return `<div style="padding:14px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-size:18px">${partner?.icon||'📦'}</span>
              <span style="font-weight:800;font-size:14px">${po.poNum}</span>
              <span class="tag ${po.status==='pending'?'to':'tg'}">${po.status}</span>
              ${isLate?'<span class="tag tr">⚠ Overdue</span>':''}
            </div>
            <div style="font-size:12px;color:var(--ink2)">${partner?.name} · ${po.date} · Due ${po.dueDate}</div>
            <div style="font-size:12px;margin-top:4px">${po.items.map(i=>`${i.desc} × ${i.qty}`).join(' | ')}</div>
            <div style="font-size:11px;color:var(--ink3);margin-top:2px">${units} total units · Est. value ${fmt(po.items.reduce((s,i)=>s+i.qty*i.price,0))}</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${po.status==='pending'?`<button class="act-btn act-process" onclick="acknowledgePo('${po.id}')">✓ Acknowledge (997)</button>`:''}
            <button class="act-btn" onclick="buildAsnFromPo('${po.id}')" style="background:var(--blue-bg);color:var(--blue)">📤 Build ASN</button>
          </div>
        </div>
      </div>`;
    }).join(''):`<div style="padding:32px;text-align:center;color:var(--ink3)"><div style="font-size:32px;margin-bottom:8px">📭</div><div style="font-weight:600">No POs in inbox</div><div style="font-size:12px;margin-top:4px">Connect an EDI trading partner to start receiving purchase orders</div></div>`}
  </div>`;
}

function acknowledgePo(id){
  const po=EDI_PO_INBOX.find(p=>p.id===id);
  if(po){po.status='acknowledged';showToast(`✓ PO ${po.poNum} acknowledged — 997 sent to ${EDI_PARTNERS.find(p=>p.id===po.partnerId)?.name}`);}
  switchEdiTab('po',document.getElementById('etab_po'));
}

function buildAsnFromPo(poId){
  switchEdiTab('asn',document.getElementById('etab_asn'));
  setTimeout(()=>{
    const po=EDI_PO_INBOX.find(p=>p.id===poId);if(!po)return;
    const partner=EDI_PARTNERS.find(p=>p.id===po.partnerId);
    const el=document.getElementById('asn_po');if(el)el.value=po.poNum;
    const pe=document.getElementById('asn_partner');if(pe)pe.value=po.partnerId;
    showToast(`PO ${po.poNum} loaded into ASN builder`);
  },100);
}

function renderAsnBuilder(){
  return `
  <div class="card" style="max-width:640px">
    <div class="card-head"><span class="card-title">📤 Build Advance Ship Notice (856)</span></div>
    <div style="font-size:12px;color:var(--ink3);margin-bottom:16px">ASN must be transmitted <strong>before the truck leaves the warehouse.</strong> Late ASN = automatic fine.</div>
    <div class="fg2">
      <div class="field"><label>Trading Partner</label>
        <select id="asn_partner">${EDI_PARTNERS.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select>
      </div>
      <div class="field"><label>PO Number</label><input type="text" id="asn_po" placeholder="HD-4521987"/></div>
    </div>
    <div class="fg2">
      <div class="field"><label>Ship Date</label><input type="date" id="asn_shipdate" value="2026-03-08"/></div>
      <div class="field"><label>Carrier / SCAC Code</label><input type="text" id="asn_scac" placeholder="UPSN / FDEG / USPS"/></div>
    </div>
    <div class="fg2">
      <div class="field"><label>PRO / Tracking Number</label><input type="text" id="asn_track" placeholder="1Z999AA1234567890"/></div>
      <div class="field"><label>TMS Ship ID (Home Depot)</label><input type="text" id="asn_tms" placeholder="Required for HD — $100 fine if missing"/></div>
    </div>
    <div class="fg3">
      <div class="field"><label>Total Cartons</label><input type="number" id="asn_cartons" placeholder="12"/></div>
      <div class="field"><label>Total Units</label><input type="number" id="asn_units" placeholder="144"/></div>
      <div class="field"><label>Total Weight (lbs)</label><input type="number" id="asn_weight" placeholder="85"/></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:14px">
      <button class="btn btn-red" onclick="sendAsn()">📤 Transmit ASN</button>
      <button class="btn" onclick="showToast('ASN preview — coming soon')">👁 Preview 856</button>
      <button class="btn" onclick="showToast('GS1-128 labels generated')">🏷 Print GS1 Labels</button>
    </div>
  </div>`;
}

function sendAsn(){
  const po=document.getElementById('asn_po')?.value;
  const partner=document.getElementById('asn_partner')?.value;
  const track=document.getElementById('asn_track')?.value;
  if(!po||!track){showToast('⚠ PO Number and Tracking Number required');return;}
  const p=EDI_PARTNERS.find(x=>x.id===partner);
  const newAsn={id:'asn_'+Date.now(),poId:'',partnerId:partner,asnNum:'ASN-'+Date.now().toString().slice(-6),sentAt:new Date().toLocaleString(),status:'sent',units:parseInt(document.getElementById('asn_units')?.value)||0};
  EDI_ASN_LOG.unshift(newAsn);
  showToast(`✓ ASN transmitted to ${p?.name} — ${newAsn.asnNum}`);
  switchEdiTab('log',document.getElementById('etab_log'));
}

function renderAsnLog(){
  return `
  <div class="card">
    <div class="card-head"><span class="card-title">ASN Transmission Log</span></div>
    ${EDI_ASN_LOG.length?`<div style="overflow-x:auto"><table>
      <thead><tr><th>ASN #</th><th>Partner</th><th>PO #</th><th>Sent</th><th>Units</th><th>Status</th></tr></thead>
      <tbody>
        ${EDI_ASN_LOG.map(a=>{
          const p=EDI_PARTNERS.find(x=>x.id===a.partnerId);
          const po=EDI_PO_INBOX.find(x=>x.id===a.poId);
          return `<tr>
            <td class="mono" style="font-size:12px">${a.asnNum}</td>
            <td><span style="font-size:12px">${p?.icon||''} ${p?.name||a.partnerId}</span></td>
            <td class="mono" style="font-size:12px">${po?.poNum||'—'}</td>
            <td style="font-size:12px;color:var(--ink2)">${a.sentAt}</td>
            <td style="font-weight:700">${a.units}</td>
            <td><span class="tag ${a.status==='accepted'?'tg':a.status==='sent'?'tb':'tr'}">${a.status}</span></td>
          </tr>`;}).join('')}
      </tbody>
    </table></div>`:`<div style="padding:28px;text-align:center;color:var(--ink3)">No ASNs transmitted yet</div>`}
  </div>`;
}

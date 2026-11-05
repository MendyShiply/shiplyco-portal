function pgPricing(){
  const rateKeys=[
    {key:'monthly_service',label:'Monthly Service Fee',unit:'flat'},
    {key:'receiving_pallet',label:'Receiving — Standard Pallet',unit:'/pallet'},
    {key:'receiving_pallet_oversized',label:'Receiving — Oversized Pallet',unit:'/pallet'},
    {key:'receiving_container_20',label:'Receiving — 20ft Container',unit:'flat'},
    {key:'receiving_container_40',label:'Receiving — 40ft Container',unit:'flat'},
    {key:'outbound_pallet',label:'Outbound — Standard Pallet',unit:'/pallet'},
    {key:'outbound_pallet_oversized',label:'Outbound — Oversized Pallet',unit:'/pallet'},
    {key:'storage_pallet',label:'Storage — Full Month',unit:'/pallet/mo'},
    {key:'storage_pallet_half',label:'Storage — After 16th',unit:'/pallet/mo'},
    {key:'pallet_wrap',label:'Pallet Wrapping',unit:'/pallet'},
    {key:'pallet_build',label:'Pallet Building',unit:'/pallet'},
    {key:'new_pallet',label:'New Pallet',unit:'each'},
    {key:'label',label:'Labels',unit:'/label'},
    {key:'pick_pack_standard',label:'Pick & Pack — Standard',unit:'/order'},
    {key:'pick_pack_additional_sku',label:'Pick & Pack — Additional SKU',unit:'/SKU'},
    {key:'fba_label',label:'FBA FNSKU Label',unit:'/unit'},
    {key:'fba_kitting',label:'FBA Kitting',unit:'/unit'},
    {key:'transloading',label:'Transloading',unit:'/pallet'},
    {key:'disposal',label:'Disposal',unit:'/pallet'},
    {key:'custom_labor',label:'Custom Labor',unit:'/hr'},
  ];

  let activeCustId=CUSTOMERS[0].id;

  return `
  <div class="pg-head"><div class="pg-title">Customer Pricing</div><div class="pg-sub">Set custom rate overrides per customer — all billing uses these rates automatically</div></div>

  <div style="display:grid;grid-template-columns:280px 1fr;gap:20px;align-items:start">
    <!-- Customer Selector -->
    <div class="card">
      <div class="card-head"><span class="card-title">Customers</span></div>
      <div>
        ${CUSTOMERS.map((c,i)=>`<div class="nv ${i===0?'on':''}" id="pricingCust-${c.id}" onclick="selectPricingCust('${c.id}')" style="padding:12px 16px">
          <div class="cust-av" style="width:28px;height:28px;font-size:12px;flex-shrink:0">${c.initials}</div>
          <div>
            <div style="font-size:13px;font-weight:700">${c.name}</div>
            <div style="font-size:10px;color:var(--ink3)">${Object.keys(CUSTOMER_RATES[c.id]||{}).length} overrides</div>
          </div>
        </div>`).join('')}
        <div style="padding:12px 16px">
          <button class="add-btn" onclick="addNewCustomer()" style="font-size:11px;padding:8px">${ico('plus',11)} New Customer</button>
        </div>
      </div>
    </div>

    <!-- Rate Editor -->
    <div id="pricingEditor">
      ${renderPricingEditor(CUSTOMERS[0],rateKeys)}
    </div>
  </div>`;

  function renderPricingEditor(cust,keys){ return buildPricingEditor(cust,keys); }
}

function buildPricingEditor(cust,keys){
  if(!keys){
    keys=[
      {key:'monthly_service',label:'Monthly Service Fee',unit:'flat'},
      {key:'receiving_pallet',label:'Receiving — Standard Pallet',unit:'/pallet'},
      {key:'receiving_pallet_oversized',label:'Receiving — Oversized Pallet',unit:'/pallet'},
      {key:'outbound_pallet',label:'Outbound — Standard Pallet',unit:'/pallet'},
      {key:'outbound_pallet_oversized',label:'Outbound — Oversized Pallet',unit:'/pallet'},
      {key:'storage_pallet',label:'Storage — Full Month',unit:'/pallet/mo'},
      {key:'storage_pallet_half',label:'Storage — After 16th',unit:'/pallet/mo'},
      {key:'pallet_wrap',label:'Pallet Wrapping',unit:'/pallet'},
      {key:'pallet_build',label:'Pallet Building',unit:'/pallet'},
      {key:'label',label:'Labels',unit:'/label'},
      {key:'pick_pack_standard',label:'Pick & Pack — Standard',unit:'/order'},
      {key:'fba_label',label:'FBA FNSKU Label',unit:'/unit'},
      {key:'fba_kitting',label:'FBA Kitting',unit:'/unit'},
      {key:'transloading',label:'Transloading',unit:'/pallet'},
      {key:'disposal',label:'Disposal',unit:'/pallet'},
      {key:'custom_labor',label:'Custom Labor',unit:'/hr'},
    ];
  }
  const overrides=CUSTOMER_RATES[cust.id]||{};
  const hasOverrides=Object.keys(overrides).length>0;
  return `
  <div class="card">
    <div class="card-head" style="flex-wrap:wrap;gap:10px">
      <div>
        <span class="card-title">${cust.name}</span>
        ${hasOverrides?`<span class="tag tgd" style="margin-left:8px">${Object.keys(overrides).length} custom rate${Object.keys(overrides).length>1?'s':''}</span>`:'<span class="tag" style="margin-left:8px;background:var(--surface2);color:var(--ink3)">Standard rates</span>'}
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-red" onclick="savePricingOverrides('${cust.id}')">Save Changes</button>
        <button class="btn" onclick="resetPricing('${cust.id}')">Reset to Standard</button>
      </div>
    </div>
    <div style="padding:14px 20px;background:var(--gold-light);border-bottom:1px solid var(--border);font-size:12px;color:var(--gold);font-weight:600">
      📌 Overridden rates are shown in gold. Blank = use standard rate. Changes take effect immediately on new invoices.
    </div>
    <div style="padding:12px 20px;display:grid;grid-template-columns:1fr auto auto auto;gap:0;align-items:center">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);padding:6px 0">Service</div>
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);padding:6px 16px;text-align:right">Standard</div>
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--gold);padding:6px 16px;text-align:center">Custom Rate</div>
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);padding:6px 0;text-align:center">Unit</div>
    </div>
    ${keys.map(k=>{
      const std=RATES[k.key];
      const ov=overrides[k.key];
      const hasOv=ov!==undefined;
      return `<div style="display:grid;grid-template-columns:1fr auto auto auto;gap:0;align-items:center;padding:8px 20px;border-top:1px solid var(--border);background:${hasOv?'var(--gold-light)':''}">
        <div style="font-size:13px;font-weight:${hasOv?700:500}">${k.label}</div>
        <div style="font-size:13px;color:var(--ink3);padding:0 16px;text-align:right;white-space:nowrap">${fmt(std)}</div>
        <div style="padding:0 12px">
          <input type="number" step="0.01" min="0" placeholder="Override…"
            value="${hasOv?ov:''}"
            style="width:100px;padding:5px 8px;border:1px solid ${hasOv?'var(--gold)':'var(--border)'};border-radius:6px;font-family:Barlow,sans-serif;font-size:13px;font-weight:${hasOv?700:400};color:${hasOv?'var(--gold)':'var(--ink)'};background:${hasOv?'rgba(184,145,58,0.08)':'var(--surface)'};text-align:right;outline:none"
            id="rate-${cust.id}-${k.key}"
            oninput="this.style.borderColor=this.value?'var(--gold)':'var(--border)';this.style.color=this.value?'var(--gold)':'var(--ink)'"
          />
        </div>
        <div style="font-size:11px;color:var(--ink3);text-align:center;white-space:nowrap">${k.unit}</div>
      </div>`;
    }).join('')}
    <div style="padding:16px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">
      <button class="btn btn-red" onclick="savePricingOverrides('${cust.id}')">Save Changes</button>
    </div>
  </div>`;
}

function selectPricingCust(custId){
  document.querySelectorAll('[id^="pricingCust-"]').forEach(el=>{el.classList.remove('on')});
  const el=document.getElementById('pricingCust-'+custId);
  if(el)el.classList.add('on');
  const cust=CUSTOMERS.find(c=>c.id===custId);
  if(cust)document.getElementById('pricingEditor').innerHTML=buildPricingEditor(cust,null);
}

function savePricingOverrides(custId){
  const keys=['monthly_service','receiving_pallet','receiving_pallet_oversized','outbound_pallet','outbound_pallet_oversized','storage_pallet','storage_pallet_half','pallet_wrap','pallet_build','label','pick_pack_standard','fba_label','fba_kitting','transloading','disposal','custom_labor'];
  if(!CUSTOMER_RATES[custId])CUSTOMER_RATES[custId]={};
  let count=0;
  keys.forEach(k=>{
    const el=document.getElementById('rate-'+custId+'-'+k);
    if(el&&el.value!==''){CUSTOMER_RATES[custId][k]=parseFloat(el.value);count++;}
    else if(el&&el.value===''){delete CUSTOMER_RATES[custId][k];}
  });
  showToast(`✓ ${CUSTOMERS.find(c=>c.id===custId)?.name} — ${count} rate override${count!==1?'s':''} saved`);
}

function resetPricing(custId){
  confirmAction('Reset all custom rates to standard rates?',()=>{
    CUSTOMER_RATES[custId]={};
    selectPricingCust(custId);
    showToast('Pricing reset to standard rates');
  });
}

function addNewCustomer(){
  const name=prompt('New customer name:');
  if(!name)return;
  const id=name.toLowerCase().replace(/[^a-z0-9]/g,'_').substring(0,12);
  CUSTOMERS.push({id,name,initials:name.split(' ').map(w=>w[0]).join('').toUpperCase().substring(0,2),trucks:0,pallets:0,units:0,active:true,balance:0,contact:'',email:'',phone:'',rateNote:'Standard rates'});
  CUSTOMER_RATES[id]={};
  showPage('pricing');
  setTimeout(()=>selectPricingCust(id),100);
}

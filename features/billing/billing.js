function pgBilling(){
  const rateGroups=[
    {cat:'Monthly',rates:[{n:'Monthly Service Fee',d:'Inventory management + customer support',p:'$100.00/mo'}]},
    {cat:'Receiving',rates:[
      {n:'Standard Pallet',d:'Max 40x48x72',p:'$11.00/pallet'},
      {n:'Oversized Pallet',d:'Larger than standard',p:'$22.00/pallet'},
      {n:'Container — 20\'',d:'Up to 500 cases',p:'$350.00'},
      {n:'Container — 40\'',d:'Up to 800 cases',p:'$550.00'},
      {n:'Boxes / Cartons',d:'Per carton received',p:'$3.00/carton'},
      {n:'Palletizing',d:'Build pallet from loose goods',p:'$10.00/pallet'},
    ]},
    {cat:'Storage',rates:[
      {n:'Standard Pallet',d:'1 SKU per pallet, billed 1st of month',p:'$15.00/mo'},
      {n:'Standard Pallet (mid-month)',d:'Received 16th–end of month',p:'$7.50/mo'},
      {n:'Oversized Pallet',d:'Larger than 40x48x72',p:'$30.00/mo'},
      {n:'Bin Storage',d:'12x18x24, 1 SKU per bin',p:'$5.00/mo'},
    ]},
    {cat:'Outbound',rates:[
      {n:'Pallet Shipment',d:'Standard pallet',p:'$11.00/pallet'},
      {n:'Oversized Pallet Shipment',d:'',p:'$22.00/pallet'},
      {n:'Pallet Building',d:'If pallet needs to be built',p:'+$10.00/pallet'},
      {n:'Pallet Wrapping',d:'',p:'$5.00/pallet'},
      {n:'New Pallet',d:'',p:'$5.00'},
      {n:'Labels & Stickers',d:'BOL prints, Amazon labels, etc.',p:'$0.35 each'},
      {n:'Pre-packed Box (label only)',d:'',p:'$2.50/box'},
    ]},
    {cat:'Pick & Pack (FBM)',rates:[
      {n:'Standard Size',d:'Envelopes, poly bags included',p:'$2.50/order'},
      {n:'Additional SKU',d:'Per extra SKU in order',p:'+$0.50'},
      {n:'Larger Box/Supplies',d:'Supplies at cost',p:'$2.50 + cost +15%'},
    ]},
    {cat:'FBA Prep',rates:[
      {n:'Labels',d:'',p:'$0.35 each'},
      {n:'Kitting',d:'Including ASIN label',p:'$0.75 each'},
      {n:'Box / Supplies',d:'',p:'Cost +15%'},
    ]},
    {cat:'Additional Services',rates:[
      {n:'Transloading',d:'',p:'$55.00/pallet'},
      {n:'Disposal',d:'',p:'$5.00/pallet or case'},
      {n:'Rush Service',d:'',p:'$5.00+/order'},
      {n:'Custom Labor',d:'Any unlisted service',p:'$40.00/hr'},
      {n:'Credit Card Processing',d:'',p:'3% fee'},
    ]},
  ];
  return `
  <div class="pg-head"><div class="pg-title">Billing & Rates</div><div class="pg-sub">ShiplyCo Fulfillment — complete rate schedule</div></div>
  <div class="billing-grid">
    <div class="card">
      <div class="card-head"><span class="card-title">Rate Schedule</span><button class="btn">Download PDF</button></div>
      ${rateGroups.map(g=>`
        <div class="rate-cat">${g.cat}</div>
        ${g.rates.map(r=>`
        <div class="rate-row">
          <div><div class="rate-name">${r.n}</div>${r.d?`<div class="rate-desc">${r.d}</div>`:''}</div>
          <div class="rate-price">${r.p}</div>
        </div>`).join('')}`).join('')}
    </div>
    <div>
      <div class="card" style="border-color:var(--red)">
        <div class="card-head" style="background:var(--red-light)"><span class="card-title" style="color:var(--red)">Quick Estimate</span></div>
        <div style="padding:16px">
          <div class="field" style="margin-bottom:10px"><label>Standard Pallets Received</label><input type="number" id="est-recv" value="24" oninput="calcEst()"/></div>
          <div class="field" style="margin-bottom:10px"><label>Pallets in Storage</label><input type="number" id="est-stor" value="68" oninput="calcEst()"/></div>
          <div class="field" style="margin-bottom:10px"><label>Pallets Shipped Out</label><input type="number" id="est-ship" value="60" oninput="calcEst()"/></div>
          <div class="field" style="margin-bottom:10px"><label>Pallets Wrapped</label><input type="number" id="est-wrap" value="60" oninput="calcEst()"/></div>
          <div class="field" style="margin-bottom:16px"><label>Labels Printed</label><input type="number" id="est-lbl" value="85" oninput="calcEst()"/></div>
          <div style="border-top:2px solid var(--ink);padding-top:12px" id="est-result"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">Shipping Deadlines</span></div>
        <div style="padding:14px 16px;font-size:13px;line-height:2;color:var(--ink2)">
          <div>📦 Orders by <strong>1:30 PM</strong> ship same day</div>
          <div>📦 After 1:30 PM ships next business day</div>
          <div>📅 Friday cutoff: <strong>11:30 AM</strong></div>
          <div>⚡ Rush service: <strong>+$5/order</strong></div>
        </div>
      </div>
    </div>
  </div>`;
}

function calcEst(){
  const recv=+document.getElementById('est-recv').value||0;
  const stor=+document.getElementById('est-stor').value||0;
  const ship=+document.getElementById('est-ship').value||0;
  const wrap=+document.getElementById('est-wrap').value||0;
  const lbl=+document.getElementById('est-lbl').value||0;
  const monthly=100;
  const recvAmt=recv*11;
  const storAmt=stor*15;
  const shipAmt=ship*11;
  const wrapAmt=wrap*5;
  const lblAmt=lbl*0.35;
  const total=monthly+recvAmt+storAmt+shipAmt+wrapAmt+lblAmt;
  document.getElementById('est-result').innerHTML=`
    <div style="font-size:11px;color:var(--ink3);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Estimate Breakdown</div>
    ${[['Monthly Fee',monthly],['Receiving',recvAmt],['Storage',storAmt],['Outbound',shipAmt],['Wrapping',wrapAmt],['Labels',lblAmt]].map(([l,v])=>
      `<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid var(--border)"><span>${l}</span><strong>${fmt(v)}</strong></div>`).join('')}
    <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;padding:10px 0 0;margin-top:4px"><span>TOTAL</span><span style="color:var(--red)">${fmt(total)}</span></div>`;
}

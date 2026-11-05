// ── CUSTOMER MANAGER ──
let _custLoaded = false;
let _contactsLoaded = false;

async function loadAllContacts(){
  try{
    const {data} = await sb.from('contacts').select('*').order('name').limit(5000);
    _contacts = {};
    (data||[]).forEach(ct=>{
      if(!_contacts[ct.customer_id]) _contacts[ct.customer_id]=[];
      _contacts[ct.customer_id].push(ct);
    });
    _contactsLoaded = true;
  }catch(e){ _contactsLoaded = true; }
}

function pgCustomers(){
  if(!_custLoaded){
    loadCustomers().then(()=>{ _custLoaded=true; loadAllContacts().then(()=>showPage('customers')); });
    return '<div style="padding:40px;text-align:center;color:var(--ink3)">Loading customers…</div>';
  }
  if(!_contactsLoaded){
    loadAllContacts().then(()=>showPage('customers'));
    return '<div style="padding:40px;text-align:center;color:var(--ink3)">Loading contacts…</div>';
  }

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div class="pg-title">Customers</div>
      <div class="pg-sub">${CUSTOMERS.length} client${CUSTOMERS.length!==1?'s':''}</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <input type="text" id="custSearch" placeholder="Search customers…" oninput="filterCustomers(this.value)"
        style="padding:7px 12px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;font-size:13px;width:200px"/>
      <button class="btn btn-red" onclick="showAddCustomerModal()">+ Add Customer</button>
    </div>
  </div>

  ${CUSTOMERS.length===0?`
  <div class="card" style="text-align:center;padding:40px;color:var(--ink3)">
    <div style="font-size:32px;margin-bottom:12px">🏢</div>
    <div style="font-weight:700;margin-bottom:6px">No customers yet</div>
    <div style="font-size:12px;margin-bottom:16px">Add your first client to get started</div>
    <button class="btn btn-red" onclick="showAddCustomerModal()">+ Add Customer</button>
  </div>
  `:` 
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
    ${CUSTOMERS.map(c=>`
    <div class="card cust-card" style="padding:18px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div style="width:44px;height:44px;border-radius:50%;background:var(--red);color:#fff;
                    display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;flex-shrink:0">
          ${c.initials||c.name.slice(0,2).toUpperCase()}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:800;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name}</div>
          <div style="font-size:12px;color:var(--ink3)">${c.city&&c.state?c.city+', '+c.state:''}</div>
        </div>
        <span class="tag ${c.active?'tg':'tr'}">${c.active?'Active':'Inactive'}</span>
      </div>
      <div style="font-size:12px;color:var(--ink3);display:flex;flex-direction:column;gap:4px">
        ${c.address?`<div>📍 ${[c.address,c.city,c.state,c.zip].filter(Boolean).join(', ')}</div>`:''}
        ${c.rate_note?`<div style="margin-top:6px;padding:6px 8px;background:var(--blue-bg);border-radius:4px;color:var(--blue);font-size:11px">💰 ${c.rate_note}</div>`:''}
      </div>
      <!-- Contacts preview -->
      ${(_contacts[c.id]&&_contacts[c.id].length>0)?`
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--ink3);margin-bottom:6px">Contacts</div>
        ${_contacts[c.id].map(ct=>`
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <div style="width:22px;height:22px;border-radius:50%;background:var(--red);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              ${ct.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div style="font-size:12px;font-weight:600">${ct.name}</div>
            <div style="font-size:10px;color:var(--ink3)">${ct.role||''}</div>
          </div>
        `).join('')}
      </div>`:
      `<div style="margin-top:8px;font-size:11px;color:var(--ink3);border-top:1px solid var(--border);padding-top:8px">No contacts yet</div>`}
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn" style="flex:1" onclick="editCustomer('${c.id}')">Edit</button>
        <button class="btn" style="flex:1" onclick="showContacts('${c.id}','${c.name}')">👥 Contacts</button>
        <button class="act-btn danger" onclick="deleteCustomer('${c.id}','${c.name}')">Delete</button>
      </div>
    </div>
    `).join('')}
  </div>`}

  <!-- Contacts Modal -->
  <div id="contactsModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:6000;align-items:center;justify-content:center;padding:20px">
    <div style="background:var(--surface);border-radius:12px;width:100%;max-width:600px;max-height:90vh;display:flex;flex-direction:column">
      <div class="modal-head">
        <span class="modal-title" id="contactsModalTitle">Contacts</span>
        <button class="modal-close" onclick="document.getElementById('contactsModal').style.display='none'">×</button>
      </div>
      <div class="modal-body" id="contactsModalBody" style="overflow-y:auto;flex:1"></div>
    </div>
  </div>

  <!-- Add/Edit Customer Modal -->
  <div id="custModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:6000;align-items:center;justify-content:center;padding:20px">
    <div style="background:var(--surface);border-radius:12px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto">
      <div class="modal-head">
        <span class="modal-title" id="custModalTitle">Add Customer</span>
        <button class="modal-close" onclick="document.getElementById('custModal').style.display='none'">×</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="cust_id"/>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="field" style="grid-column:span 2"><label>Company Name *</label>
            <input id="cust_name" placeholder="Company name" style="width:100%"/>
          </div>
          <div class="field"><label>Initials (2-3 letters)</label>
            <input id="cust_initials" placeholder="e.g. PF" maxlength="3" style="width:100%;text-transform:uppercase"/>
          </div>
          <div class="field"><label>Status</label>
            <select id="cust_active" style="width:100%">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div class="field" style="grid-column:span 2">
            <label style="font-weight:800;font-size:12px;color:var(--ink3);text-transform:uppercase;letter-spacing:0.5px">Billing Address</label>
          </div>
          <div class="field" style="grid-column:span 2"><label>Street</label>
            <input id="cust_address" placeholder="Street address" style="width:100%"/>
          </div>
          <div class="field"><label>City</label>
            <input id="cust_city" placeholder="City" style="width:100%"/>
          </div>
          <div class="field"><label>State</label>
            <input id="cust_state" placeholder="TX" style="width:100%"/>
          </div>
          <div class="field"><label>ZIP</label>
            <input id="cust_zip" placeholder="77001" style="width:100%"/>
          </div>
          <div class="field" style="grid-column:span 2">
            <label style="font-weight:800;font-size:12px;color:var(--ink3);text-transform:uppercase;letter-spacing:0.5px">Shipping Address <span style="font-weight:400;text-transform:none;letter-spacing:0">(if different)</span></label>
          </div>
          <div class="field" style="grid-column:span 2"><label>Street</label>
            <input id="cust_ship_address" placeholder="Shipping street address" style="width:100%"/>
          </div>
          <div class="field"><label>City</label>
            <input id="cust_ship_city" placeholder="City" style="width:100%"/>
          </div>
          <div class="field"><label>State</label>
            <input id="cust_ship_state" placeholder="TX" style="width:100%"/>
          </div>
          <div class="field"><label>ZIP</label>
            <input id="cust_ship_zip" placeholder="77001" style="width:100%"/>
          </div>
          <div class="field" style="grid-column:span 2"><label>Rate Notes</label>
            <input id="cust_rate_note" placeholder="e.g. Custom rate: $5/pallet receive & ship" style="width:100%"/>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="document.getElementById('custModal').style.display='none'">Cancel</button>
        <button class="btn btn-red" onclick="saveCustomer()">Save Customer</button>
      </div>
    </div>
  </div>`;
}

// ── CONTACTS ──
let _activeContactsCustId = null;
let _contacts = {}; // custId -> array of contacts

async function showContacts(custId, custName){
  _activeContactsCustId = custId;
  document.getElementById('contactsModalTitle').textContent = custName + ' — Contacts';
  document.getElementById('contactsModal').style.display = 'flex';
  renderContactsModal(custId);
  // Load from Supabase
  try{
    const {data} = await sb.from('contacts').select('*').eq('customer_id',custId).order('name');
    _contacts[custId] = data||[];
    renderContactsModal(custId);
  }catch(e){ showToast('Error loading contacts: '+e.message); }
}

function renderContactsModal(custId){
  const body = document.getElementById('contactsModalBody');
  if(!body) return;
  const list = _contacts[custId]||[];

  body.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn btn-red" onclick="showAddContactForm()">+ Add Contact</button>
    </div>

    ${list.length===0?'<div style="text-align:center;padding:24px;color:var(--ink3)">No contacts yet — add one above</div>':''}

    ${list.map(ct=>`
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div>
          <div style="font-weight:800;font-size:14px">${ct.name}</div>
          <div style="font-size:11px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:0.5px;margin-top:2px">${ct.role||'Contact'}</div>
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="editContact(${ct.id})" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer">Edit</button>
          <button onclick="deleteContact(${ct.id},'${ct.name}')" style="background:none;border:1px solid rgba(232,36,26,0.3);border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;color:var(--red)">Delete</button>
        </div>
      </div>
      <div style="font-size:12px;color:var(--ink3);display:flex;flex-direction:column;gap:3px">
        ${ct.email?`<div>✉ ${ct.email}</div>`:''}
        ${ct.email2?`<div>✉ ${ct.email2}</div>`:''}
        ${ct.phone?`<div>📞 ${ct.phone}</div>`:''}
        ${ct.whatsapp?`<div>💬 WhatsApp: ${ct.whatsapp}</div>`:''}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        ${ct.billing_cc?'<span style="font-size:10px;background:var(--blue-bg);color:var(--blue);border-radius:4px;padding:2px 7px;font-weight:700">💰 Billing</span>':''}
        ${ct.receiving_cc?'<span style="font-size:10px;background:var(--green-bg);color:var(--green);border-radius:4px;padding:2px 7px;font-weight:700">🚛 Receiving</span>':''}
        ${ct.orders_cc?'<span style="font-size:10px;background:var(--gold-light);color:#92700a;border-radius:4px;padding:2px 7px;font-weight:700">📦 Orders</span>':''}
        ${ct.outbound_cc?'<span style="font-size:10px;background:var(--red-light);color:var(--red);border-radius:4px;padding:2px 7px;font-weight:700">🚚 Outbound</span>':''}
      </div>
      ${ct.notes?`<div style="font-size:11px;color:var(--ink3);margin-top:6px;font-style:italic">${ct.notes}</div>`:''}
    </div>
    `).join('')}

    <!-- Add/Edit Contact Form -->
    <div id="contactForm" style="display:none;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;margin-top:12px">
      <div style="font-size:13px;font-weight:800;margin-bottom:12px" id="contactFormTitle">New Contact</div>
      <input type="hidden" id="ct_id"/>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        <div class="field"><label>Name *</label><input id="ct_name" placeholder="Full name" style="width:100%"/></div>
        <div class="field"><label>Role</label>
          <select id="ct_role" style="width:100%">
            <option value="Owner">Owner</option>
            <option value="Partner">Partner</option>
            <option value="Operations">Operations</option>
            <option value="Warehouse">Warehouse</option>
            <option value="Billing">Billing</option>
            <option value="CC Only">CC Only</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="field"><label>Email</label><input id="ct_email" type="email" placeholder="email@company.com" style="width:100%"/></div>
        <div class="field"><label>Email 2</label><input id="ct_email2" type="email" placeholder="second@company.com" style="width:100%"/></div>
        <div class="field"><label>Phone</label><input id="ct_phone" placeholder="+1 (713) 555-0000" style="width:100%"/></div>
        <div class="field"><label>WhatsApp</label><input id="ct_whatsapp" placeholder="+1 (713) 555-0000" style="width:100%"/></div>
        <div class="field"><label>Notes</label><input id="ct_notes" placeholder="Any notes" style="width:100%"/></div>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px">
          <input type="checkbox" id="ct_billing"/> CC on billing
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px">
          <input type="checkbox" id="ct_receiving"/> CC on receiving
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px">
          <input type="checkbox" id="ct_orders"/> CC on orders
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px">
          <input type="checkbox" id="ct_outbound"/> CC on outbound
        </label>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn" onclick="document.getElementById('contactForm').style.display='none'">Cancel</button>
        <button class="btn btn-red" onclick="saveContact()">Save Contact</button>
      </div>
    </div>
  `;
}

function showAddContactForm(){
  document.getElementById('contactFormTitle').textContent = 'New Contact';
  document.getElementById('ct_id').value = '';
  ['ct_name','ct_email','ct_email2','ct_phone','ct_whatsapp','ct_notes'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  ['ct_billing','ct_receiving','ct_orders','ct_outbound'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.checked=false;
  });
  document.getElementById('ct_role').value = 'Owner';
  document.getElementById('contactForm').style.display = 'block';
  setTimeout(()=>document.getElementById('ct_name')?.focus(),100);
}

function editContact(id){
  const custId = _activeContactsCustId;
  const ct = (_contacts[custId]||[]).find(c=>c.id===id);
  if(!ct) return;
  document.getElementById('contactFormTitle').textContent = 'Edit Contact';
  document.getElementById('ct_id').value = ct.id;
  document.getElementById('ct_name').value = ct.name||'';
  document.getElementById('ct_role').value = ct.role||'Owner';
  document.getElementById('ct_email').value = ct.email||'';
  document.getElementById('ct_email2').value = ct.email2||'';
  document.getElementById('ct_phone').value = ct.phone||'';
  document.getElementById('ct_whatsapp').value = ct.whatsapp||'';
  document.getElementById('ct_notes').value = ct.notes||'';
  document.getElementById('ct_billing').checked = !!ct.billing_cc;
  document.getElementById('ct_receiving').checked = !!ct.receiving_cc;
  document.getElementById('ct_orders').checked = !!ct.orders_cc;
  document.getElementById('ct_outbound').checked = !!ct.outbound_cc;
  document.getElementById('contactForm').style.display = 'block';
}

async function saveContact(){
  const name = document.getElementById('ct_name')?.value.trim();
  if(!name){ showToast('Name is required'); return; }
  const custId = _activeContactsCustId;
  const existingId = document.getElementById('ct_id')?.value;

  const data = {
    customer_id: custId,
    name,
    role: document.getElementById('ct_role')?.value||'Contact',
    email: document.getElementById('ct_email')?.value.trim()||null,
    email2: document.getElementById('ct_email2')?.value.trim()||null,
    phone: document.getElementById('ct_phone')?.value.trim()||null,
    whatsapp: document.getElementById('ct_whatsapp')?.value.trim()||null,
    notes: document.getElementById('ct_notes')?.value.trim()||null,
    billing_cc: document.getElementById('ct_billing')?.checked||false,
    receiving_cc: document.getElementById('ct_receiving')?.checked||false,
    orders_cc: document.getElementById('ct_orders')?.checked||false,
    outbound_cc: document.getElementById('ct_outbound')?.checked||false,
  };

  try{
    if(existingId){
      const {error} = await sb.from('contacts').update(data).eq('id',+existingId);
      if(error) throw error;
      const idx = (_contacts[custId]||[]).findIndex(c=>c.id===+existingId);
      if(idx>-1) _contacts[custId][idx] = {..._contacts[custId][idx],...data,id:+existingId};
    } else {
      const {data:saved,error} = await sb.from('contacts').insert([data]).select();
      if(error) throw error;
      if(!_contacts[custId]) _contacts[custId]=[];
      _contacts[custId].push(saved[0]);
    }
    showToast('Contact saved');
    renderContactsModal(custId);
  }catch(e){ showToast('Error: '+e.message); }
}

async function deleteContact(id, name){
  confirmAction('Delete '+name+'?', async()=>{
    const custId = _activeContactsCustId;
    try{
      await sb.from('contacts').delete().eq('id',id);
      _contacts[custId] = (_contacts[custId]||[]).filter(c=>c.id!==id);
      renderContactsModal(custId);
      showToast('Contact deleted');
    }catch(e){ showToast('Error: '+e.message); }
  });
}

function filterCustomers(q){
  q = q.toLowerCase();
  document.querySelectorAll('.cust-card').forEach(card=>{
    card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function showAddCustomerModal(){
  document.getElementById('custModalTitle').textContent = 'Add Customer';
  document.getElementById('cust_id').value = '';
  ['name','initials','address','city','state','zip','rate_note','ship_address','ship_city','ship_state','ship_zip'].forEach(f=>{
    const el = document.getElementById('cust_'+f);
    if(el) el.value = '';
  });
  document.getElementById('cust_active').value = 'true';
  document.getElementById('custModal').style.display = 'flex';
  setTimeout(()=>document.getElementById('cust_name')?.focus(), 100);
}

function editCustomer(id){
  const c = CUSTOMERS.find(x=>x.id===id);
  if(!c) return;
  document.getElementById('custModalTitle').textContent = 'Edit Customer';
  document.getElementById('cust_id').value = c.id;
  ['name','initials','address','city','state','zip','rate_note'].forEach(f=>{
    const el = document.getElementById('cust_'+f);
    if(el) el.value = c[f]||'';
  });
  document.getElementById('cust_active').value = String(c.active!==false);
  document.getElementById('custModal').style.display = 'flex';
}

async function saveCustomer(){
  const name = document.getElementById('cust_name')?.value.trim();
  if(!name){ showToast('Company name is required'); return; }

  const existingId = document.getElementById('cust_id')?.value;
  const id = existingId || name.toLowerCase().replace(/[^a-z0-9]/g,'_').slice(0,20)+'_'+Date.now().toString().slice(-4);
  const initials = document.getElementById('cust_initials')?.value.trim().toUpperCase() ||
                   name.split(' ').map(w=>w[0]).join('').slice(0,3).toUpperCase();

  const data = {
    id, name, initials,

    address: document.getElementById('cust_address')?.value.trim()||null,
    city:    document.getElementById('cust_city')?.value.trim()||null,
    state:   document.getElementById('cust_state')?.value.trim()||null,
    zip:     document.getElementById('cust_zip')?.value.trim()||null,
    ship_address: document.getElementById('cust_ship_address')?.value.trim()||null,
    ship_city:    document.getElementById('cust_ship_city')?.value.trim()||null,
    ship_state:   document.getElementById('cust_ship_state')?.value.trim()||null,
    ship_zip:     document.getElementById('cust_ship_zip')?.value.trim()||null,
    rate_note: document.getElementById('cust_rate_note')?.value.trim()||null,
    active:  document.getElementById('cust_active')?.value === 'true',
  };

  try{
    if(existingId){
      const {error} = await sb.from('customers').update(data).eq('id',existingId);
      if(error) throw error;
      const idx = CUSTOMERS.findIndex(c=>c.id===existingId);
      if(idx>-1) CUSTOMERS[idx] = {...CUSTOMERS[idx],...data};
      showToast('Customer updated');
    } else {
      const {error} = await sb.from('customers').insert([data]);
      if(error) throw error;
      CUSTOMERS.push(data);
      showToast('Customer added');
    }
    document.getElementById('custModal').style.display = 'none';
    showPage('customers');
  }catch(e){ showToast('Error: '+e.message); }
}

async function deleteCustomer(id, name){
  confirmAction('Delete '+name+'? This cannot be undone.', async()=>{
    try{
      await sb.from('customers').delete().eq('id',id);
      CUSTOMERS = CUSTOMERS.filter(c=>c.id!==id);
      showToast(name+' deleted');
      showPage('customers');
    }catch(e){ showToast('Error: '+e.message); }
  });
}

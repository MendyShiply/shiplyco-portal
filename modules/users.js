// ── USER MANAGEMENT ──
let _allUsers = [];

async function pgAdminLoad(){
  const wrap = document.getElementById('usersTableWrap');
  if(!wrap) return;
  wrap.innerHTML = `<div style="padding:40px;text-align:center;color:var(--ink3)"><span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Loading users…</div>`;

  const {data, error} = await sb.from('profiles').select('*').order('created_at', {ascending:false});
  if(error){ wrap.innerHTML=`<div style="padding:20px;color:var(--red)">Error loading users: ${error.message}</div>`; return; }

  _allUsers = data||[];
  renderUsersTable(_allUsers);
}

function renderUsersTable(users){
  const wrap = document.getElementById('usersTableWrap');
  if(!wrap) return;
  const filter = document.getElementById('userRoleFilter')?.value||'all';
  const search = document.getElementById('userSearch')?.value?.toLowerCase()||'';
  let list = users;
  if(filter!=='all') list = list.filter(u=>u.role===filter);
  if(search) list = list.filter(u=>(u.email||'').toLowerCase().includes(search)||(u.full_name||'').toLowerCase().includes(search));

  if(!list.length){
    wrap.innerHTML=`<div style="padding:40px;text-align:center;color:var(--ink3)">No users found</div>`;
    return;
  }

  wrap.innerHTML=`
  <div class="tbl-wrap">
  <table class="tbl">
    <thead><tr>
      <th>Name</th><th>Email</th><th>Role</th><th>Customer</th><th>Last Login</th><th>Status</th><th>Actions</th>
    </tr></thead>
    <tbody>
    ${list.map(u=>{
      const roleColor = u.role==='admin'?'var(--red)':u.role==='employee'?'var(--blue)':'var(--green)';
      const lastLogin = u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString() : 'Never';
      const cust = CUSTOMERS.find(c=>c.id===u.customer_id);
      return `<tr>
        <td style="font-weight:600">${u.full_name||'—'}</td>
        <td style="font-family:monospace;font-size:12px">${u.email||'—'}</td>
        <td><span class="tag" style="background:${roleColor}20;color:${roleColor};border:1px solid ${roleColor}40;text-transform:capitalize">${u.role}</span></td>
        <td>${cust?.name||'—'}</td>
        <td style="color:var(--ink3);font-size:12px">${lastLogin}</td>
        <td><span class="tag ${u.active?'tg':'tr'}">${u.active?'Active':'Inactive'}</span></td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="act-btn info" onclick="openEditUser('${u.id}')">Edit</button>
            <button class="act-btn" onclick="resetUserPassword('${u.email}')">Reset PW</button>
            <button class="act-btn ${u.active?'danger':''}" onclick="toggleUserActive('${u.id}',${u.active})">${u.active?'Deactivate':'Activate'}</button>
          </div>
        </td>
      </tr>`;
    }).join('')}
    </tbody>
  </table>
  </div>`;
}

function pgAdmin(){
  // Load users after render
  setTimeout(pgAdminLoad, 100);

  return `
  <div class="pg-head">
    <div class="pg-title">Settings</div>
    <div class="pg-sub">Manage your warehouse, team, and account</div>
  </div>

  <!-- Quick links to all tools -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:28px">
    ${[
      {id:'customers', icon:'users',    label:'Customers',      desc:'Manage client accounts'},
      {id:'locations', icon:'grid',     label:'Locations',      desc:'Manage warehouse spots'},
      {id:'pricing',   icon:'dollar',   label:'Pricing',        desc:'Customer rate cards'},
      {id:'skumaster', icon:'pkg',      label:'Product Catalog',desc:'SKU & item database'},
      {id:'leaderboard',icon:'chart',   label:'Leaderboard',    desc:'Team performance'},
      {id:'supplies',  icon:'tag',      label:'Supplies',       desc:'Warehouse supplies'},
      {id:'labels',    icon:'tag',      label:'Label Printer',  desc:'Print pallet labels'},
      {id:'twilio',    icon:'send',     label:'Notifications',  desc:'SMS & alerts'},
      {id:'marketplaces',icon:'cart',   label:'Marketplaces',   desc:'Amazon, TikTok, eBay'},
      {id:'edi',       icon:'send',     label:'EDI',            desc:'Electronic data exchange'},
      {id:'shipping',  icon:'send',     label:'Shipping',       desc:'Rates & carriers'},
      {id:'reports',   icon:'chart',    label:'Reports',        desc:'Analytics & exports'},
      {id:'cyclecounts',icon:'pkg',     label:'Cycle Counts',   desc:'Inventory audits'},
    ].map(t=>`
      <div onclick="showPage('${t.id}')"
        style="background:var(--surface);border:1px solid var(--border);border-radius:10px;
               padding:14px;cursor:pointer;transition:all 0.15s"
        onmouseover="this.style.borderColor='var(--red)'"
        onmouseout="this.style.borderColor='var(--border)'">
        <div style="font-size:20px;margin-bottom:6px">${ico(t.icon,18)}</div>
        <div style="font-weight:700;font-size:13px">${t.label}</div>
        <div style="font-size:11px;color:var(--ink3);margin-top:2px">${t.desc}</div>
      </div>
    `).join('')}
  </div>

  <div style="border-top:2px solid var(--border);padding-top:20px;margin-bottom:12px">
    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--ink3);margin-bottom:12px">Team & Access</div>
  </div>

  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">
    <div>
      <div style="font-weight:700;font-size:15px">User Management</div>
      <div style="font-size:12px;color:var(--ink3)">Invite employees and customers · manage roles</div>
    </div>
    <button class="btn btn-red" onclick="openInviteUser()">+ Invite User</button>
  </div>

  <!-- Stats -->
  <div class="stats" id="userStats">
    <div class="stat"><div class="stat-lbl">Total Users</div><div class="stat-val" id="uStatTotal">—</div></div>
    <div class="stat"><div class="stat-lbl">Admins</div><div class="stat-val" id="uStatAdmin">—</div></div>
    <div class="stat"><div class="stat-lbl">Employees</div><div class="stat-val" id="uStatEmp">—</div></div>
    <div class="stat"><div class="stat-lbl">Customers</div><div class="stat-val" id="uStatCust">—</div></div>
  </div>

  <!-- Filters -->
  <div class="card" style="padding:14px 18px;margin-bottom:16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center">
    <input type="text" id="userSearch" placeholder="Search name or email…"
      oninput="renderUsersTable(_allUsers)"
      style="flex:1;min-width:180px;padding:8px 12px;border:1px solid var(--border);border-radius:7px;font-family:Barlow,sans-serif;font-size:13px"/>
    <select id="userRoleFilter" onchange="renderUsersTable(_allUsers)"
      style="padding:8px 12px;border:1px solid var(--border);border-radius:7px;font-family:Barlow,sans-serif;font-size:13px">
      <option value="all">All Roles</option>
      <option value="admin">Admin</option>
      <option value="employee">Employee</option>
      <option value="customer">Customer</option>
    </select>
    <button class="btn" onclick="pgAdminLoad()">↻ Refresh</button>
  </div>

  <!-- Users Table -->
  <div class="card" style="padding:0">
    <div id="usersTableWrap"></div>
  </div>

  <!-- Invite User Modal -->
  <div class="modal-bg" id="inviteUserModal" role="dialog" aria-modal="true" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal" style="max-width:480px;width:95vw">
      <div class="modal-head">
        <span class="modal-title">Invite New User</span>
        <button class="modal-close" onclick="document.getElementById('inviteUserModal').style.display='none'">×</button>
      </div>
      <div class="modal-body">
        <div style="background:var(--blue-bg);border:1px solid var(--blue);border-radius:8px;padding:10px 14px;font-size:12px;margin-bottom:16px">
          📧 They'll receive an email with a link to set their password and access the portal.
        </div>
        <div class="fg2">
          <div class="field"><label>Full Name</label><input type="text" id="inv_name" placeholder="e.g. Jose Martinez"/></div>
          <div class="field"><label>Email Address</label><input type="email" id="inv_email" placeholder="jose@example.com"/></div>
          <div class="field"><label>Role</label>
            <select id="inv_role" onchange="toggleInvCustField()">
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <div class="field" id="inv_cust_wrap" style="display:none"><label>Customer Account</label>
            <select id="inv_cust">
              ${(CUSTOMERS||[]).map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="inviteErr" style="display:none;margin-top:12px;background:var(--red-light);border:1px solid var(--red);border-radius:7px;padding:10px;font-size:12px;color:var(--red)"></div>
        <div id="inviteSuccess" style="display:none;margin-top:12px;background:var(--green-bg);border:1px solid var(--green);border-radius:7px;padding:10px;font-size:12px;color:var(--green)"></div>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="document.getElementById('inviteUserModal').style.display='none'">Cancel</button>
        <button class="btn btn-red" id="inviteBtn" onclick="sendInvite()">Send Invite →</button>
      </div>
    </div>
  </div>

  <!-- Edit User Modal -->
  <div class="modal-bg" id="editUserModal" role="dialog" aria-modal="true" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal" style="max-width:480px;width:95vw">
      <div class="modal-head">
        <span class="modal-title">Edit User</span>
        <button class="modal-close" onclick="document.getElementById('editUserModal').style.display='none'">×</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="edit_uid"/>
        <div class="fg2">
          <div class="field"><label>Full Name</label><input type="text" id="edit_name" placeholder="Full name"/></div>
          <div class="field"><label>Email</label><input type="email" id="edit_email" placeholder="email@example.com"/></div>
          <div class="field"><label>Role</label>
            <select id="edit_role" onchange="toggleEditCustField()">
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <div class="field" id="edit_cust_wrap"><label>Customer Account</label>
            <select id="edit_cust">
              <option value="">— None —</option>
              ${(CUSTOMERS||[]).map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="editErr" style="display:none;margin-top:12px;background:var(--red-light);border:1px solid var(--red);border-radius:7px;padding:10px;font-size:12px;color:var(--red)"></div>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="document.getElementById('editUserModal').style.display='none'">Cancel</button>
        <button class="btn btn-red" onclick="saveEditUser()">Save Changes</button>
      </div>
    </div>
  </div>
  `;
}

function toggleInvCustField(){
  const role = document.getElementById('inv_role')?.value;
  document.getElementById('inv_cust_wrap').style.display = role==='customer'?'block':'none';
}
function toggleEditCustField(){
  const role = document.getElementById('edit_role')?.value;
  document.getElementById('edit_cust_wrap').style.display = role==='customer'?'block':'none';
}

function openInviteUser(){
  document.getElementById('inviteUserModal').style.display='flex';
  document.getElementById('inviteErr').style.display='none';
  document.getElementById('inviteSuccess').style.display='none';
  document.getElementById('inv_name').value='';
  document.getElementById('inv_email').value='';
  document.getElementById('inv_role').value='employee';
  document.getElementById('inv_cust_wrap').style.display='none';
}

async function sendInvite(){
  const name  = document.getElementById('inv_name')?.value?.trim();
  const email = document.getElementById('inv_email')?.value?.trim();
  const role  = document.getElementById('inv_role')?.value;
  const custId= document.getElementById('inv_cust')?.value||null;
  const btn   = document.getElementById('inviteBtn');
  const errEl = document.getElementById('inviteErr');
  const okEl  = document.getElementById('inviteSuccess');

  errEl.style.display='none'; okEl.style.display='none';
  if(!email){errEl.textContent='Email is required.';errEl.style.display='block';return;}

  btn.textContent='Sending…'; btn.disabled=true;

  // Create user in Supabase Auth
  const {data, error} = await sb.auth.admin?.inviteUserByEmail
    ? await sb.auth.admin.inviteUserByEmail(email)
    : {data:null, error:{message:'Admin API not available from client — use Supabase dashboard to invite'}};

  // Fallback: create profile record and let them use password reset to set password
  if(error){
    // Try creating via signUp with a temp password and immediately send reset
    const tempPass = Math.random().toString(36).slice(2,10)+'A1!';
    const {data:signUpData, error:signUpErr} = await sb.auth.signUp({email, password:tempPass, options:{data:{full_name:name}}});

    if(signUpErr){
      btn.textContent='Send Invite →'; btn.disabled=false;
      errEl.textContent=signUpErr.message; errEl.style.display='block';
      return;
    }

    // Insert profile
    if(signUpData?.user){
      await sb.from('profiles').insert({
        id: signUpData.user.id,
        email, full_name:name, role,
        customer_id: role==='customer'?custId:null,
        active:true, invited_at: new Date().toISOString()
      });

      // Send password reset so they can set their own password
      await sb.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://mendyshiply.github.io/shiplyco-portal'
      });
    }

    btn.textContent='Send Invite →'; btn.disabled=false;
    okEl.textContent=`✓ Invite sent to ${email} — they'll receive an email to set their password.`;
    okEl.style.display='block';
    setTimeout(()=>{ document.getElementById('inviteUserModal').style.display='none'; pgAdminLoad(); }, 2500);
    return;
  }

  btn.textContent='Send Invite →'; btn.disabled=false;
  okEl.textContent=`✓ Invite sent to ${email}`;
  okEl.style.display='block';
  setTimeout(()=>{ document.getElementById('inviteUserModal').style.display='none'; pgAdminLoad(); }, 2500);
}

function openEditUser(uid){
  const user = _allUsers.find(u=>u.id===uid);
  if(!user) return;
  document.getElementById('edit_uid').value = uid;
  document.getElementById('edit_name').value = user.full_name||'';
  document.getElementById('edit_email').value = user.email||'';
  document.getElementById('edit_role').value = user.role||'employee';
  document.getElementById('edit_cust').value = user.customer_id||'';
  document.getElementById('edit_cust_wrap').style.display = user.role==='customer'?'block':'none';
  document.getElementById('editErr').style.display='none';
  document.getElementById('editUserModal').style.display='flex';
}

async function saveEditUser(){
  const uid  = document.getElementById('edit_uid')?.value;
  const name = document.getElementById('edit_name')?.value?.trim();
  const role = document.getElementById('edit_role')?.value;
  const custId = document.getElementById('edit_cust')?.value||null;
  const errEl = document.getElementById('editErr');
  errEl.style.display='none';

  const {error} = await sb.from('profiles').update({
    full_name:name, role,
    customer_id: role==='customer'?custId:null,
    updated_at: new Date().toISOString()
  }).eq('id',uid);

  if(error){errEl.textContent=error.message;errEl.style.display='block';return;}
  document.getElementById('editUserModal').style.display='none';
  showToast('✓ User updated');
  pgAdminLoad();
}

async function resetUserPassword(email){
  const {error} = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://mendyshiply.github.io/shiplyco-portal'
  });
  if(error){showToast('⚠ '+error.message);return;}
  showToast(`✓ Password reset email sent to ${email}`);
}

async function toggleUserActive(uid, currentlyActive){
  const {error} = await sb.from('profiles').update({active:!currentlyActive}).eq('id',uid);
  if(error){showToast('⚠ '+error.message);return;}
  showToast(currentlyActive?'User deactivated':'User activated');
  pgAdminLoad();
}

function pgDash(){
  const tu=PALLETS.reduce((s,p)=>s+p.items.reduce((a,i)=>a+i.units,0),0);
  const openInv=INVOICES.find(i=>i.status==='due');
  const openAmt=openInv?openInv.lines.reduce((s,l)=>s+l.amt,0):0;
  return `
  <div class="pg-head"><div class="pg-title">Dashboard</div><div class="pg-sub" id="dashSub">Inventory &amp; billing snapshot</div></div>
  <div class="stats">
    <div class="stat"><div class="stat-lbl">Total Pallets</div><div class="stat-val">${PALLETS.length}</div><span class="tag tb">Across ${TRUCKS.length} trucks</span></div>
    <div class="stat"><div class="stat-lbl">Total Units</div><div class="stat-val">${tu.toLocaleString()}</div><span class="tag tg"><span class="dot" style="background:var(--green)"></span>In warehouse</span></div>
    <div class="stat"><div class="stat-lbl">Containers Shipped</div><div class="stat-val">${CONTAINERS.length}</div></div>
    <div class="stat"><div class="stat-lbl">Balance Due</div><div class="stat-val" style="color:var(--red)">${fmt(openAmt)}</div><span class="tag tr" style="cursor:pointer" onclick="showPage('invoices')">View Invoice →</span></div>
  </div>
  <div class="two-col">
    <div>
      <div class="card">
        <div class="card-head"><span class="card-title">Recent Trucks</span><button class="btn" onclick="showPage('trucks')">View All</button></div>
        <table><thead><tr><th>Truck</th><th>Origin</th><th>Date</th><th>Pallets</th><th>Units</th></tr></thead>
        <tbody>${TRUCKS.map(t=>`<tr>
          <td><strong>${t.name}</strong></td>
          <td><span class="${t.origin==='TX'?'orig-tx':'orig-ar'}">${t.origin}</span></td>
          <td style="font-size:12px;color:var(--ink3)">${t.date}</td>
          <td>${t.pallets}</td>
          <td>${t.units.toLocaleString()}</td>
        </tr>`).join('')}</tbody></table>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">Recent Containers</span><button class="btn" onclick="showPage('containers')">View All</button></div>
        <table><thead><tr><th>Container</th><th>Date</th><th>Pallets</th><th>Status</th></tr></thead>
        <tbody>${CONTAINERS.slice(-4).reverse().map(c=>`<tr>
          <td><strong>${c.id}</strong></td>
          <td style="font-size:12px">${c.date}</td>
          <td>${c.pallets}</td>
          <td><span class="tag ${c.status==='Delivered'?'tg':'to'}">${c.status}</span></td>
        </tr>`).join('')}</tbody></table>
      </div>
    </div>
    <div>
      ${openInv?`<div class="card" style="border-color:var(--red)">
        <div class="card-head" style="background:var(--red-light)"><span class="card-title" style="color:var(--red)">Invoice Due</span><button class="btn btn-red" onclick="showInv('${openInv.id}')">View Invoice</button></div>
        <div style="padding:16px 18px">
          <div style="font-size:22px;font-weight:800;margin-bottom:4px">${fmt(openAmt)}</div>
          <div style="font-size:12px;color:var(--ink3)">${openInv.period} · Due ${openInv.due}</div>
          <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px">
            ${openInv.lines.slice(0,4).map(l=>`<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0"><span>${l.desc}</span><strong>${fmt(l.amt)}</strong></div>`).join('')}
            ${openInv.lines.length>4?`<div style="font-size:11px;color:var(--ink3);margin-top:4px">+ ${openInv.lines.length-4} more items</div>`:''}
          </div>
        </div>
      </div>`:''}
      <div class="card">
        <div class="card-head"><span class="card-title">Top Items</span></div>
        ${UPCS.sort((a,b)=>b.units-a.units).slice(0,6).map(u=>{
          const pct=Math.round(u.units/2304*100);
          return `<div style="padding:10px 16px;border-bottom:1px solid var(--border)">
            <div style="font-size:12px;font-weight:600;margin-bottom:5px">${u.desc}</div>
            <div class="qb-wrap"><span class="qb-n">${u.units.toLocaleString()}</span><div class="qb"><div class="qb-fill" style="width:${pct}%"></div></div></div>
          </div>`;}).join('')}
      </div>
    </div>
  </div>`;
}

function pgTrucks(){
  if(!_trucksLoaded){
    loadTrucksFromSB().then(()=>showPage('trucks'));
    return `<div style="padding:40px;text-align:center;color:var(--ink3)">Loading trucks…</div>`;
  }
  return `
  <div class="pg-head"><div class="pg-title">Truck Manifest</div><div class="pg-sub">All inbound trucks — browse by truck, pallet, location & item</div></div>
  <div class="tbar">
    <div class="sw">${ico('search')}<input class="si" placeholder="Search SKU, UPC, description…" oninput="fTrucks(this.value)"/></div>
    <button class="btn on" onclick="fOrig('all',this)">All</button>
    <button class="btn" onclick="fOrig('TX',this)">🟠 Texas</button>
    <button class="btn" onclick="fOrig('AR',this)">🔵 Arkansas</button>
  </div>
  <div id="tWrap" style="padding:16px 0">
    ${TRUCKS.map(t=>{
      const plts=PALLETS.filter(p=>p.truck===t.id);
      const tu=plts.reduce((s,p)=>s+p.items.reduce((a,i)=>a+i.units,0),0);
      return `<div class="tg" data-origin="${t.origin}">
        <div class="tg-head">
          <div><div class="tg-name">${t.name}</div><div class="tg-meta">${t.date} · ${plts.length} pallets · ${tu.toLocaleString()} units${t.bol?' · 📎 '+t.bol:''}</div></div>
          <span class="${t.origin==='TX'?'orig-tx':'orig-ar'}">${t.origin}</span>
        </div>
        <div class="tg-body">
          ${plts.map(p=>`
          <div class="plt">
            <div class="plt-head" onclick="tgl(this)">
              <span class="plt-num">PALLET ${p.num}</span>
              <span class="plt-loc">📍 ${p.loc}</span>
              <span style="font-size:12px;color:var(--ink2)">${p.items.length} item${p.items.length>1?'s':''}</span>
              <span class="plt-cnt">${p.items.reduce((s,i)=>s+i.units,0).toLocaleString()} units</span>
              <svg class="plt-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div class="plt-body">
              <table><thead><tr><th>UPC</th><th>SKU / Item #</th><th>Description</th><th>Color</th><th>Size</th><th>Cases</th><th>Casepack</th><th>Units</th><th>Notes</th></tr></thead>
              <tbody>${p.items.map(i=>`<tr>
                <td class="mono">${i.upc||'—'}</td>
                <td class="mono">${i.sku||'—'}</td>
                <td style="max-width:220px"><div style="font-weight:600;font-size:12px;line-height:1.3">${i.desc}</div></td>
                <td style="font-size:12px;color:var(--ink2)">${i.color||'—'}</td>
                <td style="font-size:12px;color:var(--ink2)">${i.size||'—'}</td>
                <td style="font-weight:700">${i.cases}</td>
                <td style="color:var(--ink3)">${i.cp}</td>
                <td><span class="tag tb">${i.units.toLocaleString()}</span></td>
                <td style="font-size:11px;color:var(--red)">${i.notes||''}</td>
              </tr>`).join('')}</tbody></table>
            </div>
          </div>`).join('')}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}
function tgl(el){el.nextElementSibling.classList.toggle('open');el.querySelector('.plt-chev').classList.toggle('open')}
function fOrig(o,btn){document.querySelectorAll('.tbar .btn').forEach(b=>b.classList.remove('on'));btn.classList.add('on');document.querySelectorAll('.tg').forEach(g=>{g.style.display=(o==='all'||g.dataset.origin===o)?'':'none'})}
function fTrucks(q){q=q.toLowerCase();document.querySelectorAll('.tg').forEach(g=>{g.style.display=g.textContent.toLowerCase().includes(q)?'':'none'})}

function pgUPC(){
  const mx=Math.max(...UPCS.map(u=>u.units));
  return `
  <div class="pg-head"><div class="pg-title">UPC Consolidation</div><div class="pg-sub">All items rolled up across all trucks and dates</div></div>
  <div class="card">
    <div class="card-head"><span class="card-title">${UPCS.length} Unique Items · ${UPCS.reduce((s,u)=>s+u.units,0).toLocaleString()} Total Units</span><button class="btn">Export CSV</button></div>
    <div class="tbar"><div class="sw">${ico('search')}<input class="si" placeholder="Search UPC, SKU, description…" oninput="fUPC(this.value)"/></div></div>
    <div style="overflow-x:auto">
    <table id="upcT">
      <thead><tr><th>UPC</th><th>SKU / Item #</th><th>Description</th><th>Color / Size</th><th>Total Units</th><th>Trucks</th><th>Pallets</th></tr></thead>
      <tbody>${UPCS.sort((a,b)=>b.units-a.units).map(u=>{
        const pct=Math.round(u.units/mx*100);
        return `<tr>
          <td class="mono">${u.upc||'—'}</td>
          <td class="mono">${u.sku||'—'}</td>
          <td><div style="font-weight:600;font-size:12px;line-height:1.3;max-width:240px">${u.desc}</div></td>
          <td style="font-size:12px;color:var(--ink2)">${u.color||'—'}</td>
          <td><div class="qb-wrap"><span class="qb-n">${u.units.toLocaleString()}</span><div class="qb"><div class="qb-fill" style="width:${pct}%"></div></div></div></td>
          <td>${u.trucks.map(t=>`<span class="tag tb" style="font-size:10px;margin-right:3px">${TRUCKS.find(x=>x.id===t)?.name||t}</span>`).join('')}</td>
          <td style="font-weight:700">${u.pallets}</td>
        </tr>`;}).join('')}
      </tbody>
    </table></div>
    <div class="tfoot"><span>${UPCS.length} items</span></div>
  </div>`;
}
function fUPC(q){q=q.toLowerCase();document.querySelectorAll('#upcT tbody tr').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(q)?'':'none'})}

function pgCont(){
  return `
  <div class="pg-head"><div class="pg-title">Outbound Containers</div><div class="pg-sub">Every container picked up — what went out, when, and how many pallets</div></div>
  <div class="stats" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat"><div class="stat-lbl">Total Containers</div><div class="stat-val">${CONTAINERS.length}</div><span class="tag tb">All time</span></div>
    <div class="stat"><div class="stat-lbl">Pallets Shipped</div><div class="stat-val">${CONTAINERS.reduce((s,c)=>s+c.pallets,0)}</div><span class="tag tg">Shipped out</span></div>
    <div class="stat"><div class="stat-lbl">In Transit</div><div class="stat-val">${CONTAINERS.filter(c=>c.status!=="Delivered").length}</div></div>
  </div>
  ${CONTAINERS.map(c=>`
  <div class="cnt-card">
    <div class="cnt-top">
      <div><div class="cnt-id">${c.id}</div><div class="cnt-date">Picked up · ${c.date}</div></div>
      <span class="tag ${c.status==='Delivered'?'tg':'to'}">${c.status==='Delivered'?'✓ Delivered':'⚡ In Transit'}</span>
    </div>
    <div class="cnt-body">
      <div><div class="cs-lbl">Pallets</div><div class="cs-val">${c.pallets}</div></div>
      <div><div class="cs-lbl">Units</div><div class="cs-val">${c.units.toLocaleString()}</div></div>
      <div><div class="cs-lbl">Origin</div><div class="cs-val" style="font-size:13px"><span class="${c.origin.includes('TX')?'orig-tx':'orig-ar'}">${c.origin}</span></div></div>
    </div>
    <div class="cnt-items"><strong>Contents:</strong> ${c.items}</div>
  </div>`).join('')}`;
}

function pgDocs(){
  const emojis={bol:'📄',receipt:'🧾',photo:'📸'};
  return `
  <div class="pg-head"><div class="pg-title">Docs & Media</div><div class="pg-sub">BOLs, receipts, product and pallet photos</div></div>
  <div class="card">
    <div class="card-head">
      <span class="card-title">All Files (${DOCS.length})</span>
      <div style="display:flex;gap:6px">
        <button class="btn on" onclick="fDocs('all',this)">All</button>
        <button class="btn" onclick="fDocs('bol',this)">BOLs</button>
        <button class="btn" onclick="fDocs('receipt',this)">Receipts</button>
        <button class="btn" onclick="fDocs('photo',this)">Photos</button>
      </div>
    </div>
    <div class="doc-grid" id="docG">
      ${DOCS.map(d=>`
      <div class="doc-card" data-type="${d.type}" onclick="alert('Opening: ${d.name}')">
        <div class="doc-thumb">${emojis[d.type]||'📁'}</div>
        <div class="doc-info">
          <div class="doc-name">${d.name}</div>
          <div class="doc-meta">${d.ref} · ${d.date}</div>
          <span class="doc-badge db-${d.type}">${d.type.toUpperCase()}</span>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
}
function fDocs(t,btn){document.querySelectorAll('.card-head .btn').forEach(b=>b.classList.remove('on'));btn.classList.add('on');document.querySelectorAll('.doc-card').forEach(c=>{c.style.display=(t==='all'||c.dataset.type===t)?'':'none'})}

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

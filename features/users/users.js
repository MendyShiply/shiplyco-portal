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

  if(role==='customer' && !custId){errEl.textContent='Pick which customer this user belongs to.';errEl.style.display='block';return;}

  btn.textContent='Sending…'; btn.disabled=true;

  // Runs server side (supabase/functions/invite-user): checks the caller is an
  // admin, sends the invite email and creates the profile.
  const {data, error} = await sb.functions.invoke('invite-user', {
    body:{email, full_name:name, role, customer_id: role==='customer'?custId:null}
  });
  btn.textContent='Send Invite →'; btn.disabled=false;

  if(error || !data?.ok){
    let msg = data?.error;
    if(!msg && error?.context?.json){ try{ msg=(await error.context.json()).error; }catch(_){} }
    errEl.textContent = msg || error?.message || 'Could not send the invite.';
    errEl.style.display='block';
    return;
  }

  okEl.textContent=`✓ Invite sent to ${email}. They'll get an email to set their password.`;
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

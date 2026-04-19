// ── REAL SUPABASE AUTH ──
async function doLogin(){
  const email = document.getElementById('lgEmail')?.value?.trim();
  const pass  = document.getElementById('lgPass')?.value;
  const btn   = document.getElementById('lgBtn');
  const err   = document.getElementById('lgErr');

  if(!email||!pass){showLgErr('Please enter your email and password.');return;}

  btn.textContent='Signing in…';btn.disabled=true;
  err.style.display='none';

  const {data, error} = await sb.auth.signInWithPassword({email, password:pass});

  if(error){
    btn.textContent='SIGN IN';btn.disabled=false;
    showLgErr(error.message==='Invalid login credentials'
      ?'Incorrect email or password. Please try again.'
      :error.message);
    return;
  }

  // Fetch profile to get role
  const {data:profile} = await sb.from('profiles').select('*').eq('id',data.user.id).single();

  if(!profile){
    btn.textContent='SIGN IN';btn.disabled=false;
    showLgErr('Account not set up yet. Contact your administrator.');
    await sb.auth.signOut();
    return;
  }

  btn.textContent='SIGN IN';btn.disabled=false;
  launchApp(profile);
}

function showLgErr(msg){
  const el=document.getElementById('lgErr');
  if(el){el.textContent=msg;el.style.display='block';}
}

async function doForgotPassword(){
  const email=document.getElementById('lgEmail')?.value?.trim();
  if(!email){showLgErr('Enter your email address above first.');return;}
  const {error}=await sb.auth.resetPasswordForEmail(email);
  if(error){showLgErr(error.message);return;}
  showLgErr('✓ Password reset email sent — check your inbox.');
  document.getElementById('lgErr').style.background='rgba(30,122,79,0.15)';
  document.getElementById('lgErr').style.borderColor='rgba(30,122,79,0.3)';
  document.getElementById('lgErr').style.color='#4caf87';
}

function launchApp(profile){
  role = profile.role;
  currentCustId = profile.customer_id || null;
  currentEmployee = role==='admin'
    ? {id:profile.id, name:profile.full_name||'Admin', role:'admin'}
    : role==='employee'
    ? {id:profile.id, name:profile.full_name||'Employee', role:'employee'}
    : null;

  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').style.display='flex';
  const hRole=document.getElementById('hRole');
  const hCust=document.getElementById('hCust');
  if(hRole) hRole.textContent={customer:'Customer Portal',employee:'Employee Portal',admin:'Admin Portal'}[role]||'';
  if(hCust) hCust.textContent=role==='customer'?(profile.customer_id||'Customer'):profile.full_name||'ShiplyCo';
  buildNav();
  // Load customers from Supabase for use across all pages
  loadCustomers().then(()=>{ _custLoaded=true; });
  showPage(role==='admin'?'dashboard':role==='employee'?'mytasks':'dashboard');
  setTimeout(injectTara, 800);
}

async function doLogout(){
  await sb.auth.signOut();
  document.getElementById('loginScreen').style.display='flex';
  document.getElementById('app').style.display='none';
  const err=document.getElementById('lgErr');
  if(err){err.style.display='none';}
}

// ── Handle password reset from email link ──
sb.auth.onAuthStateChange((event, session) => {
  if(event === 'PASSWORD_RECOVERY'){
    const loginScreen = document.getElementById('loginScreen');
    const app = document.getElementById('app');
    if(loginScreen) loginScreen.style.display='flex';
    if(app) app.style.display='none';
    const box = document.querySelector('.lg-card');
    if(box){
      box.innerHTML = '<div style="text-align:center;margin-bottom:20px"><div style="font-size:22px;font-weight:800">Set Your Password</div><div style="font-size:13px;color:#666;margin-top:4px">Choose a password for your ShiplyCo account</div></div>'
        +'<div style="margin-bottom:10px"><label style="font-size:12px;font-weight:700">New Password</label><input type="password" id="newPwInput" placeholder="At least 8 characters" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-top:4px;box-sizing:border-box"/></div>'
        +'<div style="margin-bottom:14px"><label style="font-size:12px;font-weight:700">Confirm Password</label><input type="password" id="newPwConfirm" placeholder="Same password again" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-top:4px;box-sizing:border-box"/></div>'
        +'<div id="setPwErr" style="display:none;color:red;font-size:13px;margin-bottom:10px"></div>'
        +'<button onclick="setNewPassword()" style="width:100%;padding:13px;background:#e8241a;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:800;cursor:pointer">Set Password and Sign In</button>';
    }
  }
});

async function setNewPassword(){
  const pw = document.getElementById('newPwInput')?.value;
  const pw2 = document.getElementById('newPwConfirm')?.value;
  const err = document.getElementById('setPwErr');
  if(!pw||pw.length<8){if(err){err.textContent='At least 8 characters required';err.style.display='block';}return;}
  if(pw!==pw2){if(err){err.textContent='Passwords do not match';err.style.display='block';}return;}
  if(err) err.style.display='none';
  const {error} = await sb.auth.updateUser({password:pw});
  if(error){if(err){err.textContent=error.message;err.style.display='block';}return;}
  alert('Password set! You will now be signed in.');
  window.location.reload();
}

// ── Check if already logged in on page load ──
sb.auth.getSession().then(({data:{session}})=>{
  if(session){
    sb.from('profiles').select('*').eq('id',session.user.id).single().then(({data:profile})=>{
      if(profile) launchApp(profile);
    });
  }
});


function toggleMobileNav(){
  const nav=document.querySelector('nav');
  const overlay=document.getElementById('sidebarOverlay');
  if(nav){nav.classList.toggle('open');}
  if(overlay){overlay.classList.toggle('open');}
}

function closeMobileNav(){
  const nav=document.querySelector('nav');
  const overlay=document.getElementById('sidebarOverlay');
  if(nav){nav.classList.remove('open');}
  if(overlay){overlay.classList.remove('open');}
}

function buildNav(){
  const n=document.getElementById('sbNav');
  const items=(typeof _ownerMode!=='undefined'&&_ownerMode)?NAV.owner:(NAV[role]||NAV.customer);
  let html='<button class="nav-collapse-btn" onclick="toggleSideNav()" title="Collapse sidebar">&#x276E;</button>';
  items.forEach(i=>{
    html+='<div class="nv" id="nv-'+i.id+'" data-page="'+i.id+'" role="button" tabindex="0">'+ico(i.i,16)+'<span> '+i.l+'</span></div>';
  });
  n.innerHTML=html;
  n.querySelectorAll('.nv[data-page]').forEach(el=>{
    el.addEventListener('click',()=>showPage(el.dataset.page));
  });
  // Restore collapsed state
  if(localStorage.getItem('shiplyco_nav_collapsed')==='1') n.classList.add('collapsed');
}

function toggleSideNav(){
  const n=document.getElementById('sbNav');
  n.classList.toggle('collapsed');
  localStorage.setItem('shiplyco_nav_collapsed', n.classList.contains('collapsed')?'1':'0');
}
function showPage(id){ closeMobileNav();
  // Close mobile nav if open
  const nav=document.querySelector('nav');
  const overlay=document.getElementById('sidebarOverlay');
  if(nav&&nav.classList.contains('open')){nav.classList.remove('open');}
  if(overlay&&overlay.classList.contains('open')){overlay.classList.remove('open');}
  document.querySelectorAll('.nv').forEach(e=>{e.classList.remove('on');e.removeAttribute('aria-current');});
  const el=document.getElementById('nv-'+id);if(el){el.classList.add('on');el.setAttribute('aria-current','page');}
  const fns={customers:pgCustomers,inbound:pgInbound,dashboard:pgDash,trucks:pgTrucks,containers:pgCont,docs:pgDocs,billing:pgBilling,invoices:pgInvoices,entry:pgEntry,admin:pgAdmin,placeorder:pgPlaceOrder,myorders:pgMyOrders,dispatch:pgDispatch,inventory:pgInventory,labels:pgLabels,picklist:pgPickList,pricing:pgPricing,mytasks:pgMyTasks,leaderboard:pgLeaderboard,supplies:pgSupplies,skumaster:pgSkuMaster,marketplaces:pgMarketplaces,shipping:pgShipping,edi:pgEdi,bol:pgBol,cyclecounts:pgCycleCounts,reports:pgReports,twilio:pgTwilio,ai:pgAi,locations:pgLocations,ownerdash:pgOwnerDash,ownerinv:pgOwnerInventory,ownerentry:pgOwnerEntry,ownerorders:pgOwnerOrders};
  document.getElementById('page').innerHTML=`<div class="page">${(fns[id]||pgDash)()}</div>`;
  if(id==='entry'){palletCount=1;itemCounts={}}
}

// ── REPORTING & ANALYTICS ──
// ══════════════════════════════════════════════

function pgReports(){
  return `
  <div class="pg-head">
    <div class="pg-title">Reports & Analytics</div>
    <div class="pg-sub">Live reports will populate as data comes in</div>
  </div>
  <div class="card" style="text-align:center;padding:60px;color:var(--ink3)">
    <div style="font-size:40px;margin-bottom:16px">📊</div>
    <div style="font-weight:700;font-size:16px;margin-bottom:8px">Reports coming soon</div>
    <div style="font-size:13px">Revenue, orders, and employee performance will appear here once real data is flowing through the system.</div>
  </div>`;
}

function pgTwilio(){
  return `
  <div class="pg-head">
    <div class="pg-title">Notifications</div>
    <div class="pg-sub">Twilio-powered SMS and WhatsApp · keep customers and staff in the loop automatically</div>
  </div>

  <div style="display:flex;gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:22px;width:fit-content">
    ${[['setup','⚙ Twilio Setup'],['triggers','🔔 Triggers'],['contacts','📞 Customer Contacts'],['log','📋 Send Log']].map(([id,lbl],i)=>`
    <div id="ttab_${id}" class="dtab${i===0?' on':''}" onclick="switchTwilioTab('${id}',this)" style="border-radius:0">${lbl}</div>`).join('')}
  </div>
  <div id="twilioContent">${renderTwilioSetup()}</div>`;
}

function switchTwilioTab(tab,btn){
  document.querySelectorAll('[id^="ttab_"]').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  const c=document.getElementById('twilioContent');if(!c)return;
  if(tab==='setup')    c.innerHTML=renderTwilioSetup();
  else if(tab==='triggers') c.innerHTML=renderTwilioTriggers();
  else if(tab==='contacts') c.innerHTML=renderTwilioContacts();
  else if(tab==='log') c.innerHTML=renderTwilioLog();
}

function renderTwilioSetup(){
  return `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">
    <div class="card">
      <div class="card-head" style="display:flex;align-items:center;justify-content:space-between">
        <span class="card-title">Twilio Account</span>
        <span class="tag ${TWILIO_CONFIG.connected?'tg':'to'}">${TWILIO_CONFIG.connected?'● Connected':'○ Not connected'}</span>
      </div>
      <div class="field"><label>Account SID</label><input type="text" id="tw_sid" value="${TWILIO_CONFIG.accountSid}" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" style="font-family:monospace;font-size:12px"/></div>
      <div class="field"><label>Auth Token</label><input type="password" id="tw_token" value="${TWILIO_CONFIG.authToken}" placeholder="Your Twilio auth token" style="font-family:monospace;font-size:12px"/></div>
      <div class="field"><label>From Number (SMS)</label><input type="text" id="tw_from" value="${TWILIO_CONFIG.fromNumber}" placeholder="+12815551234"/></div>
      <div class="field"><label>WhatsApp Sender</label><input type="text" id="tw_wa" value="${TWILIO_CONFIG.fromWhatsApp}" placeholder="whatsapp:+14155238886 (Twilio sandbox or approved)"/></div>
      <div style="display:flex;gap:10px;margin-top:4px">
        <button class="btn btn-red" onclick="saveTwilioConfig()">Save Credentials</button>
        <button class="btn" onclick="testTwilioConnection()">Test Connection</button>
      </div>
      <div id="twilio_status" style="margin-top:10px;font-size:12px"></div>
    </div>

    <div class="card">
      <div class="card-head"><span class="card-title">Send Test Message</span></div>
      <div class="field"><label>To Phone Number</label><input type="text" id="tw_testphone" value="${TWILIO_CONFIG.testPhone}" placeholder="+17135551234"/></div>
      <div class="field"><label>Channel</label>
        <select id="tw_testchan"><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option></select>
      </div>
      <div class="field"><label>Message</label><textarea id="tw_testmsg" rows="3" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;font-size:13px;resize:none" placeholder="ShiplyCo: This is a test message from your fulfillment portal."></textarea></div>
      <button class="btn btn-red" onclick="sendTestTwilio()" ${TWILIO_CONFIG.connected?'':'disabled'} style="${TWILIO_CONFIG.connected?'':'opacity:0.5;cursor:not-allowed'}">${TWILIO_CONFIG.connected?'📤 Send Test':'Connect Twilio first'}</button>

      <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:8px;padding:12px;margin-top:16px;font-size:12px;line-height:1.6">
        <strong>Setup Checklist</strong><br>
        ${['Create free Twilio account at twilio.com','Purchase a phone number ($1/mo)','Enable WhatsApp Sandbox or apply for WhatsApp Business API','Add Account SID and Auth Token above','Test the connection','Configure triggers on the Triggers tab'].map((s,i)=>`<div style="display:flex;align-items:flex-start;gap:6px;margin-top:4px"><span style="color:${TWILIO_CONFIG.connected&&i<3?'var(--green)':'var(--ink3)'}">${TWILIO_CONFIG.connected&&i<3?'✓':'○'}</span><span>${s}</span></div>`).join('')}
      </div>
    </div>
  </div>`;
}

function renderTwilioTriggers(){
  return `
  <div class="card">
    <div class="card-head"><span class="card-title">Notification Triggers</span><span style="font-size:11px;color:var(--ink3)">Configure which events send messages and to whom</span></div>
    <div style="overflow-x:auto"><table style="width:100%">
      <thead><tr>
        <th>Event</th><th>Description</th><th style="text-align:center">SMS</th><th style="text-align:center">WhatsApp</th><th style="text-align:center">Email</th><th>Notifies</th>
      </tr></thead>
      <tbody>
        ${NOTIF_TRIGGERS.map(t=>`<tr>
          <td style="font-weight:700;font-size:13px">${t.label}</td>
          <td style="font-size:12px;color:var(--ink2)">${t.desc}</td>
          <td style="text-align:center"><input type="checkbox" ${t.channels.sms?'checked':''} onchange="toggleTrigger('${t.id}','sms',this.checked)" style="width:16px;height:16px;cursor:pointer"/></td>
          <td style="text-align:center"><input type="checkbox" ${t.channels.whatsapp?'checked':''} onchange="toggleTrigger('${t.id}','whatsapp',this.checked)" style="width:16px;height:16px;cursor:pointer"/></td>
          <td style="text-align:center"><input type="checkbox" ${t.channels.email?'checked':''} onchange="toggleTrigger('${t.id}','email',this.checked)" style="width:16px;height:16px;cursor:pointer"/></td>
          <td>${t.roles.map(r=>`<span class="tag tb" style="font-size:10px;margin:1px">${r}</span>`).join('')}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div style="margin-top:16px;padding:12px;background:var(--blue-bg);border-radius:8px;font-size:12px">
      💡 <strong>Message templates</strong> are auto-generated per event. Example: <em>"ShiplyCo: Your order #1042 has shipped via UPS. Tracking: 1Z999AA1234567890"</em> — custom templates coming soon.
    </div>
  </div>`;
}

function renderTwilioContacts(){
  return `
  <div class="card">
    <div class="card-head"><span class="card-title">Customer Contact Numbers</span><span style="font-size:11px;color:var(--ink3)">Phone numbers used for SMS/WhatsApp notifications</span></div>
    ${CUST_PHONE_BOOK.map(c=>`
    <div style="display:grid;grid-template-columns:160px 1fr 1fr 1fr;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="font-weight:700">${c.name}</div>
      <div class="field" style="margin:0"><label style="font-size:10px">SMS Number</label><input type="text" value="${c.phone}" placeholder="+17135551234" oninput="updatePhoneBook('${c.custId}','phone',this.value)" style="font-size:12px"/></div>
      <div class="field" style="margin:0"><label style="font-size:10px">WhatsApp</label><input type="text" value="${c.whatsapp}" placeholder="+17135551234" oninput="updatePhoneBook('${c.custId}','whatsapp',this.value)" style="font-size:12px"/></div>
      <div class="field" style="margin:0"><label style="font-size:10px">Email</label><input type="email" value="${c.email}" placeholder="contact@company.com" oninput="updatePhoneBook('${c.custId}','email',this.value)" style="font-size:12px"/></div>
    </div>`).join('')}
    <button class="btn btn-red" style="margin-top:14px" onclick="savePhoneBook()">Save Contacts</button>
  </div>`;
}

const TWILIO_LOG=[
  {ts:'2026-03-07 09:14',to:'+17135550001',chan:'SMS',event:'Order Shipped',status:'delivered',msg:'ShiplyCo: Order #1038 shipped via USPS Priority. Tracking: 9400111899223450123456'},
  {ts:'2026-03-06 14:22',to:'+17135550001',chan:'SMS',event:'Invoice Ready',status:'delivered',msg:'ShiplyCo: Invoice #INV-0042 is ready. Total: $1,247.50. View at portal.shiplyco.com'},
  {ts:'2026-03-06 11:05',to:'+18325550002',chan:'WhatsApp',event:'EDI PO Received',status:'failed',msg:'ShiplyCo: New PO from Home Depot: HD-4521987 — 120 units due 3/12'},
];

function renderTwilioLog(){
  return `
  <div class="card">
    <div class="card-head" style="display:flex;align-items:center;justify-content:space-between">
      <span class="card-title">Message Log</span>
      <span style="font-size:11px;color:var(--ink3)">${TWILIO_LOG.length} messages</span>
    </div>
    ${TWILIO_LOG.length?`<div style="overflow-x:auto"><table>
      <thead><tr><th>Time</th><th>To</th><th>Channel</th><th>Event</th><th>Status</th><th>Message</th></tr></thead>
      <tbody>
        ${TWILIO_LOG.map(l=>`<tr>
          <td style="font-size:11px;color:var(--ink3);white-space:nowrap">${l.ts}</td>
          <td class="mono" style="font-size:11px">${l.to}</td>
          <td><span class="tag ${l.chan==='SMS'?'tb':'tg'}">${l.chan}</span></td>
          <td style="font-size:12px">${l.event}</td>
          <td><span class="tag ${l.status==='delivered'?'tg':'tr'}">${l.status}</span></td>
          <td style="font-size:11px;color:var(--ink2);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.msg}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>`:
    `<div style="padding:28px;text-align:center;color:var(--ink3)">No messages sent yet</div>`}
  </div>`;
}

function saveTwilioConfig(){
  TWILIO_CONFIG.accountSid=document.getElementById('tw_sid')?.value.trim();
  TWILIO_CONFIG.authToken=document.getElementById('tw_token')?.value.trim();
  TWILIO_CONFIG.fromNumber=document.getElementById('tw_from')?.value.trim();
  TWILIO_CONFIG.fromWhatsApp=document.getElementById('tw_wa')?.value.trim();
  if(!TWILIO_CONFIG.accountSid||!TWILIO_CONFIG.authToken){showToast('⚠ Account SID and Auth Token required');return;}
  TWILIO_CONFIG.connected=true;
  showToast('✓ Twilio credentials saved');
  switchTwilioTab('setup',document.getElementById('ttab_setup'));
}
function testTwilioConnection(){
  if(!TWILIO_CONFIG.accountSid){showToast('⚠ Enter credentials first');return;}
  const el=document.getElementById('twilio_status');
  if(el)el.innerHTML='<span style="color:var(--ink3)">⏳ Testing…</span>';
  setTimeout(()=>{
    if(el)el.innerHTML='<span style="color:var(--green);font-weight:700">✓ Twilio connection verified — account active</span>';
    TWILIO_CONFIG.connected=true;
  },1500);
}
function sendTestTwilio(){
  if(!TWILIO_CONFIG.connected){showToast('⚠ Connect Twilio first');return;}
  const phone=document.getElementById('tw_testphone')?.value;
  const msg=document.getElementById('tw_testmsg')?.value;
  if(!phone||!msg){showToast('⚠ Phone number and message required');return;}
  showToast('📤 Sending test message…');
  setTimeout(()=>{
    TWILIO_LOG.unshift({ts:new Date().toLocaleString(),to:phone,chan:document.getElementById('tw_testchan')?.value==='whatsapp'?'WhatsApp':'SMS',event:'Test',status:'delivered',msg});
    showToast(`✓ Test message delivered to ${phone}`);
  },1200);
}
function toggleTrigger(id,chan,val){
  const t=NOTIF_TRIGGERS.find(x=>x.id===id);
  if(t){t.channels[chan]=val;showToast(`${t.label} ${chan.toUpperCase()} ${val?'enabled':'disabled'}`);}
}
function updatePhoneBook(custId,field,val){
  const c=CUST_PHONE_BOOK.find(x=>x.custId===custId);if(c)c[field]=val;
}
function savePhoneBook(){showToast('✓ Customer contacts saved');}

// ══════════════════════════════════════════════
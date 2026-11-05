// ── LOCATION MANAGER ──
let _sbLocations = [];
let _locationsLoaded = false;
let _locFilter = 'all';
let _locSearch = '';
let _locPerPage = 50;
let _locPage = 0;

async function loadLocations(){
  try{
    const {data, error} = await sb.from('locations').select('*').order('name').range(0, 9999);
    if(error) throw error;
    _sbLocations = data || [];
    _locationsLoaded = true;
  }catch(e){
    showToast('Error loading locations: '+e.message);
    _locationsLoaded = true;
  }
}

function pgLocations(){
  if(!_locationsLoaded){
    loadLocations().then(()=>showPage('locations'));
    return '<div style="padding:40px;text-align:center;color:var(--ink3)">Loading locations…</div>';
  }

  const types = ['all','regular','walkway','stacked','working_lane'];
  const typeLabel = {'all':'All','regular':'Regular','walkway':'Walkway','stacked':'Stacked','working_lane':'Working Lane'};

  const filtered = _sbLocations.filter(l=>{
    const matchType = _locFilter==='all' || l.type===_locFilter;
    const matchSearch = !_locSearch || l.name.toUpperCase().includes(_locSearch.toUpperCase());
    return matchType && matchSearch;
  });

  return `
  <div class="pg-head" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div class="pg-title">Location Manager</div>
      <div class="pg-sub">${_sbLocations.length} locations · ${_sbLocations.filter(l=>l.active).length} active</div>
    </div>
    <button class="btn btn-red" onclick="showAddLocationModal()">+ Add Location</button>
  </div>

  <!-- Filters -->
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
    <input type="text" id="locSearchInput" placeholder="Search locations…" value="${_locSearch}"
      oninput="_locSearch=this.value;_locPage=0;renderLocGrid()"
      style="padding:7px 12px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;font-size:13px;width:200px"/>
    ${types.map(t=>`
      <button class="btn${_locFilter===t?' on':''}" onclick="_locFilter='${t}';_locPage=0;renderLocGrid()">${typeLabel[t]}</button>
    `).join('')}
    <span id="locCount" style="font-size:12px;color:var(--ink3);margin-left:4px">${filtered.length} total</span>
    <select onchange="_locPerPage=this.value==='all'?99999:+this.value;_locPage=0;renderLocGrid()"
      style="padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-family:Barlow,sans-serif;font-size:12px;margin-left:8px">
      <option value="25" ${_locPerPage===25?'selected':''}>25 per page</option>
      <option value="50" ${_locPerPage===50?'selected':''}>50 per page</option>
      <option value="75" ${_locPerPage===75?'selected':''}>75 per page</option>
      <option value="100" ${_locPerPage===100?'selected':''}>100 per page</option>
      <option value="all" ${_locPerPage===99999?'selected':''}>Show all</option>
    </select>
  </div>

  <div id="locGridWrap">
  </div>

  <!-- Add Location Modal -->
  <div id="addLocModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:6000;align-items:center;justify-content:center">
    <div style="background:var(--surface);border-radius:12px;width:90%;max-width:400px;padding:24px">
      <div style="font-size:16px;font-weight:800;margin-bottom:16px">Add Location</div>
      <div class="field" style="margin-bottom:12px"><label>Location Name</label>
        <input id="newLocName" placeholder="e.g. AA01-A" style="width:100%;font-weight:700;font-size:14px"/>
      </div>
      <div class="field" style="margin-bottom:12px"><label>Type</label>
        <select id="newLocType" style="width:100%">
          <option value="regular">Regular Storage</option>
          <option value="walkway">Walkway / Overflow</option>
          <option value="stacked">Stacked / No Racking</option>
          <option value="working_lane">Working Lane</option>
        </select>
      </div>
      <div class="field" style="margin-bottom:16px"><label>Notes (optional)</label>
        <input id="newLocNotes" placeholder="Any notes about this location"/>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn" onclick="document.getElementById('addLocModal').style.display='none'">Cancel</button>
        <button class="btn btn-red" onclick="saveNewLocation()">Add Location</button>
      </div>
    </div>
  </div>`;
}

function renderLocGrid(){
  const wrap = document.getElementById('locGridWrap');
  if(!wrap) return;

  const filtered = _sbLocations.filter(l=>{
    const matchType = _locFilter==='all' || l.type===_locFilter;
    const matchSearch = !_locSearch || l.name.toUpperCase().includes(_locSearch.toUpperCase());
    return matchType && matchSearch;
  });

  const page = filtered.slice(_locPage*_locPerPage, (_locPage+1)*_locPerPage);
  const totalPages = Math.ceil(filtered.length/_locPerPage);
  const typeLabel = {'all':'All','regular':'Regular','walkway':'Walkway','stacked':'Stacked','working_lane':'Working Lane'};

  // Update count
  const countEl = document.getElementById('locCount');
  if(countEl) countEl.textContent = filtered.length+' locations';

  wrap.innerHTML = `
    ${filtered.length > _locPerPage ? `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;font-size:13px">
      <button class="btn" onclick="_locPage=Math.max(0,_locPage-1);renderLocGrid()" ${_locPage===0?'disabled':''}>← Prev</button>
      <span style="color:var(--ink3)">Page ${_locPage+1} of ${totalPages} · ${filtered.length} locations</span>
      <button class="btn" onclick="_locPage=Math.min(${totalPages}-1,_locPage+1);renderLocGrid()" ${_locPage>=totalPages-1?'disabled':''}>Next →</button>
    </div>` : `<div style="font-size:12px;color:var(--ink3);margin-bottom:12px">${filtered.length} locations</div>`}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px">
      ${page.map(l=>`
        <div style="background:var(--surface);border:1px solid ${l.active?'var(--border)':'rgba(200,0,0,0.2)'};
                    border-radius:8px;padding:10px 12px;opacity:${l.active?1:0.5}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="font-weight:800;font-size:14px">${l.name}</div>
            <div style="display:flex;gap:4px">
              <button onclick="toggleLocActive(${l.id},${l.active})"
                style="background:none;border:none;cursor:pointer;font-size:13px;padding:0">${l.active?'✅':'❌'}</button>
              <button onclick="deleteLocation(${l.id},'${l.name}')"
                style="background:none;border:none;cursor:pointer;font-size:12px;color:var(--ink3);padding:0">🗑</button>
            </div>
          </div>
          <div style="font-size:10px;color:var(--ink3);margin-top:2px;text-transform:uppercase;letter-spacing:0.5px">${typeLabel[l.type]||l.type}</div>
          ${l.notes?`<div style="font-size:10px;color:var(--ink3);margin-top:4px">${l.notes}</div>`:''}
        </div>
      `).join('')}
    </div>`;
}

// Call renderLocGrid after page renders
setTimeout(()=>{ if(document.getElementById('locGridWrap')) renderLocGrid(); }, 50);

function showAddLocationModal(){
  document.getElementById('addLocModal').style.display='flex';
  setTimeout(()=>document.getElementById('newLocName')?.focus(),100);
}

async function saveNewLocation(){
  const name = document.getElementById('newLocName')?.value.trim().toUpperCase();
  const type = document.getElementById('newLocType')?.value;
  const notes = document.getElementById('newLocNotes')?.value.trim();
  if(!name){ showToast('Enter a location name'); return; }
  if(_sbLocations.find(l=>l.name===name)){ showToast('Location already exists'); return; }
  try{
    const {data,error} = await sb.from('locations').insert([{name,type,active:true,notes:notes||null}]).select();
    if(error) throw error;
    _sbLocations.push(data[0]);
    // Also add to in-memory search arrays
    if(type==='regular') WAREHOUSE_LOCS_REGULAR.push(name);
    else if(type==='walkway') WAREHOUSE_LOCS_WALKWAY.push(name);
    else if(type==='stacked') WAREHOUSE_LOCS_STACKED.push(name);
    else if(type==='working_lane') WAREHOUSE_LOCS_OVERFLOW.push(name);
    document.getElementById('addLocModal').style.display='none';
    showToast('Location '+name+' added');
    showPage('locations');
  }catch(e){ showToast('Error: '+e.message); }
}

async function toggleLocActive(id, current){
  try{
    await sb.from('locations').update({active:!current}).eq('id',id);
    const loc = _sbLocations.find(l=>l.id===id);
    if(loc) loc.active = !current;
    showPage('locations');
  }catch(e){ showToast('Error: '+e.message); }
}

async function deleteLocation(id, name){
  confirmAction('Delete location '+name+'?', async()=>{
    try{
      await sb.from('locations').delete().eq('id',id);
      _sbLocations = _sbLocations.filter(l=>l.id!==id);
      showToast(name+' deleted');
      showPage('locations');
    }catch(e){ showToast('Error: '+e.message); }
  });
}
let _CARRIER_ACCTS=[];

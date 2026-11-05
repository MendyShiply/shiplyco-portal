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

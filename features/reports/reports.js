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

const TWILIO_LOG=[
  {ts:'2026-03-07 09:14',to:'+17135550001',chan:'SMS',event:'Order Shipped',status:'delivered',msg:'ShiplyCo: Order #1038 shipped via USPS Priority. Tracking: 9400111899223450123456'},
  {ts:'2026-03-06 14:22',to:'+17135550001',chan:'SMS',event:'Invoice Ready',status:'delivered',msg:'ShiplyCo: Invoice #INV-0042 is ready. Total: $1,247.50. View at portal.shiplyco.com'},
  {ts:'2026-03-06 11:05',to:'+18325550002',chan:'WhatsApp',event:'EDI PO Received',status:'failed',msg:'ShiplyCo: New PO from Home Depot: HD-4521987 — 120 units due 3/12'},
];

// ══════════════════════════════════════════════

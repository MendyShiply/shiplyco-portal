// ── RATES (from your price sheet) ──
const RATES={
  monthly_service:100,
  receiving_pallet:11,
  receiving_pallet_oversized:22,
  receiving_container_20:350,
  receiving_container_40:550,
  receiving_box:3,
  palletizing:10,
  palletizing_oversized:20,
  storage_pallet:15,
  storage_pallet_half:7.50,
  storage_pallet_oversized:30,
  storage_bin:5,
  outbound_pallet:11,
  outbound_pallet_oversized:22,
  pallet_build:10,
  pallet_build_oversized:20,
  pallet_wrap:5,
  new_pallet:5,
  label:0.35,
  prepacked_box:2.50,
  pick_pack_standard:2.50,
  pick_pack_additional_sku:0.50,
  fba_label:0.35,
  fba_kitting:0.75,
  transloading:55,
  disposal:5,
  custom_labor:40,
  rush:5,
  cc_fee_pct:3,
};

// ── SAMPLE DATA ──
const TRUCKS=[]; // loaded from Supabase via TRUCKS_INPROGRESS
const PALLETS=[]; // loaded from Supabase
const UPCS=[];
const CONTAINERS=[];
const DOCS=[];
const INVOICES=[];
// ── EMPLOYEES ──
const EMPLOYEES=[
  {id:'emp_admin',name:'Admin',initials:'AD',color:'#e8241a',colorBg:'#fdf0ef'},
];
let currentEmployee = null; // set on loginAs

function empById(id){return EMPLOYEES.find(e=>e.id===id)||null;}
function empBadge(empId,size=24){
  const e=empById(empId);
  if(!e)return '';
  return `<div title="${e.name}" style="width:${size}px;height:${size}px;border-radius:50%;background:${e.color};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.4)}px;font-weight:800;flex-shrink:0">${e.initials}</div>`;
}

let CUSTOMERS=[]; // loaded from Supabase

async function loadCustomers(){
  try{
    const {data,error} = await sb.from('customers').select('*').order('name');
    if(error) throw error;
    CUSTOMERS = data||[];
  }catch(e){ console.warn('Customers load error:',e); }
}
const NAV={
  // ── CUSTOMER — what they care about: their stuff and their bill ──
  customer:[
    {id:'dashboard',   l:'Dashboard',    i:'grid'},
    {id:'inbound',     l:'Inbound',      i:'up'},
    {id:'inventory',   l:'My Inventory', i:'pkg'},
    {id:'myorders',    l:'My Orders',    i:'box'},
    {id:'invoices',    l:'Invoices',     i:'invoice'},
    {id:'docs',        l:'Documents',    i:'file'},
  ],
  // ── EMPLOYEE — what they do every day ──
  employee:[
    {id:'mytasks',     l:'My Tasks',     i:'zap'},
    {id:'entry',       l:'Receiving',    i:'truck'},
    {id:'inventory',   l:'Inventory',    i:'pkg'},
    {id:'dispatch',    l:'Orders',       i:'box'},
    {id:'labels',      l:'Labels',       i:'tag'},
  ],
  // ── ADMIN — full view ──
  admin:[
    {id:'dashboard',   l:'Dashboard',    i:'grid'},
    {id:'entry',       l:'Receiving',    i:'truck'},
    {id:'inventory',   l:'Inventory',    i:'pkg'},
    {id:'dispatch',    l:'Orders',       i:'box'},
    {id:'invoices',    l:'Billing',      i:'dollar'},
    {id:'reports',     l:'Reports',      i:'chart'},
    {id:'shipping',    l:'Shipping',     i:'send'},
    {id:'admin',       l:'Settings',     i:'settings'},
  ],
};
const SVGS={
  grid:'<polyline points="3 3 3 8 8 8 8 3"/><polyline points="10 3 10 8 15 8 15 3"/><polyline points="3 10 3 15 8 15 8 10"/><polyline points="10 10 10 15 15 15 15 10"/>',
  truck:'<rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  pkg:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  ship:'<path d="M2 21c.6.5 1.2 1 2.5 1C7 22 7 21 9.5 21c2.6 0 2.4 1 5 1 2.5 0 2.5-1 5-1 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v6"/><polyline points="12 5 12 2 9 2"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  dollar:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  invoice:'<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="12" y2="16"/>',
  search:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  up:'<polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>',
  chev:'<polyline points="6 9 12 15 18 9"/>',
  cart:'<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
  box:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
  zap:'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  check:'<polyline points="20 6 9 17 4 12"/>',
  send:'<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  tag:'<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  scan:'<rect x="2" y="2" width="6" height="6"/><rect x="16" y="2" width="6" height="6"/><rect x="2" y="16" width="6" height="6"/><rect x="10" y="2" width="2" height="4"/><rect x="2" y="10" width="4" height="2"/>',
  edit:'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  chart:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
};
function ico(k,s=14){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${SVGS[k]||''}</svg>`}
function fmt(n){return '$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}

// ── CUSTOMER RATE OVERRIDES ──
const CUSTOMER_RATES={
  platinum:{receiving_pallet:5,outbound_pallet:5,receiving_pallet_oversized:22,outbound_pallet_oversized:22},
  horizon:{},
};
function getRate(customerId,key){
  const overrides=CUSTOMER_RATES[customerId]||{};
  return overrides[key]!==undefined?overrides[key]:RATES[key];
}

// ── ORDERS DATA ──
let ORDERS=[];
let NOTIFICATIONS=[];

let role='customer';
let currentCustId = null;
let palletCount=1;
let itemCounts={};

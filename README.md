# ShiplyCo Client Portal

A 3PL warehouse management system and client portal for ShiplyCo (Houston, TX).
Live at: https://mendyshiply.github.io/shiplyco-portal

## Project Context

This codebase was refactored from a single 11,000-line HTML file into a proper
multi-file structure. The portal is a vanilla JS application (no framework) using
Supabase as the backend, with ElevenLabs for TARA voice and Groq AI for chat.

**This is NOT a module-based build system.** All files load as plain `<script>` tags
in order. All functions are global. There is no bundler, no npm, no imports/exports.
This is intentional for simplicity and GitHub Pages compatibility.

## Stack

- **Frontend**: Vanilla HTML/CSS/JS (no framework)
- **Backend**: Supabase (auth, database, real-time)
- **Voice AI**: ElevenLabs (TARA voice)
- **Chat AI**: Groq (Llama 3.3), called through the `tara-voice` edge function
- **Hosting**: GitHub Pages (mendyshiply.github.io/shiplyco-portal)
- **Fonts**: Barlow + Barlow Condensed (Google Fonts)

## File Structure

```
shiplyco-portal/
├── index.html                  ← App shell (login UI, sidebar nav, modal overlays)
├── styles/
│   └── main.css                ← All CSS (brand colors, layout, components)
├── js/
│   ├── config.js               ← Supabase keys, pricing rates, nav config, sample data
│   └── auth.js                 ← Login, logout, session management, password reset
└── modules/
    ├── inventory-grid.js       ← Resizable/draggable inventory data grid component
    ├── users.js                ← User management (invite, edit, roles, password reset)
    ├── invoices.js             ← Invoice generation and management (Supabase wired)
    ├── tara.js                 ← TARA AI assistant (particle UI, ElevenLabs voice, Groq chat)
    ├── receiving.js            ← Two-stage truck receiving (new truck modal, pallet scanning)
    ├── orders.js               ← Place an order form + orders list (Supabase wired)
    ├── dispatch.js             ← Dispatch board, my tasks, pick list (employee facing)
    ├── inventory.js            ← Inventory & scan page with pick sessions
    ├── label-printer.js        ← Pallet and SKU label printing
    ├── leaderboard.js          ← Employee performance tracking and leaderboard
    ├── supplies.js             ← Supplies inventory management
    ├── sku-catalog.js          ← SKU master catalog, inbound ASN, dispose system
    ├── shipping.js             ← Shipping rates, carrier accounts, providers
    ├── edi.js                  ← EDI management (partners, PO inbox, ASN builder)
    ├── marketplace.js          ← Marketplace integrations (Amazon, Shopify, etc.)
    ├── bol.js                  ← Bill of Lading creation and management
    ├── cycle-counts.js         ← Cycle count scheduling and execution
    ├── reports.js              ← Reporting and analytics dashboard
    ├── ai-assistant.js         ← AI feature pages (order assistant, pick sequencing, etc.)
    ├── customers.js            ← Customer manager, pricing editor, contacts
    └── locations.js            ← Warehouse location manager (zones, aisles, bays)
```

## Script Load Order (important)

Scripts must load in this order (already set in index.html):
1. `js/config.js` — creates the Supabase client (`sb`), global constants (rates, nav items)
2. `modules/inventory-grid.js` — shared grid component used by other modules
3. `js/auth.js` — login, session restore, invite and password reset screens
4. All other modules (order between them is mostly flexible)

## Global Variables (defined in config.js / auth.js)

```js
SUPABASE_URL, SUPABASE_ANON_KEY  // Supabase connection
supabase                          // Supabase client instance (set in auth.js)
role                              // Current user role: 'admin' | 'employee' | 'customer'
currentUser                       // Current Supabase user object
NAV_ITEMS                         // Navigation config array
RATES                             // Pricing rates object
CUSTOMERS, ORDERS, INVENTORY      // Data arrays (partially Supabase wired)
```

## Supabase Tables

- `orders` — customer orders (wired)
- `invoices` — billing invoices (wired)  
- `users` / auth — authentication (wired)
- `trucks`, `pallets`, `receiving_items` — receiving system (partially wired)
- `inventory`, `sku_catalog`, `supplies` — warehouse data (partially wired)

## Security model (read this)

Customer data is protected by **Row Level Security** in Supabase, defined in
`supabase/migrations/`. The anon key in `js/config.js` is public by design.
Admins see everything, employees see warehouse data, customers see only rows whose
`cust_id` / `customer_id` matches their profile. User invites run server side in
`supabase/functions/invite-user` (needs the service role key, which never touches the browser).

## Setup checklist

1. Supabase → SQL Editor → run `supabase/migrations/20261105000000_enable_row_level_security.sql`.
2. Deploy the invite function: `supabase functions deploy invite-user`.
3. Supabase → Authentication → Providers → Email: turn **off** "Allow new users to sign up"
   (invites still work; strangers can no longer create accounts).
4. Supabase → Authentication → URL Configuration: Site URL and Redirect URLs =
   `https://mendyshiply.github.io/shiplyco-portal/`.
5. Supabase free projects pause after ~7 days idle, which breaks login with no clear error.
   Upgrade to Pro before customers rely on it.

## Testing

```
npm install
npx playwright install chromium
npm test
```

Runs automatically on every push (`.github/workflows/test.yml`).

## Known Outstanding Items

1. **Hamburger icon** not visible on mobile (CSS fix needed in main.css)
2. **TARA voice loop** audio reliability issues (ElevenLabs integration in tara.js)
3. **Customer invite email** template and password setup flow (Supabase email templates)
4. **Inventory aging column** to be added to inventory-grid.js:
   - Color coding: 0-90 days = green, 91-180 days = yellow, 181+ days = red
   - Should be one of the first columns on the left
5. **Orders page** not fully Supabase wired (local state still used in places)
6. **Trucks/receiving** not fully pulling live data from Supabase

## How to Deploy

This is a static site. To deploy:
1. Push all files to the `main` branch of `mendyshiply/shiplyco-portal`
2. GitHub Pages automatically serves `index.html` from the repo root
3. All file paths are relative so they work on GitHub Pages as-is

## Development Notes

- No build step required. Edit files directly.
- Test locally by opening index.html in a browser (use Live Server in VS Code for best results)
- All JS is global scope by design. Avoid name collisions when adding new functions.
- CSS variables are defined in `:root` in main.css — use them for all colors/spacing

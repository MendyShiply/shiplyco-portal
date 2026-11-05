# ShiplyCo Fulfillment Portal: Handoff

## What this is
A client and admin portal for ShiplyCo, a third party logistics warehouse in Houston.
One single HTML file (index.html, about 630KB) with all CSS and JavaScript inline.
Backend is Supabase (Postgres plus Auth). Hosted on GitHub Pages at
https://mendyshiply.github.io/shiplyco-portal (repo: mendyshiply/shiplyco-portal, file index.html).
Supabase project URL: https://xyemghdkehsfgeyidmie.supabase.co (anon key is embedded in index.html).
Deploy flow today: edit file, replace index.html in the repo folder, commit and push with GitHub Desktop.

## Roles (one codebase, controlled by the global `role` variable)
- admin: Mendy. Sees all customers, receiving, inventory, orders, billing, reports, settings.
- employee: warehouse staff (Pawel).
- customer: sees only their own data. `currentCustId` is set from profiles.customer_id on login.
Navigation is defined in the NAV object, page routing in the `fns` map inside showPage().

## Supabase tables
profiles, customers, contacts, orders, trucks, pallets, pallet_items, sku_catalog, invoices, locations, asns.
asns columns: id, cust_id, expected_date, shipment_type, pallet_count, box_count, bol_number,
tracking_number, carrier, po_url, status (pending, received, partial, cancelled), is_seasonal, season,
notes, items (jsonb), received_at, received_by, warehouse_notes.
sku_catalog has unique indexes on (sku, cust_id) and (upc, cust_id where sku is null).
All SQL used to build and seed these is in /sql. Run order is roughly: schema (done in dashboard),
locations, imports, dedup_sku_catalog, create_asn_table.

## Test accounts
Admin: mendy@shiplyfulfillment.com. Customer test: platinum_financial_g_2420 customer profile.

## Key features built
- Inventory grid: one row per item, aging column (green 0 to 90 days, yellow 91 to 180, red 181 plus),
  per column filters, sort, resize, drag reorder (layout saved in localStorage), CSV export.
- Receiving: trucks, scan pallets one at a time, plus Expected Inbound section from customer ASNs.
- Inbound ASN system: customer submits shipment notice with per item details.
- SKU Master (sku_catalog), auto populated on receive.
- Orders: pallet outbound (pallet picker from real inventory), FBA (SKU quantities from catalog),
  pick and pack (file upload only), marketplace (placeholder).
- Dispose request (customer only), writes a row to orders with type dispose.
- Password reset flow listens for the PASSWORD_RECOVERY auth event.
- TARA AI assistant. Server code in /tara (Supabase edge functions, index.ts).

## Known problems and decisions still open
1. SECURITY: customer data isolation is enforced only in client side JavaScript (filtering by cust_id).
   Row Level Security was disabled on tables such as asns. Anyone with the anon key can read every
   customer's data. This must be fixed with proper RLS policies before real customers log in.
2. Invite and reset emails use the default Supabase template (unprofessional). Needs custom template
   and a redirect URL so new customers are prompted to set a password instead of being auto logged in.
3. Recently Received trucks show 0 pallets. A fallback using the pallets array length was added but
   is not verified.
4. Dispose request is saved as an order, but approval flow, the 50 dollar per pallet fee, transfer to the
   Shiply Fulfillment account and removal from the customer's list are not built.
5. Wholesale and bulk orders should be called Pallet Outbound. Admin side of orders (dispatch view)
   needs to show all order types with correct actions per type.
6. Inbound item entry should look like inventory line items. Seasonal flag is per item, not per shipment.
7. Orders and Receiving should be tied to inventory so shipping out actually decrements stock.
8. Admin and customer views must stay clearly separated. Rule used so far: never delete an element,
   hide it with a role check.
9. Admin dashboard aging graph, customer invoice and order history pages are not built.

## Engineering notes
The single file with huge template literals caused repeated syntax errors: unescaped apostrophes in
single quoted strings, HTML entities such as &nbsp; inside JS strings, and inline onclick handlers with
nested quotes. Use data attributes with a delegated handler instead. A good first move for the
next engineer is to split this into real modules (or a Vite and React project) and add a test run
that parses the JS on every change.

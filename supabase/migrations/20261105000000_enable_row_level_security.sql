-- ════════════════════════════════════════════════════════════════════════════
-- ShiplyCo: turn on Row Level Security (RLS) for every table.
--
-- WHY: until now, customer isolation only happened in browser JavaScript.
-- The anon key is public (it ships in the page), so anyone could query every
-- customer's pallets, orders and invoices straight from the API, and any
-- logged in user could edit their own profile to role = 'admin'.
--
-- WHAT THIS DOES:
--   • admin    → full access to everything
--   • employee → full access to warehouse data (trucks, pallets, orders, ASNs,
--                SKUs, locations, invoices); read only on customers/contacts
--   • customer → reads ONLY rows for their own customer_id, and may create
--                orders and inbound shipment notices (ASNs) for themselves
--   • not logged in → nothing at all
--   • a profile with active = false is treated as having no access
--
-- HOW TO RUN: Supabase dashboard → SQL Editor → paste this whole file → Run.
-- It is safe to run more than once. Back up first (Database → Backups).
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. Helper functions ─────────────────────────────────────────────────────
-- SECURITY DEFINER lets these read `profiles` without being blocked by the
-- profiles policies themselves (which would otherwise recurse).

create or replace function public.app_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.profiles
  where id = auth.uid() and coalesce(active, true)
$$;

create or replace function public.app_cust_id()
returns text
language sql stable security definer set search_path = public
as $$
  select customer_id::text from public.profiles
  where id = auth.uid() and coalesce(active, true) and role = 'customer'
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.app_role() = 'admin', false) $$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.app_role() in ('admin', 'employee'), false) $$;

revoke all on function public.app_role(), public.app_cust_id(),
                       public.is_admin(), public.is_staff() from public, anon;
grant execute on function public.app_role(), public.app_cust_id(),
                          public.is_admin(), public.is_staff() to authenticated;

-- ── 2. Data fix: pallets imported without a cust_id inherit their truck's ────
-- (platinum_import.sql inserted pallets with no cust_id column.)
update public.pallets p
set cust_id = t.cust_id
from public.trucks t
where p.truck_id = t.id and p.cust_id is null and t.cust_id is not null;

-- ── 3. Remove any old policies so we start from a clean, known state ────────
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','customers','contacts','trucks','pallets',
                        'pallet_items','orders','asns','sku_catalog',
                        'invoices','locations')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- ── 4. Enable RLS on every table ────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['profiles','customers','contacts','trucks','pallets',
                           'pallet_items','orders','asns','sku_catalog',
                           'invoices','locations']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;

-- ── 5. Policies ─────────────────────────────────────────────────────────────
-- (select fn()) wrapping lets Postgres evaluate the helper once per query
-- instead of once per row.

-- profiles: you can read your own row; staff can read all; only admins write.
-- Nobody can change their own role.
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or (select public.is_staff()));
create policy profiles_admin_write on public.profiles for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- customers: customers see their own company row; staff read all; admin writes.
create policy customers_read on public.customers for select to authenticated
  using ((select public.is_staff()) or id::text = (select public.app_cust_id()));
create policy customers_admin_write on public.customers for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- contacts: same pattern, keyed on customer_id.
create policy contacts_read on public.contacts for select to authenticated
  using ((select public.is_staff()) or customer_id::text = (select public.app_cust_id()));
create policy contacts_admin_write on public.contacts for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- trucks: staff full; customers read their own.
create policy trucks_staff on public.trucks for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy trucks_customer_read on public.trucks for select to authenticated
  using (cust_id::text = (select public.app_cust_id()));

-- pallets: staff full; customers read their own.
create policy pallets_staff on public.pallets for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy pallets_customer_read on public.pallets for select to authenticated
  using (cust_id::text = (select public.app_cust_id()));

-- orders: staff full; customers read their own and can place new ones
-- (regular orders, FBA, pallet outbound, dispose requests) for themselves only.
create policy orders_staff on public.orders for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy orders_customer_read on public.orders for select to authenticated
  using (cust_id::text = (select public.app_cust_id()));
create policy orders_customer_create on public.orders for insert to authenticated
  with check (cust_id::text = (select public.app_cust_id()));

-- asns (inbound shipment notices): same as orders.
create policy asns_staff on public.asns for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy asns_customer_read on public.asns for select to authenticated
  using (cust_id::text = (select public.app_cust_id()));
create policy asns_customer_create on public.asns for insert to authenticated
  with check (cust_id::text = (select public.app_cust_id()));

-- sku_catalog: staff full; customers read their own SKUs.
create policy sku_staff on public.sku_catalog for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy sku_customer_read on public.sku_catalog for select to authenticated
  using (cust_id::text = (select public.app_cust_id()));

-- invoices: staff full (dispatch adds disposal fees); customers read their own.
create policy invoices_staff on public.invoices for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy invoices_customer_read on public.invoices for select to authenticated
  using (customer_id::text = (select public.app_cust_id()));

-- locations: not sensitive; any logged in user can read, staff write.
create policy locations_read on public.locations for select to authenticated
  using (true);
create policy locations_staff_write on public.locations for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- pallet_items (legacy table, not used by the current portal): staff only.
do $$
begin
  if to_regclass('public.pallet_items') is not null then
    execute 'create policy pallet_items_staff on public.pallet_items for all to authenticated
             using ((select public.is_staff())) with check ((select public.is_staff()))';
  end if;
end $$;

-- ── 6. Storage: only staff may upload pallet photos / BOLs ──────────────────
-- (Reading stays as configured on the bucket. If "pallet-files" is a PUBLIC
-- bucket, anyone with a file's link can open it; see README "Next steps".)
drop policy if exists pallet_files_staff_write on storage.objects;
create policy pallet_files_staff_write on storage.objects for all to authenticated
  using (bucket_id = 'pallet-files' and (select public.is_staff()))
  with check (bucket_id = 'pallet-files' and (select public.is_staff()));

commit;

-- ── 7. Verify (run separately after the commit) ─────────────────────────────
-- Every row should say rls_enabled = true:
--   select relname as table_name, relrowsecurity as rls_enabled
--   from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'
--   order by 1;

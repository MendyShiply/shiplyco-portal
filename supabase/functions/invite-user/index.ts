// invite-user: lets an admin invite a new portal user.
//
// Runs on Supabase's servers with the service role key, which never reaches the
// browser. It checks that the caller is a logged in, active admin, sends the
// Supabase invite email (the link lands on the portal's "Set your password"
// screen) and creates the matching row in `profiles`.
//
// Deploy:  supabase functions deploy invite-user
// (SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided
//  to every edge function automatically.)

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const PORTAL_URL = "https://mendyshiply.github.io/shiplyco-portal/";
const ROLES = new Set(["admin", "employee", "customer"]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // 1. Who is calling? Use their own token so RLS applies to this lookup.
  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: userData } = await caller.auth.getUser();
  if (!userData?.user) return reply(401, { error: "Please sign in again." });

  const { data: me } = await caller
    .from("profiles").select("role, active").eq("id", userData.user.id).single();
  if (me?.role !== "admin" || me?.active === false) {
    return reply(403, { error: "Only admins can invite users." });
  }

  // 2. Validate input.
  let body: { email?: string; full_name?: string; role?: string; customer_id?: string | null };
  try { body = await req.json(); } catch { return reply(400, { error: "Invalid request." }); }

  const email = (body.email ?? "").trim().toLowerCase();
  const fullName = (body.full_name ?? "").trim();
  const role = body.role ?? "";
  const customerId = role === "customer" ? (body.customer_id ?? "").trim() : null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, { error: "Enter a valid email address." });
  if (!ROLES.has(role)) return reply(400, { error: "Pick a role." });
  if (role === "customer" && !customerId) return reply(400, { error: "Pick which customer this user belongs to." });

  // 3. Invite + create profile with the service role (bypasses RLS, server side only).
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  if (customerId) {
    const { data: cust } = await admin.from("customers").select("id").eq("id", customerId).maybeSingle();
    if (!cust) return reply(400, { error: "That customer does not exist." });
  }

  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: PORTAL_URL,
    data: { full_name: fullName },
  });
  if (inviteErr || !invited?.user) {
    return reply(400, { error: inviteErr?.message ?? "Could not send the invite." });
  }

  const { error: profileErr } = await admin.from("profiles").upsert({
    id: invited.user.id,
    email,
    full_name: fullName || null,
    role,
    customer_id: customerId,
    active: true,
    invited_at: new Date().toISOString(),
  });
  if (profileErr) {
    // Don't leave a login with no profile behind.
    await admin.auth.admin.deleteUser(invited.user.id);
    return reply(500, { error: "Invite failed while saving the profile: " + profileErr.message });
  }

  return reply(200, { ok: true, user_id: invited.user.id });
});

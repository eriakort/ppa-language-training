// Scheduled Supabase Edge Function for profile deletion and retention maintenance.
// Configure LIFECYCLE_WORKER_SECRET as a server-side secret and invoke daily
// with the same value in the x-lifecycle-worker-secret header.
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const expected = Deno.env.get("LIFECYCLE_WORKER_SECRET");
  const supplied = req.headers.get("x-lifecycle-worker-secret");
  if (!expected || !supplied || supplied !== expected)
    return new Response("Unauthorized", { status: 401 });
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return new Response("Worker is not configured", { status: 500 });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.rpc("run_profile_retention_maintenance");
  if (error) return new Response(JSON.stringify({ error: "Maintenance failed" }), {
    status: 500, headers: { "Content-Type": "application/json" }
  });
  return new Response(JSON.stringify({ ok: true, ...data }), {
    headers: { "Content-Type": "application/json" }
  });
});

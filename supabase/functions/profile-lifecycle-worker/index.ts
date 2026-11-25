// Scheduled Supabase Edge Function for profile deletion and retention maintenance.
// Configure LIFECYCLE_WORKER_SECRET as a server-side secret and invoke daily
// with the same value in the x-lifecycle-worker-secret header.
import { createClient } from "@supabase/supabase-js";

async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const ba = new Uint8Array(da);
  const bb = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const expected = Deno.env.get("LIFECYCLE_WORKER_SECRET");
  const supplied = req.headers.get("x-lifecycle-worker-secret");
  if (!expected || !supplied || !(await constantTimeEqual(supplied, expected)))
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

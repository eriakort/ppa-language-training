// Supabase Edge Function: profile-access
// Required secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
// APP_SITE_URL (the exact public app origin, e.g. https://example.github.io).
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_SITE_URL") ?? "null",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const origin = req.headers.get("origin");
  const allowedOrigin = Deno.env.get("APP_SITE_URL");
  if (!allowedOrigin || origin !== allowedOrigin) return json({ error: "Origin not allowed" }, 403);

  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json({ error: "Sign-in required" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Invalid session" }, 401);
  const user = userData.user;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  if (body.action === "create_profile") {
    const displayName = typeof body.display_name === "string" ? body.display_name.trim() : "";
    if (!displayName || displayName.length > 80) return json({ error: "Name must be 1–80 characters" }, 400);

    const { data: profile, error: profileError } = await admin
      .from("learner_profiles")
      .insert({ display_name: displayName, created_by: user.id })
      .select("id, display_name, created_at")
      .single();
    if (profileError || !profile) return json({ error: "Could not create profile" }, 500);

    const { error: memberError } = await admin.from("profile_members")
      .insert({ profile_id: profile.id, user_id: user.id, role: "owner" });
    if (memberError) {
      await admin.from("learner_profiles").delete().eq("id", profile.id);
      return json({ error: "Could not establish profile ownership" }, 500);
    }
    const { error: dataError } = await admin.from("profile_data").insert({ profile_id: profile.id });
    if (dataError) {
      await admin.from("learner_profiles").delete().eq("id", profile.id);
      return json({ error: "Could not initialize profile data" }, 500);
    }
    return json({ profile });
  }

  if (body.action === "invite_member") {
    const profileId = typeof body.profile_id === "string" ? body.profile_id : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = body.role;
    if (!/^[0-9a-f-]{36}$/i.test(profileId)) return json({ error: "Invalid profile" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json({ error: "Enter a valid email" }, 400);
    if (!["caregiver", "therapist", "learner"].includes(String(role))) return json({ error: "Unsupported invitation role" }, 400);

    const { data: membership, error: membershipError } = await admin
      .from("profile_members").select("role").eq("profile_id", profileId).eq("user_id", user.id).maybeSingle();
    if (membershipError || !membership) return json({ error: "You do not have access to this profile" }, 403);
    const canInvite = membership.role === "owner" ||
      (membership.role === "caregiver" && role === "learner");
    if (!canInvite) return json({ error: "Your role cannot invite this type of member" }, 403);

    const siteUrl = Deno.env.get("APP_SITE_URL")!;
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: siteUrl,
      data: { invited_profile_id: profileId, invited_role: role },
    });
    if (inviteError || !invited.user) return json({ error: "Could not send invitation" }, 400);

    const { data: alreadyMember } = await admin.from("profile_members")
      .select("user_id").eq("profile_id", profileId).eq("user_id", invited.user.id).maybeSingle();
    if (alreadyMember) return json({ error: "This person already has access to the profile" }, 409);
    const { error: addError } = await admin.from("profile_members")
      .insert({ profile_id: profileId, user_id: invited.user.id, role });
    if (addError) return json({ error: "Invitation sent, but profile access could not be assigned. Contact the administrator." }, 500);
    return json({ invited: true });
  }

  return json({ error: "Unknown action" }, 400);
});

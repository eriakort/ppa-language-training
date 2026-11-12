// Supabase Edge Function: profile-access
// Required secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
// APP_SITE_URL (origin only) and AUTH_REDIRECT_URL (complete app URL).
import { createClient } from "@supabase/supabase-js";

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

  if (body.action === "account_deletion_preflight") {
    const { data: memberships, error: membershipError } = await admin.from("profile_members")
      .select("profile_id,role,created_at").eq("user_id", user.id);
    if (membershipError) return json({ error: "Could not inspect account memberships" }, 500);
    const profileIds = (memberships ?? []).map((item) => item.profile_id);
    const [{ data: profiles, error: profilesError }, { data: outgoing, error: outgoingError },
      { data: incoming, error: incomingError }] = await Promise.all([
      profileIds.length ? admin.from("learner_profiles").select("id,display_name,created_at").in("id", profileIds) : Promise.resolve({ data: [], error: null }),
      admin.from("profile_ownership_transfers").select("id,profile_id,expires_at")
        .eq("from_user_id", user.id).eq("status", "pending").gt("expires_at", new Date().toISOString()),
      admin.from("profile_ownership_transfers").select("id,profile_id,expires_at")
        .eq("to_user_id", user.id).eq("status", "pending").gt("expires_at", new Date().toISOString())
    ]);
    if (profilesError || outgoingError || incomingError)
      return json({ error: "Could not inspect account deletion dependencies" }, 500);
    const ids = profileIds;
    const [{ data: allMembers, error: allMembersError }, { data: deletions, error: deletionError }] = await Promise.all([
      ids.length ? admin.from("profile_members").select("profile_id,user_id,role").in("profile_id", ids) : Promise.resolve({ data: [], error: null }),
      ids.length ? admin.from("profile_deletion_requests").select("id,profile_id,status,scheduled_for")
        .in("profile_id", ids).eq("status", "pending") : Promise.resolve({ data: [], error: null })
    ]);
    if (allMembersError || deletionError) return json({ error: "Could not inspect profile ownership" }, 500);
    const profileRows = profiles ?? [];
    const rows = (memberships ?? []).map((membership) => {
      const profile = profileRows.find((item) => item.id === membership.profile_id);
      const related = (allMembers ?? []).filter((item) => item.profile_id === membership.profile_id);
      const owners = related.filter((item) => item.role === "owner");
      const caregivers = related.filter((item) => item.role === "caregiver");
      const pendingDeletion = (deletions ?? []).find((item) => item.profile_id === membership.profile_id);
      return {
        profile_id: membership.profile_id,
        profile_name: profile?.display_name ?? "Learner profile",
        role: membership.role,
        member_count: related.length,
        owner_count: owners.length,
        caregiver_count: caregivers.length,
        can_transfer_to_caregiver: membership.role === "owner" && owners.length === 1 && caregivers.some((item) => item.user_id !== user.id),
        deletion_pending: Boolean(pendingDeletion),
        deletion_scheduled_for: pendingDeletion?.scheduled_for ?? null,
        account_action: membership.role === "owner"
          ? (pendingDeletion ? "wait_for_profile_deletion" : (owners.length === 1 && caregivers.some((item) => item.user_id !== user.id) ? "transfer_or_delete_profile" : "delete_profile_before_account"))
          : "membership_will_be_revoked"
      };
    });
    const blockers = [];
    for (const row of rows) {
      if (row.role === "owner" && row.account_action !== "wait_for_profile_deletion")
        blockers.push({ type: "owned_profile", profile_id: row.profile_id, profile_name: row.profile_name, action: row.account_action });
      if (row.role === "owner" && row.deletion_pending)
        blockers.push({ type: "profile_deletion_pending", profile_id: row.profile_id, profile_name: row.profile_name, scheduled_for: row.deletion_scheduled_for });
    }
    for (const transfer of outgoing ?? []) blockers.push({ type: "outgoing_transfer_pending", profile_id: transfer.profile_id, expires_at: transfer.expires_at });
    for (const transfer of incoming ?? []) blockers.push({ type: "incoming_transfer_pending", profile_id: transfer.profile_id, expires_at: transfer.expires_at });
    return json({
      ready: blockers.length === 0,
      membership_count: rows.length,
      owned_profile_count: rows.filter((row) => row.role === "owner").length,
      profiles: rows,
      pending_transfers: { outgoing: (outgoing ?? []).length, incoming: (incoming ?? []).length },
      blockers,
      note: "This is a read-only preflight. It does not delete the account, profiles, memberships, backups, sessions or recordings."
    });
  }

  if (body.action === "create_profile") {
    const displayName = typeof body.display_name === "string" ? body.display_name.trim() : "";
    if (!displayName || displayName.length > 80) return json({ error: "Name must be 1–80 characters" }, 400);
    const { data: profile, error: profileError } = await admin.from("learner_profiles")
      .insert({ display_name: displayName, created_by: user.id }).select("id, display_name, created_at").single();
    if (profileError || !profile) return json({ error: "Could not create profile" }, 500);
    const { error: memberError } = await admin.from("profile_members").insert({ profile_id: profile.id, user_id: user.id, role: "owner" });
    if (memberError) { await admin.from("learner_profiles").delete().eq("id", profile.id); return json({ error: "Could not establish profile ownership" }, 500); }
    const { error: dataError } = await admin.from("profile_data").insert({ profile_id: profile.id });
    if (dataError) { await admin.from("learner_profiles").delete().eq("id", profile.id); return json({ error: "Could not initialize profile data" }, 500); }
    return json({ profile });
  }

  if (body.action === "invite_member") {
    const profileId = typeof body.profile_id === "string" ? body.profile_id : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = body.role;
    if (!/^[0-9a-f-]{36}$/i.test(profileId)) return json({ error: "Invalid profile" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json({ error: "Enter a valid email" }, 400);
    if (!["caregiver", "therapist", "learner"].includes(String(role))) return json({ error: "Unsupported invitation role" }, 400);
    const { data: membership, error: membershipError } = await admin.from("profile_members").select("role")
      .eq("profile_id", profileId).eq("user_id", user.id).maybeSingle();
    if (membershipError || !membership) return json({ error: "You do not have access to this profile" }, 403);
    const canInvite = membership.role === "owner" || (membership.role === "caregiver" && role === "learner");
    if (!canInvite) return json({ error: "Your role cannot invite this type of member" }, 403);
    const siteUrl = Deno.env.get("AUTH_REDIRECT_URL") ?? Deno.env.get("APP_SITE_URL")!;
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: siteUrl, data: { invited_profile_id: profileId, invited_role: role } });
    if (inviteError || !invited.user) return json({ error: "Could not send invitation" }, 400);
    const { data: alreadyMember } = await admin.from("profile_members").select("user_id").eq("profile_id", profileId).eq("user_id", invited.user.id).maybeSingle();
    if (alreadyMember) return json({ error: "This person already has access to the profile" }, 409);
    const { error: addError } = await admin.from("profile_members").insert({ profile_id: profileId, user_id: invited.user.id, role });
    if (addError) return json({ error: "Invitation sent, but profile access could not be assigned. Contact the administrator." }, 500);
    return json({ invited: true });
  }

  if (body.action === "list_members" || body.action === "remove_member") {
    const profileId = typeof body.profile_id === "string" ? body.profile_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(profileId)) return json({ error: "Invalid profile" }, 400);
    const { data: membership, error: membershipError } = await admin.from("profile_members").select("role")
      .eq("profile_id", profileId).eq("user_id", user.id).maybeSingle();
    if (membershipError || !membership || !["owner", "caregiver"].includes(membership.role))
      return json({ error: "Your role cannot manage shared access" }, 403);
    if (body.action === "list_members") {
      const { data: members, error } = await admin.from("profile_members").select("user_id,role,created_at").eq("profile_id", profileId);
      if (error) return json({ error: "Could not load shared access" }, 500);
      const enriched = await Promise.all((members ?? []).map(async (member) => {
        const { data } = await admin.auth.admin.getUserById(member.user_id);
        return { user_id: member.user_id, role: member.role, created_at: member.created_at,
          email: data.user?.email ?? "", is_self: member.user_id === user.id,
          can_remove: member.role !== "owner" && (membership.role === "owner" || member.role === "learner") };
      }));
      return json({ members: enriched });
    }
    const targetId = typeof body.user_id === "string" ? body.user_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(targetId) || targetId === user.id)
      return json({ error: "Invalid member" }, 400);
    const { data: target, error: targetError } = await admin.from("profile_members").select("role")
      .eq("profile_id", profileId).eq("user_id", targetId).maybeSingle();
    if (targetError || !target) return json({ error: "Member not found" }, 404);
    const allowed = target.role !== "owner" && (membership.role === "owner" || (membership.role === "caregiver" && target.role === "learner"));
    if (!allowed) return json({ error: "Your role cannot remove this member" }, 403);
    const { error: removeError } = await admin.from("profile_members").delete().eq("profile_id", profileId).eq("user_id", targetId);
    if (removeError) return json({ error: "Could not revoke profile access" }, 500);
    return json({ removed: true });
  }

  if (["get_lifecycle", "request_profile_deletion", "cancel_profile_deletion", "set_retention"].includes(String(body.action))) {
    const profileId = typeof body.profile_id === "string" ? body.profile_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(profileId)) return json({ error: "Invalid profile" }, 400);
    const { data: membership, error: membershipError } = await admin.from("profile_members")
      .select("role").eq("profile_id", profileId).eq("user_id", user.id).maybeSingle();
    if (membershipError || !membership || !["owner", "caregiver"].includes(membership.role))
      return json({ error: "Your role cannot manage profile lifecycle settings" }, 403);

    if (body.action === "get_lifecycle") {
      const [{ data: retention, error: retentionError }, { data: request, error: requestError }] = await Promise.all([
        admin.from("profile_retention_settings").select("therapist_metrics_retention_days,updated_at")
          .eq("profile_id", profileId).maybeSingle(),
        admin.from("profile_deletion_requests").select("id,status,requested_at,scheduled_for,cancelled_at,completed_at")
          .eq("profile_id", profileId).eq("status", "pending").maybeSingle()
      ]);
      if (retentionError || requestError) return json({ error: "Could not load lifecycle settings" }, 500);
      return json({ retention_days: retention?.therapist_metrics_retention_days ?? 365,
        deletion_request: membership.role === "owner" ? request : null });
    }

    if (body.action === "request_profile_deletion") {
      if (membership.role !== "owner") return json({ error: "Only the profile owner can request deletion" }, 403);
      const { data: owners, error: ownersError } = await admin.from("profile_members")
        .select("user_id").eq("profile_id", profileId).eq("role", "owner");
      if (ownersError) return json({ error: "Could not verify profile ownership" }, 500);
      if (!owners || owners.length !== 1 || owners[0].user_id !== user.id)
        return json({ error: "Transfer or resolve shared ownership before requesting profile deletion" }, 409);
      const { data: existing } = await admin.from("profile_deletion_requests").select("id")
        .eq("profile_id", profileId).eq("status", "pending").maybeSingle();
      if (existing) return json({ error: "A deletion request is already pending" }, 409);
      const { data: request, error } = await admin.from("profile_deletion_requests")
        .insert({ profile_id: profileId, requested_by: user.id, scheduled_for: new Date(Date.now() + 30*24*60*60*1000).toISOString() })
        .select("id,status,requested_at,scheduled_for").single();
      if (error || !request) return json({ error: "Could not create deletion request" }, 500);
      return json({ deletion_request: request });
    }

    if (body.action === "cancel_profile_deletion") {
      if (membership.role !== "owner") return json({ error: "Only the profile owner can cancel deletion" }, 403);
      const requestId = typeof body.request_id === "string" ? body.request_id : "";
      if (!/^[0-9a-f-]{36}$/i.test(requestId)) return json({ error: "Invalid deletion request" }, 400);
      const { data: request, error } = await admin.from("profile_deletion_requests").update({
        status: "cancelled", cancelled_at: new Date().toISOString()
      }).eq("id", requestId).eq("profile_id", profileId).eq("requested_by", user.id)
        .eq("status", "pending").gt("scheduled_for", new Date().toISOString())
        .select("id,status,cancelled_at").maybeSingle();
      if (error) return json({ error: "Could not cancel deletion request" }, 500);
      if (!request) return json({ error: "The request is no longer cancellable" }, 409);
      return json({ deletion_request: request });
    }

    if (body.action === "set_retention") {
      const days = Number(body.retention_days);
      if (![30, 90, 180, 365, 730].includes(days)) return json({ error: "Choose a supported retention period" }, 400);
      const { error } = await admin.from("profile_retention_settings").upsert({
        profile_id: profileId, therapist_metrics_retention_days: days, updated_by: user.id, updated_at: new Date().toISOString()
      }, { onConflict: "profile_id" });
      if (error) return json({ error: "Could not update retention setting" }, 500);
      return json({ retention_days: days, note: "The new retention period is applied by the scheduled maintenance job." });
    }
  }

  if (body.action === "request_ownership_transfer") {
    const profileId = typeof body.profile_id === "string" ? body.profile_id : "";
    const targetId = typeof body.user_id === "string" ? body.user_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(profileId) || !/^[0-9a-f-]{36}$/i.test(targetId) || targetId === user.id)
      return json({ error: "Invalid profile or member" }, 400);
    const { data: owner } = await admin.from("profile_members").select("role")
      .eq("profile_id", profileId).eq("user_id", user.id).maybeSingle();
    if (owner?.role !== "owner") return json({ error: "Only the current owner can transfer ownership" }, 403);
    const { data: target } = await admin.from("profile_members").select("role")
      .eq("profile_id", profileId).eq("user_id", targetId).maybeSingle();
    if (target?.role !== "caregiver") return json({ error: "The new owner must already be a caregiver on this profile" }, 409);
    const { data: deletion } = await admin.from("profile_deletion_requests").select("id")
      .eq("profile_id", profileId).eq("status", "pending").maybeSingle();
    if (deletion) return json({ error: "Cancel the pending profile deletion before transferring ownership" }, 409);
    await admin.from("profile_ownership_transfers").update({ status: "expired" })
      .eq("profile_id", profileId).eq("status", "pending").lte("expires_at", new Date().toISOString());
    const { data: transfer, error } = await admin.from("profile_ownership_transfers")
      .insert({ profile_id: profileId, from_user_id: user.id, to_user_id: targetId })
      .select("id,status,expires_at").single();
    if (error || !transfer) return json({ error: "Could not create ownership transfer request" }, 500);
    return json({ transfer });
  }

  if (body.action === "list_outgoing_transfers") {
    const { data: transfers, error } = await admin.from("profile_ownership_transfers")
      .select("id,profile_id,to_user_id,created_at,expires_at")
      .eq("from_user_id", user.id).eq("status", "pending").gt("expires_at", new Date().toISOString());
    if (error) return json({ error: "Could not load outgoing ownership requests" }, 500);
    const enriched = await Promise.all((transfers ?? []).map(async (transfer) => {
      const [{ data: profile }, { data: target }] = await Promise.all([
        admin.from("learner_profiles").select("display_name").eq("id", transfer.profile_id).maybeSingle(),
        admin.auth.admin.getUserById(transfer.to_user_id ?? "")
      ]);
      return { id: transfer.id, profile_name: profile?.display_name ?? "", to_email: target.user?.email ?? "", expires_at: transfer.expires_at };
    }));
    return json({ transfers: enriched });
  }

  if (body.action === "list_incoming_transfers") {
    const { data: transfers, error } = await admin.from("profile_ownership_transfers")
      .select("id,profile_id,from_user_id,created_at,expires_at")
      .eq("to_user_id", user.id).eq("status", "pending").gt("expires_at", new Date().toISOString());
    if (error) return json({ error: "Could not load ownership invitations" }, 500);
    const enriched = await Promise.all((transfers ?? []).map(async (transfer) => {
      const [{ data: profile }, { data: source }] = await Promise.all([
        admin.from("learner_profiles").select("display_name").eq("id", transfer.profile_id).maybeSingle(),
        admin.auth.admin.getUserById(transfer.from_user_id ?? "")
      ]);
      return { id: transfer.id, profile_id: transfer.profile_id, profile_name: profile?.display_name ?? "",
        from_email: source.user?.email ?? "", expires_at: transfer.expires_at };
    }));
    return json({ transfers: enriched });
  }

  if (body.action === "accept_ownership_transfer") {
    const transferId = typeof body.transfer_id === "string" ? body.transfer_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(transferId)) return json({ error: "Invalid transfer" }, 400);
    const { data: pending } = await admin.from("profile_ownership_transfers").select("id,expires_at")
      .eq("id", transferId).eq("to_user_id", user.id).eq("status", "pending").maybeSingle();
    if (!pending) return json({ error: "Transfer is no longer pending" }, 409);
    if (new Date(pending.expires_at).getTime() <= Date.now()) {
      await admin.from("profile_ownership_transfers").update({ status: "expired" }).eq("id", transferId).eq("status", "pending");
      return json({ error: "Transfer invitation has expired" }, 409);
    }
    const { data: result, error } = await admin.rpc("complete_profile_ownership_transfer", {
      transfer_id: transferId, accepting_user_id: user.id
    });
    if (error) return json({ error: "Could not accept this ownership transfer. It may have expired or the profile may no longer be eligible." }, 409);
    return json({ accepted: true, profile_id: result.profile_id });
  }

  if (body.action === "cancel_ownership_transfer") {
    const transferId = typeof body.transfer_id === "string" ? body.transfer_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(transferId)) return json({ error: "Invalid transfer" }, 400);
    const { data: transfer, error } = await admin.from("profile_ownership_transfers").update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", transferId).eq("from_user_id", user.id).eq("status", "pending")
      .select("id").maybeSingle();
    if (error) return json({ error: "Could not cancel ownership transfer" }, 500);
    if (!transfer) return json({ error: "Transfer is no longer cancellable" }, 409);
    return json({ cancelled: true });
  }

  return json({ error: "Unknown action" }, 400);
});

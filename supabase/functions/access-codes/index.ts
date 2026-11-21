// Supabase Edge Function: access-codes
// Handles server-authoritative entitlement status, atomic code redemption,
// and admin-only single/group access code creation, usage tracking, and revocation.
// Required secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, APP_SITE_URL.
// Optional configuration: ACCESS_ADMIN_EMAILS (comma-separated lowercase emails), ENTITLEMENT_SIGNING_SECRET.
import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_SITE_URL") ?? "null",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Unambiguous uppercase alphabet (excludes 0, O, 1, I, L) for accessibility.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const RUNTIME_SIGNING_FALLBACK = crypto.getRandomValues(new Uint8Array(32));

function generateReadableCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    part2 += CODE_ALPHABET[bytes[i + 4] % CODE_ALPHABET.length];
  }
  return `POG-${part1}-${part2}`;
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signOfflineLease(payload: Record<string, unknown>): Promise<string> {
  const secretRaw = Deno.env.get("ENTITLEMENT_SIGNING_SECRET");
  const keyBytes = secretRaw
    ? new TextEncoder().encode(secretRaw)
    : RUNTIME_SIGNING_FALLBACK;
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bodyB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(bodyB64));
  const sigB64 = toBase64Url(new Uint8Array(sigBuf));
  return `${bodyB64}.${sigB64}`;
}

function parseOptionalFutureIso(raw: unknown): { ok: true; value: string | null } | { ok: false } {
  if (raw == null || raw === "") return { ok: true, value: null };
  if (typeof raw !== "string") return { ok: false };
  const ms = Date.parse(raw);
  if (!Number.isFinite(ms) || ms <= Date.now()) return { ok: false };
  return { ok: true, value: new Date(ms).toISOString() };
}

async function isAdminUser(admin: ReturnType<typeof createClient>, user: { id: string; email?: string; email_confirmed_at?: string }): Promise<boolean> {
  const { data: row } = await admin
    .from("access_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (row) return true;

  const envList = (Deno.env.get("ACCESS_ADMIN_EMAILS") ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  if (envList.length && user.email && user.email_confirmed_at) {
    return envList.includes(user.email.trim().toLowerCase());
  }
  return false;
}

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

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Invalid session" }, 401);
  const user = userData.user;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (body.action === "status") {
    const [{ data: ent }, { data: redemptions }, adminFlag] = await Promise.all([
      admin.from("user_entitlements")
        .select("tier,source,active_until,updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin.from("code_redemptions")
        .select("id,redeemed_at,expires_at,access_codes(code,code_type,duration_days)")
        .eq("user_id", user.id)
        .order("redeemed_at", { ascending: false })
        .limit(20),
      isAdminUser(admin, user),
    ]);

    const nowMs = Date.now();
    const activeMs = ent?.active_until ? Date.parse(ent.active_until) : 0;
    const isFull = Boolean(ent && ent.tier === "full" && Number.isFinite(activeMs) && activeMs > nowMs);
    const tier = isFull ? "full" : "free";
    const source = isFull ? ent!.source : "free";
    const activeUntil = ent?.active_until ?? null;

    const offlineLease = await signOfflineLease({
      v: 1,
      uid: user.id,
      tier,
      source,
      exp: isFull ? activeUntil : null,
      iat: new Date(nowMs).toISOString(),
    });

    return json({
      tier,
      source,
      active_until: activeUntil,
      server_now: new Date(nowMs).toISOString(),
      is_admin: adminFlag,
      redemptions: redemptions ?? [],
      offline_lease: offlineLease,
    });
  }

  if (body.action === "redeem") {
    const rawCode = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!/^[A-Z0-9-]{6,32}$/.test(rawCode)) {
      return json({ error: "Invalid access code format", code: "invalid_code" }, 400);
    }

    const { data, error } = await admin.rpc("redeem_access_code", {
      p_user_id: user.id,
      p_code: rawCode,
      p_user_email: user.email ?? null,
    });

    if (error) {
      const msg = error.message || "Could not redeem code";
      const codeMap: Record<string, { status: number; errCode: string; label: string }> = {
        invalid_code: { status: 404, errCode: "invalid_code", label: "Access code not found" },
        code_revoked: { status: 410, errCode: "code_revoked", label: "This access code has been deactivated" },
        code_expired: { status: 410, errCode: "code_expired", label: "This access code has expired" },
        already_redeemed: { status: 409, errCode: "already_redeemed", label: "You have already redeemed this code" },
        code_exhausted: { status: 409, errCode: "code_exhausted", label: "This code has reached its maximum number of users" },
      };
      const matched = Object.keys(codeMap).find((k) => msg.includes(k));
      if (matched) {
        return json({ error: codeMap[matched].label, code: codeMap[matched].errCode }, codeMap[matched].status);
      }
      return json({ error: "Could not redeem access code" }, 400);
    }

    return json(data);
  }

  /* ---------- Admin-only code issuance, tracking, and revocation ---------- */
  const adminOk = await isAdminUser(admin, user);
  if (!adminOk) return json({ error: "Admin access required" }, 403);

  if (body.action === "admin_create") {
    const codeType = body.code_type === "group" ? "group" : (body.code_type === "single" ? "single" : "");
    if (!codeType) return json({ error: "code_type must be 'single' or 'group'" }, 400);

    const durationDays = Number(body.duration_days);
    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650) {
      return json({ error: "duration_days must be an integer between 1 and 3650" }, 400);
    }

    let maxUses: number | null = 1;
    if (codeType === "group") {
      if (body.uncapped === true) {
        maxUses = null;
      } else {
        const parsedMax = Number(body.max_uses);
        if (!Number.isInteger(parsedMax) || parsedMax < 2 || parsedMax > 10000) {
          return json({ error: "Group codes must set max_uses between 2 and 10000 (or uncapped: true)" }, 400);
        }
        maxUses = parsedMax;
      }
    }

    const customCode = typeof body.custom_code === "string" ? body.custom_code.trim().toUpperCase() : "";
    if (customCode && !/^[A-Z0-9-]{6,32}$/.test(customCode)) {
      return json({ error: "custom_code must be 6-32 alphanumeric/hyphen characters" }, 400);
    }

    const rawCount = body.count == null ? 1 : Number(body.count);
    const count = customCode ? 1 : rawCount;
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      return json({ error: "count must be an integer between 1 and 50" }, 400);
    }

    const redeemBy = parseOptionalFutureIso(body.redeem_by);
    const fixedExpires = parseOptionalFutureIso(body.fixed_expires_at);
    if (!redeemBy.ok || !fixedExpires.ok) {
      return json({ error: "Expiration dates must be valid future ISO timestamps" }, 400);
    }

    const note = typeof body.recipient_note === "string" ? body.recipient_note.trim().slice(0, 200) : "";

    const rows = [];
    const seen = new Set<string>();
    for (let i = 0; i < count; i++) {
      let c = customCode || generateReadableCode();
      while (!customCode && seen.has(c)) c = generateReadableCode();
      seen.add(c);
      rows.push({
        code: c,
        code_type: codeType,
        max_uses: maxUses,
        duration_days: durationDays,
        redeem_by: redeemBy.value,
        fixed_expires_at: fixedExpires.value,
        scope: "full_app",
        recipient_note: note,
        created_by: user.id,
      });
    }

    const { data: inserted, error: insertError } = await admin
      .from("access_codes")
      .insert(rows)
      .select("id,code,code_type,max_uses,used_count,duration_days,redeem_by,fixed_expires_at,recipient_note,revoked,created_at");

    if (insertError) {
      const conflict = insertError.code === "23505";
      return json({ error: conflict ? "Code already exists" : "Could not create access code(s)" }, conflict ? 409 : 400);
    }

    return json({ ok: true, codes: inserted ?? [] }, 201);
  }

  if (body.action === "admin_list") {
    const { data: codes, error: listError } = await admin
      .from("access_codes")
      .select("id,code,code_type,max_uses,used_count,duration_days,redeem_by,fixed_expires_at,recipient_note,revoked,revoked_at,created_at,code_redemptions(id,user_id,user_email,redeemed_at,expires_at)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (listError) return json({ error: "Could not load access codes" }, 500);
    return json({ ok: true, codes: codes ?? [] });
  }

  if (body.action === "admin_revoke") {
    const codeId = typeof body.code_id === "string" ? body.code_id.trim() : "";
    if (!/^[0-9a-f-]{36}$/i.test(codeId)) {
      return json({ error: "Valid code_id is required" }, 400);
    }
    const revokeActive = body.revoke_active_grants === true;

    const { data, error } = await admin.rpc("revoke_access_code_grant", {
      p_code_id: codeId,
      p_revoke_active_grants: revokeActive,
    });
    if (error) {
      return json({ error: error.message?.includes("code_not_found") ? "Code not found" : "Could not revoke code" }, 404);
    }
    return json(data);
  }

  return json({ error: "Unknown action" }, 400);
});

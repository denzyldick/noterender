/**
 * noterender API — Cloudflare Worker + D1
 * Drop-in replacement for the Symfony backend (noterender-api) so the app
 * can run entirely on Cloudflare without a VPS/backend.
 *
 * Endpoints (mirror the Symfony controllers 1:1):
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   POST /api/logout
 *   GET  /api/me
 *   GET/POST /api/projects
 *   PUT/DELETE /api/projects/:id
 *   POST /api/shoutout
 *   GET  /api/shoutout/pending
 *   PUT  /api/shoutout/:id/approve
 *   GET  /api/shoutout/approved
 *   POST /api/checkout
 *   POST /api/stripe/webhook
 *   POST /api/waitlist
 *
 * Auth: opaque bearer token; only its sha256 hash is stored (same as Symfony).
 */

export interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_MONTHLY?: string;
  STRIPE_PRICE_YEARLY?: string;
  APP_URL?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

async function readJson(request: Request): Promise<Record<string, any>> {
  try {
    return (await request.json()) as Record<string, any>;
  } catch (_) {
    return {};
  }
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string): Promise<string> {
  // PBKDF2-SHA256, 100k iterations, 16-byte salt. Format: pbkdf2$<salt>$<hash>
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as unknown as BufferSource, iterations: 100_000 },
    keyMaterial,
    256,
  );
  const hash = [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const saltHex = [...salt].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2$${saltHex}$${hash}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [algo, saltHex, hashHex] = stored.split("$");
    if (algo !== "pbkdf2") return false;
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: salt as unknown as BufferSource, iterations: 100_000 },
      keyMaterial,
      256,
    );
    const derived = [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
    return derived === hashHex;
  } catch (_) {
    return false;
  }
}

async function getUserFromRequest(env: Env, request: Request): Promise<any | null> {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const hash = await sha256Hex(token);
  const row = await env.DB.prepare("SELECT * FROM users WHERE api_token_hash = ?")
    .bind(hash)
    .first();
  return row || null;
}

// Simple in-memory rate limiter (per-isolate). Good enough for a Worker;
// use Cloudflare Rate Limiting for stricter cross-edge enforcement.
const buckets = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  let b = buckets.get(ip);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(ip, b);
  }
  b.count++;
  return b.count <= limit;
}

function clientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0].trim() ||
    "unknown"
  );
}

// Stripe signature verification (t=...,v1=... HMAC-SHA256 over timestamp.payload)
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
): Promise<boolean> {
  const parts = sigHeader.split(",").map((p) => p.trim());
  let timestamp = "";
  let signature = "";
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k === "t") timestamp = v;
    if (k === "v1") signature = v;
  }
  if (!timestamp || !signature) return false;
  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return expected === signature;
}

// Stripe API call helper (form-encoded, like the PHP SDK).
async function stripeApi<T>(env: Env, path: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });
  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch (_) {
    body = { error: { message: text } };
  }
  if (!res.ok) {
    throw new Error(body?.error?.message || `Stripe error ${res.status}`);
  }
  return body as T;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function handleRegister(env: Env, request: Request): Promise<Response> {
  const ip = clientIp(request);
  if (!checkRate(ip, 5, 15 * 60 * 1000)) {
    return error("Too many registration attempts. Try again later.", 429);
  }
  const data = await readJson(request);
  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return error("Valid email required");
  }
  if (password.length < 8) {
    return error("Password must be at least 8 characters");
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first();
  if (existing) return error("Email already registered", 409);

  const passwordHash = await hashPassword(password);
  const plainToken = randomToken();
  const tokenHash = await sha256Hex(plainToken);

  const result = await env.DB.prepare(
    `INSERT INTO users (email, password_hash, api_token_hash) VALUES (?, ?, ?)`,
  )
    .bind(email, passwordHash, tokenHash)
    .run();

  const id = result.meta.last_row_id;
  return json(
    { token: plainToken, user: { id: Number(id), email } },
    201,
  );
}

async function handleLogin(env: Env, request: Request): Promise<Response> {
  const ip = clientIp(request);
  if (!checkRate(ip, 10, 60 * 1000)) {
    return error("Too many login attempts. Try again later.", 429);
  }
  const data = await readJson(request);
  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "");

  const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first();
  if (!user || !(await verifyPassword(password, String(user.password_hash)))) {
    return error("Invalid credentials", 401);
  }

  const plainToken = randomToken();
  const tokenHash = await sha256Hex(plainToken);
  await env.DB.prepare("UPDATE users SET api_token_hash = ? WHERE id = ?")
    .bind(tokenHash, user.id)
    .run();

  return json({ token: plainToken, user: { id: user.id, email: user.email } });
}

async function handleLogout(env: Env, request: Request): Promise<Response> {
  const user = await getUserFromRequest(env, request);
  if (user) {
    await env.DB.prepare("UPDATE users SET api_token_hash = NULL WHERE id = ?")
      .bind(user.id)
      .run();
  }
  return json({ success: true });
}

async function handleMe(env: Env, request: Request): Promise<Response> {
  const user = await getUserFromRequest(env, request);
  if (!user) return error("Not authenticated", 401);
  return json({
    id: user.id,
    email: user.email,
    subscriptionActive: user.subscription_status === "active",
    subscriptionStatus: user.subscription_status,
    subscriptionPlan: user.subscription_plan,
  });
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

const MAX_PROJECT_SQL_CHARS = 5_000_000;

function tooLarge(encoded: string): boolean {
  return encoded.length > MAX_PROJECT_SQL_CHARS;
}

async function listProjects(env: Env, user: any): Promise<Response> {
  const rows = await env.DB.prepare(
    `SELECT id, name, data, created_at, updated_at
     FROM projects WHERE user_id = ? ORDER BY updated_at DESC`,
  )
    .bind(user.id)
    .all();
  const projects = rows.results.map((r) => {
    let data: any = null;
    try {
      data = JSON.parse(String(r.data));
    } catch (_) {}
    return {
      id: r.id,
      name: r.name,
      data,
      createdAt: new Date(r.created_at + "Z").toISOString().replace(/\.000Z$/, "Z"),
      updatedAt: new Date(r.updated_at + "Z").toISOString().replace(/\.000Z$/, "Z"),
    };
  });
  return json(projects);
}

async function createProject(env: Env, user: any, request: Request): Promise<Response> {
  const data = await readJson(request);
  const encoded = JSON.stringify(data.data ?? {});
  if (tooLarge(encoded)) return error("Project data too large", 413);
  const name = String(data.name || "Untitled");
  const result = await env.DB.prepare(
    `INSERT INTO projects (user_id, name, data) VALUES (?, ?, ?)`,
  )
    .bind(user.id, name, encoded)
    .run();
  return json({ id: Number(result.meta.last_row_id) }, 201);
}

async function updateProject(env: Env, user: any, id: string, request: Request): Promise<Response> {
  const project = await env.DB.prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?")
    .bind(id, user.id)
    .first();
  if (!project) return error("Not found", 404);

  const data = await readJson(request);
  if (data.name !== undefined && data.data === undefined) {
    await env.DB.prepare("UPDATE projects SET name = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(String(data.name), id)
      .run();
    return json({ success: true });
  }
  if (data.data !== undefined) {
    const encoded = JSON.stringify(data.data);
    if (tooLarge(encoded)) return error("Project data too large", 413);
    await env.DB.prepare(
      "UPDATE projects SET name = ?, data = ?, updated_at = datetime('now') WHERE id = ?",
    )
      .bind(data.name !== undefined ? String(data.name) : project.name, encoded, id)
      .run();
    return json({ success: true });
  }
  return json({ success: true });
}

async function deleteProject(env: Env, user: any, id: string): Promise<Response> {
  const project = await env.DB.prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?")
    .bind(id, user.id)
    .first();
  if (!project) return error("Not found", 404);
  await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
  return json({ success: true });
}

// ---------------------------------------------------------------------------
// Shoutouts
// ---------------------------------------------------------------------------

async function submitShoutout(env: Env, request: Request): Promise<Response> {
  const data = await readJson(request);
  const clubId = String(data.club_id ?? "");
  const name = String(data.name ?? "").trim();
  const message = String(data.message ?? "").trim();

  if (!clubId || !name || !message) {
    return error("club_id, name, and message required");
  }
  if (name.length > 255 || message.length > 500) {
    return error("name (max 255) or message (max 500) too long");
  }

  const club = await env.DB.prepare("SELECT id FROM users WHERE id = ?")
    .bind(clubId)
    .first();
  if (!club) return error("Club not found", 404);

  const result = await env.DB.prepare(
    `INSERT INTO shoutouts (club_id, name, message) VALUES (?, ?, ?)`,
  )
    .bind(clubId, name, message)
    .run();
  return json({ id: Number(result.meta.last_row_id) }, 201);
}

function shoutoutToJson(r: any): Record<string, unknown> {
  return {
    id: r.id,
    name: r.name,
    message: r.message,
    createdAt: new Date(r.created_at + "Z").toISOString().replace(/\.000Z$/, "Z"),
  };
}

async function pendingShoutouts(env: Env, user: any): Promise<Response> {
  const rows = await env.DB.prepare(
    `SELECT id, name, message, created_at FROM shoutouts
     WHERE club_id = ? AND status = 'pending' ORDER BY created_at ASC`,
  )
    .bind(user.id)
    .all();
  return json(rows.results.map(shoutoutToJson));
}

async function approveShoutout(env: Env, user: any, id: string, request: Request): Promise<Response> {
  const shoutout = await env.DB.prepare("SELECT id FROM shoutouts WHERE id = ? AND club_id = ?")
    .bind(id, user.id)
    .first();
  if (!shoutout) return error("Not found", 404);

  const data = await readJson(request);
  const status = data.status ?? "approved";
  if (status !== "approved" && status !== "rejected") {
    return error("Invalid status");
  }
  await env.DB.prepare("UPDATE shoutouts SET status = ? WHERE id = ?")
    .bind(status, id)
    .run();
  return json({ success: true });
}

async function approvedShoutouts(env: Env, url: URL): Promise<Response> {
  const clubId = url.searchParams.get("club_id");
  if (!clubId) return error("club_id required");
  const since = url.searchParams.get("since");

  let sql = `SELECT id, name, message, created_at FROM shoutouts
             WHERE club_id = ? AND status = 'approved'`;
  const bindings: string[] = [clubId];
  if (since) {
    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) return error("Invalid since parameter");
    sql += ` AND created_at > ?`;
    bindings.push(sinceDate.toISOString().slice(0, 19).replace("T", " "));
  }
  sql += ` ORDER BY created_at ASC`;

  const rows = await env.DB.prepare(sql).bind(...bindings).all();
  return json(rows.results.map(shoutoutToJson));
}

// ---------------------------------------------------------------------------
// Stripe checkout + webhook
// ---------------------------------------------------------------------------

function isStripeConfigured(env: Env): boolean {
  return !!(
    env.STRIPE_SECRET_KEY &&
    !env.STRIPE_SECRET_KEY.startsWith("sk_test_***") &&
    env.STRIPE_PRICE_MONTHLY &&
    env.STRIPE_PRICE_YEARLY
  );
}

async function handleCheckout(env: Env, user: any, request: Request): Promise<Response> {
  if (!isStripeConfigured(env)) {
    return error("Checkout is not configured yet.", 503);
  }
  const data = await readJson(request);
  const plan = data.plan || "monthly";
  const priceIds: Record<string, string> = {
    monthly: env.STRIPE_PRICE_MONTHLY!,
    yearly: env.STRIPE_PRICE_YEARLY!,
  };
  if (!priceIds[plan]) return error("Invalid plan");
  if (!user) return error("Authentication required", 401);

  const appUrl = (env.APP_URL || "https://noterender.pages.dev").replace(/\/$/, "");
  const params: Record<string, string> = {
    mode: "subscription",
    "line_items[0][price]": priceIds[plan],
    "line_items[0][quantity]": "1",
    success_url: `${appUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: appUrl,
    "metadata[user_id]": String(user.id),
  };
  if (user.stripe_customer_id) {
    params["customer"] = user.stripe_customer_id;
  } else {
    params["customer_email"] = user.email;
  }

  try {
    const session = await stripeApi<any>(env, "/checkout/sessions", params);
    return json({ id: session.id, url: session.url });
  } catch (e: any) {
    return error("Payment processing failed. Please try again.", 500);
  }
}

async function handleWebhook(env: Env, request: Request): Promise<Response> {
  if (!env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY.startsWith("sk_test_***") || !env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_...")) {
    return error("Webhook not configured", 503);
  }
  const payload = await request.text();
  const sig = request.headers.get("Stripe-Signature");
  if (!sig) return error("Missing signature", 400);

  const valid = await verifyStripeSignature(payload, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return error("Invalid signature", 400);

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch (_) {
    return error("Invalid payload", 400);
  }

  const type: string = event.type || "";
  switch (type) {
    case "checkout.session.completed":
      await onCheckoutCompleted(env, event.data.object);
      break;
    case "customer.subscription.updated":
      await onSubscriptionUpdated(env, event.data.object);
      break;
    case "customer.subscription.deleted":
      await onSubscriptionDeleted(env, event.data.object);
      break;
    default:
      break;
  }
  return json({ received: true });
}

async function onCheckoutCompleted(env: Env, session: any): Promise<void> {
  const userId = session?.metadata?.user_id;
  if (!userId) return;
  const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  if (!user) return;
  const plan = resolvePlanFromPrice(env, session?.line_items?.data?.[0]?.price?.id);
  await env.DB.prepare(
    `UPDATE users SET stripe_customer_id = ?, stripe_subscription_id = ?, subscription_status = 'active', subscription_plan = ? WHERE id = ?`,
  )
    .bind(session.customer ?? user.stripe_customer_id, session.subscription ?? user.stripe_subscription_id, plan, user.id)
    .run();
}

async function onSubscriptionUpdated(env: Env, sub: any): Promise<void> {
  const user = await findUserBySubscription(env, sub.id, sub.customer);
  if (!user) return;
  const status = sub.status || "unknown";
  const canonical = ["active", "trialing", "past_due"].includes(status)
    ? "active"
    : status === "canceled"
      ? "canceled"
      : "inactive";
  const plan = resolvePlanFromPrice(env, sub?.items?.data?.[0]?.price?.id);
  await env.DB.prepare(
    `UPDATE users SET stripe_subscription_id = ?, stripe_customer_id = ?, subscription_status = ?, subscription_plan = ? WHERE id = ?`,
  )
    .bind(sub.id ?? user.stripe_subscription_id, sub.customer ?? user.stripe_customer_id, canonical, plan, user.id)
    .run();
}

async function onSubscriptionDeleted(env: Env, sub: any): Promise<void> {
  const user = await findUserBySubscription(env, sub.id, sub.customer);
  if (!user) return;
  await env.DB.prepare(`UPDATE users SET subscription_status = 'canceled' WHERE id = ?`)
    .bind(user.id)
    .run();
}

function resolvePlanFromPrice(env: Env, priceId?: string | null): string | null {
  if (!priceId) return null;
  if (priceId === env.STRIPE_PRICE_MONTHLY) return "monthly";
  if (priceId === env.STRIPE_PRICE_YEARLY) return "yearly";
  return null;
}

async function findUserBySubscription(env: Env, subId?: string | null, customerId?: string | null): Promise<any | null> {
  if (subId) {
    const bySub = await env.DB.prepare("SELECT * FROM users WHERE stripe_subscription_id = ?")
      .bind(subId)
      .first();
    if (bySub) return bySub;
  }
  if (customerId) {
    const byCustomer = await env.DB.prepare("SELECT * FROM users WHERE stripe_customer_id = ?")
      .bind(customerId)
      .first();
    if (byCustomer) return byCustomer;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------

async function handleWaitlist(env: Env, request: Request): Promise<Response> {
  const data = await readJson(request);
  const email = String(data.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return error("Invalid email address");
  }
  const existing = await env.DB.prepare("SELECT id FROM waitlist_entries WHERE email = ?")
    .bind(email)
    .first();
  if (existing) return json({ success: true, message: "Already on waitlist" });
  await env.DB.prepare("INSERT INTO waitlist_entries (email) VALUES (?)").bind(email).run();
  return json({ success: true });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = request.headers.get("Origin") || "*";

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const corsHeaders = { "Access-Control-Allow-Origin": origin };
    const respond = async (r: Response): Promise<Response> => {
      for (const [k, v] of Object.entries(corsHeaders)) {
        r.headers.set(k, v);
      }
      return r;
    };

    try {
      let res: Response | null = null;

      // Auth
      if (method === "POST" && path === "/api/auth/register") res = await handleRegister(env, request);
      else if (method === "POST" && path === "/api/auth/login") res = await handleLogin(env, request);
      else if (method === "POST" && path === "/api/logout") res = await handleLogout(env, request);
      else if (method === "GET" && path === "/api/me") res = await handleMe(env, request);

      // Projects
      else if (method === "GET" && path === "/api/projects") {
        const user = await getUserFromRequest(env, request);
        if (!user) res = error("Not authenticated", 401);
        else res = await listProjects(env, user);
      } else if (method === "POST" && path === "/api/projects") {
        const user = await getUserFromRequest(env, request);
        if (!user) res = error("Not authenticated", 401);
        else res = await createProject(env, user, request);
      } else if ((method === "PUT" || method === "DELETE") && /^\/api\/projects\/\d+$/.test(path)) {
        const user = await getUserFromRequest(env, request);
        if (!user) res = error("Not authenticated", 401);
        else {
          const id = path.split("/").pop()!;
          res = method === "PUT" ? await updateProject(env, user, id, request) : await deleteProject(env, user, id);
        }
      }

      // Shoutouts (public submit/approved; auth for pending/approve)
      else if (method === "POST" && path === "/api/shoutout") {
        res = await submitShoutout(env, request);
      } else if (method === "GET" && path === "/api/shoutout/pending") {
        const user = await getUserFromRequest(env, request);
        if (!user) res = error("Not authenticated", 401);
        else res = await pendingShoutouts(env, user);
      } else if (method === "PUT" && /^\/api\/shoutout\/\d+\/approve$/.test(path)) {
        const user = await getUserFromRequest(env, request);
        if (!user) res = error("Not authenticated", 401);
        else res = await approveShoutout(env, user, path.split("/")[3], request);
      } else if (method === "GET" && path === "/api/shoutout/approved") {
        res = await approvedShoutouts(env, url);
      }

      // Stripe
      else if (method === "POST" && path === "/api/checkout") {
        const user = await getUserFromRequest(env, request);
        res = await handleCheckout(env, user, request);
      } else if (method === "POST" && path === "/api/stripe/webhook") {
        res = await handleWebhook(env, request);
      }

      // Waitlist
      else if (method === "POST" && path === "/api/waitlist") {
        res = await handleWaitlist(env, request);
      }

      if (!res) {
        if (path.startsWith("/api/")) res = error("Not found", 404);
        else res = error("Not found", 404);
      }
      return await respond(res);
    } catch (e: any) {
      return await respond(
        json({ error: "Internal server error" }, 500),
      );
    }
  },
};
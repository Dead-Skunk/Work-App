const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

const toBase64Url = (buffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const signHmacSha256 = async (secret, payload) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(signature);
};

const createToken = async (secret, claims) => {
  const header = toBase64Url(
    new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  );
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(claims)));
  const unsigned = `${header}.${payload}`;
  const signature = await signHmacSha256(secret, unsigned);
  return `${unsigned}.${signature}`;
};

const parseAllowedIds = (raw) => {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter(Boolean)
  );
};

export async function onRequestPost({ request, env }) {
  const secret = env.AUTH_SECRET || "";
  if (!secret) {
    return jsonResponse({ error: "Missing AUTH_SECRET" }, 500);
  }

  let body = null;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const employeeId = String(body?.employeeId || "").trim();
  if (!employeeId) {
    return jsonResponse({ error: "employeeId required" }, 400);
  }

  const allowed = parseAllowedIds(env.EMPLOYEE_IDS || "");
  if (allowed.size > 0 && !allowed.has(employeeId)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const ttlSeconds = Number(env.AUTH_TTL_SECONDS || 3600);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const claims = {
    sub: employeeId,
    iat: nowSeconds,
    exp: nowSeconds + Math.max(300, ttlSeconds),
  };

  const token = await createToken(secret, claims);
  return jsonResponse({ token, expiresIn: ttlSeconds });
}

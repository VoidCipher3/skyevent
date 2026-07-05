const THROTTLE_SECONDS = 180;

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...cors(),
      "Content-Type": "application/json",
    },
  });
}

// timing-safe compare
function timingSafeEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export default {
  async fetch(request, env, ctx) {
    console.log("REQ:", request.method, request.url);

    // =====================
    // OPTIONS (CORS)
    // =====================
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors(),
      });
    }

    // =====================
    // Not POST → let the static assets (docs/) handle it.
    // This covers GET (viewing the actual site: tw/cn/en, css, js, json data)
    // as well as HEAD, and anything else that isn't our trigger API.
    // =====================
    if (request.method !== "POST") {
      return env.ASSETS.fetch(request);
    }

    // =====================
    // parse body
    // =====================
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ ok: false, error: "bad_json" }, 400);
    }

    const password = String(body?.password || "");
    const expected = String(env?.REFRESH_PASSWORD || "");

    if (!timingSafeEqual(password, expected)) {
      return json({ ok: false, error: "wrong_password" }, 401);
    }

    // =====================
    // KV throttle (safe)
    // =====================
    const now = Date.now();

    let last = null;
    try {
      last = await env?.REFRESH_KV?.get("last_trigger");
    } catch (e) {
      console.log("KV error:", e);
    }

    if (last && now - Number(last) < THROTTLE_SECONDS * 1000) {
      const retry_after = Math.ceil(
        (THROTTLE_SECONDS * 1000 - (now - Number(last))) / 1000
      );

      return json({
        ok: false,
        error: "too_soon",
        retry_after,
      }, 429);
    }

    // =====================
    // GitHub dispatch
    // =====================
    const url =
      `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}` +
      `/actions/workflows/${env.GH_WORKFLOW_FILE}/dispatches`;

    let ghResp;

    try {
      ghResp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GH_TOKEN}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "sky-worker",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: env.GH_REF || "main",
        }),
      });
    } catch (e) {
      return json({
        ok: false,
        error: "github_network_error",
      }, 502);
    }

    if (ghResp.status !== 204) {
      const detail = await ghResp.text().catch(() => "");
      return json({
        ok: false,
        error: "github_dispatch_failed",
        status: ghResp.status,
        detail,
      }, 502);
    }

    // =====================
    // save throttle
    // =====================
    try {
      await env?.REFRESH_KV?.put("last_trigger", String(now));
    } catch (e) {
      console.log("KV write error:", e);
    }

    return json({
      ok: true,
      triggered_at: now,
    });
  },
};
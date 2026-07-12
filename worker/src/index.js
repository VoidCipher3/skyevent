const THROTTLE_SECONDS = 180;

// 字幕代理只允許轉發這些主機／副檔名，避免被當成開放代理濫用
const SUBTITLE_ALLOWED_HOSTS = new Set(["video.cdn.thatgamecompany.com"]);
const SUBTITLE_ALLOWED_EXTENSIONS = [".vtt"];

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// GET /api/subtitle-proxy?url=<官方字幕網址>
// 取代 corsproxy.io：官方 CDN 的 .vtt 不帶 CORS header，瀏覽器沒辦法直接 fetch，
// 這裡由我們自己的 worker 代為抓取後補上 Access-Control-Allow-Origin。
async function handleSubtitleProxy(request) {
  const reqUrl = new URL(request.url);
  const target = reqUrl.searchParams.get("url");
  if (!target) {
    return new Response("missing url parameter", { status: 400, headers: cors() });
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return new Response("invalid url", { status: 400, headers: cors() });
  }

  if (targetUrl.protocol !== "https:" || !SUBTITLE_ALLOWED_HOSTS.has(targetUrl.hostname)) {
    return new Response("host not allowed", { status: 403, headers: cors() });
  }

  const lowerPath = targetUrl.pathname.toLowerCase();
  if (!SUBTITLE_ALLOWED_EXTENSIONS.some((ext) => lowerPath.endsWith(ext))) {
    return new Response("file type not allowed", { status: 403, headers: cors() });
  }

  let upstream;
  try {
    upstream = await fetch(targetUrl.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; skyevent-subtitle-proxy/1.0)" },
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
  } catch (e) {
    return new Response(`upstream fetch failed: ${e.message}\ntarget: ${targetUrl.toString()}`, {
      status: 502,
      headers: cors(),
    });
  }

  if (!upstream.ok) {
    return new Response(`upstream returned ${upstream.status}\ntarget: ${targetUrl.toString()}`, {
      status: upstream.status,
      headers: cors(),
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      ...cors(),
      "Content-Type": "text/vtt; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
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

// 觸發 GitHub Actions 的 workflow_dispatch，並做 KV 節流。
// 手動刷新按鈕（POST /）跟 Cron Trigger（每 30 分鐘）都走這個函式，
// 節流用同一把 KV key，避免使用者手動按刷新時剛好跟排程撞在一起重複觸發。
async function triggerGithubWorkflow(env) {
  const now = Date.now();

  let last = null;
  try {
    last = await env?.REFRESH_KV?.get("last_trigger");
  } catch (e) {
    console.log("KV error:", e);
  }

  if (last && now - Number(last) < THROTTLE_SECONDS * 1000) {
    const retry_after = Math.ceil((THROTTLE_SECONDS * 1000 - (now - Number(last))) / 1000);
    return { ok: false, error: "too_soon", retry_after, status: 429 };
  }

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
      body: JSON.stringify({ ref: env.GH_REF || "main" }),
    });
  } catch (e) {
    return { ok: false, error: "github_network_error", status: 502 };
  }

  if (ghResp.status !== 204) {
    const detail = await ghResp.text().catch(() => "");
    return { ok: false, error: "github_dispatch_failed", detail, status: ghResp.status, httpStatus: 502 };
  }

  try {
    await env?.REFRESH_KV?.put("last_trigger", String(now));
  } catch (e) {
    console.log("KV write error:", e);
  }

  return { ok: true, triggered_at: now, status: 200 };
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
    // GET /api/subtitle-proxy → 字幕 CORS 代理，取代 corsproxy.io
    // =====================
    const reqUrl = new URL(request.url);
    if (request.method === "GET" && reqUrl.pathname === "/api/subtitle-proxy") {
      return handleSubtitleProxy(request);
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
    // 觸發 GitHub Actions（含節流），跟 Cron Trigger 共用同一套邏輯
    // =====================
    const result = await triggerGithubWorkflow(env);

    if (!result.ok) {
      if (result.error === "too_soon") {
        return json({ ok: false, error: "too_soon", retry_after: result.retry_after }, 429);
      }
      return json({ ok: false, error: result.error, detail: result.detail }, result.httpStatus || 502);
    }

    return json({ ok: true, triggered_at: result.triggered_at });
  },

  // Cron Trigger：由 wrangler.toml 的 [triggers] 設定觸發時間（例如每 30 分鐘）。
  // 比起 GitHub 自己的 schedule: cron（官方說明本身就有 ±幾分鐘誤差），
  // Cloudflare 的 Cron Trigger 準時很多，這裡直接呼叫跟手動刷新一樣的觸發邏輯。
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      triggerGithubWorkflow(env).then((result) => {
        console.log("cron trigger result:", JSON.stringify(result));
      })
    );
  },
};
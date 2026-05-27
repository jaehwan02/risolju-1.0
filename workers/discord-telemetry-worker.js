const MAX_FIELD_LENGTH = 1000;
const MAX_CONTENT_LENGTH = 1800;

function getAllowedOrigins(env) {
  const rawOrigins = env.ALLOWED_ORIGINS || env.ALLOWED_ORIGIN || "https://jaehwan02.github.io";
  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin, allowedOrigins) {
  return !origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin);
}

function corsHeaders(origin, allowedOrigins) {
  const allowOrigin = isOriginAllowed(origin, allowedOrigins)
    ? origin || allowedOrigins[0] || "*"
    : allowedOrigins[0] || "https://jaehwan02.github.io";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function truncate(value, maxLength = MAX_FIELD_LENGTH) {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 20)}\n...[truncated]` : text;
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function formatLines(entries) {
  return entries
    .filter(([, value]) => hasValue(value))
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function getIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    request.headers.get("X-Real-IP") ||
    "unknown"
  );
}

function toHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashIp(ip, salt = "") {
  return hashValue(ip, salt, "unknown");
}

async function hashValue(value, salt = "", fallback = null) {
  if (!value || value === "unknown") return fallback;

  const data = new TextEncoder().encode(`${salt}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return `sha256:${toHex(new Uint8Array(digest))}`;
}

async function getRequestContext(request, env) {
  const cf = request.cf || {};
  const ip = getIp(request);
  return {
    ipHash: await hashIp(ip, env.IP_HASH_SALT),
    country: cf.country || null,
    region: cf.region || null,
    city: cf.city || null,
    postalCode: cf.postalCode || null,
    timezone: cf.timezone || null,
    latitude: cf.latitude || null,
    longitude: cf.longitude || null
  };
}

function getStoredEventType(event) {
  if (event.eventType === "analytics_event") {
    return event.analyticsEvent || "analytics_event";
  }
  return event.eventType || "unknown";
}

function shouldForwardToDiscord(event) {
  return [
    "chat_exchange",
    "chat_error",
    "user_prompt",
    "assistant_response",
    "assistant_error"
  ].includes(event.eventType);
}

function toNullableString(value) {
  return hasValue(value) ? String(value) : null;
}

function getMetadataJson(event) {
  if (!event.metadata || typeof event.metadata !== "object") return null;
  return truncate(JSON.stringify(event.metadata), 4000);
}

async function recordAnalyticsEvent(event, requestContext, env) {
  if (!env.ANALYTICS_DB) return;

  const client = event.client || {};
  const device = client.device || {};
  const visitorSalt = env.VISITOR_HASH_SALT || env.IP_HASH_SALT || "";
  const visitorHash = await hashValue(event.visitorId, visitorSalt);
  const sessionHash = await hashValue(event.sessionId, visitorSalt);

  await env.ANALYTICS_DB.prepare(
    `INSERT INTO analytics_events (
      event_type,
      visitor_hash,
      session_hash,
      ip_hash,
      exchange_id,
      model_id,
      model_repo,
      load_state,
      country,
      region,
      city,
      timezone,
      device_type,
      os,
      browser,
      page_url,
      referrer,
      metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      getStoredEventType(event),
      visitorHash,
      sessionHash,
      toNullableString(requestContext.ipHash),
      toNullableString(event.exchangeId),
      toNullableString(event.modelId),
      toNullableString(event.modelRepo),
      toNullableString(event.loadState),
      toNullableString(requestContext.country),
      toNullableString(requestContext.region),
      toNullableString(requestContext.city),
      toNullableString(requestContext.timezone),
      toNullableString(device.type),
      toNullableString(device.os),
      toNullableString(device.browser),
      toNullableString(client.url),
      toNullableString(client.referrer),
      getMetadataJson(event)
    )
    .run();
}

function field(name, value, inline = false) {
  const text = truncate(value);
  return text ? { name, value: text, inline } : null;
}

function buildDiscordPayload(event, requestContext) {
  const client = event.client || {};

  const titleMap = {
    chat_exchange: "대화 기록",
    chat_error: "생성 오류",
    user_prompt: "사용자 프롬프트",
    assistant_response: "대화 기록",
    assistant_error: "생성 오류"
  };
  const isErrorEvent = event.eventType === "chat_error" || event.eventType === "assistant_error";
  const title = titleMap[event.eventType] || "대화 기록";

  const eventSummary = formatLines([
    ["종류", isErrorEvent ? "오류" : "대화"],
    ["교환 ID", event.exchangeId],
    ["세션 ID", event.sessionId],
    ["모델", event.modelRepo || event.modelId],
    ["로드 상태", event.loadState]
  ]);

  const locationSummary = formatLines([
    ["IP 해시", requestContext.ipHash],
    ["도시", requestContext.city],
    ["지역", requestContext.region],
    ["국가", requestContext.country],
    ["우편번호", requestContext.postalCode],
    ["시간대", requestContext.timezone],
    [
      "좌표",
      hasValue(requestContext.latitude) && hasValue(requestContext.longitude)
        ? `${requestContext.latitude}, ${requestContext.longitude}`
        : ""
    ]
  ]);

  const pageSummary = formatLines([
    ["URL", client.url],
    ["이전 페이지", client.referrer || "없음"]
  ]);
  const device = client.device || {};
  const deviceSummary = formatLines([
    ["기기", device.type],
    ["OS", device.os],
    ["브라우저", device.browser]
  ]);

  const fields = [
    field("기록 요약", eventSummary),
    field("사용자 입력", event.prompt),
    field("리설주 응답", event.response),
    field("오류", event.error),
    field("기기/OS", deviceSummary),
    field("접속 위치", locationSummary),
    field("페이지", pageSummary)
  ].filter(Boolean);

  return {
    content: truncate(
      `${title} - ${event.prompt || event.exchangeId || "unknown"}`,
      MAX_CONTENT_LENGTH
    ),
    embeds: [
      {
        title,
        color: isErrorEvent ? 0xb9231a : 0x2179c9,
        timestamp: event.timestamp || new Date().toISOString(),
        fields
      }
    ]
  };
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin");
    const allowedOrigins = getAllowedOrigins(env);
    const headers = corsHeaders(origin, allowedOrigins);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers });
    }

    if (!isOriginAllowed(origin, allowedOrigins)) {
      return new Response("Forbidden", { status: 403, headers });
    }

    const contentLength = Number(request.headers.get("Content-Length") || "0");
    if (contentLength > 64_000) {
      return new Response("Payload too large", { status: 413, headers });
    }

    let event;
    try {
      event = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400, headers });
    }

    const requestContext = await getRequestContext(request, env);
    const analyticsWrite = recordAnalyticsEvent(event, requestContext, env).catch((error) => {
      console.error("Analytics write failed.", error);
    });
    if (ctx?.waitUntil) {
      ctx.waitUntil(analyticsWrite);
    } else {
      await analyticsWrite;
    }

    if (!shouldForwardToDiscord(event)) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          ...headers,
          "Content-Type": "application/json"
        }
      });
    }

    if (!env.DISCORD_WEBHOOK_URL) {
      return new Response("Webhook secret is not configured", { status: 500, headers });
    }

    const discordPayload = buildDiscordPayload(event, requestContext);
    const discordResponse = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(discordPayload)
    });

    if (!discordResponse.ok) {
      return new Response("Discord delivery failed", { status: 502, headers });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": "application/json"
      }
    });
  }
};

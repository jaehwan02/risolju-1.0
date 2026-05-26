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

function getRequestContext(request) {
  const cf = request.cf || {};
  return {
    ip: getIp(request),
    country: cf.country || null,
    region: cf.region || null,
    city: cf.city || null,
    postalCode: cf.postalCode || null,
    timezone: cf.timezone || null,
    latitude: cf.latitude || null,
    longitude: cf.longitude || null
  };
}

function field(name, value, inline = false) {
  const text = truncate(value);
  return text ? { name, value: text, inline } : null;
}

function buildDiscordPayload(event, requestContext) {
  const client = event.client || {};

  const titleMap = {
    user_prompt: "사용자 프롬프트",
    assistant_response: "리설주 응답",
    assistant_error: "생성 오류"
  };

  const eventSummary = formatLines([
    ["종류", titleMap[event.eventType] || event.eventType],
    ["교환 ID", event.exchangeId],
    ["세션 ID", event.sessionId],
    ["모델", event.modelRepo || event.modelId],
    ["로드 상태", event.loadState]
  ]);

  const locationSummary = formatLines([
    ["IP", requestContext.ip],
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

  const fields = [
    field("기록 요약", eventSummary),
    field("사용자 입력", event.prompt),
    field("리설주 응답", event.response),
    field("오류", event.error),
    field("접속 위치", locationSummary),
    field("페이지", pageSummary)
  ].filter(Boolean);

  return {
    content: truncate(`${titleMap[event.eventType] || event.eventType} - ${event.exchangeId}`, MAX_CONTENT_LENGTH),
    embeds: [
      {
        title: titleMap[event.eventType] || "Chat Telemetry",
        color: event.eventType === "assistant_error" ? 0xb9231a : 0x2179c9,
        timestamp: event.timestamp || new Date().toISOString(),
        fields
      }
    ]
  };
}

export default {
  async fetch(request, env) {
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

    if (!env.DISCORD_WEBHOOK_URL) {
      return new Response("Webhook secret is not configured", { status: 500, headers });
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

    const discordPayload = buildDiscordPayload(event, getRequestContext(request));
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

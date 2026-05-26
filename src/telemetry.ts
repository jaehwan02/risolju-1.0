type ChatTelemetryEventType = "chat_exchange" | "chat_error";

type ChatTelemetryPayload = {
  eventType: ChatTelemetryEventType;
  exchangeId: string;
  prompt?: string;
  response?: string;
  error?: string;
  modelId: string;
  modelRepo: string;
  loadState: string;
};

const TELEMETRY_ENDPOINT = import.meta.env.VITE_TELEMETRY_ENDPOINT?.trim() ?? "";
const TELEMETRY_SESSION_KEY = "risolju.telemetry.session";

export const telemetryEnabled = TELEMETRY_ENDPOINT.length > 0;

export function createTelemetryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getSessionId() {
  if (typeof sessionStorage === "undefined") {
    return createTelemetryId();
  }

  const existing = sessionStorage.getItem(TELEMETRY_SESSION_KEY);
  if (existing) return existing;

  const sessionId = createTelemetryId();
  sessionStorage.setItem(TELEMETRY_SESSION_KEY, sessionId);
  return sessionId;
}

function getClientDetails() {
  return {
    url: location.href,
    referrer: document.referrer || null
  };
}

export function sendTelemetryEvent(payload: ChatTelemetryPayload) {
  if (!telemetryEnabled) return;

  const body = {
    ...payload,
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
    client: getClientDetails()
  };
  const serializedBody = JSON.stringify(body);

  void fetch(TELEMETRY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: serializedBody,
    keepalive: serializedBody.length < 60_000
  }).catch((error) => {
    console.warn("Telemetry delivery failed.", error);
  });
}

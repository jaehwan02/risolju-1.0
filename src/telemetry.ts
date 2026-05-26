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

type UserAgentBrand = {
  brand: string;
  version: string;
};

type UserAgentDataLike = {
  brands?: UserAgentBrand[];
  mobile?: boolean;
  platform?: string;
};

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

function getDeviceType(userAgent: string, isMobileHint?: boolean) {
  if (/ipad|tablet|playbook|silk/i.test(userAgent)) return "태블릿";
  if (isMobileHint || /mobile|iphone|ipod|android.*mobile/i.test(userAgent)) return "모바일";
  return "데스크톱";
}

function getOsInfo(userAgent: string, platform?: string) {
  const source = `${platform ?? ""} ${userAgent}`;

  const android = userAgent.match(/Android\s+([\d.]+)/i);
  if (android) return `Android ${android[1]}`;

  const ios = userAgent.match(/(?:iPhone|iPad|iPod).*OS\s+([\d_]+)/i);
  if (ios) return `iOS ${ios[1].replace(/_/g, ".")}`;

  const mac = userAgent.match(/Mac OS X\s+([\d_]+)/i);
  if (mac) return `macOS ${mac[1].replace(/_/g, ".")}`;

  const windows = userAgent.match(/Windows NT\s+([\d.]+)/i);
  if (windows) return `Windows ${windows[1]}`;

  if (/linux/i.test(source)) return "Linux";
  return platform || "알 수 없음";
}

function getBrowserInfo(userAgent: string, brands?: UserAgentBrand[]) {
  const edge = userAgent.match(/Edg\/([\d.]+)/i);
  if (edge) return `Microsoft Edge ${edge[1]}`;

  const chrome = userAgent.match(/Chrome\/([\d.]+)/i);
  if (chrome) return `Chrome ${chrome[1]}`;

  const firefox = userAgent.match(/Firefox\/([\d.]+)/i);
  if (firefox) return `Firefox ${firefox[1]}`;

  const safari = userAgent.match(/Version\/([\d.]+).*Safari/i);
  if (safari) return `Safari ${safari[1]}`;

  const brand = brands?.find((item) => !/not.?a.?brand/i.test(item.brand));
  return brand ? `${brand.brand} ${brand.version}` : "알 수 없음";
}

function getDeviceDetails() {
  const navigatorWithUserAgentData = navigator as Navigator & {
    userAgentData?: UserAgentDataLike;
  };
  const userAgent = navigator.userAgent || "";
  const userAgentData = navigatorWithUserAgentData.userAgentData;

  return {
    type: getDeviceType(userAgent, userAgentData?.mobile),
    os: getOsInfo(userAgent, userAgentData?.platform),
    browser: getBrowserInfo(userAgent, userAgentData?.brands)
  };
}

function getClientDetails() {
  return {
    url: location.href,
    referrer: document.referrer || null,
    device: getDeviceDetails()
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

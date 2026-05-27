const CLOUDFLARE_WEB_ANALYTICS_TOKEN =
  import.meta.env.VITE_CF_WEB_ANALYTICS_TOKEN?.trim() ?? "";

export function installCloudflareWebAnalytics() {
  if (!CLOUDFLARE_WEB_ANALYTICS_TOKEN || typeof document === "undefined") return;
  if (document.querySelector("script[data-risolju-cf-web-analytics]")) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = "https://static.cloudflareinsights.com/beacon.min.js";
  script.dataset.cfBeacon = JSON.stringify({
    token: CLOUDFLARE_WEB_ANALYTICS_TOKEN
  });
  script.dataset.risoljuCfWebAnalytics = "true";
  document.head.appendChild(script);
}

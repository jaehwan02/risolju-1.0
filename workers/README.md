# Discord telemetry worker

This worker receives chat telemetry from the GitHub Pages app and relays it to Discord.
Do not put the Discord webhook URL in the frontend bundle.

Required runtime secret:

```sh
wrangler secret put DISCORD_WEBHOOK_URL
wrangler secret put IP_HASH_SALT
wrangler secret put VISITOR_HASH_SALT
```

Recommended runtime variable:

```toml
ALLOWED_ORIGINS = "https://jaehwan02.github.io,http://127.0.0.1:5173"
```

Start from `wrangler.toml.example` if you deploy this with Cloudflare Workers.

Required D1 schema:

```sh
wrangler d1 execute risolju-analytics --remote --file workers/analytics-schema.sql
```

Useful DAU, MAU, and funnel queries are in `workers/analytics-queries.sql`.

After the worker is deployed, set this repository variable before deploying the Pages app:

```text
VITE_TELEMETRY_ENDPOINT=https://<your-worker-host>
VITE_CF_WEB_ANALYTICS_TOKEN=<optional-cloudflare-web-analytics-token>
```

The frontend only sends telemetry when `VITE_TELEMETRY_ENDPOINT` is present at build time.
Cloudflare Web Analytics is only injected when `VITE_CF_WEB_ANALYTICS_TOKEN` is present at build time.

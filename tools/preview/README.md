# Preview deploy + leads backend (not production)

Production a2c.dev = GitHub Pages from `main` (CNAME). Nothing here touches it.

## Preview: Cloudflare Pages project `a2c-site-preview`
- URL: https://a2c-site-preview.pages.dev (all responses `X-Robots-Tag: noindex, nofollow`, robots.txt `Disallow: /`).
- Build + deploy code: `python3 tools/build-showcase.py && python3 tools/build-i18n.py && node tools/preview/make-deploy-code.js`,
  then run `/workspace/a2c-showcase-deploy-code.js` with the Cloudflare API `execute` tool (account a2d814b90f8171e396f6ac99be50890b).
- The preview's `_worker.js` (generated) serves the static files embedded in it and forwards `/api/*` to the `a2c-leads` Worker
  through the `LEADS` service binding, so the form posts same-origin.

## Leads backend: Worker `a2c-leads` + D1 `a2c-leads` (source: tools/leads-worker/)
- Separate from the `a2c-whatsapp-relay` bot. Its workers.dev URL is disabled; it is reachable only via `/api/*` on the preview.
- `POST /api/lead` – form submissions (honeypot `website`, Turnstile widget `a2c-leads-form`, max 5 per IP hash / 10 min).
- Admin (header `Authorization: Bearer <ADMIN_KEY>`; the key is a Worker secret, copy on the box at /home/box/.secrets/a2c-leads-admin-key):
  - `GET /api/admin/export.csv` – all leads as CSV (UTF-8 with BOM, Excel-friendly)
  - `GET /api/admin/count`
  - `DELETE /api/admin/lead?id=<id>`
  - Example: `curl -H "Authorization: Bearer $(cat /home/box/.secrets/a2c-leads-admin-key)" https://a2c-site-preview.pages.dev/api/admin/export.csv -o leads.csv`
- No notifications are sent.
- **Before production:** a2c.dev is on GitHub Pages, so `/api/lead` does not exist there. Either move a2c.dev to Cloudflare Pages
  (same `_worker.js`/binding approach) or give the Worker its own custom domain and set `endpoint` in tools/leads.json.

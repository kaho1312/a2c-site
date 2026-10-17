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
- **Before production:** a2c.dev is on GitHub Pages, so `/api/lead` does not exist there. The prepared route is a Cloudflare
  Pages project with `functions/api/lead.js` (see "Host-aware `/api/lead` rule" below).

## Production gate: `tools/check-production.py` (merge-readiness, BUILD_TARGET)
The preview intentionally ships two things that must never reach a2c.dev: robots.txt `Disallow: /` and a form that posts
to `/api/lead` (exists only behind the preview's `_worker.js`). The gate catches both.

- Runs automatically at the end of `python3 tools/build-i18n.py` (on the repo root = what GitHub Pages publishes) and inside
  `node tools/preview/make-deploy-code.js` (on the preview dist, always in preview mode).
- `BUILD_TARGET=production` → **fails** (exit 1) if `robots.txt` has a Disallow-all line, or any published file references
  `/api/lead` (literal, or `data-endpoint="/api"` which the form turns into `/api/lead`).
- Any other value / unset (default `preview`) → the same findings are printed as `INFO` and the build passes, so the noindex
  preview keeps building.
- In every mode it fails if a claim removed after Agency QA (2026-10-17) comes back: hotel "best rate"/price match,
  "AI spots warning signs", gluten-free "prepared separately"/"all covered" (ES/EN/DE patterns in the script).
- CI: `.github/workflows/production-check.yml` runs `tools/build-prod.sh` with `BUILD_TARGET=production PROD_HOST=cloudflare-pages`
  on PRs into `main` and pushes to `main`. Note: GitHub Pages deploys from `main` regardless of the check result.

```
# production build (export so both steps see it)
export BUILD_TARGET=production; python3 tools/build-showcase.py && python3 tools/build-i18n.py; unset BUILD_TARGET
# check a given output directory, e.g. the preview dist
BUILD_TARGET=production python3 tools/check-production.py /workspace/a2c-showcase-dist   # fails: preview content
python3 tools/check-production.py /workspace/a2c-showcase-dist                           # passes: preview mode
```
### Host-aware `/api/lead` rule (`PROD_HOST`, branch `cutover-prep`)
- `PROD_HOST=github-pages` (default): any `/api/lead` reference fails a production build (GitHub Pages has no endpoint).
- `PROD_HOST=cloudflare-pages`: `/api/lead` is allowed **only** when the Pages Function `functions/api/lead.js` exists
  (repo root or next to the checked dir) and forwards to `env.LEADS` at `/lead`. Without it the references fail as above.
  Robots Disallow-all and the removed-claim guard are unconditional.
- Production build for Cloudflare Pages: `BUILD_TARGET=production PROD_HOST=cloudflare-pages bash tools/build-prod.sh`
  → `dist/` (repo `robots.txt` = `Allow: /`, `tools/prod/_headers` with noindex for `*.pages.dev`), gate run on `dist/`.
  The Function is compiled by Pages from `functions/`; the `LEADS` service binding comes from `wrangler.toml`.
- Merging this into `main` is part of the cutover itself: while a2c.dev is still on GitHub Pages, `main` would publish a form
  that posts to a non-existent `/api/lead`. See /workspace/agency/a2c-cutover-runbook.md.

## Demo content rules (Agency QA 2026-10-17)
- Content: `tools/showcase_content.py` (chats) and `tools/form_content.py` (form). Each demo shows a privacy line
  (`UI['privacy']`, `UI['privacy_clinic']` for the dental demo, `UI['privacy_call']` for the phone demo).
- Hotel chat may only cite direct-booking perks from `HOTEL_EXAMPLE_DATA` (fictional example data, rendered as a card
  labelled "Datos de ejemplo / Example data / Beispieldaten"). No best-rate or price-match claims.
- Allergy/celiac questions: the bot shares only what the menu states and hands off to staff (no safety promises).
- Dental: urgent messages are flagged to the team; no claim that the AI detects warning signs; no symptom triage questions.
- Lead form: no health/sensitive data; the free-text field carries a hint saying so.
- Demo business names (Clínica Dental Arenalba, Plomería Tubo Sereno, Garza Lenta Tours, Hotel Ceibo Lunar, Brasa Turquí,
  all with "Demo") were web-checked on 2026-10-16 against Cancún / Playa del Carmen / Tulum / Quintana Roo / México and
  listing sites; no real business found. Re-check before adding or renaming a demo business.
- Package names stay Spanish (brand). EN/DE show a translated descriptor on the three package-section headings only
  (`PKG_DESC` in showcase_content.py, injected by build-showcase.py); JSON-LD offers carry it as `alternateName` + description prefix (`PKG_ALT`).

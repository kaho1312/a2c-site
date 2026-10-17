// Production form endpoint for a2c.dev on Cloudflare Pages (cutover-prep; not deployed yet).
// Route: /api/lead only (file-based routing). POST and OPTIONS are forwarded to the a2c-leads Worker at /lead
// through the LEADS service binding (Worker a2c-leads has workers.dev disabled, so the binding is the only way in).
// Everything else gets 405. Origin checks, validation, Turnstile, honeypot and D1 writes all stay in the Worker.
// Pages Functions do not get _headers, so this response sets its own X-Robots-Tag.
export async function onRequest({ request, env }) {
  if (request.method !== 'POST' && request.method !== 'OPTIONS') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST, OPTIONS', 'X-Robots-Tag': 'noindex' } });
  }
  if (!env.LEADS) return new Response('{"ok":false,"error":"unavailable"}', { status: 503, headers: { 'Content-Type': 'application/json', 'X-Robots-Tag': 'noindex' } });
  const target = new URL(request.url);
  target.pathname = '/lead';
  target.search = '';
  const res = await env.LEADS.fetch(new Request(target, request));
  const out = new Response(res.body, res);
  out.headers.set('X-Robots-Tag', 'noindex');
  out.headers.set('Cache-Control', 'no-store');
  return out;
}

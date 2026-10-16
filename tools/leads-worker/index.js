// A2C leads Worker: POST /lead (consent-based lead form of a2c.dev) -> D1 "a2c-leads".
// Admin (Authorization: Bearer <ADMIN_KEY secret>): GET /admin/export.csv, GET /admin/count, DELETE /admin/lead?id=...
// Anti-spam: honeypot field "website", Cloudflare Turnstile (when TURNSTILE_SECRET is set), per-IP rate limit (5 / 10 min, hashed IP).
// No notifications are sent anywhere.
const ALLOWED = [/^https:\/\/(www\.)?a2c\.dev$/, /^https:\/\/([a-z0-9-]+\.)?a2c-site-preview\.pages\.dev$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const IND = ['dental', 'plomero', 'tours', 'hotel', 'restaurante', 'otro'];
const PREF = ['email', 'whatsapp', 'call'];
const LANGS = ['es', 'en', 'de'];
const CONSENT_VERSIONS = ['2026-10-16.v1'];
const COLS = ['id','created_at','name','business','industry','email','whatsapp','city','pain','preferred_contact','consent_email','consent_whatsapp','consent_privacy','consent_version','lang','page_url','user_agent','turnstile'];
const okOrigin = o => !!o && ALLOWED.some(r => r.test(o));
function cors(o) { return okOrigin(o) ? { 'Access-Control-Allow-Origin': o, 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } : { 'Vary': 'Origin' }; }
const json = (b, s = 200, h = {}) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', ...h } });
const str = (v, max) => (typeof v === 'string' ? v : v == null ? '' : String(v)).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);
const truthy = v => v === true || v === 1 || v === '1' || v === 'true' || v === 'on';
async function sha256(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function adminOk(req, env) {
  if (!env.ADMIN_KEY) return false;
  const m = (req.headers.get('Authorization') || '').match(/^Bearer\s+(.+)$/); if (!m) return false;
  const e = new TextEncoder(); const [a, b] = await Promise.all([crypto.subtle.digest('SHA-256', e.encode(m[1])), crypto.subtle.digest('SHA-256', e.encode(env.ADMIN_KEY))]);
  return crypto.subtle.timingSafeEqual(a, b);
}
function csvCell(v) { let s = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }

async function lead(req, env) {
  const o = req.headers.get('Origin') || '', h = cors(o);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405, h);
  if (o && !okOrigin(o)) return json({ ok: false, error: 'origin' }, 403, h);
  if (+(req.headers.get('Content-Length') || 0) > 20000) return json({ ok: false, error: 'size' }, 413, h);
  let d = {};
  try { const ct = req.headers.get('Content-Type') || ''; d = ct.includes('application/json') ? await req.json() : Object.fromEntries(await req.formData()); } catch { return json({ ok: false, error: 'body' }, 400, h); }
  if (str(d.website, 200)) return json({ ok: true }, 200, h); // honeypot: pretend success, store nothing
  const r = {
    name: str(d.name, 120), business: str(d.business, 160), industry: str(d.industry, 20), email: str(d.email, 200).toLowerCase(),
    whatsapp: str(d.whatsapp, 30), city: str(d.city, 120), pain: str(d.pain, 500), preferred_contact: str(d.preferred_contact, 10) || 'email',
    consent_email: truthy(d.consent_email) ? 1 : 0, consent_whatsapp: truthy(d.consent_whatsapp) ? 1 : 0, consent_privacy: truthy(d.consent_privacy) ? 1 : 0,
    consent_version: str(d.consent_version, 40), lang: str(d.lang, 5), page_url: str(d.page_url, 500), user_agent: str(req.headers.get('User-Agent'), 300),
  };
  const bad = [];
  for (const k of ['name', 'business', 'city']) if (!r[k]) bad.push(k);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) bad.push('email');
  if (!IND.includes(r.industry)) bad.push('industry');
  if (!PREF.includes(r.preferred_contact)) bad.push('preferred_contact');
  if (!LANGS.includes(r.lang)) bad.push('lang');
  if (!CONSENT_VERSIONS.includes(r.consent_version)) bad.push('consent_version');
  if (!r.consent_privacy) bad.push('consent_privacy');
  if (r.whatsapp && !/^\+?[0-9 ()-]{8,20}$/.test(r.whatsapp)) bad.push('whatsapp');
  if (r.preferred_contact === 'whatsapp' && (!r.whatsapp || !r.consent_whatsapp)) bad.push('whatsapp_consent');
  if (r.preferred_contact === 'call' && !r.whatsapp) bad.push('phone');
  try { const pu = new URL(r.page_url); if (!okOrigin(pu.origin)) bad.push('page_url'); } catch { bad.push('page_url'); }
  if (bad.length) return json({ ok: false, error: 'invalid', fields: bad }, 400, h);
  const ip = req.headers.get('CF-Connecting-IP') || '';
  r.turnstile = 0;
  if (env.TURNSTILE_SECRET) {
    const f = new FormData(); f.append('secret', env.TURNSTILE_SECRET); f.append('response', str(d['cf-turnstile-response'], 2048)); if (ip) f.append('remoteip', ip);
    const v = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: f }).then(x => x.json()).catch(() => ({ success: false }));
    if (!v.success) return json({ ok: false, error: 'captcha' }, 400, h);
    r.turnstile = 1;
  }
  const ipHash = await sha256((env.IP_SALT || 'a2c-leads') + '|' + ip);
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const c = await env.DB.prepare('SELECT COUNT(*) AS n FROM leads WHERE ip_hash = ? AND created_at > ?').bind(ipHash, since).first();
  if (c && c.n >= 5) return json({ ok: false, error: 'rate' }, 429, h);
  const id = crypto.randomUUID(), created_at = new Date().toISOString();
  const row = { id, created_at, ...r, ip_hash: ipHash };
  const keys = Object.keys(row);
  await env.DB.prepare(`INSERT INTO leads (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).bind(...keys.map(k => row[k])).run();
  return json({ ok: true, id }, 200, h);
}

async function admin(req, env, u) {
  if (!(await adminOk(req, env))) return json({ ok: false, error: 'unauthorized' }, 401);
  if (u.pathname === '/admin/export.csv' && req.method === 'GET') {
    const { results } = await env.DB.prepare(`SELECT ${COLS.join(',')} FROM leads ORDER BY created_at`).all();
    const csv = '\ufeff' + [COLS.join(','), ...results.map(x => COLS.map(k => csvCell(x[k])).join(','))].join('\r\n') + '\r\n';
    return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="a2c-leads-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
  if (u.pathname === '/admin/count' && req.method === 'GET') return json({ ok: true, count: (await env.DB.prepare('SELECT COUNT(*) AS n FROM leads').first()).n });
  if (u.pathname === '/admin/lead' && req.method === 'DELETE') {
    const id = u.searchParams.get('id') || ''; const res = await env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(id).run();
    return json({ ok: true, deleted: res.meta.changes });
  }
  return json({ ok: false, error: 'not_found' }, 404);
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    try {
      if (u.pathname === '/lead') return await lead(req, env);
      if (u.pathname.startsWith('/admin/')) return await admin(req, env, u);
      return new Response('A2C leads endpoint', { status: u.pathname === '/' ? 200 : 404, headers: { 'Content-Type': 'text/plain', 'X-Robots-Tag': 'noindex' } });
    } catch (e) { console.log('error', String(e)); return json({ ok: false, error: 'server' }, 500, cors(req.headers.get('Origin') || '')); }
  },
};

#!/usr/bin/env python3
"""Build the static language pages of a2c.dev.

Source of truth: /index.html (Spanish, with data-en / data-de translations on each element).
Run after every edit of index.html:   python3 tools/build-i18n.py
It (1) rewrites the SEO head block (between <!-- seo:start --> and <!-- seo:end -->) of /index.html and
(2) writes /en/index.html and /de/index.html with the translated content, localized head, JSON-LD and
pre-rendered prices (USD for EN, EUR for DE), so search engines and no-JS visitors get the right language.
"""
import html, json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = 'https://a2c.dev'
URL = {'es': '/', 'en': '/en/', 'de': '/de/'}
OG_LOCALE = {'es': 'es_MX', 'en': 'en_US', 'de': 'de_DE'}

SEO = {
 'es': dict(
  title='A2C · Agentes de IA para WhatsApp y teléfono para tu negocio',
  desc='A2C crea agentes de IA para WhatsApp y teléfono que responden al instante, 24/7, con el conocimiento de tu negocio: más rápido y preciso que cualquier equipo, por una fracción de su costo. Para hoteles, clínicas, despachos, oficios, restaurantes y más.',
  og_title='A2C · Agentes de IA para WhatsApp y teléfono',
  og_desc='Respuestas al instante, 24/7, por WhatsApp y teléfono, basadas en tus servicios, precios y políticas. Más rápido y preciso que cualquier equipo, por una fracción de su costo.',
  tw_desc='Agente de IA en WhatsApp y recepcionista telefónica con IA que responden al instante, 24/7, con el conocimiento de tu negocio.'),
 'en': dict(
  title='A2C · AI agents for WhatsApp and phone for your business',
  desc='A2C builds AI agents for WhatsApp and phone that answer instantly, 24/7, with your business knowledge: faster and more accurate than any team, for a fraction of the cost. For hotels, clinics, offices, trades, restaurants and more.',
  og_title='A2C · AI agents for WhatsApp and phone',
  og_desc='Instant answers, 24/7, on WhatsApp and phone, based on your services, prices and policies. Faster and more accurate than any team, for a fraction of the cost.',
  tw_desc='WhatsApp AI agent and AI phone receptionist that answer instantly, 24/7, with your business knowledge.'),
 'de': dict(
  title='A2C · KI-Agenten für WhatsApp und Telefon für Ihr Unternehmen',
  desc='A2C entwickelt KI-Agenten für WhatsApp und Telefon, die sofort antworten – rund um die Uhr, mit dem Wissen Ihres Unternehmens: schneller und präziser als jedes Team, zu einem Bruchteil der Kosten. Für Hotels, Praxen, Büros, Handwerksbetriebe, Restaurants und mehr.',
  og_title='A2C · KI-Agenten für WhatsApp und Telefon',
  og_desc='Sofortige Antworten rund um die Uhr per WhatsApp und Telefon, auf Basis Ihrer Leistungen, Preise und Richtlinien. Schneller und präziser als jedes Team, zu einem Bruchteil der Kosten.',
  tw_desc='KI-Agent für WhatsApp und KI-Telefonrezeption, die sofort antworten – rund um die Uhr, mit dem Wissen Ihres Unternehmens.'),
}

# JSON-LD descriptions (offer names = package names stay unchanged)
LD = {
 'en': {'_': 'AI agents for WhatsApp and an AI phone receptionist that answer instantly, 24/7, with each business\'s knowledge: its services, prices and policies.',
        'Esencial': 'WhatsApp AI agent: FAQs, quotes, hand-off to your team, ~800 conversations/month.',
        'Reservas + Seguimiento': 'Everything in Esencial + bookings and appointments, payment links, reminders and review requests, ~2,000 conversations/month.',
        'Recepcionista 24/7': 'WhatsApp + AI phone receptionist, includes 500 voice minutes.'},
 'de': {'_': 'KI-Agenten für WhatsApp und eine KI-Telefonrezeption, die sofort antworten – rund um die Uhr, mit dem Wissen des jeweiligen Unternehmens: seinen Leistungen, Preisen und Richtlinien.',
        'Esencial': 'WhatsApp-KI-Agent: häufige Fragen, Angebote, Übergabe an Ihr Team, ~800 Gespräche/Monat.',
        'Reservas + Seguimiento': 'Alles aus Esencial + Buchungen und Termine, Zahlungslinks, Erinnerungen und Bewertungsanfragen, ~2.000 Gespräche/Monat.',
        'Recepcionista 24/7': 'WhatsApp + KI-Telefonrezeption, inklusive 500 Sprachminuten.'},
}

# JSON-LD offer / service names that are descriptive (not package brand names) get translated too
LD_NAMES = {
 'en': {'Llamada inicial': 'Initial call', 'Primera llamada gratis': 'Free first call',
        'Diagnóstico detallado': 'Detailed diagnosis', 'Diagnóstico con reporte escrito': 'Diagnosis with a written report'},
 'de': {'Llamada inicial': 'Erstgespräch', 'Primera llamada gratis': 'Kostenloses Erstgespräch',
        'Diagnóstico detallado': 'Detaillierte Diagnose', 'Diagnóstico con reporte escrito': 'Diagnose mit schriftlichem Bericht'},
}

def esc(v):
    return html.escape(v, quote=True)

def seo_block(l):
    s = SEO[l]; u = BASE + URL[l]
    out = [f'<title>{esc(s["title"])}</title>',
           f'<meta name="description" content="{esc(s["desc"])}">',
           f'<link rel="canonical" href="{u}">']
    for x in ('es', 'en', 'de'):
        out.append(f'<link rel="alternate" hreflang="{x}" href="{BASE + URL[x]}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{BASE}/">')
    out += ['<meta property="og:type" content="website">', '<meta property="og:site_name" content="A2C">',
            f'<meta property="og:locale" content="{OG_LOCALE[l]}">']
    out += [f'<meta property="og:locale:alternate" content="{OG_LOCALE[x]}">' for x in ('es', 'en', 'de') if x != l]
    out += [f'<meta property="og:title" content="{esc(s["og_title"])}">',
            f'<meta property="og:description" content="{esc(s["og_desc"])}">',
            f'<meta property="og:url" content="{u}">',
            '<meta name="twitter:card" content="summary">',
            f'<meta name="twitter:title" content="{esc(s["og_title"])}">',
            f'<meta name="twitter:description" content="{esc(s["tw_desc"])}">']
    return '<!-- seo:start (generated by tools/build-i18n.py) -->\n' + '\n'.join(out) + '\n<!-- seo:end -->'

def set_seo(src, l):
    return re.sub(r'<!-- seo:start.*?<!-- seo:end -->', lambda m: seo_block(l), src, count=1, flags=re.S)

# ---- prices: rendered by pricing.js itself (node), so static and JS output are identical ----
import subprocess
_JS = r"""
global.window = {}; global.localStorage = {getItem(){return null}, setItem(){}};
require(process.argv[1]);
const P = window.A2C_PRICING, out = {};
for (const l of ['es','en','de']) for (const k of ['monthly','setup','minute','meta','diag','from','recep'])
  for (const pk of ['esencial','reservas','recepcionista','']) out[[l,k,pk].join('|')] = P.html(l,k,pk||'esencial',P.DEF[l]);
console.log(JSON.stringify(out));
"""
PRICES = json.loads(subprocess.run(['node', '-e', _JS, str(ROOT / 'pricing.js')], check=True, capture_output=True, text=True).stdout)
DEF = {'es': 'MXN', 'en': 'USD', 'de': 'EUR'}

def price_html(l, kind, pkg):
    return PRICES['|'.join([l, kind, pkg or ''])]

# ---- element scanner ----
OPEN = re.compile(r'<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>')

def inner_end(src, name, start):
    """Index of the matching </name> for an element whose opening tag ends at `start`."""
    depth = 1; pat = re.compile(r'<(/?)' + name + r'\b[^>]*>', re.I); pos = start
    while True:
        m = pat.search(src, pos)
        if not m: raise ValueError('unclosed <%s>' % name)
        depth += -1 if m.group(1) else 1
        if depth == 0: return m.start()
        pos = m.end()

def attr(tag, name):
    m = re.search(r'\s' + re.escape(name) + r'="([^"]*)"', tag)
    return html.unescape(m.group(1)) if m else None

def set_attr(tag, name, value):
    v = esc(value)
    if re.search(r'\s' + re.escape(name) + r'(="[^"]*")?(?=[\s>/])', tag):
        return re.sub(r'(\s' + re.escape(name) + r')(="[^"]*")?(?=[\s>/])', lambda m: m.group(1) + '="' + v + '"', tag, count=1)
    return tag[:-1] + f' {name}="{v}">'

def translate(src, l):
    out = []; pos = 0
    body = src.index('<body')
    for m in OPEN.finditer(src, body):
        if m.start() < pos: continue
        tag = m.group(0); name = m.group(1)
        new = tag
        hv = attr(tag, f'data-{l}-href')
        if hv is not None: new = set_attr(new, 'href', hv)
        lv = attr(tag, f'data-{l}-label')
        if lv is not None: new = set_attr(new, 'aria-label', lv)
        pv = attr(tag, f'data-{l}-ph')
        if pv is not None: new = set_attr(new, 'placeholder', pv)
        if re.search(r'\sdata-es(?=[\s>=])', tag):
            end = inner_end(src, name, m.end())
            inner = src[m.end():end]
            es_val = attr(tag, 'data-es') or inner
            tv = attr(tag, f'data-{l}')
            new = set_attr(new, 'data-es', es_val)
            out.append(src[pos:m.start()] + new + (tv if tv is not None else inner))
            pos = end
            continue
        pk = attr(tag, 'data-price')
        if pk is not None:
            end = inner_end(src, name, m.end())
            out.append(src[pos:m.start()] + new + price_html(l, pk, attr(tag, 'data-pkg')))
            pos = end
            continue
        if new != tag:
            out.append(src[pos:m.start()] + new); pos = m.end()
    out.append(src[pos:])
    return ''.join(out)

def page(src, l):
    s = set_seo(src, l)
    s = s.replace('<html lang="es"', f'<html lang="{l}"', 1)
    # lead form: no-JS submissions carry the page language
    s = s.replace('<input type="hidden" name="lang" value="es">', f'<input type="hidden" name="lang" value="{l}">')
    # language switcher: mark current page
    def sw(m):
        t = m.group(0)
        t = re.sub(r' class="on" aria-current="page"', '', t)
        return re.sub(r'(<a href="%s" hreflang="%s"[^>]*?)>' % (re.escape(URL[l]), l), r'\1 class="on" aria-current="page">', t, count=1)
    s = re.sub(r'<nav class="langsw".*?</nav>', sw, s, count=1, flags=re.S)
    # currency switcher default
    def cur(m):
        c = m.group(1); on = c == DEF[l]
        return f'<button type="button" data-cur="{c}"' + (' class="on" aria-pressed="true">' if on else ' aria-pressed="false">')
    s = re.sub(r'<button type="button" data-cur="(\w+)"[^>]*>', cur, s)
    if l != 'es':
        s = translate(s, l)
        def ld(m):
            d = json.loads(m.group(1))
            d['url'] = BASE + URL[l]; d['description'] = LD[l]['_']
            for o in d.get('makesOffer', []):
                if o.get('name') in LD[l] and 'description' in o: o['description'] = LD[l][o['name']]
                if o.get('name') in LD_NAMES[l]: o['name'] = LD_NAMES[l][o['name']]
                it = o.get('itemOffered') or {}
                if it.get('name') in LD_NAMES[l]: it['name'] = LD_NAMES[l][it['name']]
            return '<script type="application/ld+json">\n' + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + '\n</script>'
        s = re.sub(r'<script type="application/ld\+json">\s*(.*?)\s*</script>', ld, s, count=1, flags=re.S)
    return s

def main():
    src = (ROOT / 'index.html').read_text(encoding='utf-8')
    es = page(src, 'es')
    (ROOT / 'index.html').write_text(es, encoding='utf-8')
    for l in ('en', 'de'):
        d = ROOT / l; d.mkdir(exist_ok=True)
        (d / 'index.html').write_text(page(es, l), encoding='utf-8')
    print('built: /, /en/, /de/')
    # Production gate (BUILD_TARGET=production): fails on robots Disallow-all or /api/lead references. See README.
    import subprocess as sp, sys, os
    sys.stdout.flush()
    r = sp.run([sys.executable, str(ROOT / 'tools' / 'check-production.py'), str(ROOT)])
    if r.returncode: sys.exit(r.returncode)

if __name__ == '__main__':
    main()

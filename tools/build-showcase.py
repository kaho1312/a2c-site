#!/usr/bin/env python3
"""Render the industry showcase (#casos) and the lead form (#cuentanos) into /index.html (Spanish source with
data-en / data-de), between <!-- showcase:start --> ... <!-- showcase:end --> and <!-- leadform:start --> ... <!-- leadform:end -->.
Content lives in tools/showcase_content.py and tools/form_content.py.
Run:  python3 tools/build-showcase.py && python3 tools/build-i18n.py
Env LEADS_ENDPOINT / TURNSTILE_SITEKEY set the form endpoint and Turnstile site key (stored in tools/leads.json otherwise)."""
import html, json, os, re, sys, pathlib, importlib.util, urllib.parse
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
from showcase_content import UI, CASES, SUBJ
from form_content import F, CONSENT_VERSION
spec = importlib.util.spec_from_file_location('b18', ROOT / 'tools' / 'build-i18n.py'); b18 = importlib.util.module_from_spec(spec); spec.loader.exec_module(b18)
CFG = json.loads((ROOT / 'tools' / 'leads.json').read_text()) if (ROOT / 'tools' / 'leads.json').exists() else {}
ENDPOINT = os.environ.get('LEADS_ENDPOINT', CFG.get('endpoint', ''))
SITEKEY = os.environ.get('TURNSTILE_SITEKEY', CFG.get('turnstile_sitekey', ''))
L = ('es', 'en', 'de')

def esc(s): return html.escape(s, quote=True)
def rich(s):  # plain text -> safe HTML, *bold* -> <b>
    return re.sub(r'\*([^*]+)\*', r'<b>\1</b>', html.escape(s, quote=False))
def T(tag, tr, attrs='', raw=False):
    f = (lambda x: x) if raw else rich
    a = (' ' + attrs) if attrs else ''
    return f'<{tag}{a} data-es data-en="{esc(f(tr[1]))}" data-de="{esc(f(tr[2]))}">{f(tr[0])}</{tag}>'
def clock(hm, l):
    h, m = map(int, hm.split(':'))
    if l == 'de': return f'{h:02d}:{m:02d}'
    h12 = h % 12 or 12
    return f'{h12}:{m:02d} ' + (('a.m.' if h < 12 else 'p.m.') if l == 'es' else ('AM' if h < 12 else 'PM'))
TICK = '<svg class="tk" viewBox="0 0 18 12" aria-hidden="true"><path d="M1 6l3.5 3.5L11 3M7 9.5L8 10.5 16.5 2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
def mailto(l, label):
    return 'mailto:info@a2c.dev?subject=' + urllib.parse.quote(SUBJ[l].format(label), safe='')

def case_html(c, first):
    call = c['kind'] == 'call'
    out = [f'<div class="sc-panel{" sc-call" if call else ""}" id="sc-{c["id"]}" role="tabpanel" aria-labelledby="sc-tab-{c["id"]}" tabindex="0">']
    out.append('<div class="sc-head">' + '<span class="sc-chip"><span aria-hidden="true">🌙</span> ' + T('span', c['chip']) + '</span>'
               + T('h3', c['hook']) + T('p', c['pain']) + '</div>')
    out.append('<div class="sc-stage"><div class="phone">')
    if call:
        out.append(f'<div class="ph-top sc-calltop"><span class="av" aria-hidden="true">📞</span><div><b>{T("span", c["biz"])}</b><small>{T("span", UI["call_status"])}</small></div><span class="sc-live" aria-hidden="true">●</span></div>')
    else:
        out.append(f'<div class="ph-top"><span class="av" aria-hidden="true">{c["icon"]}</span><div><b>{T("span", c["biz"])}</b><small>{T("span", UI["online"])}</small></div></div>')
    lab = UI['label']
    out.append(f'<div class="sc-thread" role="log" aria-label="{esc(lab[0])}" data-en-label="{esc(lab[1])}" data-de-label="{esc(lab[2])}">')
    for kind, hm, *tr in c['msgs']:
        if kind in ('in', 'out'):
            t = T('i', tuple(clock(hm, l) for l in L), raw=True)
            sp = (T('b', UI['ai'] if kind == 'out' else UI['caller'], 'class="sp"')) if call else ''
            tick = TICK if (kind == 'out' and not call) else ''
            out.append(f'<div class="sc-i msg {kind}">{sp}{T("span", tr)}<i class="sc-t">{t}{tick}</i></div>')
        elif kind == 'card':
            d = tr[0]
            rows = ''.join(T('span', r) for r in d['rows'])
            out.append(f'<div class="sc-i bk sc-card"><div class="bk-h"><b>{T("span", d["title"])}</b><span class="ok">✓ {T("span", d["badge"])}</span></div><div class="bk-r">{rows}</div></div>')
        else:
            out.append(f'<div class="sc-i sc-sys">🔔 {T("span", tr)}</div>')
    out.append('</div></div>')
    out.append(T('p', lab, 'class="sc-label"'))
    out.append('<button type="button" class="sc-replay" hidden>' + T('span', UI['replay']) + '</button></div>')
    lis = ''.join(T('li', o) for o in c['outcomes'])
    href = {l: mailto(l, c['tab'][i].lower() if l != 'de' else c['tab'][i]) for i, l in enumerate(L)}
    out.append(f'<div class="sc-out"><ul class="chk">{lis}</ul>'
               f'<div class="sc-pkg">{T("small", UI["pkg_label"])}<b>{c["pkg_name"]}</b>'
               f'<span class="sc-price" data-price="from" data-pkg="{c["pkg"]}">{b18.price_html("es", "from", c["pkg"])}</span>'
               f'{T("a", UI["see_pkgs"], "href=\"#paquetes\"")}</div>'
               f'<div class="sc-cta"><a class="btn" href="{esc(href["es"])}" data-es-href="{esc(href["es"])}" data-en-href="{esc(href["en"])}" data-de-href="{esc(href["de"])}">{T("span", UI["cta"])}</a>'
               f'{T("a", UI["form_link"], f"class=\"sc-formlink\" href=\"#cuentanos\" data-industry=\"{c["id"]}\"")}</div></div>')
    out.append('</div>')
    return ''.join(out)

def showcase():
    tl = UI['tabs_label']
    tabs = ''.join(f'<button type="button" class="sc-tab" role="tab" id="sc-tab-{c["id"]}" aria-controls="sc-{c["id"]}" aria-selected="{"true" if i == 0 else "false"}" tabindex="{0 if i == 0 else -1}"><span aria-hidden="true">{c["icon"]}</span>{T("span", c["tab"])}</button>' for i, c in enumerate(CASES))
    return ('<!-- showcase:start (generated by tools/build-showcase.py) -->\n<section id="casos"><div class="w">\n'
            + T('h2', UI['h2']) + '\n' + T('p', UI['intro'], 'class="lead sm sc-intro"') + '\n'
            + '<div class="sc" data-sc>\n'
            + f'<div class="sc-tabs" role="tablist" aria-label="{esc(tl[0])}" data-en-label="{esc(tl[1])}" data-de-label="{esc(tl[2])}">{tabs}</div>\n'
            + '\n'.join(case_html(c, i == 0) for i, c in enumerate(CASES)) + '\n</div>\n'
            + T('p', UI['disclaimer'], 'class="note"') + '\n</div></section>\n<!-- showcase:end -->')

def field(name, label, inp):
    return f'<div class="lf-f lf-{name}"><label for="lf-{name}">{T("span", label)}</label>{inp}</div>'
def ph(tr): return f'placeholder="{esc(tr[0])}" data-en-ph="{esc(tr[1])}" data-de-ph="{esc(tr[2])}"'

def leadform():
    opts = T('option', F['choose'], 'value=""') + ''.join(T('option', tr, f'value="{v}"') for v, tr in F['ind'])
    pref = ''.join(f'<label class="lf-radio"><input type="radio" name="preferred_contact" value="{v}"{" checked" if v == "email" else ""}> {T("span", tr)}</label>' for v, tr in F['pref_opts'])
    ts = f'<div class="cf-turnstile" data-sitekey="{esc(SITEKEY)}" data-size="flexible" data-appearance="interaction-only"></div>' if SITEKEY else ''
    body = (
      f'<form class="lf card" id="lead-form" action="{esc(ENDPOINT)}/lead" method="post" data-endpoint="{esc(ENDPOINT)}" data-consent-version="{CONSENT_VERSION}" novalidate>'
      '<div class="lf-grid">'
      + field('name', F['name'], '<input id="lf-name" name="name" type="text" autocomplete="name" required maxlength="120">')
      + field('business', F['business'], '<input id="lf-business" name="business" type="text" autocomplete="organization" required maxlength="160">')
      + field('industry', F['industry'], f'<select id="lf-industry" name="industry" required>{opts}</select>')
      + field('email', F['email'], '<input id="lf-email" name="email" type="email" autocomplete="email" required maxlength="200">')
      + field('whatsapp', F['wa'], f'<input id="lf-whatsapp" name="whatsapp" type="tel" autocomplete="tel" inputmode="tel" maxlength="30" aria-describedby="lf-wa-hint">' + T('small', F['wa_hint'], 'id="lf-wa-hint" class="lf-hint"'))
      + field('city', F['city'], '<input id="lf-city" name="city" type="text" autocomplete="address-level2" required maxlength="120">')
      + field('pain', F['pain'], f'<textarea id="lf-pain" name="pain" rows="3" maxlength="500" {ph(F["pain_ph"])}></textarea>')
      + '</div>'
      f'<fieldset class="lf-pref"><legend>{T("span", F["pref"])}</legend>{pref}</fieldset>'
      '<fieldset class="lf-consent">'
      f'<label class="lf-check"><input type="checkbox" name="consent_email" value="1"> {T("span", F["c_email"])}</label>'
      f'<label class="lf-check"><input type="checkbox" name="consent_whatsapp" value="1"> {T("span", F["c_wa"])}</label>'
      f'<label class="lf-check"><input type="checkbox" name="consent_privacy" value="1" required> {T("span", F["c_priv"], raw=True)}</label>'
      '</fieldset>'
      f'<div class="lf-hp" aria-hidden="true"><label for="lf-website">{T("span", F["hp"])}</label><input id="lf-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>'
      '<input type="hidden" name="lang" value="es"><input type="hidden" name="consent_version" value="' + CONSENT_VERSION + '"><input type="hidden" name="page_url" value="">'
      + ts +
      f'<p class="lf-resp">{T("span", F["resp"], raw=True)}</p>'
      f'<button class="btn lf-submit" type="submit">{T("span", F["submit"])}</button>'
      f'<p class="lf-msg" role="status" aria-live="polite" hidden></p>'
      '<template class="lf-strings">' + ''.join(T('span', F[k], f'data-k="{k}"') for k in ('sending', 'ok', 'err', 'err_wa', 'err_call', 'err_req', 'err_rate', 'submit')) + '</template>'
      '</form>')
    return ('<!-- leadform:start (generated by tools/build-showcase.py) -->\n<section id="cuentanos" class="alt"><div class="w lf-wrap">\n'
            + T('h2', F['h2']) + '\n' + T('p', F['intro'], 'class="lead sm"') + '\n' + body + '\n</div></section>\n<!-- leadform:end -->')

def put(src, name, block, anchor):
    pat = re.compile(r'<!-- ' + name + r':start.*?<!-- ' + name + r':end -->', re.S)
    if pat.search(src): return pat.sub(lambda m: block, src, count=1)
    i = src.index(anchor); return src[:i] + block + '\n\n' + src[i:]

def main():
    p = ROOT / 'index.html'; s = p.read_text(encoding='utf-8')
    s = put(s, 'showcase', showcase(), '<section id="paquetes">')
    s = put(s, 'leadform', leadform(), '<section id="contacto"')
    if 'href="#casos"' not in s:
        s = s.replace('<a href="#paquetes" data-es data-en="Packages"', '<a href="#casos" data-es data-en="Use cases" data-de="Beispiele">Casos</a><a href="#paquetes" data-es data-en="Packages"', 1)
    if '/showcase.js' not in s:
        s = s.replace('<script src="/nav.js" defer></script>', '<script src="/nav.js" defer></script>\n<script src="/showcase.js" defer></script>\n<script src="/lead-form.js" defer></script>', 1)
    p.write_text(s, encoding='utf-8'); print('showcase + lead form rendered into index.html')

if __name__ == '__main__': main()

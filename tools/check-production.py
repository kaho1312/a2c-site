#!/usr/bin/env python3
"""Merge-readiness gate for production builds of a2c.dev.

Usage:  BUILD_TARGET=production [PROD_HOST=github-pages|cloudflare-pages] python3 tools/check-production.py [OUTPUT_DIR]
        (also runs automatically at the end of tools/build-i18n.py on the repo root, and at the end of
        tools/build-prod.sh on dist/ = what Cloudflare Pages serves)

OUTPUT_DIR defaults to the repo root. In a git checkout only the files that would be published are checked
(git ls-files, minus tools/, CNAME, .nojekyll, .gitignore); any other directory is walked completely.

Production checks (FAIL only when BUILD_TARGET=production; in any other mode they are reported as INFO and exit 0,
so the noindex preview keeps building):
  1. robots.txt must not contain a Disallow-all ("Disallow: /"), which would hide a2c.dev from search engines.
  2. /api/lead references (or a data-endpoint of /api that the form turns into /api/lead) depend on the host:
     - PROD_HOST=github-pages (default): any reference FAILS, because GitHub Pages has no /api/lead.
     - PROD_HOST=cloudflare-pages: allowed ONLY if the Pages Function functions/api/lead.js exists (repo root, or next to
       OUTPUT_DIR) and forwards to the LEADS service binding at /lead. Without it, references FAIL as above.

Content guard (FAILS in every mode): claims removed after Agency QA (2026-10-17) must not come back.
"""
import os, re, sys, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEXT_EXT = {'.html', '.htm', '.js', '.json', '.txt', '.xml', '.css', '.svg', '.webmanifest', '.md'}
SKIP = re.compile(r'^(tools/|functions/|dist/|CNAME$|\.nojekyll$|\.gitignore$|\.github/|README\.md$|wrangler\.(toml|json|jsonc)$)')

# Removed claims (ES / EN / DE). Case-insensitive regexes, checked in every build target.
BANNED = [
    (r'mejor tarifa', 'hotel "best rate" claim (ES)'),
    (r'best (available )?rate', 'hotel "best rate" claim (EN)'),
    (r'besten? (verfügbaren )?preis', 'hotel "best rate" claim (DE)'),
    (r'price[- ]match|igualamos (el|la|tu) (precio|tarifa)|preisgarantie', 'price-match promise'),
    (r'señales de urgencia|detecta las señales', 'AI spots urgent warning signs (ES)'),
    (r'spots the warning signs|warning signs that need', 'AI spots urgent warning signs (EN)'),
    (r'erkennt warnzeichen', 'AI spots urgent warning signs (DE)'),
    (r'sin gluten por separado|gluten-free dishes separately|glutenfreie gerichte bereiten wir separat', 'safe gluten-free preparation promise'),
    (r'todo cubierto|all covered', 'restaurant "all covered" reply to dietary/celiac question'),
]

def output_files(d):
    d = pathlib.Path(d).resolve()
    try:
        out = subprocess.run(['git', 'ls-files', '-co', '--exclude-standard'], cwd=d, capture_output=True, text=True, check=True).stdout
        top = subprocess.run(['git', 'rev-parse', '--show-toplevel'], cwd=d, capture_output=True, text=True, check=True).stdout.strip()
        if pathlib.Path(top).resolve() != d: raise RuntimeError
        rels = [f for f in out.splitlines() if f and not SKIP.match(f)]
    except Exception:
        rels = [str(p.relative_to(d)) for p in d.rglob('*') if p.is_file()]
    return d, [r for r in rels if (d / r).is_file()]

def lead_function(d):
    """Path of a usable functions/api/lead.js (forwards to env.LEADS at /lead), or None."""
    for base in (d, d.parent, ROOT):
        f = base / 'functions' / 'api' / 'lead.js'
        if f.is_file():
            js = f.read_text(encoding='utf-8', errors='replace')
            if 'env.LEADS.fetch' in js and "'/lead'" in js and 'onRequest' in js:
                return f
    return None

def main():
    target = os.environ.get('BUILD_TARGET', 'preview').strip().lower()
    prod = target == 'production'
    host = os.environ.get('PROD_HOST', 'github-pages').strip().lower()
    if host not in ('github-pages', 'cloudflare-pages'):
        print(f'check-production: unknown PROD_HOST={host!r} (use github-pages or cloudflare-pages)'); return 2
    d, files = output_files(sys.argv[1] if len(sys.argv) > 1 else ROOT)
    fn = lead_function(d) if host == 'cloudflare-pages' else None
    prod_issues, claim_issues, allowed = [], [], 0
    robots = d / 'robots.txt'
    if robots.is_file():
        for n, line in enumerate(robots.read_text(encoding='utf-8', errors='replace').splitlines(), 1):
            if re.match(r'^\s*disallow\s*:\s*/\s*(#.*)?$', line, re.I):
                prod_issues.append(f'robots.txt:{n}: Disallow-all ("{line.strip()}")')
    else:
        prod_issues.append('robots.txt missing')
    for rel in files:
        p = d / rel
        if p.suffix.lower() not in TEXT_EXT: continue
        txt = p.read_text(encoding='utf-8', errors='replace')
        for m in re.finditer(r'/api/lead|data-endpoint="/api/?"', txt):
            ln = txt.count('\n', 0, m.start()) + 1
            if fn: allowed += 1; continue
            prod_issues.append(f'{rel}:{ln}: references /api/lead ({m.group(0)})')
        if p.suffix.lower() in ('.html', '.htm', '.js'):
            low = txt.lower()
            for pat, why in BANNED:
                for m in re.finditer(pat, low):
                    claim_issues.append(f'{rel}:{low.count(chr(10), 0, m.start()) + 1}: {why}: "{txt[m.start():m.end()]}"')
    print(f'check-production: target={target} host={host} dir={d} files={len(files)}')
    if host == 'cloudflare-pages':
        print(f'  OK   /api/lead served by Pages Function {fn} ({allowed} reference(s) allowed)' if fn
              else '  NOTE PROD_HOST=cloudflare-pages but no functions/api/lead.js forwarding to LEADS: /api/lead references are issues')
    for i in prod_issues: print(('  FAIL ' if prod else '  INFO (preview, not blocking) ') + i)
    for i in claim_issues: print('  FAIL removed claim: ' + i)
    failed = (prod and prod_issues) or claim_issues
    if failed:
        print(f'check-production: FAILED ({len(prod_issues) if prod else 0} production issue(s), {len(claim_issues)} removed-claim hit(s))')
        return 1
    print('check-production: PASS' + ('' if prod else f' (preview mode; {len(prod_issues)} production-only issue(s) not enforced)'))
    return 0

if __name__ == '__main__': sys.exit(main())

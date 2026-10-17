#!/usr/bin/env bash
# Production build for Cloudflare Pages (build command; output directory: dist).
#   BUILD_TARGET=production PROD_HOST=cloudflare-pages bash tools/build-prod.sh
# 1. regenerates the showcase + /en/ /de/ pages, 2. copies exactly the published files into dist/
#    (repo robots.txt = Allow: /, never the preview robots), 3. adds tools/prod/_headers, 4. runs the gate on dist/.
# The Pages Function lives in functions/ at the repo root (Pages compiles it from there; it is not copied into dist/).
set -euo pipefail
cd "$(dirname "$0")/.."
export BUILD_TARGET="${BUILD_TARGET:-production}" PROD_HOST="${PROD_HOST:-cloudflare-pages}"
python3 tools/build-showcase.py
python3 tools/build-i18n.py
rm -rf dist && mkdir dist
git ls-files -co --exclude-standard \
  | grep -Ev '^(tools/|\.github/|\.wrangler/|functions/|dist/|README\.md$|CNAME$|\.nojekyll$|\.gitignore$|wrangler\.(toml|json|jsonc)$)' \
  | while read -r f; do [ -f "$f" ] || continue; mkdir -p "dist/$(dirname "$f")"; cp "$f" "dist/$f"; done
cp tools/prod/_headers dist/_headers
python3 tools/check-production.py dist

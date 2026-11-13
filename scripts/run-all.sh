#!/usr/bin/env bash
# Run every feature on 3 browsers -> one HTML report per browser in reports/<browser>/
set -u
cd "$(dirname "$0")/.."
for b in chromium firefox webkit; do
  REPORT_DIR="reports/$b" npx playwright test --project="$b"
done
echo "Reports: reports/{chromium,firefox,webkit}/index.html"

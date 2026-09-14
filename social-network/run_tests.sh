#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
FAIL=0

for svc in services/*/; do
  name="$(basename "$svc")"
  if [ -d "${svc}tests" ]; then
    echo ""
    echo "=== ${name} ==="
    (cd "$svc" && python3 -m pytest -q) || FAIL=1
  fi
done

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "All service test suites passed."
else
  echo "One or more service test suites failed."
  exit 1
fi

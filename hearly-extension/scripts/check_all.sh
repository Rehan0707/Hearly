#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$ROOT/diagnostics.log"
echo "Starting diagnostics at $(date)" > "$LOG"

echo "--- Running typecheck ---" | tee -a "$LOG"
if npm run -w hearly-extension typecheck >> "$LOG" 2>&1; then
  echo "Typecheck: OK" | tee -a "$LOG"
else
  echo "Typecheck: FAIL (see $LOG)" | tee -a "$LOG"
fi

echo "--- Running unit tests ---" | tee -a "$LOG"
if npm run -w hearly-extension test >> "$LOG" 2>&1; then
  echo "Tests: OK" | tee -a "$LOG"
else
  echo "Tests: FAIL (see $LOG)" | tee -a "$LOG"
fi

echo "--- Building extension ---" | tee -a "$LOG"
if npm run -w hearly-extension build >> "$LOG" 2>&1; then
  echo "Build: OK" | tee -a "$LOG"
else
  echo "Build: FAIL (see $LOG)" | tee -a "$LOG"
fi

echo "--- Lint (if configured) ---" | tee -a "$LOG"
if command -v eslint >/dev/null 2>&1 && [ -f "$ROOT/.eslintrc.js" -o -f "$ROOT/.eslintrc.json" ]; then
  if npx eslint "$ROOT/src" >> "$LOG" 2>&1; then
    echo "ESLint: OK" | tee -a "$LOG"
  else
    echo "ESLint: FAIL (see $LOG)" | tee -a "$LOG"
  fi
else
  echo "ESLint: skipped (not configured)" | tee -a "$LOG"
fi

echo "--- Running Playwright E2E (if configured) ---" | tee -a "$LOG"
if [ -d "$ROOT/e2e" ] || [ -d "$ROOT/e2e" ]; then
  pushd "$ROOT" >/dev/null || true
  # Only run Playwright if packages are installed to avoid interactive install prompts
  if [ -d "$ROOT/node_modules/@playwright/test" ] || [ -d "$ROOT/node_modules/playwright" ]; then
    if npx playwright test --config=e2e/playwright.config.ts >> "$LOG" 2>&1; then
      echo "Playwright: OK" | tee -a "$LOG"
    else
      echo "Playwright: FAIL (see $LOG)" | tee -a "$LOG"
    fi
  else
    echo "Playwright: skipped (playwright not installed)" | tee -a "$LOG"
  fi
  popd >/dev/null || true
else
  echo "Playwright: skipped (no e2e dir)" | tee -a "$LOG"
fi

echo "--- Static scan ---" | tee -a "$LOG"
if [ -f "$ROOT/scripts/scan_issues.cjs" ]; then
  node "$ROOT/scripts/scan_issues.cjs" "$ROOT" | tee -a "$LOG"
else
  node "$ROOT/scripts/scan_issues.js" --root "$ROOT" | tee -a "$LOG"
fi

echo "Diagnostics complete. See $LOG for details."

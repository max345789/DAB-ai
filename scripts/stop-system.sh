#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

npx pm2 delete ecosystem.config.js >/dev/null 2>&1 || true
npx pm2 save --force >/dev/null 2>&1 || true

if command -v redis-cli >/dev/null 2>&1 && redis-cli ping >/dev/null 2>&1; then
  echo "Redis left running"
fi

echo "DAB AI services stopped"

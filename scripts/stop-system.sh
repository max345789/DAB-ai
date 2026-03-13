#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

npx pm2 delete ecosystem.config.js >/dev/null 2>&1 || true
npx pm2 save --force >/dev/null 2>&1 || true

echo "DAB AI services stopped"

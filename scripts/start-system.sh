#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

start_redis() {
  if redis-cli ping >/dev/null 2>&1; then
    echo "Redis already running"
    return 0
  fi

  if command -v brew >/dev/null 2>&1; then
    brew services start redis >/dev/null
    sleep 2
    if redis-cli ping >/dev/null 2>&1; then
      echo "Redis started via Homebrew"
      return 0
    fi
  fi

  if command -v redis-server >/dev/null 2>&1; then
    redis-server --daemonize yes >/dev/null 2>&1 || true
    sleep 2
    if redis-cli ping >/dev/null 2>&1; then
      echo "Redis started via redis-server"
      return 0
    fi
  fi

  echo "Failed to start Redis" >&2
  exit 1
}

start_redis

if [ ! -f ".next/BUILD_ID" ]; then
  echo "Next.js build not found, running npm run build"
  npm run build
fi

npx pm2 delete ecosystem.config.js >/dev/null 2>&1 || true
npx pm2 start ecosystem.config.js
npx pm2 save
npx pm2 ls

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

ENV_FILE="$ROOT_DIR/server/.env"
if [ -f "$ENV_FILE" ]; then
  supabase_url="$(grep -E '^SUPABASE_URL=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true)"
  supabase_anon="$(grep -E '^SUPABASE_ANON_KEY=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true)"

  if [ -z "${supabase_url}" ] || [ -z "${supabase_anon}" ] || [[ "${supabase_url}" == *"your-project-id"* ]] || [[ "${supabase_anon}" == *"your_supabase_anon_key_here"* ]]; then
    echo "Missing Supabase env vars in $ENV_FILE" >&2
    echo "Set SUPABASE_URL and SUPABASE_ANON_KEY (and SUPABASE_SERVICE_ROLE_KEY for admin writes), then re-run:" >&2
    echo "  ./scripts/start-system.sh" >&2
    exit 1
  fi
else
  echo "Missing $ENV_FILE (backend env). Create it from .env.example then set Supabase keys." >&2
  exit 1
fi

if [ ! -f ".next/BUILD_ID" ]; then
  echo "Next.js build not found, running npm run build"
  npm run build
fi

npx pm2 delete ecosystem.config.js >/dev/null 2>&1 || true
npx pm2 start ecosystem.config.js
npx pm2 save
npx pm2 ls

# Run DAB AI Locally

## 1. Install dependencies

From the repository root:

```bash
npm install
cd server && npm install && cd ..
cd ai-gateway && npm install && cd ..
cd ai-worker && npm install && cd ..
```

## 2. Configure environment

Copy variables from [`/Users/sarath/dab-ai/.env.example`](/Users/sarath/dab-ai/.env.example) into:

- `.env.local` for the frontend
- `server/.env` for the backend, gateway, and worker

Minimum required for local operation:

- `NEXT_PUBLIC_API_BASE`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `REDIS_URL`
- `AI_GATEWAY_KEY`
- `AI_RESULT_SECRET`
- `CLAUDE_WORKER_KEY`

Optional for real AI output:

- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`

## 3. Start Redis

If using Homebrew:

```bash
brew services start redis
redis-cli ping
```

Expected response:

```bash
PONG
```

## 4. Start the full system

From the repository root:

```bash
./scripts/start-system.sh
```

This starts:

- backend
- AI gateway
- AI worker pool
- frontend

## 5. Monitor the system

PM2 status:

```bash
npx pm2 ls
```

Backend health:

```bash
curl -sS http://localhost:5001/api/health
curl -sS http://localhost:5001/system/health
curl -sS http://localhost:5001/system/metrics
```

Gateway health:

```bash
curl -sS http://localhost:4100/
```

AI status:

```bash
curl -sS http://localhost:5001/api/ai/status
curl -sS http://localhost:5001/api/ai/metrics
```

## 6. Stop the system

```bash
./scripts/stop-system.sh
```

## 7. Notes

- Redis is required for queueing.
- Claude CLI must be installed and logged in for real Claude worker output.
- If Claude quota is unavailable, set `CLAUDE_WORKER_MOCK=true` for queue validation without live model output.

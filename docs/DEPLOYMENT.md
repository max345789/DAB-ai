# DAB AI – Production Deployment Guide

This document explains how to deploy the DAB AI platform to a live production environment.

---

## Repository Structure

```
/                   ← Next.js frontend (root)
/server             ← Node.js Express API
/docs               ← Documentation
/.env.example       ← Template for all environment variables
```

---

## Prerequisites

- Node.js 18+ and npm 9+
- A Supabase project (free tier works for staging)
- A domain with DNS control (e.g. `yourdomain.com`)
- A hosting provider for backend (Railway, Render, Fly.io, or a VPS)
- A hosting provider for frontend (Vercel recommended for Next.js)

---

## 1. Environment Variables

Copy `.env.example` and fill in all values before deploying.

**Frontend** — set these in your hosting provider's dashboard or in `.env.local` for local dev:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE` | Full URL to the backend API including `/api` suffix. Example: `https://api.yourdomain.com/api` |

**Backend** — set these in your server environment or in `server/.env`:

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (default: `5000`) |
| `NODE_ENV` | Set to `production` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret) |
| `JWT_SECRET` | Random string, minimum 32 characters |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key (preferred AI provider) |
| `OPENAI_API_KEY` | OpenAI key (optional fallback) |
| `META_ADS_TOKEN` | Meta (Facebook) Ads access token |
| `GOOGLE_ADS_TOKEN` | Google Ads API token |
| `WHATSAPP_API_KEY` | WhatsApp Cloud API token |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verification token |
| `EMAIL_SMTP_KEY` | SMTP password or API key |
| `EMAIL_SMTP_HOST` | SMTP server hostname |
| `EMAIL_FROM_ADDRESS` | Sender email address |
| `ALLOWED_ORIGIN` | Frontend origin for CORS (e.g. `https://app.yourdomain.com`) |

---

## 2. Database Setup

The backend requires the following Supabase tables. Run the canonical schema at `server/docs/schema.sql` in the Supabase SQL editor.

Tables required:
- `users`
- `leads`
- `campaigns`
- `campaign_stats`
- `automation_rules`
- `automation_history`
- `agent_activity`
- `agent_tasks`
- `finance`
- `integrations`
- `meetings`
- `followups`

The schema file also creates the `dashboard_stats` aggregation view.

**Steps:**
1. Open your Supabase project → SQL Editor
2. Paste the contents of `server/docs/schema.sql`
3. Click **Run**
4. Verify tables appear in the Table Editor

---

## 3. Backend Deployment

### Option A — Railway (recommended)

1. Push the `server/` folder (or the entire repo) to GitHub
2. Create a new Railway project → **Deploy from GitHub repo**
3. Set the **root directory** to `server`
4. Add all environment variables from the table above
5. Railway auto-detects `package.json` and runs `npm start`
6. Set a custom domain: `api.yourdomain.com` → point your DNS CNAME to the Railway-provided URL

### Option B — Render

1. New Web Service → connect your GitHub repo
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables
6. Custom domain: `api.yourdomain.com`

### Option C — VPS (Ubuntu / Debian)

```bash
# On your server:
git clone https://github.com/your-org/dab-ai.git
cd dab-ai/server
cp .env.example .env
# Edit .env with real values
npm install --omit=dev

# Install PM2 for process management
npm install -g pm2
pm2 start index.js --name dab-ai-api
pm2 save
pm2 startup

# Nginx reverse proxy (example config)
# server {
#   server_name api.yourdomain.com;
#   location / { proxy_pass http://localhost:5001; }
# }
```

### Health check

Once deployed, verify the backend is live:

```
GET https://api.yourdomain.com/api/health
```

Expected response:
```json
{ "status": "ok", "db": "connected", "time": "..." }
```

---

## 4. Frontend Deployment

### Vercel (recommended)

1. Push the repo root to GitHub
2. Import the project in Vercel
3. Framework preset: **Next.js** (auto-detected)
4. Add environment variable:
   - `NEXT_PUBLIC_API_BASE` = `https://api.yourdomain.com/api`
5. Deploy
6. Assign custom domain: `app.yourdomain.com`

### Manual build

```bash
cd /path/to/dab-ai        # project root (where package.json is)
cp .env.example .env.local
# Edit .env.local: set NEXT_PUBLIC_API_BASE=https://api.yourdomain.com/api
npm install
npm run build
npm run start             # runs on port 3000 by default
```

---

## 5. Domain Configuration

| Subdomain | Service | Example DNS record |
|---|---|---|
| `app.yourdomain.com` | Next.js frontend | CNAME → Vercel / A → server IP |
| `api.yourdomain.com` | Express backend | CNAME → Railway/Render URL |

After pointing DNS, enable HTTPS at your hosting provider (Vercel and Railway do this automatically).

Update the backend `ALLOWED_ORIGIN` to match the frontend domain exactly:
```
ALLOWED_ORIGIN=https://app.yourdomain.com
```

---

## 6. Integration Setup

### Meta Ads
1. Create a Meta Developer App at developers.facebook.com
2. Generate a long-lived access token with `ads_management` permission
3. Set `META_ADS_TOKEN` and `META_AD_ACCOUNT_ID` in backend env

### Google Ads
1. Enable Google Ads API in Google Cloud Console
2. Generate an OAuth2 token with `adwords` scope
3. Set `GOOGLE_ADS_TOKEN` and `GOOGLE_ADS_CUSTOMER_ID`

### WhatsApp (Meta Cloud API)
1. Create a WhatsApp Business app in Meta Developer Console
2. Set the webhook URL to: `https://api.yourdomain.com/api/integrations/whatsapp/webhook`
3. Use `WHATSAPP_VERIFY_TOKEN` for webhook verification
4. Set `WHATSAPP_API_KEY` and `WHATSAPP_PHONE_NUMBER_ID`

### Email (SMTP)
Configure your SMTP provider (SendGrid, Mailgun, AWS SES, etc.):
1. Create an API key / SMTP credential
2. Set `EMAIL_SMTP_KEY`, `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_FROM_ADDRESS`

### Calendar (Calendly or Google)
- Calendly: Set `CALENDLY_API_KEY`
- Google Calendar: Set `GOOGLE_CALENDAR_CLIENT_ID` + `GOOGLE_CALENDAR_CLIENT_SECRET` and complete the OAuth2 flow

---

## 7. Post-Deployment Checklist

- [ ] `GET /api/health` returns `{ status: "ok", db: "connected" }`
- [ ] `GET /api/dashboard/summary` returns metrics (may return empty data before first usage)
- [ ] Frontend loads at `https://app.yourdomain.com`
- [ ] Dashboard page connects to the live backend (no mock data fallback in logs)
- [ ] Register a test user via `POST /api/auth/register`
- [ ] CORS is not blocking requests from the frontend origin
- [ ] All integration environment variables are set (can be empty for optional services)
- [ ] SSL/HTTPS is active on both subdomains

---

## 8. Local Development

```bash
# Terminal 1 – Backend
cd server
cp .env.example .env   # fill in Supabase + AI keys
npm install
npm run dev            # nodemon, port 5000

# Terminal 2 – Frontend
cd ..                  # project root
cp .env.example .env.local
# Set NEXT_PUBLIC_API_BASE=http://localhost:5001/api  (or leave empty to use proxy)
npm install
npm run dev            # Next.js, port 3000
```

The Next.js dev server proxies `/api/*` → `localhost:5001/api/*` via `next.config.ts`, so you can also leave `NEXT_PUBLIC_API_BASE` empty during local development.

---

## 9. Monitoring & Logs

- **Backend logs**: The server uses a structured logger (`services/loggerService.js`). Pipe output to a log service (Papertrail, Logtail, Datadog) via your hosting provider's log drain.
- **Error tracking**: Integrate Sentry by adding `@sentry/node` and calling `Sentry.init()` before the route registration in `server/index.js`.
- **Uptime monitoring**: Set up a ping monitor on `https://api.yourdomain.com/api/health` via UptimeRobot or Better Uptime.
- **Database**: Use Supabase's built-in dashboard for query metrics, slow query logs, and usage stats.

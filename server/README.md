# DAB AI – Backend Server

Node.js + Express backend for the DAB AI marketing agent platform.
Connected to Supabase for persistence.

---

## Folder Structure

```
server/
├── index.js                  # Express app entry point
├── package.json
├── .env                      # Live env vars (gitignored)
├── .env.example              # Template
│
├── controllers/
│   ├── chatController.js     # POST /chat  |  GET /chat/history
│   ├── leadController.js     # POST /lead  |  GET /leads  |  PATCH /lead/:id
│   ├── dashboardController.js# GET /dashboard
│   └── campaignController.js # POST /campaign | GET /campaigns | PATCH /campaign/:id
│
├── routes/
│   ├── chatRoutes.js
│   ├── leadRoutes.js
│   ├── dashboardRoutes.js
│   └── campaignRoutes.js
│
├── models/
│   ├── Lead.js               # Lead schema helpers
│   ├── Campaign.js           # Campaign schema helpers
│   └── Conversation.js       # Conversation schema helpers
│
└── services/
    ├── supabaseClient.js     # Supabase singleton (public + admin)
    └── aiAgent.js            # Rule-based AI agent logic
```

---

## API Endpoints

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | /                     | Health check                         |
| POST   | /api/chat             | Send message → get AI response       |
| GET    | /api/chat/history     | Retrieve conversation history        |
| GET    | /api/dashboard        | Summary stats                        |
| POST   | /api/lead             | Create a new lead                    |
| GET    | /api/leads            | List all leads                       |
| GET    | /api/lead/:id         | Get single lead                      |
| PATCH  | /api/lead/:id         | Update lead                          |
| POST   | /api/campaign         | Create a campaign                    |
| GET    | /api/campaigns        | List all campaigns                   |
| PATCH  | /api/campaign/:id     | Update campaign (spend, status, etc) |

---

## AI Agent Intents

The agent detects intent from the user's message and responds accordingly:

| Trigger keywords                        | Intent         | Action                         |
|-----------------------------------------|----------------|--------------------------------|
| "create ad", "run ad", "new campaign"   | CREATE_AD      | Returns ad copy + suggestion   |
| "follow up", "check in", "reach out"    | FOLLOW_UP      | Returns follow-up template     |
| "book meeting", "schedule call"         | BOOK_MEETING   | Returns availability message   |
| "show leads", "lead report"             | LEAD_REPORT    | Directs to /leads endpoint     |
| "ad spend", "budget", "spending"        | AD_SPEND       | Directs to /dashboard          |
| *(anything else)*                       | GENERAL        | Returns capability overview    |

---

## Running the Server

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Set up environment
The `.env` file is already pre-configured with your Supabase credentials.
Add `SUPABASE_SERVICE_ROLE_KEY` from your Supabase dashboard for admin writes.

### 3. Start in development mode
```bash
npm run dev
```

### 4. Start in production mode
```bash
npm start
```

Server runs on the `PORT` specified in `.env`.

---

## Example: Chat with the AI Agent

```bash
curl -X POST "$API_BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "create ad on Meta", "user_id": 1}'
```

## Example: Create a Lead

```bash
curl -X POST "$API_BASE/api/lead" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Smith", "email": "john@example.com", "channel": "meta"}'
```

## Example: Dashboard Stats

```bash
curl "$API_BASE/api/dashboard"
```

---

## Database (Supabase)

Tables: `users`, `leads`, `campaigns`, `conversations`, `bookings`,
`messages`, `activity_log`, `followup_log`

View: `dashboard_stats` (computed aggregate, read-only)

Supabase project: **dab ai** (ap-southeast-1)

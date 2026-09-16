# Netcompany Tournament Organizer Tool

Web platform for Netcompany to configure, schedule, manage, and monitor sports and esports tournaments. Administrators create events, generate brackets, enter scores, and track results. Guests browse public pages; signed-in users can favorite tournaments and receive email reminders.

This README is the runbook. Architecture, roles, APIs, and operations: **[docs/TECHNICAL.md](docs/TECHNICAL.md)**. Database schema & policies: **[docs/DATABASE.md](docs/DATABASE.md)**.

## Who can do what

| Audience | Access |
| --- | --- |
| Guest (not signed in) | Sports, published tournaments, brackets/standings, match details, calendar |
| User | Guest access + Google/Facebook login, profile, favorite tournaments, email reminders |
| Admin | User access + dashboard, create/run **their own** tournaments, brackets, schedules, scoring, AI creation advisor |
| Super Admin | Everything an admin can do, plus account management (promote / demote / disable / enable) and **any** tournament, not only their own |

There is no native mobile app. The UI is a responsive browser SPA (React + Tailwind CSS).

## Repository layout

```
tournament-organizer/
├── frontend/          React + Vite SPA (Tailwind CSS)
├── backend/           Express API (Node.js)
├── supabase/          Baseline schema, migrations, and seed.sql
├── env/modes/         Local vs Docker environment switcher
├── scripts/           env-mode helper + Let's Encrypt loop
├── docker-compose.yml API + nginx + certbot
└── docs/              TECHNICAL.md, DATABASE.md
```

## Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS 4
- **Backend:** Node.js 22, Express 5
- **Data:** PostgreSQL on Supabase (Auth + Storage on the same project)
- **Production:** Docker Compose, nginx (`/` SPA, `/api` reverse proxy)

## Prerequisites

- Node.js **22** and npm
- A **Supabase** project
- Docker Compose for the production-style stack
- Optional: SMTP (email reminders), OpenAI-compatible API key for the admin advisor (`AI_BASE_URL` + `AI_API_KEY`)

## Database setup (Supabase migrations)

Before starting the app, apply the database schema and sports catalog to your Supabase project using either option below:

### Option A: Supabase Web Dashboard (Recommended)

1. Go to your project in the [Supabase Dashboard](https://supabase.com/dashboard) and open the **SQL Editor**.
2. Open and run **[`supabase/migrations/20260915000100_init_tournament_schema.sql`](supabase/migrations/20260915000100_init_tournament_schema.sql)** (creates all tables, triggers, RLS policies, and storage buckets).
3. Open and run **[`supabase/migrations/20260916000200_seed_sports_catalog.sql`](supabase/migrations/20260916000200_seed_sports_catalog.sql)** (seeds the 12 core sports).

### Option B: Supabase CLI

If you use the Supabase CLI, push migrations directly from the repository root:

```bash
# Link your remote Supabase project
npx supabase login
npx supabase link --project-ref <your-supabase-project-ref>

# Push all migrations (creates schema and seeds sports catalog)
npx supabase db push
```

> For local Supabase Docker development, running `npx supabase start` automatically applies all migrations and runs `supabase/seed.sql`.

Details on schema design and RLS policies: **[docs/DATABASE.md](docs/DATABASE.md)**.

## Quick start (local)

1. Copy env templates and fill in Supabase values:

   ```bash
   copy backend\.env.example backend\.env
   copy frontend\.env.example frontend\.env
   ```

   On macOS/Linux use `cp`. Full variable list: [docs/TECHNICAL.md](docs/TECHNICAL.md#16-environment-variables).

2. Switch to local ports (backend **5001**, Vite **5173**):

   ```bash
   npm run env:local
   npm run env:status
   ```

3. Start API and SPA:

   ```bash
   cd backend && npm install && npm run dev
   ```

   ```bash
   cd frontend && npm install && npm run dev
   ```

4. Open **http://localhost:5173**. Leave `VITE_API_BASE_URL` unset so Vite can proxy `/api`.

Allow-list `/oauth/callback` in Supabase Auth. Create the first Super Admin by setting `role` on `public.user_roles` (see the technical document).

## Production-style run (Docker)

```bash
copy .env.example .env
npm run env:deploy
docker compose up -d --build
```

nginx serves the SPA on **80/443** and proxies `/api/` to the backend. Do not expose port 5000 publicly. Details: [docs/TECHNICAL.md](docs/TECHNICAL.md#18-deployment).

## Tests

```bash
cd backend && npm test
```

## License

MIT — see [LICENSE](LICENSE).

# Itinera 2.0.0

Itinera is a collaborative travel-itinerary application built from a clean architecture. It presents each trip as a horizontal day-by-day calendar. Double-clicking a day creates a plan; double-clicking a plan edits its time, title, description, location and category.

## Why version 2 is a clean rebuild

Version 2 does not inherit the original Next.js/NestJS dependency tree. It deliberately uses a smaller stack with no dependency overrides or forced audit fixes:

- **Frontend:** React 19 + Vite 8 + TypeScript.
- **Backend:** Fastify 5 + TypeScript.
- **Database:** PostgreSQL 17 + Drizzle ORM.
- **Validation:** Zod in frontend and backend.
- **Authentication:** opaque server-side sessions stored as SHA-256 hashes in PostgreSQL.
- **Passwords:** Argon2id.
- **Production:** static frontend on Netlify; API and PostgreSQL on Hetzner; Caddy as the shared TLS gateway.

The frontend and backend have independent `package.json` and `package-lock.json` files. This avoids workspace-resolution coupling and makes audits and deployment reproducible.

## Included functionality

- Registration, login and logout.
- Password recovery through Resend's HTTP API, with a safe log-only fallback while mail is not configured.
- Password change and permanent account deletion.
- User and administrator panels.
- Full itinerary CRUD.
- Activity CRUD with optimistic-concurrency protection.
- Horizontal calendar with double-click creation and editing.
- Read-only public links whose raw tokens are never stored in the database.
- Registered collaborators with `READ` or `WRITE` permission.
- Administrator management of users and all itineraries.
- Frontend and backend validation.
- Rate limiting, security headers, SameSite cookies, origin checks and audit logs.
- Indexed relational schema, foreign keys, constraints and transactional migrations.
- Health endpoints and Docker healthchecks.

## Local development

Requirements: Node.js 22.12 or newer, npm and Docker.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker compose -f docker-compose.dev.yml up -d

cd backend
npm ci
npm run build
node dist/db/migrate.js
node dist/seeds/admin.js
npm run dev
```

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`.

## Quality commands

Backend:

```bash
cd backend
npm ci
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

Frontend:

```bash
cd frontend
npm ci
npm run typecheck
npm run build
npm audit --omit=dev
```

## Production deployment

See [DEPLOY.md](DEPLOY.md). The v2 compose project and Docker aliases are intentionally different from v1, so v2 can be tested beside the current deployment before any traffic is switched.

# Architecture

## Runtime topology

```text
Browser
  │
  ├── static application ── Netlify / React + Vite
  │
  └── /api/* proxy ─────── HTTPS / Caddy on Hetzner
                               │
                               └── itinera-v2-api:4000 / Fastify
                                         │
                                         └── private PostgreSQL 17
```

## Separation of concerns

`frontend/` is a static single-page application. It has no server runtime and therefore cannot access database secrets. Netlify only serves compiled assets and proxies `/api/*` to the HTTPS API.

`backend/` owns authentication, authorisation, validation, transactions, audit records and persistence. It never trusts permissions or IDs supplied by the client.

## Authentication model

The browser receives an opaque random session token in an `HttpOnly`, `SameSite=Lax`, secure cookie. Only a SHA-256 hash is stored in `sessions`. A database leak therefore does not directly reveal usable browser tokens. Passwords are processed with Argon2id.

State-changing requests are protected through SameSite cookies and an explicit Origin allow-list. CORS only permits configured frontend origins.

## Sharing model

A public sharing token is random and transmitted only when generated. PostgreSQL stores its SHA-256 hash and a short non-secret hint. Rotating the link invalidates the previous URL immediately.

## Authorisation

- `OWNER`: full itinerary, collaborator and share-link management.
- `WRITE`: read and activity CRUD.
- `READ`: read-only registered access.
- `PUBLIC`: read-only token access.
- `ADMIN`: global management.

Every protected API route determines access server-side.

## Data integrity

The database enforces unique emails, foreign keys, cascading deletion, date-range constraints, time-range constraints and indexed access paths. Activity updates carry a version field to detect conflicting simultaneous edits.

## Deployment isolation

Production uses compose project `itinera_v2`, network `itinera_v2_private`, volume `itinera_v2_postgres_data` and gateway alias `itinera-v2-api`. These names do not replace the v1 containers or database.

# Build report — Itinera 2.0.0

Generated: 2026-06-24

## Clean architecture decision

The project was rebuilt without copying the v1 application source. The dependency tree contains no `overrides`, no `npm audit fix --force`, no Next.js, no NestJS Express adapter and no Multer.

## Verified in the build environment

### Backend

- Clean `npm ci`: passed.
- TypeScript strict typecheck: passed.
- Vitest security utility tests: 3 passed.
- Production TypeScript build: passed.
- `npm audit` and `npm audit --omit=dev`: **0 vulnerabilities**.

### Frontend

- Clean `npm ci`: passed.
- TypeScript project typecheck: passed.
- Vite production build: passed.
- 147 modules transformed.
- Main JavaScript bundle: approximately 367 KB, 109 KB gzip.
- `npm audit` and `npm audit --omit=dev`: **0 vulnerabilities**.

## Environment limitation

A Docker daemon was not available in the artifact-generation environment, so the Docker image and PostgreSQL integration could not be started here. The Dockerfile, Compose file, SQL migration, healthchecks and deterministic lockfiles are included for server-side validation before switching traffic.

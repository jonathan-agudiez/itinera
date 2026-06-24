# Security notes

## Implemented controls

- Argon2id password hashing.
- Opaque session cookies; raw session tokens are not persisted.
- `HttpOnly`, `Secure` and `SameSite=Lax` production cookies.
- CORS allow-list and Origin verification for mutating requests.
- Global and authentication-specific rate limits.
- Helmet security headers and Caddy edge headers.
- Body-size and request-time limits.
- Uniform forgotten-password responses to reduce account enumeration.
- One-hour, single-use password reset tokens stored only as hashes.
- Session revocation after password change, password reset, account disablement or account deletion.
- Administrator self-delete/self-disable protection.
- Server-side permission checks for every private resource.
- Optimistic locking for collaborative entry updates.
- Audit log for important account, sharing and administrative actions.
- Database port is not published in production.

## Secrets

Never commit `.env.production`. Generate production passwords using a cryptographically secure generator. The repository contains only `.env.production.example`.

## Email

Password recovery uses the Resend HTTPS API when `RESEND_API_KEY` is configured. This avoids an SMTP client dependency. Without a key, reset links are logged by the API for controlled pre-production testing and must not be considered a production mail solution.

## Reporting

Before each release run both production audits, typechecks, backend tests and production builds documented in `README.md`.

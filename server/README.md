# FarmBridge API

NestJS + PostgreSQL + Redis. Provides the security, audit, tenancy and payment
architecture the mobile app cannot enforce on its own.

## Running it

```bash
cd server
cp .env.example .env          # then fill in the secrets it lists
npm install
docker compose up -d          # Postgres + Redis
npx prisma migrate deploy
npm run db:harden             # makes the audit table append-only — see below
npx prisma db seed            # development accounts, one per role
npm run start:dev
```

`GET /v1/health/ready` should report `{"status":"ok","database":"up"}`.

If a local Postgres already holds port 5432, set `POSTGRES_HOST_PORT` in
`.env` — the compose file reads it and defaults to 5433.

## What is enforced, and where

**Authentication.** Argon2id password hashing (64 MiB, 3 passes). Access tokens
are short-lived; refresh tokens rotate on every use and are stored only as
SHA-256 digests, so a database dump yields no working sessions. Presenting an
already-rotated token revokes its entire family — the standard theft signal.
Five failed logins lock an account for 15 minutes. Login timing is equalised
against a decoy hash so a missing account cannot be distinguished from a wrong
password.

**Authorisation** is action-based (`products.create`), never role checks in
handlers. `src/rbac/permissions.ts` maps the nine roles to actions; deny always
beats grant, so revoking access during an incident is immediate. Resource
ownership is separate — see `assertOwnership`, which returns 404 rather than
403 so a caller cannot confirm that someone else's record exists.

**Tenancy** is enforced in the data layer. `PrismaService.forTenant(id)` returns
a client that merges `tenantId` into every query and every create. A service
method physically cannot read another tenant's rows through it, however it is
written. The unscoped client is for login-before-tenant-is-known and platform
administration only.

**Audit** is append-only in the database, not by convention. `npm run db:harden`
revokes UPDATE and DELETE on `audit_logs` from the application role and adds a
trigger that refuses mutation from *any* role, including the owner. Verified:

```
UPDATE audit_logs ... -> ERROR: audit_logs is append-only (attempted UPDATE)
DELETE FROM audit_logs -> ERROR: audit_logs is append-only (attempted DELETE)
```

Retention, when needed, is a deliberate operation with a paper trail: disable
the trigger as the owner, archive, delete, re-enable.

**Payments** sit behind `PaymentProvider`. Paynow is implemented with its
SHA-512 request and webhook signing; an unverified webhook is rejected rather
than trusted, because a callback that marks an order paid is free goods. The
mock provider exists for development and the process refuses to boot in
production with it selected.

Money is stored in integer cents. Payments carry an idempotency key so a retry
from a flaky mobile connection cannot charge twice.

## Verified behaviour

Exercised end-to-end against real Postgres and Redis:

| Check | Result |
|---|---|
| Protected route with no token | 401 |
| Farmer reading the audit trail | 403 |
| Farmer creating a payment | 403 |
| Auditor reading the audit trail | 200 |
| Registering as `SUPER_ADMIN` | 400 — not self-assignable |
| Extra fields (`roles`, `isActive`) in a request body | 400 — stripped and rejected |
| Password under 12 characters | 400 |
| Refresh rotation | new token issued |
| Replaying a rotated refresh token | 401, whole family revoked |
| Failed login | recorded with IP and attempt count |
| Auditor querying across tenants | sees own tenant only |

## Not built yet

Products, orders, transport and community endpoints — the schema models them,
but the controllers are not written. FastAPI (for crop-health inference) is a
later addition to the compose file.

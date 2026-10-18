# Body Boost Supplements — storefront + admin

A supplement store for Meerut, India: customer-facing catalog with a WhatsApp-first
checkout (no online payment), and a password-protected admin for products, orders,
images and store settings.

**Stack:** Next.js 15 (App Router, RSC) · React 19 · TypeScript · Tailwind CSS ·
MongoDB via Mongoose · Zod validation · jose (JWT session cookies) · Bun.

## Quick start

```bash
bun install
cp .env.example .env.local       # then edit — at minimum MONGODB_URI and AUTH_SECRET

bun run db:temp                  # in-memory MongoDB for local dev (prints the URI)
bun run seed                     # admin user + demo products + indexes
bun run dev                      # http://localhost:3000
```

Admin: `http://localhost:3000/admin` — credentials come from `ADMIN_EMAIL` /
`ADMIN_PASSWORD` in `.env.local` (seeded by `bun run seed:admin`).

## Scripts

| Script                  | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `bun run dev`           | Dev server on :3000                                  |
| `bun run build`         | Production build                                     |
| `bun run start`         | Serve the production build                           |
| `bun run typecheck`     | `tsc --noEmit`                                       |
| `bun run lint`          | ESLint                                               |
| `bun run format:check`  | Prettier check (`bun run format` to write)           |
| `bun run check`         | typecheck + lint + format:check in one go            |
| `bun run db:temp`       | Ephemeral local MongoDB (`mongodb-memory-server`)    |
| `bun run seed`          | seed:admin + seed:products + seed:indexes            |
| `bun run seed:settings` | Create the store-settings doc with env defaults      |

## Environment

All configuration lives in `.env.local` (see `.env.example` for the annotated list):
database URI, site URL and env-based store defaults, admin seed credentials,
`AUTH_SECRET` (JWT signing), optional Resend/Telegram notification credentials, and
optional Cloudinary credentials for admin image uploads.

- **Optional channels are safe to leave empty** — each is skipped (and logged) while
  unconfigured, so orders always succeed.
- **Owner-facing values override env**: store name, WhatsApp, phone and address are
  editable in **Admin → Settings**; env vars are only the fallback/seed values.
- In production, set secrets through the host's secret store — never commit them.

## Architecture notes

- `src/app/(store)` — public storefront (force-dynamic: header/footer/contact read the
  settings doc, so admin edits appear immediately without a rebuild).
- `src/app/admin` — owner dashboard. Route protection is two-layer: `middleware.ts`
  verifies the session JWT on every `/admin/**` request, and layouts re-check with
  `getSession()` (belt-and-braces). Dashboard pages are `force-dynamic` so per-user
  HTML is never statically cached.
- `src/app/api` — JSON API with a consistent `{ success, data | error }` envelope,
  Zod validation, in-memory rate limiting (per instance), and `requireAdmin()` on all
  `/api/admin/*` routes.
- `src/lib/notify` — order notifications via Resend email and/or Telegram, each
  enabled only when both its env vars are set **and** its Admin → Settings toggle is
  on. `notifyNewOrder` never throws — notification failure can't fail an order.
- `src/lib/queries` — all DB access; `getPublicSettings()` never throws (env fallback),
  so a missing settings doc or a DB outage can't take the storefront down.
- `GET /api/health` — 200 with `database: connected`, 503 when the DB is unreachable;
  also reports non-secret `configured/unconfigured` flags for the optional
  integrations.

## Known limitations

- Order/email rate limiting is in-memory: correct for a single instance, resets on
  restart and doesn't coordinate across multiple instances.
- No test suite yet — `bun run check` plus the build are the verification gates.
- `<title>`/meta descriptions use the env-based store name; visible chrome (header,
  footer, contact, WhatsApp links) uses the owner-edited name.
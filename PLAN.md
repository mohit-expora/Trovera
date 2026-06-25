# Trovera — Library Management System

> Full-stack library management for admin. NestJS + PostgreSQL backend, Next.js 14 App Router frontend, React Native mobile app.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + Prisma ORM + TypeScript |
| Database | PostgreSQL 16 (auto-increment integer PKs) |
| Cache / Session Store | Redis 7 |
| Auth | Session-based (express-session + Redis store) + Google OAuth ID Token |
| Frontend | Next.js 14 App Router + shadcn/ui + TailwindCSS |
| Mobile | React Native + Expo |
| Data fetching | SWR (client-side) + React Server Components (SSR) |
| Global state | Zustand (3 stores: auth, ui, book-optimistic) |
| i18n | next-intl + LibreTranslate/DeepL for seed translation (en, hi, es, fr) |
| Dev infra | Docker Compose: Postgres + Redis (ports 5433, 6380 to avoid conflicts) |

---

## Project Structure

```
/Trovera/
├── backend/                    # NestJS application
├── frontend/                   # Next.js 14 application
├── mobile/                     # React Native (Expo) application
├── docker/
│   ├── dev/docker-compose.yml  # Full dev stack
│   ├── Dockerfile.backend      # Multi-stage: base → dev/build → prod
│   └── Dockerfile.frontend
├── trovera_full.sql            # Full DB schema — run on fresh PostgreSQL
├── PLAN.md                     # This file
├── .gitignore
└── .editorconfig
```

---

## Backend Architecture (`/backend/src/`)

```
├── main.ts                     # Bootstrap: helmet, session middleware, CORS, global pipes/filters
├── app.module.ts               # Root module — all feature modules + global cache interceptor
├── config/
│   └── configuration.ts        # Environment config (session, DB pool, Redis, SMTP, etc.)
│
├── common/
│   ├── guards/
│   │   ├── admin-auth.guard.ts # Reads req.session.user → sets req.user (session-based auth)
│   │   └── permissions.guard.ts# RBAC: checks req.user.permissions against @RequirePermissions()
│   ├── decorators/
│   │   ├── admin-user.decorator.ts  # @AdminUser() — extracts user from req.user
│   │   ├── cacheable.decorator.ts   # @Cacheable(keyFn, ttl) / @CacheEvict(...patterns)
│   │   └── require-permissions.decorator.ts
│   ├── interceptors/
│   │   ├── cache.interceptor.ts     # Global interceptor — reads @Cacheable/@CacheEvict metadata
│   │   ├── transform.interceptor.ts # Wraps all responses in { success, data } envelope
│   │   └── request-id.interceptor.ts
│   ├── filters/
│   │   └── all-exceptions.filter.ts # Catches all errors → error_logs table + structured response
│   └── exceptions/
│       └── app.exception.ts         # Custom exception hierarchy (AuthenticationError, etc.)
│
├── prisma/
│   └── schema/                 # Split Prisma schema (prismaSchemaFolder preview feature)
│       ├── base.prisma         # generator + datasource
│       ├── enums/
│       │   ├── auth.prisma     # AuthProvider, UserRole
│       │   ├── transaction.prisma # TransactionStatus, FineStatus
│       │   └── system.prisma   # ErrorSeverity
│       ├── auth.prisma         # User, EmailVerificationToken models
│       ├── book.prisma         # Book, BookCategory models
│       ├── transaction.prisma  # Transaction, Fine models
│       └── system.prisma       # ErrorLog model
│
├── auth/                       # Authentication module
│   ├── auth.module.ts
│   ├── auth.service.ts         # bcrypt, Google ID token verify, session user builder
│   ├── auth.controller.ts      # login/logout/register/google/me — session lifecycle
│   └── dto/                    # LoginDto, RegisterDto, etc.
│
├── books/                      # Books module
│   ├── books.service.ts        # Pure DB logic (no cache — handled by interceptor)
│   ├── books.controller.ts     # @Cacheable / @CacheEvict decorators on endpoints
│   └── dto/
│
├── transactions/               # Transactions module
├── users/                      # Users module
├── roles/                      # Roles & permissions config module
├── errors/                     # Error logging module
├── translate/                  # Translation proxy module
├── cache/
│   ├── cache.module.ts
│   └── cache.service.ts        # Redis get/set/delete/deletePattern
│
└── health/
    └── health.controller.ts    # /health, /health/readiness (excluded from api/v1 prefix)
```

---

## Database Schema

### Tables (integer auto-increment PKs)

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `users` | id, email VARCHAR(255), full_name, password_hash, auth_provider, google_id, role, is_active, is_email_verified, membership_id, deleted_at | Soft delete; password_hash nullable for Google-only users |
| `email_verification_tokens` | id, user_id, token VARCHAR(500), expires_at, used_at | Used for both email verify and password reset (pwd: prefix) |
| `book_categories` | id, name VARCHAR(100), slug VARCHAR(100) | |
| `books` | id, title VARCHAR(500), isbn VARCHAR(20), author, publisher, total_quantity, available_quantity, tags TEXT[], deleted_at | Soft delete |
| `transactions` | id, book_id, member_id, issued_by, returned_to, status, issued_at, due_date, returned_at | status: issued/returned/overdue/lost |
| `fines` | id, transaction_id, member_id, amount DECIMAL(10,2), per_day_rate, days_overdue, status, waived_by | status: pending/paid/waived |
| `error_logs` | id, error_code VARCHAR(100), severity, message, stack_trace, context JSONB, user_id, ip_address, resolved | Runtime errors captured by global exception filter |

### Removed Tables (vs original design)
- ~~`refresh_tokens`~~ — no longer needed (session-based auth)
- ~~`permissions`~~ / ~~`role_permissions`~~ — permissions are hardcoded in `roles/permissions.config.ts`
- ~~`audit_logs`~~ — not implemented yet

---

## Auth System

### Session-Based (express-session + Redis)

Login stores the user in Redis-backed session. Cookie `trovera_sid` is HttpOnly, SameSite=Strict.

```
Login → validate domain + password → build SessionUser → req.session.user = SessionUser
       → Redis stores session → browser holds cookie trovera_sid

Subsequent requests → cookie sent → express-session reads Redis → req.session.user populated
                    → AdminAuthGuard copies session.user → req.user → controllers/guards use req.user

Logout → session.destroy() → Redis entry deleted → cookie invalidated
```

### Domain Restriction
Only `@expora.in` and `@trovera.in` email addresses can log in — enforced in `auth.service.ts` before any DB lookup, for both email/password and Google OAuth.

### Google OAuth
Frontend receives Google ID token from Google Sign-In SDK → sends to `POST /auth/google/callback` → backend verifies token with Google's tokeninfo API → upserts user → creates session.

### SessionUser shape (stored in Redis)
```typescript
{ id: number, email: string, full_name: string, role: string, permissions: string[], avatar_url?: string }
```

---

## RBAC System

Permissions are defined in `roles/permissions.config.ts` as a static map — no DB lookups needed.

```typescript
ROLE_PERMISSIONS = {
  super_admin: Set(['books:create', 'books:delete', 'users:manage', ...]),
  librarian:   Set(['books:create', 'transactions:issue', ...]),
  member:      Set(['books:read', 'transactions:view_own', ...]),
}
```

`AdminAuthGuard` runs first → sets `req.user` from session.
`PermissionsGuard` runs second → checks `req.user.permissions` against `@RequirePermissions()`.

### Frontend Gate
```tsx
<PermissionGate permission="books:create:cta">
  <Button>Add Book</Button>
</PermissionGate>
```
Reads from Zustand `authStore` (permissions embedded in session at login) — zero extra API calls.

---

## Caching Strategy

### Decorator-Based (controller layer)

Services contain only DB logic. Caching is applied at the controller level via decorators — `HttpCacheInterceptor` reads the metadata and handles get/set/evict automatically.

```typescript
// Cache the response for 5 minutes
@Cacheable((req) => `books:list:${req.url}`, TTL.BOOKS_LIST)
findAll() { ... }

// After mutation, delete matching Redis keys by pattern
@CacheEvict((req) => `book:${req.params.id}`, 'books:list:*')
update() { ... }
```

| Key Pattern | TTL | Evicted When |
|-------------|-----|--------------|
| `books:list:*` | 5 min | Any book create/update/delete |
| `book:{id}` | 10 min | That book updated/deleted |
| `categories:all` | 1 hour | Any category create |
| `translate:{hash}:{lang}` | 24 hours | Never (immutable) |

---

## API Routes (all under `/api/v1`)

### Auth
`POST /auth/register` · `POST /auth/login` · `POST /auth/logout`
`POST /auth/google/callback` · `POST /auth/verify-email`
`POST /auth/forgot-password` · `POST /auth/reset-password` · `GET /auth/me`

### Books
`GET /books` · `POST /books` · `GET /books/:id` · `PATCH /books/:id` · `DELETE /books/:id`
`POST /books/:id/image` · `GET /books/categories` · `POST /books/categories`

### Transactions
`GET /transactions` · `POST /transactions/issue` · `GET /transactions/:id`
`PATCH /transactions/:id/return` · `PATCH /transactions/:id/lost` · `GET /transactions/overdue`

### Fines
`GET /fines` · `GET /fines/:id` · `PATCH /fines/:id/pay` · `PATCH /fines/:id/waive`

### Users
`GET /users` · `POST /users` · `GET /users/:id` · `PATCH /users/:id` · `DELETE /users/:id`
`PATCH /users/:id/role` · `PATCH /users/:id/activate`

### Roles
`GET /roles` · `GET /roles/:role/permissions`

### Error Auditing
`GET /errors` · `PATCH /errors/:id/resolve`

### Translation
`POST /translate` — proxies to LibreTranslate/DeepL, Redis-cached by (text_hash, lang) TTL 24h

### Response Envelope
```json
{ "success": true, "data": {...}, "meta": {"page": 1, "page_size": 20, "total": 150} }
{ "success": false, "error": {"code": "BOOK_NOT_FOUND", "message": "...", "request_id": "..."} }
```

---

## Security

| Control | Implementation |
|---------|----------------|
| Security headers | `helmet` (X-Frame-Options, HSTS, CSP, X-Content-Type-Options, etc.) |
| Session | HttpOnly cookie, SameSite=Strict, Secure in production |
| Domain restriction | Only @expora.in and @trovera.in can authenticate |
| CORS | Explicit origin whitelist via `CORS_ORIGINS` env var |
| Input validation | `class-validator` on all DTOs; Prisma parameterized queries |
| Passwords | bcrypt cost=12 (native bcrypt) |
| Rate limiting | Configurable via `RATE_LIMIT_PER_MINUTE` / `AUTH_RATE_LIMIT_PER_MINUTE` env vars |
| Soft deletes | Users/books: `deleted_at` timestamp, never hard-deleted |

---

## Frontend Structure (`/frontend/src/`)

```
app/[locale]/
├── layout.tsx
├── (auth)/                        # login, signup, verify-email (no sidebar)
└── (dashboard)/                   # Protected — AppShell with Sidebar + Header
    ├── dashboard/page.tsx
    ├── books/page.tsx
    ├── transactions/page.tsx
    ├── members/page.tsx
    ├── fines/page.tsx
    ├── roles/page.tsx             # SuperAdmin only
    └── settings/page.tsx

components/
├── common/
│   ├── AppShell/                  # Sidebar + MobileNav + Header
│   ├── DataTable/                 # Generic table with sort/filter/paginate
│   ├── PermissionGate.tsx         # { permission, fallback?, children }
│   └── Feedback/                  # ErrorBoundary, EmptyState, LoadingSkeleton
├── books/
├── transactions/
└── auth/

lib/
├── api.ts                         # Axios + session cookie + 401 interceptor
├── swr-config.tsx                 # SWR provider
└── auth-actions.ts                # Next.js server actions for login/logout

store/
├── authStore.ts                   # user, permissions[], persist: sessionStorage
├── uiStore.ts                     # sidebarOpen, theme, locale
└── bookStore.ts                   # Optimistic updates
```

---

## Getting Started (Dev)

```bash
# 1. Copy env and fill in secrets
cp backend/.env.example backend/.env
# Edit: SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

# 2. Start infrastructure (Postgres on 5433, Redis on 6380 — avoids conflicts with other projects)
docker compose -f docker/dev/docker-compose.yml --env-file backend/.env up -d

# 3. Install dependencies and generate Prisma client
cd backend
npm install
npm run prisma:generate

# 4. Run schema on DB (first time)
psql -h localhost -p 5433 -U trovera trovera_db < ../trovera_full.sql

# 5. Start backend (hot-reload)
npm run start:dev

# 6. Start frontend
cd ../frontend
npm install
npm run dev

# Services:
# Backend API:    http://localhost:8011/api/v1
# Frontend:       http://localhost:3011
# Swagger docs:   http://localhost:8011/docs
# Postgres:       localhost:5433
# Redis:          localhost:6380
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Postgres connection string | — |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `SESSION_SECRET` | Secret for signing session cookie | — (required) |
| `SESSION_MAX_AGE_DAYS` | Session expiry in days | `7` |
| `DB_POOL_SIZE` | Prisma connection pool size | `5` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |
| `PORT` | Backend port | `8000` |

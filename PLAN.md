# Trovera — Library Management System

> Full-stack library management for admin. FastAPI + PostgreSQL backend, Next.js 14 App Router frontend.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + SQLAlchemy 2.0 (async) + Alembic |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT access token (15 min) + Refresh token (HttpOnly cookie, 7 days) + Google OAuth |
| Frontend | Next.js 14 App Router + shadcn/ui + TailwindCSS |
| Data fetching | SWR (client-side) + React Server Components (SSR) |
| Global state | Zustand (3 stores: auth, ui, book-optimistic) |
| i18n | next-intl + LibreTranslate/DeepL for seed translation (en, hi, es, fr) |
| Dev infra | Docker Compose: Postgres + Redis + Mailhog + pgAdmin |

---

## Project Structure

```
/Trovera/
├── backend/                    # FastAPI application
├── frontend/                   # Next.js 14 application
├── docker/
│   ├── dev/docker-compose.yml  # Full dev stack
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── PLAN.md                     # This file
├── .gitignore
└── .editorconfig
```

---

## Backend Architecture (`/backend/app/`)

```
├── main.py                     # App factory: CORS, rate limiter, security headers, error handlers
├── config.py                   # pydantic-settings — all env vars typed and validated
├── dependencies.py             # get_db, get_redis, get_current_user FastAPI deps
│
├── core/
│   ├── security.py             # JWT encode/decode, bcrypt (cost=12), jti blacklist in Redis
│   ├── oauth.py                # Google OAuth via authlib — verifies id_token with JWKS
│   ├── permissions.py          # RBAC/ABAC engine: permission_required() dep + policy_check()
│   ├── rate_limiter.py         # Redis sliding-window: 60 req/min global, 5/min on auth endpoints
│   ├── cache.py                # RedisCache class + cache_response() decorator + TTL constants
│   ├── retry.py                # Tenacity decorators for external service calls
│   ├── exceptions.py           # AppException hierarchy with severity levels
│   ├── error_handlers.py       # Global handler → error_logs table + standard response envelope
│   ├── middleware.py           # Security headers, CORS, request ID injection
│   └── email.py                # SMTP sender with Tenacity retry (3 attempts, exponential backoff)
│
├── db/
│   ├── base.py                 # SQLAlchemy declarative Base
│   ├── session.py              # Async engine + get_db dependency
│   └── migrations/versions/    # Alembic migration files
│
├── models/                     # SQLAlchemy ORM (one file per domain)
│   ├── user.py                 # User, EmailVerificationToken, RefreshToken
│   ├── role.py                 # Permission, RolePermission, PermissionPolicy
│   ├── book.py                 # Book, BookCategory
│   ├── transaction.py          # Transaction, Fine
│   ├── audit_log.py            # AuditLog (business events)
│   └── error_log.py            # ErrorLog (runtime errors)
│
├── schemas/                    # Pydantic v2 — request/response shapes
├── repositories/               # Async SQLAlchemy data access (no business logic)
├── services/                   # Business logic (calls repositories + cache + external APIs)
│
└── api/v1/
    ├── auth.py                 # /auth/* — register, login, logout, refresh, google, verify-email
    ├── books.py                # /books/* — CRUD, image upload, categories
    ├── transactions.py         # /transactions/* — issue, return, lost, overdue
    ├── fines.py                # /fines/* — list, pay, waive
    ├── users.py                # /users/* — list, profile, role change, activate
    ├── roles.py                # /roles/* — permission management (SuperAdmin only)
    ├── errors.py               # /errors/* — error log dashboard (SuperAdmin only)
    ├── translate.py            # /translate — proxy to translation API with Redis cache
    └── health.py               # /health, /health/readiness
```

---

## Database Schema

### Tables

| Table | Key Columns | Notes |
|-------|------------|-------|
| `users` | id, email, full_name, password_hash, auth_provider, google_id, role, is_active, is_email_verified, membership_id, deleted_at | Soft delete; password_hash NULL for Google-only |
| `email_verification_tokens` | user_id, token, expires_at, used_at | UUID token, 24h TTL |
| `refresh_tokens` | user_id, token_hash, expires_at, revoked_at | SHA-256 of raw token |
| `permissions` | code, resource, action, description | e.g. code="books:create:cta" |
| `role_permissions` | (role, permission_id) composite PK | Maps enum role → permission |
| `permission_policies` | permission_id, role, condition_json (JSONB) | ABAC attribute conditions |
| `book_categories` | name, slug | |
| `books` | title, isbn, author, cover_image_url, total_quantity, available_quantity, tags (TEXT[]), deleted_at | GIN full-text index on title+author+description |
| `transactions` | book_id, member_id, issued_by, returned_to, status, due_date, returned_at | status: issued/returned/overdue/lost |
| `fines` | transaction_id, member_id, amount (NUMERIC 10,2), per_day_rate, days_overdue, status | status: pending/paid/waived |
| `audit_logs` | user_id, action, resource, resource_id, old_value (JSONB), new_value (JSONB), ip_address | Business events |
| `error_logs` | severity, message, stack_trace, context (JSONB), request_id, resolved | Runtime errors |

---

## RBAC + ABAC System

### Three-Level Permission Granularity

Permissions control access at **three scopes** simultaneously — same page, different experience per role:

| Level | Example | Controls |
|-------|---------|----------|
| Page | `page:books:view` | Can user visit the route |
| API/Action | `books:create` | Can user call the backend endpoint |
| UI Component | `books:create:cta` | Is the "Add Book" button rendered |
| UI Section | `fines:waive:section` | Is a panel/section visible |
| Field | `users:phone:field` | Is a sensitive field shown |

### Example — Books Page (same URL, different UI per role)
| UI Element | SuperAdmin | Librarian | Member |
|-----------|-----------|-----------|--------|
| Page access | ✓ | ✓ | ✓ |
| "Add Book" button | ✓ | ✓ | ✗ |
| "Edit" button per row | ✓ | ✓ | ✗ |
| "Delete" button per row | ✓ | ✗ | ✗ |
| Shelf location field | ✓ | ✓ | ✗ |

### ABAC Policies (stored as JSONB in `permission_policies`)
```json
{ "own_resource_only": true }        // member sees only own transactions
{ "max_due_days": 30 }               // librarian cannot issue > 30 days
```

### Frontend Gate
```tsx
<PermissionGate permission="books:create:cta">
  <Button>Add Book</Button>
</PermissionGate>
```
Reads from Zustand `authStore` (permissions embedded in JWT at login) — zero extra API calls.

---

## API Routes (all under `/api/v1`)

### Auth
`POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `POST /auth/refresh`
`GET /auth/google` · `GET /auth/google/callback` · `POST /auth/verify-email`
`POST /auth/forgot-password` · `POST /auth/reset-password` · `GET /auth/me`

### Books
`GET /books` (search, filter, paginate) · `POST /books` · `GET /books/{id}` · `PATCH /books/{id}` · `DELETE /books/{id}` · `POST /books/{id}/image` · `GET /books/categories` · `POST /books/categories`

### Transactions
`GET /transactions` · `POST /transactions/issue` · `GET /transactions/{id}` · `PATCH /transactions/{id}/return` · `PATCH /transactions/{id}/lost` · `GET /transactions/overdue`

### Fines
`GET /fines` · `GET /fines/{id}` · `PATCH /fines/{id}/pay` · `PATCH /fines/{id}/waive`

### Users
`GET /users` · `POST /users` · `GET /users/{id}` · `PATCH /users/{id}` · `DELETE /users/{id}` · `PATCH /users/{id}/role` · `PATCH /users/{id}/activate` · `GET /users/{id}/transactions` · `GET /users/{id}/fines`

### Roles
`GET /roles` · `GET /roles/{role}/permissions` · `POST /roles/{role}/permissions` · `DELETE /roles/{role}/permissions/{pid}`

### Error Auditing (SuperAdmin)
`GET /errors` · `PATCH /errors/{id}/resolve`

### Translation
`POST /translate` — proxies text to LibreTranslate/DeepL, Redis-cached by (text_hash, lang) TTL 24h

### Response Envelope
```json
// Success
{ "success": true, "data": {...}, "meta": {"page": 1, "page_size": 20, "total": 150} }

// Error
{ "success": false, "error": {"code": "BOOK_NOT_FOUND", "message": "...", "request_id": "..."} }
```

---

## Frontend Structure (`/frontend/src/`)

```
app/[locale]/
├── layout.tsx                     # Providers: SWRConfig, ThemeProvider, Toaster
├── (auth)/                        # No sidebar — login, signup, verify-email
└── (dashboard)/                   # Protected — AppShell with Sidebar + Header
    ├── layout.tsx
    ├── dashboard/page.tsx          # SSR stats
    ├── books/page.tsx              # SSR paginated list
    ├── books/new/page.tsx
    ├── books/[id]/page.tsx         # SSR book detail
    ├── transactions/page.tsx       # SSR
    ├── members/page.tsx            # SSR
    ├── fines/page.tsx              # SSR
    ├── roles/page.tsx              # SuperAdmin only
    └── settings/page.tsx

components/common/                 # Shared, reusable across all features
├── AppShell/                      # Sidebar (desktop) + MobileNav (bottom tabs) + Header
├── DataTable/                     # Generic table: ColumnDef<T>[], SSR + client, sort, filter, paginate
├── Forms/                         # FormField, ImageUpload, SearchInput
├── Feedback/                      # ErrorBoundary, EmptyState, LoadingSkeleton, Toast
├── Modal/                         # ConfirmDialog
└── PermissionGate.tsx             # { permission, fallback?, children }

components/books/                  # BookCard, BookForm, BookFilters, BookStatusBadge
components/transactions/           # IssueBookModal, ReturnBookModal, FinesBadge, TransactionTable
components/auth/                   # LoginForm, SignupForm, GoogleLoginButton, VerifyEmailNotice
components/dashboard/              # StatsCard, RecentTransactions, LowStockAlert

lib/
├── api.ts                         # Axios + JWT inject + 401 interceptor + axios-retry (3x exponential)
├── swr-config.tsx                 # SWR provider: dedupingInterval 30s, errorRetry 3x exponential
├── error-reporter.ts              # Client-side error capture → POST /api/v1/errors/client
├── translation.ts                 # TranslationService: translate(), translateBatch()
└── auth-actions.ts                # Next.js server actions for login/logout/refresh

store/
├── authStore.ts                   # user, accessToken, permissions[], persist: sessionStorage
├── uiStore.ts                     # sidebarOpen, theme, locale — persist: localStorage
└── bookStore.ts                   # Optimistic update Map + pendingDeletes Set (ephemeral)

i18n/
├── routing.ts                     # defineRouting: locales ['en','hi','es','fr'], default 'en'
├── request.ts                     # getRequestConfig → dynamic import messages/{locale}.json
└── messages/                      # en.json (master) + seeded hi/es/fr via translation API
```

---

## Responsive Design — Auto-Scaling

All layouts use fluid scaling — no layout jumps, works seamlessly from 320px to 2560px:

- **Fluid typography:** `font-size: clamp(min, preferred, max)` everywhere
- **Fluid spacing:** `clamp()` for padding and gap
- **CSS Grid auto-fit:** `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` for card grids
- **Container Queries:** components respond to container width (portable, context-aware)
- **Logical CSS properties:** `padding-inline`, `margin-block` for future RTL support

| Component | Mobile < 768px | Tablet 768-1024px | Desktop > 1024px |
|-----------|---------------|-------------------|-----------------|
| Navigation | Bottom tab bar | Collapsible drawer | Fixed sidebar |
| DataTable | Stacked cards | Horizontal scroll | Full columns |
| Book grid | 1 col | 2-3 cols (auto-fit) | 4-5 cols (auto-fit) |
| Stats | Vertical | 2×2 grid | 4-col row |
| Modals | Full-screen sheet | 80% centered | 560px centered |

---

## Translation Strategy

**Tier 1 — Static JSON (committed):** `messages/en.json` is master. Other locales seeded once via LibreTranslate or DeepL API, then committed and refined manually.

**Tier 2 — Dynamic API:** `POST /api/v1/translate` proxies to translation service for runtime content (book descriptions, dynamic error messages). Redis-cached by `(sha256(text), lang)` TTL 24h.

**Tier 3 — ICU format:** All strings use ICU message format for plurals/interpolation:
```json
{ "books.count": "{count, plural, =0 {No books} one {# book} other {# books}}" }
```

---

## Retry Mechanism

**Frontend (axios-retry + SWR):**
- Axios: 3 retries, exponential backoff (1s → 2s → 4s), retries on network errors and 503
- SWR: `errorRetryCount: 3`, exponential retry, skips retry on 403/404

**Backend (Tenacity):**
- Applied to: Google JWKS token verification, SMTP email, translation API, S3 uploads
- Config: 3 attempts, exponential backoff 1-10s, retries on `httpx.HTTPError`
- NOT applied to DB writes (idempotency handled via unique constraints)

---

## Error Auditing System

Separate from business `audit_logs` — captures runtime errors:

**`error_logs` table:** severity (debug/info/warning/error/critical), message, stack_trace, context JSONB, request_id, user_id, resolved flag

**Backend:** Global exception handler captures all unhandled errors asynchronously to `error_logs`. Every error response includes `request_id` for correlation.

**Frontend:** `ErrorBoundary` + SWR `onError` both call `ErrorReporter.capture()` → `POST /api/v1/errors/client`

**Dashboard:** SuperAdmin sees `/errors` page with filters by severity, date range, resolved status.

**Severity Levels:**
| Level | Examples | Action |
|-------|---------|--------|
| `critical` | DB/Redis connection lost | Immediate alert |
| `error` | Unhandled exception | Log + aggregate |
| `warning` | Retry succeeded, slow query > 1s | Log only |
| `info` | Auth failure (wrong password) | Audit trail |
| `debug` | Cache miss | Dev only |

---

## Caching Strategy (Redis)

| Key Pattern | TTL | Invalidated When |
|-------------|-----|-----------------|
| `books:list:{hash(filters)}` | 5 min | Any book CRUD |
| `books:detail:{id}` | 10 min | Book update/delete |
| `books:categories` | 1 hour | Category CRUD |
| `users:detail:{id}` | 10 min | User update |
| `transactions:overdue` | 2 min | Any return/issue |
| `dashboard:stats` | 2 min | Any change |
| `permissions:{user_id}` | 15 min | Role change |
| `translate:{hash}:{lang}` | 24 hours | Never (immutable) |
| `jti:blacklist:{jti}` | 15 min | Logout |

---

## Security

| Control | Implementation |
|---------|----------------|
| Rate limiting | Redis sliding window: 60 req/min global, 5/min on auth |
| CORS | Explicit `allow_origins`, no wildcard in prod |
| Security headers | `X-Content-Type-Options`, `X-Frame-Options: DENY`, HSTS, CSP, Referrer-Policy |
| Input validation | Pydantic v2 strict; ORM parameterized queries only |
| JWT | 15 min expiry; `jti` blacklist on logout; RS256 optional |
| Refresh tokens | SHA-256 hash stored; rotation on every use |
| CSRF | `SameSite=Strict` cookie + state param on Google OAuth |
| Passwords | bcrypt cost=12; min 8 chars |
| Token storage | Access token in Zustand memory; refresh in HttpOnly Secure cookie |
| XSS | React JSX escaping; no `dangerouslySetInnerHTML`; CSP |
| Soft deletes | Users/books never hard-deleted |
| Audit trail | All mutations in `audit_logs`; all errors in `error_logs` |

---

## Auth Flows

### Email/Password
```
Register → bcrypt hash → create user (unverified) → send email (Mailhog in dev)
→ click link → verify token → mark verified → return JWT + refresh cookie
Login → verify password + is_active + is_verified → JWT (15 min) + refresh (7 days HttpOnly cookie)
Refresh → validate hash + not revoked → rotate both tokens → retry original request
```

### Google OAuth
```
Click button → /api/auth/google → redirect to Google (with CSRF state param)
→ callback → validate state → exchange code (server-side) → verify id_token with JWKS
→ upsert user → return JWT + refresh cookie (identical to email flow)
```

---

## Design System — Pastel Colors

```css
/* Light mode */
:root {
  --primary: 270 50% 70%;    /* soft purple */
  --secondary: 220 60% 75%;  /* soft blue */
  --accent: 340 60% 78%;     /* soft pink */
  --success: 145 45% 68%;    /* soft green */
  --warning: 45 80% 75%;     /* soft amber */
  --destructive: 0 60% 70%;  /* soft red */
}

/* Dark mode — desaturated pastels on dark bg */
.dark {
  --background: 240 10% 10%;
  --primary: 270 30% 55%;    /* muted purple */
  --secondary: 220 30% 45%;  /* muted blue */
  --accent: 340 30% 52%;     /* muted pink */
}
```

---

## Implementation Order (20 days)

| Phase | Days | Work |
|-------|------|------|
| 1 — Infrastructure | 1-2 | Docker Compose, DB models, Alembic migrations, app factory |
| 2 — Auth Backend | 2-4 | JWT, bcrypt, Google OAuth, email, rate limiting, auth API |
| 3 — Core Domain Backend | 4-6 | Books, transactions, fines APIs + Redis cache + pagination |
| 4 — RBAC/ABAC | 6-7 | Permission engine, seed permissions, wire to all endpoints |
| 5 — Error Auditing | 7 | error_logs table, global handler, /errors API |
| 6 — Retry Layer | 7-8 | Tenacity on all external calls (email, OAuth, translate) |
| 7 — Frontend Foundation | 8-9 | Next.js init, shadcn/ui, Tailwind pastel config, Zustand stores, SWR config |
| 8 — Auth UI | 9-10 | Login, Signup, Google button, verify-email, server actions |
| 9 — App Shell | 10-12 | AppShell, Sidebar, Header, MobileNav, PermissionGate, Dashboard |
| 10 — Books Feature | 12-14 | DataTable, BookCard, BookForm, BookFilters, books pages (SSR + SWR) |
| 11 — Transactions + Fines | 14-16 | IssueModal, ReturnModal, transaction + fines pages |
| 12 — Members + Roles | 16-17 | Members list/detail, roles page (SuperAdmin) |
| 13 — Translation Seed | 17-18 | Run seed script, review hi/es/fr, test language switching |
| 14 — Polish + Responsive | 18-19 | Mobile layouts, dark mode pass, empty states, skeletons |
| 15 — Testing + Audit | 19-20 | pytest-asyncio, Vitest, pip-audit, npm audit, retry testing |

---

## Getting Started (Dev)

```bash
# 1. Copy env file
cp docker/dev/.env.example docker/dev/.env
# Fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

# 2. Start infrastructure
docker compose -f docker/dev/docker-compose.yml up -d

# 3. Run migrations
cd backend && alembic upgrade head

# 4. Start backend (hot-reload)
uvicorn app.main:app --reload --port 8000

# 5. Start frontend (hot-reload)
cd frontend && npm install && npm run dev

# Services:
# Backend API:    http://localhost:8000/docs
# Frontend:       http://localhost:3000
# Mailhog UI:     http://localhost:8025
# pgAdmin:        http://localhost:5050
# Redis:          localhost:6379
```

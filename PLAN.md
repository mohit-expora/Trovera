# Trovera — Library Management System

> Full-stack library management for admin. NestJS + PostgreSQL backend, Next.js 14 App Router frontend, React Native mobile app.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + Prisma ORM + TypeScript |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT access token (15 min) + Refresh token (HttpOnly cookie, 7 days) + Google OAuth |
| Frontend | Next.js 14 App Router + shadcn/ui + TailwindCSS |
| Mobile | React Native + Expo |
| Data fetching | SWR (client-side) + React Server Components (SSR) |
| Global state | Zustand (3 stores: auth, ui, book-optimistic) |
| i18n | next-intl + LibreTranslate/DeepL for seed translation (en, hi, es, fr) |
| Dev infra | Docker Compose: Postgres + Redis + Mailhog + pgAdmin |

---

## Project Structure

```
/Trovera/
├── backend/                    # NestJS application
├── frontend/                   # Next.js 14 application
├── mobile/                     # React Native (Expo) application
├── docker/
│   ├── dev/docker-compose.yml  # Full dev stack
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── PLAN.md                     # This file
├── .gitignore
└── .editorconfig
```

---

## Backend Architecture (`/backend/src/`)

```
├── main.ts                     # NestJS bootstrap: CORS, rate limiter, security headers, global filters
├── app.module.ts               # Root module with all feature modules
├── config/
│   └── configuration.ts        # Environment configuration typed and validated
│
├── common/
│   ├── guards/                 # JwtAuthGuard, PermissionsGuard, RateLimitGuard
│   ├── decorators/             # @RequirePermissions(), @CurrentUser(), @Public()
│   ├── interceptors/           # CacheInterceptor, ResponseTransformInterceptor
│   ├── filters/                # GlobalExceptionFilter → error_logs table
│   ├── middleware/             # Security headers, CORS, request ID injection
│   └── exceptions/             # Custom exception hierarchy with severity levels
│
├── prisma/
│   ├── schema.prisma           # Prisma schema — models, relations, indexes
│   ├── prisma.module.ts        # PrismaModule with PrismaService
│   └── prisma.service.ts       # Prisma client wrapper with connection management
│
├── auth/                       # Authentication module
│   ├── auth.module.ts
│   ├── auth.service.ts         # JWT, bcrypt, Google OAuth, token management
│   ├── auth.controller.ts
│   ├── strategies/             # JwtStrategy, GoogleStrategy
│   └── dto/                    # LoginDto, RegisterDto, etc. with class-validator
│
├── books/                      # Books module
│   ├── books.module.ts
│   ├── books.service.ts        # Business logic + Prisma queries
│   ├── books.controller.ts
│   └── dto/                    # CreateBookDto, UpdateBookDto with class-validator
│
├── transactions/               # Transactions module
├── users/                      # Users module
├── roles/                      # Roles & permissions module
├── errors/                     # Error logging module
├── translate/                  # Translation proxy module
├── cache/                      # Redis cache module
│   ├── cache.module.ts
│   └── cache.service.ts        # Redis client + cache decorator logic
│
└── health/                     # Health check module
    ├── health.module.ts
    └── health.controller.ts    # /health, /health/readiness endpoints
```

---

## Database Schema

### Prisma Models

| Model | Key Fields | Notes |
|-------|------------|-------|
| `User` | id, email, fullName, passwordHash, authProvider, googleId, role, isActive, isEmailVerified, membershipId, deletedAt | Soft delete; passwordHash nullable for Google-only |
| `EmailVerificationToken` | userId, token, expiresAt, usedAt | UUID token, 24h TTL |
| `RefreshToken` | userId, tokenHash, expiresAt, revokedAt | SHA-256 of raw token |
| `Permission` | code, resource, action, description | e.g. code="books:create:cta" |
| `RolePermission` | role, permissionId (composite PK) | Maps enum role → permission |
| `PermissionPolicy` | permissionId, role, conditionJson (Json) | ABAC attribute conditions |
| `BookCategory` | name, slug | |
| `Book` | title, isbn, author, coverImageUrl, totalQuantity, availableQuantity, tags (String[]), deletedAt | Full-text search indexes |
| `Transaction` | bookId, memberId, issuedBy, returnedTo, status, dueDate, returnedAt | status: issued/returned/overdue/lost |
| `Fine` | transactionId, memberId, amount (Decimal), perDayRate, daysOverdue, status | status: pending/paid/waived |
| `AuditLog` | userId, action, resource, resourceId, oldValue (Json), newValue (Json), ipAddress | Business events |
| `ErrorLog` | severity, message, stackTrace, context (Json), requestId, resolved | Runtime errors |

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

**Backend (axios-retry / custom retry logic):**
- Applied to: Google JWKS token verification, SMTP email, translation API, S3 uploads
- Config: 3 attempts, exponential backoff 1-10s, retries on network/timeout errors
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
| CORS | Explicit `origin` whitelist, no wildcard in prod |
| Security headers | `X-Content-Type-Options`, `X-Frame-Options: DENY`, HSTS, CSP, Referrer-Policy |
| Input validation | class-validator decorators; Prisma parameterized queries only |
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
Login → verify password + isActive + isEmailVerified → JWT (15 min) + refresh (7 days HttpOnly cookie)
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
| 1 — Infrastructure | 1-2 | Docker Compose, Prisma schema, migrations, NestJS app setup |
| 2 — Auth Backend | 2-4 | JWT, bcrypt, Google OAuth, email, rate limiting, auth module |
| 3 — Core Domain Backend | 4-6 | Books, transactions, fines modules + Redis cache + pagination |
| 4 — RBAC/ABAC | 6-7 | Permission guards, seed permissions, wire to all controllers |
| 5 — Error Auditing | 7 | ErrorLog model, global exception filter, errors module |
| 6 — Retry Layer | 7-8 | axios-retry on all external calls (email, OAuth, translate) |
| 7 — Frontend Foundation | 8-9 | Next.js init, shadcn/ui, Tailwind pastel config, Zustand stores, SWR config |
| 8 — Auth UI | 9-10 | Login, Signup, Google button, verify-email, server actions |
| 9 — App Shell | 10-12 | AppShell, Sidebar, Header, MobileNav, PermissionGate, Dashboard |
| 10 — Books Feature | 12-14 | DataTable, BookCard, BookForm, BookFilters, books pages (SSR + SWR) |
| 11 — Transactions + Fines | 14-16 | IssueModal, ReturnModal, transaction + fines pages |
| 12 — Members + Roles | 16-17 | Members list/detail, roles page (SuperAdmin) |
| 13 — Translation Seed | 17-18 | Run seed script, review hi/es/fr, test language switching |
| 14 — Polish + Responsive | 18-19 | Mobile layouts, dark mode pass, empty states, skeletons |
| 15 — Testing + Audit | 19-20 | Jest (backend), Vitest (frontend), npm audit, retry testing |
| 16 — Mobile App | 20-22 | React Native app with Expo, core features, authentication |

---

## Getting Started (Dev)

```bash
# 1. Copy env file
cp docker/dev/.env.example docker/dev/.env
# Fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DATABASE_URL

# 2. Start infrastructure
docker compose -f docker/dev/docker-compose.yml up -d

# 3. Install dependencies and run migrations
cd backend
npm install
npx prisma generate
npx prisma migrate dev

# 4. Start backend (hot-reload)
npm run start:dev

# 5. Start frontend (hot-reload)
cd ../frontend
npm install
npm run dev

# 6. Start mobile app (optional)
cd ../mobile
npm install
npx expo start

# Services:
# Backend API:    http://localhost:8001
# Frontend:       http://localhost:3002
# Mailhog UI:     http://localhost:8025
# pgAdmin:        http://localhost:5050
# Redis:          localhost:6379
```

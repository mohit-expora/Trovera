# Trovera — Backend Setup

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22+ | `node -v` to check |
| Docker + Docker Compose | latest | required for local dev |
| psql client | any | to run the SQL seed |
| git | any | — |

---

## 1. Clone

```bash
git clone https://github.com/mohit-expora/Trovera.git
cd Trovera
```

---

## 2. Environment Variables

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in the required values:

| Variable | Required | Notes |
|---|---|---|
| `SESSION_SECRET` | **yes** | Must be at least 32 random characters |
| `DB_USERNAME` | yes | Default: `trovera` |
| `DB_PASSWORD` | yes | Default: `trovera` |
| `DB_NAME` | yes | Default: `trovera_db` |
| `GOOGLE_CLIENT_ID` | only if using Google login | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | only if using Google login | — |
| `DEEPLX_URL` | optional | Self-hosted DeepLX endpoint |
| `LIBRE_TRANSLATE_URL` | optional | LibreTranslate fallback endpoint |

> `DATABASE_URL` and `REDIS_URL` are overridden inside the container by `docker-compose.yml`.
> You only need them set in `.env` for running migrations locally (outside Docker).

---

## 3. Start the Stack

Run from the `docker/dev/` directory so Docker Compose picks up the right context:

```bash
cd docker/dev
docker compose --env-file ../../backend/.env up -d
```

This starts three containers:

| Container | Host port | Notes |
|---|---|---|
| `trovera-backend` | `8011` | NestJS API |
| `trovera-postgres` | `5433` | PostgreSQL 16 |
| `trovera-redis` | `6380` | Redis 7.2 |

Check that all three are up:

```bash
docker compose ps
```

---

## 4. Initialise the Database

Run the SQL schema against the running Postgres container:

```bash
docker exec -i $(docker compose ps -q postgres) \
  psql -U trovera -d trovera_db < ../../trovera_full.sql
```

This creates all tables, triggers, and seed data (sample users with `@trovera.in` emails).

---

## 5. Generate Prisma Client

The Prisma client needs to be generated once (or after any schema change):

```bash
docker exec trovera-backend-1 npx prisma generate \
  --schema=/app/prisma/schema/base.prisma
```

> If the container name differs, use `docker ps` to find it.

---

## 6. Verify

```bash
# Liveness — process is up
curl http://localhost:8011/health

# Readiness — DB + Redis both reachable
curl http://localhost:8011/health/readiness
```

Expected responses:

```json
{ "status": "ok", "service": "trovera-backend" }

{ "status": "ok", "checks": { "database": { "status": "ok" }, "redis": { "status": "ok" } } }
```

---

## 7. API

Base URL: `http://localhost:8011/api/v1`

Swagger docs: `http://localhost:8011/api/docs` *(if enabled in dev)*

---

## Ports Reference

| Service | Host | Container |
|---|---|---|
| Backend API | `8011` | `8011` |
| PostgreSQL | `5433` | `5432` |
| Redis | `6380` | `6379` |

---

## Common Commands

```bash
# Stop the stack
docker compose down

# View backend logs
docker compose logs -f backend

# Rebuild the backend image (after package.json changes)
docker compose up -d --build backend

# Connect to Postgres directly
psql -h localhost -p 5433 -U trovera -d trovera_db

# Connect to Redis directly
redis-cli -h localhost -p 6380
```

---

## Troubleshooting

**`SESSION_SECRET` error on startup**
The secret must be at least 32 characters. Generate one:
```bash
openssl rand -hex 32
```

**`permission denied` on Docker socket (EC2)**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Port already in use**
Ports `5433` and `6380` are intentionally offset to avoid conflicts with other running Postgres/Redis instances (e.g. ExporaERP).

**Prisma client out of sync after schema change**
Re-run `prisma generate` inside the container (step 5 above).

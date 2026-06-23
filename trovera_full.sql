-- ============================================================
-- Trovera Library Management System — Full Schema
-- Based on current NestJS + Prisma schema
-- PostgreSQL 15+
--
-- Usage:
--   createdb trovera_db
--   psql trovera_db < trovera_full.sql
-- ============================================================

BEGIN;

-- ── Updated-at trigger (Prisma @updatedAt equivalent) ────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Enums ────────────────────────────────────────────────────

CREATE TYPE "AuthProvider" AS ENUM ('local', 'google');

CREATE TYPE "UserRole" AS ENUM ('super_admin', 'librarian', 'member');

CREATE TYPE "TransactionStatus" AS ENUM ('issued', 'returned', 'overdue', 'lost');

CREATE TYPE "FineStatus" AS ENUM ('pending', 'paid', 'waived');

CREATE TYPE "ErrorSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- ── Users ────────────────────────────────────────────────────

CREATE TABLE "users" (
    "id"                SERIAL          NOT NULL,
    "email"             VARCHAR(255)    NOT NULL,
    "full_name"         VARCHAR(255)    NOT NULL,
    "password_hash"     VARCHAR(255),
    "avatar_url"        TEXT,
    "auth_provider"     "AuthProvider"  NOT NULL DEFAULT 'local',
    "google_id"         VARCHAR(255),
    "role"              "UserRole"      NOT NULL DEFAULT 'member',
    "is_active"         BOOLEAN         NOT NULL DEFAULT true,
    "is_email_verified" BOOLEAN         NOT NULL DEFAULT false,
    "phone"             VARCHAR(20),
    "address"           TEXT,
    "membership_id"     VARCHAR(50),
    "deleted_at"        TIMESTAMP(3),
    "created_at"        TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key"         ON "users"("email");
CREATE UNIQUE INDEX "users_google_id_key"     ON "users"("google_id") WHERE "google_id" IS NOT NULL;
CREATE UNIQUE INDEX "users_membership_id_key" ON "users"("membership_id") WHERE "membership_id" IS NOT NULL;
CREATE INDEX        "users_email_idx"         ON "users"("email");
CREATE INDEX        "users_role_idx"          ON "users"("role");

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Email Verification Tokens ────────────────────────────────

CREATE TABLE "email_verification_tokens" (
    "id"         SERIAL       NOT NULL,
    "user_id"    INTEGER      NOT NULL,
    "token"      VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at"    TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_verification_tokens_token_key"   ON "email_verification_tokens"("token");
CREATE INDEX        "email_verification_tokens_token_idx"   ON "email_verification_tokens"("token");
CREATE INDEX        "email_verification_tokens_user_id_idx" ON "email_verification_tokens"("user_id");

ALTER TABLE "email_verification_tokens"
    ADD CONSTRAINT "email_verification_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Book Categories ──────────────────────────────────────────

CREATE TABLE "book_categories" (
    "id"          SERIAL       NOT NULL,
    "name"        VARCHAR(100) NOT NULL,
    "slug"        VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "book_categories_name_key" ON "book_categories"("name");
CREATE UNIQUE INDEX "book_categories_slug_key" ON "book_categories"("slug");

CREATE TRIGGER set_book_categories_updated_at
    BEFORE UPDATE ON "book_categories"
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Books ────────────────────────────────────────────────────

CREATE TABLE "books" (
    "id"                 SERIAL       NOT NULL,
    "title"              VARCHAR(500) NOT NULL,
    "isbn"               VARCHAR(20),
    "author"             VARCHAR(255) NOT NULL,
    "publisher"          VARCHAR(255),
    "published_year"     INTEGER,
    "category_id"        INTEGER,
    "language"           VARCHAR(10)  NOT NULL DEFAULT 'en',
    "description"        TEXT,
    "cover_image_url"    TEXT,
    "total_quantity"     INTEGER      NOT NULL DEFAULT 1,
    "available_quantity" INTEGER      NOT NULL DEFAULT 1,
    "shelf_location"     VARCHAR(50),
    "tags"               TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "is_active"          BOOLEAN      NOT NULL DEFAULT true,
    "created_by"         INTEGER,
    "deleted_at"         TIMESTAMP(3),
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "books_isbn_key"        ON "books"("isbn") WHERE "isbn" IS NOT NULL;
CREATE INDEX        "books_category_id_idx" ON "books"("category_id");
CREATE INDEX        "books_language_idx"    ON "books"("language");

ALTER TABLE "books"
    ADD CONSTRAINT "books_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "book_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TRIGGER set_books_updated_at
    BEFORE UPDATE ON "books"
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Transactions ─────────────────────────────────────────────

CREATE TABLE "transactions" (
    "id"          SERIAL              NOT NULL,
    "book_id"     INTEGER             NOT NULL,
    "member_id"   INTEGER             NOT NULL,
    "issued_by"   INTEGER,
    "returned_to" INTEGER,
    "status"      "TransactionStatus" NOT NULL DEFAULT 'issued',
    "issued_at"   TIMESTAMP(3)        NOT NULL,
    "due_date"    TIMESTAMP(3)        NOT NULL,
    "returned_at" TIMESTAMP(3),
    "notes"       TEXT,
    "created_at"  TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transactions_book_id_idx"   ON "transactions"("book_id");
CREATE INDEX "transactions_member_id_idx" ON "transactions"("member_id");
CREATE INDEX "transactions_status_idx"    ON "transactions"("status");

ALTER TABLE "transactions"
    ADD CONSTRAINT "transactions_book_id_fkey"
    FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transactions"
    ADD CONSTRAINT "transactions_member_id_fkey"
    FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TRIGGER set_transactions_updated_at
    BEFORE UPDATE ON "transactions"
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Fines ────────────────────────────────────────────────────

CREATE TABLE "fines" (
    "id"             SERIAL        NOT NULL,
    "transaction_id" INTEGER       NOT NULL,
    "member_id"      INTEGER       NOT NULL,
    "amount"         DECIMAL(10,2) NOT NULL,
    "per_day_rate"   DECIMAL(6,2)  NOT NULL,
    "days_overdue"   INTEGER       NOT NULL,
    "status"         "FineStatus"  NOT NULL DEFAULT 'pending',
    "paid_at"        TIMESTAMP(3),
    "waived_by"      INTEGER,
    "waived_at"      TIMESTAMP(3),
    "waive_reason"   TEXT,
    "created_at"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fines_member_id_idx"      ON "fines"("member_id");
CREATE INDEX "fines_status_idx"         ON "fines"("status");
CREATE INDEX "fines_transaction_id_idx" ON "fines"("transaction_id");

ALTER TABLE "fines"
    ADD CONSTRAINT "fines_transaction_id_fkey"
    FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fines"
    ADD CONSTRAINT "fines_member_id_fkey"
    FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TRIGGER set_fines_updated_at
    BEFORE UPDATE ON "fines"
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Error Logs ───────────────────────────────────────────────

CREATE TABLE "error_logs" (
    "id"          SERIAL          NOT NULL,
    "error_code"  VARCHAR(100),
    "severity"    "ErrorSeverity" NOT NULL DEFAULT 'medium',
    "message"     TEXT            NOT NULL,
    "stack_trace" TEXT,
    "context"     JSONB,
    "user_id"     INTEGER,
    "ip_address"  VARCHAR(45),
    "request_id"  VARCHAR(100),
    "resolved"    BOOLEAN         NOT NULL DEFAULT false,
    "created_at"  TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- ── Seed Data ────────────────────────────────────────────────
-- Passwords (bcrypt): Admin@123 / Librarian@123 / Member@123

INSERT INTO "users" ("email", "full_name", "password_hash", "auth_provider", "role", "is_active", "is_email_verified") VALUES
    ('admin@trovera.in',     'Super Admin',    '$2b$12$9d07WfKdrZHjL/r8BJY1s.3wQeq6Bh360AdIg91D/Lc1KDMrO1ZSi', 'local', 'super_admin', true, true),
    ('librarian@trovera.in', 'Librarian User', '$2b$12$YskzexQjwcyLsjZI8OAOwOjeEE.3xGTwcFrLn7ehcjNZa.XU5gbuG', 'local', 'librarian',   true, true),
    ('member@trovera.in',    'Member User',    '$2b$12$MdiBURIWaxxToIzXmo.6MeMcUsVDYO9aBC93BvvztqJijtttjRgQO', 'local', 'member',      true, true);

COMMIT;

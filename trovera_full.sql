-- =============================================================================
-- Trovera Library Management System — Full SQL Export
-- Generated: 2026-06-18
-- PostgreSQL 16
-- =============================================================================
-- USAGE:
--   createdb trovera_db
--   psql trovera_db < trovera_full.sql
-- =============================================================================

--
-- PostgreSQL database dump
--

\restrict x49ScMACYfQc106N6H0FKKfVsq2dRFwbIPbZO4vvyYNpefdWXgfMfDh6XqSpDUG

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: auth_provider_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.auth_provider_enum AS ENUM (
    'local',
    'google'
);


--
-- Name: fine_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fine_status_enum AS ENUM (
    'pending',
    'paid',
    'waived'
);


--
-- Name: transaction_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_status_enum AS ENUM (
    'issued',
    'returned',
    'overdue',
    'lost'
);


--
-- Name: user_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role_enum AS ENUM (
    'super_admin',
    'librarian',
    'member'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    user_id uuid,
    action character varying(100) NOT NULL,
    resource character varying(50) NOT NULL,
    resource_id uuid,
    old_value json,
    new_value json,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp with time zone NOT NULL,
    id uuid NOT NULL
);


--
-- Name: book_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_categories (
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: books; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.books (
    title character varying(500) NOT NULL,
    isbn character varying(20),
    author character varying(255) NOT NULL,
    publisher character varying(255),
    published_year smallint,
    category_id uuid,
    language character varying(10) NOT NULL,
    description text,
    cover_image_url text,
    total_quantity integer NOT NULL,
    available_quantity integer NOT NULL,
    shelf_location character varying(50),
    tags character varying[],
    is_active boolean NOT NULL,
    created_by uuid,
    deleted_at timestamp with time zone,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_verification_tokens (
    user_id uuid NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    id uuid NOT NULL
);


--
-- Name: error_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.error_logs (
    error_code character varying(100),
    severity character varying(20) NOT NULL,
    message text NOT NULL,
    stack_trace text,
    context json,
    user_id uuid,
    ip_address character varying(45),
    request_id uuid,
    resolved boolean NOT NULL,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    id uuid NOT NULL
);


--
-- Name: fines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fines (
    transaction_id uuid NOT NULL,
    member_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    per_day_rate numeric(6,2) NOT NULL,
    days_overdue integer NOT NULL,
    status public.fine_status_enum NOT NULL,
    paid_at timestamp with time zone,
    waived_by uuid,
    waived_at timestamp with time zone,
    waive_reason text,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: permission_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permission_policies (
    permission_id uuid NOT NULL,
    role public.user_role_enum NOT NULL,
    condition_json json NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    code character varying(100) NOT NULL,
    description text,
    resource character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    device_info text,
    ip_address character varying(45),
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    id uuid NOT NULL
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role public.user_role_enum NOT NULL,
    permission_id uuid NOT NULL
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    book_id uuid NOT NULL,
    member_id uuid NOT NULL,
    issued_by uuid,
    returned_to uuid,
    status public.transaction_status_enum NOT NULL,
    issued_at timestamp with time zone NOT NULL,
    due_date timestamp with time zone NOT NULL,
    returned_at timestamp with time zone,
    notes text,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    password_hash character varying(255),
    avatar_url text,
    auth_provider public.auth_provider_enum NOT NULL,
    google_id character varying(255),
    role public.user_role_enum NOT NULL,
    is_active boolean NOT NULL,
    is_email_verified boolean NOT NULL,
    phone character varying(20),
    address text,
    membership_id character varying(50),
    deleted_at timestamp with time zone,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: book_categories book_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_name_key UNIQUE (name);


--
-- Name: book_categories book_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_pkey PRIMARY KEY (id);


--
-- Name: book_categories book_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_slug_key UNIQUE (slug);


--
-- Name: books books_isbn_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_isbn_key UNIQUE (isbn);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_token_key UNIQUE (token);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);


--
-- Name: fines fines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fines
    ADD CONSTRAINT fines_pkey PRIMARY KEY (id);


--
-- Name: permission_policies permission_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_policies
    ADD CONSTRAINT permission_policies_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions uq_role_permission; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT uq_role_permission PRIMARY KEY (role, permission_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_membership_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_membership_id_key UNIQUE (membership_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_created ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_resource; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_resource ON public.audit_logs USING btree (resource, resource_id);


--
-- Name: idx_audit_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_user ON public.audit_logs USING btree (user_id);


--
-- Name: idx_books_available; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_books_available ON public.books USING btree (available_quantity) WHERE (available_quantity > 0);


--
-- Name: idx_books_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_books_category ON public.books USING btree (category_id);


--
-- Name: idx_books_isbn; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_books_isbn ON public.books USING btree (isbn) WHERE (isbn IS NOT NULL);


--
-- Name: idx_books_language; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_books_language ON public.books USING btree (language);


--
-- Name: idx_error_logs_request; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_request ON public.error_logs USING btree (request_id);


--
-- Name: idx_error_logs_resolved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_resolved ON public.error_logs USING btree (resolved) WHERE (resolved = false);


--
-- Name: idx_error_logs_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_severity ON public.error_logs USING btree (severity, created_at);


--
-- Name: idx_evt_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evt_token ON public.email_verification_tokens USING btree (token);


--
-- Name: idx_evt_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evt_user ON public.email_verification_tokens USING btree (user_id);


--
-- Name: idx_fines_member; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fines_member ON public.fines USING btree (member_id);


--
-- Name: idx_fines_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fines_status ON public.fines USING btree (status) WHERE (status = 'pending'::public.fine_status_enum);


--
-- Name: idx_fines_transaction; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fines_transaction ON public.fines USING btree (transaction_id);


--
-- Name: idx_rt_token_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rt_token_hash ON public.refresh_tokens USING btree (token_hash);


--
-- Name: idx_rt_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rt_user ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_transactions_book; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_book ON public.transactions USING btree (book_id);


--
-- Name: idx_transactions_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_due_date ON public.transactions USING btree (due_date) WHERE (status = 'issued'::public.transaction_status_enum);


--
-- Name: idx_transactions_member; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_member ON public.transactions USING btree (member_id);


--
-- Name: idx_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_status ON public.transactions USING btree (status);


--
-- Name: idx_users_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_active ON public.users USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_google_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_google_id ON public.users USING btree (google_id) WHERE (google_id IS NOT NULL);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: books books_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.book_categories(id) ON DELETE SET NULL;


--
-- Name: books books_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: email_verification_tokens email_verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: error_logs error_logs_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: error_logs error_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: fines fines_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fines
    ADD CONSTRAINT fines_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: fines fines_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fines
    ADD CONSTRAINT fines_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;


--
-- Name: fines fines_waived_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fines
    ADD CONSTRAINT fines_waived_by_fkey FOREIGN KEY (waived_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: permission_policies permission_policies_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_policies
    ADD CONSTRAINT permission_policies_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE RESTRICT;


--
-- Name: transactions transactions_issued_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: transactions transactions_returned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_returned_to_fkey FOREIGN KEY (returned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict x49ScMACYfQc106N6H0FKKfVsq2dRFwbIPbZO4vvyYNpefdWXgfMfDh6XqSpDUG


-- ============================================================
-- SEED DATA (users, categories, permissions, role_permissions)
-- ============================================================
--
-- PostgreSQL database dump
--

\restrict mIYNaYkYkGcXBEp6gM5MrjJMD4XKt7a2CzNSV6C8ncWm50PwBQF7YccyOPRGxCP

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: book_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.book_categories (name, slug, description, id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (code, description, resource, action, id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (role, permission_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (email, full_name, password_hash, avatar_url, auth_provider, google_id, role, is_active, is_email_verified, phone, address, membership_id, deleted_at, id, created_at, updated_at) FROM stdin;
admin@trovera.dev	Super Admin	$2b$12$9d07WfKdrZHjL/r8BJY1s.3wQeq6Bh360AdIg91D/Lc1KDMrO1ZSi	\N	local	\N	super_admin	t	t	\N	\N	\N	\N	7d7a116a-63da-45c1-8a7e-439d3408f87b	2026-06-16 17:00:22.910956+05:30	2026-06-16 17:00:22.91096+05:30
librarian@trovera.dev	Librarian User	$2b$12$YskzexQjwcyLsjZI8OAOwOjeEE.3xGTwcFrLn7ehcjNZa.XU5gbuG	\N	local	\N	librarian	t	t	\N	\N	\N	\N	c4f1a310-21f0-48e1-ba9f-4e8295506232	2026-06-16 17:00:23.111937+05:30	2026-06-16 17:00:23.11194+05:30
member@trovera.dev	Member User	$2b$12$MdiBURIWaxxToIzXmo.6MeMcUsVDYO9aBC93BvvztqJijtttjRgQO	\N	local	\N	member	t	t	\N	\N	\N	\N	888ef5bf-243e-4593-9e5b-abc3b68653ec	2026-06-16 17:00:23.307294+05:30	2026-06-16 17:00:23.3073+05:30
\.


--
-- PostgreSQL database dump complete
--

\unrestrict mIYNaYkYkGcXBEp6gM5MrjJMD4XKt7a2CzNSV6C8ncWm50PwBQF7YccyOPRGxCP


# ClanSko — 1,000 Users Scale & Security Readiness Plan

> **Date:** September 2026  
> **Platform:** ClanSko (Next.js 14 App Router, Supabase, Groq `llama-3.3-70b-versatile`, Tailwind CSS)  
> **Target Audience:** Engineering Students across Indian Universities  
> **Scale Target:** 1,000 Registered Users (~100–200 Peak Concurrent Users)  
> **Constraint:** Lowest possible operational cost, zero unnecessary rewrites, keeping current stack intact.

---

## 1. Verification Results of Earlier Audit Findings

Every item from the initial audit was verified against the active codebase. Below is the confirmation matrix with exact file and line references.

| # | Finding | Status | Evidence (File & Line) | Severity | Notes |
|---|---|---|---|---|---|
| **1** | `lib/supabase.js` creates client at import time, crashing `next build` if env vars are missing; imported by `/api/users/[id]` | **CONFIRMED** | `lib/supabase.js:18-21`<br>`app/api/users/[id]/route.js:7` | **Blocker** | `export const supabase = createClient(...)` runs at module load time. If `NEXT_PUBLIC_SUPABASE_URL` is undefined during static build analysis, `createClient` throws fatal error. `app/api/users/[id]/route.js` is the sole importer. |
| **2** | `app/api/users/route.js` trusts client-supplied `?userId=` without auth; check if email is exposed | **PARTIAL / CONFIRMED** | `app/api/users/route.js:31-35, 42-45` | **High** | **Confirmed:** Endpoint does not verify `supabase.auth.getUser()`, allowing unauthenticated users to scrape all profiles.<br>**Refuted:** `email` is NOT exposed in the response; `select()` explicitly specifies public fields (`id, name, college, branch, year, bio, skills, looking_for, profile_photo, created_at`). |
| **3** | Row Level Security (RLS) is missing/unconfigured; browser clients query Supabase directly | **CONFIRMED** | `app/(app)/messages/[connectionId]/page.jsx:92-101`<br>`app/(app)/profile/edit/page.jsx:55-59`<br>`app/(app)/onboarding/page.jsx:63-66`<br>`middleware.js:44-48` | **Blocker** | No SQL migrations or RLS policies exist in the repository. Because the anon key is public, any user with PostgREST access can read/write/delete any row in all tables unless Postgres RLS is enabled and enforced. |
| **4** | No rate limiting on `/api/sko/chat` and `/api/auth/*` | **CONFIRMED** | `app/api/sko/chat/route.js:113-214`<br>`app/api/auth/login/route.js:26-67`<br>`app/api/auth/signup/route.js:27-70` | **High** | No IP or token-based rate limiting exists. A single bad actor or loop can exhaust Groq TPM/RPM limits (or incur high costs) and brute-force auth credentials. |
| **5** | Prompt injection: user bio, title, description interpolated into Sko system prompt | **CONFIRMED** | `app/api/sko/chat/route.js:40-81, 164-169` | **High** | Raw strings (`user.bio`, `user.skills`, `p.title`, `p.description`, `g.goal_text`) are concatenated directly into the LLM system prompt without sanitization or boundary delimiter framing. |
| **6** | Missing database indexes on foreign keys, lookups, and compound filters | **CONFIRMED** | `posts(stage, created_at)`<br>`connections(receiver_id, status)`<br>`messages(connection_id, created_at)`<br>`goals(user_id, week_key)` | **High** | No index creation scripts exist. Queries across `messages`, `connections`, `posts`, `reactions`, and `comments` perform sequential table scans, degrading rapidly as records grow. |
| **7** | No pagination on `/api/posts`, `/api/users`, `/api/conversations`, `/api/messages`, and comments | **CONFIRMED** | `app/api/posts/route.js:45-70`<br>`app/api/users/route.js:42-48`<br>`app/api/conversations/route.js:31-42`<br>`app/api/messages/route.js:68-80`<br>`app/api/posts/[id]/route.js:68-82` | **High** | Endpoints query and return entire tables in memory without `limit` or `range`, causing high payload sizes, slow response times, and high memory consumption. |
| **8** | N+1 / sequential query cascades in `/api/projects/my`, `/api/projects/[id]`, and `/api/posts` | **CONFIRMED (Critical)** | `app/(app)/feed/page.jsx:103-113`<br>`app/api/projects/my/route.js:27-64`<br>`app/api/projects/[id]/route.js:30-66`<br>`app/api/conversations/route.js:55-87` | **Blocker** | Feed page fires `Promise.all(posts.map(p => fetch('/api/projects/' + p.id)))`, making **20+ HTTP requests per feed load**, each triggering 4 sequential SQL queries. In addition, `/api/conversations` runs 2 DB queries per connection in a loop. |
| **9** | No post edit or delete; no report or block functionality | **CONFIRMED** | `app/api/posts/*`<br>`app/(app)/feed/page.jsx` | **Medium** | Users cannot delete or edit their own posts. No abuse reporting or blocking mechanism exists for UGC compliance. |
| **10** | Inconsistent `cookies()` usage (sync vs `await`) and duplicated Supabase client setup | **CONFIRMED** | Sync: `app/api/auth/login/route.js:8`<br>Async: `app/api/messages/read/route.js:8`<br>`app/api/projects/my/route.js:9` | **Medium** | Over 18 API route handlers copy-paste 20+ lines of custom `getSupabase()` boilerplate with varying cookie getters/setters and mixed sync/await Next.js headers. |
| **11** | Realtime: channel proliferation and unmount cleanup | **CONFIRMED (Partial)** | `app/(app)/messages/[connectionId]/page.jsx:89-130` | **Medium** | Chat page cleans up on unmount, but line 90 executes `supabase.removeChannel(supabase.channel(channelName))` which erroneously creates a new channel instance before removal. Supabase Free Tier is capped at 200 concurrent Realtime connections. |
| **12** | No automated tests and no error monitoring | **CONFIRMED** | `package.json:5-10` | **Medium** | No testing framework (Jest/Vitest/Playwright) is installed. No error capture tool (e.g. Sentry) is integrated. |
| **13** | Input validation, signup checks, Groq input bounds, security headers | **CONFIRMED** | `app/api/posts/create/route.js:38-62`<br>`app/api/users/update/route.js:27-56`<br>`app/api/auth/signup/route.js:28-44`<br>`next.config.mjs:2-4` | **High** | Missing payload length limits (e.g. infinite text in bio/description), unbounded message arrays sent to Groq API, no email format validation or DB trigger for new users, and empty security headers in `next.config.mjs`. |

---

## 2. Additional Issues Discovered

During codebase inspection, the following critical issues not covered in the original audit were identified:

1. **Catastrophic Client-Side N+1 Feed Waterfall (`app/(app)/feed/page.jsx:103-113`)**:
   - On every feed visit, after `/api/posts` returns 20 posts, `FeedPage` maps over every post and calls `fetch('/api/projects/' + p.id)`.
   - Each `/api/projects/[id]` route performs **4 separate SQL queries** sequentially.
   - Result: **1 feed page load = 1 initial request + 20 sub-requests = 21 HTTP roundtrips and 81 database queries** per user. With 100 concurrent users, this generates 2,100 HTTP requests and 8,100 DB queries simultaneously, instantly crashing Vercel Serverless Function concurrency limits and Supabase connection pools.
2. **Missing Database Integrity Constraints & Race Conditions**:
   - `reactions`: No unique constraint on `(post_id, user_id)`. Concurrent clicks produce duplicate reaction rows.
   - `connections`: No unique constraint on `(sender_id, receiver_id)`. Rapid double-clicks produce duplicate connection rows.
   - `project_members`: No unique constraint on `(project_id, user_id)`.
3. **Orphaned Auth Records on Signup (`app/api/auth/signup/route.js:40-63`)**:
   - The route calls `supabase.auth.signUp()` and then attempts a manual `supabase.from('users').insert(...)`.
   - If the DB insert fails (e.g. network timeout or DB glitch), the user exists in `auth.users` but not in `public.users`. Subsequent logins trigger 404/500 crashes because profile records are missing.
   - Fix: Use a PostgreSQL Trigger (`handle_new_user`) attached to `auth.users`.
4. **Non-Atomic View Count Updates (`app/api/posts/[id]/route.js:112-116`)**:
   - The route updates view counts by reading `post.view_count` and writing `view_count + 1`.
   - Under concurrent views, updates overwrite each other (lost update anomaly). Requires a simple Postgres RPC increment function.
5. **Unbounded Groq Request Payload (`app/api/sko/chat/route.js:127-131, 180-192`)**:
   - The endpoint sends the entire `messages` array from the client payload directly to Groq.
   - A client can send 500 messages, exceeding Groq context window (causing 400 Bad Request) or consuming the entire 6,000 TPM limit in one request.
6. **Missing Security Headers (`next.config.mjs`)**:
   - `next.config.mjs` is completely empty (`const nextConfig = {};`).
   - Missing `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.


---

## 3. Phased Implementation Plan

### Phase 0: Security & Build Blockers (Must-Fix Before Any Launch)

#### Task 0.1: Fix `lib/supabase.js` and `/api/users/[id]` Build Blocker
- **Goal:** Prevent `next build` crashes when environment variables are missing during build time; remove dangerous module-level client singleton.
- **Files to Change:** `lib/supabase.js`, `app/api/users/[id]/route.js`
- **Approach:**
  - Update `lib/supabase.js` to only export a lazy client getter `getSupabaseClient()` that validates env vars on call rather than at import time.
  - Refactor `app/api/users/[id]/route.js` to use standard SSR server client with session cookies.
- **Estimated Effort:** 1.0 hour
- **Risk:** Very Low.
- **Acceptance Criteria:** `npm run build` succeeds cleanly even if Supabase keys are not baked into static build analysis.

#### Task 0.2: Implement Complete Row Level Security (RLS) Policies
- **Goal:** Secure all 8 tables against unauthorized access, data leaks, and tampering via the public anon key.
- **Files to Change:** Supabase Database (Migration SQL script)
- **Approach:** Enable RLS on `users`, `posts`, `comments`, `reactions`, `connections`, `messages`, `goals`, `project_members`. Apply strict policies ensuring users can only modify their own rows, read allowed public data, and access private messages/goals only if they are the participant/owner.
- **Estimated Effort:** 3.5 hours
- **Risk:** High if policies are overly restrictive; thoroughly verify with multi-user access tests.
- **Acceptance Criteria:** Unauthenticated client requests cannot select from `messages`, `goals`, or update `users`; authenticated users can only mutate their own records.

#### Task 0.3: Secure `/api/users` and `/api/connections` Endpoints
- **Goal:** Eliminate unauthenticated access and remove reliance on client-supplied `?userId=` query parameter.
- **Files to Change:** `app/api/users/route.js`, `app/api/connections/route.js`, `app/(app)/explore/page.jsx`, `app/(app)/projects/[id]/page.jsx`
- **Approach:**
  - In `app/api/users/route.js`, authenticate the user via `supabase.auth.getUser()`. Exclude the session user (`user.id`) by default.
  - In `app/api/connections/route.js`, derive the current user ID strictly from the authenticated session, ignoring query params.
  - Update frontend calls in `explore/page.jsx` and `projects/[id]/page.jsx` to fetch `/api/users` and `/api/connections` without passing `?userId=`.
- **Estimated Effort:** 2.0 hours
- **Risk:** Low.
- **Acceptance Criteria:** `/api/users` and `/api/connections` return 401 Unauthorized if no valid session cookie is present; authenticated calls return correct scoped data.

#### Task 0.4: Eliminate Client-Side N+1 Fetch Storm on Feed Page
- **Goal:** Stop `FeedPage` from firing 20+ separate HTTP requests to `/api/projects/[id]` upon loading.
- **Files to Change:** `app/api/posts/route.js`, `app/(app)/feed/page.jsx`
- **Approach:**
  - Enhance `/api/posts/route.js` to include team member count / accepted members in the initial query or join:
    ```javascript
    // In /api/posts/route.js, fetch project_members for postIds in batch:
    const { data: teamMembers } = await supabase
      .from('project_members')
      .select('id, project_id, user_id, role, status, users:user_id(id, name, profile_photo)')
      .in('project_id', postIds)
      .eq('status', 'accepted')
    ```
  - Map `teamMembers` directly onto each post object in `enrichedPosts`.
  - Remove the `Promise.all(fetchedPosts.map(p => fetch('/api/projects/' + p.id)))` loop from `app/(app)/feed/page.jsx:103-113`.
- **Estimated Effort:** 2.5 hours
- **Risk:** Low.
- **Acceptance Criteria:** Feed page loads in exactly 1 HTTP request (`/api/posts`); team avatars and counts display accurately without sub-fetches.


### Phase 1: Required for 1,000 Users (Scale, Rate Limiting & Abuse Prevention)

#### Task 1.1: Database Migration Script (Indexes, Constraints, Trigger)
- **Goal:** Create all essential indexes, foreign key cascading rules, unique constraints, and the signup trigger.
- **Files to Change:** `supabase/migrations/20260928000001_initial_1000_users.sql` (to run in Supabase SQL editor)
- **Approach:** Execute ordered, idempotent SQL creating compound indexes, unique constraints, `on_auth_user_created` trigger, and `increment_post_view` function.
- **Estimated Effort:** 2.0 hours
- **Risk:** Low (uses `IF NOT EXISTS` and non-blocking index creation).
- **Acceptance Criteria:** All foreign key queries and filters run with `Index Scan` rather than `Seq Scan` in `EXPLAIN ANALYZE`.

#### Task 1.2: Server-Side Rate Limiting
- **Goal:** Prevent API abuse, brute-force auth attacks, and Groq token exhaustion.
- **Files to Change:** `lib/ratelimit.js` (new), `app/api/sko/chat/route.js`, `app/api/auth/login/route.js`, `app/api/auth/signup/route.js`, `app/api/posts/create/route.js`
- **Comparison & Recommendation:**
  - *Option A: In-Memory (LRU Cache)* — Zero cost, zero external deps. Flaw: Resets across Vercel serverless lambda cold starts; ineffective across distributed instances.
  - *Option B: Supabase Table Rate Limit* — Uses Postgres. Flaw: Adds DB read/write load on every single request.
  - *Option C: Upstash Redis (`@upstash/ratelimit`)* — Industry standard for Next.js App Router on Vercel. Free tier provides 10,000 commands/day (generous for 1,000 users), global edge state, ~1ms latency.
  - *Recommendation:* Use Upstash Redis with a resilient in-memory fallback for local development when env vars are missing.
- **Rate Limit Thresholds:**
  - `/api/auth/login`: 5 requests per minute per IP
  - `/api/auth/signup`: 3 requests per hour per IP
  - `/api/sko/chat`: 10 requests per minute per user ID (max 100/day)
  - `/api/posts/create`: 5 posts per hour per user ID
- **Estimated Effort:** 3.0 hours
- **Risk:** Low.
- **Acceptance Criteria:** Excessive requests receive HTTP 429 Too Many Requests with a `Retry-After` header.

#### Task 1.3: Cursor/Offset Pagination on Heavy Endpoints
- **Goal:** Limit database load and network payload sizes across list endpoints.
- **Files to Change:**
  - `app/api/posts/route.js` (`limit = 20`, `cursor` / `created_at` before)
  - `app/api/users/route.js` (`limit = 24`, `page` offset)
  - `app/api/messages/route.js` (`limit = 50`, `before_id` cursor)
  - `app/api/conversations/route.js` (`limit = 30`)
  - Respective client pages (`feed/page.jsx`, `explore/page.jsx`, `messages/[connectionId]/page.jsx`) to support infinite scroll / "Load More".
- **Estimated Effort:** 4.5 hours
- **Risk:** Medium (requires matching client state updates without duplicates).
- **Acceptance Criteria:** API returns `{ data, nextCursor, hasMore }`; payloads stay under 50KB.

#### Task 1.4: Strict Input Validation & Length Limits
- **Goal:** Prevent malformed, oversized, or malicious payloads from reaching database and LLM.
- **Files to Change:** `lib/validation.js` (new helper), `app/api/posts/create/route.js`, `app/api/posts/comment/route.js`, `app/api/users/update/route.js`, `app/api/connections/request/route.js`, `app/api/goals/route.js`
- **Validation Rules:**
  - Post: `title` (3–100 chars), `description` (10–2000 chars), `stage` (`enum: idea, validation, building, launched`), `looking_for` (array max 7 items, strings <= 30 chars).
  - Comment: `content` (1–500 chars).
  - Bio: max 500 chars; `skills`: max 10 items (<= 30 chars each).
  - Message: `content` (1–1000 chars).
  - Goal: `goal_text` (3–200 chars).
- **Estimated Effort:** 2.5 hours
- **Risk:** Very Low.
- **Acceptance Criteria:** Invalid or oversized inputs return 400 Bad Request with descriptive validation errors.

#### Task 1.5: Sko AI Prompt Injection & Token Abuse Hardening
- **Goal:** Prevent prompt injection via user profile / idea content and bound Groq token consumption.
- **Files to Change:** `app/api/sko/chat/route.js`
- **Approach:**
  - Sanitize user context fields (strip XML-like tags, truncate bio to 250 chars, descriptions to 200 chars).
  - Wrap user-supplied data in explicit boundary markers (e.g. `<user_context>...</user_context>`) and instruct the system prompt to treat content strictly as untrusted data.
  - Slice input chat history to the **last 6 messages** maximum.
  - Enforce max 500 characters per individual chat message.
  - Set `max_tokens: 800` in Groq payload.
- **Estimated Effort:** 2.0 hours
- **Risk:** Low.
- **Acceptance Criteria:** Sko ignores injected instructions in bio/descriptions; Groq token limits are never exceeded.

#### Task 1.6: Post Deletion & Connection Cancel
- **Goal:** Allow users to delete their own posts and cancel pending connection requests.
- **Files to Change:**
  - `app/api/posts/[id]/route.js` (add `DELETE` handler with owner check)
  - `app/api/connections/route.js` (add `DELETE` handler for pending sent requests)
  - `app/(app)/feed/page.jsx` & `app/(app)/profile/[id]/page.jsx` (add delete button for author)
- **Estimated Effort:** 2.0 hours
- **Risk:** Low.
- **Acceptance Criteria:** Author can delete post; cascading foreign keys clean up comments and reactions; non-author receives 403 Forbidden.


### Phase 2: Operational Hygiene & Performance (Should-Have)

#### Task 2.1: Unified Server Supabase Helper (`lib/supabase-server.js`)
- **Goal:** Remove copy-pasted `getSupabase()` boilerplate from 18 route handlers and standardize cookie handling.
- **Files to Change:** `lib/supabase-server.js` (new), all 18 `app/api/**/route.js` files.
- **Approach:** Create a single, standardized `createClient()` wrapper using `@supabase/ssr` with consistent `cookies()` access and auth token extraction.
- **Estimated Effort:** 3.0 hours
- **Risk:** Low.
- **Acceptance Criteria:** All route handlers use `import { getSupabaseServerClient } from '@/lib/supabase-server'`.

#### Task 2.2: Optimize Sequential Backend Queries
- **Goal:** Eliminate waterfall database calls in `/api/projects/my`, `/api/projects/[id]`, and `/api/conversations`.
- **Files to Change:**
  - `app/api/projects/my/route.js`: Consolidate 4 sequential calls into 2 parallelized/joined queries.
  - `app/api/projects/[id]/route.js`: Join project author and members into a single Supabase query.
  - `app/api/conversations/route.js`: Replace the `connections.map(async ...)` N+1 loop with a single aggregate query or batch lookup for last messages and unread counts.
- **Estimated Effort:** 3.5 hours
- **Risk:** Medium.
- **Acceptance Criteria:** Response times for `/api/conversations` and `/api/projects/my` drop from >600ms to <120ms.

#### Task 2.3: Realtime Channel Hygiene & WebSocket Lifecycle
- **Goal:** Ensure Realtime channels never leak or exceed Supabase concurrent connection thresholds.
- **Files to Change:** `app/(app)/messages/[connectionId]/page.jsx`
- **Approach:**
  - Fix channel cleanup bug (remove erroneous line 90).
  - Use a clean `useEffect` lifecycle with `supabase.removeChannel(channel)` on unmount and page blur.
  - Add reconnect backoff logic.
- **Estimated Effort:** 1.5 hours
- **Risk:** Low.
- **Acceptance Criteria:** Switching between chat conversations cleanly destroys old WebSocket channels without leaking subscriptions.

#### Task 2.4: Basic Moderation & Reporting System
- **Goal:** Provide a way for users to report spam, inappropriate content, or abusive behavior.
- **Files to Change:** `supabase/migrations/20260928000001_initial_1000_users.sql` (add `reports` table), `app/api/reports/route.js` (new), `app/(app)/feed/page.jsx` (report button in modal).
- **Estimated Effort:** 2.5 hours
- **Risk:** Low.
- **Acceptance Criteria:** Users can submit a report with a reason; reports are saved in `reports` table with reporter ID and target post/user ID.

#### Task 2.5: Error Tracking & Monitoring (Sentry / GlitchTip)
- **Goal:** Capture uncaught serverless and client-side exceptions in production in real-time.
- **Files to Change:** `package.json` (`@sentry/nextjs`), `sentry.client.config.js`, `sentry.server.config.js`, `next.config.mjs`
- **Estimated Effort:** 2.0 hours
- **Risk:** Low.
- **Acceptance Criteria:** Test exception triggers an alert in Sentry/GlitchTip dashboard with stack trace and environment tags.

---

### Phase 3: Tests, Cleanup & Polish (Nice-to-Have)

#### Task 3.1: Automated Core Flow Integration Tests
- **Goal:** Ensure core auth, feed, chat, and project workflows do not regress during future updates.
- **Files to Change:** `package.json` (add Vitest / Playwright), `tests/auth.test.js`, `tests/posts.test.js`, `tests/messages.test.js`
- **Estimated Effort:** 4.0 hours
- **Risk:** Zero.
- **Acceptance Criteria:** `npm test` runs suite in <10 seconds validating route status codes and RLS enforcement.

#### Task 3.2: Security Headers in `next.config.mjs`
- **Goal:** Harden browser security against clickjacking, MIME sniffing, and XSS.
- **Files to Change:** `next.config.mjs`
- **Estimated Effort:** 1.0 hour
- **Risk:** Low (ensure external asset domains like Supabase storage and Groq are allowlisted in CSP).
- **Acceptance Criteria:** `curl -I` returns standard security headers (`X-Frame-Options`, `Content-Security-Policy`, etc.).

#### Task 3.3: Atomic View Count RPC
- **Goal:** Fix race condition in post view count increments.
- **Files to Change:** Supabase SQL migration, `app/api/posts/[id]/route.js`
- **Approach:** Call `supabase.rpc('increment_post_view', { post_id: id })` instead of read-modify-write.
- **Estimated Effort:** 1.0 hour
- **Risk:** Low.
- **Acceptance Criteria:** Concurrent views increment counter accurately without lost updates.


---

## 4. Complete Database Migration Script Plan

This ordered, idempotent SQL script sets up tables, constraints, indexes, RLS policies, triggers, and RPC functions in Supabase.

```sql
-- ============================================================================
-- ClanSko 1,000 Users Database Migration
-- Idempotent setup for Tables, Constraints, Indexes, RLS, and Triggers
-- Preserves existing live database data, enums, and column structures.
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE / VERIFY TABLES (Idempotent)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT NOT NULL,
  college TEXT,
  branch TEXT,
  year TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  looking_for TEXT[] DEFAULT '{}',
  profile_photo TEXT,
  onboarding_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure non-breaking columns on users if table already existed
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS looking_for TEXT[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'idea',
  looking_for TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure non-breaking columns on posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS looking_for TEXT[] DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;

-- Validate/apply post stage constraint (accommodates all legacy & current stages)
DO $$
BEGIN
  ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS check_post_stage;
  ALTER TABLE public.posts ADD CONSTRAINT check_post_stage 
    CHECK (stage IN ('idea', 'validation', 'mvp', 'building', 'launched', 'live'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_post_reaction UNIQUE (post_id, user_id)
);

-- Validate/apply reaction type constraint (supports all legacy & current reaction types)
DO $$
BEGIN
  ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS check_reaction_type;
  ALTER TABLE public.reactions ADD CONSTRAINT check_reaction_type 
    CHECK (type IN ('fire', 'eyes', 'handshake', 'insightful', 'collaborate'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT different_users CHECK (sender_id <> receiver_id),
  CONSTRAINT unique_connection_pair UNIQUE (sender_id, receiver_id)
);

-- Validate/apply connection status constraint (supports both 'rejected' and 'declined')
DO $$
BEGIN
  ALTER TABLE public.connections DROP CONSTRAINT IF EXISTS check_connection_status;
  ALTER TABLE public.connections ADD CONSTRAINT check_connection_status 
    CHECK (status IN ('pending', 'accepted', 'rejected', 'declined'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  week_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  streak_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_week_goal UNIQUE (user_id, week_key)
);

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_project_member UNIQUE (project_id, user_id)
);

-- Validate/apply project member status constraint
DO $$
BEGIN
  ALTER TABLE public.project_members DROP CONSTRAINT IF EXISTS check_member_status;
  ALTER TABLE public.project_members ADD CONSTRAINT check_member_status 
    CHECK (status IN ('pending', 'accepted', 'declined', 'rejected'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'user', 'comment', 'message')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 3. SECURE PUBLIC PROFILES VIEW (Email Privacy Protection)
-- ============================================================================
-- Excludes private emails while exposing all public directory & profile info
CREATE OR REPLACE VIEW public.profiles AS
  SELECT 
    id,
    name,
    college,
    branch,
    year,
    bio,
    skills,
    looking_for,
    profile_photo,
    onboarding_done,
    created_at,
    updated_at
  FROM public.users;

-- ============================================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_onboarding_created ON public.users(onboarding_done, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id_created ON public.posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_stage_created ON public.posts(stage, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_post_id_created ON public.comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_connections_sender_status ON public.connections(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_receiver_status ON public.connections(receiver_id, status);

CREATE INDEX IF NOT EXISTS idx_messages_connection_created ON public.messages(connection_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(connection_id, is_read, sender_id);

CREATE INDEX IF NOT EXISTS idx_goals_user_week ON public.goals(user_id, week_key);
CREATE INDEX IF NOT EXISTS idx_goals_user_created ON public.goals(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id, status);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 4.1 USERS POLICIES
DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON public.users;
CREATE POLICY "Users are viewable by authenticated users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4.2 POSTS POLICIES
DROP POLICY IF EXISTS "Posts are viewable by authenticated users" ON public.posts;
CREATE POLICY "Posts are viewable by authenticated users"
  ON public.posts FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4.3 COMMENTS POLICIES
DROP POLICY IF EXISTS "Comments are viewable by authenticated users" ON public.comments;
CREATE POLICY "Comments are viewable by authenticated users"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments or on their posts" ON public.comments;
CREATE POLICY "Users can delete their own comments or on their posts"
  ON public.comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.posts WHERE id = comments.post_id AND user_id = auth.uid())
  );

-- 4.4 REACTIONS POLICIES
DROP POLICY IF EXISTS "Reactions are viewable by authenticated users" ON public.reactions;
CREATE POLICY "Reactions are viewable by authenticated users"
  ON public.reactions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can add reactions" ON public.reactions;
CREATE POLICY "Users can add reactions"
  ON public.reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their reactions" ON public.reactions;
CREATE POLICY "Users can update their reactions"
  ON public.reactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their reactions" ON public.reactions;
CREATE POLICY "Users can remove their reactions"
  ON public.reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5.5 CONNECTIONS POLICIES (Hardened: Senders cannot self-accept requests)
DROP POLICY IF EXISTS "Users can view their own connections" ON public.connections;
CREATE POLICY "Users can view their own connections"
  ON public.connections FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send connection requests" ON public.connections;
CREATE POLICY "Users can send connection requests"
  ON public.connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id AND sender_id <> receiver_id);

-- Only the receiver is permitted to accept or decline connection requests
DROP POLICY IF EXISTS "Receivers can update connection status" ON public.connections;
DROP POLICY IF EXISTS "Participants can update connection status" ON public.connections;
CREATE POLICY "Receivers can update connection status"
  ON public.connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Either sender (cancelling pending request) or receiver (declining/removing) can delete connection
DROP POLICY IF EXISTS "Participants can delete connections" ON public.connections;
CREATE POLICY "Participants can delete connections"
  ON public.connections FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 5.6 MESSAGES POLICIES (Hardened: Receivers can only update is_read)
DROP POLICY IF EXISTS "Users can view messages in their connections" ON public.messages;
CREATE POLICY "Users can view messages in their connections"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = messages.connection_id
        AND (c.sender_id = auth.uid() OR c.receiver_id = auth.uid())
        AND c.status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Users can send messages in accepted connections" ON public.messages;
CREATE POLICY "Users can send messages in accepted connections"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = messages.connection_id
        AND (c.sender_id = auth.uid() OR c.receiver_id = auth.uid())
        AND c.status = 'accepted'
    )
  );

-- Only message recipients can mark messages as read. Content modifications are prevented.
DROP POLICY IF EXISTS "Receivers can mark messages as read" ON public.messages;
CREATE POLICY "Receivers can mark messages as read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    auth.uid() <> sender_id AND
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = messages.connection_id
        AND (c.sender_id = auth.uid() OR c.receiver_id = auth.uid())
        AND c.status = 'accepted'
    )
  )
  WITH CHECK (
    auth.uid() <> sender_id AND
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = messages.connection_id
        AND (c.sender_id = auth.uid() OR c.receiver_id = auth.uid())
        AND c.status = 'accepted'
    )
  );

-- 5.7 GOALS POLICIES
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
CREATE POLICY "Users can view their own goals"
  ON public.goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own goals" ON public.goals;
CREATE POLICY "Users can insert their own goals"
  ON public.goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
CREATE POLICY "Users can update their own goals"
  ON public.goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;
CREATE POLICY "Users can delete their own goals"
  ON public.goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5.8 PROJECT MEMBERS POLICIES (Hardened: Full lifecycle with UPDATE and DELETE)
DROP POLICY IF EXISTS "Project members are viewable by authenticated users" ON public.project_members;
CREATE POLICY "Project members are viewable by authenticated users"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Project owners can invite members" ON public.project_members;
CREATE POLICY "Project owners can invite members"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = invited_by AND
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = project_members.project_id AND p.user_id = auth.uid())
  );

-- Invited users can accept/decline; project owners can manage roles/status
DROP POLICY IF EXISTS "Users and owners can update project member status" ON public.project_members;
CREATE POLICY "Users and owners can update project member status"
  ON public.project_members FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = project_members.project_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = project_members.project_id AND p.user_id = auth.uid())
  );

-- Members can leave projects; project owners can remove members
DROP POLICY IF EXISTS "Users and owners can delete project members" ON public.project_members;
CREATE POLICY "Users and owners can delete project members"
  ON public.project_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = project_members.project_id AND p.user_id = auth.uid())
  );

-- 5.9 REPORTS POLICIES
DROP POLICY IF EXISTS "Users can submit reports" ON public.reports;
CREATE POLICY "Users can submit reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- ============================================================================
-- 6. AUTOMATIC PROFILE CREATION TRIGGER (AUTH -> USERS)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, onboarding_done, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 7. ATOMIC VIEW COUNT INCREMENT RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_post_view(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.posts
  SET view_count = view_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```


---

## 5. Capacity and Cost Analysis

### Workload Estimates for 1,000 Registered Users (100–200 Peak Concurrent)

| Metric | Estimate / Calculation | Free Tier Limit | Plan Recommendation |
|---|---|---|---|
| **Daily Active Users (DAU)** | ~250–350 users (25–35% of registered) | — | — |
| **Peak Concurrent Users (PCU)** | ~100–200 simultaneous users | — | — |
| **Session Frequency & Duration** | 1.5 sessions/user/day, 8 min/session | — | — |
| **Requests / User / Session** | ~18 HTTP requests (Feed, Chat, Goals, Explore) | — | — |
| **Daily HTTP Invocations** | ~9,000 – 15,000 serverless calls/day (~350k/mo) | **Vercel Hobby:** 1,000,000 invocations/mo | **Vercel Hobby ($0/mo)** is sufficient (provided Task 0.4 N+1 is fixed!) |
| **Bandwidth** | ~15–25 GB / month | **Vercel Hobby:** 100 GB/mo | **$0/mo** |
| **Supabase Database Size** | ~15–30 MB for 1,000 users, 5,000 posts, 30,000 msgs | **Supabase Free:** 500 MB storage | **Supabase Free ($0/mo)** |
| **Supabase Monthly Active Users** | 1,000 MAU | **Supabase Free:** 50,000 MAU | **$0/mo** |
| **Peak Realtime WebSocket Connections** | ~40–80 simultaneous active chat channels | **Supabase Free:** 200 concurrent connections | **Supabase Free ($0/mo)** (Close channels on blur/navigate) |
| **Groq AI Chat Volume** | 100 AI chats/day × 4 turns = 400 requests/day | **Groq Free:** 14,400 Requests/day | **Groq Free ($0/mo)** |
| **Groq Peak TPM (Tokens/Min)** | ~3,000 – 4,500 tokens/min at peak | **Groq Free:** 6,000 Tokens/min (`llama-3.3-70b`) | **Groq Free ($0/mo)** (Requires Task 1.5 prompt trimming) |
| **Rate Limiting Cache** | ~15,000 commands/day | **Upstash Free:** 10,000 commands/day | **Upstash Pay-as-you-go ($0.20/mo)** or in-memory fallback |

### Total Monthly Infrastructure Cost: **$0.00 – $0.50 / month**

### What Would Break First Under Load?
1. **Groq TPM (Tokens Per Minute) limit (6,000 TPM):** If 4 users query Sko AI simultaneously with large conversation histories, Groq throws `429 Rate Limit Exceeded`. Hardening in Task 1.5 (trimming to 6 messages and max 800 tokens) keeps each call under 1,200 tokens, supporting 5 concurrent calls per minute cleanly.
2. **Supabase Connection Pool Exhaustion:** If serverless functions connect directly to Postgres port 5432 instead of port 6543 (PgBouncer/Supavisor transaction pooler).
3. **Realtime WebSocket Cap (200 connections):** If users keep chat tabs open in background without unmount cleanup.


---

## 6. Load Test Plan (k6 Scenario)

Below is a complete `k6` load test script (`tests/load-test.js`) testing the platform under realistic traffic (ramp-up to 150 virtual users).

```javascript
// tests/load-test.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 30 },   // Ramp up to 30 users
    { duration: '1m',  target: 100 },  // Normal peak traffic (100 users)
    { duration: '30s', target: 150 },  // Stress spike (150 users)
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<450'],  // 95% of requests must complete in <450ms
    http_req_failed: ['rate<0.01'],    // Error rate must be under 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // 1. Browse Feed
  group('Feed Load', () => {
    const res = http.get(`${BASE_URL}/api/posts?limit=20`);
    check(res, {
      'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'response time < 350ms': (r) => r.timings.duration < 350,
    });
  });
  sleep(2);

  // 2. Explore Users Directory
  group('Explore Users', () => {
    const res = http.get(`${BASE_URL}/api/users?limit=24`);
    check(res, {
      'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'response time < 300ms': (r) => r.timings.duration < 300,
    });
  });
  sleep(2);

  // 3. Conversations List
  group('Conversations', () => {
    const res = http.get(`${BASE_URL}/api/conversations`);
    check(res, {
      'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'response time < 250ms': (r) => r.timings.duration < 250,
    });
  });
  sleep(3);
}
```

### Pass / Fail Thresholds:
- **Feed API (`/api/posts`):** p95 latency < 350ms, 0% fatal errors.
- **Users Directory (`/api/users`):** p95 latency < 300ms.
- **Sko AI Chat (`/api/sko/chat`):** p95 latency < 2.5s (LLM completion), 429 rate limit errors < 2%.
- **Overall System:** Error rate < 1.0% under 150 concurrent VUs.


---

## 7. Pre-Launch Checklist

### Environment Variables (.env.production / Vercel Settings)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set to production instance URL.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set to production anon key.
- [ ] `GROQ_API_KEY` configured and verified active.
- [ ] `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` configured for distributed rate limiting.
- [ ] `SENTRY_DSN` configured for error tracking.

### Supabase Dashboard Configuration
- [ ] **Auth -> Email Auth:** Enable Email Confirmations OR set up custom SMTP (e.g. Resend / Postmark free tier) to avoid Supabase default 3 emails/hour limit.
- [ ] **Auth -> URL Configuration:** Set Site URL to `https://clansko.com` (or production domain) and add Redirect URLs: `https://clansko.com/**`, `https://*.vercel.app/**`.
- [ ] **Database -> Connection Pooling:** Ensure backend connects using Transaction Mode (`pooler.supabase.com:6543`).
- [ ] **Database -> RLS:** Verify all 8 tables have RLS enabled and policies applied (via Migration script).
- [ ] **Realtime:** Verify Realtime is enabled only on the `messages` table.

### Monitoring & Alerts
- [ ] Sentry / GlitchTip alert webhook configured to notify developer on unhandled exceptions.
- [ ] Vercel deployment alerts enabled.
- [ ] Groq dashboard checked for API quota alerts.

### Backups & Rollback
- [ ] Supabase automated daily backups enabled (included on free tier).
- [ ] Git commit tags created prior to each phase deployment for instant Vercel rollback.

---

## 8. Recommended Day-by-Day Implementation Schedule

Estimated total engineering effort: **~35 hours (approx. 5 working days for 1 full-stack developer)**.

```
Day 1: Security Blockers & Build Fixes (Phase 0)
├── Commit 1: Fix lib/supabase.js and refactor app/api/users/[id]
├── Commit 2: Run Supabase migration script (Tables, RLS, Indexes, Triggers)
├── Commit 3: Fix auth checks on /api/users and /api/connections
└── Commit 4: Fix Feed page N+1 fetch storm (batch team member join)

Day 2: Rate Limiting & Input Validation (Phase 1A)
├── Commit 5: Add lib/ratelimit.js (Upstash + memory fallback)
├── Commit 6: Apply rate limits to /api/auth/login, /api/auth/signup, /api/sko/chat
├── Commit 7: Add lib/validation.js with schema checks for POST/PATCH routes
└── Commit 8: Add Post deletion endpoint and Connection cancellation

Day 3: Pagination & LLM Hardening (Phase 1B)
├── Commit 9: Implement pagination on /api/posts and /api/users
├── Commit 10: Implement cursor pagination on /api/messages and /api/conversations
└── Commit 11: Harden /api/sko/chat against prompt injection and bound token history

Day 4: Architecture Hygiene & Performance (Phase 2)
├── Commit 12: Add unified lib/supabase-server.js and refactor route handlers
├── Commit 13: Optimize sequential DB queries in /api/projects/my and [id]
├── Commit 14: Fix Realtime channel cleanup in messages/[connectionId]/page.jsx
└── Commit 15: Add basic content reporting table and API endpoint

Day 5: Error Monitoring, Polish & Load Testing (Phase 3)
├── Commit 16: Integrate Sentry error tracking and security headers in next.config.mjs
├── Commit 17: Add atomic view count increment RPC
├── Commit 18: Run k6 load test against staging; verify thresholds
└── Commit 19: Final end-to-end verification and production release
```

---

## 9. Questions for Approval Before Implementation

Before beginning implementation, please clarify and approve the following decisions:

1. **Email Verification Requirement:**
   - Supabase default free SMTP has a strict limit of 3-4 confirmation emails per hour.
   - *Option A:* Require email verification on signup (requires configuring a free custom SMTP service like Resend or SendGrid).
   - *Option B:* Disable email confirmation for the initial 1,000 student beta (allows instant sign-in with email/password).
   - *Which do you prefer?*

2. **Rate Limiting Provider:**
   - *Option A:* Upstash Redis free tier (recommended — persistent across Vercel serverless functions).
   - *Option B:* In-memory rate limiting with LRU cache (zero external accounts, but resets on serverless cold starts).
   - *Do you want to use Upstash Redis or pure in-memory for now?*

3. **Feed Team Display UX:**
   - In Task 0.4, we remove the 20 sub-requests for `/api/projects/[id]` on the feed. Instead, `/api/posts` will return `member_count` and the first 3 accepted member avatars directly.
   - *Does this match your intended UX for the Feed idea cards?*

4. **Approval to Proceed:**
   - Please confirm if you approve the phased roadmap above so we can switch to Act mode and begin Phase 0.



-- ClanSko production hardening: constraints, indexes, RLS, reports and RPCs.
-- Apply after 20260929000000_create_profile_on_signup.sql.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS looking_for TEXT[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS looking_for TEXT[] DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Preserve access to legacy messages created before receiver_id was introduced.
UPDATE public.messages m
SET receiver_id = CASE
  WHEN c.sender_id = m.sender_id THEN c.receiver_id
  WHEN c.receiver_id = m.sender_id THEN c.sender_id
  ELSE NULL
END
FROM public.connections c
WHERE c.id = m.connection_id AND m.receiver_id IS NULL;

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'user', 'comment', 'message')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DO $$ BEGIN ALTER TABLE public.reactions ADD CONSTRAINT unique_user_post_reaction UNIQUE (post_id, user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.connections ADD CONSTRAINT unique_connection_pair UNIQUE (sender_id, receiver_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.connections ADD CONSTRAINT different_users CHECK (sender_id <> receiver_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.project_members ADD CONSTRAINT unique_project_member UNIQUE (project_id, user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.goals ADD CONSTRAINT unique_user_week_goal UNIQUE (user_id, week_key); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_users_onboarding_created ON public.users(onboarding_done, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_id ON public.posts(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created_id ON public.posts(user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_posts_stage_created ON public.posts(stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created_id ON public.comments(post_id, created_at ASC, id ASC);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_sender_status ON public.connections(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_receiver_status ON public.connections(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_connection_created_id ON public.messages(connection_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread_receiver ON public.messages(connection_id, receiver_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_goals_user_week ON public.goals(user_id, week_key);
CREATE INDEX IF NOT EXISTS idx_project_members_project_status ON public.project_members(project_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON public.reports(status, created_at DESC);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can view profiles" ON public.users;
CREATE POLICY "authenticated users can view profiles" ON public.users FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "users update own profile" ON public.users;
CREATE POLICY "users update own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "authenticated users can view posts" ON public.posts;
CREATE POLICY "authenticated users can view posts" ON public.posts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "users manage own posts" ON public.posts;
CREATE POLICY "users manage own posts" ON public.posts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated users can view comments" ON public.comments;
CREATE POLICY "authenticated users can view comments" ON public.comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "users manage own comments" ON public.comments;
CREATE POLICY "users manage own comments" ON public.comments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated users can view reactions" ON public.reactions;
CREATE POLICY "authenticated users can view reactions" ON public.reactions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "users manage own reactions" ON public.reactions;
CREATE POLICY "users manage own reactions" ON public.reactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


DROP POLICY IF EXISTS "participants can view connections" ON public.connections;
CREATE POLICY "participants can view connections" ON public.connections FOR SELECT TO authenticated USING (auth.uid() IN (sender_id, receiver_id));
DROP POLICY IF EXISTS "senders create connections" ON public.connections;
CREATE POLICY "senders create connections" ON public.connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "receivers update connections" ON public.connections;
CREATE POLICY "receivers update connections" ON public.connections FOR UPDATE TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);
DROP POLICY IF EXISTS "participants delete connections" ON public.connections;
CREATE POLICY "participants delete connections" ON public.connections FOR DELETE TO authenticated USING (auth.uid() IN (sender_id, receiver_id));

DROP POLICY IF EXISTS "participants can view messages" ON public.messages;
CREATE POLICY "participants can view messages" ON public.messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.connections c WHERE c.id = messages.connection_id AND c.status = 'accepted' AND auth.uid() IN (c.sender_id, c.receiver_id)));
DROP POLICY IF EXISTS "participants send messages" ON public.messages;
CREATE POLICY "participants send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.connections c WHERE c.id = messages.connection_id AND c.status = 'accepted' AND auth.uid() IN (c.sender_id, c.receiver_id)));
DROP POLICY IF EXISTS "recipients mark messages read" ON public.messages;
CREATE POLICY "recipients mark messages read" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "users manage own goals" ON public.goals;
CREATE POLICY "users manage own goals" ON public.goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "authenticated users view project members" ON public.project_members;
CREATE POLICY "authenticated users view project members" ON public.project_members FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "owners invite project members" ON public.project_members;
CREATE POLICY "owners invite project members" ON public.project_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = invited_by AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = project_members.project_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "members and owners update project members" ON public.project_members;
CREATE POLICY "members and owners update project members" ON public.project_members FOR UPDATE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = project_members.project_id AND p.user_id = auth.uid())) WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = project_members.project_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "members and owners delete project members" ON public.project_members;
CREATE POLICY "members and owners delete project members" ON public.project_members FOR DELETE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = project_members.project_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "users submit reports" ON public.reports;
CREATE POLICY "users submit reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE OR REPLACE FUNCTION public.increment_post_view(post_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.posts SET view_count = view_count + 1 WHERE id = post_id;
$$;

CREATE OR REPLACE FUNCTION public.get_conversations_page(page_limit INTEGER, page_cursor_timestamp TIMESTAMPTZ DEFAULT NULL, page_cursor_connection_id UUID DEFAULT NULL)
RETURNS TABLE("connectionId" UUID, "otherUser" JSONB, "lastMessage" JSONB, "unreadCount" BIGINT, timestamp TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH conversation_rows AS (
    SELECT c.id,
      CASE WHEN c.sender_id = auth.uid()
        THEN jsonb_build_object('id', receiver.id, 'name', receiver.name, 'profile_photo', receiver.profile_photo)
        ELSE jsonb_build_object('id', sender.id, 'name', sender.name, 'profile_photo', sender.profile_photo)
      END AS other_user,
      lm.message AS last_message, COALESCE(uc.unread_count, 0) AS unread_count, COALESCE(lm.created_at, c.created_at) AS activity_at
    FROM public.connections c
    JOIN public.users sender ON sender.id = c.sender_id
    JOIN public.users receiver ON receiver.id = c.receiver_id
    LEFT JOIN LATERAL (SELECT m.created_at, jsonb_build_object('id', m.id, 'content', m.content, 'is_read', m.is_read, 'created_at', m.created_at, 'sender_id', m.sender_id) AS message FROM public.messages m WHERE m.connection_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) lm ON true
    LEFT JOIN LATERAL (SELECT count(*) AS unread_count FROM public.messages m WHERE m.connection_id = c.id AND m.receiver_id = auth.uid() AND NOT m.is_read) uc ON true
    WHERE c.status = 'accepted' AND auth.uid() IN (c.sender_id, c.receiver_id)
  )
  SELECT id, other_user, last_message, unread_count, activity_at
  FROM conversation_rows
  WHERE page_cursor_timestamp IS NULL OR (activity_at, id) < (page_cursor_timestamp, page_cursor_connection_id)
  ORDER BY activity_at DESC, id DESC LIMIT page_limit;
$$;

REVOKE ALL ON FUNCTION public.increment_post_view(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_post_view(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.get_conversations_page(INTEGER, TIMESTAMPTZ, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_conversations_page(INTEGER, TIMESTAMPTZ, UUID) TO authenticated;

-- ClanSko: report deduplication + admin read access on reports table.
-- Apply in Supabase SQL editor after 20260929000001_harden_1000_users.sql.

-- 1. Prevent the same user reporting the same target more than once.
--    Uses DO/EXCEPTION pattern to be idempotent on repeated runs.
DO $$
BEGIN
  ALTER TABLE public.reports
    ADD CONSTRAINT unique_report_per_user UNIQUE (reporter_id, target_id, target_type);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- 2. Allow service-role (admin) to read all reports for moderation.
--    Regular authenticated users cannot SELECT from this table — reporters
--    only ever INSERT (covered by the policy in the previous migration).
DROP POLICY IF EXISTS "service role can read reports" ON public.reports;
CREATE POLICY "service role can read reports"
  ON public.reports FOR SELECT
  TO service_role
  USING (true);

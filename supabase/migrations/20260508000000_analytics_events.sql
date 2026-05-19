-- Analytics events table
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name  TEXT        NOT NULL,
  properties  JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON public.analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name
  ON public.analytics_events (event_name);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id
  ON public.analytics_events (user_id)
  WHERE user_id IS NOT NULL;

-- RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own events
CREATE POLICY "authenticated_insert_own_events"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Anonymous inserts allowed only when user_id is null (pre-auth events)
CREATE POLICY "anonymous_insert_events"
  ON public.analytics_events
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- No SELECT policy for regular roles — admin reads use service role key

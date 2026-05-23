-- =============================================================================
-- MIGRATION: Workspaces, Organizations, RBAC, Monetization
-- Phase 0 — Schema + RLS + Seed data
--
-- Execution order:
--   1. Create tables (dependency order, no RLS policies yet)
--   2. Enable RLS on all tables
--   3. Create helper functions (tables now exist)
--   4. Create RLS policies
--   5. Create trigger + function for new user signup
--   6. Seed plan catalog
--   7. Storage bucket for brand kits
--   8. Backfill existing users (profiles, plan_config, free subscription)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Tables (dependency order)
-- ─────────────────────────────────────────────────────────────────────────────

-- Plan catalog (managed via migration — never via UI)
CREATE TABLE IF NOT EXISTS public.plans (
  id                   TEXT PRIMARY KEY,
  type                 TEXT NOT NULL CHECK (type IN ('individual', 'organization')),
  name                 TEXT NOT NULL,
  price_cents          INTEGER,           -- base price in BRL cents (NULL = per-seat only)
  price_per_seat_cents INTEGER,           -- per-seat price (NULL = individual plans)
  trial_days           INTEGER NOT NULL DEFAULT 0,
  features             JSONB NOT NULL DEFAULT '{}'
  -- features shape: {
  --   exports_monthly: number (-1 = unlimited),
  --   ai_requests_monthly: number (-1 = unlimited),
  --   platforms_limit: number (-1 = all),
  --   batch_export: boolean,
  --   video: boolean,
  --   carousel: boolean,
  --   ai_processing: boolean,
  --   brand_kit: boolean,
  --   approval_flow: boolean,
  --   analytics: boolean,
  --   max_team_members: number (-1 = unlimited)
  -- }
);

-- Public profile for each user (auto-created via trigger on signup)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stores which platforms a Free-tier user has activated (max 2)
CREATE TABLE IF NOT EXISTS public.user_plan_config (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_platforms  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organizations (top-level multi-tenant entity)
CREATE TABLE IF NOT EXISTS public.organizations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  slug               TEXT UNIQUE NOT NULL,
  owner_id           UUID NOT NULL REFERENCES auth.users(id),
  stripe_customer_id TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization membership (many-to-many users <-> organizations)
-- joined_at IS NULL means the invitation is still pending
CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('owner','admin','media_buyer','designer','viewer')),
  invited_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at       TIMESTAMPTZ,
  PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user_id
  ON public.organization_members (user_id);

CREATE INDEX IF NOT EXISTS idx_org_members_org_role
  ON public.organization_members (organization_id, role);

-- Email-based invitations with a time-limited token
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('admin','media_buyer','designer','viewer')),
  invited_by      UUID NOT NULL REFERENCES auth.users(id),
  token           TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.organization_invitations (token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.organization_invitations (email);
CREATE INDEX IF NOT EXISTS idx_invitations_org   ON public.organization_invitations (organization_id);

-- Brand kits: centralized visual identity per organization
CREATE TABLE IF NOT EXISTS public.brand_kits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT 'Brand Kit',
  logo_url        TEXT,
  colors          JSONB NOT NULL DEFAULT '[]',  -- [{name: string, hex: string}]
  fonts           JSONB NOT NULL DEFAULT '[]',  -- [{name: string, url: string, weight: string}]
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_kits_org ON public.brand_kits (organization_id);

-- Stripe subscriptions: one per user (individual plan) and one per org (team plan)
-- entity_type + entity_id is polymorphic (no FK — intentional for user/org union)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type            TEXT NOT NULL CHECK (entity_type IN ('user', 'organization')),
  entity_id              UUID NOT NULL,
  plan_id                TEXT NOT NULL REFERENCES public.plans(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id     TEXT,
  status                 TEXT NOT NULL CHECK (status IN ('trialing','active','past_due','canceled','incomplete')),
  trial_ends_at          TIMESTAMPTZ,
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  seat_count             INTEGER NOT NULL DEFAULT 1,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active/trialing subscription per entity at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_active_entity
  ON public.subscriptions (entity_type, entity_id)
  WHERE status IN ('active', 'trialing');

CREATE INDEX IF NOT EXISTS idx_subscriptions_entity
  ON public.subscriptions (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id
  ON public.subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Usage counters: atomic counters per (entity, user, action, billing period)
-- Incremented via increment_usage() — never via direct INSERT from client
CREATE TABLE IF NOT EXISTS public.usage_counters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'organization')),
  entity_id   UUID NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL CHECK (action IN ('export', 'ai_request')),
  period      TEXT NOT NULL,  -- 'YYYY-MM' (billing period month)
  count       INTEGER NOT NULL DEFAULT 0,
  UNIQUE (entity_type, entity_id, user_id, action, period)
);

CREATE INDEX IF NOT EXISTS idx_usage_entity_period
  ON public.usage_counters (entity_type, entity_id, action, period);

-- Extend projects table for multi-tenant support
-- organization_id = NULL means personal project (backward compatible)
-- status tracks the approval workflow state
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand_kit_id    UUID REFERENCES public.brand_kits(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status          TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_approval','approved','rejected'));

CREATE INDEX IF NOT EXISTS idx_projects_organization_id
  ON public.projects (organization_id)
  WHERE organization_id IS NOT NULL;

-- Approval requests: link a project to a review cycle within an organization
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requester_id    UUID NOT NULL REFERENCES auth.users(id),
  reviewer_id     UUID REFERENCES auth.users(id),
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','cancelled')),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approvals_org_status
  ON public.approval_requests (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_approvals_requester
  ON public.approval_requests (requester_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Enable RLS on all new tables
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.plans                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plan_config        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_kits             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counters         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests      ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: Helper functions
-- Tables must exist before creating LANGUAGE sql functions.
-- SECURITY DEFINER: these run as the migration owner, bypassing RLS so they
-- can safely check membership without causing infinite RLS recursion.
-- ─────────────────────────────────────────────────────────────────────────────

-- Returns true if the current user is an accepted member of the given org
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND joined_at IS NOT NULL
  );
$$;

-- Returns true if the current user holds one of the required roles in the org
CREATE OR REPLACE FUNCTION public.has_org_role(org_id UUID, required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF org_id IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role = ANY(required_roles)
      AND joined_at IS NOT NULL
  );
END;
$$;

-- Atomically increments a usage counter (upsert).
-- Called from server-side code (Route Handlers / Server Actions).
-- SECURITY DEFINER so it can write to usage_counters bypassing RLS.
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_entity_type TEXT,
  p_entity_id   UUID,
  p_user_id     UUID,
  p_action      TEXT,
  p_period      TEXT   -- 'YYYY-MM'
)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.usage_counters
    (entity_type, entity_id, user_id, action, period, count)
  VALUES
    (p_entity_type, p_entity_id, p_user_id, p_action, p_period, 1)
  ON CONFLICT (entity_type, entity_id, user_id, action, period)
  DO UPDATE SET count = public.usage_counters.count + 1;
$$;

-- Returns current usage count for a given entity/user/action/period.
-- Used by quota enforcement logic in Route Handlers.
CREATE OR REPLACE FUNCTION public.get_usage(
  p_entity_type TEXT,
  p_entity_id   UUID,
  p_user_id     UUID,
  p_action      TEXT,
  p_period      TEXT
)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT count
      FROM public.usage_counters
      WHERE entity_type = p_entity_type
        AND entity_id   = p_entity_id
        AND user_id     = p_user_id
        AND action      = p_action
        AND period      = p_period
    ),
    0
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

-- plans: read-only for all authenticated users (pricing page, plan checks)
CREATE POLICY "plans_select_all" ON public.plans
  FOR SELECT TO authenticated USING (true);

-- user_profiles: any authenticated user can read (team members need to see names)
CREATE POLICY "profiles_select_authenticated" ON public.user_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_own" ON public.user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- user_plan_config: private to the owner
CREATE POLICY "plan_config_select_own" ON public.user_plan_config
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "plan_config_update_own" ON public.user_plan_config
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- organizations
CREATE POLICY "orgs_select_members" ON public.organizations
  FOR SELECT TO authenticated USING (is_org_member(id));

CREATE POLICY "orgs_insert_authenticated" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "orgs_update_admin" ON public.organizations
  FOR UPDATE TO authenticated
  USING (has_org_role(id, ARRAY['owner','admin']))
  WITH CHECK (has_org_role(id, ARRAY['owner','admin']));

CREATE POLICY "orgs_delete_owner" ON public.organizations
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- organization_members
CREATE POLICY "members_select_same_org" ON public.organization_members
  FOR SELECT TO authenticated USING (is_org_member(organization_id));

CREATE POLICY "members_insert_admin_or_self" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    has_org_role(organization_id, ARRAY['owner','admin'])
    OR user_id = auth.uid()  -- self-insert when accepting an invitation
  );

CREATE POLICY "members_update_admin_or_self" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (
    has_org_role(organization_id, ARRAY['owner','admin'])
    OR user_id = auth.uid()
  )
  WITH CHECK (
    has_org_role(organization_id, ARRAY['owner','admin'])
    OR user_id = auth.uid()
  );

CREATE POLICY "members_delete_admin_or_self" ON public.organization_members
  FOR DELETE TO authenticated
  USING (
    has_org_role(organization_id, ARRAY['owner','admin'])
    OR user_id = auth.uid()  -- member can leave the org
  );

-- organization_invitations
-- Token lookup (accepting invite) is handled server-side via service role
CREATE POLICY "invitations_select_admin" ON public.organization_invitations
  FOR SELECT TO authenticated
  USING (has_org_role(organization_id, ARRAY['owner','admin']));

CREATE POLICY "invitations_insert_admin" ON public.organization_invitations
  FOR INSERT TO authenticated
  WITH CHECK (has_org_role(organization_id, ARRAY['owner','admin']));

CREATE POLICY "invitations_update_admin" ON public.organization_invitations
  FOR UPDATE TO authenticated
  USING (has_org_role(organization_id, ARRAY['owner','admin']));

CREATE POLICY "invitations_delete_admin" ON public.organization_invitations
  FOR DELETE TO authenticated
  USING (has_org_role(organization_id, ARRAY['owner','admin']));

-- brand_kits
CREATE POLICY "brand_kits_select_members" ON public.brand_kits
  FOR SELECT TO authenticated USING (is_org_member(organization_id));

CREATE POLICY "brand_kits_insert_privileged" ON public.brand_kits
  FOR INSERT TO authenticated
  WITH CHECK (has_org_role(organization_id, ARRAY['owner','admin','designer']));

CREATE POLICY "brand_kits_update_privileged" ON public.brand_kits
  FOR UPDATE TO authenticated
  USING (has_org_role(organization_id, ARRAY['owner','admin','designer']))
  WITH CHECK (has_org_role(organization_id, ARRAY['owner','admin','designer']));

CREATE POLICY "brand_kits_delete_admin" ON public.brand_kits
  FOR DELETE TO authenticated
  USING (has_org_role(organization_id, ARRAY['owner','admin']));

-- subscriptions: read-only for the owning entity; writes are service role only (Stripe webhooks)
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    (entity_type = 'user' AND entity_id = auth.uid())
    OR (entity_type = 'organization' AND is_org_member(entity_id))
  );

-- usage_counters: readable by owner or org admin; writable only via increment_usage()
CREATE POLICY "usage_select_own_or_admin" ON public.usage_counters
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (entity_type = 'organization' AND has_org_role(entity_id, ARRAY['owner','admin']))
  );

-- projects: replace the old monolithic "owner_all" policy with per-operation policies
DROP POLICY IF EXISTS "owner_all" ON public.projects;

CREATE POLICY "projects_select" ON public.projects
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (organization_id IS NOT NULL AND is_org_member(organization_id))
  );

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      organization_id IS NULL
      OR has_org_role(organization_id, ARRAY['owner','admin','media_buyer','designer'])
    )
  );

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR has_org_role(organization_id, ARRAY['owner','admin'])
  )
  WITH CHECK (
    auth.uid() = user_id
    OR has_org_role(organization_id, ARRAY['owner','admin'])
  );

CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR has_org_role(organization_id, ARRAY['owner','admin'])
  );

-- approval_requests
CREATE POLICY "approvals_select_members" ON public.approval_requests
  FOR SELECT TO authenticated USING (is_org_member(organization_id));

CREATE POLICY "approvals_insert_contributors" ON public.approval_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = requester_id
    AND has_org_role(organization_id, ARRAY['owner','admin','media_buyer','designer'])
  );

-- Admin/owner set status; requester can cancel their own request
CREATE POLICY "approvals_update_reviewer_or_requester" ON public.approval_requests
  FOR UPDATE TO authenticated
  USING (
    has_org_role(organization_id, ARRAY['owner','admin'])
    OR auth.uid() = requester_id
  )
  WITH CHECK (
    has_org_role(organization_id, ARRAY['owner','admin'])
    OR auth.uid() = requester_id
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: Signup trigger — auto-create profile and plan config
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_plan_config (user_id, selected_platforms, updated_at)
  VALUES (NEW.id, ARRAY[]::TEXT[], NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6: Plan catalog seed data
-- Prices in BRL cents. Trial: 7 days for Pro and Team.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.plans (id, type, name, price_cents, price_per_seat_cents, trial_days, features)
VALUES
  (
    'free',
    'individual',
    'Free',
    0,
    NULL,
    0,
    '{
      "exports_monthly": 15,
      "ai_requests_monthly": 3,
      "platforms_limit": 2,
      "batch_export": false,
      "video": false,
      "carousel": false,
      "ai_processing": false,
      "brand_kit": false,
      "approval_flow": false,
      "analytics": false,
      "max_team_members": -1
    }'::jsonb
  ),
  (
    'pro',
    'individual',
    'Pro',
    2990,
    NULL,
    7,
    '{
      "exports_monthly": -1,
      "ai_requests_monthly": 100,
      "platforms_limit": -1,
      "batch_export": true,
      "video": true,
      "carousel": true,
      "ai_processing": true,
      "brand_kit": false,
      "approval_flow": false,
      "analytics": false,
      "max_team_members": -1
    }'::jsonb
  ),
  (
    'team',
    'organization',
    'Team',
    NULL,
    4990,
    7,
    '{
      "exports_monthly": -1,
      "ai_requests_monthly": 200,
      "platforms_limit": -1,
      "batch_export": true,
      "video": true,
      "carousel": true,
      "ai_processing": true,
      "brand_kit": true,
      "approval_flow": true,
      "analytics": true,
      "max_team_members": -1
    }'::jsonb
  ),
  (
    'enterprise',
    'organization',
    'Enterprise',
    NULL,
    0,
    0,
    '{
      "exports_monthly": -1,
      "ai_requests_monthly": -1,
      "platforms_limit": -1,
      "batch_export": true,
      "video": true,
      "carousel": true,
      "ai_processing": true,
      "brand_kit": true,
      "approval_flow": true,
      "analytics": true,
      "max_team_members": -1
    }'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7: Storage bucket for brand kit assets
-- Path convention: brand-kits/{organization_id}/{filename}
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-kits', 'brand-kits', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "brand_kit_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'brand-kits'
    AND public.is_org_member((storage.foldername(name))[1]::UUID)
  );

CREATE POLICY "brand_kit_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'brand-kits'
    AND public.has_org_role(
      (storage.foldername(name))[1]::UUID,
      ARRAY['owner','admin','designer']
    )
  );

CREATE POLICY "brand_kit_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'brand-kits'
    AND public.has_org_role(
      (storage.foldername(name))[1]::UUID,
      ARRAY['owner','admin','designer']
    )
  );

CREATE POLICY "brand_kit_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'brand-kits'
    AND public.has_org_role(
      (storage.foldername(name))[1]::UUID,
      ARRAY['owner','admin']
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 8: Backfill existing users
-- Creates profile, plan_config, and free subscription for users who signed up
-- before this migration ran. Safe to re-run (ON CONFLICT DO NOTHING).
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.user_profiles (id, full_name, avatar_url, created_at, updated_at)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  raw_user_meta_data->>'avatar_url',
  created_at,
  NOW()
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_plan_config (user_id, selected_platforms, updated_at)
SELECT id, ARRAY[]::TEXT[], NOW()
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Assign free plan to all existing users who have no active subscription
INSERT INTO public.subscriptions
  (entity_type, entity_id, plan_id, status, created_at, updated_at)
SELECT
  'user',
  id,
  'free',
  'active',
  NOW(),
  NOW()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s
  WHERE s.entity_type = 'user'
    AND s.entity_id = auth.users.id
    AND s.status IN ('active', 'trialing')
);

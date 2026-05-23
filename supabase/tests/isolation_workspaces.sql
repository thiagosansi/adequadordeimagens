-- =============================================================================
-- ISOLATION TESTS: Workspaces & Multi-tenant RLS
--
-- Run with: supabase test db
-- Or paste directly into Supabase SQL Editor (Dashboard → SQL Editor).
--
-- These tests verify that RLS policies correctly isolate data between:
--   - users who are not org members
--   - members of different organizations
--   - members with insufficient roles
--
-- All operations run inside a transaction that is ROLLED BACK at the end,
-- so no test data is persisted.
-- =============================================================================

BEGIN;
SELECT plan(28);

-- ─────────────────────────────────────────────────────────────────────────────
-- Setup: fixed UUIDs so tests are deterministic
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  -- Users
  user_a   CONSTANT UUID := '00000000-0000-0000-0001-000000000001'; -- owner of org_a
  user_b   CONSTANT UUID := '00000000-0000-0000-0001-000000000002'; -- owner of org_b
  user_c   CONSTANT UUID := '00000000-0000-0000-0001-000000000003'; -- media_buyer in org_a
  user_d   CONSTANT UUID := '00000000-0000-0000-0001-000000000004'; -- no org (isolated user)
  user_e   CONSTANT UUID := '00000000-0000-0000-0001-000000000005'; -- viewer in org_a

  -- Orgs
  org_a    CONSTANT UUID := '00000000-0000-0000-0002-000000000001';
  org_b    CONSTANT UUID := '00000000-0000-0000-0002-000000000002';

  -- Brand kits
  kit_a    CONSTANT UUID := '00000000-0000-0000-0003-000000000001';
  kit_b    CONSTANT UUID := '00000000-0000-0000-0003-000000000002';

  -- Projects
  proj_personal   CONSTANT UUID := '00000000-0000-0000-0004-000000000001'; -- user_d personal
  proj_org_a      CONSTANT UUID := '00000000-0000-0000-0004-000000000002'; -- belongs to org_a
  proj_org_b      CONSTANT UUID := '00000000-0000-0000-0004-000000000003'; -- belongs to org_b
BEGIN
  -- Auth users (superuser — bypasses RLS)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES
    (user_a, 'user_a@test.local', 'x', NOW(), NOW(), NOW(), '{}', '{}', 'authenticated', 'authenticated'),
    (user_b, 'user_b@test.local', 'x', NOW(), NOW(), NOW(), '{}', '{}', 'authenticated', 'authenticated'),
    (user_c, 'user_c@test.local', 'x', NOW(), NOW(), NOW(), '{}', '{}', 'authenticated', 'authenticated'),
    (user_d, 'user_d@test.local', 'x', NOW(), NOW(), NOW(), '{}', '{}', 'authenticated', 'authenticated'),
    (user_e, 'user_e@test.local', 'x', NOW(), NOW(), NOW(), '{}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Organizations (superuser)
  INSERT INTO public.organizations (id, name, slug, owner_id)
  VALUES
    (org_a, 'Org A', 'org-a-test', user_a),
    (org_b, 'Org B', 'org-b-test', user_b)
  ON CONFLICT DO NOTHING;

  -- Members (superuser — bypasses RLS)
  INSERT INTO public.organization_members (organization_id, user_id, role, joined_at)
  VALUES
    (org_a, user_a, 'owner',       NOW()),   -- user_a: owner of org_a
    (org_b, user_b, 'owner',       NOW()),   -- user_b: owner of org_b
    (org_a, user_c, 'media_buyer', NOW()),   -- user_c: media_buyer in org_a
    (org_a, user_e, 'viewer',      NOW())    -- user_e: viewer in org_a
    -- user_d has no org membership
  ON CONFLICT DO NOTHING;

  -- Brand kits (superuser)
  INSERT INTO public.brand_kits (id, organization_id, name)
  VALUES
    (kit_a, org_a, 'Brand Kit A'),
    (kit_b, org_b, 'Brand Kit B')
  ON CONFLICT DO NOTHING;

  -- Projects (superuser)
  INSERT INTO public.projects (id, user_id, name, format_id, format_label, width, height, storage_path, organization_id)
  VALUES
    (proj_personal, user_d, 'Personal', 'meta-feed-sq', 'Meta Feed', 1080, 1080, 'user_d/p.jpg', NULL),
    (proj_org_a,    user_a, 'Org A Proj', 'meta-feed-sq', 'Meta Feed', 1080, 1080, 'org_a/p.jpg', org_a),
    (proj_org_b,    user_b, 'Org B Proj', 'meta-feed-sq', 'Meta Feed', 1080, 1080, 'org_b/p.jpg', org_b)
  ON CONFLICT DO NOTHING;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: switch active auth context to simulate a logged-in user
-- ─────────────────────────────────────────────────────────────────────────────

-- Runs tests as user_a (owner of org_a)
SET LOCAL role TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP 1: Organizations visibility
-- ─────────────────────────────────────────────────────────────────────────────

-- T1: user_a sees org_a (is owner)
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000001","role":"authenticated"}', true);

SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.organizations WHERE id = ''00000000-0000-0000-0002-000000000001''',
  ARRAY[1],
  'T01 — user_a (owner) can see org_a'
);

-- T2: user_a cannot see org_b (not a member)
SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.organizations WHERE id = ''00000000-0000-0000-0002-000000000002''',
  ARRAY[0],
  'T02 — user_a cannot see org_b (not a member)'
);

-- T3: user_d (no org) cannot see org_a
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000004","role":"authenticated"}', true);

SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.organizations',
  ARRAY[0],
  'T03 — user_d (no org) cannot see any organization'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP 2: Organization members visibility
-- ─────────────────────────────────────────────────────────────────────────────

-- T4: user_a sees members of org_a
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000001","role":"authenticated"}', true);

SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.organization_members WHERE organization_id = ''00000000-0000-0000-0002-000000000001''',
  ARRAY[3],  -- user_a, user_c, user_e
  'T04 — user_a sees all 3 members of org_a'
);

-- T5: user_b cannot see members of org_a
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000002","role":"authenticated"}', true);

SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.organization_members WHERE organization_id = ''00000000-0000-0000-0002-000000000001''',
  ARRAY[0],
  'T05 — user_b (org_b owner) cannot see org_a members'
);

-- T6: user_c (media_buyer in org_a) sees org_a members
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000003","role":"authenticated"}', true);

SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.organization_members WHERE organization_id = ''00000000-0000-0000-0002-000000000001''',
  ARRAY[3],
  'T06 — user_c (media_buyer) can see org_a members'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP 3: Brand kits isolation
-- ─────────────────────────────────────────────────────────────────────────────

-- T7: user_a sees kit_a (org_a member)
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000001","role":"authenticated"}', true);

SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.brand_kits WHERE id = ''00000000-0000-0000-0003-000000000001''',
  ARRAY[1],
  'T07 — user_a (org_a owner) can see brand kit of org_a'
);

-- T8: user_a cannot see kit_b (different org)
SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.brand_kits WHERE id = ''00000000-0000-0000-0003-000000000002''',
  ARRAY[0],
  'T08 — user_a cannot see brand kit of org_b'
);

-- T9: user_e (viewer in org_a) can see kit_a but cannot update it
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000005","role":"authenticated"}', true);

SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.brand_kits WHERE id = ''00000000-0000-0000-0003-000000000001''',
  ARRAY[1],
  'T09 — user_e (viewer) can read brand kit of org_a'
);

SELECT throws_ok(
  $$UPDATE public.brand_kits
    SET name = 'hacked'
    WHERE id = '00000000-0000-0000-0003-000000000001'$$,
  'T10 — user_e (viewer) cannot update brand kit'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP 4: Projects isolation
-- ─────────────────────────────────────────────────────────────────────────────

-- T11: user_a sees org_a project
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000001","role":"authenticated"}', true);

SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.projects WHERE id = ''00000000-0000-0000-0004-000000000002''',
  ARRAY[1],
  'T11 — user_a (org_a owner) can see org_a project'
);

-- T12: user_a cannot see org_b project
SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.projects WHERE id = ''00000000-0000-0000-0004-000000000003''',
  ARRAY[0],
  'T12 — user_a cannot see org_b project'
);

-- T13: user_d cannot see org_a project (no org)
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000004","role":"authenticated"}', true);

SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.projects WHERE id = ''00000000-0000-0000-0004-000000000002''',
  ARRAY[0],
  'T13 — user_d (no org) cannot see org_a project'
);

-- T14: user_d can see their own personal project
SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.projects WHERE id = ''00000000-0000-0000-0004-000000000001''',
  ARRAY[1],
  'T14 — user_d can see their own personal project'
);

-- T15: user_c (media_buyer) can see org_a project
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000003","role":"authenticated"}', true);

SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.projects WHERE id = ''00000000-0000-0000-0004-000000000002''',
  ARRAY[1],
  'T15 — user_c (media_buyer in org_a) can see org_a project'
);

-- T16: viewer cannot delete org_a project
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000005","role":"authenticated"}', true);

SELECT results_eq(
  $$DELETE FROM public.projects WHERE id = '00000000-0000-0000-0004-000000000002' RETURNING id$$,
  'SELECT NULL::UUID WHERE false',
  'T16 — user_e (viewer) cannot delete org_a project'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP 5: Subscriptions isolation
-- ─────────────────────────────────────────────────────────────────────────────

-- Setup: create subscriptions for user_a and org_b (superuser)
DO $$
BEGIN
  INSERT INTO public.subscriptions (entity_type, entity_id, plan_id, status)
  VALUES
    ('user',         '00000000-0000-0000-0001-000000000001', 'pro',  'active'),
    ('organization', '00000000-0000-0000-0002-000000000002', 'team', 'active')
  ON CONFLICT DO NOTHING;
END $$;

-- T17: user_a can see their own subscription
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000001","role":"authenticated"}', true);

SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.subscriptions WHERE entity_type = ''user'' AND entity_id = ''00000000-0000-0000-0001-000000000001''',
  ARRAY[1],
  'T17 — user_a can read their own subscription'
);

-- T18: user_a cannot see org_b subscription (not a member)
SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.subscriptions WHERE entity_type = ''organization'' AND entity_id = ''00000000-0000-0000-0002-000000000002''',
  ARRAY[0],
  'T18 — user_a cannot read org_b subscription'
);

-- T19: user_c cannot see user_a personal subscription
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000003","role":"authenticated"}', true);

SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.subscriptions WHERE entity_type = ''user'' AND entity_id = ''00000000-0000-0000-0001-000000000001''',
  ARRAY[0],
  'T19 — user_c cannot read user_a personal subscription'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP 6: RBAC — role-based write restrictions
-- ─────────────────────────────────────────────────────────────────────────────

-- T20: media_buyer cannot insert brand_kit
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000003","role":"authenticated"}', true);

SELECT throws_ok(
  $$INSERT INTO public.brand_kits (organization_id, name)
    VALUES ('00000000-0000-0000-0002-000000000001', 'Unauthorized Kit')$$,
  'T20 — user_c (media_buyer) cannot insert brand_kit'
);

-- T21: viewer cannot insert approval_request
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000005","role":"authenticated"}', true);

SELECT throws_ok(
  $$INSERT INTO public.approval_requests (project_id, organization_id, requester_id)
    VALUES (
      '00000000-0000-0000-0004-000000000002',
      '00000000-0000-0000-0002-000000000001',
      '00000000-0000-0000-0001-000000000005'
    )$$,
  'T21 — user_e (viewer) cannot create approval request'
);

-- T22: user_c (media_buyer) CAN insert approval_request
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000003","role":"authenticated"}', true);

SELECT lives_ok(
  $$INSERT INTO public.approval_requests (project_id, organization_id, requester_id)
    VALUES (
      '00000000-0000-0000-0004-000000000002',
      '00000000-0000-0000-0002-000000000001',
      '00000000-0000-0000-0001-000000000003'
    )$$,
  'T22 — user_c (media_buyer) can create approval request'
);

-- T23: media_buyer cannot approve (update status) approval_request
SELECT throws_ok(
  $$UPDATE public.approval_requests
    SET status = 'approved', reviewer_id = '00000000-0000-0000-0001-000000000003'
    WHERE organization_id = '00000000-0000-0000-0002-000000000001'
      AND requester_id != '00000000-0000-0000-0001-000000000003'$$,
  'T23 — user_c (media_buyer) cannot approve others'' requests'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP 7: Pending invitation isolation
-- ─────────────────────────────────────────────────────────────────────────────

-- user_f is invited to org_a but hasn't accepted yet (joined_at IS NULL)
DO $$
DECLARE
  user_f CONSTANT UUID := '00000000-0000-0000-0001-000000000006';
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (user_f, 'user_f@test.local', 'x', NOW(), NOW(), NOW(), '{}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT DO NOTHING;

  -- Pending member (joined_at = NULL)
  INSERT INTO public.organization_members (organization_id, user_id, role, invited_at, joined_at)
  VALUES ('00000000-0000-0000-0002-000000000001', user_f, 'designer', NOW(), NULL)
  ON CONFLICT DO NOTHING;
END $$;

-- T24: user_f (pending invite) cannot see org_a data
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000006","role":"authenticated"}', true);

SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.organizations WHERE id = ''00000000-0000-0000-0002-000000000001''',
  ARRAY[0],
  'T24 — user_f (pending invite, joined_at NULL) cannot see org_a'
);

-- T25: user_f cannot see brand kits before accepting invite
SELECT results_eq(
  'SELECT COUNT(*)::INT FROM public.brand_kits WHERE organization_id = ''00000000-0000-0000-0002-000000000001''',
  ARRAY[0],
  'T25 — user_f (pending) cannot see org_a brand kits'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP 8: Cross-org write attempts
-- ─────────────────────────────────────────────────────────────────────────────

-- T26: user_b (org_b owner) cannot update org_a
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000002","role":"authenticated"}', true);

SELECT results_eq(
  $$UPDATE public.organizations SET name = 'HACKED' WHERE id = '00000000-0000-0000-0002-000000000001' RETURNING id$$,
  'SELECT NULL::UUID WHERE false',
  'T26 — user_b cannot update org_a'
);

-- T27: user_c cannot insert a project for org_b (not a member)
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000003","role":"authenticated"}', true);

SELECT throws_ok(
  $$INSERT INTO public.projects (user_id, name, format_id, format_label, width, height, storage_path, organization_id)
    VALUES (
      '00000000-0000-0000-0001-000000000003',
      'Injected',
      'meta-feed-sq', 'Meta Feed', 1080, 1080, 'x/y.jpg',
      '00000000-0000-0000-0002-000000000002'
    )$$,
  'T27 — user_c cannot create a project under org_b'
);

-- T28: user_d cannot invite anyone to org_a (no membership)
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0001-000000000004","role":"authenticated"}', true);

SELECT throws_ok(
  $$INSERT INTO public.organization_invitations (organization_id, email, role, invited_by)
    VALUES (
      '00000000-0000-0000-0002-000000000001',
      'attacker@evil.com',
      'admin',
      '00000000-0000-0000-0001-000000000004'
    )$$,
  'T28 — user_d (no org) cannot invite members to org_a'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Finish
-- ─────────────────────────────────────────────────────────────────────────────

SELECT * FROM finish();
ROLLBACK;

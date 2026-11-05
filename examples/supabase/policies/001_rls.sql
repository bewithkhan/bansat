-- supabase/policies/001_rls.sql — run after the Prisma migration that creates the tables.

-- 1) Turn RLS on for EVERY table in the exposed schema. RLS on + no policy = no access (safe default).
alter table public.profiles               enable row level security;
alter table public.organizations          enable row level security;
alter table public.memberships            enable row level security;
alter table public.tasks                  enable row level security;
alter table public.comments               enable row level security;
alter table public.consent_records        enable row level security;  -- server-only: no policies
alter table public.marketing_suppressions enable row level security;  -- server-only: no policies
alter table public.data_subject_requests  enable row level security;  -- server-only: no policies
alter table public.audit_logs             enable row level security;  -- server-only: no policies
alter table public.ai_generations         enable row level security;  -- server-only: no policies

-- 2) Helper functions live in a schema the API does not expose.
--    SECURITY DEFINER avoids recursive RLS on memberships; search_path is pinned for safety.
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_role(org uuid, allowed text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org
      and m.user_id = (select auth.uid())
      and m.role::text = any (allowed)
  );
$$;

revoke execute on function private.is_member(uuid) from public;
revoke execute on function private.has_role(uuid, text[]) from public;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.has_role(uuid, text[]) to authenticated;

-- 3) Policies. Always name the role (to authenticated) and wrap auth.uid() in a sub-select (faster).
create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "organizations: members read"
  on public.organizations for select to authenticated
  using (private.is_member(id));

create policy "memberships: members read their org"
  on public.memberships for select to authenticated
  using (private.is_member(organization_id));

create policy "tasks: members read"
  on public.tasks for select to authenticated
  using (private.is_member(organization_id));

create policy "tasks: members create as themselves"
  on public.tasks for insert to authenticated
  with check (private.is_member(organization_id) and creator_id = (select auth.uid()));

create policy "tasks: members update"
  on public.tasks for update to authenticated
  using (private.is_member(organization_id))
  with check (private.is_member(organization_id));

create policy "tasks: owners and admins delete"
  on public.tasks for delete to authenticated
  using (private.has_role(organization_id, array['OWNER', 'ADMIN']));

create policy "comments: members read"
  on public.comments for select to authenticated
  using (private.is_member(organization_id));

create policy "comments: members write as themselves"
  on public.comments for insert to authenticated
  with check (private.is_member(organization_id) and author_id = (select auth.uid()));

-- tests/rls/tenant_isolation.sql — run against a local Supabase stack (never production).
begin;
  -- Act as user A (a member of org A only).
  set local role authenticated;
  set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

  -- Must return 0: user A cannot see org B's tasks.
  select count(*) as leaked_rows
  from public.tasks
  where organization_id = '00000000-0000-0000-0000-0000000000b0';

  -- Must fail with an RLS violation: user A cannot write into org B.
  insert into public.tasks (id, organization_id, title, creator_id, updated_at)
  values (gen_random_uuid(), '00000000-0000-0000-0000-0000000000b0', 'should fail',
          '00000000-0000-0000-0000-00000000000a', now());
rollback;

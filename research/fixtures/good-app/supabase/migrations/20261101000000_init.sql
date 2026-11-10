-- Every table in public has RLS on. Policies name their role and compare with auth.uid().
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  age_status text not null,              -- the result of the age check, never the date of birth
  newsletter boolean not null default false
);
alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Anyone may join the waitlist; nobody can read it through the API.
create table public.waitlist (
  id bigint generated always as identity primary key,
  email text not null unique,
  consent_wording text not null,
  created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;
create policy "waitlist: anyone can join" on public.waitlist for insert to anon with check (true);

-- Server-only: RLS on and no policies, so only the service role reaches it.
create table public.consent_records (
  id bigint generated always as identity primary key,
  user_id uuid,
  purpose text not null,
  granted boolean not null,
  wording text not null,
  created_at timestamptz not null default now()
);
alter table public.consent_records enable row level security;

-- A function body with semicolons inside, to check the statement splitter.
create or replace function public.touch() returns trigger language plpgsql as $$
begin
  new.created_at := now();
  return new;
end;
$$;

insert into storage.buckets (id, name, public) values ('uploads', 'uploads', false);

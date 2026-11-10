create table public.profiles (
  id uuid primary key,
  email text,
  date_of_birth date,
  marketing_opt_in boolean not null default true
);

create table public.waitlist (id bigint primary key, email text);
alter table public.waitlist enable row level security;
create policy "admins read the waitlist" on public.waitlist
  for select to authenticated using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true);

-- Run in the SQL Editor of a NEW, independent Supabase project.
-- This schema contains no Plot Pals information and does not require the service_role key.
create table if not exists public.playthroughs (
  id uuid primary key,
  owner uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  version integer not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists playthroughs_owner_idx on public.playthroughs(owner);
alter table public.playthroughs enable row level security;
revoke all on public.playthroughs from anon;
grant select, insert, update, delete on public.playthroughs to authenticated;
create policy "read owned playthroughs" on public.playthroughs for select to authenticated using (owner = (select auth.uid()));
create policy "create owned playthroughs" on public.playthroughs for insert to authenticated with check (owner = (select auth.uid()));
create policy "update owned playthroughs" on public.playthroughs for update to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "delete owned playthroughs" on public.playthroughs for delete to authenticated using (owner = (select auth.uid()));

-- Compare-and-swap prevents a second device from silently overwriting newer data.
-- SECURITY INVOKER means row-level security continues to apply.
create or replace function public.save_playthrough(p_id uuid,p_expected_version integer,p_payload jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare saved_version integer;
begin
  update public.playthroughs
  set payload=p_payload, version=version+1, updated_at=now()
  where id=p_id and owner=(select auth.uid()) and version=p_expected_version
  returning version into saved_version;
  return coalesce(saved_version,-1);
end;
$$;
revoke all on function public.save_playthrough(uuid,integer,jsonb) from public, anon;
grant execute on function public.save_playthrough(uuid,integer,jsonb) to authenticated;

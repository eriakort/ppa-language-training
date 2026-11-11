-- Revision-based optimistic concurrency for automatic profile synchronization.
alter table public.profile_data
  add column if not exists revision bigint not null default 1;

create or replace function public.bump_profile_data_revision()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.revision := old.revision + 1;
  return new;
end;
$$;

drop trigger if exists profile_data_revision on public.profile_data;
create trigger profile_data_revision
before update on public.profile_data
for each row execute function public.bump_profile_data_revision();

revoke all on function public.bump_profile_data_revision() from public;

-- Revision-based optimistic concurrency for automatic profile synchronization.
alter table public.profile_data
  add column if not exists revision bigint not null default 1;

-- A revision is advanced by each successful conditional client update. Existing
-- manual backups remain compatible; automatic sync uses revision in its WHERE
-- clause so concurrent devices cannot silently overwrite each other.

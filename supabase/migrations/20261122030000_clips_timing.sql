-- Mirror of the migration already applied on the shared project (version 20261122030000).
-- Word-level timing cues for karaoke sync (seconds relative to clip start).
alter table public.clips
  add column if not exists timing jsonb;

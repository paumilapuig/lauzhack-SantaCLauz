-- A clip is "processed" once the student has picked its hard words at home (POST /api/clips/{id}/reviewed).
-- /api/home/review lists only clips with reviewed_at is null. Additive: no existing data changes.
alter table public.clips add column if not exists reviewed_at timestamptz null;

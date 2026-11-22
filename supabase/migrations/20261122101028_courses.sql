-- Additive: courses (a teacher's group of lessons, e.g. "Biologie 1re") and lessons.course_id. See docs/API.md.
-- Written and applied by Miquel (A) on the shared project as version 20261122101028.

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create index if not exists courses_teacher_id_idx on public.courses (teacher_id);

alter table public.courses enable row level security;

create policy "courses: teacher reads own"
  on public.courses for select
  to authenticated
  using (teacher_id = (select auth.uid()));

create policy "courses: teacher inserts own"
  on public.courses for insert
  to authenticated
  with check (teacher_id = (select auth.uid()) and (select public.is_teacher()));

create policy "courses: teacher updates own"
  on public.courses for update
  to authenticated
  using (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid()));

revoke all on table public.courses from anon, authenticated;
grant select, insert, update on table public.courses to authenticated;
grant all on table public.courses to service_role;

alter table public.lessons
  add column if not exists course_id uuid references public.courses (id) on delete set null;

create index if not exists lessons_course_id_idx on public.lessons (course_id);

-- Contract tables part 1 (see docs/API.md): profiles columns, helpers, lessons,
-- lesson_terms, word_mastery, practice_results.
-- The browser only reads; student-table writes go through the API (service_role).

alter table public.profiles
  add column if not exists role text not null default 'student'
    check (role in ('student', 'teacher')),
  add column if not exists l1 text not null default 'es',
  add column if not exists level text not null default 'A1'
    check (level in ('A1', 'A2', 'B1'));

-- The owner may change display_name, l1 and level, but never role.
revoke update on public.profiles from authenticated;
grant update (display_name, l1, level) on public.profiles to authenticated;

-- security definer avoids RLS recursion when policies on profiles call it.
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'teacher'
  );
$$;

revoke execute on function public.is_teacher() from public;
grant execute on function public.is_teacher() to authenticated, service_role;

create policy "profiles: teachers read all"
  on public.profiles for select
  to authenticated
  using ((select public.is_teacher()));

-- lessons
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  subject text,
  lesson_date date,
  source_text text,
  created_at timestamptz not null default now()
);

alter table public.lessons enable row level security;

create policy "lessons: all authenticated read"
  on public.lessons for select
  to authenticated
  using (true);

create policy "lessons: teacher inserts own"
  on public.lessons for insert
  to authenticated
  with check (teacher_id = (select auth.uid()) and (select public.is_teacher()));

create policy "lessons: teacher updates own"
  on public.lessons for update
  to authenticated
  using (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid()));

-- lesson_terms
create table if not exists public.lesson_terms (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  lemma text not null,
  forms text[] not null,
  translation_es text,
  definition_fr text,
  transparent boolean not null,
  key_phrase text,
  unique (lesson_id, lemma)
);

alter table public.lesson_terms enable row level security;

create policy "lesson_terms: all authenticated read"
  on public.lesson_terms for select
  to authenticated
  using (true);

create policy "lesson_terms: lesson teacher writes"
  on public.lesson_terms for all
  to authenticated
  using (exists (
    select 1 from public.lessons l
    where l.id = lesson_id and l.teacher_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.lessons l
    where l.id = lesson_id and l.teacher_id = (select auth.uid())
  ));

-- word_mastery
create table if not exists public.word_mastery (
  student_id uuid not null references public.profiles (id) on delete cascade,
  lemma text not null,
  level int not null check (level between 0 and 3),
  times_tapped int not null default 0,
  last_seen_at timestamptz,
  primary key (student_id, lemma)
);

alter table public.word_mastery enable row level security;

create policy "word_mastery: student reads own"
  on public.word_mastery for select
  to authenticated
  using (student_id = (select auth.uid()));

-- practice_results (clip_id FK to clips is added in the next part)
create table if not exists public.practice_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  lemma text not null,
  clip_id uuid,
  passed boolean not null,
  created_at timestamptz not null default now()
);

alter table public.practice_results enable row level security;

create policy "practice_results: student reads own"
  on public.practice_results for select
  to authenticated
  using (student_id = (select auth.uid()));

-- Grants: the project does not auto-grant new public tables to the API roles.
grant select on table
  public.lessons, public.lesson_terms, public.word_mastery, public.practice_results
  to authenticated;
grant insert, update on table public.lessons to authenticated;
grant insert, update, delete on table public.lesson_terms to authenticated;
grant all on table
  public.lessons, public.lesson_terms, public.word_mastery, public.practice_results
  to service_role;

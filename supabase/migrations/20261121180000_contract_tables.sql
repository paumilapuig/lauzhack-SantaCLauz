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

-- Contract tables part 2: class_sessions, class_events, clips, word_states_log, storage.

create table if not exists public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now()
);

create table if not exists public.class_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.class_sessions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  t_sec real not null,
  type text not null check (type in ('word', 'unclear', 'lost')),
  lemma text,
  created_at timestamptz not null default now()
);

create table if not exists public.clips (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.class_sessions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  t_start real not null,
  t_end real not null,
  transcript text,
  audio_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.word_states_log (
  session_id uuid not null references public.class_sessions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  lemma text not null,
  state text not null check (state in ('green', 'yellow', 'orange')),
  primary key (session_id, student_id, lemma)
);

create index if not exists class_sessions_lesson_id_idx on public.class_sessions (lesson_id);
create index if not exists class_sessions_student_id_idx on public.class_sessions (student_id);
create index if not exists class_events_session_id_idx on public.class_events (session_id);
create index if not exists clips_student_id_idx on public.clips (student_id);
create index if not exists practice_results_student_id_idx on public.practice_results (student_id);

alter table public.practice_results
  add constraint practice_results_clip_id_fkey
  foreign key (clip_id) references public.clips (id) on delete set null;

-- security definer avoids RLS recursion through class_sessions and lessons.
create or replace function public.is_session_teacher(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_sessions s
    join public.lessons l on l.id = s.lesson_id
    where s.id = p_session_id and l.teacher_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_session_teacher(uuid) from public;
grant execute on function public.is_session_teacher(uuid) to authenticated, service_role;

alter table public.class_sessions enable row level security;
alter table public.class_events enable row level security;
alter table public.clips enable row level security;
alter table public.word_states_log enable row level security;

create policy "class_sessions: student reads own"
  on public.class_sessions for select
  to authenticated
  using (student_id = (select auth.uid()));

create policy "class_sessions: lesson teacher reads"
  on public.class_sessions for select
  to authenticated
  using (exists (
    select 1 from public.lessons l
    where l.id = lesson_id and l.teacher_id = (select auth.uid())
  ));

create policy "class_events: student reads own"
  on public.class_events for select
  to authenticated
  using (student_id = (select auth.uid()));

create policy "class_events: lesson teacher reads"
  on public.class_events for select
  to authenticated
  using ((select public.is_session_teacher(session_id)));

create policy "clips: student reads own"
  on public.clips for select
  to authenticated
  using (student_id = (select auth.uid()));

create policy "clips: lesson teacher reads"
  on public.clips for select
  to authenticated
  using ((select public.is_session_teacher(session_id)));

create policy "word_states_log: student reads own"
  on public.word_states_log for select
  to authenticated
  using (student_id = (select auth.uid()));

create policy "word_states_log: lesson teacher reads"
  on public.word_states_log for select
  to authenticated
  using ((select public.is_session_teacher(session_id)));

grant select on table
  public.class_sessions, public.class_events, public.clips, public.word_states_log
  to authenticated;
grant all on table
  public.class_sessions, public.class_events, public.clips, public.word_states_log
  to service_role;

-- Private bucket; uploads go through the API (service_role), so no insert policy.
insert into storage.buckets (id, name, public)
values ('clips', 'clips', false)
on conflict (id) do nothing;

create policy "clips: student reads own folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'clips'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

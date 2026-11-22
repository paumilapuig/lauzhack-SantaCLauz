-- Additive (docs/API.md, PLAN › Decisions log Sat 21 23:00 and Sun 22 00:30):
-- text-only "lost" context, clip kinds, clip_marks, mark_level_changes, concept_gaps.
-- The browser only reads; every write goes through the API (service_role).

-- class_events: "Me he perdido" saves the last <= 60 s of transcript, no audio.
alter table public.class_events
  add column if not exists context_t_start real,
  add column if not exists context_transcript text
    check (char_length(context_transcript) <= 5000);

alter table public.class_events
  add constraint class_events_context_only_lost
  check (type = 'lost' or (context_t_start is null and context_transcript is null));

-- clips: always a lexical doubt ("No he entendido"); 'concept' stays in the check for old rows only.
alter table public.clips
  add column if not exists kind text not null default 'word'
    check (kind in ('word', 'concept')),
  add column if not exists lemma text;

-- clip_marks: words the student marks at home on a clip.
create table if not exists public.clip_marks (
  student_id uuid not null references public.profiles (id) on delete cascade,
  clip_id uuid not null references public.clips (id) on delete cascade,
  word text not null check (word <> '' and word = lower(word)),
  lemma text,
  created_at timestamptz not null default now(),
  primary key (student_id, clip_id, word)
);

create index if not exists clip_marks_clip_id_idx on public.clip_marks (clip_id);

-- mark_level_changes: the -1 applied by the first mark of a lemma in a session, so an undo reverts it exactly.
create table if not exists public.mark_level_changes (
  student_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid not null references public.class_sessions (id) on delete cascade,
  lemma text not null,
  level_delta int not null check (level_delta in (-1, 0)),
  created_at timestamptz not null default now(),
  primary key (student_id, session_id, lemma)
);

create index if not exists mark_level_changes_session_id_idx on public.mark_level_changes (session_id);

-- concept_gaps: what a student did not understand in a session ("Me he perdido"),
-- written by the single after-class LLM call of that session (app.lost_concepts.process_session).
create table if not exists public.concept_gaps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.class_sessions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  concept text not null check (concept <> '' and char_length(concept) <= 300),
  minutes int[] not null default '{}',
  lemmas text[] not null default '{}',
  explanation jsonb not null
    check (jsonb_typeof(explanation) = 'array' and jsonb_array_length(explanation) between 3 and 5),
  exercises jsonb not null
    check (jsonb_typeof(exercises) = 'array' and jsonb_array_length(exercises) between 2 and 3),
  status text not null default 'pending' check (status in ('pending', 'review', 'understood')),
  attempts int not null default 0 check (attempts >= 0),
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists concept_gaps_session_id_idx on public.concept_gaps (session_id);
create index if not exists concept_gaps_student_id_idx on public.concept_gaps (student_id);
create index if not exists concept_gaps_lesson_id_idx on public.concept_gaps (lesson_id);

alter table public.clip_marks enable row level security;
alter table public.mark_level_changes enable row level security;
alter table public.concept_gaps enable row level security;

create policy "clip_marks: student reads own"
  on public.clip_marks for select
  to authenticated
  using (student_id = (select auth.uid()));

create policy "clip_marks: lesson teacher reads"
  on public.clip_marks for select
  to authenticated
  using (exists (
    select 1 from public.clips c
    where c.id = clip_id and (select public.is_session_teacher(c.session_id))
  ));

create policy "mark_level_changes: student reads own"
  on public.mark_level_changes for select
  to authenticated
  using (student_id = (select auth.uid()));

-- No student read: the rows hold the exercise answers; the API serves them without "answer".
create policy "concept_gaps: lesson teacher reads"
  on public.concept_gaps for select
  to authenticated
  using (exists (
    select 1 from public.lessons l
    where l.id = lesson_id and l.teacher_id = (select auth.uid())
  ));

-- Grants: start from nothing, because a local stack auto-grants new tables to anon/authenticated.
revoke all on table
  public.clip_marks, public.mark_level_changes, public.concept_gaps
  from anon, authenticated;
grant select on table
  public.clip_marks, public.mark_level_changes, public.concept_gaps
  to authenticated;
grant all on table
  public.clip_marks, public.mark_level_changes, public.concept_gaps
  to service_role;

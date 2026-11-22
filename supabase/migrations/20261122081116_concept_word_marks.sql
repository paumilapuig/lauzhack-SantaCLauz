-- Additive: concept_word_marks (words a student taps inside a concept explanation at home). See docs/API.md.
-- Written by Laura (B) on Sunday morning, requested in docs/STATUS.md; applied on the shared project as version 20261122081116.

create table if not exists public.concept_word_marks (
  student_id uuid not null references public.profiles (id) on delete cascade,
  gap_id uuid not null references public.concept_gaps (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  word text not null,
  lemma text,
  translation_es text,
  key_phrase text not null default '',
  created_at timestamptz not null default now(),
  primary key (student_id, gap_id, word)
);

create index if not exists concept_word_marks_student_id_idx on public.concept_word_marks (student_id);

alter table public.concept_word_marks enable row level security;

create policy "concept_word_marks: student reads own"
  on public.concept_word_marks for select
  to authenticated
  using (student_id = (select auth.uid()));

create policy "concept_word_marks: lesson teacher reads"
  on public.concept_word_marks for select
  to authenticated
  using (
    exists (
      select 1
      from public.concept_gaps g
      where g.id = gap_id
        and (select public.is_session_teacher(g.session_id))
    )
  );

revoke all on table public.concept_word_marks from anon, authenticated;
grant select on table public.concept_word_marks to authenticated;
grant all on table public.concept_word_marks to service_role;

-- Additive: clip_marks (words marked at home on a clip). See docs/API.md.
-- Already applied on the shared project as version 20261122010000; this file mirrors it exactly.

create table if not exists public.clip_marks (
  student_id uuid not null references public.profiles (id) on delete cascade,
  clip_id uuid not null references public.clips (id) on delete cascade,
  word text not null,
  lemma text,
  created_at timestamptz not null default now(),
  primary key (student_id, clip_id, word)
);

create index if not exists clip_marks_student_id_idx on public.clip_marks (student_id);
create index if not exists clip_marks_clip_id_idx on public.clip_marks (clip_id);

alter table public.clip_marks enable row level security;

create policy "clip_marks: student reads own"
  on public.clip_marks for select
  to authenticated
  using (student_id = (select auth.uid()));

create policy "clip_marks: lesson teacher reads"
  on public.clip_marks for select
  to authenticated
  using (
    exists (
      select 1
      from public.clips c
      where c.id = clip_id
        and (select public.is_session_teacher(c.session_id))
    )
  );

revoke all on table public.clip_marks from anon, authenticated;
grant select on table public.clip_marks to authenticated;
grant all on table public.clip_marks to service_role;

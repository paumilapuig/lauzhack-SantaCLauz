-- Lost context, clip kinds, clip_marks, mark_level_changes, lesson_lost_summaries (docs/API.md).
begin;
select plan(30);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'teacher@example.com'),
  ('00000000-0000-0000-0000-0000000000a2', 'student@example.com');

insert into public.lessons (id, teacher_id, title)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'La respiration');

insert into public.class_sessions (id, lesson_id, student_id)
values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a2');

insert into public.clips (id, session_id, student_id, t_start, t_end)
values ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a2', 0, 12);

-- class_events: text-only context of a "lost" moment
select has_column('public', 'class_events', 'context_t_start', 'class_events.context_t_start exists');
select has_column('public', 'class_events', 'context_transcript', 'class_events.context_transcript exists');

select lives_ok(
  $$insert into public.class_events (session_id, student_id, t_sec, type, context_t_start, context_transcript)
    values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a2', 100, 'lost', 40, 'Elle produit des déchets.')$$,
  'a lost event stores its context');

select throws_ok(
  $$insert into public.class_events (session_id, student_id, t_sec, type, context_t_start, context_transcript)
    values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a2', 100, 'unclear', 40, 'x')$$,
  '23514', null, 'only lost events carry a context');

select throws_ok(
  format($$insert into public.class_events (session_id, student_id, t_sec, type, context_transcript)
    values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a2', 100, 'lost', %L)$$,
    repeat('a', 5001)),
  '23514', null, 'context_transcript is at most 5000 chars');

-- clips: kind + lemma
select has_column('public', 'clips', 'kind', 'clips.kind exists');
select has_column('public', 'clips', 'lemma', 'clips.lemma exists');
select col_default_is('public', 'clips', 'kind', 'concept', 'clips.kind defaults to concept');
select is(
  (select kind from public.clips where id = '00000000-0000-0000-0000-0000000000d1'),
  'concept', 'an existing clip becomes a concept clip');
select throws_ok(
  $$update public.clips set kind = 'other' where id = '00000000-0000-0000-0000-0000000000d1'$$,
  '23514', null, 'clips rejects unknown kind');

-- clip_marks
select has_table('public', 'clip_marks', 'clip_marks exists');
select col_is_pk('public', 'clip_marks', array['student_id', 'clip_id', 'word'],
  'clip_marks pk is (student_id, clip_id, word)');
select fk_ok('public', 'clip_marks', 'clip_id', 'public', 'clips', 'id',
  'clip_marks.clip_id references clips.id');
select throws_ok(
  $$insert into public.clip_marks (student_id, clip_id, word)
    values ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000d1', 'Déchets')$$,
  '23514', null, 'clip_marks.word must be lowercase');
select lives_ok(
  $$insert into public.clip_marks (student_id, clip_id, word, lemma)
    values ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000d1', 'déchets', 'déchet')$$,
  'a lowercase mark is stored');

-- mark_level_changes
select has_table('public', 'mark_level_changes', 'mark_level_changes exists');
select col_is_pk('public', 'mark_level_changes', array['student_id', 'session_id', 'lemma'],
  'mark_level_changes pk is (student_id, session_id, lemma)');
select throws_ok(
  $$insert into public.mark_level_changes (student_id, session_id, lemma, level_delta)
    values ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c1', 'déchet', 1)$$,
  '23514', null, 'level_delta is -1 or 0');

-- lesson_lost_summaries
select has_table('public', 'lesson_lost_summaries', 'lesson_lost_summaries exists');
select col_is_pk('public', 'lesson_lost_summaries', 'lesson_id', 'lesson_lost_summaries pk is lesson_id');
select throws_ok(
  $$insert into public.lesson_lost_summaries (lesson_id, lost_count, concepts)
    values ('00000000-0000-0000-0000-0000000000b1', 1, '{}'::jsonb)$$,
  '23514', null, 'concepts must be a json array');

-- deleting a session or a clip cleans up
delete from public.clips where id = '00000000-0000-0000-0000-0000000000d1';
select is((select count(*)::int from public.clip_marks), 0, 'deleting a clip deletes its marks');

-- RLS + grants: the browser only reads; writes go through the API (service_role)
select ok((select relrowsecurity from pg_class where oid = 'public.clip_marks'::regclass),
  'clip_marks has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.mark_level_changes'::regclass),
  'mark_level_changes has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.lesson_lost_summaries'::regclass),
  'lesson_lost_summaries has RLS enabled');
select ok(not has_table_privilege('authenticated', 'public.clip_marks', 'INSERT'),
  'authenticated cannot insert clip_marks');
select ok(not has_table_privilege('authenticated', 'public.mark_level_changes', 'INSERT'),
  'authenticated cannot insert mark_level_changes');
select ok(not has_table_privilege('authenticated', 'public.lesson_lost_summaries', 'INSERT'),
  'authenticated cannot insert lesson_lost_summaries');
select ok(not has_table_privilege('anon', 'public.lesson_lost_summaries', 'SELECT'),
  'anon cannot read lesson_lost_summaries');
select ok(
  exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lesson_lost_summaries'
      and policyname = 'lesson_lost_summaries: lesson teacher reads'),
  'policy "lesson_lost_summaries: lesson teacher reads" exists');

select * from finish();
rollback;

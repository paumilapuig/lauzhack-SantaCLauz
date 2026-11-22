-- Lost context, clip kinds, clip_marks, mark_level_changes, concept_gaps (docs/API.md).
begin;
select plan(32);

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
select col_default_is('public', 'clips', 'kind', 'word', 'clips.kind defaults to word');
select is(
  (select kind from public.clips where id = '00000000-0000-0000-0000-0000000000d1'),
  'word', 'a clip without kind is a word clip');
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

-- concept_gaps
select has_table('public', 'concept_gaps', 'concept_gaps exists');
select col_is_pk('public', 'concept_gaps', 'id', 'concept_gaps pk is id');
select lives_ok(
  $$insert into public.concept_gaps (session_id, student_id, lesson_id, concept, minutes, lemmas, explanation, exercises)
    values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000b1', 'La respiration', '{1}', '{}', '[{"fr":"a","es":"a","visual":"x"},{"fr":"b","es":"b","visual":"y"},{"fr":"c","es":"c","visual":"z"}]'::jsonb, '[{"question":"q","options":["a","b"],"answer":0},{"question":"r","options":["a","b"],"answer":1}]'::jsonb)$$,
  'a concept gap with 3 steps and 2 exercises is stored');
select throws_ok(
  $$insert into public.concept_gaps (session_id, student_id, lesson_id, concept, explanation, exercises)
    values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000b1', 'x', '[{"fr":"a","es":"a","visual":"x"}]'::jsonb, '[{"question":"q","options":["a","b"],"answer":0},{"question":"r","options":["a","b"],"answer":1}]'::jsonb)$$,
  '23514', null, 'explanation needs 3 to 5 steps');
select throws_ok(
  $$update public.concept_gaps set status = 'done'$$,
  '23514', null, 'concept_gaps rejects unknown status');

-- deleting a session or a clip cleans up
delete from public.clips where id = '00000000-0000-0000-0000-0000000000d1';
select is((select count(*)::int from public.clip_marks where clip_id = '00000000-0000-0000-0000-0000000000d1'), 0,
  'deleting a clip deletes its marks');

-- RLS + grants: the browser only reads; writes go through the API (service_role)
select ok((select relrowsecurity from pg_class where oid = 'public.clip_marks'::regclass),
  'clip_marks has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.mark_level_changes'::regclass),
  'mark_level_changes has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.concept_gaps'::regclass),
  'concept_gaps has RLS enabled');
select ok(not has_table_privilege('authenticated', 'public.clip_marks', 'INSERT'),
  'authenticated cannot insert clip_marks');
select ok(not has_table_privilege('authenticated', 'public.mark_level_changes', 'INSERT'),
  'authenticated cannot insert mark_level_changes');
select ok(not has_table_privilege('authenticated', 'public.concept_gaps', 'INSERT'),
  'authenticated cannot insert concept_gaps');
select ok(not has_table_privilege('anon', 'public.concept_gaps', 'SELECT'),
  'anon cannot read concept_gaps');
select ok(
  exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'concept_gaps'
      and policyname = 'concept_gaps: lesson teacher reads'),
  'policy "concept_gaps: lesson teacher reads" exists');

select * from finish();
rollback;

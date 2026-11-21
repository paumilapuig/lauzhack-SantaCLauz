begin;
select plan(17);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'teacher@example.com'),
  ('00000000-0000-0000-0000-0000000000a2', 'student@example.com');

insert into public.lessons (id, teacher_id, title)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'La respiration');

insert into public.class_sessions (id, lesson_id, student_id)
values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a2');

select has_table('public', 'class_sessions', 'class_sessions exists');
select has_table('public', 'class_events', 'class_events exists');
select has_table('public', 'clips', 'clips exists');
select has_table('public', 'word_states_log', 'word_states_log exists');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.class_sessions'::regclass),
  'class_sessions has RLS enabled');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.class_events'::regclass),
  'class_events has RLS enabled');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.clips'::regclass),
  'clips has RLS enabled');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.word_states_log'::regclass),
  'word_states_log has RLS enabled');

select throws_ok(
  $$insert into public.class_events (session_id, student_id, t_sec, type)
    values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a2', 1, 'other')$$,
  '23514', null, 'class_events rejects unknown type');

select throws_ok(
  $$insert into public.word_states_log (session_id, student_id, lemma, state)
    values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a2', 'déchet', 'red')$$,
  '23514', null, 'word_states_log rejects unknown state');

select col_is_pk('public', 'word_states_log', array['session_id', 'student_id', 'lemma'],
  'word_states_log pk is (session_id, student_id, lemma)');

select fk_ok('public', 'practice_results', 'clip_id', 'public', 'clips', 'id',
  'practice_results.clip_id references clips.id');

select ok(
  exists (select 1 from storage.buckets where id = 'clips' and public = false),
  'clips bucket exists and is private');

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'clips: student reads own folder'),
  'storage policy "clips: student reads own folder" exists');

select ok(
  not has_table_privilege('authenticated', 'public.clips', 'INSERT'),
  'authenticated cannot insert clips');

select ok(
  has_function_privilege('authenticated', 'public.is_session_teacher(uuid)', 'EXECUTE'),
  'authenticated can execute is_session_teacher');

select ok(
  public.is_session_teacher('00000000-0000-0000-0000-0000000000c1') is not null,
  'is_session_teacher returns a boolean');

select * from finish();
rollback;

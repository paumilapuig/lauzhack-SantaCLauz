begin;
select plan(18);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-0000000000a1', 'teacher@example.com');

insert into public.lessons (id, teacher_id, title)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'La respiration');

insert into public.lesson_terms (lesson_id, lemma, forms, transparent)
values ('00000000-0000-0000-0000-0000000000b1', 'déchet', array['déchet', 'déchets'], false);

select has_column('public', 'profiles', 'role', 'profiles.role exists');
select has_column('public', 'profiles', 'l1', 'profiles.l1 exists');
select has_column('public', 'profiles', 'level', 'profiles.level exists');

select col_default_is('public', 'profiles', 'role', 'student', 'role defaults to student');
select col_default_is('public', 'profiles', 'l1', 'es', 'l1 defaults to es');
select col_default_is('public', 'profiles', 'level', 'A1', 'level defaults to A1');

select has_table('public', 'lessons', 'lessons exists');
select has_table('public', 'lesson_terms', 'lesson_terms exists');
select has_table('public', 'word_mastery', 'word_mastery exists');
select has_table('public', 'practice_results', 'practice_results exists');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.lessons'::regclass),
  'lessons has RLS enabled');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.lesson_terms'::regclass),
  'lesson_terms has RLS enabled');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.word_mastery'::regclass),
  'word_mastery has RLS enabled');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.practice_results'::regclass),
  'practice_results has RLS enabled');

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE'),
  'authenticated cannot update profiles.role');
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'level', 'UPDATE'),
  'authenticated can update profiles.level');

select throws_ok(
  $$insert into public.word_mastery (student_id, lemma, level)
    values ('00000000-0000-0000-0000-0000000000a1', 'déchet', 4)$$,
  '23514', null, 'word_mastery rejects level 4');

select throws_ok(
  $$insert into public.lesson_terms (lesson_id, lemma, forms, transparent)
    values ('00000000-0000-0000-0000-0000000000b1', 'déchet', array['déchet'], false)$$,
  '23505', null, 'lesson_terms rejects duplicate (lesson_id, lemma)');

select * from finish();
rollback;

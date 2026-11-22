-- Asserts the ALREADY-SEEDED db after supabase/seed_demo_extra.sql (run it twice to prove idempotency).
begin;
select plan(6);

select is(
  (select count(*)::int from public.concept_gaps g join auth.users u on u.id = g.student_id
    where u.email = 'lucia-w4@demo.lauzhack'),
  2, 'lucia-w4 has 2 concept gaps');
select is(
  (select string_agg(status || ':' || attempts, ',' order by status) from public.concept_gaps g
     join auth.users u on u.id = g.student_id where u.email = 'lucia-w4@demo.lauzhack'),
  'review:1,understood:1', 'one gap understood, one to review after 1 attempt');
select is(
  (select count(*)::int from public.concept_gaps g join public.class_sessions s on s.id = g.session_id
    where g.student_id <> s.student_id or g.lesson_id <> s.lesson_id),
  0, 'every gap belongs to its session student and lesson');
select ok(
  (select bool_and(exists (select 1 from jsonb_array_elements(g.exercises) e
                            where (e ->> 'answer')::int < jsonb_array_length(e -> 'options')))
     from public.concept_gaps g),
  'every exercise answer points to an option');
select is(
  (select string_agg(distinct m.lemma, ',' order by m.lemma) from public.clip_marks m
     join auth.users u on u.id = m.student_id where u.email = 'lucia-w4@demo.lauzhack'),
  'chaleur,déchet', 'lucia-w4 marked déchet and chaleur at home (🟠)');
select is(
  (select count(*)::int from public.clip_marks m join auth.users u on u.id = m.student_id
    where u.email = 'lucia-w1@demo.lauzhack'),
  0, 'lucia-w1 has no home marks');

select * from finish();
rollback;

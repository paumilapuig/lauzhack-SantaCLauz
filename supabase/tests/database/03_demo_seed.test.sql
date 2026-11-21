-- Asserts the ALREADY-SEEDED local db (apply supabase/seed.sql first, twice to prove idempotency).
begin;
select plan(25);

-- Users, roles, lesson, terms
select is(
  (select count(*)::int from auth.users
    where id in ('de000000-0000-4000-8000-000000000001',
                 'de000000-0000-4000-8000-000000000002',
                 'de000000-0000-4000-8000-000000000003')),
  3, '3 demo auth users');
select is(
  (select count(*)::int from auth.identities
    where provider = 'email'
      and user_id in ('de000000-0000-4000-8000-000000000001',
                      'de000000-0000-4000-8000-000000000002',
                      'de000000-0000-4000-8000-000000000003')),
  3, '3 demo email identities');
select is(
  (select count(*)::int from auth.users
    where id in ('de000000-0000-4000-8000-000000000001',
                 'de000000-0000-4000-8000-000000000002',
                 'de000000-0000-4000-8000-000000000003')
      and encrypted_password = extensions.crypt('demo-local-only', encrypted_password)),
  3, 'all demo passwords match demo-local-only');
select is(
  (select role from public.profiles where id = 'de000000-0000-4000-8000-000000000001'),
  'teacher', 'prof-demo is a teacher');
select is(
  (select count(*)::int from public.profiles
    where id in ('de000000-0000-4000-8000-000000000002', 'de000000-0000-4000-8000-000000000003')
      and role = 'student'),
  2, 'both Lucias are students');
select is(
  (select count(*)::int from public.lessons where id = 'de100000-0000-4000-8000-000000000001'),
  1, 'demo lesson exists');
select is(
  (select count(*)::int from public.lesson_terms where lesson_id = 'de100000-0000-4000-8000-000000000001'),
  15, 'demo lesson has 15 terms');
select set_eq(
  $$select lemma from public.lesson_terms
    where lesson_id = 'de100000-0000-4000-8000-000000000001' and transparent$$,
  $$values ('respiration cellulaire'), ('cellule'), ('énergie'), ('glucose'),
           ('mitochondrie'), ('oxygène'), ('libérer'), ('dioxyde de carbone')$$,
  'the 8 transparent lemmas');
select results_eq(
  $$select forms, translation_es, transparent from public.lesson_terms
    where lesson_id = 'de100000-0000-4000-8000-000000000001' and lemma = 'déchet'$$,
  $$values (array['déchet', 'déchets'], 'desecho', false)$$,
  'déchet term has forms, translation and is not transparent');

-- Word mastery
select is(
  (select count(*)::int from public.word_mastery where student_id = 'de000000-0000-4000-8000-000000000002'),
  0, 'lucia-w1 has no mastery rows');
select results_eq(
  $$select lemma, level, times_tapped from public.word_mastery
    where student_id = 'de000000-0000-4000-8000-000000000003' order by lemma$$,
  $$values ('chaleur', 1, 3), ('déchet', 0, 4), ('dégager', 3, 0), ('essoufflé', 0, 0),
           ('fournir', 2, 0), ('nourriture', 3, 0), ('rejeter', 2, 0)$$,
  'lucia-w4 has the 7 mastery rows');

-- Sessions
select is(
  (select count(*)::int from public.class_sessions where student_id = 'de000000-0000-4000-8000-000000000002'),
  1, 'lucia-w1 has 1 session');
select is(
  (select count(*)::int from public.class_sessions where student_id = 'de000000-0000-4000-8000-000000000003'),
  4, 'lucia-w4 has 4 sessions');
select results_eq(
  $$select to_char(started_at, 'IYYY-"W"IW') from public.class_sessions
    where student_id = 'de000000-0000-4000-8000-000000000003' order by started_at$$,
  $$select to_char(now() - k * interval '1 week', 'IYYY-"W"IW')
    from generate_series(3, 0, -1) as k$$,
  'lucia-w4 sessions are the 4 weeks ending at the current week');

-- Autonomy = green share of word_states_log per session
select results_eq(
  $$select round(avg((state = 'green')::int), 2) from public.word_states_log wl
    join public.class_sessions cs on cs.id = wl.session_id
    where cs.student_id = 'de000000-0000-4000-8000-000000000003'
    group by cs.id, cs.started_at order by cs.started_at$$,
  $$values (0.53), (0.62), (0.71), (0.80)$$,
  'lucia-w4 autonomy goes 0.53, 0.62, 0.71, 0.80');
select results_eq(
  $$select round(avg((state = 'green')::int), 2) from public.word_states_log
    where student_id = 'de000000-0000-4000-8000-000000000002'$$,
  $$values (0.53)$$,
  'lucia-w1 autonomy is 0.53');
select is(
  (select count(*)::int from public.word_states_log
    where session_id in ('de300000-0000-4000-8000-000000000001',
                         'de300000-0000-4000-8000-000000000011',
                         'de300000-0000-4000-8000-000000000012',
                         'de300000-0000-4000-8000-000000000013',
                         'de300000-0000-4000-8000-000000000014')),
  72, '72 word_states_log rows (15+15+13+14+15)');
select is(
  (select state from public.word_states_log
    where session_id = 'de300000-0000-4000-8000-000000000014' and lemma = 'chaleur'),
  'orange', 'chaleur is orange in the latest w4 session');

-- Events
select results_eq(
  $$select (floor(t_sec / 60))::int, count(*)::int from public.class_events
    where type = 'lost'
      and session_id in (select id from public.class_sessions
                         where lesson_id = 'de100000-0000-4000-8000-000000000001')
    group by 1 order by 2 desc$$,
  $$values (12, 5), (3, 2)$$,
  'lost buckets: minute 12 x5, minute 3 x2');
select results_eq(
  $$select lemma, count(*)::int from public.class_events
    where type = 'word'
      and session_id in (select id from public.class_sessions
                         where lesson_id = 'de100000-0000-4000-8000-000000000001')
    group by lemma order by 2 desc$$,
  $$values ('déchet', 4), ('chaleur', 3)$$,
  'word taps: déchet x4, chaleur x3');
select is(
  (select count(*)::int from public.class_events e
    join public.class_sessions s on s.id = e.session_id
    where e.student_id <> s.student_id),
  0, 'every event belongs to its session student');
select is(
  (select count(*)::int from public.class_events where student_id = 'de000000-0000-4000-8000-000000000002'),
  0, 'lucia-w1 has no events');
select is(
  (select count(*)::int from public.class_events
    where session_id in (select id from public.class_sessions
                          where lesson_id = 'de100000-0000-4000-8000-000000000001')),
  14, '14 events in total');

-- Practice
select is(
  (select count(*) filter (where passed)::text || '/' || count(distinct lemma)::text
     from public.practice_results
    where student_id = 'de000000-0000-4000-8000-000000000003'
      and created_at >= date_trunc('week', now())
      and created_at < date_trunc('week', now()) + interval '1 week'),
  '12/12', '12 passed practice rows this ISO week on 12 distinct lemmas');
select is(
  (select count(*)::int from public.practice_results where student_id = 'de000000-0000-4000-8000-000000000003'),
  12, 'lucia-w4 has 12 practice rows in total');

select * from finish();
rollback;

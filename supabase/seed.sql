-- Local-only demo seed (API.md "Demo seed"). Applied on a LOCAL stack only, never on the shared project.
-- Demo login password for all three users: demo-local-only  (not a real secret; real one is in the private chat).
-- Pure SQL and idempotent: fixed ids + "on conflict do nothing"; users are inserted only if the email is absent.

-- ===== Part 1: users, identities, teacher role, lesson, terms =====

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', demo.id, 'authenticated', 'authenticated', demo.email,
  extensions.crypt('demo-local-only', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
  '', '', '', ''
from (values
  ('de000000-0000-4000-8000-000000000001'::uuid, 'prof-demo@demo.lauzhack'),
  ('de000000-0000-4000-8000-000000000002'::uuid, 'lucia-w1@demo.lauzhack'),
  ('de000000-0000-4000-8000-000000000003'::uuid, 'lucia-w4@demo.lauzhack')
) as demo (id, email)
where not exists (select 1 from auth.users existing where existing.email = demo.email)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider, provider_id, identity_data, created_at, updated_at)
select
  users.id, users.id, 'email', users.id::text,
  jsonb_build_object('sub', users.id::text, 'email', users.email, 'email_verified', true),
  now(), now()
from auth.users users
where users.id in (
  'de000000-0000-4000-8000-000000000001',
  'de000000-0000-4000-8000-000000000002',
  'de000000-0000-4000-8000-000000000003'
)
on conflict (provider_id, provider) do nothing;

-- Profiles are created by the handle_new_user trigger; only the teacher role is set here.
update public.profiles
set role = 'teacher'
where id = 'de000000-0000-4000-8000-000000000001';

insert into public.lessons (id, teacher_id, title, subject, lesson_date, source_text)
values (
  'de100000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000001',
  'La respiration cellulaire', 'Biologie', current_date, null
)
on conflict (id) do nothing;

insert into public.lesson_terms (id, lesson_id, lemma, forms, translation_es, definition_fr, transparent, key_phrase)
values
  ('de200000-0000-4000-8000-000000000001', 'de100000-0000-4000-8000-000000000001', 'respiration cellulaire', array['respiration cellulaire', 'respirations cellulaires'],
   'respiración celular', 'Façon dont la cellule utilise l''oxygène pour produire de l''énergie.',
   true, 'Aujourd''hui, on parle de la respiration cellulaire.'),
  ('de200000-0000-4000-8000-000000000002', 'de100000-0000-4000-8000-000000000001', 'cellule', array['cellule', 'cellules'],
   'célula', 'Plus petite partie vivante du corps.',
   true, 'Chaque cellule de notre corps a besoin d''énergie.'),
  ('de200000-0000-4000-8000-000000000003', 'de100000-0000-4000-8000-000000000001', 'énergie', array['énergie', 'énergies'],
   'energía', 'Ce qui permet au corps de bouger et de vivre.',
   true, 'Chaque cellule de notre corps a besoin d''énergie.'),
  ('de200000-0000-4000-8000-000000000004', 'de100000-0000-4000-8000-000000000001', 'nourriture', array['nourriture', 'nourritures'],
   'alimento', 'Ce que l''on mange.',
   false, 'Cette énergie vient de la nourriture, surtout du glucose.'),
  ('de200000-0000-4000-8000-000000000005', 'de100000-0000-4000-8000-000000000001', 'glucose', array['glucose'],
   'glucosa', 'Sucre qui donne de l''énergie aux cellules.',
   true, 'Cette énergie vient de la nourriture, surtout du glucose.'),
  ('de200000-0000-4000-8000-000000000006', 'de100000-0000-4000-8000-000000000001', 'mitochondrie', array['mitochondrie', 'mitochondries'],
   'mitocondria', 'Petite partie de la cellule qui fabrique l''énergie.',
   true, 'Dans la cellule, il y a de petites usines : les mitochondries.'),
  ('de200000-0000-4000-8000-000000000007', 'de100000-0000-4000-8000-000000000001', 'oxygène', array['oxygène'],
   'oxígeno', 'Gaz de l''air dont le corps a besoin pour vivre.',
   true, 'Les mitochondries utilisent l''oxygène pour transformer le glucose.'),
  ('de200000-0000-4000-8000-000000000008', 'de100000-0000-4000-8000-000000000001', 'libérer', array['libérer', 'libère', 'libèrent', 'libéré', 'libérée', 'libérés'],
   'liberar', 'Faire sortir, laisser partir.',
   true, 'Cette réaction va libérer de l''énergie pour nos muscles.'),
  ('de200000-0000-4000-8000-000000000009', 'de100000-0000-4000-8000-000000000001', 'déchet', array['déchet', 'déchets'],
   'desecho', 'Ce qui reste et ne sert plus.',
   false, 'Elle produit aussi des déchets : de l''eau et du dioxyde de carbone.'),
  ('de200000-0000-4000-8000-000000000010', 'de100000-0000-4000-8000-000000000001', 'dioxyde de carbone', array['dioxyde de carbone'],
   'dióxido de carbono', 'Gaz que l''on rejette quand on expire.',
   true, 'Elle produit aussi des déchets : de l''eau et du dioxyde de carbone.'),
  ('de200000-0000-4000-8000-000000000011', 'de100000-0000-4000-8000-000000000001', 'rejeter', array['rejeter', 'rejette', 'rejettent', 'rejetons', 'rejetez', 'rejeté', 'rejetés'],
   'expulsar', 'Faire sortir du corps.',
   false, 'Le sang transporte ces déchets jusqu''aux poumons, et nous les rejetons quand on expire.'),
  ('de200000-0000-4000-8000-000000000012', 'de100000-0000-4000-8000-000000000001', 'dégager', array['dégager', 'dégage', 'dégagent', 'dégagé', 'dégagée'],
   'desprender', 'Produire et laisser sortir (de la chaleur, un gaz).',
   false, 'Une partie de l''énergie se dégage sous forme de chaleur : c''est pour ça qu''on a chaud quand on court.'),
  ('de200000-0000-4000-8000-000000000013', 'de100000-0000-4000-8000-000000000001', 'chaleur', array['chaleur', 'chaleurs'],
   'calor', 'Ce qui rend chaud.',
   false, 'Une partie de l''énergie se dégage sous forme de chaleur : c''est pour ça qu''on a chaud quand on court.'),
  ('de200000-0000-4000-8000-000000000014', 'de100000-0000-4000-8000-000000000001', 'essoufflé', array['essoufflé', 'essoufflée', 'essoufflés', 'essoufflées'],
   'sin aliento', 'Qui respire vite et fort après un effort.',
   false, 'Quand on court vite, on est essoufflé, parce que les muscles demandent plus d''oxygène.'),
  ('de200000-0000-4000-8000-000000000015', 'de100000-0000-4000-8000-000000000001', 'fournir', array['fournir', 'fournit', 'fournissent', 'fourni', 'fournie'],
   'proporcionar', 'Donner ce qui est nécessaire.',
   false, 'Retenez bien : la respiration cellulaire fournit l''énergie à toutes nos cellules.')
on conflict do nothing;

-- ===== Part 2: sessions, word_states_log, events, word_mastery, practice_results =====

-- Sessions: w1 this week; w4 3/2/1 weeks ago and this week. All on the demo lesson.
insert into public.class_sessions (id, lesson_id, student_id, started_at)
select
  plan.id, 'de100000-0000-4000-8000-000000000001', plan.student_id,
  case when plan.weeks_ago = 0
    then greatest(date_trunc('week', now()), now() - interval '2 hours')
    else date_trunc('week', now()) - plan.weeks_ago * interval '1 week' + interval '2 days 9 hours'
  end
from (values
  ('de300000-0000-4000-8000-000000000001'::uuid, 'de000000-0000-4000-8000-000000000002'::uuid, 0),
  ('de300000-0000-4000-8000-000000000011'::uuid, 'de000000-0000-4000-8000-000000000003'::uuid, 3),
  ('de300000-0000-4000-8000-000000000012'::uuid, 'de000000-0000-4000-8000-000000000003'::uuid, 2),
  ('de300000-0000-4000-8000-000000000013'::uuid, 'de000000-0000-4000-8000-000000000003'::uuid, 1),
  ('de300000-0000-4000-8000-000000000014'::uuid, 'de000000-0000-4000-8000-000000000003'::uuid, 0)
) as plan (id, student_id, weeks_ago)
on conflict (id) do nothing;

-- word_states_log: green = transparent or extra green; orange as listed; otherwise yellow; absent lemmas have no row.
insert into public.word_states_log (session_id, student_id, lemma, state)
select
  plan.session_id, sessions.student_id, terms.lemma,
  case
    when terms.lemma = any (plan.orange) then 'orange'
    when terms.transparent or terms.lemma = any (plan.extra_green) then 'green'
    else 'yellow'
  end
from (values
  ('de300000-0000-4000-8000-000000000001'::uuid, array[]::text[], array[]::text[], array[]::text[]),
  ('de300000-0000-4000-8000-000000000011'::uuid, array[]::text[], array[]::text[], array[]::text[]),
  ('de300000-0000-4000-8000-000000000012'::uuid, array['essoufflé', 'fournir'], array[]::text[], array[]::text[]),
  ('de300000-0000-4000-8000-000000000013'::uuid, array['essoufflé'], array['nourriture', 'dégager'], array[]::text[]),
  ('de300000-0000-4000-8000-000000000014'::uuid, array[]::text[],
     array['nourriture', 'fournir', 'rejeter', 'dégager'], array['chaleur', 'déchet'])
) as plan (session_id, absent, extra_green, orange)
join public.class_sessions sessions on sessions.id = plan.session_id
join public.lesson_terms terms on terms.lesson_id = sessions.lesson_id
where not (terms.lemma = any (plan.absent))
on conflict do nothing;

-- Events (w4 sessions 11-13 only): student_id from the session, created_at = started_at + t_sec.
insert into public.class_events (id, session_id, student_id, t_sec, type, lemma, created_at)
select
  plan.id, sessions.id, sessions.student_id, plan.t_sec, plan.type, plan.lemma,
  sessions.started_at + plan.t_sec * interval '1 second'
from (values
  ('de400000-0000-4000-8000-000000000001'::uuid, 'de300000-0000-4000-8000-000000000011'::uuid, 722, 'lost', null),
  ('de400000-0000-4000-8000-000000000002'::uuid, 'de300000-0000-4000-8000-000000000011'::uuid, 735, 'lost', null),
  ('de400000-0000-4000-8000-000000000003'::uuid, 'de300000-0000-4000-8000-000000000011'::uuid, 190, 'lost', null),
  ('de400000-0000-4000-8000-000000000004'::uuid, 'de300000-0000-4000-8000-000000000011'::uuid, 300, 'word', 'déchet'),
  ('de400000-0000-4000-8000-000000000005'::uuid, 'de300000-0000-4000-8000-000000000011'::uuid, 745, 'word', 'déchet'),
  ('de400000-0000-4000-8000-000000000006'::uuid, 'de300000-0000-4000-8000-000000000011'::uuid, 610, 'word', 'chaleur'),
  ('de400000-0000-4000-8000-000000000007'::uuid, 'de300000-0000-4000-8000-000000000012'::uuid, 748, 'lost', null),
  ('de400000-0000-4000-8000-000000000008'::uuid, 'de300000-0000-4000-8000-000000000012'::uuid, 205, 'lost', null),
  ('de400000-0000-4000-8000-000000000009'::uuid, 'de300000-0000-4000-8000-000000000012'::uuid, 310, 'word', 'déchet'),
  ('de400000-0000-4000-8000-000000000010'::uuid, 'de300000-0000-4000-8000-000000000012'::uuid, 620, 'word', 'chaleur'),
  ('de400000-0000-4000-8000-000000000011'::uuid, 'de300000-0000-4000-8000-000000000013'::uuid, 760, 'lost', null),
  ('de400000-0000-4000-8000-000000000012'::uuid, 'de300000-0000-4000-8000-000000000013'::uuid, 771, 'lost', null),
  ('de400000-0000-4000-8000-000000000013'::uuid, 'de300000-0000-4000-8000-000000000013'::uuid, 320, 'word', 'déchet'),
  ('de400000-0000-4000-8000-000000000014'::uuid, 'de300000-0000-4000-8000-000000000013'::uuid, 630, 'word', 'chaleur')
) as plan (id, session_id, t_sec, type, lemma)
join public.class_sessions sessions on sessions.id = plan.session_id
on conflict (id) do nothing;

-- lucia-w4 word_mastery: times_tapped = number of seeded word events for the lemma.
insert into public.word_mastery (student_id, lemma, level, times_tapped, last_seen_at)
select 'de000000-0000-4000-8000-000000000003', mastery.lemma, mastery.level, mastery.times_tapped, latest.started_at
from (values
  ('nourriture', 3, 0), ('fournir', 2, 0), ('rejeter', 2, 0), ('dégager', 3, 0),
  ('chaleur', 1, 3), ('déchet', 0, 4), ('essoufflé', 0, 0)
) as mastery (lemma, level, times_tapped)
cross join (
  select started_at from public.class_sessions where id = 'de300000-0000-4000-8000-000000000014'
) as latest
on conflict (student_id, lemma) do nothing;

-- practice_results: 12 passed rows for lucia-w4, all inside the current ISO week.
insert into public.practice_results (id, student_id, lemma, clip_id, passed, created_at)
select
  ('de500000-0000-4000-8000-0000000000' || lpad(practice.n::text, 2, '0'))::uuid,
  'de000000-0000-4000-8000-000000000003', practice.lemma, null, true,
  greatest(date_trunc('week', now()), now() - practice.n * interval '10 minutes')
from (values
  (1, 'nourriture'), (2, 'fournir'), (3, 'rejeter'), (4, 'dégager'), (5, 'chaleur'), (6, 'poumon'),
  (7, 'sang'), (8, 'souffle'), (9, 'sueur'), (10, 'cœur'), (11, 'effort'), (12, 'vaisseau')
) as practice (n, lemma)
on conflict (id) do nothing;

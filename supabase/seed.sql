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

-- ===== Part 2 (T3) is appended below: sessions, word_states_log, events, word_mastery, practice_results =====

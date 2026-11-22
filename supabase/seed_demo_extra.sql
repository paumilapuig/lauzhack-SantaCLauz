-- Demo data for the two learning paths (docs/API.md › Demo seed). Idempotent; finds rows by email and
-- lesson title, so the same file runs on a local stack (after seed.sql) and on the shared project.
-- Adds, only when missing: lucia-w4's home marks on déchet/chaleur (🟠) and her 2 concept gaps.

-- lucia-w4: one word clip (no audio) on her first session of the demo lesson, with 2 home marks.
with w4 as (select id from auth.users where email = 'lucia-w4@demo.lauzhack'),
first_session as (
  select s.id, s.student_id, s.started_at
  from public.class_sessions s
  join public.lessons l on l.id = s.lesson_id and l.title = 'La respiration cellulaire'
  where s.student_id = (select id from w4)
  order by s.started_at
  limit 1
)
insert into public.clips (id, session_id, student_id, t_start, t_end, transcript, audio_path, kind, created_at)
select 'de600000-0000-4000-8000-000000000001', fs.id, fs.student_id, 300, 311,
       'Elle produit aussi des déchets : de l''eau et du dioxyde de carbone.', null, 'word',
       fs.started_at + interval '20 minutes'
from first_session fs
where not exists (select 1 from public.clip_marks m where m.student_id = fs.student_id)
on conflict (id) do nothing;

insert into public.clip_marks (student_id, clip_id, word, lemma, created_at)
select c.student_id, c.id, mark.word, mark.lemma, c.created_at + interval '1 day'
from public.clips c
cross join (values ('déchets', 'déchet'), ('chaleur', 'chaleur')) as mark (word, lemma)
where c.id = 'de600000-0000-4000-8000-000000000001'
on conflict do nothing;

-- lucia-w4: 2 concept gaps from her first session (lost moments at minutes 3 and 12).
with first_session as (
  select s.id, s.student_id, s.lesson_id, s.started_at
  from public.class_sessions s
  join public.lessons l on l.id = s.lesson_id and l.title = 'La respiration cellulaire'
  join auth.users u on u.id = s.student_id and u.email = 'lucia-w4@demo.lauzhack'
  order by s.started_at
  limit 1
)
insert into public.concept_gaps
  (session_id, student_id, lesson_id, concept, minutes, lemmas, explanation, exercises, status, attempts,
   answered_at, created_at)
select fs.id, fs.student_id, fs.lesson_id, gap.concept, gap.minutes, gap.lemmas, gap.explanation, gap.exercises,
       gap.status, 1, fs.started_at + interval '1 day', fs.started_at + interval '2 hours'
from first_session fs
cross join (values
  ('Comment la cellule fabrique de l''énergie', array[12], array['mitochondrie', 'oxygène', 'énergie'],
   '[{"fr": "La cellule reçoit du glucose et de l''oxygène.", "es": "La célula recibe glucosa y oxígeno.", "visual": "🍞 + 💨 → 🧫"},
     {"fr": "La mitochondrie transforme le glucose avec l''oxygène.", "es": "La mitocondria transforma la glucosa con el oxígeno.", "visual": "🧫 → ⚙️"},
     {"fr": "Elle libère de l''énergie pour les muscles.", "es": "Libera energía para los músculos.", "visual": "⚙️ → 🔋 → 💪"}]'::jsonb,
   '[{"question": "Que fabrique la mitochondrie ?", "options": ["de l''énergie", "du sucre", "de l''eau"], "answer": 0},
     {"question": "De quoi a besoin la mitochondrie ?", "options": ["de lumière", "d''oxygène", "de sel"], "answer": 1}]'::jsonb,
   'understood'),
  ('Pourquoi on a chaud pendant l''effort', array[3], array['chaleur', 'dégager'],
   '[{"fr": "Pendant l''effort, les muscles travaillent plus.", "es": "Durante el esfuerzo, los músculos trabajan más.", "visual": "🏃 → 💪"},
     {"fr": "Les cellules respirent plus et font plus d''énergie.", "es": "Las células respiran más y producen más energía.", "visual": "💪 → 🔋🔋"},
     {"fr": "Une partie de l''énergie devient de la chaleur.", "es": "Una parte de la energía se convierte en calor.", "visual": "🔋 → 🔥"}]'::jsonb,
   '[{"question": "Pendant l''effort, le corps dégage…", "options": ["du froid", "de la chaleur"], "answer": 1},
     {"question": "La chaleur vient…", "options": ["de l''énergie des cellules", "de l''eau", "du sang froid"], "answer": 0}]'::jsonb,
   'review')
) as gap (concept, minutes, lemmas, explanation, exercises, status)
where not exists (select 1 from public.concept_gaps g where g.student_id = fs.student_id and g.lesson_id = fs.lesson_id);

-- Spanish translation + simple French definition for marked words outside the glossary,
-- filled by one LLM call when the student presses Done on a clip (app/mark_translations.py). Additive.
alter table public.clip_marks add column if not exists translation_es text null;
alter table public.clip_marks add column if not exists definition_fr text null;

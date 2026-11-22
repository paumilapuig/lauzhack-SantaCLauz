export interface LessonSummary {
  id: string;
  title: string;
  subject: string;
  lesson_date: string;
}

export interface LessonTerm {
  lemma: string;
  forms: string[];
  translation_es: string;
  definition_fr: string;
  transparent: boolean;
  key_phrase: string | null;
}

export interface NewLessonFields {
  title: string;
  subject: string;
  lesson_date: string;
}

export interface CreateLessonResponse {
  lesson_id: string;
  terms: LessonTerm[];
}

export interface LostPeak {
  minute: number;
  count: number;
}

export type ConceptGapStatus = "pending" | "review" | "understood";

export interface ConceptGapRow {
  student: string;
  concept: string;
  minutes: number[];
  lemmas: string[];
  status: ConceptGapStatus;
  attempts: number;
}

export interface TopWord {
  lemma: string;
  taps: number;
}

export interface WeeklyAutonomy {
  week: string;
  autonomy: number;
}

export interface StudentAutonomy {
  name: string;
  autonomy: number | null;
  weekly: WeeklyAutonomy[];
}

export interface TeacherDashboard {
  lesson: { id: string; title: string };
  lost_peaks: LostPeak[];
  concept_gaps: ConceptGapRow[];
  top_words: TopWord[];
  students: StudentAutonomy[];
}

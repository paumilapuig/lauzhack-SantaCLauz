export interface LessonSummary {
  id: string;
  title: string;
  subject: string;
  lesson_date: string;
  /** null = not in a course */
  course_id: string | null;
}

/** A teacher's group of lessons, e.g. "Biologie 1re" */
export interface Course {
  id: string;
  name: string;
  lesson_count: number;
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
  course_id?: string;
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
  /** «Je n'ai pas compris» clips per minute of the lesson, most first */
  unclear_peaks: LostPeak[];
  concept_gaps: ConceptGapRow[];
  top_words: TopWord[];
  students: StudentAutonomy[];
}

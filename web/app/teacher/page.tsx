import { CreateLessonForm } from "./create-lesson-form";
import { LessonList } from "./lesson-list";

export default function TeacherPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-[34px] leading-tight font-bold tracking-[-0.02em] text-heading md:text-[44px]">My lessons</h1>
        <p className="max-w-[40em] text-[16px] text-label-secondary">
          Add a lesson before class: Loop&apos;d prepares its glossary. After class, open it to see where students got lost.
        </p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section aria-labelledby="lessons" className="flex flex-col gap-4">
          <h2 id="lessons" className="text-[12px] font-bold tracking-[0.06em] text-subtle uppercase">Lessons</h2>
          <LessonList />
        </section>
        <section aria-labelledby="new-lesson" className="flex flex-col gap-5 rounded-[24px] border border-border bg-card p-5 md:p-7">
          <h2 id="new-lesson" className="text-[22px] leading-tight font-bold tracking-[-0.01em] text-heading">New lesson</h2>
          <CreateLessonForm />
        </section>
      </div>
    </div>
  );
}

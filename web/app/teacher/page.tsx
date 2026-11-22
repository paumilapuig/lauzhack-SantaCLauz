import { CreateLessonForm } from "./create-lesson-form";
import { LessonList } from "./lesson-list";

export default function TeacherPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold">My lessons</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="new-lesson" className="flex flex-col gap-4">
          <h2 id="new-lesson" className="text-xl font-semibold">New lesson</h2>
          <CreateLessonForm />
        </section>
        <section aria-labelledby="lessons" className="flex flex-col gap-4">
          <h2 id="lessons" className="text-xl font-semibold">Lessons</h2>
          <LessonList />
        </section>
      </div>
    </div>
  );
}

import { CoursesHome } from "./courses-home";

export default function TeacherPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-[34px] leading-tight font-bold tracking-[-0.02em] text-heading md:text-[44px]">My courses</h1>
        <p className="max-w-[40em] text-[16px] text-label-secondary">
          One course per class you teach, e.g. Biologie 1re. Inside it, add a lesson before each class: Loop&apos;d prepares its glossary, and after class shows where students got lost.
        </p>
      </header>
      <CoursesHome />
    </div>
  );
}

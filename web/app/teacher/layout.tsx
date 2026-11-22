import { Suspense } from "react";
import { TeacherGate } from "./teacher-gate";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-[16px] text-label-secondary">
          Loading…
        </p>
      }
    >
      <TeacherGate>{children}</TeacherGate>
    </Suspense>
  );
}

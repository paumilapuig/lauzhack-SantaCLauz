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
        <p className="p-8 text-sm text-neutral-600">
          Loading…
        </p>
      }
    >
      <TeacherGate>{children}</TeacherGate>
    </Suspense>
  );
}

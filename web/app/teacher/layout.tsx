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
        <p lang="fr" className="p-8 text-sm text-neutral-600">
          Chargement…
        </p>
      }
    >
      <TeacherGate>{children}</TeacherGate>
    </Suspense>
  );
}

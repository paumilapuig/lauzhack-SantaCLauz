import { Suspense } from "react";
import { TeacherGate } from "./teacher-gate";
import { TeacherShell } from "./teacher-shell";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TeacherShell>
      <Suspense fallback={<p className="text-sm text-neutral-600">Chargement…</p>}>
        <TeacherGate>{children}</TeacherGate>
      </Suspense>
    </TeacherShell>
  );
}

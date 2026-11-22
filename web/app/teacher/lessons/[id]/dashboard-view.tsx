"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { teacherApi } from "../../teacher-api-client";
import type { TeacherDashboard } from "../../teacher-contract";
import { loadErrorFr } from "../../teacher-errors";
import { AutonomyCard } from "./autonomy-card";
import { InsightsCard } from "./insights-card";
import { insights } from "./insights";
import { NextClassCard } from "./next-class-card";
import { TopWordsCard } from "./top-words-card";

type ViewState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; dashboard: TeacherDashboard };

const BackLink = ({ label }: { label: string }) => (
  <Link href="/teacher" className="text-sm font-medium underline">
    {label}
  </Link>
);

function Dashboard({ dashboard }: { dashboard: TeacherDashboard }) {
  const sentences = insights(dashboard);
  return (
    <div className="flex flex-col gap-6">
      <BackLink label="← My lessons" />
      <h1 className="text-3xl font-semibold">{dashboard.lesson.title}</h1>
      {sentences.length > 0 && <InsightsCard sentences={sentences} />}
      {dashboard.students.length === 0 ? (
        <p className="text-base text-neutral-600">No student has taken this lesson yet.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {dashboard.students.map((student) => (
            <AutonomyCard key={student.name} student={student} />
          ))}
        </div>
      )}
      <NextClassCard lostPeaks={dashboard.lost_peaks} conceptGaps={dashboard.concept_gaps} />
      <TopWordsCard words={dashboard.top_words} />
    </div>
  );
}

export function DashboardView({ lessonId }: { lessonId: string }) {
  const [state, setState] = useState<ViewState>({ kind: "loading" });

  useEffect(() => {
    teacherApi
      .getDashboard(lessonId)
      .then((dashboard) => setState({ kind: "ready", dashboard }))
      .catch((error: unknown) => {
        const status = error instanceof ApiError ? error.status : 0;
        setState({ kind: "error", message: loadErrorFr(status) });
      });
  }, [lessonId]);

  if (state.kind === "loading") return <p className="text-base text-neutral-600">Loading…</p>;
  if (state.kind === "error") {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="text-base text-red-700">{state.message}</p>
        <BackLink label="Back to lessons" />
      </div>
    );
  }
  return <Dashboard dashboard={state.dashboard} />;
}

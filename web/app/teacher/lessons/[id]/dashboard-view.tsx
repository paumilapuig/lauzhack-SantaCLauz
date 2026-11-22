"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { teacherApi } from "../../teacher-api-client";
import type { TeacherDashboard } from "../../teacher-contract";
import { loadErrorFr } from "../../teacher-errors";
import { AutonomyCard } from "./autonomy-card";
import { ClassTimeline } from "./class-timeline";
import { ConceptsToRevisit } from "./concepts-to-revisit";
import { insights } from "./insights";
import { KeyPoints } from "./key-points";
import { TopWordsCard } from "./top-words-card";

type ViewState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; dashboard: TeacherDashboard };

const BackLink = () => (
  <Link href="/teacher" className="inline-flex w-fit items-center gap-1.5 rounded-full text-[15px] font-medium text-label-secondary hover:text-heading">
    <ArrowLeft aria-hidden className="size-4" /> My lessons
  </Link>
);

const total = (peaks: { count: number }[]) => peaks.reduce((sum, p) => sum + p.count, 0);

function Summary({ dashboard }: { dashboard: TeacherDashboard }) {
  const items = [
    [dashboard.students.length, "students"],
    [total(dashboard.lost_peaks), "«lost the thread»"],
    [total(dashboard.unclear_peaks ?? []), "words not understood"],
    [dashboard.concept_gaps.filter((g) => g.status !== "understood").length, "ideas to explain again"],
  ] as const;
  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map(([value, label]) => (
        <div key={label} className="flex flex-col gap-0.5 rounded-[16px] border border-border bg-card px-4 py-3">
          <dt className="order-2 text-[13px] text-label-secondary">{label}</dt>
          <dd className="text-[28px] leading-tight font-bold text-heading tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Dashboard({ dashboard }: { dashboard: TeacherDashboard }) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <BackLink />
        <p className="text-[12px] font-bold tracking-[0.06em] text-subtle uppercase">Lesson dashboard</p>
        <h1 lang="fr" className="text-[34px] leading-tight font-bold tracking-[-0.02em] text-heading md:text-[44px]">{dashboard.lesson.title}</h1>
      </header>
      <Summary dashboard={dashboard} />
      <KeyPoints sentences={insights(dashboard)} />
      <ClassTimeline lost={dashboard.lost_peaks} unclear={dashboard.unclear_peaks ?? []} gaps={dashboard.concept_gaps} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ConceptsToRevisit gaps={dashboard.concept_gaps} />
        <TopWordsCard words={dashboard.top_words} />
      </div>
      <section aria-labelledby="autonomy-title" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[12px] font-bold tracking-[0.06em] text-subtle uppercase">Autonomy</p>
          <h2 id="autonomy-title" className="text-[22px] leading-tight font-bold tracking-[-0.01em] text-heading">
            How much each student follows without help
          </h2>
        </div>
        {dashboard.students.length === 0 ? (
          <p className="text-[15px] text-label-secondary">No student has taken this lesson yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboard.students.map((student) => (
              <AutonomyCard key={student.name} student={student} />
            ))}
          </div>
        )}
      </section>
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

  if (state.kind === "loading") return <p className="text-[17px] text-label-secondary">Loading…</p>;
  if (state.kind === "error") {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="text-[17px] text-destructive">{state.message}</p>
        <BackLink />
      </div>
    );
  }
  return <Dashboard dashboard={state.dashboard} />;
}

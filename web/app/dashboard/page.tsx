import { Suspense } from "react";
import { DashboardRouter } from "./dashboard-router";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted-foreground">Loading…</p>}>
      <DashboardRouter />
    </Suspense>
  );
}

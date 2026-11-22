import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentAutonomy, WeeklyAutonomy } from "../../teacher-contract";
import { formatAutonomy, sparklinePoints } from "./dashboard-format";

const SPARK_WIDTH = 160;
const SPARK_HEIGHT = 48;

function trendLabel(weekly: WeeklyAutonomy[]): string {
  const first = formatAutonomy(weekly[0].autonomy);
  const last = formatAutonomy(weekly[weekly.length - 1].autonomy);
  return `Évolution : ${first} → ${last}`;
}

function Sparkline({ weekly }: { weekly: WeeklyAutonomy[] }) {
  const points = sparklinePoints(weekly, SPARK_WIDTH, SPARK_HEIGHT);
  if (points === "") return null;
  return (
    <div className="flex flex-col gap-1">
      <svg
        viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
        role="img"
        aria-label={trendLabel(weekly)}
        className="h-12 w-40 overflow-visible text-primary"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-sm text-muted-foreground">
        {weekly[0].week} → {weekly[weekly.length - 1].week}
      </p>
    </div>
  );
}

export function AutonomyCard({ student }: { student: StudentAutonomy }) {
  const figure = formatAutonomy(student.autonomy);
  return (
    <Card>
      <CardHeader>
        <p className="text-base text-muted-foreground">Autonomie</p>
        <CardTitle className="text-xl">{student.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end justify-between gap-4">
        {figure === null ? (
          <p className="text-base text-muted-foreground">
            pas encore de séance terminée
          </p>
        ) : (
          <p className="text-4xl font-bold">{figure}</p>
        )}
        <Sparkline weekly={student.weekly} />
      </CardContent>
    </Card>
  );
}

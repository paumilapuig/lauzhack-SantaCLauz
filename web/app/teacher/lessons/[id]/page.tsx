import { DashboardView } from "./dashboard-view";

export default async function LessonDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DashboardView lessonId={id} />;
}

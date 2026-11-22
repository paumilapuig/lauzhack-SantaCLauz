import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { LessonSummary } from "@/lib/contract";
import { createClient } from "@/lib/supabase/server";
import { ApiStatus } from "./api-status";
import { StudentHub } from "./student-hub";

/** After login: teachers go to /teacher, students pick a lesson and open /class. */
export async function DashboardRouter() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (profile?.role === "teacher") redirect("/teacher");

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, subject, lesson_date")
    .order("lesson_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return <StudentHub email={data.user.email ?? ""} lessons={(lessons ?? []) as LessonSummary[]} status={<ApiStatus />} />;
}

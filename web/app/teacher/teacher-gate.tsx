import { redirect } from "next/navigation";
import { connection } from "next/server";
import { apiMode } from "@/lib/apiMode";
import { createClient } from "@/lib/supabase/server";
import { TeacherShell } from "./teacher-shell";

export async function TeacherGate({ children }: { children: React.ReactNode }) {
  await connection();
  if (apiMode() !== "http") return <TeacherShell demo>{children}</TeacherShell>; // demo data only, no login
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "teacher") redirect("/home");

  return <TeacherShell>{children}</TeacherShell>;
}

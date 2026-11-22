import { createClient } from "@/lib/supabase/client";
import { createTeacherApi } from "./teacherApi";

async function getAccessToken(): Promise<string | null> {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ?? null;
}

export const teacherApi = createTeacherApi(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  getAccessToken,
);

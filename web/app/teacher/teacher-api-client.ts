import { apiMode } from "@/lib/apiMode";
import { createClient } from "@/lib/supabase/client";
import { createFakeTeacherApi } from "./fakeTeacherApi";
import { createTeacherApi } from "./teacherApi";

async function getAccessToken(): Promise<string | null> {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ?? null;
}

/** Real API when NEXT_PUBLIC_CLASS_API=http, otherwise the demo lesson in the browser. */
export const teacherApi =
  apiMode() === "http"
    ? createTeacherApi(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000", getAccessToken)
    : createFakeTeacherApi();

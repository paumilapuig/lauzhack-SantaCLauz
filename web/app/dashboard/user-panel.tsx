import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ApiStatus } from "./api-status";

export async function UserPanel() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <>
      <p>
        Signed in as <span data-testid="user-email" className="font-medium">{data.user.email}</span>
      </p>
      <ApiStatus />
      <form action="/auth/signout" method="post">
        <Button type="submit" variant="outline">Sign out</Button>
      </form>
    </>
  );
}

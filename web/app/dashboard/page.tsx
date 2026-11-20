import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPanel } from "./user-panel";

export default function DashboardPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading session…</p>}>
            <UserPanel />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

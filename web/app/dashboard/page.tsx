import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPanel } from "./user-panel";

export default function DashboardPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-md flex-col gap-8">
        <p className="flex items-center gap-2 text-xl font-bold tracking-[-0.025em] text-foreground">
          <span aria-hidden className="size-3 rounded-full bg-brand-orange" />
          Loop&apos;d
        </p>
        <Card className="w-full shadow-none">
          <CardHeader>
            <CardTitle>Panel</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando sesión…</p>}>
              <UserPanel />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

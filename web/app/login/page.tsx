import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <p className="flex items-center justify-center gap-2 text-xl font-bold tracking-[-0.025em] text-foreground">
          <span aria-hidden className="size-3 rounded-full bg-brand-orange" />
          Loop&apos;d
        </p>
        <Card className="w-full shadow-none">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Email y contraseña, o un enlace mágico.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

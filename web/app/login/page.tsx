import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoMark } from "@/components/logo";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <p className="flex flex-col items-center gap-3 text-foreground">
          <LogoMark className="h-10" />
          <span className="text-[24px] font-bold tracking-[-0.025em]">Loop&apos;d</span>
        </p>
        <Card className="w-full shadow-none">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Email and password, or a magic link.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

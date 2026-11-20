"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type AuthError = { message: string } | null;

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function withBusy(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  function failed(error: AuthError): boolean {
    if (error) toast.error(error.message);
    return error !== null;
  }

  function goToDashboard() {
    router.push("/dashboard");
    router.refresh();
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await withBusy(async () => {
      const { error } = await createClient().auth.signInWithPassword({ email, password });
      if (!failed(error)) goToDashboard();
    });
  }

  async function signUp() {
    await withBusy(async () => {
      const { data, error } = await createClient().auth.signUp({ email, password });
      if (failed(error)) return;
      if (data.session) goToDashboard();
      else toast.success("Check your email to confirm your account.");
    });
  }

  async function sendMagicLink() {
    await withBusy(async () => {
      const { error } = await createClient().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (!failed(error)) toast.success("Magic link sent. Check your email.");
    });
  }

  return (
    <form onSubmit={signIn} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" minLength={6} autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={busy}>Sign in</Button>
      <Button type="button" variant="outline" disabled={busy} onClick={signUp}>Sign up</Button>
      <Button type="button" variant="ghost" disabled={busy || !email} onClick={sendMagicLink}>
        Email me a magic link
      </Button>
    </form>
  );
}

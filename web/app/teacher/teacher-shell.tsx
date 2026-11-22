import Link from "next/link";

export function TeacherShell({ children }: { children: React.ReactNode }) {
  return (
    <div lang="fr" className="min-h-screen bg-[#fbf6ea] text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold">Espace enseignant</span>
            <Link href="/teacher" className="text-sm underline-offset-4 hover:underline">
              Mes leçons
            </Link>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm hover:bg-white">
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}

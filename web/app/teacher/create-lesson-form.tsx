"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateLessonFile } from "./lesson-file";
import { teacherApi } from "./teacher-api-client";
import { createLessonErrorFr } from "./teacher-errors";

type SourceMode = "text" | "file";

const todayIso = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const TEXTAREA_CLASS =
  "min-h-40 w-full rounded-lg border border-input bg-card px-4 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

function TextField({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name} className="text-base">{label}</Label>
      <Input id={name} name={name} type={type} required defaultValue={type === "date" ? todayIso() : undefined} />
    </div>
  );
}

export function CreateLessonForm() {
  const router = useRouter();
  const [mode, setMode] = useState<SourceMode>("text");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0] ?? null;
    setFile(chosen);
    setFileError(chosen ? validateLessonFile(chosen) : null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fields = {
      title: String(data.get("title")),
      subject: String(data.get("subject")),
      lesson_date: String(data.get("lesson_date")),
    };
    setSubmitError(null);
    setPending(true);
    try {
      const created =
        mode === "file" && file
          ? await teacherApi.createLessonFromFile(fields, file)
          : await teacherApi.createLessonFromText(fields, String(data.get("source_text")));
      router.push(`/teacher/lessons/${created.lesson_id}`);
    } catch (err) {
      setSubmitError(createLessonErrorFr(err instanceof ApiError ? err.status : 0));
      setPending(false);
    }
  }

  const blocked = pending || (mode === "file" && (!file || fileError !== null));

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <TextField name="title" label="Titre" />
      <TextField name="subject" label="Matière" />
      <TextField name="lesson_date" label="Date" type="date" />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-base font-medium">Source de la leçon</legend>
        <div className="flex flex-wrap gap-6">
          <Label className="text-base">
            <input type="radio" name="mode" checked={mode === "text"} onChange={() => setMode("text")} />
            Coller le texte
          </Label>
          <Label className="text-base">
            <input type="radio" name="mode" checked={mode === "file"} onChange={() => setMode("file")} />
            Envoyer un fichier
          </Label>
        </div>
        {mode === "text" ? (
          <textarea name="source_text" required aria-label="Texte de la leçon" className={TEXTAREA_CLASS} />
        ) : (
          <input
            type="file"
            name="file"
            required
            aria-label="Fichier de la leçon"
            accept=".txt,.pdf,.png,.jpg,.jpeg"
            onChange={onFileChange}
            className="text-base"
          />
        )}
        {fileError && mode === "file" ? <p role="alert" className="text-base text-destructive">{fileError}</p> : null}
      </fieldset>

      {submitError ? <p role="alert" className="text-base text-destructive">{submitError}</p> : null}
      <p aria-live="polite" className="text-base text-muted-foreground">
        {pending ? "Préparation du glossaire… (quelques secondes)" : ""}
      </p>
      <Button type="submit" disabled={blocked} className="self-start">Créer la leçon</Button>
    </form>
  );
}
